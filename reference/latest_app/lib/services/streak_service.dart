import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';
import 'xp_service.dart';

class StreakService {
  static const _streakKey = 'streak_count_weekly';
  static const _lastActionWeekKey = 'last_action_week_v2';
  static const _lastActionYearKey = 'last_action_year_v2';
  static const _lastStreakBonusWeekKey = 'last_streak_bonus_week';

  final XpService _xpService = XpService();

  /// Returns the current streak count.
  /// It also checks if the streak should be reset due to inactivity.
  Future<int> getStreak() async {
    final prefs = await SharedPreferences.getInstance();
    await _checkAndResetStreak(prefs);
    return prefs.getInt(_streakKey) ?? 0;
  }

  /// Updates the streak when a meaningful action is performed.
  Future<void> updateStreak() async {
    final prefs = await SharedPreferences.getInstance();
    final now = DateTime.now();
    final currentWeek = _getWeekNumber(now);
    final currentYear = now.year;

    final lastWeek = prefs.getInt(_lastActionWeekKey) ?? -1;
    final lastYear = prefs.getInt(_lastActionYearKey) ?? -1;

    // If an action was already performed this week, do nothing.
    if (currentWeek == lastWeek && currentYear == lastYear) {
      return;
    }

    int currentStreak = prefs.getInt(_streakKey) ?? 0;

    // If it's the first time or we are resuming after a reset
    if (lastWeek == -1) {
      currentStreak = 1;
    } else if (_isNextWeek(lastWeek, lastYear, currentWeek, currentYear)) {
      // Performed action in the consecutive week
      currentStreak++;
    } else if (_isGraceWeek(lastWeek, lastYear, currentWeek, currentYear)) {
      // Performed action after skipping exactly one week (Grace week / Freeze)
      // We resume the streak by incrementing it.
      currentStreak++;
    } else {
      // Too much time passed (missed more than 1 week), reset to 1
      currentStreak = 1;
    }

    await prefs.setInt(_streakKey, currentStreak);
    await prefs.setInt(_lastActionWeekKey, currentWeek);
    await prefs.setInt(_lastActionYearKey, currentYear);

    // Reward Streak Bonus (150 XP) if streak is 4+ weeks
    if (currentStreak >= 4) {
      int lastBonusWeek = prefs.getInt(_lastStreakBonusWeekKey) ?? -1;
      if (lastBonusWeek != currentWeek) {
        await _xpService.rewardStreakBonus();
        await prefs.setInt(_lastStreakBonusWeekKey, currentWeek);
      }
    }
  }

  /// Resets the streak if the user has been inactive for more than the grace period.
  Future<void> _checkAndResetStreak(SharedPreferences prefs) async {
    final lastWeek = prefs.getInt(_lastActionWeekKey) ?? -1;
    final lastYear = prefs.getInt(_lastActionYearKey) ?? -1;

    if (lastWeek == -1) return;

    final now = DateTime.now();
    final currentWeek = _getWeekNumber(now);
    final currentYear = now.year;

    // Same week? No reset.
    if (_isSameWeek(lastWeek, lastYear, currentWeek, currentYear)) return;

    // Consecutive week? No reset (waiting for action).
    if (_isNextWeek(lastWeek, lastYear, currentWeek, currentYear)) return;

    // Grace week? No reset yet (Duolingo style "Frozen" status).
    if (_isGraceWeek(lastWeek, lastYear, currentWeek, currentYear)) return;

    // Missed more than 1 week? Reset.
    await prefs.setInt(_streakKey, 0);
    await prefs.setInt(_lastActionWeekKey, -1);
    await prefs.setInt(_lastActionYearKey, -1);
  }

  bool _isSameWeek(int lastW, int lastY, int curW, int curY) {
    return lastW == curW && lastY == curY;
  }

  bool _isNextWeek(int lastW, int lastY, int curW, int curY) {
    if (curY == lastY) {
      return curW == lastW + 1;
    } else if (curY == lastY + 1) {
      // Year rollover (simplistic check for Week 52/53 to Week 1)
      return (lastW >= 52 && curW == 1);
    }
    return false;
  }

  bool _isGraceWeek(int lastW, int lastY, int curW, int curY) {
    if (curY == lastY) {
      return curW == lastW + 2;
    } else if (curY == lastY + 1) {
      // Rollover: last=52, skip=1, cur=2
      return (lastW == 52 && curW == 2) || (lastW == 51 && curW == 1);
    }
    return false;
  }

  /// ISO 8601 week number using intl package
  int _getWeekNumber(DateTime date) {
    // Week number calculation
    // Find the day of the year
    int dayOfYear = int.parse(DateFormat("D").format(date));
    // Determine the week number
    int weekNumber = ((dayOfYear - date.weekday + 10) / 7).floor();

    if (weekNumber < 1) {
      weekNumber = _getWeekNumber(DateTime(date.year - 1, 12, 31));
    } else if (weekNumber > 52) {
      if (DateTime(date.year, 12, 31).weekday < DateTime.thursday) {
        weekNumber = 1;
      }
    }
    return weekNumber;
  }
}
