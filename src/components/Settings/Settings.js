import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Key,
  CreditCard,
  Database,
  X
} from 'lucide-react';
import AccountSettings from './AccountSettings';
import AISettingsSection from './AISettingsSection';
import SubscriptionSettings from './SubscriptionSettings';
import StorageSettings from './StorageSettings';

const Settings = ({
  darkMode,
  onClose,
  user,
  isAuthenticated,
  storageType,
  onStorageTypeChange,
  onLogout
}) => {
  const [activeSection, setActiveSection] = useState('account');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const sections = [
    { id: 'account', icon: User, label: 'Account', requiresAuth: true },
    { id: 'subscription', icon: CreditCard, label: 'Subscription', requiresAuth: true },
    { id: 'storage', icon: Database, label: 'Storage', requiresAuth: false },
    { id: 'ai', icon: Key, label: 'AI Settings', requiresAuth: false }
  ];

  // Filter sections based on auth status
  const visibleSections = sections.filter(s => !s.requiresAuth || isAuthenticated);

  return (
    <div className={`h-full flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${
        darkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-2">
          <SettingsIcon className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Settings
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className={`
          ${isMobile ? 'hidden' : 'w-48'}
          ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}
          border-r
        `}>
          <div className="p-2 space-y-1">
            {visibleSections.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left ${
                  activeSection === id
                    ? darkMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : darkMode
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Tabs */}
        {isMobile && (
          <div className={`flex border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            {visibleSections.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 ${
                  activeSection === id
                    ? darkMode
                      ? 'border-b-2 border-blue-500 text-blue-400'
                      : 'border-b-2 border-blue-500 text-blue-600'
                    : darkMode
                      ? 'text-gray-400'
                      : 'text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {activeSection === 'account' && (
              <AccountSettings darkMode={darkMode} user={user} onLogout={onLogout} />
            )}
            {activeSection === 'subscription' && (
              <SubscriptionSettings darkMode={darkMode} user={user} />
            )}
            {activeSection === 'storage' && (
              <StorageSettings
                darkMode={darkMode}
                storageType={storageType}
                onStorageTypeChange={onStorageTypeChange}
                isAuthenticated={isAuthenticated}
              />
            )}
            {activeSection === 'ai' && (
              <AISettingsSection darkMode={darkMode} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
