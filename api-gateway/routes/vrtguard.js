const express = require('express');
const router = express.Router();
const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

const VRT_GUARD_BASE_URL = process.env.VRT_GUARD_URL || 'http://localhost:5002';

// GET / - Proxy to VRT Guard home page (for iframe embedding)
router.get('/', async (req, res) => {
  try {
    const response = await axios.get(`${VRT_GUARD_BASE_URL}/`);
    res.send(response.data);
  } catch (error) {
    console.error('VRT Guard home error:', error.message);
    res.status(500).json({ error: 'Failed to load VRT Guard interface' });
  }
});

// GET /templates/:kind - Download templates
router.get('/templates/:kind', async (req, res) => {
  try {
    const response = await axios.get(
      `${VRT_GUARD_BASE_URL}/templates/${req.params.kind}`,
      { responseType: 'arraybuffer' }
    );

    res.set('Content-Type', response.headers['content-type']);
    res.set('Content-Disposition', response.headers['content-disposition']);
    res.send(response.data);
  } catch (error) {
    console.error('VRT Guard template download error:', error.message);
    res.status(500).json({ error: 'Failed to download template' });
  }
});

// POST /upload/return - Upload VAT return for analysis
router.post('/upload/return', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const response = await axios.post(
      `${VRT_GUARD_BASE_URL}/upload/return`,
      formData,
      {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('VRT Guard upload error:', error.message);
    res.status(500).json({
      error: 'Failed to analyze VAT return',
      details: error.response?.data || error.message
    });
  }
});

// POST /api/predict - Direct prediction API
router.post('/api/predict', async (req, res) => {
  try {
    const response = await axios.post(
      `${VRT_GUARD_BASE_URL}/api/predict`,
      req.body,
      { headers: { 'Content-Type': 'application/json' } }
    );

    res.json(response.data);
  } catch (error) {
    console.error('VRT Guard predict error:', error.message);
    res.status(500).json({
      error: 'Failed to predict fraud',
      details: error.response?.data || error.message
    });
  }
});

// GET /health - Health check for VRT Guard service
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${VRT_GUARD_BASE_URL}/`, { timeout: 3000 });
    res.json({
      status: 'healthy',
      service: 'VRT Guard',
      baseUrl: VRT_GUARD_BASE_URL
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'VRT Guard',
      error: error.message
    });
  }
});

module.exports = router;
