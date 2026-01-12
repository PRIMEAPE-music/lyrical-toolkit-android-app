import React from 'react';
import { User, Mail, Calendar, LogOut } from 'lucide-react';

const AccountSettings = ({ darkMode, user, onLogout }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Account Info */}
      <div>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Account Information
        </h3>

        <div className="space-y-4">
          {/* Username */}
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-3 mb-2">
              <User className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Username
              </span>
            </div>
            <p className={`text-base font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {user?.username || 'N/A'}
            </p>
          </div>

          {/* Email */}
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-3 mb-2">
              <Mail className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Email
              </span>
            </div>
            <p className={`text-base font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {user?.email || 'N/A'}
            </p>
          </div>

          {/* Member Since */}
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-3 mb-2">
              <Calendar className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Member Since
              </span>
            </div>
            <p className={`text-base font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <div>
        <button
          onClick={onLogout}
          className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 ${
            darkMode
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default AccountSettings;
