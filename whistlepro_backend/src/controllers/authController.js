const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const auditService = require('../services/auditService');
const Joi = require('joi');

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  remember_me: Joi.boolean().default(false)
});

/**
 * Investigator login
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid login credentials format',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      }
    });
  }

  const { email, password, remember_me } = value;

  // Find investigator
  const investigator = await db('investigators')
    .where({ email, is_active: true })
    .first();

  if (!investigator) {
    // Log failed login attempt
    await auditService.logSecurityEvent({
      event_type: 'failed_login_attempt',
      severity: 'medium',
      description: `Failed login attempt for email: ${email}`,
      ip_hash: req.hashedIP,
      user_agent_hash: req.hashedUserAgent,
      metadata: {
        email,
        reason: 'investigator_not_found'
      }
    });

    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      }
    });
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, investigator.password_hash);
  if (!isPasswordValid) {
    // Log failed login attempt
    await auditService.logSecurityEvent({
      event_type: 'failed_login_attempt',
      severity: 'medium',
      description: `Failed login attempt for investigator ID: ${investigator.id}`,
      actor_id: investigator.id,
      actor_type: 'investigator',
      ip_hash: req.hashedIP,
      user_agent_hash: req.hashedUserAgent,
      metadata: {
        email,
        reason: 'invalid_password'
      }
    });

    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      }
    });
  }

  // Generate tokens
  const token = generateToken(investigator);
  const refreshToken = generateRefreshToken(investigator);

  // Update last login
  await db('investigators')
    .where({ id: investigator.id })
    .update({ last_login: new Date() });

  // Log successful login
  await auditService.log({
    actor_id: investigator.id,
    actor_type: 'investigator',
    action: 'successful_login',
    target_type: 'investigator',
    target_id: investigator.id,
    ip_hash: req.hashedIP,
    user_agent_hash: req.hashedUserAgent,
    metadata: {
      email,
      remember_me
    }
  });

  // Set secure HTTP-only cookies if remember me is selected
  if (remember_me) {
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
  }

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      investigator: {
        id: investigator.id,
        email: investigator.email,
        full_name: investigator.full_name,
        badge_number: investigator.badge_number,
        role: investigator.role,
        department: investigator.department,
        last_login: investigator.last_login
      },
      token,
      refresh_token: refreshToken,
      expires_in: '24h'
    }
  });
});

/**
 * Investigator logout
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  // Log logout
  await auditService.log({
    actor_id: req.investigator?.id || null,
    actor_type: 'investigator',
    action: 'logout',
    target_type: 'investigator',
    target_id: req.investigator?.id || null,
    ip_hash: req.hashedIP,
    user_agent_hash: req.hashedUserAgent
  });

  // Clear cookies
  res.clearCookie('token');
  res.clearCookie('refreshToken');

  res.json({
    success: true,
    message: 'Logout successful'
  });
});

/**
 * Get current investigator profile
 * GET /api/auth/me
 */
const getProfile = asyncHandler(async (req, res) => {
  const investigator = await db('investigators')
    .where({ id: req.investigator.id })
    .select('id', 'email', 'full_name', 'badge_number', 'role', 'department', 'last_login', 'created_at')
    .first();

  if (!investigator) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Investigator profile not found',
        code: 'PROFILE_NOT_FOUND'
      }
    });
  }

  res.json({
    success: true,
    data: investigator
  });
});

/**
 * Refresh JWT token
 * POST /api/auth/refresh
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refresh_token } = req.body;
  
  if (!refresh_token) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Refresh token required',
        code: 'REFRESH_TOKEN_REQUIRED'
      }
    });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refresh_token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Get investigator
    const investigator = await db('investigators')
      .where({ id: decoded.id, is_active: true })
      .first();

    if (!investigator) {
      throw new Error('Investigator not found');
    }

    // Generate new tokens
    const newToken = generateToken(investigator);
    const newRefreshToken = generateRefreshToken(investigator);

    // Log token refresh
    await auditService.log({
      actor_id: investigator.id,
      actor_type: 'investigator',
      action: 'token_refreshed',
      target_type: 'investigator',
      target_id: investigator.id,
      ip_hash: req.hashedIP,
      user_agent_hash: req.hashedUserAgent
    });

    res.json({
      success: true,
      data: {
        token: newToken,
        refresh_token: newRefreshToken,
        expires_in: '24h'
      }
    });

  } catch (error) {
    // Log suspicious refresh token activity
    await auditService.logSecurityEvent({
      event_type: 'invalid_refresh_token',
      severity: 'medium',
      description: 'Invalid refresh token used',
      ip_hash: req.hashedIP,
      user_agent_hash: req.hashedUserAgent,
      metadata: {
        error: error.message
      }
    });

    res.status(401).json({
      success: false,
      error: {
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      }
    });
  }
});

module.exports = {
  login,
  logout,
  getProfile,
  refreshToken
};