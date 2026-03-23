// src/api/client.ts

const API_BASE_URL = 'https://mor-events-backend.onrender.com/api'; // Or 8080 depending on what port Django runs on, we'll use 8000 for standard runserver unless port was specified

export const getAuthToken = () => {
  return localStorage.getItem('morevents_token');
};

export const setAuthToken = (token: string) => {
  localStorage.setItem('morevents_token', token);
};

export const clearAuthToken = () => {
  localStorage.removeItem('morevents_token');
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: HeadersInit = {
    ...options.headers,
  };

  // Conditionally add Content-Type if we're not sending FormData (from file uploads)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API Request Failed');
  }

  return data;
};
