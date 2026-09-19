import 'dart:async';
import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';

class CorporateDashboardScreen extends StatefulWidget {
  const CorporateDashboardScreen({super.key});

  static const routeName = '/corporate_dashboard';

  @override
  State<CorporateDashboardScreen> createState() => _CorporateDashboardScreenState();
}

class _CorporateDashboardScreenState extends State<CorporateDashboardScreen> with TickerProviderStateMixin {
  final ApiService _api = ApiService();
  
  bool _showIntro = true;
  bool _loading = true;
  double _scanProgress = 0.0;
  Map<String, dynamic>? _stats;
  String? _error;

  final List<String> _problems = [
    "67% employees live paycheck to paycheck",
    "Financial stress causes burnout",
    "Low emergency savings increase attrition risk",
    "Medical emergencies destroy productivity",
    "Employees without investments face future instability"
  ];
  int _problemIndex = 0;

  @override
  void initState() {
    super.initState();
    _startIntroSequence();
    _loadStats();
  }

  void _startIntroSequence() {
    Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted || !_showIntro) {
        timer.cancel();
        return;
      }
      setState(() => _problemIndex = (_problemIndex + 1) % _problems.length);
    });

    Timer.periodic(const Duration(milliseconds: 320), (timer) {
      if (!mounted || !_showIntro) {
        timer.cancel();
        return;
      }
      setState(() {
        _scanProgress = (_scanProgress + 0.08).clamp(0.0, 1.0);
        if (_scanProgress >= 1.0) timer.cancel();
      });
    });

    Future.delayed(const Duration(milliseconds: 5200), () {
      if (mounted) setState(() => _showIntro = false);
    });
  }

  Future<void> _loadStats() async {
    setState(() => _loading = true);
    try {
      final res = await _api.getCorporateWorkforceStats();
      if (mounted) {
        setState(() {
          _stats = res;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  Future<void> _handleLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Text('Confirm Logout', style: TextStyle(fontWeight: FontWeight.bold)),
        content: const Text('Are you sure you want to end your corporate admin session?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.danger,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Log Out', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      await AuthService().logout();
      Navigator.of(context).pushNamedAndRemoveUntil('/login', (_) => false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_showIntro) return _buildIntroScreen();
    
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final int headcount = _stats?['total_headcount'] ?? 0;
    final String orgName = _stats?['company_name'] ?? "My Organization";
    
    // Get Admin initial
    final adminEmail = Supabase.instance.client.auth.currentUser?.email ?? "A";
    final initial = adminEmail[0].toUpperCase();

    return WillPopScope(
      onWillPop: () async {
        _handleLogout();
        return false;
      },
      child: Scaffold(
        backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
            onPressed: _handleLogout,
          ),
          title: Text(orgName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white)),
          backgroundColor: isDark ? AppColors.darkCard : AppColors.primary,
          elevation: 0,
          actions: [
            PopupMenuButton<String>(
              onSelected: (val) {
                if (val == 'refresh') _loadStats();
                if (val == 'qr_web') Navigator.pushNamed(context, '/qr_scanner');
                if (val == 'theme') {
                  AppTheme.themeModeNotifier.value = isDark ? ThemeMode.light : ThemeMode.dark;
                }
                if (val == 'logout') _handleLogout();
              },
              icon: CircleAvatar(
                radius: 16,
                backgroundColor: Colors.white.withOpacity(0.2),
                child: Text(initial, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
              ),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              itemBuilder: (ctx) => [
                PopupMenuItem(
                  value: 'refresh',
                  child: Row(
                    children: const [
                      Icon(Icons.refresh_rounded, size: 20),
                      SizedBox(width: 12),
                      Text("Refresh Dashboard"),
                    ],
                  ),
                ),
                PopupMenuItem(
                  value: 'qr_web',
                  child: Row(
                    children: const [
                      Icon(Icons.qr_code_scanner_rounded, size: 20, color: AppColors.primary),
                      SizedBox(width: 12),
                      Text("Web QR Login"),
                    ],
                  ),
                ),
                PopupMenuItem(
                  value: 'theme',
                  child: Row(
                    children: [
                      Icon(isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined, size: 20),
                      SizedBox(width: 12),
                      Text("Switch to ${isDark ? 'Light' : 'Dark'} Mode"),
                    ],
                  ),
                ),
                const PopupMenuDivider(),
                PopupMenuItem(
                  value: 'logout',
                  child: Row(
                    children: const [
                      Icon(Icons.logout_rounded, size: 20, color: AppColors.danger),
                      SizedBox(width: 12),
                      Text("Logout Session", style: TextStyle(color: AppColors.danger)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(width: 8),
          ],
        ),
        body: _loading 
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildScoreHeader(),
                  const SizedBox(height: 24),
                  
                  _buildSectionHeader("Workforce Intelligence", onInfo: () => _showChartDetails("Workforce Intelligence", [
                    "This module shows the percentage of employees achieving 'Stable' status in each financial pillar.",
                    "A 100% rate means every employee is financially healthy in that specific category.",
                    "Use these meters to identify where your workforce needs the most support (e.g., Insurance or Emergency funds)."
                  ])),
                  _buildPillarHitRatesModule(isDark),
                  const SizedBox(height: 24),

                  _buildSectionHeader("Critical Outcomes", onInfo: () => _showChartDetails("Workforce Outcomes", [
                    "Paycheck Dependency: Employees living with less than 10% monthly surplus.",
                    "Emergency Fund Gap: Percentage of staff lacking a 3-month basic survival cushion.",
                    "High numbers here correlate directly with increased workplace stress and turnover risk."
                  ])),
                  _buildOutcomeModule(isDark),
                  const SizedBox(height: 24),

                  _buildSectionHeader("Risk Distribution", onInfo: () => _showChartDetails("Risk Cohorts", [
                    "Stable: Low financial risk, high productivity.",
                    "Watchlist: Early signs of financial instability.",
                    "High Risk: Significant stress, needs benefit intervention.",
                    "Critical: Severe instability; high probability of attrition."
                  ])),
                  _buildRiskDistributionModule(isDark),
                  const SizedBox(height: 24),

                  _buildSectionHeader("AI Stability Forecast", onInfo: () => _showChartDetails("Stability Forecast", [
                    "Predicts the trajectory of your Workforce Health Index over 6 months.",
                    "Growth assumes the implementation of MoneyMapper wellness recommendations.",
                    "Y-Axis: Resilience Index (0-100). X-Axis: 6-Month Timeline."
                  ])),
                  _buildForecastModule(isDark),
                  const SizedBox(height: 24),

                  _buildSectionHeader("Department Heatmap", onInfo: () => _showChartDetails("Departmental Insights", [
                    "A granular view of financial stress across your organization.",
                    "Stress % represents the average expense-to-income tension in each team.",
                    "Red Tags: Teams needing immediate wellness support or compensation review."
                  ])),
                  _buildHeatmapModule(isDark),
                  const SizedBox(height: 24),

                  _buildSectionHeader("Privacy Model"),
                  _buildPrivacyBanner(isDark),
                  const SizedBox(height: 40),
                ],
              ),
            ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, {VoidCallback? onInfo}) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title.toUpperCase(),
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1.1),
          ),
          if (onInfo != null)
            IconButton(
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
              icon: const Icon(Icons.info_outline_rounded, size: 16, color: Colors.grey),
              onPressed: onInfo,
            ),
        ],
      ),
    );
  }

  Widget _buildScoreHeader() {
    final int score = _stats?['avg_workforce_score'] ?? 0;
    final int headcount = _stats?['total_headcount'] ?? 0;
    return Container(
      padding: const EdgeInsets.all(24),
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
              const Text("WORKFORCE HEALTH INDEX", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.primary, letterSpacing: 1.2)),
              const SizedBox(height: 4),
              Text("$score", style: const TextStyle(fontSize: 40, fontWeight: FontWeight.w900, color: AppColors.primary)),
              Text(score >= 75 ? "STABLE" : "WATCHLIST", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: score >= 75 ? AppColors.success : AppColors.warning)),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              const Icon(Icons.people_alt_rounded, size: 28, color: AppColors.primary),
              const SizedBox(height: 4),
              Text("$headcount", style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.primary)),
              const Text("EMPLOYEES", style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 0.5)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPillarHitRatesModule(bool isDark) {
    final intel = _stats?['pillar_intel'] ?? {};
    final int total = _stats?['total_headcount'] ?? 0;
    int getHit(dynamic score) => total > 0 ? ((score ?? 0).toDouble() / 100 * total).round() : 0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.borderLight),
      ),
      child: Column(
        children: [
          _linearMeterRow("Income Stability", getHit(intel['avg_income_score']), total, const Color(0xFF10B981)),
          const SizedBox(height: 16),
          _linearMeterRow("Expense Discipline", getHit(intel['avg_expense_score']), total, const Color(0xFFEF4444)),
          const SizedBox(height: 16),
          _linearMeterRow("Emergency Ready", getHit(intel['avg_savings_score']), total, const Color(0xFF8B5CF6)),
          const SizedBox(height: 16),
          _linearMeterRow("Insurance Protected", getHit(intel['avg_protection_score']), total, const Color(0xFF3B82F6)),
          const SizedBox(height: 16),
          _linearMeterRow("Investment Growth", getHit(intel['avg_investment_score']), total, const Color(0xFFF59E0B)),
        ],
      ),
    );
  }

  Widget _linearMeterRow(String label, int hits, int total, Color color) {
    double pct = total > 0 ? hits / total : 0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
            Text("$hits / $total", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: color)),
          ],
        ),
        const SizedBox(height: 8),
        Stack(
          children: [
            Container(
              height: 10, width: double.infinity,
              decoration: BoxDecoration(color: Colors.grey.withOpacity(0.1), borderRadius: BorderRadius.circular(5)),
            ),
            FractionallySizedBox(
              widthFactor: pct.clamp(0.01, 1.0),
              child: Container(
                height: 10,
                decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(5)),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildRiskDistributionModule(bool isDark) {
    final int stable = (_stats?['stable_count'] ?? 0);
    final int watch = (_stats?['watchlist_count'] ?? 0);
    final int high = (_stats?['high_risk_count'] ?? 0);
    final int crit = (_stats?['critical_risk_count'] ?? 0);
    final int total = (_stats?['total_headcount'] ?? 1);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.borderLight),
      ),
      child: Column(
        children: [
          _linearMeterRow("Stable Cohort", stable, total, AppColors.success),
          const SizedBox(height: 12),
          _linearMeterRow("Watchlist", watch, total, AppColors.warning),
          const SizedBox(height: 12),
          _linearMeterRow("High Risk", high, total, AppColors.danger),
          const SizedBox(height: 12),
          _linearMeterRow("Critical Risk", crit, total, const Color(0xFFA98BFF)),
        ],
      ),
    );
  }

  Widget _buildForecastModule(bool isDark) {
    final score = (_stats?['avg_workforce_score'] ?? 0).toDouble();
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
          SizedBox(
            height: 180,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (value) => FlLine(
                    color: isDark ? Colors.white10 : Colors.black.withOpacity(0.05),
                    strokeWidth: 1,
                  ),
                ),
                titlesData: FlTitlesData(
                  show: true,
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: AxisTitles(
                    axisNameWidget: const Text("TIMELINE (MONTHS)", style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.grey)),
                    axisNameSize: 20,
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 22,
                      getTitlesWidget: (value, meta) {
                        return Padding(
                          padding: const EdgeInsets.only(top: 4.0),
                          child: Text("M${value.toInt() + 1}", style: const TextStyle(fontSize: 9, color: Colors.grey, fontWeight: FontWeight.bold)),
                        );
                      },
                    ),
                  ),
                  leftTitles: AxisTitles(
                    axisNameWidget: const Text("INDEX", style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.grey)),
                    axisNameSize: 20,
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 30,
                      getTitlesWidget: (value, meta) {
                        return Text(value.toInt().toString(), style: const TextStyle(fontSize: 9, color: Colors.grey, fontWeight: FontWeight.bold));
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: [
                      FlSpot(0, score * 0.9),
                      FlSpot(1, score * 0.95),
                      FlSpot(2, score),
                      FlSpot(3, score * 1.05),
                      FlSpot(4, score * 1.1),
                      FlSpot(5, score * 1.15)
                    ],
                    isCurved: true, color: AppColors.primary, barWidth: 4, dotData: const FlDotData(show: true),
                    belowBarData: BarAreaData(show: true, color: AppColors.primary.withOpacity(0.05)),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showChartDetails(String title, List<String> details) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? AppColors.darkCard : Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),
            ...details.map((d) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.info_outline, size: 16, color: AppColors.primary),
                  const SizedBox(width: 12),
                  Expanded(child: Text(d, style: const TextStyle(fontSize: 13, height: 1.4))),
                ],
              ),
            )).toList(),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(onPressed: () => Navigator.pop(ctx), child: const Text("Close Intelligence")),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildOutcomeModule(bool isDark) {
    final paycheckPct = _stats?['paycheck_dependency_pct'] ?? 0;
    final efGapPct = _stats?['no_emergency_fund_pct'] ?? 0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.borderLight),
      ),
      child: Column(
        children: [
          _outcomeTile("Paycheck Dependency", "$paycheckPct%", "High Risk", "Affects $paycheckPct% of staff.", AppColors.danger),
          const Divider(height: 32),
          _outcomeTile("Emergency Fund Gap", "$efGapPct%", "Fragile", "Affects $efGapPct% of workforce.", AppColors.warning),
        ],
      ),
    );
  }

  Widget _outcomeTile(String label, String val, String tag, String desc, Color color) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              Text(desc, style: const TextStyle(fontSize: 10, color: Colors.grey)),
            ],
          ),
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(val, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: color)),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
              child: Text(tag, style: TextStyle(color: color, fontSize: 8, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStressModule(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.borderLight),
      ),
      child: Column(
        children: [
          _linearMeterRow("Expense Pressure", 65, 100, Colors.teal),
          const SizedBox(height: 16),
          _linearMeterRow("EMI Load Index", 42, 100, Colors.purple),
        ],
      ),
    );
  }

  Widget _buildROIModule(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.borderLight),
      ),
      child: Row(
        children: [
          _roiTile("Productivity Gain", "+12.4%", "Estimated", AppColors.success),
          const SizedBox(width: 12),
          _roiTile("Retention Lift", "+6.8%", "Projected", AppColors.primary),
        ],
      ),
    );
  }

  Widget _roiTile(String h, String v, String s, Color c) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(h, style: const TextStyle(color: Colors.grey, fontSize: 9, fontWeight: FontWeight.bold)),
          Text(v, style: TextStyle(color: c, fontSize: 22, fontWeight: FontWeight.w900)),
          Text(s, style: const TextStyle(color: Colors.grey, fontSize: 8)),
        ],
      ),
    );
  }

  Widget _buildRecommendationsModule(bool isDark) {
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
          _recItem("Increase insurance coverage for employees aged 30+.", "RISK", isDark),
          const SizedBox(height: 16),
          _recItem("Launch department-specific SIP education.", "GROWTH", isDark),
        ],
      ),
    );
  }

  Widget _recItem(String text, String tag, bool isDark) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(color: AppColors.accent.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
          child: Text(tag, style: const TextStyle(color: AppColors.accent, fontSize: 8, fontWeight: FontWeight.bold)),
        ),
        const SizedBox(width: 12),
        Expanded(child: Text(text, style: TextStyle(fontSize: 12, color: isDark ? Colors.white70 : Colors.black87))),
      ],
    );
  }

  Widget _buildHeatmapModule(bool isDark) {
    final Map<String, dynamic> depts = _stats?['dept_metrics'] ?? {};
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
          if (depts.isEmpty) 
            const Text("No departmental data yet.", style: TextStyle(color: Colors.grey, fontSize: 11))
          else
            ...depts.entries.map((e) {
              final m = e.value as Map<String, dynamic>;
              final stress = (m['avg_stress'] ?? 0).toDouble();
              final headcount = m['headcount'] ?? 0;
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(e.key, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                          Text("$headcount Members", style: const TextStyle(fontSize: 9, color: Colors.grey)),
                        ],
                      ),
                    ),
                    Row(
                      children: [
                        Text("${stress.toStringAsFixed(0)}%", style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: stress > 65 ? Colors.red : Colors.green)),
                        const SizedBox(width: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(color: (stress > 65 ? Colors.red : Colors.green).withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                          child: Text(stress > 65 ? "HIGH RISK" : "STABLE", style: TextStyle(color: stress > 65 ? Colors.red : Colors.green, fontSize: 9, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    )
                  ],
                ),
              );
            }).toList(),
        ],
      ),
    );
  }

  Widget _buildIntroScreen() {
    return Scaffold(
      backgroundColor: const Color(0xFF07110F),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(28.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text("MoneyMapper Intelligence", style: TextStyle(color: Color(0xFF35C4C4), fontWeight: FontWeight.bold, fontSize: 11)),
              const SizedBox(height: 12),
              const Text("Workforce stress is a silent productivity leak.", style: TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900, height: 1.1)),
              const SizedBox(height: 32),
              Text(_problems[_problemIndex], style: const TextStyle(color: Color(0xFFF1B957), fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 40),
              _buildScanPanel(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildScanPanel() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: const Color(0xFF0D1B18), border: Border.all(color: Colors.white10), borderRadius: BorderRadius.circular(12)),
      child: Column(
        children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            const Text("AI Workforce Scan", style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold)),
            Text("${(_scanProgress * 100).toInt()}%", style: const TextStyle(color: Colors.grey, fontSize: 10)),
          ]),
          const SizedBox(height: 12),
          LinearProgressIndicator(value: _scanProgress, backgroundColor: Colors.white10, valueColor: const AlwaysStoppedAnimation(Color(0xFF44D18C)), minHeight: 4),
        ],
      ),
    );
  }

  Widget _buildNoDataBanner() {
    return Container(
      width: double.infinity,
      color: AppColors.warning.withOpacity(0.1),
      padding: const EdgeInsets.all(12),
      child: const Text("NO DATA — Registered employee signals needed.", style: TextStyle(color: AppColors.warning, fontSize: 10, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
    );
  }

  Widget _buildPrivacyBanner(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.borderLight),
      ),
      child: Row(
        children: [
          const Icon(Icons.shield_outlined, color: AppColors.accent, size: 24),
          const SizedBox(width: 16),
          Expanded(child: Text("Privacy-First: All signals are anonymized and aggregated.", style: TextStyle(color: Colors.grey, fontSize: 11))),
        ],
      ),
    );
  }
}
