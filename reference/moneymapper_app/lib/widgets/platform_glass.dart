import 'dart:io';
import 'dart:ui';
import 'package:flutter/material.dart';

class PlatformGlassContainer extends StatelessWidget {
  final Widget child;
  final BorderRadius? borderRadius;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final Border? border;
  final Color backgroundColor;
  final double sigma;
  final BoxShape shape;

  const PlatformGlassContainer({
    super.key,
    required this.child,
    this.borderRadius,
    this.padding,
    this.margin,
    this.border,
    required this.backgroundColor,
    this.sigma = 20.0,
    this.shape = BoxShape.rectangle,
  });

  @override
  Widget build(BuildContext context) {
    if (!Platform.isIOS) {
      // Android / Other Platform Default Material 3 Card Style
      return Container(
        padding: padding,
        margin: margin,
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: shape == BoxShape.circle ? null : borderRadius,
          shape: shape,
          border: border,
        ),
        child: child,
      );
    }

    // Determine if user has Reduced Transparency enabled via iOS settings
    final bool reduceTransparency = MediaQuery.highContrastOf(context) || 
                                    MediaQuery.of(context).accessibleNavigation;

    if (reduceTransparency) {
      // Fallback for Accessibility
      return Container(
        padding: padding,
        margin: margin,
        decoration: BoxDecoration(
          color: backgroundColor.withOpacity(1.0), // Make solid
          borderRadius: shape == BoxShape.circle ? null : borderRadius,
          shape: shape,
          border: border,
        ),
        child: child,
      );
    }

    // iOS 26+ Liquid Glass Style
    Widget glassChild = BackdropFilter(
      filter: ImageFilter.blur(sigmaX: sigma, sigmaY: sigma),
      child: Container(
        padding: padding,
        decoration: BoxDecoration(
          color: backgroundColor.withOpacity(backgroundColor.opacity * 0.5), // Tint the glass heavily
          shape: shape,
          borderRadius: shape == BoxShape.circle ? null : borderRadius,
          border: border,
        ),
        child: child,
      ),
    );

    return Container(
      margin: margin,
      child: shape == BoxShape.circle 
          ? ClipOval(child: glassChild)
          : ClipRRect(borderRadius: borderRadius ?? BorderRadius.zero, child: glassChild),
    );
  }
}
