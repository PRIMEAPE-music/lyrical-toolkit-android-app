/**
 * useSongManager Hook
 *
 * Manages all song-related state and operations including:
 * - Loading/saving songs from localStorage or database
 * - Storage type switching (local vs database)
 * - Song CRUD operations (delete, deleteAll)
 * - Song transfer between storage types
 * - Auto-save functionality
 *
 * @module hooks/useSongManager
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  saveUserSongs,
  clearUserSongs,
  saveExampleSongDeleted,
  loadAllSongs
} from '../utils/songStorage';
import audioStorageService from '../services/audioStorageService';
import {
  deleteSong as deleteSongFromServer,
  updateSong as updateSongOnServer,
  createSong as createSongOnServer,
  clearAllSongs as clearAllSongsOnServer,
  saveSongs as saveSongsToServer
} from '../services/songsService';

/**
 * @typedef {Object} Song
 * @property {string|number} id - Unique identifier
 * @property {string} title - Song title
 * @property {string} lyrics - Song lyrics/content
 * @property {string} content - Alias for lyrics (backend compatibility)
 * @property {string} filename - Original filename
 * @property {number} wordCount - Number of words
 * @property {number} lineCount - Number of lines
 * @property {string} dateAdded - ISO date string
 * @property {string} [dateModified] - ISO date string
 * @property {boolean} [isExample] - Whether this is the example song
 * @property {Array} [drafts] - Array of draft versions
 * @property {string} [audioFileUrl] - URL to audio file
 * @property {string} [audioFileName] - Name of audio file
 * @property {number} [audioFileSize] - Size of audio file in bytes
 * @property {number} [audioDuration] - Duration in seconds
 */

/**
 * @typedef {Object} SongManagerReturn
 * @property {Song[]} songs - Array of all songs
 * @property {function} setSongs - State setter for songs
 * @property {string} storageType - Current storage type ('local' or 'database')
 * @property {boolean} userSongsLoaded - Whether songs have been loaded
 * @property {function} deleteSong - Delete a single song
 * @property {function} deleteAllSongs - Delete all songs
 * @property {function} handleStorageTypeChange - Switch storage type
 * @property {function} handleTransferSong - Transfer song between storage types
 * @property {function} saveSongsToStorage - Save songs to current storage
 * @property {function} saveAndReloadSongs - Save and reload songs
 */

/**
 * Custom hook for managing song state and operations
 *
 * @param {Object} options - Hook options
 * @param {boolean} options.isAuthenticated - Whether user is authenticated
 * @param {Object} [options.user] - Current user object
 * @returns {SongManagerReturn} Song manager state and functions
 */
const useSongManager = ({ isAuthenticated, user }) => {
  // Core state
  const [songs, setSongs] = useState([]);
  const [storageType, setStorageType] = useState('local');
  const [userSongsLoaded, setUserSongsLoaded] = useState(false);

  // Refs to prevent race conditions and infinite loops
  const isReloadingRef = useRef(false);
  const isSwitchingStorageRef = useRef(false);

  /**
   * Save songs to the appropriate storage without reloading
   * @param {Song[]} songsToSave - Songs to save
   */
  const saveSongsToStorage = useCallback(async (songsToSave) => {
    try {
      if (storageType === 'database' && isAuthenticated) {
        // For database mode, update each changed song individually
        console.log('💾 Saving songs to database...');
        for (const song of songsToSave) {
          if (song.isExample) continue; // Skip example songs
          try {
            await updateSongOnServer(song.id, {
              title: song.title,
              content: song.lyrics || song.content,
              filename: song.filename,
              drafts: song.drafts || [],
              audioFileUrl: song.audioFileUrl || null,
              audioFileName: song.audioFileName || null,
              audioFileSize: song.audioFileSize || null,
              audioDuration: song.audioDuration || null
            });
          } catch (err) {
            console.warn(`Failed to update song ${song.id} on server:`, err.message);
          }
        }
        console.log('✅ Songs saved to database');
      } else {
        // Save to local storage
        await saveUserSongs(songsToSave);
        console.log('✅ Songs saved to localStorage');
      }
    } catch (error) {
      console.error('❌ Failed to save songs:', error);
    }
  }, [storageType, isAuthenticated]);

  /**
   * Save songs and reload from storage
   * @param {Song[]} [songsToSave] - Songs to save (defaults to current songs)
   */
  const saveAndReloadSongs = useCallback(async (songsToSave = null) => {
    try {
      const actualSongs = songsToSave || songs;
      console.log('💾 Saving', actualSongs.length, 'songs to', storageType, '...');

      if (storageType === 'database' && isAuthenticated) {
        await saveSongsToServer(actualSongs);
        console.log('✅ Songs saved to database, reloading...');
      } else {
        await saveUserSongs(actualSongs);
        console.log('✅ Songs saved to localStorage, reloading...');
      }

      // Reload from appropriate storage
      const allSongs = await loadAllSongs(isAuthenticated, storageType);
      setSongs(allSongs);
      console.log('✅ Reloaded', allSongs.length, 'songs from', storageType);
    } catch (error) {
      console.error('❌ Failed to save/reload songs:', error);
    }
  }, [songs, storageType, isAuthenticated]);

  /**
   * Handle storage type change (local <-> database)
   * @param {string} newStorageType - Target storage type
   */
  const handleStorageTypeChange = useCallback(async (newStorageType) => {
    // Prevent rapid switching
    if (isSwitchingStorageRef.current) {
      console.log('⏸️ Storage switch already in progress, ignoring...');
      return;
    }

    if (newStorageType === 'database' && !isAuthenticated) {
      alert('Please log in to use database storage');
      return;
    }

    if (newStorageType === storageType) {
      console.log('⏭️ Already on', storageType, 'storage');
      return;
    }

    // Lock switching until songs are loaded
    isSwitchingStorageRef.current = true;
    console.log('🔄 Switching storage type from', storageType, 'to', newStorageType);
    setStorageType(newStorageType);
    // Lock will be released in the useEffect after songs load
  }, [storageType, isAuthenticated]);

  /**
   * Transfer a song between storage types
   * @param {Song} song - Song to transfer
   */
  const handleTransferSong = useCallback(async (song) => {
    const targetStorage = storageType === 'local' ? 'database' : 'local';

    if (targetStorage === 'database' && !isAuthenticated) {
      alert('Please log in to transfer songs to the database');
      return;
    }

    const confirmMessage = `Transfer "${song.title}" to ${targetStorage === 'database' ? 'Database (Cloud)' : 'Local Storage'}?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      console.log(`🔄 Transferring song "${song.title}" from ${storageType} to ${targetStorage}`);

      if (targetStorage === 'database') {
        // Transfer to database
        let audioData = null;

        if (song.audioFileUrl) {
          // Check if it's already a Supabase URL
          if (song.audioFileUrl.startsWith('https://') && song.audioFileUrl.includes('supabase.co')) {
            console.log('♻️ Song already has database audio URL, reusing it');
            audioData = {
              audioFileUrl: song.audioFileUrl,
              audioFileName: song.audioFileName,
              audioFileSize: song.audioFileSize,
              audioDuration: song.audioDuration
            };
          }
          // If it's an IndexedDB URL, upload to Supabase
          else if (song.audioFileUrl.startsWith('indexeddb://')) {
            try {
              console.log('📤 Song has local audio, uploading to database storage...');
              const audioId = song.audioFileUrl.replace('indexeddb://', '');
              const audioIndexedDB = await import('../utils/audioIndexedDB');
              const audioFile = await audioIndexedDB.getAudioFile(audioId);

              if (audioFile) {
                const data = audioFile.arrayBuffer || audioFile.file;
                const blob = new Blob([data], { type: audioFile.type || 'audio/mpeg' });
                const file = new File([blob], audioFile.filename || song.audioFileName || 'audio.mp3', {
                  type: audioFile.type || 'audio/mpeg'
                });

                const result = await audioStorageService.uploadAudioFile(
                  file,
                  song.id,
                  user?.userId || 'anonymous',
                  'database'
                );

                audioData = {
                  audioFileUrl: result.audioUrl,
                  audioFileName: result.filename,
                  audioFileSize: result.size,
                  audioDuration: result.duration
                };
                console.log('✅ Audio file uploaded to database:', audioData);
              }
            } catch (audioError) {
              console.error('❌ Could not transfer audio file:', audioError);
            }
          }
        }

        const songDataToSave = {
          title: song.title,
          content: song.lyrics || song.content,
          filename: song.filename,
          ...(audioData || {
            audioFileUrl: song.audioFileUrl,
            audioFileName: song.audioFileName,
            audioFileSize: song.audioFileSize,
            audioDuration: song.audioDuration
          })
        };

        await createSongOnServer(null, songDataToSave);
        console.log('✅ Song saved to database');
      } else {
        // Transfer to local storage
        console.log('📥 Transferring song to local storage...');
        const songStorageModule = await import('../utils/songStorage');
        const currentLocalSongs = await songStorageModule.loadUserSongs(false);
        const newSongId = Date.now() + Math.random();

        // Download database audio to IndexedDB if needed
        let localAudioData = {};
        if (song.audioFileUrl && !song.audioFileUrl.startsWith('indexeddb://')) {
          try {
            console.log('📥 Downloading audio file from database to local storage...');
            const response = await fetch(song.audioFileUrl);
            if (!response.ok) throw new Error(`Failed to download audio: ${response.statusText}`);

            const audioBlob = await response.blob();
            const audioFile = new File(
              [audioBlob],
              song.audioFileName || 'audio.mp3',
              { type: audioBlob.type || 'audio/mpeg' }
            );

            const audioIndexedDB = await import('../utils/audioIndexedDB');
            await audioIndexedDB.storeAudioFile(newSongId, audioFile);

            localAudioData = {
              audioFileUrl: `indexeddb://${newSongId}`,
              audioFileName: song.audioFileName,
              audioFileSize: song.audioFileSize,
              audioDuration: song.audioDuration
            };
            console.log('✅ Audio file downloaded and stored in IndexedDB');
          } catch (audioError) {
            console.error('❌ Could not download audio file:', audioError);
          }
        }

        const newSong = {
          ...song,
          id: newSongId,
          dateAdded: new Date().toISOString(),
          ...localAudioData
        };

        await saveUserSongs([...currentLocalSongs, newSong]);
        console.log('✅ Song saved to localStorage');
      }

      alert(`✅ Song "${song.title}" copied to ${targetStorage === 'database' ? 'Database' : 'Local Storage'}!\n\nNote: The original remains in ${storageType}. Switch tabs to see the copy, or delete the original if you want to move it completely.`);
    } catch (error) {
      console.error('❌ Failed to transfer song:', error);
      alert(`Failed to transfer song: ${error.message}`);
    }
  }, [storageType, isAuthenticated, user]);

  /**
   * Delete a single song
   * @param {string|number} songId - ID of song to delete
   */
  const deleteSong = useCallback(async (songId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this song? This cannot be undone.');
    if (!confirmDelete) return;

    const originalSongs = [...songs];

    try {
      const songToDelete = songs.find(song => song.id === songId);
      if (songToDelete && songToDelete.isExample) {
        saveExampleSongDeleted(true);
      }

      // Optimistically remove from UI
      const updatedSongs = songs.filter(song => song.id !== songId);
      setSongs(updatedSongs);

      // Delete associated audio from IndexedDB if exists
      if (songToDelete && songToDelete.audioFileUrl && songToDelete.audioFileUrl.startsWith('indexeddb://')) {
        try {
          console.log('🗑️ Deleting associated audio file from IndexedDB...');
          await audioStorageService.deleteAudioFile(songId);
          console.log('✅ Audio file deleted from IndexedDB');
        } catch (audioError) {
          console.warn('⚠️ Could not delete audio file:', audioError);
        }
      }

      // Delete from appropriate storage
      if (storageType === 'database' && isAuthenticated) {
        console.log('🗑️ Deleting song from database with ID:', songId);
        await deleteSongFromServer(songId);
        console.log('✅ Song deleted from database');
      } else {
        console.log('💾 Saving songs to localStorage after delete...');
        await saveUserSongs(updatedSongs);
        console.log('✅ Songs saved to localStorage');
      }
    } catch (error) {
      console.error('❌ Error deleting song:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      alert(`Failed to delete song: ${errorMessage}\n\nThe song has been restored.`);

      // Rollback
      setSongs(originalSongs);

      // Reload to ensure sync
      try {
        const allSongs = await loadAllSongs(isAuthenticated, storageType);
        setSongs(allSongs);
      } catch (reloadError) {
        console.error('Failed to reload songs after delete error:', reloadError);
      }
    }
  }, [songs, storageType, isAuthenticated]);

  /**
   * Delete all songs
   */
  const deleteAllSongs = useCallback(async () => {
    if (!window.confirm('Are you sure you want to delete ALL songs? This cannot be undone.')) {
      return;
    }

    try {
      setSongs([]);

      // Clear all audio files from IndexedDB
      try {
        await audioStorageService.clearAllAudioFiles();
        console.log('✅ Audio files cleared from IndexedDB');
      } catch (audioError) {
        console.warn('⚠️ Could not clear audio files:', audioError);
      }

      // Clear from appropriate storage
      if (storageType === 'database' && isAuthenticated) {
        await clearAllSongsOnServer();
        console.log('✅ Songs cleared from database');
      } else {
        await clearUserSongs();
        console.log('✅ Songs cleared from localStorage');
      }

      saveExampleSongDeleted(false); // Reset so example can load again
    } catch (error) {
      console.error('❌ Error deleting all songs:', error);
      alert('Failed to delete all songs. Please try again.');
    }
  }, [storageType, isAuthenticated]);

  // Load songs when authentication state or storage type changes
  useEffect(() => {
    const loadSongs = async () => {
      try {
        isReloadingRef.current = true;
        console.log('🔄 Loading songs, authenticated:', isAuthenticated, 'storageType:', storageType);
        const allSongs = await loadAllSongs(isAuthenticated, storageType);
        setSongs(allSongs);
        setUserSongsLoaded(true);
        console.log('✅ Loaded', allSongs.length, 'songs from', storageType);
      } catch (error) {
        console.error('Failed to load songs:', error);
      } finally {
        // Allow auto-save again after a brief delay
        setTimeout(() => {
          isReloadingRef.current = false;
          isSwitchingStorageRef.current = false;
        }, 500);
      }
    };

    loadSongs();
  }, [isAuthenticated, storageType]);

  // Auto-save songs to localStorage when they change (ONLY for local storage mode)
  useEffect(() => {
    // Only auto-save to localStorage when in local storage mode
    if (storageType !== 'local') {
      console.log('⏭️ Skipping auto-save: not in local storage mode');
      return;
    }

    // Skip auto-save during loading/switching or if no songs
    if (songs.length === 0 || isReloadingRef.current || isSwitchingStorageRef.current) {
      return;
    }

    // Skip if only example song exists
    const userSongs = songs.filter(s => !s.isExample);
    if (userSongs.length === 0) {
      return;
    }

    const debounceTime = 2000;

    const timeoutId = setTimeout(async () => {
      // Double-check we're not switching storage
      if (isSwitchingStorageRef.current) {
        console.log('⏭️ Skipping auto-save: storage switching in progress');
        return;
      }
      try {
        console.log('💾 Auto-saving songs to localStorage...');
        await saveSongsToStorage(songs);
        console.log('✅ Auto-save complete');
      } catch (error) {
        console.error('❌ Auto-save failed:', error);
      }
    }, debounceTime);

    return () => clearTimeout(timeoutId);
  }, [songs, storageType, saveSongsToStorage]);

  return {
    // State
    songs,
    setSongs,
    storageType,
    userSongsLoaded,

    // Refs (exposed for external use if needed)
    isReloadingRef,
    isSwitchingStorageRef,

    // Functions
    deleteSong,
    deleteAllSongs,
    handleStorageTypeChange,
    handleTransferSong,
    saveSongsToStorage,
    saveAndReloadSongs
  };
};

export default useSongManager;
