/**
 * Emergency Fund Pillar Calculation Model & Formatter
 * 1:1 port of reference/moneymapper_app/lib/emergency_fund.dart
 */

export interface EmergencyFundPillarData {
  savingsScore: number;
  readinessScore: number;
  efTarget: number;
  efCurrent: number;
  shortfall: number;
  progressPct: number;
  parkedLocation: string;
  yieldTag: string;
  hasProfileData: boolean;
}

/**
 * Compact currency formatter matching emergency_fund.dart:
 * - >= 10000000 -> "₹{(value / 10000000).toFixed(2)}Cr"
 * - >= 100000 -> "₹{(value / 100000).toFixed(2)}L"
 * - >= 1000 -> "₹{Math.round(value / 1000)}K"
 * - else -> "₹{Math.round(value)}"
 */
export function formatEmergencyCompact(value: number): string {
  if (isNaN(value)) return 'not available';
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `₹${Math.round(value / 1000)}K`;
  return `₹${Math.round(value)}`;
}

/**
 * Yield tag mapper checking in exact required order:
 * 1. contains 'savings' -> '~3.0% Annual Yield'
 * 2. 'fd' or 'fixed deposit' -> '~5.0% - 6.5% Annual Yield'
 * 3. 'liquid' -> '~6.5% - 7.0% Annual Yield'
 * 4. 'cash' -> '0.0% (No Yield)'
 * 5. else -> '~3.5% Estimated Yield'
 */
export function getParkedYieldTag(location: string): string {
  const loc = location.toLowerCase().trim();
  if (loc.includes('savings')) {
    return '~3.0% Annual Yield';
  } else if (loc.includes('fd') || loc.includes('fixed deposit')) {
    return '~5.0% - 6.5% Annual Yield';
  } else if (loc.includes('liquid')) {
    return '~6.5% - 7.0% Annual Yield';
  } else if (loc.includes('cash')) {
    return '0.0% (No Yield)';
  } else {
    return '~3.5% Estimated Yield';
  }
}

/**
 * Growth badge percentage:
 * In-session only: hidden when prev <= 0 or current === prev.
 */
export function calculateSessionGrowthPct(current: number, prev: number): number | null {
  if (prev <= 0 || current === prev) return null;
  return ((current - prev) / prev) * 100;
}

export function calculateEmergencyFundPillar(
  profile?: Record<string, any> | null,
  dashboard?: Record<string, any> | null
): EmergencyFundPillarData {
  const savScores = dashboard?.savings_scores ?? {};
  const fitScores = dashboard?.financial_fitness_scores ?? {};

  const hasProfileData = profile !== null && profile !== undefined && Object.keys(profile).length > 0;

  const savingsScore = Number(fitScores.savings_pillar_score ?? 0);
  const readinessScore = savingsScore;
  const efTarget = Number(savScores.ef_target_amount ?? 0);

  const rawEfCurrent = profile?.emergencyFundCurrent !== undefined && profile?.emergencyFundCurrent !== null
    ? profile.emergencyFundCurrent
    : savScores.ef_current_estimated;
  const efCurrent = Number(rawEfCurrent ?? 0);

  const shortfall = Math.max(0, efTarget - efCurrent);
  const progressPct = efTarget > 0 ? (efCurrent / efTarget) * 100 : 0;

  const parkedLocation = profile?.emergencyFundParked?.toString() || profile?.emergencyFundLocation?.toString() || 'Not Set';
  const yieldTag = getParkedYieldTag(parkedLocation);

  return {
    savingsScore,
    readinessScore,
    efTarget,
    efCurrent,
    shortfall,
    progressPct,
    parkedLocation,
    yieldTag,
    hasProfileData,
  };
}
