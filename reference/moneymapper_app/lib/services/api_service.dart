import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'auth_service.dart';
import 'resilience_utils.dart';
import 'secure_network_client.dart';
import '../models/dashboard_model.dart';

class ApiService {
  final AuthService _auth = AuthService();
  final SupabaseClient _supabase = Supabase.instance.client;
  final SecureNetworkClient _secureNetwork = SecureNetworkClient();

  static const String _mfApiList = "https://api.mfapi.in/mf";

  // --- Cache Constants ---
  static const String _cachePrefix = "mm_cache_";
  static const String _cacheTsPrefix = "mm_cache_ts_";

  // TTLs
  static const Duration _ttlShort = Duration(minutes: 10);
  static const Duration _ttlMedium = Duration(hours: 1);
  static const Duration _ttlLong = Duration(hours: 4);

  // --- Internal Logging ---
  Future<void> _logErrorResilient(dynamic error, String context, [StackTrace? stack]) async {
    try {
      final userId = _auth.currentUserId;
      await _supabase.from('app_logs').insert({
        'user_id': userId,
        'log_level': 'ERROR',
        'context': context,
        'message': error.toString(),
        'metadata': {
          'timestamp': DateTime.now().toIso8601String(),
          'stack_trace': stack?.toString(),
        },
      });
    } catch (e) {
      debugPrint(' [CRITICAL] Logging Pipeline Failed: $e');
    }
  }

  // --- Cache Helpers ---

  Future<dynamic> _readCache(String key, Duration ttl) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final String? data = prefs.getString(_cachePrefix + key);
      final String? tsStr = prefs.getString(_cacheTsPrefix + key);

      if (data == null || tsStr == null) return null;

      final DateTime ts = DateTime.parse(tsStr);
      if (DateTime.now().difference(ts) > ttl) {
        return null; // Expired
      }
      return jsonDecode(data);
    } catch (e) {
      return null;
    }
  }

  Future<void> _updateCache(String key, dynamic data) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_cachePrefix + key, jsonEncode(data));
      await prefs.setString(_cacheTsPrefix + key, DateTime.now().toIso8601String());
    } catch (e) {
      debugPrint("Cache Update Failed: $e");
    }
  }

  Future<void> _clearCache(List<String> keys) async {
    final prefs = await SharedPreferences.getInstance();
    for (var key in keys) {
      await prefs.remove(_cachePrefix + key);
      await prefs.remove(_cacheTsPrefix + key);
    }
  }

  // --- Profile Management ---

  Future<Map<String, dynamic>> getMasterProfile() async {
    final cacheKey = "profile_${_auth.currentUserId}";
    final cached = await _readCache(cacheKey, _ttlMedium);
    if (cached != null) return {'data': cached};

    try {
      return await ResilienceUtils.retry(
        context: "Fetch_Master_Profile",
        task: () async {
          final userId = _auth.currentUserId;
          if (userId == null) throw ApiException('Session Expired', 401);

          final response = await _supabase
              .from('master_profiles')
              .select()
              .eq('user_id', userId)
              .maybeSingle();
          
          final profileData = response?['profile_json'];
          if (profileData != null) {
            await _updateCache(cacheKey, profileData);
          }
          return {'data': profileData};
        },
      );
    } catch (e) {
      if (e is ApiException) rethrow;
      _logErrorResilient(e, "getMasterProfile");
      throw ApiException(ResilienceUtils.sanitizeErrorMessage(e), 500);
    }
  }

  // --- Subscription Methods ---
  Future<Map<String, dynamic>?> getSubscriptionDetails() async {
    try {
      final userId = _auth.currentUserId;
      if (userId == null) return null;

      final res = await _supabase.schema('bse_data').from('user_subscriptions').select().eq('user_id', userId).maybeSingle();
      return res;
    } catch (e) {
      _logErrorResilient(e, "getSubscriptionDetails");
      return null;
    }
  }

  Future<void> stackSubscription(int monthsToAdd) async {
    try {
      final userId = _auth.currentUserId;
      if (userId == null) throw "User not logged in";

      // Notice: rpc calls naturally target the 'public' schema unless defined otherwise.
      // Make sure the stack_subscription RPC is deployed to 'public' as provided in the SQL setup.
      await _supabase.rpc('stack_subscription', params: {
        'p_user_id': userId,
        'p_months_to_add': monthsToAdd
      });
    } catch (e) {
      _logErrorResilient(e, "stackSubscription");
      rethrow;
    }
  }

  Future<Map<String, dynamic>> updateMasterProfile(Map<String, dynamic> data) async {
    try {

      final userId = _auth.currentUserId;
      if (userId == null) throw ApiException('Session Expired', 401);

      await _supabase.from('master_profiles').upsert({
        'user_id': userId,
        'profile_json': data,
        'updated_at': DateTime.now().toIso8601String(),
      });
      
      // Cache Busting
      await _clearCache(["profile_$userId", "dashboard_$userId"]);
      
      return {'status': 'success'};
    } catch (e) {
      _logErrorResilient(e, "updateMasterProfile");
      throw ApiException(ResilienceUtils.sanitizeErrorMessage(e), 500);
    }
  }

  Future<void> addEmergencySavings(double amountToAdd) async {
    try {
      final userId = _auth.currentUserId;
      if (userId == null) throw ApiException('Not Logged In', 401);

      final profileRes = await getMasterProfile();
      final Map<String, dynamic> profile = Map<String, dynamic>.from(profileRes['data'] ?? {});
      
      String targetKey = 'emergencyFundCurrent';
      double currentVal = ResilienceUtils.safeDouble(profile[targetKey]);

      profile[targetKey] = (currentVal + amountToAdd).toStringAsFixed(0);

      await _supabase.from('master_profiles').upsert({
        'user_id': userId,
        'profile_json': profile,
        'updated_at': DateTime.now().toUtc().toIso8601String(),
      });

      // Cache Busting
      await _clearCache(["profile_$userId", "dashboard_$userId"]);

    } catch (e) {
      _logErrorResilient(e, "addEmergencySavings");
      throw ApiException(ResilienceUtils.sanitizeErrorMessage(e), 500);
    }
  }

  // --- Dashboard Logic (Calculated Scores) ---

  Future<Map<String, dynamic>> getDashboard() async {
    final cacheKey = "dashboard_${_auth.currentUserId}";
    final cached = await _readCache(cacheKey, _ttlShort);
    if (cached != null) return cached;

    try {
      return await ResilienceUtils.retry(
        context: "Fetch_Dashboard",
        task: () async {
          final userId = _auth.currentUserId;
          if (userId == null) throw ApiException('Not Logged In', 401);

          final fitnessRes = await _supabase.schema('core').from('financial_fitness_scores').select().eq('user_id', userId).maybeSingle();
          if (fitnessRes == null) throw ApiException('Calculations Pending', 404);

          final results = await Future.wait([
            _supabase.schema('core').from('income_scores').select().eq('user_id', userId).maybeSingle(),
            _supabase.schema('core').from('expense_scores').select().eq('user_id', userId).maybeSingle(),
            _supabase.schema('core').from('savings_scores').select().eq('user_id', userId).maybeSingle(),
            _supabase.schema('core').from('protection_scores').select().eq('user_id', userId).maybeSingle(),
            _supabase.schema('core').from('investment_scores').select().eq('user_id', userId).maybeSingle(),
          ]);

          final data = {
            'financial_fitness_scores': fitnessRes,
            'income_scores': results[0],
            'expense_scores': results[1],
            'savings_scores': results[2],
            'protection_scores': results[3],
            'investment_scores': results[4],
          };

          await _updateCache(cacheKey, data);
          return data;
        },
      );
    } catch (e) {
      if (e is ApiException) rethrow;
      _logErrorResilient(e, "getDashboard");
      throw ApiException(ResilienceUtils.sanitizeErrorMessage(e), 500);
    }
  }

  // --- Live Intelligence Recommendations ---

  Future<List<dynamic>> getSavingsRecommendations() async {
    final cached = await _readCache("savings_recs", _ttlLong);
    if (cached != null) return cached;

    try {
      final List<dynamic> allSchemes = await _fetchSchemesList();
      final List<String> keywords = ["Overnight", "Liquid", "Arbitrage"];
      final filtered = allSchemes.where((s) {
        final name = s['schemeName']?.toString().toLowerCase() ?? '';
        return keywords.any((k) => name.contains(k.toLowerCase())) &&
               name.contains("direct") && 
               name.contains("growth");
      }).toList();

      final selected = _take(5, filtered);
      final data = selected.map((s) {
        final name = s['schemeName'].toString().toLowerCase();
        String cat = "Liquid Fund";
        if (name.contains("overnight")) cat = "Overnight Fund";
        if (name.contains("arbitrage")) cat = "Arbitrage Fund";

        return {
          'fund': s['schemeName'],
          'category': cat,
          'returns': "6.5% - 7.8%", 
          'risk': cat == "Overnight Fund" ? "Very Low" : "Low",
          'liquidity': cat == "Arbitrage Fund" ? "T+2" : "T+1",
          'exitLoad': cat == "Overnight Fund" ? "Nil" : "Nil (Post 7 Days)",
          'score': 90 + (ResilienceUtils.safeDouble(s['schemeCode']).toInt() % 10), 
          'tag': cat == "Overnight Fund" ? "Safest" : "Popular"
        };
      }).toList();

      await _updateCache("savings_recs", data);
      return data;
    } catch (e) {
      _logErrorResilient(e, "getSavingsRecommendations_LIVE");
      return [];
    }
  }

  Future<List<dynamic>> getInsuranceRecommendations() async {
    // These are currently hardcoded, but we can cache them too for future-proofing
    final cached = await _readCache("insurance_recs", _ttlLong);
    if (cached != null) return cached;

    final data = [
      {
        'id': 'h3', 'company': 'HDFC ERGO', 'policy': 'Optima Secure', 'type': 'Health',
        'premium': 22000, 'cover': 10000000, 'claimRatio': 98.0, 'rating': 4.5,
        'bestFor': 'Premium seekers, high CSR coverage', 'tag': 'Top Recommended'
      },
      {
        'id': 'l1', 'company': 'Max Life', 'policy': 'Smart Secure Plus', 'type': 'Life',
        'premium': 12000, 'cover': 100000000, 'claimRatio': 99.5, 'rating': 4.6,
        'bestFor': 'Highest CSR, family income protection', 'tag': 'Essential'
      },
      {
        'id': 'h1', 'company': 'Niva Bupa', 'policy': 'Reassure 2.0', 'type': 'Health',
        'premium': 14500, 'cover': 10000000, 'claimRatio': 91.0, 'rating': 4.3,
        'bestFor': 'Young professionals, no room rent limit', 'tag': 'Value'
      },
      {
        'id': 'l3', 'company': 'HDFC Life', 'policy': 'Click 2 Protect Super', 'type': 'Life',
        'premium': 11000, 'cover': 100000000, 'claimRatio': 99.4, 'rating': 4.6,
        'bestFor': 'Young professionals, high trust', 'tag': 'Popular'
      },
      {
        'id': 'h5', 'company': 'ICICI Lombard', 'policy': 'Complete Health', 'type': 'Health',
        'premium': 19000, 'cover': 10000000, 'claimRatio': 97.4, 'rating': 4.4,
        'bestFor': 'Metro professionals, large network', 'tag': 'Network Choice'
      }
    ];

    await _updateCache("insurance_recs", data);
    return data;
  }

  Future<List<dynamic>> getMutualFundRecommendations(String riskAppetite) async {
    final cacheKey = "mf_recs_${riskAppetite.toLowerCase()}";
    final cached = await _readCache(cacheKey, _ttlLong);
    if (cached != null) return cached;

    try {
      final List<dynamic> allSchemes = await _fetchSchemesList();
      final normalizedRisk = riskAppetite.toLowerCase().trim();
      
      String primaryKeyword = "Flexi Cap"; 
      if (normalizedRisk == "aggressive") primaryKeyword = "Small Cap";
      if (normalizedRisk == "conservative") primaryKeyword = "Hybrid";

      List<dynamic> primaryPool = _filterMF(allSchemes, primaryKeyword);
      List<dynamic> moderatePool = _filterMF(allSchemes, "Flexi Cap");
      String secondaryKeyword = normalizedRisk == "aggressive" ? "Hybrid" : "Small Cap";
      List<dynamic> secondaryPool = _filterMF(allSchemes, secondaryKeyword);

      List<dynamic> recommended = [];
      recommended.addAll(_take(3, primaryPool).map((f) => _formatMF(f, normalizedRisk)));
      recommended.addAll(_take(1, moderatePool).map((f) => _formatMF(f, "moderate")));
      recommended.addAll(_take(1, secondaryPool).map((f) => _formatMF(f, normalizedRisk == "aggressive" ? "conservative" : "aggressive")));

      await _updateCache(cacheKey, recommended);
      return recommended;
    } catch (e) {
      _logErrorResilient(e, "getMutualFundRecommendations_LIVE");
      return []; 
    }
  }

  Future<List<dynamic>> _fetchSchemesList() async {
    // This is a heavy 2MB JSON, so we cache it for 12 hours
    final cached = await _readCache("mfapi_list", const Duration(hours: 12));
    if (cached != null) return cached;

    return await ResilienceUtils.retry(
      context: "MFAPI_List_Fetch",
      task: () async {
        final response = await http.get(Uri.parse(_mfApiList)).timeout(const Duration(seconds: 15));
        if (response.statusCode != 200) throw Exception("MFAPI_DOWN");
        final data = jsonDecode(response.body) as List<dynamic>;
        await _updateCache("mfapi_list", data);
        return data;
      },
    );
  }

  // --- Weekly Logs ---

  Future<Map<String, dynamic>> getWeeklyCurrent({int? month, int? year}) async {
    final now = DateTime.now();
    final targetMonth = month ?? now.month;
    final targetYear = year ?? now.year;
    final cacheKey = "weekly_${_auth.currentUserId}_${targetYear}_$targetMonth";
    
    final cached = await _readCache(cacheKey, _ttlShort);
    if (cached != null) return {'data': cached};

    try {
      return await ResilienceUtils.retry(
        context: "Get_Weekly_Logs",
        task: () async {
          final userId = _auth.currentUserId;
          if (userId == null) throw ApiException('Not logged in', 401);
          
          final response = await _supabase
              .from('weekly_logs')
              .select()
              .eq('user_id', userId)
              .eq('log_month', targetMonth)
              .eq('log_year', targetYear)
              .order('week_index', ascending: true);
          
          await _updateCache(cacheKey, response);
          return {'data': response};
        },
      );
    } catch (e) {
      if (e is ApiException) rethrow;
      _logErrorResilient(e, "getWeeklyCurrent");
      throw ApiException(ResilienceUtils.sanitizeErrorMessage(e), 500);
    }
  }

  Future<Map<String, dynamic>> updateWeeklyStatus({
    required int weekIndex,
    required String status,
    int? month,
    int? year,
    String? fixedStatus,
    String? flexibleStatus,
    String? savingsStatus,
    double spentFixed = 0,
    double spentFlexible = 0,
    double spentSavings = 0,
  }) async {
    try {
      final userId = _auth.currentUserId;
      if (userId == null) throw ApiException('Not Logged In', 401);
      
      final now = DateTime.now();
      final targetMonth = month ?? now.month;
      final targetYear = year ?? now.year;

      await _supabase.from('weekly_logs').upsert({
        'user_id': userId,
        'week_index': weekIndex,
        'log_month': targetMonth,
        'log_year': targetYear,
        'status': status,
        'fixed_status': fixedStatus,
        'flexible_status': flexibleStatus,
        'savings_status': savingsStatus,
        'spent_fixed': spentFixed,
        'spent_flexible': spentFlexible,
        'spent_savings': spentSavings,
        'updated_at': DateTime.now().toIso8601String(),
      }, onConflict: 'user_id,week_index,log_month,log_year');

      // Cache Busting
      await _clearCache(["weekly_${userId}_${targetYear}_$targetMonth", "dashboard_$userId"]);

      return {'status': 'success'};
    } catch (e) {
      _logErrorResilient(e, "updateWeeklyStatus");
      throw ApiException(ResilienceUtils.sanitizeErrorMessage(e), 500);
    }
  }

  // --- Corporate Service ---

  Future<Map<String, dynamic>> getCorporateWorkforceStats() async {
    final userId = _auth.currentUserId;
    final cacheKey = "corp_stats_$userId";
    final cached = await _readCache(cacheKey, _ttlMedium);
    if (cached != null) return cached;

    try {
      final user = _supabase.auth.currentUser;
      if (user == null) throw ApiException('Unauthorized Access', 401);

      final normalizedEmail = user.email!.trim().toLowerCase();

      final adminRes = await _supabase.from('corporate_admins').select('company_name').ilike('admin_email', normalizedEmail).maybeSingle();
      if (adminRes == null) throw ApiException('Account is not an Admin.', 403);

      final companyName = adminRes['company_name'];

      final results = await Future.wait([
        _supabase.schema('core').from('corporate_analytics').select().eq('company_name', companyName).maybeSingle(),
        _supabase.schema('core').from('workforce_intelligence').select().eq('company_name', companyName).maybeSingle(),
      ]);

      if (results[0] == null) return {'company_name': companyName, 'avg_workforce_score': 0, 'total_headcount': 0};

      final mergedData = Map<String, dynamic>.from(results[0]!);
      mergedData['pillar_intel'] = results[1];

      await _updateCache(cacheKey, mergedData);
      return mergedData;
    } catch (e) {
      if (e is ApiException) rethrow;
      _logErrorResilient(e, "getCorporateWorkforceStats");
      throw ApiException(ResilienceUtils.sanitizeErrorMessage(e), 500);
    }
  }

  Future<Map<String, dynamic>> getMarketSentiment() async {
    final cached = await _readCache("market_sentiment", _ttlMedium);
    if (cached != null) return cached;

    try {
      final res = await _supabase
          .from('market_sentiment')
          .select()
          .order('updated_at', ascending: false)
          .limit(1)
          .maybeSingle();
      
      if (res != null) {
        await _updateCache("market_sentiment", res);
      }
      return res ?? {};
    } catch (e) {
      _logErrorResilient(e, "getMarketSentiment");
      return {};
    }
  }

  Future<List<Map<String, dynamic>>> getFinanceNews() async {
    final cached = await _readCache("finance_news", _ttlLong);
    if (cached != null) return List<Map<String, dynamic>>.from(cached);

    try {
      final res = await _supabase
          .schema('bse_data')
          .from('finance_news')
          .select()
          .order('updated_at', ascending: false)
          .limit(10);
      
      final data = List<Map<String, dynamic>>.from(res);
      await _updateCache("finance_news", data);
      return data;
    } catch (e) {
      _logErrorResilient(e, "getFinanceNews");
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> getBlogs() async {
    final cached = await _readCache("blogs", _ttlLong);
    if (cached != null) return List<Map<String, dynamic>>.from(cached);

    try {
      final res = await _supabase
          .schema('bse_data')
          .from('blogs')
          .select()
          .order('updated_at', ascending: false)
          .limit(10);
      
      final data = List<Map<String, dynamic>>.from(res);
      await _updateCache("blogs", data);
      return data;
    } catch (e) {
      _logErrorResilient(e, "getBlogs");
      return [];
    }
  }

  // --- Helpers ---

  List<dynamic> _filterMF(List<dynamic> list, String keyword) {
    return list.where((f) {
      final name = f['schemeName']?.toString().toLowerCase() ?? '';
      return name.contains(keyword.toLowerCase()) && 
             name.contains("direct") && 
             name.contains("growth") &&
             !name.contains("regular");
    }).toList();
  }

  Map<String, dynamic> _formatMF(dynamic fund, String type) {
    final int code = ResilienceUtils.safeDouble(fund['schemeCode']).toInt();
    return {
      'name': fund['schemeName'] ?? 'Unknown Fund',
      'return': "${15 + (code % 25)}%", 
      'rating': 4 + (code % 2), 
      'category': type.toUpperCase(),
      'type': type.capitalize()
    };
  }

  List<dynamic> _take(int count, List<dynamic>? list) {
    if (list == null || list.isEmpty) return [];
    final safeList = List.from(list)..shuffle();
    return safeList.take(count).toList();
  }

  // --- Legacy Wrappers ---
  Future<Map<String, dynamic>> submitOnboarding(Map<String, dynamic> data) async => await updateMasterProfile(data);
  
  Future<Map<String, dynamic>> submitWeekly(Map<String, dynamic> d) async => await updateWeeklyStatus(
    weekIndex: d['week_index'] ?? d['week_no'] ?? 0, 
    month: d['month'],
    year: d['year'],
    status: d['status'] ?? 'PENDING',
    spentFixed: ResilienceUtils.safeDouble(d['spent_fixed'] ?? d['fixedSpend']),
    spentFlexible: ResilienceUtils.safeDouble(d['spent_flexible'] ?? d['flexSpend']),
    spentSavings: ResilienceUtils.safeDouble(d['spent_savings'] ?? d['savings'])
  );

  Future<Map<String, dynamic>> submitRedGreen(Map<String, dynamic> d) async {
    // This is used for syncing scores back, might need cache busting too
    final userId = _auth.currentUserId;
    if (userId != null) {
      await _clearCache(["dashboard_$userId"]);
    }
    return {'status': 'success'};
  }

  // --- Web QR Login ---

  Future<void> loginWithQr(String token) async {
    try {
      final session = _supabase.auth.currentSession;
      final userId = _auth.currentUserId;

      // [MOBILE_QR_DEBUG] 1. Log _supabase.auth.currentSession null or non-null
      debugPrint('[MOBILE_QR_DEBUG] 1. _supabase.auth.currentSession is ${session == null ? "NULL" : "NON-NULL"}');

      // [MOBILE_QR_DEBUG] 2 & 3. Inspect accessToken and refreshToken
      if (session != null) {
        final dynamic rawAcc = session.accessToken;
        final bool isAccNull = rawAcc == null;
        final bool isAccEmpty = rawAcc == null ? true : (rawAcc is String ? rawAcc.isEmpty : false);
        final int accLen = rawAcc is String ? rawAcc.length : 0;
        final String accSnippet = rawAcc is String && rawAcc.length >= 8
            ? '${rawAcc.substring(0, 4)}...${rawAcc.substring(rawAcc.length - 4)}'
            : '$rawAcc';
        debugPrint('[MOBILE_QR_DEBUG] 2. session.accessToken: type=${rawAcc.runtimeType}, isNull=$isAccNull, isEmpty=$isAccEmpty, length=$accLen, snippet=$accSnippet');

        final dynamic rawRef = session.refreshToken;
        final bool isRefNull = rawRef == null;
        final bool isRefEmpty = rawRef == null ? true : (rawRef is String ? rawRef.isEmpty : false);
        final int refLen = rawRef is String ? rawRef.length : 0;
        final String refSnippet = rawRef is String && rawRef.length >= 8
            ? '${rawRef.substring(0, 4)}...${rawRef.substring(rawRef.length - 4)}'
            : '$rawRef';
        debugPrint('[MOBILE_QR_DEBUG] 3. session.refreshToken: type=${rawRef.runtimeType}, isNull=$isRefNull, isEmpty=$isRefEmpty, length=$refLen, snippet=$refSnippet');
      }

      // [MOBILE_QR_DEBUG] 9. Loud abort diagnostic message if tokens unavailable (letting upsert proceed)
      final bool isSessionNull = session == null;
      final bool isAccMissing = session == null || session.accessToken.isEmpty;
      final bool isRefMissing = session == null || session.refreshToken == null || session.refreshToken!.isEmpty;
      if (isSessionNull || isAccMissing || isRefMissing) {
        debugPrint('[MOBILE_QR_DEBUG] ABORT: session tokens unavailable (currentSession: ${!isSessionNull}, accessTokenPresent: ${!isAccMissing}, refreshTokenPresent: ${!isRefMissing})');
      }

      if (session == null || userId == null) throw ApiException('Not Logged In', 401);

      // [MOBILE_QR_DEBUG] 4. Log exact map/object passed to .upsert(...)
      final Map<String, dynamic> upsertData = {
        'session_token': token,
        'user_id': userId,
        'access_token': session.accessToken,
        'refresh_token': session.refreshToken,
        'status': 'AUTHENTICATED',
        'authenticated_at': DateTime.now().toIso8601String(),
      };

      final Map<String, String> redactedMap = {};
      upsertData.forEach((k, v) {
        if (v == null) {
          redactedMap[k] = 'NULL';
        } else if (k == 'access_token' || k == 'refresh_token') {
          if (v is String) {
            redactedMap[k] = 'String(length=${v.length})';
          } else {
            redactedMap[k] = '${v.runtimeType}($v)';
          }
        } else {
          redactedMap[k] = v.toString();
        }
      });
      debugPrint('[MOBILE_QR_DEBUG] 4. Exact upsert payload structure: $redactedMap');

      // [MOBILE_QR_DEBUG] 5. Log upsert call execution and response
      debugPrint('[MOBILE_QR_DEBUG] 5. Dispatching _supabase.from("web_sessions").upsert(...)...');
      final dynamic upsertResponse = await _supabase.from('web_sessions').upsert(
        upsertData,
        onConflict: 'session_token',
      );
      debugPrint('[MOBILE_QR_DEBUG] 5. upsert call completed successfully. Response: $upsertResponse');

    } catch (e, stack) {
      debugPrint('[MOBILE_QR_DEBUG] 5. upsert threw exception: $e');
      debugPrint('[MOBILE_QR_DEBUG] Stack trace: $stack');
      _logErrorResilient(e, "loginWithQr");
      throw ApiException("Web Login Failed. Please try again.", 500);
    }
  }
}

extension StringExtension on String {
  String capitalize() => this.isEmpty ? '' : "${this[0].toUpperCase()}${substring(1).toLowerCase()}";
}

class ApiException implements Exception {
  final String message;
  final int statusCode;
  ApiException(this.message, this.statusCode);
  @override
  String toString() => message;
}
