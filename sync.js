/**
 * Lyrical Toolkit Sync Script
 * 
 * Automatically syncs shared files between website and mobile repos
 * 
 * Usage:
 *   node sync.js website    # Sync website → mobile
 *   node sync.js mobile     # Sync mobile → website
 *   node sync.js check      # Check for differences
 */

const fs = require('fs');
const path = require('path');

// Paths
const WEBSITE_ROOT = 'C:\\Users\\J\\Desktop\\WEBSITES\\lyrical-toolkit';
const MOBILE_ROOT = 'C:\\Users\\J\\Desktop\\WEBSITES\\lyrical-toolkit mobile';

// Shared files that should be identical
const SHARED_FILES = [
  // Services
  'src/services/audioStorageService.js',
  'src/services/authService.js',
  'src/services/geminiService.js',
  'src/services/songsService.js',
  
  // Hooks (excluding mobile-only hooks)
  'src/hooks/useAuth.js',
  'src/hooks/useFileUpload.js',
  'src/hooks/useLocalStorage.js',
  'src/hooks/useSearch.js',
  
  // Audio components
  'src/components/Audio/AudioPlayer.js',
  'src/components/Audio/AudioUpload.js',
  
  // You can add more shared files here as needed
];

// Utility functions
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

function copyFile(source, destination) {
  try {
    // Ensure destination directory exists
    const destDir = path.dirname(destination);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    fs.copyFileSync(source, destination);
    return true;
  } catch (err) {
    console.error(`❌ Error copying ${source}:`, err.message);
    return false;
  }
}

function getFileModifiedTime(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.mtime;
  } catch (err) {
    return null;
  }
}

function syncFiles(sourceRoot, targetRoot) {
  console.log(`\n🔄 Syncing files from ${path.basename(sourceRoot)} to ${path.basename(targetRoot)}...\n`);
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  SHARED_FILES.forEach(file => {
    const sourcePath = path.join(sourceRoot, file);
    const targetPath = path.join(targetRoot, file);
    
    if (!fileExists(sourcePath)) {
      console.log(`⚠️  Source not found: ${file}`);
      skipCount++;
      return;
    }
    
    if (copyFile(sourcePath, targetPath)) {
      console.log(`✅ Synced: ${file}`);
      successCount++;
    } else {
      errorCount++;
    }
  });
  
  console.log('\n📊 Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ⚠️  Skipped: ${skipCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log('\n⚡ Remember to test both apps!\n');
}

function checkDifferences() {
  console.log('\n🔍 Checking for differences between repos...\n');
  
  const differences = [];
  
  SHARED_FILES.forEach(file => {
    const websitePath = path.join(WEBSITE_ROOT, file);
    const mobilePath = path.join(MOBILE_ROOT, file);
    
    if (!fileExists(websitePath) && !fileExists(mobilePath)) {
      console.log(`⚠️  Missing in both: ${file}`);
      return;
    }
    
    if (!fileExists(websitePath)) {
      console.log(`📱 Mobile only: ${file}`);
      differences.push({ file, status: 'mobile-only' });
      return;
    }
    
    if (!fileExists(mobilePath)) {
      console.log(`🌐 Website only: ${file}`);
      differences.push({ file, status: 'website-only' });
      return;
    }
    
    // Compare file contents
    const websiteContent = fs.readFileSync(websitePath, 'utf8');
    const mobileContent = fs.readFileSync(mobilePath, 'utf8');
    
    if (websiteContent !== mobileContent) {
      const websiteTime = getFileModifiedTime(websitePath);
      const mobileTime = getFileModifiedTime(mobilePath);
      
      const newer = websiteTime > mobileTime ? 'website' : 'mobile';
      console.log(`⚠️  Different: ${file} (${newer} is newer)`);
      differences.push({ file, status: 'different', newer });
    } else {
      console.log(`✅ Identical: ${file}`);
    }
  });
  
  if (differences.length > 0) {
    console.log('\n📊 Summary:');
    console.log(`   ${differences.length} file(s) need attention`);
    console.log('\n💡 Run "node sync.js website" or "node sync.js mobile" to sync\n');
  } else {
    console.log('\n🎉 All shared files are in sync!\n');
  }
}

// Main execution
const command = process.argv[2];

if (!command) {
  console.log('\n❌ Missing command\n');
  console.log('Usage:');
  console.log('  node sync.js website    # Sync website → mobile');
  console.log('  node sync.js mobile     # Sync mobile → website');
  console.log('  node sync.js check      # Check for differences\n');
  process.exit(1);
}

switch (command.toLowerCase()) {
  case 'website':
    syncFiles(WEBSITE_ROOT, MOBILE_ROOT);
    break;
    
  case 'mobile':
    syncFiles(MOBILE_ROOT, WEBSITE_ROOT);
    break;
    
  case 'check':
    checkDifferences();
    break;
    
  default:
    console.log(`\n❌ Unknown command: ${command}\n`);
    console.log('Valid commands: website, mobile, check\n');
    process.exit(1);
}
