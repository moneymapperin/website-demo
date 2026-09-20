import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { ThemeProvider } from '../context/ThemeContext';
import { apiService } from '../services/apiService';
import { ApiException } from '../services/resilienceUtils';
import { gamificationStore } from '../services/gamificationStore';
import { DashboardPage } from '../pages/DashboardPage';
import { EstimatedSpendingLimit } from '../components/dashboard/EstimatedSpendingLimit';
import { LiveFinancialCalculator } from '../components/dashboard/LiveFinancialCalculator';
import { QUOTES } from '../components/dashboard/QuotesSection';

// Fixture data matching schema contract
const fullDashboardFixture = {
  financial_fitness_scores: {
    global_fitness_score: 82.5,
    fitness_band: 'Good',
    summary: 'Your financial health is solid.',
    income_pillar_score: 90,
    expense_pillar_score: 62.5,
    savings_pillar_score: 88,
    protection_pillar_score: 72,
    investment_pillar_score: 75,
  },
  income_scores: {
    active_income_score: 90,
    stability_score: 85,
  },
  expense_scores: {
    fixed_score: 65,
    variable_score: 60,
    discipline_score: 62.5,
  },
  savings_scores: {
    emergency_fund_score: 88,
    ef_target_amount: 450000,
  },
  protection_scores: {
    protection_score: 72,
  },
  investment_scores: {
    overall_score: 75,
    sip_gap: 5000,
  },
};

const fullProfileFixture = {
  fullName: 'Aarav Sharma',
  email: 'aarav@moneymapper.io',
  monthlyActiveIncome: 100000,
  passiveIncomeAmount: 20000,
  monthlyFixedExpenses: 40000,
  monthlyVariableExpenses: 20000,
  emergencyFundCurrent: 350000,
  totalEquityInvestments: 600000,
  totalDebtInvestments: 300000,
  totalGoldInvestments: 100000,
  totalRealEstateInvestments: 2000000,
  activeLoans: 200000,
  monthlySipContribution: 15000,
};

const goldRateFixture = {
  '24K (999 Purity)': 7850,
  '22K': 7200,
  price: 78500,
  status: 'Live (IBJA)',
  time: '04:15 PM',
};

function renderDashboardPage(initialRoute = '/dashboard', isPro = false, isFeatureAccessible = true) {
  (window as any).__MOCK_PLAN__ = {
    isPro,
    isFeatureAccessible,
    trialDaysRemaining: isPro ? 365 : (isFeatureAccessible ? 7 : 0),
    plan: isPro ? 'pro' : 'b2c',
  };

  const user = {
    id: 'user-aarav-1',
    email: 'aarav@moneymapper.io',
    created_at: '2026-09-12T10:00:00.000Z',
    user_metadata: { full_name: 'Aarav Sharma' },
  } as any;

  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthContext.Provider
        value={{
          user,
          session: { user } as any,
          isLoading: false,
          isLoggedIn: true,
          logout: async () => {},
        }}
      >
        <ThemeProvider>
          <ToastProvider>
            <Routes>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/onboarding" element={<div data-testid="onboarding-page">Onboarding Wizard</div>} />
              <Route path="/master-data" element={<div data-testid="master-data-page">Master Data Screen</div>} />
              <Route path="/profile" element={<div data-testid="profile-page">Profile Screen</div>} />
              <Route path="/ai-assistant" element={<div data-testid="ai-assistant-page">AI Assistant Screen</div>} />
              <Route path="/weekly" element={<div data-testid="weekly-page">Weekly Tracker Screen</div>} />
              <Route path="/market/gold" element={<div data-testid="gold-screener-page">Gold Screener Screen</div>} />
              <Route path="/market/stocks" element={<div data-testid="stock-screener-page">Stock Screener</div>} />
              <Route path="/market/funds" element={<div data-testid="fund-screener-page">Fund Screener</div>} />
              <Route path="/market/insurance" element={<div data-testid="insurance-screener-page">Insurance Screener</div>} />
              <Route path="/subscription" element={<div data-testid="subscription-page">Pro Subscription Screen</div>} />
              <Route path="/pillars/:type" element={<div data-testid="pillar-drilldown-page">Pillar Detail</div>} />
            </Routes>
          </ToastProvider>
        </ThemeProvider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('TASK 7 — Dashboard (/dashboard) Component & Integration Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    delete (window as any).__MOCK_PLAN__;
    apiService.clearAllAppCache();
  });

  it('1. Fixture-driven rendering of full dashboard data', async () => {
    vi.spyOn(apiService, 'getDashboard').mockResolvedValue(fullDashboardFixture);
    vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({ data: fullProfileFixture });
    vi.spyOn(apiService, 'getGoldRate').mockResolvedValue(goldRateFixture);

    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-screen')).toBeInTheDocument();
    });

    // Score gauge and label
    const financialCard = screen.getByTestId('financial-position-card');
    expect(within(financialCard).getByText('83')).toBeInTheDocument(); // 82.5 rounded
    expect(within(financialCard).getByText('EXCELLENT')).toBeInTheDocument();
    expect(screen.getByText('FINANCIAL FITNESS SCORE')).toBeInTheDocument();

    // Net Financial Position
    // Assets: 600k + 300k + 100k + 2000k + 350k = 3,350,000; Loans: 200,000 -> Net: 3,150,000
    expect(screen.getByText('₹3,150,000')).toBeInTheDocument();
    expect(screen.getByText('Total Assets – Total Liabilities')).toBeInTheDocument();
    expect(screen.getByTestId('sparkline-chart')).toBeInTheDocument();

    // User avatar initial (Aarav Sharma -> AS)
    expect(screen.getByTestId('dashboard-avatar-btn')).toHaveTextContent('AS');
  });

  it('2. Calculations Pending (404) -> renders the app empty state with CTA navigating to /onboarding', async () => {
    vi.spyOn(apiService, 'getDashboard').mockRejectedValue(new ApiException('Calculations Pending', 404));
    vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({ data: {} });
    vi.spyOn(apiService, 'getGoldRate').mockResolvedValue(goldRateFixture);

    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-empty-state')).toBeInTheDocument();
    });

    // Empty state includes Header, Gold Ticker, Score Cards Grid, Welcome Card, and Basic Identity
    expect(screen.getAllByText('MoneyMapper')[0]).toBeInTheDocument();
    expect(screen.getByTestId('gold-ticker')).toBeInTheDocument();
    expect(screen.getByTestId('score-cards-section')).toBeInTheDocument();
    expect(screen.getByText('Welcome to MoneyMapper!')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Your financial profile is currently empty. To see your fitness score and personalized insights, please fill in your master data.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('YOUR BASIC IDENTITY')).toBeInTheDocument();

    // CTA button navigates to /master-data
    const ctaBtn = screen.getByTestId('onboarding-cta-btn');
    expect(ctaBtn).toHaveTextContent('Set Up Financial Profile');
    fireEvent.click(ctaBtn);

    await waitFor(() => {
      expect(screen.getByTestId('master-data-page')).toBeInTheDocument();
    });
  });

  it('3. Loading state displays DashboardHeaderSkeleton and DashboardSkeleton', () => {
    vi.spyOn(apiService, 'getDashboard').mockReturnValue(new Promise(() => {}));
    vi.spyOn(apiService, 'getMasterProfile').mockReturnValue(new Promise(() => {}));
    vi.spyOn(apiService, 'getGoldRate').mockReturnValue(new Promise(() => {}));

    renderDashboardPage();

    expect(screen.getByTestId('dashboard-header-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
  });

  it('4. Fatal error displays error view and Retry button triggers re-fetch', async () => {
    const getDashboardSpy = vi
      .spyOn(apiService, 'getDashboard')
      .mockRejectedValueOnce(new ApiException('Database connection failed', 500))
      .mockResolvedValueOnce(fullDashboardFixture);

    vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({ data: fullProfileFixture });
    vi.spyOn(apiService, 'getGoldRate').mockResolvedValue(goldRateFixture);

    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-error-view')).toBeInTheDocument();
    });

    expect(screen.getByText('Database connection failed')).toBeInTheDocument();
    expect(screen.getByText('Could not load dashboard data')).toBeInTheDocument();

    // Click retry
    const retryBtn = screen.getByTestId('dashboard-retry-btn');
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-screen')).toBeInTheDocument();
    });
    expect(getDashboardSpy).toHaveBeenCalledTimes(2);
  });

  it('5. Pillar order and formatted values in strict sequence', async () => {
    vi.spyOn(apiService, 'getDashboard').mockResolvedValue(fullDashboardFixture);
    vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({ data: fullProfileFixture });
    vi.spyOn(apiService, 'getGoldRate').mockResolvedValue(goldRateFixture);

    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByTestId('financial-breakdown-section')).toBeInTheDocument();
    });

    const incomeRow = screen.getByTestId('pillar-row-income');
    const expensesRow = screen.getByTestId('pillar-row-expenses');
    const emergencyRow = screen.getByTestId('pillar-row-emergency');
    const protectionRow = screen.getByTestId('pillar-row-protection');
    const investmentRow = screen.getByTestId('pillar-row-investment');

    expect(incomeRow).toHaveTextContent('Income');
    expect(incomeRow).toHaveTextContent('₹120,000 / month');
    expect(incomeRow).toHaveTextContent('90/100');

    expect(expensesRow).toHaveTextContent('Expenses');
    expect(expensesRow).toHaveTextContent('₹60,000 / month');
    expect(expensesRow).toHaveTextContent('63/100');

    expect(emergencyRow).toHaveTextContent('Emergency Savings');
    expect(emergencyRow).toHaveTextContent('₹350,000 / month');
    expect(emergencyRow).toHaveTextContent('88/100');

    expect(protectionRow).toHaveTextContent('Protection');
    expect(protectionRow).toHaveTextContent('Life Cover: ₹1.20 Cr');
    expect(protectionRow).toHaveTextContent('72/100');

    expect(investmentRow).toHaveTextContent('Investment');
    expect(investmentRow).toHaveTextContent('₹20,000 / month'); // 15000 active + 5000 gap
    expect(investmentRow).toHaveTextContent('75/100');
  });

  it('6. Highlights strongest and weakest pillars', async () => {
    vi.spyOn(apiService, 'getDashboard').mockResolvedValue(fullDashboardFixture);
    vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({ data: fullProfileFixture });
    vi.spyOn(apiService, 'getGoldRate').mockResolvedValue(goldRateFixture);

    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByTestId('strongest-badge')).toBeInTheDocument();
    });

    // Income has 90/100 -> Strongest
    const incomeRow = screen.getByTestId('pillar-row-income');
    expect(incomeRow).toContainElement(screen.getByTestId('strongest-badge'));

    // Expenses has 62.5/100 -> Weakest
    const expensesRow = screen.getByTestId('pillar-row-expenses');
    expect(expensesRow).toContainElement(screen.getByTestId('weakest-badge'));
  });

  it('7. Gold ticker renders live 24K rate and navigates to /market/gold', async () => {
    vi.spyOn(apiService, 'getDashboard').mockResolvedValue(fullDashboardFixture);
    vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({ data: fullProfileFixture });
    vi.spyOn(apiService, 'getGoldRate').mockResolvedValue(goldRateFixture);

    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByTestId('gold-ticker')).toBeInTheDocument();
    });

    expect(screen.getByText('LIVE GOLD RATE 24K')).toBeInTheDocument();
    expect(screen.getByText('₹7,850')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('gold-ticker'));

    await waitFor(() => {
      expect(screen.getByTestId('gold-screener-page')).toBeInTheDocument();
    });
  });

  it('8. PRO banners depend on plan (visible for non-PRO, hidden for PRO)', async () => {
    vi.spyOn(apiService, 'getDashboard').mockResolvedValue(fullDashboardFixture);
    vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({ data: fullProfileFixture });
    vi.spyOn(apiService, 'getGoldRate').mockResolvedValue(goldRateFixture);

    // Non-PRO test
    const { unmount } = renderDashboardPage('/dashboard', false);
    await waitFor(() => {
      expect(screen.getByTestId('pro-banners')).toBeInTheDocument();
    });
    expect(screen.getByText('Quarterly Plan')).toBeInTheDocument();
    expect(screen.getByText('₹499')).toBeInTheDocument();
    unmount();

    // PRO test
    renderDashboardPage('/dashboard', true);
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-screen')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('pro-banners')).not.toBeInTheDocument();
  });

  it('9. Header click targets navigate to /ai-assistant, /weekly, /profile', async () => {
    vi.spyOn(apiService, 'getDashboard').mockResolvedValue(fullDashboardFixture);
    vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({ data: fullProfileFixture });
    vi.spyOn(apiService, 'getGoldRate').mockResolvedValue(goldRateFixture);

    const { unmount } = renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-screen')).toBeInTheDocument();
    });

    // 1. Profile avatar click -> /profile
    fireEvent.click(screen.getByTestId('dashboard-avatar-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('profile-page')).toBeInTheDocument();
    });
    unmount();

    // 2. AI Assistant click -> /ai-assistant
    const view2 = renderDashboardPage();
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-screen')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('ai-assistant-nav-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('ai-assistant-page')).toBeInTheDocument();
    });
    view2.unmount();

    // 3. Weekly click -> /weekly
    const view3 = renderDashboardPage();
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-screen')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('weekly-nav-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('weekly-page')).toBeInTheDocument();
    });
    view3.unmount();
  });

  it('10. Score cards navigate to corresponding screener tools and IPO triggers toast', async () => {
    vi.spyOn(apiService, 'getDashboard').mockResolvedValue(fullDashboardFixture);
    vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({ data: fullProfileFixture });
    vi.spyOn(apiService, 'getGoldRate').mockResolvedValue(goldRateFixture);

    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByTestId('score-cards-section')).toBeInTheDocument();
    });

    // Stock card navigates to /market/stocks
    fireEvent.click(screen.getByTestId('score-card-stock'));
    await waitFor(() => {
      expect(screen.getByTestId('stock-screener-page')).toBeInTheDocument();
    });
  });

  it('11. Locked pillars trigger PRO upgrade toast with action', async () => {
    vi.spyOn(apiService, 'getDashboard').mockResolvedValue(fullDashboardFixture);
    vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({ data: fullProfileFixture });
    vi.spyOn(apiService, 'getGoldRate').mockResolvedValue(goldRateFixture);

    // Feature accessible = false (trial ended / locked)
    renderDashboardPage('/dashboard', false, false);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-screen')).toBeInTheDocument();
    });

    // Emergency savings is locked
    const emergencyRow = screen.getByTestId('pillar-row-emergency');
    fireEvent.click(emergencyRow);

    // Toast appears
    await waitFor(() => {
      expect(screen.getByText('Upgrade to PRO to unlock this pillar! 🚀')).toBeInTheDocument();
    });

    // Clicking UPGRADE in toast navigates to /subscription
    const upgradeAction = screen.getByText('UPGRADE');
    fireEvent.click(upgradeAction);

    await waitFor(() => {
      expect(screen.getByTestId('subscription-page')).toBeInTheDocument();
    });
  });

  it('12. Notification bell is removed from header while AI Assistant, Weekly, and avatar exist', async () => {
    vi.spyOn(apiService, 'getDashboard').mockResolvedValue(fullDashboardFixture);
    vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({ data: fullProfileFixture });
    vi.spyOn(apiService, 'getGoldRate').mockResolvedValue(goldRateFixture);

    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-screen')).toBeInTheDocument();
    });

    // Notification bell and unread dot are removed
    expect(screen.queryByTestId('notifications-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('notification-unread-dot')).not.toBeInTheDocument();

    // Remaining header buttons remain intact
    expect(screen.getByTestId('ai-assistant-nav-btn')).toBeInTheDocument();
    expect(screen.getByTestId('weekly-nav-btn')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-avatar-btn')).toBeInTheDocument();
  });

  it('13. Decorative Sparkline receives no external data series props', async () => {
    vi.spyOn(apiService, 'getDashboard').mockResolvedValue(fullDashboardFixture);
    vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({ data: fullProfileFixture });
    vi.spyOn(apiService, 'getGoldRate').mockResolvedValue(goldRateFixture);

    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByTestId('sparkline-chart')).toBeInTheDocument();
    });

    // Renders SVG with default 12 decorative points
    const sparkline = screen.getByTestId('sparkline-chart');
    expect(sparkline.querySelector('svg')).toBeInTheDocument();
  });

  it('14. Score improvement dialog displays exact verbatim copy and stats', async () => {
    vi.spyOn(apiService, 'getDashboard').mockResolvedValue(fullDashboardFixture);
    vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({ data: fullProfileFixture });
    vi.spyOn(apiService, 'getGoldRate').mockResolvedValue(goldRateFixture);

    // Set a baseline in gamificationStore for comparison
    gamificationStore.setBaselineScore(70);

    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByTestId('score-info-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('score-info-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('score-details-modal')).toBeInTheDocument();
    });

    expect(screen.getByText('Score Improvement')).toBeInTheDocument();
    expect(screen.getByText('Comparison since your first audit:')).toBeInTheDocument();
    expect(screen.getByTestId('starting-score')).toHaveTextContent('70');
    expect(screen.getByTestId('current-score')).toHaveTextContent('83');
    expect(screen.getByTestId('overall-improvement-percentage')).toHaveTextContent('+17.9%');
    expect(screen.getByText('Great job! You have improved your financial health. Keep going! 🚀')).toBeInTheDocument();

    // Close button
    fireEvent.click(screen.getByTestId('close-score-modal-btn'));
    await waitFor(() => {
      expect(screen.queryByTestId('score-details-modal')).not.toBeInTheDocument();
    });
  });

  it('15. Locked Pro Card renders when trial has expired', async () => {
    vi.spyOn(apiService, 'getDashboard').mockResolvedValue(fullDashboardFixture);
    vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({ data: fullProfileFixture });
    vi.spyOn(apiService, 'getGoldRate').mockResolvedValue(goldRateFixture);

    renderDashboardPage('/dashboard', false, false);

    await waitFor(() => {
      expect(screen.getByTestId('locked-pro-card')).toBeInTheDocument();
    });

    const lockedCard = screen.getByTestId('locked-pro-card');
    expect(within(lockedCard).getByText('Unlock MoneyMapper Pro 🚀')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Your 7-day trial has ended. Subscribe to Pro to unlock your Financial Fitness Score, Net Financial Position analysis, and personalized wealth recommendations.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('UPGRADE TO PRO')).toBeInTheDocument();
  });
});

describe('Task 7: Table-Driven Tests for EstimatedSpendingLimit & LiveFinancialCalculator', () => {
  describe('EstimatedSpendingLimit table-driven tests', () => {
    // Math:
    // weekly = monthlyIncome / 4
    // fMid = clamp(0.25 + score/100 * 0.10, 0.25, 0.35)
    // xMid = clamp(0.55 - score/100 * 0.10, 0.45, 0.55)
    // min = round(weekly * ((xMid - 0.02) + (fMid - 0.02)))
    // max = round(weekly * ((xMid + 0.02) + (fMid + 0.02)))
    const cases = [
      { income: 40000, score: 50, expected: '₹7600 - ₹8400' },
      { income: 40000, score: 0, expected: '₹7600 - ₹8400' },
      { income: 40000, score: 100, expected: '₹7600 - ₹8400' },
      { income: 80000, score: 75, expected: '₹15200 - ₹16800' },
      { income: 100000, score: 50, expected: '₹19000 - ₹21000' },
    ];

    cases.forEach(({ income, score, expected }) => {
      it(`calculates range ${expected} for income=${income} and expenseScore=${score}`, () => {
        render(<EstimatedSpendingLimit monthlyIncome={income} expenseScore={score} />);
        expect(screen.getByTestId('spending-limit-range')).toHaveTextContent(expected);
      });
    });

    it('renders null / hidden when monthlyIncome is 0', () => {
      const { container } = render(<EstimatedSpendingLimit monthlyIncome={0} expenseScore={50} />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('LiveFinancialCalculator table-driven hand-derived values', () => {
    it('renders hand-derived values matching equation, emergency fund, and wealth allocation', () => {
      render(
        <LiveFinancialCalculator
          monthlyIncome={120000}
          monthlyExpenses={60000}
          availableBalance={60000}
          emergencyCurrent={350000}
          emergencyTarget={450000}
          sipRecommendation={20000}
          wealthAllocations={{
            Stock: { amount: 600000, percent: '20%' },
            'Mutual Fund': { amount: 300000, percent: '10%' },
            Gold: { amount: 100000, percent: '3%' },
            'Real Estate': { amount: 2000000, percent: '67%' },
          }}
          isSipLocked={false}
          showSipTrialBadge={true}
        />
      );

      // Equation
      expect(screen.getByTestId('equation-card-income')).toHaveTextContent('₹120,000');
      expect(screen.getByTestId('equation-card-expenses')).toHaveTextContent('₹60,000');
      expect(screen.getByTestId('equation-card-available')).toHaveTextContent('₹60,000');

      // Emergency Fund
      expect(screen.getByTestId('ef-current')).toHaveTextContent('₹350,000');
      expect(screen.getByTestId('ef-target')).toHaveTextContent('/ ₹450,000');
      expect(screen.getByTestId('ef-percentage')).toHaveTextContent('78%'); // 350000/450000 = 77.78% -> 78%

      // SIP Recommendation
      expect(screen.getByTestId('sip-amount')).toHaveTextContent('₹20,000');
      expect(screen.getByText('TRIAL: 1D')).toBeInTheDocument();

      // Wealth Allocation 2x2
      expect(screen.getByTestId('alloc-item-stock')).toHaveTextContent('₹6L');
      expect(screen.getByTestId('alloc-item-stock')).toHaveTextContent('20%');

      expect(screen.getByTestId('alloc-item-mf')).toHaveTextContent('₹3L');
      expect(screen.getByTestId('alloc-item-mf')).toHaveTextContent('10%');

      expect(screen.getByTestId('alloc-item-gold')).toHaveTextContent('₹1L');
      expect(screen.getByTestId('alloc-item-gold')).toHaveTextContent('3%');

      expect(screen.getByTestId('alloc-item-re')).toHaveTextContent('₹20L');
      expect(screen.getByTestId('alloc-item-re')).toHaveTextContent('67%');
    });

    it('renders locked overlay when isSipLocked is true', () => {
      render(<LiveFinancialCalculator isSipLocked={true} />);
      expect(screen.getByTestId('sip-locked-overlay')).toBeInTheDocument();
      expect(screen.getByText('PRO FEATURE')).toBeInTheDocument();
      expect(screen.getByText('Unlock SIP Advisor')).toBeInTheDocument();
    });
  });

  describe('QuotesSection quotes bank verification', () => {
    it('contains exactly 20 valid quotes matching Flutter lines 83-102', () => {
      expect(QUOTES).toHaveLength(20);
      expect(QUOTES[0]).toBe('Beware of little expenses; a small leak will sink a great ship. 🚢');
      expect(QUOTES[1]).toBe("Don't save what is left after spending; spend what is left after saving. 💰");
      expect(QUOTES[19]).toBe("If you don't find a way to make money while you sleep, you will work until you die. 💤");
    });
  });
});
