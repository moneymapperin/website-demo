import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'resilience_utils.dart';

class AuthService {
  static const _tokenKey = 'jwt_token';
  static const _nameKey = 'user_name';
  static const _emailKey = 'user_email';
  static const _planKey = 'user_plan';
  static const _profileCacheKey = 'master_profile_data';

  final SupabaseClient _supabase = Supabase.instance.client;

  Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  Future<void> saveUser(Map<String, dynamic> user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_nameKey, user['name']?.toString() ?? '');
    await prefs.setString(_emailKey, user['email']?.toString() ?? '');
    final currentPlan = prefs.getString(_planKey);
    if (currentPlan == null || currentPlan.isEmpty) {
      await prefs.setString(_planKey, user['plan']?.toString() ?? 'b2c');
    }
  }

  Future<void> savePlan(String plan) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_planKey, plan);
  }

  Future<String?> getUserName() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_nameKey);
  }

  Future<String?> getUserEmail() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_emailKey);
  }

  Future<String?> getUserPlan() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_planKey);
  }

  Future<void> logout() async {
    try {
      await _supabase.auth.signOut();
    } catch (e) {
      // Local cleanup even if network sign-out fails
    }
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }

  Future<bool> isLoggedIn() async {
    return _supabase.auth.currentSession != null;
  }

  // --- Profile Caching Methods ---

  Future<void> saveMasterProfileLocally(String jsonStr) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_profileCacheKey, jsonStr);
  }

  Future<String?> getMasterProfileLocally() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_profileCacheKey);
  }

  // --- Resilient Auth Methods ---

  Future<AuthResponse> signUp({
    required String email,
    required String password,
    required Map<String, dynamic> metadata,
  }) async {
    try {
      return await ResilienceUtils.retry(
        context: "Auth_SignUp",
        task: () => _supabase.auth.signUp(email: email, password: password, data: metadata),
      );
    } on AuthException catch (e) {
      if (e.message.contains('already registered')) throw 'An account already exists with this email.';
      throw ResilienceUtils.sanitizeErrorMessage(e);
    }
  }

  Future<AuthResponse> signIn({
    required String email,
    required String password,
  }) async {
    try {
      final response = await ResilienceUtils.retry(
        context: "Auth_SignIn",
        task: () => _supabase.auth.signInWithPassword(email: email, password: password),
      );

      if (response.user != null) {
        final metadata = response.user!.userMetadata ?? {};
        await saveUser({
          'name': metadata['fullName'] ?? '',
          'email': response.user!.email ?? '',
          'plan': metadata['plan'] ?? 'b2c',
        });
        if (response.session != null) {
          await saveToken(response.session!.accessToken);
        }
      }
      return response;
    } on AuthException catch (e) {
      if (e.message.contains('Invalid login credentials')) {
        throw 'Incorrect email or password. Please try again.';
      }
      throw ResilienceUtils.sanitizeErrorMessage(e);
    }
  }

  Future<void> resetPassword(String email) async {
    try {
      await _supabase.auth.resetPasswordForEmail(email, redirectTo: 'moneymapper://reset-callback');
    } catch (e) {
      throw ResilienceUtils.sanitizeErrorMessage(e);
    }
  }

  Future<void> updatePassword(String newPassword) async {
    try {
      await _supabase.auth.updateUser(UserAttributes(password: newPassword));
    } catch (e) {
      throw ResilienceUtils.sanitizeErrorMessage(e);
    }
  }

  String? get currentUserId => _supabase.auth.currentUser?.id;

  Future<void> syncMetadata() async {
    final user = _supabase.auth.currentUser;
    if (user != null) {
      final prefs = await SharedPreferences.getInstance();
      final existingPlan = prefs.getString(_planKey);

      final metadata = user.userMetadata ?? {};
      await saveUser({
        'name': metadata['fullName'] ?? '',
        'email': user.email ?? '',
        'plan': existingPlan ?? metadata['plan'] ?? 'b2c',
      });
    }
  }
}
