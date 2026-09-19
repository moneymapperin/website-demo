import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';
import { useMasterProfile } from '../hooks/useMasterProfile';
import { useGoldRate } from '../hooks/useGoldRate';
import { usePlan } from '../hooks/usePlan';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { gamificationStore } from '../services/gamificationStore';
import { DashboardSkeleton, DashboardHeaderSkeleton } from '../components/dashboard/DashboardSkeleton';
import { FinancialPositionCard } from '../components/dashboard/FinancialPositionCard';
import { ProBanners } from '../components/dashboard/ProBanners';
import { GoldTicker } from '../components/dashboard/GoldTicker';
import { EstimatedSpendingLimit } from '../components/dashboard/EstimatedSpendingLimit';
import { ScoreCardsGrid } from '../components/dashboard/ScoreCardsGrid';
import { LiveFinancialCalculator } from '../components/dashboard/LiveFinancialCalculator';
import { FinancialBreakdownSection } from '../components/dashboard/FinancialBreakdownSection';
import { QuotesSection } from '../components/dashboard/QuotesSection';
import { DashboardFooter } from '../components/dashboard/DashboardFooter';
import { DashboardEmptyState } from '../components/dashboard/DashboardEmptyState';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { isPro, isFeatureAccessible } = usePlan();

  const {
    data,
    isLoading: isDashboardLoading,
    error,
    isPending,
    refetch: refetchDashboard,
  } = useDashboard();

  const { profile } = useMasterProfile();
  const { goldData, isLoading: isGoldLoading, refetch: refetchGold } = useGoldRate();

  const handleRetry = useCallback(async () => {
    await Promise.all([refetchDashboard(), refetchGold()]);
  }, [refetchDashboard, refetchGold]);

  const handleLockedPillar = useCallback(
    (_pillarTitle: string) => {
      showToast({
        message: 'Upgrade to PRO to unlock this pillar! 🚀',
        backgroundColor: '#8B5CF6',
        action: {
          label: 'UPGRADE',
          onClick: () => navigate('/subscription'),
        },
      });
    },
    [showToast, navigate]
  );

  // Sync loaded fitness score with gamificationStore (mirrors Flutter lines 311-314)
  useEffect(() => {
    if (data?.fitnessScore && data.fitnessScore > 0) {
      gamificationStore.checkScoreImprovement(data.fitnessScore);
      if (data.pillars) {
        Object.entries(data.pillars).forEach(([key, p]) => {
          gamificationStore.checkPillarMastery(key, p.score);
        });
      }
    }
  }, [data]);

  // Derive User Name and Avatar Initials (Flutter lines 361-371)
  const rawProfile = (profile as Record<string, any>) || {};
  const userName =
    user?.user_metadata?.full_name ||
    rawProfile.fullName ||
    rawProfile.name ||
    data?.userName ||
    user?.email ||
    '';
  const userEmail = user?.email || rawProfile.email || '';

  let initial = 'S';
  if (userName.trim()) {
    const parts = userName.trim().split(/\s+/);
    if (parts.length >= 2) {
      initial = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length > 0) {
      initial = parts[0][0].toUpperCase();
    }
  }

  // Header component shared across states (mirrors Flutter _header in lines 360-492)
  const renderHeader = () => (
    <div className="bg-gradient-to-b from-[#2E1065] via-[#1E0A45]/90 to-mm-background dark:to-mm-darkBackground px-4 sm:px-6 pt-5 pb-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-xl text-white shadow-lg">
            🧭
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center space-x-2">
              <span>MoneyMapper</span>
              {isPro && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-white border border-white/20">
                  👑 PREMIUM
                </span>
              )}
            </h1>
            <p className="text-[10px] font-semibold text-white/50">
              Your Financial Navigation System
            </p>
          </div>
        </div>

        {/* Action Links & Profile Avatar */}
        <div className="flex items-center space-x-3">
          {/* Quick Links to AI Assistant & Weekly */}
          <button
            onClick={() => navigate('/ai-assistant')}
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors"
            aria-label="AI Assistant"
            data-testid="ai-assistant-nav-btn"
          >
            <span>🤖</span>
            <span>AI Assistant</span>
          </button>

          <button
            onClick={() => navigate('/weekly')}
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors"
            aria-label="Weekly"
            data-testid="weekly-nav-btn"
          >
            <span>📅</span>
            <span>Weekly</span>
          </button>

          {/* Notification Bell with Red Dot Badge (Flutter lines 442-470: pure no-op onPressed: () {}) */}
          <div className="relative">
            <button
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white text-sm transition-colors focus:outline-none"
              aria-label="Notifications"
              data-testid="notifications-btn"
              onClick={() => {
                // Pure no-op as in Flutter Dart code (no mock notification feature)
              }}
            >
              🔔
            </button>
            <span
              className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-mm-danger border-2 border-[#2E1065]"
              data-testid="notification-unread-dot"
            />
          </div>

          {/* User Profile Avatar */}
          <button
            onClick={() => navigate('/profile')}
            className="w-9 h-9 rounded-full bg-[#6D28D9] flex items-center justify-center text-white font-black text-sm hover:ring-2 hover:ring-purple-400 transition-all focus:outline-none"
            data-testid="dashboard-avatar-btn"
            aria-label="User Profile"
          >
            {initial}
          </button>
        </div>
      </div>
    </div>
  );

  // 1. Loading State (Flutter line 2248: DashboardHeaderSkeleton + DashboardSkeleton)
  if (isDashboardLoading && !data && !error) {
    return (
      <div className="w-full min-h-screen bg-mm-background dark:bg-mm-darkBackground" data-testid="dashboard-loading-state">
        <DashboardHeaderSkeleton />
        <DashboardSkeleton />
      </div>
    );
  }

  // 2. Error State (Flutter lines 1821-1841)
  if (error && !isPending && !data) {
    return (
      <div className="w-full min-h-screen bg-mm-background dark:bg-mm-darkBackground" data-testid="dashboard-screen">
        {renderHeader()}
        <div
          className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center"
          data-testid="dashboard-error-view"
        >
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
            {error}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
            Could not load dashboard data
          </p>
          <button
            onClick={handleRetry}
            className="px-6 py-2.5 rounded-xl bg-mm-primary text-white font-bold text-sm shadow hover:bg-mm-primary/90 transition-colors"
            data-testid="dashboard-retry-btn"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // 3. Empty State (Calculations Pending / 404 / 401 / No profile data, lines 1843-1949)
  if (isPending || !data) {
    return (
      <div className="w-full min-h-screen bg-mm-background dark:bg-mm-darkBackground pb-12" data-testid="dashboard-screen">
        {renderHeader()}
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
          <DashboardEmptyState
            userName={userName}
            userEmail={userEmail}
            goldData={goldData}
            isGoldLoading={isGoldLoading}
          />
        </div>
        <div className="mt-8">
          <DashboardFooter />
        </div>
      </div>
    );
  }

  // 4. Data Extraction & Computations mirroring Flutter lines 216-282
  const activeInc = Number(rawProfile.monthlyActiveIncome || 0);
  const passiveInc = Number(rawProfile.passiveIncomeAmount || 0);
  const monthlyIncome = activeInc + passiveInc;

  const fixedExp = Number(rawProfile.monthlyFixedExpenses || 0);
  const varExp = Number(rawProfile.monthlyVariableExpenses || 0);
  const totalExp = fixedExp + varExp;
  const monthlyExpenses =
    totalExp > 0 ? totalExp : monthlyIncome > 0 ? monthlyIncome * 0.6 : 45000;

  const equity = Number(rawProfile.totalEquityInvestments || 0);
  const debt = Number(rawProfile.totalDebtInvestments || 0);
  const goldVal = Number(rawProfile.totalGoldInvestments || 0);
  const re = Number(rawProfile.totalRealEstateInvestments || 0);
  const ef = Number(rawProfile.emergencyFundCurrent || 0);
  const loans = Number(rawProfile.activeLoans || 0);

  const computedAssets = equity + debt + goldVal + re + ef;
  const netPosition = computedAssets > 0 ? computedAssets - loans : 1280000;

  const emergencyCurrent = ef > 0 ? ef : 310000;
  const emergencyTarget =
    data.pillars?.['emergency']?.factors?.['ef_target_amount'] || monthlyExpenses * 6 || 420000;

  // SIP Recommendation calculation (Flutter lines 169-182, 251-260)
  const stockSipSum = Array.isArray(rawProfile.stockSips)
    ? rawProfile.stockSips.reduce((acc, item) => acc + Number(item?.amount || item?.sipAmount || 0), 0)
    : 0;
  const mfSipSum = Array.isArray(rawProfile.mfSips)
    ? rawProfile.mfSips.reduce((acc, item) => acc + Number(item?.amount || item?.sipAmount || 0), 0)
    : 0;
  const goldSipSum = Array.isArray(rawProfile.goldSips)
    ? rawProfile.goldSips.reduce((acc, item) => acc + Number(item?.amount || item?.sipAmount || 0), 0)
    : 0;
  const directSip =
    Number(rawProfile.monthlySipEquity || 0) +
    Number(rawProfile.monthlySipDebt || 0) +
    Number(rawProfile.monthlySipGold || 0) +
    Number(rawProfile.monthlySipContribution || 0);

  const activeSipSum = directSip > 0 ? directSip : stockSipSum + mfSipSum + goldSipSum;
  const sipGap = Number(
    rawProfile.sipShortfallGap ||
      rawProfile.sipGap ||
      data.pillars?.['investment']?.factors?.['sip_gap'] ||
      0
  );
  const sipRecommendation = activeSipSum + sipGap > 0 ? activeSipSum + sipGap : 15000;

  // Wealth allocations breakdown (Flutter lines 261-282)
  const totalInv = equity + debt + goldVal + re;
  let wealthAllocations: Record<string, { amount: number; percent: string }>;
  if (totalInv > 0) {
    const stockPct = Math.round((equity / totalInv) * 100);
    const mfPct = Math.round((debt / totalInv) * 100);
    const goldPct = Math.round((goldVal / totalInv) * 100);
    const rePct = Math.min(100, Math.max(0, 100 - stockPct - mfPct - goldPct));

    wealthAllocations = {
      Stock: { amount: equity, percent: `${stockPct}%` },
      'Mutual Fund': { amount: debt, percent: `${mfPct}%` },
      Gold: { amount: goldVal, percent: `${goldPct}%` },
      'Real Estate': { amount: re, percent: `${rePct}%` },
    };
  } else {
    wealthAllocations = {
      Stock: { amount: 42000, percent: '2%' },
      'Mutual Fund': { amount: 30000, percent: '1%' },
      Gold: { amount: 21000, percent: '1%' },
      'Real Estate': { amount: 2500000, percent: '96%' },
    };
  }

  return (
    <div
      className="w-full min-h-screen bg-mm-background dark:bg-mm-darkBackground pb-12"
      data-testid="dashboard-screen"
    >
      {/* Top Banner & Header Bar */}
      {renderHeader()}

      {/* Main Responsive Content Grid (1 col mobile, 2 to 3 cols desktop) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column / Main Dashboard Content (7 cols on desktop) */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. Core Financial Fitness & Net Position Card (lines 575-868) */}
            <FinancialPositionCard
              data={data}
              netPosition={netPosition}
              isPro={isPro}
              isFeatureAccessible={isFeatureAccessible}
            />

            {/* 2. Pro Banners (lines 1607-1819) */}
            <ProBanners isPro={isPro} />

            {/* 3. Estimated Weekly Spending Limit (lines 2125-2205) */}
            <EstimatedSpendingLimit
              monthlyIncome={monthlyIncome}
              expenseScore={data.pillars?.['expenses']?.score}
            />

            {/* 4. Financial Breakdown (5 Pillars, lines 922-1048) */}
            <FinancialBreakdownSection
              data={data}
              monthlyIncome={monthlyIncome}
              monthlyExpenses={monthlyExpenses}
              emergencyCurrent={emergencyCurrent}
              sipRecommendation={sipRecommendation}
              isPro={isPro}
              isFeatureAccessible={isFeatureAccessible}
              onLockedClick={handleLockedPillar}
            />

            {/* 5. Financial Quotes of Wisdom (lines 1980-2068) */}
            <QuotesSection />
          </div>

          {/* Right Column / Screener Tools & Calculators (5 cols on desktop) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Live Gold Ticker (24K Gold, lines 1253-1353) */}
            <GoldTicker goldData={goldData} isLoading={isGoldLoading} />

            {/* MoneyMapper Score Cards (2x2 Screener Grid, lines 1355-1450) */}
            <ScoreCardsGrid />

            {/* Live Financial Calculator Widget (lines 2214-2227) */}
            <LiveFinancialCalculator
              monthlyIncome={monthlyIncome > 0 ? monthlyIncome : 70000}
              monthlyExpenses={monthlyExpenses}
              availableBalance={
                (monthlyIncome > 0 ? monthlyIncome : 70000) - monthlyExpenses
              }
              emergencyCurrent={emergencyCurrent}
              emergencyTarget={emergencyTarget}
              sipRecommendation={sipRecommendation}
              wealthAllocations={wealthAllocations}
              isSipLocked={!isFeatureAccessible}
              showSipTrialBadge={!isPro && isFeatureAccessible}
            />
          </div>
        </div>

        {/* Global Footer (lines 2070-2097) */}
        <div className="mt-8">
          <DashboardFooter />
        </div>
      </main>
    </div>
  );
};
