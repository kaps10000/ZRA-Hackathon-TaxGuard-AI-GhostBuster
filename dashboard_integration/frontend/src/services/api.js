import axios from 'axios';
import { io } from 'socket.io-client';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4001';
const WHISTLEPRO_BASE_URL = import.meta.env.VITE_WHISTLEPRO_URL || 'http://localhost:3005';
const WHISTLEPRO_WS_URL = import.meta.env.VITE_WHISTLEPRO_WS_URL || 'http://localhost:3005';

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// WhistlePro-specific axios instance (port 3005)
const whistleproApi = axios.create({
  baseURL: WHISTLEPRO_BASE_URL,
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
let whistleproSocket = null;

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

// WhistlePro real-time WebSocket connection
export const connectWhistleProWebSocket = () => {
  if (!whistleproSocket) {
    whistleproSocket = io(WHISTLEPRO_WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    whistleproSocket.on('connect', () => {
      console.log('✅ WhistlePro WebSocket connected');
    });

    whistleproSocket.on('disconnect', () => {
      console.log('❌ WhistlePro WebSocket disconnected');
    });

    whistleproSocket.on('connected', (data) => {
      console.log('📡 WhistlePro real-time service connected:', data);
    });

    // Listen for real-time events
    whistleproSocket.on('newReport', (data) => {
      console.log('📢 New report received:', data.report);
    });

    whistleproSocket.on('statusChanged', (data) => {
      console.log('🔄 Report status changed:', data);
    });
  }
  return whistleproSocket;
};

export const disconnectWhistleProWebSocket = () => {
  if (whistleproSocket) {
    whistleproSocket.disconnect();
    whistleproSocket = null;
  }
};

export const getWhistleProSocket = () => whistleproSocket;

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

// WhistlePro API - Direct connection to port 3005
export const whistleproAPI = {
  submit: (report) => whistleproApi.post('/api/reports', report),
  getCases: (params) => whistleproApi.get('/api/reports', { params }),
  getCase: (caseId) => whistleproApi.get(`/api/reports/${caseId}`),
  updateStatus: (caseId, status) => whistleproApi.patch(`/api/reports/${caseId}/status`, { status }),
  getStats: () => whistleproApi.get('/api/realtime/status'),
  // File upload support
  uploadFiles: (formData) => whistleproApi.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
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
