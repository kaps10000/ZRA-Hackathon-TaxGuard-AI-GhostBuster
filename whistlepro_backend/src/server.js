require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Import routes
const reportRoutes = require('./routes/reportRoutes');
const authRoutes = require('./routes/authRoutes');
const healthRoutes = require('./routes/healthRoutes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const securityMiddleware = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(cors({
  origin: '*', // Allow all origins for testing (CHANGE IN PRODUCTION!)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(compression());

// Logging
app.use(morgan('combined', {
  stream: fs.createWriteStream(path.join(logsDir, 'access.log'), { flags: 'a' })
}));
app.use(morgan('dev'));

// Rate limiting - Global
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  }
});

app.use(globalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(securityMiddleware.sanitizeInput);
app.use(securityMiddleware.preventXSS);

// Routes
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);

// API documentation route (future)
app.get('/api', (req, res) => {
  res.json({
    name: 'WhistlePro Backend API',
    version: '1.0.0',
    description: 'Secure anonymous reporting system for ZRA TaxGuard AI',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      reports: '/api/reports'
    },
    documentation: '/api/docs' // Future Swagger endpoint
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: ['/health', '/api/auth', '/api/reports']
  });
});

// Error handling middleware (must be last)
app.use(errorHandler.errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 WhistlePro Backend server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base URL: ${process.env.API_BASE_URL || `http://localhost:${PORT}`}`);
});

module.exports = app;