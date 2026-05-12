import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ─── Request: Attach Access Token ─────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response: Auto-refresh on 401 ────────────────────────────────────────
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't retry auth endpoints
    if (originalRequest.url?.includes('/auth/')) {
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const { refreshToken, setAccessToken, clearAuth } = useAuthStore.getState();

    if (!refreshToken) {
      clearAuth();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      });

      const newToken = data.access_token;
      setAccessToken(newToken);
      // Update refresh token too (rotation)
      useAuthStore.setState({ refreshToken: data.refresh_token });

      processQueue(null, newToken);
      originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearAuth();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ─── API helpers ───────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  logout: (refresh_token) => api.post('/auth/logout', { refresh_token }),
  logoutAll: () => api.post('/auth/logout-all'),
};

export const societiesAPI = {
  list: () => api.get('/societies'),
  get: (id) => api.get(`/societies/${id}`),
  create: (data) => api.post('/societies', data),
  update: (id, data) => api.put(`/societies/${id}`, data),
  balance: (id) => api.get(`/societies/${id}/balance`),
};

export const headingsAPI = {
  list: (societyId, type) => api.get(`/societies/${societyId}/headings`, { params: { type } }),
  create: (data) => api.post('/headings', data),
  toggle: (id) => api.patch(`/headings/${id}/toggle`),
  delete: (id) => api.delete(`/headings/${id}`),
};

export const entriesAPI = {
  list: (societyId, params) => api.get(`/societies/${societyId}/entries`, { params }),
  get: (id) => api.get(`/entries/${id}`),
  create: (formData) => api.post('/entries', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/entries/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/entries/${id}`),
};

export const usersAPI = {
  list: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  toggleStatus: (id) => api.patch(`/users/${id}/status`),
  delete: (id) => api.delete(`/users/${id}`),
  updateAccess: (id, society_ids) => api.put(`/users/${id}/access`, { society_ids }),
};

export const reportsAPI = {
  summary: (societyId, from, to) => api.get(`/societies/${societyId}/reports/summary`, { params: { from, to } }),
  export: (societyId, from, to) => api.get(`/societies/${societyId}/reports/export`, { params: { from, to } }),
};
