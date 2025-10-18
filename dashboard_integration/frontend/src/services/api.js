import axios from 'axios';
import { io } from 'socket.io-client';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4000';

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// WebSocket connection
let socket = null;

export const connectWebSocket = () => {
  if (!socket) {
    socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
    });
  }
  return socket;
};

export const disconnectWebSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

// Dashboard API
export const dashboardAPI = {
  getFeed: () => api.get('/api/dashboard/feed'),
  getStats: () => api.get('/api/dashboard/stats')
};

// OCR API
export const ocrAPI = {
  upload: (formData) => api.post('/api/ocr/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getResults: (params) => api.get('/api/ocr/results', { params }),
  getStats: () => api.get('/api/ocr/stats')
};

// WhistlePro API
export const whistleproAPI = {
  submit: (report) => api.post('/api/whistlepro/submit', report),
  getCases: (params) => api.get('/api/whistlepro/cases', { params }),
  getStats: () => api.get('/api/whistlepro/stats')
};

// GhostBuster API
export const ghostbusterAPI = {
  detect: (data) => api.post('/api/ghostbuster/detect', data),
  getDetections: (params) => api.get('/api/ghostbuster/detections', { params }),
  getStats: () => api.get('/api/ghostbuster/stats')
};

// Predictive API
export const predictiveAPI = {
  getRevenueForecast: () => api.get('/api/predictive/revenue-forecast'),
  runScenario: (scenario) => api.post('/api/predictive/scenario-analysis', scenario)
};

export default api;
