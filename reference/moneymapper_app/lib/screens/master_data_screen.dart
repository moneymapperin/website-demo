import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../services/streak_service.dart';
import '../services/xp_service.dart';
import '../services/notification_service.dart';
import '../theme/app_theme.dart';

class MasterDataScreen extends StatefulWidget {
  const MasterDataScreen({super.key});

  @override
  State<MasterDataScreen> createState() => _MasterDataScreenState();
}

class _MasterDataScreenState extends State<MasterDataScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _loading = true;
  bool _saving = false;
  bool _didScrollToTarget = false;
  bool _isAutoScrolling = false;

  final _identityKey = GlobalKey();
  final _incomeKey = GlobalKey();
  final _expensesKey = GlobalKey();
  final _emergencyKey = GlobalKey();
  final _insuranceKey = GlobalKey();
  final _investmentsKey = GlobalKey();

  // --- CONTROLLERS & STATES FOR 52 FIELDS ---

  // Category 1: Basic Identity (14 fields)
  final _fullNameController = TextEditingController();
  final _mobileController = TextEditingController();
  final _emailController = TextEditingController();
  final _dobController = TextEditingController();
  String? _gender;
  String? _city;
  final _otherCityController = TextEditingController();
  String? _state;
  String? _employmentType;
  final _dependentsController = TextEditingController();
  String? _maritalStatus;
  final _panController = TextEditingController();
  final _employerController = TextEditingController();
  final _departmentController = TextEditingController();
  final _designationController = TextEditingController();

  // Category 2: Income Pillar (7 fields)
  final _monthlyActiveIncomeController = TextEditingController(text: '0');
  String? _incomeFrequency;
  String? _cityTier;
  bool _hasPassiveIncome = false;
  final _passiveIncomeAmountController = TextEditingController(text: '0');
  String? _passiveIncomeSource;
  final _salaryBreakupController = TextEditingController();

  // Category 3: Expenses Pillar (7 fields)
  final _monthlyFixedExpensesController = TextEditingController(text: '0');
  final _monthlyVariableExpensesController = TextEditingController(text: '0');
  final _totalEmiController = TextEditingController(text: '0');
  final _activeLoansController = TextEditingController(text: '0');
  final _monthlySavingsController = TextEditingController(text: '0');
  final _loanDetailsController = TextEditingController();
  final _expenseCategoryBreakdownController = TextEditingController();

  // Category 4: Emergency Fund Pillar (3 fields)
  bool _hasEmergencyFund = false;
  final _emergencyFundCurrentController = TextEditingController(text: '0');
  String? _emergencyFundParked;

  // Category 5: Insurance Pillar (12 fields)
  bool _hasHealthInsurance = false;
  final _healthCoverController = TextEditingController(text: '0');
  bool _isFamilyCovered = false;
  bool _hasLifeInsurance = false;
  final _lifeCoverController = TextEditingController(text: '0');
  bool _hasTermPlan = false;
  final _termCoverController = TextEditingController(text: '0');
  final _insurerNameController = TextEditingController();
  final _policyNumberController = TextEditingController();
  final _policyExpiryController = TextEditingController();
  bool _hasCriticalIllness = false;
  bool _hasAccidentalCover = false;

  // Category 6: Investment Pillar (12 fields)
  bool _doesInvest = false;
  final _totalEquityInvestmentsController = TextEditingController(text: '0');
  final _totalDebtInvestmentsController = TextEditingController(text: '0');
  final _totalGoldInvestmentsController = TextEditingController(text: '0');
  final _totalRealEstateInvestmentsController = TextEditingController(text: '0');

  // Dynamic SIP Lists
  List<Map<String, dynamic>> _stockSips = [];
  List<Map<String, dynamic>> _mfSips = [];
  List<Map<String, dynamic>> _goldSips = [];

  String? _riskAppetite;
  String? _primaryInvestmentGoal;
  final _existingPortfolioController = TextEditingController();
  double _equityExposurePct = 0.0;

  bool _userConsent = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 6, vsync: this);
    _tabController.addListener(_handleTabSelection);
    _loadData();
  }

  void _handleTabSelection() {
    if (_tabController.indexIsChanging && !_isAutoScrolling) {
      _scrollToSectionIndex(_tabController.index);
    }
  }

  void _scrollToSectionIndex(int index) {
    String target = 'identity';
    if (index == 0) target = 'identity';
    else if (index == 1) target = 'income';
    else if (index == 2) target = 'expenses';
    else if (index == 3) target = 'emergency';
    else if (index == 4) target = 'insurance';
    else if (index == 5) target = 'investment';
    _scrollToSection(target);
  }

  @override
  void dispose() {
    _tabController.removeListener(_handleTabSelection);
    _tabController.dispose();
    
    // Dispose Category 1
    _fullNameController.dispose();
    _mobileController.dispose();
    _emailController.dispose();
    _dobController.dispose();
    _dependentsController.dispose();
    _panController.dispose();
    _employerController.dispose();
    _otherCityController.dispose();
    _departmentController.dispose();
    _designationController.dispose();

    // Dispose Category 2
    _monthlyActiveIncomeController.dispose();
    _passiveIncomeAmountController.dispose();
    _salaryBreakupController.dispose();

    // Dispose Category 3
    _monthlyFixedExpensesController.dispose();
    _monthlyVariableExpensesController.dispose();
    _totalEmiController.dispose();
    _activeLoansController.dispose();
    _monthlySavingsController.dispose();
    _loanDetailsController.dispose();
    _expenseCategoryBreakdownController.dispose();

    // Dispose Category 4
    _emergencyFundCurrentController.dispose();

    // Dispose Category 5
    _healthCoverController.dispose();
    _lifeCoverController.dispose();
    _termCoverController.dispose();
    _insurerNameController.dispose();
    _policyNumberController.dispose();
    _policyExpiryController.dispose();

    // Dispose Category 6
    _totalEquityInvestmentsController.dispose();
    _totalDebtInvestmentsController.dispose();
    _totalGoldInvestmentsController.dispose();
    _totalRealEstateInvestmentsController.dispose();
    _existingPortfolioController.dispose();

    super.dispose();
  }

  // --- POPULATION & MAPPING ---

  void _populateFields(Map<String, dynamic> data) {
    _userConsent = data['consent_given'] == true;
    // Category 1
    _fullNameController.text = data['fullName']?.toString() ?? '';
    _mobileController.text = data['mobile']?.toString() ?? '';
    _emailController.text = data['email']?.toString() ?? '';
    _dobController.text = data['dob']?.toString() ?? '';
    _gender = data['gender']?.toString();
    _state = data['state']?.toString();
    _city = data['city']?.toString();

    if (_state != null && _city != null) {
      // Normalize case (e.g. 'rewa' -> 'Rewa')
      final normalizedCity = _city!.trim();
      final cityList = _stateCityMap[_state];

      if (cityList != null) {
        // Find if city exists in list (case-insensitive)
        final match = cityList.firstWhere(
          (c) => c.toLowerCase() == normalizedCity.toLowerCase(),
          orElse: () => '',
        );

        if (match.isNotEmpty) {
          _city = match; // Use the exact string from our list
        } else {
          _otherCityController.text = _city!;
          _city = 'Other';
        }
      }
    }
    _employmentType = data['employmentType']?.toString();
    _dependentsController.text = data['dependents']?.toString() ?? '';
    _maritalStatus = data['maritalStatus']?.toString();
    _panController.text = data['pan']?.toString() ?? '';
    _employerController.text = data['employer']?.toString() ?? '';
    _departmentController.text = data['department']?.toString() ?? '';
    _designationController.text = data['designation']?.toString() ?? '';

    // Category 2
    _monthlyActiveIncomeController.text = data['monthlyActiveIncome']?.toString() ?? '0';
    _incomeFrequency = data['incomeFrequency']?.toString();
    _cityTier = data['cityTier']?.toString();
    _hasPassiveIncome = data['hasPassiveIncome'] == true;
    _passiveIncomeAmountController.text = data['passiveIncomeAmount']?.toString() ?? '0';
    _passiveIncomeSource = data['passiveIncomeSource']?.toString();
    _salaryBreakupController.text = data['salaryBreakup']?.toString() ?? '';

    // Category 3
    _monthlyFixedExpensesController.text = data['monthlyFixedExpenses']?.toString() ?? '0';
    _monthlyVariableExpensesController.text = data['monthlyVariableExpenses']?.toString() ?? '0';
    _totalEmiController.text = data['totalEmi']?.toString() ?? '0';
    _activeLoansController.text = data['activeLoans']?.toString() ?? '0';
    _monthlySavingsController.text = data['monthlySavings']?.toString() ?? '0';
    _loanDetailsController.text = data['loanDetails']?.toString() ?? '';
    _expenseCategoryBreakdownController.text = data['expenseCategoryBreakdown']?.toString() ?? '';

    // Category 4
    _hasEmergencyFund = data['hasEmergencyFund'] == true;
    _emergencyFundCurrentController.text = data['emergencyFundCurrent']?.toString() ?? '0';
    _emergencyFundParked = data['emergencyFundParked']?.toString();

    // Category 5
    _hasHealthInsurance = data['hasHealthInsurance'] == true;
    _healthCoverController.text = data['healthCover']?.toString() ?? '0';
    _isFamilyCovered = data['isFamilyCovered'] == true;
    _hasLifeInsurance = data['hasLifeInsurance'] == true;
    _lifeCoverController.text = data['lifeCover']?.toString() ?? '0';
    _hasTermPlan = data['hasTermPlan'] == true;
    _termCoverController.text = data['termCover']?.toString() ?? '0';
    _insurerNameController.text = data['insurerName']?.toString() ?? '';
    _policyNumberController.text = data['policyNumber']?.toString() ?? '';
    _policyExpiryController.text = data['policyExpiry']?.toString() ?? '';
    _hasCriticalIllness = data['hasCriticalIllness'] == true;
    _hasAccidentalCover = data['hasAccidentalCover'] == true;

    // Category 6
    _doesInvest = data['doesInvest'] == true;
    _totalEquityInvestmentsController.text = data['totalEquityInvestments']?.toString() ?? '0';
    _totalDebtInvestmentsController.text = data['totalDebtInvestments']?.toString() ?? '0';
    _totalGoldInvestmentsController.text = data['totalGoldInvestments']?.toString() ?? '0';
    _totalRealEstateInvestmentsController.text = data['totalRealEstateInvestments']?.toString() ?? '0';

    // Populate Dynamic SIPs
    if (data['stockSips'] != null) _stockSips = List<Map<String, dynamic>>.from(data['stockSips']);
    if (data['mfSips'] != null) _mfSips = List<Map<String, dynamic>>.from(data['mfSips']);
    if (data['goldSips'] != null) _goldSips = List<Map<String, dynamic>>.from(data['goldSips']);

    _riskAppetite = data['riskAppetite']?.toString();
    _primaryInvestmentGoal = data['primaryInvestmentGoal']?.toString();
    _existingPortfolioController.text = data['existingPortfolio']?.toString() ?? '';
    _equityExposurePct = double.tryParse(data['equityExposurePct']?.toString() ?? '0.0') ?? 0.0;
  }

  Map<String, dynamic> _buildDataMap() {
    return {
      'consent_given': _userConsent,
      'consent_timestamp': DateTime.now().toIso8601String(),
      // Category 1
      'fullName': _fullNameController.text,
      'mobile': _mobileController.text,
      'email': _emailController.text,
      'dob': _dobController.text,
      'gender': _gender,
      'city': _city == 'Other' ? _otherCityController.text : _city,
      'state': _state,
      'employmentType': _employmentType,
      'dependents': _dependentsController.text,
      'maritalStatus': _maritalStatus,
      'pan': _panController.text,
      'employer': _employerController.text,
      'department': _departmentController.text,
      'designation': _designationController.text,

      // Category 2
      'monthlyActiveIncome': _monthlyActiveIncomeController.text,
      'incomeFrequency': _incomeFrequency,
      'cityTier': _cityTier,
      'hasPassiveIncome': _hasPassiveIncome,
      'passiveIncomeAmount': _passiveIncomeAmountController.text,
      'passiveIncomeSource': _passiveIncomeSource,
      'salaryBreakup': _salaryBreakupController.text,

      // Category 3
      'monthlyFixedExpenses': _monthlyFixedExpensesController.text,
      'monthlyVariableExpenses': _monthlyVariableExpensesController.text,
      'totalEmi': _totalEmiController.text,
      'activeLoans': _activeLoansController.text,
      'monthlySavings': _monthlySavingsController.text,
      'loanDetails': _loanDetailsController.text,
      'expenseCategoryBreakdown': _expenseCategoryBreakdownController.text,

      // Category 4
      'hasEmergencyFund': _hasEmergencyFund,
      'emergencyFundCurrent': _emergencyFundCurrentController.text,
      'emergencyFundParked': _emergencyFundParked,

      // Category 5
      'hasHealthInsurance': _hasHealthInsurance,
      'healthCover': _healthCoverController.text,
      'isFamilyCovered': _isFamilyCovered,
      'hasLifeInsurance': _hasLifeInsurance,
      'lifeCover': _lifeCoverController.text,
      'hasTermPlan': _hasTermPlan,
      'termCover': _termCoverController.text,
      'insurerName': _insurerNameController.text,
      'policyNumber': _policyNumberController.text,
      'policyExpiry': _policyExpiryController.text,
      'hasCriticalIllness': _hasCriticalIllness,
      'hasAccidentalCover': _hasAccidentalCover,

      // Category 6
      'doesInvest': _doesInvest,
      'totalEquityInvestments': _totalEquityInvestmentsController.text,
      'totalDebtInvestments': _totalDebtInvestmentsController.text,
      'totalGoldInvestments': _totalGoldInvestmentsController.text,
      'totalRealEstateInvestments': _totalRealEstateInvestmentsController.text,

      // Dynamic Lists
      'stockSips': _stockSips,
      'mfSips': _mfSips,
      'goldSips': _goldSips,

      // Backward Compatibility Sums
      'monthlySipEquity': _calculateSipTotal(_stockSips).toString(),
      'monthlySipDebt': _calculateSipTotal(_mfSips).toString(),
      'monthlySipGold': _calculateSipTotal(_goldSips).toString(),

      'riskAppetite': _riskAppetite,
      'primaryInvestmentGoal': _primaryInvestmentGoal,
      'existingPortfolio': _existingPortfolioController.text,
      'equityExposurePct': _equityExposurePct.toString(),
    };
  }

  // --- DATA SYNC PERSISTENCE FLOW ---

  Future<void> _loadData() async {
    try {
      final res = await ApiService().getMasterProfile();
      if (res['data'] != null && res['data'] is Map && (res['data'] as Map).isNotEmpty) {
        final dataMap = Map<String, dynamic>.from(res['data'] as Map);
        _populateFields(dataMap);
        await _runAutoSipLogic(dataMap); // Process auto-increments
        setState(() => _loading = false);
        return;
      }
    } catch (e) {
      debugPrint("API master profile fetch failed, checking local backup: $e");
    }

    // Fallback: If no master profile exists, pre-fill from Supabase Auth metadata
    final name = await AuthService().getUserName();
    final email = await AuthService().getUserEmail();
    
    // We can also try to get the mobile from metadata if stored
    final user = Supabase.instance.client.auth.currentUser;
    final mobile = user?.userMetadata?['mobile']?.toString() ?? '';

    if (name != null || email != null) {
      _fullNameController.text = name ?? '';
      _emailController.text = email ?? '';
      _mobileController.text = mobile;
    }

    // Local SharedPreferences Fallback
    final localJson = await AuthService().getMasterProfileLocally();
    if (localJson != null) {
      try {
        final Map<String, dynamic> data = jsonDecode(localJson);
        _populateFields(data);
      } catch (e) {
        debugPrint("Error parsing local profile data: $e");
      }
    }
    setState(() => _loading = false);
  }

  Future<void> _saveData() async {
    setState(() => _saving = true);

    try {
      // --- MANDATORY VALIDATION CHECKS ---

      // 1. Consent Check
      if (!_userConsent) {
        _showValidationError("Please provide your consent to process data for financial insights.");
        return;
      }

      // 2. Identity Basics
      if (_fullNameController.text.trim().isEmpty ||
          _dobController.text.trim().isEmpty ||
          _gender == null ||
          _state == null ||
          (_city == null || (_city == 'Other' && _otherCityController.text.trim().isEmpty))) {
        _showValidationError("Basic Identity (Name, DOB, Gender, State, City) is mandatory.");
        return;
      }

      // 3. Employment
      if (_employmentType == null || _employerController.text.trim().isEmpty) {
        _showValidationError("Employment Type and Employer Name are mandatory.");
        return;
      }

      // 4. Income Essentials
      if (_monthlyActiveIncomeController.text.trim().isEmpty || _incomeFrequency == null) {
        _showValidationError("Monthly Active Income and Frequency are mandatory.");
        return;
      }

      // 5. Expense Essentials
      if (_monthlyFixedExpensesController.text.trim().isEmpty ||
          _monthlyVariableExpensesController.text.trim().isEmpty ||
          _monthlySavingsController.text.trim().isEmpty) {
        _showValidationError("Fixed Expenses, Variable Expenses, and monthly Savings are mandatory.");
        return;
      }

      // 6. Investment Essentials
      if (_doesInvest) {
        if (_totalEquityInvestmentsController.text.trim().isEmpty ||
            _totalDebtInvestmentsController.text.trim().isEmpty ||
            _totalGoldInvestmentsController.text.trim().isEmpty ||
            _totalRealEstateInvestmentsController.text.trim().isEmpty ||
            _riskAppetite == null) {
          _showValidationError("Please fill all mandatory investment fields (Totals and Risk Appetite).");
          return;
        }
      }
    } catch (e) {
      _showValidationError("Validation failed. Please check your inputs.");
      return;
    }
    final Map<String, dynamic> data = _buildDataMap();
    final jsonStr = jsonEncode(data);

    // Save to SharedPreferences local persistence first
    await AuthService().saveMasterProfileLocally(jsonStr);

    // Trigger streak update on master data save
    await StreakService().updateStreak();

    // Reward XP for profile completion
    await XpService().rewardProfileCompletion();

    // Reset Weekly Reminders Timer
    await NotificationService().scheduleWeeklyReminders();

    // Sync with remote database
    try {
      await ApiService().updateMasterProfile(data);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile synced successfully!'), backgroundColor: AppColors.success),
        );
        Navigator.pop(context, true); // Return true to indicate data changed
      }
    } catch (e) {
      debugPrint("Profile sync failed: $e");
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e is ApiException ? e.message : 'Sync failed. Please try again.'), backgroundColor: AppColors.danger),
        );
      }
    }
    if (mounted) {
      setState(() => _saving = false);
    }
  }

  void _showValidationError(String message) {
    setState(() => _saving = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.danger,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  // --- WIDGET RENDER BUILDERS ---

  Widget _buildSectionHeader(String title, IconData icon, bool isDark, {Key? key}) {
    return Padding(
      key: key,
      padding: const EdgeInsets.only(left: 4, bottom: 12),
      child: Row(
        children: [
          Icon(icon, color: AppColors.primary, size: 22),
          const SizedBox(width: 10),
          Text(
            title,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w900,
              color: isDark ? Colors.white : AppColors.textPrimaryLight,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionCard(List<Widget> children) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: children,
        ),
      ),
    );
  }

  void _scrollToSection(String target) {
    GlobalKey? targetKey;
    int tabIndex = 0;
    if (target == 'identity') {
      targetKey = _identityKey;
      tabIndex = 0;
    } else if (target == 'income') {
      targetKey = _incomeKey;
      tabIndex = 1;
    } else if (target == 'expenses') {
      targetKey = _expensesKey;
      tabIndex = 2;
    } else if (target == 'emergency' || target == 'savings') {
      targetKey = _emergencyKey;
      tabIndex = 3;
    } else if (target == 'insurance' || target == 'protection') {
      targetKey = _insuranceKey;
      tabIndex = 4;
    } else if (target == 'investment') {
      targetKey = _investmentsKey;
      tabIndex = 5;
    }

    if (_tabController.index != tabIndex) {
      _isAutoScrolling = true;
      _tabController.animateTo(tabIndex);
      Future.delayed(const Duration(milliseconds: 650), () {
        _isAutoScrolling = false;
      });
    }

    if (targetKey != null && targetKey.currentContext != null) {
      Scrollable.ensureVisible(
        targetKey.currentContext!,
        duration: const Duration(milliseconds: 600),
        curve: Curves.easeInOutCubic,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Check for navigation target argument once loaded
    if (!_loading && !_didScrollToTarget) {
      final target = ModalRoute.of(context)?.settings.arguments as String?;
      if (target != null) {
        _didScrollToTarget = true;
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _scrollToSection(target);
        });
      }
    }

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: AppBar(
        title: const Text('My Profile', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        actions: [
          if (!_loading)
            _saving
                ? const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16.0),
                    child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)),
                  )
                : IconButton(
                    icon: const Icon(Icons.check_rounded, size: 24),
                    onPressed: _saveData,
                  ),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: AppColors.secondary,
          indicatorWeight: 3.0,
          tabs: const [
            Tab(icon: Icon(Icons.person_rounded), text: 'Identity'),
            Tab(icon: Icon(Icons.payments_rounded), text: 'Income'),
            Tab(icon: Icon(Icons.shopping_bag_rounded), text: 'Expenses'),
            Tab(icon: Icon(Icons.security_rounded), text: 'Emergency'),
            Tab(icon: Icon(Icons.verified_user_rounded), text: 'Insurance'),
            Tab(icon: Icon(Icons.trending_up_rounded), text: 'Investments'),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _buildSectionHeader('1. Basic Identity', Icons.person_rounded, isDark, key: _identityKey),
                  _buildSectionCard(_buildIdentityFields(isDark)),
                  const SizedBox(height: 24),

                  _buildSectionHeader('2. Income Pillar', Icons.payments_rounded, isDark, key: _incomeKey),
                  _buildSectionCard(_buildIncomeFields(isDark)),
                  const SizedBox(height: 24),

                  _buildSectionHeader('3. Expenses Pillar', Icons.shopping_bag_rounded, isDark, key: _expensesKey),
                  _buildSectionCard(_buildExpensesFields(isDark)),
                  const SizedBox(height: 24),

                  _buildSectionHeader('4. Emergency Fund', Icons.security_rounded, isDark, key: _emergencyKey),
                  _buildSectionCard(_buildEmergencyFields(isDark)),
                  const SizedBox(height: 24),

                  _buildSectionHeader('5. Insurance Protection', Icons.verified_user_rounded, isDark, key: _insuranceKey),
                  _buildSectionCard(_buildInsuranceFields(isDark)),
                  const SizedBox(height: 24),

                  _buildSectionHeader('6. Investment & Growth', Icons.trending_up_rounded, isDark, key: _investmentsKey),
                  _buildSectionCard(_buildInvestmentsFields(isDark)),
                  const SizedBox(height: 24),

                  // --- DATA CONSENT SECTION ---
                  Material(
                    color: isDark ? AppColors.darkCard : Colors.white,
                    clipBehavior: Clip.antiAlias,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: BorderSide(color: _userConsent ? AppColors.success : Colors.grey.withOpacity(0.3)),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: CheckboxListTile(
                        value: _userConsent,
                        onChanged: (val) => setState(() => _userConsent = val ?? false),
                        activeColor: AppColors.primary,
                        title: const Text(
                          'Data Processing Consent',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                        ),
                        subtitle: const Text(
                          'I agree to share and process my data for providing personalized financial insights and statistics. I understand I can opt-out by sending a formal email to remove my data.',
                          style: TextStyle(fontSize: 11),
                        ),
                        controlAffinity: ListTileControlAffinity.leading,
                        contentPadding: EdgeInsets.zero,
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    onPressed: _saving ? null : _saveData,
                    icon: const Icon(Icons.save_rounded, color: Colors.white),
                    label: const Text(
                      'Save My Profile',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
    );
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().subtract(const Duration(days: 365 * 25)),
      firstDate: DateTime(1950),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: Theme.of(context).brightness == Brightness.dark
                ? const ColorScheme.dark(
                    primary: AppColors.primary,
                    onPrimary: Colors.white,
                    surface: AppColors.darkCard,
                    onSurface: Colors.white,
                  )
                : const ColorScheme.light(
                    primary: AppColors.primary,
                    onPrimary: Colors.white,
                    onSurface: Colors.black,
                  ),
            dialogBackgroundColor: Theme.of(context).brightness == Brightness.dark
                ? AppColors.darkBackground
                : Colors.white,
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        _dobController.text = "${picked.day.toString().padLeft(2, '0')}-${picked.month.toString().padLeft(2, '0')}-${picked.year}";
      });
    }
  }

  final Map<String, List<String>> _stateCityMap = {
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati'],
    'Arunachal Pradesh': ['Itanagar', 'Tawang', 'Ziro'],
    'Assam': ['Guwahati', 'Dibrugarh', 'Silchar', 'Jorhat'],
    'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia'],
    'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba'],
    'Goa': ['Panaji', 'Margao', 'Vasco da Gama'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'],
    'Haryana': ['Faridabad', 'Gurugram', 'Panipat', 'Ambala', 'Hisar'],
    'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan'],
    'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro'],
    'Karnataka': ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi'],
    'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur'],
    'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Rewa'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad'],
    'Manipur': ['Imphal'],
    'Meghalaya': ['Shillong'],
    'Mizoram': ['Aizawl'],
    'Nagaland': ['Kohima', 'Dimapur'],
    'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Sambalpur'],
    'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur'],
    'Sikkim': ['Gangtok'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam'],
    'Tripura': ['Agartala'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Noida'],
    'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani'],
    'West Bengal': ['Kolkata', 'Asansol', 'Siliguri', 'Durgapur', 'Howrah'],
    'Delhi': ['New Delhi', 'Delhi Cantt', 'Dwarka', 'Rohini'],
  };

  List<Widget> _buildIdentityFields(bool isDark) {
    return [
      _buildTextField('Full Name', _fullNameController, Icons.person_outline),
      _buildTextField('Mobile Number', _mobileController, Icons.phone_android_outlined, keyboardType: TextInputType.phone),
      _buildTextField('Email Address', _emailController, Icons.email_outlined, keyboardType: TextInputType.emailAddress),

      // Date of Birth with Calendar Picker
      Padding(
        padding: const EdgeInsets.only(bottom: 16.0),
        child: InkWell(
          onTap: () => _selectDate(context),
          child: IgnorePointer(
            child: TextFormField(
              controller: _dobController,
              decoration: const InputDecoration(
                labelText: 'Date of Birth',
                hintText: 'Select your birthday',
                prefixIcon: Icon(Icons.cake_outlined),
                contentPadding: EdgeInsets.all(16),
              ),
            ),
          ),
        ),
      ),

      _buildDropdownField('Gender', _gender, ['Male', 'Female', 'Other'], (val) => setState(() => _gender = val)),

      // State Dropdown (Moved before City)
      _buildDropdownField('State', _state, _stateCityMap.keys.toList()..sort(), (val) {
        setState(() {
          _state = val;
          _city = null; // Reset city when state changes
        });
      }),

      // City Dropdown (Dependent on State)
      _buildDropdownField(
        'City',
        _city,
        _state != null ? (List<String>.from(_stateCityMap[_state!]!)..sort()..add('Other')) : [],
        (val) => setState(() {
          _city = val;
          if (val != 'Other') _otherCityController.clear();
        })
      ),

      // Manual City Input if 'Other' is selected
      if (_city == 'Other')
        _buildTextField('Specify City Name', _otherCityController, Icons.location_on_outlined),

      _buildDropdownField('Employment Type', _employmentType, [
        'Salaried', 'Self-Employed', 'Business', 'Freelancer', 'Retired'
      ], (val) => setState(() => _employmentType = val)),
      _buildTextField('Number of Dependents', _dependentsController, Icons.people_outline, keyboardType: TextInputType.number),
      _buildTextField('Employer / Company Name', _employerController, Icons.business_outlined),
      _buildDropdownField('Marital Status (optional)', _maritalStatus, ['Single', 'Married', 'Other'], (val) => setState(() => _maritalStatus = val)),
      _buildTextField('PAN Number (optional)', _panController, Icons.credit_card_outlined, placeholder: 'ABCDE1234F'),
      _buildTextField('Department', _departmentController, Icons.lan_outlined),
      _buildTextField('Designation / Role', _designationController, Icons.badge_outlined),
    ];
  }

  List<Widget> _buildIncomeFields(bool isDark) {
    return [
      _buildTextField('Monthly Active Income (Net Take-home)', _monthlyActiveIncomeController, Icons.currency_rupee, keyboardType: TextInputType.number),
      _buildDropdownField('Income Frequency', _incomeFrequency, ['Monthly', 'Weekly', 'Irregular'], (val) => setState(() => _incomeFrequency = val)),
      _buildDropdownField('City Tier', _cityTier, ['Metro City / Tier 1', 'Tier 2', 'Tier 3'], (val) => setState(() => _cityTier = val)),
      _buildSwitchField('Do you have Passive Income?', _hasPassiveIncome, (val) => setState(() => _hasPassiveIncome = val)),
      if (_hasPassiveIncome) ...[
        _buildTextField('Passive Income Amount (Monthly)', _passiveIncomeAmountController, Icons.currency_rupee, keyboardType: TextInputType.number),
        _buildDropdownField('Passive Income Source', _passiveIncomeSource, ['Rent', 'Dividends', 'Interest', 'Other'], (val) => setState(() => _passiveIncomeSource = val)),
      ],
      _buildTextField('Salary Breakup (HRA, Basic, etc.) (optional)', _salaryBreakupController, Icons.pie_chart_outline, maxLines: 3),
    ];
  }

  List<Widget> _buildExpensesFields(bool isDark) {
    return [
      _buildTextField('Monthly Fixed Expenses (Rent, Subscriptions, EMI)', _monthlyFixedExpensesController, Icons.receipt_long_outlined, keyboardType: TextInputType.number),
      _buildTextField('Monthly Variable Expenses (Groceries, Fuel, Misc)', _monthlyVariableExpensesController, Icons.shopping_cart_outlined, keyboardType: TextInputType.number),
      _buildTextField('Total Monthly EMI Obligations', _totalEmiController, Icons.credit_score_outlined, keyboardType: TextInputType.number),
      _buildTextField('Number of Active Loans', _activeLoansController, Icons.format_list_numbered_outlined, keyboardType: TextInputType.number),
      _buildTextField('Monthly Savings (Approx)', _monthlySavingsController, Icons.savings_outlined, keyboardType: TextInputType.number),
      _buildTextField('Loan Details (Type, Balance, Interest) (optional)', _loanDetailsController, Icons.info_outline, maxLines: 3),
      _buildTextField('Expense Category Breakdown (optional)', _expenseCategoryBreakdownController, Icons.analytics_outlined, maxLines: 3),
    ];
  }

  List<Widget> _buildEmergencyFields(bool isDark) {
    return [
      _buildSwitchField('Do you have an Emergency Fund?', _hasEmergencyFund, (val) => setState(() => _hasEmergencyFund = val)),
      if (_hasEmergencyFund) ...[
        _buildTextField('Total Current Emergency Fund (₹)', _emergencyFundCurrentController, Icons.account_balance_wallet_outlined, keyboardType: TextInputType.number),
        _buildDropdownField('Where is it Parked?', _emergencyFundParked, [
          'Savings A/C', 'FD', 'Liquid Fund', 'Cash', 'Other'
        ], (val) => setState(() => _emergencyFundParked = val)),
      ],
    ];
  }

  List<Widget> _buildInsuranceFields(bool isDark) {
    return [
      _buildSwitchField('Health Insurance — Do you have it?', _hasHealthInsurance, (val) => setState(() => _hasHealthInsurance = val)),
      if (_hasHealthInsurance) ...[
        _buildTextField('Health Cover Amount', _healthCoverController, Icons.currency_rupee, keyboardType: TextInputType.number),
        _buildSwitchField('Is Family Covered under Health?', _isFamilyCovered, (val) => setState(() => _isFamilyCovered = val)),
      ],
      _buildSwitchField('Life Insurance — Do you have it?', _hasLifeInsurance, (val) => setState(() => _hasLifeInsurance = val)),
      if (_hasLifeInsurance)
        _buildTextField('Life Cover Amount', _lifeCoverController, Icons.currency_rupee, keyboardType: TextInputType.number),
      _buildSwitchField('Term Plan — Do you have it?', _hasTermPlan, (val) => setState(() => _hasTermPlan = val)),
      if (_hasTermPlan)
        _buildTextField('Term Cover Amount', _termCoverController, Icons.currency_rupee, keyboardType: TextInputType.number),
      _buildTextField('Existing Insurer Name(s) (optional)', _insurerNameController, Icons.domain_outlined),
      _buildTextField('Policy Number(s) (optional)', _policyNumberController, Icons.numbers_outlined),
      _buildTextField('Policy Expiry Date(s) (optional)', _policyExpiryController, Icons.date_range_outlined, placeholder: 'DD-MM-YYYY'),
      _buildSwitchField('Critical Illness Cover?', _hasCriticalIllness, (val) => setState(() => _hasCriticalIllness = val)),
      _buildSwitchField('Accidental Cover?', _hasAccidentalCover, (val) => setState(() => _hasAccidentalCover = val)),
    ];
  }

  double _calculateSipTotal(List<Map<String, dynamic>> sips) {
    double total = 0;
    for (var sip in sips) {
      total += double.tryParse(sip['amount']?.toString() ?? '0') ?? 0;
    }
    return total;
  }

  Future<void> _runAutoSipLogic(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    final now = DateTime.now();
    final String monthKey = "${now.year}-${now.month}";

    bool dataChanged = false;

    void processDynamicSips(String type, String totalField, String listKey) {
      final List<dynamic> sips = data[listKey] ?? [];
      for (int i = 0; i < sips.length; i++) {
        final sip = sips[i];
        final int sipDate = int.tryParse(sip['date']?.toString() ?? '1') ?? 1;
        final String lastProcessedKey = "sip_last_processed_${type}_$i"; // Simplified tracking per index
        final String? lastProcessed = prefs.getString(lastProcessedKey);

        if (now.day >= sipDate && lastProcessed != monthKey) {
          double currentTotal = double.tryParse(data[totalField]?.toString() ?? '0') ?? 0;
          double sipAmount = double.tryParse(sip['amount']?.toString() ?? '0') ?? 0;

          if (sipAmount > 0) {
            currentTotal += sipAmount;
            data[totalField] = currentTotal.toString();
            prefs.setString(lastProcessedKey, monthKey);
            dataChanged = true;
          }
        }
      }
    }

    // Simplified logic for this demo - real complex tracking would need unique IDs per SIP
    processDynamicSips('stock', 'totalEquityInvestments', 'stockSips');
    processDynamicSips('mf', 'totalDebtInvestments', 'mfSips');
    processDynamicSips('gold', 'totalGoldInvestments', 'goldSips');

    if (dataChanged) {
      _populateFields(data);
      ApiService().updateMasterProfile(data).catchError((e) => debugPrint("Auto-SIP sync failed: $e"));
      AuthService().saveMasterProfileLocally(jsonEncode(data));
    }
  }

  List<Widget> _buildInvestmentsFields(bool isDark) {
    return [
      _buildSwitchField('Do you Invest?', _doesInvest, (val) => setState(() => _doesInvest = val)),
      if (_doesInvest) ...[
        _buildTextField('Total Stock Investment (₹)', _totalEquityInvestmentsController, Icons.trending_up, keyboardType: TextInputType.number),
        _buildTextField('Total Mutual Fund Investment (₹)', _totalDebtInvestmentsController, Icons.account_balance, keyboardType: TextInputType.number),
        _buildTextField('Total Gold Investments (₹)', _totalGoldInvestmentsController, Icons.toll, keyboardType: TextInputType.number),
        _buildTextField('Total Real Estate Investment (₹) — excluding home you live in', _totalRealEstateInvestmentsController, Icons.home_work, keyboardType: TextInputType.number),

        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.05),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.primary.withOpacity(0.1)),
          ),
          child: const Row(
            children: [
              Icon(Icons.info_outline_rounded, size: 16, color: AppColors.primary),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  "Note: SIPs are added automatically every month. For any irregular (one-time) investments, please update the Total values manually here.",
                  style: TextStyle(fontSize: 10, fontStyle: FontStyle.italic, color: Colors.grey),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        const Divider(height: 32),
        _buildSipSection("Monthly Mutual Fund SIPs", _mfSips, isDark),
        _buildSipSection("Monthly Gold SIPs", _goldSips, isDark),

        const Divider(height: 32),
        _buildDropdownField('Risk Appetite', _riskAppetite, ['Conservative', 'Moderate', 'Aggressive'], (val) => setState(() => _riskAppetite = val)),
        _buildDropdownField('Primary Investment Goal (optional)', _primaryInvestmentGoal, [
          'Wealth', 'Retirement', 'Child', 'Home', 'Emergency', 'Other'
        ], (val) => setState(() => _primaryInvestmentGoal = val)),
        _buildTextField('Existing MF Portfolio (Folio Details) (optional)', _existingPortfolioController, Icons.folder_open_outlined),
        _buildSliderField('Equity Exposure % (Approx) (optional)', _equityExposurePct, (val) => setState(() => _equityExposurePct = val)),
      ],
    ];
  }

  Widget _buildSipSection(String title, List<Map<String, dynamic>> sips, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey)),
            IconButton(
              icon: const Icon(Icons.add_circle_outline, size: 20, color: AppColors.primary),
              onPressed: () => setState(() => sips.add({'name': '', 'amount': '0', 'date': 1})),
            )
          ],
        ),
        if (sips.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 8.0),
            child: Text(
              "Note: These SIPs will automatically increase your Total Investment balance every month on the selected date.",
              style: TextStyle(fontSize: 9, color: AppColors.primary.withOpacity(0.8), fontStyle: FontStyle.italic),
            ),
          ),
        ...sips.asMap().entries.map((entry) {
          int index = entry.key;
          var sip = entry.value;
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              children: [
                Expanded(
                  flex: 3,
                  child: TextField(
                    decoration: const InputDecoration(hintText: 'Fund Name', contentPadding: EdgeInsets.symmetric(horizontal: 10)),
                    onChanged: (v) => sip['name'] = v,
                    controller: TextEditingController(text: sip['name'])..selection = TextSelection.collapsed(offset: sip['name'].length),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  flex: 3,
                  child: TextField(
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(hintText: 'Amount', prefixText: '₹'),
                    onChanged: (v) => sip['amount'] = v,
                    controller: TextEditingController(text: sip['amount'])..selection = TextSelection.collapsed(offset: sip['amount'].length),
                  ),
                ),
                const SizedBox(width: 8),
                Column(
                  children: [
                    const Text("DATE", style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.grey)),
                    DropdownButton<int>(
                      value: sip['date'],
                      underline: const SizedBox(),
                      items: List.generate(31, (i) => i + 1).map((d) => DropdownMenuItem(value: d, child: Text(d.toString(), style: const TextStyle(fontSize: 12)))).toList(),
                      onChanged: (v) => setState(() => sip['date'] = v),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.remove_circle_outline, size: 18, color: AppColors.danger),
                  onPressed: () => setState(() => sips.removeAt(index)),
                )
              ],
            ),
          );
        }).toList(),
        const SizedBox(height: 16),
      ],
    );
  }

  // --- REUSABLE COMPONENT BUILDERS ---

  Widget _buildTextField(String label, TextEditingController controller, IconData icon, {TextInputType keyboardType = TextInputType.text, String? placeholder, int maxLines = 1}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        maxLines: maxLines,
        decoration: InputDecoration(
          labelText: label,
          hintText: placeholder,
          prefixIcon: Icon(icon),
          contentPadding: const EdgeInsets.all(16),
        ),
      ),
    );
  }

  Widget _buildDropdownField(String label, String? selectedValue, List<String> items, ValueChanged<String?> onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: DropdownButtonFormField<String>(
        value: selectedValue,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: const Icon(Icons.arrow_drop_down_circle_outlined),
          contentPadding: const EdgeInsets.all(16),
        ),
        items: items.map((item) => DropdownMenuItem(value: item, child: Text(item))).toList(),
        onChanged: onChanged,
      ),
    );
  }

  Widget _buildSwitchField(String label, bool value, ValueChanged<bool> onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Material(
        color: Colors.transparent,
        child: SwitchListTile(
          title: Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          value: value,
          activeColor: AppColors.secondary,
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _buildSliderField(String label, double value, ValueChanged<double> onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('$label: ${value.round()}%', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          Slider(
            value: value,
            min: 0.0,
            max: 100.0,
            activeColor: AppColors.primary,
            inactiveColor: AppColors.primary.withOpacity(0.2),
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }
}
