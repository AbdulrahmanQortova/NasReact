// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7021/api';

const handleResponse = async (response) => {
  console.log(`📡 ${response.method || 'REQUEST'} ${response.url} - Status: ${response.status}`);
  
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      console.error('❌ Error response:', errorData);
      
      if (errorData.errors) {
        const validationErrors = Object.values(errorData.errors).flat();
        errorMessage = validationErrors.join(', ');
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {      
        errorMessage = errorData.error;
      } else if (errorData.title) {
        errorMessage = errorData.title;
      }
    } catch (e) {
      // Keep default message
    }
    throw new Error(errorMessage);
  }
  
  if (response.status === 204) {
    console.log('✅ No content response (204)');
    return { success: true };
  }
  
  const data = await response.json();
  console.log('✅ Response data:', data);
  return data;
};

const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

export const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};

export const getFormDataHeaders = () => {
  const token = getAuthToken();
  return {
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export const api = {
  get: async (endpoint, customHeaders = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: { ...getAuthHeaders(), ...customHeaders },
    });
    return handleResponse(response);
  },

  post: async (endpoint, data, isFormData = false, customHeaders = {}) => {
    const headers = isFormData ? getFormDataHeaders() : getAuthHeaders();
    const body = isFormData ? data : JSON.stringify(data);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { ...headers, ...customHeaders },
      body,
    });
    return handleResponse(response);
  },

  // ✅ Fix: Add isFormData parameter to put
  put: async (endpoint, data, isFormData = false, customHeaders = {}) => {
    const headers = isFormData ? getFormDataHeaders() : getAuthHeaders();
    const body = isFormData ? data : JSON.stringify(data);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: { ...headers, ...customHeaders },
      body,
    });
    return handleResponse(response);
  },

  delete: async (endpoint, customHeaders = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders(), ...customHeaders },
    });
    return handleResponse(response);
  },
};