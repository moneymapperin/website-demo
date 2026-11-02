import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { FeatureFlagService } from '../services/featureFlagService';
import { FeatureFlagContext, useFeatureFlag, useFeatureFlags } from '../context/FeatureFlagContext';
import { FeatureFlagGuard } from '../components/common/FeatureFlagGuard';
import { GoldTicker } from '../components/dashboard/GoldTicker';
import { ScoreCardsGrid } from '../components/dashboard/ScoreCardsGrid';

describe('Feature Flags System', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('FeatureFlagService Data Layer', () => {
    it('returns true for missing key or unknown flags so the app does not break', () => {
      const service = FeatureFlagService.getInstance();
      expect(service.isEnabled('non_existent_feature' as any)).toBe(true);
      expect(service.isEnabled('savings_recs')).toBe(true);
    });

    it('handles fetch error gracefully without throwing, keeps existing flags, and warns', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' },
        }),
      } as any);

      const service = FeatureFlagService.getInstance();
      const result = await service.fetchFlags();

      expect(result).toBeDefined();
      expect(consoleWarnSpy).toHaveBeenCalled();
      // Unfetched/missing keys still safely return true
      expect(service.isEnabled('ai_assistant')).toBe(true);
    });
  });

  describe('FeatureFlag Hooks Outside Provider', () => {
    function HookConsumer() {
      const { isEnabled, isLoading } = useFeatureFlags();
      const isStockEnabled = useFeatureFlag('stock_screener');
      return (
        <div>
          <span data-testid="loading-state">{String(isLoading)}</span>
          <span data-testid="stock-enabled">{String(isStockEnabled)}</span>
          <span data-testid="any-enabled">{String(isEnabled('random_key' as any))}</span>
        </div>
      );
    }

    it('returns enabled=true and loading=false outside of FeatureFlagProvider without crashing', () => {
      render(<HookConsumer />);
      expect(screen.getByTestId('loading-state').textContent).toBe('false');
      expect(screen.getByTestId('stock-enabled').textContent).toBe('true');
      expect(screen.getByTestId('any-enabled').textContent).toBe('true');
    });
  });

  describe('FeatureFlagGuard', () => {
    it('shows small centered spinner while flags are loading to prevent flash of content', () => {
      render(
        <MemoryRouter>
          <FeatureFlagContext.Provider
            value={{
              flags: {},
              isLoading: true,
              isEnabled: () => true,
            }}
          >
            <FeatureFlagGuard featureKey="ai_assistant">
              <div data-testid="guarded-content">Guarded Page Content</div>
            </FeatureFlagGuard>
          </FeatureFlagContext.Provider>
        </MemoryRouter>
      );

      expect(screen.getByTestId('feature-flag-loading')).toBeInTheDocument();
      expect(screen.queryByTestId('guarded-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('feature-flag-locked')).not.toBeInTheDocument();
    });

    it('renders children when the feature flag is enabled', () => {
      render(
        <MemoryRouter>
          <FeatureFlagContext.Provider
            value={{
              flags: { ai_assistant: true },
              isLoading: false,
              isEnabled: (key) => key === 'ai_assistant',
            }}
          >
            <FeatureFlagGuard featureKey="ai_assistant">
              <div data-testid="guarded-content">Guarded Page Content</div>
            </FeatureFlagGuard>
          </FeatureFlagContext.Provider>
        </MemoryRouter>
      );

      expect(screen.getByTestId('guarded-content')).toBeInTheDocument();
      expect(screen.queryByTestId('feature-flag-locked')).not.toBeInTheDocument();
      expect(screen.queryByTestId('feature-flag-loading')).not.toBeInTheDocument();
    });

    it('renders "Live Soon" locked screen and hides children when the feature flag is disabled', () => {
      render(
        <MemoryRouter>
          <FeatureFlagContext.Provider
            value={{
              flags: { ai_assistant: false },
              isLoading: false,
              isEnabled: () => false,
            }}
          >
            <FeatureFlagGuard featureKey="ai_assistant">
              <div data-testid="guarded-content">Guarded Page Content</div>
            </FeatureFlagGuard>
          </FeatureFlagContext.Provider>
        </MemoryRouter>
      );

      expect(screen.getByTestId('feature-flag-locked')).toBeInTheDocument();
      expect(screen.getByText('Live Soon')).toBeInTheDocument();
      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
      expect(screen.getByText(/We are putting the final touches on this feature/)).toBeInTheDocument();
      expect(screen.getByTestId('feature-flag-back-btn')).toBeInTheDocument();
      expect(screen.queryByTestId('guarded-content')).not.toBeInTheDocument();
    });
  });

  describe('GoldTicker with Feature Flags', () => {
    const mockGoldData = {
      '24K (999 Purity)': 7250,
      price24k: 7250,
    };

    it('shows blurred "Live Soon" overlay and prevents navigation when gold_rates flag is disabled', () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <FeatureFlagContext.Provider
            value={{
              flags: { gold_rates: false },
              isLoading: false,
              isEnabled: (key) => key !== 'gold_rates',
            }}
          >
            <Routes>
              <Route path="/dashboard" element={<GoldTicker goldData={mockGoldData} />} />
              <Route path="/market/gold" element={<div data-testid="gold-page">Gold Market Page</div>} />
            </Routes>
          </FeatureFlagContext.Provider>
        </MemoryRouter>
      );

      expect(screen.getByTestId('gold-ticker-locked-overlay')).toBeInTheDocument();
      expect(screen.getByText('Live Soon')).toBeInTheDocument();

      // Click ticker while disabled
      fireEvent.click(screen.getByTestId('gold-ticker'));
      expect(screen.queryByTestId('gold-page')).not.toBeInTheDocument();
    });

    it('navigates to /market/gold normally on click when gold_rates flag is enabled', () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <FeatureFlagContext.Provider
            value={{
              flags: { gold_rates: true },
              isLoading: false,
              isEnabled: (key) => key === 'gold_rates',
            }}
          >
            <Routes>
              <Route path="/dashboard" element={<GoldTicker goldData={mockGoldData} />} />
              <Route path="/market/gold" element={<div data-testid="gold-page">Gold Market Page</div>} />
            </Routes>
          </FeatureFlagContext.Provider>
        </MemoryRouter>
      );

      expect(screen.queryByTestId('gold-ticker-locked-overlay')).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId('gold-ticker'));
      expect(screen.getByTestId('gold-page')).toBeInTheDocument();
    });
  });

  describe('ScoreCardsGrid with Feature Flags', () => {
    it('shows locked overlay for disabled score cards and disables navigation', () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <FeatureFlagContext.Provider
            value={{
              flags: { stock_screener: false, mutual_funds: true, insurance: true },
              isLoading: false,
              isEnabled: (key) => key !== 'stock_screener',
            }}
          >
            <Routes>
              <Route path="/dashboard" element={<ScoreCardsGrid />} />
              <Route path="/market/stocks" element={<div data-testid="stocks-page">Stocks Page</div>} />
              <Route path="/market/funds" element={<div data-testid="funds-page">Funds Page</div>} />
            </Routes>
          </FeatureFlagContext.Provider>
        </MemoryRouter>
      );

      // Stock card should be locked
      expect(screen.getByTestId('score-card-stock-locked')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('score-card-stock'));
      expect(screen.queryByTestId('stocks-page')).not.toBeInTheDocument();

      // MF card should be enabled
      expect(screen.queryByTestId('score-card-mf-locked')).not.toBeInTheDocument();
      fireEvent.click(screen.getByTestId('score-card-mf'));
      expect(screen.getByTestId('funds-page')).toBeInTheDocument();
    });
  });
});
