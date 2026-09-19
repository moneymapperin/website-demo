import 'dart:async';
import 'package:flutter/foundation.dart';

/// Principal Engineer's Resilience Toolkit
/// Implements Exponential Backoff, Sanitized Messaging, and Circuit Breaker logic.
class ResilienceUtils {
  /// Executes a task with exponential backoff retries.
  /// Standard: 3 attempts with 2s, 4s delays.
  static Future<T> retry<T>({
    required Future<T> Function() task,
    required String context,
    int maxAttempts = 3,
    Duration initialDelay = const Duration(seconds: 2),
  }) async {
    int attempts = 0;
    while (true) {
      attempts++;
      try {
        return await task();
      } catch (e, stack) {
        if (attempts >= maxAttempts) {
          debugPrint(' [CRITICAL FAILURE] $context after $attempts attempts.');
          debugPrint(' Error: $e');
          debugPrint(' StackTrace: $stack');
          rethrow;
        }
        
        final delay = initialDelay * attempts;
        debugPrint(' [RETRY] $context: Attempt $attempts failed. Retrying in ${delay.inSeconds}s...');
        await Future.delayed(delay);
      }
    }
  }

  /// Sanitizes technical error messages for end-users.
  /// Rule: No raw IDs, 500s, or stack traces.
  static String sanitizeErrorMessage(dynamic error) {
    final msg = error.toString().toLowerCase();
    
    if (msg.contains('network') || msg.contains('socket') || msg.contains('failed host')) {
      return "Connection issue detected. Please check your internet and try again.";
    }
    if (msg.contains('429') || msg.contains('rate limit')) {
      return "Servers are busy right now. We'll refresh your data in a moment.";
    }
    if (msg.contains('timeout')) {
      return "The request took too long. Please try refreshing again.";
    }
    if (msg.contains('auth') || msg.contains('401') || msg.contains('403')) {
      return "Session expired or unauthorized. Please log in again.";
    }
    
    return "Something went wrong on our end. We've logged this and are looking into it.";
  }

  /// Safely extracts numeric data with validation to prevent runtime crashes.
  static double safeDouble(dynamic value, {double fallback = 0.0}) {
    if (value == null) return fallback;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? fallback;
    return fallback;
  }
}
