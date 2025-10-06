require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { connectDatabase, testConnection, closeConnection } = require('./config/database');
const { errorHandler, notFoundHandler } = require('./middleware/error-handler');
const { authenticateToken, optionalAuth } = require('./middleware/auth');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  }
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit uploads to 10 per 15 minutes
  message: {
    success: false,
    error: 'Too many upload requests, please try again later.'
  }
});

app.use('/api/', limiter);

// CORS Configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP Request Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Request ID Middleware
app.use((req, res, next) => {
  req.id = require('uuid').v4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Health Check Route
app.get('/healthcheck', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    const health = {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'OCR Verification Backend',
      environment: process.env.NODE_ENV || 'development',
      uptime: {
        seconds: Math.floor(uptime),
        formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
      },
      database: {
        connected: dbStatus,
        status: dbStatus ? 'connected' : 'disconnected'
      },
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
      },
      integrations: {
        aiService: process.env.AI_SERVICE_URL || 'Not configured',
        blockchainService: process.env.BLOCKCHAIN_API_URL || 'Not configured'
      }
    };

    logger.info('Health check requested', { status: 'healthy', dbStatus });
    res.json(health);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      service: 'OCR Verification Backend'
    });
  }
});

// API Info Route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'OCR Verification Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/healthcheck',
      upload: 'POST /api/upload',
      verify: 'POST /api/verify/:documentId',
      results: 'GET /api/results/:documentId',
      verification: {
        document: 'POST /api/verification/document',
        company: 'POST /api/verification/company',
        hsCode: 'POST /api/verification/hscode',
        declaration: 'POST /api/verification/declaration',
        country: 'POST /api/verification/country'
      }
    },
    documentation: 'See README.md for full API documentation'
  });
});

// API Routes
app.use('/api/upload', require('./routes/upload'));
app.use('/api/verify', require('./routes/verify'));
app.use('/api/verification', require('./routes/verification')); // ZRA Verification Engine (Task 3)
app.use('/api/results', require('./routes/results'));
app.use('/api/blockchain', require('./routes/blockchain')); // Blockchain Integration (Task 4)

// 404 Handler (must be after all routes)
app.use(notFoundHandler);

// Error Handler (must be last)
app.use(errorHandler);

// Database Connection and Server Startup
async function startServer() {
  let dbConnected = false;

  try {
    // Try to connect to database (non-blocking)
    logger.info('🔌 Connecting to database...');
    try {
      await connectDatabase();
      dbConnected = true;
    } catch (dbError) {
      logger.warn('⚠️  Database connection failed, continuing without database');
      logger.warn('Note: Document persistence will not work');
      dbConnected = false;
    }

    // Start Express server regardless of DB status
    const server = app.listen(PORT, () => {
      logger.info(`✅ Server running on port ${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
        port: PORT,
        database: dbConnected ? 'connected' : 'disconnected'
      });
      console.log('\n' + '='.repeat(60));
      console.log('🚀 OCR Verification Backend - Server Started');
      console.log('='.repeat(60));
      console.log(`✅ Server:      http://localhost:${PORT}`);
      console.log(`🏥 Health:      http://localhost:${PORT}/healthcheck`);
      console.log(`📚 API Info:    http://localhost:${PORT}/`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 Database:    ${dbConnected ? '✅ Connected' : '⚠️  Disconnected (API-only mode)'}`);
      console.log('='.repeat(60) + '\n');
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await closeConnection();
          logger.info('Database connection closed');
          logger.info('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', { promise, reason });
      // Don't shutdown on database connection errors
      if (reason && reason.message && reason.message.includes('connect')) {
        logger.warn('Database connection error, continuing...');
      } else {
        gracefulShutdown('unhandledRejection');
      }
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;
