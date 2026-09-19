import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'dart:math' as math;
import 'package:shared_preferences/shared_preferences.dart';
import 'theme/responsive_utils.dart';
import 'theme/app_theme.dart';
import 'services/api_service.dart';
import 'services/streak_service.dart';
import 'services/xp_service.dart';
import 'services/notification_service.dart';
import 'services/advisory_service.dart';

class WeeklyExpensePredictor extends StatefulWidget {
  const WeeklyExpensePredictor({super.key});

  @override
  State<WeeklyExpensePredictor> createState() => _WeeklyExpensePredictorState();
}

class _WeeklyExpensePredictorState extends State<WeeklyExpensePredictor> {
  final ApiService _api = ApiService();
  final StreakService _streakService = StreakService();
  final XpService _xpService = XpService();
  bool _loading = true;
  int _currentViewWeekIndex = 0; 
  int _activeCalendarWeekIndex = 0;
  
  List<Map<String, dynamic>> _weeks = [];
  double _expenseScore = 0.0;
  double _disciplineScore = 0.0;
  String _targetsHit = "0/4";
  String _disciplineMsg = "Your financial discipline message will appear here.";
  String _expenseAdvice = "";

  double _fixedScore = 0;
  double _flexScore = 0;
  double _saveScore = 0;
  double _actualFixed = 0;
  double _actualFlex = 0;
  double _actualSaved = 0;

  // Weekly Decisions State (Current View)
  String? _fixedDecision;
  String? _flexibleDecision;
  String? _savingsDecision;

  @override
  void initState() {
    super.initState();
    _loadWeeklyData();
  }

  Future<void> _loadWeeklyData() async {
    if (!mounted) return;
    setState(() => _loading = true);
    
    try {
      DateTime now = DateTime.now();
      final dashboard = await _api.getDashboard();
      final weeklyLogsRes = await _api.getWeeklyCurrent(month: now.month, year: now.year);
      final profileRes = await _api.getMasterProfile();
      
      final List<dynamic> logs = weeklyLogsRes['data'] ?? [];
      final profile = profileRes['data'] ?? {};
      
      final expScores = dashboard['expense_scores'] ?? {};
      _expenseScore = (dashboard['financial_fitness_scores']?['expense_pillar_score'] ?? 0.0).toDouble();
      _disciplineScore = (expScores['savings_score'] ?? 0.0).toDouble();
      _disciplineMsg = expScores['discipline_message'] ?? _disciplineMsg;
      _expenseAdvice = AdvisoryService.getAdvisoryText('expenses', _expenseScore);

      final double monthlyIncome = double.tryParse(profile['monthlyActiveIncome']?.toString() ?? '0') ?? 0;
      final double weeklyIncome = monthlyIncome / 4;

      DateTime firstDayOfMonth = DateTime(now.year, now.month, 1);
      
      // Fixed Sunday start logic
      DateTime monthStart = firstDayOfMonth;
      while (monthStart.weekday != DateTime.sunday) {
        monthStart = monthStart.subtract(const Duration(days: 1));
      }

      // --- DYNAMIC WEEK COUNT CALCULATION ---
      DateTime lastDayOfMonth = DateTime(now.year, now.month + 1, 0);
      int totalDays = lastDayOfMonth.difference(monthStart).inDays + 1;
      int weekCount = (totalDays / 7).ceil();

      // Update Hit Rate using the freshly calculated weekCount
      int hitCount = logs.where((l) => l['status'] == 'achieved').length;
      _targetsHit = "$hitCount/$weekCount";

      // --- RANGE CALCULATION LOGIC ---
      double sMid = math.max(0.25, math.min(0.40, 0.40 - (_expenseScore / 100) * 0.15));
      double fMid = math.max(0.25, math.min(0.35, 0.25 + (_expenseScore / 100) * 0.10));
      double xMid = math.max(0.45, math.min(0.55, 0.55 - (_expenseScore / 100) * 0.10));

      List<Map<String, dynamic>> tempWeeks = [];
      for (int i = 0; i < weekCount; i++) {
        DateTime wStart = monthStart.add(Duration(days: i * 7));
        DateTime wEnd = wStart.add(const Duration(days: 6));
        
        dynamic log;
        for (var l in logs) {
          if (l['week_index'] == i + 1) { log = l; break; }
        }

        bool isPast = now.isAfter(wEnd.add(const Duration(hours: 23, minutes: 59)));
        bool isFuture = now.isBefore(wStart);
        bool isCurrent = !isPast && !isFuture;

        if (isCurrent) _activeCalendarWeekIndex = i;

        tempWeeks.add({
          'index': i + 1,
          'start': wStart,
          'end': wEnd,
          'range_fixed': [weeklyIncome * (xMid - 0.02), weeklyIncome * (xMid + 0.02)],
          'range_flex': [weeklyIncome * (fMid - 0.02), weeklyIncome * (fMid + 0.02)],
          'range_save': [weeklyIncome * (sMid - 0.02), weeklyIncome * (sMid + 0.02)],
          'status': log?['status'],
          'fixed_status': log?['fixed_status'],
          'flexible_status': log?['flexible_status'],
          'savings_status': log?['savings_status'],
          'is_locked': isFuture || (isPast && log == null),
          'is_current': isCurrent,
          'is_submitted': log != null,
        });
      }

      setState(() {
        _weeks = tempWeeks;
        _currentViewWeekIndex = _activeCalendarWeekIndex;
        _updateViewDecisions();
        _loading = false;
      });

    } catch (e) {
      debugPrint('Weekly Load Error: $e');
      setState(() => _loading = false);
    }
  }

  void _updateViewDecisions() {
    if (_weeks.isEmpty) return;
    final cur = _weeks[_currentViewWeekIndex];
    _fixedDecision = cur['fixed_status'];
    _flexibleDecision = cur['flexible_status'];
    _savingsDecision = cur['savings_status'];

    // Reset local scores based on existing submission
    if (_fixedDecision == 'achieved') {
       _fixedScore = 15; // Minimum base if no amount data
    } else {
       _fixedScore = 0;
    }

    if (_flexibleDecision == 'achieved') {
       _flexScore = 15;
    } else {
       _flexScore = 0;
    }

    if (_savingsDecision == 'achieved') {
       _saveScore = 10;
    } else {
       _saveScore = 0;
    }

    _calculateLocalDisciplineScore();
  }

  void _calculateLocalDisciplineScore() {
    setState(() {
      _disciplineScore = (_fixedScore + _flexScore + _saveScore).clamp(0.0, 100.0);
      _expenseScore = _disciplineScore; // Sync big score
    });

    // Save to SharedPreferences so Dashboard can read it
    SharedPreferences.getInstance().then((prefs) {
      prefs.setDouble('local_expense_score', _disciplineScore);
    });
  }

  double _calculateCategoryScore(double actual, double min, double max, String type) {
    double basePoints = 0;
    if (type == 'fixed') basePoints = 15;
    if (type == 'flexible') basePoints = 15;
    if (type == 'savings') basePoints = 10;

    double rangePoints = 0;
    if (type == 'fixed' || type == 'flexible') {
      // Goal: Lower is better
      if (actual <= min) {
        rangePoints = 20;
      } else if (actual >= max) {
        rangePoints = 0;
      } else {
        // Linear drop from 20 (at min) to 0 (at max)
        rangePoints = 20 * (1 - (actual - min) / (max - min));
      }
    } else {
      // Goal: Higher is better (Savings)
      if (actual >= max) {
        rangePoints = 20;
      } else if (actual <= min) {
        rangePoints = 0;
      } else {
        // Linear increase from 0 (at min) to 20 (at max)
        rangePoints = 20 * ((actual - min) / (max - min));
      }
    }
    return basePoints + rangePoints;
  }

  Future<void> _handleDecision(String type, String decision) async {
    if (decision == 'missed') {
      setState(() {
        if (type == 'fixed') { _fixedDecision = 'missed'; _fixedScore = 0; }
        if (type == 'flexible') { _flexibleDecision = 'missed'; _flexScore = 0; }
        if (type == 'savings') { _savingsDecision = 'missed'; _saveScore = 0; }
        _calculateLocalDisciplineScore();
      });
      return;
    }

    // If Achieved, show Bottom Sheet for amount
    final controller = TextEditingController();
    String label = "";
    List<double> range = [];
    final cur = _weeks[_currentViewWeekIndex];

    if (type == 'fixed') { label = "Fixed Expenses"; range = cur['range_fixed']; }
    if (type == 'flexible') { label = "Flexible Expenses"; range = cur['range_flex']; }
    if (type == 'savings') { label = "Savings"; range = cur['range_save']; }

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
          _fixedDecision = 'achieved';
          _actualFixed = amt;
          _fixedScore = _calculateCategoryScore(amt, range[0], range[1], 'fixed');
        } else if (type == 'flexible') {
          _flexibleDecision = 'achieved';
          _actualFlex = amt;
          _flexScore = _calculateCategoryScore(amt, range[0], range[1], 'flexible');
        } else if (type == 'savings') {
          _savingsDecision = 'achieved';
          _actualSaved = amt;
          _saveScore = _calculateCategoryScore(amt, range[0], range[1], 'savings');
        }
        _calculateLocalDisciplineScore();
      });
    }
  }

  Future<void> _submitFullWeek() async {
    if (_fixedDecision == null || _flexibleDecision == null || _savingsDecision == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please mark all three targets before submitting.'), backgroundColor: AppColors.danger),
      );
      return;
    }

    final cur = _weeks[_currentViewWeekIndex];
    String overallStatus = (_fixedDecision == 'achieved' && _flexibleDecision == 'achieved' && _savingsDecision == 'achieved') 
        ? 'achieved' 
        : 'missed';

    DateTime now = DateTime.now();
    setState(() => _loading = true);
    try {
      await _api.updateWeeklyStatus(
        weekIndex: cur['index'],
        month: now.month,
        year: now.year,
        status: overallStatus,
        fixedStatus: _fixedDecision,
        flexibleStatus: _flexibleDecision,
        savingsStatus: _savingsDecision,
        spentFixed: _actualFixed,
        spentFlexible: _actualFlex,
        spentSavings: _actualSaved,
      );

      // Streak and XP triggers
      await _streakService.updateStreak();
      await _xpService.rewardWeeklyCheckin();
      await NotificationService().scheduleWeeklyReminders();

      await _loadWeeklyData();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Weekly report submitted!'), backgroundColor: AppColors.success),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.danger),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator(color: AppColors.primary)));

    if (_weeks.isEmpty) return const Scaffold(body: Center(child: Text("Missing Data.")));

    final currentWeek = _weeks[_currentViewWeekIndex];
    final prevWeek = _currentViewWeekIndex > 0 ? _weeks[_currentViewWeekIndex - 1] : null;
    final dateFormat = DateFormat('MMM d');

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: AppBar(
        title: const Text("Weekly Tracker", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
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
            _buildWeekStrip(isDark),
            SizedBox(height: context.hp(3)),

            // --- PREVIOUS WEEK MINI OVERVIEW ---
            if (prevWeek != null && currentWeek['is_current'] && !currentWeek['is_submitted'])
              _buildPreviousWeekMini(prevWeek, isDark),

            SizedBox(height: context.hp(3)),
            
            // --- TARGET RANGE SECTION ---
            Container(
              padding: EdgeInsets.all(context.wp(5)),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkCard : Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.borderLight),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("Week ${currentWeek['index']} Target Ranges", style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  Text("${dateFormat.format(currentWeek['start'])} - ${dateFormat.format(currentWeek['end'])}", style: const TextStyle(fontSize: 12, color: Colors.grey)),
                  const SizedBox(height: 24),
                  
                  _buildDecisionCard("Fixed Expenses", currentWeek['range_fixed'], _fixedDecision, (v) => _handleDecision('fixed', v), currentWeek['is_submitted']),
                  const Divider(height: 32),
                  _buildDecisionCard("Flexible Expenses", currentWeek['range_flex'], _flexibleDecision, (v) => _handleDecision('flexible', v), currentWeek['is_submitted']),
                  const Divider(height: 32),
                  _buildDecisionCard("Savings Goal", currentWeek['range_save'], _savingsDecision, (v) => _handleDecision('savings', v), currentWeek['is_submitted']),
                  
                  const SizedBox(height: 32),

                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: (currentWeek['is_submitted'] || !currentWeek['is_current']) ? null : _submitFullWeek,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: Text(
                        currentWeek['is_submitted'] ? "SUBMITTED" : "SUBMIT WEEKLY REPORT", 
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            _buildObservation(isDark),
            const SizedBox(height: 24),
            _buildOptimizeButton(context),
            const SizedBox(height: 32),
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
        onPressed: () => Navigator.pushNamed(context, '/master_data', arguments: 'expenses'),
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

  Widget _buildPreviousWeekMini(Map<String, dynamic> prev, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withOpacity(0.05) : Colors.grey.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("LAST WEEK OVERVIEW", style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.1)),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _miniStatus("Fixed", prev['fixed_status']),
              _miniStatus("Flexible", prev['flexible_status']),
              _miniStatus("Savings", prev['savings_status']),
            ],
          )
        ],
      ),
    );
  }

  Widget _miniStatus(String label, String? status) {
    Color color = status == 'achieved' ? AppColors.success : (status == 'missed' ? AppColors.danger : Colors.grey);
    return Row(
      children: [
        Container(width: 8, height: 8, decoration: BoxDecoration(shape: BoxShape.circle, color: color)),
        const SizedBox(width: 6),
        Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
      ],
    );
  }

  Widget _buildDecisionCard(String label, List<double> range, String? decision, ValueChanged<String> onSelect, bool submitted) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
            Text("Range: ₹${range[0].round()} - ₹${range[1].round()}", style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            _choiceBtn("Missed", decision == 'missed', AppColors.danger, () => submitted ? null : onSelect('missed')),
            const SizedBox(width: 12),
            _choiceBtn("Achieved", decision == 'achieved', AppColors.success, () => submitted ? null : onSelect('achieved')),
          ],
        )
      ],
    );
  }

  Widget _choiceBtn(String text, bool active, Color color, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: active ? color : color.withOpacity(0.05),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: color.withOpacity(active ? 1 : 0.3)),
          ),
          child: Center(
            child: Text(text, style: TextStyle(color: active ? Colors.white : color, fontWeight: FontWeight.bold, fontSize: 12)),
          ),
        ),
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
              const Text("EXPENSE SCORE", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.primary, letterSpacing: 1.2)),
              const SizedBox(height: 4),
              Text(_expenseScore.toStringAsFixed(0), style: TextStyle(fontSize: context.sp(40), fontWeight: FontWeight.w900, color: AppColors.primary)),
            ],
          ),
          _buildMiniGauge("Discipline", _disciplineScore, AppColors.accent),
          _buildMiniGauge("Hit Rate", 0, Colors.teal, customVal: _targetsHit),
        ],
      ),
    );
  }

  Widget _buildMiniGauge(String label, double val, Color color, {String? customVal}) {
    return Column(
      children: [
        Container(
          width: 44, height: 44,
          alignment: Alignment.center,
          decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: color.withOpacity(0.3), width: 3)),
          child: Text(customVal ?? val.toStringAsFixed(0), style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: color)),
        ),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey)),
      ],
    );
  }

  Widget _buildWeekStrip(bool isDark) {
    final dateFormat = DateFormat('MMM d');
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: List.generate(_weeks.length, (index) {
          final w = _weeks[index];
          bool isSelected = index == _currentViewWeekIndex;
          bool isLocked = w['is_locked'];
          bool isDone = w['is_submitted'];

          return Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: GestureDetector(
              onTap: isLocked ? null : () {
                setState(() {
                  _currentViewWeekIndex = index;
                  _updateViewDecisions();
                });
              },
              child: Opacity(
                opacity: isLocked ? 0.4 : 1.0,
                child: Container(
                  width: 80,
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.primary : (isDark ? AppColors.darkCard : Colors.white),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: isSelected ? AppColors.primary : Colors.grey.withOpacity(0.2)),
                  ),
                  child: Column(
                    children: [
                      Text("Week ${index + 1}", style: TextStyle(fontSize: 9, color: isSelected ? Colors.white70 : Colors.grey)),
                      const SizedBox(height: 4),
                      if (isLocked) const Icon(Icons.lock_outline, size: 14, color: Colors.grey)
                      else if (isDone) const Icon(Icons.check_circle, size: 14, color: AppColors.success)
                      else Text(dateFormat.format(w['start']), style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: isSelected ? Colors.white : null)),
                    ],
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildObservation(bool isDark) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.primary.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 8,
            runSpacing: 8,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.insights_rounded, color: AppColors.primary, size: 18),
                  const SizedBox(width: 8),
                  const Text("Financial Observation", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                ],
              ),
              InkWell(
                onTap: () => AdvisoryService.showAdvisory(context, 'expenses', _expenseScore),
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.auto_awesome, color: AppColors.primary, size: 13),
                      const SizedBox(width: 4),
                      Text(
                        "Expense Advice",
                        style: TextStyle(
                          color: AppColors.primary,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            _disciplineMsg,
            style: TextStyle(color: isDark ? Colors.white70 : Colors.black87, fontSize: 13, height: 1.5),
          ),
          if (_expenseAdvice.isNotEmpty) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.06),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.primary.withOpacity(0.15)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.lightbulb_outline_rounded, color: AppColors.primary, size: 16),
                      const SizedBox(width: 6),
                      Text(
                        "Recommended Expense Action",
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _expenseAdvice,
                    style: TextStyle(
                      fontSize: 12.5,
                      height: 1.4,
                      fontWeight: FontWeight.w500,
                      color: isDark ? Colors.white.withOpacity(0.9) : Colors.black87,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
