const encryptionService = require('../services/encryptionService');
const auditService = require('../services/auditService');

/**
 * Sanitize user input to prevent injection attacks
 */
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove potentially dangerous characters and patterns
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/javascript:/gi, '') // Remove javascript: protocols
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .replace(/data:text\/html/gi, '') // Remove data URLs
        .trim();
    } else if (Array.isArray(obj)) {
      return obj.map(item => sanitize(item));
    } else if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          // Sanitize both key and value
          const cleanKey = key.replace(/[^\w\s-_]/g, '');
          sanitized[cleanKey] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitize(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitize(req.query);
  }

  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

/**
 * Prevent XSS attacks by setting security headers
 */
const preventXSS = (req, res, next) => {
  // Set XSS protection headers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self'; " +
    "font-src 'self'; " +
    "object-src 'none'; " +
    "media-src 'self'; " +
    "frame-src 'none';"
  );

  next();
};

/**
 * Scrub sensitive metadata from requests for anonymous submissions
 */
const scrubMetadata = (req, res, next) => {
  // Store original IP and User-Agent for rate limiting (hashed)
  const originalIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
  const originalUA = req.headers['user-agent'];

  if (originalIP) {
    req.hashedIP = encryptionService.hashSensitiveData(originalIP);
  }

  if (originalUA) {
    req.hashedUserAgent = encryptionService.hashSensitiveData(originalUA);
  }

  // Remove identifying headers for anonymous routes
  if (req.path.includes('/reports') && req.method === 'POST') {
    // Don't log these headers in access logs for anonymous submissions
    req.headers['x-forwarded-for'] = '[REDACTED]';
    req.headers['user-agent'] = '[REDACTED]';
    req.headers['referer'] = '[REDACTED]';
    req.headers['accept-language'] = '[REDACTED]';
  }

  next();
};

/**
 * Detect and prevent common attack patterns
 */
const detectAttacks = (req, res, next) => {
  const suspiciousPatterns = [
    /(\b)(on\w+)(\s*)=|javascript:|(<\s*)(\/*)script/gi, // XSS
    /((\%3C)|<)((\%2F)|\/)*[a-z0-9\%]+((\%3E)|>)/gi, // HTML injection
    /((\%27)|(\'))|(--)|(;)/gi, // SQL injection
    /\b(union|select|insert|delete|update|drop|create|alter|exec|execute)\b/gi, // SQL commands
    /../gi, // Path traversal
    /\$\{.*\}/gi // Expression injection
  ];

  const checkForSuspiciousContent = (content) => {
    if (typeof content !== 'string') return false;
    return suspiciousPatterns.some(pattern => pattern.test(content));
  };

  const checkObject = (obj, path = '') => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const currentPath = path ? `${path}.${key}` : key;

        if (typeof value === 'string' && checkForSuspiciousContent(value)) {
          return { detected: true, field: currentPath, pattern: value };
        } else if (typeof value === 'object' && value !== null) {
          const result = checkObject(value, currentPath);
          if (result.detected) return result;
        }
      }
    }
    return { detected: false };
  };

  // Check request body
  if (req.body) {
    const bodyCheck = checkObject(req.body);
    if (bodyCheck.detected) {
      auditService.logSecurityEvent({
        event_type: 'attack_detected',
        severity: 'high',
        description: `Suspicious content detected in ${bodyCheck.field}`,
        ip_hash: req.hashedIP,
        user_agent_hash: req.hashedUserAgent,
        metadata: {
          endpoint: req.path,
          method: req.method,
          field: bodyCheck.field,
          pattern: bodyCheck.pattern.substring(0, 100) // Truncate for logging
        }
      });

      return res.status(400).json({
        error: 'Invalid input detected',
        message: 'Your request contains potentially harmful content',
        code: 'SECURITY_VIOLATION'
      });
    }
  }

  // Check query parameters
  if (req.query) {
    const queryCheck = checkObject(req.query);
    if (queryCheck.detected) {
      auditService.logSecurityEvent({
        event_type: 'attack_detected',
        severity: 'medium',
        description: `Suspicious query parameter: ${queryCheck.field}`,
        ip_hash: req.hashedIP,
        user_agent_hash: req.hashedUserAgent,
        metadata: {
          endpoint: req.path,
          method: req.method,
          field: queryCheck.field
        }
      });

      return res.status(400).json({
        error: 'Invalid query parameters',
        message: 'Your request contains potentially harmful content',
        code: 'SECURITY_VIOLATION'
      });
    }
  }

  next();
};

/**
 * Log security events for monitoring
 */
const logSecurityEvents = (req, res, next) => {
  // Log failed authentication attempts
  res.on('finish', () => {
    if (res.statusCode === 401 && req.path.includes('/auth')) {
      auditService.logSecurityEvent({
        event_type: 'failed_authentication',
        severity: 'medium',
        description: 'Failed login attempt',
        ip_hash: req.hashedIP,
        user_agent_hash: req.hashedUserAgent,
        metadata: {
          endpoint: req.path,
          method: req.method,
          email: req.body?.email || 'unknown'
        }
      });
    }

    // Log rate limit violations
    if (res.statusCode === 429) {
      auditService.logSecurityEvent({
        event_type: 'rate_limit_exceeded',
        severity: 'medium',
        description: 'Rate limit exceeded',
        ip_hash: req.hashedIP,
        user_agent_hash: req.hashedUserAgent,
        metadata: {
          endpoint: req.path,
          method: req.method
        }
      });
    }
  });

  next();
};

module.exports = {
  sanitizeInput,
  preventXSS,
  scrubMetadata,
  detectAttacks,
  logSecurityEvents
};