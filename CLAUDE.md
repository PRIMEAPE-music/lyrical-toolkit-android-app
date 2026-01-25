# CLAUDE.md - Lyrical Toolkit (Mobile)

## Commands
| Command | Purpose |
|---------|---------|
| `npm start` | Dev server :3000 |
| `npm run build` | Prod build |
| `npx cap sync android` | Sync to Android |
| `npx cap run android` | Run on device |

## Structure
```
src/                    # React app
android/                # Android project
capacitor.config.ts     # Capacitor config
```

## Stack
React 19 · TailwindCSS · Capacitor · Android

## Related
Web: `../lyrical-toolkit`

---

## 🔄 Auto-Sync

**Default**: All changes sync to web repo automatically.

**Mobile-only (never sync)**: android/*, capacitor.config.ts

**Override**: Say "don't sync" or "mobile only"

See `.claude/SYNC_RULES.md` for full rules.

---

## 🧠 Memory System

### Session Start
Read `.claude/working/SCRATCHPAD.md` for context.

### Session End
Run `/save-state` or "save state" before closing.

### Context Management (IMPORTANT)

**Prefer fresh starts over /compact:**

| Method | Context Freed |
|--------|---------------|
| `/compact` | ~70-80% (summary remains) |
| **Fresh conversation** | **100%** |

**Recommended workflow:**
```
1. Work until context fills
2. "Save state" (updates working memory files)
3. Close conversation
4. Open new conversation  
5. "Load state" or "continue" (reads SCRATCHPAD)
```

**Use /compact only for**: Quick mid-task cleanup when context ~50% full.

### Working Memory Files
```
.claude/working/
├── SCRATCHPAD.md   # Current task, findings, next steps
├── TASK_QUEUE.md   # Task tracking
├── CHANGES.md      # What's been modified
└── CONTEXT.md      # Code snippets for current task
```

### Commands
| Command | Purpose |
|---------|---------|
| `/save-state` | Save to working memory files |
| `/load-state` | Restore from working memory |
| `/init` | Full context load |
| `/save-session` | End-of-session save |

---

## Current Issues
🔴 AudioPlayer - Memory leak | 🟡 geminiService - Cache | 🟡 textAnalysis - Memoization
