/**
 * Audio Storage Service - IndexedDB Implementation
 * Stores audio files locally using IndexedDB (can handle large files)
 */

import * as audioIndexedDB from '../utils/audioIndexedDB';

// Audio file validation constants
export const AUDIO_CONFIG = {
  MAX_FILE_SIZE: Infinity, // No limit for local storage (IndexedDB can handle large files)
  ALLOWED_TYPES: [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/m4a',
    'audio/mp4',
    'audio/x-m4a'
  ]
};

// Validate audio file
export const validateAudioFile = (file) => {
  const errors = [];

  // Check file size (only if MAX_FILE_SIZE is not Infinity)
  if (AUDIO_CONFIG.MAX_FILE_SIZE !== Infinity && file.size > AUDIO_CONFIG.MAX_FILE_SIZE) {
    errors.push(`File size must be less than ${AUDIO_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  // Check MIME type (allow empty type for some .wav files)
  if (file.type && !AUDIO_CONFIG.ALLOWED_TYPES.includes(file.type)) {
    // Don't reject if MIME type is unknown, fallback to extension check
    console.warn('Unknown MIME type:', file.type, '- will validate by extension');
  }

  // Check file extension as fallback
  const extension = file.name.split('.').pop().toLowerCase();
  const allowedExtensions = ['mp3', 'wav', 'm4a', 'mp4', 'aac', 'ogg', 'flac'];
  if (!allowedExtensions.includes(extension)) {
    errors.push(`File extension must be one of: ${allowedExtensions.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Get audio file duration from File object
export const getAudioDuration = (file) => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);

    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(objectUrl);
      resolve(Math.floor(audio.duration));
    });

    audio.addEventListener('error', () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load audio metadata'));
    });

    audio.src = objectUrl;
  });
};

// Upload audio file to IndexedDB
export const uploadAudioFile = async (file, songId, userId = 'anonymous') => {
  console.log('🎵 Uploading audio file to IndexedDB:', file.name);

  try {
    // Validate file
    const validation = validateAudioFile(file);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Get duration
    const duration = await getAudioDuration(file);

    // Save to IndexedDB with songId as the key
    const metadata = {
      filename: file.name,
      size: file.size,
      duration
    };

    await audioIndexedDB.saveAudioFile(songId, file, metadata);

    // Generate a local reference URL (we'll use this to identify the file)
    const audioUrl = `indexeddb://${songId}`;

    console.log('✅ Audio file uploaded to IndexedDB');

    return {
      audioUrl,
      filename: file.name,
      size: file.size,
      duration
    };
  } catch (error) {
    console.error('❌ Error uploading audio file:', error);
    throw error;
  }
};

// Get audio file blob URL for playback
export const getAudioBlobURL = async (songId) => {
  try {
    const audioData = await audioIndexedDB.getAudioFile(songId);
    if (!audioData) {
      throw new Error('Audio file not found');
    }

    // Create blob URL for playback
    const blobURL = audioIndexedDB.createAudioBlobURL(audioData.file);
    return blobURL;
  } catch (error) {
    console.error('❌ Error getting audio blob URL:', error);
    throw error;
  }
};

// Download audio file
export const downloadAudioFile = async (url, songId) => {
  console.log('📥 Downloading audio file');

  try {
    // Check if it's an IndexedDB reference
    if (url && url.startsWith('indexeddb://')) {
      const id = url.replace('indexeddb://', '');
      const audioData = await audioIndexedDB.getAudioFile(id);

      if (!audioData) {
        throw new Error('Audio file not found in IndexedDB');
      }

      // Create download
      const blob = new Blob([audioData.file], { type: audioData.type });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = audioData.filename || 'audio.mp3';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      console.log('✅ Audio file downloaded');
      return;
    }

    // For local files (like example audio), try to download directly
    if (url && url.startsWith('/')) {
      const response = await fetch(url);
      if (!response.ok) throw new Error('File not found');

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = url.split('/').pop() || 'audio.mp3';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      console.log('✅ Audio file downloaded');
      return;
    }

    throw new Error('Invalid audio URL');
  } catch (error) {
    console.error('❌ Error downloading audio file:', error);
    throw error;
  }
};

// Delete audio file from IndexedDB
export const deleteAudioFile = async (songId) => {
  console.log('🗑️ Deleting audio file from IndexedDB');

  try {
    await audioIndexedDB.deleteAudioFile(songId);
    console.log('✅ Audio file deleted from IndexedDB');
    return true;
  } catch (error) {
    console.error('❌ Error deleting audio file:', error);
    throw error;
  }
};

// Extract file path/ID from URL
export const extractFilePathFromUrl = (url) => {
  if (!url) return null;

  // For IndexedDB references
  if (url.startsWith('indexeddb://')) {
    return url.replace('indexeddb://', '');
  }

  // For local files, return the path as-is
  return url;
};

// Format file size for display
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Format duration for display
export const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Default export for backward compatibility
export default {
  AUDIO_CONFIG,
  validateAudioFile,
  getAudioDuration,
  uploadAudioFile,
  getAudioBlobURL,
  downloadAudioFile,
  deleteAudioFile,
  extractFilePathFromUrl,
  formatFileSize,
  formatDuration
};
