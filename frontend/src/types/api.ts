export interface Detection {
  detectionId: string;
  detectionType: 'phantom_employee' | 'ghost_company';
  entityId: string;
  confidenceScore: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
  reviewStatus?: 'pending' | 'confirmed' | 'false_positive';
}

export interface WhistleblowerReport {
  reportId: string;
  caseCode: string;
  reportType: 'tax_evasion' | 'fraud' | 'corruption' | 'money_laundering';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
  reviewStatus: 'submitted' | 'under_review' | 'investigating' | 'verified';
}

export interface RiskAssessment {
  assessmentId: string;
  taxpayerId: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
  confidence: number;
}

export interface Forecast {
  forecastId: string;
  forecastType: string;
  targetEntity: string;
  timeframe: string;
  prediction: {
    value: number;
    unit: string;
  };
  confidence: number;
  timestamp: string;
}

export interface DashboardEvent {
  eventId: string;
  type: string;
  module: string;
  userId: string;
  timestamp: string;
  timeAgo: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  icon: string;
  color: string;
  summary: string;
}

export interface DashboardSummary {
  blockchain: {
    totalBlocks: number;
    totalEvents: number;
    latestBlock: number;
    chainValid: boolean;
  };
  activity: {
    total: number;
    last24h: number;
    lastHour: number;
    eventsPerHour: string;
  };
  modules: {
    ghostbuster: number;
    whistlepro: number;
    aiRisk: number;
    predictive: number;
  };
  alerts: {
    critical: number;
    high: number;
    medium: number;
  };
}
