# Known Issues

## Open Issues

| ID | Sev | Component | Issue |
|----|-----|-----------|-------|
| *None currently* | | | |

## Tech Debt

| ID | Priority | Issue |
|----|----------|-------|
| D01 | Low | Stats memoization still in App.js (~200 lines) - could be extracted |
| D02 | Low | 7 outdated packages (major versions - need careful upgrade) |
| D03 | Med | 12 vulnerabilities remain (tied to react-scripts, no easy fix) |

## Resolved

| ID | Component | Issue | Resolution | Date |
|----|-----------|-------|------------|------|
| 005 | useNotepadEditor | Auto-save for database songs causes overwrites on multi-device editing | Disabled auto-save for database mode; manual save required | 2026-01-11 |
| 004 | App.js | 2,039 lines monolith | Extracted into 5 modular hooks (804 lines remaining) | 2026-01-11 |
| 001 | AudioPlayer.js | WaveSurfer memory leak, blob URLs not revoked | Added refs for cleanup, isCancelled flag, blob URL revocation | 2026-01-11 |
| 002 | geminiService.js | Unbounded cache, no TTL | Implemented LRU cache (50 entries, 30min TTL) | 2026-01-11 |
| 003 | textAnalysis.js | No memoization, O(n²) in meter analysis | Added LRU caches for syllables, stress patterns, meter | 2026-01-11 |

---
*Details: Read full descriptions only when working on specific issue*
