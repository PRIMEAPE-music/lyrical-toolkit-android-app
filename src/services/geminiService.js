import { getGeminiApiKey, isApiKeyConfigured } from './settingsService';

// ============================================================================
// LRU Cache with TTL - Prevents unbounded memory growth
// ============================================================================
class LRUCache {
  constructor(maxSize = 50, ttlMs = 30 * 60 * 1000) {
    this.maxSize = maxSize;           // Maximum number of entries
    this.ttlMs = ttlMs;               // Time-to-live in milliseconds (default: 30 minutes)
    this.cache = new Map();           // Map maintains insertion order for LRU
  }

  // Check if a key exists and is not expired
  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }

    const entry = this.cache.get(key);
    if (this._isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Get a value, refreshing its position (most recently used)
  get(key) {
    if (!this.has(key)) {
      return undefined;
    }

    const entry = this.cache.get(key);

    // Move to end (most recently used) by deleting and re-adding
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  // Set a value, evicting oldest if at capacity
  set(key, value) {
    // If key exists, delete it first (will be re-added at end)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest entries if at capacity
    while (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      console.log(`LRU Cache: Evicted oldest entry`);
    }

    // Add new entry with timestamp
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  // Delete a specific key
  delete(key) {
    return this.cache.delete(key);
  }

  // Clear all entries
  clear() {
    this.cache.clear();
  }

  // Get current cache size
  get size() {
    // Clean expired entries first
    this._cleanExpired();
    return this.cache.size;
  }

  // Check if an entry is expired
  _isExpired(entry) {
    return Date.now() - entry.timestamp > this.ttlMs;
  }

  // Remove all expired entries
  _cleanExpired() {
    for (const [key, entry] of this.cache) {
      if (this._isExpired(entry)) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache stats for debugging
  getStats() {
    this._cleanExpired();
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttlMinutes: this.ttlMs / 60000
    };
  }
}

// ============================================================================
// Prompts for analysis - Enhanced for maximum depth
// ============================================================================

// MULTI-PASS PROMPTS for deeper coherence analysis

function createCoherencePass1Prompt(lyrics, songTitle) {
  return `You are an expert literary analyst. Perform Pass 1 of a deep analysis of "${songTitle}" - focusing on NARRATIVE ARCHITECTURE, THEMATIC DEPTH, and EMOTIONAL JOURNEY.

LYRICS TO ANALYZE:
${lyrics}

PASS 1 FOCUS AREAS:

1. NARRATIVE ARCHITECTURE (exhaustive analysis)
- What is the story structure? (traditional arc, fragmented narrative, circular structure, stream of consciousness, etc.)
- Who is the narrator? First person confessional? Second person address? Third person observer? Unreliable narrator?
- Is the point of view consistent or does it shift? If it shifts, why?
- What is the temporal structure? Chronological? Non-linear? Flashbacks? Flash-forwards? Eternal present?
- How do individual verses function as scenes? What happens in each?
- Where is the narrative tension? What is at stake?

2. THEMATIC ANALYSIS (comprehensive)
- What is the PRIMARY theme - the single most important idea?
- What SECONDARY themes support or complicate the primary theme?
- How do themes EVOLVE from beginning to end? Do they deepen, transform, or get resolved?
- Is there THEMATIC TENSION - conflicting ideas that create complexity?
- Does this speak to UNIVERSAL human experiences or is it highly specific/personal?
- What SUBTEXT exists beneath the surface meaning?

3. EMOTIONAL JOURNEY (detailed mapping)
- What is the opening emotional state? Set the baseline.
- Map EVERY emotional shift throughout the song
- Identify the TURNING POINTS - moments where the emotional direction changes
- What is the CLIMACTIC emotional moment?
- Is there emotional resolution, or does it end in tension/ambiguity?
- Rate the EMOTIONAL AUTHENTICITY - does it feel genuine or performed?

Provide ratings: "masterful", "excellent", "good", "fair", or "weak"

Return JSON:
{
  "pass": 1,
  "narrativeArchitecture": {
    "rating": "masterful/excellent/good/fair/weak",
    "structure": "detailed description of narrative structure type and why",
    "pointOfView": "comprehensive POV analysis",
    "temporalStructure": "analysis of time handling",
    "sceneByScene": ["verse 1 scene description", "chorus scene description", "verse 2...", etc],
    "narrativeTension": "what's at stake and where tension lives",
    "analysis": "2-3 paragraph deep dive on narrative construction"
  },
  "thematicAnalysis": {
    "rating": "masterful/excellent/good/fair/weak",
    "primaryTheme": "the central theme with explanation",
    "secondaryThemes": [{"theme": "name", "relationship": "how it connects to primary"}],
    "thematicEvolution": "detailed description of how themes develop",
    "thematicTension": "conflicting ideas if present",
    "universalVsPersonal": "analysis of scope",
    "subtext": "what lies beneath the surface",
    "analysis": "2-3 paragraph deep dive on thematic content"
  },
  "emotionalJourney": {
    "rating": "masterful/excellent/good/fair/weak",
    "openingState": "baseline emotional state",
    "emotionalMap": [{"section": "verse 1", "emotion": "description", "intensity": 1-10}],
    "turningPoints": [{"moment": "specific lyric or section", "from": "emotion", "to": "emotion"}],
    "climax": "the peak emotional moment and why",
    "resolution": "how it ends emotionally",
    "authenticity": "assessment of emotional genuineness",
    "analysis": "2-3 paragraph deep dive on emotional impact"
  },
  "pass1Summary": "A paragraph summarizing the key findings of this narrative/thematic/emotional pass"
}`;
}

function createCoherencePass2Prompt(lyrics, songTitle, pass1Summary) {
  return `You are a cultural studies scholar and literary detective. Perform Pass 2 of a deep analysis of "${songTitle}" - focusing on CULTURAL REFERENCES, ALLUSIONS, and INTERTEXTUALITY.

LYRICS TO ANALYZE:
${lyrics}

CONTEXT FROM PASS 1:
${pass1Summary}

PASS 2 FOCUS: Hunt for EVERY possible reference, allusion, and connection. Be thorough - even subtle or possible references should be noted.

REFERENCE CATEGORIES TO INVESTIGATE:

1. BIBLICAL/RELIGIOUS REFERENCES
- Direct quotes from scripture
- Paraphrased biblical language
- Biblical imagery (gardens, serpents, floods, etc.)
- Religious figures (angels, devils, prophets)
- Parables or biblical stories
- Denominations or religious practices

2. CLASSICAL MYTHOLOGY
- Greek mythology (gods, heroes, creatures, stories)
- Roman mythology
- Norse mythology
- Egyptian mythology
- Other mythological traditions

3. LITERARY REFERENCES
- Poetry (cite specific poets and poems)
- Novels (cite specific books and authors)
- Plays (Shakespeare and others)
- Fairy tales and folk stories
- Literary movements or styles

4. HISTORICAL REFERENCES
- Historical events
- Historical figures
- Historical eras or periods
- Wars, revolutions, movements

5. POP CULTURE REFERENCES
- Films and TV shows
- Other songs or artists
- Memes and internet culture
- Celebrities and public figures
- Brand names or products

6. PHILOSOPHICAL REFERENCES
- Specific philosophers
- Philosophical concepts (existentialism, nihilism, etc.)
- Famous philosophical quotes or ideas
- Schools of thought

7. ARTISTIC/VISUAL REFERENCES
- Paintings or artists
- Artistic movements
- Photography or photographers
- Architecture

8. GEOGRAPHIC/CULTURAL REFERENCES
- Specific places with significance
- Cultural practices or traditions
- Regional dialects or expressions
- Cultural stereotypes being used or subverted

For EACH reference found, provide:
- The exact lyrics where it appears
- The source material being referenced
- Whether it's OVERT (obvious), SUBTLE (requires knowledge to catch), or POSSIBLE (might be coincidental)
- What meaning it adds to the song
- How it connects to the themes from Pass 1

Return JSON:
{
  "pass": 2,
  "references": [
    {
      "type": "biblical/mythological/literary/historical/pop-culture/philosophical/artistic/geographic",
      "reference": "Name of the reference",
      "source": "Original source material (e.g., 'Genesis 3:1-7' or 'Hamlet Act 3 Scene 1')",
      "context": "Exact lyrics where this appears",
      "subtlety": "overt/subtle/possible",
      "explanation": "Deep analysis of how this reference is used",
      "thematicConnection": "How this connects to the themes identified in Pass 1"
    }
  ],
  "intertextuality": {
    "primaryInfluences": ["works/genres this most echoes"],
    "dialogueWith": "what literary/cultural conversation is this participating in?",
    "originalityAssessment": "how does this use references - derivative, transformative, or innovative?"
  },
  "culturalContext": {
    "eraMarkers": ["cultural touchstones that date or situate this"],
    "audienceAssumptions": "what cultural knowledge does the ideal listener need?",
    "accessibilityScore": 1-10
  },
  "pass2Summary": "A paragraph summarizing the reference landscape and cultural positioning of this song"
}`;
}

function createCoherencePass3Prompt(lyrics, songTitle, pass1Summary, pass2Summary) {
  return `You are a master craftsperson and literary critic. Perform Pass 3 of a deep analysis of "${songTitle}" - focusing on LITERARY TECHNIQUES, IMAGERY, SYMBOLISM, and STRUCTURAL CRAFT.

LYRICS TO ANALYZE:
${lyrics}

CONTEXT FROM PREVIOUS PASSES:
Pass 1 (Narrative/Theme/Emotion): ${pass1Summary}
Pass 2 (References/Allusions): ${pass2Summary}

PASS 3 FOCUS: Analyze the CRAFT - the specific techniques and choices that make this writing work (or not).

CRAFT ANALYSIS AREAS:

1. IMAGERY & SENSORY LANGUAGE
- Visual imagery - what do we SEE?
- Auditory imagery - what do we HEAR?
- Tactile imagery - what do we FEEL physically?
- Olfactory/gustatory - smell and taste?
- Kinesthetic - movement and body sensation?
- Which sense dominates and why?
- Are images concrete or abstract?

2. SYMBOLISM
- What objects, colors, or concepts carry symbolic weight?
- Are symbols traditional (rose = love) or invented for this song?
- How do symbols evolve or transform through the song?
- Is symbolism heavy-handed or elegant?

3. FIGURATIVE LANGUAGE
- Metaphors - identify each major metaphor and evaluate its effectiveness
- Similes - how are comparisons made?
- Personification - what non-human things are given human qualities?
- Hyperbole - intentional exaggeration?
- Metonymy/synecdoche - parts for wholes?

4. SOUND DEVICES
- Rhyme (end rhyme, internal rhyme, slant rhyme)
- Alliteration and consonance
- Assonance
- Onomatopoeia
- Rhythm and meter patterns
- How do sound devices support meaning?

5. STRUCTURAL TECHNIQUES
- Repetition - what repeats and why?
- Parallelism - similar structural patterns
- Contrast/juxtaposition - what is placed against what?
- Callbacks - how do later sections reference earlier ones?
- The chorus function - how does it work with verses?
- Bridgework - what does the bridge accomplish?

6. RHETORICAL DEVICES
- Anaphora (repetition at start of lines)
- Epistrophe (repetition at end of lines)
- Chiasmus (reversed structures)
- Paradox and oxymoron
- Irony (verbal, situational, dramatic)
- Rhetorical questions

7. AMBIGUITY & MULTIPLE MEANINGS
- Where does the text support multiple interpretations?
- Is ambiguity intentional craft or unclear writing?
- What is left unsaid but implied?

Return JSON:
{
  "pass": 3,
  "imagerySymbolism": {
    "rating": "masterful/excellent/good/fair/weak",
    "dominantSense": "which sensory mode dominates",
    "imageryPatterns": [{"pattern": "description", "examples": ["lyric quote"], "effect": "what it achieves"}],
    "symbols": [{"symbol": "name", "meaning": "interpretation", "evolution": "how it changes through song"}],
    "metaphorAnalysis": [{"metaphor": "quote", "vehicle": "the comparison", "tenor": "what's being described", "effectiveness": "rating and why"}],
    "analysis": "2-3 paragraph assessment of imagery and symbolism"
  },
  "soundCraft": {
    "rating": "masterful/excellent/good/fair/weak",
    "rhymeScheme": "description of rhyme patterns used",
    "soundDevices": [{"device": "alliteration/assonance/etc", "example": "quote", "effect": "what it achieves"}],
    "musicality": "how the language sounds when spoken/sung",
    "analysis": "paragraph on sonic qualities"
  },
  "literaryTechniques": {
    "rating": "masterful/excellent/good/fair/weak",
    "techniques": [{"technique": "name", "usage": "how it's employed", "example": "quote", "effect": "what it achieves"}],
    "repetitionStrategy": "analysis of what repeats and why",
    "contrastJuxtaposition": "what opposing elements create tension",
    "analysis": "2-3 paragraph deep dive on technique"
  },
  "structuralCohesion": {
    "rating": "masterful/excellent/good/fair/weak",
    "sectionFlow": "how sections connect and transition",
    "chorusFunction": "specific analysis of chorus role",
    "bridgeFunction": "what the bridge accomplishes (if present)",
    "callbacksEchoes": ["how later parts reference earlier"],
    "analysis": "paragraph on structural effectiveness"
  },
  "ambiguityMultivalence": {
    "intentionalAmbiguity": [{"moment": "quote", "interpretations": ["reading 1", "reading 2"]}],
    "unsaidImplied": "what the text suggests without stating",
    "openEndedness": "how much is left for listener interpretation"
  },
  "craftVerdict": {
    "greatestStrength": "the most impressive craft element",
    "biggestWeakness": "the area needing most improvement",
    "overallCraftRating": 1-100,
    "comparableTo": "what published/known songs this craft level resembles"
  },
  "pass3Summary": "A paragraph summarizing the craft analysis"
}`;
}

function createCoherenceFinalSynthesis(lyrics, songTitle, pass1Data, pass2Data, pass3Data) {
  // Extract only the essential summary data to avoid circular reference issues
  // and reduce prompt size. The full objects may contain circular refs that crash JSON.stringify
  const safePass1 = {
    pass1Summary: pass1Data?.pass1Summary || 'Narrative/theme analysis completed.',
    narrativeArchitecture: pass1Data?.narrativeArchitecture,
    thematicAnalysis: pass1Data?.thematicAnalysis,
    emotionalJourney: pass1Data?.emotionalJourney
  };
  const safePass2 = {
    pass2Summary: pass2Data?.pass2Summary || 'Reference analysis completed.',
    references: pass2Data?.references,
    intertextuality: pass2Data?.intertextuality,
    culturalContext: pass2Data?.culturalContext
  };
  const safePass3 = {
    pass3Summary: pass3Data?.pass3Summary || 'Craft analysis completed.',
    imagerySymbolism: pass3Data?.imagerySymbolism,
    soundCraft: pass3Data?.soundCraft,
    literaryTechniques: pass3Data?.literaryTechniques,
    craftVerdict: pass3Data?.craftVerdict
  };

  return `You are a senior literary critic writing for a prestigious publication. Synthesize all analysis passes into a FINAL COMPREHENSIVE ASSESSMENT of "${songTitle}".

LYRICS:
${lyrics}

PASS 1 DATA (Narrative/Theme/Emotion):
${JSON.stringify(safePass1, null, 2)}

PASS 2 DATA (References/Allusions):
${JSON.stringify(safePass2, null, 2)}

PASS 3 DATA (Craft/Technique):
${JSON.stringify(safePass3, null, 2)}

Create a final synthesis that:
1. Weighs all evidence from all passes
2. Identifies how elements work TOGETHER (or against each other)
3. Places this work in context of songwriting tradition
4. Gives a fair, substantive final assessment

Return JSON:
{
  "coherenceScore": 0-100,
  "storyFlow": "excellent/good/fair/weak",
  "thematicUnity": "excellent/good/fair/weak",
  "narrativeConsistency": "excellent/good/fair/weak",
  "sectionConnections": "excellent/good/fair/weak",
  "overallAssessment": "4-5 paragraph comprehensive literary analysis that synthesizes all findings. This should read like a serious critical essay - discussing narrative achievement, thematic depth, emotional resonance, cultural positioning, and technical craft. Be specific, cite examples from the lyrics, and give genuine critical assessment. End with where this ranks in terms of songwriting achievement and what makes it successful or what holds it back."
}`;
}

function createCoherenceAnalysisPrompt(lyrics, songTitle) {
  return `You are an expert literary analyst and musicologist. Perform an exhaustive, scholarly analysis of the lyrical coherence, narrative architecture, and thematic depth of "${songTitle}".

LYRICS TO ANALYZE:
${lyrics}

ANALYSIS FRAMEWORK - Provide deep, substantive analysis for each category:

1. NARRATIVE ARCHITECTURE
- Story structure: Does this follow a traditional arc (exposition, rising action, climax, resolution) or an unconventional structure?
- Point of view: Who is the narrator? Is it consistent? Are there shifts in perspective?
- Temporal structure: Is it chronological, non-linear, or uses flashbacks/flash-forwards?
- Scene construction: How do individual verses function as scenes?

2. THEMATIC ANALYSIS
- Primary theme: What is the central message or emotional core?
- Secondary themes: What supporting ideas weave through the lyrics?
- Thematic development: How do themes evolve from beginning to end?
- Thematic tension: Are there conflicting ideas that create depth?
- Universal vs. personal: Does this speak to universal human experiences?

3. IMAGERY & SYMBOLISM
- Dominant imagery patterns: What sensory details recur?
- Symbolic objects/concepts: What carries deeper meaning?
- Metaphor analysis: Break down the major metaphors and their effectiveness
- Color symbolism, nature imagery, body imagery if present

4. EMOTIONAL JOURNEY
- Opening emotional state
- Emotional turning points
- Climactic emotional moment
- Resolution or lack thereof
- Emotional authenticity assessment

5. LITERARY TECHNIQUES
- Repetition and its purpose
- Contrast and juxtaposition
- Foreshadowing or callbacks
- Irony (verbal, situational, dramatic)
- Ambiguity and its effects

6. CULTURAL REFERENCES & ALLUSIONS
Identify ALL references to:
- Biblical/religious texts (specific verses, parables, figures)
- Classical mythology (Greek, Roman, Norse, etc.)
- Literature (novels, poems, plays - cite specific works)
- Historical events and figures
- Pop culture (films, TV, other songs, memes)
- Philosophy and philosophical concepts
- Art and artistic movements
- Geographic/cultural significance

For each reference, explain:
- The source material
- How it's used in the lyrics
- What it adds to the meaning
- Whether it's overt or subtle

7. STRUCTURAL COHESION
- How well do sections connect?
- Are transitions smooth or jarring (intentionally or not)?
- Does the chorus recontextualize with each verse?
- Bridge function: How does it serve the whole?

Rate each major category: "masterful", "excellent", "good", "fair", or "weak"
Provide an overall coherence score from 0-100.

Return JSON with this structure:
{
  "coherenceScore": 0-100,
  "narrativeArchitecture": {
    "rating": "masterful/excellent/good/fair/weak",
    "structure": "description of narrative structure",
    "pointOfView": "analysis of POV",
    "analysis": "detailed paragraph analyzing the narrative construction"
  },
  "thematicAnalysis": {
    "rating": "masterful/excellent/good/fair/weak",
    "primaryTheme": "the central theme",
    "secondaryThemes": ["theme 1", "theme 2"],
    "thematicEvolution": "how themes develop throughout",
    "analysis": "detailed paragraph on thematic depth"
  },
  "imagerySymbolism": {
    "rating": "masterful/excellent/good/fair/weak",
    "dominantImagery": ["imagery pattern 1", "imagery pattern 2"],
    "symbols": [{"symbol": "name", "meaning": "interpretation"}],
    "metaphorAnalysis": "breakdown of key metaphors",
    "analysis": "detailed paragraph on imagery effectiveness"
  },
  "emotionalJourney": {
    "rating": "masterful/excellent/good/fair/weak",
    "arc": ["opening state", "development", "climax", "resolution"],
    "turningPoints": ["moment 1", "moment 2"],
    "authenticity": "assessment of emotional authenticity",
    "analysis": "detailed paragraph on emotional impact"
  },
  "literaryTechniques": {
    "rating": "masterful/excellent/good/fair/weak",
    "techniques": [{"technique": "name", "usage": "how it's used", "effect": "what it achieves"}],
    "analysis": "detailed paragraph on craft and technique"
  },
  "references": [
    {
      "type": "biblical/literary/mythological/historical/pop-culture/philosophical/artistic",
      "reference": "Name of reference",
      "source": "Original source material",
      "context": "Exact lyrics where it appears",
      "explanation": "Deep analysis of how it's used and what it adds",
      "subtlety": "overt/subtle/hidden"
    }
  ],
  "structuralCohesion": {
    "rating": "masterful/excellent/good/fair/weak",
    "sectionFlow": "how sections connect",
    "chorusFunction": "how chorus works with verses",
    "analysis": "detailed paragraph on structural effectiveness"
  },
  "overallAssessment": "A comprehensive 3-4 paragraph literary analysis summarizing the work's strengths, notable achievements, artistic merit, and place within songwriting tradition. Be specific and cite examples from the lyrics.",
  "storyFlow": "excellent/good/fair/weak",
  "thematicUnity": "excellent/good/fair/weak",
  "narrativeConsistency": "excellent/good/fair/weak",
  "sectionConnections": "excellent/good/fair/weak"
}`;
}

function createPerformanceAnalysisPrompt(lyrics, songTitle) {
  return `You are an expert vocal coach, music producer, and performance analyst. Perform an exhaustive analysis of how "${songTitle}" would be performed, its stylistic DNA, and its sonic potential.

LYRICS TO ANALYZE:
${lyrics}

PERFORMANCE ANALYSIS FRAMEWORK - Provide deep, actionable analysis:

1. VOCAL DELIVERY ANALYSIS
- Syllabic flow: Map the natural rhythmic patterns
- Consonant clusters: Identify tongue-twisters or difficult sequences
- Vowel sounds: Note sustained vowels good for belting vs. quick passages
- Alliteration and assonance effects on delivery
- Recommended vocal approach (breathy, powerful, conversational, etc.)

2. BREATH MAPPING
- Natural caesuras (pause points) in each section
- Phrases requiring breath support
- Potential breath-stealing sections
- Suggested breath marks for optimal delivery

3. DYNAMIC ARCHITECTURE
- Energy contour from start to finish
- Micro-dynamics within sections
- Build-up patterns and release points
- Recommended volume/intensity mapping

4. RHYTHMIC ANALYSIS
- Internal rhythm patterns
- Syncopation opportunities
- Metric feel (straight, swung, mixed)
- Tempo implications from word density

5. HOOK ANALYSIS
- Identify the catchiest phrases
- Melodic/rhythmic hook potential
- Earworm qualities
- Singalong potential rating

6. GENRE DNA & INFLUENCES
- Primary genre classification
- Sub-genre elements
- Era/decade influences (be specific: "late 90s alternative" not just "90s")
- Artist comparisons (at least 3-5 specific artists with explanation)
- Production style implications
- Cross-genre potential

7. EMOTIONAL PERFORMANCE MAP
- Section-by-section emotional coloring
- Dynamic contrast opportunities
- Climactic moment identification
- Emotional authenticity requirements

8. PRODUCTION RECOMMENDATIONS
- Suggested instrumentation
- Arrangement ideas based on lyrics
- Sonic texture suggestions
- Mix approach implications

9. SINGABILITY SCORE
- Overall ease of singing (1-10)
- Memorability factor (1-10)
- Range requirements assessment
- Technical difficulty assessment

Return JSON with this structure:
{
  "vocalFlow": {
    "overallRating": "smooth/flowing/varied/complex/challenging",
    "syllabicAnalysis": "detailed analysis of syllabic patterns",
    "flowPatterns": ["specific pattern 1", "specific pattern 2", "pattern 3"],
    "difficultSections": ["section with explanation why"],
    "recommendedApproach": "specific vocal delivery recommendation"
  },
  "breathControl": {
    "rating": "excellent/good/fair/challenging",
    "naturalBreaks": ["break point 1 with context", "break point 2"],
    "challengingSections": ["challenging section with explanation"],
    "breathMap": "overview of breath requirements"
  },
  "performanceDynamics": {
    "overallArc": "description of the dynamic journey",
    "energyMapping": [
      {"section": "intro/verse 1/pre-chorus/chorus/etc", "energy": "intimate/building/explosive/reflective", "intensity": 1-10, "description": "detailed mood and delivery notes"}
    ],
    "climaxPoint": "where the emotional/dynamic peak occurs",
    "buildUpPattern": "how energy builds throughout"
  },
  "rhythmicAnalysis": {
    "dominantPattern": "description of main rhythmic feel",
    "syncopation": "syncopation opportunities or challenges",
    "tempoImplication": "suggested tempo range based on word density",
    "grooveFeel": "straight/swung/mixed/free"
  },
  "hookAnalysis": {
    "primaryHook": "the catchiest phrase or line",
    "secondaryHooks": ["other memorable phrases"],
    "earwormRating": 1-10,
    "singalongPotential": 1-10,
    "hookExplanation": "why these hooks work"
  },
  "repetitionAnalysis": {
    "effectiveRepeats": ["phrase that works well repeated with explanation"],
    "overusedPhrases": ["phrase that might fatigue with explanation"],
    "strategicRepetition": "analysis of repetition strategy overall"
  },
  "emotionalProgression": {
    "arc": ["opening emotion", "development emotion", "peak emotion", "resolution emotion"],
    "keyMoments": ["pivotal emotional moment 1", "moment 2"],
    "emotionalRange": "narrow/moderate/wide/extreme",
    "authenticityNotes": "what emotional truth this requires from performer"
  },
  "eraInfluence": {
    "primaryGenre": "main genre classification",
    "subGenres": ["sub-genre 1", "sub-genre 2"],
    "primaryEra": "specific time period (e.g., 'mid-2000s emo' or 'late 70s punk')",
    "influences": [
      {"artist": "Artist Name", "similarity": "what aspect is similar", "percentage": "how much influence"}
    ],
    "modernElements": ["contemporary touch 1", "touch 2"],
    "productionStyle": "suggested production approach"
  },
  "productionNotes": {
    "suggestedInstrumentation": ["instrument 1", "instrument 2"],
    "arrangementIdeas": "arrangement suggestions based on lyrics",
    "sonicTexture": "recommended sonic qualities",
    "mixApproach": "vocal treatment and mix suggestions"
  },
  "singabilityScore": {
    "overall": 1-10,
    "memorability": 1-10,
    "technicalDifficulty": 1-10,
    "rangeRequirement": "low/moderate/high/extreme",
    "assessmentNotes": "explanation of scores"
  },
  "overallPerformanceNotes": "2-3 paragraph comprehensive performance guide for an artist approaching this song, including key delivery points, emotional preparation needed, and what makes this song work (or not work) as a performance piece."
}`;
}

class GeminiService {
  constructor() {
    this.lastApiCall = 0;
    // LRU cache: max 50 entries, 30-minute TTL
    // Prevents unbounded memory growth from cached API responses
    this.cache = new LRUCache(50, 30 * 60 * 1000);
    this.rateLimitMs = 2000; // 2 seconds between calls - faster UX, rate limit errors handled gracefully
  }

  // Generate cache key from song content
  generateCacheKey(lyrics, analysisType) {
    const content = `${analysisType}:${lyrics}`;
    return btoa(content).slice(0, 32);
  }

  // Check if API key is configured
  isConfigured() {
    return isApiKeyConfigured();
  }

  // Check if we can make an API call (rate limiting)
  canMakeApiCall() {
    const now = Date.now();
    return (now - this.lastApiCall) >= this.rateLimitMs;
  }

  // Get time until next allowed API call
  getTimeUntilNextCall() {
    const now = Date.now();
    const timeSince = now - this.lastApiCall;
    return Math.max(0, this.rateLimitMs - timeSince);
  }

  // Clear cache for a specific song and analysis type
  clearCacheForSong(lyrics, analysisType) {
    const cacheKey = this.generateCacheKey(lyrics, analysisType);
    this.cache.delete(cacheKey);
    console.log(`Cleared cache for ${analysisType} analysis`);
  }

  // Call Gemini API directly
  async callGeminiAPI(prompt) {
    const apiKey = getGeminiApiKey();

    if (!apiKey) {
      throw new Error('API key not configured. Please add your Gemini API key in Settings.');
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 400) {
        throw new Error('Invalid API key. Please check your Gemini API key in Settings.');
      } else if (response.status === 403) {
        throw new Error('API access denied. Please ensure your API key has access to Gemini.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
      throw new Error(error.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from Gemini API');
    }

    return data.candidates[0].content.parts[0].text;
  }

  // Parse JSON from response text
  parseJsonResponse(text) {
    // Clean up the response text
    text = text.trim();
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    return JSON.parse(text);
  }

  async analyzeLyricalCoherence(lyrics, songTitle = "Unknown Song") {
    // Check if API key is configured
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'API key not configured. Please add your Gemini API key in Settings.',
        needsApiKey: true,
        fromCache: false
      };
    }

    // Check cache first
    const cacheKey = this.generateCacheKey(lyrics, 'coherence');
    if (this.cache.has(cacheKey)) {
      console.log('Returning cached coherence analysis');
      return { ...this.cache.get(cacheKey), fromCache: true };
    }

    // Check rate limiting
    if (!this.canMakeApiCall()) {
      const waitTime = Math.ceil(this.getTimeUntilNextCall() / 1000);
      throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds before analyzing again.`);
    }

    try {
      this.lastApiCall = Date.now();

      const prompt = createCoherenceAnalysisPrompt(lyrics, songTitle);
      const responseText = await this.callGeminiAPI(prompt);

      console.log('Raw coherence analysis received');

      let analysisData;
      try {
        analysisData = this.parseJsonResponse(responseText);

        // Ensure all required fields exist with proper validation
        analysisData.coherenceScore = Math.max(0, Math.min(100, analysisData.coherenceScore || 70));
        analysisData.storyFlow = analysisData.storyFlow || 'fair';
        analysisData.thematicUnity = analysisData.thematicUnity || 'fair';
        analysisData.narrativeConsistency = analysisData.narrativeConsistency || 'fair';
        analysisData.sectionConnections = analysisData.sectionConnections || 'fair';
        analysisData.overallAssessment = analysisData.overallAssessment || 'Analysis completed.';
        analysisData.observations = Array.isArray(analysisData.observations) ? analysisData.observations : [];
        analysisData.references = Array.isArray(analysisData.references) ? analysisData.references : [];

      } catch (parseError) {
        console.error('Coherence JSON parse error:', parseError);
        return {
          success: false,
          error: 'AI analysis parsing failed, try again for better results',
          fromCache: false
        };
      }

      const result = {
        success: true,
        fromCache: false,
        ...analysisData
      };

      // Cache successful results
      this.cache.set(cacheKey, result);

      return result;

    } catch (error) {
      console.error('Error analyzing lyrical coherence:', error);
      return {
        success: false,
        error: error.message,
        fromCache: false
      };
    }
  }

  // Multi-pass coherence analysis for deeper insights
  async analyzeLyricalCoherenceMultiPass(lyrics, songTitle = "Unknown Song", onProgress = null) {
    // Check if API key is configured
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'API key not configured. Please add your Gemini API key in Settings.',
        needsApiKey: true,
        fromCache: false
      };
    }

    // Check cache first
    const cacheKey = this.generateCacheKey(lyrics, 'coherence-multipass');
    if (this.cache.has(cacheKey)) {
      console.log('Returning cached multi-pass coherence analysis');
      return { ...this.cache.get(cacheKey), fromCache: true };
    }

    const results = {
      success: true,
      fromCache: false,
      multiPass: true,
      passes: {},
      currentPass: 0,
      totalPasses: 4
    };

    try {
      // PASS 1: Narrative, Theme, Emotion
      if (onProgress) onProgress({ pass: 1, total: 4, status: 'analyzing', label: 'Analyzing Narrative & Themes...' });

      // Check rate limiting
      if (!this.canMakeApiCall()) {
        const waitTime = this.getTimeUntilNextCall();
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      this.lastApiCall = Date.now();
      const pass1Prompt = createCoherencePass1Prompt(lyrics, songTitle);
      const pass1Response = await this.callGeminiAPI(pass1Prompt);
      let pass1Data;

      try {
        pass1Data = this.parseJsonResponse(pass1Response);
        results.passes.pass1 = pass1Data;
        results.narrativeArchitecture = pass1Data.narrativeArchitecture;
        results.thematicAnalysis = pass1Data.thematicAnalysis;
        results.emotionalJourney = pass1Data.emotionalJourney;
      } catch (parseError) {
        console.error('Pass 1 parse error:', parseError);
        throw new Error('Failed to parse Pass 1 (Narrative/Theme) response');
      }

      if (onProgress) onProgress({ pass: 1, total: 4, status: 'complete', label: 'Pass 1 Complete' });

      // PASS 2: References & Allusions
      if (onProgress) onProgress({ pass: 2, total: 4, status: 'waiting', label: 'Waiting for rate limit...' });

      // Wait for rate limit
      await new Promise(resolve => setTimeout(resolve, this.rateLimitMs));

      if (onProgress) onProgress({ pass: 2, total: 4, status: 'analyzing', label: 'Discovering References & Allusions...' });

      this.lastApiCall = Date.now();
      const pass1Summary = pass1Data.pass1Summary || 'Analysis of narrative structure, themes, and emotional journey completed.';
      const pass2Prompt = createCoherencePass2Prompt(lyrics, songTitle, pass1Summary);
      const pass2Response = await this.callGeminiAPI(pass2Prompt);
      let pass2Data;

      try {
        pass2Data = this.parseJsonResponse(pass2Response);
        results.passes.pass2 = pass2Data;
        results.references = pass2Data.references || [];
        results.intertextuality = pass2Data.intertextuality;
        results.culturalContext = pass2Data.culturalContext;
      } catch (parseError) {
        console.error('Pass 2 parse error:', parseError);
        // Continue with empty references rather than failing
        pass2Data = { pass2Summary: 'Reference analysis completed with limited results.', references: [] };
        results.passes.pass2 = pass2Data;
        results.references = [];
      }

      if (onProgress) onProgress({ pass: 2, total: 4, status: 'complete', label: 'Pass 2 Complete' });

      // PASS 3: Craft & Technique
      if (onProgress) onProgress({ pass: 3, total: 4, status: 'waiting', label: 'Waiting for rate limit...' });

      // Wait for rate limit
      await new Promise(resolve => setTimeout(resolve, this.rateLimitMs));

      if (onProgress) onProgress({ pass: 3, total: 4, status: 'analyzing', label: 'Analyzing Literary Craft...' });

      this.lastApiCall = Date.now();
      const pass2Summary = pass2Data.pass2Summary || 'Reference and allusion analysis completed.';
      const pass3Prompt = createCoherencePass3Prompt(lyrics, songTitle, pass1Summary, pass2Summary);
      const pass3Response = await this.callGeminiAPI(pass3Prompt);
      let pass3Data;

      try {
        pass3Data = this.parseJsonResponse(pass3Response);
        results.passes.pass3 = pass3Data;
        results.imagerySymbolism = pass3Data.imagerySymbolism;
        results.soundCraft = pass3Data.soundCraft;
        results.literaryTechniques = pass3Data.literaryTechniques;
        results.structuralCohesion = pass3Data.structuralCohesion;
        results.ambiguityMultivalence = pass3Data.ambiguityMultivalence;
        results.craftVerdict = pass3Data.craftVerdict;
      } catch (parseError) {
        console.error('Pass 3 parse error:', parseError);
        throw new Error('Failed to parse Pass 3 (Craft/Technique) response');
      }

      if (onProgress) onProgress({ pass: 3, total: 4, status: 'complete', label: 'Pass 3 Complete' });

      // PASS 4: Final Synthesis
      if (onProgress) onProgress({ pass: 4, total: 4, status: 'waiting', label: 'Waiting for rate limit...' });

      // Wait for rate limit
      await new Promise(resolve => setTimeout(resolve, this.rateLimitMs));

      if (onProgress) onProgress({ pass: 4, total: 4, status: 'analyzing', label: 'Creating Final Synthesis...' });

      this.lastApiCall = Date.now();
      const synthesisPrompt = createCoherenceFinalSynthesis(lyrics, songTitle, pass1Data, pass2Data, pass3Data);
      const synthesisResponse = await this.callGeminiAPI(synthesisPrompt);
      let synthesisData;

      try {
        synthesisData = this.parseJsonResponse(synthesisResponse);
        results.coherenceScore = synthesisData.coherenceScore || 70;
        results.storyFlow = synthesisData.storyFlow || 'fair';
        results.thematicUnity = synthesisData.thematicUnity || 'fair';
        results.narrativeConsistency = synthesisData.narrativeConsistency || 'fair';
        results.sectionConnections = synthesisData.sectionConnections || 'fair';
        results.overallAssessment = synthesisData.overallAssessment || 'Multi-pass analysis completed.';
      } catch (parseError) {
        console.error('Synthesis parse error:', parseError);
        // Generate reasonable defaults from pass data
        results.coherenceScore = pass3Data.craftVerdict?.overallCraftRating || 70;
        results.overallAssessment = `This analysis examined ${songTitle} through multiple passes: narrative structure and themes (Pass 1), cultural references and allusions (Pass 2), and literary craft (Pass 3). ` +
          (pass1Data.pass1Summary || '') + ' ' + (pass3Data.pass3Summary || '');
      }

      if (onProgress) onProgress({ pass: 4, total: 4, status: 'complete', label: 'Analysis Complete!' });

      // Ensure backward compatibility fields
      results.observations = [];

      // Cache successful results
      this.cache.set(cacheKey, results);

      return results;

    } catch (error) {
      console.error('Error in multi-pass coherence analysis:', error);
      return {
        success: false,
        error: error.message,
        fromCache: false,
        multiPass: true,
        partialResults: results.passes
      };
    }
  }

  async analyzePerformanceAndStyle(lyrics, songTitle = "Unknown Song", forceFresh = false) {
    // Check if API key is configured
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'API key not configured. Please add your Gemini API key in Settings.',
        needsApiKey: true,
        fromCache: false
      };
    }

    // Generate cache key
    const cacheKey = this.generateCacheKey(lyrics, 'performance');

    // Clear cache if forced refresh
    if (forceFresh) {
      this.cache.delete(cacheKey);
      console.log('Forced cache clear for performance analysis');
    }

    // Check cache (unless forced fresh)
    if (!forceFresh && this.cache.has(cacheKey)) {
      console.log('Returning cached performance analysis');
      return { ...this.cache.get(cacheKey), fromCache: true };
    }

    // Check rate limiting
    if (!this.canMakeApiCall()) {
      const waitTime = Math.ceil(this.getTimeUntilNextCall() / 1000);
      throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds before analyzing again.`);
    }

    try {
      this.lastApiCall = Date.now();

      const prompt = createPerformanceAnalysisPrompt(lyrics, songTitle);
      const responseText = await this.callGeminiAPI(prompt);

      console.log('Raw performance analysis received');

      let analysisData;
      try {
        analysisData = this.parseJsonResponse(responseText);

        // Ensure all required fields exist with proper validation
        if (!analysisData.vocalFlow) analysisData.vocalFlow = {};
        if (!analysisData.breathControl) analysisData.breathControl = {};
        if (!analysisData.performanceDynamics) analysisData.performanceDynamics = {};
        if (!analysisData.repetitionAnalysis) analysisData.repetitionAnalysis = {};
        if (!analysisData.emotionalProgression) analysisData.emotionalProgression = {};
        if (!analysisData.eraInfluence) analysisData.eraInfluence = {};

        // Set defaults for nested objects
        analysisData.vocalFlow.overallRating = analysisData.vocalFlow.overallRating || 'moderate';
        analysisData.vocalFlow.flowPatterns = Array.isArray(analysisData.vocalFlow.flowPatterns) ? analysisData.vocalFlow.flowPatterns : [];
        analysisData.breathControl.rating = analysisData.breathControl.rating || 'fair';
        analysisData.performanceDynamics.energyMapping = Array.isArray(analysisData.performanceDynamics.energyMapping) ? analysisData.performanceDynamics.energyMapping : [];
        analysisData.repetitionAnalysis.effectiveRepeats = Array.isArray(analysisData.repetitionAnalysis.effectiveRepeats) ? analysisData.repetitionAnalysis.effectiveRepeats : [];
        analysisData.emotionalProgression.arc = Array.isArray(analysisData.emotionalProgression.arc) ? analysisData.emotionalProgression.arc : [];
        analysisData.eraInfluence.primaryEra = analysisData.eraInfluence.primaryEra || 'contemporary';

      } catch (parseError) {
        console.error('Performance JSON parse error:', parseError);
        return {
          success: false,
          error: 'AI analysis parsing failed, try again for better results',
          fromCache: false
        };
      }

      const result = {
        success: true,
        fromCache: false,
        ...analysisData
      };

      // Cache successful results
      this.cache.set(cacheKey, result);

      return result;

    } catch (error) {
      console.error('Error analyzing performance and style:', error);

      if (error.message.includes('Rate limit exceeded')) {
        return {
          success: false,
          error: error.message,
          fromCache: false,
          retryable: true
        };
      }

      return {
        success: false,
        error: `Analysis failed: ${error.message}. Please try again.`,
        fromCache: false,
        retryable: true
      };
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache statistics for debugging
  getCacheStats() {
    return this.cache.getStats();
  }
}

const geminiServiceInstance = new GeminiService();
export default geminiServiceInstance;
