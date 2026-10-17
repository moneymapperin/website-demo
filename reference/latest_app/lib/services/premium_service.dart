import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'auth_service.dart';
import 'api_service.dart';

class PremiumService {
  final AuthService _authService = AuthService();
  ApiService get _api => ApiService();

  static const String proMembership = "moneymapper pro membership";
  static const String freeMembership = "moneymapper free membership";
  static const String _firstLoginKey = "first_login_timestamp";
  static const String _lastSyncKey = "last_subscription_sync";

  Future<void> setPlan(String plan) async {
    await _authService.savePlan(plan);
  }

  /// Fetches the latest subscription status from Supabase and updates the local cache.
  Future<void> syncSubscriptionStatus() async {
    try {
      final details = await _api.getSubscriptionDetails();
      
      if (details == null || details['current_period_end'] == null) {
        await setPlan(freeMembership);
        return;
      }
      
      final expiry = DateTime.parse(details['current_period_end']).toLocal();
      if (expiry.isAfter(DateTime.now())) {
        await setPlan(proMembership);
      } else {
        await setPlan(freeMembership);
      }
      
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt(_lastSyncKey, DateTime.now().millisecondsSinceEpoch);
    } catch (e) {
      debugPrint("Subscription sync failed: $e");
      // On network failure, we preserve the existing local plan so the user doesn't lose access.
    }
  }

  Future<bool> isPro() async {
    final prefs = await SharedPreferences.getInstance();
    final lastSync = prefs.getInt(_lastSyncKey) ?? 0;
    final now = DateTime.now().millisecondsSinceEpoch;
    if (now - lastSync > 5 * 60 * 1000) { // 5 minutes
      syncSubscriptionStatus();
    }

    final plan = await _authService.getUserPlan();
    if (plan == null) return false;
    final normalized = plan.trim().toLowerCase();
    return normalized.contains("pro") || 
           normalized.contains("paid") || 
           normalized.contains("wealth select") || 
           normalized.contains("enterprise gold") ||
           normalized == proMembership.toLowerCase();
  }

  Future<bool> isFeatureAccessible() async {
    if (await isPro()) return true;

    final prefs = await SharedPreferences.getInstance();
    int? firstLogin = prefs.getInt(_firstLoginKey);
    if (firstLogin == null) {
      firstLogin = DateTime.now().millisecondsSinceEpoch;
      await prefs.setInt(_firstLoginKey, firstLogin);
      return true; // 7-Day Free Trial
    }

    final firstLoginDate = DateTime.fromMillisecondsSinceEpoch(firstLogin);
    final daysPassed = DateTime.now().difference(firstLoginDate).inDays;
    return daysPassed < 7; // 7-Day Free Trial
  }

  Future<int> getTrialDaysRemaining() async {
    if (await isPro()) return 365;

    final prefs = await SharedPreferences.getInstance();
    int? firstLogin = prefs.getInt(_firstLoginKey);
    if (firstLogin == null) {
      firstLogin = DateTime.now().millisecondsSinceEpoch;
      await prefs.setInt(_firstLoginKey, firstLogin);
      return 7;
    }

    final firstLoginDate = DateTime.fromMillisecondsSinceEpoch(firstLogin);
    final daysPassed = DateTime.now().difference(firstLoginDate).inDays;
    final remaining = 7 - daysPassed;
    return remaining > 0 ? remaining : 0;
  }

  Future<bool> isAiAssistantAccessible() async {
    return isFeatureAccessible();
  }

  Future<String> getPlanStatus() async {
    if (await isPro()) return "PRO";
    return "FREE";
  }
}
