import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { WeeklyExpensePredictorPage } from '../pages/pillars/WeeklyExpensePredictorPage';
import { AppShell } from '../components/app/AppShell';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { apiService } from '../services/apiService';
import { ToastProvider } from '../context/ToastContext';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';

describe('Weekly Expense Predictor - Crash Prevention & ErrorBoundary Fallback', () => {
  const mockAuthContext: any = {
    user: { id: 'test-user-id', email: 'test@moneymapper.internal' },
    session: null,
    profile: null,
    loading: false,
    isLoading: false,
    isLoggedIn: true,
    logout: vi.fn(),
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 16, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  const renderWithProviders = (ui: React.ReactElement, initialPath = '/pillars/expenses') => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthContext.Provider value={mockAuthContext}>
          <ThemeProvider>
            <ToastProvider>{ui}</ToastProvider>
          </ThemeProvider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };

  describe('1. Standard Account (Calculations Pending / 404)', () => {
    it('gracefully renders empty state card without crashing the React tree when getDashboard returns 404 Calculations Pending', async () => {
      const err = new Error('Calculations Pending');
      (err as any).status = 404;
      vi.spyOn(apiService, 'getDashboard').mockRejectedValue(err);
      vi.spyOn(apiService, 'getWeeklyCurrent').mockResolvedValue({ data: [] } as any);
      vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({
        data: { monthlyActiveIncome: 0 },
      } as any);

      renderWithProviders(<WeeklyExpensePredictorPage />);

      // Should display empty state without uncaught errors
      await waitFor(() => {
        expect(screen.getByTestId('weekly-empty-state')).toBeInTheDocument();
      });

      expect(screen.getByText('No Expense Predictions Yet')).toBeInTheDocument();
      expect(
        screen.getByText(/Weekly targets require an active monthly income/i)
      ).toBeInTheDocument();

      const setupBtn = screen.getByTestId('setup-expenses-btn');
      expect(setupBtn).toBeInTheDocument();
      expect(setupBtn).toHaveTextContent('Complete Expense Profile →');
    });

    it('navigates to /master-data?target=expenses when Complete Expense Profile button is clicked', async () => {
      const err = new Error('Calculations Pending');
      (err as any).status = 404;
      vi.spyOn(apiService, 'getDashboard').mockRejectedValue(err);
      vi.spyOn(apiService, 'getWeeklyCurrent').mockResolvedValue({ data: [] } as any);
      vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({
        data: { monthlyActiveIncome: 0 },
      } as any);

      render(
        <MemoryRouter initialEntries={['/pillars/expenses']}>
          <AuthContext.Provider value={mockAuthContext}>
            <ThemeProvider>
              <ToastProvider>
                <Routes>
                  <Route path="/pillars/expenses" element={<WeeklyExpensePredictorPage />} />
                  <Route
                    path="/master-data"
                    element={<div data-testid="master-data-page">Master Data Setup</div>}
                  />
                </Routes>
              </ToastProvider>
            </ThemeProvider>
          </AuthContext.Provider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('weekly-empty-state')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('setup-expenses-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('master-data-page')).toBeInTheDocument();
      });
    });
  });

  describe('2. Incomplete or Undefined Target Ranges', () => {
    it('safely renders default ranges (₹0 – ₹0) when target ranges are missing or empty', async () => {
      vi.spyOn(apiService, 'getDashboard').mockResolvedValue({
        financial_fitness_scores: { expense_pillar_score: 65 },
        expense_scores: { discipline_message: 'Keep going.' },
      } as any);
      // Return week log with undefined/null ranges
      vi.spyOn(apiService, 'getWeeklyCurrent').mockResolvedValue({
        data: [
          {
            week_index: 1,
            is_submitted: false,
            range_fixed: undefined,
            range_flex: null,
            range_save: undefined,
          },
        ],
      } as any);
      vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({
        data: { monthlyActiveIncome: 50000 },
      } as any);

      renderWithProviders(<WeeklyExpensePredictorPage />);

      // Wait for page to render without crashing
      await screen.findByRole('heading', { name: /Week 2 Target Ranges/i });

      // Check that decision cards are displayed and do not throw
      expect(screen.getByTestId('decision-card-fixed')).toBeInTheDocument();
      expect(screen.getByTestId('decision-card-flexible')).toBeInTheDocument();
      expect(screen.getByTestId('decision-card-savings')).toBeInTheDocument();
    });
  });

  describe('3. Generic API Error Handling', () => {
    it('renders error card with retry button when a network/server 500 error occurs', async () => {
      vi.spyOn(apiService, 'getDashboard').mockRejectedValue(new Error('Internal server error'));

      renderWithProviders(<WeeklyExpensePredictorPage />);

      await waitFor(() => {
        expect(screen.getByTestId('weekly-error-state')).toBeInTheDocument();
      });

      expect(screen.getByText('Unable to Load Expense Data')).toBeInTheDocument();
      expect(screen.getByText('Internal server error')).toBeInTheDocument();
      expect(screen.getByTestId('weekly-retry-btn')).toBeInTheDocument();
      expect(screen.getByTestId('weekly-error-profile-btn')).toBeInTheDocument();
    });
  });

  describe('4. ErrorBoundary & AppShell Crash Containment', () => {
    it('catches uncaught component render error, prevents full-screen unmount, and displays error fallback', () => {
      // Component that throws synchronously during render
      const CrashingComponent = () => {
        throw new Error('Uncaught render failure in pillar');
      };

      // Suppress React boundary console.error during expected test throw
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <MemoryRouter initialEntries={['/pillars/expenses']}>
          <AuthContext.Provider value={mockAuthContext}>
            <ThemeProvider>
              <ToastProvider>
                <AppShell>
                  <CrashingComponent />
                </AppShell>
              </ToastProvider>
            </ThemeProvider>
          </AuthContext.Provider>
        </MemoryRouter>
      );

      // AppShell frame (sidebar, bottom nav, header) remains mounted!
      expect(screen.getByTestId('desktop-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-nav')).toBeInTheDocument();

      // Error Boundary card is shown
      expect(screen.getByTestId('error-boundary-card')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong on this page')).toBeInTheDocument();
      expect(screen.getByText('Uncaught render failure in pillar')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reload page' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to dashboard' })).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it('calls window.location.reload when Reload page button is clicked', () => {
      const CrashingComponent = () => {
        throw new Error('Test crash');
      };
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const reloadMock = vi.fn();
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { reload: reloadMock, assign: vi.fn(), pathname: '/pillars/expenses' },
      });

      render(
        <ErrorBoundary>
          <CrashingComponent />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Reload page' }));
      expect(reloadMock).toHaveBeenCalledTimes(1);

      consoleErrorSpy.mockRestore();
    });

    it('calls window.location.assign("/dashboard") when Go to dashboard button is clicked', () => {
      const CrashingComponent = () => {
        throw new Error('Test crash');
      };
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const assignMock = vi.fn();
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { reload: vi.fn(), assign: assignMock, pathname: '/pillars/expenses' },
      });

      render(
        <ErrorBoundary>
          <CrashingComponent />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Go to dashboard' }));
      expect(assignMock).toHaveBeenCalledWith('/dashboard');

      consoleErrorSpy.mockRestore();
    });
  });
});
