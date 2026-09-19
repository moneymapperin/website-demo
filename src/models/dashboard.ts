import { ResilienceUtils } from '../services/resilienceUtils';
import { gamificationStore } from '../services/gamificationStore';

export interface PillarData {
  score: number;
  factors?: Record<string, any>;
}

export interface DashboardSummary {
  strongestPillar: string;
  strongestScore: number;
  weakestPillar: string;
  weakestScore: number;
  finTip: string;
}

export interface FitnessBand {
  tag: string;
  emoji: string;
}

export interface DashboardDataProps {
  fitnessScore: number;
  fitnessBand?: FitnessBand;
  pillars: Record<string, PillarData>;
  summary: DashboardSummary;
  userName?: string;
  hasFinancialData?: boolean;
}

export class DashboardData {
  public readonly fitnessScore: number;
  public readonly fitnessBand?: FitnessBand;
  public readonly pillars: Record<string, PillarData>;
  public readonly summary: DashboardSummary;
  public readonly userName?: string;
  public readonly hasFinancialData: boolean;

  constructor({
    fitnessScore,
    fitnessBand,
    pillars,
    summary,
    userName,
    hasFinancialData = true,
  }: DashboardDataProps) {
    this.fitnessScore = fitnessScore;
    this.fitnessBand = fitnessBand;
    this.pillars = pillars;
    this.summary = summary;
    this.userName = userName;
    this.hasFinancialData = hasFinancialData;
  }

  static fromCoreSchema(
    coreData: Record<string, any>,
    localExpenseScoreOverride?: number | null
  ): DashboardData {
    const fitness = coreData?.financial_fitness_scores ?? {};
    const income = coreData?.income_scores ?? {};
    const expense = coreData?.expense_scores ?? {};
    const savings = coreData?.savings_scores ?? {};
    const protection = coreData?.protection_scores ?? {};
    const investment = coreData?.investment_scores ?? {};

    let fitnessScore = ResilienceUtils.safeDouble(fitness['global_fitness_score']);

    // Exact insertion order is critical: income, expenses, emergency, protection, investment
    const pillars: Record<string, PillarData> = {
      income: {
        score: ResilienceUtils.safeDouble(fitness['income_pillar_score']),
        factors: {
          active_income_score: ResilienceUtils.safeDouble(income['active_income_score']),
          passive_income_score: ResilienceUtils.safeDouble(income['passive_income_score']),
        },
      },
      expenses: {
        score: ResilienceUtils.safeDouble(fitness['expense_pillar_score']),
        factors: {
          savings_score: ResilienceUtils.safeDouble(expense['savings_score']),
          flexible_score: ResilienceUtils.safeDouble(expense['flexible_score']),
          fixed_score: ResilienceUtils.safeDouble(expense['fixed_score']),
          discipline_message: expense['discipline_message'] ?? null,
        },
      },
      emergency: {
        score: ResilienceUtils.safeDouble(fitness['savings_pillar_score']),
        factors: {
          ef_target_amount: ResilienceUtils.safeDouble(savings['ef_target_amount']),
          ef_current_estimated: ResilienceUtils.safeDouble(savings['ef_current_estimated']),
        },
      },
      protection: {
        score: ResilienceUtils.safeDouble(fitness['protection_pillar_score']),
        factors: {
          term_score: ResilienceUtils.safeDouble(protection['term_score']),
          health_score: ResilienceUtils.safeDouble(protection['health_score']),
          term_gap: ResilienceUtils.safeDouble(protection['term_gap']),
          health_gap: ResilienceUtils.safeDouble(protection['health_gap']),
        },
      },
      investment: {
        score: ResilienceUtils.safeDouble(fitness['investment_pillar_score']),
        factors: {
          equity_score: ResilienceUtils.safeDouble(investment['equity_score']),
          asset_balance_score: ResilienceUtils.safeDouble(investment['asset_balance_score']),
          sip_score: ResilienceUtils.safeDouble(investment['sip_score']),
          sip_gap: ResilienceUtils.safeDouble(investment['sip_gap']),
        },
      },
    };

    // Stable sort by score preserves insertion order for tie-breaking
    const sortedPillars = Object.entries(pillars).sort(
      ([, a], [, b]) => a.score - b.score
    );

    const weakest = sortedPillars[0];
    const strongest = sortedPillars[sortedPillars.length - 1];

    const finTip =
      expense['discipline_message'] || 'Keep tracking your expenses daily.';

    // Apply Device-Local Expense Score Override (Flutter dashboard_screen.dart lines 284-306)
    const effectiveOverride =
      localExpenseScoreOverride !== undefined
        ? localExpenseScoreOverride
        : gamificationStore.getLocalExpenseScore();

    if (effectiveOverride !== null && effectiveOverride !== undefined && !isNaN(effectiveOverride)) {
      pillars.expenses = {
        score: effectiveOverride,
        factors: pillars.expenses?.factors,
      };

      // Recalculate global fitness score as average of 5 pillars
      const totalScore =
        pillars.income.score +
        pillars.expenses.score +
        pillars.emergency.score +
        pillars.protection.score +
        pillars.investment.score;
      fitnessScore = totalScore / 5;
    }

    return new DashboardData({
      fitnessScore,
      fitnessBand: DashboardData.getBand(fitnessScore),
      pillars,
      summary: {
        strongestPillar: strongest[0],
        strongestScore: strongest[1].score,
        weakestPillar: weakest[0],
        weakestScore: weakest[1].score,
        finTip,
      },
      hasFinancialData: true,
    });
  }

  static getBand(score: number): FitnessBand {
    if (score >= 80) return { tag: 'Excellent', emoji: '💎' };
    if (score >= 60) return { tag: 'Good', emoji: '✅' };
    if (score >= 40) return { tag: 'Average', emoji: '😐' };
    return { tag: 'Critical', emoji: '⚠️' };
  }

  get bandLabel(): string {
    return this.fitnessBand?.tag ?? 'Score';
  }

  get bandEmoji(): string {
    return this.fitnessBand?.emoji ?? '';
  }
}
