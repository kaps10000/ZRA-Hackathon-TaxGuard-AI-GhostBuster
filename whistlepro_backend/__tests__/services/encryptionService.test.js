const encryptionService = require('../../src/services/encryptionService');

describe('Encryption Service', () => {
  describe('encrypt() and decrypt()', () => {
    it('should encrypt and decrypt data correctly', () => {
      const originalText = 'This is sensitive whistleblower data';
      const encrypted = encryptionService.encrypt(originalText);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(originalText);
    });

    it('should produce different ciphertext for same input (due to random IV)', () => {
      const text = 'Same input text';
      const encrypted1 = encryptionService.encrypt(text);
      const encrypted2 = encryptionService.encrypt(text);

      expect(encrypted1).not.toBe(encrypted2); // Different IVs
      expect(encryptionService.decrypt(encrypted1)).toBe(text);
      expect(encryptionService.decrypt(encrypted2)).toBe(text);
    });

    it('should encrypt JSON objects as strings', () => {
      const obj = {
        title: 'Tax Evasion Report',
        amount: 1000000,
        nested: { key: 'value' }
      };

      const encrypted = encryptionService.encrypt(JSON.stringify(obj));
      const decrypted = JSON.parse(encryptionService.decrypt(encrypted));

      expect(decrypted).toEqual(obj);
    });

    it('should handle empty strings', () => {
      const encrypted = encryptionService.encrypt('');
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe('');
    });

    it('should handle long texts', () => {
      const longText = 'A'.repeat(10000);
      const encrypted = encryptionService.encrypt(longText);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(longText);
      expect(decrypted.length).toBe(10000);
    });

    it('should handle special characters and Unicode', () => {
      const specialText = '¡Hola! 你好 🚀 Special chars: @#$%^&*()';
      const encrypted = encryptionService.encrypt(specialText);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(specialText);
    });
  });

  describe('encrypt() format', () => {
    it('should return encrypted data in format: IV:AuthTag:Ciphertext', () => {
      const encrypted = encryptionService.encrypt('test');
      const parts = encrypted.split(':');

      expect(parts).toHaveLength(3);
      expect(parts[0]).toHaveLength(32); // IV hex (16 bytes = 32 hex chars)
      expect(parts[1]).toHaveLength(32); // Auth tag hex (16 bytes = 32 hex chars)
      expect(parts[2].length).toBeGreaterThan(0); // Ciphertext
    });
  });

  describe('decrypt() error handling', () => {
    it('should throw error for invalid format', () => {
      expect(() => {
        encryptionService.decrypt('invalid:format');
      }).toThrow('Invalid encrypted data format');
    });

    it('should throw error for tampered ciphertext', () => {
      const encrypted = encryptionService.encrypt('original text');
      const parts = encrypted.split(':');
      const tampered = parts[0] + ':' + parts[1] + ':' + 'TAMPERED';

      expect(() => {
        encryptionService.decrypt(tampered);
      }).toThrow();
    });

    it('should throw error for tampered auth tag', () => {
      const encrypted = encryptionService.encrypt('original text');
      const parts = encrypted.split(':');
      const tampered = parts[0] + ':' + '00000000000000000000000000000000' + ':' + parts[2];

      expect(() => {
        encryptionService.decrypt(tampered);
      }).toThrow();
    });
  });

  describe('hashSensitiveData()', () => {
    it('should hash data consistently', () => {
      const data = '192.168.1.1';
      const hash1 = encryptionService.hashSensitiveData(data);
      const hash2 = encryptionService.hashSensitiveData(data);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex chars
    });

    it('should produce different hashes for different data', () => {
      const hash1 = encryptionService.hashSensitiveData('192.168.1.1');
      const hash2 = encryptionService.hashSensitiveData('192.168.1.2');

      expect(hash1).not.toBe(hash2);
    });

    it('should include salt in hashing', () => {
      const data = 'test-ip-address';
      const hashWithDefaultSalt = encryptionService.hashSensitiveData(data);
      const hashWithCustomSalt = encryptionService.hashSensitiveData(data, 'custom-salt');

      expect(hashWithDefaultSalt).not.toBe(hashWithCustomSalt);
    });

    it('should be deterministic with same salt', () => {
      const data = 'test-data';
      const salt = 'my-salt';

      const hash1 = encryptionService.hashSensitiveData(data, salt);
      const hash2 = encryptionService.hashSensitiveData(data, salt);

      expect(hash1).toBe(hash2);
    });
  });

  describe('generateSecureToken()', () => {
    it('should generate random token of default length (32 bytes = 64 hex chars)', () => {
      const token = encryptionService.generateSecureToken();

      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[a-f0-9]+$/);
    });

    it('should generate tokens of custom length', () => {
      const token16 = encryptionService.generateSecureToken(16);
      const token64 = encryptionService.generateSecureToken(64);

      expect(token16).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(token64).toHaveLength(128); // 64 bytes = 128 hex chars
    });

    it('should generate unique tokens', () => {
      const tokens = new Set();
      for (let i = 0; i < 100; i++) {
        tokens.add(encryptionService.generateSecureToken());
      }

      expect(tokens.size).toBe(100); // All should be unique
    });
  });

  describe('createBlockchainHash()', () => {
    it('should create SHA-256 hash from object', () => {
      const data = {
        case_id: 'ZRA-2025-A1B2C3',
        timestamp: '2025-10-11',
        category: 'tax_evasion'
      };

      const hash = encryptionService.createBlockchainHash(data);

      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });

    it('should be deterministic for same input', () => {
      const data = { id: 123, value: 'test' };

      const hash1 = encryptionService.createBlockchainHash(data);
      const hash2 = encryptionService.createBlockchainHash(data);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different data', () => {
      const data1 = { id: 1 };
      const data2 = { id: 2 };

      const hash1 = encryptionService.createBlockchainHash(data1);
      const hash2 = encryptionService.createBlockchainHash(data2);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle complex nested objects', () => {
      const complexData = {
        report: {
          id: 123,
          subjects: {
            organizations: [
              { name: 'Company A', tpin: '1234567890' }
            ]
          },
          evidence: {
            financial: { amount: 500000, currency: 'ZMW' }
          }
        }
      };

      const hash = encryptionService.createBlockchainHash(complexData);

      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });
  });

  describe('Security Properties', () => {
    it('should use strong encryption (AES-256-GCM)', () => {
      expect(encryptionService.algorithm).toBe('aes-256-gcm');
    });

    it('should have a secret key of appropriate length', () => {
      expect(encryptionService.secretKey).toBeTruthy();
      expect(encryptionService.secretKey.length).toBe(32); // 256 bits
    });

    it('should provide authenticated encryption (prevents tampering)', () => {
      const text = 'Important data';
      const encrypted = encryptionService.encrypt(text);

      // Try to modify just one character
      const modified = encrypted.substring(0, encrypted.length - 1) + 'X';

      expect(() => {
        encryptionService.decrypt(modified);
      }).toThrow();
    });
  });
});
