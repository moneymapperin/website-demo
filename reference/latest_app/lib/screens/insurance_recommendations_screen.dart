import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import 'package:intl/intl.dart';

class InsuranceRecommendationsScreen extends StatefulWidget {
  const InsuranceRecommendationsScreen({super.key});

  @override
  State<InsuranceRecommendationsScreen> createState() => _InsuranceRecommendationsScreenState();
}

class _InsuranceRecommendationsScreenState extends State<InsuranceRecommendationsScreen> {
  final ApiService _api = ApiService();
  bool _loading = true;
  List<dynamic> _recommendations = [];
  final _moneyFormat = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

  @override
  void initState() {
    super.initState();
    _loadRecommendations();
  }

  Future<void> _loadRecommendations() async {
    setState(() => _loading = true);
    try {
      final recs = await _api.getInsuranceRecommendations();
      if (mounted) {
        setState(() {
          _recommendations = recs;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _compactAmount(dynamic val) {
    double amount = double.tryParse(val.toString()) ?? 0;
    if (amount >= 10000000) return "₹${(amount / 10000000).toStringAsFixed(1)} Cr";
    if (amount >= 100000) return "₹${(amount / 100000).toStringAsFixed(0)} Lakh";
    return _moneyFormat.format(amount);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: AppBar(
        title: const Text("Family Shield Strategy", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        backgroundColor: isDark ? AppColors.darkCard : AppColors.primary,
        elevation: 0,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : Column(
              children: [
                _buildHeader(isDark),
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _recommendations.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (ctx, i) {
                      final p = _recommendations[i];
                      return _buildPlanCard(p, isDark);
                    },
                  ),
                ),
                _buildFooter(isDark),
              ],
            ),
    );
  }

  Widget _buildHeader(bool isDark) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.1),
        border: Border(bottom: BorderSide(color: isDark ? AppColors.darkBorder : AppColors.borderLight)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.verified_user_rounded, color: AppColors.primary, size: 24),
              const SizedBox(width: 12),
              const Text(
                "PROTECTION STRATEGY",
                style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: AppColors.primary, letterSpacing: 1.2),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            "Curated high-CSR plans to safeguard your family and income.",
            style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.w600),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildPlanCard(Map<String, dynamic> p, bool isDark) {
    final isHealth = p['type'] == 'Health';
    final typeColor = isHealth ? const Color(0xFF08796F) : const Color(0xFF0F5F97);

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: typeColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    "${p['type']} PROTECTION".toUpperCase(),
                    style: TextStyle(color: typeColor, fontSize: 9, fontWeight: FontWeight.bold),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    p['tag'].toUpperCase(),
                    style: const TextStyle(color: AppColors.primary, fontSize: 9, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Text(
              "${p['company']} - ${p['policy']}",
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            Text(
              p['bestFor'],
              style: const TextStyle(fontSize: 11, color: Colors.grey),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _miniStat("COVER", _compactAmount(p['cover'])),
                _miniStat("PREMIUM", "${_moneyFormat.format(p['premium'])}/yr"),
                _miniStat("CSR", "${p['claimRatio']}%"),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _miniStat(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 8, color: Colors.grey, fontWeight: FontWeight.bold)),
        const SizedBox(height: 2),
        Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900)),
      ],
    );
  }

  Widget _buildFooter(bool isDark) {
    return Container(
      padding: EdgeInsets.fromLTRB(24, 16, 24, MediaQuery.of(context).padding.bottom + 16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        border: Border(top: BorderSide(color: isDark ? AppColors.darkBorder : AppColors.borderLight)),
      ),
      child: Column(
        children: [
          const Text(
            "Note: Recommendations are based on claim settlement ratios and market stability. Always review the policy document for specific inclusions and exclusions.",
            style: TextStyle(fontSize: 9, color: Colors.grey, height: 1.4),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => launchUrl(Uri.parse("https://wa.me/917987469093?text=Hi+MoneyMapper%2C+I+want+to+explore+insurance+options.&utm_source=chatgpt.com"), mode: LaunchMode.externalApplication),
              icon: const Icon(Icons.chat_bubble_outline_rounded, color: Colors.white, size: 20),
              label: const Text("Get Insurance Assistance", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF25D366),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () => Navigator.pop(context),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: const Text("Got it, Back to Strategy", style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }
}
