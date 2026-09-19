/**
 * Weekly Tracker Domain Model & Formulas
 * 
 * Authoritative source: reference/moneymapper_app/lib/weekly_expense_tracker.dart
 * and reference/moneymapper_app/lib/screens/weekly_screen.dart.
 */

export interface TargetRange {
  min: number;
  max: number;
}

export interface WeekInfo {
  index: number; // 1-based (1, 2, 3...)
  start: Date;
  end: Date;
  range_fixed: [number, number];
  range_flex: [number, number];
  range_save: [number, number];
  status?: 'achieved' | 'missed';
  fixed_status?: 'achieved' | 'missed';
  flexible_status?: 'achieved' | 'missed';
  savings_status?: 'achieved' | 'missed';
  spent_fixed?: number;
  spent_flexible?: number;
  spent_savings?: number;
  is_past: boolean;
  is_future: boolean;
  is_current: boolean;
  is_locked: boolean;
  is_submitted: boolean;
}

export interface HeatmapDay {
  day: number;
  date: Date;
  weekIndex: number;
  status: 'optimal' | 'missed' | 'safe' | 'inactive';
}

/**
 * Maps JS getDay() (Sunday=0..Saturday=6) to Dart weekday (Monday=1..Sunday=7)
 */
export function getDartWeekday(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

/**
 * UTC-safe day of year calculation (1-based: Jan 1 = 1)
 */
export function getDayOfYear(date: Date): number {
  const start = Date.UTC(date.getFullYear(), 0, 1);
  const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((current - start) / 86400000) + 1;
}

/**
 * Port of Dart StreakService._getWeekNumber (ISO-8601 week number)
 * Matches intl DateFormat("D") and Dart weekday conventions.
 */
export function getIsoWeekNumber(date: Date): number {
  const dayOfYear = getDayOfYear(date);
  const weekday = getDartWeekday(date);
  let weekNumber = Math.floor((dayOfYear - weekday + 10) / 7);

  if (weekNumber < 1) {
    return getIsoWeekNumber(new Date(date.getFullYear() - 1, 11, 31));
  } else if (weekNumber > 52) {
    const dec31 = new Date(date.getFullYear(), 11, 31);
    const dec31Weekday = getDartWeekday(dec31);
    // In Dart, DateTime.thursday is 4
    if (dec31Weekday < 4) {
      weekNumber = 1;
    }
  }
  return weekNumber;
}

/**
 * Calculates the Sunday starting the first week containing day 1 of the given month.
 * Backtracks from the 1st of the month to the preceding Sunday.
 * month is 1-based (1..12).
 */
export function getMonthStartSunday(year: number, month: number): Date {
  const firstDay = new Date(year, month - 1, 1);
  const dayOfWeek = firstDay.getDay(); // 0 is Sun, 1 is Mon...
  const daysToSubtract = dayOfWeek === 0 ? 0 : dayOfWeek;
  return new Date(year, month - 1, 1 - daysToSubtract);
}

/**
 * Computes dynamic week count (4, 5, or 6 weeks) for a month using Sunday starts.
 * Uses Date.UTC to guarantee timezone- and DST-invariant integer day counts.
 */
export function calculateDynamicWeekCount(year: number, month: number): number {
  const monthStart = getMonthStartSunday(year, month);
  const lastDayOfMonth = new Date(year, month, 0); // day 0 of month gives last day of month-1

  const utcStart = Date.UTC(monthStart.getFullYear(), monthStart.getMonth(), monthStart.getDate());
  const utcEnd = Date.UTC(lastDayOfMonth.getFullYear(), lastDayOfMonth.getMonth(), lastDayOfMonth.getDate());

  const totalDays = Math.round((utcEnd - utcStart) / 86400000) + 1;
  return Math.ceil(totalDays / 7);
}

/**
 * Calculates target ranges based on weekly income (monthlyActiveIncome / 4)
 * and expense score (from dashboard expense pillar).
 * Ported directly from weekly_expense_tracker.dart lines 92-120.
 */
export function calculateTargetRanges(
  weeklyIncome: number,
  expenseScore: number
): {
  range_fixed: [number, number];
  range_flex: [number, number];
  range_save: [number, number];
} {
  const sMid = Math.max(0.25, Math.min(0.40, 0.40 - (expenseScore / 100) * 0.15));
  const fMid = Math.max(0.25, Math.min(0.35, 0.25 + (expenseScore / 100) * 0.10));
  const xMid = Math.max(0.45, Math.min(0.55, 0.55 - (expenseScore / 100) * 0.10));

  return {
    range_fixed: [weeklyIncome * (xMid - 0.02), weeklyIncome * (xMid + 0.02)],
    range_flex: [weeklyIncome * (fMid - 0.02), weeklyIncome * (fMid + 0.02)],
    range_save: [weeklyIncome * (sMid - 0.02), weeklyIncome * (sMid + 0.02)],
  };
}

/**
 * Computes category score based on actual amount and target range.
 * Ported 1:1 from weekly_expense_tracker.dart lines 184-213:
 * - Fixed & Flex: base 15. If actual <= min: +20. If actual >= max: +0.
 * - Savings: base 10. If actual >= max: +20. If actual <= min: +0.
 */
export function calculateCategoryScore(
  actual: number,
  min: number,
  max: number,
  type: 'fixed' | 'flexible' | 'savings'
): number {
  const basePoints = type === 'savings' ? 10 : 15;
  let rangePoints = 0;

  if (type === 'fixed' || type === 'flexible') {
    if (actual <= min) {
      rangePoints = 20;
    } else if (actual >= max) {
      rangePoints = 0;
    } else if (max > min) {
      rangePoints = 20 * (1 - (actual - min) / (max - min));
    }
  } else {
    // Savings: higher is better
    if (actual >= max) {
      rangePoints = 20;
    } else if (actual <= min) {
      rangePoints = 0;
    } else if (max > min) {
      rangePoints = 20 * ((actual - min) / (max - min));
    }
  }

  return basePoints + rangePoints;
}

/**
 * Overall local discipline score clamped between 0 and 100.
 */
export function calculateLocalDisciplineScore(
  fixedScore: number,
  flexScore: number,
  saveScore: number
): number {
  const sum = fixedScore + flexScore + saveScore;
  return Math.max(0, Math.min(100, Math.round(sum * 100) / 100));
}

/**
 * Builds all week metadata for the current month and attaches any existing weekly_logs.
 * week_index in weekly_logs is strictly 1-BASED (1..weekCount).
 */
export function calculateMonthWeeks(
  year: number,
  month: number,
  weeklyIncome: number,
  expenseScore: number,
  now: Date = new Date(),
  logs: any[] = []
): WeekInfo[] {
  const monthStart = getMonthStartSunday(year, month);
  const weekCount = calculateDynamicWeekCount(year, month);
  const ranges = calculateTargetRanges(weeklyIncome, expenseScore);

  const weeks: WeekInfo[] = [];

  for (let i = 0; i < weekCount; i++) {
    const weekIndex = i + 1; // 1-BASED
    const start = new Date(monthStart.getFullYear(), monthStart.getMonth(), monthStart.getDate() + i * 7);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
    const endBoundary = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 0, 0);

    const log = logs.find((l) => Number(l.week_index) === weekIndex);

    const isPast = now.getTime() > endBoundary.getTime();
    const isFuture = now.getTime() < start.getTime();
    const isCurrent = !isPast && !isFuture;

    const hasLog = Boolean(log);
    const isLocked = isFuture || (isPast && !hasLog);
    const isSubmitted = hasLog;

    weeks.push({
      index: weekIndex,
      start,
      end,
      range_fixed: ranges.range_fixed,
      range_flex: ranges.range_flex,
      range_save: ranges.range_save,
      status: log?.status,
      fixed_status: log?.fixed_status,
      flexible_status: log?.flexible_status,
      savings_status: log?.savings_status,
      spent_fixed: log?.spent_fixed !== undefined ? Number(log.spent_fixed) : undefined,
      spent_flexible: log?.spent_flexible !== undefined ? Number(log.spent_flexible) : undefined,
      spent_savings: log?.spent_savings !== undefined ? Number(log.spent_savings) : undefined,
      is_past: isPast,
      is_future: isFuture,
      is_current: isCurrent,
      is_locked: isLocked,
      is_submitted: isSubmitted,
    });
  }

  return weeks;
}

/**
 * Derives day cell statuses for the Habit Heatmap using real weekly_logs.
 * Days belong to the month (1..totalDaysInMonth). Days outside the month are excluded.
 */
export function deriveHeatmapDays(
  year: number,
  month: number,
  weeks: WeekInfo[]
): HeatmapDay[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const result: HeatmapDay[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dayDate = new Date(year, month - 1, d);
    const dayUtc = Date.UTC(year, month - 1, d);

    // Find the week this day belongs to
    const week = weeks.find((w) => {
      const wStartUtc = Date.UTC(w.start.getFullYear(), w.start.getMonth(), w.start.getDate());
      const wEndUtc = Date.UTC(w.end.getFullYear(), w.end.getMonth(), w.end.getDate());
      return dayUtc >= wStartUtc && dayUtc <= wEndUtc;
    });

    let status: 'optimal' | 'missed' | 'safe' | 'inactive' = 'inactive';

    if (week) {
      if (week.status === 'achieved') {
        status = 'optimal';
      } else if (week.status === 'missed') {
        status = 'missed';
      } else if (week.is_current && !week.is_submitted) {
        status = 'safe';
      } else {
        status = 'inactive';
      }
    }

    result.push({
      day: d,
      date: dayDate,
      weekIndex: week ? week.index : 1,
      status,
    });
  }

  return result;
}

/**
 * Fin owl contextual observation message based on discipline score.
 * Ported from weekly_screen.dart lines 390-398.
 */
export function getFinMessage(disciplineScore: number, savingsAchieved?: boolean): string {
  if (disciplineScore >= 90) {
    return 'Superb performance! All target rings completed. You are on track to build wealth! 🏆';
  }
  if (disciplineScore >= 60) {
    return savingsAchieved === false
      ? 'Good progress! Savings missed. Trim down flexible dining next week.'
      : 'Good progress! Keep fixed expenditures within target brackets.';
  }
  return "Action required. Spending limits exceeded. Let's get back on track!";
}
