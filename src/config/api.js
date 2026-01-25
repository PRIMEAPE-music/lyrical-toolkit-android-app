/**
 * API Configuration
 * Central configuration for API calls via Netlify functions
 */

// Get Netlify URL from environment variable
const NETLIFY_URL = process.env.REACT_APP_NETLIFY_URL || 'https://lyrical-toolkit.netlify.app';

// Detect if we're on Netlify domain, custom domain, or mobile app
const getBaseURL = () => {
  // If we're on a web browser (Netlify domain or custom domain), use relative path
  if (typeof window !== 'undefined' &&
      (window.location.hostname.includes('netlify.app') ||
       window.location.hostname.includes('.netlify.com') ||
       window.location.hostname.includes('lyrical-toolkit.com'))) {
    return '/.netlify/functions';
  }

  // For Android/mobile app, use full Netlify URL
  return `${NETLIFY_URL}/.netlify/functions`;
};

export const API_BASE_URL = getBaseURL();
export const AUTH_BASE_URL = API_BASE_URL; // Same for auth

/**
 * Get authentication headers with access token
 * Automatically refreshes token if needed
 */
export const getAuthHeaders = () => {
  const accessToken = localStorage.getItem('accessToken');

  const headers = {
    'Content-Type': 'application/json'
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  return headers;
};

/**
 * Check if token is expired or about to expire (within 2 minutes)
 */
const isTokenExpiring = () => {
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken) return true;

  try {
    // Decode JWT (simple base64 decode of payload)
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const twoMinutes = 2 * 60 * 1000;

    // Return true if token expires within 2 minutes
    return (expirationTime - currentTime) < twoMinutes;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

/**
 * Refresh access token using refresh token
 */
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();

    // Update tokens in localStorage
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    return data.accessToken;
  } catch (error) {
    // Clear tokens on refresh failure
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    throw error;
  }
};

/**
 * Make an authenticated API request with automatic token refresh
 */
export const apiRequest = async (endpoint, options = {}) => {
  // Check if token needs refresh (unless it's a login/signup request)
  const isAuthRequest = endpoint.includes('/auth/login') ||
                        endpoint.includes('/auth/signup') ||
                        endpoint.includes('/auth/refresh');

  if (!isAuthRequest && isTokenExpiring()) {
    try {
      await refreshAccessToken();
    } catch (error) {
      // If refresh fails, redirect to login
      window.location.href = '/login';
      throw error;
    }
  }

  // Prepare request options
  const requestOptions = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers
    }
  };

  // Make the request
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, requestOptions);

  // Handle authentication errors
  if (response.status === 401) {
    // Try to refresh token and retry once
    if (!isAuthRequest) {
      try {
        await refreshAccessToken();

        // Retry the original request with new token
        requestOptions.headers = {
          ...getAuthHeaders(),
          ...options.headers
        };

        const retryResponse = await fetch(url, requestOptions);
        if (retryResponse.ok) {
          return retryResponse;
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
    }

    // If still unauthorized, redirect to login
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';

    throw new Error('Unauthorized');
  }

  return response;
};

/**
 * Helper for GET requests
 */
export const apiGet = async (endpoint) => {
  const response = await apiRequest(endpoint, { method: 'GET' });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
};

/**
 * Helper for POST requests
 */
export const apiPost = async (endpoint, data) => {
  const response = await apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
};

/**
 * Helper for PUT requests
 */
export const apiPut = async (endpoint, data) => {
  const response = await apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
};

/**
 * Helper for DELETE requests
 */
export const apiDelete = async (endpoint) => {
  const response = await apiRequest(endpoint, { method: 'DELETE' });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
};

/**
 * Helper for multipart/form-data requests (file uploads)
 */
export const apiUpload = async (endpoint, formData) => {
  const accessToken = localStorage.getItem('accessToken');

  const headers = {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Don't set Content-Type for FormData - browser will set it with boundary

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Upload failed');
  }

  return response.json();
};

const api = {
  API_BASE_URL,
  getAuthHeaders,
  apiRequest,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  apiUpload
};

export default api;
