import 'package:flutter/material.dart';
import '../theme/responsive_utils.dart';
import '../theme/app_theme.dart';

class AuthPageLayout extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget child;
  final bool showBack;

  const AuthPageLayout({
    super.key,
    required this.title,
    this.subtitle,
    required this.child,
    this.showBack = false,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A041A),
      body: Stack(
        children: [
          // Background Gradient & Glowing Wave Accent
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Color(0xFF0A041A),
                    Color(0xFF160A36),
                    Color(0xFF0D0524),
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            ),
          ),
          Positioned.fill(
            child: CustomPaint(
              painter: _GlowingWavePainter(),
            ),
          ),

          // Main Content Layer
          SafeArea(
            child: Theme(
              data: AppTheme.darkTheme,
              child: Column(
                children: [
                  if (showBack)
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Padding(
                        padding: const EdgeInsets.only(left: 12, top: 8),
                        child: IconButton(
                          onPressed: () => Navigator.pop(context),
                          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
                        ),
                      ),
                    ),

                  Expanded(
                    child: SingleChildScrollView(
                      physics: const BouncingScrollPhysics(),
                      padding: EdgeInsets.symmetric(
                        horizontal: context.wp(5),
                        vertical: context.hp(2),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const SizedBox(height: 10),

                          // 3D Compass Logo
                          Center(
                            child: Container(
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.blueAccent.withOpacity(0.3),
                                    blurRadius: 25,
                                    spreadRadius: 2,
                                  ),
                                ],
                              ),
                              child: Image.asset(
                                'assets/log 3d- hd -.png',
                                height: 78,
                                width: 78,
                                fit: BoxFit.contain,
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),

                          // Brand Title
                          const Center(
                            child: Text(
                              'MoneyMapper',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 26,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.6,
                              ),
                            ),
                          ),
                          const SizedBox(height: 4),

                          // Tagline
                          const Center(
                            child: Text(
                              'Your Personal Money Manager',
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 0.4,
                              ),
                            ),
                          ),
                          const SizedBox(height: 22),

                          // 5 Pillar Icons Row
                          _buildPillarsRow(),

                          const SizedBox(height: 28),

                          // Form Overlay Card
                          Container(
                            decoration: BoxDecoration(
                              color: const Color(0xFF130E26).withOpacity(0.92),
                              borderRadius: BorderRadius.circular(24),
                              border: Border.all(
                                color: Colors.purpleAccent.withOpacity(0.25),
                                width: 1.2,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.4),
                                  blurRadius: 20,
                                  offset: const Offset(0, 8),
                                ),
                              ],
                            ),
                            padding: EdgeInsets.all(context.wp(5)),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                if (title.isNotEmpty) ...[
                                  Text(
                                    title,
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: context.sp(18),
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                ],
                                if (subtitle != null && subtitle!.isNotEmpty) ...[
                                  Text(
                                    subtitle!,
                                    style: TextStyle(
                                      color: Colors.white60,
                                      fontSize: context.sp(12),
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                ],
                                child,
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPillarsRow() {
    final pillars = [
      {'label': 'Income', 'icon': Icons.currency_rupee_rounded, 'color': const Color(0xFF00E676)},
      {'label': 'Expenses', 'icon': Icons.account_balance_wallet_rounded, 'color': const Color(0xFFFF5252)},
      {'label': 'Investment', 'icon': Icons.bar_chart_rounded, 'color': const Color(0xFF448AFF)},
      {'label': 'Insurance', 'icon': Icons.shield_rounded, 'color': const Color(0xFFE040FB)},
      {'label': 'Savings', 'icon': Icons.savings_rounded, 'color': const Color(0xFFFFD740)},
    ];

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: pillars.map((p) {
        final color = p['color'] as Color;
        final icon = p['icon'] as IconData;
        final label = p['label'] as String;

        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: color.withOpacity(0.16),
                shape: BoxShape.circle,
                border: Border.all(color: color.withOpacity(0.5), width: 1.2),
                boxShadow: [
                  BoxShadow(
                    color: color.withOpacity(0.2),
                    blurRadius: 8,
                    spreadRadius: 1,
                  ),
                ],
              ),
              child: Icon(icon, color: color, size: 21),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 9.5,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        );
      }).toList(),
    );
  }
}

class _GlowingWavePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final Paint linePaint = Paint()
      ..shader = const LinearGradient(
        colors: [Color(0xFF9D4EDD), Color(0xFF6C5CE7), Color(0xFF3A86FF)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height))
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    final Paint glowPaint = Paint()
      ..shader = const LinearGradient(
        colors: [Color(0xFF9D4EDD), Color(0xFF6C5CE7)],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height))
      ..style = PaintingStyle.stroke
      ..strokeWidth = 6.0
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 10.0);

    final path1 = Path();
    path1.moveTo(0, size.height * 0.18);
    path1.cubicTo(
      size.width * 0.35,
      size.height * 0.08,
      size.width * 0.65,
      size.height * 0.32,
      size.width,
      size.height * 0.22,
    );

    final path2 = Path();
    path2.moveTo(0, size.height * 0.88);
    path2.cubicTo(
      size.width * 0.4,
      size.height * 0.98,
      size.width * 0.7,
      size.height * 0.82,
      size.width,
      size.height * 0.92,
    );

    canvas.drawPath(path1, glowPaint);
    canvas.drawPath(path1, linePaint);

    canvas.drawPath(path2, glowPaint);
    canvas.drawPath(path2, linePaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
