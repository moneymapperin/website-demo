import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class PillarCard extends StatefulWidget {
  final String title;
  final double score;
  final Color? barColor;
  final bool fullWidth;
  final VoidCallback? onTap;
  final bool isLocked;
  final bool showScore;
  final bool showProgress;
  final bool showTitle;
  final String? imagePath;
  final bool vertical;
  final IconData? backgroundIcon;
  final String? emoji;

  const PillarCard({
    super.key,
    required this.title,
    required this.score,
    this.barColor,
    this.fullWidth = false,
    this.onTap,
    this.isLocked = false,
    this.showScore = true,
    this.showProgress = true,
    this.showTitle = true,
    this.imagePath,
    this.vertical = false,
    this.backgroundIcon,
    this.emoji,
  });

  @override
  State<PillarCard> createState() => _PillarCardState();
}

class _PillarCardState extends State<PillarCard> {
  bool _isHovered = false;

  Color _progressColor(double s) {
    if (widget.barColor != null) return widget.barColor!;
    if (s < 40) return AppColors.danger;
    if (s <= 70) return AppColors.warning;
    return AppColors.success;
  }

  @override
  Widget build(BuildContext context) {
    final progress = (widget.score.clamp(0, 100)) / 100;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final titleColor = isDark ? Colors.white : const Color(0xFF18181B);

    final cardBgColor = isDark ? AppColors.darkCard : const Color(0xFFF3F7FC);

    return GestureDetector(
      onTapDown: (_) => setState(() => _isHovered = true),
      onTapUp: (_) => setState(() => _isHovered = false),
      onTapCancel: () => setState(() => _isHovered = false),
      onTap: widget.isLocked ? () {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Upgrade to PRO to unlock this pillar! 🚀"),
            backgroundColor: AppColors.accent,
          ),
        );
      } : widget.onTap,
      child: AnimatedScale(
        scale: _isHovered ? 0.97 : 1.0,
        duration: const Duration(milliseconds: 100),
        curve: Curves.easeOut,
        child: Container(
          width: widget.fullWidth ? double.infinity : null,
          constraints: const BoxConstraints(minHeight: 125),
          decoration: BoxDecoration(
            color: cardBgColor,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: isDark ? AppColors.darkBorder : AppColors.borderLight,
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: isDark 
                    ? Colors.black.withOpacity(0.3) 
                    : AppColors.primary.withOpacity(0.04),
                blurRadius: 16,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: Stack(
              children: [
                // 1. Background Image
                if (widget.imagePath != null)
                  Positioned(
                    right: -15,
                    bottom: -15,
                    child: Opacity(
                      opacity: widget.showTitle ? 0.35 : 1.0,
                      child: Image.asset(
                        widget.imagePath!,
                        height: 85,
                        fit: BoxFit.contain,
                        filterQuality: FilterQuality.high,
                      ),
                    ),
                  ),

                // 2. Background Icon & Emoji Overlay
                if (widget.backgroundIcon != null && widget.showTitle)
                  Positioned(
                    right: -10,
                    bottom: -10,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        Opacity(
                          opacity: isDark ? 0.05 : 0.08,
                          child: Icon(
                            widget.backgroundIcon,
                            size: 90,
                            color: isDark ? Colors.white : AppColors.primary,
                          ),
                        ),
                        if (widget.emoji != null)
                          Padding(
                            padding: const EdgeInsets.only(right: 15, bottom: 15),
                            child: Text(
                              widget.emoji!,
                              style: const TextStyle(fontSize: 28),
                            ),
                          ),
                      ],
                    ),
                  ),

                // 3. Text Overlay
                if (widget.showTitle || widget.showScore)
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: widget.vertical
                        ? Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.start,
                            children: [
                              if (widget.showTitle)
                                Text(
                                  widget.title,
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w900,
                                    color: titleColor,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              if (widget.showScore) ...[
                                const SizedBox(height: 6),
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    FittedBox(
                                      child: Text(
                                        widget.isLocked ? '??' : widget.score.round().toString(),
                                        style: TextStyle(
                                          fontSize: 22,
                                          fontWeight: FontWeight.w900,
                                          color: titleColor,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    Padding(
                                      padding: const EdgeInsets.only(bottom: 3),
                                      child: Text(
                                        'SCORE',
                                        style: TextStyle(
                                          fontSize: 9,
                                          fontWeight: FontWeight.bold,
                                          color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                              if (widget.showProgress) ...[
                                const SizedBox(height: 8),
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(6),
                                  child: LinearProgressIndicator(
                                    value: widget.isLocked ? 0 : progress,
                                    minHeight: 6,
                                    backgroundColor: isDark ? const Color(0xFF27272A) : const Color(0xFFF3F4F6),
                                    valueColor: AlwaysStoppedAnimation<Color>(_progressColor(widget.score)),
                                  ),
                                ),
                              ],
                            ],
                          )
                        : Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              if (widget.showTitle)
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      widget.title,
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w900,
                                        color: titleColor,
                                      ),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    if (widget.showProgress) ...[
                                      const SizedBox(height: 4),
                                      SizedBox(
                                        width: 75,
                                        child: ClipRRect(
                                          borderRadius: BorderRadius.circular(6),
                                          child: LinearProgressIndicator(
                                            value: widget.isLocked ? 0 : progress,
                                            minHeight: 5,
                                            backgroundColor: isDark ? const Color(0xFF27272A) : const Color(0xFFF3F4F6),
                                            valueColor: AlwaysStoppedAnimation<Color>(_progressColor(widget.score)),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              if (widget.showScore)
                                Column(
                                  mainAxisSize: MainAxisSize.min,
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    FittedBox(
                                      child: Text(
                                        widget.isLocked ? '??' : widget.score.round().toString(),
                                        style: TextStyle(
                                          fontSize: 20,
                                          fontWeight: FontWeight.w900,
                                          color: titleColor,
                                        ),
                                      ),
                                    ),
                                    Text(
                                      'SCORE',
                                      style: TextStyle(
                                        fontSize: 9,
                                        fontWeight: FontWeight.bold,
                                        color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ],
                                ),
                            ],
                          ),
                  ),

                // 4. Lock Overlay
                if (widget.isLocked)
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.4),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.lock_rounded, size: 14, color: Colors.white),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
