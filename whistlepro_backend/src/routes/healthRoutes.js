const express = require('express');
const db = require('../config/database');

const router = express.Router();

/**
 * @route   GET /health
 * @desc    Basic health check
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    // Check database connection
    await db.raw('SELECT 1');
    
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        database: 'connected',
        encryption: 'active',
        audit_logging: 'active'
      }
    };

    res.json(healthCheck);
  } catch (error) {
    const healthCheck = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        database: 'disconnected',
        encryption: 'unknown',
        audit_logging: 'unknown'
      },
      error: error.message
    };

    res.status(503).json(healthCheck);
  }
});

/**
 * @route   GET /health/ready
 * @desc    Readiness probe for Kubernetes/Docker
 * @access  Public
 */
router.get('/ready', async (req, res) => {
  try {
    // Check if all critical services are ready
    await db.raw('SELECT 1');
    
    // Check if required environment variables are set
    const requiredEnvVars = [
      'JWT_SECRET',
      'ENCRYPTION_KEY',
      'DB_HOST',
      'DB_NAME'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      return res.status(503).json({
        status: 'not_ready',
        message: 'Missing required environment variables',
        missing_vars: missingEnvVars
      });
    }

    res.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * @route   GET /health/live
 * @desc    Liveness probe for Kubernetes/Docker
 * @access  Public
 */
router.get('/live', (req, res) => {
  // Simple liveness check - just return 200 if the process is running
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory_usage: process.memoryUsage(),
    pid: process.pid
  });
});

module.exports = router;