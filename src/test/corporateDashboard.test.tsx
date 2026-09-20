import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { ThemeProvider } from '../context/ThemeContext';
import { apiService } from '../services/apiService';
import { authService } from '../services/authService';
import { CorporateGuard } from '../components/common/CorporateGuard';
import { CorporateDashboardPage, MIN_COHORT_SIZE } from '../pages/CorporateDashboardPage';

// Mock apiService and authService
vi.mock('../services/apiService', () => ({
  apiService: {
    getCorporateAdmin: vi.fn(),
    getCorporateWorkforceStats: vi.fn(),
    clearCache: vi.fn(),
  },
}));

vi.mock('../services/authService', () => ({
  authService: {
    logout: vi.fn().mockResolvedValue(undefined),
  },
}));

const mockUser = {
  id: 'corp-admin-uid-123',
  email: 'corporate.admin@enterprise.com',
  app_metadata: {},
  user_metadata: { full_name: 'Corporate Admin' },
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00Z',
};

const mockStatsFixture = {
  company_name: 'Acme Enterprise',
  avg_workforce_score: 82,
  total_headcount: 100,
  stable_count: 65,
  watchlist_count: 20,
  high_risk_count: 10,
  critical_risk_count: 5,
  paycheck_dependency_pct: 35,
  no_emergency_fund_pct: 42,
  pillar_intel: {
    avg_income_score: 80,
    avg_expense_score: 60,
    avg_savings_score: 50,
    avg_protection_score: 70,
    avg_investment_score: 40,
  },
  dept_metrics: {
    Engineering: { avg_stress: 72, headcount: 30 },
    Marketing: { avg_stress: 65, headcount: 15 },
    Operations: { avg_stress: 66, headcount: 10 },
    Legal: { avg_stress: 40, headcount: 4 }, // < 5, should be hidden
    Design: { avg_stress: 50, headcount: 5 }, // = 5, should be shown
  },
};

const renderWithProviders = (
  ui: React.ReactElement,
  {
    user = mockUser,
    isLoading = false,
    initialEntries = ['/corporate-dashboard'],
  }: {
    user?: any;
    isLoading?: boolean;
    initialEntries?: string[];
  } = {}
) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthContext.Provider
        value={{
          user,
          session: user ? ({ user } as any) : null,
          isLoading,
          isLoggedIn: !!user,
          logout: vi.fn(),
        }}
      >
        <ThemeProvider>
          <ToastProvider>{ui}</ToastProvider>
        </ThemeProvider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe('TASK 14 — Corporate Dashboard & Guarding', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // 1. CorporateGuard Tests (3 Outcomes + Missing Email)
  // ============================================================================
  describe('1. CorporateGuard Authorization Matrix', () => {
    it('Outcome 1: Admin verified -> renders children successfully', async () => {
      vi.mocked(apiService.getCorporateAdmin).mockResolvedValueOnce({
        company_name: 'Acme Enterprise',
      });

      renderWithProviders(
        <CorporateGuard>
          <div data-testid="protected-corporate-content">Corporate Intelligence Active</div>
        </CorporateGuard>
      );

      // Verify loader appears initially
      expect(screen.getByTestId('corporate-guard-loading')).toBeDefined();

      // Verify children rendered after authorization
      await waitFor(() => {
        expect(screen.getByTestId('protected-corporate-content')).toBeDefined();
        expect(screen.getByText('Corporate Intelligence Active')).toBeDefined();
      });

      expect(apiService.getCorporateAdmin).toHaveBeenCalledWith('corporate.admin@enterprise.com');
    });

    it('Outcome 2: Non-admin (null response) -> shows toast and redirects to /dashboard', async () => {
      vi.mocked(apiService.getCorporateAdmin).mockResolvedValueOnce(null);

      renderWithProviders(
        <Routes>
          <Route
            path="/corporate-dashboard"
            element={
              <CorporateGuard>
                <div data-testid="protected-corporate-content">Should Not Render</div>
              </CorporateGuard>
            }
          />
          <Route path="/dashboard" element={<div data-testid="consumer-dashboard">Consumer Dashboard</div>} />
        </Routes>
      );

      // Verify redirect to consumer dashboard
      await waitFor(() => {
        expect(screen.getByTestId('consumer-dashboard')).toBeDefined();
        expect(screen.queryByTestId('protected-corporate-content')).toBeNull();
      });

      // Verify toast message content
      expect(
        screen.getByText(
          'Standard Account Detected: Corporate intelligence is restricted to authorized corporate administrators.'
        )
      ).toBeDefined();
    });

    it('Outcome 2b: Missing email -> treats as non-admin, shows toast and redirects to /dashboard', async () => {
      const userWithoutEmail = { ...mockUser, email: undefined };

      renderWithProviders(
        <Routes>
          <Route
            path="/corporate-dashboard"
            element={
              <CorporateGuard>
                <div data-testid="protected-corporate-content">Should Not Render</div>
              </CorporateGuard>
            }
          />
          <Route path="/dashboard" element={<div data-testid="consumer-dashboard">Consumer Dashboard</div>} />
        </Routes>,
        { user: userWithoutEmail }
      );

      await waitFor(() => {
        expect(screen.getByTestId('consumer-dashboard')).toBeDefined();
      });

      expect(apiService.getCorporateAdmin).not.toHaveBeenCalled();
      expect(
        screen.getByText(
          'Standard Account Detected: Corporate intelligence is restricted to authorized corporate administrators.'
        )
      ).toBeDefined();
    });

    it('Outcome 3: Verification error (network/RLS thrown) -> renders error state with Retry button (does NOT redirect)', async () => {
      vi.mocked(apiService.getCorporateAdmin).mockRejectedValueOnce(
        new Error('Network error: Failed to reach security service')
      );

      renderWithProviders(
        <Routes>
          <Route
            path="/corporate-dashboard"
            element={
              <CorporateGuard>
                <div data-testid="protected-corporate-content">Should Not Render</div>
              </CorporateGuard>
            }
          />
          <Route path="/dashboard" element={<div data-testid="consumer-dashboard">Consumer Dashboard</div>} />
        </Routes>
      );

      // Expect error alert, NOT a redirect
      await waitFor(() => {
        expect(screen.getByTestId('corporate-guard-error')).toBeDefined();
        expect(screen.getByText(/Network error: Failed to reach security service/i)).toBeDefined();
        expect(screen.queryByTestId('consumer-dashboard')).toBeNull();
      });

      // Clicking Retry calls getCorporateAdmin again
      vi.mocked(apiService.getCorporateAdmin).mockResolvedValueOnce({
        company_name: 'Acme Enterprise',
      });

      fireEvent.click(screen.getByTestId('retry-corporate-verification-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('protected-corporate-content')).toBeDefined();
      });

      expect(apiService.getCorporateAdmin).toHaveBeenCalledTimes(2);
    });
  });

  // ============================================================================
  // 2. Intro Screen & Scan Panel
  // ============================================================================
  describe('2. Intro Screen & Web Scan Panel', () => {
    it('renders intro screen with rotating problems and web-adapted scan text', async () => {
      vi.mocked(apiService.getCorporateWorkforceStats).mockResolvedValue(mockStatsFixture);

      renderWithProviders(<CorporateDashboardPage />);

      // Intro screen is active
      expect(screen.getByTestId('corporate-intro-screen')).toBeDefined();
      expect(screen.getByText('MoneyMapper Intelligence')).toBeDefined();
      expect(screen.getByText('Workforce stress is a silent productivity leak.')).toBeDefined();

      // Check first problem statement
      expect(screen.getByText('67% employees live paycheck to paycheck')).toBeDefined();

      // Scan panel web text
      expect(
        screen.getByText('Use the mobile app QR scanner to sign in on other devices')
      ).toBeDefined();

      // Clicking "Continue to Dashboard" skips intro
      const continueBtn = screen.getByTestId('continue-to-dashboard-btn');
      fireEvent.click(continueBtn);

      await waitFor(() => {
        expect(screen.queryByTestId('corporate-intro-screen')).toBeNull();
        expect(screen.getByTestId('corporate-dashboard-page')).toBeDefined();
      });
    });
  });

  // ============================================================================
  // 3. Fixture-Driven Module Rendering & Calculations
  // ============================================================================
  describe('3. Corporate Dashboard Modules & Data Integration', () => {
    beforeEach(async () => {
      vi.mocked(apiService.getCorporateWorkforceStats).mockResolvedValue(mockStatsFixture);
    });

    it('renders Score Header with WORKFORCE HEALTH INDEX, STABLE status, and headcount', async () => {
      renderWithProviders(<CorporateDashboardPage />);
      fireEvent.click(screen.getByTestId('continue-to-dashboard-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('corporate-score-header')).toBeDefined();
      });

      const scoreHeader = screen.getByTestId('corporate-score-header');
      expect(within(scoreHeader).getByText('WORKFORCE HEALTH INDEX')).toBeDefined();
      expect(within(scoreHeader).getByText('82')).toBeDefined();
      expect(within(scoreHeader).getByText('STABLE')).toBeDefined();
      expect(within(scoreHeader).getByText('100')).toBeDefined();
      expect(within(scoreHeader).getByText('EMPLOYEES')).toBeDefined();
    });

    it('renders Pillar Hit-Rates module with approximation formula and "Estimated employees" label', async () => {
      renderWithProviders(<CorporateDashboardPage />);
      fireEvent.click(screen.getByTestId('continue-to-dashboard-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('corporate-pillar-hitrates')).toBeDefined();
      });

      // Check meters and hit counts (round(score / 100 * 100)):
      // Income Stability: 80 / 100
      expect(screen.getByText('Income Stability')).toBeDefined();
      expect(screen.getByText('80 / 100')).toBeDefined();

      // Expense Discipline: 60 / 100
      expect(screen.getByText('Expense Discipline')).toBeDefined();
      expect(screen.getByText('60 / 100')).toBeDefined();

      // Emergency Ready: 50 / 100
      expect(screen.getByText('Emergency Ready')).toBeDefined();
      expect(screen.getByText('50 / 100')).toBeDefined();

      // Insurance Protected: 70 / 100
      expect(screen.getByText('Insurance Protected')).toBeDefined();
      expect(screen.getByText('70 / 100')).toBeDefined();

      // Investment Growth: 40 / 100
      expect(screen.getByText('Investment Growth')).toBeDefined();
      expect(screen.getByText('40 / 100')).toBeDefined();

      // All meters carry "Estimated employees" label
      const estimatedLabels = screen.getAllByText('(Estimated employees)');
      expect(estimatedLabels.length).toBe(5);
    });

    it('renders Critical Outcomes as value and affects text ONLY, without fixed severity labels', async () => {
      renderWithProviders(<CorporateDashboardPage />);
      fireEvent.click(screen.getByTestId('continue-to-dashboard-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('corporate-critical-outcomes')).toBeDefined();
      });

      // Paycheck Dependency
      expect(screen.getByText('Paycheck Dependency')).toBeDefined();
      expect(screen.getByText('35%')).toBeDefined();
      expect(screen.getByText('Affects 35% of staff.')).toBeDefined();

      // Emergency Fund Gap
      expect(screen.getByText('Emergency Fund Gap')).toBeDefined();
      expect(screen.getByText('42%')).toBeDefined();
      expect(screen.getByText('Affects 42% of workforce.')).toBeDefined();

      // OMITTED severity labels: Flutter's hardcoded "High Risk" and "Fragile" tags MUST NOT be present
      expect(screen.queryByText('Fragile')).toBeNull();
    });

    it('renders Risk Distribution with 4 cohorts', async () => {
      renderWithProviders(<CorporateDashboardPage />);
      fireEvent.click(screen.getByTestId('continue-to-dashboard-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('corporate-risk-distribution')).toBeDefined();
      });

      expect(screen.getByText('Stable Cohort')).toBeDefined();
      expect(screen.getByText('65 / 100')).toBeDefined();

      expect(screen.getByText('Watchlist')).toBeDefined();
      expect(screen.getByText('20 / 100')).toBeDefined();

      expect(screen.getByText('High Risk')).toBeDefined();
      expect(screen.getByText('10 / 100')).toBeDefined();

      expect(screen.getByText('Critical Risk')).toBeDefined();
      expect(screen.getByText('5 / 100')).toBeDefined();
    });

    it('renders Privacy Banner with privacy-first assurance', async () => {
      renderWithProviders(<CorporateDashboardPage />);
      fireEvent.click(screen.getByTestId('continue-to-dashboard-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('corporate-privacy-banner')).toBeDefined();
      });

      expect(
        screen.getByText('Privacy-First: All signals are anonymized and aggregated.')
      ).toBeDefined();
    });
  });

  // ============================================================================
  // 4. Verification that Fabricated / Hardcoded Modules are OMITTED
  // ============================================================================
  describe('4. Strict Omission of Hardcoded / Fabricated Modules', () => {
    beforeEach(() => {
      vi.mocked(apiService.getCorporateWorkforceStats).mockResolvedValue(mockStatsFixture);
    });

    it('asserts Stress module (Expense Pressure, EMI Load Index) is NOT rendered', async () => {
      renderWithProviders(<CorporateDashboardPage />);
      fireEvent.click(screen.getByTestId('continue-to-dashboard-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('corporate-dashboard-page')).toBeDefined();
      });

      expect(screen.queryByText(/Expense Pressure/i)).toBeNull();
      expect(screen.queryByText(/EMI Load Index/i)).toBeNull();
    });

    it('asserts ROI module (Productivity Gain, Retention Lift) is NOT rendered', async () => {
      renderWithProviders(<CorporateDashboardPage />);
      fireEvent.click(screen.getByTestId('continue-to-dashboard-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('corporate-dashboard-page')).toBeDefined();
      });

      expect(screen.queryByText(/Productivity Gain/i)).toBeNull();
      expect(screen.queryByText(/Retention Lift/i)).toBeNull();
      expect(screen.queryByText(/\+12\.4%/i)).toBeNull();
      expect(screen.queryByText(/\+6\.8%/i)).toBeNull();
    });

    it('asserts static recommendations module is NOT rendered', async () => {
      renderWithProviders(<CorporateDashboardPage />);
      fireEvent.click(screen.getByTestId('continue-to-dashboard-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('corporate-dashboard-page')).toBeDefined();
      });

      expect(
        screen.queryByText(/Increase insurance coverage for employees aged 30\+/i)
      ).toBeNull();
      expect(
        screen.queryByText(/Launch department-specific SIP education/i)
      ).toBeNull();
    });

    it('asserts AI Stability Forecast chart is NOT rendered', async () => {
      renderWithProviders(<CorporateDashboardPage />);
      fireEvent.click(screen.getByTestId('continue-to-dashboard-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('corporate-dashboard-page')).toBeDefined();
      });

      expect(screen.queryByText(/AI Stability Forecast/i)).toBeNull();
      expect(screen.queryByText(/TIMELINE \(MONTHS\)/i)).toBeNull();
    });
  });

  // ============================================================================
  // 5. Department Heatmap & Privacy Anonymity Threshold
  // ============================================================================
  describe('5. Department Heatmap & Anonymity Thresholds', () => {
    it('hides department with headcount < 5 and renders department with headcount >= 5', async () => {
      vi.mocked(apiService.getCorporateWorkforceStats).mockResolvedValue(mockStatsFixture);

      renderWithProviders(<CorporateDashboardPage />);
      fireEvent.click(screen.getByTestId('continue-to-dashboard-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('corporate-dept-heatmap')).toBeDefined();
      });

      // MIN_COHORT_SIZE = 5
      expect(MIN_COHORT_SIZE).toBe(5);

      // Legal has headcount = 4 (< 5), MUST be hidden
      expect(screen.queryByTestId('dept-row-legal')).toBeNull();
      expect(screen.queryByText('Legal')).toBeNull();

      // Design has headcount = 5 (>= 5), MUST be shown
      expect(screen.getByTestId('dept-row-design')).toBeDefined();
      expect(screen.getByText('Design')).toBeDefined();
      expect(screen.getByText('5 Members')).toBeDefined();

      // Anonymity notice is rendered
      expect(
        screen.getByText(
          'Departments with fewer than 5 employees are hidden to protect anonymity.'
        )
      ).toBeDefined();
    });

    it('correctly evaluates stress threshold: stress <= 65 is STABLE, stress > 65 is HIGH RISK', async () => {
      vi.mocked(apiService.getCorporateWorkforceStats).mockResolvedValue(mockStatsFixture);

      renderWithProviders(<CorporateDashboardPage />);
      fireEvent.click(screen.getByTestId('continue-to-dashboard-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('corporate-dept-heatmap')).toBeDefined();
      });

      // Marketing: avg_stress = 65 -> STABLE
      const marketingRow = screen.getByTestId('dept-row-marketing');
      expect(marketingRow).toBeDefined();
      expect(marketingRow.textContent).toContain('65%');
      expect(marketingRow.textContent).toContain('STABLE');

      // Operations: avg_stress = 66 -> HIGH RISK
      const opsRow = screen.getByTestId('dept-row-operations');
      expect(opsRow).toBeDefined();
      expect(opsRow.textContent).toContain('66%');
      expect(opsRow.textContent).toContain('HIGH RISK');

      // Engineering: avg_stress = 72 -> HIGH RISK
      const engRow = screen.getByTestId('dept-row-engineering');
      expect(engRow).toBeDefined();
      expect(engRow.textContent).toContain('72%');
      expect(engRow.textContent).toContain('HIGH RISK');
    });

    it('renders empty department state when dept_metrics is empty', async () => {
      vi.mocked(apiService.getCorporateWorkforceStats).mockResolvedValue({
        ...mockStatsFixture,
        dept_metrics: {},
      });

      renderWithProviders(<CorporateDashboardPage />);
      fireEvent.click(screen.getByTestId('continue-to-dashboard-btn'));

      await waitFor(() => {
        expect(screen.getByText('No departmental data yet.')).toBeDefined();
      });
    });
  });

  // ============================================================================
  // 6. No-Data Edge Case
  // ============================================================================
  describe('6. No-Data Banner & Watchlist Status', () => {
    it('renders NO DATA banner when total_headcount is 0', async () => {
      vi.mocked(apiService.getCorporateWorkforceStats).mockResolvedValue({
        company_name: 'Empty Co',
        avg_workforce_score: 0,
        total_headcount: 0,
      });

      renderWithProviders(<CorporateDashboardPage />);
      fireEvent.click(screen.getByTestId('continue-to-dashboard-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('no-data-banner')).toBeDefined();
      });

      expect(
        screen.getByText('NO DATA — Registered employee signals needed.')
      ).toBeDefined();
      expect(screen.getByText('WATCHLIST')).toBeDefined();
    });

    it('shows WATCHLIST tag when score is below 75', async () => {
      vi.mocked(apiService.getCorporateWorkforceStats).mockResolvedValue({
        ...mockStatsFixture,
        avg_workforce_score: 71,
      });

      renderWithProviders(<CorporateDashboardPage />);
      fireEvent.click(screen.getByTestId('continue-to-dashboard-btn'));

      await waitFor(() => {
        expect(screen.getByText('WATCHLIST')).toBeDefined();
      });
    });
  });

  // ============================================================================
  // 7. Corporate Header Actions: Refresh & Logout
  // ============================================================================
  describe('7. Header Actions: Refresh & Logout', () => {
    it('clicking refresh button clears cache corp_stats_<uid> and refetches data', async () => {
      vi.mocked(apiService.getCorporateWorkforceStats).mockResolvedValue(mockStatsFixture);

      renderWithProviders(<CorporateDashboardPage />);
      fireEvent.click(screen.getByTestId('continue-to-dashboard-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('corporate-refresh-btn')).toBeDefined();
      });

      fireEvent.click(screen.getByTestId('corporate-refresh-btn'));

      await waitFor(() => {
        expect(apiService.clearCache).toHaveBeenCalledWith(['corp_stats_corp-admin-uid-123']);
        expect(apiService.getCorporateWorkforceStats).toHaveBeenCalledTimes(2);
      });
    });

    it('clicking avatar opens confirmation modal and confirms logout to /login', async () => {
      vi.mocked(apiService.getCorporateWorkforceStats).mockResolvedValue(mockStatsFixture);

      renderWithProviders(
        <Routes>
          <Route path="/corporate-dashboard" element={<CorporateDashboardPage />} />
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
        </Routes>
      );

      fireEvent.click(screen.getByTestId('continue-to-dashboard-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('corporate-avatar-btn')).toBeDefined();
      });

      // Open logout modal
      fireEvent.click(screen.getByTestId('corporate-avatar-btn'));
      expect(screen.getByText('Confirm Logout')).toBeDefined();

      // Confirm logout
      fireEvent.click(screen.getByTestId('corporate-confirm-logout-btn'));

      await waitFor(() => {
        expect(authService.logout).toHaveBeenCalled();
        expect(screen.getByTestId('login-page')).toBeDefined();
      });
    });
  });
});
