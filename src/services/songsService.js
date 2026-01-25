// Songs service for interacting with self-hosted API
import { getAuthHeader } from './authService';
import { API_BASE_URL } from '../config/api';
import { httpRequest, httpGet, httpPost, httpPut, httpDelete } from '../utils/http';

const SONGS_API = `${API_BASE_URL}/songs`;

// Helper function to convert backend snake_case to frontend camelCase
const normalizeSong = (song) => {
  if (!song) return null;

  return {
    id: song.id,
    title: song.title,
    lyrics: song.content || song.lyrics, // Backend uses 'content', frontend uses 'lyrics'
    content: song.content || song.lyrics,
    filename: song.filename,
    wordCount: song.word_count || song.wordCount || 0,
    lineCount: song.line_count || song.lineCount || 0,
    dateAdded: song.date_added || song.dateAdded || new Date().toISOString(),
    dateModified: song.date_modified || song.dateModified,
    isExample: song.isExample || song.is_example || false,
    // Audio fields
    audioFileUrl: song.audio_file_url || song.audioFileUrl || null,
    audioFileName: song.audio_file_name || song.audioFileName || null,
    audioFileSize: song.audio_file_size || song.audioFileSize || null,
    audioDuration: song.audio_duration || song.audioDuration || null,
    // Drafts
    drafts: song.drafts || []
  };
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.message || error.error || `Request failed with status ${response.status}`);
  }
  return response.json();
};

// Get all songs for the authenticated user
export const getSongs = async () => {
  const authHeaders = await getAuthHeader();

  const response = await httpGet(SONGS_API, {
    'Content-Type': 'application/json',
    ...authHeaders
  });

  const data = await handleResponse(response);
  // Normalize songs from snake_case to camelCase
  return {
    ...data,
    songs: (data.songs || []).map(normalizeSong)
  };
};

// Save/update multiple songs - now creates them individually
export const saveSongs = async (songs) => {
  const authHeaders = await getAuthHeader();

  // Create songs one by one
  const results = await Promise.allSettled(
    songs.map(song =>
      httpPost(SONGS_API, {
        title: song.title,
        content: song.content,
        filename: song.filename
      }, {
        'Content-Type': 'application/json',
        ...authHeaders
      }).then(handleResponse)
    )
  );

  const successful = results.filter(r => r.status === 'fulfilled').map(r => normalizeSong(r.value.song));
  const failed = results.filter(r => r.status === 'rejected');

  return {
    songs: successful,
    successCount: successful.length,
    failureCount: failed.length
  };
};

// Clear all songs for the authenticated user
export const clearAllSongs = async () => {
  const authHeaders = await getAuthHeader();

  const response = await httpDelete(SONGS_API, {
    'Content-Type': 'application/json',
    ...authHeaders
  });

  return handleResponse(response);
};

// Get a specific song by ID (includes content)
export const getSong = async (songId) => {
  const authHeaders = await getAuthHeader();

  const response = await httpGet(`${SONGS_API}/${songId}`, {
    'Content-Type': 'application/json',
    ...authHeaders
  });

  const data = await handleResponse(response);
  return normalizeSong(data.song); // Extract and normalize song from response
};

// Create a new song (songId is now ignored, server generates it)
export const createSong = async (songId, songData) => {
  const authHeaders = await getAuthHeader();

  // Build payload with all fields (backend expects camelCase)
  const payload = {
    title: songData.title,
    content: songData.content,
    filename: songData.filename
  };

  // Include audio metadata if present
  if (songData.audioFileUrl) {
    payload.audioFileUrl = songData.audioFileUrl;
    payload.audioFileName = songData.audioFileName;
    payload.audioFileSize = songData.audioFileSize;
    payload.audioDuration = songData.audioDuration;
  }

  const response = await httpPost(SONGS_API, payload, {
    'Content-Type': 'application/json',
    ...authHeaders
  });

  const data = await handleResponse(response);
  return normalizeSong(data.song); // Return the created song with normalized fields
};

// Update a specific song
export const updateSong = async (songId, songData) => {
  const authHeaders = await getAuthHeader();

  const response = await httpPut(`${SONGS_API}/${songId}`, songData, {
    'Content-Type': 'application/json',
    ...authHeaders
  });

  const data = await handleResponse(response);
  return normalizeSong(data.song); // Return the updated song with normalized fields
};

// Delete a specific song
export const deleteSong = async (songId) => {
  const authHeaders = await getAuthHeader();

  const response = await httpDelete(`${SONGS_API}/${songId}`, {
    'Content-Type': 'application/json',
    ...authHeaders
  });

  return handleResponse(response);
};

// Upload a single song file
export const uploadSong = async (file, title = null) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const content = e.target.result;
        const filename = file.name;
        const songTitle = title || filename.replace(/\.(txt|lyrics)$/i, '');

        const songData = {
          title: songTitle,
          content: content,
          filename: filename
        };

        // Create song (server generates ID)
        const result = await createSong(null, songData);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
};

// Upload multiple song files
export const uploadSongs = async (files) => {
  const uploadPromises = Array.from(files).map(file => uploadSong(file));
  const results = await Promise.allSettled(uploadPromises);

  const successful = results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);

  const failed = results
    .filter(result => result.status === 'rejected')
    .map(result => result.reason.message);

  return {
    successful,
    failed,
    totalCount: files.length,
    successCount: successful.length,
    failureCount: failed.length
  };
};

// Export song content as text file
export const exportSong = async (songId, filename = null) => {
  try {
    const songData = await getSong(songId);
    const content = songData.content;
    const exportFilename = filename || songData.filename || `${songData.title}.txt`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = exportFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true, filename: exportFilename };
  } catch (error) {
    throw new Error(`Failed to export song: ${error.message}`);
  }
};

// Search songs by content or title (use server endpoint if available)
export const searchSongs = async (query) => {
  try {
    const authHeaders = await getAuthHeader();

    // Use server-side search endpoint
    const response = await httpGet(`${SONGS_API}/search/query?q=${encodeURIComponent(query)}`, {
      'Content-Type': 'application/json',
      ...authHeaders
    });

    const data = await handleResponse(response);
    return (data.songs || []).map(normalizeSong);
  } catch (error) {
    // Fallback to client-side search
    console.warn('Server search failed, using client-side search:', error);

    const { songs } = await getSongs();

    if (!query.trim()) {
      return songs; // Already normalized from getSongs()
    }

    const searchTerm = query.toLowerCase();
    const filteredSongs = [];

    // Search through metadata first (faster)
    for (const song of songs) {
      if (song.title.toLowerCase().includes(searchTerm)) {
        filteredSongs.push(song);
        continue;
      }

      // For content search, we'd need to fetch the actual content
      try {
        const fullSong = await getSong(song.id);
        if (fullSong.content.toLowerCase().includes(searchTerm)) {
          filteredSongs.push(song);
        }
      } catch (error) {
        console.warn(`Failed to search content of song ${song.id}:`, error);
      }
    }

    return filteredSongs; // Already normalized
  }
};

// Load example song for users with no songs
export const getExampleSong = async () => {
  try {
    const response = await httpRequest('/A GOOD DAY.txt', { method: 'GET' });
    if (!response.ok) {
      throw new Error('Failed to load example song');
    }
    const content = await response.text();

    const exampleSong = {
      id: 'example-a-good-day',
      title: 'A GOOD DAY',
      lyrics: content,           // Frontend expects lyrics field
      content: content,          // Backend uses content field
      filename: 'A GOOD DAY.txt',
      word_count: content.split(/\s+/).filter(word => word.trim()).length,
      line_count: content.split('\n').filter(line => line.trim()).length,
      date_added: new Date().toISOString(),
      isExample: true,
      // Audio metadata
      audio_file_url: '/A GOOD DAY.mp3',
      audio_file_name: 'A GOOD DAY.mp3',
      audio_file_size: 7296521,
      audio_duration: 182
    };

    // Normalize to camelCase
    return normalizeSong(exampleSong);
  } catch (error) {
    console.error('Failed to load example song:', error);
    return null;
  }
};

// Check if example song was deleted by user
const isExampleSongDeleted = () => {
  try {
    const stored = localStorage.getItem('lyricsExampleDeleted');
    return stored ? JSON.parse(stored) : false;
  } catch (error) {
    console.error('Error checking example deletion state:', error);
    return false;
  }
};

// Get songs with example song for new users
export const getSongsWithExample = async (isAuthenticated = true) => {
  // If user deleted the example song, don't show it
  if (isExampleSongDeleted()) {
    if (isAuthenticated) {
      try {
        return await getSongs();
      } catch (error) {
        console.error('Error loading authenticated songs:', error);
        return { songs: [] };
      }
    } else {
      return { songs: [] };
    }
  }

  let userSongs = [];

  // Try to get user songs if authenticated
  if (isAuthenticated) {
    try {
      const result = await getSongs();
      userSongs = result.songs || [];
    } catch (error) {
      console.error('Error loading user songs:', error);
      // Don't throw error, fall through to show example song
    }
  }

  // If user has songs, return them without example
  if (userSongs.length > 0) {
    return { songs: userSongs };
  }

  // If no user songs, show example song
  const exampleSong = await getExampleSong();
  if (exampleSong) {
    return { songs: [exampleSong] };
  }

  // Fallback to empty if can't load example
  return { songs: [] };
};

const songsService = {
  getSongs,
  getSongsWithExample,
  getExampleSong,
  saveSongs,
  clearAllSongs,
  getSong,
  createSong,
  updateSong,
  deleteSong,
  uploadSong,
  uploadSongs,
  exportSong,
  searchSongs
};

export default songsService;
