import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  getTrialStartMs,
  isFeatureAccessible,
  getTrialDaysRemaining,
  isProPlan,
} from '../services/premiumService';

/**
 * usePlan hook
 * 
 * Provides current subscription plan, PRO status, feature accessibility, and trial days.
 * Anchored to the Supabase user's created_at behind getTrialStartMs().
 * Supports window.__MOCK_PLAN__ for explicit test overrides.
 * Uses optional useContext(AuthContext) to avoid throwing when rendered in isolated test trees.
 */
export interface PlanState {
  isPro: boolean;
  isFeatureAccessible: boolean;
  trialDaysRemaining: number;
  plan: 'b2c' | 'pro' | 'corporate';
}

export function usePlan(): PlanState {
  // Can be controlled in tests via window.__MOCK_PLAN__
  if (typeof window !== 'undefined' && (window as any).__MOCK_PLAN__) {
    return (window as any).__MOCK_PLAN__;
  }

  let auth = null;
  try {
    auth = useContext(AuthContext);
  } catch {
    // Allows calling usePlan() outside React component tree (e.g. legacy/stub unit tests)
    auth = null;
  }
  const user = auth?.user ?? null;
  const planString = user?.user_metadata?.plan || (user as any)?.plan || 'b2c';
  const isPro = isProPlan(planString);
  const trialStartMs = getTrialStartMs(user);
  const accessible = isFeatureAccessible(isPro, trialStartMs);
  const daysRemaining = getTrialDaysRemaining(isPro, trialStartMs);

  return {
    isPro,
    isFeatureAccessible: accessible,
    trialDaysRemaining: daysRemaining,
    plan: isPro ? 'pro' : 'b2c',
  };
}
