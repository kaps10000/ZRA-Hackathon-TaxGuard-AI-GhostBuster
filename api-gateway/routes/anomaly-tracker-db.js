const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory storage for risk scores
const riskScores = [];

// POST /api/anomaly-tracker-db/save - Save risk score
router.post('/save', async (req, res) => {
  try {
    const {
      tin,
      taxpayerName,
      amount,
      transactionCount,
      avgTransaction,
      sector,
      region,
      riskScore,
      riskLevel,
      method
    } = req.body;

    if (!tin) {
      return res.status(400).json({ error: 'TIN is required' });
    }

    // Create risk score record
    const record = {
      id: uuidv4(),
      tin: tin,
      taxpayerName: taxpayerName || 'Unknown',
      amount: amount || 0,
      transactionCount: transactionCount || 0,
      avgTransaction: avgTransaction || 0,
      sector: sector || 'N/A',
      region: region || 'N/A',
      riskScore: riskScore,
      riskLevel: riskLevel || (riskScore > 70 ? 'High' : riskScore > 40 ? 'Medium' : 'Low'),
      method: method || 'manual',
      analyzedAt: new Date().toISOString()
    };

    // Store in memory
    riskScores.push(record);

    // Keep only last 1000 records
    if (riskScores.length > 1000) {
      riskScores.shift();
    }

    res.json({
      success: true,
      recordId: record.id,
      message: 'Risk score saved successfully'
    });

  } catch (error) {
    console.error('Risk score save error:', error);
    res.status(500).json({ error: 'Failed to save risk score' });
  }
});

// POST /api/anomaly-tracker-db/save-batch - Save multiple risk scores
router.post('/save-batch', async (req, res) => {
  try {
    const { scores } = req.body;

    if (!scores || !Array.isArray(scores) || scores.length === 0) {
      return res.status(400).json({ error: 'Scores array is required' });
    }

    const saved = [];

    for (const score of scores) {
      if (!score.tin) continue;

      const record = {
        id: uuidv4(),
        tin: score.tin,
        taxpayerName: score.taxpayerName || 'Unknown',
        amount: score.amount || 0,
        transactionCount: score.transactionCount || 0,
        avgTransaction: score.avgTransaction || 0,
        sector: score.sector || 'N/A',
        region: score.region || 'N/A',
        riskScore: score.riskScore,
        riskLevel: score.riskLevel || (score.riskScore > 70 ? 'High' : score.riskScore > 40 ? 'Medium' : 'Low'),
        method: score.method || 'manual',
        analyzedAt: new Date().toISOString()
      };

      riskScores.push(record);
      saved.push(record.id);
    }

    // Keep only last 1000 records
    while (riskScores.length > 1000) {
      riskScores.shift();
    }

    res.json({
      success: true,
      saved: saved.length,
      recordIds: saved,
      message: `${saved.length} risk scores saved successfully`
    });

  } catch (error) {
    console.error('Batch save error:', error);
    res.status(500).json({ error: 'Failed to save batch risk scores' });
  }
});

// GET /api/anomaly-tracker-db/scores - Get all risk scores
router.get('/scores', (req, res) => {
  try {
    // Return scores sorted by most recent first
    const sorted = [...riskScores].reverse();

    res.json({
      total: riskScores.length,
      scores: sorted
    });

  } catch (error) {
    console.error('Get scores error:', error);
    res.status(500).json({ error: 'Failed to get risk scores' });
  }
});

// GET /api/anomaly-tracker-db/recent - Get recent scores (last 10)
router.get('/recent', (req, res) => {
  try {
    const recent = [...riskScores].reverse().slice(0, 10);

    res.json({
      count: recent.length,
      scores: recent
    });

  } catch (error) {
    console.error('Get recent error:', error);
    res.status(500).json({ error: 'Failed to get recent scores' });
  }
});

// GET /api/anomaly-tracker-db/stats - Get statistics
router.get('/stats', (req, res) => {
  try {
    const total = riskScores.length;
    const highRisk = riskScores.filter(s => s.riskScore > 70).length;
    const mediumRisk = riskScores.filter(s => s.riskScore > 40 && s.riskScore <= 70).length;
    const lowRisk = riskScores.filter(s => s.riskScore <= 40).length;

    const avgRisk = total > 0
      ? (riskScores.reduce((sum, s) => sum + s.riskScore, 0) / total).toFixed(2)
      : 0;

    res.json({
      total: total,
      highRisk: highRisk,
      mediumRisk: mediumRisk,
      lowRisk: lowRisk,
      averageRiskScore: avgRisk,
      highRiskPercentage: total > 0 ? ((highRisk / total) * 100).toFixed(2) : 0
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

module.exports = router;
