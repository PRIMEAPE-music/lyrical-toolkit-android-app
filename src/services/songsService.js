// Songs service for interacting with self-hosted API
import { getAuthHeader } from './authService';
import { API_BASE_URL } from '../config/api';

const SONGS_API = `${API_BASE_URL}/songs`;

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

  const response = await fetch(SONGS_API, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders
    }
  });

  return handleResponse(response);
};

// Save/update multiple songs - now creates them individually
export const saveSongs = async (songs) => {
  const authHeaders = await getAuthHeader();

  // Create songs one by one
  const results = await Promise.allSettled(
    songs.map(song =>
      fetch(SONGS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify({
          title: song.title,
          content: song.content,
          filename: song.filename
        })
      }).then(handleResponse)
    )
  );

  const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value.song);
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

  const response = await fetch(SONGS_API, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders
    }
  });

  return handleResponse(response);
};

// Get a specific song by ID (includes content)
export const getSong = async (songId) => {
  const authHeaders = await getAuthHeader();

  const response = await fetch(`${SONGS_API}/${songId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders
    }
  });

  const data = await handleResponse(response);
  return data.song; // Extract song from response
};

// Create a new song (songId is now ignored, server generates it)
export const createSong = async (songId, songData) => {
  const authHeaders = await getAuthHeader();

  const response = await fetch(SONGS_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders
    },
    body: JSON.stringify({
      title: songData.title,
      content: songData.content,
      filename: songData.filename
    })
  });

  const data = await handleResponse(response);
  return data.song; // Return the created song
};

// Update a specific song
export const updateSong = async (songId, songData) => {
  const authHeaders = await getAuthHeader();

  const response = await fetch(`${SONGS_API}/${songId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders
    },
    body: JSON.stringify(songData)
  });

  const data = await handleResponse(response);
  return data.song; // Return the updated song
};

// Delete a specific song
export const deleteSong = async (songId) => {
  const authHeaders = await getAuthHeader();

  const response = await fetch(`${SONGS_API}/${songId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders
    }
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
    const response = await fetch(`${SONGS_API}/search/query?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      }
    });

    const data = await handleResponse(response);
    return data.songs;
  } catch (error) {
    // Fallback to client-side search
    console.warn('Server search failed, using client-side search:', error);

    const { songs } = await getSongs();

    if (!query.trim()) {
      return songs;
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

    return filteredSongs;
  }
};

// Load example song for users with no songs
export const getExampleSong = async () => {
  try {
    const response = await fetch('/A GOOD DAY.txt');
    if (!response.ok) {
      throw new Error('Failed to load example song');
    }
    const content = await response.text();

    return {
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
