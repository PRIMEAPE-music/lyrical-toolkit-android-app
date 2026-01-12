import React, { useState, useEffect } from 'react';
import { Key, ExternalLink, CheckCircle, XCircle, Loader2, Eye, EyeOff, Trash2, Info } from 'lucide-react';
import { getGeminiApiKey, saveGeminiApiKey, testGeminiApiKey } from '../../services/settingsService';

const AISettingsSection = ({ darkMode }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saved, setSaved] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const savedKey = getGeminiApiKey();
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  const handleSave = () => {
    saveGeminiApiKey(apiKey.trim());
    setSaved(true);
    setTestResult(null);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'Please enter an API key first.' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    const result = await testGeminiApiKey(apiKey.trim());
    setTestResult(result);
    setTesting(false);

    // Auto-save if test is successful
    if (result.success) {
      saveGeminiApiKey(apiKey.trim());
    }
  };

  const handleClear = () => {
    setApiKey('');
    saveGeminiApiKey('');
    setTestResult(null);
    setSaved(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          AI Analysis Settings
        </h3>
      </div>

      {/* Info Box */}
      <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
        <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
          AI-powered analysis features require a Google Gemini API key.
          <strong> The free tier is very generous</strong> - no credit card required!
        </p>
      </div>

      {/* API Key Input */}
      <div>
        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Google Gemini API Key
        </label>
        <input
          type={showKey ? 'text' : 'password'}
          value={apiKey}
          onChange={(e) => {
            setApiKey(e.target.value);
            setTestResult(null);
            setSaved(false);
          }}
          placeholder="Enter your API key..."
          className={`w-full px-3 py-2 rounded-lg border ${
            darkMode
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
      </div>

      {/* Test Result */}
      {testResult && (
        <div className={`p-3 rounded-lg flex items-center gap-2 ${
          testResult.success
            ? darkMode ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'
            : darkMode ? 'bg-red-900/30 border border-red-700' : 'bg-red-50 border border-red-200'
        }`}>
          {testResult.success ? (
            <CheckCircle className={`w-5 h-5 flex-shrink-0 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
          ) : (
            <XCircle className={`w-5 h-5 flex-shrink-0 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
          )}
          <span className={`text-sm ${
            testResult.success
              ? darkMode ? 'text-green-200' : 'text-green-800'
              : darkMode ? 'text-red-200' : 'text-red-800'
          }`}>
            {testResult.message}
          </span>
        </div>
      )}

      {/* Saved Indicator */}
      {saved && (
        <div className={`p-3 rounded-lg flex items-center gap-2 ${
          darkMode ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'
        }`}>
          <CheckCircle className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
          <span className={`text-sm ${darkMode ? 'text-green-200' : 'text-green-800'}`}>
            Settings saved!
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowKey(!showKey)}
          className={`py-2 px-3 rounded-lg font-medium flex items-center justify-center ${
            darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
          }`}
          title={showKey ? 'Hide key' : 'Show key'}
        >
          {showKey ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
        {apiKey && (
          <button
            onClick={handleClear}
            className={`py-2 px-3 rounded-lg font-medium flex items-center justify-center ${
              darkMode ? 'bg-gray-700 hover:bg-red-900 text-white border border-gray-600' : 'bg-gray-100 hover:bg-red-100 text-red-500 border border-gray-300'
            }`}
            title="Clear key"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={handleTest}
          disabled={testing || !apiKey.trim()}
          className={`flex-1 py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 ${
            testing || !apiKey.trim()
              ? darkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-500' : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'
          }`}
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Testing...
            </>
          ) : (
            'Test Connection'
          )}
        </button>
        <button
          onClick={handleSave}
          disabled={!apiKey.trim()}
          className={`flex-1 py-2 px-4 rounded-lg font-medium ${
            !apiKey.trim()
              ? darkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-500' : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'
          }`}
        >
          Save Key
        </button>
      </div>

      {/* Instructions Toggle */}
      <button
        onClick={() => setShowInstructions(!showInstructions)}
        className={`w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 ${
          darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        }`}
      >
        <Info className="w-4 h-4" />
        {showInstructions ? 'Hide Instructions' : 'How to Get a Free API Key'}
      </button>

      {/* Instructions */}
      {showInstructions && (
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <h4 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Get Your Free Gemini API Key
          </h4>
          <ol className={`list-decimal list-inside space-y-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <li>Go to Google AI Studio</li>
            <li>Sign in with your Google account</li>
            <li>Click "Get API Key" in the left sidebar</li>
            <li>Click "Create API key"</li>
            <li>Copy the key and paste it above</li>
          </ol>

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-4 w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 ${
              darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <ExternalLink className="w-4 h-4" />
            Open Google AI Studio
          </a>

          <div className={`mt-4 p-3 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
            <h5 className={`font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Free Tier Includes:
            </h5>
            <ul className={`text-sm space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <li>• 60 requests per minute</li>
              <li>• 1 million tokens per day</li>
              <li>• No credit card required</li>
              <li>• Access to Gemini 2.0 Flash</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISettingsSection;
