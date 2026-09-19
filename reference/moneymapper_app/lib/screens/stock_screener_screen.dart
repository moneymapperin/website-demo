import 'dart:ui';
import 'dart:math';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../services/premium_service.dart';
import '../widgets/sentiment_gauge.dart';
import '../services/api_service.dart';
import '../services/resilience_utils.dart';
import '../theme/responsive_utils.dart';
import '../services/branding_utils.dart';

class StockScreenerScreen extends StatefulWidget {
  const StockScreenerScreen({super.key});

  @override
  State<StockScreenerScreen> createState() => _StockScreenerScreenState();
}

class _StockScreenerScreenState extends State<StockScreenerScreen> {
  final _supabase = Supabase.instance.client;
  final _premiumService = PremiumService();
  final _api = ApiService();
  bool _loading = true;
  bool _isPro = false;
  bool _isTrialExpired = false;
  int _trialDaysLeft = 7;
  List<Map<String, dynamic>> _allSignals = [];
  List<Map<String, dynamic>> _filteredSignals = [];
  final TextEditingController _searchController = TextEditingController();

  double _sentimentValue = 50.0;
  String _sentimentDirection = "NEUTRAL";
  Map<String, dynamic>? _sentimentData;

  @override
  void initState() {
    super.initState();
    _loadPremiumStatus();
    _fetchSignals();
    _fetchSentiment();
  }

  Future<void> _loadPremiumStatus() async {
    final isPro = await _premiumService.isPro();
    final daysLeft = await _premiumService.getTrialDaysRemaining();
    final isExpired = daysLeft <= 0;

    if (mounted) {
      setState(() {
        _isPro = isPro;
        _isTrialExpired = isExpired;
        _trialDaysLeft = daysLeft;
      });
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchSignals() async {
    if (!mounted) return;
    setState(() => _loading = true);
    try {
      final res = await _supabase
          .schema('bse_data')
          .from('stock_signals')
          .select()
          .order('score', ascending: false);
      
      if (mounted) {
        setState(() {
          _allSignals = List<Map<String, dynamic>>.from(res);
          _filteredSignals = _allSignals;
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('Screener Fetch Error: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _fetchSentiment() async {
    try {
      final data = await _api.getMarketSentiment();
      if (data.isNotEmpty) {
        double angle = ResilienceUtils.safeDouble(data['needle_angle']);
        double mappedValue = (angle + 90) / 180 * 100;

        if (mounted) {
          setState(() {
            _sentimentData = data;
            _sentimentValue = mappedValue.clamp(0.0, 100.0);
            _sentimentDirection = data['master_direction'] ?? "NEUTRAL";
          });
        }
      }
    } catch (e) {
      debugPrint("Sentiment fetch failed: $e");
    }
  }

  void _filterResults(String query) {
    setState(() {
      if (query.isEmpty) {
        _filteredSignals = _allSignals;
      } else {
        _filteredSignals = _allSignals
            .where((s) => s['symbol'].toString().toLowerCase().contains(query.toLowerCase()))
            .toList();
      }
    });
  }

  void _showInfoDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Row(
          children: [
            Icon(Icons.info_outline_rounded, color: AppColors.primary),
            SizedBox(width: 12),
            Text("AI Strategy Guide", style: TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("Our AI scanner identifies high-probability reversals using:", style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
            SizedBox(height: 12),
            Text("• Heikin Ashi: Trend confirmation", style: TextStyle(fontSize: 12)),
            Text("• Bollinger Bands: Volatility exhaustion", style: TextStyle(fontSize: 12)),
            Text("• Pivot Analysis: Trend-cycle detection", style: TextStyle(fontSize: 12)),
            SizedBox(height: 16),
            Text("Scores above 70 indicate high-confidence signals. Always follow the Stop Loss range for risk management.", style: TextStyle(fontSize: 11, color: Colors.grey, fontStyle: FontStyle.italic)),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("Understood", style: TextStyle(fontWeight: FontWeight.bold))),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: AppBar(
        title: const Text("Stocks Score Card", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        actions: [
          IconButton(onPressed: _fetchSignals, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: _loading 
        ? const Center(child: CircularProgressIndicator())
        : ListView(
            padding: const EdgeInsets.symmetric(vertical: 8),
            children: [
              if (!_isPro && _isTrialExpired)
                Container(
                  width: double.infinity,
                  color: Colors.red.shade900,
                  padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                  margin: const EdgeInsets.only(bottom: 12),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.warning_amber_rounded, color: Colors.white, size: 16),
                      SizedBox(width: 8),
                      Text(
                        "TRIAL EXPIRED - UPGRADE TO PRO TO UNLOCK",
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11, letterSpacing: 0.5),
                      ),
                    ],
                  ),
                ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                child: GestureDetector(
                  onTap: (_isPro || !_isTrialExpired) ? null : () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text("Trial Expired! Upgrade to PRO to unlock all features. 🚀"),
                        backgroundColor: Colors.red,
                      ),
                    );
                  },
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      ImageFiltered(
                        imageFilter: (!_isPro) ? ImageFilter.blur(sigmaX: 4, sigmaY: 4) : ImageFilter.blur(sigmaX: 0, sigmaY: 0),
                        child: TextField(
                          enabled: _isPro,
                          controller: _searchController,
                          onChanged: _filterResults,
                          decoration: InputDecoration(
                            hintText: _isPro ? "Search ticker (e.g. RELIANCE)..." : "Search locked for Free users",
                            prefixIcon: const Icon(Icons.search, size: 20),
                            suffixIcon: _isPro && _searchController.text.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(Icons.clear, size: 20),
                                  onPressed: () {
                                    _searchController.clear();
                                    _filterResults('');
                                  },
                                )
                              : null,
                            filled: true,
                            fillColor: isDark ? Colors.white.withOpacity(0.05) : Colors.grey.shade100,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide.none,
                            ),
                          ),
                        ),
                      ),
                      if (!_isPro)
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.lock_rounded, color: _isTrialExpired ? Colors.red : Colors.amber, size: 18),
                            const SizedBox(width: 8),
                            Text(
                              _isTrialExpired ? "TRIAL EXPIRED" : "UPGRADE TO PRO",
                              style: TextStyle(
                                color: _isTrialExpired ? Colors.red : Colors.amber.shade700,
                                fontWeight: FontWeight.w900,
                                fontSize: 10,
                                letterSpacing: 1.2,
                              ),
                            ),
                          ],
                        ),
                    ],
                  ),
                ),
              ),
              _buildSentimentSection(isDark),
              _buildPartitionHeader(isDark),
              _buildFinalReport(isDark),
            ],
          ),
    );
  }

  Widget _buildSentimentSection(bool isDark) {
    String subLabel = "STABLE MARKET";
    Color accentColor = Colors.orange;

    if (_sentimentDirection == "BUY") {
      subLabel = "BULLISH / GREED";
      accentColor = Colors.green;
    } else if (_sentimentDirection == "SELL") {
      subLabel = "BEARISH / FEAR";
      accentColor = Colors.red;
    }

    return Container(
      margin: EdgeInsets.all(context.wp(5)),
      padding: EdgeInsets.all(context.wp(6)),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.borderLight),
      ),
      child: Column(
        children: [
          const Text("MARKET SENTIMENT", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.5)),
          const SizedBox(height: 24),
          SentimentGauge(value: _sentimentValue, size: context.wp(65)),
          const SizedBox(height: 12),
          Text(
            subLabel,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w900,
              color: accentColor,
            ),
          ),
          if (_sentimentData != null) ...[
            const SizedBox(height: 4),
            Text(
              "Updated: ${DateTime.parse(_sentimentData!['updated_at']).toLocal().toString().split(' ')[0]}",
              style: const TextStyle(fontSize: 9, color: Colors.grey, fontWeight: FontWeight.bold),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildPartitionHeader(bool isDark) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: context.wp(5), vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: Divider(
              color: isDark ? AppColors.darkBorder : AppColors.borderLight,
              thickness: 1,
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: [
                Icon(
                  Icons.auto_graph_rounded,
                  size: 16,
                  color: AppColors.primary,
                ),
                const SizedBox(width: 8),
                Text(
                  "NIFTY 500 SIGNALS & STOCKS",
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.2,
                    color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: Divider(
              color: isDark ? AppColors.darkBorder : AppColors.borderLight,
              thickness: 1,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFinalReport(bool isDark) {
    // Show the full list so users can see data exists but is locked
    final displayList = _filteredSignals;

    if (displayList.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 40),
        child: _buildEmptyState(_searchController.text.isEmpty
            ? "Scanning Nifty 500 signals..."
            : "No matching stocks found."),
      );
    }

    return Column(
      children: [
        if (!_isPro)
          GestureDetector(
            onTap: () => Navigator.pushNamed(context, '/subscription'),
            child: Container(
              width: double.infinity,
              margin: EdgeInsets.fromLTRB(context.wp(4), 0, context.wp(4), 16),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: (_isTrialExpired ? Colors.red : Colors.orange).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: (_isTrialExpired ? Colors.red : Colors.orange).withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  Icon(_isTrialExpired ? Icons.error_outline_rounded : Icons.lock_clock_rounded,
                       color: _isTrialExpired ? Colors.red : Colors.orange, size: 18),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _isTrialExpired
                        ? "Trial expired! Upgrade to PRO to unlock all Nifty 500 signals! 🚀"
                        : "Free users see only 1 daily signal. Trial ends in $_trialDaysLeft days. Upgrade to PRO! 🚀",
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: _isTrialExpired ? Colors.red : Colors.orange),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: EdgeInsets.symmetric(horizontal: context.wp(4)),
          itemCount: displayList.length,
          itemBuilder: (ctx, i) {
            final s = displayList[i];
            final int score = ResilienceUtils.safeDouble(s['score']).toInt();
            String direction = (s['direction'] ?? 'WAIT').toString();
            if (direction == 'HOLD') direction = 'WAIT';

            // Force WAIT if score is 0
            if (score == 0) direction = 'WAIT';

            final isBuy = direction == 'BUY';
            final isWait = direction == 'WAIT';
            final isLocked = !_isPro && (_isTrialExpired || i > 0);

            return GestureDetector(
              onTap: isLocked ? () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(_isTrialExpired
                      ? "Trial Expired! Upgrade to PRO to unlock all signals! 🚀"
                      : "Upgrade to PRO to unlock all daily signals! 🚀"),
                    backgroundColor: _isTrialExpired ? Colors.red : Colors.orange,
                  ),
                );
              } : null,
              child: Stack(
                children: [
                  Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.darkCard : Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isWait
                            ? Colors.grey.withOpacity(0.2)
                            : (isBuy ? AppColors.success.withOpacity(0.3) : AppColors.danger.withOpacity(0.3))
                      ),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        BrandLogo(name: s['symbol'] ?? '', size: 40),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ImageFiltered(
                            imageFilter: isLocked ? ImageFilter.blur(sigmaX: 5, sigmaY: 5) : ImageFilter.blur(sigmaX: 0, sigmaY: 0),
                            child: Column(
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Text(s['symbol'] ?? 'Unknown', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
                                            if (!_isPro && !isLocked) ...[
                                              const SizedBox(width: 8),
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                decoration: BoxDecoration(color: Colors.orange.withOpacity(0.2), borderRadius: BorderRadius.circular(4)),
                                                child: Text("$_trialDaysLeft-day trial", style: const TextStyle(color: Colors.orange, fontSize: 8, fontWeight: FontWeight.bold)),
                                              ),
                                            ],
                                          ],
                                        ),
                                        Row(
                                          children: [
                                            RichText(
                                              text: TextSpan(
                                                style: TextStyle(color: Colors.grey.shade500, fontSize: 12, fontWeight: FontWeight.bold),
                                                children: [
                                                  const TextSpan(text: "Score: "),
                                                  TextSpan(
                                                    text: "$score",
                                                    style: TextStyle(
                                                      fontSize: 16,
                                                      fontWeight: FontWeight.w900,
                                                      color: isDark ? Colors.white : Colors.black87,
                                                    ),
                                                  ),
                                                  const TextSpan(text: "/100"),
                                                ],
                                              ),
                                            ),
                                            if (!isWait) ...[
                                              Builder(builder: (context) {
                                                final upside = _calculateUpsidePct(
                                                  s['entry_range']?.toString() ?? '',
                                                  s['target_range']?.toString() ?? '',
                                                );
                                                if (upside.isEmpty) return const SizedBox.shrink();
                                                return Text(
                                                  "  •  Expected Return: $upside",
                                                  style: TextStyle(
                                                    color: isBuy ? AppColors.success : AppColors.danger,
                                                    fontSize: 12,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                );
                                              }),
                                            ],
                                          ],
                                        ),
                                      ],
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: isWait ? Colors.grey : (isBuy ? AppColors.success : AppColors.danger),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(direction, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                    ),
                                  ],
                                ),
                                if (!isWait) ...[
                                  const Divider(height: 24),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      _rangeBox("STOP LOSS", s['sl_range']?.toString() ?? 'N/A', AppColors.danger),
                                      _rangeBox("ENTRY ZONE", s['entry_range']?.toString() ?? 'N/A', Colors.blue),
                                      _rangeBox("TARGET", s['target_range']?.toString() ?? 'N/A', AppColors.success),
                                    ],
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (isLocked)
                    Positioned.fill(
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: _isTrialExpired ? Colors.red : Colors.orange,
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(color: (_isTrialExpired ? Colors.red : Colors.orange).withOpacity(0.5), blurRadius: 10)
                                  ],
                                ),
                                child: Icon(_isTrialExpired ? Icons.lock_outline_rounded : Icons.lock_person_rounded, color: Colors.white, size: 24),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _isTrialExpired ? "EXPIRED" : "PRO",
                                style: TextStyle(color: _isTrialExpired ? Colors.red : Colors.orange, fontWeight: FontWeight.w900, fontSize: 10),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _rangeBox(String label, String value, Color color) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
        child: Column(
          children: [
            Text(label, style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: color)),
            const SizedBox(height: 4),
            Text(value, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900)),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(String msg) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.analytics_outlined, size: 64, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          Text(msg, style: const TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }

  double _getMinValue(String val) {
    try {
      String clean = val.replaceAll(RegExp(r'[^0-9.]'), ' ').trim();
      if (clean.isEmpty) return 0;
      var parts = clean.split(RegExp(r'\s+'));
      double? minVal;
      for (var p in parts) {
        double? d = double.tryParse(p);
        if (d != null) {
          if (minVal == null || d < minVal) minVal = d;
        }
      }
      return minVal ?? 0;
    } catch (_) {
      return 0;
    }
  }

  double _getMaxValue(String val) {
    try {
      String clean = val.replaceAll(RegExp(r'[^0-9.]'), ' ').trim();
      if (clean.isEmpty) return 0;
      var parts = clean.split(RegExp(r'\s+'));
      double? maxVal;
      for (var p in parts) {
        double? d = double.tryParse(p);
        if (d != null) {
          if (maxVal == null || d > maxVal) maxVal = d;
        }
      }
      return maxVal ?? 0;
    } catch (_) {
      return 0;
    }
  }

  String _calculateUpsidePct(String entryRange, String targetRange) {
    double entry = _getMinValue(entryRange); // Best (lowest) entry
    double target = _getMaxValue(targetRange); // Best (highest) target
    if (entry <= 0 || target <= 0) return "";
    double pct = ((target - entry) / entry).abs() * 100;
    if (pct == 0) return "";
    return "${pct.toStringAsFixed(1)}%";
  }
}
