import 'dart:async';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../services/auth_service.dart';
import '../widgets/auth_page_layout.dart';
import 'main_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  static const routeName = '/register';

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> with WidgetsBindingObserver {
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _mobileController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  final _auth = AuthService();
  bool _loading = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _pendingGoogleLogin = false;
  Timer? _googleLoginTimer;

  late final StreamSubscription<AuthState> _authSubscription;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _authSubscription = Supabase.instance.client.auth.onAuthStateChange.listen((data) {
      if (data.event == AuthChangeEvent.signedIn) {
        _googleLoginTimer?.cancel();
        _pendingGoogleLogin = false;
        if (!mounted) return;
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (_) => const MainScreen()),
          (_) => false,
        );
      }
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _googleLoginTimer?.cancel();
    _authSubscription.cancel();
    _fullNameController.dispose();
    _emailController.dispose();
    _mobileController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && _pendingGoogleLogin) {
      // User returned from browser. Give the deep link 5 seconds to process auth.
      _googleLoginTimer?.cancel();
      _googleLoginTimer = Timer(const Duration(seconds: 5), () {
        if (mounted && _pendingGoogleLogin) {
          setState(() {
            _loading = false;
            _pendingGoogleLogin = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('Google sign-up was abandoned or unsuccessful.'),
              backgroundColor: Colors.red.shade700,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      });
    }
  }

  Future<void> _register() async {
    final fullName = _fullNameController.text.trim();
    final email = _emailController.text.trim();
    final mobile = _mobileController.text.trim();
    final password = _passwordController.text;
    final confirmPassword = _confirmPasswordController.text;

    if (fullName.isEmpty || email.isEmpty || mobile.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill in all fields'), backgroundColor: Colors.red),
      );
      return;
    }

    if (password != confirmPassword) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Passwords do not match'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _loading = true);

    final metadata = {
      'fullName': fullName,
      'mobile': mobile,
      'plan': 'b2c',
    };

    try {
      await _auth.signUp(
        email: email,
        password: password,
        metadata: metadata,
      );
      
      if (!mounted) return;
      
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          insetPadding: const EdgeInsets.symmetric(horizontal: 24), // Fix for horizontal overflow
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)), // More consistent rounding
          title: Row(
            children: [
              const Icon(Icons.check_circle_outline, color: Colors.green, size: 28),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Registration Successful',
                  style: TextStyle(
                    fontSize: 18, 
                    fontWeight: FontWeight.w900,
                    color: Theme.of(ctx).brightness == Brightness.dark ? Colors.white : Colors.black87,
                  ),
                ),
              ),
            ],
          ),
          content: const Text(
            'Your account has been created! Please check your email inbox to verify your account before logging in.',
            style: TextStyle(fontSize: 14, height: 1.5),
          ),
          actions: [
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  Navigator.pop(context);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text('Back to Login', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString()),
          backgroundColor: Colors.red.shade700,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _registerWithGoogle() async {
    setState(() {
      _loading = true;
      _pendingGoogleLogin = true;
    });
    try {
      await _auth.signInWithGoogle(); // Maps to the same Supabase OAuth flow
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString()),
          backgroundColor: Colors.red.shade700,
          behavior: SnackBarBehavior.floating,
        ),
      );
      setState(() {
        _loading = false;
        _pendingGoogleLogin = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Stack(
      children: [
        AuthPageLayout(
          title: 'Create account',
          subtitle: 'Join MoneyMapper to track your financial health',
          showBack: true,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildTextField('Full Name', _fullNameController, Icons.person_outline, textCapitalization: TextCapitalization.words),
              const SizedBox(height: 16),
              _buildTextField('Email Address', _emailController, Icons.email_outlined, keyboardType: TextInputType.emailAddress),
              const SizedBox(height: 16),
              _buildTextField('Mobile Number', _mobileController, Icons.phone_android_outlined, keyboardType: TextInputType.phone),
              const SizedBox(height: 16),
              TextField(
                controller: _passwordController,
                obscureText: _obscurePassword,
                decoration: InputDecoration(
                  labelText: 'Password',
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    icon: Icon(_obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined, color: Colors.white54),
                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _confirmPasswordController,
                obscureText: _obscureConfirmPassword,
                decoration: InputDecoration(
                  labelText: 'Confirm Password',
                  prefixIcon: const Icon(Icons.lock_clock_outlined),
                  suffixIcon: IconButton(
                    icon: Icon(_obscureConfirmPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined, color: Colors.white54),
                    onPressed: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _loading ? null : _register,
                  child: const Text('Register'),
                ),
              ),

              // ── OR ── Divider
              _buildOrDivider(),

              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: _loading ? null : _registerWithGoogle,
                  icon: _buildGoogleLogo(),
                  label: const Text('Sign up with Google'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white24),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    'Already have an account? ',
                    style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w500),
                  ),
                  GestureDetector(
                    onTap: _loading
                        ? null
                        : () {
                            if (Navigator.canPop(context)) {
                              Navigator.pop(context);
                            } else {
                              Navigator.pushReplacementNamed(context, '/login');
                            }
                          },
                    child: const Text(
                      'Login',
                      style: TextStyle(
                        color: Colors.purpleAccent,
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        decoration: TextDecoration.underline,
                        decorationColor: Colors.purpleAccent,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        if (_loading)
          const ColoredBox(
            color: Colors.black26,
            child: Center(child: CircularProgressIndicator()),
          ),
      ],
    );
  }

  Widget _buildOrDivider() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 18),
      child: Row(
        children: [
          Expanded(
            child: Container(
              height: 1,
              color: Colors.white24,
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Text(
              'OR',
              style: TextStyle(
                color: Colors.white.withOpacity(0.5),
                fontSize: 12,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.2,
              ),
            ),
          ),
          Expanded(
            child: Container(
              height: 1,
              color: Colors.white24,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGoogleLogo() {
    return Image.asset(
      'assets/google_logo.png',
      width: 22,
      height: 22,
      fit: BoxFit.contain,
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, IconData icon, {TextInputType keyboardType = TextInputType.text, TextCapitalization textCapitalization = TextCapitalization.none}) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      textCapitalization: textCapitalization,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon),
        contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
      ),
    );
  }
}
