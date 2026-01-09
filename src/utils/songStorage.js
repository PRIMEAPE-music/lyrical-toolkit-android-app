/**
 * Local Storage Implementation for Songs
 * All data is stored in browser localStorage
 */

const SONGS_STORAGE_KEY = 'lyricToolkit_songs';
const EXAMPLE_DELETED_KEY = 'lyricsExampleDeleted';

// Save user songs to localStorage
export const saveUserSongs = async (songs) => {
  try {
    const userSongs = songs.filter(song => !song.isExample);

    // Store songs in localStorage
    localStorage.setItem(SONGS_STORAGE_KEY, JSON.stringify(userSongs));

    console.log('✅ Saved', userSongs.length, 'songs to localStorage');
    return true;
  } catch (error) {
    console.error('❌ Error saving songs to localStorage:', error);
    throw error;
  }
};

// Save example song deletion state (local storage)
export const saveExampleSongDeleted = (deleted) => {
  try {
    localStorage.setItem(EXAMPLE_DELETED_KEY, JSON.stringify(deleted));
  } catch (error) {
    console.error('Error saving example deletion state:', error);
  }
};

// Load example song deletion state (local storage)
export const loadExampleSongDeleted = () => {
  try {
    const stored = localStorage.getItem(EXAMPLE_DELETED_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading example deletion state:', error);
  }
  return false;
};

// Load example song for users with no songs
export const loadExampleSong = async () => {
  try {
    const response = await fetch('/A GOOD DAY.txt');
    if (!response.ok) {
      throw new Error('Failed to load example song');
    }
    const content = await response.text();

    return {
      id: 'example-a-good-day',
      title: 'A GOOD DAY',
      lyrics: content,
      content: content,
      filename: 'A GOOD DAY.txt',
      wordCount: content.split(/\s+/).filter(word => word.trim()).length,
      lineCount: content.split('\n').filter(line => line.trim()).length,
      dateAdded: new Date().toISOString(),
      isExample: true,
      drafts: [],
      // Audio metadata
      audioFileUrl: '/A GOOD DAY.mp3',
      audioFileName: 'A GOOD DAY.mp3',
      audioFileSize: 7296521,
      audioDuration: 182
    };
  } catch (error) {
    console.error('Failed to load example song:', error);
    return null;
  }
};

// Check if user should see example song
const shouldShowExampleSong = (userSongsCount = 0) => {
  const isDeleted = loadExampleSongDeleted();

  // If user has no songs, always show example regardless of deletion state
  if (userSongsCount === 0) {
    return true;
  }

  // If user has songs, respect their deletion preference
  return !isDeleted;
};

// Load user songs from localStorage
export const loadUserSongs = async (includeExample = true) => {
  let userSongs = [];

  try {
    console.log('🔍 Loading user songs from localStorage');

    const storedSongs = localStorage.getItem(SONGS_STORAGE_KEY);

    if (storedSongs) {
      const parsed = JSON.parse(storedSongs);
      console.log('📦 Found', parsed.length, 'songs in localStorage');

      userSongs = parsed.map(song => ({
        id: song.id,
        title: song.title || 'Untitled Song',
        lyrics: song.lyrics || song.content || '',
        content: song.content || song.lyrics || '',
        filename: song.filename || `${song.title || 'Untitled Song'}.txt`,
        wordCount: song.wordCount || 0,
        lineCount: song.lineCount || 0,
        dateAdded: song.dateAdded || new Date().toISOString(),
        dateModified: song.dateModified,
        drafts: song.drafts || [],
        // Audio metadata
        audioFileUrl: song.audioFileUrl || null,
        audioFileName: song.audioFileName || null,
        audioFileSize: song.audioFileSize || null,
        audioDuration: song.audioDuration || null
      }));

      console.log('✅ Loaded', userSongs.length, 'songs from localStorage');
    } else {
      console.log('📭 No songs found in localStorage');
    }
  } catch (error) {
    console.error('❌ Error loading songs from localStorage:', error);
  }

  // If user has their own songs, return them without example
  if (userSongs.length > 0) {
    return userSongs;
  }

  // If no user songs and example is requested, check if we should show example
  if (includeExample && shouldShowExampleSong(userSongs.length)) {
    const exampleSong = await loadExampleSong();
    if (exampleSong) {
      return [exampleSong];
    }
  }

  return [];
};

// Load songs for unauthenticated users (example song only)
export const loadSongsForUnauthenticated = async () => {
  // For unauthenticated users, always show example song
  const exampleSong = await loadExampleSong();
  return exampleSong ? [exampleSong] : [];
};

// Universal song loading function
export const loadAllSongs = async (isAuthenticated = false) => {
  // Since we're localStorage-only now, authentication doesn't matter
  // Just load songs with example fallback
  return await loadUserSongs(true);
};

// Clear all user songs from localStorage
export const clearUserSongs = async () => {
  try {
    localStorage.removeItem(SONGS_STORAGE_KEY);
    console.log('✅ Cleared all songs from localStorage');
  } catch (error) {
    console.error('Error clearing songs from localStorage:', error);
  }
};
