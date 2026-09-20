import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, waitFor, act, renderHook } from '@testing-library/react';
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { AuthProvider } from '../context/AuthContext';
import { usePlan } from '../hooks/usePlan';
import { premiumService } from '../services/premiumService';
import { apiService } from '../services/apiService';
import { supabase } from '../lib/supabase';

const mockUser: User = {
  id: 'user-sync-events-123',
  app_metadata: {},
  user_metadata: { plan: 'b2c' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'sync_test@example.com',
};

const mockSession: Session = {
  access_token: 'valid-mock-access-token',
  refresh_token: 'valid-mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: mockUser,
};

describe('Subscription Sync Events & Throttle Parity', () => {
  let authCallbacks: Array<(event: AuthChangeEvent, session: Session | null) => void> = [];

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    premiumService.resetSyncTimesForTesting();
    delete (window as any).__MOCK_PLAN__;
    authCallbacks = [];

    // Capture auth callback when registered by AuthProvider
    vi.spyOn(supabase.auth, 'onAuthStateChange').mockImplementation((cb: any) => {
      authCallbacks.push(cb);
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(),
            id: 'sub-id',
            callback: cb,
          },
        },
      } as any;
    });

    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: null },
      error: null,
    });
  });

  afterEach(() => {
    delete (window as any).__MOCK_PLAN__;
  });

  it('1. mock onAuthStateChange to fire INITIAL_SESSION with a session present -> sync function IS called', async () => {
    const syncSpy = vi.spyOn(premiumService, 'syncSubscriptionStatus').mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <div data-testid="child">Child Content</div>
      </AuthProvider>
    );

    expect(authCallbacks.length).toBeGreaterThan(0);

    // Fire INITIAL_SESSION with active session
    await act(async () => {
      authCallbacks.forEach((cb) => cb('INITIAL_SESSION', mockSession));
    });

    expect(syncSpy).toHaveBeenCalled();
  });

  it('2. SIGNED_OUT -> sync NOT called, and clears cached plan', async () => {
    const syncSpy = vi.spyOn(premiumService, 'syncSubscriptionStatus').mockResolvedValue(undefined);
    const clearSpy = vi.spyOn(premiumService, 'clearLocalPlan');

    render(
      <AuthProvider>
        <div data-testid="child">Child Content</div>
      </AuthProvider>
    );

    syncSpy.mockClear();

    // Fire SIGNED_OUT
    await act(async () => {
      authCallbacks.forEach((cb) => cb('SIGNED_OUT', null));
    });

    expect(syncSpy).not.toHaveBeenCalled();
    expect(clearSpy).toHaveBeenCalled();
  });

  it('3. two rapid INITIAL_SESSION/SIGNED_IN events within the 5-minute throttle window -> sync called only once', async () => {
    const dbSpy = vi.spyOn(apiService, 'getSubscriptionDetails').mockResolvedValue({
      tier: 'pro',
      status: 'active',
      current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
    });

    render(
      <AuthProvider>
        <div data-testid="child">Child Content</div>
      </AuthProvider>
    );

    // 1. First event: INITIAL_SESSION
    await act(async () => {
      authCallbacks.forEach((cb) => cb('INITIAL_SESSION', mockSession));
    });

    await waitFor(() => {
      expect(dbSpy).toHaveBeenCalledTimes(1);
    });

    // 2. Second event immediately: SIGNED_IN
    await act(async () => {
      authCallbacks.forEach((cb) => cb('SIGNED_IN', mockSession));
    });

    // Throttled! DB query still called only once
    expect(dbSpy).toHaveBeenCalledTimes(1);
  });

  it('4. refreshPlan() manually bypasses the throttle when explicitly forced (or default) and respects it when force=false', async () => {
    // UX RATIONALE:
    // When a user clicks "Refresh" (e.g. on /subscription after purchasing in mobile),
    // they expect immediate server-side validation. Therefore, refreshPlan(force=true)
    // bypasses the 5-minute throttle by default. When force=false is explicitly supplied,
    // it respects the throttle window.
    const dbSpy = vi.spyOn(apiService, 'getSubscriptionDetails').mockResolvedValue({
      tier: 'pro',
      status: 'active',
      current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
    });

    // 1. Initial sync establishes the 5-minute window
    await premiumService.syncSubscriptionStatus();
    expect(dbSpy).toHaveBeenCalledTimes(1);

    // 2. Calling with force=false while within the 5-minute window respects throttle
    await premiumService.refreshPlan(false);
    expect(dbSpy).toHaveBeenCalledTimes(1);

    // 3. Calling refreshPlan() with default or force=true manually bypasses throttle
    await premiumService.refreshPlan(true);
    expect(dbSpy).toHaveBeenCalledTimes(2);

    // 4. Same behavior through usePlan().refreshPlan()
    const { result } = renderHook(() => usePlan());
    // Mount triggers fetch (#3)
    await waitFor(() => {
      expect(dbSpy).toHaveBeenCalledTimes(3);
    });

    // Manual forced refresh through usePlan bypasses throttle (#4)
    await act(async () => {
      await result.current.refreshPlan(true);
    });
    expect(dbSpy).toHaveBeenCalledTimes(4);

    // Respects throttle through usePlan when force=false (still #4)
    await act(async () => {
      await result.current.refreshPlan(false);
    });
    expect(dbSpy).toHaveBeenCalledTimes(4);
  });
});
