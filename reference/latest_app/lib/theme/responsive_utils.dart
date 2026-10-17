import 'package:flutter/material.dart';

extension ResponsiveUtils on BuildContext {
  double get screenWidth => MediaQuery.of(this).size.width;
  double get screenHeight => MediaQuery.of(this).size.height;

  double wp(double percentage) => screenWidth * (percentage / 100);
  double hp(double percentage) => screenHeight * (percentage / 100);

  // Responsive padding based on screen width
  double get paddingSmall => wp(2).clamp(6.0, 12.0);
  double get paddingMedium => wp(4).clamp(12.0, 20.0);
  double get paddingLarge => wp(6).clamp(20.0, 32.0);

  // Safe area insets
  double get safeTop => MediaQuery.of(this).padding.top;
  double get safeBottom => MediaQuery.of(this).padding.bottom;

  // Auto adaptive screen padding for all Android brands & iOS notch/island/chin displays
  EdgeInsets get adaptiveScreenPadding => EdgeInsets.fromLTRB(
    wp(4.5).clamp(14.0, 24.0),
    (safeTop + 8.0).clamp(16.0, 48.0),
    wp(4.5).clamp(14.0, 24.0),
    (safeBottom + 16.0).clamp(16.0, 36.0),
  );

  // Helper for responsive font sizes with strict clamping (0.85x to 1.25x)
  double sp(double size) {
    double scale = (screenWidth / 375).clamp(0.85, 1.25);
    return size * scale;
  }
}
