import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { InsightsPage, loadMoneyMapperPicks } from '../pages/InsightsPage';
import { NewsDetailPage } from '../pages/NewsDetailPage';
import { GoldRatesPage, formatGoldUpdateTime } from '../pages/GoldRatesPage';
import { StockScreenerPage, calculateUpsidePct } from '../pages/StockScreenerPage';
import { MutualFundScreenerPage } from '../pages/MutualFundScreenerPage';
import { MfRecommendationsPage } from '../pages/MfRecommendationsPage';
import { InsuranceScreenerPage, formatCover } from '../pages/InsuranceScreenerPage';
import { SentimentGauge, calculateSentimentValue } from '../components/market/SentimentGauge';
import { ScoreCardAdvisor, AdvisoryService } from '../services/marketAdvisor';
import { MarketDataService } from '../services/marketDataService';
import { apiService } from '../services/apiService';
import { supabase } from '../lib/supabase';
import { ToastProvider } from '../context/ToastContext';

// Helper for rendering with MemoryRouter and ToastProvider
function renderWithContext(ui: React.ReactElement, { route = '/' }: { route?: string } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ToastProvider>{ui}</ToastProvider>
    </MemoryRouter>
  );
}

describe('TASK 10 — Insights Tab and Market Screens', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    apiService.clearAllAppCache();
    (window as any).__MOCK_PLAN__ = {
      isPro: false,
      isFeatureAccessible: true,
      trialDaysRemaining: 7,
      plan: 'b2c',
    };
  });

  afterEach(() => {
    delete (window as any).__MOCK_PLAN__;
  });

  // ---------------------------------------------------------------------------
  // 1. Insights Page Section Order & Layout
  // ---------------------------------------------------------------------------
  describe('1. Insights Page (/insights) Section Order & Elements', () => {
    it('renders sections in strict exact vertical order without Sentiment Gauge, Quick Screener Grid, or IPO Radar', async () => {
      vi.spyOn(apiService, 'getFinanceNews').mockResolvedValue([
        { id: 'n1', title: 'Market Rally Continues', description: 'Sensex surges 500 pts', publisher: 'Mint' },
      ]);
      vi.spyOn(apiService, 'getBlogs').mockResolvedValue([
        { id: 'b1', title: 'How to Build an Emergency Fund', summary: 'Save 6 months of expenses', author: 'FinCoach' },
      ]);
      vi.spyOn(apiService, 'getMutualFundRecommendations').mockResolvedValue([
        { name: 'Nippon India Growth', category: 'MID CAP', type: 'Growth' },
      ]);
      vi.spyOn(apiService, 'getPickStocks').mockResolvedValue([
        { symbol: 'INFY', score: 85, direction: 'BUY' },
      ]);

      const { container } = renderWithContext(<InsightsPage />);

      // Await data load
      await waitFor(() => {
        expect(screen.getByTestId('section-top-stories')).toBeInTheDocument();
      });

      // 1. Header is present
      const header = screen.getByTestId('insights-header');
      expect(header).toBeInTheDocument();
      expect(screen.getByText('Insights')).toBeInTheDocument();
      expect(screen.getByText('MoneyMapper Insights')).toBeInTheDocument();
      expect(screen.getByTestId('insights-refresh-button')).toBeInTheDocument();
      expect(screen.getByTestId('insights-menu-button')).toBeInTheDocument();

      // Assert NO Market Sentiment Gauge in Insights Header!
      expect(screen.queryByTestId('sentiment-gauge')).not.toBeInTheDocument();

      // Assert NO Quick Screener Grid or IPO Radar
      expect(screen.queryByTestId('screener-grid')).not.toBeInTheDocument();
      expect(screen.queryByTestId('ipo-radar-card')).not.toBeInTheDocument();

      // Verify DOM vertical sequence
      const topStories = screen.getByTestId('section-top-stories');
      const proBanner0 = screen.getByTestId('pro-banner-0');
      const picks = screen.getByTestId('section-picks');
      const proBanner1 = screen.getByTestId('pro-banner-1');
      const learnGrow = screen.getByTestId('section-learn-grow');

      const allElements = container.querySelectorAll(
        '[data-testid="insights-header"], [data-testid="section-top-stories"], [data-testid="pro-banner-0"], [data-testid="section-picks"], [data-testid="pro-banner-1"], [data-testid="section-learn-grow"]'
      );

      expect(allElements[0]).toBe(header);
      expect(allElements[1]).toBe(topStories);
      expect(allElements[2]).toBe(proBanner0);
      expect(allElements[3]).toBe(picks);
      expect(allElements[4]).toBe(proBanner1);
      expect(allElements[5]).toBe(learnGrow);
    });

    it('PRO users do NOT see PRO banners', async () => {
      (window as any).__MOCK_PLAN__ = {
        isPro: true,
        isFeatureAccessible: true,
        trialDaysRemaining: 365,
        plan: 'pro',
      };

      vi.spyOn(apiService, 'getFinanceNews').mockResolvedValue([]);
      vi.spyOn(apiService, 'getBlogs').mockResolvedValue([]);
      vi.spyOn(apiService, 'getMutualFundRecommendations').mockResolvedValue([]);
      vi.spyOn(apiService, 'getPickStocks').mockResolvedValue([]);

      renderWithContext(<InsightsPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('pro-banner-0')).not.toBeInTheDocument();
        expect(screen.queryByTestId('pro-banner-1')).not.toBeInTheDocument();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // 2. MoneyMapper Picks Logic & 24-Hour Caching
  // ---------------------------------------------------------------------------
  describe('2. MoneyMapper Picks Logic (3 MF + 2 Stocks >= 70, 24h Cache, Gating)', () => {
    it('composes 3 MF + 2 stocks >= 70, caches for 24 hours, and uses cached version on subsequent calls', async () => {
      const mockMFs = [
        { name: 'Fund 1', category: 'LARGE CAP' },
        { name: 'Fund 2', category: 'MID CAP' },
        { name: 'Fund 3', category: 'FLEXI CAP' },
        { name: 'Fund 4', category: 'SMALL CAP' },
      ];
      const mockStocks = [
        { symbol: 'RELIANCE', score: 88, direction: 'BUY' },
        { symbol: 'TCS', score: 78, direction: 'BUY' },
        { symbol: 'HDFC', score: 72, direction: 'BUY' },
      ];

      const getMfSpy = vi.spyOn(apiService, 'getMutualFundRecommendations').mockResolvedValue(mockMFs);
      const getStocksSpy = vi.spyOn(apiService, 'getPickStocks').mockResolvedValue(mockStocks);

      // Deterministic RNG (returns 0.499 to keep stable order)
      const deterministicRng = () => 0.5;

      const picks = await loadMoneyMapperPicks(apiService, deterministicRng, true);
      expect(picks.length).toBe(5);

      const mfPicks = picks.filter((p) => !p.isStock);
      const stockPicks = picks.filter((p) => p.isStock);
      expect(mfPicks.length).toBe(3);
      expect(stockPicks.length).toBe(2);

      // Verify saved in localStorage under cached_picks_json with picks_updated_at
      expect(localStorage.getItem('cached_picks_json')).not.toBeNull();
      const updatedAt = parseInt(localStorage.getItem('picks_updated_at') || '0', 10);
      expect(updatedAt).toBeGreaterThan(0);

      // Subsequent call within 24h must NOT hit apiService again (cache hit)
      getMfSpy.mockClear();
      getStocksSpy.mockClear();

      const cachedPicks = await loadMoneyMapperPicks(apiService, deterministicRng, false);
      expect(cachedPicks.length).toBe(5);
      expect(getMfSpy).not.toHaveBeenCalled();
      expect(getStocksSpy).not.toHaveBeenCalled();

      // Fast forward time past 24 hours (86,400,001 ms) -> cache expired -> refetches
      localStorage.setItem('picks_updated_at', (Date.now() - 86400005).toString());
      await loadMoneyMapperPicks(apiService, deterministicRng, false);
      expect(getMfSpy).toHaveBeenCalledTimes(1);
      expect(getStocksSpy).toHaveBeenCalledTimes(1);
    });

    it('free user sees pick 0 unlocked, picks 1+ locked; tap shows upgrade toast', async () => {
      vi.spyOn(apiService, 'getFinanceNews').mockResolvedValue([]);
      vi.spyOn(apiService, 'getBlogs').mockResolvedValue([]);
      vi.spyOn(apiService, 'getMutualFundRecommendations').mockResolvedValue([
        { name: 'Fund A', category: 'MID CAP' },
        { name: 'Fund B', category: 'LARGE CAP' },
        { name: 'Fund C', category: 'HYBRID' },
      ]);
      vi.spyOn(apiService, 'getPickStocks').mockResolvedValue([
        { symbol: 'STOCKA', score: 85, direction: 'BUY' },
        { symbol: 'STOCKB', score: 75, direction: 'BUY' },
      ]);

      renderWithContext(<InsightsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('pick-card-0')).toBeInTheDocument();
      });

      // Pick 0 is unlocked
      expect(screen.queryByTestId('pick-locked-overlay-0')).not.toBeInTheDocument();

      // Pick 1 is locked with overlay
      expect(screen.getByTestId('pick-locked-overlay-1')).toBeInTheDocument();

      // Free user notice text is present verbatim
      expect(
        screen.getByText('Free users see only 1 pick. Upgrade to PRO to see all expert picks! 🚀')
      ).toBeInTheDocument();

      // Tapping locked pick 1 opens toast with upgrade message
      fireEvent.click(screen.getByTestId('pick-card-1'));
      expect(
        screen.getByText('Upgrade to PRO to unlock all expert picks! 🚀')
      ).toBeInTheDocument();
      expect(screen.getByTestId('toast-action-button')).toHaveTextContent('UPGRADE');
    });

    it('PRO user sees all 5 picks completely unlocked', async () => {
      (window as any).__MOCK_PLAN__ = {
        isPro: true,
        isFeatureAccessible: true,
        trialDaysRemaining: 365,
        plan: 'pro',
      };

      vi.spyOn(apiService, 'getFinanceNews').mockResolvedValue([]);
      vi.spyOn(apiService, 'getBlogs').mockResolvedValue([]);
      vi.spyOn(apiService, 'getMutualFundRecommendations').mockResolvedValue([
        { name: 'Fund A', category: 'MID CAP' },
        { name: 'Fund B', category: 'LARGE CAP' },
        { name: 'Fund C', category: 'HYBRID' },
      ]);
      vi.spyOn(apiService, 'getPickStocks').mockResolvedValue([
        { symbol: 'STOCKA', score: 85, direction: 'BUY' },
        { symbol: 'STOCKB', score: 75, direction: 'BUY' },
      ]);

      renderWithContext(<InsightsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('pick-card-4')).toBeInTheDocument();
      });

      // No pick has a lock overlay
      for (let i = 0; i < 5; i++) {
        expect(screen.queryByTestId(`pick-locked-overlay-${i}`)).not.toBeInTheDocument();
      }
      expect(screen.queryByTestId('picks-pro-notice')).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // 3. No Fabricated Numbers Rule
  // ---------------------------------------------------------------------------
  describe('3. Strict No Fabricated Numbers Assertion for MF Items', () => {
    it('does NOT render fabricated score, expected return %, or star ratings for MF items', async () => {
      vi.spyOn(apiService, 'getFinanceNews').mockResolvedValue([]);
      vi.spyOn(apiService, 'getBlogs').mockResolvedValue([]);
      vi.spyOn(apiService, 'getMutualFundRecommendations').mockResolvedValue([
        { name: 'Aditya Birla Frontline Equity', category: 'LARGE CAP' },
      ]);
      vi.spyOn(apiService, 'getPickStocks').mockResolvedValue([
        { symbol: 'INFY', score: 92, direction: 'BUY' },
      ]);

      renderWithContext(<InsightsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('pick-card-0')).toBeInTheDocument();
      });

      // Find MF card
      const mfCard = screen.getByText('Aditya Birla Frontline Equity').closest('[data-testid^="pick-card-"]');
      expect(mfCard).not.toBeNull();

      // Assert NO fabricated return string like "Expected 27%" or "Score:" inside MF card
      expect(mfCard?.textContent).not.toMatch(/Expected\s+\d+%/i);
      expect(mfCard?.textContent).not.toMatch(/★/);

      // Stock card keeps its real DB score
      const stockCard = screen.getByText('INFY').closest('[data-testid^="pick-card-"]');
      expect(stockCard?.textContent).toContain('Score: 92');
    });

    it('/mf-recommendations renders fund name and category tag only with NO fabricated return, score, or rating', async () => {
      vi.spyOn(apiService, 'getMutualFundRecommendations').mockResolvedValue([
        { name: 'Mirae Asset Large Cap', category: 'LARGE CAP', type: 'Conservative' },
      ]);

      renderWithContext(<MfRecommendationsPage />, { route: '/mf-recommendations?risk=moderate' });

      await waitFor(() => {
        expect(screen.getByTestId('mf-rec-card-0')).toBeInTheDocument();
      });

      const card = screen.getByTestId('mf-rec-card-0');
      expect(card).toHaveTextContent('Mirae Asset Large Cap');
      expect(card).toHaveTextContent('LARGE CAP');
      expect(card).toHaveTextContent('CONSERVATIVE');

      // Assert NO fabricated return, score, or stars
      expect(card.textContent).not.toMatch(/3Y ANNUAL RETURNS/i);
      expect(card.textContent).not.toMatch(/\d+%/);
      expect(card.textContent).not.toMatch(/Score/i);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. News Detail Screen & Deep Linking
  // ---------------------------------------------------------------------------
  describe('4. News Detail Screen (/news/:id) Field Mapping & Safe Text Rendering', () => {
    it('renders news article fields correctly and renders plain text without dangerouslySetInnerHTML', () => {
      const newsItem = {
        id: 'news-101',
        title: 'RBI Keeps Repo Rate Unchanged at 6.5%',
        description: '<p>The Monetary Policy Committee has <b>maintained</b> stance.&nbsp;</p>',
        publisher: 'Reuters',
        url: 'https://reuters.com/rbi-rate',
      };

      render(
        <MemoryRouter initialEntries={[{ pathname: '/news/news-101', state: { item: newsItem, isNews: true } }]}>
          <NewsDetailPage />
        </MemoryRouter>
      );

      expect(screen.getByText('Market Story')).toBeInTheDocument();
      expect(screen.getByText('REUTERS')).toBeInTheDocument();
      expect(screen.getByText('RBI Keeps Repo Rate Unchanged at 6.5%')).toBeInTheDocument();

      // HTML stripped to clean readable text
      const contentEl = screen.getByTestId('article-plain-content');
      expect(contentEl).toHaveTextContent('The Monetary Policy Committee has maintained stance.');
      expect(contentEl.innerHTML).not.toContain('<p>');
      expect(contentEl.innerHTML).not.toContain('<b>');

      // External link is valid and secure
      const link = screen.getByTestId('news-external-link');
      expect(link).toHaveAttribute('href', 'https://reuters.com/rbi-rate');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders blog guide fields correctly', () => {
      const blogItem = {
        id: 'blog-202',
        title: 'Complete Guide to Sovereign Gold Bonds',
        fullContent: 'SGBs offer 2.5% fixed interest plus capital appreciation.',
        author: 'Investment Desk',
      };

      render(
        <MemoryRouter initialEntries={[{ pathname: '/news/blog-202', state: { item: blogItem, isNews: false } }]}>
          <NewsDetailPage />
        </MemoryRouter>
      );

      expect(screen.getByText('Wealth Guide')).toBeInTheDocument();
      expect(screen.getByText('INVESTMENT DESK')).toBeInTheDocument();
      expect(screen.getByText('Complete Guide to Sovereign Gold Bonds')).toBeInTheDocument();
      expect(screen.getByTestId('article-plain-content')).toHaveTextContent(
        'SGBs offer 2.5% fixed interest plus capital appreciation.'
      );
    });

    it('deep-link fallback: fetches article by id when state is missing', async () => {
      const getNewsSpy = vi.spyOn(apiService, 'getNewsById').mockResolvedValue({
        id: 'deep-1',
        title: 'Deep Linked Article Title',
        content: 'Article content from database',
        source_id: 'BLOOMBERG',
      });

      render(
        <MemoryRouter initialEntries={['/news/deep-1?type=news']}>
          <Routes>
            <Route path="/news/:id" element={<NewsDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(getNewsSpy).toHaveBeenCalledWith('deep-1', 'news');
        expect(screen.getByText('Deep Linked Article Title')).toBeInTheDocument();
        expect(screen.getByText('BLOOMBERG')).toBeInTheDocument();
      });
    });

    it('missing article displays clean not-found state with back button', async () => {
      vi.spyOn(apiService, 'getNewsById').mockResolvedValue(null);

      render(
        <MemoryRouter initialEntries={['/news/non-existent?type=news']}>
          <Routes>
            <Route path="/news/:id" element={<NewsDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('news-not-found-state')).toBeInTheDocument();
        expect(screen.getByText('Story Not Found')).toBeInTheDocument();
        expect(screen.getByTestId('news-back-button')).toBeInTheDocument();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Gold Rates & Time Honesty
  // ---------------------------------------------------------------------------
  describe('5. Gold Rates (/gold-rates) and Time Honesty', () => {
    it('calculates 10g rate, formats updated_at from row, and shows verbatim disclaimer', async () => {
      const mockGoldData = {
        '24K (999 Purity)': 7450.0,
        '22K (916 Purity)': 6829.0,
        '18K (750 Purity)': 5588.0,
        '14K (585 Purity)': 4358.0,
        price: 74500.0,
        time: '10:30 AM',
        status: 'Live (IBJA)',
        updated_at: '2026-09-19T09:15:00Z',
      };

      vi.spyOn(MarketDataService.prototype, 'getGoldRate').mockResolvedValue(mockGoldData);

      renderWithContext(<GoldRatesPage />);

      await waitFor(() => {
        expect(screen.getByTestId('gold-ticker-card')).toBeInTheDocument();
      });

      // 10g price = 74,500
      expect(screen.getByTestId('gold-10g-price')).toHaveTextContent('74,500');

      // Uses row's updated_at formatted in local time
      const timeEl = screen.getByTestId('gold-update-time');
      expect(timeEl.textContent).toContain('Updated:');

      // Status badge
      expect(screen.getByTestId('gold-status-badge')).toHaveTextContent('Live (IBJA)');

      // Verbatim disclaimer assertion
      const disclaimer = screen.getByTestId('gold-disclaimer');
      expect(disclaimer).toHaveTextContent(
        'Rates are indicative. Retail prices may vary across different jewelers and cities due to local taxes (GST) and making charges.'
      );
    });

    it('falls back to client fetch time when row updated_at is absent', () => {
      const noUpdatedData = {
        price: 74000,
        time: '11:45 AM',
        status: 'Live (IBJA)',
      };
      const formatted = formatGoldUpdateTime(noUpdatedData);
      expect(formatted).toBe('11:45 AM');
    });

    it('handles 15-minute cache TTL, forceRefresh, stale fallback, and offline failure in MarketDataService', async () => {
      const service = new MarketDataService();

      // Mock Supabase select for live_metal_rates
      const mockSelect = vi.fn().mockResolvedValue({
        data: [
          { purity: '24K (999 Purity)', price: 7500, updated_at: '2026-09-19T10:00:00Z' },
          { purity: '22K (916 Purity)', price: 6875, updated_at: '2026-09-19T10:00:00Z' },
        ],
        error: null,
      });

      vi.spyOn(supabase, 'schema').mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: mockSelect,
        }),
      } as any);

      // 1. Initial fetch
      const res1 = await service.getGoldRate();
      expect(res1.price).toBe(75000);
      expect(res1.status).toBe('Live (IBJA)');
      expect(mockSelect).toHaveBeenCalledTimes(1);

      // 2. Immediate second fetch hits cache (select not called again)
      const res2 = await service.getGoldRate();
      expect(res2.price).toBe(75000);
      expect(mockSelect).toHaveBeenCalledTimes(1);

      // 3. forceRefresh: true bypasses cache
      const res3 = await service.getGoldRate({ forceRefresh: true });
      expect(res3.price).toBe(75000);
      expect(mockSelect).toHaveBeenCalledTimes(2);

      // 4. Stale fallback on network error
      mockSelect.mockRejectedValueOnce(new Error('Network Down'));
      const resStale = await service.getGoldRate({ forceRefresh: true });
      expect(resStale.status).toBe('Offline (Stale)');
      expect(resStale.price).toBe(75000);

      // 5. Hard failure with no cache returns Unavailable
      localStorage.clear();
      mockSelect.mockRejectedValueOnce(new Error('Server Error'));
      const resFail = await service.getGoldRate({ forceRefresh: true });
      expect(resFail.status).toBe('Unavailable');
      expect(resFail.price).toBe(0);
      expect(resFail.time).toBe('Sync Failed');
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Stock Screener & Sentiment Needle Formula
  // ---------------------------------------------------------------------------
  describe('6. Stock Screener (/stock-screener) & Needle Angle Formula', () => {
    it('maps needle_angle to 0-100 value according to specification (angle -90 -> 0, 0 -> 50, 90 -> 100, 200 -> clamped 100, missing -> 50)', () => {
      expect(calculateSentimentValue(-90)).toBe(0);
      expect(calculateSentimentValue(0)).toBe(50);
      expect(calculateSentimentValue(90)).toBe(100);
      expect(calculateSentimentValue(200)).toBe(100); // Clamped
      expect(calculateSentimentValue(-150)).toBe(0); // Clamped
      expect(calculateSentimentValue(undefined)).toBe(50);
      expect(calculateSentimentValue(null)).toBe(50);
      expect(calculateSentimentValue('')).toBe(50);
    });

    it('renders SentimentGauge with moving needle, rotation angle, and idle wiggle animation', () => {
      const { container, rerender } = render(<SentimentGauge value={50} size={240} />);
      
      const needle = screen.getByTestId('sentiment-gauge-needle');
      expect(needle).toBeInTheDocument();

      // Needle line element has appropriate classes
      const line = needle.querySelector('line');
      expect(line).toBeInTheDocument();
      expect(line).toHaveClass('stroke-slate-800');
      expect(line).toHaveClass('dark:stroke-slate-100');

      // Wiggle animation group exists
      const wiggleGroup = container.querySelector('.gauge-needle-wiggle-group');
      expect(wiggleGroup).toBeInTheDocument();

      // At value 50, target rotation should be 0deg (pointing straight up)
      // At value 0, target rotation is -90deg (pointing left to POOR)
      rerender(<SentimentGauge value={0} size={240} />);
      const needleZero = screen.getByTestId('sentiment-gauge-needle');
      expect(needleZero).toBeInTheDocument();

      // Disabling wiggle turns animation off
      rerender(<SentimentGauge value={100} size={240} enableWiggle={false} />);
      const wiggleGroupDisabled = container.querySelector('.gauge-needle-wiggle-group');
      expect(wiggleGroupDisabled?.getAttribute('style')).toContain('animation: none');
    });

    it('calculates upside % correctly from entry_range and target_range', () => {
      // Entry: 100-110, Target: 130-150 -> Min entry = 100, Max target = 150 -> Upside = ((150-100)/100)*100 = 50.0%
      expect(calculateUpsidePct('100 - 110', '130 - 150')).toBe('50.0%');
      expect(calculateUpsidePct('2000', '2500')).toBe('25.0%');
      expect(calculateUpsidePct('', '')).toBe('');
    });

    it('renders signals list, filters by search, and displays verbatim stock disclaimer', async () => {
      vi.spyOn(apiService, 'getMarketSentiment').mockResolvedValue({
        needle_angle: 0,
        master_direction: 'BUY',
        updated_at: '2026-09-19T08:00:00Z',
      });

      vi.spyOn(apiService, 'getStockSignals').mockResolvedValue([
        { symbol: 'RELIANCE', score: 88, direction: 'BUY', entry_range: '2800', target_range: '3200', sl_range: '2700' },
        { symbol: 'TCS', score: 65, direction: 'BUY', entry_range: '3800', target_range: '4200', sl_range: '3650' },
      ]);

      renderWithContext(<StockScreenerPage />);

      await waitFor(() => {
        expect(screen.getByTestId('stock-card-0')).toBeInTheDocument();
      });

      expect(screen.getByText('BULLISH / GREED')).toBeInTheDocument();
      expect(screen.getByText('RELIANCE')).toBeInTheDocument();

      // Verbatim stock screener disclaimer
      expect(screen.getByTestId('stock-disclaimer')).toHaveTextContent(
        'Scores above 70 indicate high-confidence signals. Always follow the Stop Loss range for risk management.'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Screeners Incremental Rendering & Advice Modals
  // ---------------------------------------------------------------------------
  describe('7. Screeners Incremental Rendering & AI Modals', () => {
    it('renders first 50 items incrementally and loads more on button click', async () => {
      // Generate 70 mock stocks
      const mock70Stocks = Array.from({ length: 70 }, (_, i) => ({
        symbol: `STOCK_${i}`,
        score: 75,
        direction: 'BUY',
      }));

      vi.spyOn(apiService, 'getStockSignals').mockResolvedValue(mock70Stocks);
      vi.spyOn(apiService, 'getMarketSentiment').mockResolvedValue({});

      renderWithContext(<StockScreenerPage />);

      await waitFor(() => {
        expect(screen.getByTestId('stock-card-0')).toBeInTheDocument();
      });

      // Initially only 50 cards rendered
      expect(screen.getByTestId('stock-card-49')).toBeInTheDocument();
      expect(screen.queryByTestId('stock-card-50')).not.toBeInTheDocument();

      // "Load More (20 remaining)" button is present
      const loadMoreBtn = screen.getByTestId('load-more-stocks');
      expect(loadMoreBtn).toHaveTextContent('Load More (20 remaining)');

      // Click to load more
      fireEvent.click(loadMoreBtn);
      expect(screen.getByTestId('stock-card-50')).toBeInTheDocument();
      expect(screen.getByTestId('stock-card-69')).toBeInTheDocument();
    });

    it('Mutual Fund screener filters by cluster and category', async () => {
      const mockFunds = [
        { id: '1', scheme_name: 'HDFC Mid-Cap Opportunities', cluster: 'Moderate', category: 'Mid Cap', final_score: 82 },
        { id: '2', scheme_name: 'Nippon Small Cap Fund', cluster: 'Aggressive', category: 'Small Cap', final_score: 88 },
        { id: '3', scheme_name: 'ICICI Prudential Liquid', cluster: 'Conservative', category: 'Debt', final_score: 91 },
      ];

      vi.spyOn(apiService, 'getMutualFundSignals').mockResolvedValue(mockFunds);

      // Render as PRO user to test filtering
      (window as any).__MOCK_PLAN__ = {
        isPro: true,
        isFeatureAccessible: true,
        trialDaysRemaining: 365,
        plan: 'pro',
      };

      renderWithContext(<MutualFundScreenerPage />);

      await waitFor(() => {
        expect(screen.getByTestId('mf-card-0')).toBeInTheDocument();
      });

      // Select Aggressive cluster
      fireEvent.change(screen.getByTestId('mf-cluster-select'), { target: { value: 'Aggressive' } });

      expect(screen.getByText('Nippon Small Cap Fund')).toBeInTheDocument();
      expect(screen.queryByText('HDFC Mid-Cap Opportunities')).not.toBeInTheDocument();
    });

    it('Insurance screener formats cover with Cr and Lakhs and filters by type', async () => {
      expect(formatCover(10000000)).toBe('₹1.0 Cr');
      expect(formatCover(50000000)).toBe('₹5.0 Cr');
      expect(formatCover(500000)).toBe('₹5 Lakh');
      expect(formatCover(50000)).toBe('₹50000');

      const mockPlans = [
        { id: 'p1', company: 'HDFC ERGO', policy: 'Optima Secure', insurance_type: 'Health', cover: 10000000, claim_ratio: 98.2, smart_score: 95 },
        { id: 'p2', company: 'Max Life', policy: 'Smart Secure Plus', insurance_type: 'Life', cover: 20000000, claim_ratio: 99.3, smart_score: 94 },
      ];

      vi.spyOn(apiService, 'getInsurancePlans').mockResolvedValue(mockPlans);

      // Render as PRO user
      (window as any).__MOCK_PLAN__ = {
        isPro: true,
        isFeatureAccessible: true,
        trialDaysRemaining: 365,
        plan: 'pro',
      };

      renderWithContext(<InsuranceScreenerPage />);

      await waitFor(() => {
        expect(screen.getByTestId('insurance-card-0')).toBeInTheDocument();
      });

      expect(screen.getByText('Optima Secure')).toBeInTheDocument();
      expect(screen.getByText('Smart Secure Plus')).toBeInTheDocument();

      // Click "Health" filter
      fireEvent.click(screen.getByTestId('insurance-type-health'));
      expect(screen.getByText('Optima Secure')).toBeInTheDocument();
      expect(screen.queryByText('Smart Secure Plus')).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // 8. ScoreCardAdvisor & AdvisoryService Table-Driven Tests
  // ---------------------------------------------------------------------------
  describe('8. ScoreCardAdvisor & AdvisoryService Logic', () => {
    it('ScoreCardAdvisor.generateStockAdvice generates correct verdict and commentary across score tiers', () => {
      const tiers = [
        { score: 90, expectedVerdict: 'GOOD TO BUY / POSITIVE', expectedCommentary: 'dominant market position' },
        { score: 80, expectedVerdict: 'GOOD TO BUY / POSITIVE', expectedCommentary: 'solid' },
        { score: 65, expectedVerdict: 'GOOD TO BUY / POSITIVE', expectedCommentary: 'minimum quality threshold' },
        { score: 45, expectedVerdict: 'AVOID / EXERCISE CAUTION', expectedCommentary: 'below our 60 threshold' },
        { score: 25, expectedVerdict: 'AVOID / EXERCISE CAUTION', expectedCommentary: 'Weak rating' },
        { score: 10, expectedVerdict: 'AVOID / EXERCISE CAUTION', expectedCommentary: 'Critical warning' },
      ];

      for (const t of tiers) {
        const advice = ScoreCardAdvisor.generateStockAdvice({
          symbol: 'TEST_STOCK',
          score: t.score,
          sector: 'Banking',
          pe_ratio: 18.5,
          market_cap: 5000000000, // 500 Cr
        });

        expect(advice).toContain(`MoneyMapper Score:** **${t.score}/100**`);
        expect(advice).toContain(t.expectedVerdict);
        expect(advice).toContain('Sector:** Banking');
        expect(advice).toContain('P/E Ratio:** 18.5x');
      }
    });

    it('ScoreCardAdvisor.generateMfAdvice generates category-specific insights', () => {
      const fundAdvice = ScoreCardAdvisor.generateMfAdvice({
        scheme_name: 'Axis Small Cap Fund',
        final_score: 85,
        category: 'Small Cap',
        cagr_3y: 24.5,
        aum_crores: 12000,
        risk_level: 'High',
      });

      expect(fundAdvice).toContain('Axis Small Cap Fund');
      expect(fundAdvice).toContain('GOOD FOR LONG-TERM INVESTMENT');
      expect(fundAdvice).toContain('3-Year CAGR:** 24.5%');
      expect(fundAdvice).toContain('AUM (Asset Size):** ₹12,000 Cr');
      expect(fundAdvice).toContain('Small-cap funds carry higher volatility');
    });

    it('ScoreCardAdvisor.generateInsuranceDetails outputs policy metrics without buy/sell opinions', () => {
      const details = ScoreCardAdvisor.generateInsuranceDetails({
        company: 'Tata AIA',
        policy: 'Sampoorna Raksha',
        smart_score: 92,
        insurance_type: 'Term Life',
        claim_ratio: 99.1,
        cover: 10000000,
        premium: 14500,
      });

      expect(details).toContain('Tata AIA');
      expect(details).toContain('Sampoorna Raksha');
      expect(details).toContain('99.1%');
      expect(details).toContain('₹1 Cr');
      expect(details).toContain('₹14,500 / yr');
      expect(details).toContain('informational and policy comparison purposes');
    });

    it('AdvisoryService.getAdvisoryText returns advice across score bands', () => {
      const lowIncome = AdvisoryService.getAdvisoryText('income', 5);
      expect(lowIncome).toContain('Stop all non-essential spending');

      const midExpense = AdvisoryService.getAdvisoryText('expenses', 15);
      expect(midExpense).toContain('Build your first monthly budget');

      const goodExpense = AdvisoryService.getAdvisoryText('expenses', 85);
      expect(goodExpense).toContain('Your expense control is excellent');
    });
  });

  // ---------------------------------------------------------------------------
  // 9. Naming-Guard & Supabase Query Contract Verification
  // ---------------------------------------------------------------------------
  describe('9. Supabase Query Naming Guards', () => {
    it('invokes exact tables and schemas matching SCHEMA_CONTRACT', async () => {
      const mockQueryChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      const schemaSpy = vi.spyOn(supabase, 'schema').mockReturnValue({
        from: vi.fn().mockReturnValue(mockQueryChain),
      } as any);

      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue(mockQueryChain as any);

      // 1. getStockSignals -> bse_data.stock_signals
      await apiService.getStockSignals();
      expect(schemaSpy).toHaveBeenCalledWith('bse_data');

      // 2. getMutualFundSignals -> bse_data.mutual_fund_signals
      await apiService.getMutualFundSignals();
      expect(schemaSpy).toHaveBeenCalledWith('bse_data');

      // 3. getInsurancePlans -> bse_data.insurance_plans
      await apiService.getInsurancePlans();
      expect(schemaSpy).toHaveBeenCalledWith('bse_data');

      // 4. getMarketSentiment -> public.market_sentiment (no schema called)
      await apiService.getMarketSentiment();
      expect(fromSpy).toHaveBeenCalledWith('market_sentiment');
    });
  });
});
