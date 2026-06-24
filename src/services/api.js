// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7021/api';

let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
};

const getAuthToken = () => localStorage.getItem('auth_token');
const getRefreshToken = () => localStorage.getItem('refresh_token');

export const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};

export const getFormDataHeaders = () => {
  const token = getAuthToken();
  return { 'Authorization': token ? `Bearer ${token}` : '' };
};

const attemptRefresh = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');

  const userStr = localStorage.getItem('user_data');
  const user = userStr ? JSON.parse(userStr) : null;
  if (!user?.id) throw new Error('No user id');

  const response = await fetch(`${API_BASE_URL}/Auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken()}` },
    body: JSON.stringify(refreshToken),
  });

  if (!response.ok) throw new Error('Refresh failed');

  const data = await response.json();
  if (data.token) {
    localStorage.setItem('auth_token', data.token);
    const expiry = new Date().getTime() + (24 * 60 * 60 * 1000);
    localStorage.setItem('token_expiry', expiry.toString());
  }
  if (data.refreshToken) {
    localStorage.setItem('refresh_token', data.refreshToken);
  }
  return data.token;
};

const handleResponse = async (response, retryFn) => {
  if (response.status === 401) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then(token => retryFn(token));
    }

    isRefreshing = true;
    try {
      const newToken = await attemptRefresh();
      processQueue(null, newToken);
      return retryFn(newToken);
    } catch (err) {
      processQueue(err);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('token_expiry');
      localStorage.removeItem('refresh_token');
      window.dispatchEvent(new Event('auth:logout'));
      throw new Error('Session expired. Please login again.');
    } finally {
      isRefreshing = false;
    }
  }

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.errors) {
        errorMessage = Object.values(errorData.errors).flat().join(', ');
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData.title) {
        errorMessage = errorData.title;
      }
    } catch {}
    throw new Error(errorMessage);
  }

  if (response.status === 204) return { success: true };
  return response.json();
};

const buildRequest = (method, endpoint, data, isFormData, token) => {
  const headers = isFormData
    ? { 'Authorization': token ? `Bearer ${token}` : (getAuthToken() ? `Bearer ${getAuthToken()}` : '') }
    : { 'Authorization': token ? `Bearer ${token}` : (getAuthToken() ? `Bearer ${getAuthToken()}` : ''), 'Content-Type': 'application/json' };

  return fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: data !== undefined ? (isFormData ? data : JSON.stringify(data)) : undefined,
  });
};

export const api = {
  get: async (endpoint) => {
    const response = await buildRequest('GET', endpoint, undefined, false, null);
    return handleResponse(response, (token) =>
      buildRequest('GET', endpoint, undefined, false, token).then(r => r.json())
    );
  },

  post: async (endpoint, data, isFormData = false) => {
    const response = await buildRequest('POST', endpoint, data, isFormData, null);
    return handleResponse(response, (token) =>
      buildRequest('POST', endpoint, data, isFormData, token).then(r => r.json())
    );
  },

  put: async (endpoint, data, isFormData = false) => {
    const response = await buildRequest('PUT', endpoint, data, isFormData, null);
    return handleResponse(response, (token) =>
      buildRequest('PUT', endpoint, data, isFormData, token).then(r => r.json())
    );
  },

  delete: async (endpoint) => {
    const response = await buildRequest('DELETE', endpoint, undefined, false, null);
    return handleResponse(response, (token) =>
      buildRequest('DELETE', endpoint, undefined, false, token).then(r => r.json())
    );
  },
};