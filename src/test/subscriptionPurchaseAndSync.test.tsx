import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SubscriptionPage } from '../pages/SubscriptionPage';
import { paymentService } from '../services/paymentService';
import { apiService } from '../services/apiService';
import { premiumService } from '../services/premiumService';
import { supabase } from '../lib/supabase';
import { ToastProvider } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import { useSubscriptionSync } from '../hooks/useSubscriptionSync';

function renderSubscriptionPage() {
  return render(
    <MemoryRouter initialEntries={['/subscription']}>
      <ToastProvider>
        <SubscriptionPage />
      </ToastProvider>
    </MemoryRouter>
  );
}

const mockDbPlans = [
  {
    id: 'db_plan_3',
    plan_code: 'mm_quarterly_prod',
    title: 'Quarterly Plan',
    months_duration: 3,
    discounted_price: 1497,
    original_price: 799,
    is_recommended: false,
  },
  {
    id: 'db_plan_6',
    plan_code: 'mm_halfyearly_prod',
    title: 'Half-Yearly Plan',
    months_duration: 6,
    discounted_price: 2394,
    original_price: 799,
    is_recommended: false,
  },
  {
    id: 'db_plan_12',
    plan_code: 'mm_yearly_prod',
    title: 'Yearly Plan',
    months_duration: 12,
    discounted_price: 3588,
    original_price: 799,
    is_recommended: true,
  },
];

describe('Subscription Purchase & Realtime Sync Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    premiumService.resetSyncTimesForTesting?.();
    delete (window as any).__MOCK_PLAN__;
    vi.stubEnv('VITE_RAZORPAY_KEY_ID', 'rzp_test_mock_123');

    // Default mock for payments.plans in Supabase
    const mockOrder = vi.fn().mockResolvedValue({ data: mockDbPlans, error: null });
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
    const mockSchema = vi.fn().mockReturnValue({ from: mockFrom });
    vi.spyOn(supabase, 'schema').mockImplementation(mockSchema as any);
  });

  afterEach(() => {
    delete (window as any).__MOCK_PLAN__;
    delete (window as any).Razorpay;
    vi.unstubAllEnvs();
  });

  it('1. Updates CTA text per selected plan (Quarterly, Half-Yearly, Yearly)', async () => {
    vi.spyOn(apiService, 'getSubscriptionDetails').mockResolvedValue(null);
    renderSubscriptionPage();

    await waitFor(() => {
      expect(screen.getByTestId('subscription-page-title')).toBeInTheDocument();
    });

    const buyBtn = screen.getByTestId('buy-plan-btn');
    // Default is Yearly
    expect(buyBtn).toHaveTextContent('Get Financially Free (₹3,588)');

    // Select Quarterly (3 months)
    fireEvent.click(screen.getByTestId('sub-plan-card-3'));
    expect(buyBtn).toHaveTextContent('Get Financially Free (₹1,497)');

    // Select Half-Yearly (6 months)
    fireEvent.click(screen.getByTestId('sub-plan-card-6'));
    expect(buyBtn).toHaveTextContent('Get Financially Free (₹2,394)');

    // Re-select Yearly (12 months)
    fireEvent.click(screen.getByTestId('sub-plan-card-12'));
    expect(buyBtn).toHaveTextContent('Get Financially Free (₹3,588)');
  });

  it('2. Shows "Online payments are not available right now." and does not grant PRO when payment service is unavailable or network error occurs', async () => {
    vi.stubEnv('VITE_RAZORPAY_KEY_ID', '');
    vi.spyOn(apiService, 'getSubscriptionDetails').mockResolvedValue(null);
    renderSubscriptionPage();

    await waitFor(() => {
      expect(screen.getByTestId('buy-plan-btn')).toBeInTheDocument();
    });

    // Mock startCheckout throwing network/unreachable error
    vi.spyOn(paymentService, 'startCheckout').mockRejectedValue(new Error('Network error. Failed to initiate checkout.'));

    const buyBtn = screen.getByTestId('buy-plan-btn');
    await act(async () => {
      fireEvent.click(buyBtn);
    });

    expect(await screen.findByText('Online payments are not available right now.')).toBeInTheDocument();
    expect(premiumService.getCachedPlan()).not.toContain('pro');
    expect(screen.queryByTestId('pro-badge')).not.toBeInTheDocument();
  });

  it('3. Cancelling checkout shows "Payment cancelled." toast without failure message or granting PRO', async () => {
    vi.spyOn(apiService, 'getSubscriptionDetails').mockResolvedValue(null);
    renderSubscriptionPage();

    await waitFor(() => {
      expect(screen.getByTestId('buy-plan-btn')).toBeInTheDocument();
    });

    // Mock user dismiss
    vi.spyOn(paymentService, 'startCheckout').mockRejectedValue({
      isCancelled: true,
      message: 'Payment cancelled.',
    });

    const buyBtn = screen.getByTestId('buy-plan-btn');
    await act(async () => {
      fireEvent.click(buyBtn);
    });

    expect(await screen.findByText('Payment cancelled.')).toBeInTheDocument();
    expect(screen.queryByText(/Purchase Failed:/)).not.toBeInTheDocument();
    expect(screen.queryByTestId('pro-badge')).not.toBeInTheDocument();
  });

  it('4. Success flow calls paymentService, refreshes plan, updates expiry banner and shows welcome toast', async () => {
    let currentPeriodEnd: string | null = null;
    vi.spyOn(apiService, 'getSubscriptionDetails').mockImplementation(async () => {
      if (!currentPeriodEnd) return null;
      return {
        tier: 'MoneyMapper Pro Membership',
        current_period_end: currentPeriodEnd,
      };
    });

    renderSubscriptionPage();

    await waitFor(() => {
      expect(screen.getByTestId('subscription-status-text')).toHaveTextContent('Free Tier - Limited Access');
    });

    // Mock successful purchase
    const futureDate = new Date('2028-05-15T12:00:00Z').toISOString();
    vi.spyOn(paymentService, 'startCheckout').mockImplementation(async () => {
      currentPeriodEnd = futureDate;
      return { ok: true, orderId: 'MM_MOCK_123' };
    });

    const buyBtn = screen.getByTestId('buy-plan-btn');
    await act(async () => {
      fireEvent.click(buyBtn);
    });

    // Success toast
    expect(
      await screen.findByText('🎉 Payment Successful! Welcome to Wealth Select Pro.')
    ).toBeInTheDocument();

    // Banner updated immediately without reload
    await waitFor(() => {
      expect(screen.getByTestId('pro-badge')).toBeInTheDocument();
      expect(screen.getByTestId('subscription-status-text')).toHaveTextContent(/Valid until:/);
    });
  });

  it('5. useSubscriptionSync refreshes on window focus with 15-second throttle', async () => {
    const refreshSpy = vi.spyOn(premiumService, 'refreshPlan').mockResolvedValue();

    const mockAuthContext = {
      user: { id: 'test-user-123' },
      loading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={mockAuthContext as any}>{children}</AuthContext.Provider>
    );

    renderHook(() => useSubscriptionSync(), { wrapper });

    // 1st focus: triggers refresh
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    expect(refreshSpy).toHaveBeenCalledTimes(1);

    // Immediate 2nd focus within 15s: throttled, ignored
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });

  it('6. useSubscriptionSync triggers refresh on Supabase Realtime postgres_changes event', async () => {
    const refreshSpy = vi.spyOn(premiumService, 'refreshPlan').mockResolvedValue();

    let realtimeCallback: (() => void) | null = null;
    const mockChannel = {
      on: vi.fn().mockImplementation((_type, _opts, callback) => {
        realtimeCallback = callback;
        return mockChannel;
      }),
      subscribe: vi.fn().mockImplementation((callback) => {
        if (callback) callback('SUBSCRIBED');
        return mockChannel;
      }),
      unsubscribe: vi.fn().mockResolvedValue('ok'),
    };

    vi.spyOn(supabase, 'channel').mockReturnValue(mockChannel as any);

    const mockAuthContext = {
      user: { id: 'test-user-456' },
      loading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={mockAuthContext as any}>{children}</AuthContext.Provider>
    );

    renderHook(() => useSubscriptionSync(), { wrapper });

    expect(supabase.channel).toHaveBeenCalledWith('sub-test-user-456');
    expect(realtimeCallback).not.toBeNull();

    // Trigger Realtime event (e.g. mobile app purchase wrote to user_subscriptions)
    await act(async () => {
      realtimeCallback!();
    });

    expect(refreshSpy).toHaveBeenCalledWith(true);
  });

  it('7. When payments.plans query fails or returns empty, fallback plans are displayed, purchase button is disabled, and toast warning is shown', async () => {
    // Mock payments.plans query failure
    const mockOrder = vi.fn().mockResolvedValue({ data: [], error: new Error('PostgREST schema payments not found') });
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
    const mockSchema = vi.fn().mockReturnValue({ from: mockFrom });
    vi.spyOn(supabase, 'schema').mockImplementation(mockSchema as any);

    vi.spyOn(apiService, 'getSubscriptionDetails').mockResolvedValue(null);

    renderSubscriptionPage();

    await waitFor(() => {
      expect(screen.getByTestId('subscription-page-title')).toBeInTheDocument();
    });

    // Fallback plans are visible (3, 6, 12 months)
    expect(screen.getByTestId('sub-plan-card-3')).toBeInTheDocument();
    expect(screen.getByTestId('sub-plan-card-6')).toBeInTheDocument();
    expect(screen.getByTestId('sub-plan-card-12')).toBeInTheDocument();

    // Button is disabled
    const buyBtn = screen.getByTestId('buy-plan-btn');
    expect(buyBtn).toBeDisabled();

    // Toast message is shown
    expect(
      await screen.findByText('Plans are unavailable right now. Please try again later.')
    ).toBeInTheDocument();
  });

  it('8. Purchase flow shows sync delayed message and does NOT show welcome toast if finalizeTransaction fails or returns false', async () => {
    vi.spyOn(apiService, 'getSubscriptionDetails').mockResolvedValue(null);
    renderSubscriptionPage();

    await waitFor(() => {
      expect(screen.getByTestId('buy-plan-btn')).toBeInTheDocument();
    });

    vi.spyOn(paymentService, 'startCheckout').mockRejectedValue(
      new Error('Payment received but sync delayed. Please contact support if PRO is not active.')
    );

    const buyBtn = screen.getByTestId('buy-plan-btn');
    await act(async () => {
      fireEvent.click(buyBtn);
    });

    expect(
      await screen.findByText('Payment received but sync delayed. Please contact support if PRO is not active.')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('🎉 Payment Successful! Welcome to Wealth Select Pro.')
    ).not.toBeInTheDocument();
  });
});
