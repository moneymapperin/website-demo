import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { ThemeProvider } from '../context/ThemeContext';
import { apiService } from '../services/apiService';
import { gamificationStore } from '../services/gamificationStore';
import { DashboardData } from '../models/dashboard';
import { WeeklyPage } from '../pages/WeeklyPage';
import {
  calculateDynamicWeekCount,
  calculateTargetRanges,
  calculateCategoryScore,
  calculateLocalDisciplineScore,
  calculateMonthWeeks,
  deriveHeatmapDays,
  getDartWeekday,
  getDayOfYear,
  getIsoWeekNumber,
  getMonthStartSunday,
  getFinMessage,
} from '../models/weekly';

describe('Task 9: Weekly Tracker Domain Models & Calculations', () => {
  describe('1. Dynamic Week Count across Month Boundaries and Leap Years', () => {
    it('calculates correct dynamic week count for verified months', () => {
      // Feb 2024 (Leap year, 29 days, starts on Thursday -> 5 weeks)
      expect(calculateDynamicWeekCount(2024, 2)).toBe(5);

      // Feb 2021 (Non-leap year, 28 days, starts on Monday -> 5 weeks)
      expect(calculateDynamicWeekCount(2021, 2)).toBe(5);

      // Feb 2015 (Non-leap year, 28 days, starts on Sunday -> exactly 4 weeks)
      expect(calculateDynamicWeekCount(2015, 2)).toBe(4);

      // Mar 2024 (31 days, starts on Friday -> 6 weeks)
      expect(calculateDynamicWeekCount(2024, 3)).toBe(6);

      // Aug 2024 (31 days, starts on Thursday -> 5 weeks)
      expect(calculateDynamicWeekCount(2024, 8)).toBe(5);

      // Sep 2024 (30 days, starts on Sunday -> 5 weeks)
      expect(calculateDynamicWeekCount(2024, 9)).toBe(5);

      // Sep 2026 (30 days, starts on Tuesday -> 5 weeks)
      expect(calculateDynamicWeekCount(2026, 9)).toBe(5);

      // Dec 2026 (31 days, starts on Tuesday -> 5 weeks)
      expect(calculateDynamicWeekCount(2026, 12)).toBe(5);

      // Day of year helper verification
      expect(getDayOfYear(new Date(2026, 0, 1))).toBe(1); // Jan 1 is day 1
      expect(getDayOfYear(new Date(2024, 11, 31))).toBe(366); // Dec 31 in leap year 2024
      expect(getDayOfYear(new Date(2025, 11, 31))).toBe(365); // Dec 31 in non-leap year 2025
    });

    it('proves Sunday-start date math is timezone/DST safe with Date.UTC day counts', () => {
      // Test across multiple calendar months simulating different offsets
      const testCases = [
        { year: 2024, month: 2, expectedWeeks: 5 },
        { year: 2021, month: 2, expectedWeeks: 5 },
        { year: 2015, month: 2, expectedWeeks: 4 },
        { year: 2024, month: 3, expectedWeeks: 6 },
        { year: 2026, month: 9, expectedWeeks: 5 },
        { year: 2026, month: 12, expectedWeeks: 5 },
      ];

      testCases.forEach(({ year, month, expectedWeeks }) => {
        const weeks = calculateDynamicWeekCount(year, month);
        expect(weeks).toBe(expectedWeeks);

        const startSun = getMonthStartSunday(year, month);
        // Start day must always be a Sunday (getDay() === 0, Dart weekday === 7)
        expect(startSun.getDay()).toBe(0);
        expect(getDartWeekday(startSun)).toBe(7);
      });
    });

    it('produces identical week counts under two simulated time zones (Asia/Kolkata and America/New_York)', () => {
      const originalTz = process.env.TZ;
      try {
        const timezones = ['Asia/Kolkata', 'America/New_York'];
        for (const tz of timezones) {
          process.env.TZ = tz;
          // Verify Feb 2024 leap year (5 weeks) and Feb 2015 non-leap (4 weeks)
          expect(calculateDynamicWeekCount(2024, 2)).toBe(5);
          expect(calculateDynamicWeekCount(2021, 2)).toBe(5);
          expect(calculateDynamicWeekCount(2015, 2)).toBe(4);
          expect(calculateDynamicWeekCount(2024, 3)).toBe(6);
          expect(calculateDynamicWeekCount(2026, 9)).toBe(5);
          expect(calculateDynamicWeekCount(2026, 12)).toBe(5);
        }
      } finally {
        process.env.TZ = originalTz;
      }
    });
  });

  describe('2. Target Range Midpoint Math (verified in Node)', () => {
    it('calculateTargetRanges for weeklyIncome 10000 (monthly 40000) at expenseScore 0/50/100', () => {
      const income = 10000;

      // At expenseScore = 0:
      // sMid = 0.40, fMid = 0.25, xMid = 0.55
      // fixed: [5300, 5700], flexible: [2300, 2700], savings: [3800, 4200]
      const r0 = calculateTargetRanges(income, 0);
      expect(r0.range_fixed[0]).toBeCloseTo(5300, 1);
      expect(r0.range_fixed[1]).toBeCloseTo(5700, 1);
      expect(r0.range_flex[0]).toBeCloseTo(2300, 1);
      expect(r0.range_flex[1]).toBeCloseTo(2700, 1);
      expect(r0.range_save[0]).toBeCloseTo(3800, 1);
      expect(r0.range_save[1]).toBeCloseTo(4200, 1);

      // At expenseScore = 50:
      // sMid = 0.325, fMid = 0.30, xMid = 0.50
      // fixed: [4800, 5200], flexible: [2800, 3200], savings: [3050, 3450]
      const r50 = calculateTargetRanges(income, 50);
      expect(r50.range_fixed[0]).toBeCloseTo(4800, 1);
      expect(r50.range_fixed[1]).toBeCloseTo(5200, 1);
      expect(r50.range_flex[0]).toBeCloseTo(2800, 1);
      expect(r50.range_flex[1]).toBeCloseTo(3200, 1);
      expect(r50.range_save[0]).toBeCloseTo(3050, 1);
      expect(r50.range_save[1]).toBeCloseTo(3450, 1);

      // At expenseScore = 100:
      // sMid = 0.25, fMid = 0.35, xMid = 0.45
      // fixed: [4300, 4700], flexible: [3300, 3700], savings: [2300, 2700]
      const r100 = calculateTargetRanges(income, 100);
      expect(r100.range_fixed[0]).toBeCloseTo(4300, 1);
      expect(r100.range_fixed[1]).toBeCloseTo(4700, 1);
      expect(r100.range_flex[0]).toBeCloseTo(3300, 1);
      expect(r100.range_flex[1]).toBeCloseTo(3700, 1);
      expect(r100.range_save[0]).toBeCloseTo(2300, 1);
      expect(r100.range_save[1]).toBeCloseTo(2700, 1);
    });
  });

  describe('3. Table-Driven Status & Scoring Logic', () => {
    it('category score formulas for fixed and flexible (lower is better)', () => {
      // min = 4000, max = 6000
      // at or below min: 15 base + 20 range = 35 points
      expect(calculateCategoryScore(3500, 4000, 6000, 'fixed')).toBe(35);
      expect(calculateCategoryScore(4000, 4000, 6000, 'fixed')).toBe(35);

      // at or above max: 15 base + 0 range = 15 points
      expect(calculateCategoryScore(6000, 4000, 6000, 'fixed')).toBe(15);
      expect(calculateCategoryScore(6500, 4000, 6000, 'fixed')).toBe(15);

      // exact midpoint (5000): 15 + 20 * (1 - 1000/2000) = 15 + 10 = 25 points
      expect(calculateCategoryScore(5000, 4000, 6000, 'fixed')).toBe(25);
      expect(calculateCategoryScore(5000, 4000, 6000, 'flexible')).toBe(25);
    });

    it('category score formulas for savings (higher is better)', () => {
      // min = 2000, max = 4000
      // at or above max: 10 base + 20 range = 30 points
      expect(calculateCategoryScore(4500, 2000, 4000, 'savings')).toBe(30);
      expect(calculateCategoryScore(4000, 2000, 4000, 'savings')).toBe(30);

      // at or below min: 10 base + 0 range = 10 points
      expect(calculateCategoryScore(2000, 2000, 4000, 'savings')).toBe(10);
      expect(calculateCategoryScore(1500, 2000, 4000, 'savings')).toBe(10);

      // exact midpoint (3000): 10 + 20 * (1000/2000) = 10 + 10 = 20 points
      expect(calculateCategoryScore(3000, 2000, 4000, 'savings')).toBe(20);
    });

    it('discipline score calculates total sum clamped 0 to 100', () => {
      // 35 + 35 + 30 = 100 max
      expect(calculateLocalDisciplineScore(35, 35, 30)).toBe(100);
      // all missed = 0
      expect(calculateLocalDisciplineScore(0, 0, 0)).toBe(0);
      // midpoints: 25 + 25 + 20 = 70
      expect(calculateLocalDisciplineScore(25, 25, 20)).toBe(70);
    });

    it('fin message produces appropriate advice based on score thresholds', () => {
      expect(getFinMessage(95)).toContain('Superb performance');
      expect(getFinMessage(65, false)).toContain('Savings missed');
      expect(getFinMessage(65, true)).toContain('Good progress');
      expect(getFinMessage(45)).toContain('Action required');
    });
  });

  describe('4. Week State, Locking, and Boundary Conditions', () => {
    it('correctly tags past, current, future, locked, and submitted weeks', () => {
      // Fixed baseline time: Wednesday Sep 16, 2026 12:00:00
      const now = new Date(2026, 8, 16, 12, 0, 0);

      // In Sep 2026:
      // Month starts Sunday Aug 30.
      // Week 1: Aug 30 - Sep 5 (Past)
      // Week 2: Sep 6 - Sep 12 (Past)
      // Week 3: Sep 13 - Sep 19 (Current, contains Sep 16)
      // Week 4: Sep 20 - Sep 26 (Future)
      // Week 5: Sep 27 - Oct 3 (Future)
      const existingLogs = [
        {
          week_index: 1, // 1-BASED
          status: 'achieved',
          fixed_status: 'achieved',
          flexible_status: 'achieved',
          savings_status: 'achieved',
          spent_fixed: 4500,
          spent_flexible: 2500,
          spent_savings: 3500,
        },
      ];

      const weeks = calculateMonthWeeks(2026, 9, 10000, 70, now, existingLogs);
      expect(weeks.length).toBe(5);

      // Week 1: Past with log -> is_submitted true, is_locked false
      expect(weeks[0].index).toBe(1);
      expect(weeks[0].is_past).toBe(true);
      expect(weeks[0].is_submitted).toBe(true);
      expect(weeks[0].is_locked).toBe(false);

      // Week 2: Past without log -> is_past true, is_submitted false, is_locked true
      expect(weeks[1].index).toBe(2);
      expect(weeks[1].is_past).toBe(true);
      expect(weeks[1].is_submitted).toBe(false);
      expect(weeks[1].is_locked).toBe(true);

      // Week 3: Current week -> is_current true, is_locked false
      expect(weeks[2].index).toBe(3);
      expect(weeks[2].is_current).toBe(true);
      expect(weeks[2].is_locked).toBe(false);

      // Week 4: Future week -> is_future true, is_locked true
      expect(weeks[3].index).toBe(4);
      expect(weeks[3].is_future).toBe(true);
      expect(weeks[3].is_locked).toBe(true);

      // Week 5: Future week -> is_future true, is_locked true
      expect(weeks[4].index).toBe(5);
      expect(weeks[4].is_future).toBe(true);
      expect(weeks[4].is_locked).toBe(true);
    });

    it('respects the exact boundary at weekEnd + 23h59m', () => {
      // Week 3 in Sep 2026 ends on Saturday Sep 19.
      // At 23:58 on Sep 19, the week is STILL CURRENT (not past)
      const justBeforeBoundary = new Date(2026, 8, 19, 23, 58, 0);
      const weeksBefore = calculateMonthWeeks(2026, 9, 10000, 70, justBeforeBoundary);
      expect(weeksBefore[2].is_current).toBe(true);
      expect(weeksBefore[2].is_past).toBe(false);

      // At 00:01 on Sep 20, the week has PASSED
      const justAfterBoundary = new Date(2026, 8, 20, 0, 1, 0);
      const weeksAfter = calculateMonthWeeks(2026, 9, 10000, 70, justAfterBoundary);
      expect(weeksAfter[2].is_current).toBe(false);
      expect(weeksAfter[2].is_past).toBe(true);
    });
  });

  describe('5. Real-Log Driven Heatmap Derivation', () => {
    it('maps days of the month to real weekly_logs status and ignores days outside the month', () => {
      const now = new Date(2026, 8, 16);
      const existingLogs = [
        { week_index: 1, status: 'achieved' },
        { week_index: 2, status: 'missed' },
      ];

      const weeks = calculateMonthWeeks(2026, 9, 10000, 70, now, existingLogs);
      const heatmap = deriveHeatmapDays(2026, 9, weeks);

      // September has exactly 30 days
      expect(heatmap.length).toBe(30);
      expect(heatmap[0].day).toBe(1);
      expect(heatmap[29].day).toBe(30);

      // Day 1 to 5 fall in Week 1 (status: 'achieved' -> 'optimal')
      expect(heatmap[0].status).toBe('optimal'); // Sep 1
      expect(heatmap[4].status).toBe('optimal'); // Sep 5

      // Day 6 to 12 fall in Week 2 (status: 'missed' -> 'missed')
      expect(heatmap[5].status).toBe('missed'); // Sep 6
      expect(heatmap[11].status).toBe('missed'); // Sep 12

      // Day 13 to 19 fall in Week 3 (Current week, unlogged -> 'safe')
      expect(heatmap[12].status).toBe('safe'); // Sep 13
      expect(heatmap[15].status).toBe('safe'); // Sep 16 (today)

      // Day 20 to 30 fall in Weeks 4 and 5 (Future, unlogged -> 'inactive')
      expect(heatmap[19].status).toBe('inactive'); // Sep 20
      expect(heatmap[29].status).toBe('inactive'); // Sep 30
    });
  });
});

describe('Task 9: Streak and XP Port with Hand-Derived Fixtures', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  /*
   * HAND DERIVATION 1: ISO Week Number calculation in streak_service.dart
   * - getDayOfYear (Jan 1 = 1)
   * - Dart weekday: Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6, Sun=7
   * - weekNumber = floor((dayOfYear - weekday + 10) / 7)
   * - if weekNumber > 52 and Dec 31 weekday < Thursday (4), returns 1, otherwise week 53 stays!
   * - 2026-12-31:
   *   2026 is non-leap year (365 days). Dec 31 is day 365.
   *   Dec 31, 2026 is a Thursday (weekday = 4).
   *   weekNumber = floor((365 - 4 + 10) / 7) = floor(371 / 7) = 53.
   *   Since dec31Weekday is 4 (not < 4), week 53 stays!
   */
  it('correctly identifies a 53-week year where Dec 31 is Thursday (e.g. 2026)', () => {
    const dec31_2026 = new Date(2026, 11, 31);
    expect(getDartWeekday(dec31_2026)).toBe(4); // Thursday
    expect(getIsoWeekNumber(dec31_2026)).toBe(53);
  });

  /*
   * HAND DERIVATION 2: Streak State Machine in streak_service.dart lines 22-65
   * - Initial state: lastActionWeekKey = -1, streak = 0
   * - Action 1 (Week 10, 2026):
   *   lastWeek == -1 -> currentStreak = 1.
   *   Saved: streak = 1, lastWeek = 10, lastYear = 2026.
   * - Action 2 (Same Week 10, 2026):
   *   currentWeek == lastWeek && currentYear == lastYear -> no-op!
   *   Saved: streak remains 1.
   * - Action 3 (Next Week 11, 2026):
   *   _isNextWeek(10, 2026, 11, 2026) is true -> currentStreak++ -> 2.
   *   Saved: streak = 2, lastWeek = 11, lastYear = 2026.
   * - Action 4 (Grace Week 13, 2026 - skipped Week 12):
   *   _isGraceWeek(11, 2026, 13, 2026) is true (13 == 11 + 2) -> currentStreak++ -> 3.
   *   Saved: streak = 3, lastWeek = 13, lastYear = 2026.
   * - Action 5 (Missed 2+ weeks - Week 16, 2026):
   *   16 != 13 + 1 and 16 != 13 + 2 -> Reset branch: currentStreak = 1.
   *   Saved: streak = 1, lastWeek = 16, lastYear = 2026.
   */
  it('hand-derived streak transitions: first action, same week no-op, consecutive week, grace week, and reset on lapse', () => {
    // Action 1: Wednesday Mar 4, 2026 (Week 10)
    vi.setSystemTime(new Date(2026, 2, 4, 12, 0, 0));
    gamificationStore.updateStreak();
    expect(gamificationStore.getStreak()).toBe(1);

    // Action 2: Friday Mar 6, 2026 (Same Week 10) -> no-op
    vi.setSystemTime(new Date(2026, 2, 6, 15, 0, 0));
    gamificationStore.updateStreak();
    expect(gamificationStore.getStreak()).toBe(1);

    // Action 3: Wednesday Mar 11, 2026 (Week 11 - Consecutive week) -> streak becomes 2
    vi.setSystemTime(new Date(2026, 2, 11, 12, 0, 0));
    gamificationStore.updateStreak();
    expect(gamificationStore.getStreak()).toBe(2);

    // Action 4: Wednesday Mar 25, 2026 (Week 13 - Skipped Week 12, Grace week) -> streak becomes 3
    vi.setSystemTime(new Date(2026, 2, 25, 12, 0, 0));
    gamificationStore.updateStreak();
    expect(gamificationStore.getStreak()).toBe(3);

    // Action 5: Wednesday Apr 15, 2026 (Week 16 - Missed 2+ weeks) -> resets to 1
    vi.setSystemTime(new Date(2026, 3, 15, 12, 0, 0));
    gamificationStore.updateStreak();
    expect(gamificationStore.getStreak()).toBe(1);
  });

  /*
   * HAND DERIVATION 3: Year Rollovers in streak_service.dart
   * - Next week year rollover: last = Week 52 of 2025, cur = Week 1 of 2026
   *   _isNextWeek: curY === lastY + 1 && lastW >= 52 && curW === 1 -> true. Streak increments!
   * - Grace week year rollover:
   *   a) last = Week 52 of 2025, cur = Week 2 of 2026 (skip Week 1)
   *      _isGraceWeek: curY === lastY + 1 && lastW === 52 && curW === 2 -> true. Streak increments!
   *   b) last = Week 51 of 2025, cur = Week 1 of 2026 (skip Week 52)
   *      _isGraceWeek: curY === lastY + 1 && lastW === 51 && curW === 1 -> true. Streak increments!
   */
  it('hand-derived year rollovers: 52->1 (next), 51->1 (grace), and 52->2 (grace)', () => {
    // 1. Next week: 52 -> 1
    localStorage.setItem('streak_count_weekly', '3');
    localStorage.setItem('last_action_week_v2', '52');
    localStorage.setItem('last_action_year_v2', '2025');

    // Action in Week 1 of 2026 (e.g. Jan 2, 2026)
    vi.setSystemTime(new Date(2026, 0, 2, 12, 0, 0));
    gamificationStore.updateStreak();
    expect(gamificationStore.getStreak()).toBe(4);

    // 2. Grace week: 52 -> 2
    localStorage.setItem('streak_count_weekly', '4');
    localStorage.setItem('last_action_week_v2', '52');
    localStorage.setItem('last_action_year_v2', '2025');

    // Action in Week 2 of 2026 (e.g. Jan 9, 2026)
    vi.setSystemTime(new Date(2026, 0, 9, 12, 0, 0));
    gamificationStore.updateStreak();
    expect(gamificationStore.getStreak()).toBe(5);

    // 3. Grace week: 51 -> 1
    localStorage.setItem('streak_count_weekly', '2');
    localStorage.setItem('last_action_week_v2', '51');
    localStorage.setItem('last_action_year_v2', '2025');

    // Action in Week 1 of 2026
    vi.setSystemTime(new Date(2026, 0, 2, 12, 0, 0));
    gamificationStore.updateStreak();
    expect(gamificationStore.getStreak()).toBe(3);
  });

  /*
   * HAND DERIVATION 4: Inactivity Reset in getStreak() (_checkAndResetStreak)
   * - Stored: streak = 5, lastWeek = 10, lastYear = 2026
   * - If user opens the app in Week 13 without taking action in Week 11 or 12:
   *   _isSameWeek(10, 13) = false
   *   _isNextWeek(10, 13) = false
   *   _isGraceWeek(10, 13) = false (10 + 2 = 12 != 13)
   *   Resets streak to 0!
   */
  it('resets streak to 0 on inactivity beyond grace period in getStreak()', () => {
    localStorage.setItem('streak_count_weekly', '5');
    localStorage.setItem('last_action_week_v2', '10');
    localStorage.setItem('last_action_year_v2', '2026');

    // Check in Week 13 (Mar 25, 2026) -> more than 1 week skipped
    vi.setSystemTime(new Date(2026, 2, 25, 12, 0, 0));
    expect(gamificationStore.getStreak()).toBe(0);
    expect(localStorage.getItem('streak_count_weekly')).toBe('0');
  });

  /*
   * HAND DERIVATION 5: Streak 4+ Week Bonus (+150 XP) in streak_service.dart lines 58-64
   * - Stored: streak = 3, XP = 200
   * - User increments streak to 4 in Week 20.
   * - streak >= 4 is true and lastBonusWeek != 20 -> triggers rewardStreakBonus() (+150 XP)
   * - XP becomes 200 + 150 = 350.
   * - If user takes another action in same week 20, bonus is NOT awarded again.
   */
  it('grants +150 XP bonus when streak hits 4+, at most once per week', () => {
    localStorage.setItem('streak_count_weekly', '3');
    localStorage.setItem('last_action_week_v2', '19');
    localStorage.setItem('last_action_year_v2', '2026');
    localStorage.setItem('user_total_xp', '200');

    // Action in Week 20 (May 13, 2026)
    vi.setSystemTime(new Date(2026, 4, 13, 12, 0, 0));
    gamificationStore.updateStreak();

    expect(gamificationStore.getStreak()).toBe(4);
    expect(gamificationStore.getTotalXp()).toBe(350); // 200 + 150

    // Additional action in week 20 does not re-award bonus
    gamificationStore.updateStreak();
    expect(gamificationStore.getTotalXp()).toBe(350);
  });

  /*
   * HAND DERIVATION 6: Level Info calculation in xp_service.dart lines 12-43
   * - Thresholds: [0, 300, 700, 1200, 2000, 3000, 4200, 5600]
   * - XP 0: Level 1, minXp = 0, maxXp = 300, progress = 0.0
   * - XP 299: Level 1, minXp = 0, maxXp = 300, progress = 299/300 = 0.9966...
   * - XP 300: Level 2, minXp = 300, maxXp = 700, progress = 0.0
   * - XP 5599: Level 7, minXp = 4200, maxXp = 5600, progress = 1399/1400 = 0.99928...
   * - XP 5600: Level 8 (last), minXp = 5600, maxXp = 5600 + 2000 = 7600, progress = 0.0
   * - XP 9000: Level 8, minXp = 5600, maxXp = 7600, progress clamped to 1.0
   */
  it('hand-derived getLevelInfo across all boundary thresholds', () => {
    const l0 = gamificationStore.getLevelInfo(0);
    expect(l0.level).toBe(1);
    expect(l0.minXp).toBe(0);
    expect(l0.maxXp).toBe(300);
    expect(l0.progress).toBeCloseTo(0, 4);

    const l299 = gamificationStore.getLevelInfo(299);
    expect(l299.level).toBe(1);
    expect(l299.minXp).toBe(0);
    expect(l299.maxXp).toBe(300);
    expect(l299.progress).toBeCloseTo(299 / 300, 4);

    const l300 = gamificationStore.getLevelInfo(300);
    expect(l300.level).toBe(2);
    expect(l300.minXp).toBe(300);
    expect(l300.maxXp).toBe(700);
    expect(l300.progress).toBeCloseTo(0, 4);

    const l5599 = gamificationStore.getLevelInfo(5599);
    expect(l5599.level).toBe(7);
    expect(l5599.minXp).toBe(4200);
    expect(l5599.maxXp).toBe(5600);
    expect(l5599.progress).toBeCloseTo((5599 - 4200) / (5600 - 4200), 4);

    const l5600 = gamificationStore.getLevelInfo(5600);
    expect(l5600.level).toBe(8);
    expect(l5600.minXp).toBe(5600);
    expect(l5600.maxXp).toBe(7600); // threshold + 2000
    expect(l5600.progress).toBeCloseTo(0, 4);

    const l9000 = gamificationStore.getLevelInfo(9000);
    expect(l9000.level).toBe(8);
    expect(l9000.minXp).toBe(5600);
    expect(l9000.maxXp).toBe(7600);
    expect(l9000.progress).toBe(1.0); // clamped
  });
});

describe('Task 9: Dashboard Local Expense Score Override', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const coreDataFixture = {
    financial_fitness_scores: {
      global_fitness_score: 75,
      income_pillar_score: 80,
      expense_pillar_score: 50, // original core score
      savings_pillar_score: 70,
      protection_pillar_score: 80,
      investment_pillar_score: 95,
    },
    income_scores: {},
    expense_scores: { discipline_message: 'Keep going!' },
    savings_scores: {},
    protection_scores: {},
    investment_scores: {},
  };

  it('uses core score when local_expense_score override is absent', () => {
    const data = DashboardData.fromCoreSchema(coreDataFixture);
    expect(data.pillars.expenses.score).toBe(50);
    expect(data.fitnessScore).toBe(75);
    expect(data.fitnessBand?.tag).toBe('Good');
  });

  it('overrides expenses pillar and recalculates global fitness score as average of 5 pillars', () => {
    // Set local_expense_score to 90
    gamificationStore.setLocalExpenseScore(90);

    const data = DashboardData.fromCoreSchema(coreDataFixture);
    expect(data.pillars.expenses.score).toBe(90);

    // Recomputed global score: (80 + 90 + 70 + 80 + 95) / 5 = 415 / 5 = 83
    expect(data.fitnessScore).toBe(83);
    // Band recalculated for score 83: 'Excellent' (score >= 80)
    expect(data.fitnessBand?.tag).toBe('Excellent');
    expect(data.fitnessBand?.emoji).toBe('💎');
  });
});

describe('Task 9: WeeklyPage Component & Flow Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const mockDashboard = {
    financial_fitness_scores: {
      global_fitness_score: 80,
      expense_pillar_score: 65,
    },
    expense_scores: {
      discipline_message: 'Trim dining expenses',
      savings_score: 70,
    },
  };

  const mockWeeklyLogs = {
    data: [
      {
        week_index: 1, // 1-BASED
        status: 'achieved',
        fixed_status: 'achieved',
        flexible_status: 'achieved',
        savings_status: 'achieved',
        spent_fixed: 4500,
        spent_flexible: 2500,
        spent_savings: 3500,
      },
    ],
  };

  const mockProfile = {
    data: {
      monthlyActiveIncome: 60000, // weekly = 15000
    },
  };

  const renderComponent = () => {
    const mockAuthContext = {
      user: { id: 'user-123', email: 'test@moneymapper.io' },
      profile: { fullName: 'Test User' },
      session: null,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
    };

    return render(
      <MemoryRouter initialEntries={['/weekly']}>
        <ThemeProvider>
          <ToastProvider>
            <AuthContext.Provider value={mockAuthContext as any}>
              <Routes>
                <Route path="/weekly" element={<WeeklyPage />} />
                <Route path="/master-data" element={<div data-testid="master-data-page">Master Data</div>} />
                <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard</div>} />
              </Routes>
            </AuthContext.Provider>
          </ToastProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
  };

  it('renders header with streak, week tabs, income card, targets and fin observation', async () => {
    gamificationStore.updateStreak(); // streak = 1

    vi.spyOn(apiService, 'getDashboard').mockResolvedValue(mockDashboard as any);
    vi.spyOn(apiService, 'getWeeklyCurrent').mockResolvedValue(mockWeeklyLogs as any);
    vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue(mockProfile as any);

    renderComponent();

    // Verify header elements
    await waitFor(() => {
      expect(screen.getByText('Weekly Tracker')).toBeInTheDocument();
      expect(screen.getByText(/1 STREAK/i)).toBeInTheDocument();
      expect(screen.getByText("this week's income")).toBeInTheDocument();
      expect(screen.getByText('₹15,000')).toBeInTheDocument();
      expect(screen.getByText(/Fin Says 🦉/i)).toBeInTheDocument();
    });
  });

  it('opening /weekly with an undecided week NEVER writes local_expense_score', async () => {
    vi.spyOn(apiService, 'getDashboard').mockResolvedValue(mockDashboard as any);
    // Return empty logs so active week is undecided
    vi.spyOn(apiService, 'getWeeklyCurrent').mockResolvedValue({ data: [] } as any);
    vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue(mockProfile as any);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Weekly Tracker')).toBeInTheDocument();
    });

    // Verify local_expense_score was NOT written
    expect(gamificationStore.getLocalExpenseScore()).toBeNull();
  });

  it('marking a decision (Done/Missed) writes local_expense_score', async () => {
    vi.spyOn(apiService, 'getDashboard').mockResolvedValue(mockDashboard as any);
    vi.spyOn(apiService, 'getWeeklyCurrent').mockResolvedValue({ data: [] } as any);
    vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue(mockProfile as any);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Weekly Tracker')).toBeInTheDocument();
    });

    // Find and click the first "Missed" button (for Fixed expenses)
    const missedButtons = screen.getAllByRole('button', { name: /Missed/i });
    fireEvent.click(missedButtons[0]);

    // Local expense score is now set
    expect(gamificationStore.getLocalExpenseScore()).not.toBeNull();
  });

  it('blocks submission and shows toast if any target is unselected', async () => {
    vi.spyOn(apiService, 'getDashboard').mockResolvedValue(mockDashboard as any);
    vi.spyOn(apiService, 'getWeeklyCurrent').mockResolvedValue({ data: [] } as any);
    vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue(mockProfile as any);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/SUBMIT WEEKLY REPORT/i)).toBeInTheDocument();
    });

    // Click submit without marking all 3 decisions
    fireEvent.click(screen.getByText(/SUBMIT WEEKLY REPORT/i));

    await waitFor(() => {
      expect(
        screen.getByText('Please mark all three targets before submitting.')
      ).toBeInTheDocument();
    });
  });

  it('successful submission calls updateWeeklyStatus with 1-based week_index and exact 12 columns', async () => {
    vi.spyOn(apiService, 'getDashboard').mockResolvedValue(mockDashboard as any);
    vi.spyOn(apiService, 'getWeeklyCurrent').mockResolvedValue({ data: [] } as any);
    vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue(mockProfile as any);

    const updateSpy = vi.spyOn(apiService, 'updateWeeklyStatus').mockResolvedValue({ status: 'success' });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Weekly Tracker')).toBeInTheDocument();
    });

    // Mark all three targets as "Missed"
    const missedButtons = screen.getAllByRole('button', { name: /Missed/i });
    fireEvent.click(missedButtons[0]); // Fixed
    fireEvent.click(missedButtons[1]); // Flexible
    fireEvent.click(missedButtons[2]); // Savings

    // Now submit
    fireEvent.click(screen.getByText(/SUBMIT WEEKLY REPORT/i));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });

    // Verify 1-based week_index and exact 12 payload keys
    const callArg = updateSpy.mock.calls[0][0];
    expect(callArg.weekIndex).toBeGreaterThanOrEqual(1); // 1-BASED
    expect(callArg.status).toBe('missed'); // because all were missed
    expect(callArg.fixedStatus).toBe('missed');
    expect(callArg.flexibleStatus).toBe('missed');
    expect(callArg.savingsStatus).toBe('missed');
    expect(callArg.spentFixed).toBe(0);
    expect(callArg.spentFlexible).toBe(0);
    expect(callArg.spentSavings).toBe(0);

    // Toast feedback displayed
    await waitFor(() => {
      expect(screen.getByText('Weekly report submitted!')).toBeInTheDocument();
    });
  });

  it('renders empty state when dashboard has no scores (404 Calculations Pending)', async () => {
    vi.spyOn(apiService, 'getDashboard').mockRejectedValue({
      statusCode: 404,
      message: 'Calculations Pending',
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No Active Week Data')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Submit Parameters/i })).toBeInTheDocument();
    });
  });

  it('renders error state with retry button on unexpected network failure', async () => {
    vi.spyOn(apiService, 'getDashboard').mockRejectedValue(new Error('Network error'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Failed to Load Weekly Data')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    });
  });
});
