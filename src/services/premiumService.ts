/**
 * Premium & Trial Management Service
 * Mirrors logic from reference/moneymapper_app/lib/services/premium_service.dart
 */

import { apiService } from './apiService';
import { authService } from './authService';

export interface SupabaseUserIdentity {
  id?: string;
  created_at?: string;
  email?: string;
  user_metadata?: {
    plan?: string;
    [key: string]: any;
  };
}

/**
 * Returns the trial start timestamp in milliseconds.
 * Anchored to the user's `created_at` from Supabase Auth.
 * Fallback to Date.now() if user or created_at is missing.
 */
export function getTrialStartMs(user?: SupabaseUserIdentity | null): number {
  if (user?.created_at) {
    const parsed = new Date(user.created_at).getTime();
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return Date.now();
}

/**
 * Determines if premium/trial features are accessible.
 * Flutter semantics:
 * - If isPro -> true
 * - daysPassed = floor of whole days between now and trial start
 * - accessible while daysPassed < 7 (7-Day Free Trial)
 */
export function isFeatureAccessible(
  isPro: boolean,
  trialStartMs: number,
  nowMs: number = Date.now()
): boolean {
  if (isPro) return true;

  const msPassed = Math.max(0, nowMs - trialStartMs);
  const daysPassed = Math.floor(msPassed / (1000 * 60 * 60 * 24));
  return daysPassed < 7;
}

/**
 * Returns remaining trial days.
 * Flutter semantics:
 * - If isPro -> 365
 * - daysPassed = floor of whole days between now and trial start
 * - remaining = 7 - daysPassed
 * - returns remaining > 0 ? remaining : 0
 */
export function getTrialDaysRemaining(
  isPro: boolean,
  trialStartMs: number,
  nowMs: number = Date.now()
): number {
  if (isPro) return 365;

  const msPassed = Math.max(0, nowMs - trialStartMs);
  const daysPassed = Math.floor(msPassed / (1000 * 60 * 60 * 24));
  const remaining = 7 - daysPassed;
  return remaining > 0 ? remaining : 0;
}

/**
 * Port of Flutter isPro normalization:
 * - Checks contains('pro') || contains('paid') || contains('wealth select') || contains('enterprise gold')
 * - Or equals('moneymapper pro membership')
 */
export function isProPlan(planString?: string | null): boolean {
  if (!planString) return false;
  const normalized = planString.trim().toLowerCase();
  return (
    normalized.includes('pro') ||
    normalized.includes('paid') ||
    normalized.includes('wealth select') ||
    normalized.includes('enterprise gold') ||
    normalized === 'moneymapper pro membership'
  );
}

export class PremiumService {
  public static readonly proMembership = 'moneymapper pro membership';
  public static readonly freeMembership = 'moneymapper free membership';
  private static readonly _lastSyncKey = 'last_subscription_sync';
  private static readonly _syncThrottleMs = 5 * 60 * 1000; // 5 minutes
  private static readonly _errorBackoffMs = 60 * 1000; // 60 seconds backoff

  private _listeners: Array<() => void> = [];
  private _lastErrorMs: number = 0;
  private _lastSyncTime: number = 0;
  private _cachedPlan: string | null = null;
  private _activeSyncPromise: Promise<void> | null = null;

  constructor() {
    this._lastSyncTime = 0;
    if (typeof window !== 'undefined' && window.localStorage) {
      this._cachedPlan = localStorage.getItem('user_plan');
      try {
        localStorage.removeItem(PremiumService._lastSyncKey);
      } catch {}
    }
  }

  /**
   * Subscribe to plan updates. Returns an unsubscribe callback.
   */
  public subscribe(listener: () => void): () => void {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter((l) => l !== listener);
    };
  }

  private _notify(): void {
    this._listeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error('Error in PremiumService listener:', e);
      }
    });
  }

  public async setPlan(plan: string): Promise<void> {
    this._cachedPlan = plan;
    await authService.savePlan(plan);
    this._notify();
  }

  public async getUserPlan(): Promise<string | null> {
    if (this._cachedPlan !== null) return this._cachedPlan;
    const plan = await authService.getUserPlan();
    this._cachedPlan = plan;
    return plan;
  }

  public getCachedPlan(): string | null {
    if (this._cachedPlan !== null) return this._cachedPlan;
    if (typeof window !== 'undefined' && window.localStorage) {
      this._cachedPlan = localStorage.getItem('user_plan');
    }
    return this._cachedPlan;
  }

  public clearLocalPlan(): void {
    this._cachedPlan = null;
    this._lastErrorMs = 0;
    this._lastSyncTime = 0;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('user_plan');
      localStorage.removeItem(PremiumService._lastSyncKey);
    }
    this._notify();
  }

  /**
   * Syncs latest subscription status from Supabase (bse_data.user_subscriptions).
   * Updates lastSync time after every completed fetch (including null/free responses).
   * Applies 60s backoff on network failure without losing current plan.
   * Respects 5-minute throttle unless force=true.
   */
  public async syncSubscriptionStatus(force: boolean = false): Promise<void> {
    if (this._activeSyncPromise) {
      return this._activeSyncPromise;
    }

    const lastSync = this._getLastSyncTime();
    const now = Date.now();
    const isThrottled = !force && now - lastSync <= PremiumService._syncThrottleMs;
    const isInBackoff = !force && now - this._lastErrorMs <= PremiumService._errorBackoffMs;

    if (isThrottled || isInBackoff) {
      return;
    }

    this._activeSyncPromise = (async () => {
      try {
        const details = await apiService.getSubscriptionDetails();

        if (!details || !details.current_period_end) {
          await this.setPlan(PremiumService.freeMembership);
          this._setLastSyncTime(Date.now());
          return;
        }

        const rawPlan =
          details.tier ??
          details.plan ??
          (details.current_period_end && !('tier' in details) && !('plan' in details) ? PremiumService.proMembership : undefined);
        const hasProString = isProPlan(rawPlan);
        const expiry = new Date(details.current_period_end);
        const isUnexpired = !isNaN(expiry.getTime()) && expiry.getTime() > Date.now();

        if (hasProString && isUnexpired) {
          await this.setPlan(rawPlan || PremiumService.proMembership);
        } else {
          await this.setPlan(PremiumService.freeMembership);
        }

        this._setLastSyncTime(Date.now());
      } catch (e) {
        console.warn('Subscription sync failed:', e);
        // On network failure, do not update lastSync, but set 60s backoff
        this._lastErrorMs = Date.now();
      } finally {
        this._activeSyncPromise = null;
      }
    })();

    return this._activeSyncPromise;
  }

  /**
   * Manual refresh trigger point.
   * By default, force=true bypasses the 5-minute throttle so explicit user/UI actions
   * (e.g. clicking refresh or entering the Subscription page) immediately fetch from DB.
   */
  public async refreshPlan(force: boolean = true): Promise<void> {
    return this.syncSubscriptionStatus(force);
  }

  /**
   * Non-blocking isPro check mirroring Dart.
   * If > 5 minutes have elapsed since last completed sync and not in error backoff,
   * kicks off a fire-and-forget background syncSubscriptionStatus().
   * Always immediately returns synchronous calculation.
   */
  public isPro(): boolean {
    const lastSync = this._getLastSyncTime();
    const now = Date.now();

    const isThrottled = now - lastSync <= PremiumService._syncThrottleMs;
    const isInBackoff = now - this._lastErrorMs <= PremiumService._errorBackoffMs;
    const isSyncing = this._activeSyncPromise !== null;

    if (!isThrottled && !isInBackoff && !isSyncing) {
      // Fire-and-forget sync
      this.syncSubscriptionStatus(false).catch(() => {});
    }

    const plan = this.getCachedPlan();
    return isProPlan(plan);
  }

  public async isFeatureAccessible(user?: SupabaseUserIdentity | null): Promise<boolean> {
    if (this.isPro()) return true;
    const trialStart = getTrialStartMs(user);
    return isFeatureAccessible(false, trialStart);
  }

  public async getTrialDaysRemaining(user?: SupabaseUserIdentity | null): Promise<number> {
    if (this.isPro()) return 365;
    const trialStart = getTrialStartMs(user);
    return getTrialDaysRemaining(false, trialStart);
  }

  public getPlanStatus(): string {
    return this.isPro() ? 'PRO' : 'FREE';
  }

  private _getLastSyncTime(): number {
    return this._lastSyncTime;
  }

  private _setLastSyncTime(timeMs: number): void {
    this._lastSyncTime = timeMs;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(PremiumService._lastSyncKey, timeMs.toString());
      }
    } catch {
      // ignore
    }
  }

  public resetSyncTimesForTesting(): void {
    this._lastSyncTime = 0;
    this._lastErrorMs = 0;
    this._cachedPlan = null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(PremiumService._lastSyncKey);
        localStorage.removeItem('user_plan');
      }
    } catch {}
  }
}

export const premiumService = new PremiumService();
