import 'package:flutter/material.dart';
import '../services/market_data_service.dart';
import '../services/resilience_utils.dart';
import '../theme/app_theme.dart';

class GoldRatesScreen extends StatefulWidget {
  const GoldRatesScreen({super.key});

  @override
  State<GoldRatesScreen> createState() => _GoldRatesScreenState();
}

class _GoldRatesScreenState extends State<GoldRatesScreen> {
  final _marketService = MarketDataService();
  Map<String, dynamic>? _goldData;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadRates();
  }

  Future<void> _loadRates({bool force = false}) async {
    setState(() => _loading = true);
    try {
      final data = await _marketService.getGoldRate(forceRefresh: force);
      setState(() {
        _goldData = data;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : const Color(0xFFFFFBEB), // Very light golden background
      appBar: AppBar(
        title: Text(
          "Live Gold Market",
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back,
            color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
          ),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: Icon(
              Icons.refresh_rounded,
              color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
            ),
            onPressed: () => _loadRates(force: true),
          ),
        ],
      ),
      body: Stack(
        children: [
          _loading
              ? const Center(child: CircularProgressIndicator(color: Color(0xFFD4AF37)))
              : SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _headerSection(isDark),
                      const SizedBox(height: 32),
                      Text(
                        "MARKET RATES (PER GRAM)",
                        style: TextStyle(
                          fontSize: 14, // Increased from 11
                          fontWeight: FontWeight.w900,
                          color: isDark ? Colors.white54 : Colors.black54,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 16),
                      GridView.count(
                        crossAxisCount: 2,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        mainAxisSpacing: 16,
                        crossAxisSpacing: 16,
                        childAspectRatio: 1.3,
                        children: [
                          _buildMetalCard("24K (999 Purity)", _goldData?['24K (999 Purity)'], true, isDark),
                          _buildMetalCard("22K (916 Purity)", _goldData?['22K (916 Purity)'], true, isDark),
                          _buildMetalCard("18K (750 Purity)", _goldData?['18K (750 Purity)'], true, isDark),
                          _buildMetalCard("14K (585 Purity)", _goldData?['14K (585 Purity)'], true, isDark),
                        ],
                      ),
                      const SizedBox(height: 48),
                      _disclaimer(isDark),
                    ],
                  ),
                ),
        ],
      ),
    );
  }

  Widget _headerSection(bool isDark) {
    final double price24k_10g = ResilienceUtils.safeDouble(_goldData?['24K (999 Purity)']) * 10;
    final String timeInfo = _goldData?['time'] ?? 'Now';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B).withOpacity(0.8) : Colors.white.withOpacity(0.9),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(
          color: const Color(0xFFD4AF37).withOpacity(isDark ? 0.3 : 0.4),
          width: 2,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFD4AF37).withOpacity(0.1),
            blurRadius: 20,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                "24K GOLD RATE",
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFFD4AF37),
                  letterSpacing: 1.5,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text("LIVE SYNC", style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.green)),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              const Padding(
                padding: EdgeInsets.only(bottom: 8),
                child: Text("₹", style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Color(0xFFD4AF37))),
              ),
              const SizedBox(width: 8),
              Text(
                price24k_10g.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},'),
                style: TextStyle(
                  fontSize: 54, // Increased from 48
                  fontWeight: FontWeight.w900,
                  color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            "per 10 gm / tola",
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold, 
              color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            "Last Update: $timeInfo",
            style: TextStyle(
              fontSize: 10, 
              color: isDark ? AppColors.textSecondaryDark.withOpacity(0.6) : AppColors.textSecondaryLight.withOpacity(0.6), 
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetalCard(String label, dynamic price, bool isGold, bool isDark) {
    final double priceVal = ResilienceUtils.safeDouble(price);
    String unit = "per 1 Gram";

    final Color accentColor = isGold ? const Color(0xFFD4AF37) : const Color(0xFFE0E0E0);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B).withOpacity(0.9) : Colors.white.withOpacity(0.95),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.1) : Colors.grey.shade200,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            label.split(' ')[0],
            style: TextStyle(
              fontSize: 16, // Increased from 14
              fontWeight: FontWeight.w900,
              color: isDark ? Colors.white : AppColors.textPrimaryLight,
            ),
          ),
          Text(
            label.contains('(') ? label.substring(label.indexOf('(')) : '',
            style: TextStyle(fontSize: 10, color: isDark ? Colors.white38 : Colors.black38, fontWeight: FontWeight.bold),
          ),
          const Spacer(),
          Row(
            children: [
              Text("₹", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: accentColor)),
              const SizedBox(width: 4),
              Text(
                priceVal.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},'),
                style: TextStyle(
                  fontSize: 22, // Increased from 18
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : AppColors.textPrimaryLight,
                ),
              ),
            ],
          ),
          const SizedBox(height: 2),
          Text(
            unit,
            style: TextStyle(fontSize: 9, color: isDark ? Colors.white38 : Colors.black38, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _disclaimer(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withOpacity(0.03) : Colors.black.withOpacity(0.03),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.info_outline, 
                size: 14, 
                color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
              ),
              const SizedBox(width: 8),
              Text(
                "DISCLAIMER", 
                style: TextStyle(
                  fontSize: 10, 
                  fontWeight: FontWeight.bold, 
                  color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            "Rates are indicative. Retail prices may vary across different jewelers and cities due to local taxes (GST) and making charges.",
            style: TextStyle(
              fontSize: 10, 
              color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight, 
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}
