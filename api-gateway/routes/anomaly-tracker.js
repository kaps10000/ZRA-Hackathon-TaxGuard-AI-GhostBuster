const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');

// Configuration
const ANOMALY_TRACKER_URL = process.env.ANOMALY_TRACKER_URL || 'http://localhost:5001';

// Multer setup for multipart uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /api/anomaly-tracker/predict/ml - ML-based risk scoring
router.post('/predict/ml', async (req, res) => {
  try {
    const response = await axios.post(`${ANOMALY_TRACKER_URL}/predict/ml`, req.body);
    // Map ai_risk_scoring response -> dashboard expected schema
    const input = Array.isArray(req.body) ? req.body : [];
    const scores = Array.isArray(response.data?.risk_scores) ? response.data.risk_scores : [];
    const level = (s) => (s >= 70 ? 'High' : s >= 40 ? 'Medium' : 'Low');
    const results = input.map((rec, i) => ({
      ...rec,
      risk_score: typeof scores[i] === 'number' ? Math.round(scores[i] * 100) / 100 : 0,
      risk_level: level(typeof scores[i] === 'number' ? scores[i] : 0),
    }));
    res.json({ success: true, results });
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
    // Map manual scoring response -> dashboard expected schema
    const input = Array.isArray(req.body) ? req.body : [];
    const scores = Array.isArray(response.data?.risk_scores) ? response.data.risk_scores : [];
    const level = (s) => (s >= 70 ? 'High' : s >= 40 ? 'Medium' : 'Low');
    const results = input.map((rec, i) => ({
      ...rec,
      risk_score: typeof scores[i] === 'number' ? Math.round(scores[i] * 100) / 100 : 0,
      risk_level: level(typeof scores[i] === 'number' ? scores[i] : 0),
    }));
    res.json({ success: true, results });
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

// POST /api/anomaly-tracker/train - Proxy training CSV upload to Flask
router.post('/train', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const { originalname, mimetype, buffer } = req.file;
    // Prepare form-data for Flask
    const form = new FormData();
    form.append('file', buffer, { filename: originalname, contentType: mimetype, knownLength: buffer.length });
    // Forward optional fields
    const passthrough = ['features', 'target', 'learning_rate', 'n_trees', 'n_estimators', 'test_size'];
    for (const key of passthrough) {
      if (req.body && typeof req.body[key] !== 'undefined' && req.body[key] !== null) {
        form.append(key, String(req.body[key]));
      }
    }

    const headers = form.getHeaders();
    const response = await axios.post(`${ANOMALY_TRACKER_URL}/train`, form, { headers });
    res.json(response.data);
  } catch (error) {
    console.error('Anomaly Tracker training proxy error:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Failed to train model', message: error.message });
    }
  }
});
