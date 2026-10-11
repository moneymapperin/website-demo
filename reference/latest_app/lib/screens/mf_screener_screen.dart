import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../services/resilience_utils.dart';
import '../services/branding_utils.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../services/premium_service.dart';

class MutualFundScreenerScreen extends StatefulWidget {
  const MutualFundScreenerScreen({super.key});

  @override
  State<MutualFundScreenerScreen> createState() => _MutualFundScreenerScreenState();
}

class _MutualFundScreenerScreenState extends State<MutualFundScreenerScreen> {
  final _supabase = Supabase.instance.client;
  final _premiumService = PremiumService();
  final TextEditingController _searchController = TextEditingController();
  
  bool _loading = true;
  bool _isPro = false;
  List<Map<String, dynamic>> _allFunds = [];
  List<Map<String, dynamic>> _filteredFunds = [];
  
  // Filters
  String _selectedCluster = "All";
  String _selectedCategory = "All";
  List<String> _categories = ["All"];

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
      debugPrint('DEBUG: Fetching from bse_data.mutual_fund_signals...');
      
      final res = await _supabase
          .schema('bse_data')
          .from('mutual_fund_signals')
          .select()
          .order('final_score', ascending: false);
      
      debugPrint('DEBUG: Received ${res.length} rows from Supabase');
      
      if (mounted) {
        final List<Map<String, dynamic>> funds = List<Map<String, dynamic>>.from(res);
        final uniqueCats = funds
            .map((f) => f['category']?.toString() ?? 'Uncategorised')
            .toSet()
            .toList();
        uniqueCats.sort();
        
        setState(() {
          _allFunds = funds;
          _filteredFunds = funds;
          _categories = ["All", ...uniqueCats];
          _loading = false;
        });
      }
    } catch (e, stack) {
      debugPrint('CRITICAL: MF Screener Fetch Error: $e');
      debugPrint('STACKTRACE: $stack');
      if (mounted) setState(() => _loading = false);
    }
  }

  void _applyFilters() {
    setState(() {
      final query = _searchController.text.toLowerCase();
      _filteredFunds = _allFunds.where((f) {
        final nameMatch = (f['scheme_name']?.toString().toLowerCase().contains(query) ?? false) || 
                          (f['fund_house']?.toString().toLowerCase().contains(query) ?? false);
        final clusterMatch = _selectedCluster == "All" || f['cluster'] == _selectedCluster;
        final categoryMatch = _selectedCategory == "All" || f['category'] == _selectedCategory;
        return nameMatch && clusterMatch && categoryMatch;
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: AppBar(
        title: const Text("Mutual Fund Score Card", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _fetchData),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                _buildFilterBar(isDark),
                Expanded(
                  child: _buildRankedList(isDark),
                ),
              ],
            ),
    );
  }

  Widget _buildFilterBar(bool isDark) {
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
                      hintText: _isPro ? "Search fund or AMC..." : "Search locked for Free users",
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
              Expanded(
                child: _dropdownFilter("Cluster", _selectedCluster, ["All", "Conservative", "Moderate", "Aggressive"], (v) {
                  setState(() => _selectedCluster = v!);
                  _applyFilters();
                }, isDark),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _dropdownFilter("Category", _selectedCategory, _categories, (v) {
                  setState(() => _selectedCategory = v!);
                  _applyFilters();
                }, isDark),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _dropdownFilter(String label, String value, List<String> items, ValueChanged<String?> onChanged, bool isDark) {
    return GestureDetector(
      onTap: _isPro ? null : () {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Upgrade to PRO to unlock Filters! 🚀"),
            backgroundColor: Colors.orange,
          ),
        );
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
              if (!_isPro)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.amber.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.lock_rounded, color: Colors.amber, size: 10),
                      SizedBox(width: 2),
                      Text("PRO", style: TextStyle(color: Colors.amber, fontSize: 8, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 4),
          Stack(
            alignment: Alignment.center,
            children: [
              ImageFiltered(
                imageFilter: !_isPro ? ImageFilter.blur(sigmaX: 4, sigmaY: 4) : ImageFilter.blur(sigmaX: 0, sigmaY: 0),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white.withOpacity(0.05) : Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: value,
                      isExpanded: true,
                      style: TextStyle(fontSize: 13, color: isDark ? Colors.white : Colors.black87),
                      onChanged: _isPro ? onChanged : null,
                      items: items.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                    ),
                  ),
                ),
              ),
              if (!_isPro)
                const Icon(Icons.lock_rounded, color: Colors.amber, size: 20),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRankedList(bool isDark) {
    if (_filteredFunds.isEmpty) return _emptyState();
    return Column(
      children: [
        if (!_isPro)
          GestureDetector(
            onTap: () => Navigator.pushNamed(context, '/subscription'),
            child: Container(
              width: double.infinity,
              margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
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
                      "Free users see only 1 daily pick. Upgrade to PRO to see all Mutual Fund Score Card signals! 🚀",
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.orange),
                    ),
                  ),
                ],
              ),
            ),
          ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _filteredFunds.length,
            itemBuilder: (context, index) {
              final f = _filteredFunds[index];
              final confidenceLevel = f['confidence_level']?.toString() ?? 'Medium';
              final confidenceTone = confidenceLevel == "High" ? Colors.green : (confidenceLevel == "Medium" ? Colors.orange : Colors.red);

              final cluster = f['cluster']?.toString() ?? 'Moderate';
              final clusterColor = cluster == "Conservative" ? Colors.green : (cluster == "Moderate" ? Colors.blue : Colors.red);
              final isLocked = !_isPro && index > 0;

              return GestureDetector(
                onTap: isLocked ? () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text("Upgrade to PRO to unlock all daily signals! 🚀"),
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
                                          BrandLogo(name: f['fund_house'] ?? f['scheme_name'] ?? '', size: 32),
                                          const SizedBox(width: 10),
                                          Expanded(child: Text(f['scheme_name'] ?? 'Unknown Fund', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15))),
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
                                      Text("${f['category'] ?? ''} • ${f['fund_house'] ?? ''}", style: const TextStyle(color: Colors.grey, fontSize: 11)),
                                    ],
                                  ),
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    _pill(confidenceLevel, confidenceTone),
                                    const SizedBox(height: 4),
                                    _pill(cluster, clusterColor),
                                  ],
                                ),
                              ],
                            ),
                            const Divider(height: 24),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                _metricBox("SCORE", ResilienceUtils.safeDouble(f['final_score']).toStringAsFixed(0), AppColors.primary, isScore: true),
                                _metricBox("RISK", ResilienceUtils.safeDouble(f['risk_score']).toStringAsFixed(0), Colors.redAccent),
                                _metricBox("GROWTH", ResilienceUtils.safeDouble(f['growth_score']).toStringAsFixed(0), Colors.green),
                                _metricBox("3Y CAGR", "${ResilienceUtils.safeDouble(f['cagr_3y']).toStringAsFixed(1)}%", Colors.orange),
                              ],
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

  Widget _metricBox(String label, String value, Color color, {bool isScore = false}) {
    return Column(
      children: [
        Text(label, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey)),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: isScore ? 18 : 15,
            fontWeight: FontWeight.w900,
            color: color
          )
        ),
      ],
    );
  }

  Widget _pill(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12), border: Border.all(color: color.withOpacity(0.3))),
      child: Text(label.toUpperCase(), style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.bold)),
    );
  }

  Widget _emptyState() {
    return const Center(child: Text("No funds match filters", style: TextStyle(color: Colors.grey)));
  }
}
