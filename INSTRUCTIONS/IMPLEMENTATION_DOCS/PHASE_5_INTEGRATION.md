# PHASE 5: INTEGRATION & PLATFORM DIFFERENCES

**Goal:** Wire everything together and handle platform-specific differences

**Estimated Time:** 1-2 hours

---

## 📋 OVERVIEW

This phase connects all the pieces and creates platform-specific code for:
- **Website**: Direct access to subscription pages
- **Android App**: Opens browser for subscription (avoids Google Play fees)

---

## 🔌 WEBSITE INTEGRATION (lyrical-toolkit repo)

### Step 1: Create Subscription Success/Cancel Pages

📁 **File: `src/pages/SubscribeSuccess.js`**

```javascript
import React, { useEffect } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const SubscribeSuccess = () => {
  const { user } = useAuth();
  const [checking, setChecking] = React.useState(true);

  useEffect(() => {
    // Give webhook time to process (2-3 seconds usually)
    const timer = setTimeout(() => {
      if (user?.id) {
        // Verify subscription was created
        fetch('/.netlify/functions/check-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        }).then(() => {
          setChecking(false);
        });
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        {checking ? (
          <>
            <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Activating Your Subscription...
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we set up your account.
            </p>
          </>
        ) : (
          <>
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to Cloud Storage Pro!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your subscription is now active. Enjoy unlimited cloud storage!
            </p>
            <a
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg"
            >
              Go to Dashboard
            </a>
          </>
        )}
      </div>
    </div>
  );
};

export default SubscribeSuccess;
```

📁 **File: `src/pages/SubscribeCancel.js`**

```javascript
import React from 'react';
import { XCircle } from 'lucide-react';

const SubscribeCancel = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        <XCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Subscription Canceled
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          No worries! You can upgrade anytime from the Settings page.
        </p>
        <a
          href="/"
          className="inline-block bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-lg"
        >
          Back to App
        </a>
      </div>
    </div>
  );
};

export default SubscribeCancel;
```

### Step 2: Update Website App.js

Replace AISettings with Settings:

```javascript
// OLD:
import AISettings from './components/Settings/AISettings';

// NEW:
import Settings from './components/Settings/Settings';

// In render:
{activeTab === 'settings' && (
  <Settings
    darkMode={darkMode}
    onClose={() => setActiveTab('upload')}
    user={user}
    isAuthenticated={isAuthenticated}
    storageType={storageType}
    onStorageTypeChange={handleStorageTypeChange}
    onLogout={logout}
  />
)}
```

---

## 📱 ANDROID APP INTEGRATION (lyrical-toolkit-android-app repo)

### Step 1: Install Capacitor Browser Plugin

```bash
npm install @capacitor/browser
npx cap sync
```

### Step 2: Create Platform-Specific Subscription Handler

📁 **File: `src/utils/subscriptionHandler.js`**

```javascript
import { Browser } from '@capacitor/browser';

/**
 * Detect if running in Capacitor (mobile app)
 */
export const isCapacitorApp = () => {
  return typeof window !== 'undefined' && window.Capacitor !== undefined;
};

/**
 * Open subscription page
 * - Mobile: Opens in system browser (avoids app store fees)
 * - Web: Opens in new tab
 */
export const openSubscriptionPage = async (userId) => {
  const url = `https://lyrical-toolkit.netlify.app/subscribe?userId=${userId}`;
  
  if (isCapacitorApp()) {
    // Mobile: Open in external browser
    await Browser.open({
      url: url,
      presentationStyle: 'popover', // iOS shows as modal
      toolbarColor: '#1f2937' // Match app theme
    });
    
    // Listen for browser close
    const handle = await Browser.addListener('browserFinished', async () => {
      console.log('Browser closed, checking subscription status...');
      // Will be handled by parent component
      handle.remove(); // Clean up listener
    });
  } else {
    // Web: Open in new tab
    window.open(url, '_blank');
  }
};

/**
 * Open Stripe Customer Portal
 */
export const openCustomerPortal = async () => {
  try {
    const response = await fetch('/.netlify/functions/create-portal-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: window.currentUserId }) // Set this globally
    });
    
    if (!response.ok) throw new Error('Failed to create portal session');
    
    const { url } = await response.json();
    
    if (isCapacitorApp()) {
      await Browser.open({ url });
    } else {
      window.open(url, '_blank');
    }
  } catch (error) {
    console.error('Error opening portal:', error);
    throw error;
  }
};

export default {
  isCapacitorApp,
  openSubscriptionPage,
  openCustomerPortal
};
```

### Step 3: Update Android SubscriptionSettings Component

Modify the SubscriptionSettings to use the subscription handler:

```javascript
// At the top of SubscriptionSettings.js
import { openSubscriptionPage, openCustomerPortal } from '../../utils/subscriptionHandler';

// Replace handleUpgrade function:
const handleUpgrade = async () => {
  setProcessing(true);
  setError(null);

  try {
    // Open subscription page (handles web vs mobile)
    await openSubscriptionPage(user.id);
    
    // Check subscription after user returns
    setTimeout(() => {
      checkSubscription();
    }, 3000);
  } catch (err) {
    console.error('Error opening subscription:', err);
    setError(err.message);
  } finally {
    setProcessing(false);
  }
};

// Replace handleManageBilling function:
const handleManageBilling = async () => {
  setProcessing(true);
  setError(null);

  try {
    await openCustomerPortal();
  } catch (err) {
    console.error('Error opening portal:', err);
    setError(err.message);
  } finally {
    setProcessing(false);
  }
};
```

---

## 🔄 SHARED: Storage Settings Component

📁 **File: `src/components/Settings/StorageSettings.js`** (Both repos)

```javascript
import React from 'react';
import { Database, HardDrive, Cloud, ArrowRight, CheckCircle, Info } from 'lucide-react';

const StorageSettings = ({ darkMode, storageType, onStorageTypeChange, isAuthenticated }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Storage Mode
        </h3>

        <div className="space-y-4">
          {/* Local Storage */}
          <div
            onClick={() => onStorageTypeChange('local')}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
              storageType === 'local'
                ? darkMode
                  ? 'border-blue-600 bg-blue-900/20'
                  : 'border-blue-500 bg-blue-50'
                : darkMode
                  ? 'border-gray-600 bg-gray-700'
                  : 'border-gray-300 bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <HardDrive className={`w-6 h-6 ${
                  storageType === 'local'
                    ? darkMode ? 'text-blue-400' : 'text-blue-600'
                    : darkMode ? 'text-gray-400' : 'text-gray-600'
                }`} />
                <div>
                  <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Local Storage
                  </h4>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Device-only storage
                  </p>
                </div>
              </div>
              {storageType === 'local' && (
                <CheckCircle className={`w-5 h-5 ${
                  darkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
              )}
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className={`w-4 h-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                  Unlimited songs & audio
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className={`w-4 h-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                  Completely free
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className={`w-4 h-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                  Works offline
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-yellow-600 dark:text-yellow-400`}>⚠</span>
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Device-only (no backup)
                </span>
              </div>
            </div>
          </div>

          {/* Cloud Storage */}
          <div
            onClick={() => isAuthenticated ? onStorageTypeChange('database') : null}
            className={`p-4 rounded-lg border-2 ${
              !isAuthenticated ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            } transition-colors ${
              storageType === 'database'
                ? darkMode
                  ? 'border-blue-600 bg-blue-900/20'
                  : 'border-blue-500 bg-blue-50'
                : darkMode
                  ? 'border-gray-600 bg-gray-700'
                  : 'border-gray-300 bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Cloud className={`w-6 h-6 ${
                  storageType === 'database'
                    ? darkMode ? 'text-blue-400' : 'text-blue-600'
                    : darkMode ? 'text-gray-400' : 'text-gray-600'
                }`} />
                <div>
                  <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Cloud Storage
                  </h4>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Sync across devices
                  </p>
                </div>
              </div>
              {storageType === 'database' && (
                <CheckCircle className={`w-5 h-5 ${
                  darkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
              )}
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className={`w-4 h-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                  Access from any device
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className={`w-4 h-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                  Automatic backup
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className={`w-4 h-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                  5 songs free, unlimited with Pro
                </span>
              </div>
            </div>

            {!isAuthenticated && (
              <div className={`mt-3 p-2 rounded ${
                darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-50 text-yellow-800'
              }`}>
                <p className="text-xs">Login required for cloud storage</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className={`p-4 rounded-lg ${
        darkMode ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'
      }`}>
        <div className="flex gap-3">
          <Info className={`w-5 h-5 flex-shrink-0 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
            You can switch between storage modes anytime. Your songs won't be deleted when switching.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StorageSettings;
```

---

## 🔄 SHARED: AI Settings Section

📁 **File: `src/components/Settings/AISettingsSection.js`** (Both repos)

Simply copy the content from the existing `AISettings.js` but remove the `onClose` button since it's now part of the main Settings component.

---

## ✅ INTEGRATION CHECKLIST

### Both Repos:
- [ ] Settings component created
- [ ] AccountSettings component created  
- [ ] SubscriptionSettings component created
- [ ] StorageSettings component created
- [ ] AISettingsSection component created
- [ ] App.js updated to use Settings instead of AISettings
- [ ] Navigation updated ("AI Settings" → "Settings")

### Website Only:
- [ ] SubscribeSuccess page created
- [ ] SubscribeCancel page created
- [ ] Routes added for /subscribe/success and /subscribe/cancel

### Android App Only:
- [ ] @capacitor/browser installed
- [ ] subscriptionHandler.js created
- [ ] SubscriptionSettings uses subscriptionHandler
- [ ] Tested opening browser for subscription

---

## 📝 NOTES FOR CLAUDE CODE

**Key Differences:**
- Website: Direct Stripe integration (opens in same window/tab)
- Android: Opens external browser (avoids Google Play fees)
- Both use same Netlify functions backend

**Testing:**
- Website: Test subscription flow stays in app
- Android: Test browser opens externally
- Both: Verify subscription status syncs after purchase

---

## ➡️ NEXT PHASE

Once integration is complete, proceed to **PHASE 6: Testing & Deployment**
