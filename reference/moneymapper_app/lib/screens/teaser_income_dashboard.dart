import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_theme.dart';
import '../widgets/score_gauge.dart';

import 'login_screen.dart';
import 'onboarding_wizard_screen.dart';

class TeaserIncomeDashboard extends StatelessWidget {
  final Map<String, dynamic> leadData;
  final Map<String, dynamic> originalData; // contains firstName, lastName, email, phone

  const TeaserIncomeDashboard({
    super.key,
    required this.leadData,
    required this.originalData,
  });

  void _showRegistrationSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _RegisterBottomSheet(originalData: originalData),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    final finalScore = double.tryParse(leadData['final_score'].toString()) ?? 0.0;
    final activeScore = double.tryParse(leadData['inc_active_scr'].toString()) ?? 0.0;
    final passiveScore = double.tryParse(leadData['inc_passive_scr'].toString()) ?? 0.0;
    final stabilityStatus = leadData['stability_status']?.toString() ?? 'Unknown';

    Color stabilityColor = Colors.grey;
    IconData stabilityIcon = Icons.help_outline;
    if (stabilityStatus == 'Green') {
      stabilityColor = Colors.green;
      stabilityIcon = Icons.check_circle_outline;
    } else if (stabilityStatus == 'Yellow') {
      stabilityColor = Colors.orange;
      stabilityIcon = Icons.warning_amber_rounded;
    } else if (stabilityStatus == 'Red') {
      stabilityColor = Colors.red;
      stabilityIcon = Icons.dangerous_outlined;
    }

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: AppBar(
        title: const Text('Your Financial Health', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
        backgroundColor: isDark ? AppColors.darkCard : Colors.white,
        elevation: 0,
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.close),
            onPressed: () {
              Navigator.pushReplacementNamed(context, OnboardingWizardScreen.routeName);
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkCard : Colors.white,
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(32)),
              ),
              child: Column(
                children: [
                  Text(
                    'Hello ${originalData['firstName']},',
                    style: TextStyle(fontSize: 18, color: isDark ? Colors.white70 : Colors.black54),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Here is your Income Score',
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: isDark ? Colors.white : Colors.black),
                  ),
                  const SizedBox(height: 24),
                  ScoreGauge(
                    score: finalScore,
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Sub-scores
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Expanded(
                    child: _buildMiniScoreCard(
                      'Active Income',
                      activeScore.toStringAsFixed(0),
                      isDark,
                      Icons.work_outline,
                      Colors.blueAccent,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildMiniScoreCard(
                      'Passive Income',
                      passiveScore.toStringAsFixed(0),
                      isDark,
                      Icons.trending_up,
                      Colors.purpleAccent,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),
            
            // Stability Status Card
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: stabilityColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: stabilityColor.withValues(alpha: 0.3), width: 1.5),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: stabilityColor.withValues(alpha: 0.2),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(stabilityIcon, color: stabilityColor, size: 32),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Financial Stability',
                            style: TextStyle(
                              fontSize: 14,
                              color: isDark ? Colors.white70 : Colors.black87,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            stabilityStatus == 'Green' 
                                ? 'Healthy EMI Ratio' 
                                : stabilityStatus == 'Yellow' 
                                    ? 'High EMI Burden' 
                                    : 'Critical Debt Level',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: isDark ? Colors.white : Colors.black,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 40),
            
            // Call to Action
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColors.primary, AppColors.primary.withValues(alpha: 0.8)],
                  ),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(color: AppColors.primary.withValues(alpha: 0.3), blurRadius: 20, offset: const Offset(0, 10))
                  ],
                ),
                child: Column(
                  children: [
                    const Icon(Icons.lock_open_rounded, color: Colors.white, size: 48),
                    const SizedBox(height: 16),
                    const Text(
                      'Unlock Your Full Financial Roadmap',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'This is just the beginning. Create a free account to unlock your dashboard, get investment recommendations, and track your expenses.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.white70, fontSize: 14, height: 1.5),
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      height: 54,
                      child: ElevatedButton(
                        onPressed: () => _showRegistrationSheet(context),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: AppColors.primary,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        child: const Text('Create Account', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildMiniScoreCard(String title, String score, bool isDark, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.3), width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 12),
          Text(score, style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: isDark ? Colors.white : Colors.black)),
          const SizedBox(height: 4),
          Text(title, style: TextStyle(fontSize: 12, color: isDark ? Colors.white54 : Colors.black54)),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------
// Bottom Sheet for completing registration
// ---------------------------------------------------------
class _RegisterBottomSheet extends StatefulWidget {
  final Map<String, dynamic> originalData;
  const _RegisterBottomSheet({required this.originalData});

  @override
  State<_RegisterBottomSheet> createState() => _RegisterBottomSheetState();
}

class _RegisterBottomSheetState extends State<_RegisterBottomSheet> {
  final _passwordController = TextEditingController();
  final _referralController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePass = true;

  Future<void> _register() async {
    final password = _passwordController.text;
    if (password.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Password must be at least 6 characters')));
      return;
    }

    setState(() => _isLoading = true);

    try {
      final email = widget.originalData['email'];
      
      await Supabase.instance.client.auth.signUp(
        email: email,
        password: password,
        emailRedirectTo: 'io.supabase.moneymapper://login-callback',
        data: {
          'fullName': '${widget.originalData['firstName']} ${widget.originalData['lastName']}'.trim(),
          'mobile': widget.originalData['phone'],
          'plan': 'b2c',
        }
      );

      final referralCode = _referralController.text.trim();
      if (referralCode.isNotEmpty) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('saved_referral_code', referralCode);
      }

      if (!mounted) return;
      
      // Keep a reference to the root navigator before we pop the bottom sheet context
      final rootNav = Navigator.of(context, rootNavigator: true);
      
      Navigator.pop(context); // close sheet
      
      showDialog(
        context: rootNav.context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: const Text('Registration Successful', style: TextStyle(fontWeight: FontWeight.bold)),
          content: const Text('Please check your email inbox to verify your account.'),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx); // Close Dialog
                rootNav.pushReplacementNamed(LoginScreen.routeName);
              },
              child: const Text('Okay'),
            )
          ],
        )
      );

    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Container(
      padding: EdgeInsets.only(
        left: 24, right: 24, top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E2C) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Almost Done!', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: isDark ? Colors.white : Colors.black)),
          const SizedBox(height: 8),
          Text('Set a secure password to save your progress.', style: TextStyle(color: isDark ? Colors.white70 : Colors.black54)),
          const SizedBox(height: 24),
          
          TextField(
            controller: _passwordController,
            obscureText: _obscurePass,
            style: TextStyle(color: isDark ? Colors.white : Colors.black),
            decoration: InputDecoration(
              labelText: 'Create Password',
              prefixIcon: const Icon(Icons.lock_outline),
              suffixIcon: IconButton(
                icon: Icon(_obscurePass ? Icons.visibility_off : Icons.visibility),
                onPressed: () => setState(() => _obscurePass = !_obscurePass),
              ),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _referralController,
            textCapitalization: TextCapitalization.characters,
            style: TextStyle(color: isDark ? Colors.white : Colors.black),
            decoration: const InputDecoration(
              labelText: 'Referral Code (Optional)',
              prefixIcon: Icon(Icons.card_giftcard),
            ),
          ),
          
          const SizedBox(height: 32),
          SizedBox(
            height: 56,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _register,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: _isLoading 
                ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('Save & Register', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
            ),
          ),
        ],
      ),
    );
  }
}
