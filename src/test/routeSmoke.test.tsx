import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import App from '../App';
import { supabase } from '../lib/supabase';
import { apiService } from '../services/apiService';
import { authService } from '../services/authService';
import { marketDataService } from '../services/marketDataService';
import { premiumService } from '../services/premiumService';

const mockProfile = {
  monthlyActiveIncome: 100000,
  monthlyPassiveIncome: 10000,
  monthlyFixedExpense: 35000,
  monthlyFlexibleExpense: 20000,
  monthlyInvestmentOutflow: 25000,
  emergencyFundCurrent: 200000,
  emergencyFundTarget: 300000,
  healthCoverLimit: 1000000,
  lifeCoverLimit: 15000000,
  cityTier: 'Tier 1',
  equityCurrent: 500000,
  debtCurrent: 200000,
  goldCurrent: 100000,
  realEstateCurrent: 0,
};

const mockDashboard = {
  score: 78,
  status: 'STABLE',
  metrics: {
    incomeStability: { score: 85, status: 'STABLE' },
    expenseDiscipline: { score: 72, status: 'STABLE' },
    emergencyReadiness: { score: 80, status: 'STABLE' },
    insuranceCoverage: { score: 75, status: 'STABLE' },
    investmentGrowth: { score: 78, status: 'STABLE' },
  },
};

const mockCorpStats = {
  company_name: 'Acme Global',
  avg_workforce_score: 84,
  total_headcount: 150,
  stable_count: 100,
  watchlist_count: 30,
  high_risk_count: 15,
  critical_risk_count: 5,
  paycheck_dependency_pct: 28,
  no_emergency_fund_pct: 32,
  pillar_intel: {
    avg_income_score: 85,
    avg_expense_score: 70,
    avg_savings_score: 75,
    avg_protection_score: 80,
    avg_investment_score: 65,
  },
  dept_metrics: {
    Engineering: { avg_stress: 55, headcount: 50 },
    Sales: { avg_stress: 68, headcount: 40 },
  },
};

const mockNewsItem = {
  id: 'article-1',
  title: 'Indian Markets Hit All Time High',
  content: 'Benchmark indices surged to record levels today driven by strong foreign inflows.',
  summary: 'Markets hit record highs on strong institutional inflows.',
  source: 'Financial Express',
  created_at: '2026-09-20T00:00:00Z',
  category: 'Market Pulse',
};

describe('TASK 15 — Route-Level Smoke Test Matrix', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();

    (window as any).__MOCK_PLAN__ = {
      isPro: true,
      canAccessPremium: true,
      isFeatureAccessible: true,
      trialActive: true,
      plan: 'pro',
    };

    // Authenticated session with Pro plan
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          access_token: 'mock-token',
          user: {
            id: 'mock-user-123',
            email: 'admin@moneymapper.in',
            user_metadata: { full_name: 'Antigravity Tester' },
          },
        } as any,
      },
      error: null,
    });

    vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    } as any);

    // Spy on apiService methods with mock returns
    vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({ data: mockProfile } as any);
    vi.spyOn(apiService, 'getDashboard').mockResolvedValue(mockDashboard);
    vi.spyOn(apiService, 'getCorporateAdmin').mockResolvedValue({
      company_name: 'Acme Global',
    });
    vi.spyOn(apiService, 'getCorporateWorkforceStats').mockResolvedValue(mockCorpStats);
    vi.spyOn(apiService, 'getStockSignals').mockResolvedValue([]);
    vi.spyOn(apiService, 'getPickStocks').mockResolvedValue([]);
    vi.spyOn(apiService, 'getMutualFundSignals').mockResolvedValue([]);
    vi.spyOn(apiService, 'getMutualFundRecommendations').mockResolvedValue([]);
    vi.spyOn(apiService, 'getInsurancePlans').mockResolvedValue([]);
    vi.spyOn(apiService, 'getInsuranceRecommendations').mockResolvedValue([]);
    vi.spyOn(apiService, 'getFinanceNews').mockResolvedValue([mockNewsItem]);
    vi.spyOn(apiService, 'getNewsById').mockResolvedValue(mockNewsItem);
    vi.spyOn(apiService, 'getBlogs').mockResolvedValue([]);
    vi.spyOn(apiService, 'getMarketSentiment').mockResolvedValue({
      score: 72,
      label: 'Bullish',
    });
    vi.spyOn(apiService, 'getWeeklyCurrent').mockResolvedValue({ data: [] });
    vi.spyOn(apiService, 'getSubscriptionDetails').mockResolvedValue({
      is_pro: true,
      plan: 'pro',
      current_period_end: new Date(Date.now() + 86400000).toISOString(),
    });

    vi.spyOn(marketDataService, 'getGoldRate').mockResolvedValue({
      gold24k: 7250,
      gold22k: 6645,
      updated_at: '2026-09-20T00:00:00Z',
      price: 7250,
      time: '2026-09-20T00:00:00Z',
      status: 'success',
    } as any);

    vi.spyOn(premiumService, 'isPro').mockReturnValue(true);
    vi.spyOn(authService, 'getUserName').mockResolvedValue('Antigravity Tester');
    vi.spyOn(authService, 'getUserEmail').mockResolvedValue('admin@moneymapper.in');
    vi.spyOn(authService, 'getUserPlan').mockResolvedValue('pro');
    vi.spyOn(authService, 'isLoggedIn').mockResolvedValue(true);
  });

  afterEach(() => {
    cleanup();
    delete (window as any).__MOCK_PLAN__;
    vi.restoreAllMocks();
  });

  const allRoutesToTest = [
    // 1. Public & Auth Pages
    { path: '/', textPattern: /MoneyMapper/i },
    { path: '/privacy', textPattern: /Privacy Policy/i },
    { path: '/corporate-login', textPattern: /Corporate Portal|Corporate Email/i },

    // 2. Main App Routes
    { path: '/dashboard', textPattern: /Estimated Spending Limit|Financial Breakdown/i },
    { path: '/insights', textPattern: /MoneyMapper Insights|Top Stories/i },
    { path: '/ai-assistant', textPattern: /AI Financial Assistant/i },
    { path: '/profile', textPattern: /Security & Preferences/i },
    { path: '/weekly', textPattern: /Weekly Tracker/i },
    { path: '/onboarding', textPattern: /Monthly Income & Expenses|Step 1|Financial Profile/i },
    { path: '/master-data', textPattern: /My Profile/i },
    { path: '/subscription', textPattern: /Wealth Select/i },
    { path: '/achievements', textPattern: /Badges & Achievements/i },
    { path: '/referral', textPattern: /Invite a Friend/i },

    // 3. Five Financial Pillars
    { path: '/pillars/expenses', textPattern: /Weekly Expense Predictor/i },
    { path: '/pillars/weekly-expense', textPattern: /Weekly Expense Predictor/i },
    { path: '/pillars/income', textPattern: /Income Analysis/i },
    { path: '/pillars/emergency', textPattern: /Emergency Readiness/i },
    { path: '/pillars/emergency-fund', textPattern: /Emergency Readiness/i },
    { path: '/pillars/insurance', textPattern: /Protection Analysis/i },
    { path: '/pillars/investments', textPattern: /Investment Analysis/i },
    { path: '/pillars/mutual-fund', textPattern: /Investment Analysis/i },

    // 4. Market & Screeners
    { path: '/gold-rates', textPattern: /Live Gold Market/i },
    { path: '/market/gold', textPattern: /Live Gold Market/i },
    { path: '/stock-screener', textPattern: /Stocks Score Card/i },
    { path: '/market/stocks', textPattern: /Stocks Score Card/i },
    { path: '/mf-screener', textPattern: /Mutual Fund Score Card/i },
    { path: '/market/funds', textPattern: /Mutual Fund Score Card/i },
    { path: '/mf-recommendations', textPattern: /Wealth Growth Blueprint/i },
    { path: '/insurance-screener', textPattern: /Insurance Score Card/i },
    { path: '/market/insurance', textPattern: /Insurance Score Card/i },
    { path: '/news/article-1', textPattern: /Indian Markets Hit All Time High/i },

    // 5. B2B Corporate Portal
    { path: '/corporate-dashboard', textPattern: /WORKFORCE HEALTH INDEX|AI Workforce Scan/i },
  ];

  for (const { path, textPattern } of allRoutesToTest) {
    it(`mounts route "${path}" with mocked data without crashing`, async () => {
      render(<App initialEntries={[path]} />);

      await waitFor(
        () => {
          expect(screen.getAllByText(textPattern).length).toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );
    });
  }

  // 6. Canonical Route Redirects (verifies target page mounts)
  const redirectsToTest = [
    { from: '/main', targetPattern: /Estimated Spending Limit|Financial Breakdown/i },
    { from: '/assistant', targetPattern: /AI Financial Assistant/i },
    { from: '/corporate/login', targetPattern: /Corporate Portal|Corporate Email/i },
    { from: '/corporate/dashboard', targetPattern: /WORKFORCE HEALTH INDEX|AI Workforce Scan/i },
    { from: '/emergency_fund_p', targetPattern: /Emergency Readiness/i },
    { from: '/income_p', targetPattern: /Income Analysis/i },
    { from: '/mutual_fund_p', targetPattern: /Investment Analysis/i },
    { from: '/insurance_p', targetPattern: /Protection Analysis/i },
    { from: '/weekly_expense_p', targetPattern: /Weekly Expense Predictor/i },
    { from: '/ai', targetPattern: /MoneyMapper Insights|Top Stories/i },
    { from: '/stock_screener', targetPattern: /Stocks Score Card/i },
    { from: '/mf_screener', targetPattern: /Mutual Fund Score Card/i },
    { from: '/insurance_screener', targetPattern: /Insurance Score Card/i },
    { from: '/master_data', targetPattern: /My Profile/i },
  ];

  for (const { from, targetPattern } of redirectsToTest) {
    it(`correctly redirects canonical route "${from}" and renders destination`, async () => {
      render(<App initialEntries={[from]} />);

      await waitFor(
        () => {
          expect(screen.getAllByText(targetPattern).length).toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );
    });
  }
});
