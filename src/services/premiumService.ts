/**
 * Premium & Trial Management Service
 * Mirrors logic from reference/moneymapper_app/lib/services/premium_service.dart (lines 62-94)
 * 
 * WEB DEVIATION (Documented):
 * The Flutter app stores a device-local `first_login_timestamp` in SharedPreferences.
 * On web, we do NOT use localStorage for this paywall/trial anchor.
 * Instead, trial start is anchored on the Supabase user's `created_at` behind `getTrialStartMs(user)`,
 * preserving identical trial duration semantics while preventing trivial client-side localStorage wiping.
 */

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
