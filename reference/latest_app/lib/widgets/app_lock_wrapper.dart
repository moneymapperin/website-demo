import 'package:flutter/material.dart';
import '../services/security_service.dart';
import '../theme/app_theme.dart';

class AppLockWrapper extends StatefulWidget {
  final Widget child;
  const AppLockWrapper({super.key, required this.child});

  @override
  State<AppLockWrapper> createState() => _AppLockWrapperState();
}

class _AppLockWrapperState extends State<AppLockWrapper> with WidgetsBindingObserver {
  bool _isLocked = false;
  bool _isAuthenticating = false;
  String? _errorMessage;
  final SecurityService _securityService = SecurityService();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Initial check on app launch
    Future.delayed(const Duration(milliseconds: 500), () => _initialCheck());
  }

  Future<void> _initialCheck() async {
    final enabled = await _securityService.isAppLockEnabled();
    if (enabled) {
      setState(() => _isLocked = true);
      _authenticate();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      _lockApp();
    } else if (state == AppLifecycleState.resumed) {
      _checkLock();
    }
  }

  Future<void> _lockApp() async {
    final enabled = await _securityService.isAppLockEnabled();
    if (enabled) {
      setState(() => _isLocked = true);
    }
  }

  Future<void> _checkLock() async {
    final enabled = await _securityService.isAppLockEnabled();
    if (enabled && _isLocked) {
      _authenticate();
    }
  }

  Future<void> _authenticate() async {
    if (_isAuthenticating) return;

    setState(() {
      _isAuthenticating = true;
      _errorMessage = null;
    });

    try {
      final authenticated = await _securityService.authenticate();
      if (authenticated) {
        setState(() {
          _isLocked = false;
          _isAuthenticating = false;
        });
      } else {
        setState(() {
          _isAuthenticating = false;
          _errorMessage = "Authentication failed or cancelled.";
        });
      }
    } catch (e) {
      setState(() {
        _isAuthenticating = false;
        _errorMessage = "An unexpected error occurred.";
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLocked) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: AppTheme.darkTheme,
        home: Scaffold(
          backgroundColor: Colors.black,
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.lock_rounded, color: Colors.white, size: 80),
                const SizedBox(height: 24),
                const Text(
                  "MoneyMapper is Locked",
                  style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                const Text(
                  "Unlock with your phone security to continue.",
                  style: TextStyle(color: Colors.white70, fontSize: 14),
                ),
                if (_errorMessage != null) ...[
                  const SizedBox(height: 16),
                  Text(
                    _errorMessage!,
                    style: const TextStyle(color: Colors.redAccent, fontSize: 12),
                  ),
                ],
                const SizedBox(height: 40),
                if (!_isAuthenticating)
                  ElevatedButton(
                    onPressed: _authenticate,
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                    child: const Text("Unlock App", style: TextStyle(color: Colors.white)),
                  )
                else
                  const CircularProgressIndicator(color: Colors.white),
              ],
            ),
          ),
        ),
      );
    }
    return widget.child;
  }
}
