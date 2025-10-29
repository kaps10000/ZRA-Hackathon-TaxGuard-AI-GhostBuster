const express = require('express');
const router = express.Router();
const axios = require('axios');

// Service URLs
const GHOSTBUSTER_API = process.env.GHOSTBUSTER_API || 'http://localhost:3006';
const WHISTLEPRO_API = process.env.WHISTLEPRO_API || 'http://localhost:3005';
const BLOCKCHAIN_API = process.env.BLOCKCHAIN_API || 'http://localhost:3001';
const VRT_GUARD_API = process.env.VRT_GUARD_API || 'http://localhost:5000';

// Real-time data aggregation functions
const getOCRStats = async () => {
  try {
    // Fetch real OCR documents from database
    const response = await axios.get('http://localhost:4001/api/ocr/documents', {
      timeout: 5000
    });

    const documents = response.data.documents || [];
    const total = response.data.total || 0;

    // Calculate risk distributions
    const highRisk = documents.filter(d => d.riskScore >= 70).length;
    const mediumRisk = documents.filter(d => d.riskScore >= 40 && d.riskScore < 70).length;
    const lowRisk = documents.filter(d => d.riskScore < 40).length;
    const flagged = documents.filter(d => d.status === 'FLAGGED').length;
    const pending = documents.filter(d => d.status === 'PENDING').length;

    return {
      documents_processed: total,
      pending_verification: pending,
      high_risk_flagged: highRisk,
      low_risk: lowRisk,
      medium_risk: mediumRisk,
      flagged: flagged,
      trend: 15, // Could be calculated from recent vs older documents
      data_loaded: true
    };
  } catch (error) {
    console.error('OCR stats error:', error.message);
    // Fallback to default values if service unavailable
    return {
      documents_processed: 0,
      pending_verification: 0,
      high_risk_flagged: 0,
      low_risk: 0,
      medium_risk: 0,
      flagged: 0,
      trend: 0,
      data_loaded: false,
      error: 'Unable to load OCR statistics'
    };
  }
};

const getWhistleProStats = async () => {
  try {
    // Fetch real WhistlePro reports from backend
    const response = await axios.get(`${WHISTLEPRO_API}/api/reports`, {
      timeout: 5000
    });

    const reports = response.data.reports || [];

    // Calculate real statistics from reports
    const activeCases = reports.filter(r => r.status !== 'closed' && r.status !== 'Resolved').length;
    const inProgress = reports.filter(r => r.status === 'investigating' || r.status === 'Under Investigation' || r.status === 'In Progress').length;
    const urgent = reports.filter(r => r.priority === 'critical' || r.priority === 'Critical' || r.priority === 'High').length;
    const closed = reports.filter(r => r.status === 'closed' || r.status === 'Resolved').length;

    // Calculate new reports in last 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newReports24h = reports.filter(r => {
      const reportDate = new Date(r.created_at || r.reportedDate || r.submittedAt);
      return reportDate > oneDayAgo;
    }).length;

    return {
      active_cases: activeCases,
      new_reports_24h: newReports24h,
      in_progress: inProgress,
      urgent: urgent,
      closed_total: closed,
      total_reports: reports.length,
      trend: newReports24h > 0 ? 5 : -5,
      data_loaded: true
    };
  } catch (error) {
    console.error('WhistlePro stats error:', error.message);
    // Fallback to default values if service unavailable
    return {
      active_cases: 0,
      new_reports_24h: 0,
      in_progress: 0,
      urgent: 0,
      closed_total: 0,
      total_reports: 0,
      trend: 0,
      data_loaded: false,
      error: 'Unable to load WhistlePro statistics'
    };
  }
};

const getGhostBusterStats = async () => {
  try {
    // Fetch real data from GhostBuster backend
    const response = await axios.get(`${GHOSTBUSTER_API}/api/stats`, {
      timeout: 5000
    });

    const data = response.data;
    const ghostDistribution = data.ghost_distribution || {};

    // Calculate totals from real data
    const totalGhosts = (ghostDistribution.DECEASED || 0) +
                        (ghostDistribution.DUPLICATE || 0) +
                        (ghostDistribution.PHANTOM || 0) +
                        (ghostDistribution.OVER_AGE || 0);

    return {
      phantom_employees_detected: ghostDistribution.PHANTOM || 0,
      deceased_employees: ghostDistribution.DECEASED || 0,
      duplicate_employees: ghostDistribution.DUPLICATE || 0,
      over_age_employees: ghostDistribution.OVER_AGE || 0,
      total_ghosts: totalGhosts,
      legitimate_employees: ghostDistribution.LEGITIMATE || 0,
      total_employees: data.total_employees || 0,
      total_napsa_records: data.total_napsa_records || 0,
      total_bank_transactions: data.total_bank_transactions || 0,
      trend: 8,
      data_loaded: true
    };
  } catch (error) {
    console.error('GhostBuster backend error:', error.message);
    // Fallback to mock data if backend unavailable
    return {
      phantom_employees_detected: 0,
      deceased_employees: 0,
      duplicate_employees: 0,
      over_age_employees: 0,
      total_ghosts: 0,
      legitimate_employees: 0,
      total_employees: 0,
      error: 'Unable to load statistics',
      data_loaded: false,
      trend: 0
    };
  }
};

const getPredictiveStats = async () => {
  try {
    // Fetch real VRT Guard detections to calculate revenue impact
    const vrtResponse = await axios.get('http://localhost:4001/api/vrtguard-db/detections', {
      timeout: 5000
    });

    const detections = vrtResponse.data.detections || [];

    // Calculate potential revenue recovery from fraud detections
    let totalRecoveryPotential = 0;
    detections.forEach(d => {
      // Estimate recovery based on fraud probability and typical fraud amounts
      const fraudProbability = d.fraudProbability || 0;
      const estimatedAmount = 100000; // Average VAT fraud amount in ZMW
      totalRecoveryPotential += estimatedAmount * fraudProbability;
    });

    // Calculate base revenue forecast (in millions)
    const baseRevenue = 40000000; // ZMW 40M base
    const recoveryImpact = Math.round(totalRecoveryPotential);
    const totalForecast = baseRevenue + recoveryImpact;

    // Calculate trend based on recent detection rates
    const recentDetections = detections.filter(d => {
      const detectionDate = new Date(d.detectedAt);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return detectionDate > weekAgo;
    }).length;

    const trend = recentDetections > 5 ? 15 : recentDetections > 2 ? 8 : 3;

    return {
      revenue_forecast: totalForecast,
      revenue_forecast_formatted: `ZMW ${(totalForecast / 1000000).toFixed(1)}M`,
      trend: trend,
      fraud_recovery_potential: recoveryImpact,
      compliance_impact: recoveryImpact,
      confidence: 75 + Math.min(detections.length * 2, 20), // Higher confidence with more data
      total_detections: detections.length,
      recent_detections: recentDetections,
      data_loaded: true
    };
  } catch (error) {
    console.error('Predictive stats error:', error.message);
    // Fallback to estimated values if service unavailable
    return {
      revenue_forecast: 42000000,
      revenue_forecast_formatted: 'ZMW 42.0M',
      trend: 0,
      fraud_recovery_potential: 2000000,
      compliance_impact: 2000000,
      confidence: 50,
      total_detections: 0,
      recent_detections: 0,
      data_loaded: false,
      error: 'Unable to load predictive statistics'
    };
  }
};

const getBlockchainStats = async () => {
  try {
    // Fetch real blockchain transactions
    const response = await axios.get(`${BLOCKCHAIN_API}/api/events`, {
      timeout: 5000
    });

    const events = response.data.events || [];
    const count = response.data.count || events.length;

    // Get the most recent 5 transactions for display
    const recentTransactions = events.slice(0, 5).map(event => ({
      tx: event.hashOfPayload,
      action: event.eventType,
      timestamp: event.timestamp,
      verified: true,
      blockNumber: event.blockIndex,
      notes: event.notes
    }));

    // Calculate transactions in last 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent24h = events.filter(e => {
      const eventDate = new Date(e.timestamp);
      return eventDate > oneDayAgo;
    }).length;

    return {
      total_transactions: count,
      recent_24h: recent24h,
      health: 'healthy',
      recent_transactions: recentTransactions,
      data_loaded: true
    };
  } catch (error) {
    console.error('Blockchain stats error:', error.message);
    // Fallback to default values if service unavailable
    return {
      total_transactions: 0,
      recent_24h: 0,
      health: 'unavailable',
      recent_transactions: [],
      data_loaded: false,
      error: 'Unable to load blockchain statistics'
    };
  }
};

// Dashboard feed endpoint - aggregates all system data
router.get('/feed', async (req, res) => {
  try {
    const dashboardData = {
      timestamp: new Date().toISOString(),
      ocr: await getOCRStats(),
      whistlepro: await getWhistleProStats(),
      ghostbuster: await getGhostBusterStats(),
      predictive: await getPredictiveStats(),
      blockchain: await getBlockchainStats(),
      system: {
        api_health: 'online',
        active_users: 12,
        uptime: process.uptime()
      }
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard feed error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Dashboard stats endpoint (summary)
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      documents: (await getOCRStats()).documents_processed,
      cases: (await getWhistleProStats()).active_cases,
      detections: (await getGhostBusterStats()).phantom_employees_detected,
      forecast: (await getPredictiveStats()).revenue_forecast
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
