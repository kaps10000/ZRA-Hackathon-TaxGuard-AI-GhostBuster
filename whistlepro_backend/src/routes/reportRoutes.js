const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticate, authorize } = require('../middleware/auth');
const securityMiddleware = require('../middleware/security');
const {
  createReport,
  getReportByCaseId,
  getReports,
  updateReportStatus,
  getReportStats
} = require('../controllers/reportController');

const router = express.Router();

// Rate limiting for report submission (stricter for anonymous users)
const reportSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.REPORT_RATE_LIMIT_MAX) || 5, // Max 5 reports per IP per 15 minutes
  message: {
    error: 'Too many reports submitted from this IP, please try again later.',
    retryAfter: 15 * 60 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use hashed IP for rate limiting while preserving privacy
    return req.hashedIP || req.ip;
  }
});

// Rate limiting for investigators (more lenient)
const investigatorLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Max 60 requests per minute for investigators
  message: {
    error: 'Too many requests, please slow down.',
    retryAfter: 60
  },
  skip: (req) => {
    // Skip if no investigator (handled by auth middleware)
    return !req.investigator;
  },
  keyGenerator: (req) => {
    return req.investigator ? `investigator_${req.investigator.id}` : req.hashedIP;
  }
});

// Apply security middleware to all routes
router.use(securityMiddleware.scrubMetadata);
router.use(securityMiddleware.detectAttacks);
router.use(securityMiddleware.logSecurityEvents);

// PUBLIC ROUTES

/**
 * @route   POST /api/reports
 * @desc    Submit anonymous report
 * @access  Public (rate limited)
 */
router.post('/', 
  reportSubmissionLimiter,
  createReport
);

// PROTECTED ROUTES (Investigators only)

/**
 * @route   GET /api/reports
 * @desc    Get paginated list of reports with filtering
 * @access  Private (Investigators)
 */
router.get('/',
  authenticate,
  investigatorLimiter,
  getReports
);

/**
 * @route   GET /api/reports/stats
 * @desc    Get report statistics
 * @access  Private (Supervisors and Admins only)
 */
router.get('/stats',
  authenticate,
  authorize(['supervisor', 'admin']),
  investigatorLimiter,
  getReportStats
);

/**
 * @route   GET /api/reports/:caseId
 * @desc    Get specific report by case ID
 * @access  Private (Investigators)
 */
router.get('/:caseId',
  authenticate,
  investigatorLimiter,
  getReportByCaseId
);

/**
 * @route   PATCH /api/reports/:caseId/status
 * @desc    Update report status
 * @access  Private (Investigators)
 */
router.patch('/:caseId/status',
  authenticate,
  investigatorLimiter,
  updateReportStatus
);

module.exports = router;