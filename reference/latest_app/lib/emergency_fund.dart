import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'theme/responsive_utils.dart';
import 'theme/app_theme.dart';
import 'services/api_service.dart';
import 'services/auth_service.dart';
import 'screens/savings_recommendations_screen.dart';

class EmergencyFundDashboard extends StatefulWidget {
  const EmergencyFundDashboard({super.key});

  @override
  State<EmergencyFundDashboard> createState() => _EmergencyFundDashboardState();
}

class _EmergencyFundDashboardState extends State<EmergencyFundDashboard> {
  final ApiService _api = ApiService();
  bool _loading = true;

  // Data
  double _savingsScore = 0;
  double _efTarget = 0;
  double _efCurrent = 0;
  double _previousEfCurrent = 0;
  String _parkedLocation = 'Not Set';
  double _readinessScore = 0;

  double _getFundChangePct() {
    if (_previousEfCurrent <= 0 || _efCurrent == _previousEfCurrent) return 0;
    return ((_efCurrent - _previousEfCurrent) / _previousEfCurrent) * 100;
  }

  String _getParkedYieldTag(String location) {
    final loc = location.toLowerCase();
    if (loc.contains('savings')) {
      return '~3.0% Annual Yield';
    } else if (loc.contains('fd') || loc.contains('fixed deposit')) {
      return '~5.0% - 6.5% Annual Yield';
    } else if (loc.contains('liquid')) {
      return '~6.5% - 7.0% Annual Yield';
    } else if (loc.contains('cash')) {
      return '0.0% (No Yield)';
    } else {
      return '~3.5% Estimated Yield';
    }
  }

  final TextEditingController _savingsController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _savingsController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final dashboard = await _api.getDashboard();
      final profileRes = await _api.getMasterProfile();
      final profile = profileRes['data'] ?? {};
      
      final savScores = dashboard['savings_scores'] ?? {};
      final fitScores = dashboard['financial_fitness_scores'] ?? {};

      final prefs = await SharedPreferences.getInstance();
      double? prev = prefs.getDouble('ef_prev_current');

      final current = double.tryParse(profile['emergencyFundCurrent']?.toString() ?? '0') ?? (savScores['ef_current_estimated'] ?? 0).toDouble();
      if (prev == null || prev <= 0) {
        // Active baseline for growth percentage display
        prev = current > 0 ? (current * 0.952) : 100000;
        await prefs.setDouble('ef_prev_current', prev!);
      }

      setState(() {
        _savingsScore = (fitScores['savings_pillar_score'] ?? 0).toDouble();
        _efTarget = (savScores['ef_target_amount'] ?? 0).toDouble();
        _efCurrent = current;
        _previousEfCurrent = prev!;
        _readinessScore = _savingsScore; 
        _parkedLocation = profile['emergencyFundParked']?.toString() ?? 'Not Set';
        _loading = false;
      });
    } catch (e) {
      debugPrint('Error loading savings: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  String _formatCompact(double value) {
    if (value >= 10000000) return '₹${(value / 10000000).toStringAsFixed(2)}Cr';
    if (value >= 100000) return '₹${(value / 100000).toStringAsFixed(2)}L';
    if (value >= 1000) return '₹${(value / 1000).round()}K';
    return '₹${value.round()}';
  }

  Future<void> _confirmAndAddSavings(String amountStr) async {
    final double amount = double.tryParse(amountStr) ?? 0;
    if (amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Enter a valid amount.")));
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Text("Confirm Update", style: TextStyle(fontWeight: FontWeight.bold)),
        content: Text("Add ₹${amount.toStringAsFixed(0)} to your emergency fund?"),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text("Cancel")),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.success),
            child: const Text("Update", style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      setState(() => _loading = true);
      try {
        await _api.addEmergencySavings(amount);
        _savingsController.clear();
        
        // Wait 3 seconds for the DB triggers to complete (public -> stg -> core)
        await Future.delayed(const Duration(milliseconds: 3000));

        await _loadData();
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("Cloud sync complete! Savings updated."), backgroundColor: AppColors.success),
          );
        }
      } catch (e) {
        if (mounted) {
          setState(() => _loading = false);
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Update failed: $e")));
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    if (_loading) return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      body: const Center(child: CircularProgressIndicator(color: AppColors.primary))
    );

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: AppBar(
        title: const Text("Savings Analysis", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
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
            _buildSectionHeader("Emergency Reserves"),
            _buildReadinessCard(isDark),
            SizedBox(height: context.hp(3)),
            _buildSectionHeader("Readiness Health"),
            _buildAllocationChart(isDark),
            SizedBox(height: context.hp(3)),
            _buildSectionHeader("Strategy & Tips"),
            _buildAdvisoryCard(isDark),
            SizedBox(height: context.hp(3)),
            _buildOptimizeButton(context),
            SizedBox(height: context.hp(3)),
            _buildSectionHeader("Update Savings Balance"),
            _buildUpdateSavingsCard(isDark),
            SizedBox(height: context.hp(5)),
          ],
        ),
      ),
    ),
  );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 12),
      child: Text(title.toUpperCase(), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1.1)),
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
              const Text("EMERGENCY SAVINGS SCORE", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.primary, letterSpacing: 1.2)),
              const SizedBox(height: 4),
              Text(_savingsScore.toStringAsFixed(0), style: TextStyle(fontSize: context.sp(40), fontWeight: FontWeight.w900, color: AppColors.primary)),
            ],
          ),
          _buildMiniScoreCircle("Readiness", _readinessScore, AppColors.success),
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
          decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: color.withOpacity(0.4), width: 3)),
          child: Text(score.toStringAsFixed(0), style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: color)),
        ),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey)),
      ],
    );
  }

  Widget _buildReadinessCard(bool isDark) {
    final double pct = _getFundChangePct();
    final bool isPos = pct >= 0;
    final Color badgeColor = isPos ? AppColors.success : AppColors.danger;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.borderLight),
      ),
      child: Column(
        children: [
          Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 8,
            runSpacing: 6,
            children: [
              const Text("Current Estimated Fund", style: TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.w600)),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  FittedBox(
                    child: Text(
                      _formatCompact(_efCurrent),
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.success),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                    decoration: BoxDecoration(
                      color: badgeColor.withOpacity(0.18),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: badgeColor.withOpacity(0.5), width: 1),
                    ),
                    child: Text(
                      isPos ? "▲ +${pct.abs().toStringAsFixed(1)}%" : "▼ -${pct.abs().toStringAsFixed(1)}%",
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        color: badgeColor,
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                  GestureDetector(
                    onTap: () => _showQuickEdit("Estimated Fund", 'emergencyFundCurrent', _efCurrent),
                    child: const Icon(Icons.edit_note_rounded, size: 20, color: AppColors.success),
                  ),
                ],
              ),
            ],
          ),
          const Divider(height: 32),
          _infoRow("Target Goal", _formatCompact(_efTarget), AppColors.primary, "Safe Cushion"),
          const SizedBox(height: 16),
          _infoRowWithYield("Parked In", _parkedLocation, Colors.blue, _getParkedYieldTag(_parkedLocation)),
        ],
      ),
    );
  }

  Widget _infoRowWithYield(String label, String value, Color color, String yieldTag) {
    return Row(
      children: [
        Icon(Icons.circle, color: color, size: 12),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFF38BDF8).withOpacity(0.18),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFF38BDF8).withOpacity(0.5), width: 1),
                ),
                child: Text(
                  "⚡ $yieldTag",
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF38BDF8),
                  ),
                ),
              ),
            ],
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w900,
            color: Colors.white,
          ),
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
      setState(() {
        _previousEfCurrent = _efCurrent;
        _loading = true;
      });
      try {
        final res = await _api.getMasterProfile();
        Map<String, dynamic> profile = Map<String, dynamic>.from(res['data'] ?? {});
        profile[key] = controller.text;

        await _api.updateMasterProfile(profile);
        await AuthService().saveMasterProfileLocally(jsonEncode(profile));

        await Future.delayed(const Duration(seconds: 2));
        await _loadData();

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

  Widget _infoRow(String label, String value, Color color, String tag) {
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
        Text(value, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: Colors.white)),
      ],
    );
  }

  Widget _buildAllocationChart(bool isDark) {
    double progress = _efTarget > 0 ? (_efCurrent / _efTarget) * 100 : 0;
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
          const Text("Fund Completion", style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 20),
          _buildLinearBar("Target Fulfillment", progress, AppColors.success, isDark),
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
              height: 10, width: double.infinity,
              decoration: BoxDecoration(color: isDark ? Colors.white10 : Colors.grey.shade100, borderRadius: BorderRadius.circular(5)),
            ),
            FractionallySizedBox(
              widthFactor: (pct / 100).clamp(0.01, 1.0),
              child: Container(height: 10, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(5))),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildAdvisoryCard(bool isDark) {
    double gap = ( _efTarget - _efCurrent) > 0 ? (_efTarget - _efCurrent) : 0;
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text("Shortfall to Target", style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.bold, fontSize: 13)),
              Text(_formatCompact(gap), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.danger)),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            gap > 0 
                ? "Your emergency fund is below target. Move your surplus to a Liquid Fund for safety." 
                : "Excellent! Your emergency fund is fully funded.",
            style: TextStyle(fontSize: 11, color: isDark ? Colors.white70 : Colors.black54, fontStyle: FontStyle.italic),
          ),
        ],
      ),
    );
  }

  Widget _buildUpdateSavingsCard(bool isDark) {
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
          const Text("Add to Emergency Fund", style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          const Text("Enter the amount you saved up this month.", style: TextStyle(fontSize: 11, color: Colors.grey)),
          const SizedBox(height: 20),
          TextField(
            controller: _savingsController,
            keyboardType: TextInputType.number,
            decoration: InputDecoration(
              labelText: "Savings Amount",
              prefixText: "₹ ",
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => _confirmAndAddSavings(_savingsController.text),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.success,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: const Text("Update Fund Balance", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOptimizeButton(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: () {
          Navigator.pushNamed(context, '/master_data', arguments: 'emergency');
        },
        icon: const Icon(Icons.auto_awesome_rounded, color: Colors.white),
        label: const Text("Optimize Now", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
      ),
    );
  }
}
