// src/api/client.ts
export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:8000/api";
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
    if (response.status === 401) {
      clearAuthToken();

      // Auto-redirect to login if not already there
      if (!window.location.pathname.includes('/auth/login') && window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin';
      }
    }
    throw new Error(data.message || 'API Request Failed');
  }

  return data;
};
