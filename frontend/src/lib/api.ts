import axios from 'axios';
import type { 
  Detection, 
  WhistleblowerReport, 
  RiskAssessment, 
  Forecast, 
  DashboardEvent, 
  DashboardSummary 
} from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// GhostBuster API
export const ghostbusterApi = {
  getDetections: async (): Promise<Detection[]> => {
    const response = await api.get('/ghostbuster/detections');
    return response.data.detections || [];
  },
  
  getStats: async () => {
    const response = await api.get('/ghostbuster/stats');
    return response.data.stats;
  },
  
  submitDetection: async (detection: Partial<Detection>) => {
    const response = await api.post('/ghostbuster/detection', detection);
    return response.data;
  }
};

// WhistlePro API
export const whistleproApi = {
  getReports: async (): Promise<WhistleblowerReport[]> => {
    const response = await api.get('/whistlepro/reports');
    return response.data.reports || [];
  },
  
  trackReport: async (caseCode: string) => {
    const response = await api.get(`/whistlepro/track/${caseCode}`);
    return response.data;
  },
  
  submitReport: async (report: Partial<WhistleblowerReport>) => {
    const response = await api.post('/whistlepro/report', report);
    return response.data;
  }
};

// AI Risk API
export const aiRiskApi = {
  getAssessments: async (): Promise<RiskAssessment[]> => {
    const response = await api.get('/ai-risk/assessments');
    return response.data.assessments || [];
  },
  
  getStats: async () => {
    const response = await api.get('/ai-risk/stats');
    return response.data.stats;
  }
};

// Predictive API
export const predictiveApi = {
  getForecasts: async (): Promise<Forecast[]> => {
    const response = await api.get('/predictive/forecasts');
    return response.data.forecasts || [];
  },
  
  getAccuracyReport: async () => {
    const response = await api.get('/predictive/accuracy-report');
    return response.data.report;
  }
};

// Dashboard API
export const dashboardApi = {
  getLiveEvents: async (): Promise<DashboardEvent[]> => {
    const response = await api.get('/dashboard-feed/live?limit=20');
    return response.data.events || [];
  },
  
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await api.get('/dashboard-feed/summary');
    return response.data.summary;
  },
  
  getAlerts: async () => {
    const response = await api.get('/dashboard-feed/alerts');
    return response.data.alerts || [];
  },
  
  getHealth: async () => {
    const response = await api.get('/dashboard-feed/health');
    return response.data.health;
  }
};

export default api;
