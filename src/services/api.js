
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7021/api';


// src/services/api.js - تحديث handleResponse

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      console.error('Error response:', errorData);
      
      // Handle validation errors from ASP.NET
      if (errorData.errors) {
        const validationErrors = Object.values(errorData.errors).flat();
        errorMessage = validationErrors.join(', ');
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.title) {
        errorMessage = errorData.title;
      }
    } catch (e) {
      // Keep default message
    }
    throw new Error(errorMessage);
  }
  
  if (response.status === 204) {
    return null;
  }
  
  return response.json();
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

  put: async (endpoint, data, customHeaders = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), ...customHeaders },
      body: JSON.stringify(data),
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