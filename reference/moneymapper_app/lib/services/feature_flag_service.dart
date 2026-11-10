import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class FeatureFlagService {
  static final FeatureFlagService _instance = FeatureFlagService._internal();
  factory FeatureFlagService() => _instance;
  FeatureFlagService._internal();

  Map<String, bool> _flags = {};
  bool _isInitialized = false;

  Future<void> fetchFlags() async {
    try {
      final response = await Supabase.instance.client
          .schema('public')
          .from('feature_flags')
          .select('feature_key, is_enabled');
      
      final Map<String, bool> newFlags = {};
      for (var item in response) {
        newFlags[item['feature_key'] as String] = item['is_enabled'] as bool;
      }
      _flags = newFlags;
      _isInitialized = true;
    } catch (e) {
      debugPrint("Failed to fetch feature flags: $e");
    }
  }

  bool isEnabled(String featureKey) {
    // If not fetched yet or key doesn't exist, default to TRUE so we don't break the app
    // if a flag is missing from the database.
    return _flags[featureKey] ?? true;
  }
  
  bool get isInitialized => _isInitialized;
}
