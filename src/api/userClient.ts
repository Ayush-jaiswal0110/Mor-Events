// src/api/userClient.ts
// Consumer ("traveler") API client for the Plan My Trip feature.
//
// This deliberately mirrors `client.ts` (same base URL, same envelope,
// same Bearer-token approach) but keeps its own token under a different
// localStorage key so a traveler session can never collide with — or get
// silently logged out by — the existing admin session in `client.ts`.
import { API_BASE_URL } from "./client";

const USER_TOKEN_KEY = "morevents_user_token";

export const getUserToken = () => localStorage.getItem(USER_TOKEN_KEY);

export const setUserToken = (token: string) => {
  localStorage.setItem(USER_TOKEN_KEY, token);
};

export const clearUserToken = () => {
  localStorage.removeItem(USER_TOKEN_KEY);
};

export const userApiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers: HeadersInit = { ...options.headers };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const token = getUserToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      clearUserToken();
    }
    const error: any = new Error(data.message || "Request failed");
    error.status = response.status;
    error.errors = data.errors;
    throw error;
  }

  return data;
};

// Public (no-auth) fetch — used for the shared-trip link, which must work
// for a recipient who has never signed in.
export const publicApiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error: any = new Error(data.message || "Request failed");
    error.status = response.status;
    throw error;
  }
  return data;
};
