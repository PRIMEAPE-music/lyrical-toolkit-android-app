/**
 * Audio Storage Service - Dual Storage Implementation
 * Supports both local IndexedDB storage and Supabase cloud storage
 * - Local mode: Uses IndexedDB for device-local storage
 * - Database mode: Uses Supabase Storage via Netlify functions for cross-device access
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
// Returns 0 if duration cannot be determined (non-blocking)
export const getAudioDuration = (file) => {
  return new Promise((resolve) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);

    // Timeout after 5 seconds - some large WAV files take too long
    const timeout = setTimeout(() => {
      console.warn('⚠️ Audio duration detection timed out, continuing without duration');
      URL.revokeObjectURL(objectUrl);
      resolve(0);
    }, 5000);

    audio.addEventListener('loadedmetadata', () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(objectUrl);
      const duration = Math.floor(audio.duration);
      console.log('✅ Got audio duration:', duration, 'seconds');
      resolve(duration);
    });

    audio.addEventListener('error', (e) => {
      clearTimeout(timeout);
      console.warn('⚠️ Could not get audio duration, continuing anyway:', e);
      URL.revokeObjectURL(objectUrl);
      resolve(0); // Don't fail, just continue without duration
    });

    audio.src = objectUrl;
  });
};

// Upload audio file to Supabase Storage using signed URLs
// This bypasses Netlify's 6MB payload limit by uploading directly to Supabase
const uploadToSupabase = async (file, songId, userId = 'anonymous') => {
  // Use relative path on web, full URL on mobile
  const getApiBase = () => {
    if (typeof window !== 'undefined' &&
        (window.location.hostname.includes('netlify.app') ||
         window.location.hostname.includes('.netlify.com') ||
         window.location.hostname.includes('lyrical-toolkit.com'))) {
      return '';
    }
    return 'https://lyrical-toolkit.netlify.app';
  };
  const API_BASE = getApiBase();

  console.log('☁️ Uploading audio file to Supabase Storage:', file.name);
  console.log('📊 File size:', file.size, 'bytes');

  try {
    // Step 1: Get signed upload URL from our function
    console.log('📝 Requesting signed upload URL...');
    const urlResponse = await fetch(`${API_BASE}/.netlify/functions/get-upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        userId: userId,
        contentType: file.type || 'audio/mpeg'
      })
    });

    if (!urlResponse.ok) {
      const error = await urlResponse.text();
      throw new Error(`Failed to get upload URL: ${error}`);
    }

    const { uploadUrl, publicUrl } = await urlResponse.json();
    console.log('✅ Got signed upload URL');

    // Step 2: Upload directly to Supabase using signed URL
    console.log('📤 Uploading file to Supabase...');
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'audio/mpeg',
        'x-upsert': 'false'
      },
      body: file
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      throw new Error(`Upload failed: ${error}`);
    }

    console.log('✅ Audio uploaded to Supabase');

    // Get duration locally
    const duration = await getAudioDuration(file);

    return {
      audioUrl: publicUrl,
      filename: file.name,
      size: file.size,
      duration
    };

  } catch (error) {
    console.error('❌ Supabase upload error:', error);
    throw error;
  }
};

// Upload audio file to IndexedDB (for local mode)
const uploadToIndexedDB = async (file, songId) => {
  console.log('💾 Uploading audio file to IndexedDB:', file.name);

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
};

// Upload audio file - automatically chooses storage based on storageType
// storageType: 'local' uses IndexedDB, 'database' uses Supabase Storage
export const uploadAudioFile = async (file, songId, userId = 'anonymous', storageType = 'local') => {
  console.log('🎵 Uploading audio file:', file.name, 'to', storageType, 'storage');

  try {
    // Validate file
    const validation = validateAudioFile(file);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Choose storage based on storageType
    if (storageType === 'database') {
      return await uploadToSupabase(file, songId, userId);
    } else {
      return await uploadToIndexedDB(file, songId, userId);
    }
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
      throw new Error('Audio file not found in IndexedDB');
    }

    console.log('📦 Retrieved audio data from IndexedDB:', {
      id: audioData.id,
      hasArrayBuffer: !!audioData.arrayBuffer,
      hasFile: !!audioData.file,
      type: audioData.type,
      size: audioData.size
    });

    // Create blob URL for playback - pass whole audioData object
    const blobURL = audioIndexedDB.createAudioBlobURL(audioData);
    return blobURL;
  } catch (error) {
    console.error('❌ Error getting audio blob URL:', error);
    throw error;
  }
};

// Download audio file
export const downloadAudioFile = async (url) => {
  console.log('📥 Downloading audio file');

  try {
    // Check if it's an IndexedDB reference
    if (url && url.startsWith('indexeddb://')) {
      const id = url.replace('indexeddb://', '');
      const audioData = await audioIndexedDB.getAudioFile(id);

      if (!audioData) {
        throw new Error('Audio file not found in IndexedDB');
      }

      // Create download - handle both new (arrayBuffer) and legacy (file) formats
      const data = audioData.arrayBuffer || audioData.file;
      const blob = new Blob([data], { type: audioData.type || 'audio/wav' });
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

// Clear all audio files from IndexedDB
export const clearAllAudioFiles = async () => {
  console.log('🗑️ Clearing all audio files from IndexedDB');

  try {
    await audioIndexedDB.clearAllAudioFiles();
    console.log('✅ All audio files cleared from IndexedDB');
    return true;
  } catch (error) {
    console.error('❌ Error clearing audio files:', error);
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
const audioStorageService = {
  AUDIO_CONFIG,
  validateAudioFile,
  getAudioDuration,
  uploadAudioFile,
  getAudioBlobURL,
  downloadAudioFile,
  deleteAudioFile,
  clearAllAudioFiles,
  extractFilePathFromUrl,
  formatFileSize,
  formatDuration
};

export default audioStorageService;
