import 'dart:convert';
import 'package:flutter/material.dart';
import 'theme/responsive_utils.dart';
import 'theme/app_theme.dart';
import 'services/api_service.dart';
import 'services/auth_service.dart';
import 'screens/insurance_recommendations_screen.dart';

class InsuranceDashboard extends StatefulWidget {
  const InsuranceDashboard({super.key});

  @override
  State<InsuranceDashboard> createState() => _InsuranceDashboardState();
}

class _InsuranceDashboardState extends State<InsuranceDashboard> {
  final ApiService _api = ApiService();
  bool _loading = true;

  // Data
  double _protectionScore = 0;
  double _termScore = 0;
  double _healthScore = 0;
  double _termGap = 0;
  double _healthGap = 0;

  // Raw values
  double _termCover = 0;
  double _lifeCover = 0;
  double _healthCover = 0;
  double _annualIncome = 0;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final dashboard = await _api.getDashboard();
      final profileRes = await _api.getMasterProfile();
      final profile = profileRes['data'] ?? {};
      
      final protScores = dashboard['protection_scores'] ?? {};
      final fitScores = dashboard['financial_fitness_scores'] ?? {};

      setState(() {
        _protectionScore = (fitScores['protection_pillar_score'] ?? 0).toDouble();
        _termScore = (protScores['term_score'] ?? 0).toDouble();
        _healthScore = (protScores['health_score'] ?? 0).toDouble();

        // Raw inputs from profile
        final monthlyIncome = double.tryParse(profile['monthlyActiveIncome']?.toString() ?? '0') ?? 0;
        _annualIncome = monthlyIncome * 12;

        _termCover = double.tryParse(profile['termCover']?.toString() ?? '0') ?? 0;
        _lifeCover = double.tryParse(profile['lifeCover']?.toString() ?? '0') ?? 0;
        _healthCover = double.tryParse(profile['healthCover']?.toString() ?? '0') ?? 0;

        // Custom Formula-based Gap Analysis
        // Life & Term Gap: 15x Annual Income - Total Life/Term
        final lifeTarget = _annualIncome * 15;
        final totalLifeCover = _termCover + _lifeCover;
        _termGap = (lifeTarget - totalLifeCover).clamp(0.0, double.infinity);

        // Health Gap: 10x Annual Income - Health Cover
        final healthTarget = _annualIncome * 10;
        _healthGap = (healthTarget - _healthCover).clamp(0.0, double.infinity);

        _loading = false;
      });
    } catch (e) {
      debugPrint('Error loading protection: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  String _formatCompact(double value) {
    if (value >= 100000) return '₹${(value / 100000).toStringAsFixed(1)}L';
    if (value >= 1000) return '₹${(value / 1000).round()}K';
    return '₹${value.round()}';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: AppBar(
        title: const Text("Protection Analysis", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
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
            
            _buildSectionHeader("Active Coverage"),
            _buildPortfolioCard(isDark),
            SizedBox(height: context.hp(3)),

            _buildSectionHeader("Protection Health"),
            _buildAllocationChart(isDark),
            SizedBox(height: context.hp(3)),

            _buildSectionHeader("Shortfall Analysis"),
            _buildGapCard(isDark),
            SizedBox(height: context.hp(3)),
            _buildOptimizeButton(context),
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
        onPressed: () => Navigator.pushNamed(context, '/master_data', arguments: 'insurance'),
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
              const Text("PROTECTION SCORE", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.primary, letterSpacing: 1.2)),
              const SizedBox(height: 4),
              Text(_protectionScore.toStringAsFixed(0), style: TextStyle(fontSize: context.sp(40), fontWeight: FontWeight.w900, color: AppColors.primary)),
            ],
          ),
          _buildMiniScoreCircle("Life", _termScore, Colors.blue),
          _buildMiniScoreCircle("Health", _healthScore, Colors.teal),
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
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.borderLight),
      ),
      child: Column(
        children: [
          _assetRow("Term Insurance", _termCover, Colors.blue, "Life Protection"),
          const SizedBox(height: 16),
          _assetRow("Health Insurance", _healthCover, Colors.teal, "Medical Shield"),
        ],
      ),
    );
  }

  Widget _assetRow(String label, double amount, Color color, String tag) {
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
        Text(_formatCompact(amount), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
      ],
    );
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
          const Text("Coverage Health", style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 20),
          _buildLinearBar("Life Cover Score", _termScore, Colors.blue, isDark),
          const SizedBox(height: 20),
          _buildLinearBar("Health Cover Score", _healthScore, Colors.teal, isDark),
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
            Text("${pct.toStringAsFixed(0)}/100", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: color)),
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
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildGapCard(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.borderLight),
      ),
      child: Column(
        children: [
          _gapRow("Term & Life Gap", _termGap, Colors.blue),
          const Divider(height: 24),
          _gapRow("Health Gap", _healthGap, Colors.teal),
        ],
      ),
    );
  }

  Widget _gapRow(String label, double gap, Color color) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
        Text(
          "Shortfall: ${_formatCompact(gap)}",
          style: TextStyle(
            fontSize: 13, 
            fontWeight: FontWeight.w900, 
            color: gap > 0 ? AppColors.danger : AppColors.success
          ),
        ),
      ],
    );
  }
}
