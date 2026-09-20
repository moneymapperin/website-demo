/**
 * Income Pillar Calculation Model & Formatter
 * 1:1 port of reference/moneymapper_app/lib/income_pillar.dart
 * 
 * NOTE: The income pillar score is computed client-side from the master profile,
 * differing from the server's core.financial_fitness_scores.income_pillar_score.
 * Omission: Next Year Income Forecast card is omitted as it uses a fabricated PRNG inflation rate.
 */

export interface IncomePillarData {
  activeIncome: number;
  passiveIncome: number;
  hasPassive: boolean;
  cityTier: 'metro' | 'tier2' | 'tier3';
  activeScore: number;
  passiveScore: number;
  finalPillarScore: number;
  totalIncome: number;
  passiveSharePct: number;
  activeSharePct: number;
  hasProfileData: boolean;
}

export const CITY_MIN_INCOME: Record<'metro' | 'tier2' | 'tier3', number> = {
  metro: 60000,
  tier2: 40000,
  tier3: 25000,
};

/**
 * Compact currency formatter matching income_pillar.dart:
 * - >= 100000 -> "₹{(value / 100000).toFixed(2)}L" (2-decimal L)
 * - >= 1000 -> "₹{(value / 1000).toFixed(1)}K" (1-decimal K)
 * - else -> "₹{Math.round(value)}"
 */
export function formatIncomeCompact(value: number): string {
  if (isNaN(value)) return 'not available';
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${Math.round(value)}`;
}

export function mapCityTier(rawTierInput?: string | null): 'metro' | 'tier2' | 'tier3' {
  if (!rawTierInput) return 'tier2';
  const rawTier = rawTierInput.toString().toLowerCase().trim();
  if (rawTier.includes('metro')) return 'metro';
  if (rawTier.includes('tier 3')) return 'tier3';
  return 'tier2';
}

export function calculateIncomePillar(profile?: Record<string, any> | null): IncomePillarData {
  const hasProfileData = profile !== null && profile !== undefined && Object.keys(profile).length > 0;

  const activeIncome = Number(profile?.monthlyActiveIncome ?? 0);
  const passiveIncome = Number(profile?.passiveIncomeAmount ?? 0);
  const hasPassive = profile?.hasPassiveIncome === true || profile?.hasPassiveIncome === 'true';
  const cityTier = mapCityTier(profile?.cityTier);

  // Benchmarks
  const cityMin = CITY_MIN_INCOME[cityTier] ?? 40000;

  // Active Income Score
  const activeScore = Math.min((activeIncome / cityMin) * 100, 100);

  // Passive Income Score (20% passive-to-active ratio = full marks)
  const passiveScore =
    hasPassive && activeIncome > 0
      ? Math.min((passiveIncome / activeIncome) * 500, 100)
      : 0;

  // Final Income Pillar Score (70% active + 30% passive)
  const finalPillarScore = Math.round(activeScore * 0.7 + passiveScore * 0.3);

  // Share percentages
  const totalIncome = activeIncome + passiveIncome;
  let passiveSharePct = 0;
  let activeSharePct = 0;
  if (totalIncome > 0) {
    passiveSharePct = (passiveIncome / totalIncome) * 100;
    activeSharePct = 100 - passiveSharePct;
  }

  return {
    activeIncome,
    passiveIncome,
    hasPassive,
    cityTier,
    activeScore,
    passiveScore,
    finalPillarScore,
    totalIncome,
    passiveSharePct,
    activeSharePct,
    hasProfileData,
  };
}
