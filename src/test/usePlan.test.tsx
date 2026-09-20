import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePlan } from '../hooks/usePlan';
import { apiService } from '../services/apiService';
import { premiumService, PremiumService, isProPlan } from '../services/premiumService';

describe('usePlan hook — bse_data.user_subscriptions database integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    premiumService.resetSyncTimesForTesting();
    delete (window as any).__MOCK_PLAN__;
  });

  afterEach(() => {
    delete (window as any).__MOCK_PLAN__;
  });

  it('usePlan returns isPro=true when the DB row has a valid pro plan string and unexpired current_period_end', async () => {
    const futureDate = new Date(Date.now() + 30 * 86400000).toISOString();
    vi.spyOn(apiService, 'getSubscriptionDetails').mockResolvedValue({
      user_id: 'user-pro-123',
      tier: 'pro',
      status: 'active',
      current_period_end: futureDate,
    });

    const { result } = renderHook(() => usePlan());

    await waitFor(() => {
      expect(result.current.isPro).toBe(true);
    });

    expect(result.current.plan).toBe('pro');
    expect(result.current.canAccessPremium).toBe(true);
    expect(result.current.isFeatureAccessible).toBe(true);
    expect(result.current.trialDaysRemaining).toBe(365);
  });

  it('usePlan returns isPro=false when expired', async () => {
    const pastDate = new Date(Date.now() - 5 * 86400000).toISOString();
    vi.spyOn(apiService, 'getSubscriptionDetails').mockResolvedValue({
      user_id: 'user-expired-123',
      tier: 'pro',
      status: 'active',
      current_period_end: pastDate,
    });

    const { result } = renderHook(() => usePlan());

    await waitFor(() => {
      expect(result.current.isPro).toBe(false);
    });

    expect(result.current.plan).toBe('b2c');
  });

  it('usePlan returns isPro=false when no row exists', async () => {
    vi.spyOn(apiService, 'getSubscriptionDetails').mockResolvedValue(null);

    const { result } = renderHook(() => usePlan());

    await waitFor(() => {
      expect(result.current.isPro).toBe(false);
    });

    expect(result.current.plan).toBe('b2c');
  });

  it('falls back to localStorage/user_metadata when the DB fetch errors', async () => {
    localStorage.setItem('user_plan', 'pro');
    vi.spyOn(apiService, 'getSubscriptionDetails').mockRejectedValue(new Error('PostgREST offline'));

    const { result } = renderHook(() => usePlan());

    await waitFor(() => {
      expect(result.current.isPro).toBe(true);
    });

    expect(result.current.plan).toBe('pro');
    expect(result.current.canAccessPremium).toBe(true);
  });

  it('localStorage cache gets updated after a successful DB fetch', async () => {
    // 1. Successful pro fetch writes 'pro' (or pro plan) to localStorage
    const futureDate = new Date(Date.now() + 60 * 86400000).toISOString();
    vi.spyOn(apiService, 'getSubscriptionDetails').mockResolvedValue({
      user_id: 'user-sync-test',
      tier: 'pro',
      status: 'active',
      current_period_end: futureDate,
    });

    expect(localStorage.getItem('user_plan')).toBeNull();

    const { result, unmount } = renderHook(() => usePlan());

    await waitFor(() => {
      expect(result.current.isPro).toBe(true);
      expect(localStorage.getItem('user_plan')).toBe('pro');
    });

    unmount();

    // 2. Subsequent expired fetch updates localStorage to free membership
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    vi.spyOn(apiService, 'getSubscriptionDetails').mockResolvedValue({
      user_id: 'user-sync-test',
      tier: 'pro',
      status: 'active',
      current_period_end: pastDate,
    });

    const { result: expiredResult } = renderHook(() => usePlan());

    await waitFor(() => {
      expect(expiredResult.current.isPro).toBe(false);
      expect(localStorage.getItem('user_plan')).toBe(PremiumService.freeMembership);
    });
  });

  describe('normalization logic matches premiumService isPro exactly', () => {
    const normalizationCases = [
      { plan: 'pro', expected: true },
      { plan: 'PRO', expected: true },
      { plan: 'moneymapper pro membership', expected: true },
      { plan: 'MoneyMapper Pro Membership', expected: true },
      { plan: 'paid member', expected: true },
      { plan: 'wealth select tier', expected: true },
      { plan: 'enterprise gold access', expected: true },
      { plan: 'b2c', expected: false },
      { plan: 'free', expected: false },
      { plan: 'standard', expected: false },
      { plan: '', expected: false },
      { plan: null, expected: false },
      { plan: undefined, expected: false },
    ];

    normalizationCases.forEach(({ plan, expected }) => {
      it(`evaluates tier "${plan}" from DB row to isPro=${expected}, matching isProPlan exactly`, async () => {
        // Assert parity with isProPlan utility first
        expect(isProPlan(plan as any)).toBe(expected);

        const futureDate = new Date(Date.now() + 15 * 86400000).toISOString();
        vi.spyOn(apiService, 'getSubscriptionDetails').mockResolvedValue({
          user_id: 'user-norm-test',
          tier: plan,
          status: 'active',
          current_period_end: futureDate,
        });

        const { result } = renderHook(() => usePlan());

        await waitFor(() => {
          expect(result.current.isPro).toBe(expected);
        });

        if (expected) {
          expect(result.current.plan).toBe('pro');
        } else {
          expect(result.current.plan).toBe('b2c');
        }
      });
    });
  });
});
