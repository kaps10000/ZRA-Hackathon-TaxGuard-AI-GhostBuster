const express = require('express');
const axios = require('axios');
const router = express.Router();

const WHISTLEPRO_API = process.env.WHISTLEPRO_API || 'http://localhost:3005';

// Get all reports
router.get('/reports', async (req, res) => {
  try {
    const response = await axios.get(`${WHISTLEPRO_API}/api/reports`);
    res.json(response.data);
  } catch (error) {
    console.error('WhistlePro API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Get single report
router.get('/reports/:id', async (req, res) => {
  try {
    const response = await axios.get(`${WHISTLEPRO_API}/api/reports/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    console.error('WhistlePro API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// Submit new report
router.post('/report', async (req, res) => {
  try {
    const response = await axios.post(`${WHISTLEPRO_API}/api/report`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('WhistlePro API error:', error.message);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

module.exports = router;
