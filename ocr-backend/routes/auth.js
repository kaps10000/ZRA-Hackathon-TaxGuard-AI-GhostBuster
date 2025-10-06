const express = require('express');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');
const asyncHandler = require('../middleware/async-handler');
const logger = require('../utils/logger');

const router = express.Router();

// Mock users for demo (in production, use database)
const mockUsers = [
  {
    id: 1,
    username: 'zra_admin',
    email: 'admin@zra.gov.zm',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    role: 'admin'
  },
  {
    id: 2,
    username: 'zra_officer',
    email: 'officer@zra.gov.zm', 
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    role: 'officer'
  }
];

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Username and password are required'
    });
  }

  // Find user
  const user = mockUsers.find(u => u.username === username || u.email === username);
  
  if (!user) {
    logger.warn('Login attempt with invalid username', { username });
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);
  
  if (!isValidPassword) {
    logger.warn('Login attempt with invalid password', { username });
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  // Generate token
  const token = generateToken({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  });

  logger.info('User logged in successfully', { username: user.username, role: user.role });

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    }
  });
}));

/**
 * POST /api/auth/verify
 * Verify JWT token validity
 */
router.post('/verify', asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Token is required'
    });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'zra-ocr-secret-key-change-in-production');
    
    res.json({
      success: true,
      data: {
        valid: true,
        user: decoded
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
}));

module.exports = router;
