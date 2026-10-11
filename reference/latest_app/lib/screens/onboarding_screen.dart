import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../services/api_service.dart';
import '../theme/responsive_utils.dart';
import '../theme/app_theme.dart';
import 'main_screen.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  static const routeName = '/onboarding';

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _api = ApiService();
  int _step = 0;
  bool _submitting = false;
  bool _showErrors = false;

  final _monthlyIncome = TextEditingController();
  final _fixedExpenses = TextEditingController();
  final _flexibleExpenses = TextEditingController();
  final _equityPct = TextEditingController();
  final _debtPct = TextEditingController();
  final _goldPct = TextEditingController();
  final _totalInvestment = TextEditingController();
  final _termCover = TextEditingController();
  final _healthCover = TextEditingController();
  final _emergencyFund = TextEditingController();

  String _investmentHorizon = '< 3 years';

  static const _stepTitles = [
    'Step 1 of 3 • Income & Expenses',
    'Step 2 of 3 • Investments & Assets',
    'Step 3 of 3 • Protection',
  ];

  static const _horizonOptions = ['< 3 years', '3-7 years', '> 7 years'];

  @override
  void dispose() {
    _monthlyIncome.dispose();
    _fixedExpenses.dispose();
    _flexibleExpenses.dispose();
    _equityPct.dispose();
    _debtPct.dispose();
    _goldPct.dispose();
    _totalInvestment.dispose();
    _termCover.dispose();
    _healthCover.dispose();
    _emergencyFund.dispose();
    super.dispose();
  }

  double? _parseNum(TextEditingController c) {
    final t = c.text.trim().replaceAll(',', '');
    if (t.isEmpty) return null;
    return double.tryParse(t);
  }

  bool _isEmpty(TextEditingController c) => c.text.trim().isEmpty;

  InputDecoration _fieldDecoration({
    required String label,
    required bool hasError,
    String? hint,
  }) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
      prefixText: '₹ ',
      errorText: hasError ? 'Required' : null,
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(
          color: hasError ? Colors.red : Colors.grey.shade300,
          width: hasError ? 2 : 1,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(
          color: hasError ? Colors.red : AppColors.secondary,
          width: 2,
        ),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Colors.red, width: 2),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Colors.red, width: 2),
      ),
    );
  }

  InputDecoration _pctDecoration(String label, bool hasError) {
    return InputDecoration(
      labelText: label,
      suffixText: '%',
      errorText: hasError ? 'Required' : null,
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(
          color: hasError ? Colors.red : Colors.grey.shade300,
          width: hasError ? 2 : 1,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(
          color: hasError ? Colors.red : AppColors.secondary,
          width: 2,
        ),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Colors.red, width: 2),
      ),
    );
  }

  bool _validateStep(int step) {
    switch (step) {
      case 0:
        return !_isEmpty(_monthlyIncome) &&
            !_isEmpty(_fixedExpenses) &&
            !_isEmpty(_flexibleExpenses) &&
            _parseNum(_monthlyIncome) != null &&
            _parseNum(_fixedExpenses) != null &&
            _parseNum(_flexibleExpenses) != null;
      case 1:
        return !_isEmpty(_equityPct) &&
            !_isEmpty(_debtPct) &&
            !_isEmpty(_goldPct) &&
            !_isEmpty(_totalInvestment) &&
            _parseNum(_equityPct) != null &&
            _parseNum(_debtPct) != null &&
            _parseNum(_goldPct) != null &&
            _parseNum(_totalInvestment) != null;
      case 2:
        return !_isEmpty(_termCover) &&
            !_isEmpty(_healthCover) &&
            !_isEmpty(_emergencyFund) &&
            _parseNum(_termCover) != null &&
            _parseNum(_healthCover) != null &&
            _parseNum(_emergencyFund) != null;
      default:
        return false;
    }
  }

  void _next() {
    setState(() => _showErrors = true);
    if (!_validateStep(_step)) return;
    setState(() {
      _step++;
      _showErrors = false;
    });
  }

  void _back() {
    setState(() {
      _step--;
      _showErrors = false;
    });
  }

  double _yoyFromHorizon() {
    switch (_investmentHorizon) {
      case '3-7 years':
        return 0.08;
      case '> 7 years':
        return 0.10;
      default:
        return 0.05;
    }
  }

  String _currentMonthLabel() {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return months[DateTime.now().month - 1];
  }

  Future<void> _submit() async {
    setState(() => _showErrors = true);
    if (!_validateStep(2)) return;

    setState(() => _submitting = true);

    try {
      final fixed = _parseNum(_fixedExpenses)!;
      final flexible = _parseNum(_flexibleExpenses)!;

      await _api.submitOnboarding({
        'monthly_income': _parseNum(_monthlyIncome),
        'monthly_expenses': fixed + flexible,
        'equity_pct': _parseNum(_equityPct),
        'gold_pct': _parseNum(_goldPct),
        'debt_pct': _parseNum(_debtPct),
        'term_cover': _parseNum(_termCover),
        'health_cover': _parseNum(_healthCover),
        'liquidity_fund': _parseNum(_emergencyFund),
        'income_type': 'salaried',
        'stability_months': 12,
        'yoy_growth_pct': _yoyFromHorizon(),
        'source_count': 1,
        'year': DateTime.now().year,
        'month': _currentMonthLabel(),
      });

      if (!mounted) return;
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const MainScreen()),
        (_) => false,
      );
    } catch (e) {
      if (!mounted) return;
      final message = e is ApiException ? e.message : 'Could not save your profile. Please try again.';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: Colors.red.shade700,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Widget _allocationBar() {
    final equity = (_parseNum(_equityPct) ?? 0).clamp(0, 100);
    final debt = (_parseNum(_debtPct) ?? 0).clamp(0, 100);
    final gold = (_parseNum(_goldPct) ?? 0).clamp(0, 100);
    final total = equity + debt + gold;

    if (total <= 0) {
      return Container(
        height: 12,
        decoration: BoxDecoration(
          color: Colors.grey.shade200,
          borderRadius: BorderRadius.circular(8),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: SizedBox(
            height: 16,
            child: Row(
              children: [
                if (equity > 0)
                  Expanded(
                    flex: (equity * 10).round().clamp(1, 1000),
                    child: Container(color: AppColors.secondary),
                  ),
                if (debt > 0)
                  Expanded(
                    flex: (debt * 10).round().clamp(1, 1000),
                    child: Container(color: Colors.blue.shade600),
                  ),
                if (gold > 0)
                  Expanded(
                    flex: (gold * 10).round().clamp(1, 1000),
                    child: Container(color: AppColors.accent),
                  ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            _legendDot(AppColors.secondary, 'Equity'),
            const SizedBox(width: 12),
            _legendDot(Colors.blue.shade600, 'Debt'),
            const SizedBox(width: 12),
            _legendDot(AppColors.accent, 'Gold'),
          ],
        ),
      ],
    );
  }

  Widget _legendDot(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 4),
        Text(label, style: TextStyle(fontSize: 12, color: Colors.grey.shade700)),
      ],
    );
  }

  Widget _stepContent() {
    switch (_step) {
      case 0:
        return _buildStep1();
      case 1:
        return _buildStep2();
      default:
        return _buildStep3();
    }
  }

  Widget _buildStep1() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextField(
          controller: _monthlyIncome,
          keyboardType: TextInputType.number,
          inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[\d.,]'))],
          decoration: _fieldDecoration(
            label: 'Monthly Income',
            hasError: _showErrors && _isEmpty(_monthlyIncome),
          ),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _fixedExpenses,
          keyboardType: TextInputType.number,
          inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[\d.,]'))],
          decoration: _fieldDecoration(
            label: 'Monthly Fixed Expenses',
            hasError: _showErrors && _isEmpty(_fixedExpenses),
            hint: 'Rent, EMIs, utilities',
          ),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _flexibleExpenses,
          keyboardType: TextInputType.number,
          inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[\d.,]'))],
          decoration: _fieldDecoration(
            label: 'Monthly Flexible Expenses',
            hasError: _showErrors && _isEmpty(_flexibleExpenses),
            hint: 'Food, travel, shopping',
          ),
        ),
      ],
    );
  }

  Widget _buildStep2() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextField(
          controller: _equityPct,
          keyboardType: TextInputType.number,
          inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[\d.]'))],
          onChanged: (_) => setState(() {}),
          decoration: _pctDecoration(
            'Equity %',
            _showErrors && _isEmpty(_equityPct),
          ),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _debtPct,
          keyboardType: TextInputType.number,
          inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[\d.]'))],
          onChanged: (_) => setState(() {}),
          decoration: _pctDecoration(
            'Debt %',
            _showErrors && _isEmpty(_debtPct),
          ),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _goldPct,
          keyboardType: TextInputType.number,
          inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[\d.]'))],
          onChanged: (_) => setState(() {}),
          decoration: _pctDecoration(
            'Gold %',
            _showErrors && _isEmpty(_goldPct),
          ),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _totalInvestment,
          keyboardType: TextInputType.number,
          inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[\d.,]'))],
          decoration: _fieldDecoration(
            label: 'Total Investment Amount',
            hasError: _showErrors && _isEmpty(_totalInvestment),
          ),
        ),
        const SizedBox(height: 20),
        Text(
          'Allocation split',
          style: TextStyle(
            fontWeight: FontWeight.w600,
            color: Colors.grey.shade800,
          ),
        ),
        const SizedBox(height: 8),
        _allocationBar(),
      ],
    );
  }

  Widget _buildStep3() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextField(
          controller: _termCover,
          keyboardType: TextInputType.number,
          inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[\d.,]'))],
          decoration: _fieldDecoration(
            label: 'Term Insurance Cover',
            hasError: _showErrors && _isEmpty(_termCover),
          ),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _healthCover,
          keyboardType: TextInputType.number,
          inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[\d.,]'))],
          decoration: _fieldDecoration(
            label: 'Health Insurance Cover',
            hasError: _showErrors && _isEmpty(_healthCover),
          ),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _emergencyFund,
          keyboardType: TextInputType.number,
          inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[\d.,]'))],
          decoration: _fieldDecoration(
            label: 'Emergency Fund Available',
            hasError: _showErrors && _isEmpty(_emergencyFund),
          ),
        ),
        const SizedBox(height: 16),
        DropdownButtonFormField<String>(
          value: _investmentHorizon,
          decoration: const InputDecoration(
            labelText: 'Investment Horizon',
            prefixIcon: Icon(Icons.timeline_outlined),
          ),
          items: _horizonOptions
              .map((h) => DropdownMenuItem(value: h, child: Text(h)))
              .toList(),
          onChanged: _submitting
              ? null
              : (value) {
                  if (value != null) setState(() => _investmentHorizon = value);
                },
        ),
      ],
    );
  }

  Widget _buildActions() {
    if (_step == 0) {
      return SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          onPressed: _submitting ? null : _next,
          child: const Text('Next →'),
        ),
      );
    }
    if (_step == 1) {
      return Row(
        children: [
          Expanded(
            child: OutlinedButton(
              onPressed: _submitting ? null : _back,
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primary,
                side: const BorderSide(color: AppColors.primary),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('← Back'),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: ElevatedButton(
              onPressed: _submitting ? null : _next,
              child: const Text('Next →'),
            ),
          ),
        ],
      );
    }
    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: _submitting ? null : _back,
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.primary,
              side: const BorderSide(color: AppColors.primary),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('← Back'),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: ElevatedButton(
            onPressed: _submitting ? null : _submit,
            child: const Text('Submit'),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final progress = (_step + 1) / 3;

    return Stack(
      children: [
        Scaffold(
          backgroundColor: AppColors.background,
          body: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                padding: EdgeInsets.fromLTRB(
                  context.wp(5),
                  MediaQuery.of(context).padding.top + context.hp(1.5),
                  context.wp(5),
                  context.hp(2.5),
                ),
                decoration: const BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(24),
                    bottomRight: Radius.circular(24),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Financial Profile',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _stepTitles[_step],
                      style: const TextStyle(color: Colors.white70, fontSize: 14),
                    ),
                    const SizedBox(height: 16),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: progress,
                        minHeight: 6,
                        backgroundColor: Colors.white.withValues(alpha: 0.24),
                        valueColor: const AlwaysStoppedAnimation<Color>(AppColors.accent),
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: EdgeInsets.fromLTRB(context.wp(5), context.hp(2.5), context.wp(5), context.hp(3)),
                  child: Card(
                    elevation: 3,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    child: Padding(
                      padding: EdgeInsets.all(context.wp(5)),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          _stepContent(),
                          const SizedBox(height: 24),
                          _buildActions(),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        if (_submitting)
          const ColoredBox(
            color: Colors.black26,
            child: Center(child: CircularProgressIndicator()),
          ),
      ],
    );
  }
}
