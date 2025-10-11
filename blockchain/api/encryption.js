const crypto = require('crypto');
const bcrypt = require('bcrypt');

// Use a 32-byte key for AES-256
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
    ? (process.env.ENCRYPTION_KEY.length === 32
        ? process.env.ENCRYPTION_KEY
        : crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY).digest())
    : crypto.randomBytes(32);
const IV_LENGTH = 16;

class EventEncryption {

    // Encrypt sensitive event data
    static encryptEventData(data) {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);

        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return {
            encrypted: encrypted,
            iv: iv.toString('hex'),
            hash: crypto.createHash('sha256').update(encrypted).digest('hex')
        };
    }

    // Decrypt event data
    static decryptEventData(encryptedData, ivHex) {
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);

        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return JSON.parse(decrypted);
    }
    
    // Create secure hash for blockchain storage
    static createSecureHash(data) {
        return crypto.createHash('sha256')
            .update(JSON.stringify(data) + Date.now())
            .digest('hex');
    }
    
    // Anonymize user ID with salt
    static anonymizeUserId(userId, salt = null) {
        if (!salt) {
            salt = crypto.randomBytes(16).toString('hex');
        }
        
        const hash = crypto.createHash('sha256')
            .update(userId + salt)
            .digest('hex');
            
        return {
            anonymizedId: hash.substring(0, 16),
            salt: salt
        };
    }
    
    // Verify data integrity
    static verifyIntegrity(data, expectedHash) {
        const actualHash = crypto.createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex');
            
        return actualHash === expectedHash;
    }
    
    // Generate secure API key
    static generateApiKey() {
        return crypto.randomBytes(32).toString('hex');
    }
    
    // Hash API key for storage
    static async hashApiKey(apiKey) {
        return await bcrypt.hash(apiKey, 12);
    }
    
    // Verify API key
    static async verifyApiKey(apiKey, hashedKey) {
        return await bcrypt.compare(apiKey, hashedKey);
    }
}

// Middleware for API key authentication
const authenticateApiKey = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
        return res.status(401).json({
            error: 'API key required',
            message: 'Include X-API-Key header'
        });
    }
    
    // In production, verify against database
    const validKey = process.env.API_KEY || 'taxguard-dev-key-2025';
    
    if (apiKey !== validKey) {
        return res.status(403).json({
            error: 'Invalid API key'
        });
    }
    
    next();
};

module.exports = {
    EventEncryption,
    authenticateApiKey
};
