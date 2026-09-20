/**
 * MoneyMapper API Service
 * Port of reference/moneymapper_app/lib/services/api_service.dart
 * 
 * NOTE: api.mfapi.in is called directly by getSavingsRecommendations and
 * getMutualFundRecommendations. In local development or production, it must
 * allow CORS or be proxied via MF_API_URL.
 */

import { supabase } from '../lib/supabase';
import { ApiException, ResilienceUtils } from './resilienceUtils';

export { ApiException };

export interface CorporateAdminRecord {
  company_name: string;
}

export const MF_API_URL = 'https://api.mfapi.in/mf';

// Cache configuration
export const CACHE_PREFIX = 'mm_cache_';
export const CACHE_TS_PREFIX = 'mm_cache_ts_';

// TTLs matching Flutter: short (10m), medium (1h), long (4h), mfapi (12h)
export const TTL_SHORT_MS = 10 * 60 * 1000;
export const TTL_MEDIUM_MS = 60 * 60 * 1000;
export const TTL_LONG_MS = 4 * 60 * 60 * 1000;
export const TTL_MFAPI_MS = 12 * 60 * 60 * 1000;

export class ApiService {
  // In-flight promise deduplication map
  private _inFlightRequests = new Map<string, Promise<any>>();

  // In-memory cache for heavy payloads (e.g. 2MB MFAPI scheme list)
  private _memoryCache = new Map<string, { data: any; timestamp: number }>();

  // Deduplication tracker for resilient logging: "context+message" -> timestamp
  private _recentLogs = new Map<string, number>();

  // --- Internal Resilient Logging ---

  /**
   * Resilient, non-blocking error logging to public.app_logs.
   * Fire-and-forget (never awaited by callers), never throws,
   * truncates message and stack to 500 chars, ignores 401/404,
   * dedupes identical (context+message) logs within 60 seconds,
   * and never logs auth tokens or profile payloads.
   */
  public logErrorResilient(error: unknown, context: string, stack?: string): void {
    try {
      // Never log expected/deterministic user errors
      if (
        error instanceof ApiException &&
        (error.statusCode === 401 || error.statusCode === 404)
      ) {
        return;
      }

      const rawMsg =
        error instanceof Error ? error.message : String(error ?? 'Unknown error');
      const cleanMsg = rawMsg.slice(0, 500);
      const cleanStack = stack ? stack.slice(0, 500) : undefined;

      // 60-second deduplication
      const dedupeKey = `${context}::${cleanMsg}`;
      const now = Date.now();
      const lastLogged = this._recentLogs.get(dedupeKey);
      if (lastLogged && now - lastLogged < 60000) {
        return;
      }
      this._recentLogs.set(dedupeKey, now);

      // Fire and forget
      Promise.resolve().then(async () => {
        try {
          const { data } = await supabase.auth.getSession();
          const userId = data?.session?.user?.id ?? null;

          await supabase.from('app_logs').insert({
            user_id: userId,
            log_level: 'ERROR',
            context,
            message: cleanMsg,
            metadata: {
              timestamp: new Date().toISOString(),
              stack_trace: cleanStack,
            },
          });
        } catch {
          // Never throw from logging pipeline
        }
      });
    } catch {
      // Ignored
    }
  }

  // --- Concurrency / In-Flight Request Deduplication ---

  private _dedupe<T>(key: string, task: () => Promise<T>): Promise<T> {
    const existing = this._inFlightRequests.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = task().finally(() => {
      this._inFlightRequests.delete(key);
    });

    this._inFlightRequests.set(key, promise);
    return promise;
  }

  // --- Cache Helpers ---

  public readCache<T = any>(key: string, ttlMs: number): T | null {
    // 1. Check in-memory cache first
    const mem = this._memoryCache.get(key);
    if (mem) {
      if (Date.now() - mem.timestamp <= ttlMs) {
        return mem.data as T;
      }
      this._memoryCache.delete(key);
    }

    // 2. Check localStorage
    if (typeof window === 'undefined') return null;
    try {
      const dataStr = localStorage.getItem(CACHE_PREFIX + key);
      const tsStr = localStorage.getItem(CACHE_TS_PREFIX + key);
      if (!dataStr || !tsStr) return null;

      const ts = new Date(tsStr).getTime();
      if (Date.now() - ts > ttlMs) {
        return null; // Expired
      }
      return JSON.parse(dataStr) as T;
    } catch {
      return null;
    }
  }

  public updateCache(key: string, data: any, memoryOnly = false): void {
    const now = Date.now();
    if (memoryOnly || key === 'mfapi_list') {
      this._memoryCache.set(key, { data, timestamp: now });
      return;
    }

    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
      localStorage.setItem(CACHE_TS_PREFIX + key, new Date(now).toISOString());
    } catch {
      // Safely ignore QuotaExceededError or private-mode storage errors
    }
  }

  public clearCache(keys: string[]): void {
    for (const key of keys) {
      this._memoryCache.delete(key);
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(CACHE_PREFIX + key);
          localStorage.removeItem(CACHE_TS_PREFIX + key);
        } catch {
          // ignore
        }
      }
    }
  }

  public clearAllAppCache(): void {
    this._memoryCache.clear();
    this._inFlightRequests.clear();
    if (typeof window === 'undefined') return;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(CACHE_PREFIX) || key.startsWith(CACHE_TS_PREFIX))) {
          keysToRemove.push(key);
        }
      }
      for (const k of keysToRemove) {
        localStorage.removeItem(k);
      }
    } catch {
      // ignore
    }
  }

  private async _getUserId(): Promise<string> {
    const { data } = await supabase.auth.getSession();
    const userId = data?.session?.user?.id;
    if (!userId) {
      throw new ApiException('Session Expired', 401);
    }
    return userId;
  }

  // --- Profile Management ---

  async getMasterProfile(): Promise<{ data: any }> {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) {
      throw new ApiException('Session Expired', 401);
    }

    const cacheKey = `profile_${userId}`;
    const cached = this.readCache(cacheKey, TTL_MEDIUM_MS);
    if (cached !== null && cached !== undefined) {
      return { data: cached };
    }

    return this._dedupe(cacheKey, async () => {
      try {
        return await ResilienceUtils.retry({
          context: 'Fetch_Master_Profile',
          task: async () => {
            const currentUid = await this._getUserId();
            const { data: response, error } = await supabase
              .from('master_profiles')
              .select()
              .eq('user_id', currentUid)
              .maybeSingle();

            if (error) throw error;

            const profileData = response?.profile_json;
            if (profileData) {
              this.updateCache(cacheKey, profileData);
            }
            return { data: profileData ?? null };
          },
        });
      } catch (e) {
        if (e instanceof ApiException) throw e;
        this.logErrorResilient(e, 'getMasterProfile');
        throw new ApiException(ResilienceUtils.sanitizeErrorMessage(e), 500);
      }
    });
  }

  async updateMasterProfile(data: Record<string, any>): Promise<{ status: string }> {
    try {
      const userId = await this._getUserId();

      // Fresh DB read of master_profiles.profile_json bypassing local/memory cache
      let existingProfile: Record<string, any> = {};
      const tableQuery = supabase.from('master_profiles') as any;
      if (typeof tableQuery?.select === 'function') {
        const { data: existingRow, error: fetchError } = await tableQuery
          .select('profile_json')
          .eq('user_id', userId)
          .maybeSingle();

        if (fetchError) {
          this.logErrorResilient(fetchError, 'updateMasterProfile_fetch');
        }
        if (existingRow?.profile_json) {
          existingProfile = existingRow.profile_json;
        }
      }
      const mergedProfile = { ...existingProfile, ...data };

      const { error } = await supabase.from('master_profiles').upsert({
        user_id: userId,
        profile_json: mergedProfile,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Cache Busting
      this.clearCache([`profile_${userId}`, `dashboard_${userId}`]);

      return { status: 'success' };
    } catch (e) {
      if (e instanceof ApiException) throw e;
      this.logErrorResilient(e, 'updateMasterProfile');
      throw new ApiException(ResilienceUtils.sanitizeErrorMessage(e), 500);
    }
  }

  async addEmergencySavings(amountToAdd: number): Promise<void> {
    try {
      const userId = await this._getUserId();

      // Fresh DB read of master_profiles bypassing local/memory cache
      let existingProfile: Record<string, any> = {};
      const tableQuery = supabase.from('master_profiles') as any;
      if (typeof tableQuery?.select === 'function') {
        const { data: existingRow, error: fetchError } = await tableQuery
          .select('profile_json')
          .eq('user_id', userId)
          .maybeSingle();

        if (fetchError) {
          this.logErrorResilient(fetchError, 'addEmergencySavings_fetch');
        }
        if (existingRow?.profile_json) {
          existingProfile = existingRow.profile_json;
        }
      }

      const targetKey = 'emergencyFundCurrent';
      const currentVal = ResilienceUtils.safeDouble(existingProfile[targetKey]);
      const mergedProfile = {
        ...existingProfile,
        [targetKey]: (currentVal + amountToAdd).toFixed(0),
      };

      const { error } = await supabase.from('master_profiles').upsert({
        user_id: userId,
        profile_json: mergedProfile,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Cache Busting
      this.clearCache([`profile_${userId}`, `dashboard_${userId}`]);
    } catch (e) {
      if (e instanceof ApiException) throw e;
      this.logErrorResilient(e, 'addEmergencySavings');
      throw new ApiException(ResilienceUtils.sanitizeErrorMessage(e), 500);
    }
  }

  // --- Subscription Methods ---

  async getSubscriptionDetails(): Promise<Record<string, any> | null> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) return null;

      const { data, error } = await supabase
        .schema('bse_data')
        .from('user_subscriptions')
        .select()
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (e) {
      this.logErrorResilient(e, 'getSubscriptionDetails');
      return null;
    }
  }

  // --- Dashboard Logic (Calculated Scores) ---

  async getDashboard(): Promise<Record<string, any>> {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) {
      throw new ApiException('Not Logged In', 401);
    }

    const cacheKey = `dashboard_${userId}`;
    const cached = this.readCache(cacheKey, TTL_SHORT_MS);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    return this._dedupe(cacheKey, async () => {
      try {
        return await ResilienceUtils.retry({
          context: 'Fetch_Dashboard',
          task: async () => {
            const currentUid = await this._getUserId();

            const { data: fitnessRes, error: fitnessError } = await supabase
              .schema('core')
              .from('financial_fitness_scores')
              .select()
              .eq('user_id', currentUid)
              .maybeSingle();

            if (fitnessError) throw fitnessError;
            if (!fitnessRes) {
              throw new ApiException('Calculations Pending', 404);
            }

            const results = await Promise.all([
              supabase
                .schema('core')
                .from('income_scores')
                .select()
                .eq('user_id', currentUid)
                .maybeSingle(),
              supabase
                .schema('core')
                .from('expense_scores')
                .select()
                .eq('user_id', currentUid)
                .maybeSingle(),
              supabase
                .schema('core')
                .from('savings_scores')
                .select()
                .eq('user_id', currentUid)
                .maybeSingle(),
              supabase
                .schema('core')
                .from('protection_scores')
                .select()
                .eq('user_id', currentUid)
                .maybeSingle(),
              supabase
                .schema('core')
                .from('investment_scores')
                .select()
                .eq('user_id', currentUid)
                .maybeSingle(),
            ]);

            for (const r of results) {
              if (r.error) throw r.error;
            }

            const data = {
              financial_fitness_scores: fitnessRes,
              income_scores: results[0].data,
              expense_scores: results[1].data,
              savings_scores: results[2].data,
              protection_scores: results[3].data,
              investment_scores: results[4].data,
            };

            this.updateCache(cacheKey, data);
            return data;
          },
        });
      } catch (e) {
        if (e instanceof ApiException) throw e;
        this.logErrorResilient(e, 'getDashboard');
        throw new ApiException(ResilienceUtils.sanitizeErrorMessage(e), 500);
      }
    });
  }

  // --- Live Intelligence Recommendations ---

  async getSavingsRecommendations(rng: () => number = Math.random): Promise<any[]> {
    const cached = this.readCache('savings_recs', TTL_LONG_MS);
    if (cached !== null && cached !== undefined) return cached;

    try {
      const allSchemes = await this._fetchSchemesList();
      const keywords = ['Overnight', 'Liquid', 'Arbitrage'];
      const filtered = allSchemes.filter((s: any) => {
        const name = (s['schemeName'] ?? '').toString().toLowerCase();
        return (
          keywords.some((k) => name.includes(k.toLowerCase())) &&
          name.includes('direct') &&
          name.includes('growth')
        );
      });

      const selected = this._take(5, filtered, rng);
      const data = selected.map((s: any) => {
        const name = (s['schemeName'] ?? '').toString().toLowerCase();
        let cat = 'Liquid Fund';
        if (name.includes('overnight')) cat = 'Overnight Fund';
        if (name.includes('arbitrage')) cat = 'Arbitrage Fund';

        return {
          fund: s['schemeName'],
          category: cat,
          returns: '6.5% - 7.8%',
          risk: cat === 'Overnight Fund' ? 'Very Low' : 'Low',
          liquidity: cat === 'Arbitrage Fund' ? 'T+2' : 'T+1',
          exitLoad: cat === 'Overnight Fund' ? 'Nil' : 'Nil (Post 7 Days)',
          score: 90 + (Math.floor(ResilienceUtils.safeDouble(s['schemeCode'])) % 10),
          tag: cat === 'Overnight Fund' ? 'Safest' : 'Popular',
        };
      });

      this.updateCache('savings_recs', data);
      return data;
    } catch (e) {
      this.logErrorResilient(e, 'getSavingsRecommendations_LIVE');
      return [];
    }
  }

  async getInsuranceRecommendations(): Promise<any[]> {
    const cached = this.readCache('insurance_recs', TTL_LONG_MS);
    if (cached !== null && cached !== undefined) return cached;

    const data = [
      {
        id: 'h3',
        company: 'HDFC ERGO',
        policy: 'Optima Secure',
        type: 'Health',
        premium: 22000,
        cover: 10000000,
        claimRatio: 98.0,
        rating: 4.5,
        bestFor: 'Premium seekers, high CSR coverage',
        tag: 'Top Recommended',
      },
      {
        id: 'l1',
        company: 'Max Life',
        policy: 'Smart Secure Plus',
        type: 'Life',
        premium: 12000,
        cover: 100000000,
        claimRatio: 99.5,
        rating: 4.6,
        bestFor: 'Highest CSR, family income protection',
        tag: 'Essential',
      },
      {
        id: 'h1',
        company: 'Niva Bupa',
        policy: 'Reassure 2.0',
        type: 'Health',
        premium: 14500,
        cover: 10000000,
        claimRatio: 91.0,
        rating: 4.3,
        bestFor: 'Young professionals, no room rent limit',
        tag: 'Value',
      },
      {
        id: 'l3',
        company: 'HDFC Life',
        policy: 'Click 2 Protect Super',
        type: 'Life',
        premium: 11000,
        cover: 100000000,
        claimRatio: 99.4,
        rating: 4.6,
        bestFor: 'Young professionals, high trust',
        tag: 'Popular',
      },
      {
        id: 'h5',
        company: 'ICICI Lombard',
        policy: 'Complete Health',
        type: 'Health',
        premium: 19000,
        cover: 10000000,
        claimRatio: 97.4,
        rating: 4.4,
        bestFor: 'Metro professionals, large network',
        tag: 'Network Choice',
      },
    ];

    this.updateCache('insurance_recs', data);
    return data;
  }

  async getMutualFundRecommendations(
    riskAppetite: string,
    rng: () => number = Math.random
  ): Promise<any[]> {
    const cacheKey = `mf_recs_${riskAppetite.toLowerCase()}`;
    const cached = this.readCache(cacheKey, TTL_LONG_MS);
    if (cached !== null && cached !== undefined) return cached;

    try {
      const allSchemes = await this._fetchSchemesList();
      const normalizedRisk = riskAppetite.toLowerCase().trim();

      let primaryKeyword = 'Flexi Cap';
      if (normalizedRisk === 'aggressive') primaryKeyword = 'Small Cap';
      if (normalizedRisk === 'conservative') primaryKeyword = 'Hybrid';

      const primaryPool = this._filterMF(allSchemes, primaryKeyword);
      const moderatePool = this._filterMF(allSchemes, 'Flexi Cap');
      const secondaryKeyword = normalizedRisk === 'aggressive' ? 'Hybrid' : 'Small Cap';
      const secondaryPool = this._filterMF(allSchemes, secondaryKeyword);

      const recommended: any[] = [];
      recommended.push(
        ...this._take(3, primaryPool, rng).map((f) => this._formatMF(f, normalizedRisk))
      );
      recommended.push(
        ...this._take(1, moderatePool, rng).map((f) => this._formatMF(f, 'moderate'))
      );
      recommended.push(
        ...this._take(1, secondaryPool, rng).map((f) =>
          this._formatMF(f, normalizedRisk === 'aggressive' ? 'conservative' : 'aggressive')
        )
      );

      this.updateCache(cacheKey, recommended);
      return recommended;
    } catch (e) {
      this.logErrorResilient(e, 'getMutualFundRecommendations_LIVE');
      return [];
    }
  }

  private async _fetchSchemesList(): Promise<any[]> {
    // 12-hour in-memory cache for the 2MB JSON
    const cached = this.readCache('mfapi_list', TTL_MFAPI_MS);
    if (cached) return cached;

    return await ResilienceUtils.retry({
      context: 'MFAPI_List_Fetch',
      initialDelayMs: process.env.NODE_ENV === 'test' ? 10 : 2000,
      task: async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
          const res = await fetch(MF_API_URL, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (!res.ok) throw new Error('MFAPI_DOWN');
          const data = await res.json();
          this.updateCache('mfapi_list', data, true);
          return data;
        } catch (err) {
          clearTimeout(timeoutId);
          throw err;
        }
      },
    });
  }

  private _filterMF(list: any[], keyword: string): any[] {
    return list.filter((f) => {
      const name = (f['schemeName'] ?? '').toString().toLowerCase();
      return (
        name.includes(keyword.toLowerCase()) &&
        name.includes('direct') &&
        name.includes('growth') &&
        !name.includes('regular')
      );
    });
  }

  private _formatMF(fund: any, type: string): any {
    const code = Math.floor(ResilienceUtils.safeDouble(fund['schemeCode']));
    const capitalizedType = type ? type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() : '';
    return {
      name: fund['schemeName'] ?? 'Unknown Fund',
      return: `${15 + (code % 25)}%`,
      rating: 4 + (code % 2),
      category: type.toUpperCase(),
      type: capitalizedType,
    };
  }

  private _take(count: number, list: any[], rng: () => number = Math.random): any[] {
    if (!list || list.length === 0) return [];
    // Durstenfeld / Fisher-Yates shuffle with injectable RNG
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, count);
  }

  // --- Weekly Logs ---

  async getWeeklyCurrent({
    month,
    year,
  }: { month?: number; year?: number } = {}): Promise<{ data: any }> {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) {
      throw new ApiException('Not logged in', 401);
    }

    const now = new Date();
    const targetMonth = month ?? now.getMonth() + 1;
    const targetYear = year ?? now.getFullYear();
    const cacheKey = `weekly_${userId}_${targetYear}_${targetMonth}`;

    const cached = this.readCache(cacheKey, TTL_SHORT_MS);
    if (cached !== null && cached !== undefined) {
      return { data: cached };
    }

    return this._dedupe(cacheKey, async () => {
      try {
        return await ResilienceUtils.retry({
          context: 'Get_Weekly_Logs',
          task: async () => {
            const currentUid = await this._getUserId();

            const { data: response, error } = await supabase
              .from('weekly_logs')
              .select()
              .eq('user_id', currentUid)
              .eq('log_month', targetMonth)
              .eq('log_year', targetYear)
              .order('week_index', { ascending: true });

            if (error) throw error;

            this.updateCache(cacheKey, response);
            return { data: response };
          },
        });
      } catch (e) {
        if (e instanceof ApiException) throw e;
        this.logErrorResilient(e, 'getWeeklyCurrent');
        throw new ApiException(ResilienceUtils.sanitizeErrorMessage(e), 500);
      }
    });
  }

  async updateWeeklyStatus({
    weekIndex,
    status,
    month,
    year,
    fixedStatus,
    flexibleStatus,
    savingsStatus,
    spentFixed = 0,
    spentFlexible = 0,
    spentSavings = 0,
  }: {
    weekIndex: number;
    status: string;
    month?: number;
    year?: number;
    fixedStatus?: string;
    flexibleStatus?: string;
    savingsStatus?: string;
    spentFixed?: number;
    spentFlexible?: number;
    spentSavings?: number;
  }): Promise<{ status: string }> {
    try {
      const userId = await this._getUserId();

      const now = new Date();
      const targetMonth = month ?? now.getMonth() + 1;
      const targetYear = year ?? now.getFullYear();

      const { error } = await supabase.from('weekly_logs').upsert(
        {
          user_id: userId,
          week_index: weekIndex,
          log_month: targetMonth,
          log_year: targetYear,
          status,
          fixed_status: fixedStatus,
          flexible_status: flexibleStatus,
          savings_status: savingsStatus,
          spent_fixed: spentFixed,
          spent_flexible: spentFlexible,
          spent_savings: spentSavings,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,week_index,log_month,log_year' }
      );

      if (error) throw error;

      // Cache Busting
      this.clearCache([`weekly_${userId}_${targetYear}_${targetMonth}`, `dashboard_${userId}`]);

      return { status: 'success' };
    } catch (e) {
      if (e instanceof ApiException) throw e;
      this.logErrorResilient(e, 'updateWeeklyStatus');
      throw new ApiException(ResilienceUtils.sanitizeErrorMessage(e), 500);
    }
  }

  // --- Corporate Service ---

  async getCorporateWorkforceStats(): Promise<Record<string, any>> {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    if (!user || !user.email) {
      throw new ApiException('Unauthorized Access', 401);
    }

    const userId = user.id;
    const cacheKey = `corp_stats_${userId}`;
    const cached = this.readCache(cacheKey, TTL_MEDIUM_MS);
    if (cached !== null && cached !== undefined) return cached;

    return this._dedupe(cacheKey, async () => {
      try {
        const normalizedEmail = user.email!.trim().toLowerCase();

        const { data: adminRes, error: adminError } = await supabase
          .from('corporate_admins')
          .select('company_name')
          .ilike('admin_email', normalizedEmail)
          .maybeSingle();

        if (adminError) throw adminError;
        if (!adminRes) {
          throw new ApiException('Account is not an Admin.', 403);
        }

        const companyName = adminRes.company_name;

        const [analyticsRes, intelRes] = await Promise.all([
          supabase
            .schema('core')
            .from('corporate_analytics')
            .select()
            .eq('company_name', companyName)
            .maybeSingle(),
          supabase
            .schema('core')
            .from('workforce_intelligence')
            .select()
            .eq('company_name', companyName)
            .maybeSingle(),
        ]);

        if (analyticsRes.error) throw analyticsRes.error;
        if (intelRes.error) throw intelRes.error;

        if (!analyticsRes.data) {
          return {
            company_name: companyName,
            avg_workforce_score: 0,
            total_headcount: 0,
          };
        }

        const mergedData = {
          ...analyticsRes.data,
          pillar_intel: intelRes.data ?? null,
        };

        this.updateCache(cacheKey, mergedData);
        return mergedData;
      } catch (e) {
        if (e instanceof ApiException) throw e;
        this.logErrorResilient(e, 'getCorporateWorkforceStats');
        throw new ApiException(ResilienceUtils.sanitizeErrorMessage(e), 500);
      }
    });
  }

  async getMarketSentiment(): Promise<Record<string, any>> {
    const cached = this.readCache('market_sentiment', TTL_MEDIUM_MS);
    if (cached !== null && cached !== undefined) return cached;

    try {
      const { data, error } = await supabase
        .from('market_sentiment')
        .select()
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      const res = data ?? {};
      if (data) {
        this.updateCache('market_sentiment', res);
      }
      return res;
    } catch (e) {
      this.logErrorResilient(e, 'getMarketSentiment');
      return {};
    }
  }

  async getFinanceNews(): Promise<any[]> {
    const cached = this.readCache('finance_news', TTL_LONG_MS);
    if (cached !== null && cached !== undefined) return cached;

    try {
      const { data, error } = await supabase
        .schema('bse_data')
        .from('finance_news')
        .select()
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      const result = data ?? [];
      this.updateCache('finance_news', result);
      return result;
    } catch (e) {
      this.logErrorResilient(e, 'getFinanceNews');
      return [];
    }
  }

  async getBlogs(): Promise<any[]> {
    const cached = this.readCache('blogs', TTL_LONG_MS);
    if (cached !== null && cached !== undefined) return cached;

    try {
      const { data, error } = await supabase
        .schema('bse_data')
        .from('blogs')
        .select()
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      const result = data ?? [];
      this.updateCache('blogs', result);
      return result;
    } catch (e) {
      this.logErrorResilient(e, 'getBlogs');
      return [];
    }
  }

  // --- Market Data ---

  async getGoldRate(forceRefresh = false): Promise<Record<string, any>> {
    const cacheKey = 'gold_rate';
    if (!forceRefresh) {
      const cached = this.readCache(cacheKey, 15 * 60 * 1000); // 15 mins
      if (cached !== null && cached !== undefined) return cached;
    }

    try {
      const { data, error } = await supabase
        .schema('bse_data')
        .from('live_metal_rates')
        .select('purity, price, updated_at');

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('EMPTY_DATA');
      }

      const rates: Record<string, any> = {};
      let gold24kPrice = 0;

      for (const row of data) {
        const purity = row.purity ?? '';
        const price = ResilienceUtils.safeDouble(row.price);
        rates[purity] = price;
        if (purity.includes('24K')) {
          gold24kPrice = price;
        }
      }

      rates['price'] = gold24kPrice * 10;
      rates['status'] = 'Live (IBJA)';
      rates['time'] = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      this.updateCache(cacheKey, rates);
      return rates;
    } catch (e) {
      const stale = this.readCache(cacheKey, Infinity);
      if (stale) {
        stale['status'] = 'Offline (Stale)';
        return stale;
      }
      return {
        '24K (999 Purity)': 0,
        price: 0,
        status: 'Unavailable',
        time: 'Sync Failed',
      };
    }
  }

  // --- Legacy Wrappers ---

  async submitOnboarding(data: Record<string, any>): Promise<{ status: string }> {
    return await this.updateMasterProfile(data);
  }

  async submitWeekly(d: Record<string, any>): Promise<{ status: string }> {
    return await this.updateWeeklyStatus({
      weekIndex: d['week_index'] ?? d['week_no'] ?? 0,
      month: d['month'],
      year: d['year'],
      status: d['status'] ?? 'PENDING',
      spentFixed: ResilienceUtils.safeDouble(d['spent_fixed'] ?? d['fixedSpend']),
      spentFlexible: ResilienceUtils.safeDouble(d['spent_flexible'] ?? d['flexSpend']),
      spentSavings: ResilienceUtils.safeDouble(d['spent_savings'] ?? d['savings']),
    });
  }

  async submitRedGreen(_d: Record<string, any>): Promise<{ status: string }> {
    try {
      const { data } = await supabase.auth.getSession();
      const userId = data?.session?.user?.id;
      if (userId) {
        this.clearCache([`dashboard_${userId}`]);
      }
    } catch {
      // ignore
    }
    return { status: 'success' };
  }

  // --- Web QR Login ---

  async loginWithQr(token: string): Promise<void> {
    try {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      const userId = session?.user?.id;
      if (!session || !userId) {
        throw new ApiException('Not Logged In', 401);
      }

      const { error } = await supabase.from('web_sessions').upsert(
        {
          session_token: token,
          user_id: userId,
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          status: 'AUTHENTICATED',
          authenticated_at: new Date().toISOString(),
        },
        { onConflict: 'session_token' }
      );

      if (error) throw error;
    } catch (e) {
      if (e instanceof ApiException) throw e;
      this.logErrorResilient(e, 'loginWithQr');
      throw new ApiException('Web Login Failed. Please try again.', 500);
    }
  }

  // --- Corporate Admin Helper (Preserved for Task 3/4) ---

  async getCorporateAdmin(email: string): Promise<CorporateAdminRecord | null> {
    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase
      .from('corporate_admins')
      .select('company_name')
      .ilike('admin_email', normalizedEmail)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  // --- Market & Screener Queries (Task 10) ---

  async getStockSignals(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .schema('bse_data')
        .from('stock_signals')
        .select()
        .order('score', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (e) {
      this.logErrorResilient(e, 'getStockSignals');
      return [];
    }
  }

  async getPickStocks(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .schema('bse_data')
        .from('stock_signals')
        .select()
        .gte('score', 70);

      if (error) throw error;
      return data || [];
    } catch (e) {
      this.logErrorResilient(e, 'getPickStocks');
      return [];
    }
  }

  async getMutualFundSignals(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .schema('bse_data')
        .from('mutual_fund_signals')
        .select()
        .order('final_score', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (e) {
      this.logErrorResilient(e, 'getMutualFundSignals');
      return [];
    }
  }

  async getInsurancePlans(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .schema('bse_data')
        .from('insurance_plans')
        .select()
        .order('smart_score', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (e) {
      this.logErrorResilient(e, 'getInsurancePlans');
      return [];
    }
  }

  async getNewsById(id: string, type: 'news' | 'blog'): Promise<any | null> {
    try {
      const tableName = type === 'blog' ? 'blogs' : 'finance_news';
      const { data, error } = await supabase
        .schema('bse_data')
        .from(tableName)
        .select()
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (e) {
      this.logErrorResilient(e, 'getNewsById');
      return null;
    }
  }
}

export const apiService = new ApiService();
