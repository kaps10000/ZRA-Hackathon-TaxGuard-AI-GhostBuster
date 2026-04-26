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

// Get all cases (formatted reports for database viewer)
router.get('/cases', async (req, res) => {
  try {
    const response = await axios.get(`${WHISTLEPRO_API}/api/reports`);
    const reports = response.data.reports || [];

    // Format reports as cases for database viewer
    const cases = reports.map((report, index) => ({
      id: report.id || index + 1,
      caseId: report.caseId || `CASE-${String(report.id || index + 1).padStart(3, '0')}`,
      type: report.type || 'Whistleblower Report',
      entity: report.companyName || report.entityName || 'Unknown',
      investigator: 'Assigned Officer',
      status: report.status || 'Open',
      priority: report.severity || report.priority || 'Medium',
      date: report.submittedAt || report.createdAt || new Date().toISOString().split('T')[0]
    }));

    res.json({ cases, total: cases.length });
  } catch (error) {
    console.error('WhistlePro API error:', error.message);
    // Return empty array if WhistlePro service is down
    res.json({ cases: [], total: 0 });
  }
});

module.exports = router;
