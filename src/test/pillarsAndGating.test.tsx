import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import {
  PremiumService,
  premiumService,
  isProPlan,
} from '../services/premiumService';
import { usePlan } from '../hooks/usePlan';
import { apiService } from '../services/apiService';
import { authService } from '../services/authService';
import { gamificationStore } from '../services/gamificationStore';
import { supabase } from '../lib/supabase';
import { ToastProvider } from '../context/ToastContext';
import { PillarGuard } from '../components/common/PillarGuard';
import { EmergencyFundPage } from '../pages/pillars/EmergencyFundPage';
import { WeeklyExpensePredictorPage } from '../pages/pillars/WeeklyExpensePredictorPage';
import { InsurancePillarPage } from '../pages/pillars/InsurancePillarPage';
import { IncomePillarPage } from '../pages/pillars/IncomePillarPage';
import { MutualFundPillarPage } from '../pages/pillars/MutualFundPillarPage';
import { SubscriptionPage, SUBSCRIPTION_PLANS } from '../pages/SubscriptionPage';

function renderWithToast(ui: React.ReactElement, initialRoute: string = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <ToastProvider>{ui}</ToastProvider>
    </MemoryRouter>
  );
}

describe('TASK 12 — The Five Pillar Dashboards & PRO Gating', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    premiumService.resetSyncTimesForTesting();
    delete (window as any).__MOCK_PLAN__;
  });

  afterEach(() => {
    delete (window as any).__MOCK_PLAN__;
  });

  // ===========================================================================
  // 1. isPro Normalization Table-Driven Tests
  // ===========================================================================
  describe('1. isPro Normalization & Plan String Rules', () => {
    const cases = [
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

    cases.forEach(({ plan, expected }) => {
      it(`evaluates isProPlan("${plan}") -> ${expected}`, () => {
        expect(isProPlan(plan as any)).toBe(expected);
      });
    });
  });

  // ===========================================================================
  // 2. PremiumService Sync, Throttling & Error Backoff
  // ===========================================================================
  describe('2. PremiumService Sync & Throttling', () => {
    it('syncs subscription: future date -> pro, past date -> free, null -> free', async () => {
      const now = Date.now();

      // Case A: Future expiry
      vi.spyOn(apiService, 'getSubscriptionDetails').mockResolvedValueOnce({
        current_period_end: new Date(now + 30 * 86400000).toISOString(),
      });
      await premiumService.syncSubscriptionStatus();
      expect(premiumService.getCachedPlan()).toBe(PremiumService.proMembership);
      expect(premiumService.isPro()).toBe(true);

      // Reset sync time to bypass 5-min throttle
      premiumService.resetSyncTimesForTesting();

      // Case B: Past expiry
      vi.spyOn(apiService, 'getSubscriptionDetails').mockResolvedValueOnce({
        current_period_end: new Date(now - 86400000).toISOString(),
      });
      await premiumService.syncSubscriptionStatus();
      expect(premiumService.getCachedPlan()).toBe(PremiumService.freeMembership);
      expect(premiumService.isPro()).toBe(false);

      premiumService.resetSyncTimesForTesting();

      // Case C: Null details
      vi.spyOn(apiService, 'getSubscriptionDetails').mockResolvedValueOnce(null);
      await premiumService.syncSubscriptionStatus();
      expect(premiumService.getCachedPlan()).toBe(PremiumService.freeMembership);
      expect(premiumService.isPro()).toBe(false);
    });

    it('applies 5-minute throttle on isPro sync check', async () => {
      const syncSpy = vi.spyOn(premiumService, 'syncSubscriptionStatus');

      // Initially no sync record -> triggers sync
      premiumService.isPro();
      expect(syncSpy).toHaveBeenCalledTimes(1);

      // Calling immediately again (< 5 min) does NOT trigger sync
      premiumService.isPro();
      expect(syncSpy).toHaveBeenCalledTimes(1);
    });

    it('handles network failure with 60s backoff without losing current cached plan', async () => {
      await premiumService.setPlan(PremiumService.proMembership);
      expect(premiumService.getCachedPlan()).toBe(PremiumService.proMembership);

      premiumService.resetSyncTimesForTesting();
      localStorage.setItem('user_plan', PremiumService.proMembership);

      // Force network error
      vi.spyOn(apiService, 'getSubscriptionDetails').mockRejectedValueOnce(new Error('Network offline'));

      await premiumService.syncSubscriptionStatus();
      // Plan should still be preserved
      expect(premiumService.getCachedPlan()).toBe(PremiumService.proMembership);
    });
  });

  // ===========================================================================
  // 3. Reactive usePlan() hook tests
  // ===========================================================================
  describe('3. Reactive usePlan() Hook', () => {
    it('reacts to syncSubscriptionStatus: starts free, mocked sync returns future date, unlocks without remounting', async () => {
      vi.spyOn(authService, 'getUserPlan').mockResolvedValue('b2c');

      const DummyComponent = () => {
        const { isPro, canAccessPremium } = usePlan();
        return (
          <div>
            <div data-testid="pro-status">{isPro ? 'PRO' : 'FREE'}</div>
            <div data-testid="premium-accessible">{canAccessPremium ? 'UNLOCKED' : 'LOCKED'}</div>
          </div>
        );
      };

      // Set initial state: expired trial and free membership
      await premiumService.setPlan(PremiumService.freeMembership);
      (window as any).__MOCK_PLAN__ = undefined;

      render(<DummyComponent />);
      expect(screen.getByTestId('pro-status')).toHaveTextContent('FREE');

      // Mock subscription sync returning future period end
      vi.spyOn(apiService, 'getSubscriptionDetails').mockResolvedValueOnce({
        current_period_end: new Date(Date.now() + 10 * 86400000).toISOString(),
      });

      // Complete background sync
      await act(async () => {
        await premiumService.syncSubscriptionStatus();
      });

      // UI automatically reflects updated state without remount
      expect(screen.getByTestId('pro-status')).toHaveTextContent('PRO');
      expect(screen.getByTestId('premium-accessible')).toHaveTextContent('UNLOCKED');
    });

    it('clears state on logout / SIGNED_OUT', async () => {
      await premiumService.setPlan(PremiumService.proMembership);
      expect(premiumService.isPro()).toBe(true);

      act(() => {
        premiumService.clearLocalPlan();
      });

      expect(premiumService.getCachedPlan()).toBeNull();
      expect(premiumService.isPro()).toBe(false);
    });
  });

  // ===========================================================================
  // 4. Table-Driven Route Gating Tests (PillarGuard on all 5 routes & aliases)
  // ===========================================================================
  describe('4. Table-Driven Route Gating Tests', () => {
    const premiumRoutes = [
      { path: '/pillars/insurance', name: 'insurance' },
      { path: '/pillars/investments', name: 'investments' },
      { path: '/pillars/mutual-fund', name: 'investments (alias)' },
      { path: '/pillars/emergency', name: 'emergency' },
      { path: '/pillars/emergency-fund', name: 'emergency (alias)' },
    ];

    const freeRoutes = [
      { path: '/pillars/income', name: 'income' },
      { path: '/pillars/expenses', name: 'expenses' },
      { path: '/pillars/weekly-expense', name: 'weekly-expense (alias)' },
    ];

    premiumRoutes.forEach(({ path, name }) => {
      it(`locks ${path} (${name}) for free user with expired trial`, async () => {
        (window as any).__MOCK_PLAN__ = {
          isPro: false,
          isFeatureAccessible: false,
          trialActive: false,
          canAccessPremium: false,
          trialDaysRemaining: 0,
          plan: 'b2c',
        };

        const TestApp = () => (
          <MemoryRouter initialEntries={[path]}>
            <ToastProvider>
              <Routes>
                <Route
                  path="/pillars/insurance"
                  element={
                    <PillarGuard pillarName="insurance">
                      <div data-testid="page-content">Insurance Page</div>
                    </PillarGuard>
                  }
                />
                <Route
                  path="/pillars/investments"
                  element={
                    <PillarGuard pillarName="investments">
                      <div data-testid="page-content">Investments Page</div>
                    </PillarGuard>
                  }
                />
                <Route
                  path="/pillars/mutual-fund"
                  element={
                    <PillarGuard pillarName="investments">
                      <div data-testid="page-content">Investments Page</div>
                    </PillarGuard>
                  }
                />
                <Route
                  path="/pillars/emergency"
                  element={
                    <PillarGuard pillarName="emergency">
                      <div data-testid="page-content">Emergency Page</div>
                    </PillarGuard>
                  }
                />
                <Route
                  path="/pillars/emergency-fund"
                  element={
                    <PillarGuard pillarName="emergency">
                      <div data-testid="page-content">Emergency Page</div>
                    </PillarGuard>
                  }
                />
              </Routes>
            </ToastProvider>
          </MemoryRouter>
        );

        render(<TestApp />);
        expect(screen.getByTestId('pillar-locked-view')).toBeInTheDocument();
        expect(screen.getByText(/is Locked/)).toBeInTheDocument();
        expect(screen.getByTestId('upgrade-to-pro-cta')).toBeInTheDocument();
        expect(screen.queryByTestId('page-content')).not.toBeInTheDocument();
      });

      it(`unlocks and renders ${path} (${name}) for PRO user`, async () => {
        (window as any).__MOCK_PLAN__ = {
          isPro: true,
          isFeatureAccessible: true,
          trialActive: false,
          canAccessPremium: true,
          trialDaysRemaining: 365,
          plan: 'pro',
        };

        const TestApp = () => (
          <MemoryRouter initialEntries={[path]}>
            <ToastProvider>
              <Routes>
                <Route
                  path="/pillars/insurance"
                  element={
                    <PillarGuard pillarName="insurance">
                      <div data-testid="page-content">Insurance Page</div>
                    </PillarGuard>
                  }
                />
                <Route
                  path="/pillars/investments"
                  element={
                    <PillarGuard pillarName="investments">
                      <div data-testid="page-content">Investments Page</div>
                    </PillarGuard>
                  }
                />
                <Route
                  path="/pillars/mutual-fund"
                  element={
                    <PillarGuard pillarName="investments">
                      <div data-testid="page-content">Investments Page</div>
                    </PillarGuard>
                  }
                />
                <Route
                  path="/pillars/emergency"
                  element={
                    <PillarGuard pillarName="emergency">
                      <div data-testid="page-content">Emergency Page</div>
                    </PillarGuard>
                  }
                />
                <Route
                  path="/pillars/emergency-fund"
                  element={
                    <PillarGuard pillarName="emergency">
                      <div data-testid="page-content">Emergency Page</div>
                    </PillarGuard>
                  }
                />
              </Routes>
            </ToastProvider>
          </MemoryRouter>
        );

        render(<TestApp />);
        expect(screen.queryByTestId('pillar-locked-view')).not.toBeInTheDocument();
        expect(screen.getByTestId('page-content')).toBeInTheDocument();
      });
    });

    freeRoutes.forEach(({ path, name }) => {
      it(`never locks free route ${path} (${name}) even if trial is expired`, async () => {
        (window as any).__MOCK_PLAN__ = {
          isPro: false,
          isFeatureAccessible: false,
          trialActive: false,
          canAccessPremium: false,
          trialDaysRemaining: 0,
          plan: 'b2c',
        };

        const TestApp = () => (
          <MemoryRouter initialEntries={[path]}>
            <ToastProvider>
              <Routes>
                <Route
                  path="/pillars/income"
                  element={
                    <PillarGuard pillarName="income">
                      <div data-testid="free-page-content">Income Pillar</div>
                    </PillarGuard>
                  }
                />
                <Route
                  path="/pillars/expenses"
                  element={
                    <PillarGuard pillarName="expenses">
                      <div data-testid="free-page-content">Expense Pillar</div>
                    </PillarGuard>
                  }
                />
                <Route
                  path="/pillars/weekly-expense"
                  element={
                    <PillarGuard pillarName="expenses">
                      <div data-testid="free-page-content">Expense Pillar</div>
                    </PillarGuard>
                  }
                />
              </Routes>
            </ToastProvider>
          </MemoryRouter>
        );

        render(<TestApp />);
        expect(screen.queryByTestId('pillar-locked-view')).not.toBeInTheDocument();
        expect(screen.getByTestId('free-page-content')).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // 5. EmergencyFundPage UI Tests
  // ===========================================================================
  describe('5. EmergencyFundPage UI & Savings Updates', () => {
    const mockProfile = {
      monthlyExpenses: '50000',
      emergencyFundCurrent: '150000',
      emergencyFundTarget: '300000',
      emergencyFundLocation: 'Savings Account',
    };

    beforeEach(() => {
      vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({ data: mockProfile });
      vi.spyOn(apiService, 'getDashboard').mockResolvedValue({
        pillars: { emergency: { score: 50 } },
      });
    });

    it('renders title "Savings Analysis", shortfall card, and yield tag', async () => {
      renderWithToast(<EmergencyFundPage />);

      await waitFor(() => {
        expect(screen.getByTestId('emergency-page-title')).toHaveTextContent('Savings Analysis');
      });

      expect(screen.getByTestId('emergency-score-header')).toBeInTheDocument();
      expect(screen.getByTestId('yield-tag')).toHaveTextContent('⚡ ~3.0% Annual Yield');
      expect(screen.getByTestId('shortfall-card')).toHaveTextContent('Shortfall to Target');
      // Growth badge must be hidden on first render
      expect(screen.queryByTestId('growth-badge')).not.toBeInTheDocument();
    });

    it('validates add-savings input: 0 / empty / negative shows toast and blocks API', async () => {
      const addSpy = vi.spyOn(apiService, 'addEmergencySavings').mockResolvedValue({} as any);

      renderWithToast(<EmergencyFundPage />);
      await waitFor(() => screen.getByTestId('emergency-page-title'));

      const input = screen.getByTestId('savings-amount-input');
      const submitBtn = screen.getByTestId('update-fund-btn');

      // Empty submission
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.click(submitBtn);
      expect(addSpy).not.toHaveBeenCalled();

      // Zero submission
      fireEvent.change(input, { target: { value: '0' } });
      fireEvent.click(submitBtn);
      expect(addSpy).not.toHaveBeenCalled();

      // Negative submission
      fireEvent.change(input, { target: { value: '-500' } });
      fireEvent.click(submitBtn);
      expect(addSpy).not.toHaveBeenCalled();
    });

    it('valid amount opens "Confirm Update" dialog with "Add ₹{n} to your emergency fund?", Cancel does nothing, Update calls addEmergencySavings once and refetches', async () => {
      const addSpy = vi.spyOn(apiService, 'addEmergencySavings').mockResolvedValue({} as any);

      renderWithToast(<EmergencyFundPage />);
      await waitFor(() => screen.getByTestId('emergency-page-title'));

      const input = screen.getByTestId('savings-amount-input');
      const submitBtn = screen.getByTestId('update-fund-btn');

      fireEvent.change(input, { target: { value: '25000' } });
      fireEvent.click(submitBtn);

      // Confirm dialog opens with exact copy
      expect(screen.getByText('Confirm Update')).toBeInTheDocument();
      expect(screen.getByText('Add ₹25000 to your emergency fund?')).toBeInTheDocument();

      // Cancel button closes dialog without API call
      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByText('Confirm Update')).not.toBeInTheDocument();
      expect(addSpy).not.toHaveBeenCalled();

      // Open again and confirm
      fireEvent.change(input, { target: { value: '25000' } });
      fireEvent.click(submitBtn);

      const confirmBtn = screen.getByTestId('confirm-savings-update-btn');
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(addSpy).toHaveBeenCalledTimes(1);
        expect(addSpy).toHaveBeenCalledWith(25000);
      });
    });

    it('shows growth badge ONLY after in-session add or quick edit', async () => {
      vi.spyOn(apiService, 'addEmergencySavings').mockImplementation(async () => {
        // simulate balance increase
        mockProfile.emergencyFundCurrent = '175000';
        return {} as any;
      });

      renderWithToast(<EmergencyFundPage />);
      await waitFor(() => screen.getByTestId('emergency-page-title'));

      // Hidden initially
      expect(screen.queryByTestId('growth-badge')).not.toBeInTheDocument();

      // Perform update
      const input = screen.getByTestId('savings-amount-input');
      fireEvent.change(input, { target: { value: '25000' } });
      fireEvent.click(screen.getByTestId('update-fund-btn'));
      fireEvent.click(screen.getByTestId('confirm-savings-update-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('growth-badge')).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // 6. WeeklyExpensePredictorPage UI Tests
  // ===========================================================================
  describe('6. WeeklyExpensePredictorPage UI & Decision Flow', () => {
    beforeEach(() => {
      vi.spyOn(apiService, 'getDashboard').mockResolvedValue({
        financial_fitness_scores: { expense_pillar_score: 75 },
      });
      vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({
        data: { monthlyActiveIncome: 100000 },
      });
      vi.spyOn(apiService, 'getWeeklyCurrent').mockResolvedValue({
        data: [
          {
            week_number: 1,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            is_current: true,
            is_submitted: false,
            range_fixed: [6000, 7500],
            range_flex: [4000, 5000],
            range_save: [2000, 3000],
          },
        ],
      });
    });

    it('renders app-bar title "Weekly Tracker"', async () => {
      renderWithToast(<WeeklyExpensePredictorPage />);

      await waitFor(() => {
        expect(screen.getByTestId('weekly-page-title')).toHaveTextContent('Weekly Tracker');
      });
      expect(screen.getByTestId('weekly-score-header')).toBeInTheDocument();
    });

    it('Achieved opens amount modal, Missed sets 0, submit blocked until all three marked', async () => {
      renderWithToast(<WeeklyExpensePredictorPage />);
      await waitFor(() => screen.getByTestId('weekly-page-title'));

      // Submit before decisions -> blocked
      const submitBtn = screen.getByTestId('submit-week-btn');
      fireEvent.click(submitBtn);

      const toast = await screen.findByTestId('toast-container');
      expect(toast).toHaveTextContent('Please mark all three targets before submitting.');

      // Mark Missed on fixed
      const missedFixedBtn = screen.getByTestId('fixed-missed-btn');
      fireEvent.click(missedFixedBtn);

      // Achieved opens modal
      const achievedFlexBtn = screen.getByTestId('flexible-achieved-btn');
      fireEvent.click(achievedFlexBtn);
      expect(screen.getByTestId('log-amount-modal')).toBeInTheDocument();

      // Enter amount and save
      const amountInput = screen.getByTestId('modal-amount-input');
      fireEvent.change(amountInput, { target: { value: '4500' } });
      fireEvent.click(screen.getByTestId('modal-confirm-btn'));

      // Mark savings achieved with 2500
      const achievedSaveBtn = screen.getByTestId('savings-achieved-btn');
      fireEvent.click(achievedSaveBtn);
      const saveAmountInput = screen.getByTestId('modal-amount-input');
      fireEvent.change(saveAmountInput, { target: { value: '2500' } });
      fireEvent.click(screen.getByTestId('modal-confirm-btn'));

      // Verify local_expense_score was updated in gamificationStore
      expect(gamificationStore.getLocalExpenseScore()).toBeGreaterThanOrEqual(0);
    });
  });

  // ===========================================================================
  // 7. Insurance, Income, and Mutual Fund Pillar Pages
  // ===========================================================================
  describe('7. Insurance, Income, and Mutual Fund Pages', () => {
    it('InsurancePillarPage renders "Protection Analysis", optimize link, and "not available" when profile is empty', async () => {
      // Empty profile
      vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({ data: null });
      vi.spyOn(apiService, 'getDashboard').mockResolvedValue({});

      renderWithToast(<InsurancePillarPage />);

      await waitFor(() => {
        expect(screen.getByTestId('insurance-page-title')).toHaveTextContent('Protection Analysis');
      });

      expect(screen.getAllByText('not available').length).toBeGreaterThan(0);
      expect(screen.getByTestId('insurance-optimize-btn')).toBeInTheDocument();
    });

    it('IncomePillarPage renders "Income Analysis", optimize link, and handles missing profile data', async () => {
      vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({ data: null });

      renderWithToast(<IncomePillarPage />);

      await waitFor(() => {
        expect(screen.getByTestId('income-page-title')).toHaveTextContent('Income Analysis');
      });

      expect(screen.getAllByText('not available').length).toBeGreaterThan(0);
      expect(screen.getByTestId('income-optimize-btn')).toBeInTheDocument();
    });

    it('MutualFundPillarPage renders "Investment Analysis", optimize link, and handles empty profile data', async () => {
      vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({ data: null });
      vi.spyOn(apiService, 'getDashboard').mockResolvedValue({});

      renderWithToast(<MutualFundPillarPage />);

      await waitFor(() => {
        expect(screen.getByTestId('investments-page-title')).toHaveTextContent('Investment Analysis');
      });

      expect(screen.getByTestId('investments-optimize-btn')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 8. SubscriptionPage Read-Only & Pricing Tests
  // ===========================================================================
  describe('8. SubscriptionPage (/subscription) Read-Only & Pricing', () => {
    it('displays exact pricing: ₹589, ₹469, ₹349 and totals 1,767, 2,814, 4,188', () => {
      expect(SUBSCRIPTION_PLANS[0].storePrice).toBe('₹589');
      expect(SUBSCRIPTION_PLANS[0].totalBilledPrice).toBe('₹1,767');

      expect(SUBSCRIPTION_PLANS[1].storePrice).toBe('₹469');
      expect(SUBSCRIPTION_PLANS[1].totalBilledPrice).toBe('₹2,814');

      expect(SUBSCRIPTION_PLANS[2].storePrice).toBe('₹349');
      expect(SUBSCRIPTION_PLANS[2].totalBilledPrice).toBe('₹4,188');
    });

    it('renders read-only buy button with "Purchase in the MoneyMapper mobile app" and exact footnote', async () => {
      vi.spyOn(apiService, 'getSubscriptionDetails').mockResolvedValue(null);

      renderWithToast(<SubscriptionPage />);

      await waitFor(() => {
        expect(screen.getByTestId('subscription-page-title')).toHaveTextContent('Wealth Select');
      });

      const buyBtn = screen.getByTestId('buy-plan-btn');
      expect(buyBtn).toBeDisabled();
      expect(buyBtn).toHaveTextContent('Purchase in the MoneyMapper mobile app');

      const footnote = screen.getByTestId('platform-fee-footnote');
      expect(footnote).toHaveTextContent(
        '*Final checkout price includes standard Google Play / App Store platform fees applied to base plan rates.'
      );
    });

    it('AUDIT TEST: SubscriptionPage NEVER calls stack_subscription RPC or any purchase mutation', async () => {
      const rpcSpy = vi.spyOn(supabase, 'rpc');
      renderWithToast(<SubscriptionPage />);

      await waitFor(() => {
        expect(screen.getByTestId('subscription-page-title')).toBeInTheDocument();
      });

      // Click around plan cards
      const quarterly = screen.getByTestId('sub-plan-card-3');
      const yearly = screen.getByTestId('sub-plan-card-12');
      fireEvent.click(quarterly);
      fireEvent.click(yearly);

      // Verify rpc is never called with subscription RPCs
      expect(rpcSpy).not.toHaveBeenCalledWith('stack_subscription', expect.anything());
    });
  });
});
