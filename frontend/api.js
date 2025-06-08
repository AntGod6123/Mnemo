export const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
export const apiFetch = (path, options) => fetch(`${API_BASE}${path}`, options);
