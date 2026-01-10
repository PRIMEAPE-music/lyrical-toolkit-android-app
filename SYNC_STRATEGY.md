# Website ↔️ Mobile App Sync Strategy

**Last Updated**: January 2026  
**Purpose**: Maintain consistency between website and mobile app while supporting platform-specific features

---

## 📋 Table of Contents
1. [File Categories](#file-categories)
2. [Sync Workflow](#sync-workflow)
3. [Platform Detection Pattern](#platform-detection-pattern)
4. [Quick Sync Commands](#quick-sync-commands)
5. [Maintenance Schedule](#maintenance-schedule)

---

## 📁 File Categories

### ✅ SHARED FILES (Always sync both ways)

These files should be identical across both repos:

#### **Core Business Logic**
```
src/services/
├── audioStorageService.js    ✅ Core audio handling
├── authService.js             ✅ Authentication logic
├── geminiService.js           ✅ AI analysis
└── songsService.js            ✅ Database operations

src/hooks/
├── useAuth.js                 ✅ Auth state management
├── useFileUpload.js           ✅ File upload logic
├── useLocalStorage.js         ✅ Storage utilities
├── useNotepad.js              ✅ Notepad state (BASE VERSION)
└── useSearch.js               ✅ Search functionality

src/utils/
├── textAnalysis.js            ✅ Text processing
├── phoneticUtils.js           ✅ Phonetic analysis
└── validation.js              ✅ Form validation

src/data/
└── [All data files]           ✅ Reference data
```

#### **Shared UI Components**
```
src/components/Audio/
├── AudioPlayer.js             ✅ Audio playback (with platform detection)
└── AudioUpload.js             ✅ Upload handling

src/components/Shared/
└── [All shared components]    ✅ Buttons, inputs, etc.

src/components/Analysis/
└── [All analysis components]  ✅ AI analysis UI

src/components/Tabs/
└── [All tab components]       ✅ Main app tabs
```

---

### 🔄 CONDITIONALLY SHARED (Sync with modifications)

These files exist in both but need platform-specific adaptations:

```
src/components/Notepad/
├── FloatingNotepad.js         🔄 MERGE: Mobile has tabs + mobile UI
└── FloatingNotepad.test.js    ✅ Can be identical

src/components/Header/
└── [Header components]        🔄 Mobile has bottom nav awareness

src/App.js                     🔄 Mobile has Capacitor initialization
src/App.css                    🔄 Mobile has additional mobile styles
src/index.css                  🔄 Mobile has mobile-specific CSS
```

**Merging Strategy for Conditionally Shared Files**:
- Use environment detection: `const isMobile = window.innerWidth <= 768`
- Use Capacitor detection: `import { Capacitor } from '@capacitor/core'`
- Keep mobile-specific code in conditional blocks

---

### 📱 MOBILE-ONLY (Never sync to website)

```
android/                       📱 Native Android code
capacitor.config.ts            📱 Capacitor configuration

src/components/Navigation/     📱 Bottom navigation
src/components/Settings/       📱 Mobile settings
src/components/Notepad/
└── NotepadTabBar.js          📱 Tab bar component

src/hooks/
├── useDrafts.js              📱 Draft management (tab system)
├── useScrollDirection.js     📱 Scroll-based UI hiding
└── useSwipeGestures.js       📱 Touch gestures

src/config/                    📱 Mobile-specific configs
```

---

### 🌐 WEBSITE-ONLY (Never sync to mobile)

```
netlify/                       🌐 Netlify deployment
.netlify/                      🌐 Netlify build artifacts
netlify.toml.backup            🌐 Deployment config

server/                        🌐 Backend server (if website-specific)
                                  (Note: Check if mobile needs this too)
```

---

## 🔄 Sync Workflow

### **Option 1: Manual Sync (Recommended to Start)**

#### When Website Changes:
1. **Make changes in website repo**
2. **Identify affected files** (check category above)
3. **For SHARED files**:
   ```bash
   # Copy from website → mobile
   xcopy /Y "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\src\services\geminiService.js" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\src\services\geminiService.js"
   ```
4. **For CONDITIONAL files**:
   - Manually merge changes
   - Preserve mobile-specific code
   - Test both platforms
5. **Test mobile app** to ensure nothing broke

#### When Mobile Changes:
1. **Make changes in mobile repo**
2. **For SHARED files**:
   ```bash
   # Copy from mobile → website
   xcopy /Y "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\src\hooks\useAuth.js" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\src\hooks\useAuth.js"
   ```
3. **For CONDITIONAL files**: Manually merge
4. **Test website** to ensure compatibility

---

### **Option 2: Sync Script (Future Enhancement)**

Create `sync.js` in each repo root:

```javascript
// sync.js - Automated file copying
const fs = require('fs-extra');
const path = require('path');

const SHARED_FILES = [
  'src/services/audioStorageService.js',
  'src/services/authService.js',
  'src/services/geminiService.js',
  'src/services/songsService.js',
  'src/hooks/useAuth.js',
  'src/hooks/useFileUpload.js',
  'src/hooks/useLocalStorage.js',
  'src/hooks/useSearch.js',
  // ... add all shared files
];

const SOURCE = process.argv[2]; // 'website' or 'mobile'
const sourcePath = SOURCE === 'website' 
  ? 'C:\\Users\\J\\Desktop\\WEBSITES\\lyrical-toolkit'
  : 'C:\\Users\\J\\Desktop\\WEBSITES\\lyrical-toolkit mobile';
const targetPath = SOURCE === 'website'
  ? 'C:\\Users\\J\\Desktop\\WEBSITES\\lyrical-toolkit mobile'
  : 'C:\\Users\\J\\Desktop\\WEBSITES\\lyrical-toolkit';

SHARED_FILES.forEach(file => {
  const src = path.join(sourcePath, file);
  const dest = path.join(targetPath, file);
  
  if (fs.existsSync(src)) {
    fs.copySync(src, dest);
    console.log(`✅ Synced: ${file}`);
  } else {
    console.log(`⚠️  Not found: ${file}`);
  }
});

console.log('\n🎉 Sync complete! Remember to test both apps.');
```

**Usage**:
```bash
# Sync website → mobile
node sync.js website

# Sync mobile → website
node sync.js mobile
```

---

## 🎯 Platform Detection Pattern

For files that need to work on both platforms with slight differences:

```javascript
import { Capacitor } from '@capacitor/core';

const FloatingNotepad = ({ ... }) => {
  // Detect platform
  const isMobile = window.innerWidth <= 768;
  const isNativeApp = Capacitor.isNativePlatform();
  const isWeb = !isNativeApp;

  // Platform-specific rendering
  if (isMobile && !isFullscreen && isMinimized) {
    return (
      <button /* FAB - Mobile only */>
        <Edit3 />
      </button>
    );
  }

  // Shared rendering with conditional styles
  return (
    <div style={{
      bottom: isMobile ? `${position.bottom + 64}px` : `${position.bottom}px`,
      // ... other styles
    }}>
      {/* Shared content */}
    </div>
  );
};
```

---

## ⚡ Quick Sync Commands

Create a batch file `quick-sync.bat` for common scenarios:

```batch
@echo off
echo ===================================
echo   Lyrical Toolkit Sync Utility
echo ===================================
echo.
echo 1. Sync ALL services (Website → Mobile)
echo 2. Sync ALL services (Mobile → Website)
echo 3. Sync specific file
echo 4. Exit
echo.
set /p choice="Enter choice (1-4): "

if "%choice%"=="1" goto sync_services_to_mobile
if "%choice%"=="2" goto sync_services_to_website
if "%choice%"=="3" goto sync_specific
if "%choice%"=="4" exit

:sync_services_to_mobile
echo Syncing services Website → Mobile...
xcopy /Y "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\src\services\*" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\src\services\"
echo ✅ Done!
pause
exit

:sync_services_to_website
echo Syncing services Mobile → Website...
xcopy /Y "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\src\services\*" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\src\services\"
echo ✅ Done!
pause
exit

:sync_specific
set /p filepath="Enter file path (e.g., src/hooks/useAuth.js): "
set /p direction="Sync direction (1=Website→Mobile, 2=Mobile→Website): "
if "%direction%"=="1" (
  xcopy /Y "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\%filepath%" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\%filepath%"
) else (
  xcopy /Y "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\%filepath%" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\%filepath%"
)
echo ✅ Done!
pause
exit
```

---

## 📅 Maintenance Schedule

### Weekly
- [ ] Review commits in both repos
- [ ] Sync any shared files that changed
- [ ] Test both platforms after sync

### Monthly
- [ ] Deep comparison of shared files
- [ ] Update this document with new shared/exclusive files
- [ ] Consider refactoring duplicated code

### Per Feature
- [ ] Before starting: Check which files will be affected
- [ ] After completing: Document if new files are shared or exclusive
- [ ] Sync immediately if shared files were modified

---

## 🚀 Migration Path (Future)

### Phase 1: Current Manual Sync ✅ (You are here)
- Use this document as reference
- Manual copy/paste when needed
- Build discipline around syncing

### Phase 2: Automated Sync Script (Next 1-2 months)
- Implement `sync.js` script
- Create `quick-sync.bat` for convenience
- Set up pre-commit hooks to warn about shared file changes

### Phase 3: Unified Codebase (3-6 months)
- Extract truly shared code to `src/shared/` folder
- Use symbolic links or Git subtree
- Platform-specific code in `src/platforms/web/` and `src/platforms/mobile/`

### Phase 4: Monorepo (6+ months, optional)
- Consider tools like Nx or Turborepo
- Single repo with clear workspace structure
- Shared build configurations

---

## 📝 Sync Checklist Template

Use this when making changes:

```markdown
## Change Sync Checklist

**Date**: _______
**Changed By**: _______
**Feature/Fix**: _______________________

### Files Modified:
- [ ] File 1: _________________ (Category: ✅/🔄/📱/🌐)
- [ ] File 2: _________________ (Category: ✅/🔄/📱/🌐)
- [ ] File 3: _________________ (Category: ✅/🔄/📱/🌐)

### Sync Actions:
- [ ] Identified shared files (✅)
- [ ] Copied shared files to other repo
- [ ] Merged conditional files (🔄)
- [ ] Tested website
- [ ] Tested mobile app
- [ ] Committed changes in both repos

### Notes:
_______________________________________
```

---

## 🆘 Common Issues & Solutions

### Issue: File exists in both but is different
**Solution**: 
1. Compare with diff tool (VS Code, WinMerge)
2. Determine if differences are intentional (platform-specific)
3. If not, choose which version is correct and sync

### Issue: Forgot to sync a shared file
**Solution**:
1. Check git history to find when it diverged
2. Carefully merge changes from both versions
3. Test thoroughly

### Issue: Mobile feature needs to go to website
**Solution**:
1. Check if feature uses mobile-only APIs (Capacitor)
2. If yes: Refactor to use platform detection
3. If no: Copy directly and test

---

## 📞 Quick Reference

**Website Repo**: `C:\Users\J\Desktop\WEBSITES\lyrical-toolkit`  
**Mobile Repo**: `C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile`

**Primary Source of Truth**: Mobile (has more features)  
**Sync Direction for New Features**: Mobile → Website (usually)

**Key Principle**: When in doubt, don't break the mobile app. It has more complexity.

---

**Remember**: Consistency > Perfection. It's okay if files drift slightly, but aim to sync major changes within a week.
