import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Secure Supabase Local Storage implementation backed by Android Keystore (EncryptedSharedPreferences)
/// and iOS Keychain via [FlutterSecureStorage].
class SecureSupabaseStorage extends LocalStorage {
  static const String _persistedSessionKey = 'supabase.auth.token';

  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock,
    ),
  );

  @override
  Future<void> initialize() async {
    // No-op for FlutterSecureStorage as it initializes lazily on operation
  }

  @override
  Future<bool> hasAccessToken() async {
    final token = await accessToken();
    return token != null && token.isNotEmpty;
  }

  @override
  Future<String?> accessToken() async {
    return await getString(_persistedSessionKey);
  }

  @override
  Future<void> persistSession(String persistSessionString) async {
    await setString(_persistedSessionKey, persistSessionString);
  }

  @override
  Future<void> removePersistedSession() async {
    await remove(_persistedSessionKey);
  }

  Future<bool> hasKey(String key) async {
    return await _storage.containsKey(key: key);
  }

  Future<String?> getString(String key) async {
    return await _storage.read(key: key);
  }

  Future<void> setString(String key, String value) async {
    await _storage.write(key: key, value: value);
  }

  Future<void> remove(String key) async {
    await _storage.delete(key: key);
  }
}
