// Settings Service - Manages user settings including API keys

const SETTINGS_KEY = 'lyrical_toolkit_settings';

// Default settings
const defaultSettings = {
  aiProvider: 'gemini',
  geminiApiKey: '',
  geminiModel: 'gemini-2.0-flash',
};

// Get all settings
export const getSettings = () => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
    return defaultSettings;
  } catch (error) {
    console.error('Error reading settings:', error);
    return defaultSettings;
  }
};

// Save all settings
export const saveSettings = (settings) => {
  try {
    const current = getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
};

// Get Gemini API key
export const getGeminiApiKey = () => {
  const settings = getSettings();
  return settings.geminiApiKey || '';
};

// Save Gemini API key
export const saveGeminiApiKey = (apiKey) => {
  return saveSettings({ geminiApiKey: apiKey });
};

// Check if API key is configured
export const isApiKeyConfigured = () => {
  const key = getGeminiApiKey();
  return key && key.length > 0;
};

// Test Gemini API key validity
export const testGeminiApiKey = async (apiKey) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Say "API key valid" in exactly 3 words.' }]
          }]
        })
      }
    );

    if (response.ok) {
      return { success: true, message: 'API key is valid!' };
    } else {
      const error = await response.json();
      const errorMessage = error.error?.message || '';

      if (response.status === 400 && errorMessage.includes('API key')) {
        return { success: false, message: 'Invalid API key. Please check and try again.' };
      } else if (response.status === 403) {
        return { success: false, message: 'API key does not have access. Enable the Generative Language API in Google Cloud Console.' };
      } else if (response.status === 429 || errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('rate')) {
        return {
          success: false,
          message: 'Quota error. For new keys: 1) Wait 2-3 minutes for activation, 2) Ensure the Generative Language API is enabled in Google Cloud Console.'
        };
      } else if (response.status === 404) {
        return { success: false, message: 'API endpoint not found. The model may be unavailable in your region.' };
      } else {
        return { success: false, message: errorMessage || 'Unknown error occurred. Please try again.' };
      }
    }
  } catch (error) {
    console.error('Error testing API key:', error);
    return { success: false, message: 'Network error. Please check your connection.' };
  }
};

// Clear all settings
export const clearSettings = () => {
  try {
    localStorage.removeItem(SETTINGS_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing settings:', error);
    return false;
  }
};

export default {
  getSettings,
  saveSettings,
  getGeminiApiKey,
  saveGeminiApiKey,
  isApiKeyConfigured,
  testGeminiApiKey,
  clearSettings,
};
