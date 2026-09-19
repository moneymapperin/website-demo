import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../screens/login_screen.dart';
import '../screens/main_screen.dart';
import '../theme/app_theme.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  late String _selectedQuote;

  static const List<String> _quotes = [
    "“Do not save what is left after spending, but spend what is left after saving.”\n— Warren Buffett",
    "“An investment in knowledge pays the best interest.”\n— Benjamin Franklin",
    "“Beware of little expenses; a small leak will sink a great ship.”\n— Benjamin Franklin",
    "“A budget is telling your money where to go instead of wondering where it went.”\n— John C. Maxwell",
    "“The safe way to double your money is to fold it over once and put it in your pocket.”\n— Kin Hubbard",
    "“Formal education will make you a living; self-education will make you a fortune.”\n— Jim Rohn",
    "“Money is a terrible master but an excellent servant.”\n— P.T. Barnum",
    "“Rule No. 1: Never lose money. Rule No. 2: Never forget Rule No. 1.”\n— Warren Buffett",
  ];

  @override
  void initState() {
    super.initState();
    // Select a random quote on startup
    final random = math.Random();
    _selectedQuote = _quotes[random.nextInt(_quotes.length)];

    // Navigate to the next screen after a 2-second delay
    Future.delayed(const Duration(seconds: 2), () {
      _navigateToNextScreen();
    });
  }

  Future<void> _navigateToNextScreen() async {
    if (!mounted) return;
    final loggedIn = await AuthService().isLoggedIn();
    if (!mounted) return;
    Navigator.pushReplacement(
      context,
      PageRouteBuilder(
        pageBuilder: (_, __, ___) => loggedIn ? const MainScreen() : const LoginScreen(),
        transitionsBuilder: (_, anim, __, child) => FadeTransition(opacity: anim, child: child),
        transitionDuration: const Duration(milliseconds: 600),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF09090B), // Zinc 950 Background
      body: SafeArea(
        child: Column(
          children: [
            const Spacer(),
            
            // Brand Logo & Text
            Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    width: 120, // Increased from 90
                    height: 120,
                    child: Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Image.asset(
                        'assets/log 3d- hd -.png',
                        fit: BoxFit.contain,
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'MoneyMapper',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
            
            const Spacer(),

            // Random Quote at the bottom
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 40),
              child: Text(
                _selectedQuote,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white.withOpacity(0.7),
                  fontSize: 13,
                  fontStyle: FontStyle.italic,
                  height: 1.4,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
