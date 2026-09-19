import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../services/premium_service.dart';

class MfRecommendationsScreen extends StatefulWidget {
  final String riskAppetite;

  const MfRecommendationsScreen({super.key, required this.riskAppetite});

  @override
  State<MfRecommendationsScreen> createState() => _MfRecommendationsScreenState();
}

class _MfRecommendationsScreenState extends State<MfRecommendationsScreen> {
  final ApiService _api = ApiService();
  final PremiumService _premiumService = PremiumService();
  bool _loading = true;
  bool _isPro = false;
  List<dynamic> _recommendations = [];

  @override
  void initState() {
    super.initState();
    _loadPremiumStatus();
    _loadRecommendations();
  }

  Future<void> _loadPremiumStatus() async {
    final isPro = await _premiumService.isPro();
    if (mounted) setState(() => _isPro = isPro);
  }

  Future<void> _loadRecommendations() async {
    setState(() => _loading = true);
    try {
      final recs = await _api.getMutualFundRecommendations(widget.riskAppetite);
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

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: AppBar(
        title: const Text("Wealth Growth Blueprint", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        backgroundColor: isDark ? AppColors.darkCard : AppColors.primary,
        elevation: 0,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : Column(
              children: [
                _buildHeader(isDark),
                if (!_isPro)
                  GestureDetector(
                    onTap: () => Navigator.pushNamed(context, '/subscription'),
                    child: Container(
                      width: double.infinity,
                      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.orange.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.orange.withOpacity(0.3)),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.lock_clock_rounded, color: Colors.orange, size: 18),
                          SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              "Free users see only 1 expert pick. Upgrade to PRO to see all wealth blueprints! 🚀",
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.orange),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _recommendations.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (ctx, i) {
                      final f = _recommendations[i];
                      final isLocked = !_isPro && i > 0;
                      return GestureDetector(
                        onTap: isLocked ? () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text("Upgrade to PRO to unlock all wealth blueprints! 🚀"),
                              backgroundColor: Colors.orange,
                            ),
                          );
                        } : null,
                        child: Stack(
                          children: [
                            ImageFiltered(
                              imageFilter: isLocked ? ImageFilter.blur(sigmaX: 5, sigmaY: 5) : ImageFilter.blur(sigmaX: 0, sigmaY: 0),
                              child: _buildFundCard(f, isDark, isLocked: isLocked),
                            ),
                            if (isLocked)
                              Positioned.fill(
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: Colors.black.withOpacity(0.05),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Center(
                                    child: Column(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.all(10),
                                          decoration: BoxDecoration(
                                            color: Colors.orange,
                                            shape: BoxShape.circle,
                                            boxShadow: [
                                              BoxShadow(color: Colors.orange.withOpacity(0.5), blurRadius: 10)
                                            ],
                                          ),
                                          child: const Icon(Icons.lock_person_rounded, color: Colors.white, size: 24),
                                        ),
                                        const SizedBox(height: 4),
                                        const Text(
                                          "PRO",
                                          style: TextStyle(color: Colors.orange, fontWeight: FontWeight.w900, fontSize: 10),
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
              const Icon(Icons.auto_awesome, color: AppColors.primary, size: 24),
              const SizedBox(width: 12),
              Text(
                "${widget.riskAppetite.toUpperCase()} STRATEGY",
                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: AppColors.primary, letterSpacing: 1.2),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            "Curated high-growth funds matching your wealth profile.",
            style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.w600),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildFundCard(Map<String, dynamic> f, bool isDark, {bool isLocked = false}) {
    final String fundType = f['type'] ?? 'Moderate';
    Color typeColor = AppColors.primary;
    if (fundType == 'Aggressive') typeColor = const Color(0xFFEF4444);
    if (fundType == 'Conservative') typeColor = const Color(0xFF10B981);

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
                    color: AppColors.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    f['category'].toUpperCase(),
                    style: const TextStyle(color: AppColors.primary, fontSize: 9, fontWeight: FontWeight.bold),
                  ),
                ),
                // NEW: Risk Type Tag in Top Right
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: typeColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    fundType.toUpperCase(),
                    style: TextStyle(color: typeColor, fontSize: 9, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Text(
                  f['name'],
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                ),
                if (!_isPro && !isLocked) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(color: Colors.orange.withOpacity(0.2), borderRadius: BorderRadius.circular(4)),
                    child: const Text("14-day trial", style: TextStyle(color: Colors.orange, fontSize: 8, fontWeight: FontWeight.bold)),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text("3Y ANNUAL RETURNS", style: TextStyle(fontSize: 9, color: Colors.grey, fontWeight: FontWeight.bold)),
                    Text(f['return'], style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppColors.success)),
                  ],
                ),
                Row(
                  children: List.generate(5, (star) => Icon(
                    Icons.star_rounded, 
                    size: 14, 
                    color: star < f['rating'] ? Colors.amber : Colors.grey.withOpacity(0.3),
                  )),
                ),
              ],
            ),
          ],
        ),
      ),
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
            "Disclaimer: Mutual fund investments are subject to market risks. Please read all scheme-related documents carefully before investing.",
            style: TextStyle(fontSize: 9, color: Colors.grey, height: 1.4),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => launchUrl(Uri.parse("https://wa.me/917987469093?text=Hi!+I+want+to+start+my+investments.+Can+you+help+me?"), mode: LaunchMode.externalApplication),
              icon: const Icon(Icons.rocket_launch_rounded, color: Colors.white, size: 20),
              label: const Text("Start My Investment", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
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
