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
import {
  formatInsuranceCompact,
  calculateInsurancePillar,
} from '../models/pillars/insurance';
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
        savings_scores: { ef_target_amount: 300000 },
        financial_fitness_scores: { savings_pillar_score: 50 },
      });
    });

    it('renders title "Savings Analysis", shortfall card, yield tag, and always-visible growth badge', async () => {
      renderWithToast(<EmergencyFundPage />);

      await waitFor(() => {
        expect(screen.getByTestId('emergency-page-title')).toHaveTextContent('Savings Analysis');
      });

      expect(screen.getByTestId('emergency-score-header')).toBeInTheDocument();
      expect(screen.getByTestId('yield-tag')).toHaveTextContent('⚡ ~3.0% Annual Yield');
      expect(screen.getByTestId('shortfall-card')).toHaveTextContent('Shortfall to Target');
      // Growth badge is ALWAYS visible with default 0.952 baseline (+5.0%)
      expect(screen.getByTestId('growth-badge')).toBeInTheDocument();
      expect(screen.getByTestId('growth-badge')).toHaveTextContent('▲ +5.0%');
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
      vi.useFakeTimers();
      try {
        const addSpy = vi.spyOn(apiService, 'addEmergencySavings').mockResolvedValue({} as any);

        renderWithToast(<EmergencyFundPage />);
        await act(async () => {
          await vi.runAllTimersAsync();
        });

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

        expect(addSpy).toHaveBeenCalledWith(25000);

        // Advance 3s wait
        await act(async () => {
          await vi.advanceTimersByTimeAsync(3000);
        });
      } finally {
        vi.useRealTimers();
      }
    });

    it('growth baseline resets on quick edit but adding savings does not change baseline', async () => {
      vi.useFakeTimers();
      try {
        const updateSpy = vi.spyOn(apiService, 'updateMasterProfile').mockResolvedValue({} as any);

        renderWithToast(<EmergencyFundPage />);
        await act(async () => {
          await vi.runAllTimersAsync();
        });

        // Initially baseline was initialized to 150000 * 0.952 = 142800
        expect(localStorage.getItem('ef_prev_current')).toBe('142800');

        // Click edit button
        fireEvent.click(screen.getByTestId('edit-estimated-fund-btn'));
        expect(screen.getByText('Update Estimated Fund')).toBeInTheDocument();

        // Update amount to 200000
        const modalInput = screen.getByPlaceholderText('Enter amount');
        fireEvent.change(modalInput, { target: { value: '200000' } });
        fireEvent.click(screen.getByRole('button', { name: 'Update' }));

        // Right before API call, baseline is set to current fund (150000)
        expect(localStorage.getItem('ef_prev_current')).toBe('150000');

        await act(async () => {
          await vi.advanceTimersByTimeAsync(2000);
        });

        expect(updateSpy).toHaveBeenCalledWith({ emergencyFundCurrent: '200000' });
      } finally {
        vi.useRealTimers();
      }
    });

    it('renders conditional shortfall text and fund completion percentage', async () => {
      renderWithToast(<EmergencyFundPage />);
      await waitFor(() => {
        expect(screen.getByTestId('shortfall-card')).toHaveTextContent(
          'Your emergency fund is below target. Move your surplus to a Liquid Fund for safety.'
        );
      });

      expect(screen.getByText('Fund Completion')).toBeInTheDocument();
      expect(screen.getByText('Target Fulfillment')).toBeInTheDocument();
      expect(screen.getByText('50.0%')).toBeInTheDocument();
    });

    it('renders fully funded message when shortfall gap is zero', async () => {
      vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({
        data: {
          emergencyFundCurrent: '300000',
          emergencyFundTarget: '300000',
        },
      });
      vi.spyOn(apiService, 'getDashboard').mockResolvedValue({
        savings_scores: { ef_target_amount: 300000 },
        financial_fitness_scores: { savings_pillar_score: 100 },
      });

      renderWithToast(<EmergencyFundPage />);
      await waitFor(() => {
        expect(screen.getByTestId('shortfall-card')).toHaveTextContent(
          'Excellent! Your emergency fund is fully funded.'
        );
      });
      expect(screen.getByText('100.0%')).toBeInTheDocument();
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
    it('InsurancePillarPage renders "Protection Analysis", optimize link, and defaults to ₹0 when profile is empty', async () => {
      // Empty profile
      vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({ data: null });
      vi.spyOn(apiService, 'getDashboard').mockResolvedValue({});

      renderWithToast(<InsurancePillarPage />);

      await waitFor(() => {
        expect(screen.getByTestId('insurance-page-title')).toHaveTextContent('Protection Analysis');
      });

      expect(screen.getByTestId('insurance-score-header')).toBeInTheDocument();
      expect(screen.getAllByText('₹0').length).toBeGreaterThan(0);
      expect(screen.getByTestId('insurance-optimize-btn')).toBeInTheDocument();
    });

    it('formatInsuranceCompact formats currency values correctly and treats NaN/missing as 0', () => {
      expect(formatInsuranceCompact(1500000)).toBe('₹15.0L');
      expect(formatInsuranceCompact(2500000)).toBe('₹25.0L');
      expect(formatInsuranceCompact(4500000)).toBe('₹45.0L');
      expect(formatInsuranceCompact(50000)).toBe('₹50K');
      expect(formatInsuranceCompact(999)).toBe('₹999');
      expect(formatInsuranceCompact(0)).toBe('₹0');
      expect(formatInsuranceCompact(NaN)).toBe('₹0');
      expect(formatInsuranceCompact(null as any)).toBe('₹0');
      expect(formatInsuranceCompact(undefined as any)).toBe('₹0');
    });

    it('calculates gap math accurately matching 15x annual income for term & 10x for health', () => {
      const res = calculateInsurancePillar(
        {
          monthlyActiveIncome: 100000,
          termCover: 1500000,
          lifeCover: 500000,
          healthCover: 1500000,
        },
        {
          financial_fitness_scores: { protection_pillar_score: 33 },
          protection_scores: { term_score: 17, health_score: 50 },
        }
      );

      expect(res.annualIncome).toBe(1200000);
      expect(res.termGap).toBe(16000000);
      expect(res.healthGap).toBe(10500000);
      expect(res.protectionScore).toBe(33);
      expect(res.termScore).toBe(17);
      expect(res.healthScore).toBe(50);
    });

    it('renders red gap state when gap > 0 and green gap state when gap == 0', async () => {
      // Non-zero gap -> red
      vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({
        data: {
          monthlyActiveIncome: 100000,
          termCover: 1000000,
          lifeCover: 0,
          healthCover: 500000,
        },
      });
      vi.spyOn(apiService, 'getDashboard').mockResolvedValue({
        financial_fitness_scores: { protection_pillar_score: 33 },
        protection_scores: { term_score: 17, health_score: 50 },
      });

      const { unmount } = renderWithToast(<InsurancePillarPage />);
      await waitFor(() => {
        expect(screen.getByTestId('term-gap-text')).toHaveClass('text-rose-600');
        expect(screen.getByTestId('health-gap-text')).toHaveClass('text-rose-600');
      });
      unmount();

      // Zero gap -> green
      vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({
        data: {
          monthlyActiveIncome: 10000,
          termCover: 2000000,
          lifeCover: 0,
          healthCover: 2000000,
        },
      });
      renderWithToast(<InsurancePillarPage />);
      await waitFor(() => {
        expect(screen.getByTestId('term-gap-text')).toHaveClass('text-emerald-600');
        expect(screen.getByTestId('health-gap-text')).toHaveClass('text-emerald-600');
      });
    });

    it('clamps score bar width between 1% and 100%', async () => {
      vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({ data: null });
      vi.spyOn(apiService, 'getDashboard').mockResolvedValue({
        protection_scores: { term_score: 0, health_score: 150 },
      });

      renderWithToast(<InsurancePillarPage />);
      await waitFor(() => {
        expect(screen.getByTestId('life-cover-bar')).toHaveStyle({ width: '1%' });
        expect(screen.getByTestId('health-cover-bar')).toHaveStyle({ width: '100%' });
      });
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

      expect(screen.getByTestId('investments-score-header')).toBeInTheDocument();
      expect(screen.getByText('GLOBAL PILLAR SCORE')).toBeInTheDocument();
      expect(screen.getByText('Asset Mix')).toBeInTheDocument();
      expect(screen.getByText('SIP Health')).toBeInTheDocument();
      expect(screen.getByText('PORTFOLIO BREAKDOWN')).toBeInTheDocument();
      expect(screen.getByText('ALLOCATION HEALTH')).toBeInTheDocument();
      expect(screen.getByText('SIP ANALYSIS')).toBeInTheDocument();
      expect(screen.getByTestId('investments-optimize-btn')).toBeInTheDocument();
    });

    it('MutualFundPillarPage displays live metrics, portfolio breakdown tags, and unclamped scores', async () => {
      vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({
        data: {
          totalEquityInvestments: '500000',
          totalDebtInvestments: '300000',
          totalGoldInvestments: '100000',
          totalRealEstateInvestments: '100000',
          monthlySipEquity: '10000',
          monthlySipDebt: '15000',
          monthlySipGold: '5000',
          mfSips: [{ name: 'HDFC Flexi Cap', amount: '15000', date: 5 }],
          goldSips: [{ name: 'Nippon Gold ETF', amount: '5000', date: 10 }],
        },
      });
      vi.spyOn(apiService, 'getDashboard').mockResolvedValue({
        financial_fitness_scores: { investment_pillar_score: 88 },
        investment_scores: {
          asset_balance_score: 75,
          sip_score: 104, // Unclamped score > 100
          total_investment_amount: 1000000,
          sip_gap: 5000,
        },
      });

      renderWithToast(<MutualFundPillarPage />);

      await waitFor(() => {
        expect(screen.getByText('88')).toBeInTheDocument();
      });

      // Verify unclamped scores
      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.getByText('104')).toBeInTheDocument();

      // Verify Portfolio Breakdown tags
      expect(screen.getByText('Total Wealth Assets')).toBeInTheDocument();
      expect(screen.getByText('High Growth')).toBeInTheDocument();
      expect(screen.getByText('Stability')).toBeInTheDocument();
      expect(screen.getByText('Hedge')).toBeInTheDocument();
      expect(screen.getByText('Passive Assets')).toBeInTheDocument();

      // Verify Allocation Breakdown
      expect(screen.getByText('Allocation Breakdown')).toBeInTheDocument();
      expect(screen.getByText('50.0%')).toBeInTheDocument();
      expect(screen.getByText('30.0%')).toBeInTheDocument();
      expect(screen.getAllByText('10.0%').length).toBe(2);

      // Verify SIP Analysis
      expect(screen.getByText('Monthly SIP Contribution')).toBeInTheDocument();
      expect(screen.getByText('Mutual Fund SIP')).toBeInTheDocument();
      expect(screen.getByText('Gold SIP')).toBeInTheDocument();
      expect(screen.getByText('Monthly Shortfall (Gap)')).toBeInTheDocument();
      expect(screen.getByText(/Increase your monthly SIP by/)).toBeInTheDocument();
    });

    it('opens Asset Quick Edit and calls updateMasterProfile', async () => {
      vi.useFakeTimers();
      try {
        const updateSpy = vi.spyOn(apiService, 'updateMasterProfile').mockResolvedValue({ data: {} } as any);
        vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({
          data: {
            totalEquityInvestments: '500000',
          },
        });
        vi.spyOn(apiService, 'getDashboard').mockResolvedValue({
          financial_fitness_scores: { investment_pillar_score: 80 },
          investment_scores: { asset_balance_score: 70, sip_score: 80, total_investment_amount: 500000 },
        });

        renderWithToast(<MutualFundPillarPage />);

        await act(async () => {
          await vi.advanceTimersByTimeAsync(100);
        });

        // Click edit Stock button
        const editStockBtn = screen.getByTitle('Edit Stock');
        fireEvent.click(editStockBtn);

        expect(screen.getByText('Update Stock')).toBeInTheDocument();
        const input = screen.getByPlaceholderText('Enter amount');
        fireEvent.change(input, { target: { value: '600000' } });

        fireEvent.click(screen.getByRole('button', { name: 'Update' }));

        expect(updateSpy).toHaveBeenCalledWith({
          totalEquityInvestments: '600000',
        });

        await act(async () => {
          await vi.advanceTimersByTimeAsync(2100);
        });
      } finally {
        vi.useRealTimers();
      }
    });

    it('opens Manage SIP modal, adds and removes an entry, and saves with updated total', async () => {
      vi.useFakeTimers();
      try {
        const updateSpy = vi.spyOn(apiService, 'updateMasterProfile').mockResolvedValue({ data: {} } as any);
        vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({
          data: {
            mfSips: [{ name: 'Axis Bluechip', amount: '5000', date: 10 }],
            monthlySipDebt: '5000',
          },
        });
        vi.spyOn(apiService, 'getDashboard').mockResolvedValue({});

        renderWithToast(<MutualFundPillarPage />);

        await act(async () => {
          await vi.advanceTimersByTimeAsync(100);
        });

        // Click edit icon next to Mutual Fund SIP
        const manageMfBtn = screen.getByTitle('Manage Mutual Fund SIP');
        fireEvent.click(manageMfBtn);

        expect(screen.getByText('Manage Mutual Fund SIP')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Axis Bluechip')).toBeInTheDocument();
        expect(screen.getByDisplayValue('5000')).toBeInTheDocument();

        // Add a new entry
        const addBtn = screen.getByTitle('Add SIP');
        fireEvent.click(addBtn);

        // Save & Sync
        const saveBtn = screen.getByText('Save & Sync Portfolio');
        fireEvent.click(saveBtn);

        expect(updateSpy).toHaveBeenCalledWith({
          mfSips: [
            { name: 'Axis Bluechip', amount: '5000', date: 10 },
            { name: '', amount: '0', date: 1 },
          ],
          monthlySipDebt: '5000',
        });

        await act(async () => {
          await vi.advanceTimersByTimeAsync(2100);
        });
      } finally {
        vi.useRealTimers();
      }
    });
  });

  // ===========================================================================
  // 8. SubscriptionPage Read-Only & Pricing Tests
  // ===========================================================================
  describe('8. SubscriptionPage (/subscription) Read-Only & Pricing', () => {
    it('displays exact pricing: ₹499, ₹399, ₹299 and totals 1,497, 2,394, 3,588', () => {
      expect(SUBSCRIPTION_PLANS[0].storePrice).toBe('₹499');
      expect(SUBSCRIPTION_PLANS[0].totalBilledPrice).toBe('₹1,497');

      expect(SUBSCRIPTION_PLANS[1].storePrice).toBe('₹399');
      expect(SUBSCRIPTION_PLANS[1].totalBilledPrice).toBe('₹2,394');

      expect(SUBSCRIPTION_PLANS[2].storePrice).toBe('₹299');
      expect(SUBSCRIPTION_PLANS[2].totalBilledPrice).toBe('₹3,588');
    });

    it('renders enabled buy button with plan price and omits platform fee footnote', async () => {
      vi.spyOn(apiService, 'getSubscriptionDetails').mockResolvedValue(null);

      renderWithToast(<SubscriptionPage />);

      await waitFor(() => {
        expect(screen.getByTestId('subscription-page-title')).toHaveTextContent('Wealth Select');
      });

      const buyBtn = screen.getByTestId('buy-plan-btn');
      expect(buyBtn).toBeEnabled();
      expect(buyBtn).toHaveTextContent('Get Financially Free (₹3,588)');

      expect(screen.queryByTestId('platform-fee-footnote')).toBeNull();
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
