/**
 * Gamification Badges Service
 * Mirrors achievements_screen.dart and dashboard_screen.dart _checkBadges.
 */

import { apiService } from './apiService';
import { gamificationStore, GamificationStore, LevelInfo } from './gamificationStore';

export interface BadgeDefinition {
  id: string;
  emoji: string;
  title: string;
  desc: string;
}

export const ALL_BADGES: readonly BadgeDefinition[] = [
  {
    id: 'debt_free',
    emoji: '🎉',
    title: 'Debt Free Milestone',
    desc: 'Reported zero active loans in your financial profile.',
  },
  {
    id: 'emergency_complete',
    emoji: '🛡️',
    title: 'Emergency Fund Complete',
    desc: 'Built a secure 3-month liquidity buffer.',
  },
  {
    id: 'investment_starter',
    emoji: '🌱',
    title: 'Investment Starter',
    desc: 'Started your wealth growth journey with mutual funds.',
  },
  {
    id: 'protection_pro',
    emoji: '👨‍👩‍👧',
    title: 'Protection Pro',
    desc: 'Verified adequate life and health insurance coverage.',
  },
  {
    id: 'comeback_kid',
    emoji: '⚡',
    title: 'Comeback Kid',
    desc: 'Resumed your financial discipline streak after a break.',
  },
] as const;

export interface BadgeEvaluationContext {
  profile?: Record<string, any> | null;
  dashboard?: {
    pillars?: {
      emergency?: { score?: number };
      investment?: { score?: number };
      protection?: { score?: number };
    };
  } | null;
  streak?: number;
  streakResetHappened?: boolean;
}

/**
 * Pure evaluation function for badge criteria.
 */
export function evaluateBadgeCriteria(badgeId: string, context: BadgeEvaluationContext): boolean {
  switch (badgeId) {
    case 'debt_free': {
      // Mobile app rule (reference/moneymapper_app/lib/screens/dashboard_screen.dart lines ~1224-1230):
      // final loans = profile['activeLoans']?.toString() ?? '0';
      // if (loans == '0' || loans.isEmpty) -> unlock debt_free
      if (!context.profile) {
        return false;
      }
      const raw = context.profile.activeLoans;
      const loans = raw !== undefined && raw !== null ? String(raw).trim() : '0';
      return loans === '0' || loans === '';
    }

    case 'emergency_complete': {
      const emergencyScore = context.dashboard?.pillars?.emergency?.score ?? 0;
      return emergencyScore >= 100;
    }

    case 'investment_starter': {
      const investmentScore = context.dashboard?.pillars?.investment?.score ?? 0;
      return investmentScore > 0;
    }

    case 'protection_pro': {
      const protectionScore = context.dashboard?.pillars?.protection?.score ?? 0;
      return protectionScore >= 90;
    }

    case 'comeback_kid': {
      const streak = context.streak ?? 0;
      return streak >= 1 && Boolean(context.streakResetHappened);
    }

    default:
      return false;
  }
}

/**
 * Evaluates all badges against fresh context and rewards newly unlocked badges (+100 XP).
 * Automatically clears `streak_reset_happened` only when comeback_kid is newly unlocked.
 */
export async function checkAndUnlockBadges(
  context: BadgeEvaluationContext = {},
  store: GamificationStore = gamificationStore
): Promise<string[]> {
  let profile = context.profile;
  if (profile === undefined) {
    try {
      profile = await apiService.getMasterProfile();
    } catch {
      profile = null;
    }
  }

  const streak = context.streak !== undefined ? context.streak : store.getStreak();
  const streakResetHappened = context.streakResetHappened !== undefined
    ? context.streakResetHappened
    : (typeof window !== 'undefined' && localStorage.getItem('streak_reset_happened') === 'true');

  const evalContext: BadgeEvaluationContext = {
    profile,
    dashboard: context.dashboard,
    streak,
    streakResetHappened,
  };

  const newlyUnlocked: string[] = [];

  for (const badge of ALL_BADGES) {
    const isEligible = evaluateBadgeCriteria(badge.id, evalContext);
    if (isEligible) {
      const isNewlyUnlocked = store.rewardBadge(badge.id);
      if (isNewlyUnlocked) {
        newlyUnlocked.push(badge.id);
        if (badge.id === 'comeback_kid') {
          if (typeof window !== 'undefined' && window.localStorage) {
            try {
              localStorage.setItem('streak_reset_happened', 'false');
            } catch {
              // ignore
            }
          }
        }
      }
    }
  }

  return newlyUnlocked;
}


export interface DerivedGamification {
  totalXp: number;
  levelInfo: LevelInfo;
  unlockedBadges: BadgeDefinition[];
  unlockedBadgeIds: string[];
}

/**
 * Derives XP, Level, and Unlocked Badges deterministically from current Supabase data,
 * matching mobile app XP rules (xp_service.dart) and badge criteria (dashboard_screen.dart).
 */
export function deriveGamificationFromData(params: {
  profile?: Record<string, any> | null;
  dashboard?: Record<string, any> | null;
  weeklyLogs?: any[] | null;
  streak?: number;
  streakResetHappened?: boolean;
}): DerivedGamification {
  const profile = params.profile;
  const dashboard = params.dashboard;
  const weeklyLogs = params.weeklyLogs;
  const streak = params.streak ?? 0;
  const streakResetHappened = params.streakResetHappened ?? false;

  // 1. Profile Completion: +200 XP (rewardProfileCompletion in xp_service.dart)
  const hasProfile = Boolean(profile && typeof profile === 'object' && Object.keys(profile).length > 0);
  const profileXp = hasProfile ? 200 : 0;

  // 2. Weekly Check-ins: +50 XP per distinct completed week from weekly_logs (rewardWeeklyCheckin)
  const distinctWeeks = new Set<string>();
  if (Array.isArray(weeklyLogs)) {
    for (const log of weeklyLogs) {
      if (log && log.week_index && log.log_month && log.log_year) {
        if (!log.status || log.status.toLowerCase() !== 'pending') {
          distinctWeeks.add(`${log.log_year}-${log.log_month}-${log.week_index}`);
        }
      }
    }
  }
  const weeklyCheckinXp = distinctWeeks.size * 50;

  // 3. Badges: +100 XP per unlocked badge (rewardBadge in xp_service.dart)
  // Evaluated in exact app badge order: debt_free, emergency_complete, investment_starter, protection_pro, comeback_kid
  const evalContext: BadgeEvaluationContext = {
    profile,
    dashboard,
    streak,
    streakResetHappened,
  };
  const unlockedBadges = ALL_BADGES.filter((b) => evaluateBadgeCriteria(b.id, evalContext));
  const unlockedBadgeIds = unlockedBadges.map((b) => b.id);
  const badgesXp = unlockedBadges.length * 100;

  // 4. Pillar Mastery: +100 XP per pillar where score >= 100 (checkPillarMastery in xp_service.dart)
  let masteredPillarsCount = 0;
  if (dashboard?.pillars && typeof dashboard.pillars === 'object') {
    for (const pillarData of Object.values(dashboard.pillars)) {
      const score = (pillarData as any)?.score ?? 0;
      if (score >= 100) {
        masteredPillarsCount++;
      }
    }
  }
  const pillarMasteryXp = masteredPillarsCount * 100;

  // 5. Streak Bonus: +150 XP for 4+ week streak (rewardStreakBonus in xp_service.dart)
  const streakBonusXp = streak >= 4 ? 150 : 0;

  // 6. Score Improvement (+10 XP per point):
  // NOTE: In the mobile app (xp_service.dart checkScoreImprovement), +10 XP per
  // fitness score point is awarded relative to device-local baseline and last_known_fitness_score
  // in SharedPreferences. Since historical score deltas are not recorded in Supabase,
  // this incremental score XP cannot be reconstructed deterministically on web without local history.

  const totalXp = profileXp + weeklyCheckinXp + badgesXp + pillarMasteryXp + streakBonusXp;
  const levelInfo = gamificationStore.getLevelInfo(totalXp);

  return {
    totalXp,
    levelInfo,
    unlockedBadges,
    unlockedBadgeIds,
  };
}

/**
 * Loads current Supabase data (profile, dashboard, weeklyLogs) and derives gamification info.
 * Falls back to localStorage gamificationStore when offline or unauthenticated.
 */
export async function loadDerivedGamification(): Promise<DerivedGamification> {
  try {
    const [profileRes, dashboardRes, weeklyLogsRes] = await Promise.allSettled([
      apiService.getMasterProfile(),
      apiService.getDashboard(),
      apiService.getAllWeeklyLogs(),
    ]);

    const profile =
      profileRes.status === 'fulfilled' && profileRes.value
        ? ((profileRes.value as any)?.data !== undefined ? (profileRes.value as any).data : profileRes.value)
        : null;

    const dashboard =
      dashboardRes.status === 'fulfilled' && dashboardRes.value
        ? dashboardRes.value
        : null;

    const weeklyLogs =
      weeklyLogsRes.status === 'fulfilled' && Array.isArray(weeklyLogsRes.value)
        ? weeklyLogsRes.value
        : [];

    const streak = gamificationStore.getStreak();
    const streakResetHappened =
      typeof window !== 'undefined' && localStorage.getItem('streak_reset_happened') === 'true';

    // If we have live Supabase data (profile, dashboard, or weeklyLogs)
    if (profile || dashboard || (weeklyLogs && weeklyLogs.length > 0)) {
      const derived = deriveGamificationFromData({
        profile,
        dashboard,
        weeklyLogs,
        streak,
        streakResetHappened,
      });

      // Synchronize with local store so that any other components querying the store reflect the latest derived values
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          localStorage.setItem('user_total_xp', derived.totalXp.toString());
          localStorage.setItem('unlocked_badges_list', JSON.stringify(derived.unlockedBadgeIds));
        } catch {
          // ignore
        }
      }

      return derived;
    }
  } catch (err) {
    console.error('Failed to load derived gamification from Supabase:', err);
  }

  // Fallback to localStorage gamificationStore
  const fallbackXp = gamificationStore.getTotalXp();
  const fallbackLevel = gamificationStore.getLevelInfo(fallbackXp);
  const fallbackIds = gamificationStore.getUnlockedBadges();
  const fallbackBadges = ALL_BADGES.filter((b) => fallbackIds.includes(b.id));

  return {
    totalXp: fallbackXp,
    levelInfo: fallbackLevel,
    unlockedBadges: fallbackBadges,
    unlockedBadgeIds: fallbackIds,
  };
}
