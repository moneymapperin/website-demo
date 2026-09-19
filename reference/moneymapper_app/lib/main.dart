import 'package:flutter/material.dart';

import 'package:supabase_flutter/supabase_flutter.dart';

import 'screens/recommendations_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/login_screen.dart';
import 'screens/main_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/ai_assistant_screen.dart';
import 'screens/register_screen.dart';
import 'screens/weekly_screen.dart';
import 'screens/reset_password_screen.dart';
import 'services/auth_service.dart';
import 'theme/app_theme.dart';
import 'screens/splash_screen.dart';
import 'screens/master_data_screen.dart';
import 'screens/privacy_policy_screen.dart';
import 'screens/achievements_screen.dart';
import 'screens/qr_scanner_screen.dart';
import 'screens/referral_screen.dart';
import 'screens/corporate_login_screen.dart';
import 'screens/corporate_dashboard_screen.dart';
import 'services/notification_service.dart';
import 'services/security_service.dart';
import 'services/secure_supabase_storage.dart';
import 'services/premium_service.dart';
import 'widgets/app_lock_wrapper.dart';
import 'package:flutter/services.dart';
import 'insurance_dashboard.dart';
import 'income_pillar.dart';
import 'weekly_expense_tracker.dart';
import 'mutual_fund.dart';
import 'emergency_fund.dart';
import 'chatbot/floating_chatbot.dart';
import 'screens/subscription_screen.dart';

// Use a GlobalKey to navigate without context
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Theme (Persistent Dark Mode)
  await AppTheme.init();

  // Initialize Supabase with Encrypted Storage & Keystore Protection
  await Supabase.initialize(
    url: 'https://upxsmlmsqxcwknvtywgk.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVweHNtbG1zcXhjd2tudnR5d2drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNjc3OTQsImV4cCI6MjA5NDc0Mzc5NH0.WTim-6TNx9l8TSmKJKf5xZVN1ZAy3uMKPUyi1otCblk',
    authOptions: FlutterAuthClientOptions(
      localStorage: SecureSupabaseStorage(),
    ),
  );

  // Initialize Notifications
  await NotificationService().init();

  runApp(const MoneyMapperApp());
}

class MoneyMapperApp extends StatefulWidget {
  const MoneyMapperApp({super.key});

  @override
  State<MoneyMapperApp> createState() => _MoneyMapperAppState();
}

class _MoneyMapperAppState extends State<MoneyMapperApp> with WidgetsBindingObserver {
  static const _securityChannel = MethodChannel('com.moneymapper/security');
  final _securityService = SecurityService();
  bool _isScreenRecording = false;
  bool _isInBackground = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    // Initialize Security
    _securityService.syncSecurityStatus();

    // Listen for Security Events (iOS)
    _securityChannel.setMethodCallHandler((call) async {
      if (call.method == 'onScreenshotTaken') {
        if (_securityService.isSecure) {
          _showScreenshotWarning();
        }
      } else if (call.method == 'onScreenRecordingChanged') {
        setState(() {
          _isScreenRecording = call.arguments as bool;
        });
      }
    });

    // Listen for Auth changes...
    Supabase.instance.client.auth.onAuthStateChange.listen((data) {
      final AuthChangeEvent event = data.event;
      debugPrint('AUTH EVENT DETECTED: $event');

      // Re-sync security on auth state changes
      if (event == AuthChangeEvent.signedIn || event == AuthChangeEvent.signedOut || event == AuthChangeEvent.userUpdated) {
        _securityService.syncSecurityStatus().then((_) {
          if (mounted) setState(() {}); // Refresh to update overlays if needed
        });
        
        if (event == AuthChangeEvent.signedIn) {
          PremiumService().syncSubscriptionStatus();
        }
      }

      if (event == AuthChangeEvent.passwordRecovery) {
        debugPrint('Password Recovery detected! Navigating to reset screen...');
        navigatorKey.currentState?.pushNamedAndRemoveUntil(
          ResetPasswordScreen.routeName,
          (route) => false,
        );
      }
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    setState(() {
      _isInBackground = state == AppLifecycleState.inactive || state == AppLifecycleState.paused;
    });
  }

  void _showScreenshotWarning() {
    final context = navigatorKey.currentContext;
    if (context == null) return;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Row(
          children: [
            Icon(Icons.security_rounded, color: Colors.red),
            SizedBox(width: 10),
            Text('Security Alert', style: TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
        content: const Text(
          'Screenshots are strictly prohibited to protect your sensitive financial data. Please refrain from taking screenshots.',
          style: TextStyle(fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('I Understand', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: AppTheme.themeModeNotifier,
      builder: (context, mode, child) {
        return AppLockWrapper(
          child: MaterialApp(
            title: 'MoneyMapper',
            navigatorKey: navigatorKey,
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: mode,
            debugShowCheckedModeBanner: false,
            home: const AuthGate(),
            builder: (context, child) {
              final showRecordingOverlay = _isScreenRecording && _securityService.isSecure;
              final showBackgroundOverlay = _isInBackground && _securityService.isSecure;

              return Stack(
                children: [
                  child!,
                  // Screen Recording Overlay
                  if (showRecordingOverlay)
                    _buildSecurityOverlay(
                      title: "SCREEN RECORDING DETECTED",
                      desc: "To protect your financial privacy, MoneyMapper is hidden during screen recording. Please stop recording to continue.",
                      showCloseButton: true,
                    ),

                  // App Switcher / Background Overlay
                  if (showBackgroundOverlay)
                    _buildSecurityOverlay(
                      title: "SECURITY MODE",
                      desc: "MoneyMapper is hidden to protect your sensitive financial data.",
                      showCloseButton: false,
                    ),
                ],
              );
            },
            routes: {
              LoginScreen.routeName: (_) => const LoginScreen(),
              RegisterScreen.routeName: (_) => const RegisterScreen(),
              ResetPasswordScreen.routeName: (_) => ResetPasswordScreen(),
              '/main': (_) => const MainScreen(),
              '/onboarding': (_) => const OnboardingScreen(),
              '/dashboard': (_) => const DashboardScreen(),
              '/weekly': (_) => const WeeklyScreen(),
              '/ai_assistant': (_) => const AiAssistantScreen(),
              '/ai': (_) => const RecommendationsScreen(),
              '/profile': (_) => const ProfileScreen(),
              '/master_data': (_) => const MasterDataScreen(),
              '/privacy': (_) => const PrivacyPolicyScreen(),
              '/achievements': (_) => const AchievementsScreen(),
              '/qr_scanner': (_) => const QrScannerScreen(),
              '/referral': (_) => const ReferralScreen(),
              '/corporate_login': (_) => const CorporateLoginScreen(),
              SubscriptionScreen.routeName: (_) => const SubscriptionScreen(),

              // ── ENTERPRISE PILLARS ROUTING MAPS ──
              '/workforce_health': (_) => const CorporateLoginScreen(),
              '/corporate_dashboard': (_) => const CorporateDashboardScreen(),
              '/insurance_p': (_) => InsuranceDashboard(),
              '/income_p': (_) => IncomePillarDashboard(),
              '/weekly_expense_p': (_) => WeeklyExpensePredictor(),
              '/mutual_fund_p': (_) => MutualFundDashboard(),
              '/emergency_fund_p': (_) => EmergencyFundDashboard()
            },
          ),
        );
      },
    );
  }

  Widget _buildSecurityOverlay({required String title, required String desc, required bool showCloseButton}) {
    return Positioned.fill(
      child: Container(
        color: Colors.black,
        padding: const EdgeInsets.symmetric(horizontal: 40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.security_rounded, color: Colors.white, size: 80),
            const SizedBox(height: 24),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
                decoration: TextDecoration.none,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              desc,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 14,
                fontWeight: FontWeight.normal,
                decoration: TextDecoration.none,
              ),
            ),
            if (showCloseButton) ...[
              const SizedBox(height: 40),
              ElevatedButton(
                onPressed: () => SystemNavigator.pop(),
                style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                child: const Text("Close App", style: TextStyle(color: Colors.white)),
              )
            ]
          ],
        ),
      ),
    );
  }
}




class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final loggedIn = await AuthService().isLoggedIn();
    if (!mounted) return;
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (_) => loggedIn ? const MainScreen() : const LoginScreen(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: Colors.transparent,
      body: SizedBox.shrink(),
    );
  }
}