const express = require('express');
const router = express.Router();
const axios = require('axios');

// Service URLs
const GHOSTBUSTER_API = process.env.GHOSTBUSTER_API || 'http://localhost:3006';

// Mock data aggregation functions (will be replaced with real API calls)
const getOCRStats = async () => {
  return {
    documents_processed: 1247,
    pending_verification: 89,
    high_risk_flagged: 23,
    low_risk: 1068,
    medium_risk: 156,
    trend: 15
  };
};

const getWhistleProStats = async () => {
  return {
    active_cases: 23,
    new_reports_24h: 3,
    in_progress: 18,
    urgent: 5,
    closed_total: 47,
    trend: -5
  };
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
  return {
    revenue_forecast: 42500000, // ZMW 42.5M
    trend: 15,
    copper_impact: -2300000, // -ZMW 2.3M
    compliance_impact: 1800000, // +ZMW 1.8M
    confidence: 78
  };
};

const getBlockchainStats = async () => {
  return {
    total_transactions: 5432,
    health: 'healthy',
    recent_transactions: [
      { tx: '0xabc123', action: 'Doc Hash Stored', timestamp: new Date().toISOString(), verified: true },
      { tx: '0xdef456', action: 'Detection Recorded', timestamp: new Date(Date.now() - 300000).toISOString(), verified: true },
      { tx: '0xghi789', action: 'Case Submitted', timestamp: new Date(Date.now() - 1800000).toISOString(), verified: true }
    ]
  };
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
