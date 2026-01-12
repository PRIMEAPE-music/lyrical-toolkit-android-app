import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Book, Shuffle, Music } from 'lucide-react';
import jsPDF from 'jspdf';

// Import utilities
import {
  countSyllables,
  calculateReadingLevel,
  calculateVocabularyComplexity
} from './utils/textAnalysis';
import { analyzeRhymeStatistics } from './utils/phoneticUtils';
import { songVocabularyPhoneticMap } from './data/songVocabularyPhoneticMap';
import * as authService from './services/authService';

// Import hooks
import { useDarkMode } from './hooks/useLocalStorage';
import { useFileUpload } from './hooks/useFileUpload';
import { useSearch } from './hooks/useSearch';
import { AuthProvider, useAuth } from './hooks/useAuth';
import useScrollDirection from './hooks/useScrollDirection';
import useSwipeGestures from './hooks/useSwipeGestures';
// Consolidated hooks
import useSongManager from './hooks/useSongManager';
import useAudioManager from './hooks/useAudioManager';
import { useAPISearch } from './hooks/useAPISearch';
import { useWordSearch } from './hooks/useWordSearch';
import { useNotepadEditor } from './hooks/useNotepadEditor';

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

  // Core UI state
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedSong, setSelectedSong] = useState(null);

  // Song management via consolidated hook
  const {
    songs, setSongs, storageType,
    deleteSong, deleteAllSongs, handleStorageTypeChange,
    handleTransferSong, saveSongsToStorage
  } = useSongManager({ isAuthenticated, user });

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

  // Dark mode only
  const [darkMode, setDarkMode] = useDarkMode();

  // Word search via consolidated hook (query, history, highlight)
  // This hook owns the highlight state which API search will use
  const wordSearch = useWordSearch({
    setActiveTab,
    apiSearchHook: null // Will be connected after apiSearch is initialized
  });
  const {
    searchQuery, setSearchQuery, searchHistory, highlightWord, setHighlightWord,
    handleSearch
  } = wordSearch;

  // API search via consolidated hook (dictionary, synonyms, rhymes)
  const apiSearch = useAPISearch({ setHighlightWord });
  const {
    definitionQuery, setDefinitionQuery, definitionResults, definitionLoading, searchDefinition,
    synonymQuery, setSynonymQuery, synonymResults, synonymLoading, searchSynonyms,
    rhymeQuery, setRhymeQuery, rhymeResults, rhymeLoading, searchRhymes
  } = apiSearch;

  // Enhanced searchInLyrics that combines wordSearch with apiSearch
  const searchInLyrics = useCallback((word, targetTab = 'search') => {
    setSearchQuery(word);
    setHighlightWord(word);
    setActiveTab(targetTab);
    wordSearch.addToSearchHistory(word);

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
  }, [setSearchQuery, setHighlightWord, setActiveTab, wordSearch,
      setDefinitionQuery, searchDefinition, setSynonymQuery, searchSynonyms,
      setRhymeQuery, searchRhymes]);

  // Analysis states
  const [analysisResults, setAnalysisResults] = useState(null);
  const [analysisType, setAnalysisType] = useState(null);
  const [selectedSongForAnalysis, setSelectedSongForAnalysis] = useState(null);

  // Manual states
  const [showManual, setShowManual] = useState(false);
  // Stats filter
  const [selectedStatsFilter, setSelectedStatsFilter] = useState('all');

  // File upload hook
  const fileUploadHook = useFileUpload(songs, setSongs);
  // Search hook
  const { searchResults } = useSearch(songs, searchQuery, highlightWord);

  // Audio management via consolidated hook
  const {
    expandedAudioSongId, setExpandedAudioSongId,
    handleAudioUpload, handleAudioDownload, handleAudioRemove,
    triggerAudioFilePicker,
    getHiddenInputProps
  } = useAudioManager({ songs, setSongs, storageType, saveSongsToStorage, user });

  // Notepad/Editor via consolidated hook (includes drafts, tabs, auto-save)
  const notepadEditor = useNotepadEditor({
    songs, setSongs, storageType, isAuthenticated, saveSongsToStorage
  });
  const {
    // Base notepad state
    content: notepadContent,
    title: notepadTitle,
    updateContent: updateNotepadContent,
    updateTitle: updateNotepadTitle,
    isMinimized: notepadIsMinimized,
    toggleMinimized: toggleNotepadMinimized,
    dimensions: notepadDimensions,
    updateDimensions: updateNotepadDimensions,
    position: notepadPosition,
    setPosition: setNotepadPosition,
    currentEditingSongId,
    setCurrentEditingSongId,
    // Editor-specific state
    originalSongContent,
    hasUnsavedChanges,
    // Tab management
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
    // Draft handlers
    handleCreateDraft,
    handleDeleteDraft,
    handleOpenDraft,
    handleSwitchTab,
    handleCloseTab,
    getTabName
  } = notepadEditor;

  // Create a notepadState-like object for FloatingNotepad compatibility
  const notepadState = {
    content: notepadContent,
    title: notepadTitle,
    updateContent: updateNotepadContent,
    updateTitle: updateNotepadTitle,
    isMinimized: notepadIsMinimized,
    toggleMinimized: toggleNotepadMinimized,
    dimensions: notepadDimensions,
    updateDimensions: updateNotepadDimensions,
    position: notepadPosition,
    setPosition: setNotepadPosition,
    currentEditingSongId,
    setCurrentEditingSongId
  };

  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleLogout = async () => {
    await logout();
    setSongs([]);
    setShowAuthModal(false);
  };

  // Reset stats filter when songs change (keep this, UI-only logic)
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

  // Export song as TXT file (needed for UploadTab)
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

  // Export song as PDF file (needed for UploadTab)
  const handleExportSongPdf = async (song) => {
    try {
      const pdf = new jsPDF();
      pdf.setFontSize(16);
      pdf.text(song.title, 20, 20);
      pdf.setFontSize(12);
      const splitText = pdf.splitTextToSize(song.lyrics, 170);
      pdf.text(splitText, 20, 40);
      pdf.save(`${song.title}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const themeClasses = darkMode 
    ? 'dark bg-gray-900 text-white' 
    : 'bg-gray-50 text-gray-900';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeClasses}`}>
      {/* Hidden audio file input for direct upload */}
      <input {...getHiddenInputProps()} />

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

            <div style={{ display: activeTab === 'upload' ? 'block' : 'none' }}>
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
                // Audio player expansion state (persistent across tab switches)
                expandedAudioSongId={expandedAudioSongId}
                setExpandedAudioSongId={setExpandedAudioSongId}
              />
            </div>

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