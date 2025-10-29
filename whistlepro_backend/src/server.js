const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');
const securityMiddleware = require('./middleware/security');

// Import routes
const healthRoutes = require('./routes/healthRoutes');
const reportRoutes = require('./routes/reportRoutes');
const authRoutes = require('./routes/authRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3005;

// ===========================
// SECURITY MIDDLEWARE
// ===========================

// Helmet - Secure HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:4001'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Compression for response optimization
app.use(compression());

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging (combined format in production, dev format in development)
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// ===========================
// GLOBAL RATE LIMITING
// ===========================

const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', globalLimiter);

// ===========================
// SECURITY MIDDLEWARE (Custom)
// ===========================

// Hash IP addresses for anonymity
app.use(securityMiddleware.hashIP);

// ===========================
// ROUTES
// ===========================

// Health check routes
app.use('/health', healthRoutes);

// API routes
app.use('/api/reports', reportRoutes);
app.use('/api/auth', authRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'WhistlePro Backend',
    version: '1.0.0',
    status: 'running',
    description: 'Secure Anonymous Reporting System for ZRA TaxGuard AI',
    endpoints: {
      health: '/health',
      reports: '/api/reports',
      auth: '/api/auth'
    },
    documentation: '/api/docs',
    timestamp: new Date().toISOString()
  });
});

// ===========================
// ERROR HANDLING
// ===========================

// Handle 404 - Route not found
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

// ===========================
// SERVER INITIALIZATION
// ===========================

// Graceful shutdown handler
const gracefulShutdown = () => {
  console.log('\n🛑 Received shutdown signal, closing server gracefully...');

  server.close(() => {
    console.log('✅ Server closed successfully');

    // Close database connection
    const db = require('./config/database');
    db.destroy()
      .then(() => {
        console.log('✅ Database connection closed');
        process.exit(0);
      })
      .catch((err) => {
        console.error('❌ Error closing database connection:', err);
        process.exit(1);
      });
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Start server
const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 WhistlePro Backend Server');
  console.log('='.repeat(60));
  console.log(`📡 Server running on port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 CORS enabled for: ${corsOptions.origin.join(', ')}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📝 API endpoint: http://localhost:${PORT}/api/reports`);
  console.log('='.repeat(60) + '\n');
});

// Handle graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;
