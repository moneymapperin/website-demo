import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class ScoreGauge extends StatelessWidget {
  final double score;
  final double size;

  const ScoreGauge({
    super.key,
    required this.score,
    this.size = 140,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final double clamped = score.clamp(0.0, 100.0);

    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: 0, end: clamped),
      duration: const Duration(milliseconds: 1400),
      curve: Curves.easeOutCubic,
      builder: (context, value, child) {
        return SizedBox(
          width: size,
          height: size,
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Radial soft glow behind gauge
              Container(
                width: size * 0.85,
                height: size * 0.85,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFF8B5CF6).withOpacity(0.12),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
              // Segmented Rainbow Arc Painter with smooth continuous sub-segment filling
              CustomPaint(
                size: Size(size, size),
                painter: _RainbowSegmentGaugePainter(
                  progress: value / 100,
                  isDark: isDark,
                ),
              ),
              // Centered Score Text wrapped in FittedBox for zero overflow
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        value.round().toString(),
                        style: TextStyle(
                          fontSize: size * 0.28,
                          fontWeight: FontWeight.w900,
                          color: isDark ? Colors.white : AppColors.textPrimaryLight,
                          height: 1.0,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'OF 100',
                        style: TextStyle(
                          fontSize: size * 0.08,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white54 : AppColors.textSecondaryLight,
                          letterSpacing: 1.0,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _RainbowSegmentGaugePainter extends CustomPainter {
  final double progress;
  final bool isDark;

  _RainbowSegmentGaugePainter({
    required this.progress,
    required this.isDark,
  });

  // Rainbow color palette for segments (Red -> Orange -> Yellow -> Green)
  static const List<Color> segmentColors = [
    Color(0xFFEF4444), // Bright Red
    Color(0xFFF97316), // Orange
    Color(0xFFFBBF24), // Yellow
    Color(0xFF84CC16), // Light Green
    Color(0xFF10B981), // Emerald Green
  ];

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final strokeWidth = size.width * 0.12;
    final radius = (size.width - strokeWidth) / 2;
    final rect = Rect.fromCircle(center: center, radius: radius);

    const int totalSegments = 10;
    const double startArc = 3 * math.pi / 4;
    const double totalSweep = 3 * math.pi / 2;

    const double gapAngle = 0.07;
    final double segmentAngle = (totalSweep - (gapAngle * (totalSegments - 1))) / totalSegments;

    // Continuous fractional filled segments calculation for 60fps smooth animation
    final double continuousFilledSegments = (progress * totalSegments).clamp(0.0, totalSegments.toDouble());

    final Color trackColor = isDark
        ? const Color(0xFF27272A).withOpacity(0.4)
        : const Color(0xFFE5E7EB);

    for (int i = 0; i < totalSegments; i++) {
      final double segmentStart = startArc + i * (segmentAngle + gapAngle);
      final double ratio = i / (totalSegments - 1);
      final Color segColor = _getInterpolatedColor(ratio);

      // 1. Draw track segment background
      final Paint trackPaint = Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round
        ..color = trackColor;

      canvas.drawArc(rect, segmentStart, segmentAngle, false, trackPaint);

      // 2. Calculate continuous fractional fill ratio for this segment (0.0 to 1.0)
      final double fillRatio = (continuousFilledSegments - i).clamp(0.0, 1.0);

      if (fillRatio > 0.0) {
        final double activeSweep = segmentAngle * fillRatio;

        // Glow effect for active segment portion
        final Paint glowPaint = Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = strokeWidth + 2
          ..strokeCap = StrokeCap.round
          ..color = segColor.withOpacity(0.3 * fillRatio);

        canvas.drawArc(rect, segmentStart, activeSweep, false, glowPaint);

        // Solid filled segment portion
        final Paint fillPaint = Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = strokeWidth
          ..strokeCap = StrokeCap.round
          ..color = segColor;

        canvas.drawArc(rect, segmentStart, activeSweep, false, fillPaint);
      }
    }
  }

  Color _getInterpolatedColor(double ratio) {
    if (ratio <= 0) return segmentColors.first;
    if (ratio >= 1) return segmentColors.last;

    final double scaled = ratio * (segmentColors.length - 1);
    final int index = scaled.floor();
    final double remainder = scaled - index;

    return Color.lerp(segmentColors[index], segmentColors[index + 1], remainder)!;
  }

  @override
  bool shouldRepaint(covariant _RainbowSegmentGaugePainter oldDelegate) {
    return oldDelegate.progress != progress || oldDelegate.isDark != isDark;
  }
}
