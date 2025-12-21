import React, { useEffect } from 'react';
import { Search, Upload, BarChart3, Book, Shuffle, Music } from 'lucide-react';

const BottomNav = ({ activeTab, setActiveTab, darkMode }) => {
  console.log('🚀 BottomNav RENDERING: ' + JSON.stringify({ activeTab, darkMode }));

  useEffect(() => {
    console.log('✅ BottomNav MOUNTED');
    return () => {
      console.log('❌ BottomNav UNMOUNTED');
    };
  }, []);

  // Main tabs for bottom navigation
  const tabs = [
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'dictionary', icon: Book, label: 'Dictionary' },
    { id: 'upload', icon: Upload, label: 'Upload' },
    { id: 'rhymes', icon: Music, label: 'Rhymes' },
    { id: 'stats', icon: BarChart3, label: 'Stats' }
  ];

  return (
    <nav
      className="shadow-lg"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 999998, // Below notepad (999999) but above everything else
        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
        borderTop: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
        minHeight: '64px',
        height: '64px',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        width: '100%',
        height: '100%'
      }}>
        {tabs.map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                height: '100%',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: isActive ? '#FFFFFF' : '#9CA3AF',
                padding: 0
              }}
              aria-label={label}
            >
              <Icon style={{ width: '24px', height: '24px', marginBottom: '4px' }} />
              <span style={{ fontSize: '12px', fontWeight: 500 }}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
