import React, { useState } from 'react';
import { generateRhymingDictionary, analyzeMeter, performWritingQualityAnalysis } from '../../utils/textAnalysis';
import { analyzeFullTextRhymes } from '../../utils/phoneticUtils';
import { songVocabularyPhoneticMap } from '../../data/songVocabularyPhoneticMap';
import geminiService from '../../services/geminiService';
import RhymeEditor from '../Analysis/RhymeEditor';
import EditableHighlightedLyrics from '../Analysis/EditableHighlightedLyrics';

const AnalysisTab = ({ 
  songs,
  selectedSongForAnalysis,
  setSelectedSongForAnalysis,
  analysisResults,
  setAnalysisResults,
  analysisType,
  setAnalysisType,
  onSearchInLyrics,
  stats,
  darkMode 
}) => {
  // State for edited lyrics
  const [editedStructuredLyrics, setEditedStructuredLyrics] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Add coherence analysis state
  const [coherenceResults, setCoherenceResults] = useState(null);
  const [coherenceLoading, setCoherenceLoading] = useState(false);
  const [coherenceProgress, setCoherenceProgress] = useState(null);

  // Add performance analysis state
  const [performanceResults, setPerformanceResults] = useState(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);

  const handleRhymingDictionary = () => {
    if (songs.length === 0) {
      alert('Please upload some songs first!');
      return;
    }
    const rhymeDict = generateRhymingDictionary(songs);
    setAnalysisResults(rhymeDict);
    setAnalysisType('rhyming-dictionary');
  };


  const handleWritingQuality = () => {
  if (!selectedSongForAnalysis) return;
  const song = songs.find(s => s.id.toString() === selectedSongForAnalysis.toString());
  if (!song) return;

  // Clear performance results when running writing quality
  setPerformanceResults(null);

  setAnalysisResults(null); 
  setAnalysisType('writing-quality-loading');
    
    try {
      const qualityAnalysis = performWritingQualityAnalysis(song.lyrics);
      
      setAnalysisResults({
        song,
        ...qualityAnalysis
      });
      setAnalysisType('writing-quality');
    } catch (error) {
      console.error('Error in writing quality analysis:', error);
      alert('An error occurred during writing quality analysis.');
      setAnalysisType(null);
    }
  };

  const handleCoherenceAnalysis = async (useMultiPass = true) => {
    if (!selectedSongForAnalysis) return;
    const song = songs.find(s => s.id.toString() === selectedSongForAnalysis.toString());
    if (!song) return;

    setCoherenceLoading(true);
    setCoherenceResults(null);
    setCoherenceProgress(null);

    try {
      let result;
      if (useMultiPass) {
        // Use multi-pass analysis with progress callback
        result = await geminiService.analyzeLyricalCoherenceMultiPass(
          song.lyrics,
          song.title,
          (progress) => setCoherenceProgress(progress)
        );
      } else {
        // Use single-pass analysis
        result = await geminiService.analyzeLyricalCoherence(song.lyrics, song.title);
      }
      setCoherenceResults(result);
    } catch (error) {
      console.error('Error in coherence analysis:', error);
      setCoherenceResults({
        success: false,
        error: error.message
      });
    }

    setCoherenceProgress(null);
    setCoherenceLoading(false);
  };

  const handlePerformanceAnalysis = async (forceFresh = false) => {
    if (!selectedSongForAnalysis) return;
    const song = songs.find(s => s.id.toString() === selectedSongForAnalysis.toString());
    if (!song) return;

    console.log(`Performance analysis started. Force fresh: ${forceFresh}`);

    // Clear writing quality results when running performance analysis
    setAnalysisResults(null);
    setAnalysisType(null);

    setPerformanceLoading(true);
    setPerformanceResults(null);
    
    try {
      const result = await geminiService.analyzePerformanceAndStyle(song.lyrics, song.title, forceFresh);
      setPerformanceResults(result);
      console.log('Performance analysis completed:', result.success ? 'Success' : 'Failed');
    } catch (error) {
      console.error('Error in performance analysis:', error);
      setPerformanceResults({
        success: false,
        error: error.message,
        retryable: true
      });
    }
    
    setPerformanceLoading(false);
  };

  const handleRhymeScheme = () => {
    if (!selectedSongForAnalysis) return;
    const song = songs.find(s => s.id.toString() === selectedSongForAnalysis.toString());
    if (!song) return;

    setAnalysisResults(null); 
    setAnalysisType('rhyme-scheme-loading');
    
    try {
      const structuredLyrics = analyzeFullTextRhymes(song.lyrics, songVocabularyPhoneticMap); 
      setAnalysisResults({ song, structuredLyrics });
      setAnalysisType('rhyme-scheme');
    } catch (error) {
      console.error('Error in phonetic rhyme analysis:', error);
      alert('An error occurred during rhyme analysis.');
      setAnalysisType(null);
    }
  };

  const handleMeterAnalysis = () => {
    if (!selectedSongForAnalysis) return;
    const song = songs.find(s => s.id.toString() === selectedSongForAnalysis.toString());
    if (!song) {
      console.error('Song not found:', selectedSongForAnalysis);
      return;
    }
    try {
      const meterAnalysis = analyzeMeter(song.lyrics);
      setAnalysisResults({song, meterAnalysis});
      setAnalysisType('meter-analysis');
    } catch (error) {
      console.error('Error in meter analysis:', error);
      alert('Error analyzing syllables. Please try again.');
    }
  };

  return (
    <div>
      {/* Song Selection - Moved to Top */}
      <div className={`p-4 rounded-lg border mb-6 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h3 className="font-medium mb-2">Select Song to Analyze</h3>
        <select
          value={selectedSongForAnalysis || ''}
          onChange={(e) => setSelectedSongForAnalysis(e.target.value)}
          className={`w-full max-w-md p-3 rounded border ${
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          <option value="">Choose a song...</option>
          {songs.map(song => (
            <option key={song.id} value={song.id.toString()}>{song.title}</option>
          ))}
        </select>
      </div>

      {/* Analysis Buttons Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
        <button
          onClick={handleRhymingDictionary}
          className={`p-4 rounded-lg border transition-colors ${
            darkMode 
              ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white' 
              : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-900'
          }`}
        >
          <h3 className="font-medium mb-2">Rhyming Dictionary</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Generate from your lyrics
          </p>
        </button>

        <button
          onClick={handleRhymeScheme}
          disabled={!selectedSongForAnalysis}
          className={`p-4 rounded-lg border transition-colors ${
            selectedSongForAnalysis
              ? darkMode 
                ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white' 
                : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-900'
              : darkMode
                ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
                : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <h3 className="font-medium mb-2">Rhyme Scheme</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Visualize rhyming patterns
          </p>
        </button>

        <button
          onClick={handleMeterAnalysis}
          disabled={!selectedSongForAnalysis}
          className={`p-4 rounded-lg border transition-colors ${
            selectedSongForAnalysis
              ? darkMode 
                ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white' 
                : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-900'
              : darkMode
                ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
                : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <h3 className="font-medium mb-2">Syllables</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Count syllables & analyze meter
          </p>
        </button>
        
        <button
          onClick={() => handlePerformanceAnalysis(true)}
          disabled={performanceLoading}
          className={`p-4 rounded-lg border transition-colors ${
            selectedSongForAnalysis
              ? darkMode 
                ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white' 
                : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-900'
              : darkMode
                ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
                : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <h3 className="font-medium mb-2">Performance & Style</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            AI analysis of vocal flow and style
          </p>
        </button>

        <button
          onClick={handleWritingQuality}
          disabled={!selectedSongForAnalysis}
          className={`p-4 rounded-lg border transition-colors ${
            selectedSongForAnalysis
              ? darkMode 
                ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white' 
                : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-900'
              : darkMode
                ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
                : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <h3 className="font-medium mb-2">Writing Quality</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Technical and AI Writing Analysis
          </p>
        </button>
      </div>

      {/* Quick Stats - Moved to Bottom */}
      <div className={`p-4 rounded-lg border mb-6 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h3 className="font-medium mb-2">Quick Stats</h3>
        <div className={`text-sm space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <div>{songs.length} songs loaded</div>
          <div>{stats.totalWords.toLocaleString()} total words</div>
          <div>{stats.uniqueWords.toLocaleString()} unique words</div>
        </div>
      </div>
      
      {/* Analysis Results */}
      {analysisResults && (
        <div className={`rounded-lg border p-6 transition-colors ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          {analysisType === 'rhyming-dictionary' && (
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Your Personal Rhyming Dictionary
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(analysisResults).slice(0, 20).map(([rhymeKey, words]) => (
                  <div key={rhymeKey} className={`p-3 rounded border ${
                    darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className={`font-medium text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Words ending in "-{rhymeKey}"
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {words.map((word, index) => (
                        <span key={word}>
                          <span
                            onClick={() => onSearchInLyrics(word, 'search')}
                            className={`text-xs px-2 py-1 rounded cursor-pointer transition-colors ${
                              darkMode 
                                ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' 
                                : 'bg-white hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            {word}
                          </span>
                          {index < words.length - 1 && (
                            <span className={`text-xs mx-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                              ,&nbsp;&nbsp;
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {Object.keys(analysisResults).length > 20 && (
                <p className={`mt-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Showing first 20 rhyme groups. Total: {Object.keys(analysisResults).length}
                </p>
              )}
            </div>
          )}           

          {analysisType === 'rhyme-scheme-loading' && (
             <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Analyzing Rhymes...</div>
          )}

          {analysisType === 'rhyme-scheme' && analysisResults && (
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Rhyme Analysis: "{analysisResults.song?.title || 'Unknown Song'}"
              </h3>
              
              {/* Rhyme Editor */}
              <RhymeEditor
                structuredLyrics={analysisResults.structuredLyrics}
                editedLyrics={editedStructuredLyrics || analysisResults.structuredLyrics}
                onLyricsUpdate={setEditedStructuredLyrics}
                songId={analysisResults.song?.id}
                songTitle={analysisResults.song?.title}
                darkMode={darkMode}
                isEditMode={isEditMode}
                setIsEditMode={setIsEditMode}
              />
              
              {/* Rhyme Visualization */}
              <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <h4 className={`text-md font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Rhyme Detection
                </h4>
                <EditableHighlightedLyrics
                  structuredLyrics={editedStructuredLyrics || analysisResults.structuredLyrics}
                  darkMode={darkMode}
                  isEditMode={isEditMode}
                  onWordClick={(word, lineIndex, wordIndex, event) => {
                    // This will be handled by RhymeEditor through props
                    const rhymeEditor = document.querySelector('[data-rhyme-editor]');
                    if (rhymeEditor) {
                      rhymeEditor.dispatchEvent(new CustomEvent('wordClick', {
                        detail: { word, lineIndex, wordIndex, event }
                      }));
                    }
                  }}
                />
              </div>
            </div>
          )}

          {analysisType === 'writing-quality-loading' && (
             <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Analyzing Writing Quality...</div>
          )}

          {analysisType === 'writing-quality' && (
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                AI Writing Analysis: "{analysisResults.song.title}"
              </h3>

              {/* AI Coherence Analysis Section */}
              <div className={`p-4 rounded border mb-4 ${
                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex items-center gap-4">
                    <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      🤖 AI Writing Analysis
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleCoherenceAnalysis(true)}
                      disabled={coherenceLoading}
                      className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border ${
                        coherenceLoading
                          ? darkMode
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed border-gray-600'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300'
                          : darkMode
                            ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-500'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300'
                      }`}
                    >
                      {coherenceLoading ? 'Analyzing...' : '🔬 Deep Analysis (4 Passes)'}
                    </button>
                    <button
                      onClick={() => handleCoherenceAnalysis(false)}
                      disabled={coherenceLoading}
                      className={`px-4 py-2 rounded-lg transition-colors border ${
                        coherenceLoading
                          ? darkMode
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed border-gray-600'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300'
                          : darkMode
                            ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700 border-gray-300'
                      }`}
                    >
                      ⚡ Quick Analysis
                    </button>
                  </div>

                </div>

                {/* Multi-pass Progress Indicator - Full width below buttons */}
                {coherenceLoading && coherenceProgress && (
                  <div className={`w-full p-3 rounded mt-2 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                        {coherenceProgress.label}
                      </span>
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Pass {coherenceProgress.pass} of {coherenceProgress.total}
                      </span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div
                        className={`h-full transition-all duration-500 ${
                          coherenceProgress.status === 'waiting' ? 'bg-yellow-500' :
                          coherenceProgress.status === 'analyzing' ? 'bg-blue-500 animate-pulse' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${(coherenceProgress.pass / coherenceProgress.total) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2">
                      {[1, 2, 3, 4].map((pass) => (
                        <div
                          key={pass}
                          className={`text-xs px-1 py-1 rounded text-center ${
                            coherenceProgress.pass > pass
                              ? darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                              : coherenceProgress.pass === pass
                                ? darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                                : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {pass === 1 ? 'Narrative' : pass === 2 ? 'Refs' : pass === 3 ? 'Craft' : 'Final'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Simple loading indicator for quick analysis */}
                {coherenceLoading && !coherenceProgress && (
                  <div className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Analyzing writing quality...
                  </div>
                )}

                {/* Coherence Results */}
                {coherenceResults && (
                  <div>
                    {coherenceResults.success ? (
                      <div className="space-y-4">
                        {/* Cache indicator */}
                        {coherenceResults.fromCache && (
                          <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            📋 Results from cache
                          </div>
                        )}

                        {/* Coherence Score Header */}
                        <div className={`p-4 rounded border text-center ${
                          darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                        }`}>
                          <div className={`text-4xl font-bold mb-1 ${
                            coherenceResults.coherenceScore >= 80 ? 'text-green-500' :
                            coherenceResults.coherenceScore >= 60 ? 'text-yellow-500' : 'text-red-500'
                          }`}>
                            {coherenceResults.coherenceScore}
                          </div>
                          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Overall Coherence Score
                          </div>
                        </div>

                        {/* Overall Assessment */}
                        <div className={`p-4 rounded border ${
                          darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                        }`}>
                          <h5 className={`font-medium mb-3 ${darkMode ? 'text-green-300' : 'text-green-800'}`}>
                            📋 Comprehensive Assessment
                          </h5>
                          <p className={`text-sm whitespace-pre-line ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {coherenceResults.overallAssessment}
                          </p>
                        </div>

                        {/* Narrative Architecture */}
                        {coherenceResults.narrativeArchitecture && (
                          <div className={`p-4 rounded border ${
                            darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between mb-3">
                              <h5 className={`font-medium ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                                🏛️ Narrative Architecture
                              </h5>
                              <span className={`text-xs px-2 py-1 rounded font-medium ${
                                darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {coherenceResults.narrativeArchitecture.rating}
                              </span>
                            </div>
                            {coherenceResults.narrativeArchitecture.structure && (
                              <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <strong>Structure:</strong> {coherenceResults.narrativeArchitecture.structure}
                              </p>
                            )}
                            {coherenceResults.narrativeArchitecture.pointOfView && (
                              <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <strong>Point of View:</strong> {coherenceResults.narrativeArchitecture.pointOfView}
                              </p>
                            )}
                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {coherenceResults.narrativeArchitecture.analysis}
                            </p>
                          </div>
                        )}

                        {/* Thematic Analysis */}
                        {coherenceResults.thematicAnalysis && (
                          <div className={`p-4 rounded border ${
                            darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between mb-3">
                              <h5 className={`font-medium ${darkMode ? 'text-purple-300' : 'text-purple-800'}`}>
                                🎭 Thematic Analysis
                              </h5>
                              <span className={`text-xs px-2 py-1 rounded font-medium ${
                                darkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
                              }`}>
                                {coherenceResults.thematicAnalysis.rating}
                              </span>
                            </div>
                            {coherenceResults.thematicAnalysis.primaryTheme && (
                              <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <strong>Primary Theme:</strong> {coherenceResults.thematicAnalysis.primaryTheme}
                              </p>
                            )}
                            {coherenceResults.thematicAnalysis.secondaryThemes?.length > 0 && (
                              <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <strong>Secondary Themes:</strong> {coherenceResults.thematicAnalysis.secondaryThemes.join(', ')}
                              </p>
                            )}
                            {coherenceResults.thematicAnalysis.thematicEvolution && (
                              <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <strong>Evolution:</strong> {coherenceResults.thematicAnalysis.thematicEvolution}
                              </p>
                            )}
                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {coherenceResults.thematicAnalysis.analysis}
                            </p>
                          </div>
                        )}

                        {/* Imagery & Symbolism */}
                        {coherenceResults.imagerySymbolism && (
                          <div className={`p-4 rounded border ${
                            darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between mb-3">
                              <h5 className={`font-medium ${darkMode ? 'text-pink-300' : 'text-pink-800'}`}>
                                🎨 Imagery & Symbolism
                              </h5>
                              <span className={`text-xs px-2 py-1 rounded font-medium ${
                                darkMode ? 'bg-pink-900 text-pink-200' : 'bg-pink-100 text-pink-800'
                              }`}>
                                {coherenceResults.imagerySymbolism.rating}
                              </span>
                            </div>
                            {coherenceResults.imagerySymbolism.dominantImagery?.length > 0 && (
                              <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <strong>Dominant Imagery:</strong> {coherenceResults.imagerySymbolism.dominantImagery.join(', ')}
                              </p>
                            )}
                            {coherenceResults.imagerySymbolism.symbols?.length > 0 && (
                              <div className="mb-2">
                                <strong className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Symbols:</strong>
                                <ul className={`text-sm ml-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {coherenceResults.imagerySymbolism.symbols.map((s, i) => (
                                    <li key={i}>• <strong>{s.symbol}:</strong> {s.meaning}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {coherenceResults.imagerySymbolism.metaphorAnalysis?.length > 0 && (
                              <div className="mb-3">
                                <strong className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Metaphors:</strong>
                                <div className="space-y-2 mt-1">
                                  {coherenceResults.imagerySymbolism.metaphorAnalysis.map((m, i) => (
                                    <div key={i} className={`text-sm ml-2 p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                      <p className={`${darkMode ? 'text-purple-200' : 'text-purple-700'}`}>"{m.metaphor || m}"</p>
                                      {m.vehicle && <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Vehicle: {m.vehicle}</p>}
                                      {m.tenor && <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tenor: {m.tenor}</p>}
                                      {m.effectiveness && <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{m.effectiveness}</p>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {coherenceResults.imagerySymbolism.analysis}
                            </p>
                          </div>
                        )}

                        {/* Emotional Journey */}
                        {coherenceResults.emotionalJourney && (
                          <div className={`p-4 rounded border ${
                            darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between mb-3">
                              <h5 className={`font-medium ${darkMode ? 'text-red-300' : 'text-red-800'}`}>
                                💖 Emotional Journey
                              </h5>
                              <span className={`text-xs px-2 py-1 rounded font-medium ${
                                darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                              }`}>
                                {coherenceResults.emotionalJourney.rating}
                              </span>
                            </div>
                            {coherenceResults.emotionalJourney.arc?.length > 0 && (
                              <div className="flex items-center gap-2 flex-wrap mb-3">
                                {coherenceResults.emotionalJourney.arc.map((emotion, index) => (
                                  <React.Fragment key={index}>
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                                    }`}>
                                      {emotion}
                                    </span>
                                    {index < coherenceResults.emotionalJourney.arc.length - 1 && (
                                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>→</span>
                                    )}
                                  </React.Fragment>
                                ))}
                              </div>
                            )}
                            {coherenceResults.emotionalJourney.turningPoints?.length > 0 && (
                              <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <strong>Turning Points:</strong> {coherenceResults.emotionalJourney.turningPoints.join('; ')}
                              </p>
                            )}
                            {coherenceResults.emotionalJourney.authenticity && (
                              <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <strong>Authenticity:</strong> {coherenceResults.emotionalJourney.authenticity}
                              </p>
                            )}
                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {coherenceResults.emotionalJourney.analysis}
                            </p>
                          </div>
                        )}

                        {/* Literary Techniques */}
                        {coherenceResults.literaryTechniques && (
                          <div className={`p-4 rounded border ${
                            darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between mb-3">
                              <h5 className={`font-medium ${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
                                ✍️ Literary Techniques
                              </h5>
                              <span className={`text-xs px-2 py-1 rounded font-medium ${
                                darkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {coherenceResults.literaryTechniques.rating}
                              </span>
                            </div>
                            {coherenceResults.literaryTechniques.techniques?.length > 0 && (
                              <div className="mb-3 space-y-2">
                                {coherenceResults.literaryTechniques.techniques.map((t, i) => (
                                  <div key={i} className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                    <span className={`font-medium text-sm ${darkMode ? 'text-yellow-200' : 'text-yellow-700'}`}>
                                      {t.technique}:
                                    </span>
                                    <span className={`text-sm ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                      {t.usage}
                                    </span>
                                    {t.effect && (
                                      <span className={`text-sm ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        — {t.effect}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {coherenceResults.literaryTechniques.analysis}
                            </p>
                          </div>
                        )}

                        {/* Structural Cohesion */}
                        {coherenceResults.structuralCohesion && (
                          <div className={`p-4 rounded border ${
                            darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between mb-3">
                              <h5 className={`font-medium ${darkMode ? 'text-cyan-300' : 'text-cyan-800'}`}>
                                🔗 Structural Cohesion
                              </h5>
                              <span className={`text-xs px-2 py-1 rounded font-medium ${
                                darkMode ? 'bg-cyan-900 text-cyan-200' : 'bg-cyan-100 text-cyan-800'
                              }`}>
                                {coherenceResults.structuralCohesion.rating}
                              </span>
                            </div>
                            {coherenceResults.structuralCohesion.sectionFlow && (
                              <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <strong>Section Flow:</strong> {coherenceResults.structuralCohesion.sectionFlow}
                              </p>
                            )}
                            {coherenceResults.structuralCohesion.chorusFunction && (
                              <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <strong>Chorus Function:</strong> {coherenceResults.structuralCohesion.chorusFunction}
                              </p>
                            )}
                            {coherenceResults.structuralCohesion.bridgeFunction && (
                              <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <strong>Bridge Function:</strong> {coherenceResults.structuralCohesion.bridgeFunction}
                              </p>
                            )}
                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {coherenceResults.structuralCohesion.analysis}
                            </p>
                          </div>
                        )}

                        {/* Sound Craft (Multi-pass only) */}
                        {coherenceResults.soundCraft && (
                          <div className={`p-4 rounded border ${
                            darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between mb-3">
                              <h5 className={`font-medium ${darkMode ? 'text-orange-300' : 'text-orange-800'}`}>
                                🎵 Sound Craft
                              </h5>
                              <span className={`text-xs px-2 py-1 rounded font-medium ${
                                darkMode ? 'bg-orange-900 text-orange-200' : 'bg-orange-100 text-orange-800'
                              }`}>
                                {coherenceResults.soundCraft.rating}
                              </span>
                            </div>
                            {coherenceResults.soundCraft.rhymeScheme && (
                              <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <strong>Rhyme Scheme:</strong> {coherenceResults.soundCraft.rhymeScheme}
                              </p>
                            )}
                            {coherenceResults.soundCraft.musicality && (
                              <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <strong>Musicality:</strong> {coherenceResults.soundCraft.musicality}
                              </p>
                            )}
                            {coherenceResults.soundCraft.soundDevices?.length > 0 && (
                              <div className="mb-3 space-y-1">
                                <strong className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Sound Devices:</strong>
                                {coherenceResults.soundCraft.soundDevices.map((d, i) => (
                                  <div key={i} className={`text-sm ml-2 ${darkMode ? 'text-orange-200' : 'text-orange-700'}`}>
                                    • <strong>{d.device}:</strong> "{d.example}" — {d.effect}
                                  </div>
                                ))}
                              </div>
                            )}
                            {coherenceResults.soundCraft.analysis && (
                              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {coherenceResults.soundCraft.analysis}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Intertextuality (Multi-pass only) */}
                        {coherenceResults.intertextuality && (
                          <div className={`p-4 rounded border ${
                            darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                          }`}>
                            <h5 className={`font-medium mb-3 ${darkMode ? 'text-indigo-300' : 'text-indigo-800'}`}>
                              📖 Intertextuality
                            </h5>
                            {coherenceResults.intertextuality.primaryInfluences?.length > 0 && (
                              <div className="mb-2">
                                <strong className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Primary Influences:</strong>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {coherenceResults.intertextuality.primaryInfluences.map((inf, i) => (
                                    <span key={i} className={`text-xs px-2 py-1 rounded ${
                                      darkMode ? 'bg-indigo-900 text-indigo-200' : 'bg-indigo-100 text-indigo-800'
                                    }`}>
                                      {inf}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {coherenceResults.intertextuality.dialogueWith && (
                              <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <strong>In Dialogue With:</strong> {coherenceResults.intertextuality.dialogueWith}
                              </p>
                            )}
                            {coherenceResults.intertextuality.originalityAssessment && (
                              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                <strong>Originality:</strong> {coherenceResults.intertextuality.originalityAssessment}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Cultural Context (Multi-pass only) */}
                        {coherenceResults.culturalContext && (
                          <div className={`p-4 rounded border ${
                            darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between mb-3">
                              <h5 className={`font-medium ${darkMode ? 'text-teal-300' : 'text-teal-800'}`}>
                                🌍 Cultural Context
                              </h5>
                              {coherenceResults.culturalContext.accessibilityScore && (
                                <span className={`text-xs px-2 py-1 rounded font-medium ${
                                  darkMode ? 'bg-teal-900 text-teal-200' : 'bg-teal-100 text-teal-800'
                                }`}>
                                  Accessibility: {coherenceResults.culturalContext.accessibilityScore}/10
                                </span>
                              )}
                            </div>
                            {coherenceResults.culturalContext.eraMarkers?.length > 0 && (
                              <div className="mb-2">
                                <strong className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Era Markers:</strong>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {coherenceResults.culturalContext.eraMarkers.map((marker, i) => (
                                    <span key={i} className={`text-xs px-2 py-1 rounded ${
                                      darkMode ? 'bg-teal-900 text-teal-200' : 'bg-teal-100 text-teal-800'
                                    }`}>
                                      {marker}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {coherenceResults.culturalContext.audienceAssumptions && (
                              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                <strong>Audience Assumptions:</strong> {coherenceResults.culturalContext.audienceAssumptions}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Craft Verdict (Multi-pass only) */}
                        {coherenceResults.craftVerdict && (
                          <div className={`p-4 rounded border ${
                            darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between mb-3">
                              <h5 className={`font-medium ${darkMode ? 'text-amber-300' : 'text-amber-800'}`}>
                                ⚖️ Craft Verdict
                              </h5>
                              {coherenceResults.craftVerdict.overallCraftRating && (
                                <span className={`text-lg font-bold ${
                                  coherenceResults.craftVerdict.overallCraftRating >= 80 ? 'text-green-500' :
                                  coherenceResults.craftVerdict.overallCraftRating >= 60 ? 'text-yellow-500' : 'text-red-500'
                                }`}>
                                  {coherenceResults.craftVerdict.overallCraftRating}/100
                                </span>
                              )}
                            </div>
                            {coherenceResults.craftVerdict.greatestStrength && (
                              <div className={`p-2 rounded mb-2 ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
                                <p className={`text-sm ${darkMode ? 'text-green-200' : 'text-green-700'}`}>
                                  <strong>Greatest Strength:</strong> {coherenceResults.craftVerdict.greatestStrength}
                                </p>
                              </div>
                            )}
                            {coherenceResults.craftVerdict.biggestWeakness && (
                              <div className={`p-2 rounded mb-2 ${darkMode ? 'bg-red-900/30' : 'bg-red-50'}`}>
                                <p className={`text-sm ${darkMode ? 'text-red-200' : 'text-red-700'}`}>
                                  <strong>Area for Improvement:</strong> {coherenceResults.craftVerdict.biggestWeakness}
                                </p>
                              </div>
                            )}
                            {coherenceResults.craftVerdict.comparableTo && (
                              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                <strong>Comparable To:</strong> {coherenceResults.craftVerdict.comparableTo}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Ambiguity & Multivalence (Multi-pass only) */}
                        {coherenceResults.ambiguityMultivalence && (
                          <div className={`p-4 rounded border ${
                            darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                          }`}>
                            <h5 className={`font-medium mb-3 ${darkMode ? 'text-violet-300' : 'text-violet-800'}`}>
                              🔮 Ambiguity & Multiple Meanings
                            </h5>
                            {coherenceResults.ambiguityMultivalence.intentionalAmbiguity?.length > 0 && (
                              <div className="mb-3 space-y-2">
                                {coherenceResults.ambiguityMultivalence.intentionalAmbiguity.map((amb, i) => (
                                  <div key={i} className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                    <p className={`text-sm font-medium ${darkMode ? 'text-violet-200' : 'text-violet-700'}`}>
                                      "{amb.moment}"
                                    </p>
                                    <ul className={`text-sm ml-4 mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                      {amb.interpretations?.map((interp, j) => (
                                        <li key={j}>• {interp}</li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            )}
                            {coherenceResults.ambiguityMultivalence.unsaidImplied && (
                              <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <strong>Unsaid/Implied:</strong> {coherenceResults.ambiguityMultivalence.unsaidImplied}
                              </p>
                            )}
                            {coherenceResults.ambiguityMultivalence.openEndedness && (
                              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                <strong>Open-Endedness:</strong> {coherenceResults.ambiguityMultivalence.openEndedness}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Multi-pass indicator */}
                        {coherenceResults.multiPass && (
                          <div className={`p-2 rounded text-center ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                            <span className={`text-xs ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                              🔬 Deep Analysis Complete (4 Passes)
                            </span>
                          </div>
                        )}

                        {/* Legacy ratings display for backward compatibility */}
                        {(coherenceResults.storyFlow || coherenceResults.thematicUnity) && !coherenceResults.narrativeArchitecture && (
                          <div className="grid gap-4 md:grid-cols-4 mb-4">
                            {coherenceResults.storyFlow && (
                              <div className={`p-3 rounded border text-center ${
                                darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                              }`}>
                                <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {coherenceResults.storyFlow.charAt(0).toUpperCase() + coherenceResults.storyFlow.slice(1)}
                                </div>
                                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Story Flow</div>
                              </div>
                            )}
                            {coherenceResults.thematicUnity && (
                              <div className={`p-3 rounded border text-center ${
                                darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                              }`}>
                                <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {coherenceResults.thematicUnity.charAt(0).toUpperCase() + coherenceResults.thematicUnity.slice(1)}
                                </div>
                                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Theme Unity</div>
                              </div>
                            )}
                            {coherenceResults.narrativeConsistency && (
                              <div className={`p-3 rounded border text-center ${
                                darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                              }`}>
                                <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {coherenceResults.narrativeConsistency.charAt(0).toUpperCase() + coherenceResults.narrativeConsistency.slice(1)}
                                </div>
                                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Consistency</div>
                              </div>
                            )}
                            {coherenceResults.sectionConnections && (
                              <div className={`p-3 rounded border text-center ${
                                darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                              }`}>
                                <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {coherenceResults.sectionConnections.charAt(0).toUpperCase() + coherenceResults.sectionConnections.slice(1)}
                                </div>
                                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Connections</div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* References */}
                        {coherenceResults.references && coherenceResults.references.length > 0 && (
                          <div className={`rounded border mt-4 overflow-hidden ${
                            darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                          }`}>
                            <div className={`p-3 border-b ${
                              darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                            }`}>
                              <h5 className={`font-medium ${darkMode ? 'text-purple-300' : 'text-purple-800'}`}>
                                📚 Cultural References & Allusions
                              </h5>
                            </div>
                            
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                              <table className="w-full">
                                <thead className={`${
                                  darkMode ? 'bg-gray-750' : 'bg-gray-100'
                                }`}>
                                  <tr>
                                    <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider border-b ${
                                      darkMode ? 'text-gray-300 border-gray-600' : 'text-gray-700 border-gray-200'
                                    }`}>
                                      Type
                                    </th>
                                    <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider border-b ${
                                      darkMode ? 'text-gray-300 border-gray-600' : 'text-gray-700 border-gray-200'
                                    }`}>
                                      Reference
                                    </th>
                                    <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider border-b ${
                                      darkMode ? 'text-gray-300 border-gray-600' : 'text-gray-700 border-gray-200'
                                    }`}>
                                      Context
                                    </th>
                                    <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider border-b ${
                                      darkMode ? 'text-gray-300 border-gray-600' : 'text-gray-700 border-gray-200'
                                    }`}>
                                      Explanation
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {coherenceResults.references.map((ref, index) => (
                                    <tr key={index} className={`border-b ${
                                      darkMode ? 'border-gray-600' : 'border-gray-200'
                                    } ${
                                      index % 2 === 0 
                                        ? darkMode ? 'bg-gray-800' : 'bg-white'
                                        : darkMode ? 'bg-gray-750' : 'bg-gray-50'
                                    }`}>
                                      <td className="px-3 py-3 align-top">
                                        <span className={`inline-block text-xs px-2 py-1 rounded uppercase font-semibold ${
                                          darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800'
                                        }`}>
                                          {ref.type.charAt(0).toUpperCase() + ref.type.slice(1)}
                                        </span>
                                      </td>
                                      <td className={`px-3 py-3 align-top font-medium text-sm ${
                                        darkMode ? 'text-white' : 'text-gray-900'
                                      }`}>
                                        {ref.reference}
                                      </td>
                                      <td className={`px-3 py-3 align-top text-sm ${
                                        darkMode ? 'text-gray-300' : 'text-gray-700'
                                      }`}>
                                        {ref.context || '—'}
                                      </td>
                                      <td className={`px-3 py-3 align-top text-sm ${
                                        darkMode ? 'text-gray-300' : 'text-gray-700'
                                      }`}>
                                        {ref.explanation}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-3 p-3">
                              {coherenceResults.references.map((ref, index) => (
                                <div key={index} className={`p-3 rounded border ${
                                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                                }`}>
                                  {/* Reference Header */}
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <h6 className={`font-medium text-sm ${
                                        darkMode ? 'text-white' : 'text-gray-900'
                                      }`}>
                                        {ref.reference}
                                      </h6>
                                    </div>
                                    <span className={`ml-2 inline-block text-xs px-2 py-1 rounded uppercase font-semibold flex-shrink-0 ${
                                      darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-800'
                                    }`}>
                                      {ref.type.charAt(0).toUpperCase() + ref.type.slice(1)}
                                    </span>
                                  </div>
                                  
                                  {/* Context (if available) */}
                                  {ref.context && ref.context !== '—' && (
                                    <div className="mb-2">
                                      <span className={`text-xs font-medium ${
                                        darkMode ? 'text-gray-400' : 'text-gray-600'
                                      }`}>
                                        Context: 
                                      </span>
                                      <span className={`text-sm ml-1 ${
                                        darkMode ? 'text-gray-300' : 'text-gray-700'
                                      }`}>
                                        {ref.context}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Explanation */}
                                  <div>
                                    <span className={`text-xs font-medium ${
                                      darkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                      Explanation: 
                                    </span>
                                    <p className={`text-sm mt-1 ${
                                      darkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                      {ref.explanation}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`p-3 rounded border ${
                        coherenceResults.needsApiKey
                          ? darkMode ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-200'
                          : darkMode ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-200'
                      }`}>
                        {coherenceResults.needsApiKey ? (
                          <div>
                            <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>
                              🔑 API Key Required
                            </p>
                            <p className={`text-sm mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                              AI analysis requires a Google Gemini API key. Go to <strong>More → AI Settings</strong> to add your free API key.
                            </p>
                          </div>
                        ) : (
                          <p className={`text-sm ${darkMode ? 'text-red-200' : 'text-red-700'}`}>
                            ❌ Analysis failed: {coherenceResults.error}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {analysisType === 'meter-analysis' && (
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Syllable & Meter Analysis: "{analysisResults.song.title}"
              </h3>
              
              <div className="space-y-2">
                {analysisResults.meterAnalysis.map((lineData, index) => (
                  <div key={index} className="flex items-center gap-4 py-2">
                    <span className={`w-12 text-center font-mono text-sm font-bold flex-shrink-0 ${
                      darkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      {lineData.syllables}
                    </span>
                    <span className={`flex-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {lineData.line.trim() || '(empty line)'}
                    </span>
                    <span className={`text-xs flex-shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {lineData.words} words
                    </span>
                  </div>
                ))}
              </div>
              
              <div className={`mt-4 p-4 rounded border ${
                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className={`text-sm space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <div>
                    <strong>Average syllables per line:</strong> {
                      (analysisResults.meterAnalysis.reduce((sum, line) => sum + line.syllables, 0) / 
                      Math.max(1, analysisResults.meterAnalysis.filter(line => line.line.trim()).length)).toFixed(1)
                    }
                  </div>
                  <div>
                    <strong>Total lines:</strong> {analysisResults.meterAnalysis.filter(line => line.line.trim()).length}
                  </div>
                  <div>
                    <strong>Syllable range:</strong> {
                      Math.min(...analysisResults.meterAnalysis.filter(line => line.line.trim()).map(line => line.syllables))
                    } - {
                      Math.max(...analysisResults.meterAnalysis.filter(line => line.line.trim()).map(line => line.syllables))
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>                     
      )}

      {/* Performance Analysis Loading */}
      {performanceLoading && (
        <div className={`p-4 rounded border mt-6 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            🎤 Analyzing Performance & Style...
          </div>
        </div>
      )}

      {/* Performance Analysis Results - COMPLETELY SEPARATE SECTION */}
      {performanceResults && (
        <div className={`rounded border mt-6 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className={`p-4 border-b ${
            darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                🎤 Performance & Style Analysis: "{songs.find(s => s.id.toString() === selectedSongForAnalysis)?.title}"
              </h3>
              <button
                onClick={() => handlePerformanceAnalysis(false)}
                disabled={performanceLoading}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  performanceLoading
                    ? darkMode
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {performanceLoading ? 'Analyzing...' : 'Re-analyze'}
              </button>
            </div>
            {performanceResults.fromCache && (
              <div className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                📋 Results from cache
              </div>
            )}
          </div>

          <div className="p-4">
            {performanceResults.success ? (
              <div className="space-y-6">
                {/* Vocal Flow Section */}
                <div className={`p-4 rounded border ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <h4 className={`font-medium mb-3 flex items-center gap-2 ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                    🌊 Vocal Flow
                    <span className={`text-sm px-2 py-1 rounded ${
                      performanceResults.vocalFlow.overallRating === 'smooth' ? 
                        darkMode ? 'bg-green-800 text-green-200' : 'bg-green-200 text-green-800' :
                      performanceResults.vocalFlow.overallRating === 'complex' ? 
                        darkMode ? 'bg-orange-800 text-orange-200' : 'bg-orange-200 text-orange-800' :
                      performanceResults.vocalFlow.overallRating === 'choppy' ? 
                        darkMode ? 'bg-red-800 text-red-200' : 'bg-red-200 text-red-800' :
                      performanceResults.vocalFlow.overallRating === 'varied' ? 
                        darkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-200 text-blue-800' :
                      darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800'
                    }`}>
                      {performanceResults.vocalFlow.overallRating}
                    </span>
                  </h4>
                  {performanceResults.vocalFlow.flowPatterns.length > 0 && (
                    <div className="mb-3">
                      <h5 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Flow Patterns:
                      </h5>
                      <ul className={`text-sm space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {performanceResults.vocalFlow.flowPatterns.map((pattern, index) => (
                          <li key={index}>• {pattern}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {performanceResults.vocalFlow.difficultSections && performanceResults.vocalFlow.difficultSections.length > 0 && (
                    <div>
                      <h5 className={`text-sm font-medium mb-2 ${darkMode ? 'text-orange-300' : 'text-orange-700'}`}>
                        Challenging Sections:
                      </h5>
                      <ul className={`text-sm space-y-1 ${darkMode ? 'text-orange-200' : 'text-orange-600'}`}>
                        {performanceResults.vocalFlow.difficultSections.map((section, index) => (
                          <li key={index}>⚠️ {section}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Breath Control Section */}
                <div className={`p-4 rounded border ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <h4 className={`font-medium mb-3 flex items-center gap-2 ${darkMode ? 'text-green-300' : 'text-green-800'}`}>
                    💨 Breath Control
                    <span className={`text-sm px-2 py-1 rounded ${
                      performanceResults.breathControl.rating === 'excellent' ? 
                        darkMode ? 'bg-green-800 text-green-200' : 'bg-green-200 text-green-800' :
                      performanceResults.breathControl.rating === 'good' ? 
                        darkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-200 text-blue-800' :
                      performanceResults.breathControl.rating === 'fair' ? 
                        darkMode ? 'bg-yellow-800 text-yellow-200' : 'bg-yellow-200 text-yellow-800' :
                      darkMode ? 'bg-red-800 text-red-200' : 'bg-red-200 text-red-800'
                    }`}>
                      {performanceResults.breathControl.rating}
                    </span>
                  </h4>
                 <div className="grid gap-3 md:grid-cols-2">
                   {performanceResults.breathControl.naturalBreaks && performanceResults.breathControl.naturalBreaks.length > 0 && (
                     <div>
                       <h5 className={`text-sm font-medium mb-2 ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                         Natural Breaks:
                       </h5>
                       <ul className={`text-sm space-y-1 ${darkMode ? 'text-green-200' : 'text-green-600'}`}>
                         {performanceResults.breathControl.naturalBreaks.map((breakPoint, index) => (
                           <li key={index}>✅ {breakPoint}</li>
                         ))}
                       </ul>
                     </div>
                   )}
                   {performanceResults.breathControl.challengingSections && performanceResults.breathControl.challengingSections.length > 0 && (
                     <div>
                       <h5 className={`text-sm font-medium mb-2 ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                         Challenging Sections:
                       </h5>
                       <ul className={`text-sm space-y-1 ${darkMode ? 'text-red-200' : 'text-red-600'}`}>
                         {performanceResults.breathControl.challengingSections.map((section, index) => (
                           <li key={index}>⚠️ {section}</li>
                         ))}
                       </ul>
                     </div>
                   )}
                 </div>
               </div>

               {/* Energy & Mood Dynamics Section */}
               {performanceResults.performanceDynamics.energyMapping && performanceResults.performanceDynamics.energyMapping.length > 0 && (
                 <div className={`p-4 rounded border ${
                   darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                 }`}>
                   <h4 className={`font-medium mb-3 ${darkMode ? 'text-purple-300' : 'text-purple-800'}`}>
                     ⚡ Energy & Mood Dynamics
                   </h4>
                   <div className="space-y-2">
                     {performanceResults.performanceDynamics.energyMapping.map((mapping, index) => (
                       <div key={index} className="flex items-center gap-3">
                         <span className={`text-sm font-medium min-w-20 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                           {mapping.section}:
                         </span>
                         <span className={`text-xs px-2 py-1 rounded font-medium ${
                           mapping.energy === 'high' ? 
                             darkMode ? 'bg-red-800 text-red-200' : 'bg-red-200 text-red-800' :
                           mapping.energy === 'medium' ? 
                             darkMode ? 'bg-yellow-800 text-yellow-200' : 'bg-yellow-200 text-yellow-800' :
                           darkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-200 text-blue-800'
                         }`}>
                           {mapping.energy}
                         </span>
                         <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                           {mapping.description}
                         </span>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               {/* Repetition Analysis Section */}
               <div className={`p-4 rounded border ${
                 darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
               }`}>
                 <h4 className={`font-medium mb-3 ${darkMode ? 'text-orange-300' : 'text-orange-800'}`}>
                   🔄 Repetition Analysis
                 </h4>
                 <div className="grid gap-3 md:grid-cols-3">
                   {performanceResults.repetitionAnalysis.effectiveRepeats && performanceResults.repetitionAnalysis.effectiveRepeats.length > 0 && (
                     <div>
                       <h5 className={`text-sm font-medium mb-2 ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                         Effective Repeats:
                       </h5>
                       <ul className={`text-sm space-y-1 ${darkMode ? 'text-green-200' : 'text-green-600'}`}>
                         {performanceResults.repetitionAnalysis.effectiveRepeats.map((repeat, index) => (
                           <li key={index}>✅ {repeat}</li>
                         ))}
                       </ul>
                     </div>
                   )}
                   {performanceResults.repetitionAnalysis.overusedPhrases && performanceResults.repetitionAnalysis.overusedPhrases.length > 0 && (
                     <div>
                       <h5 className={`text-sm font-medium mb-2 ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                         Overused:
                       </h5>
                       <ul className={`text-sm space-y-1 ${darkMode ? 'text-red-200' : 'text-red-600'}`}>
                         {performanceResults.repetitionAnalysis.overusedPhrases.map((phrase, index) => (
                           <li key={index}>⚠️ {phrase}</li>
                         ))}
                       </ul>
                     </div>
                   )}
                   {performanceResults.repetitionAnalysis.missedOpportunities && performanceResults.repetitionAnalysis.missedOpportunities.length > 0 && (
                     <div>
                       <h5 className={`text-sm font-medium mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                         Opportunities:
                       </h5>
                       <ul className={`text-sm space-y-1 ${darkMode ? 'text-blue-200' : 'text-blue-600'}`}>
                         {performanceResults.repetitionAnalysis.missedOpportunities.map((opportunity, index) => (
                           <li key={index}>💡 {opportunity}</li>
                         ))}
                       </ul>
                     </div>
                   )}
                 </div>
               </div>

               {/* Emotional Progression Section */}
               <div className={`p-4 rounded border ${
                 darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
               }`}>
                 <h4 className={`font-medium mb-3 ${darkMode ? 'text-pink-300' : 'text-pink-800'}`}>
                   💭 Emotional Progression
                 </h4>
                 {performanceResults.emotionalProgression.arc && performanceResults.emotionalProgression.arc.length > 0 && (
                   <div className="mb-3">
                     <h5 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                       Emotional Arc:
                     </h5>
                     <div className="flex items-center gap-2 flex-wrap">
                       {performanceResults.emotionalProgression.arc.map((emotion, index) => (
                         <React.Fragment key={index}>
                           <span className={`px-2 py-1 rounded text-sm ${
                             darkMode ? 'bg-pink-800 text-pink-200' : 'bg-pink-200 text-pink-800'
                           }`}>
                             {emotion}
                           </span>
                           {index < performanceResults.emotionalProgression.arc.length - 1 && (
                             <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>→</span>
                           )}
                         </React.Fragment>
                       ))}
                     </div>
                   </div>
                 )}
                 {performanceResults.emotionalProgression.keyMoments && performanceResults.emotionalProgression.keyMoments.length > 0 && (
                   <div>
                     <h5 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                       Key Emotional Moments:
                     </h5>
                     <ul className={`text-sm space-y-1 ${darkMode ? 'text-pink-200' : 'text-pink-700'}`}>
                       {performanceResults.emotionalProgression.keyMoments.map((moment, index) => (
                         <li key={index}>🎯 {moment}</li>
                       ))}
                     </ul>
                   </div>
                 )}
               </div>

               {/* Era/Influence Section */}
               <div className={`p-4 rounded border ${
                 darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
               }`}>
                 <h4 className={`font-medium mb-3 ${darkMode ? 'text-indigo-300' : 'text-indigo-800'}`}>
                   🎵 Era & Influence Detection
                 </h4>
                 <div className="grid gap-3 md:grid-cols-3">
                   <div>
                     <h5 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                       Primary Era:
                     </h5>
                     <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                       darkMode ? 'bg-indigo-800 text-indigo-200' : 'bg-indigo-200 text-indigo-800'
                     }`}>
                       {performanceResults.eraInfluence.primaryEra}
                     </span>
                   </div>
                   {performanceResults.eraInfluence.influences && performanceResults.eraInfluence.influences.length > 0 && (
                     <div>
                       <h5 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                         Influences:
                       </h5>
                       <ul className={`text-sm space-y-1 ${darkMode ? 'text-indigo-200' : 'text-indigo-700'}`}>
                         {performanceResults.eraInfluence.influences.map((influence, index) => (
                           <li key={index}>🎸 {influence}</li>
                         ))}
                       </ul>
                     </div>
                   )}
                   {performanceResults.eraInfluence.modernElements && performanceResults.eraInfluence.modernElements.length > 0 && (
                     <div>
                       <h5 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                         Modern Elements:
                       </h5>
                       <ul className={`text-sm space-y-1 ${darkMode ? 'text-indigo-200' : 'text-indigo-700'}`}>
                         {performanceResults.eraInfluence.modernElements.map((element, index) => (
                           <li key={index}>✨ {element}</li>
                         ))}
                       </ul>
                     </div>
                   )}
                 </div>
               </div>

               {/* Hook Analysis Section (NEW) */}
               {performanceResults.hookAnalysis && (
                 <div className={`p-4 rounded border ${
                   darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                 }`}>
                   <h4 className={`font-medium mb-3 ${darkMode ? 'text-amber-300' : 'text-amber-800'}`}>
                     🎣 Hook Analysis
                   </h4>
                   {performanceResults.hookAnalysis.primaryHook && (
                     <div className={`p-3 rounded mb-3 ${darkMode ? 'bg-amber-900/30' : 'bg-amber-50'}`}>
                       <p className={`text-sm font-medium ${darkMode ? 'text-amber-200' : 'text-amber-700'}`}>
                         Primary Hook: "{performanceResults.hookAnalysis.primaryHook}"
                       </p>
                     </div>
                   )}
                   {performanceResults.hookAnalysis.secondaryHooks?.length > 0 && (
                     <div className="mb-3">
                       <h5 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                         Secondary Hooks:
                       </h5>
                       <ul className={`text-sm space-y-1 ${darkMode ? 'text-amber-200' : 'text-amber-600'}`}>
                         {performanceResults.hookAnalysis.secondaryHooks.map((hook, index) => (
                           <li key={index}>🎵 {hook}</li>
                         ))}
                       </ul>
                     </div>
                   )}
                   <div className="grid gap-3 md:grid-cols-2">
                     {performanceResults.hookAnalysis.earwormRating && (
                       <div className={`p-2 rounded text-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                         <div className={`text-xl font-bold ${darkMode ? 'text-amber-300' : 'text-amber-600'}`}>
                           {performanceResults.hookAnalysis.earwormRating}/10
                         </div>
                         <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Earworm Rating</div>
                       </div>
                     )}
                     {performanceResults.hookAnalysis.singalongPotential && (
                       <div className={`p-2 rounded text-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                         <div className={`text-xl font-bold ${darkMode ? 'text-amber-300' : 'text-amber-600'}`}>
                           {performanceResults.hookAnalysis.singalongPotential}/10
                         </div>
                         <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Singalong Potential</div>
                       </div>
                     )}
                   </div>
                   {performanceResults.hookAnalysis.hookExplanation && (
                     <p className={`text-sm mt-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                       {performanceResults.hookAnalysis.hookExplanation}
                     </p>
                   )}
                 </div>
               )}

               {/* Rhythmic Analysis Section (NEW) */}
               {performanceResults.rhythmicAnalysis && (
                 <div className={`p-4 rounded border ${
                   darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                 }`}>
                   <h4 className={`font-medium mb-3 ${darkMode ? 'text-teal-300' : 'text-teal-800'}`}>
                     🥁 Rhythmic Analysis
                   </h4>
                   <div className="grid gap-3 md:grid-cols-2">
                     {performanceResults.rhythmicAnalysis.dominantPattern && (
                       <div>
                         <h5 className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                           Dominant Pattern:
                         </h5>
                         <p className={`text-sm ${darkMode ? 'text-teal-200' : 'text-teal-700'}`}>
                           {performanceResults.rhythmicAnalysis.dominantPattern}
                         </p>
                       </div>
                     )}
                     {performanceResults.rhythmicAnalysis.grooveFeel && (
                       <div>
                         <h5 className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                           Groove Feel:
                         </h5>
                         <span className={`inline-block px-2 py-1 rounded text-sm ${
                           darkMode ? 'bg-teal-900 text-teal-200' : 'bg-teal-100 text-teal-800'
                         }`}>
                           {performanceResults.rhythmicAnalysis.grooveFeel}
                         </span>
                       </div>
                     )}
                     {performanceResults.rhythmicAnalysis.tempoImplication && (
                       <div>
                         <h5 className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                           Tempo Implication:
                         </h5>
                         <p className={`text-sm ${darkMode ? 'text-teal-200' : 'text-teal-700'}`}>
                           {performanceResults.rhythmicAnalysis.tempoImplication}
                         </p>
                       </div>
                     )}
                     {performanceResults.rhythmicAnalysis.syncopation && (
                       <div>
                         <h5 className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                           Syncopation:
                         </h5>
                         <p className={`text-sm ${darkMode ? 'text-teal-200' : 'text-teal-700'}`}>
                           {performanceResults.rhythmicAnalysis.syncopation}
                         </p>
                       </div>
                     )}
                   </div>
                 </div>
               )}

               {/* Singability Score Section (NEW) */}
               {performanceResults.singabilityScore && (
                 <div className={`p-4 rounded border ${
                   darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                 }`}>
                   <h4 className={`font-medium mb-3 ${darkMode ? 'text-rose-300' : 'text-rose-800'}`}>
                     🎤 Singability Score
                   </h4>
                   <div className="grid gap-3 md:grid-cols-4 mb-3">
                     {performanceResults.singabilityScore.overall && (
                       <div className={`p-3 rounded text-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                         <div className={`text-2xl font-bold ${
                           performanceResults.singabilityScore.overall >= 8 ? 'text-green-500' :
                           performanceResults.singabilityScore.overall >= 5 ? 'text-yellow-500' : 'text-red-500'
                         }`}>
                           {performanceResults.singabilityScore.overall}/10
                         </div>
                         <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Overall</div>
                       </div>
                     )}
                     {performanceResults.singabilityScore.memorability && (
                       <div className={`p-3 rounded text-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                         <div className={`text-2xl font-bold ${darkMode ? 'text-rose-300' : 'text-rose-600'}`}>
                           {performanceResults.singabilityScore.memorability}/10
                         </div>
                         <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Memorability</div>
                       </div>
                     )}
                     {performanceResults.singabilityScore.technicalDifficulty && (
                       <div className={`p-3 rounded text-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                         <div className={`text-2xl font-bold ${darkMode ? 'text-rose-300' : 'text-rose-600'}`}>
                           {performanceResults.singabilityScore.technicalDifficulty}/10
                         </div>
                         <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Tech. Difficulty</div>
                       </div>
                     )}
                     {performanceResults.singabilityScore.rangeRequirement && (
                       <div className={`p-3 rounded text-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                         <div className={`text-lg font-bold ${darkMode ? 'text-rose-300' : 'text-rose-600'}`}>
                           {performanceResults.singabilityScore.rangeRequirement}
                         </div>
                         <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Range Required</div>
                       </div>
                     )}
                   </div>
                   {performanceResults.singabilityScore.assessmentNotes && (
                     <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                       {performanceResults.singabilityScore.assessmentNotes}
                     </p>
                   )}
                 </div>
               )}

               {/* Production Notes Section (NEW) */}
               {performanceResults.productionNotes && (
                 <div className={`p-4 rounded border ${
                   darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                 }`}>
                   <h4 className={`font-medium mb-3 ${darkMode ? 'text-violet-300' : 'text-violet-800'}`}>
                     🎛️ Production Recommendations
                   </h4>
                   <div className="grid gap-3 md:grid-cols-2">
                     {performanceResults.productionNotes.suggestedInstrumentation?.length > 0 && (
                       <div>
                         <h5 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                           Suggested Instruments:
                         </h5>
                         <div className="flex flex-wrap gap-1">
                           {performanceResults.productionNotes.suggestedInstrumentation.map((inst, index) => (
                             <span key={index} className={`text-xs px-2 py-1 rounded ${
                               darkMode ? 'bg-violet-900 text-violet-200' : 'bg-violet-100 text-violet-800'
                             }`}>
                               {inst}
                             </span>
                           ))}
                         </div>
                       </div>
                     )}
                     {performanceResults.productionNotes.sonicTexture && (
                       <div>
                         <h5 className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                           Sonic Texture:
                         </h5>
                         <p className={`text-sm ${darkMode ? 'text-violet-200' : 'text-violet-700'}`}>
                           {performanceResults.productionNotes.sonicTexture}
                         </p>
                       </div>
                     )}
                   </div>
                   {performanceResults.productionNotes.arrangementIdeas && (
                     <div className="mt-3">
                       <h5 className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                         Arrangement Ideas:
                       </h5>
                       <p className={`text-sm ${darkMode ? 'text-violet-200' : 'text-violet-700'}`}>
                         {performanceResults.productionNotes.arrangementIdeas}
                       </p>
                     </div>
                   )}
                   {performanceResults.productionNotes.mixApproach && (
                     <div className="mt-3">
                       <h5 className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                         Mix Approach:
                       </h5>
                       <p className={`text-sm ${darkMode ? 'text-violet-200' : 'text-violet-700'}`}>
                         {performanceResults.productionNotes.mixApproach}
                       </p>
                     </div>
                   )}
                 </div>
               )}

               {/* Overall Performance Notes (NEW) */}
               {performanceResults.overallPerformanceNotes && (
                 <div className={`p-4 rounded border ${
                   darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                 }`}>
                   <h4 className={`font-medium mb-3 ${darkMode ? 'text-green-300' : 'text-green-800'}`}>
                     📝 Performance Guide
                   </h4>
                   <p className={`text-sm whitespace-pre-line ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                     {performanceResults.overallPerformanceNotes}
                   </p>
                 </div>
               )}
             </div>
           ) : (
             <div className={`p-4 rounded border ${
                performanceResults.needsApiKey
                  ? darkMode ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-200'
                  : darkMode ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-200'
              }`}>
                {performanceResults.needsApiKey ? (
                  <div>
                    <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>
                      🔑 API Key Required
                    </p>
                    <p className={`text-sm mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                      AI analysis requires a Google Gemini API key. Go to <strong>More → AI Settings</strong> to add your free API key.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className={`text-sm mb-3 ${darkMode ? 'text-red-200' : 'text-red-700'}`}>
                      ❌ Analysis failed: {performanceResults.error}
                    </p>
                    {performanceResults.retryable && (
                      <button
                        onClick={() => handlePerformanceAnalysis(true)}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          darkMode
                            ? 'bg-red-800 hover:bg-red-700 text-red-200'
                            : 'bg-red-200 hover:bg-red-300 text-red-800'
                        }`}
                      >
                        Try Again (Force Fresh)
                      </button>
                    )}
                  </>
                )}
              </div>
           )}
         </div>
       </div>
     )}
   </div>
  );
};

export default AnalysisTab;