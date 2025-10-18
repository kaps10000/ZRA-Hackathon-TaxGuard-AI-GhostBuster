const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticate } = require('../middleware/auth');
const {
  login,
  logout,
  getProfile,
  refreshToken
} = require('../controllers/authController');

const router = express.Router();

// Rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 login attempts per IP per 15 minutes
  message: {
    error: 'Too many authentication attempts from this IP, please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.hashedIP || req.ip;
  },
  // Only apply to login and refresh routes
  skip: (req) => {
    return !['POST'].includes(req.method) || 
           !['/login', '/refresh'].includes(req.path);
  }
});

// More lenient rate limiting for token refresh
const refreshLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Max 10 refresh attempts per 5 minutes
  message: {
    error: 'Too many token refresh attempts, please try again later.',
    retryAfter: 5 * 60
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Investigator login
 * @access  Public (rate limited)
 */
router.post('/login', authLimiter, login);

/**
 * @route   POST /api/auth/logout
 * @desc    Investigator logout
 * @access  Private
 */
router.post('/logout', authenticate, logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current investigator profile
 * @access  Private
 */
router.get('/me', authenticate, getProfile);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Public (rate limited)
 */
router.post('/refresh', refreshLimiter, refreshToken);

module.exports = router;