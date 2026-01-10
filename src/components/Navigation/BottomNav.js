import React, { useState, useEffect, useRef } from 'react';
import { Search, Upload, BarChart3, Book, Shuffle, Music, MoreHorizontal, FileText, X, Settings } from 'lucide-react';

const BottomNav = ({ activeTab, setActiveTab, darkMode }) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
    };

    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMoreMenu]);

  const tabs = [
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'dictionary', icon: Book, label: 'Dictionary' },
    { id: 'upload', icon: Upload, label: 'Songs' },
    { id: 'rhymes', icon: Music, label: 'Rhymes' },
    { id: 'stats', icon: BarChart3, label: 'Stats' }
  ];

  const moreTabs = [
    { id: 'synonyms', icon: Shuffle, label: 'Synonyms' },
    { id: 'analysis', icon: FileText, label: 'Analysis' },
    { id: 'settings', icon: Settings, label: 'AI Settings' }
  ];

  const isMoreTabActive = moreTabs.some(tab => tab.id === activeTab);

  const handleMoreTabClick = (tabId) => {
    setActiveTab(tabId);
    setShowMoreMenu(false);
  };

  const bgColor = darkMode ? '#1f2937' : '#ffffff';
  const borderColor = darkMode ? '#374151' : '#e5e7eb';
  const menuBgColor = darkMode ? '#374151' : '#ffffff';
  const menuBorderColor = darkMode ? '#4B5563' : '#e5e7eb';
  const menuActiveBg = darkMode ? '#4B5563' : '#f3f4f6';
  const menuTextColor = darkMode ? '#D1D5DB' : '#111827';
  // Active/inactive colors for bottom nav
  const activeColor = darkMode ? '#FFFFFF' : '#111827';
  const inactiveColor = darkMode ? '#9CA3AF' : '#111827';
  const activeBgColor = darkMode ? '#374151' : '#e5e7eb';

  return (
    <>
      {showMoreMenu && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            bottom: '72px',
            left: '8px',
            backgroundColor: menuBgColor,
            borderRadius: '12px',
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
            zIndex: 999999,
            overflow: 'hidden',
            minWidth: '140px',
            border: '1px solid ' + menuBorderColor
          }}
        >
          {moreTabs.map(({ id, icon: Icon, label }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => handleMoreTabClick(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '14px 16px',
                  border: 'none',
                  background: isActive ? menuActiveBg : 'transparent',
                  cursor: 'pointer',
                  color: isActive ? (darkMode ? '#FFFFFF' : '#111827') : menuTextColor,
                  textAlign: 'left',
                  borderBottom: '1px solid ' + menuBorderColor
                }}
              >
                <Icon style={{ width: '20px', height: '20px' }} />
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{label}</span>
              </button>
            );
          })}
        </div>
      )}

      <nav
        className="shadow-lg"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 999998,
          backgroundColor: bgColor,
          borderTop: '1px solid ' + borderColor,
          minHeight: 'calc(64px + env(safe-area-inset-bottom, 0px))',
          height: 'calc(64px + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center'
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          width: '100%',
          height: '64px'
        }}>
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              height: '64px',
              minHeight: '64px',
              minWidth: '48px',
              border: 'none',
              background: (isMoreTabActive || showMoreMenu) ? activeBgColor : 'transparent',
              borderRadius: '8px',
              cursor: 'pointer',
              color: (isMoreTabActive || showMoreMenu) ? activeColor : inactiveColor,
              padding: '8px 4px'
            }}
            aria-label="More options"
          >
            {showMoreMenu ? (
              <X style={{ width: '24px', height: '24px', minWidth: '24px', minHeight: '24px', marginBottom: '4px' }} />
            ) : (
              <MoreHorizontal style={{ width: '24px', height: '24px', minWidth: '24px', minHeight: '24px', marginBottom: '4px' }} />
            )}
            <span style={{ fontSize: '11px', fontWeight: 500 }}>More</span>
          </button>

          {tabs.map(({ id, icon: Icon, label }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id);
                  setShowMoreMenu(false);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  height: '64px',
                  minHeight: '64px',
                  minWidth: '48px',
                  border: 'none',
                  background: isActive ? activeBgColor : 'transparent',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: isActive ? activeColor : inactiveColor,
                  padding: '8px 4px'
                }}
                aria-label={label}
              >
                <Icon style={{ width: '24px', height: '24px', minWidth: '24px', minHeight: '24px', marginBottom: '4px' }} />
                <span style={{ fontSize: '11px', fontWeight: 500 }}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
