// Enhanced authentication service with full feature support
// Supports access tokens, refresh tokens, email verification, and password reset

import { httpPost, httpGet } from '../utils/http';

// Get Netlify URL from environment variable or use production default
const NETLIFY_URL = process.env.REACT_APP_NETLIFY_URL || 'https://lyrical-toolkit.netlify.app';

// Detect environment and use appropriate auth endpoint
const getAuthAPI = () => {
  // If we're on a Netlify domain, use relative path
  if (typeof window !== 'undefined' &&
      (window.location.hostname.includes('netlify.app') ||
       window.location.hostname.includes('.netlify.com'))) {
    return '/.netlify/functions';
  }

  // For Android/mobile app, use full Netlify URL
  return `${NETLIFY_URL}/.netlify/functions`;
};

const AUTH_API = getAuthAPI();

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
      await httpPost(`${AUTH_API}/logout`, { refreshToken });
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
  const response = await httpPost(`${AUTH_API}/login`, { login, password });

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
  const response = await httpPost(`${AUTH_API}/signup`, { username, email, password });

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

  const response = await httpPost(`${AUTH_API}/refresh`, { refreshToken });

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

  const response = await httpGet(`${AUTH_API}/profile`, { Authorization: `Bearer ${accessToken}` });

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
  const response = await httpPost(`${AUTH_API}/verify-email`, { token });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Email verification failed');
  }

  return await response.json();
};

// Request password reset
export const requestPasswordReset = async (email) => {
  const response = await httpPost(`${AUTH_API}/request-reset`, { email });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Password reset request failed');
  }

  return await response.json();
};

// Reset password with token
export const resetPassword = async (token, newPassword) => {
  const response = await httpPost(`${AUTH_API}/reset-password`, { token, newPassword });

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
