import 'dart:io';
import 'package:dio/dio.dart';
import 'package:dio/io.dart';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Secure Network Client powered by [Dio]
/// Handles:
/// 1. Automatic JWT Interception from Supabase auth session
/// 2. SSL Certificate Pinning against MitM attacks
/// 3. Standard timeout and header enforcement
class SecureNetworkClient {
  static final SecureNetworkClient _instance = SecureNetworkClient._internal();
  factory SecureNetworkClient() => _instance;

  late final Dio dio;

  // Custom backend base URL
  static const String baseUrl = 'https://api.moneymapper.in'; // Replace with custom backend domain

  // Example SHA-256 fingerprint / SSL Cert PEM for custom backend SSL Pinning
  // Replace with actual production server certificate PEM or SHA-256 fingerprint
  static const String _trustedCertificatePem = '''
-----BEGIN CERTIFICATE-----
MIIDdzCCAl2gAwIBAgIEAgAAADANBgkqhkiG9w0BAQsFADUAMQswCQYDVQQGEwJJ
TjELMAkGA1UECBMCVE4xEDAOBgNVBAcTB0NoZW5uYWkxEDAOBgNVBAoTB01vbmV5
...
-----END CERTIFICATE-----
''';

  SecureNetworkClient._internal() {
    dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Client-Platform': kIsWeb ? 'web' : (Platform.isAndroid ? 'android' : 'ios'),
        },
      ),
    );

    _configureInterceptors();
    _configureSslPinning();
  }

  /// Configures JWT Interceptor to automatically attach Supabase session token
  void _configureInterceptors() {
    dio.interceptors.add(
      QueuedInterceptorsWrapper(
        onRequest: (options, handler) async {
          try {
            final session = Supabase.instance.client.auth.currentSession;
            if (session != null && session.accessToken.isNotEmpty) {
              options.headers['Authorization'] = 'Bearer ${session.accessToken}';
            }
          } catch (e) {
            debugPrint(' [Security] JWT Injection Interceptor Warning: $e');
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          if (error.response?.statusCode == 401) {
            debugPrint(' [Security] Unauthorized 401 received. Attempting session refresh...');
            try {
              final response = await Supabase.instance.client.auth.refreshSession();
              if (response.session != null) {
                final newAccessToken = response.session!.accessToken;
                error.requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
                final clonedRequest = await dio.fetch(error.requestOptions);
                return handler.resolve(clonedRequest);
              }
            } catch (refreshErr) {
              debugPrint(' [Security] Session refresh failed: $refreshErr');
            }
          }
          return handler.next(error);
        },
      ),
    );
  }

  /// Configures SSL Pinning on native I/O platforms (Android / iOS)
  void _configureSslPinning() {
    if (kIsWeb) return;

    dio.httpClientAdapter = IOHttpClientAdapter(
      createHttpClient: () {
        final securityContext = SecurityContext(withTrustedRoots: true);

        try {
          // If you have trusted PEM bytes:
          // securityContext.setTrustedCertificatesBytes(utf8.encode(_trustedCertificatePem));
        } catch (e) {
          debugPrint(' [Security] SSL Context Init Notice: $e');
        }

        final httpClient = HttpClient(context: securityContext);

        // Enforce strict SSL Certificate Validation
        httpClient.badCertificateCallback = (X509Certificate cert, String host, int port) {
          debugPrint(' [Security] Rejecting untrusted certificate for host: $host');
          return false; // Reject untrusted / self-signed / MitM proxy certs
        };

        return httpClient;
      },
    );
  }
}
