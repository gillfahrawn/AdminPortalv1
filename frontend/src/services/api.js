import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://adminportalv1.onrender.com/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth endpoints
export const authenticate = (email, password) => {
  return api.post('/auth/authenticate', { email, password });
};

export const getUser = (userId) => {
  return api.get(`/auth/user/${userId}`);
};

export const updateUserProgress = (userId, data) => {
  return api.put(`/auth/user/${userId}/progress`, data);
};

// Admin endpoints
export const getAdminConfig = () => {
  return api.get('/admin/config');
};

export const updateAdminConfig = (config) => {
  return api.put('/admin/config', config);
};

// Data endpoints
export const getAllUsers = () => {
  return api.get('/data/users');
};

export default api;
