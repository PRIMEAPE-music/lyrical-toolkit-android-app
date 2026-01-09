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
// Converts File to ArrayBuffer for reliable storage on mobile
export const saveAudioFile = async (id, file, metadata = {}) => {
  try {
    // IMPORTANT: Convert File to ArrayBuffer BEFORE creating transaction
    // IndexedDB transactions auto-commit when the event loop processes other events
    // If we await inside a transaction, it will close before we can use it
    console.log('🔄 Converting file to ArrayBuffer for storage...');
    const arrayBuffer = await file.arrayBuffer();
    console.log('✅ Converted to ArrayBuffer, size:', arrayBuffer.byteLength);

    const audioData = {
      id,
      arrayBuffer, // Store as ArrayBuffer instead of File
      filename: metadata.filename || file.name,
      size: metadata.size || file.size,
      duration: metadata.duration,
      uploadedAt: new Date().toISOString(),
      type: file.type || 'audio/wav' // Default to wav if type is empty
    };

    // Now create the transaction and store synchronously (no awaits between transaction and put)
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      // Handle transaction-level errors
      transaction.onerror = () => {
        console.error('❌ IndexedDB transaction error:', transaction.error);
        reject(transaction.error);
      };

      transaction.oncomplete = () => {
        console.log('✅ Transaction completed successfully');
      };

      const request = store.put(audioData);
      request.onsuccess = () => {
        console.log('✅ Audio file saved to IndexedDB:', id, 'size:', arrayBuffer.byteLength);
        resolve(audioData);
      };
      request.onerror = () => {
        console.error('❌ IndexedDB put error:', request.error);
        reject(request.error);
      };
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
// Accepts either audioData object (with arrayBuffer) or legacy file object
export const createAudioBlobURL = (audioData) => {
  try {
    let blob;

    // Handle new format (ArrayBuffer stored in audioData)
    if (audioData.arrayBuffer) {
      console.log('🔄 Creating blob from ArrayBuffer, size:', audioData.arrayBuffer.byteLength);
      blob = new Blob([audioData.arrayBuffer], { type: audioData.type || 'audio/wav' });
    }
    // Handle legacy format (File object)
    else if (audioData.file) {
      console.log('🔄 Creating blob from legacy File object');
      blob = new Blob([audioData.file], { type: audioData.file.type || audioData.type || 'audio/wav' });
    }
    // Handle raw file/buffer passed directly
    else {
      console.log('🔄 Creating blob from raw data');
      blob = new Blob([audioData], { type: audioData.type || 'audio/wav' });
    }

    const url = URL.createObjectURL(blob);
    console.log('✅ Created blob URL:', url);
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
