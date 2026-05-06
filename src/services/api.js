import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = (() => {
  const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const normalizedUrl = rawUrl.replace(/\/+$/, '');
  return normalizedUrl.endsWith('/api') ? normalizedUrl : `${normalizedUrl}/api`;
})();
const TOKEN_KEY = 'ayursutra_access_token';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export function setAccessToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
  }
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('token') || sessionStorage.getItem('token');
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = null;

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    if (
      status === 401
      && original
      && !original._retry
      && !original.url?.includes('/auth/login')
      && !original.url?.includes('/auth/logout')
      && !original.url?.includes('/auth/refresh')
    ) {
      original._retry = true;
      refreshing ||= api.post('/auth/refresh').then((res) => {
        setAccessToken(res.data?.accessToken || res.accessToken);
        return res.data?.accessToken || res.accessToken;
      }).finally(() => { refreshing = null; });
      const token = await refreshing;
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    }
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    if (!original?.silent) toast.error(message);
    return Promise.reject(new Error(message));
  },
);

const unwrap = (response) => response.data ?? response;

export const authApi = {
  async register(payload) {
    const res = await api.post('/auth/register', payload);
    const data = unwrap(res);
    setAccessToken(data.accessToken);
    return data;
  },
  async login(payload) {
    const res = await api.post('/auth/login', payload);
    const data = unwrap(res);
    setAccessToken(data.accessToken);
    return data;
  },
  async refresh() {
    const res = await api.post('/auth/refresh', null, { silent: true });
    const data = unwrap(res);
    setAccessToken(data.accessToken);
    return data;
  },
  async logout() {
    try {
      await api.post('/auth/logout', null, { silent: true });
    } catch {
      // Logout should always clear the browser session, even if the server token is expired.
    } finally {
      setAccessToken(null);
    }
  },
  async me() {
    return unwrap(await api.get('/auth/me'));
  },
};

export const patientApi = {
  me: () => api.get('/patients/me').then(unwrap),
  updateMe: (payload) => api.put('/patients/me', payload).then(unwrap),
  list: () => api.get('/patients').then(unwrap),
  get: (id) => api.get(`/patients/${id}`).then(unwrap),
};

export const userApi = {
  me: () => api.get('/users/me').then(unwrap),
  saveDosha: (payload) => api.put('/users/dosha', payload).then(unwrap),
  updateProfile: (payload) => api.put('/users/profile', payload).then(unwrap),
};

export const therapyApi = {
  list: (params) => api.get('/therapies', { params }).then(unwrap),
  create: (payload) => api.post('/therapies', payload).then(unwrap),
  update: (id, payload) => api.put(`/therapies/${id}`, payload).then(unwrap),
  cancel: (id, reason) => api.delete(`/therapies/${id}`, { data: { reason } }).then(unwrap),
  availability: (params) => api.get('/therapies/availability', { params }).then(unwrap),
  practitioners: () => api.get('/therapies/practitioners').then(unwrap),
};

export const notificationApi = {
  list: (params) => api.get('/notifications', { params, silent: true }).then(unwrap),
  read: (id) => api.put(`/notifications/${id}/read`).then(unwrap),
  readAll: () => api.put('/notifications/read-all').then(unwrap),
};

export const mlApi = {
  prakriti: (answers) => api.post('/ml/prakriti', { answers }).then(unwrap),
  patientAnalytics: () => api.get('/ml/patient-analytics').then(unwrap),
  recommendTherapy: (payload = {}) => api.post('/ml/recommend-therapy', payload).then(unwrap),
  predictProgress: (patientId) => api.post('/ml/predict-progress', { patientId }).then(unwrap),
  optimalSlots: (payload) => api.post('/ml/optimal-slots', payload).then(unwrap),
  anomalies: (patientId) => api.get(`/ml/anomalies/${patientId}`).then(unwrap),
};

export const feedbackApi = {
  create: (payload) => api.post('/feedback', payload).then(unwrap),
};

export const herbApi = {
  list: (params) => api.get('/herbs', { params }).then((res) => res),
  seed: () => api.post('/herbs/seed').then((res) => res),
};

export const centerApi = {
  list: (params) => api.get('/centers', { params }).then(unwrap),
  seed: () => api.post('/centers/seed').then(unwrap),
};

export const appointmentApi = {
  list: (params) => api.get('/appointments', { params }).then(unwrap),
  my: () => api.get('/appointments/my').then(unwrap),
  create: (payload) => api.post('/appointments', payload).then(unwrap),
  get: (id) => api.get(`/appointments/${id}`).then(unwrap),
  approve: (id) => api.put(`/appointments/${id}/approve`).then(unwrap),
  cancel: (id) => api.put(`/appointments/${id}/cancel`).then(unwrap),
};

export const advisorApi = {
  chat: (message, patientId) => api.post('/advisor/chat', { message, patientId }).then(unwrap),
};

export const adminApi = {
  overview: () => api.get('/admin/overview').then(unwrap),
  users: () => api.get('/admin/users').then(unwrap),
  updateRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }).then(unwrap),
};

export async function apiLogin(email, password) { return authApi.login({ email, password }); }
export async function apiRegister(name, email, password, role = 'patient') { return authApi.register({ name, email, password, role }); }
export async function apiGetMe() { return authApi.me(); }
export function apiLogout() { return authApi.logout(); }
export function hasToken() { return !!getAccessToken(); }
export async function apiSaveDosha(dosha, doshaScores) { return userApi.saveDosha({ dosha, doshaScores }); }
export async function apiGetPosts() { return api.get('/posts'); }
export async function apiCreatePost(content) { return api.post('/posts', { content }); }
export async function apiToggleLike(postId) { return api.put(`/posts/${postId}/like`); }
export async function apiGetHerbs(params) { return api.get('/herbs', { params }); }
export async function apiSeedHerbs() { return api.post('/herbs/seed'); }
export async function apiDeletePost(postId) { return api.delete(`/posts/${postId}`); }
