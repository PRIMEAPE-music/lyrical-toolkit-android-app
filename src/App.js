import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, Book, Shuffle, Music } from 'lucide-react';
import DOMPurify from 'dompurify';
import jsPDF from 'jspdf';

// Import utilities
import { 
  countSyllables, 
  calculateReadingLevel, 
  calculateVocabularyComplexity
} from './utils/textAnalysis';
import { analyzeRhymeStatistics } from './utils/phoneticUtils';
import { songVocabularyPhoneticMap } from './data/songVocabularyPhoneticMap';
import { saveUserSongs, clearUserSongs, saveExampleSongDeleted, loadAllSongs } from './utils/songStorage';
import audioStorageService from './services/audioStorageService';
import { deleteSong as deleteSongFromServer, updateSong as updateSongOnServer } from './services/songsService';
import * as authService from './services/authService';
// Import hooks
import { useSearchHistory, useDarkMode, useHighlightWord } from './hooks/useLocalStorage';
import { useFileUpload } from './hooks/useFileUpload';
import { useSearch } from './hooks/useSearch';
import { useNotepad } from './hooks/useNotepad';
import { AuthProvider, useAuth } from './hooks/useAuth';
import useScrollDirection from './hooks/useScrollDirection';
import useSwipeGestures from './hooks/useSwipeGestures';
import useDrafts from './hooks/useDrafts';

// Import components
import Header from './components/Header/Header';
import BottomNav from './components/Navigation/BottomNav';
import Manual from './components/Shared/Manual';
import MusicBanner from './components/Shared/MusicBanner';
import SongModal from './components/Shared/SongModal';
import SearchTab from './components/Tabs/SearchTab';
import DictionaryTab from './components/Tabs/DictionaryTab';
import SynonymsTab from './components/Tabs/SynonymsTab';
import RhymesTab from './components/Tabs/RhymesTab';
import AnalysisTab from './components/Tabs/AnalysisTab';
import AISettings from './components/Settings/AISettings';
import UploadTab from './components/Tabs/UploadTab';
import StatsTab from './components/Tabs/StatsTab';
import FloatingNotepad from './components/Notepad/FloatingNotepad';
import AuthModal from './components/AuthModal';

/* eslint-disable react-hooks/exhaustive-deps */

const LyricsSearchAppContent = () => {
  const { user, isAuthenticated, logout } = useAuth();

  // Mobile detection - More reliable for Capacitor
  const [isMobile, setIsMobile] = useState(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isCapacitor = window.Capacitor !== undefined;
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    const isMobileUA = isAndroid || isIOS;
    const isMobileDevice = width <= 768 || isCapacitor || isMobileUA;

    const debugInfo = {
      width,
      height,
      isCapacitor,
      isAndroid,
      isIOS,
      isMobileUA,
      isMobileDevice,
      userAgent: userAgent.substring(0, 50)
    };
    console.log('📱 MOBILE DETECTION INITIAL: ' + JSON.stringify(debugInfo, null, 2));

    return isMobileDevice;
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isCapacitor = window.Capacitor !== undefined;
      const isAndroid = /android/i.test(userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
      const isMobileUA = isAndroid || isIOS;
      const isMobileDevice = width <= 768 || isCapacitor || isMobileUA;

      console.log('📱 RESIZE: ' + JSON.stringify({ width, isCapacitor, isAndroid, isIOS, isMobileDevice }));
      setIsMobile(isMobileDevice);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll direction for collapsible header
  const scrollDirection = useScrollDirection(10);

  // Basic state
  const [songs, setSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedSong, setSelectedSong] = useState(null);
  const [storageType, setStorageType] = useState('local'); // 'local' or 'database'
  
  // Audio-related state
  const [selectedSongForAudio, setSelectedSongForAudio] = useState(null);
  const audioFileInputRef = useRef(null);
  const [audioUploadTargetSongId, setAudioUploadTargetSongId] = useState(null);

  // Swipe gestures for mobile tab switching
  const tabOrder = ['search', 'dictionary', 'upload', 'rhymes', 'stats'];

  const handleSwipeLeft = () => {
    if (!isMobile) return;
    const currentIndex = tabOrder.indexOf(activeTab);
    // Don't swipe if we're on a tab not in the swipe order (synonyms, analysis, settings)
    if (currentIndex === -1) return;
    if (currentIndex < tabOrder.length - 1) {
      setActiveTab(tabOrder[currentIndex + 1]);
    }
  };

  const handleSwipeRight = () => {
    if (!isMobile) return;
    const currentIndex = tabOrder.indexOf(activeTab);
    // Don't swipe if we're on a tab not in the swipe order (synonyms, analysis, settings)
    if (currentIndex === -1) return;
    if (currentIndex > 0) {
      setActiveTab(tabOrder[currentIndex - 1]);
    }
  };

  useSwipeGestures(handleSwipeLeft, handleSwipeRight, 75); // Increased from 50 to 75 (50% less sensitive)

  // Use custom hooks for localStorage
  const [searchHistory, setSearchHistory] = useSearchHistory();
  const [darkMode, setDarkMode] = useDarkMode();
  const [highlightWord, setHighlightWord] = useHighlightWord();
  
  // Dictionary API states
  const [definitionQuery, setDefinitionQuery] = useState('');
  const [definitionResults, setDefinitionResults] = useState(null);
  const [definitionLoading, setDefinitionLoading] = useState(false);
  
  // Synonyms API states
  const [synonymQuery, setSynonymQuery] = useState('');
  const [synonymResults, setSynonymResults] = useState(null);
  const [synonymLoading, setSynonymLoading] = useState(false);
  
  // Rhymes API states
  const [rhymeQuery, setRhymeQuery] = useState('');
  const [rhymeResults, setRhymeResults] = useState(null);
  const [rhymeLoading, setRhymeLoading] = useState(false);

  // Analysis states
  const [analysisResults, setAnalysisResults] = useState(null);
  const [analysisType, setAnalysisType] = useState(null);
  const [selectedSongForAnalysis, setSelectedSongForAnalysis] = useState(null);

  // Manual states
  const [showManual, setShowManual] = useState(false);
  // Stats filter
  const [selectedStatsFilter, setSelectedStatsFilter] = useState('all');

  // Helper function to save and reload songs (storage-aware)
  const saveAndReloadSongs = async (songsToSave = null) => {
    try {
      const actualSongs = songsToSave || songs;
      console.log('💾 Saving', actualSongs.length, 'songs to', storageType, '...');

      if (storageType === 'database' && isAuthenticated) {
        // Save to database via API
        const songsService = await import('./services/songsService');
        await songsService.saveSongs(actualSongs);
        console.log('✅ Songs saved to database, reloading...');
      } else {
        // Save to local storage
        await saveUserSongs(actualSongs);
        console.log('✅ Songs saved to localStorage, reloading...');
      }

      // Reload from appropriate storage
      const allSongs = await loadAllSongs(isAuthenticated, storageType);
      setSongs(allSongs);
      console.log('✅ Reloaded', allSongs.length, 'songs from', storageType);
    } catch (error) {
      console.error('❌ Failed to save/reload songs:', error);
    }
  };

  // Storage-aware save function (doesn't reload, just saves)
  const saveSongsToStorage = async (songsToSave) => {
    try {
      if (storageType === 'database' && isAuthenticated) {
        // For database mode, update each changed song individually
        // This is more efficient than re-uploading everything
        console.log('💾 Saving songs to database...');
        for (const song of songsToSave) {
          if (song.isExample) continue; // Skip example songs
          try {
            await updateSongOnServer(song.id, {
              title: song.title,
              content: song.lyrics || song.content,
              filename: song.filename,
              // Include drafts in the update
              drafts: song.drafts || []
            });
          } catch (err) {
            console.warn(`Failed to update song ${song.id} on server:`, err.message);
          }
        }
        console.log('✅ Songs saved to database');
      } else {
        // Save to local storage
        await saveUserSongs(songsToSave);
        console.log('✅ Songs saved to localStorage');
      }
    } catch (error) {
      console.error('❌ Failed to save songs:', error);
    }
  };

  // File upload hook - don't pass callback, we'll handle it differently
  const fileUploadHook = useFileUpload(songs, setSongs);  
  // Search hook
  const { searchResults } = useSearch(songs, searchQuery, highlightWord);

  //Notepad hook
  const notepadState = useNotepad();
  const [originalSongContent, setOriginalSongContent] = useState('');
  // Store content for "new" tabs (songId: null) so it persists when switching
  const [newTabContent, setNewTabContent] = useState({ content: '', title: 'Untitled' });

  // Draft management hook
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

  // Calculate if there are unsaved changes - moved to top to avoid initialization issues
  const hasUnsavedChanges = notepadState.currentEditingSongId && 
    originalSongContent !== '' &&
    (notepadState.content !== originalSongContent);

  // Load example song only when needed
  const [userSongsLoaded, setUserSongsLoaded] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleLogout = async () => {
    await logout();
    setSongs([]);
    setUserSongsLoaded(false);
    setShowAuthModal(false);
  };
  
  // Load songs when authentication state changes or storage type changes
  useEffect(() => {
    const loadSongs = async () => {
      try {
        isReloadingRef.current = true;
        console.log('🔄 Loading songs, authenticated:', isAuthenticated, 'storageType:', storageType);
        const allSongs = await loadAllSongs(isAuthenticated, storageType);
        setSongs(allSongs);
        console.log('✅ Loaded', allSongs.length, 'songs from', storageType);
      } catch (error) {
        console.error('Failed to load songs:', error);
      } finally {
        // Allow auto-save again after a brief delay
        setTimeout(() => {
          isReloadingRef.current = false;
        }, 500);
      }
    };

    loadSongs();
  }, [isAuthenticated, storageType]); // Reload whenever auth state or storage type changes

  // Sync notepad content with database when songs are loaded
  // This prevents stale content from overwriting newer database versions
  useEffect(() => {
    // Only check in database mode when we have songs and notepad is editing something
    if (storageType !== 'database' || !isAuthenticated) return;
    if (songs.length === 0) return;
    if (!notepadState.currentEditingSongId) return;

    const editingSong = songs.find(s => s.id === notepadState.currentEditingSongId);
    if (!editingSong) {
      // Song was deleted or doesn't exist - clear notepad editing state
      console.log('⚠️ Notepad was editing a song that no longer exists, clearing...');
      notepadState.setCurrentEditingSongId(null);
      notepadState.updateContent('');
      notepadState.updateTitle('Untitled');
      return;
    }

    const dbContent = editingSong.lyrics || editingSong.content || '';
    const notepadContent = notepadState.content || '';

    // Compare content (normalize whitespace for comparison)
    const normalizedDb = dbContent.trim();
    const normalizedNotepad = notepadContent.trim();

    if (normalizedDb !== normalizedNotepad && normalizedNotepad !== '') {
      // Content differs - database has a different version
      console.log('⚠️ Notepad content differs from database version');

      // Show confirmation to user
      const useDatabase = window.confirm(
        `The song "${editingSong.title}" has been updated on another device or browser.\n\n` +
        `Your local notepad has a different version.\n\n` +
        `Click OK to load the latest version from the database.\n` +
        `Click Cancel to keep your local version (you can save it to overwrite the database).`
      );

      if (useDatabase) {
        // Update notepad with database content
        notepadState.updateContent(dbContent);
        notepadState.updateTitle(editingSong.title);
        setOriginalSongContent(dbContent);
        console.log('✅ Notepad synced with database version');
      } else {
        // User wants to keep local version - mark as having changes
        console.log('📝 Keeping local notepad version (user can save to overwrite)');
      }
    } else if (normalizedNotepad === '' && normalizedDb !== '') {
      // Notepad is empty but song has content - likely a fresh load, sync silently
      notepadState.updateContent(dbContent);
      notepadState.updateTitle(editingSong.title);
      setOriginalSongContent(dbContent);
    }
  }, [songs, storageType, isAuthenticated]); // Only run when songs change, not on every notepad change

  // Reset stats filter when songs change
  useEffect(() => {
    if (songs.length === 0) {
      setSelectedStatsFilter('all');
    } else if (selectedStatsFilter !== 'all') {
      const selectedSongExists = songs.some(song => song.id.toString() === selectedStatsFilter);
      if (!selectedSongExists) {
        setSelectedStatsFilter('all');
      }
    }
  }, [songs, selectedStatsFilter]);

  // Use ref to track if we're currently reloading to prevent infinite loop
  const isReloadingRef = useRef(false);
  const isSwitchingStorageRef = useRef(false);

  // Save songs to localStorage when they change (ONLY for local storage mode)
  useEffect(() => {
    // CRITICAL FIX: Only auto-save to localStorage when in local storage mode
    if (storageType !== 'local') {
      console.log('⏭️ Skipping auto-save: not in local storage mode');
      return;
    }

    // Skip auto-save if we're reloading, switching storage, or no songs
    // This prevents database songs from being copied to localStorage when switching tabs
    if (songs.length === 0 || isReloadingRef.current || isSwitchingStorageRef.current) {
      return;
    }

    // Skip if only example song exists
    const userSongs = songs.filter(s => !s.isExample);
    if (userSongs.length === 0) {
      return;
    }

    // Use longer debounce for database to reduce API calls
    const debounceTime = (storageType === 'database' && isAuthenticated) ? 5000 : 2000;

    const timeoutId = setTimeout(async () => {
      // Double-check we're not switching storage
      if (isSwitchingStorageRef.current) {
        console.log('⏭️ Skipping auto-save: storage switching in progress');
        return;
      }
      try {
        console.log(`💾 Auto-saving songs to ${storageType}...`);
        await saveSongsToStorage(songs);
        console.log('✅ Auto-save complete');
      } catch (error) {
        console.error('❌ Auto-save failed:', error);
      }
    }, debounceTime);

    return () => clearTimeout(timeoutId);
  }, [songs, storageType, isAuthenticated]);

  // Debug token expiration issues
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkTokenHealth = () => {
      const token = authService.getAccessToken();
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const now = Date.now() / 1000;
          const timeUntilExpiry = payload.exp - now;

          if (timeUntilExpiry < 300) { // Less than 5 minutes
            console.log(`⚠️ Token expires in ${Math.floor(timeUntilExpiry)} seconds`);
          }
        } catch (error) {
          console.error('Failed to parse token:', error);
        }
      }
    };

    // Check token health every 5 minutes (reduced from 1 minute to prevent memory buildup)
    const interval = setInterval(checkTokenHealth, 300000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Enhanced statistics with song filtering
  const stats = useMemo(() => {
    const filteredSongs = selectedStatsFilter === 'all' 
      ? songs 
      : songs.filter(song => song.id.toString() === selectedStatsFilter);
    
    if (filteredSongs.length === 0) {
      return {
        totalSongs: 0,
        totalWords: 0,
        uniqueWords: 0,
        mostUsedWords: [],
        syllableDistribution: {},
        wordLengthDistribution: {},
        averageWordsPerSong: 0,
        averageLinesPerSong: 0,
        averageWordLength: 0,
        averageSyllablesPerWord: 0,
        totalLines: 0,
        readingLevel: 0,
        vocabularyComplexity: 0,
        rhymeStats: {
          totalRhymableWords: 0,
          perfectRhymes: 0,
          nearRhymes: 0,
          soundsLike: 0,
          internalRhymes: 0,
          rhymeDensity: 0,
          allRhymeGroups: []
        }
      };
    }

    // Calculate basic metrics first
    const totalWords = filteredSongs.reduce((sum, song) => sum + song.wordCount, 0);
    const allWords = filteredSongs.flatMap(song => 
      song.lyrics.toLowerCase().split(/\s+/).filter(word => word.match(/[a-zA-Z]/))
    );
    
    const wordFreq = {};
    const syllableCount = {};
    const wordLengthCount = {};
    let totalSyllables = 0;
    let totalCharacters = 0;
    let validWordCount = 0;

    allWords.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 0) {
        validWordCount++;
        totalCharacters += cleanWord.length;
        
        if (cleanWord.length > 2) {
          wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
        }
        
        const syllables = countSyllables(cleanWord);
        totalSyllables += syllables;
        const syllableKey = syllables > 4 ? '5+' : syllables.toString();
        syllableCount[syllableKey] = (syllableCount[syllableKey] || 0) + 1;
        
        const lengthKey = cleanWord.length > 10 ? '11+' : cleanWord.length.toString();
        wordLengthCount[lengthKey] = (wordLengthCount[lengthKey] || 0) + 1;
      }
    });

    const mostUsedWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    const allLines = filteredSongs.flatMap(song => 
      song.lyrics.split('\n').filter(line => line.trim().length > 0)
    );
    const totalLines = allLines.length;

    const avgReadingLevel = filteredSongs.length > 0 ? 
      filteredSongs.reduce((sum, song) => sum + calculateReadingLevel(song.lyrics), 0) / filteredSongs.length : 0;
    
    const avgVocabularyComplexity = filteredSongs.length > 0 ? 
      filteredSongs.reduce((sum, song) => sum + calculateVocabularyComplexity(song.lyrics, wordFreq), 0) / filteredSongs.length : 0;
    
    // Calculate rhyme statistics
    const combinedRhymeStats = filteredSongs.length > 0 ? 
      filteredSongs.reduce((acc, song) => {
        const songRhymes = analyzeRhymeStatistics(song.lyrics, songVocabularyPhoneticMap);
        return {
          totalRhymableWords: acc.totalRhymableWords + songRhymes.totalRhymableWords,
          perfectRhymes: acc.perfectRhymes + songRhymes.perfectRhymes,
          nearRhymes: acc.nearRhymes + songRhymes.nearRhymes,
          soundsLike: acc.soundsLike + songRhymes.soundsLike,
          internalRhymes: acc.internalRhymes + songRhymes.internalRhymes,
          rhymeDensity: acc.rhymeDensity + songRhymes.rhymeDensity,
          allRhymeGroups: [...acc.allRhymeGroups, ...songRhymes.rhymeGroups]
        };
      }, {
        totalRhymableWords: 0,
        perfectRhymes: 0,
        nearRhymes: 0,
        soundsLike: 0,
        internalRhymes: 0,
        rhymeDensity: 0,
        allRhymeGroups: []
      }) : {
        totalRhymableWords: 0,
        perfectRhymes: 0,
        nearRhymes: 0,
        soundsLike: 0,
        internalRhymes: 0,
        rhymeDensity: 0,
        allRhymeGroups: []
      };

    if (filteredSongs.length > 1) {
      combinedRhymeStats.rhymeDensity = combinedRhymeStats.rhymeDensity / filteredSongs.length;
    }

    return {
      totalSongs: filteredSongs.length,
      totalWords,
      uniqueWords: Object.keys(wordFreq).length,
      mostUsedWords,
      syllableDistribution: syllableCount,
      wordLengthDistribution: wordLengthCount,
      averageWordsPerSong: filteredSongs.length > 0 ? Math.round(totalWords / filteredSongs.length) : 0,
      averageLinesPerSong: filteredSongs.length > 0 ? Math.round(totalLines / filteredSongs.length) : 0,
      averageWordLength: validWordCount > 0 ? (totalCharacters / validWordCount).toFixed(1) : 0,
      averageSyllablesPerWord: validWordCount > 0 ? (totalSyllables / validWordCount).toFixed(1) : 0,
      totalLines,
      readingLevel: avgReadingLevel,
      vocabularyComplexity: avgVocabularyComplexity,
      rhymeStats: combinedRhymeStats
    };
  }, [songs, selectedStatsFilter]);

  // Add to search history
  const addToSearchHistory = (query) => {
    if (query.trim() && !searchHistory.includes(query)) {
      const newHistory = [query, ...searchHistory.slice(0, 9)];
      setSearchHistory(newHistory);
    }
  };

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      addToSearchHistory(query);
      setHighlightWord(query);
    }
  };

  // Delete individual song
  // Handle storage type change
  const handleStorageTypeChange = async (newStorageType) => {
    // Prevent rapid switching
    if (isSwitchingStorageRef.current) {
      console.log('⏸️ Storage switch already in progress, ignoring...');
      return;
    }

    if (newStorageType === 'database' && !isAuthenticated) {
      alert('Please log in to use database storage');
      return;
    }

    if (newStorageType === storageType) {
      console.log('⏭️ Already on', storageType, 'storage');
      return;
    }

    try {
      isSwitchingStorageRef.current = true;
      console.log('🔄 Switching storage type from', storageType, 'to', newStorageType);
      setStorageType(newStorageType);

      // Songs will automatically reload via useEffect dependency on storageType
    } finally {
      // Add a longer delay before allowing another switch and auto-save
      // This prevents database songs from being copied to localStorage
      setTimeout(() => {
        isSwitchingStorageRef.current = false;
      }, 3000);
    }
  };

  // Transfer song between storage types
  const handleTransferSong = async (song) => {
    const targetStorage = storageType === 'local' ? 'database' : 'local';

    // Check authentication for database transfer
    if (targetStorage === 'database' && !isAuthenticated) {
      alert('Please log in to transfer songs to the database');
      return;
    }

    // Confirm transfer
    const confirmMessage = `Transfer "${song.title}" to ${targetStorage === 'database' ? 'Database (Cloud)' : 'Local Storage'}?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      console.log(`🔄 Transferring song "${song.title}" from ${storageType} to ${targetStorage}`);

      // Save to target storage
      if (targetStorage === 'database') {
        const songsService = await import('./services/songsService');
        await songsService.createSong(null, {
          title: song.title,
          content: song.lyrics || song.content,
          filename: song.filename
        });
        console.log('✅ Song saved to database');
      } else {
        // Save to local storage
        const songStorageModule = await import('./utils/songStorage');
        const currentLocalSongs = await songStorageModule.loadUserSongs(false);
        const newSong = {
          ...song,
          id: Date.now() + Math.random(), // Generate new ID for local storage
          dateAdded: new Date().toISOString()
        };
        await saveUserSongs([...currentLocalSongs, newSong]);
        console.log('✅ Song saved to localStorage');
      }

      // Success message
      alert(`✅ Song "${song.title}" copied to ${targetStorage === 'database' ? 'Database' : 'Local Storage'}!\n\nNote: The original remains in ${storageType}. Switch tabs to see the copy, or delete the original if you want to move it completely.`);

    } catch (error) {
      console.error('❌ Failed to transfer song:', error);
      alert(`Failed to transfer song: ${error.message}`);
    }
  };

  const deleteSong = async (songId) => {
    // Add confirmation dialog
    const confirmDelete = window.confirm('Are you sure you want to delete this song? This cannot be undone.');
    if (!confirmDelete) return;

    // Store original songs for rollback if needed
    const originalSongs = [...songs];

    try {
      // Optimistically remove from UI first
      const songToDelete = songs.find(song => song.id === songId);
      if (songToDelete && songToDelete.isExample) {
        saveExampleSongDeleted(true);
      }

      // Calculate updated songs list
      const updatedSongs = songs.filter(song => song.id !== songId);
      setSongs(updatedSongs);

      // Also delete associated audio file from IndexedDB if it exists
      if (songToDelete && songToDelete.audioFileUrl && songToDelete.audioFileUrl.startsWith('indexeddb://')) {
        try {
          console.log('🗑️ Deleting associated audio file from IndexedDB...');
          await audioStorageService.deleteAudioFile(songId);
          console.log('✅ Audio file deleted from IndexedDB');
        } catch (audioError) {
          console.warn('⚠️ Could not delete audio file:', audioError);
          // Don't fail the whole operation if audio delete fails
        }
      }

      // Delete from appropriate storage
      if (storageType === 'database' && isAuthenticated) {
        console.log('🗑️ Deleting song from database with ID:', songId);
        await deleteSongFromServer(songId);
        console.log('✅ Song deleted from database');
      } else {
        // Save to localStorage after delete
        console.log('💾 Saving songs to localStorage after delete...');
        await saveUserSongs(updatedSongs);
        console.log('✅ Songs saved to localStorage');
      }
    } catch (error) {
      console.error('❌ Error deleting song:', error);

      // Show specific error message
      const errorMessage = error.message || 'Unknown error occurred';
      alert(`Failed to delete song: ${errorMessage}\n\nThe song has been restored.`);

      // Rollback - restore the song
      setSongs(originalSongs);

      // Reload from appropriate storage to ensure sync
      try {
        const allSongs = await loadAllSongs(isAuthenticated, storageType);
        setSongs(allSongs);
      } catch (reloadError) {
        console.error('Failed to reload songs after delete error:', reloadError);
      }
    }
  };

  // Delete all songs
  const deleteAllSongs = async () => {
    if (window.confirm('Are you sure you want to delete ALL songs? This cannot be undone.')) {
      try {
        setSongs([]);
        setSearchQuery('');
        setHighlightWord('');
        setSearchHistory([]);

        // Clear all audio files from IndexedDB
        try {
          await audioStorageService.clearAllAudioFiles();
          console.log('✅ Audio files cleared from IndexedDB');
        } catch (audioError) {
          console.warn('⚠️ Could not clear audio files:', audioError);
          // Don't fail the whole operation
        }

        // Clear from appropriate storage
        if (storageType === 'database' && isAuthenticated) {
          const songsService = await import('./services/songsService');
          await songsService.clearAllSongs();
          console.log('✅ Songs cleared from database');
        } else {
          await clearUserSongs();
          console.log('✅ Songs cleared from localStorage');
        }

        saveExampleSongDeleted(false); // Reset so example can load again
      } catch (error) {
        console.error('❌ Error deleting all songs:', error);
        alert('Failed to delete all songs. Please try again.');
      }
    }
  };

  // Dictionary API functions
  const searchDefinition = async (word) => {
    if (!word.trim()) return;
    
    setDefinitionLoading(true);
    setHighlightWord(word);
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
      if (response.ok) {
        const data = await response.json();
        setDefinitionResults(data);
      } else {
        setDefinitionResults([]);
      }
    } catch (error) {
      console.error('Definition API error:', error);
      setDefinitionResults([]);
    }
    setDefinitionLoading(false);
  };

  // Enhanced DataMuse API for synonyms with multiple antonym sources
  const searchSynonyms = async (word) => {
    if (!word.trim()) return;
    
    setSynonymLoading(true);
    setHighlightWord(word);
    try {
      const [synonymsResponse, antonymsResponse, relatedResponse] = await Promise.all([
        fetch(`https://api.datamuse.com/words?rel_syn=${word.toLowerCase()}&max=20`),
        fetch(`https://api.datamuse.com/words?rel_ant=${word.toLowerCase()}&max=20`),
        fetch(`https://api.datamuse.com/words?ml=${word.toLowerCase()}&max=30`)
      ]);
      
      const synonyms = synonymsResponse.ok ? await synonymsResponse.json() : [];
      let antonyms = antonymsResponse.ok ? await antonymsResponse.json() : [];
      const related = relatedResponse.ok ? await relatedResponse.json() : [];
      
      if (antonyms.length < 5) {
        const antonymPatterns = ['un', 'non', 'dis', 'in', 'im', 'ir', 'anti'];
        const moreAntonyms = related.filter(relatedWord => {
          const wordLower = relatedWord.word.toLowerCase();
          const searchLower = word.toLowerCase();
          
          return antonymPatterns.some(prefix => 
            wordLower.startsWith(prefix + searchLower) || 
            searchLower.startsWith(prefix + wordLower)
          );
        });
        
        const allAntonyms = [...antonyms, ...moreAntonyms];
        antonyms = allAntonyms.filter((item, index, self) => 
          index === self.findIndex(t => t.word === item.word)
        ).slice(0, 15);
      }
      
      setSynonymResults({ synonyms, antonyms });
    } catch (error) {
      console.error('Synonyms API error:', error);
      setSynonymResults({ synonyms: [], antonyms: [] });
    }
    setSynonymLoading(false);
  };

  // DataMuse API for rhymes
  const searchRhymes = async (word) => {
    if (!word.trim()) return;
    
    setRhymeLoading(true);
    setHighlightWord(word);
    try {
      const [perfectResponse, nearResponse, soundsLikeResponse] = await Promise.all([
        fetch(`https://api.datamuse.com/words?rel_rhy=${word.toLowerCase()}&max=30`),
        fetch(`https://api.datamuse.com/words?rel_nry=${word.toLowerCase()}&max=20`),
        fetch(`https://api.datamuse.com/words?sl=${word.toLowerCase()}&max=20`)
      ]);
      
      const perfect = perfectResponse.ok ? await perfectResponse.json() : [];
      const near = nearResponse.ok ? await nearResponse.json() : [];
      const soundsLike = soundsLikeResponse.ok ? await soundsLikeResponse.json() : [];
      
      setRhymeResults({ perfect, near, soundsLike });
    } catch (error) {
      console.error('Rhymes API error:', error);
      setRhymeResults({ perfect: [], near: [], soundsLike: [] });
    }
    setRhymeLoading(false);
  };

  // Enhanced search function with custom routing and auto-search
  const searchInLyrics = (word, targetTab = 'search') => {
    setSearchQuery(word);
    setHighlightWord(word);
    setActiveTab(targetTab);
    addToSearchHistory(word);
    
    if (targetTab === 'dictionary') {
      setDefinitionQuery(word);
      setTimeout(() => searchDefinition(word), 100);
    } else if (targetTab === 'synonyms') {
      setSynonymQuery(word);
      setTimeout(() => searchSynonyms(word), 100);
    } else if (targetTab === 'rhymes') {
      setRhymeQuery(word);
      setTimeout(() => searchRhymes(word), 100);
    }
  };

  // Add these new functions here
  const handleExportTxt = () => {
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
  };

  const handleUploadToSongs = async () => {
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
        console.log('💾 Creating new song in database...');
        const songsService = await import('./services/songsService');
        const createdSong = await songsService.createSong(null, {
          title: sanitizedTitle,
          content: sanitizedContent,
          filename: `${sanitizedTitle}.txt`
        });
        // Use the server-generated ID
        newSong = { ...newSong, ...createdSong };
        console.log('✅ Song created in database with ID:', newSong.id);
      } else {
        // For local storage: Save the full updated array
        console.log('💾 Saving new song to localStorage...');
        const updatedSongs = [newSong, ...songs];
        await saveUserSongs(updatedSongs);
        console.log('✅ Song saved to localStorage');
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
      console.error('❌ Failed to upload song:', error);
      alert(`Failed to save song: ${error.message}`);
    }
  };

  const handleSaveChanges = async () => {
    if (!notepadState.currentEditingSongId || !notepadState.content.trim()) return;
    
    try {
      const sanitizedTitle = DOMPurify.sanitize(notepadState.title);
      const sanitizedContent = DOMPurify.sanitize(notepadState.content);
      const originalSong = songs.find(song => song.id === notepadState.currentEditingSongId);

      // Update local state
      setSongs(prev => prev.map(song => {
        if (song.id === notepadState.currentEditingSongId) {
          const finalTitle = sanitizedTitle || song.title;
          return {
            ...song,
            title: finalTitle,
            lyrics: sanitizedContent,
            wordCount: sanitizedContent.split(/\s+/).filter(word => word.length > 0).length,
            dateModified: new Date().toISOString()
          };
        }
        return song;
      }));

      const finalTitle = sanitizedTitle || (originalSong ? originalSong.title : '');

      // Update notepad and original content with sanitized values
      notepadState.updateTitle(finalTitle);
      notepadState.updateContent(sanitizedContent);
      setOriginalSongContent(sanitizedContent);

      console.log('💾 Song saved successfully to local state');
      alert('Song saved successfully!');
    } catch (error) {
      console.error('❌ Failed to save changes:', error);
      alert(`Failed to save changes: ${error.message}`);
    }
  };

  const handleRevertChanges = () => {
    if (!notepadState.currentEditingSongId || !originalSongContent) return;
    
    const confirmRevert = window.confirm('Are you sure you want to revert to the original content? All changes will be lost.');
    if (!confirmRevert) return;
    
    notepadState.updateContent(originalSongContent);
    
    // Find original song title
    const originalSong = songs.find(song => song.id === notepadState.currentEditingSongId);
    if (originalSong) {
      notepadState.updateTitle(originalSong.title);
    }
  };

  const handleStartNewContent = async () => {
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
        await handleSaveCurrentTab();
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
  };

  const handleExportSongTxt = (song) => {
    const blob = new Blob([song.lyrics], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${song.title}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportSongPdf = async (song) => {
    try {
      const pdf = new jsPDF();
      
      // Add title
      pdf.setFontSize(16);
      pdf.text(song.title, 20, 20);
      
      // Add lyrics
      pdf.setFontSize(12);
      const splitText = pdf.splitTextToSize(song.lyrics, 170);
      pdf.text(splitText, 20, 40);
      
      pdf.save(`${song.title}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const handleEditSong = async (song) => {
    // Save current tab before switching
    if (openTabs.length > 0) {
      await handleSaveCurrentTab();
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
  };

  // ====================================
  // DRAFT MANAGEMENT HANDLERS
  // ====================================

  // Save current tab content (for auto-save)
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
      await saveSongsToStorage(updatedSongs);
    } else {
      // Saving main song
      const updatedSongs = songs.map(s =>
        s.id === songId
          ? { ...s, title: currentTitle, lyrics: currentContent, content: currentContent }
          : s
      );
      setSongs(updatedSongs);
      await saveSongsToStorage(updatedSongs);
      setOriginalSongContent(currentContent);
    }

    return true;
  }, [getActiveTab, songs, notepadState.content, notepadState.title, setSongs, saveSongsToStorage]);

  // Create a new draft
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

    // Open the new draft
    handleOpenDraft(updatedSongs.find(s => s.id === song.id), draft);
  }, [createDraft, songs, setSongs, saveSongsToStorage]);

  // Delete a draft
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

  // Open a draft in the notepad
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
  }, [openTabs, handleSaveCurrentTab, openTab, notepadState]);

  // Handle tab switching
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
  }, [handleSaveCurrentTab, switchTab, openTabs, songs, notepadState, getActiveTab, newTabContent]);

  // Handle tab closing
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
  }, [handleSaveCurrentTab, closeTab, openTabs, notepadState]);

  // Auto-save logic - runs every 5 seconds (reduced from 3 to prevent memory buildup)
  useEffect(() => {
    if (openTabs.length === 0) return;

    const interval = setInterval(() => {
      handleSaveCurrentTab();
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [openTabs, handleSaveCurrentTab]);

  // Get tab display name helper
  const getTabName = useCallback((tab) => {
    return getTabDisplayName(tab, songs);
  }, [getTabDisplayName, songs]);

  // ====================================
  // AUDIO HANDLERS
  // ====================================

  const handleAudioUpload = async (songId, audioData) => {
    console.log('🎵 === AUDIO UPLOAD HANDLER START ===');
    console.log('📄 Song ID:', songId);
    console.log('📊 Audio data received:', audioData);
    
    try {
      // CRITICAL: Validate that the upload actually succeeded
      if (!audioData || !audioData.audioUrl) {
        throw new Error('Invalid audio data - no URL provided');
      }

      // For IndexedDB storage, verify the file was saved by checking if it exists
      console.log('🔍 Verifying uploaded file exists...');
      if (audioData.audioUrl.startsWith('indexeddb://')) {
        // IndexedDB URL - verify by trying to retrieve the audio
        try {
          const blobUrl = await audioStorageService.getAudioBlobURL(songId);
          if (blobUrl) {
            URL.revokeObjectURL(blobUrl); // Clean up test blob URL
            console.log('✅ File verified in IndexedDB');
          } else {
            throw new Error('File not found in IndexedDB');
          }
        } catch (error) {
          console.error('❌ IndexedDB verification failed:', error);
          throw new Error(`Upload verification failed: ${error.message}`);
        }
      } else {
        // HTTP URL - verify by fetching
        try {
          const testResponse = await fetch(audioData.audioUrl, { method: 'HEAD' });
          if (!testResponse.ok) {
            throw new Error(`Uploaded file not accessible: ${testResponse.status}`);
          }
          console.log('✅ File verified as accessible');
        } catch (error) {
          console.error('❌ File verification failed:', error);
          throw new Error(`Upload verification failed: ${error.message}`);
        }
      }
      
      // Only update local state AFTER verifying the upload succeeded
      console.log('🔄 Updating local song state...');
      const updatedSongs = songs.map(song => {
        if (song.id === songId) {
          return {
            ...song,
            audioFileUrl: audioData.audioUrl,
            audioFileName: audioData.filename,
            audioFileSize: audioData.size,
            audioDuration: audioData.duration
          };
        }
        return song;
      });
      
      setSongs(updatedSongs);
      console.log('✅ Local state updated');

      // Save to appropriate storage (localStorage or database)
      console.log(`🔄 Saving songs to ${storageType}...`);
      try {
        await saveSongsToStorage(updatedSongs);
        console.log('✅ Successfully saved to storage');
      } catch (saveError) {
        console.error('❌ Save failed:', saveError);

        // Revert local state if save fails
        console.log('🔄 Reverting local state due to save error...');
        setSongs(songs); // Revert to original songs

        throw new Error(`Failed to save: ${saveError.message}`);
      }
      
      // Clear selection only after everything succeeds
      setSelectedSongForAudio(null);
      
      console.log('🎉 === AUDIO UPLOAD COMPLETE ===');
      
      // Show success message
      alert(`Successfully uploaded and saved audio for "${songs.find(s => s.id === songId)?.title}"`);
      
    } catch (error) {
      console.error('❌ === AUDIO UPLOAD FAILED ===');
      console.error('Error details:', error);
      
      // Show user-friendly error message
      alert(`Failed to upload audio: ${error.message}\n\nPlease check:\n1. File format (MP3, WAV, M4A, OGG, FLAC)\n2. The file is not corrupted\n\nThen try again.`);
      
      // Don't update UI state if upload failed
      console.log('🚫 Not updating UI state due to upload failure');
      
      // Re-throw the error so calling code knows it failed
      throw error;
    }
  };

  const handleAudioDownload = async (song) => {
    console.log('🎵 === AUDIO DOWNLOAD START ===');
    console.log('📄 Song:', song.title);
    console.log('🔗 Audio URL:', song.audioFileUrl);
    console.log('📁 Audio filename:', song.audioFileName);
    
    try {
      if (!song.audioFileUrl) {
        console.error('❌ No audio URL found for song');
        alert('No audio file found for this song.');
        return;
      }
      
      const filePath = audioStorageService.extractFilePathFromUrl(song.audioFileUrl);
      console.log('📍 Extracted file path:', filePath);
      
      if (filePath) {
        console.log('🚀 Starting download...');
        await audioStorageService.downloadAudioFile(filePath, song.audioFileName);
        console.log('✅ Download completed');
      } else {
        console.error('❌ Could not extract file path from URL');
        alert('Could not determine file path for download.');
      }
    } catch (error) {
      console.error('❌ Error downloading audio:', error);
      alert(`Failed to download audio file: ${error.message}`);
    }
  };

  const handleAudioRemove = async (songId) => {
    console.log('🗑️ === AUDIO REMOVE START ===');
    console.log('📄 Song ID:', songId);
    
    try {
      const song = songs.find(s => s.id === songId);
      console.log('📄 Found song:', song?.title);
      console.log('🔗 Audio URL:', song?.audioFileUrl);
      
      if (!song || !song.audioFileUrl) {
        console.error('❌ No song or audio URL found');
        alert('No audio file found for this song.');
        return;
      }
      
      const confirmDelete = window.confirm('Are you sure you want to remove this audio file?');
      if (!confirmDelete) {
        console.log('❌ User cancelled removal');
        return;
      }
      
      // Delete from storage
      const filePath = audioStorageService.extractFilePathFromUrl(song.audioFileUrl);
      console.log('📍 Extracted file path:', filePath);
      
      if (filePath) {
        console.log('🚀 Starting deletion...');
        await audioStorageService.deleteAudioFile(filePath);
        console.log('✅ File deleted from storage');
      }
      
      // Update the song to remove audio metadata
      const updatedSongs = songs.map(s => {
        if (s.id === songId) {
          return {
            ...s,
            audioFileUrl: null,
            audioFileName: null,
            audioFileSize: null,
            audioDuration: null
          };
        }
        return s;
      });
      
      setSongs(updatedSongs);
      console.log('✅ Song metadata updated');

      // Save to appropriate storage
      console.log(`🔄 Saving to ${storageType}...`);
      await saveSongsToStorage(updatedSongs);
      console.log('✅ Storage updated');

      console.log('🎉 === AUDIO REMOVE COMPLETE ===');
    } catch (error) {
      console.error('❌ Error removing audio:', error);
      alert(`Failed to remove audio file: ${error.message}`);
    }
  };

  // Trigger direct audio file picker for a specific song
  const triggerAudioFilePicker = (songId) => {
    setAudioUploadTargetSongId(songId);
    if (audioFileInputRef.current) {
      audioFileInputRef.current.click();
    }
  };

  // Handle audio file selection from the hidden input
  const handleAudioFileInputChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !audioUploadTargetSongId) {
      setAudioUploadTargetSongId(null);
      return;
    }

    // Validate the file
    const validation = audioStorageService.validateAudioFile(file);
    if (!validation.isValid) {
      alert(`Invalid audio file: ${validation.errors.join(', ')}`);
      setAudioUploadTargetSongId(null);
      e.target.value = '';
      return;
    }

    try {
      // Upload the file
      const result = await audioStorageService.uploadAudioFile(
        file,
        audioUploadTargetSongId,
        user?.userId || 'anonymous'
      );

      // Call the upload success handler
      await handleAudioUpload(audioUploadTargetSongId, result);
    } catch (error) {
      console.error('Audio upload error:', error);
      // handleAudioUpload already shows an alert
    } finally {
      setAudioUploadTargetSongId(null);
      e.target.value = '';
    }
  };
  
  const themeClasses = darkMode 
    ? 'dark bg-gray-900 text-white' 
    : 'bg-gray-50 text-gray-900';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeClasses}`}>
      {/* Hidden audio file input for direct upload */}
      <input
        ref={audioFileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.m4a,.mp4,.aac,.ogg,.flac"
        onChange={handleAudioFileInputChange}
        className="hidden"
      />

      {/* Music Banner */}
      <MusicBanner />

      {/* Header - Hide on mobile when scrolling down */}
      <div
        className={`transition-transform duration-300 ${
          isMobile && scrollDirection === 'down' ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          showManual={showManual}
          setShowManual={setShowManual}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          isAuthenticated={isAuthenticated}
          user={user}
          onLogin={() => setShowAuthModal(true)}
          onLogout={handleLogout}
        />
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        darkMode={darkMode}
      />

      {/* Universal Search Bar */}
      {!['upload', 'stats', 'analysis'].includes(activeTab) && !showManual && (
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="relative mobile-search">
            {activeTab === 'search' && <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'} w-5 h-5`} />}
            {activeTab === 'dictionary' && <Book className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'} w-5 h-5`} />}
            {activeTab === 'synonyms' && <Shuffle className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'} w-5 h-5`} />}
            {activeTab === 'rhymes' && <Music className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'} w-5 h-5`} />}
            
            <input
              type="text"
              placeholder={
                activeTab === 'search' ? 'Search lyrics... (use "quotes" for exact)' :
                activeTab === 'dictionary' ? "Enter a word to get its definition..." :
                activeTab === 'synonyms' ? "Find synonyms and antonyms..." :
                activeTab === 'rhymes' ? "Find words that rhyme..." : ""
              }
              value={
                activeTab === 'search' ? searchQuery :
                activeTab === 'dictionary' ? definitionQuery :
                activeTab === 'synonyms' ? synonymQuery :
                activeTab === 'rhymes' ? rhymeQuery : ""
              }
              onChange={(e) => {
                if (activeTab === 'search') handleSearch(e.target.value);
                else if (activeTab === 'dictionary') setDefinitionQuery(e.target.value);
                else if (activeTab === 'synonyms') setSynonymQuery(e.target.value);
                else if (activeTab === 'rhymes') setRhymeQuery(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (activeTab === 'dictionary') searchDefinition(definitionQuery);
                  else if (activeTab === 'synonyms') searchSynonyms(synonymQuery);
                  else if (activeTab === 'rhymes') searchRhymes(rhymeQuery);
                }
              }}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>

          {/* Dynamic search button */}
          {activeTab !== 'search' && (
            <div className="flex justify-center mt-2">
              <button
                onClick={() => {
                  if (activeTab === 'dictionary') searchDefinition(definitionQuery);
                  else if (activeTab === 'synonyms') searchSynonyms(synonymQuery);
                  else if (activeTab === 'rhymes') searchRhymes(rhymeQuery);
                }}
                disabled={
                  (activeTab === 'dictionary' && definitionLoading) ||
                  (activeTab === 'synonyms' && synonymLoading) ||
                  (activeTab === 'rhymes' && rhymeLoading)
                }
                className={`px-6 py-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:bg-gray-800' 
                    : 'bg-gray-900 hover:bg-gray-800 text-white disabled:bg-gray-400'
                }`}
              >
                {(activeTab === 'dictionary' && definitionLoading) || 
                (activeTab === 'synonyms' && synonymLoading) || 
                (activeTab === 'rhymes' && rhymeLoading) ? '...' : 
                activeTab === 'dictionary' ? 'Define' :
                activeTab === 'synonyms' ? 'Search' :
                activeTab === 'rhymes' ? 'Find' : 'Search'}
              </button>
            </div>
          )}
        
          {/* Search History - only show for main search tab */}
          {activeTab === 'search' && searchHistory.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Recent:</span>
              {searchHistory.slice(0, 5).map((term, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(term)}
                  className={`text-sm px-3 py-1 rounded-full transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {term}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Content - Add bottom padding on mobile for bottom nav and notepad */}
      <div
        className="max-w-6xl mx-auto px-4 py-6 mobile-content"
        style={{
          paddingBottom: isMobile
            ? notepadState.isMinimized
              ? 'calc(15rem + env(safe-area-inset-bottom, 0px))'
              : `calc(15rem + ${notepadState.dimensions.height}px + env(safe-area-inset-bottom, 0px))`
            : '1.5rem'
        }}
      >
        {/* Manual Content */}
        <Manual 
          showManual={showManual}
          onClose={() => setShowManual(false)}
          darkMode={darkMode}
        />

        {/* Tab Content - Only show when manual is closed */}
        {!showManual && (
          <>
            {activeTab === 'search' && (
              <SearchTab 
                searchQuery={searchQuery}
                highlightWord={highlightWord}
                searchResults={searchResults}
                songs={songs}
                stats={stats}
                onSongSelect={setSelectedSong}
                darkMode={darkMode}
              />
            )}

            {activeTab === 'dictionary' && (
              <DictionaryTab 
                definitionResults={definitionResults}
                definitionLoading={definitionLoading}
                definitionQuery={definitionQuery}
                onSearchInLyrics={searchInLyrics}
                darkMode={darkMode}
              />
            )}

            {activeTab === 'synonyms' && (
              <SynonymsTab 
                synonymResults={synonymResults}
                synonymLoading={synonymLoading}
                synonymQuery={synonymQuery}
                onSearchInLyrics={searchInLyrics}
                darkMode={darkMode}
              />
            )}

            {activeTab === 'rhymes' && (
              <RhymesTab 
                rhymeResults={rhymeResults}
                rhymeLoading={rhymeLoading}
                rhymeQuery={rhymeQuery}
                onSearchInLyrics={searchInLyrics}
                darkMode={darkMode}
              />
            )}

            {activeTab === 'analysis' && (
              <AnalysisTab
                songs={songs}
                selectedSongForAnalysis={selectedSongForAnalysis}
                setSelectedSongForAnalysis={setSelectedSongForAnalysis}
                analysisResults={analysisResults}
                setAnalysisResults={setAnalysisResults}
                analysisType={analysisType}
                setAnalysisType={setAnalysisType}
                onSearchInLyrics={searchInLyrics}
                stats={stats}
                darkMode={darkMode}
              />
            )}

            {activeTab === 'settings' && (
              <AISettings darkMode={darkMode} />
            )}

            {activeTab === 'upload' && (
              <UploadTab 
                songs={songs}
                onFileUpload={fileUploadHook.handleFileUpload}
                onDeleteSong={deleteSong}
                onDeleteAllSongs={deleteAllSongs}
                onSongSelect={setSelectedSong}
                onEditSong={handleEditSong}
                onExportTxt={handleExportSongTxt}
                onExportPdf={handleExportSongPdf}
                isDragging={fileUploadHook.isDragging}
                handleDragOver={fileUploadHook.handleDragOver}
                handleDragLeave={fileUploadHook.handleDragLeave}
                handleDrop={fileUploadHook.handleDrop}
                darkMode={darkMode}
                // Audio-related props
                onAudioUpload={handleAudioUpload}
                onAudioDownload={handleAudioDownload}
                onAudioRemove={handleAudioRemove}
                userId={user?.userId || 'anonymous'}
                // Storage type props
                storageType={storageType}
                onStorageTypeChange={handleStorageTypeChange}
                isAuthenticated={isAuthenticated}
                onTransferSong={handleTransferSong}
                // Draft-related props
                onCreateDraft={handleCreateDraft}
                onDeleteDraft={handleDeleteDraft}
                onOpenDraft={handleOpenDraft}
                MAX_DRAFTS_PER_SONG={MAX_DRAFTS_PER_SONG}
              />
            )}

            {activeTab === 'stats' && (
              <StatsTab 
                songs={songs}
                stats={stats}
                selectedStatsFilter={selectedStatsFilter}
                setSelectedStatsFilter={setSelectedStatsFilter}
                onSearchInLyrics={(word) => {
                  handleSearch(word);
                  setActiveTab('search');
                }}
                darkMode={darkMode}
              />
            )}
          </>
        )}
      </div>

      {/* Song Modal */}
      <SongModal 
        selectedSong={selectedSong}
        onClose={() => setSelectedSong(null)}
        highlightWord={highlightWord}
        darkMode={darkMode}
      />

      {/* Add the FloatingNotepad here */}
      <FloatingNotepad
        notepadState={notepadState}
        darkMode={darkMode}
        onExportTxt={handleExportTxt}
        onUploadToSongs={handleUploadToSongs}
        onSaveChanges={handleSaveChanges}
        onRevertChanges={handleRevertChanges}
        onStartNewContent={handleStartNewContent}
        hasUnsavedChanges={hasUnsavedChanges}
        originalSongContent={originalSongContent}
        // Audio-related props
        currentSongAudio={(() => {
          const currentSong = songs.find(s => s.id === notepadState.currentEditingSongId);
          return currentSong && currentSong.audioFileUrl ? {
            url: currentSong.audioFileUrl,
            filename: currentSong.audioFileName,
            size: currentSong.audioFileSize,
            duration: currentSong.audioDuration
          } : null;
        })()}
        onAudioDownload={() => {
          const currentSong = songs.find(s => s.id === notepadState.currentEditingSongId);
          if (currentSong) handleAudioDownload(currentSong);
        }}
        onAudioRemove={() => {
          if (notepadState.currentEditingSongId) handleAudioRemove(notepadState.currentEditingSongId);
        }}
        onAudioReplace={() => {
          if (notepadState.currentEditingSongId) {
            triggerAudioFilePicker(notepadState.currentEditingSongId);
          }
        }}
        // Draft/Tab management props
        openTabs={openTabs}
        activeTabIndex={activeTabIndex}
        onSwitchTab={handleSwitchTab}
        onCloseTab={handleCloseTab}
        getTabDisplayName={getTabName}
      />

      {/* Bottom Navigation - Mobile Only */}
      {(() => {
        console.log('🔍 BottomNav render: ' + JSON.stringify({ isMobile, activeTab }));
        return isMobile ? (
          <BottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            darkMode={darkMode}
          />
        ) : null;
      })()}
    </div>
  );
};

// Wrapper component with AuthProvider
const LyricsSearchApp = () => {
  return (
    <AuthProvider>
      <LyricsSearchAppContent />
    </AuthProvider>
  );
};

export default LyricsSearchApp;