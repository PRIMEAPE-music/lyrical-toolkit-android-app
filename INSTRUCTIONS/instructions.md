I'll help you integrate the Supabase implementation from your website into your Android app. Let me first explore both versions to understand the current state and identify what needs to be transferred.Now let me check the Android app structure to see what's currently there:Great! I can see the Android app already has the Netlify functions directory with authentication files and even has `supabase-client.js`. Let me check what's in those files to understand the current state:Perfect! I can see that the Android app already has the Supabase client files. Now let me check what the differences are between the website and app versions to see if anything is missing or needs to be synced:Great! Now let me check if there are any authentication-related frontend components that need updating:Let me check the API config to understand how the app is currently set up:Now let me check the website's authService to compare:Perfect! Now I understand the situation. The Android app currently has:
1. ✅ Supabase integration files (`supabase-client.js` and `shared-storage.js`)
2. ❌ Frontend authService still pointing to Express server (`http://192.168.1.32:5001/api`)
3. ❌ Express server with local authentication (should be disabled)

I need to:
1. Update the Android app's `authService.js` to use Netlify functions like the website
2. Update the API config to support Netlify functions
3. Verify all authentication functions are properly configured

Let me create the updates:

## Summary

I'll update your Android app to use the Supabase integration through Netlify functions (same as your website). The app currently points to a local Express server, but we'll switch it to use Netlify functions for authentication.

---

📁 **File: C:\Users\justin\Desktop\IT Software\Custom Programs\lyrical-toolkit\lyrical-toolkit-android-app\src\services\authService.js**

🔄 **COMPLETE REWRITE:**

```javascript
// Enhanced authentication service with full feature support
// Supports access tokens, refresh tokens, email verification, and password reset

// Always use Netlify functions for authentication (unified system)
const AUTH_API = '/.netlify/functions';

// Token management
export const getAccessToken = () => {
  return localStorage.getItem('accessToken');
};

export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('currentUser');
  return userStr ? JSON.parse(userStr) : null;
};

const setTokens = (accessToken, refreshToken) => {
  if (accessToken) {
    localStorage.setItem('accessToken', accessToken);
  }
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
};

const setCurrentUser = (user) => {
  localStorage.setItem('currentUser', JSON.stringify(user));
};

// Clear all stored auth data
export const logout = async () => {
  const refreshToken = getRefreshToken();
  
  // Notify server about logout
  if (refreshToken) {
    try {
      await fetch(`${AUTH_API}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
    } catch (error) {
      console.warn('Failed to notify server about logout:', error);
    }
  }
  
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('currentUser');
};

// Login with username/email and password
export const login = async (login, password) => {
  const response = await fetch(`${AUTH_API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login, password })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  const data = await response.json();
  setTokens(data.tokens.accessToken, data.tokens.refreshToken);
  setCurrentUser(data.user);
  return data;
};

// Sign up with username, email, and password
export const signup = async (username, email, password) => {
  const response = await fetch(`${AUTH_API}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Signup failed');
  }

  const data = await response.json();
  setTokens(data.tokens.accessToken, data.tokens.refreshToken);
  setCurrentUser(data.user);
  return data;
};

// Refresh the current token pair
export const refreshTokens = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token available');

  const response = await fetch(`${AUTH_API}/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  if (!response.ok) {
    // If refresh fails, clear stored tokens
    await logout();
    throw new Error('Token refresh failed');
  }

  const data = await response.json();
  setTokens(data.tokens.accessToken, data.tokens.refreshToken);
  return data.tokens;
};

// Get user profile
export const getUserProfile = async () => {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error('No access token available');

  const response = await fetch(`${AUTH_API}/profile`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Try to refresh token
      try {
        await refreshTokens();
        return getUserProfile(); // Retry with new token
      } catch (refreshError) {
        throw new Error('Authentication expired');
      }
    }
    throw new Error('Failed to get user profile');
  }

  const data = await response.json();
  setCurrentUser(data.user);
  return data.user;
};

// Verify email address
export const verifyEmail = async (token) => {
  const response = await fetch(`${AUTH_API}/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Email verification failed');
  }

  return await response.json();
};

// Request password reset
export const requestPasswordReset = async (email) => {
  const response = await fetch(`${AUTH_API}/request-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Password reset request failed');
  }

  return await response.json();
};

// Reset password with token
export const resetPassword = async (token, newPassword) => {
  const response = await fetch(`${AUTH_API}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Password reset failed');
  }

  return await response.json();
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getAccessToken() && !!getCurrentUser();
};

// Check if token needs refresh (within 2 minutes of expiration)
const shouldRefreshToken = () => {
  const token = getAccessToken();
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000;
    const timeUntilExpiry = payload.exp - now;
    
    // Refresh if token expires within 2 minutes (120 seconds)
    return timeUntilExpiry < 120;
  } catch (error) {
    return true; // If we can't parse, assume we need refresh
  }
};

// Get authorization header for API requests with automatic refresh
export const getAuthHeader = async () => {
  try {
    // Check if we need to refresh the token
    if (shouldRefreshToken()) {
      console.log('🔄 Auto-refreshing token before request...');
      await refreshTokens();
    }
    
    const token = getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (error) {
    console.error('Failed to refresh token:', error);
    const token = getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
};

const authService = {
  login,
  signup,
  logout,
  refreshTokens,
  getUserProfile,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  isAuthenticated,
  getAccessToken,
  getRefreshToken,
  getCurrentUser,
  getAuthHeader
};

export default authService;
```

---

📁 **File: C:\Users\justin\Desktop\IT Software\Custom Programs\lyrical-toolkit\lyrical-toolkit-android-app\src\config\api.js**

🔍 **FIND:**
```javascript
// API Base URL - points to your Express.js server
// Using local IP address so Android devices on the same network can connect
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.1.32:5001/api';
```

✏️ **REPLACE WITH:**
```javascript
// API Base URL - Now using Netlify functions for unified authentication
// For auth: /.netlify/functions
// For other API calls: Keep using local server if needed
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.1.32:5001/api';
export const AUTH_BASE_URL = '/.netlify/functions';
```

---

Now let me check if there are any other files that reference the old auth endpoints:Good! The `useAuth` hook just uses the authService, so it doesn't need changes. Now let me create a comprehensive guide document for you:

📁 **File: C:\Users\justin\Desktop\IT Software\Custom Programs\lyrical-toolkit\lyrical-toolkit-android-app\SUPABASE_INTEGRATION_STATUS.md**

🔄 **COMPLETE REWRITE:**

```markdown
# Supabase Integration Status - Android App

## ✅ Integration Complete

Your Android app has been updated to use the same Supabase authentication system as your website through Netlify functions.

---

## 📋 What Changed

### 1. **Authentication Service Updated** ✅
- **File**: `src/services/authService.js`
- **Change**: Now points to `/.netlify/functions` instead of local Express server
- **Impact**: All authentication (signup, login, logout, etc.) now uses Supabase via Netlify functions

### 2. **API Configuration Updated** ✅
- **File**: `src/config/api.js`
- **Change**: Added `AUTH_BASE_URL` constant for Netlify functions
- **Impact**: Clear separation between auth endpoints and other API calls

### 3. **Backend Files Already Present** ✅
Your app already has:
- `netlify/functions/supabase-client.js` - Supabase connection manager
- `netlify/functions/shared-storage.js` - Authentication logic with Supabase
- All auth endpoint functions: `signup.js`, `login.js`, `refresh.js`, etc.

---

## 🗄️ Required Supabase Setup

You need to create the users table in your Supabase project (if not already done):

```sql
-- Create users table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    failed_login_attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access
CREATE POLICY "Enable read access for service role" ON users
    FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Enable insert access for service role" ON users
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Enable update access for service role" ON users
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');
```

---

## 🔑 Environment Variables

Make sure these are set in your deployment environment (Netlify):

### **Required for Authentication:**
```bash
JWT_SECRET=your-jwt-secret-key-here
REFRESH_SECRET=your-refresh-secret-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...your-service-role-key...
```

### **Optional (for development):**
```bash
NODE_ENV=development
```

---

## 🚀 How Authentication Works Now

### **Frontend (React App)**
1. User interacts with `AuthModal.js` component
2. Component uses `useAuth()` hook
3. Hook calls `authService.js` methods
4. authService makes requests to `/.netlify/functions/[endpoint]`

### **Backend (Netlify Functions)**
1. Request hits Netlify function (e.g., `signup.js`, `login.js`)
2. Function uses `shared-storage.js` for auth logic
3. shared-storage uses `supabase-client.js` to interact with database
4. Supabase database stores/retrieves user data
5. JWT tokens generated and returned to frontend

### **Flow Diagram**
```
User → AuthModal → useAuth Hook → authService
                                       ↓
                          /.netlify/functions/[endpoint]
                                       ↓
                              shared-storage.js
                                       ↓
                              supabase-client.js
                                       ↓
                            Supabase PostgreSQL DB
```

---

## 🧪 Testing the Integration

### 1. **Test Health Endpoint**
```bash
curl https://your-app-domain.netlify.app/.netlify/functions/health
```

Expected response:
```json
{
  "status": "healthy",
  "checks": {
    "environment": { "status": "pass" },
    "database": { "status": "pass", "provider": "Supabase" },
    "supabaseConfig": { "status": "pass" }
  }
}
```

### 2. **Test User Signup**
```bash
curl -X POST https://your-app-domain.netlify.app/.netlify/functions/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```

### 3. **Test User Login**
```bash
curl -X POST https://your-app-domain.netlify.app/.netlify/functions/login \
  -H "Content-Type: application/json" \
  -d '{"login":"testuser","password":"password123"}'
```

---

## 📱 Development vs Production

### **Development Mode (Local)**
- Run `npm start` for React app
- Authentication calls will go to `/.netlify/functions` (proxied by Netlify CLI if using `netlify dev`)
- Or deploy to Netlify for testing

### **Production Mode (Deployed)**
- Deploy to Netlify: `git push` or `netlify deploy --prod`
- Authentication automatically uses deployed Netlify functions
- Supabase credentials must be set in Netlify environment variables

---

## 🔧 Troubleshooting

### **Issue: 502 Bad Gateway on auth endpoints**
**Solution**: Check that environment variables are set in Netlify:
- Go to Netlify Dashboard → Site Settings → Environment Variables
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are present

### **Issue: "User already exists" error**
**Solution**: Check Supabase dashboard to verify user data:
- Go to Supabase → Table Editor → users
- Delete test users or use different credentials

### **Issue: Token expired errors**
**Solution**: The app automatically refreshes tokens. If issues persist:
1. Clear browser localStorage
2. Log out and log back in
3. Check JWT_SECRET hasn't changed

### **Issue: Can't connect to Supabase**
**Solution**: Verify Supabase credentials:
```bash
# Test direct connection
curl -X GET "https://your-project.supabase.co/rest/v1/users?select=count" \
  -H "apikey: your-service-key" \
  -H "Authorization: Bearer your-service-key"
```

---

## 🎯 Next Steps

1. **Deploy to Netlify**: Push your changes to trigger deployment
2. **Set Environment Variables**: Configure all required environment variables in Netlify
3. **Test Authentication**: Try signup/login through the app
4. **Monitor Logs**: Check Netlify function logs for any errors
5. **Optional**: Add song storage to Supabase (currently songs use local Express server)

---

## 📝 Notes

- **Express Server**: The local Express server (`server/index.js`) still runs for song CRUD operations
- **Authentication**: Now exclusively handled by Netlify functions + Supabase
- **User Data**: Stored securely in Supabase PostgreSQL database
- **Tokens**: JWT tokens generated with configurable secrets
- **Security**: Row Level Security (RLS) enabled on Supabase tables

---

## ✅ Migration Benefits

- ✅ **Unified System**: Website and app use same authentication
- ✅ **Reliable Database**: PostgreSQL instead of in-memory storage
- ✅ **Scalable**: Handles thousands of users
- ✅ **Secure**: Service-role authentication, RLS policies
- ✅ **Cloud-Based**: No local server needed for auth
- ✅ **Automatic Backups**: Supabase handles database backups
```

---

## Summary of Changes

**Modified: 2 files**
1. ✅ `src/services/authService.js` - Updated to use Netlify functions
2. ✅ `src/config/api.js` - Added AUTH_BASE_URL constant

**Created: 1 file**
1. ✅ `SUPABASE_INTEGRATION_STATUS.md` - Comprehensive integration guide

**Already Present (No changes needed):**
- ✅ All Netlify function files in `netlify/functions/`
- ✅ Supabase client configuration
- ✅ Authentication logic with Supabase integration

Your Android app now uses the same Supabase authentication as your website! The main difference is that song storage still uses the local Express server, but authentication is fully unified through Netlify functions and Supabase.