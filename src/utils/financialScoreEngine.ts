/**
 * Financial Fitness Scoring Engine
 * Ported from MoneyMapper engine and Supabase core analytics schema (stg_to_core.sql & DashboardData).
 * Computes scores across 5 pillars (Investment, Protection, Emergency, Income, Expenses),
 * global fitness score, and fitness band with thresholds.
 */

export interface FinancialScoreInput {
  fullName: string;
  email: string;
  mobile: string;
  monthly_income: string | number;
  fixed_expenses: string | number;
  total_emi: string | number;
  flexible_expenses: string | number;
  total_investment: string | number;
  equity_pct: string | number;
  debt_pct: string | number;
  gold_pct: string | number;
  emergency_fund: string | number;
  term_cover: string | number;
  health_cover: string | number;
  investment_horizon?: string;
}

export interface FitnessBand {
  tag: 'Excellent' | 'Good' | 'Average' | 'Critical';
  emoji: string;
  badgeBg: string;
  badgeText: string;
  scoreColor: string;
}

export interface PillarScore {
  key: 'investment' | 'protection' | 'emergency' | 'income' | 'expenses';
  name: string;
  score: number;
  subtitle: string;
  accentColor: string;
  emoji: string;
  status: string;
}

export interface FinancialFitnessResult {
  fitnessScore: number;
  fitnessBand: FitnessBand;
  advice: string;
  ptsDiff: number;
  netPosition: number;
  pillars: {
    investment: PillarScore;
    protection: PillarScore;
    emergency: PillarScore;
    income: PillarScore;
    expenses: PillarScore;
  };
  pillarList: PillarScore[];
}

/**
 * Returns band and emoji based on global fitness score (matches DashboardData.getBand).
 * >= 80: Excellent 💎
 * >= 60: Good ✅
 * >= 40: Average 😐
 * < 40: Critical ⚠️
 */
export function getBand(score: number): FitnessBand {
  if (score >= 80) {
    return {
      tag: 'Excellent',
      emoji: '💎',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-950/40',
      badgeText: 'text-emerald-800 dark:text-emerald-300',
      scoreColor: '#10B981',
    };
  }
  if (score >= 60) {
    return {
      tag: 'Good',
      emoji: '✅',
      badgeBg: 'bg-blue-100 dark:bg-blue-950/40',
      badgeText: 'text-blue-800 dark:text-blue-300',
      scoreColor: '#3B82F6',
    };
  }
  if (score >= 40) {
    return {
      tag: 'Average',
      emoji: '😐',
      badgeBg: 'bg-amber-100 dark:bg-amber-950/40',
      badgeText: 'text-amber-800 dark:text-amber-300',
      scoreColor: '#F59E0B',
    };
  }
  return {
    tag: 'Critical',
    emoji: '⚠️',
    badgeBg: 'bg-red-100 dark:bg-red-950/40',
    badgeText: 'text-red-800 dark:text-red-300',
    scoreColor: '#EF4444',
  };
}

function parseNum(val: string | number | undefined, defaultVal = 0): number {
  if (val === undefined || val === null) return defaultVal;
  if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
  const cleaned = val.replace(/[^0-9.-]+/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? defaultVal : parsed;
}

export interface IncomeScoreResult {
  cityMin: number;
  activeScore: number;
  passiveScore: number;
  finalScore: number;
  stabilityStatus: 'Green' | 'Yellow' | 'Red';
  stabilityText: string;
  stabilityColor: string;
}

/**
 * Calculates the Teaser Income Score and EMI Stability Status
 * Ported 1:1 from Supabase public.leads_analysis view (onboarding_leads.sql)
 * and Flutter teaser_income_dashboard.dart
 */
export function calculateIncomeScore(data: {
  monthly_income: string | number;
  city_tier: string;
  has_passive_income: boolean;
  passive_income_amount: string | number;
  total_loan_emi: string | number;
}): IncomeScoreResult {
  const income = Math.max(0, parseNum(data.monthly_income, 0));
  const loanEmi = Math.max(0, parseNum(data.total_loan_emi, 0));
  const passiveAmt = Math.max(0, parseNum(data.passive_income_amount, 0));
  const tier = (data.city_tier || 'Metro').toLowerCase();

  // 1. City minimum requirement (Metro: 60k, Tier 2: 40k, Tier 3: 25k)
  let cityMin = 25000;
  if (tier.includes('metro')) {
    cityMin = 60000;
  } else if (tier.includes('tier 2') || tier.includes('tier2')) {
    cityMin = 40000;
  }

  // 2. Active income score: LEAST((monthly_income / city_min) * 100, 100)
  const activeScore = cityMin > 0 ? Math.min((income / cityMin) * 100, 100) : 0;

  // 3. Passive income score: CASE WHEN has_passive_income THEN LEAST((passive_income_amount / monthly_income) * 500, 100) ELSE 0 END
  const passiveScore =
    data.has_passive_income && income > 0
      ? Math.min((passiveAmt / income) * 500, 100)
      : 0;

  // 4. Final blended score: ROUND(activeScore * 0.7 + passiveScore * 0.3)
  const finalScore = Math.round(activeScore * 0.7 + passiveScore * 0.3);

  // 5. Stability Score (EMI / Income Ratio)
  let stabilityStatus: 'Green' | 'Yellow' | 'Red' = 'Green';
  let stabilityText = 'Healthy EMI Ratio';
  let stabilityColor = '#10B981';

  if (income <= 0) {
    stabilityStatus = 'Red';
    stabilityText = 'Critical Debt Level';
    stabilityColor = '#EF4444';
  } else {
    const emiRatioPct = (loanEmi / income) * 100;
    if (emiRatioPct >= 60) {
      stabilityStatus = 'Red';
      stabilityText = 'Critical Debt Level';
      stabilityColor = '#EF4444';
    } else if (emiRatioPct >= 40) {
      stabilityStatus = 'Yellow';
      stabilityText = 'High EMI Burden';
      stabilityColor = '#F59E0B';
    } else {
      stabilityStatus = 'Green';
      stabilityText = 'Healthy EMI Ratio';
      stabilityColor = '#10B981';
    }
  }

  return {
    cityMin,
    activeScore: Math.round(activeScore),
    passiveScore: Math.round(passiveScore),
    finalScore: Math.max(1, finalScore),
    stabilityStatus,
    stabilityText,
    stabilityColor,
  };
}

export function formatCompactCurrency(amount: number): string {
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    const l = amount / 100000;
    return `₹${l % 1 === 0 ? l.toFixed(0) : l.toFixed(1)} L`;
  }
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

/**
 * Calculates financial fitness and individual pillar scores using the MoneyMapper core engine rules.
 */
export function calculateFinancialFitness(data: FinancialScoreInput): FinancialFitnessResult {
  const monthlyIncome = Math.max(0, parseNum(data.monthly_income, 0));
  const fixedExp = Math.max(0, parseNum(data.fixed_expenses, 0));
  const loanEmi = Math.max(0, parseNum(data.total_emi, 0));
  const flexExpRaw = parseNum(data.flexible_expenses, 0);
  
  // If flexible expenses omitted, approximate reasonable discretionary buffer
  const flexExp = flexExpRaw > 0 ? flexExpRaw : Math.max(0, (monthlyIncome - fixedExp - loanEmi) * 0.4);
  const totalInvestment = Math.max(0, parseNum(data.total_investment, 0));
  
  const equityPct = parseNum(data.equity_pct, 60);
  const debtPct = parseNum(data.debt_pct, 30);
  const goldPct = parseNum(data.gold_pct, 10);

  const emergencyFund = Math.max(0, parseNum(data.emergency_fund, 0));
  const termCover = Math.max(0, parseNum(data.term_cover, 0));
  const healthCover = Math.max(0, parseNum(data.health_cover, 0));

  // 1. INCOME PILLAR
  // In stg_to_core.sql: Tier 2 benchmark = 40,000, Metro = 60,000
  const cityBenchmark = 40000;
  const incActiveScr = cityBenchmark > 0 ? Math.min((monthlyIncome / cityBenchmark) * 100, 100) : 0;
  const incomeScore = Math.round(Math.min(100, Math.max(10, incActiveScr)));

  // 2. EXPENSE PILLAR (50/30/20 Budgeting Rule from stg_to_core.sql)
  // v_wk_inc := v_income / 4.33; v_wk_fixed := (v_fixed_exp + v_loan_emi) / 4.33; v_wk_flex := v_flex_exp / 4.33;
  const totalFixedExpenses = fixedExp + loanEmi;
  const monthlySavings = Math.max(0, monthlyIncome - totalFixedExpenses - flexExp);

  const savPct = monthlyIncome > 0 ? monthlySavings / monthlyIncome : 0;
  const flexPct = monthlyIncome > 0 ? flexExp / monthlyIncome : 0;
  const fixedPct = monthlyIncome > 0 ? totalFixedExpenses / monthlyIncome : 1;

  let expSavScr = 5;
  if (savPct >= 0.20) expSavScr = 45;
  else if (savPct >= 0.15) expSavScr = 30;
  else if (savPct >= 0.10) expSavScr = 15;

  let expFlexScr = 10;
  if (flexPct <= 0.30) expFlexScr = 35;
  else if (flexPct <= 0.35) expFlexScr = 20;

  let expFixedScr = 5;
  if (fixedPct <= 0.50) expFixedScr = 20;
  else if (fixedPct <= 0.60) expFixedScr = 10;

  const expenseScore = Math.min(100, Math.round(expSavScr + expFlexScr + expFixedScr));

  // 3. EMERGENCY SAVINGS PILLAR (Target: 6 months of monthly income)
  const efTarget = Math.max(60000, monthlyIncome * 6);
  const emergencyScore = Math.min(100, Math.round((emergencyFund / efTarget) * 100));

  // 4. PROTECTION PILLAR (Term = 15x annual income, Health = 5x annual income, min 5L)
  const termTarget = Math.max(3000000, monthlyIncome * 12 * 15);
  const healthTarget = Math.max(500000, monthlyIncome * 12 * 5);
  const termScore = termTarget > 0 ? Math.min((termCover / termTarget) * 100, 100) : 0;
  const healthScore = healthTarget > 0 ? Math.min((healthCover / healthTarget) * 100, 100) : 0;
  const protectionScore = Math.min(100, Math.round((termScore + healthScore) / 2));

  // 5. INVESTMENT PILLAR
  // Asset Allocation balance (Equity 40-55%, Debt 15-30%, Gold 5-10%)
  const eqRatio = equityPct / 100;
  const dtRatio = debtPct / 100;
  const gdRatio = goldPct / 100;

  let eqScr = 0;
  if (eqRatio >= 0.40 && eqRatio <= 0.55) eqScr = 100;
  else if (eqRatio < 0.40) eqScr = (eqRatio / 0.40) * 100;
  else eqScr = eqRatio > 0 ? (0.55 / eqRatio) * 100 : 0;

  let dtScr = 0;
  if (dtRatio >= 0.15 && dtRatio <= 0.30) dtScr = 100;
  else if (dtRatio < 0.15) dtScr = (dtRatio / 0.15) * 100;
  else dtScr = dtRatio > 0 ? (0.30 / dtRatio) * 100 : 0;

  let gdScr = 0;
  if (gdRatio >= 0.05 && gdRatio <= 0.10) gdScr = 100;
  else if (gdRatio < 0.05) gdScr = (gdRatio / 0.05) * 100;
  else gdScr = gdRatio > 0 ? (0.10 / gdRatio) * 100 : 0;

  const assetBalScr = Math.round((eqScr + dtScr + gdScr) / 3);

  // Portfolio buildup adequacy relative to 6 months income
  const invAdequacyTarget = Math.max(100000, monthlyIncome * 6);
  const invSizeScr = Math.min((totalInvestment / invAdequacyTarget) * 100, 100);

  const investmentScore = totalInvestment > 0
    ? Math.min(100, Math.round(assetBalScr * 0.6 + invSizeScr * 0.4))
    : 0;

  // GLOBAL SCORE (Average of 5 pillars matching core.financial_fitness_scores)
  const fitnessScore = Math.min(
    100,
    Math.max(
      0,
      Math.round((investmentScore + protectionScore + emergencyScore + incomeScore + expenseScore) / 5)
    )
  );

  const fitnessBand = getBand(fitnessScore);

  // Short actionable advice
  let advice = "You're on track. Focus on investing more and building your emergency fund.";
  if (fitnessScore >= 80) {
    advice = "Outstanding financial discipline! Maintain your portfolio balance and regular investments.";
  } else if (fitnessScore >= 60) {
    advice = "Solid financial foundation. Increase high-yield investments to reach top fitness.";
  } else if (fitnessScore < 40) {
    advice = "High stress risk detected. Prioritize building emergency reserves and lowering fixed EMI costs.";
  }

  // Net position = Total Investments + Emergency Fund - Active Loan EMI proxy
  const estimatedDebt = loanEmi * 24; // proxy remaining liability
  const netPosition = Math.max(0, totalInvestment + emergencyFund - estimatedDebt);

  const pillars: FinancialFitnessResult['pillars'] = {
    investment: {
      key: 'investment',
      name: 'Investment',
      score: investmentScore,
      subtitle: `${formatCompactCurrency(totalInvestment)} invested (${equityPct}% Eq / ${debtPct}% Debt)`,
      accentColor: '#F59E0B',
      emoji: '📈',
      status: investmentScore >= 60 ? 'Strong Growth' : 'Underinvested',
    },
    protection: {
      key: 'protection',
      name: 'Protection',
      score: protectionScore,
      subtitle: `Term: ${formatCompactCurrency(termCover)} • Health: ${formatCompactCurrency(healthCover)}`,
      accentColor: '#A855F7',
      emoji: '🛡️',
      status: protectionScore >= 60 ? 'Well Insured' : 'Coverage Gap',
    },
    emergency: {
      key: 'emergency',
      name: 'Emergency',
      score: emergencyScore,
      subtitle: `${formatCompactCurrency(emergencyFund)} of ${formatCompactCurrency(efTarget)} (6 mo)`,
      accentColor: '#3B82F6',
      emoji: '🏦',
      status: emergencyScore >= 60 ? 'Safe Buffer' : 'Low Reserve',
    },
    income: {
      key: 'income',
      name: 'Income',
      score: incomeScore,
      subtitle: `${formatCompactCurrency(monthlyIncome)} / month active cash flow`,
      accentColor: '#10B981',
      emoji: '💰',
      status: incomeScore >= 60 ? 'Stable Inflow' : 'Needs Expansion',
    },
    expenses: {
      key: 'expenses',
      name: 'Expenses',
      score: expenseScore,
      subtitle: `Fixed: ${(fixedPct * 100).toFixed(0)}% • Savings: ${(savPct * 100).toFixed(0)}%`,
      accentColor: '#EF4444',
      emoji: '💳',
      status: expenseScore >= 60 ? 'Disciplined' : 'High Outflows',
    },
  };

  const pillarList: PillarScore[] = [
    pillars.investment,
    pillars.protection,
    pillars.emergency,
    pillars.income,
    pillars.expenses,
  ];

  return {
    fitnessScore,
    fitnessBand,
    advice,
    ptsDiff: 12, // Standard visual benchmark chip matching Flutter mockup
    netPosition,
    pillars,
    pillarList,
  };
}

