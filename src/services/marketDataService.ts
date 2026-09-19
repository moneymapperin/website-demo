import { supabase } from '../lib/supabase';
import { ResilienceUtils } from './resilienceUtils';

export interface GoldRateData {
  [purity: string]: any;
  price: number;
  time: string;
  status: string;
  updated_at?: string;
}

export class MarketDataService {
  private static readonly CACHE_KEY_RATES = 'metal_rates_cached_v1';
  private static readonly CACHE_KEY_LAST_FETCH = 'gold_last_fetch_ts_resilient_v1';
  private static readonly CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

  /**
   * Fetches Metal Rates from Supabase with Caching (15 min TTL).
   * Ported 1:1 from market_data_service.dart.
   */
  async getGoldRate({ forceRefresh = false }: { forceRefresh?: boolean } = {}): Promise<GoldRateData> {
    // 1. Cache Check (15 mins for better live feel)
    if (!forceRefresh) {
      const cached = this.readCache();
      if (cached) return cached;
    }

    // 2. Fetch from Supabase
    try {
      const { data, error } = await supabase
        .schema('bse_data')
        .from('live_metal_rates')
        .select();

      if (error || !data || (Array.isArray(data) && data.length === 0)) {
        throw new Error(error?.message || 'EMPTY_DATA');
      }

      const rates: GoldRateData = {
        price: 0,
        time: '',
        status: 'Live (IBJA)',
      };
      let gold24kPrice = 0;
      let newestUpdatedAt: string | undefined = undefined;

      for (const row of data as any[]) {
        const purity = row.purity ?? '';
        const price = ResilienceUtils.safeDouble(row.price);
        rates[purity] = price;

        if (purity.includes('24K')) {
          gold24kPrice = price;
        }

        if (row.updated_at) {
          if (!newestUpdatedAt || new Date(row.updated_at) > new Date(newestUpdatedAt)) {
            newestUpdatedAt = row.updated_at;
          }
        }
      }

      // Backward compatibility for ticker (24K 10g)
      rates.price = gold24kPrice * 10;
      rates.time = this.formatTime(new Date());
      rates.status = 'Live (IBJA)';
      if (newestUpdatedAt) {
        rates.updated_at = newestUpdatedAt;
      }

      this.updateCache(rates);
      return rates;
    } catch (_e) {
      // 3. Fallback to Stale Cache
      const stale = this.readCache(true);
      if (stale) {
        stale.status = 'Offline (Stale)';
        return stale;
      }
      return {
        price: 0.0,
        status: 'Unavailable',
        time: 'Sync Failed',
      };
    }
  }

  private readCache(force = false): GoldRateData | null {
    try {
      const lastFetchStr = localStorage.getItem(MarketDataService.CACHE_KEY_LAST_FETCH);
      const cachedDataStr = localStorage.getItem(MarketDataService.CACHE_KEY_RATES);

      if (!lastFetchStr || !cachedDataStr) return null;

      const lastFetch = new Date(lastFetchStr).getTime();
      const now = Date.now();

      if (force || now - lastFetch < MarketDataService.CACHE_TTL_MS) {
        return JSON.parse(cachedDataStr);
      }
      return null;
    } catch {
      return null;
    }
  }

  private updateCache(rates: GoldRateData): void {
    try {
      localStorage.setItem(MarketDataService.CACHE_KEY_RATES, JSON.stringify(rates));
      localStorage.setItem(MarketDataService.CACHE_KEY_LAST_FETCH, new Date().toISOString());
    } catch {
      // storage quota or disabled
    }
  }

  private formatTime(date: Date): string {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 becomes 12
    const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const hrStr = hours < 10 ? `0${hours}` : `${hours}`;
    return `${hrStr}:${minStr} ${ampm}`;
  }
}

export const marketDataService = new MarketDataService();
