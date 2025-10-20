const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory storage for GhostBuster detections
const ghostDetections = [];

// POST /api/ghostbuster/save - Save detection result
router.post('/save', async (req, res) => {
  try {
    const { nrc, fullName, salary, isGhost, ghostProbability, flags, analysisType } = req.body;

    if (!nrc) {
      return res.status(400).json({ error: 'NRC is required' });
    }

    // Create detection record
    const detection = {
      id: uuidv4(),
      nrc: nrc,
      fullName: fullName || 'Unknown',
      salary: salary || 0,
      isGhost: isGhost,
      ghostProbability: ghostProbability,
      status: isGhost ? 'GHOST' : 'LEGITIMATE',
      flags: flags || [],
      analysisType: analysisType || 'individual',
      detectedAt: new Date().toISOString()
    };

    // Store in memory
    ghostDetections.push(detection);

    // Keep only last 1000 detections
    if (ghostDetections.length > 1000) {
      ghostDetections.shift();
    }

    res.json({
      success: true,
      detectionId: detection.id,
      message: 'Detection saved successfully'
    });

  } catch (error) {
    console.error('GhostBuster save error:', error);
    res.status(500).json({ error: 'Failed to save detection' });
  }
});

// GET /api/ghostbuster/detections - Get all detections
router.get('/detections', (req, res) => {
  try {
    // Return detections sorted by most recent first
    const sorted = [...ghostDetections].reverse();

    res.json({
      total: ghostDetections.length,
      detections: sorted
    });

  } catch (error) {
    console.error('GhostBuster detections error:', error);
    res.status(500).json({ error: 'Failed to get detections' });
  }
});

// GET /api/ghostbuster/recent - Get recent detections (last 10)
router.get('/recent', (req, res) => {
  try {
    const recent = [...ghostDetections].reverse().slice(0, 10);

    res.json({
      count: recent.length,
      detections: recent
    });

  } catch (error) {
    console.error('GhostBuster recent error:', error);
    res.status(500).json({ error: 'Failed to get recent detections' });
  }
});

// GET /api/ghostbuster/stats - Get detection statistics
router.get('/stats', (req, res) => {
  try {
    const total = ghostDetections.length;
    const ghosts = ghostDetections.filter(d => d.isGhost).length;
    const legitimate = total - ghosts;

    res.json({
      total: total,
      ghosts: ghosts,
      legitimate: legitimate,
      ghostRate: total > 0 ? ((ghosts / total) * 100).toFixed(2) : 0
    });

  } catch (error) {
    console.error('GhostBuster stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

module.exports = router;
