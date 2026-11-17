import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  createCheckout,
  isFreeActivationResponse,
} from '../services/checkoutService';
import { paymentService } from '../services/paymentService';
import * as checkoutServiceModule from '../services/checkoutService';
import * as gatewayLoaderModule from '../services/gatewayLoader';
import { apiService } from '../services/apiService';
import { SubscriptionPage } from '../pages/SubscriptionPage';
import { ToastProvider } from '../context/ToastContext';
import * as referralServiceModule from '../services/referralService';

describe('Free Activation Path Tests', () => {
  const originalFetch = globalThis.fetch;
  const mockJwt = 'mock-jwt-token-free-activation';

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test-project.supabase.co');

    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          access_token: mockJwt,
          user: { id: 'user-free-1' } as any,
        } as any,
      },
      error: null,
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  // ---------------------------------------------------------------------------
  // 1. checkoutService tests
  // ---------------------------------------------------------------------------
  describe('checkoutService free activation detection', () => {
    it('isFreeActivationResponse identifies free grants across various server shapes', () => {
      expect(isFreeActivationResponse({ free: true })).toBe(true);
      expect(isFreeActivationResponse({ provider: 'FREE' })).toBe(true);
      expect(isFreeActivationResponse({ provider: 'free' })).toBe(true);
      expect(isFreeActivationResponse({ premium_granted: true })).toBe(true);
      expect(isFreeActivationResponse({ granted: true })).toBe(true);
      expect(isFreeActivationResponse({ activated: true })).toBe(true);
      expect(isFreeActivationResponse({ status: 'SUCCESS' })).toBe(true);
      expect(isFreeActivationResponse({ status: 'success' })).toBe(true);
      expect(isFreeActivationResponse({ status: 'FREE' })).toBe(true);
      expect(isFreeActivationResponse({ status: 'ACTIVATED' })).toBe(true);

      // Must NOT treat standard gateways as free even if status is SUCCESS
      expect(isFreeActivationResponse({ provider: 'FEDERAL_BANK', status: 'SUCCESS' })).toBe(false);
      expect(isFreeActivationResponse({ provider: 'CASHFREE', status: 'SUCCESS' })).toBe(false);

      // Null or non-free shapes
      expect(isFreeActivationResponse(null)).toBe(false);
      expect(isFreeActivationResponse({})).toBe(false);
      expect(isFreeActivationResponse({ unknown_field: 123 })).toBe(false);
    });

    it('createCheckout returns { provider: "FREE", granted: true } on free activation response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            free: true,
            order_id: 'FREE_ORDER_999',
            status: 'SUCCESS',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const res = await createCheckout('PRO_QUARTERLY', 'FINFREE');
      expect(res).toEqual({
        provider: 'FREE',
        granted: true,
        order_id: 'FREE_ORDER_999',
      });
    });

    it('createCheckout preserves normal CASHFREE and FEDERAL_BANK responses', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            provider: 'CASHFREE',
            payment_session_id: 'cf_sess_123',
            pay_mode: 'TEST',
            order_id: 'CF_ORD_1',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const cfRes = await createCheckout('PRO_YEARLY');
      expect(cfRes.provider).toBe('CASHFREE');

      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            provider: 'FEDERAL_BANK',
            access_key: 'fb_key_123',
            pay_mode: 'test',
            order_id: 'FB_ORD_1',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const fbRes = await createCheckout('PRO_YEARLY');
      expect(fbRes.provider).toBe('FEDERAL_BANK');
    });

    it('createCheckout logs keys only and throws on unknown 200 response shape', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            some_mystery_key: 'secret_value',
            another_flag: 42,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      await expect(createCheckout('PRO_YEARLY')).rejects.toThrow('Unsupported payment provider');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Checkout] Unrecognized checkout response keys:',
        ['some_mystery_key', 'another_flag']
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 2. paymentService free activation tests
  // ---------------------------------------------------------------------------
  describe('paymentService FREE provider branching', () => {
    it('FREE path does NOT load gateway scripts, refreshes plan, and cleans up overlay', async () => {
      const easebuzzLoaderSpy = vi.spyOn(gatewayLoaderModule, 'loadEasebuzzScript');
      const cashfreeLoaderSpy = vi.spyOn(gatewayLoaderModule, 'loadCashfreeScript');

      vi.spyOn(checkoutServiceModule, 'createCheckout').mockResolvedValue({
        provider: 'FREE',
        granted: true,
        order_id: 'FREE_ORD_100',
      });

      const refreshSpy = vi.fn().mockResolvedValue(undefined);
      const toastSpy = vi.fn();
      const navigateSpy = vi.fn();

      vi.spyOn(apiService, 'getSubscriptionDetails').mockResolvedValue({
        current_period_end: new Date(Date.now() + 86400000 * 90).toISOString(),
      } as any);

      const result = await paymentService.startCheckout(
        {
          id: 'test_plan',
          planCode: 'PRO_QUARTERLY',
          title: 'Quarterly',
          months: 3,
          storePrice: '₹499',
          totalBilledPrice: '₹1,497',
          originalPrice: '₹799',
          discount: '38%',
          savings: '₹897',
          image: 'img.png',
        },
        {
          referralCode: 'FINFREE',
          isReferralValid: true,
          refreshPlan: refreshSpy,
          showToast: toastSpy,
          navigate: navigateSpy,
        }
      );

      // Gateways never loaded
      expect(easebuzzLoaderSpy).not.toHaveBeenCalled();
      expect(cashfreeLoaderSpy).not.toHaveBeenCalled();

      // Refresh called and success handling triggered
      expect(refreshSpy).toHaveBeenCalled();
      expect(toastSpy).toHaveBeenCalledWith('PRO activated 🎉');
      expect(navigateSpy).toHaveBeenCalledWith('/dashboard');
      expect(result).toEqual({ ok: true, orderId: 'FREE_ORD_100' });

      // Overlay must be cleaned up
      expect(document.getElementById('finalize-blocking-overlay')).toBeNull();
    });

    it('shows non-failure status message if plan is not PRO after retries, and removes overlay', async () => {
      vi.spyOn(checkoutServiceModule, 'createCheckout').mockResolvedValue({
        provider: 'FREE',
        granted: true,
        order_id: 'FREE_ORD_DELAYED',
      });

      const toastSpy = vi.fn();

      // Simulate expired or null subscription
      vi.spyOn(apiService, 'getSubscriptionDetails').mockResolvedValue({
        current_period_end: new Date(Date.now() - 1000).toISOString(),
      } as any);

      // Use fake timers to speed up 1.5s retries
      vi.useFakeTimers();

      const checkoutPromise = paymentService.startCheckout(
        {
          id: 'test_plan',
          planCode: 'PRO_QUARTERLY',
          title: 'Quarterly',
          months: 3,
          storePrice: '₹499',
          totalBilledPrice: '₹1,497',
          originalPrice: '₹799',
          discount: '38%',
          savings: '₹897',
          image: 'img.png',
        },
        {
          showToast: toastSpy,
        }
      );

      // Fast-forward through retry delays (5 attempts * 1500ms)
      for (let i = 0; i < 6; i++) {
        await vi.advanceTimersByTimeAsync(1600);
      }

      const result = await checkoutPromise;
      vi.useRealTimers();

      expect(toastSpy).toHaveBeenCalledWith(
        'Your plan is being activated. Please check again in a minute.'
      );
      expect(result).toEqual({ ok: true, orderId: 'FREE_ORD_DELAYED' });
      expect(document.getElementById('finalize-blocking-overlay')).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // 3. SubscriptionPage UI tests
  // ---------------------------------------------------------------------------
  describe('SubscriptionPage UI for ₹0 price', () => {
    it('changes button label to "Activate PRO for free" and displays note when final price is ₹0', async () => {
      // Mock supabase plans query
      const mockPlans = [
        {
          id: 'q1',
          plan_code: 'PRO_QUARTERLY',
          title: 'Quarterly Plan',
          discounted_price: 1497,
          original_price: 799,
          months_duration: 3,
          is_recommended: false,
        },
      ];

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockPlans, error: null }),
      } as any);

      // Mock subscription details
      vi.spyOn(apiService, 'getSubscriptionDetails').mockResolvedValue({
        tier: 'Free',
        current_period_end: null,
      } as any);

      // Mock referral validation to return ₹1497 discount (making final price ₹0 for Quarterly)
      vi.spyOn(referralServiceModule, 'validateReferralCode').mockResolvedValue({
        valid: true,
        status: 'valid',
        discountAmount: 1497,
        message: 'Referral code applied! You get ₹1,497 off.',
      });

      render(
        <MemoryRouter>
          <ToastProvider>
            <SubscriptionPage />
          </ToastProvider>
        </MemoryRouter>
      );

      // Select Quarterly Plan (₹1497)
      const quarterlyCard = await screen.findByTestId('sub-plan-card-3');
      fireEvent.click(quarterlyCard);

      // Initially without referral code, button displays standard text
      const buyBtn = await screen.findByTestId('buy-plan-btn');
      expect(buyBtn).toHaveTextContent(/Get Financially Free/i);
      expect(screen.queryByTestId('free-activation-note')).toBeNull();

      // Enter referral code that yields ₹1497 discount
      const referralInput = screen.getByTestId('referral-code-input');
      const applyBtn = screen.getByTestId('apply-referral-btn');

      fireEvent.change(referralInput, { target: { value: 'FINFREE' } });
      fireEvent.click(applyBtn);

      // Button updates to "Activate PRO for free"
      await waitFor(() => {
        expect(screen.getByTestId('buy-plan-btn')).toHaveTextContent('Activate PRO for free');
      });

      // Free activation note is visible
      const note = screen.getByTestId('free-activation-note');
      expect(note).toHaveTextContent('No payment needed. Your referral code covers this plan.');
    });
  });
});
