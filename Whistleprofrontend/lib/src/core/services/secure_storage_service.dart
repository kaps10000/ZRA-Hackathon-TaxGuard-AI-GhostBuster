import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants.dart';

class SecureStorageService {
  static final SecureStorageService _instance = SecureStorageService._internal();
  factory SecureStorageService() => _instance;
  SecureStorageService._internal();

  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock,
    ),
  );

  // Save encryption key
  Future<void> saveEncryptionKey(Uint8List key) async {
    final keyString = base64.encode(key);
    await _storage.write(
      key: AppConstants.encryptionKeyKey,
      value: keyString,
    );
  }

  // Retrieve encryption key
  Future<Uint8List?> getEncryptionKey() async {
    final keyString = await _storage.read(key: AppConstants.encryptionKeyKey);
    if (keyString == null) return null;
    return base64.decode(keyString);
  }

  // Save generic data
  Future<void> saveData(String key, String value) async {
    await _storage.write(key: key, value: value);
  }

  // Retrieve generic data
  Future<String?> getData(String key) async {
    return await _storage.read(key: key);
  }

  // Save JSON data
  Future<void> saveJson(String key, Map<String, dynamic> json) async {
    final jsonString = jsonEncode(json);
    await _storage.write(key: key, value: jsonString);
  }

  // Retrieve JSON data
  Future<Map<String, dynamic>?> getJson(String key) async {
    final jsonString = await _storage.read(key: key);
    if (jsonString == null) return null;
    return jsonDecode(jsonString) as Map<String, dynamic>;
  }

  // Delete specific key
  Future<void> deleteKey(String key) async {
    await _storage.delete(key: key);
  }

  // Clear all data (use with caution!)
  Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}