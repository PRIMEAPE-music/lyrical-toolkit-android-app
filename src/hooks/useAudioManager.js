/**
 * useAudioManager Hook
 *
 * Manages all audio-related state and operations including:
 * - Audio file upload with verification
 * - Audio file download
 * - Audio file removal
 * - File picker triggering
 * - Audio player expansion state
 *
 * @module hooks/useAudioManager
 */

import { useState, useRef, useCallback } from 'react';
import audioStorageService from '../services/audioStorageService';

/**
 * @typedef {Object} AudioData
 * @property {string} audioUrl - URL to the uploaded audio file
 * @property {string} filename - Name of the audio file
 * @property {number} size - File size in bytes
 * @property {number} [duration] - Duration in seconds
 */

/**
 * @typedef {Object} Song
 * @property {string|number} id - Unique identifier
 * @property {string} title - Song title
 * @property {string} [audioFileUrl] - URL to audio file
 * @property {string} [audioFileName] - Name of audio file
 * @property {number} [audioFileSize] - Size of audio file in bytes
 * @property {number} [audioDuration] - Duration in seconds
 */

/**
 * @typedef {Object} AudioManagerOptions
 * @property {Song[]} songs - Array of all songs
 * @property {function} setSongs - State setter for songs
 * @property {string} storageType - Current storage type ('local' or 'database')
 * @property {function} saveSongsToStorage - Function to save songs to storage
 * @property {Object} [user] - Current user object
 */

/**
 * @typedef {Object} AudioManagerReturn
 * @property {Song|null} selectedSongForAudio - Currently selected song for audio operations
 * @property {function} setSelectedSongForAudio - Setter for selected song
 * @property {string|number|null} expandedAudioSongId - ID of song with expanded audio player
 * @property {function} setExpandedAudioSongId - Setter for expanded audio song ID
 * @property {React.RefObject} audioFileInputRef - Ref for hidden file input
 * @property {function} handleAudioUpload - Handler for audio upload completion
 * @property {function} handleAudioDownload - Handler for downloading audio
 * @property {function} handleAudioRemove - Handler for removing audio
 * @property {function} triggerAudioFilePicker - Trigger file picker for a song
 * @property {function} handleAudioFileInputChange - Handler for file input change
 * @property {function} renderHiddenAudioInput - Returns JSX for hidden file input
 */

/**
 * Custom hook for managing audio-related state and operations
 *
 * @param {AudioManagerOptions} options - Hook options
 * @returns {AudioManagerReturn} Audio manager state and functions
 */
const useAudioManager = ({ songs, setSongs, storageType, saveSongsToStorage, user }) => {
  // Audio-related state
  const [selectedSongForAudio, setSelectedSongForAudio] = useState(null);
  const [audioUploadTargetSongId, setAudioUploadTargetSongId] = useState(null);
  const [expandedAudioSongId, setExpandedAudioSongId] = useState(null);

  // Ref for hidden file input
  const audioFileInputRef = useRef(null);

  /**
   * Handle successful audio upload
   * Verifies the upload and updates song metadata
   *
   * @param {string|number} songId - ID of the song to update
   * @param {AudioData} audioData - Uploaded audio data
   * @throws {Error} If upload verification fails
   */
  const handleAudioUpload = useCallback(async (songId, audioData) => {
    console.log('🎵 === AUDIO UPLOAD HANDLER START ===');
    console.log('📄 Song ID:', songId);
    console.log('📊 Audio data received:', audioData);

    try {
      // CRITICAL: Validate that the upload actually succeeded
      if (!audioData || !audioData.audioUrl) {
        throw new Error('Invalid audio data - no URL provided');
      }

      // For IndexedDB storage, verify the file was saved by checking if it exists
      console.log('🔍 Verifying uploaded file exists...');
      if (audioData.audioUrl.startsWith('indexeddb://')) {
        // IndexedDB URL - verify by trying to retrieve the audio
        try {
          const blobUrl = await audioStorageService.getAudioBlobURL(songId);
          if (blobUrl) {
            URL.revokeObjectURL(blobUrl); // Clean up test blob URL
            console.log('✅ File verified in IndexedDB');
          } else {
            throw new Error('File not found in IndexedDB');
          }
        } catch (error) {
          console.error('❌ IndexedDB verification failed:', error);
          throw new Error(`Upload verification failed: ${error.message}`);
        }
      } else {
        // HTTP URL - verify by fetching
        try {
          const testResponse = await fetch(audioData.audioUrl, { method: 'HEAD' });
          if (!testResponse.ok) {
            throw new Error(`Uploaded file not accessible: ${testResponse.status}`);
          }
          console.log('✅ File verified as accessible');
        } catch (error) {
          console.error('❌ File verification failed:', error);
          throw new Error(`Upload verification failed: ${error.message}`);
        }
      }

      // Only update local state AFTER verifying the upload succeeded
      console.log('🔄 Updating local song state...');
      const updatedSongs = songs.map(song => {
        if (song.id === songId) {
          return {
            ...song,
            audioFileUrl: audioData.audioUrl,
            audioFileName: audioData.filename,
            audioFileSize: audioData.size,
            audioDuration: audioData.duration
          };
        }
        return song;
      });

      setSongs(updatedSongs);
      console.log('✅ Local state updated');

      // Save to appropriate storage (localStorage or database)
      console.log(`🔄 Saving songs to ${storageType}...`);
      try {
        await saveSongsToStorage(updatedSongs);
        console.log('✅ Successfully saved to storage');
      } catch (saveError) {
        console.error('❌ Save failed:', saveError);

        // Revert local state if save fails
        console.log('🔄 Reverting local state due to save error...');
        setSongs(songs); // Revert to original songs

        throw new Error(`Failed to save: ${saveError.message}`);
      }

      // Clear selection only after everything succeeds
      setSelectedSongForAudio(null);

      console.log('🎉 === AUDIO UPLOAD COMPLETE ===');

      // Show success message
      alert(`Successfully uploaded and saved audio for "${songs.find(s => s.id === songId)?.title}"`);

    } catch (error) {
      console.error('❌ === AUDIO UPLOAD FAILED ===');
      console.error('Error details:', error);

      // Show user-friendly error message
      alert(`Failed to upload audio: ${error.message}\n\nPlease check:\n1. File format (MP3, WAV, M4A, OGG, FLAC)\n2. The file is not corrupted\n\nThen try again.`);

      // Don't update UI state if upload failed
      console.log('🚫 Not updating UI state due to upload failure');

      // Re-throw the error so calling code knows it failed
      throw error;
    }
  }, [songs, setSongs, storageType, saveSongsToStorage]);

  /**
   * Download audio file for a song
   *
   * @param {Song} song - Song with audio to download
   */
  const handleAudioDownload = useCallback(async (song) => {
    console.log('🎵 === AUDIO DOWNLOAD START ===');
    console.log('📄 Song:', song.title);
    console.log('🔗 Audio URL:', song.audioFileUrl);
    console.log('📁 Audio filename:', song.audioFileName);

    try {
      if (!song.audioFileUrl) {
        console.error('❌ No audio URL found for song');
        alert('No audio file found for this song.');
        return;
      }

      const filePath = audioStorageService.extractFilePathFromUrl(song.audioFileUrl);
      console.log('📍 Extracted file path:', filePath);

      if (filePath) {
        console.log('🚀 Starting download...');
        await audioStorageService.downloadAudioFile(filePath, song.audioFileName);
        console.log('✅ Download completed');
      } else {
        console.error('❌ Could not extract file path from URL');
        alert('Could not determine file path for download.');
      }
    } catch (error) {
      console.error('❌ Error downloading audio:', error);
      alert(`Failed to download audio file: ${error.message}`);
    }
  }, []);

  /**
   * Remove audio file from a song
   *
   * @param {string|number} songId - ID of the song to remove audio from
   */
  const handleAudioRemove = useCallback(async (songId) => {
    console.log('🗑️ === AUDIO REMOVE START ===');
    console.log('📄 Song ID:', songId);

    try {
      const song = songs.find(s => s.id === songId);
      console.log('📄 Found song:', song?.title);
      console.log('🔗 Audio URL:', song?.audioFileUrl);

      if (!song || !song.audioFileUrl) {
        console.error('❌ No song or audio URL found');
        alert('No audio file found for this song.');
        return;
      }

      const confirmDelete = window.confirm('Are you sure you want to remove this audio file?');
      if (!confirmDelete) {
        console.log('❌ User cancelled removal');
        return;
      }

      // Delete from storage
      const filePath = audioStorageService.extractFilePathFromUrl(song.audioFileUrl);
      console.log('📍 Extracted file path:', filePath);

      if (filePath) {
        console.log('🚀 Starting deletion...');
        await audioStorageService.deleteAudioFile(filePath);
        console.log('✅ File deleted from storage');
      }

      // Update the song to remove audio metadata
      const updatedSongs = songs.map(s => {
        if (s.id === songId) {
          return {
            ...s,
            audioFileUrl: null,
            audioFileName: null,
            audioFileSize: null,
            audioDuration: null
          };
        }
        return s;
      });

      setSongs(updatedSongs);
      console.log('✅ Song metadata updated');

      // Save to appropriate storage
      console.log(`🔄 Saving to ${storageType}...`);
      await saveSongsToStorage(updatedSongs);
      console.log('✅ Storage updated');

      console.log('🎉 === AUDIO REMOVE COMPLETE ===');
    } catch (error) {
      console.error('❌ Error removing audio:', error);
      alert(`Failed to remove audio file: ${error.message}`);
    }
  }, [songs, setSongs, storageType, saveSongsToStorage]);

  /**
   * Trigger the file picker for a specific song
   *
   * @param {string|number} songId - ID of the song to upload audio for
   */
  const triggerAudioFilePicker = useCallback((songId) => {
    setAudioUploadTargetSongId(songId);
    if (audioFileInputRef.current) {
      audioFileInputRef.current.click();
    }
  }, []);

  /**
   * Handle file selection from the hidden input
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - Change event from file input
   */
  const handleAudioFileInputChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file || !audioUploadTargetSongId) {
      setAudioUploadTargetSongId(null);
      return;
    }

    // Validate the file
    const validation = audioStorageService.validateAudioFile(file);
    if (!validation.isValid) {
      alert(`Invalid audio file: ${validation.errors.join(', ')}`);
      setAudioUploadTargetSongId(null);
      e.target.value = '';
      return;
    }

    try {
      // Upload the file - pass storageType to use correct storage backend
      const result = await audioStorageService.uploadAudioFile(
        file,
        audioUploadTargetSongId,
        user?.userId || 'anonymous',
        storageType  // 'local' uses IndexedDB, 'database' uses Supabase Storage
      );

      // Call the upload success handler
      await handleAudioUpload(audioUploadTargetSongId, result);
    } catch (error) {
      console.error('Audio upload error:', error);
      // handleAudioUpload already shows an alert
    } finally {
      setAudioUploadTargetSongId(null);
      e.target.value = '';
    }
  }, [audioUploadTargetSongId, user, storageType, handleAudioUpload]);

  /**
   * Get props for rendering the hidden audio file input element
   * Use this in your component's JSX:
   * <input {...getHiddenInputProps()} />
   *
   * @returns {Object} Props for the hidden file input element
   */
  const getHiddenInputProps = useCallback(() => ({
    ref: audioFileInputRef,
    type: 'file',
    accept: 'audio/*,.mp3,.wav,.m4a,.mp4,.aac,.ogg,.flac',
    onChange: handleAudioFileInputChange,
    className: 'hidden'
  }), [handleAudioFileInputChange]);

  return {
    // State
    selectedSongForAudio,
    setSelectedSongForAudio,
    expandedAudioSongId,
    setExpandedAudioSongId,

    // Refs
    audioFileInputRef,

    // Functions
    handleAudioUpload,
    handleAudioDownload,
    handleAudioRemove,
    triggerAudioFilePicker,
    handleAudioFileInputChange,

    // Helper for rendering hidden input
    getHiddenInputProps
  };
};

export default useAudioManager;
