# Claude Code Extras & Enhancements Guide

> **PURPOSE**: This guide adds advanced features, utilities, and quality-of-life improvements to complete your Claude Code setup.

---

## What This Guide Adds

| Category | Items |
|----------|-------|
| **Project Memory** | Persistent context files, decision log, known issues |
| **Git Hooks** | Actual pre-commit automation |
| **Snippet Library** | Reusable code patterns |
| **Prompt Templates** | Quick-access common prompts |
| **New Agents** | Health Monitor, Release Notes, Tech Debt, Media, Copywriter |
| **CI/CD** | GitHub Actions workflows |
| **VS Code** | Editor integration settings |
| **Checklists** | PR, Deploy, Feature checklists |

---

## PHASE 1: Project Memory System

A persistent memory system that maintains context across Claude Code sessions.

### Step 1.1: Create Memory Directory

```bash
mkdir -p .claude/memory
```

### Step 1.2: Project Context File

**File**: `lyrical-toolkit/.claude/memory/PROJECT_CONTEXT.md`

```markdown
# Lyrical Toolkit - Project Context

> This file is read by Claude Code to understand project context. Update as the project evolves.

## Project Overview

**Name**: Lyrical Toolkit
**Type**: Web + Mobile lyrical analysis application
**Stage**: Active development

## Repositories

| Repo | Path | Purpose |
|------|------|---------|
| Web | `lyrical-toolkit` | React web app, Netlify deployment |
| Mobile | `lyrical-toolkit mobile` | Capacitor Android wrapper |

## Tech Stack

### Frontend
- React 19
- TailwindCSS (via CRACO)
- Lucide React (icons)

### Backend
- Express.js (local dev)
- Netlify Functions (production)
- Supabase (PostgreSQL)

### Mobile
- Capacitor
- Android target

### External APIs
- Google Gemini (AI analysis)
- DataMuse (rhymes, synonyms)
- Dictionary API (definitions)

## Key Features

1. **Search Tab** - Search through lyrics with highlighting
2. **Dictionary Tab** - Word definitions
3. **Synonyms Tab** - Synonyms/antonyms
4. **Rhymes Tab** - Rhyming words
5. **Analysis Tab** - AI-powered lyrical analysis
6. **Upload Tab** - Song management
7. **Stats Tab** - Lyrics statistics
8. **Floating Notepad** - Draggable editor

## Architecture Decisions

### State Management
- Custom hooks pattern (useLocalStorage, useSearch, etc.)
- Central state in App.js
- LocalStorage for persistence

### Authentication
- Optional - app works without login
- JWT-based when enabled
- Supabase Auth integration

### Offline Support
- LocalStorage first approach
- Sync when authenticated and online

## Current Priorities

1. [Update this with current focus]
2. [Current sprint goals]
3. [Upcoming features]

## Known Constraints

- Bundle size sensitivity (mobile performance)
- Must work offline
- Must sync between web and mobile
- Rate limits on external APIs

## Team Conventions

- Functional components only
- Custom hooks for complex state
- Service layer for API calls
- TailwindCSS for all styling
- Jest + React Testing Library for tests

## Last Updated
[DATE - update when making changes]
```

### Step 1.3: Decision Log

**File**: `lyrical-toolkit/.claude/memory/DECISIONS.md`

```markdown
# Architecture Decision Log

Track significant technical decisions for future reference.

---

## Template

### [DATE] - [DECISION TITLE]

**Context**: [Why this decision was needed]

**Decision**: [What was decided]

**Alternatives Considered**:
- [Alternative 1]: [Why rejected]
- [Alternative 2]: [Why rejected]

**Consequences**:
- [Positive/negative outcomes]

**Status**: [Active | Superseded | Deprecated]

---

## Decisions

### 2024-XX-XX - State Management Approach

**Context**: Needed to manage complex state across tabs and components.

**Decision**: Use custom hooks pattern with localStorage persistence instead of Redux/Zustand.

**Alternatives Considered**:
- Redux: Overkill for current complexity
- Zustand: Considered but custom hooks sufficient
- Context API: Used sparingly, hooks preferred

**Consequences**:
- ✅ Simple, lightweight
- ✅ Easy to understand
- ⚠️ May need to revisit if state gets more complex

**Status**: Active

---

### 2024-XX-XX - Mobile Wrapper Choice

**Context**: Needed to ship mobile app quickly from existing React codebase.

**Decision**: Use Capacitor instead of React Native.

**Alternatives Considered**:
- React Native: Would require rewrite
- PWA only: Limited native features
- Cordova: Less maintained than Capacitor

**Consequences**:
- ✅ Reuse 95% of web code
- ✅ Native plugins available
- ⚠️ Some performance tradeoffs vs native

**Status**: Active

---

[Add new decisions as they're made]
```

### Step 1.4: Known Issues Tracker

**File**: `lyrical-toolkit/.claude/memory/KNOWN_ISSUES.md`

```markdown
# Known Issues & Technical Debt

Track known issues, workarounds, and technical debt.

---

## Active Issues

### [ISSUE-001] - [Title]
**Severity**: [Critical | High | Medium | Low]
**Area**: [Component/Feature]
**Description**: [What's wrong]
**Workaround**: [If any]
**Root Cause**: [If known]
**Fix Plan**: [If known]

---

### Example: Audio Memory Leak
**Severity**: Medium
**Area**: Audio Player / WaveSurfer
**Description**: WaveSurfer instances not properly destroyed when switching songs rapidly.
**Workaround**: Added cleanup in useEffect, but edge cases remain.
**Root Cause**: Race condition in rapid song switching.
**Fix Plan**: Implement debounce on song switch, ensure single instance.

---

## Technical Debt

### [DEBT-001] - [Title]
**Priority**: [High | Medium | Low]
**Effort**: [Hours/Days estimate]
**Description**: [What needs improvement]
**Impact**: [Why it matters]

---

### Example: Test Coverage for textAnalysis.js
**Priority**: Medium
**Effort**: 4-6 hours
**Description**: Core text analysis utilities only have 40% test coverage.
**Impact**: Risk of regression in critical functionality.

---

## Resolved Issues

### [RESOLVED-001] - [Title]
**Resolved**: [Date]
**Resolution**: [How it was fixed]

---

[Move issues here when fixed]
```

### Step 1.5: Session Handoff File

**File**: `lyrical-toolkit/.claude/memory/CURRENT_SESSION.md`

```markdown
# Current Session Context

> Update this at the end of each Claude Code session to maintain continuity.

## Last Session

**Date**: [DATE]
**Duration**: [Approximate time]

### What Was Accomplished
- [x] [Task 1]
- [x] [Task 2]
- [ ] [Task 3 - incomplete]

### Current State
- **Branch**: [current git branch]
- **Working On**: [feature/bug/task]
- **Blocked By**: [if anything]

### Files Modified
- `path/to/file1.js` - [what changed]
- `path/to/file2.js` - [what changed]

### Next Steps
1. [Immediate next task]
2. [Following task]
3. [Future task]

### Notes for Next Session
- [Important context to remember]
- [Decisions that were made]
- [Things to watch out for]

### Open Questions
- [Unresolved question 1]
- [Unresolved question 2]

---

## Previous Sessions

### [PREVIOUS DATE]
- Completed: [summary]
- Started: [summary]

[Keep last 3-5 sessions for context]
```

---

## PHASE 2: Git Hooks (Actual Automation)

Real git hooks that run automatically.

### Step 2.1: Create Git Hooks Directory

```bash
mkdir -p .githooks
```

### Step 2.2: Pre-commit Hook

**File**: `lyrical-toolkit/.githooks/pre-commit`

```bash
#!/bin/sh

echo "🔍 Running pre-commit checks..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track if any check fails
FAILED=0

# 1. Check for console.log statements (warn only)
echo "📋 Checking for console.log statements..."
CONSOLE_LOGS=$(git diff --cached --name-only | xargs grep -l "console.log" 2>/dev/null | grep -E '\.(js|jsx|ts|tsx)$' || true)
if [ -n "$CONSOLE_LOGS" ]; then
    echo "${YELLOW}⚠️  Warning: console.log found in:${NC}"
    echo "$CONSOLE_LOGS"
    echo "   Consider removing before production."
fi

# 2. Check for debugger statements (block)
echo "📋 Checking for debugger statements..."
DEBUGGER=$(git diff --cached --name-only | xargs grep -l "debugger" 2>/dev/null | grep -E '\.(js|jsx|ts|tsx)$' || true)
if [ -n "$DEBUGGER" ]; then
    echo "${RED}❌ Error: debugger statement found in:${NC}"
    echo "$DEBUGGER"
    FAILED=1
fi

# 3. Check for .env files being committed
echo "📋 Checking for .env files..."
ENV_FILES=$(git diff --cached --name-only | grep "^\.env" || true)
if [ -n "$ENV_FILES" ]; then
    echo "${RED}❌ Error: Attempting to commit .env file:${NC}"
    echo "$ENV_FILES"
    FAILED=1
fi

# 4. Check for large files (> 1MB)
echo "📋 Checking for large files..."
LARGE_FILES=$(git diff --cached --name-only | while read file; do
    if [ -f "$file" ]; then
        size=$(wc -c < "$file" 2>/dev/null || echo 0)
        if [ "$size" -gt 1000000 ]; then
            echo "$file ($(($size / 1000))KB)"
        fi
    fi
done)
if [ -n "$LARGE_FILES" ]; then
    echo "${YELLOW}⚠️  Warning: Large files detected:${NC}"
    echo "$LARGE_FILES"
fi

# 5. Run ESLint on staged files
echo "📋 Running ESLint..."
STAGED_JS=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|jsx)$' || true)
if [ -n "$STAGED_JS" ]; then
    echo "$STAGED_JS" | xargs npx eslint --max-warnings=0
    if [ $? -ne 0 ]; then
        echo "${RED}❌ ESLint failed${NC}"
        FAILED=1
    else
        echo "${GREEN}✅ ESLint passed${NC}"
    fi
fi

# 6. Check if sync might be needed
echo "📋 Checking for shared code changes..."
SHARED_CHANGES=$(git diff --cached --name-only | grep -E "^src/(utils|services|hooks|data)/" || true)
if [ -n "$SHARED_CHANGES" ]; then
    echo "${YELLOW}📱 Shared code modified - remember to sync to mobile repo:${NC}"
    echo "$SHARED_CHANGES"
    echo "   Run: node .claude/scripts/full-sync.js"
fi

# Final result
if [ $FAILED -eq 1 ]; then
    echo ""
    echo "${RED}❌ Pre-commit checks failed. Please fix the issues above.${NC}"
    echo "   To bypass (not recommended): git commit --no-verify"
    exit 1
else
    echo ""
    echo "${GREEN}✅ All pre-commit checks passed!${NC}"
    exit 0
fi
```

### Step 2.3: Pre-push Hook

**File**: `lyrical-toolkit/.githooks/pre-push`

```bash
#!/bin/sh

echo "🚀 Running pre-push checks..."

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# Run tests
echo "🧪 Running tests..."
npm test -- --watchAll=false --passWithNoTests
if [ $? -ne 0 ]; then
    echo "${RED}❌ Tests failed. Push aborted.${NC}"
    exit 1
fi

echo "${GREEN}✅ All pre-push checks passed!${NC}"
exit 0
```

### Step 2.4: Setup Script

**File**: `lyrical-toolkit/.claude/scripts/setup-hooks.js`

```javascript
#!/usr/bin/env node
/**
 * Setup git hooks for the project
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HOOKS_DIR = path.join(__dirname, '..', '..', '.githooks');
const GIT_DIR = path.join(__dirname, '..', '..', '.git', 'hooks');

console.log('🔧 Setting up git hooks...\n');

// Check if .githooks directory exists
if (!fs.existsSync(HOOKS_DIR)) {
    console.error('❌ .githooks directory not found');
    process.exit(1);
}

// Configure git to use our hooks directory
try {
    execSync('git config core.hooksPath .githooks', { cwd: path.join(__dirname, '..', '..') });
    console.log('✅ Git configured to use .githooks directory');
} catch (error) {
    console.error('❌ Failed to configure git hooks path:', error.message);
    process.exit(1);
}

// Make hooks executable (Unix systems)
const hooks = fs.readdirSync(HOOKS_DIR);
hooks.forEach(hook => {
    const hookPath = path.join(HOOKS_DIR, hook);
    try {
        fs.chmodSync(hookPath, '755');
        console.log(`✅ Made ${hook} executable`);
    } catch (error) {
        // Windows doesn't need chmod
        console.log(`ℹ️  ${hook} ready (chmod not needed on Windows)`);
    }
});

console.log('\n✅ Git hooks setup complete!');
console.log('\nHooks installed:');
hooks.forEach(hook => console.log(`   • ${hook}`));
```

### Step 2.5: Add to package.json

Add a postinstall script to auto-setup hooks:

```json
{
  "scripts": {
    "prepare": "node .claude/scripts/setup-hooks.js"
  }
}
```

---

## PHASE 3: Code Snippets Library

Reusable code patterns specific to Lyrical Toolkit.

### Step 3.1: Create Snippets Directory

```bash
mkdir -p .claude/snippets
```

### Step 3.2: React Patterns

**File**: `lyrical-toolkit/.claude/snippets/react-patterns.md`

```markdown
# React Patterns for Lyrical Toolkit

## Loading State Pattern

```javascript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [data, setData] = useState(null);

const fetchData = async () => {
  setLoading(true);
  setError(null);
  try {
    const result = await apiCall();
    setData(result);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

// In render:
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage message={error} />;
if (!data) return <EmptyState />;
return <DataDisplay data={data} />;
```

## Debounced Input Pattern

```javascript
const [inputValue, setInputValue] = useState('');
const [debouncedValue, setDebouncedValue] = useState('');

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedValue(inputValue);
  }, 300);
  
  return () => clearTimeout(timer);
}, [inputValue]);

useEffect(() => {
  if (debouncedValue) {
    // Perform search or API call
    performSearch(debouncedValue);
  }
}, [debouncedValue]);
```

## Dark Mode Aware Component

```javascript
function Component({ darkMode }) {
  return (
    <div className={`
      p-4 rounded-lg
      ${darkMode 
        ? 'bg-gray-800 text-white' 
        : 'bg-white text-gray-900'
      }
    `}>
      {/* Content */}
    </div>
  );
}
```

## Conditional Tab Content

```javascript
function TabContent({ activeTab, darkMode, ...sharedProps }) {
  const tabs = {
    search: <SearchTab {...sharedProps} darkMode={darkMode} />,
    dictionary: <DictionaryTab {...sharedProps} darkMode={darkMode} />,
    // ... other tabs
  };
  
  return tabs[activeTab] || <div>Tab not found</div>;
}
```

## LocalStorage Sync Pattern

```javascript
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`[useLocalStorage] Error reading ${key}:`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`[useLocalStorage] Error setting ${key}:`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}
```

## API Service Pattern

```javascript
// services/[name]Service.js
const CACHE = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function fetchResource(query) {
  const cacheKey = `resource:${query}`;
  const cached = CACHE.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const response = await fetch(`${API_URL}?q=${encodeURIComponent(query)}`);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json();
  CACHE.set(cacheKey, { data, timestamp: Date.now() });
  
  return data;
}
```

## Error Boundary Usage

```javascript
// Wrap risky components
<ErrorBoundary fallback={<TabErrorFallback />}>
  <AnalysisTab />
</ErrorBoundary>

// With reset capability
<ErrorBoundary
  fallback={({ resetError }) => (
    <div>
      <p>Something went wrong</p>
      <button onClick={resetError}>Try Again</button>
    </div>
  )}
>
  <Component />
</ErrorBoundary>
```
```

### Step 3.3: TailwindCSS Patterns

**File**: `lyrical-toolkit/.claude/snippets/tailwind-patterns.md`

```markdown
# TailwindCSS Patterns for Lyrical Toolkit

## Standard Card

```html
<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
  <!-- Card content -->
</div>
```

## Button Variants

```html
<!-- Primary -->
<button class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
  Primary
</button>

<!-- Secondary -->
<button class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors">
  Secondary
</button>

<!-- Danger -->
<button class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">
  Delete
</button>

<!-- Ghost -->
<button class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
  Ghost
</button>
```

## Input Field

```html
<input 
  type="text"
  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
  placeholder="Enter text..."
/>
```

## Loading Spinner

```html
<div class="flex justify-center items-center h-32">
  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
</div>
```

## Error Message

```html
<div class="p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
  <p class="font-medium">Error</p>
  <p class="text-sm">Something went wrong. Please try again.</p>
</div>
```

## Success Message

```html
<div class="p-4 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">
  <p class="font-medium">Success</p>
  <p class="text-sm">Operation completed successfully.</p>
</div>
```

## Tab Navigation

```html
<div class="flex border-b border-gray-200 dark:border-gray-700">
  <button class="px-4 py-2 border-b-2 border-blue-500 text-blue-500 font-medium">
    Active Tab
  </button>
  <button class="px-4 py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
    Inactive Tab
  </button>
</div>
```

## Responsive Grid

```html
<!-- 1 col mobile, 2 col tablet, 3 col desktop -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

## Scrollable Container

```html
<div class="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600">
  <!-- Scrollable content -->
</div>
```

## Badge

```html
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
  Badge
</span>
```

## Tooltip (CSS only)

```html
<div class="relative group">
  <button>Hover me</button>
  <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
    Tooltip text
  </div>
</div>
```
```

### Step 3.4: Test Patterns

**File**: `lyrical-toolkit/.claude/snippets/test-patterns.md`

```markdown
# Test Patterns for Lyrical Toolkit

## Component Test Structure

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ComponentName from './ComponentName';

describe('ComponentName', () => {
  // Default props
  const defaultProps = {
    songs: [],
    currentSong: null,
    darkMode: false,
  };

  // Helper to render with props
  const renderComponent = (props = {}) => {
    return render(<ComponentName {...defaultProps} {...props} />);
  };

  describe('rendering', () => {
    it('should render without crashing', () => {
      renderComponent();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should apply dark mode classes when darkMode is true', () => {
      renderComponent({ darkMode: true });
      expect(screen.getByTestId('container')).toHaveClass('dark');
    });
  });

  describe('user interactions', () => {
    it('should call handler when button clicked', () => {
      const handleClick = jest.fn();
      renderComponent({ onClick: handleClick });
      
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('async behavior', () => {
    it('should show loading state then data', async () => {
      renderComponent();
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText(/data loaded/i)).toBeInTheDocument();
      });
    });
  });
});
```

## Hook Test Structure

```javascript
import { renderHook, act } from '@testing-library/react';
import useCustomHook from './useCustomHook';

describe('useCustomHook', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useCustomHook());
    
    expect(result.current.value).toBe(initialValue);
  });

  it('should update value when action called', () => {
    const { result } = renderHook(() => useCustomHook());
    
    act(() => {
      result.current.setValue('new value');
    });
    
    expect(result.current.value).toBe('new value');
  });

  it('should handle async operations', async () => {
    const { result } = renderHook(() => useCustomHook());
    
    await act(async () => {
      await result.current.fetchData();
    });
    
    expect(result.current.data).toBeDefined();
  });
});
```

## Utility Function Test Structure

```javascript
import { utilityFunction } from './utils';

describe('utilityFunction', () => {
  // Test multiple inputs with it.each
  it.each([
    ['input1', 'expected1'],
    ['input2', 'expected2'],
    ['', ''],
    [null, null],
  ])('given %s, returns %s', (input, expected) => {
    expect(utilityFunction(input)).toBe(expected);
  });

  // Edge cases
  describe('edge cases', () => {
    it('should handle empty string', () => {
      expect(utilityFunction('')).toBe('');
    });

    it('should handle null', () => {
      expect(utilityFunction(null)).toBeNull();
    });

    it('should handle undefined', () => {
      expect(utilityFunction(undefined)).toBeUndefined();
    });
  });
});
```

## Mocking API Calls

```javascript
// Mock the service
jest.mock('../services/apiService', () => ({
  fetchData: jest.fn(),
}));

import { fetchData } from '../services/apiService';

describe('Component with API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display data from API', async () => {
    fetchData.mockResolvedValue({ items: ['item1', 'item2'] });
    
    render(<Component />);
    
    await waitFor(() => {
      expect(screen.getByText('item1')).toBeInTheDocument();
    });
  });

  it('should handle API error', async () => {
    fetchData.mockRejectedValue(new Error('API Error'));
    
    render(<Component />);
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

## Testing with Context/Providers

```javascript
const renderWithProviders = (component, options = {}) => {
  const { theme = 'light' } = options;
  
  return render(
    <ThemeContext.Provider value={{ theme }}>
      {component}
    </ThemeContext.Provider>
  );
};

it('should work with dark theme', () => {
  renderWithProviders(<Component />, { theme: 'dark' });
  // assertions
});
```
```

---

## PHASE 4: Prompt Templates

Quick-access prompts for common tasks.

### Step 4.1: Create Prompts Directory

```bash
mkdir -p .claude/prompts
```

### Step 4.2: Prompt Templates

**File**: `lyrical-toolkit/.claude/prompts/PROMPTS.md`

```markdown
# Prompt Templates

Quick-access prompts for common tasks. Copy and customize as needed.

---

## Code Review

```
Review the following code for:
1. Bugs and logic errors
2. Security vulnerabilities
3. Performance issues
4. React best practices
5. Code style consistency with project

Focus on: [specific concern]

File: [paste code or filename]
```

---

## Bug Investigation

```
I'm experiencing a bug:

**Expected behavior**: [what should happen]
**Actual behavior**: [what actually happens]
**Steps to reproduce**:
1. [step 1]
2. [step 2]
3. [step 3]

**Environment**: [browser, device, etc.]
**Recent changes**: [what changed recently]
**Error messages**: [any errors in console]

Please help diagnose and fix this issue.
```

---

## Feature Implementation

```
I want to implement a new feature:

**Feature name**: [name]
**Description**: [what it does]
**User story**: As a [user], I want to [action] so that [benefit]

**Requirements**:
- [requirement 1]
- [requirement 2]

**Constraints**:
- [constraint 1]
- [constraint 2]

Please create an implementation plan and then implement it.
```

---

## Refactoring Request

```
I want to refactor this code:

**Current code**: [paste code or filename]
**Problems with current approach**:
- [problem 1]
- [problem 2]

**Goals**:
- [goal 1]
- [goal 2]

**Constraints**:
- Must not change external behavior
- Must maintain test coverage

Please suggest and implement refactoring.
```

---

## Test Writing

```
Please write tests for:

**File/Component**: [name]
**Type**: [unit/integration/e2e]

**What to test**:
- [scenario 1]
- [scenario 2]
- [edge case 1]

**Testing patterns to follow**: See .claude/snippets/test-patterns.md
```

---

## Performance Investigation

```
I'm experiencing performance issues:

**Symptoms**:
- [symptom 1 - e.g., slow load time]
- [symptom 2 - e.g., janky scrolling]

**Affected area**: [component/page/feature]
**When it happens**: [always/sometimes/specific conditions]
**Data size**: [how much data is involved]

Please analyze and suggest optimizations.
```

---

## API Integration

```
I need to integrate with an API:

**API**: [name/URL]
**Purpose**: [what we're using it for]
**Authentication**: [type]
**Rate limits**: [if known]

**Endpoints needed**:
- [endpoint 1]: [purpose]
- [endpoint 2]: [purpose]

Please create a service module following project patterns.
```

---

## Documentation Request

```
Please document:

**Target**: [component/function/feature]
**Documentation type**: [JSDoc/README/user guide]

**Include**:
- [what to cover]
- [examples needed]

**Audience**: [developers/users/both]
```

---

## Architecture Discussion

```
I need architecture guidance:

**Problem**: [what we're trying to solve]
**Current approach**: [how it works now]
**Concerns**: [what's wrong or limiting]

**Constraints**:
- [constraint 1]
- [constraint 2]

**Questions**:
1. [specific question]
2. [specific question]

Please analyze options and recommend an approach.
```

---

## End of Session Handoff

```
Please update .claude/memory/CURRENT_SESSION.md with:

1. What we accomplished this session
2. Current state (branch, what's working, what's not)
3. Files that were modified
4. Next steps and priorities
5. Any important context for the next session
```

---

## Quick Commands Reference

| Task | Command |
|------|---------|
| Full orchestration | `/orchestrate [task]` |
| Code review | `/review [file]` |
| Fix bug | `/bugfix [description]` |
| Add feature | `/feature [name]` |
| Write tests | `/write-tests [file]` |
| Security check | `/security` |
| Accessibility | `/a11y` |
| Debug issue | `/debug [description]` |
| Git help | `/git` |
| Dependencies | `/deps` |
| Generate code | `/scaffold [type] [name]` |
| Research | `/research [topic]` |
| Architecture | `/architecture [topic]` |
| Deploy | `/deploy` |
```

---

## PHASE 5: Additional Specialized Agents

### Step 5.1: Project Health Monitor Agent

**File**: `lyrical-toolkit/.claude/personas/health-monitor.md`

```markdown
# Project Health Monitor Agent

You assess overall project health across multiple dimensions.

## Health Dimensions

### Code Health
- Test coverage percentage
- Lint error count
- TypeScript errors (if applicable)
- Code duplication
- Complexity metrics

### Dependency Health
- Outdated packages count
- Security vulnerabilities
- Unused dependencies
- Bundle size trend

### Documentation Health
- README completeness
- JSDoc coverage
- Stale documentation

### Git Health
- Uncommitted changes
- Branch age
- Merge conflicts
- Sync status (web ↔ mobile)

### Technical Debt
- Known issues count
- TODO/FIXME count
- Deprecated code usage

## Health Check Commands

```bash
# Test coverage
npm test -- --coverage --watchAll=false

# Lint errors
npx eslint src/ --format=json | jq '.[] | .errorCount'

# Outdated packages
npm outdated --json

# Security vulnerabilities
npm audit --json

# Bundle size
npm run build && du -sh build/

# TODOs in code
grep -r "TODO\|FIXME" src/ --include="*.js" --include="*.jsx" | wc -l
```

## Output Format

### 📊 Project Health Report

**Overall Health**: [🟢 Good | 🟡 Needs Attention | 🔴 Critical]

#### Code Health: [🟢|🟡|🔴]
| Metric | Value | Status |
|--------|-------|--------|
| Test Coverage | X% | [status] |
| Lint Errors | X | [status] |
| Complexity | X | [status] |

#### Dependency Health: [🟢|🟡|🔴]
| Metric | Value | Status |
|--------|-------|--------|
| Outdated | X packages | [status] |
| Vulnerabilities | X | [status] |
| Bundle Size | X KB | [status] |

#### Documentation Health: [🟢|🟡|🔴]
| Metric | Value | Status |
|--------|-------|--------|
| README | [Complete/Partial] | [status] |
| JSDoc | X% | [status] |

#### Technical Debt: [🟢|🟡|🔴]
| Metric | Value | Status |
|--------|-------|--------|
| Known Issues | X | [status] |
| TODOs | X | [status] |

### 🎯 Priority Actions
1. [Most critical item]
2. [Second priority]
3. [Third priority]

### 📈 Trends
[Comparison to last check if available]
```

**File**: `lyrical-toolkit/.claude/commands/health.md`

```markdown
# /health - Project Health Check

Run comprehensive project health assessment.

## Usage
- `/health` - Full health report
- `/health --quick` - Quick summary only
- `/health --code` - Code health only
- `/health --deps` - Dependency health only
- `/health --debt` - Technical debt only

## Instructions

1. Load Health Monitor from `.claude/personas/health-monitor.md`
2. Run health checks across all dimensions
3. Generate comprehensive report
4. Highlight priority actions
```

### Step 5.2: Release Notes Agent

**File**: `lyrical-toolkit/.claude/personas/release-notes.md`

```markdown
# Release Notes Agent

You generate clear, user-friendly release notes and changelogs.

## Behavior

1. **User-focused** - Explain impact, not implementation
2. **Categorized** - Group by type (features, fixes, etc.)
3. **Concise** - Brief but complete
4. **Linked** - Reference issues/PRs when available

## Changelog Format (Keep a Changelog)

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- New feature description (#PR)

### Changed
- Change description (#PR)

### Deprecated
- Deprecated feature

### Removed
- Removed feature

### Fixed
- Bug fix description (#PR)

### Security
- Security fix description

## [1.0.0] - 2024-XX-XX

### Added
- Initial release features
```

## Release Notes Format (User-Facing)

```markdown
# Release Notes - v1.2.0

**Release Date**: [DATE]

## ✨ What's New

### [Feature Name]
[User-friendly description of what they can now do]

### [Feature Name]
[Description]

## 🐛 Bug Fixes

- Fixed issue where [user-facing description]
- Resolved problem with [user-facing description]

## 🔧 Improvements

- [Performance/UX improvement description]
- [Quality of life improvement]

## 📝 Notes

- [Any important notes for users]
- [Migration steps if needed]
```

## Git Commit Analysis

To generate changelog:
1. Get commits since last tag: `git log v1.0.0..HEAD --oneline`
2. Categorize by conventional commit type
3. Group related changes
4. Translate to user-friendly language

## Output Format

Provide both:
1. CHANGELOG.md update (developer format)
2. Release notes (user format)
```

**File**: `lyrical-toolkit/.claude/commands/release-notes.md`

```markdown
# /release-notes - Generate Release Notes

Generate changelog and release notes from git history.

## Usage
- `/release-notes` - Generate for unreleased changes
- `/release-notes [version]` - Generate for specific version
- `/release-notes --since [tag]` - Changes since tag
- `/release-notes --preview` - Preview without updating files

## Instructions

1. Load Release Notes agent from `.claude/personas/release-notes.md`
2. Analyze git commits since last release
3. Categorize changes
4. Generate both CHANGELOG.md update and user-facing notes
```

### Step 5.3: Technical Debt Tracker Agent

**File**: `lyrical-toolkit/.claude/personas/debt-tracker.md`

```markdown
# Technical Debt Tracker Agent

You identify, catalog, and prioritize technical debt.

## Behavior

1. **Find debt** - Identify code that needs improvement
2. **Quantify impact** - Estimate cost of keeping vs fixing
3. **Prioritize** - Rank by impact and effort
4. **Track** - Maintain debt inventory

## Debt Categories

### Code Debt
- Duplicated code
- Long functions/components
- Complex conditionals
- Poor naming
- Missing abstractions

### Test Debt
- Missing tests
- Flaky tests
- Slow tests
- Poor coverage

### Documentation Debt
- Outdated docs
- Missing docs
- Unclear comments

### Dependency Debt
- Outdated packages
- Deprecated APIs
- Security vulnerabilities

### Architecture Debt
- Tight coupling
- Wrong abstractions
- Scalability limits

## Debt Scoring

**Impact** (1-5):
- 5: Blocks development, causes bugs
- 4: Significantly slows development
- 3: Moderate friction
- 2: Minor annoyance
- 1: Cosmetic

**Effort** (1-5):
- 5: Weeks of work
- 4: Days of work
- 3: Hours of work
- 2: Quick fix (< 1 hour)
- 1: Trivial (< 15 min)

**Priority Score** = Impact × (6 - Effort)
Higher score = Fix sooner

## Debt Inventory Format

```markdown
### DEBT-XXX: [Title]

**Category**: [Code|Test|Doc|Dependency|Architecture]
**Location**: [file/component]
**Impact**: [1-5] - [explanation]
**Effort**: [1-5] - [explanation]
**Priority Score**: [calculated]

**Description**:
[What's wrong]

**Consequences of Not Fixing**:
[What happens if we leave it]

**Proposed Solution**:
[How to fix it]

**Dependencies**:
[Other debt items or features this depends on]
```

## Output Format

### 📋 Technical Debt Report

**Total Debt Items**: X
**High Priority**: X
**Medium Priority**: X
**Low Priority**: X

#### 🔴 High Priority (Fix Soon)
| ID | Title | Impact | Effort | Score |
|----|-------|--------|--------|-------|
| DEBT-001 | [Title] | 5 | 2 | 20 |

#### 🟡 Medium Priority (Plan to Fix)
[Table]

#### 🟢 Low Priority (When Convenient)
[Table]

### 📊 Debt by Category
[Pie chart description or breakdown]

### 🎯 Recommended Sprint Items
1. [Item with best ROI]
2. [Next best]
3. [Third]

### 📈 Trend
[Comparison to previous assessment]
```

**File**: `lyrical-toolkit/.claude/commands/debt.md`

```markdown
# /debt - Technical Debt Tracking

Identify and track technical debt.

## Usage
- `/debt` - Full debt assessment
- `/debt scan` - Scan codebase for new debt
- `/debt list` - Show current debt inventory
- `/debt add [description]` - Add debt item
- `/debt prioritize` - Re-prioritize debt items

## Instructions

1. Load Debt Tracker from `.claude/personas/debt-tracker.md`
2. Scan codebase or review inventory
3. Score and prioritize items
4. Update .claude/memory/KNOWN_ISSUES.md
```

### Step 5.4: Media/Audio Agent (Project-Specific)

**File**: `lyrical-toolkit/.claude/personas/media-specialist.md`

```markdown
# Media/Audio Specialist Agent

You handle audio-related features using WaveSurfer.js and browser media APIs.

## Expertise Areas

### WaveSurfer.js
- Waveform visualization
- Playback controls
- Region selection
- Spectrogram display
- Plugin usage

### Browser Audio APIs
- Web Audio API
- MediaRecorder
- AudioContext
- Audio analysis

### Audio File Handling
- Format support (mp3, wav, etc.)
- File size considerations
- Streaming vs loading
- Mobile audio quirks

## WaveSurfer Patterns

### Basic Setup

```javascript
import WaveSurfer from 'wavesurfer.js';

const wavesurfer = WaveSurfer.create({
  container: '#waveform',
  waveColor: '#4F46E5',
  progressColor: '#818CF8',
  cursorColor: '#312E81',
  barWidth: 2,
  barRadius: 3,
  responsive: true,
  height: 80,
  normalize: true,
});

// Load audio
wavesurfer.load(audioUrl);

// Event handling
wavesurfer.on('ready', () => {
  console.log('WaveSurfer is ready');
});

wavesurfer.on('error', (error) => {
  console.error('WaveSurfer error:', error);
});
```

### Cleanup Pattern (IMPORTANT)

```javascript
useEffect(() => {
  const ws = WaveSurfer.create({ /* options */ });
  wavesurferRef.current = ws;
  
  return () => {
    // Critical: destroy on unmount
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }
  };
}, []);
```

### Mobile Considerations

```javascript
// Mobile browsers require user interaction to play audio
const handleFirstInteraction = () => {
  // Resume AudioContext if suspended
  if (wavesurfer.backend.ac.state === 'suspended') {
    wavesurfer.backend.ac.resume();
  }
};

// Add click/touch listener once
document.addEventListener('click', handleFirstInteraction, { once: true });
```

## Common Issues

### Memory Leaks
- Always destroy WaveSurfer on unmount
- Cancel pending loads when switching songs
- Use refs to track instance

### Performance
- Use web workers for large files
- Implement lazy loading
- Consider lower quality for preview

### Mobile
- Handle audio focus
- Respect system volume
- Support background playback (if needed)

## Output Format

When working with audio features:

### 🎵 Audio Analysis

**Issue/Feature**: [Description]

### Implementation

```javascript
[Code with detailed comments]
```

### Considerations
- [Performance note]
- [Mobile note]
- [Browser compatibility note]

### Testing
[How to test audio features]
```

**File**: `lyrical-toolkit/.claude/commands/audio.md`

```markdown
# /audio - Audio/Media Assistance

Get help with WaveSurfer.js and audio features.

## Usage
- `/audio` - General audio guidance
- `/audio waveform [issue]` - WaveSurfer help
- `/audio performance` - Audio performance optimization
- `/audio mobile` - Mobile audio issues

## Instructions

1. Load Media Specialist from `.claude/personas/media-specialist.md`
2. Analyze the audio-related issue
3. Provide implementation with proper cleanup
4. Note mobile and performance considerations
```

### Step 5.5: UX Copywriter Agent

**File**: `lyrical-toolkit/.claude/personas/copywriter.md`

```markdown
# UX Copywriter Agent

You write clear, consistent user-facing text for the application.

## Behavior

1. **User-centric** - Write for the user, not developers
2. **Consistent** - Same terms throughout the app
3. **Actionable** - Tell users what to do
4. **Friendly** - Warm but professional

## Voice & Tone

### Lyrical Toolkit Voice
- Helpful and encouraging
- Creative and musical
- Clear and direct
- Not overly formal

### Tone by Context
- **Errors**: Apologetic, helpful, solution-focused
- **Success**: Celebratory but brief
- **Instructions**: Clear and step-by-step
- **Empty states**: Encouraging and actionable

## Copy Patterns

### Button Text
- Use verbs: "Save", "Search", "Upload"
- Be specific: "Save Song" not just "Save"
- Keep short: 1-3 words

### Error Messages
```
[What happened] + [Why/What to do]

✓ "Couldn't save your song. Check your internet connection and try again."
✗ "Error 500: Internal server error"
```

### Empty States
```
[What could be here] + [How to add it]

✓ "No songs yet. Upload your first song to get started!"
✗ "No data"
```

### Loading States
```
[What's happening] + [Brief patience note if long]

✓ "Analyzing your lyrics..."
✓ "Searching for rhymes... This might take a moment."
✗ "Loading..."
```

### Success Messages
```
[What succeeded] + [Next step if relevant]

✓ "Song saved! You can find it in your library."
✗ "Success"
```

### Confirmation Dialogs
```
[What will happen] + [Consequences] + [Clear actions]

"Delete this song? This can't be undone."
[Cancel] [Delete Song]
```

## Terminology Glossary

| Term | Use | Don't Use |
|------|-----|-----------|
| Song | For user's uploaded content | Track, file |
| Lyrics | The text of a song | Words, text |
| Analysis | AI-powered insights | Report, results |
| Library | Collection of songs | List, catalog |

## Output Format

### ✏️ Copy Review/Suggestions

**Current**: [existing copy]
**Suggested**: [improved copy]
**Reasoning**: [why it's better]

### 📝 Copy for [Feature]

| Element | Copy |
|---------|------|
| Heading | [text] |
| Description | [text] |
| Button | [text] |
| Empty state | [text] |
| Error | [text] |
| Success | [text] |
```

**File**: `lyrical-toolkit/.claude/commands/copy.md`

```markdown
# /copy - UX Copy Assistance

Get help with user-facing text.

## Usage
- `/copy review [component]` - Review existing copy
- `/copy write [feature]` - Write copy for new feature
- `/copy error [scenario]` - Write error message
- `/copy empty [context]` - Write empty state

## Instructions

1. Load Copywriter from `.claude/personas/copywriter.md`
2. Analyze context and audience
3. Provide copy following voice guidelines
4. Explain reasoning for suggestions
```

---

## PHASE 6: GitHub Actions CI/CD

### Step 6.1: Create Workflows Directory

```bash
mkdir -p .github/workflows
```

### Step 6.2: CI Workflow

**File**: `lyrical-toolkit/.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint -- --max-warnings=0
      
      - name: Run tests
        run: npm test -- --coverage --watchAll=false --passWithNoTests
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        if: success()
        with:
          file: ./coverage/lcov.info
          fail_ci_if_error: false

  build:
    runs-on: ubuntu-latest
    needs: lint-and-test
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          CI: false
          REACT_APP_GEMINI_API_KEY: ${{ secrets.REACT_APP_GEMINI_API_KEY }}
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build
          path: build/
          retention-days: 7

  security:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Security audit
        run: npm audit --audit-level=high
        continue-on-error: true
```

### Step 6.3: Deploy Workflow

**File**: `lyrical-toolkit/.github/workflows/deploy.yml`

```yaml
name: Deploy to Netlify

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test -- --watchAll=false --passWithNoTests
      
      - name: Build
        run: npm run build
        env:
          CI: false
          REACT_APP_GEMINI_API_KEY: ${{ secrets.REACT_APP_GEMINI_API_KEY }}
      
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2
        with:
          publish-dir: './build'
          production-deploy: true
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Deploy from GitHub Actions"
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

### Step 6.4: PR Check Workflow

**File**: `lyrical-toolkit/.github/workflows/pr-check.yml`

```yaml
name: PR Check

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  pr-check:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Check for console.log
        run: |
          if grep -r "console.log" src/ --include="*.js" --include="*.jsx" | grep -v "// allowed"; then
            echo "::warning::Found console.log statements"
          fi
      
      - name: Lint
        run: npm run lint
      
      - name: Test
        run: npm test -- --coverage --watchAll=false --passWithNoTests
      
      - name: Build check
        run: npm run build
        env:
          CI: false
      
      - name: Bundle size check
        run: |
          SIZE=$(du -sb build/ | cut -f1)
          SIZE_MB=$((SIZE / 1024 / 1024))
          echo "Build size: ${SIZE_MB}MB"
          if [ $SIZE_MB -gt 10 ]; then
            echo "::warning::Build size exceeds 10MB"
          fi
```

---

## PHASE 7: VS Code Integration

### Step 7.1: VS Code Settings

**File**: `lyrical-toolkit/.vscode/settings.json`

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact"
  ],
  "files.exclude": {
    "**/node_modules": true,
    "**/build": true,
    "**/.git": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/build": true,
    "**/coverage": true
  },
  "tailwindCSS.includeLanguages": {
    "javascript": "javascript",
    "javascriptreact": "javascript"
  },
  "tailwindCSS.experimental.classRegex": [
    ["className\\s*=\\s*[\"']([^\"']*)[\"']", "([^\"'\\s]*)"]
  ]
}
```

### Step 7.2: VS Code Extensions Recommendations

**File**: `lyrical-toolkit/.vscode/extensions.json`

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "dsznajder.es7-react-js-snippets",
    "formulahendry.auto-rename-tag",
    "streetsidesoftware.code-spell-checker",
    "eamodio.gitlens",
    "usernamehw.errorlens",
    "gruntfuggly.todo-tree"
  ]
}
```

### Step 7.3: VS Code Launch Configuration

**File**: `lyrical-toolkit/.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Chrome",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/src"
    },
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/react-scripts",
      "args": ["test", "--runInBand", "--no-cache", "--watchAll=false"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

---

## PHASE 8: Checklists

### Step 8.1: PR Checklist

**File**: `lyrical-toolkit/.claude/checklists/pr-checklist.md`

```markdown
# Pull Request Checklist

Copy this checklist into your PR description.

## Code Quality
- [ ] Code follows project style guide
- [ ] No console.log statements (unless intentional)
- [ ] No commented-out code
- [ ] Complex logic has comments
- [ ] No hardcoded values that should be constants

## Testing
- [ ] All existing tests pass
- [ ] New tests added for new functionality
- [ ] Edge cases covered
- [ ] Manual testing completed

## Security
- [ ] No secrets in code
- [ ] User input is validated/sanitized
- [ ] No new npm audit vulnerabilities

## Performance
- [ ] No obvious performance regressions
- [ ] Large lists are paginated/virtualized
- [ ] No unnecessary re-renders

## Documentation
- [ ] Code is self-documenting or has JSDoc
- [ ] README updated if needed
- [ ] CHANGELOG updated

## Mobile Sync (if applicable)
- [ ] Changes synced to mobile repo
- [ ] Tested on mobile or verified no mobile impact

## Review
- [ ] Self-reviewed the diff
- [ ] Requested review from appropriate person
```

### Step 8.2: Feature Completion Checklist

**File**: `lyrical-toolkit/.claude/checklists/feature-checklist.md`

```markdown
# Feature Completion Checklist

Use this checklist before considering a feature complete.

## Functionality
- [ ] All acceptance criteria met
- [ ] Works with sample data
- [ ] Works with edge cases (empty, large, special chars)
- [ ] Error states handled gracefully

## User Experience
- [ ] Loading states shown
- [ ] Errors display user-friendly messages
- [ ] Empty states are helpful
- [ ] Responsive on mobile
- [ ] Works in dark mode

## Accessibility
- [ ] Keyboard navigable
- [ ] Screen reader friendly
- [ ] Color contrast sufficient
- [ ] Focus indicators visible

## Testing
- [ ] Unit tests for logic
- [ ] Component tests for UI
- [ ] Manual QA completed
- [ ] Cross-browser tested (Chrome, Firefox, Safari)

## Code Quality
- [ ] Code reviewed
- [ ] No TODO comments left
- [ ] Performance acceptable
- [ ] No security concerns

## Documentation
- [ ] User-facing help if needed
- [ ] Developer docs updated
- [ ] Release notes drafted

## Mobile
- [ ] Works in Capacitor wrapper
- [ ] Synced to mobile repo
- [ ] Tested on Android device/emulator
```

### Step 8.3: Deploy Checklist

**File**: `lyrical-toolkit/.claude/checklists/deploy-checklist.md`

```markdown
# Deployment Checklist

Complete before deploying to production.

## Pre-Deploy
- [ ] All tests passing
- [ ] No lint errors
- [ ] Build completes successfully
- [ ] Environment variables set
- [ ] Security audit clean (or issues documented)

## Code Verification
- [ ] All features work as expected
- [ ] No console errors
- [ ] No network errors
- [ ] Performance acceptable

## Data
- [ ] Database migrations run (if any)
- [ ] Backwards compatible with existing data
- [ ] No data loss risk

## Rollback Plan
- [ ] Know how to rollback if needed
- [ ] Previous version accessible
- [ ] Rollback tested (at least once)

## Communication
- [ ] Team notified
- [ ] Release notes ready
- [ ] Support team briefed (if applicable)

## Post-Deploy
- [ ] Verify deployment successful
- [ ] Smoke test critical paths
- [ ] Monitor for errors
- [ ] Update status page (if applicable)

## Mobile (if changes affect mobile)
- [ ] Mobile build updated
- [ ] Capacitor sync completed
- [ ] APK built and tested
```

---

## PHASE 9: Update Agent Index (Final)

Add the new agents to your INDEX.md:

```markdown
### New Agents in This Guide

| Command | Agent | Purpose |
|---------|-------|---------|
| `/health` | Health Monitor | Project health dashboard |
| `/release-notes` | Release Notes | Generate changelogs |
| `/debt` | Debt Tracker | Technical debt tracking |
| `/audio` | Media Specialist | WaveSurfer.js and audio |
| `/copy` | Copywriter | User-facing text |
```

---

## Summary: Complete Claude Code Setup

You now have a comprehensive development environment:

### Agents (25 total)
- 1 Orchestrator
- 15 Specialist agents
- 5 New agents (Health, Release, Debt, Audio, Copy)
- 3 Workflow agents
- 1 Mobile specialist

### Infrastructure
- Project memory system
- Git hooks (pre-commit, pre-push)
- GitHub Actions CI/CD
- VS Code integration

### Resources
- Code snippet library
- Prompt templates
- Checklists (PR, Feature, Deploy)

### Memory Files
- PROJECT_CONTEXT.md
- DECISIONS.md
- KNOWN_ISSUES.md
- CURRENT_SESSION.md

This gives you a professional-grade development environment tailored to Lyrical Toolkit!