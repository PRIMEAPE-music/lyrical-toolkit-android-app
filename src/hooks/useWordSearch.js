import { useState, useCallback } from 'react';
import { useSearchHistory, useHighlightWord } from './useLocalStorage';

/**
 * Custom hook that consolidates word search state and logic.
 * Manages search query, history, highlighting, and cross-tab navigation.
 *
 * @param {Object} options - Configuration options
 * @param {Function} options.setActiveTab - Function to change the active tab
 * @param {Object} options.apiSearchHook - Object containing API search triggers
 * @param {Function} options.apiSearchHook.searchDefinition - Function to search definitions
 * @param {Function} options.apiSearchHook.searchSynonyms - Function to search synonyms
 * @param {Function} options.apiSearchHook.searchRhymes - Function to search rhymes
 * @param {Function} options.apiSearchHook.setDefinitionQuery - Function to set definition query
 * @param {Function} options.apiSearchHook.setSynonymQuery - Function to set synonym query
 * @param {Function} options.apiSearchHook.setRhymeQuery - Function to set rhyme query
 * @returns {Object} Search state and functions
 */
export const useWordSearch = ({ setActiveTab, apiSearchHook }) => {
  // Local search query state
  const [searchQuery, setSearchQuery] = useState('');

  // Persisted state from localStorage hooks
  const [searchHistory, setSearchHistory] = useSearchHistory();
  const [highlightWord, setHighlightWord] = useHighlightWord();

  /**
   * Add a query to search history if it's not already present.
   * Maintains a maximum of 10 history items.
   */
  const addToSearchHistory = useCallback((query) => {
    if (query.trim() && !searchHistory.includes(query)) {
      const newHistory = [query, ...searchHistory.slice(0, 9)];
      setSearchHistory(newHistory);
    }
  }, [searchHistory, setSearchHistory]);

  /**
   * Handle a search action - updates query, history, and highlight.
   * This is typically triggered from the search input.
   */
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    if (query.trim()) {
      addToSearchHistory(query);
      setHighlightWord(query);
    }
  }, [addToSearchHistory, setHighlightWord]);

  /**
   * Enhanced search function with custom routing and auto-search.
   * Navigates to the specified tab and triggers the appropriate API search.
   *
   * @param {string} word - The word to search for
   * @param {string} targetTab - The tab to navigate to ('search', 'dictionary', 'synonyms', 'rhymes')
   */
  const searchInLyrics = useCallback((word, targetTab = 'search') => {
    setSearchQuery(word);
    setHighlightWord(word);
    setActiveTab(targetTab);
    addToSearchHistory(word);

    // Trigger API searches based on target tab
    if (apiSearchHook) {
      if (targetTab === 'dictionary') {
        apiSearchHook.setDefinitionQuery?.(word);
        setTimeout(() => apiSearchHook.searchDefinition?.(word), 100);
      } else if (targetTab === 'synonyms') {
        apiSearchHook.setSynonymQuery?.(word);
        setTimeout(() => apiSearchHook.searchSynonyms?.(word), 100);
      } else if (targetTab === 'rhymes') {
        apiSearchHook.setRhymeQuery?.(word);
        setTimeout(() => apiSearchHook.searchRhymes?.(word), 100);
      }
    }
  }, [setActiveTab, addToSearchHistory, setHighlightWord, apiSearchHook]);

  /**
   * Clear the current search query and optionally the highlight.
   * @param {boolean} clearHighlight - Whether to also clear the highlight word
   */
  const clearSearch = useCallback((clearHighlight = false) => {
    setSearchQuery('');
    if (clearHighlight) {
      setHighlightWord('');
    }
  }, [setHighlightWord]);

  /**
   * Remove a specific item from search history.
   * @param {string} query - The query to remove from history
   */
  const removeFromHistory = useCallback((query) => {
    const newHistory = searchHistory.filter(item => item !== query);
    setSearchHistory(newHistory);
  }, [searchHistory, setSearchHistory]);

  /**
   * Clear all search history.
   */
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
  }, [setSearchHistory]);

  return {
    // State
    searchQuery,
    setSearchQuery,
    searchHistory,
    highlightWord,
    setHighlightWord,

    // Core functions
    handleSearch,
    searchInLyrics,
    addToSearchHistory,

    // Utility functions
    clearSearch,
    removeFromHistory,
    clearHistory
  };
};

export default useWordSearch;
