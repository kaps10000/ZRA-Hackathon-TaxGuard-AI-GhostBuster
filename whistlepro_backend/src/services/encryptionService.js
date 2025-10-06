const crypto = require('crypto');

class EncryptionService {
  constructor() {
    this.algorithm = process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm';
    this.secretKey = this.getSecretKey();
  }

  /**
   * Get or generate encryption key
   */
  getSecretKey() {
    let key = process.env.ENCRYPTION_KEY;
    
    if (!key) {
      console.warn('⚠️  ENCRYPTION_KEY not set in environment. Generating temporary key...');
      key = crypto.randomBytes(32).toString('hex');
    }
    
    // Ensure key is 32 bytes (256 bits) for AES-256
    if (typeof key === 'string') {
      if (key.length === 64) {
        // Hex string
        return Buffer.from(key, 'hex');
      } else if (key.length === 32) {
        // Raw string
        return Buffer.from(key, 'utf8');
      } else {
        // Hash to get consistent 32-byte key
        return crypto.createHash('sha256').update(key).digest();
      }
    }
    
    return key;
  }

  /**
   * Encrypt data using AES-256-GCM
   * @param {string} text - Text to encrypt
   * @returns {string} - Encrypted data with IV and auth tag
   */
  encrypt(text) {
    try {
      // Generate random IV
      const iv = crypto.randomBytes(16);
      
      // Create cipher
      const cipher = crypto.createCipher(this.algorithm, this.secretKey);
      cipher.setAAD(Buffer.from('whistlepro-zra-taxguard', 'utf8'));
      
      // Encrypt
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get authentication tag
      const authTag = cipher.getAuthTag();
      
      // Combine IV, auth tag, and encrypted data
      const combined = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
      
      return combined;
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   * @param {string} encryptedData - Encrypted data with IV and auth tag
   * @returns {string} - Decrypted text
   */
  decrypt(encryptedData) {
    try {
      // Split the combined data
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      // Create decipher
      const decipher = crypto.createDecipher(this.algorithm, this.secretKey);
      decipher.setAAD(Buffer.from('whistlepro-zra-taxguard', 'utf8'));
      decipher.setAuthTag(authTag);
      
      // Decrypt
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Hash sensitive data (like IPs) for privacy-preserving storage
   * @param {string} data - Data to hash
   * @param {string} salt - Optional salt (uses default if not provided)
   * @returns {string} - Hashed data
   */
  hashSensitiveData(data, salt = null) {
    if (!salt) {
      salt = process.env.IP_HASH_SECRET || 'whistlepro-default-salt';
    }
    
    return crypto
      .createHash('sha256')
      .update(data + salt)
      .digest('hex');
  }

  /**
   * Generate secure random token
   * @param {number} length - Length in bytes (default 32)
   * @returns {string} - Hex token
   */
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Create hash for blockchain storage
   * @param {Object} data - Data to hash
   * @returns {string} - SHA-256 hash
   */
  createBlockchainHash(data) {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }
}

// Export singleton instance
module.exports = new EncryptionService();