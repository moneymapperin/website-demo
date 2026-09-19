import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supabase } from '../lib/supabase';
import { authService } from '../services/authService';
import { apiService } from '../services/apiService';
import { ResilienceUtils, ApiException } from '../services/resilienceUtils';
import { DashboardData } from '../models/dashboard';

describe('TASK 6 — Data Layer (ApiService, DashboardModel, ResilienceUtils)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    apiService.clearAllAppCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /* -------------------------------------------------------------------------- */
  /* Requirement 1: ResilienceUtils.retry & Deterministic Error Handling        */
  /* -------------------------------------------------------------------------- */
  describe('Requirement 1: ResilienceUtils.retry with deterministic error exclusion', () => {
    it('does NOT retry 404 "Calculations Pending" - rejects immediately with zero delay and exactly 1 call', async () => {
      vi.useFakeTimers();
      const task = vi.fn().mockRejectedValue(new ApiException('Calculations Pending', 404));

      const retryPromise = ResilienceUtils.retry({
        task,
        context: 'Fetch_Dashboard',
        maxAttempts: 3,
        initialDelayMs: 2000,
      });

      // Assert it rejected immediately without advancing any timer
      await expect(retryPromise).rejects.toThrow('Calculations Pending');
      expect(task).toHaveBeenCalledTimes(1);
    });

    it('does NOT retry 401 "Session Expired" or 403 "Forbidden"', async () => {
      const task401 = vi.fn().mockRejectedValue(new ApiException('Session Expired', 401));
      await expect(
        ResilienceUtils.retry({ task: task401, context: 'Profile' })
      ).rejects.toThrow('Session Expired');
      expect(task401).toHaveBeenCalledTimes(1);

      const task403 = vi.fn().mockRejectedValue(new ApiException('Account is not an Admin.', 403));
      await expect(
        ResilienceUtils.retry({ task: task403, context: 'Corp' })
      ).rejects.toThrow('Account is not an Admin.');
      expect(task403).toHaveBeenCalledTimes(1);
    });

    it('retries non-deterministic errors (e.g. network failure) with backoff and succeeds on 2nd attempt', async () => {
      vi.useFakeTimers();
      let callCount = 0;
      const task = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Network failure');
        }
        return 'success_payload';
      });

      const retryPromise = ResilienceUtils.retry({
        task,
        context: 'Network_Task',
        maxAttempts: 3,
        initialDelayMs: 2000,
      });

      // 1st call failed
      expect(task).toHaveBeenCalledTimes(1);

      // Advance by 2000ms (1st delay)
      await vi.advanceTimersByTimeAsync(2000);

      const result = await retryPromise;
      expect(result).toBe('success_payload');
      expect(task).toHaveBeenCalledTimes(2);
    });

    it('rethrows after exceeding maxAttempts (3 attempts)', async () => {
      vi.useFakeTimers();
      const task = vi.fn().mockRejectedValue(new Error('Persistent Socket Timeout'));

      const retryPromise = ResilienceUtils.retry({
        task,
        context: 'Timeout_Task',
        maxAttempts: 3,
        initialDelayMs: 2000,
      });

      // Attach unhandled rejection handler to avoid test runner warnings
      retryPromise.catch(() => {});

      // Attempt 1 fails -> delay 2000ms
      await vi.advanceTimersByTimeAsync(2000);
      // Attempt 2 fails -> delay 4000ms
      await vi.advanceTimersByTimeAsync(4000);

      await expect(retryPromise).rejects.toThrow('Persistent Socket Timeout');
      expect(task).toHaveBeenCalledTimes(3);
    });

    it('safeDouble converts numbers, strings, and nulls properly', () => {
      expect(ResilienceUtils.safeDouble(null)).toBe(0);
      expect(ResilienceUtils.safeDouble(undefined)).toBe(0);
      expect(ResilienceUtils.safeDouble(42)).toBe(42);
      expect(ResilienceUtils.safeDouble('84.5')).toBe(84.5);
      expect(ResilienceUtils.safeDouble('invalid', 10)).toBe(10);
    });

    it('sanitizeErrorMessage formats messages according to user rules', () => {
      expect(ResilienceUtils.sanitizeErrorMessage(new Error('Network request failed'))).toBe(
        'Connection issue detected. Please check your internet and try again.'
      );
      expect(ResilienceUtils.sanitizeErrorMessage('Error 429 Too Many Requests')).toBe(
        "Servers are busy right now. We'll refresh your data in a moment."
      );
      expect(ResilienceUtils.sanitizeErrorMessage('Connection timeout')).toBe(
        'The request took too long. Please try refreshing again.'
      );
      expect(ResilienceUtils.sanitizeErrorMessage('401 Unauthorized')).toBe(
        'Session expired or unauthorized. Please log in again.'
      );
      expect(ResilienceUtils.sanitizeErrorMessage('Random DB error 500')).toBe(
        "Something went wrong on our end. We've logged this and are looking into it."
      );
    });
  });

  /* -------------------------------------------------------------------------- */
  /* Requirement 7: DashboardData Model & Tie-Breaking                         */
  /* -------------------------------------------------------------------------- */
  describe('Requirement 7: DashboardData.fromCoreSchema & Tie-Breaking', () => {
    const fullFixture = {
      financial_fitness_scores: {
        global_fitness_score: 74,
        income_pillar_score: 65,
        expense_pillar_score: 45,
        savings_pillar_score: 82,
        protection_pillar_score: 70,
        investment_pillar_score: 60,
      },
      income_scores: { active_income_score: 70, passive_income_score: 60 },
      expense_scores: {
        savings_score: 50,
        flexible_score: 40,
        fixed_score: 45,
        discipline_message: 'Keep tracking your daily expenses.',
      },
      savings_scores: { ef_target_amount: 300000, ef_current_estimated: 250000 },
      protection_scores: { term_score: 75, health_score: 65, term_gap: 0, health_gap: 50000 },
      investment_scores: { equity_score: 65, asset_balance_score: 55, sip_score: 60, sip_gap: 5000 },
    };

    it('fromCoreSchema parses full fixture with all sub-scores and band tags', () => {
      const data = DashboardData.fromCoreSchema(fullFixture);
      expect(data.fitnessScore).toBe(74);
      expect(data.bandLabel).toBe('Good');
      expect(data.bandEmoji).toBe('✅');

      expect(data.pillars.income.score).toBe(65);
      expect(data.pillars.expenses.score).toBe(45);
      expect(data.pillars.emergency.score).toBe(82);
      expect(data.pillars.protection.score).toBe(70);
      expect(data.pillars.investment.score).toBe(60);

      // Weakest = expenses (45), Strongest = emergency (82)
      expect(data.summary.weakestPillar).toBe('expenses');
      expect(data.summary.weakestScore).toBe(45);
      expect(data.summary.strongestPillar).toBe('emergency');
      expect(data.summary.strongestScore).toBe(82);
      expect(data.summary.finTip).toBe('Keep tracking your daily expenses.');
    });

    it('fromCoreSchema handles nulls and numeric strings safely', () => {
      const stringFixture = {
        financial_fitness_scores: {
          global_fitness_score: '85.5',
          income_pillar_score: '80',
          expense_pillar_score: '90',
          savings_pillar_score: '85',
          protection_pillar_score: '80',
          investment_pillar_score: '85',
        },
      };

      const data = DashboardData.fromCoreSchema(stringFixture as any);
      expect(data.fitnessScore).toBe(85.5);
      expect(data.bandLabel).toBe('Excellent');
      expect(data.bandEmoji).toBe('💎');
      expect(data.pillars.expenses.score).toBe(90);
      expect(data.summary.finTip).toBe('Keep tracking your expenses daily.');
    });

    it('tie test: all pillar scores equal -> weakest = income, strongest = investment', () => {
      const tieFixture = {
        financial_fitness_scores: {
          global_fitness_score: 50,
          income_pillar_score: 50,
          expense_pillar_score: 50,
          savings_pillar_score: 50,
          protection_pillar_score: 50,
          investment_pillar_score: 50,
        },
      };

      const data = DashboardData.fromCoreSchema(tieFixture);
      // Stable sort preserves insertion order:
      // Insertion order: income (1st), expenses, emergency, protection, investment (5th)
      expect(data.summary.weakestPillar).toBe('income');
      expect(data.summary.strongestPillar).toBe('investment');
    });

    it('getBand boundary tests: 39.9, 40, 59.9, 60, 79.9, 80', () => {
      expect(DashboardData.getBand(39.9)).toEqual({ tag: 'Critical', emoji: '⚠️' });
      expect(DashboardData.getBand(40.0)).toEqual({ tag: 'Average', emoji: '😐' });
      expect(DashboardData.getBand(59.9)).toEqual({ tag: 'Average', emoji: '😐' });
      expect(DashboardData.getBand(60.0)).toEqual({ tag: 'Good', emoji: '✅' });
      expect(DashboardData.getBand(79.9)).toEqual({ tag: 'Good', emoji: '✅' });
      expect(DashboardData.getBand(80.0)).toEqual({ tag: 'Excellent', emoji: '💎' });
    });
  });

  /* -------------------------------------------------------------------------- */
  /* Requirement 3: Naming-Guard Tests for EVERY ApiService Method              */
  /* -------------------------------------------------------------------------- */
  describe('Requirement 3: Naming-Guard & Exact Database Query Assertions', () => {
    beforeEach(() => {
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: {
          session: {
            user: { id: 'u-contract-user', email: 'admin@corp.com' },
            access_token: 'valid-tok',
            refresh_token: 'valid-ref',
          },
        },
        error: null,
      } as any);
    });

    it('getMasterProfile: public.master_profiles, eq(user_id)', async () => {
      const maybeSingleMock = vi.fn().mockResolvedValue({
        data: { profile_json: { fullName: 'Sarthak' } },
        error: null,
      });
      const eqMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({ select: selectMock } as any);

      const res = await apiService.getMasterProfile();

      expect(fromSpy).toHaveBeenCalledWith('master_profiles');
      expect(selectMock).toHaveBeenCalled();
      expect(eqMock).toHaveBeenCalledWith('user_id', 'u-contract-user');
      expect(res.data).toEqual({ fullName: 'Sarthak' });
    });

    it('updateMasterProfile: public.master_profiles upsert { user_id, profile_json, updated_at }', async () => {
      const upsertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({ upsert: upsertMock } as any);

      const res = await apiService.updateMasterProfile({ city: 'Mumbai' });

      expect(fromSpy).toHaveBeenCalledWith('master_profiles');
      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'u-contract-user',
          profile_json: { city: 'Mumbai' },
        })
      );
      expect(res.status).toBe('success');
    });

    it('getDashboard: queries core schema and 5 pillar score tables', async () => {
      const mockResult = (data: any) => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data, error: null }),
          }),
        }),
      });

      const schemaSpy = vi.spyOn(supabase, 'schema').mockImplementation((schemaName: string) => {
        expect(schemaName).toBe('core');
        return {
          from: (tableName: string) => {
            if (tableName === 'financial_fitness_scores') {
              return mockResult({ global_fitness_score: 75 });
            }
            return mockResult({ score: 70 });
          },
        } as any;
      });

      const dashboard = await apiService.getDashboard();

      expect(schemaSpy).toHaveBeenCalledWith('core');
      expect(dashboard.financial_fitness_scores).toEqual({ global_fitness_score: 75 });
      expect(dashboard.income_scores).toEqual({ score: 70 });
      expect(dashboard.expense_scores).toEqual({ score: 70 });
      expect(dashboard.savings_scores).toEqual({ score: 70 });
      expect(dashboard.protection_scores).toEqual({ score: 70 });
      expect(dashboard.investment_scores).toEqual({ score: 70 });
    });

    it('getSubscriptionDetails: bse_data.user_subscriptions, eq(user_id)', async () => {
      const maybeSingleMock = vi.fn().mockResolvedValue({
        data: { plan_id: 'pro_annual', status: 'ACTIVE' },
        error: null,
      });
      const eqMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      const fromMock = vi.fn().mockReturnValue({ select: selectMock });
      const schemaSpy = vi.spyOn(supabase, 'schema').mockReturnValue({ from: fromMock } as any);

      const sub = await apiService.getSubscriptionDetails();

      expect(schemaSpy).toHaveBeenCalledWith('bse_data');
      expect(fromMock).toHaveBeenCalledWith('user_subscriptions');
      expect(eqMock).toHaveBeenCalledWith('user_id', 'u-contract-user');
      expect(sub).toEqual({ plan_id: 'pro_annual', status: 'ACTIVE' });
    });

    it('getWeeklyCurrent: public.weekly_logs, eq(user_id), eq(log_month), eq(log_year), order(week_index, asc)', async () => {
      const orderMock = vi.fn().mockResolvedValue({
        data: [{ week_index: 1, status: 'GREEN' }],
        error: null,
      });
      const eqYearMock = vi.fn().mockReturnValue({ order: orderMock });
      const eqMonthMock = vi.fn().mockReturnValue({ eq: eqYearMock });
      const eqUserMock = vi.fn().mockReturnValue({ eq: eqMonthMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqUserMock });
      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({ select: selectMock } as any);

      const res = await apiService.getWeeklyCurrent({ month: 9, year: 2026 });

      expect(fromSpy).toHaveBeenCalledWith('weekly_logs');
      expect(eqUserMock).toHaveBeenCalledWith('user_id', 'u-contract-user');
      expect(eqMonthMock).toHaveBeenCalledWith('log_month', 9);
      expect(eqYearMock).toHaveBeenCalledWith('log_year', 2026);
      expect(orderMock).toHaveBeenCalledWith('week_index', { ascending: true });
      expect(res.data).toEqual([{ week_index: 1, status: 'GREEN' }]);
    });

    it('updateWeeklyStatus: public.weekly_logs upsert with onConflict user_id,week_index,log_month,log_year', async () => {
      const upsertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({ upsert: upsertMock } as any);

      await apiService.updateWeeklyStatus({
        weekIndex: 2,
        status: 'RED',
        month: 9,
        year: 2026,
        spentFixed: 15000,
      });

      expect(fromSpy).toHaveBeenCalledWith('weekly_logs');
      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'u-contract-user',
          week_index: 2,
          log_month: 9,
          log_year: 2026,
          status: 'RED',
          spent_fixed: 15000,
        }),
        { onConflict: 'user_id,week_index,log_month,log_year' }
      );
    });

    it('getFinanceNews: bse_data.finance_news, order(updated_at, desc), limit(10)', async () => {
      const limitMock = vi.fn().mockResolvedValue({
        data: [{ id: 'news-1', title: 'Market Rally' }],
        error: null,
      });
      const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
      const selectMock = vi.fn().mockReturnValue({ order: orderMock });
      const fromMock = vi.fn().mockReturnValue({ select: selectMock });
      const schemaSpy = vi.spyOn(supabase, 'schema').mockReturnValue({ from: fromMock } as any);

      const news = await apiService.getFinanceNews();

      expect(schemaSpy).toHaveBeenCalledWith('bse_data');
      expect(fromMock).toHaveBeenCalledWith('finance_news');
      expect(orderMock).toHaveBeenCalledWith('updated_at', { ascending: false });
      expect(limitMock).toHaveBeenCalledWith(10);
      expect(news).toEqual([{ id: 'news-1', title: 'Market Rally' }]);
    });

    it('getBlogs: bse_data.blogs, order(updated_at, desc), limit(10)', async () => {
      const limitMock = vi.fn().mockResolvedValue({
        data: [{ id: 'blog-1', title: 'SIP Guide' }],
        error: null,
      });
      const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
      const selectMock = vi.fn().mockReturnValue({ order: orderMock });
      const fromMock = vi.fn().mockReturnValue({ select: selectMock });
      const schemaSpy = vi.spyOn(supabase, 'schema').mockReturnValue({ from: fromMock } as any);

      const blogs = await apiService.getBlogs();

      expect(schemaSpy).toHaveBeenCalledWith('bse_data');
      expect(fromMock).toHaveBeenCalledWith('blogs');
      expect(orderMock).toHaveBeenCalledWith('updated_at', { ascending: false });
      expect(limitMock).toHaveBeenCalledWith(10);
      expect(blogs).toEqual([{ id: 'blog-1', title: 'SIP Guide' }]);
    });

    it('getMarketSentiment: public.market_sentiment, order(updated_at, desc), limit(1), maybeSingle()', async () => {
      const maybeSingleMock = vi.fn().mockResolvedValue({
        data: { mood: 'BULLISH', score: 82 },
        error: null,
      });
      const limitMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
      const selectMock = vi.fn().mockReturnValue({ order: orderMock });
      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({ select: selectMock } as any);

      const sentiment = await apiService.getMarketSentiment();

      expect(fromSpy).toHaveBeenCalledWith('market_sentiment');
      expect(orderMock).toHaveBeenCalledWith('updated_at', { ascending: false });
      expect(limitMock).toHaveBeenCalledWith(1);
      expect(maybeSingleMock).toHaveBeenCalled();
      expect(sentiment).toEqual({ mood: 'BULLISH', score: 82 });
    });

    it('getCorporateWorkforceStats: checks admin, then queries corporate_analytics & workforce_intelligence', async () => {
      const adminMaybeSingle = vi.fn().mockResolvedValue({
        data: { company_name: 'Acme Corp' },
        error: null,
      });
      const ilikeMock = vi.fn().mockReturnValue({ maybeSingle: adminMaybeSingle });
      const selectAdmin = vi.fn().mockReturnValue({ ilike: ilikeMock });

      const fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'corporate_admins') {
          return { select: selectAdmin } as any;
        }
        return {} as any;
      });

      const schemaSpy = vi.spyOn(supabase, 'schema').mockImplementation((schemaName: string) => {
        expect(schemaName).toBe('core');
        return {
          from: (tbl: string) => ({
            select: () => ({
              eq: (col: string, val: string) => {
                expect(col).toBe('company_name');
                expect(val).toBe('Acme Corp');
                return {
                  maybeSingle: () =>
                    Promise.resolve({
                      data: tbl === 'corporate_analytics' ? { avg_score: 78 } : { risk_count: 2 },
                      error: null,
                    }),
                };
              },
            }),
          }),
        } as any;
      });

      const stats = await apiService.getCorporateWorkforceStats();

      expect(fromSpy).toHaveBeenCalledWith('corporate_admins');
      expect(schemaSpy).toHaveBeenCalledWith('core');
      expect(stats.avg_score).toBe(78);
      expect(stats.pillar_intel).toEqual({ risk_count: 2 });
    });

    it('loginWithQr: upserts public.web_sessions with onConflict: session_token', async () => {
      const upsertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({ upsert: upsertMock } as any);

      await apiService.loginWithQr('qr-token-123');

      expect(fromSpy).toHaveBeenCalledWith('web_sessions');
      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          session_token: 'qr-token-123',
          user_id: 'u-contract-user',
          access_token: 'valid-tok',
          refresh_token: 'valid-ref',
          status: 'AUTHENTICATED',
        }),
        { onConflict: 'session_token' }
      );
    });
  });

  /* -------------------------------------------------------------------------- */
  /* Requirement 2: MF Recommendations, Savings & In-Memory 2MB Scheme List     */
  /* -------------------------------------------------------------------------- */
  describe('Requirement 2: Mutual Fund & Savings Recommendations and In-Memory Cache', () => {
    const mockSchemes = [
      { schemeCode: '1001', schemeName: 'Nippon India Liquid Fund Direct Growth' },
      { schemeCode: '1002', schemeName: 'HDFC Overnight Fund Direct Plan Growth' },
      { schemeCode: '1003', schemeName: 'Kotak Arbitrage Fund Direct Growth' },
      { schemeCode: '1004', schemeName: 'ICICI Prudential Liquid Fund Direct Growth' },
      { schemeCode: '1005', schemeName: 'SBI Overnight Fund Direct Growth' },
      { schemeCode: '2001', schemeName: 'Parag Parikh Flexi Cap Fund Direct Growth' },
      { schemeCode: '2002', schemeName: 'Nippon India Small Cap Fund Direct Growth' },
      { schemeCode: '2003', schemeName: 'HDFC Hybrid Equity Fund Direct Growth' },
      { schemeCode: '2004', schemeName: 'Axis Small Cap Fund Direct Growth' },
      { schemeCode: '2005', schemeName: 'SBI Small Cap Fund Direct Growth' },
    ];

    it('stores the 2MB schemes list in-memory only (does not write to localStorage)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockSchemes,
      } as any);

      // Deterministic RNG (always returns 0 so no shuffle reordering)
      const deterministicRng = () => 0;

      const savings = await apiService.getSavingsRecommendations(deterministicRng);
      expect(savings.length).toBe(5);

      // Ensure mfapi_list is NOT stored in localStorage
      expect(localStorage.getItem('mm_cache_mfapi_list')).toBeNull();

      // Read from cache: second call does not call fetch again (cache hit for 12 hours)
      const cachedSavings = await apiService.getSavingsRecommendations(deterministicRng);
      expect(cachedSavings.length).toBe(5);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('getMutualFundRecommendations returns picks according to risk profile', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockSchemes,
      } as any);

      const deterministicRng = () => 0;
      const recs = await apiService.getMutualFundRecommendations('aggressive', deterministicRng);

      expect(recs.length).toBeGreaterThan(0);
      expect(recs[0]).toHaveProperty('category');
      expect(recs[0]).toHaveProperty('rating');
      expect(recs[0]).toHaveProperty('return');
    });

    it('gracefully returns empty array on fetch failure without throwing', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error on MFAPI'));

      const recs = await apiService.getMutualFundRecommendations('moderate');
      expect(recs).toEqual([]);

      const savings = await apiService.getSavingsRecommendations();
      expect(savings).toEqual([]);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* Requirement 4: Cache Lifecycle & Multi-User Isolation                       */
  /* -------------------------------------------------------------------------- */
  describe('Requirement 4: Cache lifecycle vs auth', () => {
    it('logout clears ALL mm_cache_ and mm_cache_ts_ entries from localStorage', async () => {
      // Seed storage with user A cache
      localStorage.setItem('mm_cache_profile_user_A', JSON.stringify({ name: 'User A' }));
      localStorage.setItem('mm_cache_ts_profile_user_A', new Date().toISOString());
      localStorage.setItem('mm_cache_dashboard_user_A', JSON.stringify({ score: 70 }));
      localStorage.setItem('mm_cache_ts_dashboard_user_A', new Date().toISOString());
      localStorage.setItem('theme_mode', 'dark'); // Non-cache key

      expect(localStorage.getItem('mm_cache_profile_user_A')).toBeDefined();

      // Call authService.logout()
      vi.spyOn(supabase.auth, 'signOut').mockResolvedValue({ error: null } as any);
      await authService.logout();

      // Verify all cache keys are removed
      expect(localStorage.getItem('mm_cache_profile_user_A')).toBeNull();
      expect(localStorage.getItem('mm_cache_ts_profile_user_A')).toBeNull();
      expect(localStorage.getItem('mm_cache_dashboard_user_A')).toBeNull();
      expect(localStorage.getItem('mm_cache_ts_dashboard_user_A')).toBeNull();

      // Ensure unrelated keys like theme_mode are preserved
      expect(localStorage.getItem('theme_mode')).toBe('dark');
    });

    it('a second user logging in on the same browser never reads the first user cached data', async () => {
      // User A creates cached profile
      apiService.updateCache('profile_user_A', { fullName: 'User A Profile' });
      expect(apiService.readCache('profile_user_A', 3600000)).toEqual({
        fullName: 'User A Profile',
      });

      // User A logs out
      apiService.clearAllAppCache();

      // User B logs in (uid: user_B)
      const userBCached = apiService.readCache('profile_user_B', 3600000);
      expect(userBCached).toBeNull();
    });
  });

  /* -------------------------------------------------------------------------- */
  /* Requirement 5: Concurrency & Request Deduping                               */
  /* -------------------------------------------------------------------------- */
  describe('Requirement 5: Concurrency & Request Deduping', () => {
    it('concurrent calls to getDashboard() share one in-flight promise and one network round-trip', async () => {
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: { user: { id: 'u-dedupe-user' } } },
      } as any);

      let networkCalls = 0;
      vi.spyOn(supabase, 'schema').mockReturnValue({
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => {
                networkCalls++;
                // Simulate network latency
                await new Promise((r) => setTimeout(r, 20));
                return { data: { global_fitness_score: 80 }, error: null };
              },
            }),
          }),
        }),
      } as any);

      // Trigger 2 concurrent calls simultaneously
      const [res1, res2] = await Promise.all([
        apiService.getDashboard(),
        apiService.getDashboard(),
      ]);

      expect(res1).toEqual(res2);
      // Because requests were deduped, financial_fitness_scores was queried only once (1 network round trip)
      expect(networkCalls).toBe(6); // 1 fitness + 5 pillars
    });
  });

  /* -------------------------------------------------------------------------- */
  /* Requirement 6: Resilient Error Logging (_logErrorResilient)                 */
  /* -------------------------------------------------------------------------- */
  describe('Requirement 6: Resilient Error Logging', () => {
    it('fire-and-forget, never throws, truncates to 500 chars, ignores 401/404, and dedupes within 60s', async () => {
      const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'app_logs') {
          return { insert: insertMock } as any;
        }
        return {} as any;
      });

      // 1. Never logs ApiException 401 or 404
      apiService.logErrorResilient(new ApiException('Not Logged In', 401), 'Test_401');
      apiService.logErrorResilient(new ApiException('Calculations Pending', 404), 'Test_404');
      expect(insertMock).not.toHaveBeenCalled();

      // 2. Logs real error and truncates > 500 characters
      const longMessage = 'A'.repeat(800);
      apiService.logErrorResilient(new Error(longMessage), 'Test_Long');

      await new Promise((r) => setTimeout(r, 20)); // wait for fire-and-forget promise
      expect(insertMock).toHaveBeenCalledTimes(1);
      const insertedPayload = insertMock.mock.calls[0][0];
      expect(insertedPayload.message.length).toBe(500);

      // 3. Dedupes identical (context + message) within 60 seconds
      apiService.logErrorResilient(new Error(longMessage), 'Test_Long');
      await new Promise((r) => setTimeout(r, 20));
      expect(insertMock).toHaveBeenCalledTimes(1); // Still 1, deduped!
    });
  });
});
