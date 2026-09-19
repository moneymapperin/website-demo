import 'package:shared_preferences/shared_preferences.dart';

class XpService {
  static const _xpKey = 'user_total_xp';
  static const _lastScoreKey = 'last_known_fitness_score';
  static const _baselineScoreKey = 'baseline_fitness_score';
  static const _profileBonusKey = 'profile_complete_bonus_given';
  static const _masteredPillarsKey = 'mastered_pillars_list';
  static const _unlockedBadgesKey = 'unlocked_badges_list';

  // Level Thresholds
  final List<int> _thresholds = [0, 300, 700, 1200, 2000, 3000, 4200, 5600];

  Future<int> getTotalXp() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt(_xpKey) ?? 0;
  }

  Map<String, dynamic> getLevelInfo(int totalXp) {
    int level = 1;
    int minXp = 0;
    int maxXp = _thresholds[1];

    for (int i = 1; i < _thresholds.length; i++) {
      if (totalXp >= _thresholds[i]) {
        level = i + 1;
        minXp = _thresholds[i];
        maxXp = (i + 1 < _thresholds.length) ? _thresholds[i + 1] : _thresholds[i] + 2000;
      } else {
        minXp = _thresholds[i - 1];
        maxXp = _thresholds[i];
        break;
      }
    }

    double progress = (totalXp - minXp) / (maxXp - minXp);
    return {
      'level': level,
      'minXp': minXp,
      'maxXp': maxXp,
      'progress': progress.clamp(0.0, 1.0),
    };
  }

  Future<void> addXp(int amount) async {
    if (amount <= 0) return;
    final prefs = await SharedPreferences.getInstance();
    int currentXp = prefs.getInt(_xpKey) ?? 0;
    await prefs.setInt(_xpKey, currentXp + amount);
  }

  // Action: Master Profile Complete (200 XP)
  Future<void> rewardProfileCompletion() async {
    final prefs = await SharedPreferences.getInstance();
    bool alreadyRewarded = prefs.getBool(_profileBonusKey) ?? false;
    if (!alreadyRewarded) {
      await addXp(200);
      await prefs.setBool(_profileBonusKey, true);
    }
  }

  // Action: Weekly Check-in (50 XP)
  Future<void> rewardWeeklyCheckin() async {
    await addXp(50);
  }

  // Action: Score Improvement (10 XP per point)
  Future<void> checkScoreImprovement(double currentScore) async {
    final prefs = await SharedPreferences.getInstance();
    double lastScore = prefs.getDouble(_lastScoreKey) ?? 0.0;

    if (currentScore > lastScore) {
      int diff = (currentScore - lastScore).floor();
      if (diff > 0) {
        await addXp(diff * 10);
      }
    }
    await prefs.setDouble(_lastScoreKey, currentScore);

    // Save baseline score if not exists (for first-time comparison)
    if (prefs.getDouble(_baselineScoreKey) == null && currentScore > 0) {
      await prefs.setDouble(_baselineScoreKey, currentScore);
    }
  }

  Future<Map<String, dynamic>> getImprovementStats(double currentScore) async {
    final prefs = await SharedPreferences.getInstance();
    final double baseline = prefs.getDouble(_baselineScoreKey) ?? currentScore;

    double diff = currentScore - baseline;
    double percentage = 0.0;

    if (baseline > 0) {
      percentage = (diff / baseline) * 100;
    }

    return {
      'baseline': baseline,
      'difference': diff,
      'percentage': percentage,
      'hasData': prefs.getDouble(_baselineScoreKey) != null,
    };
  }

  // Action: Recommendation Complete (100 XP)
  Future<void> rewardRecommendationComplete() async {
    await addXp(100);
  }

  // Action: Pillar Mastery (100 XP)
  Future<void> checkPillarMastery(String pillarId, double score) async {
    if (score < 100) return;
    final prefs = await SharedPreferences.getInstance();
    List<String> mastered = prefs.getStringList(_masteredPillarsKey) ?? [];

    if (!mastered.contains(pillarId)) {
      mastered.add(pillarId);
      await prefs.setStringList(_masteredPillarsKey, mastered);
      await addXp(100);
    }
  }

  // Action: Streak Bonus (150 XP)
  // To be called from StreakService when it hits 4 weeks
  Future<void> rewardStreakBonus() async {
    await addXp(150);
  }

  // Action: Badge Reward (100 XP per badge)
  Future<bool> rewardBadge(String badgeId) async {
    final prefs = await SharedPreferences.getInstance();
    List<String> unlocked = prefs.getStringList(_unlockedBadgesKey) ?? [];

    if (!unlocked.contains(badgeId)) {
      unlocked.add(badgeId);
      await prefs.setStringList(_unlockedBadgesKey, unlocked);
      await addXp(100);
      return true; // Newly unlocked
    }
    return false; // Already unlocked
  }

  Future<List<String>> getUnlockedBadges() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getStringList(_unlockedBadgesKey) ?? [];
  }
}
