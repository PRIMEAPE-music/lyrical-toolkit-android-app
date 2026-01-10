# Sync Utilities - Quick Start Guide

This folder contains utilities to help you keep your website and mobile app codebases in sync.

## 📁 Files Created

1. **SYNC_STRATEGY.md** - Complete documentation of the sync strategy
2. **quick-sync.bat** - Interactive menu for common sync operations
3. **sync.js** - Node.js script for automated syncing

---

## 🚀 Quick Start

### Option 1: Interactive Menu (Easiest)

Double-click `quick-sync.bat` and follow the menu:

```
1. Sync ALL shared files (Website → Mobile)
2. Sync ALL shared files (Mobile → Website)
3. Sync services only (Website → Mobile)
4. Sync services only (Mobile → Website)
5. Sync hooks only (Website → Mobile)
6. Sync hooks only (Mobile → Website)
7. Sync specific file
8. Exit
```

### Option 2: Command Line (Node.js)

```bash
# Check for differences
node sync.js check

# Sync website changes to mobile
node sync.js website

# Sync mobile changes to website
node sync.js mobile
```

---

## 📋 Common Scenarios

### Scenario 1: I updated a service in the website
```bash
# Run from either repo folder:
node sync.js website
```

### Scenario 2: I added a mobile feature and want to bring it to the website
```bash
# Run from either repo folder:
node sync.js mobile
```

### Scenario 3: Not sure what's different?
```bash
# Check what needs syncing:
node sync.js check
```

### Scenario 4: I want to sync just one file
```bash
# Use the batch file (Option 7)
quick-sync.bat
# Then choose option 7 and enter the file path
```

---

## ⚠️ Important Notes

### Files That Are ALWAYS Synced
- All services (`src/services/*`)
- Core hooks (useAuth, useFileUpload, useLocalStorage, useSearch)
- Audio components (AudioPlayer, AudioUpload)
- Shared UI components
- Analysis components

### Files That Are NEVER Synced
- **Mobile Only**: 
  - `android/` folder
  - `capacitor.config.ts`
  - `NotepadTabBar.js`
  - `useDrafts.js`, `useSwipeGestures.js`, `useScrollDirection.js`
  - Navigation components
  - Settings components

- **Website Only**:
  - `netlify/` folder
  - `.netlify/` folder
  - Netlify configs

### Files That Need Manual Merging
- `FloatingNotepad.js` - Mobile has tabs, website doesn't
- `App.js` - Mobile has Capacitor initialization
- Style files - Mobile has additional mobile-specific CSS

---

## 🔍 Before You Sync - Checklist

- [ ] Have you committed your current changes?
- [ ] Do you know which direction you're syncing?
- [ ] Have you read SYNC_STRATEGY.md for your file category?
- [ ] Are you ready to test after syncing?

---

## 🧪 After Syncing - Test

### Website Testing
```bash
cd "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit"
npm start
```
Test the affected features in your browser.

### Mobile Testing
```bash
cd "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile"
npm start
# OR
npx cap run android
```
Test the affected features in the Android app.

---

## 🆘 Troubleshooting

### "File not found" error
- Make sure both repos exist at the expected paths
- Check that the file exists in the source repo

### Sync completed but changes don't appear
- Clear build cache: `npm run build`
- Restart development server
- Check if you're looking at the right file

### Accidentally synced the wrong direction
- Use git to revert: `git checkout -- <filename>`
- Or sync in the opposite direction to fix it

---

## 📚 Next Steps

1. Read **SYNC_STRATEGY.md** for the complete strategy
2. Bookmark `quick-sync.bat` for easy access
3. Set a reminder to sync weekly
4. Update the SHARED_FILES list in `sync.js` as you add new shared components

---

## 🎯 Pro Tips

1. **Sync often** - Weekly syncing prevents major divergence
2. **Check first** - Run `node sync.js check` before making changes
3. **Test thoroughly** - Always test both platforms after syncing
4. **Document changes** - Update SYNC_STRATEGY.md when adding new shared files
5. **Use git** - Commit before syncing so you can easily revert

---

**Remember**: The mobile app is the "source of truth" for now since it has more features. When in doubt, sync mobile → website.
