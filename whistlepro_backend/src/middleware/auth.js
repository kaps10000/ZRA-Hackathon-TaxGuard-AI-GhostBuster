const jwt = require('jsonwebtoken');
const db = require('../config/database');
const auditService = require('../services/auditService');

/**
 * Verify JWT token and authenticate investigators
 */
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies (for web dashboard)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Access denied. No token provided.',
          code: 'NO_TOKEN'
        }
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const investigator = await db('investigators')
        .where({ id: decoded.id, is_active: true })
        .select('id', 'email', 'full_name', 'badge_number', 'role', 'department')
        .first();

      if (!investigator) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Invalid token. Investigator not found or inactive.',
            code: 'INVALID_TOKEN'
          }
        });
      }

      // Update last login
      await db('investigators')
        .where({ id: investigator.id })
        .update({ last_login: new Date() });

      // Attach user to request
      req.investigator = investigator;
      next();

    } catch (jwtError) {
      let errorMessage = 'Invalid token';
      let errorCode = 'INVALID_TOKEN';

      if (jwtError.name === 'TokenExpiredError') {
        errorMessage = 'Token expired';
        errorCode = 'TOKEN_EXPIRED';
      } else if (jwtError.name === 'JsonWebTokenError') {
        errorMessage = 'Malformed token';
        errorCode = 'MALFORMED_TOKEN';
      }

      // Log suspicious token activity
      auditService.logSecurityEvent({
        event_type: 'invalid_token_used',
        severity: 'medium',
        description: errorMessage,
        ip_hash: req.hashedIP,
        user_agent_hash: req.hashedUserAgent,
        metadata: {
          endpoint: req.path,
          method: req.method,
          error: jwtError.name
        }
      });

      return res.status(401).json({
        success: false,
        error: {
          message: errorMessage,
          code: errorCode
        }
      });
    }

  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Authentication service error',
        code: 'AUTH_SERVICE_ERROR'
      }
    });
  }
};

/**
 * Check if investigator has required role
 * @param {Array} roles - Array of allowed roles
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.investigator) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }
      });
    }

    if (roles.length && !roles.includes(req.investigator.role)) {
      // Log unauthorized access attempt
      auditService.logSecurityEvent({
        event_type: 'unauthorized_access_attempt',
        severity: 'high',
        description: `Investigator with role '${req.investigator.role}' attempted to access resource requiring roles: ${roles.join(', ')}`,
        actor_id: req.investigator.id,
        actor_type: 'investigator',
        ip_hash: req.hashedIP,
        user_agent_hash: req.hashedUserAgent,
        metadata: {
          endpoint: req.path,
          method: req.method,
          required_roles: roles,
          investigator_role: req.investigator.role
        }
      });

      return res.status(403).json({
        success: false,
        error: {
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          required_roles: roles,
          your_role: req.investigator.role
        }
      });
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token provided
 * Used for endpoints that can be accessed by both authenticated and anonymous users
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const investigator = await db('investigators')
          .where({ id: decoded.id, is_active: true })
          .select('id', 'email', 'full_name', 'role', 'department')
          .first();

        if (investigator) {
          req.investigator = investigator;
        }
      } catch (jwtError) {
        // Ignore token errors for optional auth
        console.log('Optional auth token error (ignored):', jwtError.message);
      }
    }

    next();
  } catch (error) {
    // Don't fail for optional auth errors
    console.error('Optional auth error (ignored):', error.message);
    next();
  }
};

/**
 * Generate JWT token for investigator
 * @param {Object} investigator - Investigator object
 * @returns {string} JWT token
 */
const generateToken = (investigator) => {
  return jwt.sign(
    {
      id: investigator.id,
      email: investigator.email,
      role: investigator.role,
      department: investigator.department
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: 'whistlepro-backend',
      audience: 'whistlepro-frontend'
    }
  );
};

/**
 * Generate refresh token
 * @param {Object} investigator - Investigator object
 * @returns {string} Refresh token
 */
const generateRefreshToken = (investigator) => {
  return jwt.sign(
    {
      id: investigator.id,
      type: 'refresh'
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: 'whistlepro-backend',
      audience: 'whistlepro-frontend'
    }
  );
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  generateToken,
  generateRefreshToken
};