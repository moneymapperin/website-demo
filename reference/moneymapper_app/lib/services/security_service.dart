import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:local_auth/local_auth.dart';

class SecurityService {
  static const _channel = MethodChannel('com.moneymapper/security');
  static const _appLockKey = 'app_lock_enabled_v1';
  
  static final SecurityService _instance = SecurityService._internal();
  
  factory SecurityService() => _instance;
  SecurityService._internal();

  final LocalAuthentication _localAuth = LocalAuthentication();
  bool _isSecure = true;
  bool get isSecure => _isSecure;

  /// Initializes security by checking the user's admin status and secure_flag.
  /// Defaults to secure if not an admin or if secure_flag is true.
  Future<void> syncSecurityStatus() async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) {
        await _updateSecurity(true);
        return;
      }

      final email = user.email?.trim().toLowerCase();
      if (email == null) {
        await _updateSecurity(true);
        return;
      }

      // Query public.corporate_admins for secure_flag
      final adminData = await Supabase.instance.client
          .from('corporate_admins')
          .select('secure_flag')
          .ilike('admin_email', email)
          .maybeSingle();

      if (adminData != null && adminData['secure_flag'] == false) {
        // User is an admin and security is explicitly disabled for them
        await _updateSecurity(false);
      } else {
        // Not an admin or secure_flag is true (default security)
        await _updateSecurity(true);
      }
    } catch (e) {
      debugPrint('SecurityService Error: $e');
      // Fallback to secure on error
      await _updateSecurity(true);
    }
  }

  Future<void> _updateSecurity(bool secure) async {
    if (_isSecure == secure) return;
    _isSecure = secure;
    
    try {
      await _channel.invokeMethod('setSecure', {'isSecure': secure});
      debugPrint('Security Status Updated: isSecure = $secure');
    } catch (e) {
      debugPrint('Failed to set native security flag: $e');
    }
  }

  /// Forces security ON (useful for logout)
  Future<void> reset() async {
    await _updateSecurity(true);
  }

  // --- App Lock / Biometrics (Restored) ---

  Future<bool> isAppLockEnabled() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_appLockKey) ?? false;
  }

  Future<void> setAppLockEnabled(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_appLockKey, enabled);
  }

  Future<bool> authenticate() async {
    try {
      final bool canAuthenticateWithBiometrics = await _localAuth.canCheckBiometrics;
      final bool canAuthenticate = canAuthenticateWithBiometrics || await _localAuth.isDeviceSupported();

      if (!canAuthenticate) return false;

      return await _localAuth.authenticate(
        localizedReason: 'Please authenticate to access MoneyMapper',
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: false,
        ),
      );
    } on PlatformException catch (e) {
      debugPrint("Auth Error: $e");
      return false;
    } catch (e) {
      debugPrint("Unexpected Auth Error: $e");
      return false;
    }
  }
}
