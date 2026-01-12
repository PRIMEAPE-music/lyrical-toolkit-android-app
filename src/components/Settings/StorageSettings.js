import React from 'react';
import { Database, HardDrive, Cloud, Info, CheckCircle } from 'lucide-react';

const StorageSettings = ({ darkMode, storageType, onStorageTypeChange, isAuthenticated }) => {
  return (
    <div className="space-y-6">
      {/* Storage Options */}
      <div>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Storage Location
        </h3>

        <div className="space-y-3">
          {/* Local Storage Option */}
          <button
            onClick={() => onStorageTypeChange('local')}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
              storageType === 'local'
                ? darkMode
                  ? 'bg-blue-900/20 border-blue-600'
                  : 'bg-blue-50 border-blue-500'
                : darkMode
                  ? 'bg-gray-700 border-gray-600 hover:border-gray-500'
                  : 'bg-gray-50 border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <HardDrive className={`w-6 h-6 ${
                  storageType === 'local'
                    ? darkMode ? 'text-blue-400' : 'text-blue-600'
                    : darkMode ? 'text-gray-400' : 'text-gray-600'
                }`} />
                <div>
                  <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Local Storage
                  </h4>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Store on this device only
                  </p>
                </div>
              </div>
              {storageType === 'local' && (
                <CheckCircle className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              )}
            </div>
            <div className="ml-9 space-y-1">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                • Unlimited songs
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                • No internet required
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                • Not synced across devices
              </p>
            </div>
          </button>

          {/* Cloud Storage Option */}
          <button
            onClick={() => isAuthenticated ? onStorageTypeChange('database') : null}
            disabled={!isAuthenticated}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
              !isAuthenticated
                ? darkMode
                  ? 'bg-gray-800 border-gray-700 opacity-50 cursor-not-allowed'
                  : 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed'
                : storageType === 'database'
                  ? darkMode
                    ? 'bg-blue-900/20 border-blue-600'
                    : 'bg-blue-50 border-blue-500'
                  : darkMode
                    ? 'bg-gray-700 border-gray-600 hover:border-gray-500'
                    : 'bg-gray-50 border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <Cloud className={`w-6 h-6 ${
                  storageType === 'database'
                    ? darkMode ? 'text-blue-400' : 'text-blue-600'
                    : darkMode ? 'text-gray-400' : 'text-gray-600'
                }`} />
                <div>
                  <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Cloud Storage {!isAuthenticated && '(Login Required)'}
                  </h4>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Sync across all devices
                  </p>
                </div>
              </div>
              {storageType === 'database' && (
                <CheckCircle className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              )}
            </div>
            <div className="ml-9 space-y-1">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                • 5 free songs with audio
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                • Unlimited with Pro subscription
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                • Access from any device
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                • Automatic backup
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className={`p-4 rounded-lg ${
        darkMode ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'
      }`}>
        <div className="flex items-start gap-3">
          <Info className={`w-5 h-5 flex-shrink-0 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <div className="space-y-2">
            <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
              You can switch between storage modes at any time.
            </p>
            <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
              Local storage keeps everything on your device. Cloud storage syncs your songs across all devices where you're logged in.
            </p>
          </div>
        </div>
      </div>

      {/* Storage Type Indicator */}
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-3">
          <Database className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          <div>
            <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Current Storage Mode
            </p>
            <p className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {storageType === 'local' ? 'Local Storage' : 'Cloud Storage'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorageSettings;
