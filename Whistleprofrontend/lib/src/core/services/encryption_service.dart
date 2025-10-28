import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';
import 'package:crypto/crypto.dart';
import 'package:pointycastle/export.dart';

/// AES-256-GCM Encryption Service for WhistlePro
/// Provides military-grade encryption for sensitive report data
class EncryptionService {
  static final EncryptionService _instance = EncryptionService._internal();
  factory EncryptionService() => _instance;
  EncryptionService._internal();

  static const int _keySize = 32; // 256 bits
  static const int _nonceSize = 12; // 96 bits (recommended for GCM)
  static const int _macSize = 16; // 128 bits

  /// Generate a random encryption key (256-bit)
  Uint8List generateKey() {
    final random = Random.secure();
    return Uint8List.fromList(
      List<int>.generate(_keySize, (i) => random.nextInt(256)),
    );
  }

  /// Generate a random nonce/IV (96-bit for GCM)
  Uint8List _generateNonce() {
    final random = Random.secure();
    return Uint8List.fromList(
      List<int>.generate(_nonceSize, (i) => random.nextInt(256)),
    );
  }

  /// Generate Anonymous Case ID from key
  String generateCaseId(Uint8List key) {
    final hash = sha256.convert(key);
    final caseId = hash.toString().substring(0, 16).toUpperCase();
    // Format: XXXX-XXXX-XXXX-XXXX
    return '${caseId.substring(0, 4)}-${caseId.substring(4, 8)}-${caseId.substring(8, 12)}-${caseId.substring(12, 16)}';
  }

  /// Encrypt data using AES-256-GCM
  /// Returns: base64(nonce + ciphertext + mac)
  String encrypt(String plainText, Uint8List key) {
    try {
      if (key.length != _keySize) {
        throw Exception('Invalid key size. Expected $_keySize bytes.');
      }

      // Generate random nonce
      final nonce = _generateNonce();

      // Convert plaintext to bytes
      final plainBytes = utf8.encode(plainText);

      // Initialize AES-GCM cipher
      final cipher = GCMBlockCipher(AESEngine())
        ..init(
          true, // true = encrypt
          AEADParameters(
            KeyParameter(key),
            _macSize * 8, // MAC size in bits
            nonce,
            Uint8List(0), // No additional authenticated data
          ),
        );

      // Encrypt
      final cipherText = cipher.process(Uint8List.fromList(plainBytes));

      // Combine nonce + ciphertext (ciphertext already includes MAC from GCM)
      final combined = Uint8List(_nonceSize + cipherText.length);
      combined.setRange(0, _nonceSize, nonce);
      combined.setRange(_nonceSize, combined.length, cipherText);

      // Return as base64
      return base64.encode(combined);
    } catch (e) {
      throw Exception('Encryption failed: $e');
    }
  }

  /// Decrypt data using AES-256-GCM
  /// Input: base64(nonce + ciphertext + mac)
  String decrypt(String encryptedText, Uint8List key) {
    try {
      if (key.length != _keySize) {
        throw Exception('Invalid key size. Expected $_keySize bytes.');
      }

      // Decode from base64
      final combined = base64.decode(encryptedText);

      if (combined.length < _nonceSize + _macSize) {
        throw Exception('Invalid encrypted data format');
      }

      // Extract nonce and ciphertext
      final nonce = combined.sublist(0, _nonceSize);
      final cipherText = combined.sublist(_nonceSize);

      // Initialize AES-GCM cipher
      final cipher = GCMBlockCipher(AESEngine())
        ..init(
          false, // false = decrypt
          AEADParameters(
            KeyParameter(key),
            _macSize * 8, // MAC size in bits
            nonce,
            Uint8List(0), // No additional authenticated data
          ),
        );

      // Decrypt
      final plainBytes = cipher.process(cipherText);

      // Convert to string
      return utf8.decode(plainBytes);
    } catch (e) {
      throw Exception('Decryption failed: $e');
    }
  }

  /// Encrypt a JSON object
  String encryptJson(Map<String, dynamic> json, Uint8List key) {
    final jsonString = jsonEncode(json);
    return encrypt(jsonString, key);
  }

  /// Decrypt a JSON object
  Map<String, dynamic> decryptJson(String encryptedText, Uint8List key) {
    final jsonString = decrypt(encryptedText, key);
    return jsonDecode(jsonString) as Map<String, dynamic>;
  }

  /// Hash data (for integrity checks)
  String hashData(String data) {
    final bytes = utf8.encode(data);
    final hash = sha256.convert(bytes);
    return hash.toString();
  }

  /// Verify hash
  bool verifyHash(String data, String expectedHash) {
    final actualHash = hashData(data);
    return actualHash == expectedHash;
  }
}
