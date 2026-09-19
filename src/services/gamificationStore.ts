/**
 * Gamification Store (XP, Streaks, Badges, Baseline Fitness Score, Local Expense Score)
 * Ported 1:1 from Flutter Dart sources:
 * - reference/moneymapper_app/lib/services/xp_service.dart
 * - reference/moneymapper_app/lib/services/streak_service.dart
 * 
 * In Flutter, these values are stored in device-local SharedPreferences.
 * On web, they are stored in localStorage via this gamificationStore abstraction.
 */

import { getIsoWeekNumber } from '../models/weekly';

export interface ImprovementStats {
  baseline: number;
  difference: number;
  percentage: number;
  hasData: boolean;
}

export interface LevelInfo {
  level: number;
  minXp: number;
  maxXp: number;
  progress: number;
}

export interface GamificationStore {
  getTotalXp(): number;
  addXp(amount: number): void;
  getLevelInfo(totalXp?: number): LevelInfo;
  checkScoreImprovement(currentScore: number): void;
  getImprovementStats(currentScore: number): ImprovementStats;
  checkPillarMastery(pillarId: string, score: number): void;
  rewardBadge(badgeId: string): boolean;
  getUnlockedBadges(): string[];
  getStreak(now?: Date): number;
  updateStreak(now?: Date): void;
  getBaselineScore(): number | null;
  setBaselineScore(score: number): void;
  rewardProfileCompletion(): void;
  rewardWeeklyCheckin(): void;
  rewardStreakBonus(): void;
  getLocalExpenseScore(): number | null;
  setLocalExpenseScore(score: number): void;
}

const STORAGE_KEYS = {
  XP: 'user_total_xp',
  LAST_SCORE: 'last_known_fitness_score',
  BASELINE_SCORE: 'baseline_fitness_score',
  PROFILE_BONUS: 'profile_complete_bonus_given',
  MASTERED_PILLARS: 'mastered_pillars_list',
  UNLOCKED_BADGES: 'unlocked_badges_list',
  STREAK_COUNT: 'streak_count_weekly',
  LAST_ACTION_WEEK: 'last_action_week_v2',
  LAST_ACTION_YEAR: 'last_action_year_v2',
  LAST_STREAK_BONUS_WEEK: 'last_streak_bonus_week',
  LOCAL_EXPENSE_SCORE: 'local_expense_score',
} as const;

export class LocalStorageGamificationStore implements GamificationStore {
  private readonly thresholds = [0, 300, 700, 1200, 2000, 3000, 4200, 5600];

  private getItem(key: string): string | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private setItem(key: string, value: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore storage write errors (e.g. quota or sandbox)
    }
  }

  private getInt(key: string, defaultVal: number): number {
    const raw = this.getItem(key);
    if (raw === null || raw === undefined) return defaultVal;
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) ? defaultVal : parsed;
  }

  // --- XP Methods (xp_service.dart) ---

  getTotalXp(): number {
    return this.getInt(STORAGE_KEYS.XP, 0);
  }

  addXp(amount: number): void {
    if (amount <= 0) return;
    const current = this.getTotalXp();
    this.setItem(STORAGE_KEYS.XP, (current + amount).toString());
  }

  getLevelInfo(totalXp?: number): LevelInfo {
    const xp = totalXp !== undefined ? totalXp : this.getTotalXp();
    let level = 1;
    let minXp = 0;
    let maxXp = this.thresholds[1];

    for (let i = 1; i < this.thresholds.length; i++) {
      if (xp >= this.thresholds[i]) {
        level = i + 1;
        minXp = this.thresholds[i];
        maxXp = i + 1 < this.thresholds.length ? this.thresholds[i + 1] : this.thresholds[i] + 2000;
      } else {
        minXp = this.thresholds[i - 1];
        maxXp = this.thresholds[i];
        break;
      }
    }

    const progress = maxXp > minXp ? (xp - minXp) / (maxXp - minXp) : 0;
    return {
      level,
      minXp,
      maxXp,
      progress: Math.max(0, Math.min(1, progress)),
    };
  }

  rewardWeeklyCheckin(): void {
    this.addXp(50);
  }

  rewardStreakBonus(): void {
    this.addXp(150);
  }

  checkScoreImprovement(currentScore: number): void {
    const rawLast = this.getItem(STORAGE_KEYS.LAST_SCORE);
    const lastScore = rawLast ? parseFloat(rawLast) || 0 : 0;

    if (currentScore > lastScore) {
      const diff = Math.floor(currentScore - lastScore);
      if (diff > 0) {
        this.addXp(diff * 10);
      }
    }
    this.setItem(STORAGE_KEYS.LAST_SCORE, currentScore.toString());

    if (this.getItem(STORAGE_KEYS.BASELINE_SCORE) === null && currentScore > 0) {
      this.setItem(STORAGE_KEYS.BASELINE_SCORE, currentScore.toString());
    }
  }

  getImprovementStats(currentScore: number): ImprovementStats {
    const rawBaseline = this.getItem(STORAGE_KEYS.BASELINE_SCORE);
    const hasData = rawBaseline !== null;
    const baseline = hasData ? parseFloat(rawBaseline) || currentScore : currentScore;

    const diff = currentScore - baseline;
    const percentage = baseline > 0 ? (diff / baseline) * 100 : 0.0;

    return {
      baseline,
      difference: diff,
      percentage,
      hasData,
    };
  }

  getBaselineScore(): number | null {
    const raw = this.getItem(STORAGE_KEYS.BASELINE_SCORE);
    return raw !== null ? parseFloat(raw) : null;
  }

  setBaselineScore(score: number): void {
    this.setItem(STORAGE_KEYS.BASELINE_SCORE, score.toString());
  }

  checkPillarMastery(pillarId: string, score: number): void {
    if (score < 100) return;
    const raw = this.getItem(STORAGE_KEYS.MASTERED_PILLARS);
    const mastered: string[] = raw ? JSON.parse(raw) : [];

    if (!mastered.includes(pillarId)) {
      mastered.push(pillarId);
      this.setItem(STORAGE_KEYS.MASTERED_PILLARS, JSON.stringify(mastered));
      this.addXp(100);
    }
  }

  rewardBadge(badgeId: string): boolean {
    const raw = this.getItem(STORAGE_KEYS.UNLOCKED_BADGES);
    const unlocked: string[] = raw ? JSON.parse(raw) : [];

    if (!unlocked.includes(badgeId)) {
      unlocked.push(badgeId);
      this.setItem(STORAGE_KEYS.UNLOCKED_BADGES, JSON.stringify(unlocked));
      this.addXp(100);
      return true;
    }
    return false;
  }

  getUnlockedBadges(): string[] {
    const raw = this.getItem(STORAGE_KEYS.UNLOCKED_BADGES);
    return raw ? JSON.parse(raw) : [];
  }

  rewardProfileCompletion(): void {
    const alreadyRewarded = this.getItem(STORAGE_KEYS.PROFILE_BONUS) === 'true';
    if (!alreadyRewarded) {
      this.addXp(200);
      this.setItem(STORAGE_KEYS.PROFILE_BONUS, 'true');
    }
  }

  // --- Streak Methods (streak_service.dart 1:1) ---

  private _isSameWeek(lastW: number, lastY: number, curW: number, curY: number): boolean {
    return lastW === curW && lastY === curY;
  }

  private _isNextWeek(lastW: number, lastY: number, curW: number, curY: number): boolean {
    if (curY === lastY) {
      return curW === lastW + 1;
    } else if (curY === lastY + 1) {
      // Year rollover (simplistic check for Week 52/53 to Week 1)
      return lastW >= 52 && curW === 1;
    }
    return false;
  }

  private _isGraceWeek(lastW: number, lastY: number, curW: number, curY: number): boolean {
    if (curY === lastY) {
      return curW === lastW + 2;
    } else if (curY === lastY + 1) {
      // Rollover: last=52, skip=1, cur=2 OR last=51, skip=52, cur=1
      return (lastW === 52 && curW === 2) || (lastW === 51 && curW === 1);
    }
    return false;
  }

  private _checkAndResetStreak(now: Date): void {
    const lastWeek = this.getInt(STORAGE_KEYS.LAST_ACTION_WEEK, -1);
    const lastYear = this.getInt(STORAGE_KEYS.LAST_ACTION_YEAR, -1);

    if (lastWeek === -1) return;

    const currentWeek = getIsoWeekNumber(now);
    const currentYear = now.getFullYear();

    // Same week? No reset.
    if (this._isSameWeek(lastWeek, lastYear, currentWeek, currentYear)) return;

    // Consecutive week? No reset (waiting for action).
    if (this._isNextWeek(lastWeek, lastYear, currentWeek, currentYear)) return;

    // Grace week? No reset yet (Frozen status).
    if (this._isGraceWeek(lastWeek, lastYear, currentWeek, currentYear)) return;

    // Missed more than 1 week? Reset to 0.
    this.setItem(STORAGE_KEYS.STREAK_COUNT, '0');
    this.setItem(STORAGE_KEYS.LAST_ACTION_WEEK, '-1');
    this.setItem(STORAGE_KEYS.LAST_ACTION_YEAR, '-1');
  }

  getStreak(now: Date = new Date()): number {
    this._checkAndResetStreak(now);
    return this.getInt(STORAGE_KEYS.STREAK_COUNT, 0);
  }

  updateStreak(now: Date = new Date()): void {
    const currentWeek = getIsoWeekNumber(now);
    const currentYear = now.getFullYear();

    const lastWeek = this.getInt(STORAGE_KEYS.LAST_ACTION_WEEK, -1);
    const lastYear = this.getInt(STORAGE_KEYS.LAST_ACTION_YEAR, -1);

    // If an action was already performed this week, do nothing.
    if (currentWeek === lastWeek && currentYear === lastYear) {
      return;
    }

    let currentStreak = this.getInt(STORAGE_KEYS.STREAK_COUNT, 0);

    // If it's the first time or we are resuming after a reset
    if (lastWeek === -1) {
      currentStreak = 1;
    } else if (this._isNextWeek(lastWeek, lastYear, currentWeek, currentYear)) {
      // Performed action in the consecutive week
      currentStreak++;
    } else if (this._isGraceWeek(lastWeek, lastYear, currentWeek, currentYear)) {
      // Performed action after skipping exactly one week (Grace week / Freeze)
      currentStreak++;
    } else {
      // Too much time passed (missed more than 1 week), reset to 1
      currentStreak = 1;
    }

    this.setItem(STORAGE_KEYS.STREAK_COUNT, currentStreak.toString());
    this.setItem(STORAGE_KEYS.LAST_ACTION_WEEK, currentWeek.toString());
    this.setItem(STORAGE_KEYS.LAST_ACTION_YEAR, currentYear.toString());

    // Reward Streak Bonus (150 XP) if streak is 4+ weeks, at most once per week
    if (currentStreak >= 4) {
      const lastBonusWeek = this.getInt(STORAGE_KEYS.LAST_STREAK_BONUS_WEEK, -1);
      if (lastBonusWeek !== currentWeek) {
        this.rewardStreakBonus();
        this.setItem(STORAGE_KEYS.LAST_STREAK_BONUS_WEEK, currentWeek.toString());
      }
    }
  }

  // --- Local Expense Score Override (dashboard_screen.dart lines ~284-306) ---

  getLocalExpenseScore(): number | null {
    const raw = this.getItem(STORAGE_KEYS.LOCAL_EXPENSE_SCORE);
    if (raw === null || raw === undefined || raw === '') return null;
    const parsed = parseFloat(raw);
    return isNaN(parsed) ? null : parsed;
  }

  setLocalExpenseScore(score: number): void {
    this.setItem(STORAGE_KEYS.LOCAL_EXPENSE_SCORE, score.toString());
  }
}

export const gamificationStore: GamificationStore = new LocalStorageGamificationStore();
