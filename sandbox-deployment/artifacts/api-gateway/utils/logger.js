const winston = require('winston');
const axios = require('axios');

// Custom SIEM transport
class SIEMTransport extends winston.Transport {
    constructor(options) {
        super(options);
        this.siemEndpoint = options.siemEndpoint || process.env.SIEM_ENDPOINT;
    }

    log(info, callback) {
        setImmediate(() => {
            this.emit('logged', info);
        });

        // Send to SIEM system
        if (this.siemEndpoint) {
            this.sendToSIEM(info).catch(err => {
                console.error('Failed to send log to SIEM:', err.message);
            });
        }

        callback();
    }

    async sendToSIEM(logData) {
        try {
            const siemPayload = {
                timestamp: new Date().toISOString(),
                service: 'taxguard-api-gateway',
                level: logData.level,
                message: logData.message,
                metadata: logData,
                source: 'api-gateway',
                environment: process.env.NODE_ENV || 'development'
            };

            await axios.post(this.siemEndpoint, siemPayload, {
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': process.env.SIEM_API_KEY || 'demo-key'
                }
            });
        } catch (error) {
            // Fail silently to avoid breaking the application
            console.error('SIEM logging failed:', error.message);
        }
    }
}

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: {
        service: 'taxguard-api-gateway',
        version: '1.0.0'
    },
    transports: [
        // File transport for local logging
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // SIEM transport for security monitoring
        new SIEMTransport({
            level: 'info',
            siemEndpoint: process.env.SIEM_ENDPOINT
        })
    ]
});

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Security event logging helpers
logger.security = {
    authSuccess: (data) => logger.info('AUTH_SUCCESS', { ...data, eventType: 'authentication' }),
    authFailure: (data) => logger.warn('AUTH_FAILURE', { ...data, eventType: 'authentication' }),
    accessDenied: (data) => logger.warn('ACCESS_DENIED', { ...data, eventType: 'authorization' }),
    suspiciousActivity: (data) => logger.error('SUSPICIOUS_ACTIVITY', { ...data, eventType: 'security' }),
    dataAccess: (data) => logger.info('DATA_ACCESS', { ...data, eventType: 'data_access' }),
    apiCall: (data) => logger.info('API_CALL', { ...data, eventType: 'api_usage' })
};

module.exports = logger;
