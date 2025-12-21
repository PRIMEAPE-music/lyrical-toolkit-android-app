/**
 * IndexedDB wrapper for storing audio files locally
 * IndexedDB can handle large files (hundreds of MB to GBs)
 * Much better than localStorage for binary data
 */

const DB_NAME = 'LyricToolkitAudio';
const DB_VERSION = 1;
const STORE_NAME = 'audioFiles';

// Open IndexedDB database
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

// Save audio file to IndexedDB
export const saveAudioFile = async (id, file, metadata = {}) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const audioData = {
      id,
      file,
      filename: metadata.filename || file.name,
      size: metadata.size || file.size,
      duration: metadata.duration,
      uploadedAt: new Date().toISOString(),
      type: file.type
    };

    return new Promise((resolve, reject) => {
      const request = store.put(audioData);
      request.onsuccess = () => {
        console.log('✅ Audio file saved to IndexedDB:', id);
        resolve(audioData);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ Error saving audio to IndexedDB:', error);
    throw error;
  }
};

// Get audio file from IndexedDB
export const getAudioFile = async (id) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => {
        if (request.result) {
          console.log('✅ Audio file retrieved from IndexedDB:', id);
          resolve(request.result);
        } else {
          console.warn('⚠️ Audio file not found in IndexedDB:', id);
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ Error getting audio from IndexedDB:', error);
    throw error;
  }
};

// Delete audio file from IndexedDB
export const deleteAudioFile = async (id) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => {
        console.log('✅ Audio file deleted from IndexedDB:', id);
        resolve(true);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ Error deleting audio from IndexedDB:', error);
    throw error;
  }
};

// Get all audio files
export const getAllAudioFiles = async () => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        console.log('✅ Retrieved all audio files from IndexedDB:', request.result.length);
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ Error getting all audio from IndexedDB:', error);
    throw error;
  }
};

// Clear all audio files
export const clearAllAudioFiles = async () => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => {
        console.log('✅ All audio files cleared from IndexedDB');
        resolve(true);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ Error clearing audio from IndexedDB:', error);
    throw error;
  }
};

// Create blob URL for audio playback
export const createAudioBlobURL = (file) => {
  try {
    const blob = new Blob([file], { type: file.type });
    const url = URL.createObjectURL(blob);
    return url;
  } catch (error) {
    console.error('❌ Error creating blob URL:', error);
    throw error;
  }
};

// Revoke blob URL when no longer needed
export const revokeAudioBlobURL = (url) => {
  try {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
      console.log('✅ Blob URL revoked');
    }
  } catch (error) {
    console.error('❌ Error revoking blob URL:', error);
  }
};

export default {
  saveAudioFile,
  getAudioFile,
  deleteAudioFile,
  getAllAudioFiles,
  clearAllAudioFiles,
  createAudioBlobURL,
  revokeAudioBlobURL
};
