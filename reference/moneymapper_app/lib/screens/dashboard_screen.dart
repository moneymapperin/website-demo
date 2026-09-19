import 'dart:math';
import 'dart:convert';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/dashboard_model.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../services/streak_service.dart';
import '../services/xp_service.dart';
import '../services/notification_service.dart';
import '../services/market_data_service.dart';
import '../services/resilience_utils.dart';
import '../theme/responsive_utils.dart';
import '../theme/app_theme.dart';
import '../widgets/dashboard_skeleton.dart';
import '../widgets/pillar_card.dart';
import '../widgets/score_gauge.dart';
import '../widgets/sparkline_chart.dart';
import '../widgets/live_financial_calculator.dart';
import 'onboarding_screen.dart';
import 'stock_screener_screen.dart';
import 'mf_screener_screen.dart';
import 'insurance_screener_screen.dart';
import 'gold_rates_screen.dart';
import '../services/premium_service.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({
    super.key,
    this.onOpenAi,
    this.onOpenWeekly,
    this.onOpenProfile,
  });

  final VoidCallback? onOpenAi;
  final VoidCallback? onOpenWeekly;
  final VoidCallback? onOpenProfile;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _api = ApiService();
  final _auth = AuthService();
  final _streakService = StreakService();
  final _xpService = XpService();
  final _premiumService = PremiumService();

  DashboardData? _data;
  String? _cachedName;
  String? _cachedEmail;
  double _monthlyIncome = 0;
  double _monthlyExpenses = 52000;
  double _emergencyCurrent = 310000;
  double _emergencyTarget = 420000;
  double _sipRecommendation = 15000;
  Map<String, Map<String, dynamic>> _wealthAllocations = {
    'Stock': {'amount': 7500.0, 'percent': '50%'},
    'Mutual Fund': {'amount': 4500.0, 'percent': '30%'},
    'Gold': {'amount': 2250.0, 'percent': '15%'},
    'Real Estate': {'amount': 750.0, 'percent': '5%'},
  };
  int _streakCount = 0;
  List<Map<String, String>> _unlockedBadges = [];
  Map<String, dynamic>? _goldData;
  bool _loading = true;
  String? _error;
  bool _isPro = false;
  bool _isFeatureAccessible = true;
  int _trialDaysRemaining = 7;
  double _totalAssets = 1280000;
  double _netPosition = 1280000;
  int _scorePtsFromLastMonth = 12;

  final PageController _proPageController = PageController();
  int _currentProPageIndex = 0;
  Timer? _proTimer;

  final List<String> _quotes = [
    "Beware of little expenses; a small leak will sink a great ship. 🚢",
    "Don't save what is left after spending; spend what is left after saving. 💰",
    "A budget is telling your money where to go instead of wondering where it went. 📈",
    "Financial freedom is available to those who learn about it and work for it. 🗽",
    "The goal isn't more money. The goal is living life on your terms. 🌟",
    "Wealth consists not in having great possessions, but in having few wants. 🧘",
    "Investing should be more like watching paint dry or watching grass grow. 🌱",
    "Rich people have small TVs and big libraries, and poor people have small libraries and big TVs. 📚",
    "Never depend on single income. Make investment to create a second source. 🔄",
    "The best time to plant a tree was 20 years ago. The second best time is now. 🌳",
    "Do not put all your eggs in one basket. 🧺",
    "Opportunity is missed by most people because it is dressed in overalls and looks like work. 🛠️",
    "Someone is sitting in the shade today because someone planted a tree a long time ago. 🌳",
    "Price is what you pay. Value is what you get. 💎",
    "Money is a terrible master but an excellent servant. 💼",
    "Formal education will make you a living; self-education will make you a fortune. 🎓",
    "The more you learn, the more you earn. 📖",
    "It’s not how much money you make, but how much money you keep. 🏦",
    "Compound interest is the eighth wonder of the world. 🌀",
    "If you don't find a way to make money while you sleep, you will work until you die. 💤",
  ];

  late final String _currentQuote;

  @override
  void initState() {
    super.initState();
    _currentQuote = _quotes[Random().nextInt(_quotes.length)];
    _loadPremiumStatus();
    _loadCachedProfile();
    _loadStreak();
    _load();
    _startProAutoScroll();
  }

  void _startProAutoScroll() {
    _proTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      if (_proPageController.hasClients) {
        int nextPage = (_currentProPageIndex + 1) % 3;
        _proPageController.animateToPage(
          nextPage,
          duration: const Duration(milliseconds: 800),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _proTimer?.cancel();
    _proPageController.dispose();
    super.dispose();
  }

  Future<void> _loadPremiumStatus() async {
    await _premiumService.syncSubscriptionStatus();
    final isPro = await _premiumService.isPro();
    final accessible = await _premiumService.isFeatureAccessible();
    final remaining = await _premiumService.getTrialDaysRemaining();
    if (mounted) {
      setState(() {
        _isPro = isPro;
        _isFeatureAccessible = accessible;
        _trialDaysRemaining = remaining;
      });
    }
  }


  Future<void> _loadStreak() async {
    final count = await _streakService.getStreak();
    if (mounted) setState(() => _streakCount = count);
  }

  Future<void> _loadCachedProfile() async {
    final name = await _auth.getUserName();
    final email = await _auth.getUserEmail();
    if (mounted) {
      setState(() {
        _cachedName = name;
        _cachedEmail = email;
      });
    }
  }

  double _calculateTotalActiveSips(Map<String, dynamic> profile) {
    double eq = double.tryParse(profile['monthlySipEquity']?.toString() ?? '0') ?? 0;
    double debt = double.tryParse(profile['monthlySipDebt']?.toString() ?? '0') ?? 0;
    double gold = double.tryParse(profile['monthlySipGold']?.toString() ?? '0') ?? 0;
    double direct = double.tryParse(profile['monthlySipContribution']?.toString() ?? '0') ?? 0;

    double sum = eq + debt + gold + direct;
    if (sum > 0) return sum;

    sum += _sumSipsFromList(profile['stockSips']);
    sum += _sumSipsFromList(profile['mfSips']);
    sum += _sumSipsFromList(profile['goldSips']);
    return sum;
  }

  double _sumSipsFromList(dynamic listData) {
    if (listData == null || listData is! List) return 0;
    double total = 0;
    for (var item in listData) {
      if (item is Map) {
        total += double.tryParse(item['amount']?.toString() ?? item['sipAmount']?.toString() ?? '0') ?? 0;
      }
    }
    return total;
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    // 1. Load Market Data (User Independent)
    try {
      final gold = await MarketDataService().getGoldRate();
      if (mounted) setState(() => _goldData = gold);
    } catch (e) {
      debugPrint("Gold load failed: $e");
    }

    // 2. Load User Financial Data
    try {
      final coreData = await _api.getDashboard();
      var data = DashboardData.fromCoreSchema(coreData);

      final profileRes = await _api.getMasterProfile();
      final profile = profileRes['data'] ?? {};
      double activeInc = double.tryParse(profile['monthlyActiveIncome']?.toString() ?? '0') ?? 0;
      double passiveInc = double.tryParse(profile['passiveIncomeAmount']?.toString() ?? '0') ?? 0;
      _monthlyIncome = activeInc + passiveInc;

      double fixedExp = double.tryParse(profile['monthlyFixedExpenses']?.toString() ?? '0') ?? 0;
      double varExp = double.tryParse(profile['monthlyVariableExpenses']?.toString() ?? '0') ?? 0;
      double totalExp = fixedExp + varExp;
      if (totalExp > 0) {
        _monthlyExpenses = totalExp;
      } else if (_monthlyIncome > 0) {
        _monthlyExpenses = _monthlyIncome * 0.6;
      } else {
        _monthlyExpenses = 45000;
      }

      double equity = double.tryParse(profile['totalEquityInvestments']?.toString() ?? '0') ?? 0;
      double debt = double.tryParse(profile['totalDebtInvestments']?.toString() ?? '0') ?? 0;
      double goldVal = double.tryParse(profile['totalGoldInvestments']?.toString() ?? '0') ?? 0;
      double re = double.tryParse(profile['totalRealEstateInvestments']?.toString() ?? '0') ?? 0;
      double ef = double.tryParse(profile['emergencyFundCurrent']?.toString() ?? '0') ?? 0;
      double loans = double.tryParse(profile['activeLoans']?.toString() ?? '0') ?? 0;

      double computedAssets = equity + debt + goldVal + re + ef;
      if (computedAssets > 0) {
        _totalAssets = computedAssets;
        _netPosition = computedAssets - loans;
      } else {
        _netPosition = 1280000;
      }

      double efCur = double.tryParse(profile['emergencyFundCurrent']?.toString() ?? '0') ?? 0;
      double efTar = data.pillars['emergency']?.factors?['ef_target_amount'] ?? (_monthlyExpenses * 6);
      if (efCur > 0) _emergencyCurrent = efCur;
      if (efTar > 0) _emergencyTarget = efTar;

      // SIP Recommendation = Monthly Active SIP Contribution + Monthly Shortfall Gap (from Investment Pillar)
      double activeSipSum = _calculateTotalActiveSips(profile);
      double sipGap = double.tryParse(profile['sipShortfallGap']?.toString() ?? profile['sipGap']?.toString() ?? '0') ?? 0;
      if (sipGap == 0) {
        sipGap = (data.pillars['investment']?.factors?['sip_gap'] ?? 0).toDouble();
      }

      double computedSipRec = activeSipSum + sipGap;
      _sipRecommendation = computedSipRec > 0 ? computedSipRec : 10000;

      // Wealth Allocations Breakdown from Investment Pillar (Stock, Mutual Fund, Gold, Real Estate)
      double totalInv = equity + debt + goldVal + re;
      if (totalInv > 0) {
        int stockPct = ((equity / totalInv) * 100).round();
        int mfPct = ((debt / totalInv) * 100).round();
        int goldPct = ((goldVal / totalInv) * 100).round();
        int rePct = (100 - stockPct - mfPct - goldPct).clamp(0, 100);

        _wealthAllocations = {
          'Stock': {'amount': equity, 'percent': '$stockPct%'},
          'Mutual Fund': {'amount': debt, 'percent': '$mfPct%'},
          'Gold': {'amount': goldVal, 'percent': '$goldPct%'},
          'Real Estate': {'amount': re, 'percent': '$rePct%'},
        };
      } else {
        _wealthAllocations = {
          'Stock': {'amount': 42000.0, 'percent': '2%'},
          'Mutual Fund': {'amount': 30000.0, 'percent': '1%'},
          'Gold': {'amount': 21000.0, 'percent': '1%'},
          'Real Estate': {'amount': 2500000.0, 'percent': '96%'},
        };
      }

      // Apply Local Expense Score Override
      final prefs = await SharedPreferences.getInstance();
      final localExpScore = prefs.getDouble('local_expense_score');
      if (localExpScore != null) {
        // Create a new data object with overridden expense score
        final updatedPillars = Map<String, PillarData>.from(data.pillars);
        updatedPillars['expenses'] = PillarData(
          score: localExpScore,
          factors: data.pillars['expenses']?.factors,
        );

        // Recalculate global fitness score (average of 5 pillars)
        double total = 0;
        updatedPillars.forEach((key, p) => total += p.score);
        double newFitnessScore = total / 5;

        data = DashboardData(
          fitnessScore: newFitnessScore,
          fitnessBand: DashboardData.getBand(newFitnessScore), // Recalculate band
          pillars: updatedPillars,
          summary: data.summary, // Keep original summary for now
          userName: data.userName,
          hasFinancialData: data.hasFinancialData,
        );
      }

      // Trigger XP rewards based on loaded data
      await _xpService.checkScoreImprovement(data.fitnessScore);
      for (var entry in data.pillars.entries) {
        await _xpService.checkPillarMastery(entry.key, entry.value.score);
      }

      // Dynamic Badge Logic
      await _checkBadges(data);

      if (!mounted) return;
      setState(() {
        _data = data;
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      if (e.statusCode == 404 || e.statusCode == 401) {
        // 404 = Profile doesn't exist yet, 401 = Not authorized to see stats yet
        // In both cases, show the empty/welcome state instead of an error.
        setState(() {
          _loading = false;
          _data = null;
        });
        return;
      }
      setState(() {
        _error = e.message;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Could not load dashboard data';
        _loading = false;
      });
    }
  }

  void _handleNavigation(String route, String sectionTarget) {
    if (_data == null) {
      Navigator.pushNamed(
        context,
        '/master_data',
        arguments: sectionTarget,
      ).then((_) => _load());
    } else {
      Navigator.pushNamed(context, route).then((_) => _load());
    }
  }

  Widget _header(DashboardData? data, bool isDark) {
    String initial = 'S';
    final nameToUse = data?.userName ?? _cachedName;

    if (nameToUse != null && nameToUse.trim().isNotEmpty) {
      final parts = nameToUse.trim().split(RegExp(r'\s+'));
      if (parts.length >= 2) {
        initial = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      } else if (parts.isNotEmpty) {
        initial = parts[0][0].toUpperCase();
      }
    }

    return Container(
      padding: EdgeInsets.fromLTRB(
        context.wp(5),
        MediaQuery.of(context).padding.top + 10,
        context.wp(5),
        18,
      ),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            const Color(0xFF2E1065),
            const Color(0xFF1E0A45).withOpacity(0.9),
            isDark ? AppColors.darkBackground : AppColors.background,
          ],
          stops: const [0.0, 0.7, 1.0],
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Image.asset('assets/log 3d- hd -.png', height: 46),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                "MoneyMapper",
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 18,
                  letterSpacing: -0.2,
                ),
              ),
              if (_isPro) ...[
                const SizedBox(height: 2),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF8B5CF6), Color(0xFF6D28D9)],
                    ),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.white24, width: 0.5),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('👑 ', style: TextStyle(fontSize: 9)),
                      Text(
                        'PREMIUM',
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
          const Spacer(),
          // Bell Icon with Red Dot Badge
          Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: IconButton(
                  icon: const Icon(Icons.notifications_none_rounded, color: Colors.white, size: 22),
                  onPressed: () {},
                  constraints: const BoxConstraints(minWidth: 38, minHeight: 38),
                  padding: EdgeInsets.zero,
                ),
              ),
              Positioned(
                right: 2,
                top: 2,
                child: Container(
                  width: 9,
                  height: 9,
                  decoration: BoxDecoration(
                    color: AppColors.danger,
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFF2E1065), width: 1.5),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: 10),
          // User Avatar
          GestureDetector(
            onTap: widget.onOpenProfile,
            child: CircleAvatar(
              radius: 19,
              backgroundColor: const Color(0xFF6D28D9),
              child: Text(
                initial,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 15,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showScoreDetailsDialog(DashboardData data, bool isDark) async {
    final stats = await _xpService.getImprovementStats(data.fitnessScore);
    if (!mounted) return;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Row(
          children: [
            Icon(Icons.trending_up_rounded, color: AppColors.success),
            SizedBox(width: 10),
            Text('Score Improvement', style: TextStyle(fontWeight: FontWeight.w900)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Comparison since your first audit:',
              style: TextStyle(fontSize: 13, color: isDark ? Colors.white70 : Colors.black54),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Starting Score:', style: TextStyle(fontWeight: FontWeight.bold)),
                Text('${stats['baseline'].round()}', style: const TextStyle(fontWeight: FontWeight.w900)),
              ],
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Current Score:', style: TextStyle(fontWeight: FontWeight.bold)),
                Text('${data.fitnessScore.round()}', style: const TextStyle(fontWeight: FontWeight.w900)),
              ],
            ),
            const Divider(height: 24),
            Center(
              child: Column(
                children: [
                  Text(
                    '${stats['percentage'] >= 0 ? '+' : ''}${stats['percentage'].toStringAsFixed(1)}%',
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w900,
                      color: stats['percentage'] >= 0 ? AppColors.success : AppColors.danger,
                    ),
                  ),
                  Text(
                    'Overall Improvement',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Text(
              stats['percentage'] >= 0
                ? 'Great job! You have improved your financial health. Keep going! 🚀'
                : 'Your score has decreased slightly since last month. Please follow the recommendations to improve.',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Great!', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildFinancialPositionCard(DashboardData data, bool isDark) {
    if (!_isFeatureAccessible) {
      return _buildLockedProCard(isDark);
    }

    final double netPosToDisplay = _netPosition;
    final String formattedNetPos = "₹${netPosToDisplay.round().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}";

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0D0E15) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? const Color(0xFF1E202E) : AppColors.borderLight,
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.4 : 0.08),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ----------------- SECTION 1: FINANCIAL FITNESS SCORE -----------------
          Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            runSpacing: 6,
            spacing: 8,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'FINANCIAL FITNESS SCORE',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.8,
                      color: isDark ? Colors.white70 : AppColors.textSecondaryLight,
                    ),
                  ),
                  const SizedBox(width: 6),
                  GestureDetector(
                    onTap: () => _showScoreDetailsDialog(data, isDark),
                    child: Icon(
                      Icons.info_outline_rounded,
                      size: 16,
                      color: isDark ? Colors.white54 : Colors.black45,
                    ),
                  ),
                ],
              ),
              if (!_isPro)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.grey.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.withOpacity(0.4)),
                  ),
                  child: const Text(
                    'BASIC',
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Gauge on the Left
              ScoreGauge(
                score: data.fitnessScore,
                size: 130,
              ),
              const SizedBox(width: 16),
              // Details on the Right ("Bagal Mein")
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Status Badge (e.g., 😐 AVERAGE)
                    Row(
                      children: [
                        Text(
                          '${data.bandEmoji} ',
                          style: const TextStyle(fontSize: 16),
                        ),
                        Text(
                          data.bandLabel.toUpperCase(),
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w900,
                            color: AppColors.warning,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    // Actionable Advice / Summary text
                    Text(
                      "You're on track. Focus on investing more and building your emergency fund.",
                      style: TextStyle(
                        fontSize: 11,
                        height: 1.35,
                        fontWeight: FontWeight.w500,
                        color: isDark ? Colors.white70 : AppColors.textSecondaryLight,
                      ),
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 12),
                    // Improvement Badge
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: isDark
                            ? const Color(0xFF161B26)
                            : AppColors.background,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isDark
                              ? const Color(0xFF272F40)
                              : AppColors.borderLight,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(
                                Icons.arrow_upward_rounded,
                                size: 14,
                                color: AppColors.vibrantGreen,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                '$_scorePtsFromLastMonth pts',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w900,
                                  color: AppColors.vibrantGreen,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'from last month',
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w600,
                              color: isDark
                                  ? Colors.white38
                                  : Colors.black45,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),
          Divider(
            color: isDark ? const Color(0xFF1E202E) : AppColors.borderLight,
            height: 1,
          ),
          const SizedBox(height: 20),

          // ----------------- SECTION 2: NET FINANCIAL POSITION -----------------
          Text(
            'NET FINANCIAL POSITION',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.8,
              color: isDark ? Colors.white70 : AppColors.textSecondaryLight,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      formattedNetPos,
                      style: const TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w900,
                        color: AppColors.vibrantGreen,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Total Assets – Total Liabilities',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: isDark ? Colors.white38 : Colors.black45,
                      ),
                    ),
                    const SizedBox(height: 12),
                    // Growth Tag Box
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: isDark
                            ? const Color(0xFF161B26)
                            : AppColors.background,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isDark
                              ? const Color(0xFF272F40)
                              : AppColors.borderLight,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.arrow_upward_rounded,
                                size: 13,
                                color: AppColors.vibrantGreen,
                              ),
                              const SizedBox(width: 3),
                              FittedBox(
                                fit: BoxFit.scaleDown,
                                child: const Text(
                                  '₹18,450 (8.3%)',
                                  style: TextStyle(
                                    fontSize: 11.5,
                                    fontWeight: FontWeight.w900,
                                    color: AppColors.vibrantGreen,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'vs last month',
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w600,
                              color: isDark
                                  ? Colors.white38
                                  : Colors.black45,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 4),
              // Wave Sparkline Graph (Compact 110px width for 100% Zero Overflow)
              const Padding(
                padding: EdgeInsets.only(bottom: 6),
                child: SparklineChart(
                  width: 110,
                  height: 55,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLockedProCard(bool isDark) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0D0E15) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: const Color(0xFFF59E0B).withOpacity(0.4),
          width: 1.5,
        ),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const Icon(Icons.lock_outline_rounded, size: 48, color: Color(0xFFF59E0B)),
          const SizedBox(height: 12),
          Text(
            'Unlock MoneyMapper Pro 🚀',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w900,
              color: isDark ? Colors.white : AppColors.textPrimaryLight,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Your 7-day trial has ended. Subscribe to Pro to unlock your Financial Fitness Score, Net Financial Position analysis, and personalized wealth recommendations.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12,
              height: 1.4,
              color: isDark ? Colors.white70 : AppColors.textSecondaryLight,
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFF59E0B),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
            onPressed: () {
              Navigator.pushNamed(context, '/subscription');
            },
            child: const Text('UPGRADE TO PRO', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
          ),
        ],
      ),
    );
  }

  Widget _quickStatsSection(DashboardData data, bool isDark) {
    final incomeScore = data.pillars['income']?.score ?? 0;
    final expensesScore = data.pillars['expenses']?.score ?? 0;
    final savingsScore = data.pillars['emergency']?.score ?? 0;
    final protectionScore = data.pillars['protection']?.score ?? 0;
    final investmentScore = data.pillars['investment']?.score ?? 0;

    final String fmtIncome = "₹${(_monthlyIncome > 0 ? _monthlyIncome : 85000).round().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} / month";
    final String fmtExpenses = "₹${_monthlyExpenses.round().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} / month";
    final String fmtSavings = "₹${_emergencyCurrent.round().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} / month";
    final String fmtProtection = "Life Cover: ₹1.20 Cr";
    final String fmtInvestment = "₹${_sipRecommendation.round().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} / month";

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0D0E15) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? const Color(0xFF1E202E) : AppColors.borderLight,
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.4 : 0.08),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row (NO View Details link as requested)
          Row(
            children: [
              Text(
                'FINANCIAL BREAKDOWN ',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0.8,
                  color: isDark ? Colors.white : AppColors.textPrimaryLight,
                ),
              ),
              Text(
                '(Your 5 Pillars)',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: isDark ? Colors.white54 : AppColors.textSecondaryLight,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // 1. Income Pillar Row
          _pillarRowItem(
            title: 'Income',
            score: incomeScore,
            subtitleValue: fmtIncome,
            accentColor: const Color(0xFF10B981),
            icon: Icons.savings_outlined,
            isLocked: false,
            onTap: () => _handleNavigation('/income_p', 'income'),
            isDark: isDark,
          ),
          Divider(color: isDark ? const Color(0xFF1B1E2E) : AppColors.borderLight, height: 1),

          // 2. Expenses Pillar Row
          _pillarRowItem(
            title: 'Expenses',
            score: expensesScore,
            subtitleValue: fmtExpenses,
            accentColor: const Color(0xFFEF4444),
            icon: Icons.account_balance_wallet_outlined,
            isLocked: false,
            onTap: () => _handleNavigation('/weekly_expense_p', 'expenses'),
            isDark: isDark,
          ),
          Divider(color: isDark ? const Color(0xFF1B1E2E) : AppColors.borderLight, height: 1),

          // 3. Emergency Savings Pillar Row
          _pillarRowItem(
            title: 'Emergency Savings',
            score: savingsScore,
            subtitleValue: fmtSavings,
            accentColor: const Color(0xFF3B82F6),
            icon: Icons.account_balance_outlined,
            isLocked: !_isFeatureAccessible,
            showTrialBadge: !_isPro && _isFeatureAccessible,
            onTap: () => _handleNavigation('/emergency_fund_p', 'emergency'),
            isDark: isDark,
          ),
          Divider(color: isDark ? const Color(0xFF1B1E2E) : AppColors.borderLight, height: 1),

          // 4. Protection Pillar Row
          _pillarRowItem(
            title: 'Protection',
            score: protectionScore,
            subtitleValue: fmtProtection,
            accentColor: const Color(0xFFA855F7),
            icon: Icons.shield_outlined,
            isLocked: !_isFeatureAccessible,
            showTrialBadge: !_isPro && _isFeatureAccessible,
            onTap: () => _handleNavigation('/insurance_p', 'insurance'),
            isDark: isDark,
          ),
          Divider(color: isDark ? const Color(0xFF1B1E2E) : AppColors.borderLight, height: 1),

          // 5. Investment Pillar Row
          _pillarRowItem(
            title: 'Investment',
            score: investmentScore,
            subtitleValue: fmtInvestment,
            accentColor: const Color(0xFFF59E0B),
            icon: Icons.show_chart_rounded,
            isLocked: !_isFeatureAccessible,
            showTrialBadge: !_isPro && _isFeatureAccessible,
            onTap: () => _handleNavigation('/mutual_fund_p', 'investment'),
            isDark: isDark,
          ),
        ],
      ),
    );
  }

  Widget _pillarRowItem({
    required String title,
    required double score,
    required String subtitleValue,
    required Color accentColor,
    required IconData icon,
    required bool isLocked,
    bool showTrialBadge = false,
    required VoidCallback onTap,
    required bool isDark,
  }) {
    final double progress = (score / 100).clamp(0.0, 1.0);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            // 1. Glowing Rounded Icon Box
            Container(
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(
                color: accentColor.withOpacity(0.18),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: accentColor.withOpacity(0.3), width: 1),
              ),
              child: Icon(icon, color: accentColor, size: 16),
            ),
            const SizedBox(width: 8),

            // 2. Pillar Title Column
            Expanded(
              flex: 5,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Flexible(
                        child: Text(
                          title,
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w800,
                            color: isDark ? Colors.white : AppColors.textPrimaryLight,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (showTrialBadge) ...[
                        const SizedBox(width: 3),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                          decoration: BoxDecoration(
                            color: Colors.grey.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(5),
                            border: Border.all(color: Colors.grey.withOpacity(0.4), width: 0.6),
                          ),
                          child: const Text(
                            'BASIC',
                            style: TextStyle(
                              fontSize: 7,
                              fontWeight: FontWeight.w900,
                              color: Colors.grey,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitleValue,
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w500,
                      color: isDark ? Colors.white54 : AppColors.textSecondaryLight,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 4),

            // 3. Score Column
            Row(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: [
                Text(
                  score.round().toString(),
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w900,
                    color: accentColor,
                  ),
                ),
                Text(
                  '/100',
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w600,
                    color: isDark ? Colors.white54 : AppColors.textSecondaryLight,
                  ),
                ),
              ],
            ),
            const SizedBox(width: 6),

            // 4. Progress Bar (Flexible for 100% Zero Overflow)
            Flexible(
              flex: 2,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: progress,
                  minHeight: 4,
                  backgroundColor: isDark ? const Color(0xFF222638) : Colors.grey.shade300,
                  valueColor: AlwaysStoppedAnimation<Color>(accentColor),
                ),
              ),
            ),
            const SizedBox(width: 6),

            // 5. Action Chevron / Lock Icon
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: accentColor.withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(
                isLocked ? Icons.lock_outline_rounded : Icons.chevron_right_rounded,
                size: 14,
                color: isLocked ? AppColors.warning : accentColor,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _checkBadges(DashboardData data) async {
    // 1. Debt Free Milestone
    final localProfile = await _auth.getMasterProfileLocally();
    if (localProfile != null) {
      final profile = jsonDecode(localProfile);
      final loans = profile['activeLoans']?.toString() ?? '0';
      if (loans == '0' || loans.isEmpty) {
        await _xpService.rewardBadge('debt_free');
      }
    }

    // 2. Emergency Fund Complete
    if ((data.pillars['emergency']?.score ?? 0) >= 100) {
      await _xpService.rewardBadge('emergency_complete');
    }

    // 3. Investment Starter
    if ((data.pillars['investment']?.score ?? 0) > 0) {
      await _xpService.rewardBadge('investment_starter');
    }

    // 4. Protection Pro
    if ((data.pillars['protection']?.score ?? 0) >= 90) {
      await _xpService.rewardBadge('protection_pro');
    }

    // 5. Comeback Kid
    if (_streakCount >= 1) {
      final prefs = await SharedPreferences.getInstance();
      if (prefs.getBool('streak_reset_happened') ?? false) {
        if (await _xpService.rewardBadge('comeback_kid')) {
          await prefs.setBool('streak_reset_happened', false);
        }
      }
    }

    // Map saved IDs to UI Display data
    final unlockedIds = await _xpService.getUnlockedBadges();
    final badgeMap = {
      'debt_free': {'emoji': '🎉', 'title': 'Debt Free Milestone', 'desc': 'Zero active loans reported'},
      'emergency_complete': {'emoji': '🛡️', 'title': 'Emergency Fund Complete', 'desc': '3-month buffer achieved'},
      'investment_starter': {'emoji': '🌱', 'title': 'Investment Starter', 'desc': 'First SIP/Investment logged'},
      'protection_pro': {'emoji': '👨‍👩‍👧', 'title': 'Protection Pro', 'desc': 'Full health & life cover verified'},
      'comeback_kid': {'emoji': '⚡', 'title': 'Comeback Kid', 'desc': 'Streak resumed after reset'},
    };

    if (mounted) {
      setState(() {
        _unlockedBadges = unlockedIds.where((id) => badgeMap.containsKey(id)).map((id) => badgeMap[id]!).toList().cast<Map<String, String>>();
      });
    }
  }

  Widget _buildGoldTicker(bool isDark) {
    if (_goldData == null || (_goldData!['24K (999 Purity)'] ?? 0) <= 0) {
      // Show a placeholder loader if data isn't ready yet, instead of hiding completely
      return Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isDark ? Colors.white.withOpacity(0.03) : Colors.black.withOpacity(0.03),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.grey)),
            const SizedBox(width: 12),
            Text("Syncing Live Gold Rates...", style: TextStyle(fontSize: 10, color: Colors.grey.shade500, fontWeight: FontWeight.bold)),
          ],
        ),
      );
    }

    final double price24k = ResilienceUtils.safeDouble(_goldData!['24K (999 Purity)']);

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: GestureDetector(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const GoldRatesScreen()),
          );
        },
        child: Container(
          height: 110,
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkCard : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFD4AF37).withOpacity(0.3), width: 1.5),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFD4AF37).withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: Stack(
              children: [
              // Real Gold Image from Assets
              Positioned(
                right: -15,
                bottom: -5, // Pushed to the bottom right
                child: Image.asset(
                  'assets/gold_brick.png',
                  fit: BoxFit.contain,
                  width: 150,
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        "LIVE GOLD RATE 24K",
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                          letterSpacing: 1.0,
                        ),
                      ),
                      Text(
                        "(PER GRAM)",
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white60 : Colors.black45,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "₹${price24k.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}",
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          color: isDark ? Colors.white : AppColors.textPrimaryLight,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildScoreCardsSection(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header
        Text(
          'MONEYMAPPER SCORE CARDS',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w900,
            letterSpacing: 0.8,
            color: isDark ? Colors.white : AppColors.textPrimaryLight,
          ),
        ),
        const SizedBox(height: 12),

        // 2x2 Grid of Score Cards
        Row(
          children: [
            Expanded(
              child: _scoreCardItem(
                title: 'Stock Score',
                scoreValue: '75',
                category: 'NIFTY 500 COMPANIES',
                description: 'Buy / Sell Recommendations',
                color: const Color(0xFF10B981),
                iconWidget: const Icon(Icons.trending_up_rounded, color: Color(0xFF10B981), size: 16),
                cardType: 'stock',
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const StockScreenerScreen()),
                ),
                isDark: isDark,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _scoreCardItem(
                title: 'Mutual Fund Score',
                scoreValue: '82',
                category: '3000+ MUTUAL FUNDS',
                description: 'Top Performing Funds',
                color: const Color(0xFF3B82F6),
                iconWidget: const Icon(Icons.pie_chart_outline_rounded, color: Color(0xFF3B82F6), size: 16),
                cardType: 'mf',
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const MutualFundScreenerScreen()),
                ),
                isDark: isDark,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _scoreCardItem(
                title: 'Insurance Score',
                scoreValue: '83',
                category: '83 LIFE & HEALTH PLANS',
                description: 'Best Plans for You',
                color: const Color(0xFFA855F7),
                iconWidget: const Icon(Icons.shield_outlined, color: Color(0xFFA855F7), size: 16),
                cardType: 'insurance',
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const InsuranceScreenerScreen()),
                ),
                isDark: isDark,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _scoreCardItem(
                title: 'IPO Score',
                scoreValue: '78',
                category: 'UPCOMING IPOs',
                description: 'Analysis & Recommendations',
                color: const Color(0xFFF59E0B),
                iconWidget: const Icon(Icons.rocket_launch_outlined, color: Color(0xFFF59E0B), size: 16),
                cardType: 'ipo',
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('IPO Score coming soon!'), duration: Duration(seconds: 1)),
                  );
                },
                isDark: isDark,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _scoreCardItem({
    required String title,
    required String scoreValue,
    required String category,
    required String description,
    required Color color,
    required Widget iconWidget,
    required String cardType,
    required VoidCallback onTap,
    required bool isDark,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 185,
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF0D0E15) : Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(
            color: color.withOpacity(0.35),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.08),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(22),
          child: Stack(
            children: [
              // Custom Wave & Vector Graphic Background (matching Screenshot 2)
              Positioned.fill(
                child: _CardWaveGraphic(color: color, cardType: cardType),
              ),

              // Foreground Contents
              Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Top Left Icon + Title
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: color.withOpacity(0.18),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: iconWidget,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            title,
                            style: TextStyle(
                              color: color,
                              fontWeight: FontWeight.w900,
                              fontSize: 13,
                              letterSpacing: 0.2,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),

                    // Middle Section: Score (75 /100) + Category & Description
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.baseline,
                          textBaseline: TextBaseline.alphabetic,
                          children: [
                            Text(
                              scoreValue,
                              style: TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.w900,
                                color: isDark ? Colors.white : AppColors.textPrimaryLight,
                                height: 1.0,
                              ),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '/100',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: isDark ? Colors.white54 : AppColors.textSecondaryLight,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          category,
                          style: TextStyle(
                            color: isDark ? Colors.white : AppColors.textPrimaryLight,
                            fontWeight: FontWeight.w900,
                            fontSize: 10.5,
                            letterSpacing: 0.4,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          description,
                          style: TextStyle(
                            color: isDark ? Colors.white54 : AppColors.textSecondaryLight,
                            fontWeight: FontWeight.w500,
                            fontSize: 9.5,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),

                    // Bottom Right Action Chevron Button
                    Align(
                      alignment: Alignment.bottomRight,
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: color.withOpacity(0.25),
                          shape: BoxShape.circle,
                          border: Border.all(color: color.withOpacity(0.5), width: 1.2),
                        ),
                        child: Icon(
                          Icons.chevron_right_rounded,
                          color: isDark ? Colors.white : color,
                          size: 18,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProBanners(bool isDark) {
    if (_isPro) return const SizedBox.shrink();

    final List<Map<String, dynamic>> banners = [
      {
        'title': 'Quarterly Plan',
        'price': '499',
        'oldPrice': '799',
        'off': '38% OFF',
        'save': 'SAVE ₹897',
        'image': 'assets/quarterly_plan.png'
      },
      {
        'title': 'Half-Yearly Plan',
        'price': '399',
        'oldPrice': '799',
        'off': '50% OFF',
        'save': 'SAVE ₹2400',
        'image': 'assets/half_yearly_2.png'
      },
      {
        'title': 'Yearly Plan',
        'price': '299',
        'oldPrice': '799',
        'off': '63% OFF',
        'save': 'SAVE ₹6000',
        'image': 'assets/yearly_plan_1.png'
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 24),
        Text(
          'Unlock MoneyMapper Pro 🚀',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : AppColors.textPrimaryLight,
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 200, // Increased height to prevent button overflow
          child: Column(
            children: [
              Expanded(
                child: PageView.builder(
                  controller: _proPageController,
                  itemCount: banners.length,
                  onPageChanged: (index) {
                    setState(() {
                      _currentProPageIndex = index;
                    });
                  },
                  itemBuilder: (ctx, i) {
                    final b = banners[i];
                    return GestureDetector(
                      onTap: () => Navigator.pushNamed(context, '/subscription'),
                      child: Container(
                        width: double.infinity,
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              const Color(0xFFF59E0B).withOpacity(0.25),
                              const Color(0xFFD97706).withOpacity(0.25),
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.3), width: 1.5),
                        ),
                        child: Stack(
                          children: [
                            Positioned(
                              left: -10,
                              bottom: -5,
                              child: Image.asset(
                                b['image']!,
                                height: 120,
                                fit: BoxFit.contain,
                                filterQuality: FilterQuality.high,
                              ),
                            ),
                            // Content on the right
                            Align(
                              alignment: Alignment.centerRight,
                              child: Padding(
                                padding: const EdgeInsets.only(right: 20, top: 12, bottom: 12),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(
                                      b['title']!,
                                      style: TextStyle(
                                        color: isDark ? Colors.white : AppColors.textPrimaryLight,
                                        fontSize: 18,
                                        fontWeight: FontWeight.w900,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: Colors.green.withOpacity(0.15),
                                        borderRadius: BorderRadius.circular(6),
                                        border: Border.all(color: Colors.green.withOpacity(0.3)),
                                      ),
                                      child: Text(
                                        b['save']!,
                                        style: const TextStyle(color: Colors.green, fontSize: 9, fontWeight: FontWeight.w900),
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Row(
                                      mainAxisSize: MainAxisSize.min,
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        Text(
                                          '₹${b['price']}',
                                          style: TextStyle(
                                            color: isDark ? Colors.white : AppColors.textPrimaryLight,
                                            fontSize: 28,
                                            fontWeight: FontWeight.w900,
                                          ),
                                        ),
                                        const Padding(
                                          padding: EdgeInsets.only(bottom: 4.0),
                                          child: Text('/mo', style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold)),
                                        ),
                                      ],
                                    ),
                                    Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(
                                          '₹${b['oldPrice']}',
                                          style: const TextStyle(
                                            color: Colors.grey,
                                            fontSize: 12,
                                            decoration: TextDecoration.lineThrough,
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          b['off']!,
                                          style: const TextStyle(color: AppColors.accent, fontSize: 10, fontWeight: FontWeight.w900),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF59E0B),
                                        borderRadius: BorderRadius.circular(12),
                                        boxShadow: [
                                          BoxShadow(
                                            color: const Color(0xFFF59E0B).withOpacity(0.4),
                                            blurRadius: 10,
                                            offset: const Offset(0, 4),
                                          ),
                                        ],
                                      ),
                                      child: const Text(
                                        "CLAIM OFFER",
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 10,
                                          fontWeight: FontWeight.w900,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(banners.length, (index) {
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    height: 6,
                    width: _currentProPageIndex == index ? 16 : 6,
                    decoration: BoxDecoration(
                      color: _currentProPageIndex == index
                          ? AppColors.primary
                          : Colors.grey.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(3),
                    ),
                  );
                }),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _errorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.cloud_off, size: 48, color: Colors.grey.shade500),
            const SizedBox(height: 16),
            Text(
              _error ?? 'Something went wrong',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey.shade700),
            ),
            const SizedBox(height: 20),
            ElevatedButton(onPressed: _load, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // --- NEW: MARKET TOOLS FOR NEW USERS ---
        _buildGoldTicker(isDark),
        SizedBox(height: context.hp(1)),
        _buildScoreCardsSection(isDark),
        SizedBox(height: context.hp(4)),
        
        // Existing Setup Profile Card
        Card(
          color: isDark ? const Color(0xFF2C2516) : const Color(0xFFFFFBEB),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
            side: BorderSide(
              color: isDark ? const Color(0xFF5F4E2B) : const Color(0xFFFDE68A),
              width: 1.5,
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              children: [
                const Text('💡', style: TextStyle(fontSize: 48)),
                const SizedBox(height: 16),
                Text(
                  'Welcome to MoneyMapper!',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 20,
                    color: isDark ? Colors.white : Colors.black87,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  _currentQuote,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 15,
                    fontStyle: FontStyle.italic,
                    color: isDark ? Colors.white70 : Colors.black54,
                  ),
                ),
                const SizedBox(height: 24),
                const Divider(),
                const SizedBox(height: 16),
                Text(
                  'Your financial profile is currently empty. To see your fitness score and personalized insights, please fill in your master data.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    color: isDark ? Colors.white60 : Colors.black45,
                  ),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    onPressed: () => _handleNavigation('/master_data', 'identity'),
                    child: const Text(
                      'Set Up Financial Profile',
                      style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        // Basic Info Box
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkCard : Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.borderLight),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'YOUR BASIC IDENTITY',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                  letterSpacing: 1.1,
                ),
              ),
              const SizedBox(height: 16),
              _identityTile(Icons.person_outline, 'Name', _cachedName ?? 'Not Set', isDark),
              const Divider(height: 24),
              _identityTile(Icons.email_outlined, 'Email', _cachedEmail ?? 'Not Set', isDark),
            ],
          ),
        ),
      ],
    );
  }

  Widget _identityTile(IconData icon, String label, String value, bool isDark) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.primary),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label, 
              style: TextStyle(
                fontSize: 11, 
                color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
              ),
            ),
            Text(
              value, 
              style: TextStyle(
                fontSize: 14, 
                fontWeight: FontWeight.bold, 
                color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildQuotesSection(bool isDark) {
    return Container(
      constraints: const BoxConstraints(minHeight: 105),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF200B3B),
            Color(0xFF3B126A),
            Color(0xFF280B4D),
          ],
        ),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: const Color(0xFF5B1D99).withOpacity(0.6),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF200B3B).withOpacity(0.5),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(22),
        child: Stack(
          children: [
            // Right Side Graphic (MoneyMapper 3D Compass Logo + Upward Trend Arrow)
            Positioned(
              right: 12,
              bottom: 8,
              top: 8,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.north_east_rounded,
                    color: const Color(0xFFA855F7).withOpacity(0.35),
                    size: 28,
                  ),
                  const SizedBox(width: 8),
                  Image.asset(
                    'assets/log 3d- hd -.png',
                    height: 75,
                    fit: BoxFit.contain,
                    filterQuality: FilterQuality.high,
                  ),
                ],
              ),
            ),

            // Left Side Quote Text Content
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 120, 16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '“',
                    style: TextStyle(
                      fontSize: 34,
                      height: 0.8,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFFA855F7),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _currentQuote,
                      style: TextStyle(
                        fontSize: 12.5,
                        height: 1.35,
                        fontWeight: FontWeight.w600,
                        color: Colors.white.withOpacity(0.92),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFooter(bool isDark) {
    return Container(
      padding: EdgeInsets.fromLTRB(0, 10, 0, MediaQuery.of(context).padding.bottom + 16),
      child: Column(
        children: [
          Text(
            'MoneyMapper',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.5,
              color: isDark ? Colors.white : AppColors.primary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Your Financial Navigation System',
            style: TextStyle(
              fontSize: 10,
              color: isDark ? Colors.white38 : AppColors.textSecondaryLight,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDashboardBody(DashboardData data, bool isDark) {
    // Range Calculation (Consistent with Weekly Tracker logic)
    final double weeklyIncome = _monthlyIncome / 4;
    final double expenseScore = data.pillars['expenses']?.score ?? 0.0;

    // Middle points based on performance
    double fMid = (0.25 + (expenseScore / 100) * 0.10).clamp(0.25, 0.35);
    double xMid = (0.55 - (expenseScore / 100) * 0.10).clamp(0.45, 0.55);

    // Sum of Fixed + Flexible Ranges
    final double minTotal = weeklyIncome * ((xMid - 0.02) + (fMid - 0.02));
    final double maxTotal = weeklyIncome * ((xMid + 0.02) + (fMid + 0.02));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // 1. Core Financial Fitness & Net Position Widget (matching screenshot)
        _buildFinancialPositionCard(data, isDark),
        SizedBox(height: context.hp(2.5)),

        _buildProBanners(isDark),

        // --- LIVE GOLD TICKER (placed above Estimated Spending Limit) ---
        _buildGoldTicker(isDark),

        // --- WEEKLY SPENDING LIMIT WIDGET ---
        if (_monthlyIncome > 0)
          Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Container(
              height: 125,
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkCard : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.primary.withOpacity(0.3), width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: Stack(
                  children: [
                    Positioned(
                      right: -15,
                      bottom: -10,
                      child: Image.asset(
                        'assets/spending1.png',
                        fit: BoxFit.contain,
                        height: 100,
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "ESTIMATED SPENDING LIMIT",
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                              letterSpacing: 0.5,
                            ),
                          ),
                          Text(
                            "(THIS WEEK)",
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                              color: isDark ? Colors.white60 : Colors.black45,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            "₹${minTotal.round().toString()} - ₹${maxTotal.round().toString()}",
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w900,
                              color: isDark ? Colors.white : AppColors.textPrimaryLight,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              "TARGET",
                              style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: AppColors.primary),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

        // --- MONEYMAPPER SCORE CARDS (placed below Estimated Spending Limit & above Live Financial Calculator) ---
        Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: _buildScoreCardsSection(isDark),
        ),

        // --- LIVE FINANCIAL CALCULATOR WIDGET ---
        Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: LiveFinancialCalculator(
            monthlyIncome: _monthlyIncome > 0 ? _monthlyIncome : 70000,
            monthlyExpenses: _monthlyExpenses,
            availableBalance: (_monthlyIncome > 0 ? _monthlyIncome : 70000) - _monthlyExpenses,
            emergencyCurrent: _emergencyCurrent,
            emergencyTarget: _emergencyTarget,
            sipRecommendation: _sipRecommendation,
            wealthAllocations: _wealthAllocations,
            isSipLocked: !_isFeatureAccessible,
            showSipTrialBadge: !_isPro && _isFeatureAccessible,
          ),
        ),

        SizedBox(height: context.hp(1.5)),

        _quickStatsSection(data, isDark),
        const SizedBox(height: 16),
        _buildQuotesSection(isDark),
        const SizedBox(height: 8),
        _buildFooter(isDark),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      body: Column(
        children: [
          if (_loading) const DashboardHeaderSkeleton() else _header(_data, isDark),
          Expanded(
            child: _loading
                ? const DashboardSkeleton()
                : _error != null
                    ? _errorView()
                    : RefreshIndicator(
                        color: AppColors.accent,
                        onRefresh: _load,
                        child: SingleChildScrollView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: EdgeInsets.fromLTRB(context.wp(4), 16, context.wp(4), 24),
                          child: _data == null
                              ? _buildEmptyState(isDark)
                              : _buildDashboardBody(_data!, isDark),
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}

class _CardWaveGraphic extends StatelessWidget {
  final Color color;
  final String cardType;

  const _CardWaveGraphic({
    required this.color,
    required this.cardType,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        CustomPaint(
          size: Size.infinite,
          painter: _CardWavePainter(color: color),
        ),
        if (cardType == 'stock')
          Positioned(
            right: 28,
            top: 38,
            child: Opacity(
              opacity: 0.35,
              child: Icon(Icons.candlestick_chart_rounded, size: 48, color: color),
            ),
          )
        else if (cardType == 'mf')
          Positioned(
            right: 28,
            top: 36,
            child: Opacity(
              opacity: 0.35,
              child: Icon(Icons.pie_chart_rounded, size: 44, color: color),
            ),
          )
        else if (cardType == 'insurance')
          Positioned(
            right: 28,
            top: 38,
            child: Opacity(
              opacity: 0.35,
              child: Icon(Icons.shield_rounded, size: 44, color: color),
            ),
          )
        else if (cardType == 'ipo')
          Positioned(
            right: 32,
            top: 38,
            child: Transform.rotate(
              angle: -0.2,
              child: const Opacity(
                opacity: 0.45,
                child: Text('🚀', style: TextStyle(fontSize: 34)),
              ),
            ),
          ),
      ],
    );
  }
}

class _CardWavePainter extends CustomPainter {
  final Color color;

  _CardWavePainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final Path path = Path();
    path.moveTo(0, size.height * 0.52);

    path.cubicTo(
      size.width * 0.25, size.height * 0.38,
      size.width * 0.60, size.height * 0.58,
      size.width, size.height * 0.22,
    );

    final Paint linePaint = Paint()
      ..color = color.withOpacity(0.8)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    final Path fillPath = Path.from(path)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();

    final Paint fillPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          color.withOpacity(0.18),
          Colors.transparent,
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));

    canvas.drawPath(fillPath, fillPaint);
    canvas.drawPath(path, linePaint);
  }

  @override
  bool shouldRepaint(covariant _CardWavePainter oldDelegate) => oldDelegate.color != color;
}

