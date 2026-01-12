import { useState, useCallback } from 'react';

/**
 * Consolidated hook for all external API searches (dictionary, synonyms, rhymes)
 * @param {Object} options
 * @param {Function} options.setHighlightWord - Function to highlight the searched word
 * @returns {Object} All states and search functions for API searches
 */
export const useAPISearch = ({ setHighlightWord }) => {
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

  /**
   * Search for word definitions using Free Dictionary API
   */
  const searchDefinition = useCallback(async (word) => {
    if (!word.trim()) return;

    setDefinitionLoading(true);
    setHighlightWord(word);
    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`
      );
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
  }, [setHighlightWord]);

  /**
   * Search for synonyms and antonyms using DataMuse API
   * Includes enhanced antonym detection using prefix patterns
   */
  const searchSynonyms = useCallback(async (word) => {
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

      // Enhance antonym results with prefix-based detection
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

        // Deduplicate and limit antonyms
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
  }, [setHighlightWord]);

  /**
   * Search for rhymes using DataMuse API
   * Returns perfect rhymes, near rhymes, and sounds-like matches
   */
  const searchRhymes = useCallback(async (word) => {
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
  }, [setHighlightWord]);

  /**
   * Clear all search results
   */
  const clearAllResults = useCallback(() => {
    setDefinitionResults(null);
    setSynonymResults(null);
    setRhymeResults(null);
  }, []);

  return {
    // Dictionary
    definitionQuery,
    setDefinitionQuery,
    definitionResults,
    setDefinitionResults,
    definitionLoading,
    searchDefinition,

    // Synonyms
    synonymQuery,
    setSynonymQuery,
    synonymResults,
    setSynonymResults,
    synonymLoading,
    searchSynonyms,

    // Rhymes
    rhymeQuery,
    setRhymeQuery,
    rhymeResults,
    setRhymeResults,
    rhymeLoading,
    searchRhymes,

    // Utility
    clearAllResults,
  };
};

export default useAPISearch;
