import React from 'react';
import { X } from 'lucide-react';

/**
 * Tab bar component for the notepad
 * Shows all open tabs with close buttons
 */
const NotepadTabBar = ({
  tabs = [],
  activeTabIndex = 0,
  onSwitchTab,
  onCloseTab,
  getTabDisplayName,
  darkMode = false
}) => {
  if (tabs.length === 0) return null;

  return (
    <div
      className={`flex items-center gap-1 overflow-x-auto border-b ${
        darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-300 bg-gray-50'
      }`}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: darkMode ? '#4B5563 #1F2937' : '#D1D5DB #F9FAFB',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {tabs.map((tab, index) => {
        const isActive = index === activeTabIndex;
        const displayName = getTabDisplayName(tab);

        return (
          <div
            key={`${tab.songId}-${tab.draftId || 'main'}`}
            className={`flex items-center gap-2 px-3 py-2 min-w-[120px] max-w-[200px] cursor-pointer transition-colors border-r ${
              isActive
                ? darkMode
                  ? 'bg-gray-800 border-gray-600 text-white font-medium'
                  : 'bg-white border-gray-300 text-gray-900 font-medium'
                : darkMode
                  ? 'bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            {/* Tab Name */}
            <div
              className="flex-1 truncate text-xs"
              onClick={() => onSwitchTab(index)}
              title={displayName.length > 6 ? displayName.substring(0, 6) + "..." : displayName}
            >
              {displayName.length > 6 ? displayName.substring(0, 6) + "..." : displayName}
            </div>

            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(index);
              }}
              className={`flex-shrink-0 rounded hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`}
              style={{ width: '12px', height: '12px', padding: '2px' }}
              title="Close tab"
            >
              <X style={{ width: "8px", height: "8px" }} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default NotepadTabBar;
