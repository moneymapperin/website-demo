import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { supabase } from '../lib/supabase';
import { createCheckout, GatewaysUnavailableError } from '../services/checkoutService';
import {
  loadEasebuzzScript,
  loadCashfreeScript,
  resetGatewayLoadersForTesting,
  EASEBUZZ_SCRIPT_URL,
  CASHFREE_SCRIPT_URL,
} from '../services/gatewayLoader';
import { finalizeTransaction } from '../services/finalizeService';
import { paymentService } from '../services/paymentService';
import { apiService } from '../services/apiService';
import { SubPlan } from '../pages/SubscriptionPage';

const mockYearlyPlan: SubPlan = {
  id: 'db_plan_12',
  planCode: 'mm_yearly_prod',
  title: 'Yearly Plan',
  months: 12,
  storePrice: '₹299',
  totalBilledPrice: '₹3,588',
  originalPrice: '₹799',
  discount: '62% OFF',
  savings: 'SAVE ₹6,000',
  image: 'yearly.png',
  isRecommended: true,
};

const mockQuarterlyPlan: SubPlan = {
  id: 'db_plan_3',
  planCode: 'mm_quarterly_prod',
  title: 'Quarterly Plan',
  months: 3,
  storePrice: '₹499',
  totalBilledPrice: '₹1,497',
  originalPrice: '₹799',
  discount: '38% OFF',
  savings: 'SAVE ₹897',
  image: 'quarterly.png',
};

const mockHalfYearlyPlan: SubPlan = {
  id: 'db_plan_6',
  planCode: 'mm_halfyearly_prod',
  title: 'Half-Yearly Plan',
  months: 6,
  storePrice: '₹399',
  totalBilledPrice: '₹2,394',
  originalPrice: '₹799',
  discount: '50% OFF',
  savings: 'SAVE ₹2,400',
  image: 'halfyearly.png',
};

describe('Web Payment Flow Tests (PAYMENTS_WEB_GUIDE)', () => {
  const originalFetch = globalThis.fetch;
  const mockJwt = 'mock-jwt-token-12345';

  beforeEach(() => {
    vi.restoreAllMocks();
    resetGatewayLoadersForTesting();
    document.querySelectorAll('script').forEach((s) => s.remove());
    delete (window as any).EasebuzzCheckout;
    delete (window as any).Cashfree;

    vi.stubEnv('VITE_SUPABASE_URL', 'https://test-project.supabase.co');

    // Default authenticated session
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          access_token: mockJwt,
          user: { id: 'user-1' } as any,
        } as any,
      },
      error: null,
    });

    // Default future subscription period for successful checkout validation
    vi.spyOn(apiService, 'getSubscriptionDetails').mockResolvedValue({
      current_period_end: new Date(Date.now() + 86400000).toISOString(),
    } as any);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete (window as any).EasebuzzCheckout;
    delete (window as any).Cashfree;
    resetGatewayLoadersForTesting();
    vi.unstubAllEnvs();
  });

  // ---------------------------------------------------------------------------
  // 1. createCheckout tests
  // ---------------------------------------------------------------------------
  describe('createCheckout()', () => {
    it('builds the correct URL, headers, and body omitting empty referral_code', async () => {
      let capturedUrl = '';
      let capturedOptions: any = null;

      globalThis.fetch = vi.fn().mockImplementation(async (url, opts) => {
        capturedUrl = url.toString();
        capturedOptions = opts;
        return new Response(
          JSON.stringify({
            provider: 'FEDERAL_BANK',
            access_key: 'eb_test_access_key',
            pay_mode: 'test',
            order_id: 'MM1730000000000123',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      });

      const res = await createCheckout('PRO_YEARLY', '');

      expect(capturedUrl).toBe('https://test-project.supabase.co/functions/v1/create_checkout');
      expect(capturedOptions.method).toBe('POST');
      expect(capturedOptions.headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockJwt}`,
      });

      const sentBody = JSON.parse(capturedOptions.body);
      expect(sentBody).toEqual({ plan_code: 'PRO_YEARLY' });
      expect(sentBody.referral_code).toBeUndefined();

      expect(res).toEqual({
        provider: 'FEDERAL_BANK',
        access_key: 'eb_test_access_key',
        pay_mode: 'test',
        order_id: 'MM1730000000000123',
      });
    });

    it('includes referral_code when a valid non-empty string is provided', async () => {
      let sentBody: any = null;

      globalThis.fetch = vi.fn().mockImplementation(async (_url, opts) => {
        sentBody = JSON.parse(opts.body);
        return new Response(
          JSON.stringify({
            provider: 'CASHFREE',
            payment_session_id: 'session_test_xyz',
            pay_mode: 'TEST',
            order_id: 'MM1730000000000456',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      });

      const res = await createCheckout('PRO_QUARTERLY', 'SAVE20');
      expect(sentBody).toEqual({
        plan_code: 'PRO_QUARTERLY',
        referral_code: 'SAVE20',
      });
      expect(res.provider).toBe('CASHFREE');
    });

    it('throws typed GatewaysUnavailableError when status is 500 with "All payment gateways are currently unavailable."', async () => {
      globalThis.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              error: 'All payment gateways are currently unavailable.',
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          )
        )
      );

      await expect(createCheckout('PRO_YEARLY')).rejects.toThrow(GatewaysUnavailableError);

      try {
        await createCheckout('PRO_YEARLY');
      } catch (err: any) {
        expect(err.message).toBe('Payments are temporarily down for maintenance. Please try again later.');
        expect(err.code).toBe('GATEWAYS_UNAVAILABLE');
      }
    });

    it('handles network failure with a generic user-friendly message', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

      await expect(createCheckout('PRO_YEARLY')).rejects.toThrow(
        'Network error. Failed to initiate checkout.'
      );
    });

    it('handles non-JSON error response gracefully', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response('<html>Bad Gateway</html>', {
          status: 502,
          headers: { 'Content-Type': 'text/html' },
        })
      );

      await expect(createCheckout('PRO_YEARLY')).rejects.toThrow(
        'Payment gateway response error. Please try again later.'
      );
    });

    it('throws error if user is not logged in', async () => {
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await expect(createCheckout('PRO_YEARLY')).rejects.toThrow('User not logged in');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Gateway Loader tests
  // ---------------------------------------------------------------------------
  describe('gatewayLoader', () => {
    it('loadEasebuzzScript() appends Easebuzz checkout script from official S3 URL', async () => {
      const promise = loadEasebuzzScript();
      const scriptTag = document.querySelector(`script[src="${EASEBUZZ_SCRIPT_URL}"]`);
      expect(scriptTag).not.toBeNull();

      (window as any).EasebuzzCheckout = vi.fn();
      scriptTag?.dispatchEvent(new Event('load'));

      const loaded = await promise;
      expect(loaded).toBe(true);

      // Second call returns cached promise immediately
      const secondCall = await loadEasebuzzScript();
      expect(secondCall).toBe(true);
    });

    it('loadCashfreeScript() appends Cashfree v3 SDK script', async () => {
      const promise = loadCashfreeScript();
      const scriptTag = document.querySelector(`script[src="${CASHFREE_SCRIPT_URL}"]`);
      expect(scriptTag).not.toBeNull();

      (window as any).Cashfree = vi.fn();
      scriptTag?.dispatchEvent(new Event('load'));

      const loaded = await promise;
      expect(loaded).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. finalizeTransaction tests
  // ---------------------------------------------------------------------------
  describe('finalizeTransaction()', () => {
    it('RPC true returns ok: true', async () => {
      const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValue({
        data: true,
        error: null,
      } as any);

      const res = await finalizeTransaction('MM1730000000000123');

      expect(rpcSpy).toHaveBeenCalledWith('finalize_transaction', {
        p_order_id: 'MM1730000000000123',
      });
      expect(res).toEqual({
        ok: true,
        data: true,
      });
    });

    it('RPC false must NOT be success and returns fallback message', async () => {
      vi.spyOn(supabase, 'rpc').mockResolvedValue({
        data: false,
        error: null,
      } as any);

      const res = await finalizeTransaction('MM1730000000000123');

      expect(res.ok).toBe(false);
      expect(res.error).toBe(
        'Payment received but sync delayed. Please contact support if PRO is not active.'
      );
    });

    it('PAYMENT_PENDING then success: retries and returns ok: true', async () => {
      const rpcSpy = vi
        .spyOn(supabase, 'rpc')
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'PAYMENT_PENDING' },
        } as any)
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'PAYMENT_PENDING' },
        } as any)
        .mockResolvedValueOnce({
          data: true,
          error: null,
        } as any);

      const res = await finalizeTransaction('MM1730000000000123', 5);

      expect(rpcSpy).toHaveBeenCalledTimes(3);
      expect(res).toEqual({
        ok: true,
        data: true,
      });
    });

    it('PAYMENT_PENDING forever: fails after 4 retries (5 total calls) with fallback message', async () => {
      const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValue({
        data: null,
        error: { message: 'PAYMENT_PENDING' },
      } as any);

      const res = await finalizeTransaction('MM1730000000000123', 5);

      expect(rpcSpy).toHaveBeenCalledTimes(5);
      expect(res.ok).toBe(false);
      expect(res.error).toBe(
        'Payment received but sync delayed. Please contact support if PRO is not active.'
      );
    });

    it('other error shows the fallback message', async () => {
      const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValue({
        data: null,
        error: { message: 'Database failure' },
      } as any);

      const res = await finalizeTransaction('MM1730000000000123', 5);

      expect(rpcSpy).toHaveBeenCalledTimes(1);
      expect(res.ok).toBe(false);
      expect(res.error).toBe(
        'Payment received but sync delayed. Please contact support if PRO is not active.'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Provider Branching & Full Flow in paymentService.startCheckout
  // ---------------------------------------------------------------------------
  describe('paymentService.startCheckout()', () => {
    it('returns plan.planCode only and throws if planCode is missing', () => {
      expect(paymentService.getPlanCode(mockYearlyPlan)).toBe('mm_yearly_prod');
      expect(paymentService.getPlanCode(mockHalfYearlyPlan)).toBe('mm_halfyearly_prod');
      expect(paymentService.getPlanCode(mockQuarterlyPlan)).toBe('mm_quarterly_prod');

      const planWithoutCode: SubPlan = { ...mockYearlyPlan, planCode: undefined };
      expect(() => paymentService.getPlanCode(planWithoutCode)).toThrow(
        'Plan is not available for purchase right now.'
      );
    });

    it('throws before making any network call when planCode is missing', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      const planWithoutCode: SubPlan = { ...mockYearlyPlan, planCode: undefined };

      await expect(paymentService.startCheckout(planWithoutCode)).rejects.toThrow(
        'Plan is not available for purchase right now.'
      );
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('FEDERAL_BANK provider: loads Easebuzz SDK, instantiates checkout and calls finalize on success', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            provider: 'FEDERAL_BANK',
            access_key: 'eb_mock_key_999',
            pay_mode: 'test',
            order_id: 'ORDER_EB_123',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      let capturedOptions: any = null;
      const mockInitiatePayment = vi.fn().mockImplementation((opts) => {
        capturedOptions = opts;
      });

      function MockEasebuzzCheckout(this: any, accessKey: string, payMode: string) {
        expect(accessKey).toBe('eb_mock_key_999');
        expect(payMode).toBe('test');
        this.initiatePayment = mockInitiatePayment;
      }
      (window as any).EasebuzzCheckout = MockEasebuzzCheckout;

      const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValue({
        data: true,
        error: null,
      } as any);

      const mockNavigate = vi.fn();
      const mockShowToast = vi.fn();
      const mockRefreshPlan = vi.fn().mockResolvedValue(true);
      const mockOnFinalizingChange = vi.fn();

      const checkoutPromise = paymentService.startCheckout(mockYearlyPlan, {
        navigate: mockNavigate,
        showToast: mockShowToast,
        refreshPlan: mockRefreshPlan,
        onFinalizingChange: mockOnFinalizingChange,
      });

      // Allow microtasks to execute checkout initiation
      await vi.waitFor(() => {
        expect(mockInitiatePayment).toHaveBeenCalledTimes(1);
      });

      expect(capturedOptions.access_key).toBe('eb_mock_key_999');
      expect(capturedOptions.theme).toBe('#4F46E5');

      // Simulate successful payment callback from Easebuzz
      await capturedOptions.onResponse({ status: 'success' });

      const result = await checkoutPromise;
      expect(result).toEqual({ ok: true, orderId: 'ORDER_EB_123' });

      // Verify finalize was called
      expect(rpcSpy).toHaveBeenCalledWith('finalize_transaction', {
        p_order_id: 'ORDER_EB_123',
      });

      // Verify overlay notifications
      expect(mockOnFinalizingChange).toHaveBeenCalledWith(true);
      expect(mockOnFinalizingChange).toHaveBeenCalledWith(false);

      // Verify post-success actions
      expect(mockRefreshPlan).toHaveBeenCalledWith(true);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('FEDERAL_BANK provider: does NOT call finalize on user cancellation or failure', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            provider: 'FEDERAL_BANK',
            access_key: 'eb_mock_key_888',
            pay_mode: 'test',
            order_id: 'ORDER_EB_CANCEL',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      let capturedOptions: any = null;
      function MockEasebuzzCancel(this: any) {
        this.initiatePayment = (opts: any) => {
          capturedOptions = opts;
        };
      }
      (window as any).EasebuzzCheckout = MockEasebuzzCancel;

      const rpcSpy = vi.spyOn(supabase, 'rpc');
      const mockShowToast = vi.fn();

      const checkoutPromise = paymentService.startCheckout(mockQuarterlyPlan, {
        showToast: mockShowToast,
      });

      await vi.waitFor(() => {
        expect(capturedOptions).not.toBeNull();
      });

      // Simulate user cancellation
      await capturedOptions.onResponse({ status: 'user_cancelled' });

      await expect(checkoutPromise).rejects.toEqual({
        isCancelled: true,
        message: 'Payment cancelled.',
      });

      expect(rpcSpy).not.toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith('Payment cancelled.');
    });

    it('CASHFREE provider: initializes Cashfree SDK, calls checkout, and finalizes on paymentDetails', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            provider: 'CASHFREE',
            payment_session_id: 'cf_session_abc123',
            pay_mode: 'TEST',
            order_id: 'ORDER_CF_456',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      let checkoutPromiseResolver: (val: any) => void;
      const checkoutMock = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            checkoutPromiseResolver = resolve;
          })
      );

      const MockCashfree = vi.fn().mockImplementation((config) => {
        expect(config).toEqual({ mode: 'sandbox' });
        return { checkout: checkoutMock };
      });
      (window as any).Cashfree = MockCashfree;

      const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValue({
        data: true,
        error: null,
      } as any);

      const mockNavigate = vi.fn();
      const mockRefreshPlan = vi.fn().mockResolvedValue(true);

      const startPromise = paymentService.startCheckout(mockHalfYearlyPlan, {
        navigate: mockNavigate,
        refreshPlan: mockRefreshPlan,
      });

      await vi.waitFor(() => {
        expect(checkoutMock).toHaveBeenCalledWith({
          paymentSessionId: 'cf_session_abc123',
          redirectTarget: '_modal',
        });
      });

      // Simulate payment success returned by Cashfree modal
      checkoutPromiseResolver!({
        paymentDetails: { paymentMessage: 'Transaction Successful' },
      });

      const res = await startPromise;
      expect(res).toEqual({ ok: true, orderId: 'ORDER_CF_456' });

      expect(rpcSpy).toHaveBeenCalledWith('finalize_transaction', {
        p_order_id: 'ORDER_CF_456',
      });
      expect(mockRefreshPlan).toHaveBeenCalledWith(true);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('CASHFREE provider: handles user closing modal or payment error without calling finalize', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            provider: 'CASHFREE',
            payment_session_id: 'cf_session_err',
            pay_mode: 'PROD',
            order_id: 'ORDER_CF_ERR',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      (window as any).Cashfree = vi.fn().mockReturnValue({
        checkout: vi.fn().mockResolvedValue({
          error: { message: 'User closed payment window', code: 'USER_DROPPED' },
        }),
      });

      const rpcSpy = vi.spyOn(supabase, 'rpc');
      const mockShowToast = vi.fn();

      await expect(
        paymentService.startCheckout(mockYearlyPlan, {
          showToast: mockShowToast,
        })
      ).rejects.toEqual({
        isCancelled: true,
        message: 'Payment cancelled.',
      });

      expect(rpcSpy).not.toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith('Payment cancelled.');
    });

    it('shows sync-delayed toast if finalizeTransaction fails after gateway success', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            provider: 'FEDERAL_BANK',
            access_key: 'eb_key_fail_sync',
            pay_mode: 'test',
            order_id: 'ORDER_SYNC_FAIL',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      let capturedOptions: any = null;
      function MockEasebuzzCancel(this: any) {
        this.initiatePayment = (opts: any) => {
          capturedOptions = opts;
        };
      }
      (window as any).EasebuzzCheckout = MockEasebuzzCancel;

      // Simulate RPC error on finalize
      vi.spyOn(supabase, 'rpc').mockResolvedValue({
        data: null,
        error: { message: 'RPC timeout' },
      } as any);

      const mockShowToast = vi.fn();
      const checkoutPromise = paymentService.startCheckout(mockYearlyPlan, {
        showToast: mockShowToast,
      });

      await vi.waitFor(() => {
        expect(capturedOptions).not.toBeNull();
      });

      await capturedOptions.onResponse({ status: 'success' });

      await expect(checkoutPromise).rejects.toThrow(
        'Payment received but sync delayed. Please contact support if PRO is not active.'
      );

      expect(mockShowToast).toHaveBeenCalledWith(
        'Payment received but sync delayed. Please contact support if PRO is not active.'
      );
    });

    it('rejects with fallback message if finalizeTransaction succeeds but current_period_end is not in the future', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            provider: 'FEDERAL_BANK',
            access_key: 'eb_key_unexpired_check',
            pay_mode: 'test',
            order_id: 'ORDER_EXPIRED_CHECK',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      let capturedOptions: any = null;
      function MockEasebuzz(this: any) {
        this.initiatePayment = (opts: any) => {
          capturedOptions = opts;
        };
      }
      (window as any).EasebuzzCheckout = MockEasebuzz;

      // Finalize RPC returns true
      vi.spyOn(supabase, 'rpc').mockResolvedValue({
        data: true,
        error: null,
      } as any);

      // But subscription current_period_end is in the past
      vi.spyOn(apiService, 'getSubscriptionDetails').mockResolvedValue({
        current_period_end: new Date(Date.now() - 3600000).toISOString(),
      } as any);

      const mockShowToast = vi.fn();
      const checkoutPromise = paymentService.startCheckout(mockYearlyPlan, {
        showToast: mockShowToast,
      });

      await vi.waitFor(() => {
        expect(capturedOptions).not.toBeNull();
      });

      await capturedOptions.onResponse({ status: 'success' });

      await expect(checkoutPromise).rejects.toThrow(
        'Payment received but sync delayed. Please contact support if PRO is not active.'
      );
      expect(mockShowToast).toHaveBeenCalledWith(
        'Payment received but sync delayed. Please contact support if PRO is not active.'
      );
    });
  });
});
