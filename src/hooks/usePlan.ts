import { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  getTrialStartMs,
  isFeatureAccessible,
  getTrialDaysRemaining,
  isProPlan,
  premiumService,
  PremiumService,
} from '../services/premiumService';
import { apiService } from '../services/apiService';
import { supabase } from '../lib/supabase';

/**
 * usePlan hook
 * 
 * Provides current subscription plan, PRO status, feature accessibility, and trial days.
 * Anchored to the Supabase user's created_at behind getTrialStartMs().
 * Primary source of truth is bse_data.user_subscriptions fetched via apiService.getSubscriptionDetails().
 * Falls back to localStorage / user_metadata when fetch errors.
 * On successful fetch, syncs with premiumService.setPlan(...) to update local cache.
 * Reactive to PremiumService background syncs and auth state transitions.
 * Supports window.__MOCK_PLAN__ for explicit test overrides.
 */
export interface PlanState {
  isPro: boolean;
  isFeatureAccessible: boolean;
  trialActive: boolean;
  canAccessPremium: boolean;
  trialDaysRemaining: number;
  plan: 'b2c' | 'pro' | 'corporate';
  refreshPlan: (force?: boolean) => Promise<void>;
}

export function createPlanState(isPro: boolean, user: any, planName?: string): PlanState {
  const trialStartMs = getTrialStartMs(user);
  const accessible = isFeatureAccessible(isPro, trialStartMs);
  const daysRemaining = getTrialDaysRemaining(isPro, trialStartMs);
  const trialActive = !isPro && accessible;
  const canAccessPremium = isPro || trialActive;

  let resolvedPlan: 'b2c' | 'pro' | 'corporate' = isPro ? 'pro' : 'b2c';
  if (!isPro && planName === 'corporate') {
    resolvedPlan = 'corporate';
  }

  return {
    isPro,
    isFeatureAccessible: accessible,
    trialActive,
    canAccessPremium,
    trialDaysRemaining: daysRemaining,
    plan: resolvedPlan,
    refreshPlan: (force?: boolean) => premiumService.refreshPlan(force),
  };
}

export function calculateFallbackPlanState(user: any): PlanState {
  if (typeof window !== 'undefined' && (window as any).__MOCK_PLAN__) {
    const mock = (window as any).__MOCK_PLAN__;
    const isPro = Boolean(mock.isPro);
    const isFeatureAccessible = mock.isFeatureAccessible !== undefined ? Boolean(mock.isFeatureAccessible) : true;
    const trialActive = mock.trialActive !== undefined ? Boolean(mock.trialActive) : (!isPro && isFeatureAccessible);
    const canAccessPremium = mock.canAccessPremium !== undefined ? Boolean(mock.canAccessPremium) : (isPro || trialActive);
    return {
      isPro,
      isFeatureAccessible,
      trialActive,
      canAccessPremium,
      trialDaysRemaining: mock.trialDaysRemaining ?? (isPro ? 365 : 7),
      plan: mock.plan ?? (isPro ? 'pro' : 'b2c'),
      refreshPlan: mock.refreshPlan ?? (async () => {}),
      ...mock,
    };
  }

  const localPlan = premiumService.getCachedPlan();
  const planString = localPlan || user?.user_metadata?.plan || (user as any)?.plan || 'b2c';
  const isPro = isProPlan(planString);
  return createPlanState(isPro, user, planString);
}

export function usePlan(): PlanState {
  let auth = null;
  try {
    auth = useContext(AuthContext);
  } catch {
    auth = null;
  }
  const user = auth?.user ?? null;
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const refreshPlan = useCallback(async (force: boolean = true) => {
    await premiumService.refreshPlan(force);
  }, []);

  const [planState, setPlanState] = useState<PlanState>(() => calculateFallbackPlanState(user));

  const applyPlanState = useCallback((nextState: PlanState) => {
    setPlanState((prev) => {
      if (
        prev.isPro === nextState.isPro &&
        prev.plan === nextState.plan &&
        prev.canAccessPremium === nextState.canAccessPremium &&
        prev.trialActive === nextState.trialActive &&
        prev.isFeatureAccessible === nextState.isFeatureAccessible &&
        prev.trialDaysRemaining === nextState.trialDaysRemaining
      ) {
        return prev;
      }
      return nextState;
    });
  }, []);

  const fetchSubscription = useCallback(async () => {
    if (typeof window !== 'undefined' && (window as any).__MOCK_PLAN__) {
      return;
    }

    try {
      const details = await apiService.getSubscriptionDetails();

      if (details) {
        const rawPlan = details.tier ?? details.plan;
        const hasProString = isProPlan(rawPlan);
        const isUnexpired = details.current_period_end
          ? new Date(details.current_period_end).getTime() > Date.now()
          : false;
        const isPro = hasProString && isUnexpired;

        applyPlanState(createPlanState(isPro, userRef.current, rawPlan));

        if (isPro) {
          await premiumService.setPlan(rawPlan || PremiumService.proMembership);
        } else {
          await premiumService.setPlan(PremiumService.freeMembership);
        }
      } else {
        // Fetch returned nothing -> fall back gracefully to existing localStorage / user_metadata check
        applyPlanState(calculateFallbackPlanState(userRef.current));
      }
    } catch (err) {
      // DB fetch failed / network error -> fall back gracefully to localStorage / user_metadata
      console.warn('[usePlan] DB fetch failed, falling back to cache/metadata:', err);
      applyPlanState(calculateFallbackPlanState(userRef.current));
    }
  }, [applyPlanState]);

  useEffect(() => {
    let isMounted = true;

    // Fetch latest subscription from DB
    fetchSubscription().catch(() => {});

    // Subscribe to PremiumService notifications
    const unsubscribe = premiumService.subscribe(() => {
      if (isMounted) {
        applyPlanState(calculateFallbackPlanState(userRef.current));
      }
    });

    // Listen to Supabase auth state transitions
    let authSub: { unsubscribe: () => void } | null = null;
    try {
      const { data } = supabase.auth.onAuthStateChange((event) => {
        if (!isMounted) return;
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
          fetchSubscription().catch(() => {});
        } else if (event === 'SIGNED_OUT') {
          premiumService.clearLocalPlan();
          applyPlanState({
            isPro: false,
            isFeatureAccessible: false,
            trialActive: false,
            canAccessPremium: false,
            trialDaysRemaining: 0,
            plan: 'b2c',
            refreshPlan,
          });
        }
      });
      authSub = data?.subscription ?? null;
    } catch {
      // Supabase not initialized in isolated test environments
    }

    return () => {
      isMounted = false;
      unsubscribe();
      authSub?.unsubscribe();
    };
  }, [fetchSubscription, applyPlanState, user, refreshPlan]);

  // If window.__MOCK_PLAN__ is explicitly defined, return it directly so legacy tests using mock work instantly
  if (typeof window !== 'undefined' && (window as any).__MOCK_PLAN__) {
    const mock = (window as any).__MOCK_PLAN__;
    const isPro = Boolean(mock.isPro);
    const isFeatureAccessible = mock.isFeatureAccessible !== undefined ? Boolean(mock.isFeatureAccessible) : true;
    const trialActive = mock.trialActive !== undefined ? Boolean(mock.trialActive) : (!isPro && isFeatureAccessible);
    const canAccessPremium = mock.canAccessPremium !== undefined ? Boolean(mock.canAccessPremium) : (isPro || trialActive);
    return {
      isPro,
      isFeatureAccessible,
      trialActive,
      canAccessPremium,
      trialDaysRemaining: mock.trialDaysRemaining ?? (isPro ? 365 : 7),
      plan: mock.plan ?? (isPro ? 'pro' : 'b2c'),
      refreshPlan: mock.refreshPlan ?? (async () => {}),
      ...mock,
    };
  }

  return {
    ...planState,
    refreshPlan,
  };
}
