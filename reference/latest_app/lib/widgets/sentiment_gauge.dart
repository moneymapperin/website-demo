import 'dart:math' as math;
import 'package:flutter/material.dart';

class SentimentGauge extends StatefulWidget {
  final double value; // 0 to 100
  final double size;
  final bool enableWiggle;

  const SentimentGauge({
    super.key,
    required this.value,
    this.size = 200,
    this.enableWiggle = true,
  });

  @override
  State<SentimentGauge> createState() => _SentimentGaugeState();
}

class _SentimentGaugeState extends State<SentimentGauge> with TickerProviderStateMixin {
  late AnimationController _entryController;
  late Animation<double> _entryAnimation;

  late AnimationController _wiggleController;
  late Animation<double> _wiggleAnimation;

  bool _isRouteCurrent = true;

  @override
  void initState() {
    super.initState();

    // 1. Initial Entry Animation (Sweep from 0 to target)
    _entryController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );

    _entryAnimation = Tween<double>(begin: 0, end: widget.value).animate(
      CurvedAnimation(parent: _entryController, curve: Curves.elasticOut),
    );

    // 2. Continuous Wiggle Animation (Subtle idle oscillation)
    _wiggleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    );

    _wiggleAnimation = Tween<double>(begin: -1.2, end: 1.2).animate(
      CurvedAnimation(parent: _wiggleController, curve: Curves.easeInOutSine),
    );

    _entryController.forward();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final route = ModalRoute.of(context);
    final isCurrent = route?.isCurrent ?? true;
    final tickerEnabled = TickerMode.of(context);

    _isRouteCurrent = isCurrent && tickerEnabled;
    _updateWiggleState();
  }

  void _updateWiggleState() {
    if (widget.enableWiggle && _isRouteCurrent) {
      if (!_wiggleController.isAnimating) {
        _wiggleController.repeat(reverse: true);
      }
    } else {
      if (_wiggleController.isAnimating) {
        _wiggleController.stop();
      }
    }
  }

  @override
  void didUpdateWidget(SentimentGauge oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.value != widget.value) {
      _entryAnimation = Tween<double>(begin: _entryAnimation.value, end: widget.value).animate(
        CurvedAnimation(parent: _entryController, curve: Curves.easeOutCubic),
      );
      _entryController.forward(from: 0);
    }

    if (oldWidget.enableWiggle != widget.enableWiggle) {
      _updateWiggleState();
    }
  }

  @override
  void dispose() {
    _entryController.dispose();
    _wiggleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: Listenable.merge([_entryController, _wiggleController]),
      builder: (context, child) {
        final double displayValue = _entryAnimation.value + (_wiggleController.isAnimating ? _wiggleAnimation.value : 0.0);
        return Center(
          child: SizedBox(
            width: widget.size,
            height: widget.size * 0.55,
            child: RepaintBoundary(
              child: CustomPaint(
                painter: _SentimentGaugePainter(value: displayValue),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _SentimentGaugePainter extends CustomPainter {
  final double value;
  _SentimentGaugePainter({required this.value});

  @override
  void paint(Canvas canvas, Size size) {
    // 1. Calculate Center and Radius based on the actual provided size
    final center = Offset(size.width / 2, size.height * 0.9);
    final radius = size.width * 0.42;
    final strokeWidth = size.width * 0.14;

    final rect = Rect.fromCircle(center: center, radius: radius);

    // 2. Draw 5 colored segments (Perfect semi-circle)
    final colors = [
      const Color(0xFFEF4444), // Red
      const Color(0xFFF97316), // Orange
      const Color(0xFFEAB308), // Yellow
      const Color(0xFF84CC16), // Light Green
      const Color(0xFF22C55E), // Green
    ];

    const double totalSweep = math.pi;
    const double segmentSweep = totalSweep / 5;

    for (int i = 0; i < 5; i++) {
      final paint = Paint()
        ..color = colors[i]
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.butt;

      // Start from 180 degrees (left) and move clockwise to 0 degrees (right)
      canvas.drawArc(rect, math.pi + (i * segmentSweep), segmentSweep, false, paint);
    }

    // 3. Draw POOR and GOOD labels
    const labelStyle = TextStyle(
      color: Colors.grey,
      fontSize: 10,
      fontWeight: FontWeight.w900,
      letterSpacing: 0.5,
    );

    _drawCenteredText(canvas, "POOR", Offset(center.dx - radius, center.dy + 15), labelStyle);
    _drawCenteredText(canvas, "GOOD", Offset(center.dx + radius, center.dy + 15), labelStyle);

    // 4. Draw Needle with Shadow
    final double clampedValue = value.clamp(0.0, 100.0);
    final double angle = math.pi + (clampedValue / 100 * math.pi);
    final needleLength = radius * 0.9;

    final needleEndPoint = Offset(
      center.dx + needleLength * math.cos(angle),
      center.dy + needleLength * math.sin(angle),
    );

    // Needle Base Shadow
    canvas.drawCircle(center, 14, Paint()..color = Colors.black.withOpacity(0.1)..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3));

    // Actual Needle
    final needlePaint = Paint()
      ..color = Colors.black87
      ..strokeWidth = 5
      ..strokeCap = StrokeCap.round;

    canvas.drawLine(center, needleEndPoint, needlePaint);

    // Center Pivot Decoration
    canvas.drawCircle(center, 11, Paint()..color = Colors.grey.shade400);
    canvas.drawCircle(center, 6, Paint()..color = Colors.black);
  }

  void _drawCenteredText(Canvas canvas, String text, Offset position, TextStyle style) {
    final textPainter = TextPainter(
      text: TextSpan(text: text, style: style),
      textDirection: TextDirection.ltr,
    )..layout();

    final Offset drawOffset = Offset(
      position.dx - (textPainter.width / 2),
      position.dy,
    );

    textPainter.paint(canvas, drawOffset);
  }

  @override
  bool shouldRepaint(covariant _SentimentGaugePainter oldDelegate) {
    return oldDelegate.value != value;
  }
}
