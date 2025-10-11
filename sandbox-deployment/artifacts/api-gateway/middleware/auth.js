const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        logger.warn('Authentication Failed - No Token', {
            ip: req.ip,
            url: req.url,
            timestamp: new Date().toISOString()
        });
        return res.status(401).json({
            error: 'Access denied',
            message: 'No token provided'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            logger.warn('Authentication Failed - Invalid Token', {
                ip: req.ip,
                url: req.url,
                error: err.message,
                timestamp: new Date().toISOString()
            });
            return res.status(403).json({
                error: 'Invalid token',
                message: 'Token verification failed'
            });
        }

        req.user = user;
        logger.info('Authentication Success', {
            userId: user.id,
            role: user.role,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });
        next();
    });
};

// Role-based authorization middleware
const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'Please authenticate first'
            });
        }

        if (!roles.includes(req.user.role)) {
            logger.warn('Authorization Failed', {
                userId: req.user.id,
                userRole: req.user.role,
                requiredRoles: roles,
                url: req.url,
                timestamp: new Date().toISOString()
            });
            return res.status(403).json({
                error: 'Insufficient permissions',
                message: `Required role: ${roles.join(' or ')}`,
                userRole: req.user.role
            });
        }

        next();
    };
};

// mTLS Certificate validation (simplified)
const validateClientCertificate = (req, res, next) => {
    const clientCert = req.headers['x-client-cert'];
    
    if (!clientCert) {
        logger.warn('mTLS Validation Failed - No Certificate', {
            ip: req.ip,
            url: req.url,
            timestamp: new Date().toISOString()
        });
        return res.status(401).json({
            error: 'Client certificate required',
            message: 'mTLS authentication failed'
        });
    }

    // In production, implement proper certificate validation
    // For demo purposes, we'll accept any certificate
    logger.info('mTLS Certificate Validated', {
        ip: req.ip,
        certificate: clientCert.substring(0, 50) + '...',
        timestamp: new Date().toISOString()
    });
    
    next();
};

module.exports = {
    authenticateToken,
    authorizeRole,
    validateClientCertificate
};
