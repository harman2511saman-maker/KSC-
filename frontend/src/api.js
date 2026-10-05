import axios from 'axios';

export const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`;
  }
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1' &&
    !window.location.hostname.startsWith('192.168.')
  ) {
    return 'https://ksc-backend-brra.onrender.com/api';
  }
  return '/api';
};

export const getServerBaseURL = () => {
  const apiBase = getBaseURL();
  return apiBase.replace(/\/api\/?$/, '');
};

export const getUploadUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const serverBase = getServerBaseURL();
  return serverBase ? `${serverBase}${cleanPath}` : cleanPath;
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 60000,
});

// Attach token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('omr_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error.response?.data?.detail;
    return Promise.reject(new Error(detail || error.message || 'هەڵەیەک ڕوویدا'));
  }
);

export default api;
