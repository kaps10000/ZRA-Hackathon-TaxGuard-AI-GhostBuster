const express = require('express');
const router = express.Router();
const axios = require('axios');

// Configuration
const ANOMALY_TRACKER_URL = process.env.ANOMALY_TRACKER_URL || 'http://localhost:5000';

// POST /api/anomaly-tracker/predict/ml - ML-based risk scoring
router.post('/predict/ml', async (req, res) => {
  try {
    const response = await axios.post(`${ANOMALY_TRACKER_URL}/predict/ml`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Anomaly Tracker ML prediction error:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Failed to predict risk scores (ML)', message: error.message });
    }
  }
});

// POST /api/anomaly-tracker/predict/manual - Manual formula-based risk scoring
router.post('/predict/manual', async (req, res) => {
  try {
    const response = await axios.post(`${ANOMALY_TRACKER_URL}/predict/manual`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Anomaly Tracker manual prediction error:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Failed to predict risk scores (manual)', message: error.message });
    }
  }
});

// GET /api/anomaly-tracker/health - Health check
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${ANOMALY_TRACKER_URL}/health`);
    res.json(response.data);
  } catch (error) {
    console.error('Anomaly Tracker health check error:', error.message);
    res.status(500).json({ status: 'ERROR', message: 'Anomaly Tracker service unavailable' });
  }
});

// GET /api/anomaly-tracker - API information
router.get('/', async (req, res) => {
  try {
    const response = await axios.get(`${ANOMALY_TRACKER_URL}/`);
    res.json(response.data);
  } catch (error) {
    console.error('Anomaly Tracker info error:', error.message);
    res.status(500).json({ error: 'Failed to get Anomaly Tracker information' });
  }
});

module.exports = router;
