/**
 * Insurance Pillar Calculation Model & Formatter
 * 1:1 port of reference/moneymapper_app/lib/insurance_dashboard.dart
 */

export interface InsurancePillarData {
  annualIncome: number;
  termCover: number;
  lifeCover: number;
  healthCover: number;
  lifeTarget: number;
  totalLifeCover: number;
  termGap: number;
  healthTarget: number;
  healthGap: number;
  protectionScore: number;
  termScore: number;
  healthScore: number;
  hasProfileData: boolean;
}

/**
 * Compact currency formatter matching insurance_dashboard.dart:
 * - >= 100000 -> "₹{(value / 100000).toFixed(1)}L"
 * - >= 1000 -> "₹{Math.round(value / 1000)}K"
 * - else -> "₹{Math.round(value)}"
 */
export function formatInsuranceCompact(value: number): string {
  if (isNaN(value)) return 'not available';
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${Math.round(value / 1000)}K`;
  return `₹${Math.round(value)}`;
}

export function calculateInsurancePillar(
  profile?: Record<string, any> | null,
  dashboard?: Record<string, any> | null
): InsurancePillarData {
  const protScores = dashboard?.protection_scores ?? {};
  const fitScores = dashboard?.financial_fitness_scores ?? {};

  const protectionScore = Number(fitScores.protection_pillar_score ?? 0);
  const termScore = Number(protScores.term_score ?? 0);
  const healthScore = Number(protScores.health_score ?? 0);

  const hasProfileData = profile !== null && profile !== undefined && Object.keys(profile).length > 0;

  const monthlyIncome = Number(profile?.monthlyActiveIncome ?? 0);
  const annualIncome = monthlyIncome * 12;

  const termCover = Number(profile?.termCover ?? 0);
  const lifeCover = Number(profile?.lifeCover ?? 0);
  const healthCover = Number(profile?.healthCover ?? 0);

  // Life & Term Gap: 15x Annual Income - Total Life/Term
  const lifeTarget = annualIncome * 15;
  const totalLifeCover = termCover + lifeCover;
  const termGap = Math.max(0, lifeTarget - totalLifeCover);

  // Health Gap: 10x Annual Income - Health Cover
  const healthTarget = annualIncome * 10;
  const healthGap = Math.max(0, healthTarget - healthCover);

  return {
    annualIncome,
    termCover,
    lifeCover,
    healthCover,
    lifeTarget,
    totalLifeCover,
    termGap,
    healthTarget,
    healthGap,
    protectionScore,
    termScore,
    healthScore,
    hasProfileData,
  };
}
