import 'package:flutter/material.dart';
import 'dart:ui';
import '../theme/app_theme.dart';
import '../services/resilience_utils.dart';
import '../services/branding_utils.dart';
import '../services/premium_service.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

class InsuranceScreenerScreen extends StatefulWidget {
  const InsuranceScreenerScreen({super.key});

  @override
  State<InsuranceScreenerScreen> createState() => _InsuranceScreenerScreenState();
}

class _InsuranceScreenerScreenState extends State<InsuranceScreenerScreen> {
  final _supabase = Supabase.instance.client;
  final _premiumService = PremiumService();
  final TextEditingController _searchController = TextEditingController();
  
  bool _loading = true;
  bool _isPro = false;
  List<Map<String, dynamic>> _allPlans = [];
  List<Map<String, dynamic>> _filteredPlans = [];
  
  String _selectedType = "All";

  @override
  void initState() {
    super.initState();
    _loadPremiumStatus();
    _fetchData();
  }

  Future<void> _loadPremiumStatus() async {
    final isPro = await _premiumService.isPro();
    if (mounted) setState(() => _isPro = isPro);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchData() async {
    if (!mounted) return;
    setState(() => _loading = true);
    
    try {
      final res = await _supabase
          .schema('bse_data')
          .from('insurance_plans')
          .select()
          .order('smart_score', ascending: false);
      
      if (mounted) {
        setState(() {
          _allPlans = List<Map<String, dynamic>>.from(res);
          _filteredPlans = _allPlans;
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('Insurance Screener Fetch Error: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  void _applyFilters() {
    setState(() {
      final query = _searchController.text.toLowerCase();
      _filteredPlans = _allPlans.where((p) {
        final nameMatch = (p['company']?.toString().toLowerCase().contains(query) ?? false) || 
                          (p['policy']?.toString().toLowerCase().contains(query) ?? false);
        final typeMatch = _selectedType == "All" || p['insurance_type'] == _selectedType;
        return nameMatch && typeMatch;
      }).toList();
    });
  }

  String _formatCover(dynamic val) {
    double value = ResilienceUtils.safeDouble(val);
    if (value >= 10000000) return "₹${(value / 10000000).toStringAsFixed(1)} Cr";
    if (value >= 100000) return "₹${(value / 100000).toStringAsFixed(0)} Lakh";
    return "₹${value.toStringAsFixed(0)}";
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: AppBar(
        title: const Text("Insurance Score Card", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _fetchData),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                _buildHeader(isDark),
                Expanded(child: _buildPlanList(isDark)),
              ],
            ),
    );
  }

  Widget _buildHeader(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      color: isDark ? AppColors.darkCard : Colors.white,
      child: Column(
        children: [
          GestureDetector(
            onTap: _isPro ? null : () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text("Upgrade to PRO to unlock Search! 🚀"),
                  backgroundColor: Colors.orange,
                ),
              );
            },
            child: Stack(
              alignment: Alignment.center,
              children: [
                ImageFiltered(
                  imageFilter: !_isPro ? ImageFilter.blur(sigmaX: 4, sigmaY: 4) : ImageFilter.blur(sigmaX: 0, sigmaY: 0),
                  child: TextField(
                    enabled: _isPro,
                    controller: _searchController,
                    onChanged: (_) => _applyFilters(),
                    decoration: InputDecoration(
                      hintText: _isPro ? "Search company or policy..." : "Search locked for Free users",
                      prefixIcon: const Icon(Icons.search, size: 20),
                      filled: true,
                      fillColor: isDark ? Colors.white.withOpacity(0.05) : Colors.grey.shade100,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    ),
                  ),
                ),
                if (!_isPro)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.lock_rounded, color: Colors.amber, size: 18),
                      const SizedBox(width: 8),
                      Text(
                        "PRO SEARCH",
                        style: TextStyle(
                          color: Colors.amber.shade700,
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
          const SizedBox(height: 12),
          Row(
            children: [
              _typeButton("All", isDark),
              const SizedBox(width: 8),
              _typeButton("Health", isDark),
              const SizedBox(width: 8),
              _typeButton("Life", isDark),
            ],
          ),
        ],
      ),
    );
  }

  Widget _typeButton(String type, bool isDark) {
    final isActive = _selectedType == type;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          if (!_isPro) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text("Upgrade to PRO to unlock Category Filters! 🚀"),
                backgroundColor: Colors.orange,
              ),
            );
            return;
          }
          setState(() => _selectedType = type);
          _applyFilters();
        },
        child: ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: Stack(
            alignment: Alignment.center,
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: isActive ? AppColors.primary : (isDark ? Colors.white10 : Colors.grey.shade100),
                ),
                alignment: Alignment.center,
                child: ImageFiltered(
                  imageFilter: !_isPro ? ImageFilter.blur(sigmaX: 4, sigmaY: 4) : ImageFilter.blur(sigmaX: 0, sigmaY: 0),
                  child: Text(
                    type,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: isActive ? Colors.white : (isDark ? Colors.white70 : Colors.black54),
                    ),
                  ),
                ),
              ),
              if (!_isPro)
                Positioned.fill(
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Center(
                      child: Icon(Icons.lock_rounded, color: Colors.amber, size: 18),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPlanList(bool isDark) {
    if (_filteredPlans.isEmpty) return const Center(child: Text("No plans match filters", style: TextStyle(color: Colors.grey)));

    return Column(
      children: [
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
                      "Free users see only 1 expert pick. Upgrade to PRO to see all insurance score card! 🚀",
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.orange),
                    ),
                  ),
                ],
              ),
            ),
          ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: _filteredPlans.length,
            itemBuilder: (context, index) {
              final p = _filteredPlans[index];
              final score = p['smart_score'] ?? 0;
              final isLocked = !_isPro && index > 0;

              return GestureDetector(
                onTap: isLocked ? () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text("Upgrade to PRO to unlock all insurance score card! 🚀"),
                      backgroundColor: Colors.orange,
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
                        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.borderLight),
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
                      ),
                      child: ImageFiltered(
                        imageFilter: isLocked ? ImageFilter.blur(sigmaX: 5, sigmaY: 5) : ImageFilter.blur(sigmaX: 0, sigmaY: 0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          BrandLogo(name: p['company'] ?? '', size: 36),
                                          const SizedBox(width: 12),
                                          Expanded(child: Text(p['company'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16))),
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
                                      Text(p['policy'] ?? '', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 12)),
                                    ],
                                  ),
                                ),
                                Column(
                                  children: [
                                    const Text("SCORE", style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 0.5)),
                                    const SizedBox(height: 4),
                                    _scoreCircle(score, isDark),
                                  ],
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                _miniStat("TYPE", p['insurance_type'] ?? '', Colors.blue),
                                _miniStat("COVER", _formatCover(p['cover']), AppColors.success),
                                _miniStat("CSR", "${p['claim_ratio']}%", Colors.orange),
                              ],
                            ),
                            const Divider(height: 32),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                if (p['is_verified'] == true) _tag("Verified", Colors.green),
                                if (p['has_copay'] == false) _tag("No Co-pay", Colors.blue),
                                if (p['pre_existing_cover'] == true) _tag("PED Cover", Colors.purple),
                                if (p['critical_illness_cover'] == true) _tag("Critical Cover", Colors.redAccent),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Text(
                              "Best for: ${p['best_for'] ?? 'General protection'}",
                              style: TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: isDark ? Colors.white54 : Colors.black54),
                            ),
                          ],
                        ),
                      ),
                    ),
                    if (isLocked)
                      Positioned.fill(
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: Colors.amber,
                                    shape: BoxShape.circle,
                                    boxShadow: [
                                      BoxShadow(color: Colors.amber.withOpacity(0.5), blurRadius: 10)
                                    ],
                                  ),
                                  child: const Icon(Icons.lock_person_rounded, color: Colors.white, size: 24),
                                ),
                                const SizedBox(height: 4),
                                const Text(
                                  "PRO UNLOCK",
                                  style: TextStyle(color: Colors.amber, fontWeight: FontWeight.w900, fontSize: 10),
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
      ],
    );
  }

  Widget _scoreCircle(int score, bool isDark) {
    return Container(
      width: 44, height: 44,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.primary.withOpacity(0.3), width: 2),
      ),
      alignment: Alignment.center,
      child: Text(score.toString(), style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.primary, fontSize: 16)),
    );
  }

  Widget _miniStat(String label, String val, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey)),
        Text(val, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: color)),
      ],
    );
  }

  Widget _tag(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8), border: Border.all(color: color.withOpacity(0.3))),
      child: Text(label, style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.bold)),
    );
  }
}
