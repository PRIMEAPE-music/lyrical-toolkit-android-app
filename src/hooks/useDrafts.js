import { useState, useEffect, useCallback } from 'react';

const MAX_DRAFTS_PER_SONG = 5;
const AUTO_SAVE_INTERVAL = 3000; // 3 seconds

/**
 * Custom hook for managing song drafts and multi-tab editing
 */
export const useDrafts = () => {
  // Open tabs: [{ songId, draftId }]
  const [openTabs, setOpenTabs] = useState(() => {
    const stored = localStorage.getItem('notepad_openTabs');
    return stored ? JSON.parse(stored) : [];
  });

  // Active tab index
  const [activeTabIndex, setActiveTabIndex] = useState(() => {
    const stored = localStorage.getItem('notepad_activeTabIndex');
    return stored ? parseInt(stored) : 0;
  });

  // Save openTabs to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('notepad_openTabs', JSON.stringify(openTabs));
  }, [openTabs]);

  // Save activeTabIndex to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('notepad_activeTabIndex', activeTabIndex.toString());
  }, [activeTabIndex]);

  /**
   * Get the currently active tab
   */
  const getActiveTab = useCallback(() => {
    if (openTabs.length === 0 || activeTabIndex >= openTabs.length) {
      return null;
    }
    return openTabs[activeTabIndex];
  }, [openTabs, activeTabIndex]);

  /**
   * Create a new draft for a song
   * @param {string} songId - The song ID
   * @param {object} song - The song object (must include drafts array)
   * @param {string} currentContent - Content to initialize the draft with
   * @returns {object} - The created draft
   */
  const createDraft = useCallback((songId, song, currentContent = '') => {
    if (!song.drafts) {
      song.drafts = [];
    }

    // Check if max drafts reached
    if (song.drafts.length >= MAX_DRAFTS_PER_SONG) {
      alert(`Maximum of ${MAX_DRAFTS_PER_SONG} drafts per song reached`);
      return null;
    }

    // Generate draft name (Draft 1, Draft 2, etc.)
    const draftNumber = song.drafts.length + 1;
    const draftName = `Draft ${draftNumber}`;

    // Create draft object
    const draft = {
      id: `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: draftName,
      content: currentContent || song.content || '',
      timestamp: Date.now()
    };

    return draft;
  }, []);

  /**
   * Delete a draft from a song
   * @param {string} songId - The song ID
   * @param {string} draftId - The draft ID to delete
   */
  const deleteDraft = useCallback((songId, draftId) => {
    // Close any tabs with this draft
    setOpenTabs(prev => {
      const filtered = prev.filter(tab => !(tab.songId === songId && tab.draftId === draftId));
      // If active tab was closed, adjust activeTabIndex
      if (filtered.length < prev.length && activeTabIndex >= filtered.length) {
        setActiveTabIndex(Math.max(0, filtered.length - 1));
      }
      return filtered;
    });
  }, [activeTabIndex]);

  /**
   * Open a tab (song or draft)
   * @param {string} songId - The song ID
   * @param {string} draftId - The draft ID (null for main song)
   */
  const openTab = useCallback((songId, draftId = null) => {
    setOpenTabs(prev => {
      // Check if tab already open
      const existingIndex = prev.findIndex(
        tab => tab.songId === songId && tab.draftId === draftId
      );

      if (existingIndex !== -1) {
        // Tab already open, just switch to it
        setActiveTabIndex(existingIndex);
        return prev;
      }

      // Add new tab
      const newTabs = [...prev, { songId, draftId }];
      setActiveTabIndex(newTabs.length - 1); // Switch to new tab
      return newTabs;
    });
  }, []);

  /**
   * Close a tab
   * @param {number} tabIndex - Index of tab to close
   */
  const closeTab = useCallback((tabIndex) => {
    setOpenTabs(prev => {
      if (tabIndex < 0 || tabIndex >= prev.length) return prev;

      const newTabs = prev.filter((_, index) => index !== tabIndex);

      // Adjust active tab index
      if (activeTabIndex >= newTabs.length) {
        setActiveTabIndex(Math.max(0, newTabs.length - 1));
      } else if (activeTabIndex > tabIndex) {
        setActiveTabIndex(activeTabIndex - 1);
      }

      return newTabs;
    });
  }, [activeTabIndex]);

  /**
   * Switch to a specific tab
   * @param {number} tabIndex - Index of tab to switch to
   */
  const switchTab = useCallback((tabIndex) => {
    if (tabIndex >= 0 && tabIndex < openTabs.length) {
      setActiveTabIndex(tabIndex);
    }
  }, [openTabs.length]);

  /**
   * Close all tabs
   */
  const closeAllTabs = useCallback(() => {
    setOpenTabs([]);
    setActiveTabIndex(0);
  }, []);

  /**
   * Get tab display name
   * @param {object} tab - Tab object { songId, draftId }
   * @param {array} songs - Array of all songs
   * @returns {string} - Display name for the tab
   */
  const getTabDisplayName = useCallback((tab, songs) => {
    const song = songs.find(s => s.id === tab.songId);
    if (!song) return 'Unknown';

    if (tab.draftId) {
      const draft = song.drafts?.find(d => d.id === tab.draftId);
      return draft ? `${song.title} - ${draft.name}` : song.title;
    }

    return song.title;
  }, []);

  return {
    openTabs,
    activeTabIndex,
    getActiveTab,
    createDraft,
    deleteDraft,
    openTab,
    closeTab,
    switchTab,
    closeAllTabs,
    getTabDisplayName,
    MAX_DRAFTS_PER_SONG
  };
};

export default useDrafts;
