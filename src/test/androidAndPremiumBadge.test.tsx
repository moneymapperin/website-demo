import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { DashboardPage } from '../pages/DashboardPage';
import { AuthContext } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';
import { apiService } from '../services/apiService';

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
  dob: '1995-04-12',
  employmentType: 'Salaried',
  monthlyIncome: 125000,
  monthlyExpenses: 45000,
  riskProfile: 'Moderate',
};

const goldFixture = {
  pricePerGram24k: 7250,
  pricePerGram22k: 6645,
  changePercent: 0.85,
  date: '2026-09-12',
  time: '04:15 PM',
};

describe('Android Download Button & Dashboard PREMIUM Badge', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    delete (window as any).__MOCK_PLAN__;
    apiService.clearAllAppCache();
  });

  it('Landing page: Android download button has text "Download Android App", does not contain "(APK)", and computed text-decoration is "none"', () => {
    render(<Hero />);

    const androidBtn = screen.getByRole('link', { name: /Download Android App$/i });
    expect(androidBtn).toBeInTheDocument();
    expect(androidBtn.textContent).toContain('Download Android App');
    expect(androidBtn.textContent).not.toContain('(APK)');
    expect(androidBtn.style.textDecoration).toBe('none');
  });

  it('Landing page: "Download web app for iOS" button is still rendered directly after the Android button in the DOM', () => {
    render(<Hero />);

    const androidBtn = screen.getByRole('link', { name: /Download Android App$/i });
    const iosBtn = screen.getByRole('button', { name: /Download web app for iOS/i });

    expect(androidBtn).toBeInTheDocument();
    expect(iosBtn).toBeInTheDocument();
    expect(androidBtn.nextElementSibling).toBe(iosBtn);
  });

  it('Dashboard: clicking the PREMIUM badge navigates to "/subscription"', async () => {
    vi.spyOn(apiService, 'getDashboard').mockResolvedValue(fullDashboardFixture as any);
    vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({ data: fullProfileFixture } as any);
    vi.spyOn(apiService, 'getGoldRate').mockResolvedValue(goldFixture as any);

    (window as any).__MOCK_PLAN__ = {
      isPro: true,
      isFeatureAccessible: true,
      trialDaysRemaining: 365,
      plan: 'pro',
    };

    const user = {
      id: 'user-pro-1',
      email: 'pro@moneymapper.io',
      created_at: '2026-01-01T00:00:00.000Z',
      user_metadata: { full_name: 'Aarav Sharma' },
    } as any;

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
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
                <Route
                  path="/subscription"
                  element={<div data-testid="subscription-page">Subscription Page Target</div>}
                />
              </Routes>
            </ToastProvider>
          </ThemeProvider>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-screen')).toBeInTheDocument();
    });

    const premiumBadge = screen.getByRole('button', { name: /Open subscription plans/i });
    expect(premiumBadge).toBeInTheDocument();
    expect(premiumBadge.textContent).toContain('PREMIUM');

    fireEvent.click(premiumBadge);

    await waitFor(() => {
      expect(screen.getByTestId('subscription-page')).toBeInTheDocument();
    });
  });
});
