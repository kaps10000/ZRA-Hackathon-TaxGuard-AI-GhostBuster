const express = require('express');
const router = express.Router();

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
  return {
    phantom_employees_detected: 12,
    ghost_companies_flagged: 5,
    shell_entities: 3,
    related_networks: 8,
    trend: 8
  };
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
