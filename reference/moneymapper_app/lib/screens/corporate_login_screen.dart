import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import '../widgets/auth_page_layout.dart';
import 'corporate_dashboard_screen.dart';

class CorporateLoginScreen extends StatefulWidget {
  const CorporateLoginScreen({super.key});

  static const routeName = '/corporate_login';

  @override
  State<CorporateLoginScreen> createState() => _CorporateLoginScreenState();
}

class _CorporateLoginScreenState extends State<CorporateLoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _auth = AuthService();
  final _api = ApiService();
  bool _loading = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter corporate email and password')),
      );
      return;
    }

    setState(() => _loading = true);

    try {
      // 1. Authenticate with Supabase
      await _auth.signIn(email: email, password: password);
      
      if (!mounted) return;

      // 2. Verify if email exists in public.corporate_admins
      final adminCheck = await _api.getCorporateWorkforceStats().catchError((e) {
        // Handle unauthorized or other errors specifically
        throw e;
      });
      
      if (!mounted) return;

      if (adminCheck.containsKey('company_name')) {
        // Success: Redirect to Native Corporate Dashboard
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => CorporateDashboardScreen()),
        );
      } else {
        // Not found in admin table
        await _auth.logout(); // Security logout
        _showStandardUserDialog();
      }

    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        
        // Check for specific error message that indicates role mismatch
        if (e.toString().contains("not in the Corporate Admins table")) {
          await _auth.logout(); // Security logout
          _showStandardUserDialog();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(e.toString()),
              backgroundColor: Colors.red.shade700,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    }
  }

  void _showStandardUserDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text("Standard Account Detected", style: TextStyle(fontWeight: FontWeight.bold)),
        content: const Text("This email is not registered as a Corporate Admin. Please login as a normal user to access your personal dashboard."),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx); // Close dialog
              Navigator.pop(context); // Redirect to normal login
            },
            style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
            child: const Text("Back to Login"),
          )
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        AuthPageLayout(
          title: 'Corporate Portal',
          subtitle: 'Enter your admin credentials to access workforce intelligence',
          showBack: true,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  labelText: 'Corporate Email',
                  prefixIcon: Icon(Icons.business_center_outlined),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _passwordController,
                obscureText: _obscurePassword,
                decoration: InputDecoration(
                  labelText: 'Admin Password',
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                      color: Theme.of(context).brightness == Brightness.dark ? Colors.white54 : Colors.black45,
                    ),
                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _loading ? null : _handleLogin,
                  child: const Text('Access Intelligence'),
                ),
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
}
