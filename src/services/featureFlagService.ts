import { supabase } from '../lib/supabase';

export type FeatureKey =
  | 'stock_screener'
  | 'mutual_funds'
  | 'insurance'
  | 'ai_assistant'
  | 'gold_rates'
  | 'income_pillar'
  | 'emergency_fund'
  | 'savings_recs'
  | 'weekly_expense';

export class FeatureFlagService {
  private static instance: FeatureFlagService;
  private flags: Record<string, boolean> = {};
  private _isInitialized = false;

  private constructor() {}

  public static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }

  get isInitialized(): boolean {
    return this._isInitialized;
  }

  async fetchFlags(): Promise<Record<string, boolean>> {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('feature_key, is_enabled');

      if (error) {
        console.warn('Failed to fetch feature flags:', error.message || error);
        return { ...this.flags };
      }

      if (Array.isArray(data)) {
        const newFlags: Record<string, boolean> = {};
        for (const item of data) {
          if (item && item.feature_key) {
            newFlags[item.feature_key] = Boolean(item.is_enabled);
          }
        }
        this.flags = newFlags;
        this._isInitialized = true;
      }
    } catch (err) {
      console.warn('Failed to fetch feature flags:', err);
    }

    return { ...this.flags };
  }

  isEnabled(key: FeatureKey | string): boolean {
    // Missing key or not fetched yet defaults to TRUE so app does not break
    return this.flags[key] ?? true;
  }

  getAllFlags(): Record<string, boolean> {
    return { ...this.flags };
  }
}

export const featureFlagService = FeatureFlagService.getInstance();
export const fetchFlags = () => featureFlagService.fetchFlags();
export const isEnabled = (key: FeatureKey | string) => featureFlagService.isEnabled(key);

export default featureFlagService;
