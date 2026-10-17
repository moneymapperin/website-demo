import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppColors {
  // Brand Colors
  static const primary = Color(0xFF4F46E5);      // Deep Indigo
  static const secondary = Color(0xFF10B981);    // Emerald Success
  static const success = Color(0xFF10B981);      // Emerald Success mapping
  static const vibrantGreen = Color(0xFF00E676); // Bright Emerald Net Position Green
  static const accent = Color(0xFF8B5CF6);       // Purple Accent
  static const warning = Color(0xFFF59E0B);      // Orange Warning
  static const danger = Color(0xFFEF4444);       // Red Danger
  static const headerPurple = Color(0xFF2E1065); // Deep Royal Purple Header
  static const headerPurpleDark = Color(0xFF1E0A45);

  // Light Mode Colors
  static const background = Color(0xFFF9FAFB);   // Soft Grey/White
  static const card = Color(0xFFFFFFFF);
  static const borderLight = Color(0xFFE5E7EB);
  static const textPrimaryLight = Color(0xFF111827);
  static const textSecondaryLight = Color(0xFF4B5563);

  // Dark Mode Colors (Zinc Premium Dark Theme)
  static const darkBackground = Color(0xFF09090B); // Zinc 950
  static const darkCard = Color(0xFF0D0E15);       // Deep Dark Card Container
  static const darkBorder = Color(0xFF27272A);     // Zinc 800
  static const textPrimaryDark = Color(0xFFFAFAFA);
  static const textSecondaryDark = Color(0xFFA1A1AA);
}

class AppTheme {
  static const String _themeKey = 'theme_mode';

  // Global notifier to control dynamic switching of theme modes
  static final ValueNotifier<ThemeMode> themeModeNotifier =
      ValueNotifier(ThemeMode.system);

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final String? themeStr = prefs.getString(_themeKey);

    if (themeStr == 'dark') {
      themeModeNotifier.value = ThemeMode.dark;
    } else if (themeStr == 'light') {
      themeModeNotifier.value = ThemeMode.light;
    } else {
      themeModeNotifier.value = ThemeMode.system;
    }
  }

  static Future<void> setThemeMode(ThemeMode mode) async {
    final prefs = await SharedPreferences.getInstance();
    themeModeNotifier.value = mode;

    if (mode == ThemeMode.dark) {
      await prefs.setString(_themeKey, 'dark');
    } else if (mode == ThemeMode.light) {
      await prefs.setString(_themeKey, 'light');
    } else {
      await prefs.remove(_themeKey);
    }
  }

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      fontFamily: 'sans-serif',
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        brightness: Brightness.light,
        primary: AppColors.primary,
        secondary: AppColors.secondary,
        tertiary: AppColors.accent,
        error: AppColors.danger,
        surface: AppColors.card,
      ),
      scaffoldBackgroundColor: AppColors.background,
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      cardTheme: CardThemeData(
        color: AppColors.card,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: AppColors.borderLight, width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.borderLight),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary,
          side: const BorderSide(color: AppColors.primary, width: 1.5),
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      fontFamily: 'sans-serif',
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        brightness: Brightness.dark,
        primary: AppColors.primary,
        secondary: AppColors.secondary,
        tertiary: AppColors.accent,
        error: AppColors.danger,
        surface: AppColors.darkCard,
      ),
      scaffoldBackgroundColor: AppColors.darkBackground,
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.darkBackground,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      cardTheme: CardThemeData(
        color: AppColors.darkCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: AppColors.darkBorder, width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.darkCard,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.darkBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: Colors.white,
          side: const BorderSide(color: AppColors.darkBorder, width: 1.5),
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
      ),
    );
  }

  // Deprecated shim to maintain back-compat with existing references pointing to AppTheme.theme
  static ThemeData get theme => lightTheme;
}
