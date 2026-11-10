import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_theme.dart';
import '../widgets/auth_page_layout.dart';
import 'login_screen.dart';
import 'teaser_income_dashboard.dart';

class OnboardingWizardScreen extends StatefulWidget {
  static const routeName = '/onboarding_wizard';

  const OnboardingWizardScreen({super.key});

  @override
  State<OnboardingWizardScreen> createState() => _OnboardingWizardScreenState();
}

class _OnboardingWizardScreenState extends State<OnboardingWizardScreen> with SingleTickerProviderStateMixin {
  final PageController _pageController = PageController();
  int _currentStep = 0;
  bool _isLoading = false;

  late final AnimationController _mascotAnimController;
  late final Animation<double> _mascotFloatAnimation;

  // Controllers
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _incomeController = TextEditingController();
  final _fixedExpensesController = TextEditingController();
  final _loanEmiController = TextEditingController();
  final _totalExpController = TextEditingController();
  final _passiveIncomeAmtController = TextEditingController();

  String _selectedCityTier = 'Metro';
  bool _hasPassiveIncome = false;

  @override
  void initState() {
    super.initState();
    _mascotAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat(reverse: true);

    _mascotFloatAnimation = Tween<double>(begin: -10, end: 10).animate(
      CurvedAnimation(parent: _mascotAnimController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _mascotAnimController.dispose();
    _pageController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _incomeController.dispose();
    _fixedExpensesController.dispose();
    _loanEmiController.dispose();
    _totalExpController.dispose();
    _passiveIncomeAmtController.dispose();
    super.dispose();
  }

  void _showErrorSnack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: Colors.red),
    );
  }

  void _nextPage() {
    FocusScope.of(context).unfocus();
    
    // Validations
    if (_currentStep == 0) {
      if (_firstNameController.text.trim().isEmpty) {
        _showErrorSnack('Please enter your first name.');
        return;
      }
      if (_lastNameController.text.trim().isEmpty) {
        _showErrorSnack('Please enter your last name.');
        return;
      }
    } else if (_currentStep == 1) {
      final emailRegex = RegExp(r'^[^@]+@[^@]+\.[^@]+');
      if (!emailRegex.hasMatch(_emailController.text.trim())) {
        _showErrorSnack('Please enter a valid email address.');
        return;
      }
      final phoneRegex = RegExp(r'^[6-9]\d{9}$');
      if (!phoneRegex.hasMatch(_phoneController.text.trim())) {
        _showErrorSnack('Please enter a valid 10-digit Indian phone number.');
        return;
      }
    } else if (_currentStep == 2) {
      final val = double.tryParse(_incomeController.text.trim());
      if (val == null || val < 0) {
        _showErrorSnack('Please enter a valid amount (₹0 or greater).');
        return;
      }
    } else if (_currentStep == 3) {
      final val = double.tryParse(_fixedExpensesController.text.trim());
      if (val == null || val < 0) {
        _showErrorSnack('Please enter a valid amount (₹0 or greater).');
        return;
      }
    } else if (_currentStep == 4) {
      final val = double.tryParse(_loanEmiController.text.trim());
      if (val == null || val < 0) {
        _showErrorSnack('Please enter a valid amount (₹0 or greater).');
        return;
      }
    } else if (_currentStep == 5) {
      final val = double.tryParse(_totalExpController.text.trim());
      if (val == null || val < 0) {
        _showErrorSnack('Please enter a valid amount (₹0 or greater).');
        return;
      }
    } else if (_currentStep == 6) {
      if (_hasPassiveIncome) {
        final val = double.tryParse(_passiveIncomeAmtController.text.trim());
        if (val == null || val < 0) {
          _showErrorSnack('Please enter a valid amount (₹0 or greater).');
          return;
        }
      }
      _analyzeData();
      return;
    }

    _pageController.nextPage(duration: const Duration(milliseconds: 500), curve: Curves.easeOutCubic);
  }

  void _prevPage() {
    FocusScope.of(context).unfocus();
    _pageController.previousPage(duration: const Duration(milliseconds: 500), curve: Curves.easeOutCubic);
  }

  Future<void> _analyzeData() async {
    setState(() => _isLoading = true);

    try {
      final supabase = Supabase.instance.client;

      // 1. Insert into leads table
      final response = await supabase
          .schema('public')
          .from('leads')
          .insert({
            'first_name': _firstNameController.text.trim(),
            'last_name': _lastNameController.text.trim(),
            'email': _emailController.text.trim(),
            'phone': _phoneController.text.trim(),
            'monthly_income': double.tryParse(_incomeController.text.trim()) ?? 0,
            'fixed_expenses': double.tryParse(_fixedExpensesController.text.trim()) ?? 0,
            'loan_emi': double.tryParse(_loanEmiController.text.trim()) ?? 0,
            'monthly_expenditure': double.tryParse(_totalExpController.text.trim()) ?? 0,
            'city_tier': _selectedCityTier,
            'has_passive_income': _hasPassiveIncome,
            'passive_income_amount': _hasPassiveIncome ? (double.tryParse(_passiveIncomeAmtController.text.trim()) ?? 0) : 0,
          })
          .select('id')
          .single();

      final leadId = response['id'];

      // 2. Query the analysis view
      final analysisData = await supabase
          .schema('public')
          .from('leads_analysis')
          .select()
          .eq('id', leadId)
          .single();

      if (!mounted) return;

      // 3. Push to Teaser Dashboard
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => TeaserIncomeDashboard(
            leadData: analysisData,
            originalData: {
              'firstName': _firstNameController.text.trim(),
              'lastName': _lastNameController.text.trim(),
              'email': _emailController.text.trim(),
              'phone': _phoneController.text.trim(),
            }
          ),
        ),
      );

    } catch (e) {
      if (e.toString().contains('unique constraint')) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Looks like you already have an account! Please log in.'), backgroundColor: Colors.orange),
        );
        Navigator.pushReplacementNamed(context, LoginScreen.routeName);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        AuthPageLayout(
          title: '', // Custom title inside page view
          showBack: false,
          trailingAction: TextButton.icon(
            onPressed: () {
              Navigator.pushReplacementNamed(context, LoginScreen.routeName);
            },
            icon: const Icon(Icons.login_rounded, color: Colors.white, size: 18),
            label: const Text(
              "Log In",
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
            ),
            style: TextButton.styleFrom(
              backgroundColor: Colors.white.withOpacity(0.1),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            ),
          ),
          child: Column(
            children: [
              // Floating AI Mascot
              AnimatedBuilder(
                animation: _mascotFloatAnimation,
                builder: (context, child) {
                  return Transform.translate(
                    offset: Offset(0, _mascotFloatAnimation.value),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.15),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(color: AppColors.primary.withOpacity(0.3), blurRadius: 30, spreadRadius: 5),
                        ],
                      ),
                      child: ClipOval(
                        child: Image.asset(
                          'assets/mascot no background -s.png',
                          width: 80,
                          height: 80,
                          fit: BoxFit.contain,
                          errorBuilder: (_, __, ___) => const Icon(Icons.smart_toy_rounded, size: 60, color: AppColors.primary),
                        ),
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 32),
              
              // Interactive PageView Form
              SizedBox(
                height: 380, // Fixed height to prevent overflow
                child: PageView(
                  controller: _pageController,
                  physics: const NeverScrollableScrollPhysics(), // Disable swiping to force button use
                  onPageChanged: (idx) => setState(() => _currentStep = idx),
                  children: [
                    _buildStepCard(
                      title: "Welcome to MoneyMapper!",
                      subtitle: "Let's start by getting to know you.",
                      content: Column(
                        children: [
                          _buildTextField('First Name', _firstNameController, Icons.person_outline, textCapitalization: TextCapitalization.words),
                          const SizedBox(height: 12),
                          _buildTextField('Last Name', _lastNameController, Icons.person_outline, textCapitalization: TextCapitalization.words),
                        ],
                      ),
                    ),
                    _buildStepCard(
                      title: "Contact Details",
                      subtitle: "Where can we send your financial report?",
                      content: Column(
                        children: [
                          _buildTextField('Email Address', _emailController, Icons.email_outlined, keyboardType: TextInputType.emailAddress),
                          const SizedBox(height: 12),
                          _buildTextField('Mobile Number', _phoneController, Icons.phone_android_outlined, keyboardType: TextInputType.phone),
                        ],
                      ),
                    ),
                    _buildStepCard(
                      title: "Your Income",
                      subtitle: "How much do you earn in a month?",
                      content: Column(
                        children: [
                          const SizedBox(height: 20),
                          _buildTextField('Monthly Income (₹)', _incomeController, Icons.currency_rupee_outlined, keyboardType: TextInputType.number),
                        ],
                      ),
                    ),
                    _buildStepCard(
                      title: "Your Expenses",
                      subtitle: "What are your fixed expenses for the month?\n(e.g., rent, utilities, subscriptions)",
                      content: Column(
                        children: [
                          const SizedBox(height: 20),
                          _buildTextField('Fixed Expenses (₹)', _fixedExpensesController, Icons.money_off_outlined, keyboardType: TextInputType.number),
                        ],
                      ),
                    ),
                    _buildStepCard(
                      title: "Liabilities",
                      subtitle: "Do you have any loans? (Enter 0 if none)",
                      content: Column(
                        children: [
                          const SizedBox(height: 20),
                          _buildTextField('Total Loan EMI (₹)', _loanEmiController, Icons.account_balance_outlined, keyboardType: TextInputType.number),
                        ],
                      ),
                    ),
                    _buildStepCard(
                      title: "Expenditure",
                      subtitle: "What's the approximate miscellaneous expenditure for the month?\n(e.g., dining out, entertainment, shopping)",
                      content: Column(
                        children: [
                          const SizedBox(height: 20),
                          _buildTextField('Monthly Expenditure (₹)', _totalExpController, Icons.receipt_long_outlined, keyboardType: TextInputType.number),
                        ],
                      ),
                    ),
                    _buildStepCard(
                      title: "Final Details",
                      subtitle: "Where do you live, and do you have passive income?",
                      content: Column(
                        children: [
                          _buildDropdown('City Tier', ['Metro', 'Tier 2', 'Tier 3'], _selectedCityTier, (val) => setState(() => _selectedCityTier = val!)),
                          const SizedBox(height: 16),
                          SwitchListTile(
                            title: const Text('Do you have passive income?', style: TextStyle(color: Colors.white70)),
                            value: _hasPassiveIncome,
                            activeColor: AppColors.primary,
                            contentPadding: EdgeInsets.zero,
                            onChanged: (val) => setState(() => _hasPassiveIncome = val),
                          ),
                          if (_hasPassiveIncome) ...[
                            const SizedBox(height: 8),
                            _buildTextField('Passive Income Amount (₹)', _passiveIncomeAmtController, Icons.currency_rupee_outlined, keyboardType: TextInputType.number),
                          ]
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              
              // Navigation Buttons
              Row(
                children: [
                  if (_currentStep > 0)
                    Expanded(
                      flex: 1,
                      child: TextButton(
                        onPressed: _prevPage,
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                            side: const BorderSide(color: Colors.white24),
                          ),
                        ),
                        child: const Text('Back', style: TextStyle(color: Colors.white70, fontSize: 16)),
                      ),
                    ),
                  if (_currentStep > 0) const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      onPressed: _nextPage,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: Text(
                        _currentStep == 6 ? 'Analyze My Score' : 'Next',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        if (_isLoading)
          const ColoredBox(
            color: Colors.black54,
            child: Center(child: CircularProgressIndicator()),
          ),
      ],
    );
  }

  Widget _buildStepCard({required String title, required String subtitle, required Widget content}) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 14, color: Colors.white70),
          ),
          const SizedBox(height: 32),
          content,
        ],
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, IconData icon, {TextInputType? keyboardType, TextCapitalization textCapitalization = TextCapitalization.none}) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      textCapitalization: textCapitalization,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: Colors.white54),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.white24),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.white24),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary),
        ),
      ),
    );
  }

  Widget _buildDropdown(String label, List<String> items, String value, Function(String?) onChanged) {
    return DropdownButtonFormField<String>(
      value: value,
      items: items.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
      onChanged: onChanged,
      dropdownColor: AppColors.darkCard,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: const Icon(Icons.location_city_outlined, color: Colors.white54),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.white24),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.white24),
        ),
      ),
    );
  }
}
