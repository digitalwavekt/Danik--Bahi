import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:4000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

// Attach access token
api.interceptors.request.use(
  async (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) config.headers['Authorization'] = `Bearer ${accessToken}`;
    return config;
  },
  (err) => Promise.reject(err)
);

// Auto-refresh on 401
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) return Promise.reject(error);
    if (original.url?.includes('/auth/')) {
      useAuthStore.getState().clearAuth();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
        .then((token) => { original.headers['Authorization'] = `Bearer ${token}`; return api(original); });
    }

    original._retry = true;
    isRefreshing = true;

    const { refreshToken, setAccessToken, updateRefreshToken, clearAuth } = useAuthStore.getState();
    if (!refreshToken) { clearAuth(); return Promise.reject(error); }

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
      await setAccessToken(data.access_token);
      await updateRefreshToken(data.refresh_token);
      processQueue(null, data.access_token);
      original.headers['Authorization'] = `Bearer ${data.access_token}`;
      return api(original);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      await clearAuth();
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export const authAPI = {
  login: (d) => api.post('/auth/login', d),
  logout: (rt) => api.post('/auth/logout', { refresh_token: rt }),
};

export const societiesAPI = {
  list: () => api.get('/societies'),
  balance: (id) => api.get(`/societies/${id}/balance`),
};

export const headingsAPI = {
  list: (societyId) => api.get(`/societies/${societyId}/headings`),
};

export const entriesAPI = {
  list: (societyId, params) => api.get(`/societies/${societyId}/entries`, { params }),
  create: (formData) => api.post('/entries', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/entries/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/entries/${id}`),
};

export const reportsAPI = {
  summary: (societyId, from, to) => api.get(`/societies/${societyId}/reports/summary`, { params: { from, to } }),
};
