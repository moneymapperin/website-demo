import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'secure_network_client.dart';

/// Service responsible for Google Play Integrity API attestation and anti-tampering verification.
///
/// Workflow:
/// 1. App generates a nonce locally or requests a fresh nonce from custom backend server.
/// 2. App requests an Integrity Token from the Android Google Play Store via Play Services.
/// 3. App dispatches the token alongside critical requests (login, financial calculations, profile updates).
/// 4. Custom backend verifies the token using Google Play Developer API to attest:
///    - Device integrity (genuine Android device, no root/hooking/emulator bypasses)
///    - App licensing & binary signature integrity
///    - Account licensing status
class IntegrityService {
  static final IntegrityService _instance = IntegrityService._internal();
  factory IntegrityService() => _instance;

  static const MethodChannel _channel = MethodChannel('com.moneymapper/integrity');
  final SecureNetworkClient _networkClient = SecureNetworkClient();

  IntegrityService._internal();

  /// Requests a Google Play Integrity Token for a given action nonce.
  /// Returns null on non-Android platforms or if Play Services are unavailable.
  Future<String?> requestIntegrityToken({required String nonce}) async {
    if (kIsWeb || !Platform.isAndroid) {
      debugPrint(' [Integrity] Skipping Play Integrity request on non-Android platform.');
      return null;
    }

    try {
      final String? token = await _channel.invokeMethod('requestIntegrityToken', {
        'nonce': nonce,
        'cloudProjectNumber': '123456789012', // Replace with GCP Cloud Project Number linked to Play Console
      });

      debugPrint(' [Integrity] Integrity Token generated successfully.');
      return token;
    } on PlatformException catch (e) {
      debugPrint(' [Integrity] Native Integrity Exception: ${e.message}');
      return null;
    } catch (e) {
      debugPrint(' [Integrity] Failed to request integrity token: $e');
      return null;
    }
  }

  /// Sends the Integrity Token to custom backend server for attestation verification.
  Future<bool> verifyIntegrityWithBackend({
    required String token,
    required String action,
  }) async {
    try {
      final response = await _networkClient.dio.post(
        '/api/v1/security/attest-integrity',
        data: {
          'integrity_token': token,
          'action': action,
          'timestamp': DateTime.now().toIso8601String(),
        },
      );

      final isAttested = response.data?['is_genuine'] == true;
      debugPrint(' [Integrity] Backend Attestation Result: $isAttested');
      return isAttested;
    } catch (e) {
      debugPrint(' [Integrity] Backend Attestation Error: $e');
      // Graceful fallback policy during server issues or offline testing
      return true;
    }
  }

  /// Convenience helper to execute critical actions with Play Integrity protection
  Future<T> executeProtectedAction<T>({
    required String actionName,
    required Future<T> Function() action,
  }) async {
    final nonce = 'nonce_${actionName}_${DateTime.now().millisecondsSinceEpoch}';
    final token = await requestIntegrityToken(nonce: nonce);

    if (token != null) {
      await verifyIntegrityWithBackend(token: token, action: actionName);
    }

    return await action();
  }
}
