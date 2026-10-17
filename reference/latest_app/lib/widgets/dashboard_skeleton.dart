import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class ShimmerBox extends StatefulWidget {
  final double? height;
  final double? width;
  final double borderRadius;

  const ShimmerBox({
    super.key,
    this.height,
    this.width,
    this.borderRadius = 16,
  });

  @override
  State<ShimmerBox> createState() => _ShimmerBoxState();
}

class _ShimmerBoxState extends State<ShimmerBox> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    final baseColor = isDark 
        ? const Color(0xFF1F1F23) 
        : const Color(0xFFE5E7EB);
    final highlightColor = isDark 
        ? const Color(0xFF2D2D34) 
        : const Color(0xFFF3F4F6);

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Container(
          height: widget.height,
          width: widget.width,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.borderRadius),
            gradient: LinearGradient(
              colors: [baseColor, highlightColor, baseColor],
              stops: const [0.0, 0.5, 1.0],
              begin: Alignment(-2.0 + _controller.value * 4.0, -1.0),
              end: Alignment(-1.0 + _controller.value * 4.0, 1.0),
            ),
          ),
        );
      },
    );
  }
}

class DashboardSkeleton extends StatelessWidget {
  const DashboardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 16),
          // Hero Gauge Card Shimmer
          const ShimmerBox(height: 200, borderRadius: 24),
          const SizedBox(height: 24),
          
          // Section title
          const Row(
            children: [
              ShimmerBox(height: 18, width: 120),
            ],
          ),
          const SizedBox(height: 14),
          
          // Pillars Grid Shimmer
          Row(
            children: [
              Expanded(child: ShimmerBox(height: 104, borderRadius: 24)),
              const SizedBox(width: 14),
              Expanded(child: ShimmerBox(height: 104, borderRadius: 24)),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(child: ShimmerBox(height: 104, borderRadius: 24)),
              const SizedBox(width: 14),
              Expanded(child: ShimmerBox(height: 104, borderRadius: 24)),
            ],
          ),
          const SizedBox(height: 14),
          const ShimmerBox(height: 104, borderRadius: 24),
          
          const SizedBox(height: 24),
          
          // Weekly section shimmer
          const ShimmerBox(height: 140, borderRadius: 24),
        ],
      ),
    );
  }
}

class DashboardHeaderSkeleton extends StatelessWidget {
  const DashboardHeaderSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: EdgeInsets.fromLTRB(
        20,
        MediaQuery.of(context).padding.top + 16,
        20,
        24,
      ),
      color: isDark ? AppColors.darkBackground : AppColors.primary,
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height: 12,
                  width: 100,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  height: 20,
                  width: 150,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
              ],
            ),
          ),
          CircleAvatar(
            radius: 22,
            backgroundColor: Colors.white.withOpacity(0.2),
          ),
        ],
      ),
    );
  }
}