import 'package:flutter/material.dart';

class SparklineChart extends StatelessWidget {
  final List<double> dataPoints;
  final double width;
  final double height;
  final Color lineColor;
  final Color nodeColor;

  const SparklineChart({
    super.key,
    this.dataPoints = const [15, 28, 22, 38, 30, 48, 42, 65, 58, 82, 72, 95],
    this.width = 140,
    this.height = 70,
    this.lineColor = const Color(0xFFA855F7),
    this.nodeColor = const Color(0xFFC084FC),
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      height: height,
      child: CustomPaint(
        painter: _SparklinePainter(
          dataPoints: dataPoints,
          lineColor: lineColor,
          nodeColor: nodeColor,
        ),
      ),
    );
  }
}

class _SparklinePainter extends CustomPainter {
  final List<double> dataPoints;
  final Color lineColor;
  final Color nodeColor;

  _SparklinePainter({
    required this.dataPoints,
    required this.lineColor,
    required this.nodeColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (dataPoints.length < 2) return;

    final double minVal = dataPoints.reduce((a, b) => a < b ? a : b);
    final double maxVal = dataPoints.reduce((a, b) => a > b ? a : b);
    final double range = (maxVal - minVal) == 0 ? 1 : (maxVal - minVal);

    final double stepX = size.width / (dataPoints.length - 1);
    final List<Offset> points = [];

    for (int i = 0; i < dataPoints.length; i++) {
      final double x = i * stepX;
      // Invert Y so higher values are higher up on screen
      final double normalizedY = (dataPoints[i] - minVal) / range;
      final double y = size.height - (normalizedY * (size.height - 12)) - 6;
      points.add(Offset(x, y));
    }

    final Path path = Path();
    path.moveTo(points[0].dx, points[0].dy);

    for (int i = 0; i < points.length - 1; i++) {
      final p0 = points[i];
      final p1 = points[i + 1];
      final controlX = (p0.dx + p1.dx) / 2;
      path.cubicTo(
        controlX, p0.dy,
        controlX, p1.dy,
        p1.dx, p1.dy,
      );
    }

    // 1. Draw Area Gradient Fill under the line
    final Path fillPath = Path.from(path)
      ..lineTo(points.last.dx, size.height)
      ..lineTo(points.first.dx, size.height)
      ..close();

    final Paint fillPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          lineColor.withOpacity(0.35),
          lineColor.withOpacity(0.0),
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));

    canvas.drawPath(fillPath, fillPaint);

    // 2. Draw Smooth Bezier Wave Line
    final Paint linePaint = Paint()
      ..color = lineColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    canvas.drawPath(path, linePaint);

    // 3. Draw Glowing Node Dots on key peak points (e.g., indices 3, 7, and last)
    final List<int> keyNodeIndices = [3, 7, points.length - 1];

    for (int index in keyNodeIndices) {
      if (index < points.length) {
        final pos = points[index];

        // Glow Shadow
        canvas.drawCircle(
          pos,
          6,
          Paint()..color = lineColor.withOpacity(0.5),
        );

        // Core Dot
        canvas.drawCircle(
          pos,
          3.5,
          Paint()..color = nodeColor,
        );

        // Inner White Center
        canvas.drawCircle(
          pos,
          1.5,
          Paint()..color = Colors.white,
        );
      }
    }
  }

  @override
  bool shouldRepaint(covariant _SparklinePainter oldDelegate) {
    return oldDelegate.dataPoints != dataPoints ||
        oldDelegate.lineColor != lineColor;
  }
}
