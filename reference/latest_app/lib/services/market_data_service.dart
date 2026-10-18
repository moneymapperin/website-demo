import 'dart:convert';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';
import 'resilience_utils.dart';

class MarketDataService {
  final _supabase = Supabase.instance.client;
  static const String _cacheKeyRates = "metal_rates_cached_v1";
  static const String _cacheKeyLastFetch = "gold_last_fetch_ts_resilient_v1";

  /// Fetches Metal Rates from Supabase with Caching.
  Future<Map<String, dynamic>> getGoldRate({bool forceRefresh = false}) async {
    final prefs = await SharedPreferences.getInstance();
    
    // 1. Cache Check (15 mins for better live feel)
    if (!forceRefresh) {
      final cached = _readCache(prefs);
      if (cached != null) return cached;
    }

    // 2. Fetch from Supabase
    try {
      final res = await _supabase
          .schema('bse_data')
          .from('live_metal_rates')
          .select();

      if (res == null || (res as List).isEmpty) {
        throw Exception("EMPTY_DATA");
      }

      final List<dynamic> data = res;
      Map<String, dynamic> rates = {};
      double gold24kPrice = 0;

      for (var row in data) {
        String purity = row['purity'] ?? '';
        double price = ResilienceUtils.safeDouble(row['price']);
        rates[purity] = price;

        if (purity.contains('24K')) {
          gold24kPrice = price;
        }
      }

      // Backward compatibility for the ticker (24K 10g)
      rates['price'] = gold24kPrice * 10;
      rates['time'] = DateFormat('hh:mm a').format(DateTime.now());
      rates['status'] = 'Live (IBJA)';

      await _updateCache(prefs, rates);
      return rates;
    } catch (e) {
      // 3. Fallback to Stale Cache
      final stale = _readCache(prefs, force: true);
      if (stale != null) {
        stale['status'] = 'Offline (Stale)';
        return stale;
      }
      return {
        'price': 0.0,
        'status': 'Unavailable',
        'time': 'Sync Failed'
      };
    }
  }

  Map<String, dynamic>? _readCache(SharedPreferences prefs, {bool force = false}) {
    final lastFetchStr = prefs.getString(_cacheKeyLastFetch);
    final cachedDataStr = prefs.getString(_cacheKeyRates);

    if (lastFetchStr == null || cachedDataStr == null) return null;

    final lastFetch = DateTime.parse(lastFetchStr);
    final now = DateTime.now();

    if (force || now.difference(lastFetch).inMinutes < 15) {
      return jsonDecode(cachedDataStr);
    }
    return null;
  }

  Future<void> _updateCache(SharedPreferences prefs, Map<String, dynamic> rates) async {
    await prefs.setString(_cacheKeyRates, jsonEncode(rates));
    await prefs.setString(_cacheKeyLastFetch, DateTime.now().toIso8601String());
  }
}
