import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../theme/app_theme.dart';

class DisclaimerConsentScreen extends StatefulWidget {
  const DisclaimerConsentScreen({super.key});

  @override
  State<DisclaimerConsentScreen> createState() => _DisclaimerConsentScreenState();
}

class _DisclaimerConsentScreenState extends State<DisclaimerConsentScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0x00000000))
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (String url) {
            if (mounted) {
              setState(() {
                _isLoading = false;
              });
            }
          },
          onNavigationRequest: (NavigationRequest request) {
            final String url = request.url.toLowerCase();
            if (url.contains('privacy')) {
              Navigator.pushNamed(context, '/privacy');
              return NavigationDecision.prevent;
            }
            if (url.contains('grievance')) {
              Navigator.pushNamed(context, '/grievance_policy');
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadFlutterAsset('assets/disclaimer_consent.html');
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.darkCard : AppColors.primary,
        foregroundColor: Colors.white,
        title: const Text(
          'Disclaimer & Data Consent',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        centerTitle: true,
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading)
            const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            ),
        ],
      ),
    );
  }
}
