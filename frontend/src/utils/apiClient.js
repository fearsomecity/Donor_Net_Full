/**
 * Fetch wrapper that:
 * 1. Prepends the API base URL
 * 2. Auto-injects the JWT token from localStorage (used by Zustand authStore)
 *    so callers don't need to manually pass Authorization headers
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const fetchAPI = async (endpoint, options = {}) => {
  // Read token directly from localStorage (set by authStore on login)
  const token = localStorage.getItem('token');

  const headers = {
    ...(options.headers || {}),
  };

  // Auto-inject token if not already provided and token exists
  if (token && !headers['Authorization'] && !headers['authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  return fetch(url, { ...options, headers });
};
