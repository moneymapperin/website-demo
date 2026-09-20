/**
 * Investment / Mutual Fund Pillar Calculation Model
 * 1:1 port of reference/moneymapper_app/lib/mutual_fund.dart
 */

export interface InvestmentPillarData {
  investmentScore: number;
  assetBalanceScore: number;
  sipScore: number;
  totalInvested: number;
  sipGap: number;
  equity: number;
  debt: number;
  gold: number;
  realEstate: number;
  sipEquity: number;
  sipDebt: number;
  sipGold: number;
  monthlySipTotal: number;
  stockSips: any[];
  mfSips: any[];
  goldSips: any[];
  riskAppetite: string;
  idealSip: number;
  sipProgress: number;
  hasProfileData: boolean;
}

export function formatInr(value: number): string {
  if (isNaN(value)) return 'not available';
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

export function calculateInvestmentPillar(
  profile?: Record<string, any> | null,
  dashboard?: Record<string, any> | null
): InvestmentPillarData {
  const invScores = dashboard?.investment_scores ?? {};
  const fitScores = dashboard?.financial_fitness_scores ?? {};

  const hasProfileData = profile !== null && profile !== undefined && Object.keys(profile).length > 0;

  const investmentScore = Number(fitScores.investment_pillar_score ?? 0);
  const assetBalanceScore = Number(invScores.asset_balance_score ?? 0);
  const sipScore = Number(invScores.sip_score ?? 0);
  const sipGap = Number(invScores.sip_gap ?? 0);

  const equity = Number(profile?.totalEquityInvestments ?? 0);
  const debt = Number(profile?.totalDebtInvestments ?? 0);
  const gold = Number(profile?.totalGoldInvestments ?? 0);
  const realEstate = Number(profile?.totalRealEstateInvestments ?? 0);

  const totalInvested =
    invScores.total_investment_amount !== undefined && invScores.total_investment_amount !== null
      ? Number(invScores.total_investment_amount)
      : equity + debt + gold + realEstate;

  const sipEquity = Number(profile?.monthlySipEquity ?? 0);
  const sipDebt = Number(profile?.monthlySipDebt ?? 0);
  const sipGold = Number(profile?.monthlySipGold ?? 0);

  const monthlySipTotal = sipEquity + sipDebt + sipGold;
  const idealSip = monthlySipTotal + sipGap;
  const sipProgress = idealSip > 0 ? monthlySipTotal / idealSip : 0;

  const stockSips = Array.isArray(profile?.stockSips) ? profile.stockSips : [];
  const mfSips = Array.isArray(profile?.mfSips) ? profile.mfSips : [];
  const goldSips = Array.isArray(profile?.goldSips) ? profile.goldSips : [];
  const riskAppetite = profile?.riskAppetite?.toString() ?? 'Moderate';

  return {
    investmentScore,
    assetBalanceScore,
    sipScore,
    totalInvested,
    sipGap,
    equity,
    debt,
    gold,
    realEstate,
    sipEquity,
    sipDebt,
    sipGold,
    monthlySipTotal,
    stockSips,
    mfSips,
    goldSips,
    riskAppetite,
    idealSip,
    sipProgress,
    hasProfileData,
  };
}
