import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../services/streak_service.dart';
import '../services/xp_service.dart';
import '../services/notification_service.dart';
import '../theme/app_theme.dart';

class WeeklyScreen extends StatefulWidget {
  const WeeklyScreen({super.key});

  @override
  State<WeeklyScreen> createState() => _WeeklyScreenState();
}

class _WeeklyScreenState extends State<WeeklyScreen> {
  final ApiService _api = ApiService();
  final AuthService _auth = AuthService();
  final StreakService _streakService = StreakService();
  final XpService _xpService = XpService();

  bool _loading = true;
  String? _error;
  bool _isEmpty = false;
  Map<String, dynamic>? _weekData;

  int _streakCount = 0;
  bool? _fixedAchieved;
  bool? _flexibleAchieved;
  bool? _savingsAchieved;

  double _fixedScore = 0;
  double _flexScore = 0;
  double _saveScore = 0;
  double _actualFixed = 0;
  double _actualFlex = 0;
  double _actualSaved = 0;

  double _disciplineScore = 0;
  int _currentWeek = 1;
  double _weeklyIncome = 0;

  double _targetFixedMin = 0;
  double _targetFixedMax = 0;
  double _targetFlexMin = 0;
  double _targetFlexMax = 0;
  double _targetSavingsMin = 0;
  double _targetSavingsMax = 0;

  double _fixedSpent = 0;
  double _flexSpent = 0;
  double _savedAmt = 0;

  String? _weekId;
  String _userName = '';

  @override
  void initState() {
    super.initState();
    _loadStreak();
    _loadData();
  }

  Future<void> _loadStreak() async {
    final count = await _streakService.getStreak();
    if (mounted) setState(() => _streakCount = count);
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = null;
      _isEmpty = false;
    });
    try {
      final name = await _auth.getUserName();
      final data = await _api.getWeeklyCurrent();
      setState(() {
        _weekData = data;
        _userName = name ?? '';
        _weekId = data['id']?.toString();
        _weeklyIncome = (data['income'] ?? 0).toDouble();
        _fixedSpent = (data['fixed_expenses'] ?? 0).toDouble();
        _flexSpent = (data['flexible_expenses'] ?? 0).toDouble();
        _savedAmt = (data['savings'] ?? 0).toDouble();
        _disciplineScore = (data['discipline_score'] ?? 0).toDouble();
        _currentWeek = data['week_no'] ?? 1;
        _targetFixedMin = (data['target_fixed_min'] ?? 0).toDouble();
        _targetFixedMax = (data['target_fixed_max'] ?? 0).toDouble();
        _targetFlexMin = (data['target_flexible_min'] ?? 0).toDouble();
        _targetFlexMax = (data['target_flexible_max'] ?? 0).toDouble();
        _targetSavingsMin = (data['target_savings_min'] ?? 0).toDouble();
        _targetSavingsMax = (data['target_savings_max'] ?? 0).toDouble();
        _fixedAchieved = data['fixed_achieved'];
        _flexibleAchieved = data['flexible_achieved'];
        _savingsAchieved = data['savings_achieved'];
        _loading = false;
      });
    } catch (e) {
      final msg = e.toString();
      setState(() {
        _loading = false;
        if (msg.contains('404') ||
            msg.contains('No weekly') ||
            msg.contains('not found') ||
            (e is ApiException && (e).statusCode == 404)) {
          _isEmpty = true;
          _error = null;
        } else {
          _error = msg;
        }
      });
    }
  }

  Future<void> _toggleRedGreen(String type, bool achieved) async {
    if (_weekId == null) return;

    if (!achieved) {
      // Missed = 0 score directly
      setState(() {
        if (type == 'fixed') {
          _fixedAchieved = false;
          _fixedScore = 0;
          _actualFixed = 0;
        }
        if (type == 'flexible') {
          _flexibleAchieved = false;
          _flexScore = 0;
          _actualFlex = 0;
        }
        if (type == 'savings') {
          _savingsAchieved = false;
          _saveScore = 0;
          _actualSaved = 0;
        }
        _calculateTotalScore();
      });
      await _syncScoresToBackend();
      return;
    }

    // If achieved (Done), ask for amount
    final controller = TextEditingController();
    String label = "";
    if (type == 'fixed') label = "Fixed Expenses";
    if (type == 'flexible') label = "Flexible Expenses";
    if (type == 'savings') label = "Savings";

    final amountStr = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom + 24, left: 24, right: 24, top: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("Log $label", style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text("Enter the exact amount for $label this week:", style: const TextStyle(fontSize: 14, color: Colors.grey)),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              autofocus: true,
              decoration: InputDecoration(
                labelText: "Amount (₹)",
                prefixText: "₹ ",
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(ctx, controller.text),
                child: const Text("Confirm & Calculate Score", style: TextStyle(color: Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );

    if (amountStr != null && amountStr.isNotEmpty) {
      final double amt = double.tryParse(amountStr) ?? 0;
      setState(() {
        if (type == 'fixed') {
          _fixedAchieved = true;
          _actualFixed = amt;
          _fixedScore = _calculateCategoryScore(amt, _targetFixedMin, _targetFixedMax, true);
        } else if (type == 'flexible') {
          _flexibleAchieved = true;
          _actualFlex = amt;
          _flexScore = _calculateCategoryScore(amt, _targetFlexMin, _targetFlexMax, true);
        } else if (type == 'savings') {
          _savingsAchieved = true;
          _actualSaved = amt;
          _saveScore = _calculateCategoryScore(amt, _targetSavingsMin, _targetSavingsMax, false);
        }
        _calculateTotalScore();
      });
      await _syncScoresToBackend();
    }
  }

  double _calculateCategoryScore(double actual, double min, double max, bool isExpense) {
    if (isExpense) {
      // Goal: Spend less. Best score at or below MIN.
      if (actual <= min) return 100.0;
      if (actual > max) {
        // Penalty for overspending
        double over = actual - max;
        return (100.0 - (over / max * 100)).clamp(0.0, 100.0);
      }
      // Between min and max
      return 100.0 - ((actual - min) / (max - min) * 20.0); // Slight deduction within range
    } else {
      // Goal: Save more. Best score at or above MAX.
      if (actual >= max) return 100.0 + ((actual - max) / max * 10.0).clamp(0.0, 20.0); // Bonus for more savings
      if (actual < min) {
        // Penalty for undersaving
        return (actual / min * 100).clamp(0.0, 100.0);
      }
      // Between min and max
      return 80.0 + ((actual - min) / (max - min) * 20.0);
    }
  }

  void _calculateTotalScore() {
    // Weighted Average: 45% Fixed, 35% Flexible, 20% Savings
    _disciplineScore = (_fixedScore * 0.45) + (_flexScore * 0.35) + (_saveScore * 0.20);
  }

  Future<void> _syncScoresToBackend() async {
    try {
      final result = await _api.submitRedGreen({
        'week_id': _weekId,
        'fixed_achieved': _fixedAchieved,
        'flexible_achieved': _flexibleAchieved,
        'savings_achieved': _savingsAchieved,
        'custom_discipline_score': _disciplineScore,
      });

      // Save locally to override Dashboard if needed
      final prefs = await SharedPreferences.getInstance();
      await prefs.setDouble('local_expense_score', _disciplineScore);

      await _streakService.updateStreak();
      await _xpService.rewardWeeklyCheckin();
      await NotificationService().scheduleWeeklyReminders();
      _loadStreak();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _submitWeek() async {
    final incomeCtrl =
        TextEditingController(text: _weeklyIncome > 0 ? _weeklyIncome.toStringAsFixed(0) : '');
    final fixedCtrl =
        TextEditingController(text: _fixedSpent > 0 ? _fixedSpent.toStringAsFixed(0) : '');
    final flexCtrl =
        TextEditingController(text: _flexSpent > 0 ? _flexSpent.toStringAsFixed(0) : '');
    final savingsCtrl =
        TextEditingController(text: _savedAmt > 0 ? _savedAmt.toStringAsFixed(0) : '');

    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        final isDark = Theme.of(ctx).brightness == Brightness.dark;
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
            left: 24,
            right: 24,
            top: 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Enter Parameters', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
              const SizedBox(height: 16),
              _sheetField(incomeCtrl, 'Weekly Income (₹)', isDark),
              const SizedBox(height: 12),
              _sheetField(fixedCtrl, 'Fixed Expenses (₹)', isDark),
              const SizedBox(height: 12),
              _sheetField(flexCtrl, 'Flexible Expenses (₹)', isDark),
              const SizedBox(height: 12),
              _sheetField(savingsCtrl, 'Savings (₹)', isDark),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(ctx, true),
                  child: const Text('Update Targets', style: TextStyle(color: Colors.white)),
                ),
              ),
            ],
          ),
        );
      },
    );

    if (confirmed == true) {
      try {
        final now = DateTime.now();
        await _api.submitWeekly({
          'weeklyIncome': double.tryParse(incomeCtrl.text) ?? _weeklyIncome,
          'fixedSpend': double.tryParse(fixedCtrl.text) ?? _fixedSpent,
          'flexSpend': double.tryParse(flexCtrl.text) ?? _flexSpent,
          'savings': double.tryParse(savingsCtrl.text) ?? _savedAmt,
          'year': now.year,
          'week_no': _currentWeek,
        });
        await _streakService.updateStreak();
        await _xpService.rewardWeeklyCheckin();
        await NotificationService().scheduleWeeklyReminders();
        _loadStreak();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Targets logged successfully!'),
                backgroundColor: Colors.green),
          );
          _loadData();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
                content: Text(e.toString()),
                backgroundColor: Colors.red),
          );
        }
      }
    }
  }

  Widget _sheetField(TextEditingController ctrl, String label, bool isDark) {
    return TextField(
      controller: ctrl,
      keyboardType: TextInputType.number,
      decoration: InputDecoration(
        labelText: label,
        filled: true,
        fillColor: isDark ? AppColors.darkBackground : Colors.grey.shade50,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        prefixText: '₹ ',
      ),
    );
  }

  String _fmt(double v) {
    if (v >= 100000) return '₹${(v / 100000).toStringAsFixed(1)}L';
    if (v >= 1000) {
      return '₹${v.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}';
    }
    return '₹${v.toStringAsFixed(0)}';
  }

  int get _targetsHit {
    int count = 0;
    if (_fixedAchieved == true) count++;
    if (_flexibleAchieved == true) count++;
    if (_savingsAchieved == true) count++;
    return count;
  }

  String _finMessage() {
    if (_disciplineScore >= 90) {
      return 'Superb performance! All target rings completed. You are on track to build wealth! 🏆';
    }
    if (_disciplineScore >= 60) {
      return 'Good progress! ${_savingsAchieved == false ? "Savings missed. Trim down flexible dining next week." : "Keep fixed expenditures within target brackets."}';
    }
    return 'Action required. Spending limits exceeded. Let\'s get back on track!';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _error != null
              ? _buildError()
              : _isEmpty
                  ? _buildEmptyState(isDark)
                  : _buildBody(isDark),
    );
  }

  Widget _buildEmptyState(bool isDark) {
    return Column(
      children: [
        _buildHeader(isDark),
        Expanded(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Container(
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkCard : AppColors.card,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.borderLight),
                ),
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.12),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.calendar_today_outlined, size: 32, color: AppColors.primary),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'No Active Week Data',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Log your parameters to derive dynamic, intelligent spending limits.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 13,
                        color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                      ),
                    ),
                    const SizedBox(height: 28),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _submitWeek,
                        icon: const Icon(Icons.add, color: Colors.white),
                        label: const Text('Submit Parameters', style: TextStyle(color: Colors.white)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 12),
            Text(_error!, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadData,
              child: const Text('Retry', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBody(bool isDark) {
    return RefreshIndicator(
      onRefresh: _loadData,
      color: AppColors.accent,
      child: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(child: _buildHeader(isDark)),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildRingsAndStatCard(isDark),
                  const SizedBox(height: 16),
                  _buildCalendarHeatmapCard(isDark),
                  const SizedBox(height: 16),
                  _buildIncomeCard(isDark),
                  const SizedBox(height: 16),
                  _buildTargetsSection(isDark),
                  const SizedBox(height: 16),
                  _buildFinCard(isDark),
                  const SizedBox(height: 20),
                  _buildSubmitButton(),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(bool isDark) {
    return Container(
      padding: EdgeInsets.fromLTRB(20, MediaQuery.of(context).padding.top + 16, 20, 20),
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
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(28),
          bottomRight: Radius.circular(28),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (Navigator.canPop(context)) ...[
            IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white),
              padding: EdgeInsets.zero,
              alignment: Alignment.centerLeft,
              onPressed: () => Navigator.pop(context),
            ),
            const SizedBox(height: 8),
          ],
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Weekly Tracker',
                      style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900)),
                  SizedBox(height: 4),
                  Text(
                    'Track spending limits & goals',
                    style: TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                ],
              ),
              // Flame Indicator
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    const Text('🔥', style: TextStyle(fontSize: 12)),
                    const SizedBox(width: 4),
                    Text('$_streakCount STREAK', style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                  ],
                ),
              )
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: List.generate(4, (i) {
              final week = i + 1;
              final isCurrent = week == _currentWeek;
              final isPast = week < _currentWeek;
              return Expanded(
                child: Container(
                  margin: EdgeInsets.only(right: i < 3 ? 8 : 0),
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: isCurrent
                        ? AppColors.accent
                        : Colors.white.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(14),
                    border: isCurrent ? null : Border.all(color: Colors.white.withOpacity(0.1), width: 1),
                  ),
                  child: Column(
                    children: [
                      Text('WEEK $week',
                          style: TextStyle(
                              color: isCurrent ? Colors.white : Colors.white60,
                              fontSize: 9,
                              fontWeight: FontWeight.bold)),
                      const SizedBox(height: 2),
                      Text(
                        isCurrent ? 'ACTIVE' : (isPast ? '✓' : '–'),
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w900),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  // Concentric Radial Ring visualization alongside statistics
  Widget _buildRingsAndStatCard(bool isDark) {
    // Progress calculation for targets
    final fixedProgress = _targetFixedMax > 0 ? (_fixedSpent / _targetFixedMax).clamp(0.0, 1.0) : 0.0;
    final flexProgress = _targetFlexMax > 0 ? (_flexSpent / _targetFlexMax).clamp(0.0, 1.0) : 0.0;
    final savingsProgress = _targetSavingsMax > 0 ? (_savedAmt / _targetSavingsMax).clamp(0.0, 1.0) : 0.0;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : AppColors.card,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.borderLight),
      ),
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          // Radial Concentric Canvas
          SizedBox(
            width: 110,
            height: 110,
            child: CustomPaint(
              painter: _ConcentricRingsPainter(
                fixedProgress: fixedProgress,
                flexibleProgress: flexProgress,
                savingsProgress: savingsProgress,
              ),
            ),
          ),
          const SizedBox(width: 24),
          // Stats Group
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _ringLegendRow('Fixed Limits', fixedProgress, AppColors.primary),
                const SizedBox(height: 8),
                _ringLegendRow('Flexible Limits', flexProgress, AppColors.warning),
                const SizedBox(height: 8),
                _ringLegendRow('Savings Goal', savingsProgress, AppColors.success),
                const Divider(height: 16),
                Text(
                  '${_disciplineScore.round()} DISCIPLINE SCORE',
                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: AppColors.accent),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _ringLegendRow(String label, double val, Color color) {
    return Row(
      children: [
        Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 8),
        Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
        const Spacer(),
        Text('${(val * 100).round()}%', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: color)),
      ],
    );
  }

  // GitHub-style habit heatmap card
  Widget _buildCalendarHeatmapCard(bool isDark) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : AppColors.card,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.borderLight),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Habit Heatmap', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
              Text('Daily updates', style: TextStyle(fontSize: 10, color: Colors.grey)),
            ],
          ),
          const SizedBox(height: 16),
          // Grid
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 7,
              crossAxisSpacing: 6,
              mainAxisSpacing: 6,
              childAspectRatio: 1.0,
            ),
            itemCount: 28,
            itemBuilder: (ctx, i) {
              Color cellColor = isDark ? const Color(0xFF1C1C1F) : Colors.grey.shade100;
              bool isActive = false;
              if (i < 12) {
                // Logged days
                isActive = true;
                cellColor = (i % 5 == 0)
                    ? AppColors.danger.withOpacity(0.8)
                    : (i % 3 == 0)
                        ? AppColors.success
                        : AppColors.primary.withOpacity(0.7);
              } else if (i == 12) {
                isActive = true;
                cellColor = AppColors.accent;
              }

              return Container(
                decoration: BoxDecoration(
                  color: cellColor,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Center(
                  child: Text(
                    '${i + 1}',
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                      color: isActive
                          ? Colors.white
                          : (isDark ? Colors.white24 : Colors.grey.shade400),
                    ),
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 12),
          // Legend
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              const Text('Missed', style: TextStyle(fontSize: 9, color: Colors.grey)),
              const SizedBox(width: 4),
              _legendBox(AppColors.danger.withOpacity(0.8)),
              const SizedBox(width: 8),
              const Text('Optimal', style: TextStyle(fontSize: 9, color: Colors.grey)),
              const SizedBox(width: 4),
              _legendBox(AppColors.success),
              const SizedBox(width: 8),
              const Text('Safe', style: TextStyle(fontSize: 9, color: Colors.grey)),
              const SizedBox(width: 4),
              _legendBox(AppColors.primary.withOpacity(0.7)),
            ],
          )
        ],
      ),
    );
  }

  Widget _legendBox(Color color) {
    return Container(
      width: 10,
      height: 10,
      decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2)),
    );
  }

  Widget _buildIncomeCard(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : AppColors.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.borderLight),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text("this week's income",
                    style: TextStyle(color: AppColors.success, fontSize: 9, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(_fmt(_weeklyIncome),
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
              ],
            ),
          ),
          OutlinedButton(
            onPressed: _submitWeek,
            child: const Text('Update', style: TextStyle(fontSize: 12)),
          ),
        ],
      ),
    );
  }

  Widget _buildTargetsSection(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : AppColors.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('your weekly targets', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
              Text('Done / ✗', style: TextStyle(fontSize: 11, color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight)),
            ],
          ),
          const SizedBox(height: 16),
          _targetRow(
            label: 'Fixed expenses',
            min: _targetFixedMin,
            max: _targetFixedMax,
            spent: _fixedSpent,
            spentLabel: 'spent',
            achieved: _fixedAchieved,
            color: AppColors.primary,
            onDone: () => _toggleRedGreen('fixed', true),
            onMissed: () => _toggleRedGreen('fixed', false),
            isDark: isDark,
          ),
          const Divider(height: 24),
          _targetRow(
            label: 'Flexible expenses',
            min: _targetFlexMin,
            max: _targetFlexMax,
            spent: _flexSpent,
            spentLabel: 'spent',
            achieved: _flexibleAchieved,
            color: AppColors.warning,
            onDone: () => _toggleRedGreen('flexible', true),
            onMissed: () => _toggleRedGreen('flexible', false),
            isDark: isDark,
          ),
          const Divider(height: 24),
          _targetRow(
            label: 'Savings this week',
            min: _targetSavingsMin,
            max: _targetSavingsMax,
            spent: _savedAmt,
            spentLabel: 'saved',
            achieved: _savingsAchieved,
            color: AppColors.success,
            onDone: () => _toggleRedGreen('savings', true),
            onMissed: () => _toggleRedGreen('savings', false),
            isDark: isDark,
          ),
        ],
      ),
    );
  }

  Widget _targetRow({
    required String label,
    required double min,
    required double max,
    required double spent,
    required String spentLabel,
    required bool? achieved,
    required Color color,
    required VoidCallback onDone,
    required VoidCallback onMissed,
    required bool isDark,
  }) {
    final progress = max > 0 ? (spent / max).clamp(0.0, 1.0) : 0.0;
    final isOverBudget = spent > max && label != 'Savings this week';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(8)),
              child: Icon(
                label.contains('Savings') ? Icons.savings_rounded : Icons.payment_rounded,
                size: 16,
                color: color,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  Text('Limit: ${_fmt(min)} – ${_fmt(max)}',
                      style: TextStyle(fontSize: 11, color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight)),
                ],
              ),
            ),
            _doneButton(achieved, onDone, onMissed, isDark),
          ],
        ),
        const SizedBox(height: 10),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: progress,
            minHeight: 6,
            backgroundColor: isDark ? const Color(0xFF27272A) : Colors.grey.shade100,
            valueColor: AlwaysStoppedAnimation<Color>(isOverBudget ? AppColors.danger : color),
          ),
        ),
        const SizedBox(height: 6),
        Align(
          alignment: Alignment.centerRight,
          child: Text(
            '${_fmt(spent)} $spentLabel',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: isOverBudget ? AppColors.danger : (isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight),
            ),
          ),
        ),
      ],
    );
  }

  Widget _doneButton(
      bool? achieved, VoidCallback onDone, VoidCallback onMissed, bool isDark) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        GestureDetector(
          onTap: onDone,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: achieved == true ? AppColors.success : Colors.transparent,
              border: Border.all(color: achieved == true ? AppColors.success : (isDark ? AppColors.darkBorder : Colors.grey.shade300)),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              'Done',
              style: TextStyle(
                color: achieved == true ? Colors.white : (isDark ? Colors.grey : Colors.grey.shade700),
                fontSize: 11,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        const SizedBox(width: 6),
        GestureDetector(
          onTap: onMissed,
          child: Container(
            width: 26,
            height: 26,
            decoration: BoxDecoration(
              color: achieved == false ? AppColors.danger : Colors.transparent,
              border: Border.all(color: achieved == false ? AppColors.danger : (isDark ? AppColors.darkBorder : Colors.grey.shade300)),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.close, size: 14, color: achieved == false ? Colors.white : (isDark ? Colors.grey : Colors.grey.shade600)),
          ),
        ),
      ],
    );
  }

  Widget _buildFinCard(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : AppColors.primary.withOpacity(0.06),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.primary.withOpacity(0.12)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: const Text('🦉', style: TextStyle(fontSize: 16)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Fin Says 🦉', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 4),
                Text(
                  _finMessage(),
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSubmitButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _submitWeek,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
        child: const Text(
          'Submit Week parameters',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}

// ── Custom Concentric Radial Rings Painter ──
class _ConcentricRingsPainter extends CustomPainter {
  final double fixedProgress;
  final double flexibleProgress;
  final double savingsProgress;

  _ConcentricRingsPainter({
    required this.fixedProgress,
    required this.flexibleProgress,
    required this.savingsProgress,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final maxRadius = math.min(size.width, size.height) / 2;
    const strokeWidth = 9.0;
    const gap = 5.0;

    // Outer Ring (Fixed Expenses)
    _drawRing(canvas, center, maxRadius - strokeWidth / 2, fixedProgress, AppColors.primary, strokeWidth);

    // Middle Ring (Flexible Expenses)
    _drawRing(canvas, center, maxRadius - strokeWidth / 2 - strokeWidth - gap, flexibleProgress, AppColors.warning, strokeWidth);

    // Inner Ring (Savings)
    _drawRing(canvas, center, maxRadius - strokeWidth / 2 - (strokeWidth + gap) * 2, savingsProgress, AppColors.success, strokeWidth);
  }

  void _drawRing(Canvas canvas, Offset center, double radius, double progress, Color color, double strokeWidth) {
    final trackPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..color = color.withOpacity(0.12);

    final fillPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round
      ..color = color;

    canvas.drawCircle(center, radius, trackPaint);

    if (progress > 0) {
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        -math.pi / 2,
        progress * 2 * math.pi,
        false,
        fillPaint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _ConcentricRingsPainter oldDelegate) {
    return oldDelegate.fixedProgress != fixedProgress ||
        oldDelegate.flexibleProgress != flexibleProgress ||
        oldDelegate.savingsProgress != savingsProgress;
  }
}