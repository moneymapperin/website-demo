import 'dart:convert';
import 'package:flutter/material.dart';
import 'theme/responsive_utils.dart';
import 'theme/app_theme.dart';
import 'services/api_service.dart';
import 'services/auth_service.dart';
import 'screens/mf_recommendations_screen.dart';

class MutualFundDashboard extends StatefulWidget {
  const MutualFundDashboard({super.key});

  @override
  State<MutualFundDashboard> createState() => _MutualFundDashboardState();
}

class _MutualFundDashboardState extends State<MutualFundDashboard> {
  final ApiService _api = ApiService();
  bool _loading = true;

  // Primary Metrics
  double _investmentScore = 0;
  double _totalInvested = 0;
  double _monthlySipTotal = 0;
  double _sipGap = 0;
  
  // Scoring Components
  double _assetBalanceScore = 0;
  double _sipScore = 0;

  // Portfolio Breakdown (from staging)
  double _equity = 0;
  double _debt = 0;
  double _gold = 0;
  double _realEstate = 0;

  // Individual SIPs (from staging)
  double _sipEquity = 0;
  double _sipDebt = 0;
  double _sipGold = 0;

  // Detailed SIP Lists
  List<Map<String, dynamic>> _stockSips = [];
  List<Map<String, dynamic>> _mfSips = [];
  List<Map<String, dynamic>> _goldSips = [];

  String _riskAppetite = 'Moderate';

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
      
      final invScores = dashboard['investment_scores'] ?? {};
      final fitScores = dashboard['financial_fitness_scores'] ?? {};

      setState(() {
        _investmentScore = (fitScores['investment_pillar_score'] ?? 0).toDouble();
        _assetBalanceScore = (invScores['asset_balance_score'] ?? 0).toDouble();
        _sipScore = (invScores['sip_score'] ?? 0).toDouble();
        _totalInvested = (invScores['total_investment_amount'] ?? 0).toDouble();
        _sipGap = (invScores['sip_gap'] ?? 0).toDouble();

        // Raw values from Master Profile (synced via Staging)
        _equity = double.tryParse(profile['totalEquityInvestments']?.toString() ?? '0') ?? 0;
        _debt = double.tryParse(profile['totalDebtInvestments']?.toString() ?? '0') ?? 0;
        _gold = double.tryParse(profile['totalGoldInvestments']?.toString() ?? '0') ?? 0;
        _realEstate = double.tryParse(profile['totalRealEstateInvestments']?.toString() ?? '0') ?? 0;

        _sipEquity = double.tryParse(profile['monthlySipEquity']?.toString() ?? '0') ?? 0;
        _sipDebt = double.tryParse(profile['monthlySipDebt']?.toString() ?? '0') ?? 0;
        _sipGold = double.tryParse(profile['monthlySipGold']?.toString() ?? '0') ?? 0;

        // Detailed Lists
        _stockSips = _parseSipList(profile['stockSips']);
        _mfSips = _parseSipList(profile['mfSips']);
        _goldSips = _parseSipList(profile['goldSips']);

        _riskAppetite = profile['riskAppetite']?.toString() ?? 'Moderate';

        _monthlySipTotal = _sipEquity + _sipDebt + _sipGold;
        _loading = false;
      });

    } catch (e) {
      debugPrint('Error loading investments: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator(color: AppColors.primary)));

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: AppBar(
        title: const Text("Investment Analysis", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
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

              _buildSectionHeader("Portfolio Breakdown"),
              _buildPortfolioCard(isDark),
              SizedBox(height: context.hp(3)),

              _buildSectionHeader("Allocation Health"),
              _buildAllocationChart(isDark),
              SizedBox(height: context.hp(3)),

              _buildSectionHeader("SIP Analysis"),
              _buildSipAnalysisCard(isDark),
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
        onPressed: () => Navigator.pushNamed(context, '/master_data', arguments: 'investment'),
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
              const Text("GLOBAL PILLAR SCORE", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.primary, letterSpacing: 1.2)),
              const SizedBox(height: 4),
              Text(_investmentScore.toStringAsFixed(0), style: TextStyle(fontSize: context.sp(40), fontWeight: FontWeight.w900, color: AppColors.primary)),
            ],
          ),
          _buildMiniScoreCircle("Asset Mix", _assetBalanceScore, Colors.blue),
          _buildMiniScoreCircle("SIP Health", _sipScore, Colors.green),
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Expanded(
                child: Text("Total Wealth Assets", style: TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis),
              ),
              FittedBox(
                child: Text("₹${_totalInvested.toStringAsFixed(0)}", style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.success)),
              ),
            ],
          ),
          const Divider(height: 32),
          _assetRow("Stock", _equity, Colors.blue, "High Growth", fieldKey: 'totalEquityInvestments', isTotalRow: true),
          const SizedBox(height: 12),
          _assetRow("Mutual Fund", _debt, Colors.orange, "Stability", fieldKey: 'totalDebtInvestments', isTotalRow: true),
          const SizedBox(height: 12),
          _assetRow("Gold", _gold, Colors.amber, "Hedge", fieldKey: 'totalGoldInvestments', isTotalRow: true),
          const SizedBox(height: 12),
          _assetRow("Real Estate", _realEstate, Colors.purple, "Passive Assets", fieldKey: 'totalRealEstateInvestments', isTotalRow: true),
        ],
      ),
    );
  }

  Widget _assetRow(String label, double amount, Color color, String tag, {required String fieldKey, bool isTotalRow = false}) {
    double pct = _totalInvested > 0 ? (amount / _totalInvested) * 100 : 0;
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
            Row(
              children: [
                Text("₹${amount.toStringAsFixed(0)}", style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: () => _showQuickEdit(label, fieldKey, amount),
                  child: Icon(Icons.edit_note_rounded, size: 18, color: color.withOpacity(0.7)),
                ),
              ],
            ),
            if (!isTotalRow)
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

  Widget _buildAllocationChart(bool isDark) {
    final Map<String, double> assetPcts = {
      'Stock': _totalInvested > 0 ? (_equity / _totalInvested) * 100 : 0,
      'Mutual Fund': _totalInvested > 0 ? (_debt / _totalInvested) * 100 : 0,
      'Gold': _totalInvested > 0 ? (_gold / _totalInvested) * 100 : 0,
      'Real Estate': _totalInvested > 0 ? (_realEstate / _totalInvested) * 100 : 0,
    };

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
          const Text("Allocation Breakdown", style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 20),
          ...assetPcts.entries.map((entry) {
            Color color;
            switch (entry.key) {
              case 'Stock': color = Colors.blue; break;
              case 'Mutual Fund': color = Colors.orange; break;
              case 'Gold': color = Colors.amber; break;
              default: color = Colors.purple;
            }
            
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(entry.key, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      Text("${entry.value.toStringAsFixed(1)}%", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: color)),
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
                        widthFactor: (entry.value / 100).clamp(0.01, 1.0),
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
              ),
            );
          }).toList(),
        ],
      ),
    );
  }

  List<Map<String, dynamic>> _parseSipList(dynamic data) {
    if (data == null) return [];
    try {
      return List<Map<String, dynamic>>.from(data);
    } catch (e) {
      return [];
    }
  }

  Widget _buildSipAnalysisCard(bool isDark) {
    double idealSip = _monthlySipTotal + _sipGap;
    double progress = idealSip > 0 ? (_monthlySipTotal / idealSip) : 0;

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
              const Expanded(
                child: Text("Monthly SIP Contribution", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14), overflow: TextOverflow.ellipsis),
              ),
              FittedBox(
                child: Text("₹${_monthlySipTotal.toStringAsFixed(0)}", style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppColors.primary)),
              ),
            ],
          ),
          const SizedBox(height: 20),
          _sipMiniRow("Mutual Fund SIP", _sipDebt, Colors.orange, 'mfSips', _mfSips),
          _sipMiniRow("Gold SIP", _sipGold, Colors.amber, 'goldSips', _goldSips),
          const Divider(height: 32),
          
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Expanded(
                child: Text("Monthly Shortfall (Gap)", style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.bold, fontSize: 13), overflow: TextOverflow.ellipsis),
              ),
              FittedBox(
                child: Text("₹${_sipGap.toStringAsFixed(0)}", style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: AppColors.danger)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: LinearProgressIndicator(
              value: progress.clamp(0.05, 1.0),
              minHeight: 12,
              backgroundColor: AppColors.danger.withOpacity(0.1),
              valueColor: AlwaysStoppedAnimation<Color>(progress >= 0.8 ? AppColors.success : AppColors.warning),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            progress >= 1.0 
                ? "Excellent! You are meeting your 20% savings target." 
                : "Increase your monthly SIP by ₹${_sipGap.toStringAsFixed(0)} to reach your financial potential.",
            style: TextStyle(fontSize: 11, color: isDark ? Colors.white70 : Colors.black54, fontStyle: FontStyle.italic),
          ),
        ],
      ),
    );
  }

  Widget _sipMiniRow(String label, double val, Color color, String fieldKey, List<Map<String, dynamic>> currentList) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
          Row(
            children: [
              Text("₹${val.toStringAsFixed(0)}", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: color)),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: () => _manageSipPopup(label, fieldKey, currentList),
                child: Icon(Icons.edit_note_rounded, size: 18, color: color.withOpacity(0.7)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _manageSipPopup(String title, String fieldKey, List<Map<String, dynamic>> sips) async {
    // We need a local copy to edit
    List<Map<String, dynamic>> editedList = List<Map<String, dynamic>>.from(sips.map((e) => Map<String, dynamic>.from(e)));

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setPopupState) => Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom + 24, left: 20, right: 20, top: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text("Manage $title", style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  IconButton(
                    icon: const Icon(Icons.add_circle_outline, color: AppColors.primary),
                    onPressed: () => setPopupState(() => editedList.add({'name': '', 'amount': '0', 'date': 1})),
                  )
                ],
              ),
              const SizedBox(height: 12),
              if (editedList.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 20),
                  child: Center(child: Text("No SIPs added yet.", style: TextStyle(color: Colors.grey))),
                ),
              Flexible(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: editedList.length,
                  itemBuilder: (ctx, index) {
                    var item = editedList[index];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Row(
                        children: [
                          Expanded(
                            flex: 3,
                            child: TextField(
                              decoration: const InputDecoration(hintText: 'Fund Name', contentPadding: EdgeInsets.symmetric(horizontal: 10)),
                              onChanged: (v) => item['name'] = v,
                              controller: TextEditingController(text: item['name'])..selection = TextSelection.collapsed(offset: item['name'].length),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            flex: 2,
                            child: TextField(
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(hintText: 'Amount', prefixText: '₹'),
                              onChanged: (v) => item['amount'] = v,
                              controller: TextEditingController(text: item['amount'])..selection = TextSelection.collapsed(offset: item['amount'].length),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Text("DATE", style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.grey)),
                              DropdownButton<int>(
                                value: item['date'],
                                underline: const SizedBox(),
                                items: List.generate(31, (i) => i + 1).map((d) => DropdownMenuItem(value: d, child: Text(d.toString(), style: const TextStyle(fontSize: 12)))).toList(),
                                onChanged: (v) => setPopupState(() => item['date'] = v),
                              ),
                            ],
                          ),
                          IconButton(
                            icon: const Icon(Icons.remove_circle_outline, size: 18, color: AppColors.danger),
                            onPressed: () => setPopupState(() => editedList.removeAt(index)),
                          )
                        ],
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    Navigator.pop(context);
                    await _saveSipList(fieldKey, editedList);
                  },
                  child: const Text("Save & Sync Portfolio", style: TextStyle(color: Colors.white)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _saveSipList(String key, List<Map<String, dynamic>> newList) async {
    setState(() => _loading = true);
    try {
      final res = await _api.getMasterProfile();
      Map<String, dynamic> profile = Map<String, dynamic>.from(res['data'] ?? {});

      // Update the specific list
      profile[key] = newList;

      // Recalculate monthly sums for backward compatibility and dashboard totals
      double total = 0;
      for (var s in newList) {
        total += double.tryParse(s['amount']?.toString() ?? '0') ?? 0;
      }

      // Map keys correctly for summary scores
      if (key == 'stockSips') profile['monthlySipEquity'] = total.toString();
      if (key == 'mfSips') profile['monthlySipDebt'] = total.toString();
      if (key == 'goldSips') profile['monthlySipGold'] = total.toString();

      await _api.updateMasterProfile(profile);
      await AuthService().saveMasterProfileLocally(jsonEncode(profile));

      // Brief delay for DB sync
      await Future.delayed(const Duration(seconds: 2));
      await _loadData();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Portfolio updated and synced!"), backgroundColor: AppColors.success),
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
