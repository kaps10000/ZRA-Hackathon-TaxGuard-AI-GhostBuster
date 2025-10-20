const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory storage for VRT Guard detections
const vrtDetections = [];

// POST /api/vrtguard-db/save - Save VAT fraud detection result
router.post('/save', async (req, res) => {
  try {
    const {
      tin,
      taxpayerName,
      taxPeriod,
      totalSales,
      totalPurchases,
      outputVAT,
      inputVAT,
      netVAT,
      isFraudulent,
      fraudProbability,
      indicators,
      analysisType
    } = req.body;

    if (!tin) {
      return res.status(400).json({ error: 'TIN is required' });
    }

    // Create detection record
    const detection = {
      id: uuidv4(),
      tin: tin,
      taxpayerName: taxpayerName || 'Unknown',
      taxPeriod: taxPeriod || 'N/A',
      totalSales: totalSales || 0,
      totalPurchases: totalPurchases || 0,
      outputVAT: outputVAT || 0,
      inputVAT: inputVAT || 0,
      netVAT: netVAT || 0,
      isFraudulent: isFraudulent,
      fraudProbability: fraudProbability,
      status: isFraudulent ? 'FRAUDULENT' : 'LEGITIMATE',
      indicators: indicators || [],
      analysisType: analysisType || 'individual',
      detectedAt: new Date().toISOString()
    };

    // Store in memory
    vrtDetections.push(detection);

    // Keep only last 1000 detections
    if (vrtDetections.length > 1000) {
      vrtDetections.shift();
    }

    res.json({
      success: true,
      detectionId: detection.id,
      message: 'VAT fraud detection saved successfully'
    });

  } catch (error) {
    console.error('VRT Guard save error:', error);
    res.status(500).json({ error: 'Failed to save VAT detection' });
  }
});

// POST /api/vrtguard-db/save-batch - Save multiple VAT fraud detection results
router.post('/save-batch', async (req, res) => {
  try {
    const { detections } = req.body;

    if (!detections || !Array.isArray(detections) || detections.length === 0) {
      return res.status(400).json({ error: 'Detections array is required' });
    }

    const saved = [];

    for (const det of detections) {
      if (!det.tin) continue; // Skip records without TIN

      const detection = {
        id: uuidv4(),
        tin: det.tin,
        taxpayerName: det.taxpayerName || 'Unknown',
        taxPeriod: det.taxPeriod || 'N/A',
        totalSales: det.totalSales || 0,
        totalPurchases: det.totalPurchases || 0,
        outputVAT: det.outputVAT || 0,
        inputVAT: det.inputVAT || 0,
        netVAT: det.netVAT || 0,
        isFraudulent: det.isFraudulent,
        fraudProbability: det.fraudProbability,
        status: det.isFraudulent ? 'FRAUDULENT' : 'LEGITIMATE',
        indicators: det.indicators || [],
        analysisType: det.analysisType || 'batch',
        detectedAt: new Date().toISOString()
      };

      vrtDetections.push(detection);
      saved.push(detection.id);
    }

    // Keep only last 1000 detections
    while (vrtDetections.length > 1000) {
      vrtDetections.shift();
    }

    res.json({
      success: true,
      saved: saved.length,
      detectionIds: saved,
      message: `${saved.length} VAT fraud detections saved successfully`
    });

  } catch (error) {
    console.error('VRT Guard batch save error:', error);
    res.status(500).json({ error: 'Failed to save batch VAT detections' });
  }
});

// GET /api/vrtguard-db/detections - Get all VAT fraud detections
router.get('/detections', (req, res) => {
  try {
    // Return detections sorted by most recent first
    const sorted = [...vrtDetections].reverse();

    res.json({
      total: vrtDetections.length,
      detections: sorted
    });

  } catch (error) {
    console.error('VRT Guard detections error:', error);
    res.status(500).json({ error: 'Failed to get VAT detections' });
  }
});

// GET /api/vrtguard-db/recent - Get recent detections (last 10)
router.get('/recent', (req, res) => {
  try {
    const recent = [...vrtDetections].reverse().slice(0, 10);

    res.json({
      count: recent.length,
      detections: recent
    });

  } catch (error) {
    console.error('VRT Guard recent error:', error);
    res.status(500).json({ error: 'Failed to get recent VAT detections' });
  }
});

// GET /api/vrtguard-db/stats - Get detection statistics
router.get('/stats', (req, res) => {
  try {
    const total = vrtDetections.length;
    const fraudulent = vrtDetections.filter(d => d.isFraudulent).length;
    const legitimate = total - fraudulent;

    const totalSalesAmount = vrtDetections.reduce((sum, d) => sum + (d.totalSales || 0), 0);
    const fraudulentSalesAmount = vrtDetections.filter(d => d.isFraudulent).reduce((sum, d) => sum + (d.totalSales || 0), 0);

    res.json({
      total: total,
      fraudulent: fraudulent,
      legitimate: legitimate,
      fraudRate: total > 0 ? ((fraudulent / total) * 100).toFixed(2) : 0,
      totalSalesAmount: totalSalesAmount,
      fraudulentSalesAmount: fraudulentSalesAmount,
      potentialRevenueLoss: fraudulentSalesAmount * 0.16 // Assuming 16% VAT rate
    });

  } catch (error) {
    console.error('VRT Guard stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

module.exports = router;
