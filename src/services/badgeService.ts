/**
 * Gamification Badges Service
 * Mirrors achievements_screen.dart and dashboard_screen.dart _checkBadges.
 */

import { apiService } from './apiService';
import { gamificationStore, GamificationStore } from './gamificationStore';

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
      // Web Deviation: Only unlock when activeLoans is explicitly defined and numerically 0
      // (Missing, blank, or null activeLoans does NOT unlock debt_free)
      if (!context.profile || !('activeLoans' in context.profile)) {
        return false;
      }
      const raw = context.profile.activeLoans;
      if (raw === null || raw === undefined) return false;
      if (typeof raw === 'string' && raw.trim() === '') return false;
      const num = Number(raw);
      return !isNaN(num) && num === 0;
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
