/**
 * HTTP Helper for Capacitor
 * Uses CapacitorHttp for native apps and fetch for web
 */

import { CapacitorHttp } from '@capacitor/core';

// Detect if we're running in a native app
const isNative = () => {
  return window.Capacitor && window.Capacitor.isNativePlatform();
};

/**
 * Make an HTTP request
 * @param {string} url - The URL to request
 * @param {object} options - Request options (method, headers, body, etc.)
 */
export const httpRequest = async (url, options = {}) => {
  const {
    method = 'GET',
    headers = {},
    body = null,
  } = options;

  if (isNative()) {
    // Use CapacitorHttp for native apps (better CORS handling)
    const request = {
      url,
      method,
      headers,
    };

    // Add data if present
    if (body) {
      // CapacitorHttp expects data as an object for JSON content-type
      // If body is already stringified JSON, parse it back
      if (typeof body === 'string' && headers['Content-Type']?.includes('application/json')) {
        try {
          request.data = JSON.parse(body);
        } catch (e) {
          request.data = body;
        }
      } else {
        request.data = body;
      }
    }

    try {
      const response = await CapacitorHttp.request(request);

      // Convert CapacitorHttp response to fetch-like response
      return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        statusText: response.status.toString(),
        headers: response.headers,
        json: async () => response.data,
        text: async () => typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
      };
    } catch (error) {
      console.error('CapacitorHttp request failed:', error);
      throw error;
    }
  } else {
    // Use fetch for web
    return fetch(url, options);
  }
};

// Convenience methods
export const httpGet = (url, headers = {}) => {
  return httpRequest(url, { method: 'GET', headers });
};

export const httpPost = (url, body, headers = {}) => {
  return httpRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
};

export const httpPut = (url, body, headers = {}) => {
  return httpRequest(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
};

export const httpDelete = (url, headers = {}) => {
  return httpRequest(url, { method: 'DELETE', headers });
};

export default {
  request: httpRequest,
  get: httpGet,
  post: httpPost,
  put: httpPut,
  delete: httpDelete,
};
