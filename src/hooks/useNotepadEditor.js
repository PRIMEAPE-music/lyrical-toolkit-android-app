import { useState, useCallback, useEffect, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { useNotepad } from './useNotepad';
import { useDrafts } from './useDrafts';

/**
 * Custom hook that extends notepad functionality with song-editing handlers.
 * Wraps useNotepad and useDrafts, adding all the song-editing operations
 * that previously lived in App.js.
 *
 * @param {Object} options
 * @param {Array} options.songs - Array of all songs
 * @param {Function} options.setSongs - State setter for songs
 * @param {string} options.storageType - 'local' or 'database'
 * @param {boolean} options.isAuthenticated - Whether user is authenticated
 * @param {Function} options.saveSongsToStorage - Function to persist songs
 */
export const useNotepadEditor = ({
  songs,
  setSongs,
  storageType,
  isAuthenticated,
  saveSongsToStorage
}) => {
  // Use the base notepad hook
  const notepadState = useNotepad();

  // Use the drafts hook
  const draftsHook = useDrafts();
  const {
    openTabs,
    activeTabIndex,
    getActiveTab,
    createDraft,
    deleteDraft,
    openTab,
    closeTab,
    switchTab,
    getTabDisplayName,
    updateTabSongId,
    MAX_DRAFTS_PER_SONG
  } = draftsHook;

  // Additional state for editor functionality
  const [originalSongContent, setOriginalSongContent] = useState('');
  // Store content for "new" tabs (songId: null) so it persists when switching
  const [newTabContent, setNewTabContent] = useState({ content: '', title: 'Untitled' });

  // Compute hasUnsavedChanges automatically
  const hasUnsavedChanges = useMemo(() => {
    return notepadState.currentEditingSongId &&
      originalSongContent !== '' &&
      (notepadState.content !== originalSongContent);
  }, [notepadState.currentEditingSongId, originalSongContent, notepadState.content]);

  // ====================================
  // NOTEPAD ACTION HANDLERS
  // ====================================

  /**
   * Export notepad content as a text file
   */
  const handleExportTxt = useCallback(() => {
    if (!notepadState.content.trim()) return;

    const blob = new Blob([notepadState.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${notepadState.title || 'Untitled'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [notepadState.content, notepadState.title]);

  /**
   * Create a new song from notepad content
   */
  const handleUploadToSongs = useCallback(async () => {
    if (!notepadState.content.trim()) return;

    // Should only create new song when NOT editing
    if (notepadState.currentEditingSongId) {
      console.error('handleUploadToSongs called while editing - this should not happen');
      return;
    }

    const sanitizedTitle = DOMPurify.sanitize(notepadState.title || 'Untitled');
    const sanitizedContent = DOMPurify.sanitize(notepadState.content);

    let newSong = {
      id: Date.now() + Math.random(),
      title: sanitizedTitle,
      lyrics: sanitizedContent,
      content: sanitizedContent, // Add content field for backend
      wordCount: sanitizedContent.split(/\s+/).filter(word => word.length > 0).length,
      dateAdded: new Date().toISOString(),
      filename: `${sanitizedTitle}.txt`,
      fromNotepad: true
    };

    try {
      if (storageType === 'database' && isAuthenticated) {
        // For database: Create only the new song via API (avoid duplicates)
        console.log('Creating new song in database...');
        const songsService = await import('../services/songsService');
        const createdSong = await songsService.createSong(null, {
          title: sanitizedTitle,
          content: sanitizedContent,
          filename: `${sanitizedTitle}.txt`
        });
        // Use the server-generated ID
        newSong = { ...newSong, ...createdSong };
        console.log('Song created in database with ID:', newSong.id);
      } else {
        // For local storage: Save the full updated array
        console.log('Saving new song to localStorage...');
        const updatedSongs = [newSong, ...songs];
        await saveSongsToStorage(updatedSongs);
        console.log('Song saved to localStorage');
      }

      // Update local state with the new song
      setSongs(prev => [newSong, ...prev]);

      // Update the current tab to point to the new song (instead of clearing)
      if (openTabs.length > 0) {
        updateTabSongId(activeTabIndex, newSong.id);
      }

      // Clear new tab content state since it's now a saved song
      setNewTabContent({ content: '', title: 'Untitled' });

      // Update notepad to show we're now editing this song
      notepadState.setCurrentEditingSongId(newSong.id);
      setOriginalSongContent(sanitizedContent);

    } catch (error) {
      console.error('Failed to upload song:', error);
      alert(`Failed to save song: ${error.message}`);
    }
  }, [
    notepadState.content,
    notepadState.title,
    notepadState.currentEditingSongId,
    notepadState.setCurrentEditingSongId,
    storageType,
    isAuthenticated,
    songs,
    setSongs,
    saveSongsToStorage,
    openTabs,
    activeTabIndex,
    updateTabSongId
  ]);

  /**
   * Save changes to an existing song (manual save - persists to storage)
   */
  const handleSaveChanges = useCallback(async () => {
    if (!notepadState.currentEditingSongId || !notepadState.content.trim()) return;

    try {
      const sanitizedTitle = DOMPurify.sanitize(notepadState.title);
      const sanitizedContent = DOMPurify.sanitize(notepadState.content);
      const originalSong = songs.find(song => song.id === notepadState.currentEditingSongId);
      const finalTitle = sanitizedTitle || (originalSong ? originalSong.title : '');

      // Build updated song
      const updatedSong = {
        ...originalSong,
        title: finalTitle,
        lyrics: sanitizedContent,
        content: sanitizedContent,
        wordCount: sanitizedContent.split(/\s+/).filter(word => word.length > 0).length,
        dateModified: new Date().toISOString()
      };

      // Update local state
      const updatedSongs = songs.map(song =>
        song.id === notepadState.currentEditingSongId ? updatedSong : song
      );
      setSongs(updatedSongs);

      // Persist to storage (both local and database modes)
      await saveSongsToStorage(updatedSongs);

      // Update notepad and original content with sanitized values
      notepadState.updateTitle(finalTitle);
      notepadState.updateContent(sanitizedContent);
      setOriginalSongContent(sanitizedContent);

      console.log('Song saved successfully');
      alert('Song saved successfully!');
    } catch (error) {
      console.error('Failed to save changes:', error);
      alert(`Failed to save changes: ${error.message}`);
    }
  }, [
    notepadState.currentEditingSongId,
    notepadState.content,
    notepadState.title,
    notepadState.updateTitle,
    notepadState.updateContent,
    songs,
    setSongs,
    saveSongsToStorage
  ]);

  /**
   * Revert to original content
   */
  const handleRevertChanges = useCallback(() => {
    if (!notepadState.currentEditingSongId || !originalSongContent) return;

    const confirmRevert = window.confirm('Are you sure you want to revert to the original content? All changes will be lost.');
    if (!confirmRevert) return;

    notepadState.updateContent(originalSongContent);

    // Find original song title
    const originalSong = songs.find(song => song.id === notepadState.currentEditingSongId);
    if (originalSong) {
      notepadState.updateTitle(originalSong.title);
    }
  }, [
    notepadState.currentEditingSongId,
    notepadState.updateContent,
    notepadState.updateTitle,
    originalSongContent,
    songs
  ]);

  // Forward declare handleSaveCurrentTab so it can be used by other handlers
  // This will be assigned the actual implementation below
  const handleSaveCurrentTabRef = { current: null };

  /**
   * Start fresh notepad content
   */
  const handleStartNewContent = useCallback(async () => {
    // Save current tab before creating new one
    if (openTabs.length > 0) {
      const currentTab = getActiveTab();
      if (currentTab?.songId === null) {
        // Save new tab content to state before creating another new tab
        setNewTabContent({
          content: notepadState.content,
          title: notepadState.title
        });
      } else if (notepadState.currentEditingSongId) {
        await handleSaveCurrentTabRef.current?.();
      }
    }

    // Check if a "new" tab already exists
    const existingNewTab = openTabs.findIndex(tab => tab.songId === null);
    if (existingNewTab !== -1) {
      // Switch to existing new tab instead of creating another
      switchTab(existingNewTab);
      notepadState.updateContent(newTabContent.content);
      notepadState.updateTitle(newTabContent.title);
      notepadState.setCurrentEditingSongId(null);
      setOriginalSongContent('');
    } else {
      // Create a new tab with songId: null (represents unsaved new content)
      openTab(null, null);

      // Reset new tab content state for fresh content
      setNewTabContent({ content: '', title: 'Untitled' });

      // Clear notepad for new content
      notepadState.updateContent('');
      notepadState.updateTitle('Untitled');
      notepadState.setCurrentEditingSongId(null);
      setOriginalSongContent('');
    }

    // Expand notepad if minimized
    if (notepadState.isMinimized) {
      notepadState.toggleMinimized();
    }
  }, [
    openTabs,
    getActiveTab,
    notepadState.content,
    notepadState.title,
    notepadState.currentEditingSongId,
    notepadState.isMinimized,
    notepadState.updateContent,
    notepadState.updateTitle,
    notepadState.setCurrentEditingSongId,
    notepadState.toggleMinimized,
    newTabContent,
    switchTab,
    openTab
  ]);

  /**
   * Load a song into notepad for editing
   */
  const handleEditSong = useCallback(async (song) => {
    // Save current tab before switching
    if (openTabs.length > 0) {
      await handleSaveCurrentTabRef.current?.();
    }

    // Open tab for this song (main, not draft)
    openTab(song.id, null);

    // Load song into notepad
    notepadState.updateContent(song.lyrics);
    notepadState.updateTitle(song.title);
    notepadState.setCurrentEditingSongId(song.id);
    setOriginalSongContent(song.lyrics);

    // Expand notepad if minimized
    if (notepadState.isMinimized) {
      notepadState.toggleMinimized();
    }

    // Auto-expand to show all buttons on desktop
    const isMobile = window.innerWidth <= 768;
    if (!isMobile && notepadState.dimensions.width < 520) {
      notepadState.updateDimensions({
        width: 520,
        height: Math.max(notepadState.dimensions.height, 350)
      });
    }
  }, [
    openTabs,
    openTab,
    notepadState.updateContent,
    notepadState.updateTitle,
    notepadState.setCurrentEditingSongId,
    notepadState.isMinimized,
    notepadState.toggleMinimized,
    notepadState.dimensions,
    notepadState.updateDimensions
  ]);

  // ====================================
  // DRAFT MANAGEMENT HANDLERS
  // ====================================

  /**
   * Save current tab content (for auto-save)
   * For database mode: only updates local state (no server sync) to prevent conflicts
   * For local mode: saves to localStorage
   */
  const handleSaveCurrentTab = useCallback(async () => {
    const activeTab = getActiveTab();
    if (!activeTab) return false;

    const { songId, draftId } = activeTab;

    // Don't try to save "new content" tabs (songId is null)
    if (songId === null) return false;

    const song = songs.find(s => s.id === songId);
    if (!song || !song.id) return false; // Don't save if song not found

    const currentContent = notepadState.content;
    const currentTitle = notepadState.title;

    if (draftId) {
      // Saving a draft
      const updatedSongs = songs.map(s => {
        if (s.id === songId) {
          return {
            ...s,
            drafts: s.drafts.map(d =>
              d.id === draftId
                ? { ...d, content: currentContent, timestamp: Date.now() }
                : d
            )
          };
        }
        return s;
      });
      setSongs(updatedSongs);
      // Only persist to storage for local mode - database requires manual save
      if (storageType !== 'database') {
        await saveSongsToStorage(updatedSongs);
      }
    } else {
      // Saving main song - calculate word/line counts locally for real-time UI updates
      const words = currentContent.split(/\s+/).filter(word => word.trim()).length;
      const lines = currentContent.split('\n').filter(line => line.trim()).length;

      const updatedSongs = songs.map(s =>
        s.id === songId
          ? {
              ...s,
              title: currentTitle,
              lyrics: currentContent,
              content: currentContent,
              wordCount: words,
              lineCount: lines
            }
          : s
      );
      setSongs(updatedSongs);
      // Only persist to storage for local mode - database requires manual save
      if (storageType !== 'database') {
        await saveSongsToStorage(updatedSongs);
      }
      setOriginalSongContent(currentContent);
    }

    return true;
  }, [getActiveTab, songs, notepadState.content, notepadState.title, setSongs, saveSongsToStorage, storageType]);

  // Assign the actual implementation to the ref for use by other handlers
  handleSaveCurrentTabRef.current = handleSaveCurrentTab;

  /**
   * Create a new draft
   */
  const handleCreateDraft = useCallback((song) => {
    if (!song.id) {
      alert('Please save the song first before creating drafts');
      return;
    }

    const draft = createDraft(song.id, song, song.content || song.lyrics);
    if (!draft) return;

    const updatedSongs = songs.map(s =>
      s.id === song.id
        ? { ...s, drafts: [...(s.drafts || []), draft] }
        : s
    );
    setSongs(updatedSongs);
    saveSongsToStorage(updatedSongs);

    // Open the new draft (inline implementation to avoid circular dependency)
    const updatedSong = updatedSongs.find(s => s.id === song.id);
    if (updatedSong) {
      openTab(song.id, draft.id);
      notepadState.updateContent(draft.content);
      notepadState.updateTitle(`${song.title} - ${draft.name}`);
      notepadState.setCurrentEditingSongId(song.id);
      setOriginalSongContent(draft.content);
      if (notepadState.isMinimized) {
        notepadState.toggleMinimized();
      }
    }
  }, [
    createDraft,
    songs,
    setSongs,
    saveSongsToStorage,
    openTab,
    notepadState.updateContent,
    notepadState.updateTitle,
    notepadState.setCurrentEditingSongId,
    notepadState.isMinimized,
    notepadState.toggleMinimized
  ]);

  /**
   * Delete a draft
   */
  const handleDeleteDraft = useCallback(async (songId, draftId) => {
    const confirmDelete = window.confirm('Delete this draft? This cannot be undone.');
    if (!confirmDelete) return;

    deleteDraft(songId, draftId);

    const updatedSongs = songs.map(s =>
      s.id === songId
        ? { ...s, drafts: (s.drafts || []).filter(d => d.id !== draftId) }
        : s
    );
    setSongs(updatedSongs);
    await saveSongsToStorage(updatedSongs);
  }, [deleteDraft, songs, setSongs, saveSongsToStorage]);

  /**
   * Open a draft in the notepad
   */
  const handleOpenDraft = useCallback(async (song, draft) => {
    // Save current tab before switching
    if (openTabs.length > 0) {
      await handleSaveCurrentTab();
    }

    // Open the tab
    openTab(song.id, draft.id);

    // Load draft content into notepad
    notepadState.updateContent(draft.content);
    notepadState.updateTitle(`${song.title} - ${draft.name}`);
    notepadState.setCurrentEditingSongId(song.id);
    setOriginalSongContent(draft.content);

    // Expand notepad if minimized
    if (notepadState.isMinimized) {
      notepadState.toggleMinimized();
    }
  }, [
    openTabs,
    handleSaveCurrentTab,
    openTab,
    notepadState.updateContent,
    notepadState.updateTitle,
    notepadState.setCurrentEditingSongId,
    notepadState.isMinimized,
    notepadState.toggleMinimized
  ]);

  /**
   * Switch between tabs
   */
  const handleSwitchTab = useCallback(async (tabIndex) => {
    // Get current tab before switching
    const currentTab = getActiveTab();

    // Save current content before switching
    if (currentTab) {
      if (currentTab.songId === null) {
        // Save new tab content to state
        setNewTabContent({
          content: notepadState.content,
          title: notepadState.title
        });
      } else if (notepadState.currentEditingSongId) {
        // Save existing song
        await handleSaveCurrentTab();
      }
    }

    // Switch to new tab
    switchTab(tabIndex);

    // Load the new tab's content
    const newActiveTab = openTabs[tabIndex];
    if (!newActiveTab) return;

    const { songId, draftId } = newActiveTab;

    // Handle "new content" tabs (songId is null)
    if (songId === null) {
      notepadState.updateContent(newTabContent.content);
      notepadState.updateTitle(newTabContent.title);
      notepadState.setCurrentEditingSongId(null);
      setOriginalSongContent('');
      return;
    }

    const song = songs.find(s => s.id === songId);
    if (!song) return;

    if (draftId) {
      // Loading a draft
      const draft = song.drafts?.find(d => d.id === draftId);
      if (draft) {
        notepadState.updateContent(draft.content);
        notepadState.updateTitle(`${song.title} - ${draft.name}`);
        setOriginalSongContent(draft.content);
      }
    } else {
      // Loading main song
      notepadState.updateContent(song.lyrics || song.content);
      notepadState.updateTitle(song.title);
      setOriginalSongContent(song.lyrics || song.content);
    }

    notepadState.setCurrentEditingSongId(songId);
  }, [
    handleSaveCurrentTab,
    switchTab,
    openTabs,
    songs,
    notepadState.content,
    notepadState.title,
    notepadState.currentEditingSongId,
    notepadState.updateContent,
    notepadState.updateTitle,
    notepadState.setCurrentEditingSongId,
    getActiveTab,
    newTabContent
  ]);

  /**
   * Close a tab
   */
  const handleCloseTab = useCallback(async (tabIndex) => {
    // Save before closing (only if editing an existing song)
    if (notepadState.currentEditingSongId) {
      await handleSaveCurrentTab();
    }

    // Close the tab
    closeTab(tabIndex);

    // If no tabs left, clear notepad
    if (openTabs.length <= 1) {
      notepadState.updateContent('');
      notepadState.updateTitle('Untitled');
      notepadState.setCurrentEditingSongId(null);
      setOriginalSongContent('');
    }
  }, [
    handleSaveCurrentTab,
    closeTab,
    openTabs,
    notepadState.currentEditingSongId,
    notepadState.updateContent,
    notepadState.updateTitle,
    notepadState.setCurrentEditingSongId
  ]);

  /**
   * Get display name for a tab
   */
  const getTabName = useCallback((tab) => {
    return getTabDisplayName(tab, songs);
  }, [getTabDisplayName, songs]);

  // ====================================
  // AUTO-SAVE EFFECT
  // ====================================

  // Auto-save logic - runs every 5 seconds (LOCAL STORAGE ONLY)
  // Database songs require manual save to prevent conflicts when editing on multiple devices
  useEffect(() => {
    if (openTabs.length === 0) return;

    // Skip auto-save for database storage to prevent overwriting changes from other devices
    if (storageType === 'database') return;

    const interval = setInterval(() => {
      handleSaveCurrentTab();
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [openTabs, handleSaveCurrentTab, storageType]);

  // ====================================
  // RETURN VALUES
  // ====================================

  return {
    // Base notepad state (spread all properties)
    ...notepadState,

    // Editor-specific state
    originalSongContent,
    newTabContent,
    hasUnsavedChanges,

    // Draft/Tab state from useDrafts
    openTabs,
    activeTabIndex,
    MAX_DRAFTS_PER_SONG,

    // Notepad action handlers
    handleExportTxt,
    handleUploadToSongs,
    handleSaveChanges,
    handleRevertChanges,
    handleStartNewContent,
    handleEditSong,

    // Draft management handlers
    handleSaveCurrentTab,
    handleCreateDraft,
    handleDeleteDraft,
    handleOpenDraft,
    handleSwitchTab,
    handleCloseTab,
    getTabName,

    // Expose low-level draft functions if needed
    getActiveTab,
    updateTabSongId
  };
};

export default useNotepadEditor;
