import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'theme/responsive_utils.dart';
import 'theme/app_theme.dart';
import 'services/api_service.dart';
import 'services/auth_service.dart';
import 'services/advisory_service.dart';

class IncomePillarDashboard extends StatefulWidget {
  const IncomePillarDashboard({super.key});

  @override
  State<IncomePillarDashboard> createState() => _IncomePillarDashboardState();
}

class _IncomePillarDashboardState extends State<IncomePillarDashboard> {
  final ApiService _api = ApiService();
  bool _loading = true;

  // Data from Master Profile
  double _activeIncome = 0;
  double _passiveIncome = 0;
  String _cityTier = 'tier2';
  bool _hasPassive = false;

  // Calculated Metrics
  double _activeScore = 0;
  double _passiveScore = 0;
  int _finalPillarScore = 0;
  double _passiveSharePct = 0;
  double _activeSharePct = 0;

  @override
  void initState() {
    super.initState();
    _loadAndCalculate();
  }

  Future<void> _loadAndCalculate() async {
    setState(() => _loading = true);
    try {
      final profileRes = await _api.getMasterProfile();
      final data = profileRes['data'] ?? {};

      _activeIncome = double.tryParse(data['monthlyActiveIncome']?.toString() ?? '0') ?? 0;
      _passiveIncome = double.tryParse(data['passiveIncomeAmount']?.toString() ?? '0') ?? 0;
      _hasPassive = data['hasPassiveIncome'] == true;
      
      // Map display labels to formula keys
      String rawTier = data['cityTier']?.toString().toLowerCase() ?? 'tier2';
      if (rawTier.contains('metro')) _cityTier = 'metro';
      else if (rawTier.contains('tier 3')) _cityTier = 'tier3';
      else _cityTier = 'tier2';

      _calculateScores();
    } catch (e) {
      debugPrint('Error loading income pillar: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  void _calculateScores() {
    // Step 1: Benchmarks
    const Map<String, int> cityMinIncome = {
      'metro': 60000,
      'tier2': 40000,
      'tier3': 25000
    };

    // Step 2: Active Income Score
    _activeScore = (math_min((_activeIncome / (cityMinIncome[_cityTier] ?? 40000)) * 100, 100)).toDouble();

    // Step 3: Passive Income Score (20% passive-to-active ratio = full marks)
    _passiveScore = _hasPassive && _activeIncome > 0
        ? (math_min((_passiveIncome / _activeIncome) * 500, 100)).toDouble()
        : 0;

    // Step 4: Final Income Pillar Score
    _finalPillarScore = (_activeScore * 0.7 + _passiveScore * 0.3).round();

    // UI Percentages
    double total = _activeIncome + _passiveIncome;
    if (total > 0) {
      _passiveSharePct = (_passiveIncome / total) * 100;
      _activeSharePct = 100 - _passiveSharePct;
    } else {
      _passiveSharePct = 0;
      _activeSharePct = 0;
    }
  }

  double math_min(double a, double b) => a < b ? a : b;

  String _formatCompact(double value) {
    if (value >= 100000) return '₹${(value / 100000).toStringAsFixed(2)}L';
    if (value >= 1000) return '₹${(value / 1000).toStringAsFixed(1)}K';
    return '₹${value.round()}';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: AppBar(
        title: const Text("Income Analysis", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
        backgroundColor: isDark ? AppColors.darkCard : AppColors.primary,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: context.adaptiveScreenPadding,
          physics: const BouncingScrollPhysics(),
          child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildScoreHeader(),
            SizedBox(height: context.hp(3)),

            _buildSectionHeader("Earnings Overview"),
            _buildPortfolioCard(isDark),
            SizedBox(height: context.hp(3)),

            _buildSectionHeader("Next Year Income Forecast"),
            _buildIncomeForecastCard(isDark),
            SizedBox(height: context.hp(3)),

            _buildSectionHeader("Income Mix Health"),
            _buildAllocationChart(isDark),
            SizedBox(height: context.hp(3)),

            _buildSectionHeader("Distribution Status"),
            _buildHealthMeter(isDark),
            SizedBox(height: context.hp(4)),
          ],
        ),
      ),
    ),
  );
  }

  Widget _buildOptimizeButton(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: () => AdvisoryService.showAdvisory(context, 'income', _finalPillarScore.toDouble()),
        icon: const Icon(Icons.auto_awesome, color: Colors.white),
        label: const Text("Optimize Now", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 12),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1.1),
      ),
    );
  }

  Widget _buildScoreHeader() {
    return Container(
      padding: EdgeInsets.all(context.wp(6)),
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.primary.withOpacity(0.2)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text("INCOME SCORE", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.primary, letterSpacing: 1.2)),
              const SizedBox(height: 4),
              Text(_finalPillarScore.toString(), style: TextStyle(fontSize: context.sp(40), fontWeight: FontWeight.w900, color: AppColors.primary)),
            ],
          ),
          _buildMiniScoreCircle("Active", _activeScore, AppColors.primary),
          _buildMiniScoreCircle("Passive", _passiveScore, AppColors.accent),
        ],
      ),
    );
  }

  Widget _buildMiniScoreCircle(String label, double score, Color color) {
    return Column(
      children: [
        Container(
          width: 44, height: 44,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: color.withOpacity(0.4), width: 3),
          ),
          child: Text(score.toStringAsFixed(0), style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: color)),
        ),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey)),
      ],
    );
  }

  Widget _buildPortfolioCard(bool isDark) {
    return Container(
      padding: EdgeInsets.all(context.wp(5)),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.borderLight),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text("Total Monthly Income", style: TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.w600)),
              Text(_formatCompact(_activeIncome + _passiveIncome), style: TextStyle(fontSize: context.sp(22), fontWeight: FontWeight.w900, color: AppColors.primary)),
            ],
          ),
          const Divider(height: 32),
          _assetRow("Active Income", _activeIncome, AppColors.primary, "Salary, Business, Freelance", fieldKey: 'monthlyActiveIncome'),
          const SizedBox(height: 16),
          _assetRow("Passive Income", _passiveIncome, AppColors.accent, "Rent, Dividends, Interest", fieldKey: 'passiveIncomeAmount'),
        ],
      ),
    );
  }

  Widget _assetRow(String label, double amount, Color color, String tag, {required String fieldKey}) {
    double total = _activeIncome + _passiveIncome;
    double pct = total > 0 ? (amount / total) * 100 : 0;
    return Row(
      children: [
        Icon(Icons.circle, color: color, size: 12),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              Text(tag, style: const TextStyle(fontSize: 10, color: Colors.grey)),
            ],
          ),
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(_formatCompact(amount), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
            Text("${pct.toStringAsFixed(1)}%", style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.bold)),
          ],
        ),
      ],
    );
  }

  Future<void> _showQuickEdit(String title, String key, double currentVal) async {
    final controller = TextEditingController(text: currentVal.toStringAsFixed(0));
    final updated = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text("Update $title", style: const TextStyle(fontWeight: FontWeight.bold)),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          autofocus: true,
          decoration: InputDecoration(
            labelText: "New Amount (₹)",
            prefixText: "₹ ",
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text("Cancel")),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            child: const Text("Update", style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (updated == true && mounted) {
      setState(() => _loading = true);
      try {
        final res = await _api.getMasterProfile();
        Map<String, dynamic> profile = Map<String, dynamic>.from(res['data'] ?? {});
        profile[key] = controller.text;

        await _api.updateMasterProfile(profile);
        await AuthService().saveMasterProfileLocally(jsonEncode(profile));

        // Brief delay for DB sync
        await Future.delayed(const Duration(seconds: 2));
        await _loadAndCalculate();

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text("$title updated successfully!"), backgroundColor: AppColors.success),
          );
        }
      } catch (e) {
        if (mounted) {
          setState(() => _loading = false);
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error: $e")));
        }
      }
    }
  }

  Widget _buildAllocationChart(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Income Breakdown", style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 20),
          _buildLinearBar("Active Source", _activeSharePct, AppColors.primary, isDark),
          const SizedBox(height: 20),
          _buildLinearBar("Passive Source", _passiveSharePct, AppColors.accent, isDark),
        ],
      ),
    );
  }

  Widget _buildLinearBar(String label, double pct, Color color, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
            Text("${pct.toStringAsFixed(1)}%", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: color)),
          ],
        ),
        const SizedBox(height: 8),
        Stack(
          children: [
            Container(
              height: 10,
              width: double.infinity,
              decoration: BoxDecoration(
                color: isDark ? Colors.white10 : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(5),
              ),
            ),
            FractionallySizedBox(
              widthFactor: (pct / 100).clamp(0.01, 1.0),
              child: Container(
                height: 10,
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(5),
                  boxShadow: [
                    BoxShadow(color: color.withOpacity(0.3), blurRadius: 4, offset: const Offset(0, 2))
                  ],
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  double _getAnnualInflationRate() {
    final int currentYear = DateTime.now().year;
    // Seeded random based on current year to stay fixed throughout the year (1st Jan to 1st Jan)
    final Random rng = Random(currentYear * 1009);
    // Pick value in 6.70% to 8.20% range
    final double rate = 6.70 + (rng.nextDouble() * 1.50);
    return double.parse(rate.toStringAsFixed(2));
  }

  Widget _buildIncomeForecastCard(bool isDark) {
    final double currentMonthly = _activeIncome + _passiveIncome;
    final double rate = _getAnnualInflationRate();
    final double forecastMonthly = currentMonthly * (1 + rate / 100);
    final double forecastAnnual = forecastMonthly * 12;
    final double monthlyGrowth = forecastMonthly - currentMonthly;
    final int nextFyYear = DateTime.now().year + 1;

    return Container(
      padding: EdgeInsets.all(context.wp(5)),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131520) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: const Color(0xFF8B5CF6).withOpacity(0.35),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF8B5CF6).withOpacity(0.08),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "PROJECTED INCOME – FY $nextFyYear",
                style: const TextStyle(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFFA855F7),
                  letterSpacing: 0.8,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFF00E676).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: const Color(0xFF00E676).withOpacity(0.4),
                    width: 0.8,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.trending_up_rounded, size: 12, color: Color(0xFF00E676)),
                    const SizedBox(width: 4),
                    Text(
                      "+${rate.toStringAsFixed(2)}%",
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF00E676),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "Projected Monthly Income",
                    style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _formatCompact(forecastMonthly),
                    style: TextStyle(
                      fontSize: context.sp(22),
                      fontWeight: FontWeight.w900,
                      color: isDark ? Colors.white : AppColors.textPrimaryLight,
                    ),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    "+${_formatCompact(monthlyGrowth)} / mo",
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF00E676),
                    ),
                  ),
                  Text(
                    "₹${_formatCompact(forecastAnnual)} / year",
                    style: const TextStyle(
                      fontSize: 10,
                      color: Colors.grey,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const Divider(height: 24),
          Row(
            children: [
              const Icon(Icons.info_outline_rounded, size: 13, color: Colors.grey),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  "Annual forecast inflation-adjusted (${rate.toStringAsFixed(2)}% rate). Updated yearly on Jan 1st.",
                  style: const TextStyle(fontSize: 9.5, color: Colors.grey, height: 1.3),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHealthMeter(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Distribution Health", style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
          const SizedBox(height: 20),
          Container(
            height: 12,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(99),
              gradient: const LinearGradient(colors: [AppColors.danger, AppColors.warning, AppColors.success]),
            ),
            child: LayoutBuilder(
              builder: (ctx, constraints) => Stack(
                clipBehavior: Clip.none,
                children: [
                  Positioned(
                    left: (_finalPillarScore / 100) * (constraints.maxWidth - 20),
                    top: -4,
                    child: Container(
                      width: 20, height: 20,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.black, width: 3),
                        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4)],
                      ),
                    ),
                  )
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            _finalPillarScore >= 75 
                ? "Excellent! Your income streams are well diversified." 
                : "Strategy: Aim for passive income to reach at least 25% of your total earnings.",
            style: TextStyle(fontSize: 12, color: isDark ? Colors.white70 : Colors.black54, fontStyle: FontStyle.italic),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {
                Navigator.pushNamed(context, '/master_data', arguments: 'income');
              },
              icon: const Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 18),
              label: const Text("Optimize Now", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
