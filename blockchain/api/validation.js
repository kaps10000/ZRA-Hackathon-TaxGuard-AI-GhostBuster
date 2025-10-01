// Input validation and security middleware

const crypto = require('crypto');

// Validate event data
const validateEvent = (req, res, next) => {
    const { eventType, anonymizedUserId, hashOfPayload, notes } = req.body;
    
    // Required fields
    if (!eventType || !anonymizedUserId || !hashOfPayload) {
        return res.status(400).json({
            error: 'Missing required fields',
            required: ['eventType', 'anonymizedUserId', 'hashOfPayload']
        });
    }
    
    // Validate event type
    const validTypes = ['filing', 'payment', 'auditFlag', 'adminChange', 'compliance', 'whistleblower'];
    if (!validTypes.includes(eventType)) {
        return res.status(400).json({
            error: 'Invalid eventType',
            validTypes
        });
    }
    
    // Validate hash format (should be hex)
    if (!/^[a-fA-F0-9]+$/.test(hashOfPayload)) {
        return res.status(400).json({
            error: 'Invalid hash format. Must be hexadecimal.'
        });
    }
    
    // Validate notes length
    if (notes && notes.length > 1000) {
        return res.status(400).json({
            error: 'Notes too long. Maximum 1000 characters.'
        });
    }
    
    next();
};

// Rate limiting (simple implementation)
const rateLimiter = (() => {
    const requests = new Map();
    
    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        const windowMs = 60000; // 1 minute
        const maxRequests = 100;
        
        if (!requests.has(ip)) {
            requests.set(ip, []);
        }
        
        const userRequests = requests.get(ip);
        const recentRequests = userRequests.filter(time => now - time < windowMs);
        
        if (recentRequests.length >= maxRequests) {
            return res.status(429).json({
                error: 'Too many requests. Please try again later.'
            });
        }
        
        recentRequests.push(now);
        requests.set(ip, recentRequests);
        next();
    };
})();

// Security headers
const securityHeaders = (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
};

module.exports = {
    validateEvent,
    rateLimiter,
    securityHeaders
};
