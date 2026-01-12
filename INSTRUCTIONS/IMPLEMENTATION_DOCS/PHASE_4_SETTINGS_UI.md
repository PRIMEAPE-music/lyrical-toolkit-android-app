# PHASE 4: SETTINGS UI COMPONENTS

**Goal:** Transform AISettings into a comprehensive Settings page with subscription management

**Estimated Time:** 2-3 hours

---

## 📋 OVERVIEW

This phase creates the new Settings UI that replaces the current AISettings component. We'll create:
- Main Settings page with tabbed navigation
- Account settings section
- Subscription management section
- Storage settings section  
- AI settings section (moved from AISettings)

**Location:** Create in `src/components/Settings/` in **BOTH REPOS**

---

## 🏗️ COMPONENT STRUCTURE

```
src/components/Settings/
├── Settings.js (main container)
├── AccountSettings.js
├── SubscriptionSettings.js
├── StorageSettings.js
└── AISettingsSection.js (refactored from AISettings.js)
```

---

## 1️⃣ MAIN SETTINGS COMPONENT

📁 **File: `src/components/Settings/Settings.js`**

**Purpose:** Container with tabbed navigation

```javascript
import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Key,
  CreditCard,
  Database,
  X
} from 'lucide-react';
import AccountSettings from './AccountSettings';
import AISettingsSection from './AISettingsSection';
import SubscriptionSettings from './SubscriptionSettings';
import StorageSettings from './StorageSettings';

const Settings = ({
  darkMode,
  onClose,
  user,
  isAuthenticated,
  storageType,
  onStorageTypeChange,
  onLogout
}) => {
  const [activeSection, setActiveSection] = useState('account');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const sections = [
    { id: 'account', icon: User, label: 'Account', requiresAuth: true },
    { id: 'subscription', icon: CreditCard, label: 'Subscription', requiresAuth: true },
    { id: 'storage', icon: Database, label: 'Storage', requiresAuth: false },
    { id: 'ai', icon: Key, label: 'AI Settings', requiresAuth: false }
  ];

  // Filter sections based on auth status
  const visibleSections = sections.filter(s => !s.requiresAuth || isAuthenticated);

  return (
    <div className={`h-full flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${
        darkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-2">
          <SettingsIcon className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Settings
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className={`
          ${isMobile ? 'hidden' : 'w-48'} 
          ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}
          border-r
        `}>
          <div className="p-2 space-y-1">
            {visibleSections.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left ${
                  activeSection === id
                    ? darkMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : darkMode
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Tabs */}
        {isMobile && (
          <div className={`flex border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            {visibleSections.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 ${
                  activeSection === id
                    ? darkMode
                      ? 'border-b-2 border-blue-500 text-blue-400'
                      : 'border-b-2 border-blue-500 text-blue-600'
                    : darkMode
                      ? 'text-gray-400'
                      : 'text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {activeSection === 'account' && (
              <AccountSettings darkMode={darkMode} user={user} onLogout={onLogout} />
            )}
            {activeSection === 'subscription' && (
              <SubscriptionSettings darkMode={darkMode} user={user} />
            )}
            {activeSection === 'storage' && (
              <StorageSettings
                darkMode={darkMode}
                storageType={storageType}
                onStorageTypeChange={onStorageTypeChange}
                isAuthenticated={isAuthenticated}
              />
            )}
            {activeSection === 'ai' && (
              <AISettingsSection darkMode={darkMode} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
```

---

## 2️⃣ ACCOUNT SETTINGS SECTION

📁 **File: `src/components/Settings/AccountSettings.js`**

```javascript
import React from 'react';
import { User, Mail, Calendar, LogOut } from 'lucide-react';

const AccountSettings = ({ darkMode, user, onLogout }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Account Info */}
      <div>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Account Information
        </h3>

        <div className="space-y-4">
          {/* Username */}
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-3 mb-2">
              <User className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Username
              </span>
            </div>
            <p className={`text-base font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {user?.username || 'N/A'}
            </p>
          </div>

          {/* Email */}
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-3 mb-2">
              <Mail className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Email
              </span>
            </div>
            <p className={`text-base font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {user?.email || 'N/A'}
            </p>
          </div>

          {/* Member Since */}
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-3 mb-2">
              <Calendar className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Member Since
              </span>
            </div>
            <p className={`text-base font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <div>
        <button
          onClick={onLogout}
          className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 ${
            darkMode
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default AccountSettings;
```

---

## 3️⃣ SUBSCRIPTION SETTINGS SECTION

📁 **File: `src/components/Settings/SubscriptionSettings.js`**

**This is the key component for managing subscriptions!**

```javascript
import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Calendar,
  DollarSign,
  Crown
} from 'lucide-react';

const SubscriptionSettings = ({ darkMode, user }) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkSubscription();
  }, [user]);

  const checkSubscription = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/.netlify/functions/check-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      if (!response.ok) throw new Error('Failed to check subscription');

      const data = await response.json();
      setSubscriptionStatus(data);
    } catch (err) {
      console.error('Error checking subscription:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      if (!response.ok) throw new Error('Failed to create checkout session');

      const { url } = await response.json();
      
      // Open Stripe Checkout in new window
      window.open(url, '_blank');
      
      // Poll for subscription status after 5 seconds
      setTimeout(() => {
        checkSubscription();
      }, 5000);
    } catch (err) {
      console.error('Error creating checkout:', err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleManageBilling = async () => {
    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/.netlify/functions/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      if (!response.ok) throw new Error('Failed to create portal session');

      const { url } = await response.json();
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error opening portal:', err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className={`w-8 h-8 animate-spin ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
      </div>
    );
  }

  const isSubscribed = subscriptionStatus?.isSubscribed;
  const subscription = subscriptionStatus?.subscription;

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Current Plan
        </h3>

        <div className={`p-6 rounded-lg border-2 ${
          isSubscribed
            ? darkMode
              ? 'bg-blue-900/20 border-blue-600'
              : 'bg-blue-50 border-blue-400'
            : darkMode
              ? 'bg-gray-700 border-gray-600'
              : 'bg-gray-50 border-gray-300'
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {isSubscribed ? (
                <Crown className={`w-6 h-6 ${darkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
              ) : (
                <CreditCard className={`w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              )}
              <div>
                <h4 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {isSubscribed ? 'Cloud Storage Pro' : 'Free Plan'}
                </h4>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {isSubscribed ? '$3.00/month' : '$0.00/month'}
                </p>
              </div>
            </div>
            
            {isSubscribed && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                darkMode
                  ? 'bg-green-900/30 text-green-400 border border-green-700'
                  : 'bg-green-100 text-green-700 border border-green-300'
              }`}>
                Active
              </span>
            )}
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${
                isSubscribed
                  ? darkMode ? 'text-green-400' : 'text-green-600'
                  : darkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {isSubscribed ? 'Unlimited' : '5'} songs with audio in cloud storage
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${
                isSubscribed
                  ? darkMode ? 'text-green-400' : 'text-green-600'
                  : darkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {isSubscribed ? 'Sync' : 'No sync'} across all devices
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${
                isSubscribed
                  ? darkMode ? 'text-green-400' : 'text-green-600'
                  : darkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {isSubscribed ? 'Automatic' : 'No'} backup
              </span>
            </div>
          </div>

          {isSubscribed && subscription && (
            <div className={`pt-4 border-t ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                  {subscription.cancel_at_period_end
                    ? `Cancels on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                    : `Renews on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                  }
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          darkMode ? 'bg-red-900/30 border border-red-700' : 'bg-red-50 border border-red-200'
        }`}>
          <AlertCircle className={`w-5 h-5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
          <p className={`text-sm ${darkMode ? 'text-red-200' : 'text-red-800'}`}>{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {!isSubscribed ? (
          <button
            onClick={handleUpgrade}
            disabled={processing}
            className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 ${
              processing
                ? darkMode
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : darkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Crown className="w-5 h-5" />
                Upgrade to Pro - $3/month
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleManageBilling}
            disabled={processing}
            className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            }`}
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ExternalLink className="w-5 h-5" />
                Manage Billing
              </>
            )}
          </button>
        )}
      </div>

      {/* Info Box */}
      <div className={`p-4 rounded-lg ${
        darkMode ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'
      }`}>
        <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
          💡 {isSubscribed
            ? 'You can cancel anytime. Your subscription will remain active until the end of your billing period.'
            : 'Upgrade to unlock unlimited cloud storage and sync across all your devices!'
          }
        </p>
      </div>
    </div>
  );
};

export default SubscriptionSettings;
```

---

## 📝 NOTES FOR CLAUDE CODE

**Key Integration Points:**
1. Settings replaces AISettings in App.js
2. Update tab/navigation labels from "AI Settings" to "Settings"
3. Pass all required props (user, isAuthenticated, etc.)
4. The subscription component opens Stripe in a new window (avoids app store fees)

**Next Steps:**
- StorageSettings component (shows local vs cloud options)
- AISettingsSection component (moves existing AI settings here)
- Update App.js to use new Settings component
- Test subscription flow end-to-end

---

## ➡️ NEXT PHASE

Once UI components are created, proceed to **PHASE 5: Integration & Testing**
