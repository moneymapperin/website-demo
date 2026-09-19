import React from 'react';
import {
  formatCurrency_LiveFinancialCalculator,
  formatCompactCurrency_LiveFinancialCalculator,
} from '../../lib/formatters';

export interface WealthItem {
  amount: number;
  percent: string;
}

export interface LiveFinancialCalculatorProps {
  monthlyIncome?: number;
  monthlyExpenses?: number;
  availableBalance?: number;
  emergencyCurrent?: number;
  emergencyTarget?: number;
  sipRecommendation?: number;
  wealthAllocations?: Record<string, WealthItem>;
  isSipLocked?: boolean;
  showSipTrialBadge?: boolean;
}

export const LiveFinancialCalculator: React.FC<LiveFinancialCalculatorProps> = ({
  monthlyIncome = 70000,
  monthlyExpenses = 45000,
  availableBalance,
  emergencyCurrent = 310000,
  emergencyTarget = 420000,
  sipRecommendation = 10000,
  wealthAllocations = {
    Stock: { amount: 42000, percent: '2%' },
    'Mutual Fund': { amount: 30000, percent: '1%' },
    Gold: { amount: 21000, percent: '1%' },
    'Real Estate': { amount: 2500000, percent: '96%' },
  },
  isSipLocked = false,
  showSipTrialBadge = false,
}) => {
  const balance = availableBalance ?? monthlyIncome - monthlyExpenses;
  const efProgress = emergencyTarget > 0 ? Math.min(1.0, Math.max(0.0, emergencyCurrent / emergencyTarget)) : 0;
  const efPercentage = Math.round(efProgress * 100);

  const stockData = wealthAllocations['Stock'] ?? { amount: 42000, percent: '2%' };
  const mfData = wealthAllocations['Mutual Fund'] ?? { amount: 30000, percent: '1%' };
  const goldData = wealthAllocations['Gold'] ?? { amount: 21000, percent: '1%' };
  const reData = wealthAllocations['Real Estate'] ?? { amount: 2500000, percent: '96%' };

  return (
    <div
      className="rounded-[24px] bg-white dark:bg-[#0D0E15] border-[1.5px] border-gray-200 dark:border-[#1E202E] p-4 sm:p-5 shadow-sm dark:shadow-[0_8px_20px_rgba(0,0,0,0.4)]"
      data-testid="live-financial-calculator"
    >
      {/* ----------------- HEADER ROW (lines 81-122) ----------------- */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[12px] font-black tracking-wider text-mm-textPrimaryLight dark:text-white">
          LIVE FINANCIAL CALCULATOR
        </h3>
        <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-[#10B981]/10 border border-[#10B981]/30">
          <span className="text-[9px] font-bold text-[#10B981]">Live &amp; Calculated</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
        </div>
      </div>

      {/* ----------------- EQUATION ROW (lines 125-173) ----------------- */}
      <div className="grid grid-cols-11 gap-1 items-center mb-4 text-center">
        {/* Income Card */}
        <div
          className="col-span-3 rounded-xl p-2 bg-gray-50 dark:bg-[#161826] border border-[#10B981]/30 text-left"
          data-testid="equation-card-income"
        >
          <div className="flex items-center space-x-1 text-[#10B981] text-[7.5px] font-black">
            <span>💰</span>
            <span className="truncate">INCOME</span>
          </div>
          <div className="text-[12px] font-black text-mm-textPrimaryLight dark:text-white truncate mt-1">
            {formatCurrency_LiveFinancialCalculator(monthlyIncome)}
          </div>
          <div className="text-[7.5px] font-semibold text-gray-400 dark:text-white/40 truncate">
            / month
          </div>
        </div>

        {/* Minus */}
        <div className="col-span-1 text-sm font-black text-gray-400 dark:text-white/50">-</div>

        {/* Expenses Card */}
        <div
          className="col-span-3 rounded-xl p-2 bg-gray-50 dark:bg-[#161826] border border-[#EF4444]/30 text-left"
          data-testid="equation-card-expenses"
        >
          <div className="flex items-center space-x-1 text-[#EF4444] text-[7.5px] font-black">
            <span>💳</span>
            <span className="truncate">EXPENSES</span>
          </div>
          <div className="text-[12px] font-black text-mm-textPrimaryLight dark:text-white truncate mt-1">
            {formatCurrency_LiveFinancialCalculator(monthlyExpenses)}
          </div>
          <div className="text-[7.5px] font-semibold text-gray-400 dark:text-white/40 truncate">
            / month
          </div>
        </div>

        {/* Equals */}
        <div className="col-span-1 text-sm font-black text-gray-400 dark:text-white/50">=</div>

        {/* Available Card */}
        <div
          className="col-span-3 rounded-xl p-2 bg-gray-50 dark:bg-[#161826] border border-[#3B82F6]/30 text-left"
          data-testid="equation-card-available"
        >
          <div className="flex items-center space-x-1 text-[#3B82F6] text-[7.5px] font-black">
            <span>⚖️</span>
            <span className="truncate">AVAILABLE</span>
          </div>
          <div className="text-[12px] font-black text-mm-textPrimaryLight dark:text-white truncate mt-1">
            {formatCurrency_LiveFinancialCalculator(balance)}
          </div>
          <div className="text-[7.5px] font-semibold text-gray-400 dark:text-white/40 truncate">
            / month
          </div>
        </div>
      </div>

      {/* ----------------- EMERGENCY FUND CARD (lines 177-263) ----------------- */}
      <div className="rounded-2xl bg-gray-50 dark:bg-[#161826] border border-gray-200 dark:border-[#23283B] p-3.5 mb-4">
        <div className="flex items-center space-x-1.5 text-[#A855F7] mb-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <span className="text-[11px] font-black tracking-wider">EMERGENCY FUND</span>
        </div>

        <div className="flex items-baseline space-x-1 mb-2">
          <span
            className="text-lg font-black text-mm-textPrimaryLight dark:text-white"
            data-testid="ef-current"
          >
            {formatCurrency_LiveFinancialCalculator(emergencyCurrent)}
          </span>
          <span
            className="text-xs font-semibold text-gray-500 dark:text-white/50"
            data-testid="ef-target"
          >
            / {formatCurrency_LiveFinancialCalculator(emergencyTarget)}
          </span>
        </div>

        <div className="flex items-center space-x-3 mb-1.5">
          <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-[#272F40] overflow-hidden">
            <div
              style={{ width: `${efPercentage}%` }}
              className="h-full bg-[#A855F7] rounded-full transition-all duration-500"
              data-testid="ef-progress-bar"
            />
          </div>
          <span className="text-xs font-black text-[#A855F7]" data-testid="ef-percentage">
            {efPercentage}%
          </span>
        </div>

        <div className="text-[10px] font-medium text-gray-400 dark:text-white/40">
          Recommended: 6 Months Expenses
        </div>
      </div>

      {/* ----------------- BOTTOM ROW (SIP & WEALTH ALLOCATION) ----------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* SIP RECOMMENDATION (lines 271-414) */}
        <div
          className="relative rounded-2xl bg-gray-50 dark:bg-[#161826] border border-gray-200 dark:border-[#23283B] p-3 flex flex-col justify-between overflow-hidden"
          data-testid="sip-recommendation-card"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-1.5 text-[#F59E0B]">
              <span className="text-sm">📈</span>
              <div>
                <div className="text-[9px] font-black tracking-wide leading-tight">SIP</div>
                <div className="text-[7.5px] font-black tracking-tight leading-tight">
                  RECOMMENDATION
                </div>
              </div>
            </div>

            {showSipTrialBadge && (
              <span className="px-1.5 py-0.5 rounded bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[7px] font-black text-[#F59E0B]">
                TRIAL: 1D
              </span>
            )}
          </div>

          <div className="mt-3">
            <div
              className="text-lg font-black text-mm-textPrimaryLight dark:text-white"
              data-testid="sip-amount"
            >
              {formatCurrency_LiveFinancialCalculator(sipRecommendation)}
            </div>
            <div className="text-[10px] font-semibold text-gray-400 dark:text-white/50">
              / month
            </div>
          </div>

          {/* Locked Pro Overlay (lines 376-410) */}
          {isSipLocked && (
            <div
              className="absolute inset-0 bg-black/85 backdrop-blur-[1px] p-2 flex flex-col items-center justify-center text-center"
              data-testid="sip-locked-overlay"
            >
              <svg className="w-4 h-4 text-[#F59E0B] mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <div className="text-[8px] font-black text-[#F59E0B] tracking-wider">PRO FEATURE</div>
              <div className="text-[7.5px] text-white/70">Unlock SIP Advisor</div>
            </div>
          )}
        </div>

        {/* WEALTH ALLOCATION BREAKDOWN (lines 417-513) */}
        <div
          className="rounded-2xl bg-gray-50 dark:bg-[#161826] border border-gray-200 dark:border-[#23283B] p-3"
          data-testid="wealth-allocation-card"
        >
          <div className="mb-2">
            <div className="text-[8.5px] font-black text-gray-500 dark:text-white/70 tracking-wider">
              WEALTH ALLOCATION
            </div>
            <div className="text-[8px] font-semibold text-gray-400 dark:text-white/40">
              (Allocation Breakdown)
            </div>
          </div>

          {/* 2x2 Grid */}
          <div className="grid grid-cols-2 gap-1.5">
            {/* Stock */}
            <div
              className="p-1.5 rounded-lg bg-white dark:bg-[#0F111D] border border-gray-200 dark:border-[#1E2235]"
              data-testid="alloc-item-stock"
            >
              <div className="flex justify-between items-center text-[9.5px] font-black">
                <span className="text-mm-textPrimaryLight dark:text-white truncate">
                  {formatCompactCurrency_LiveFinancialCalculator(stockData.amount)}
                </span>
                <span className="text-[7.5px] text-[#10B981] ml-1">{stockData.percent}</span>
              </div>
              <div className="text-[7px] font-semibold text-gray-400 dark:text-white/50 truncate">
                Stock
              </div>
            </div>

            {/* Mutual Fund */}
            <div
              className="p-1.5 rounded-lg bg-white dark:bg-[#0F111D] border border-gray-200 dark:border-[#1E2235]"
              data-testid="alloc-item-mf"
            >
              <div className="flex justify-between items-center text-[9.5px] font-black">
                <span className="text-mm-textPrimaryLight dark:text-white truncate">
                  {formatCompactCurrency_LiveFinancialCalculator(mfData.amount)}
                </span>
                <span className="text-[7.5px] text-[#F59E0B] ml-1">{mfData.percent}</span>
              </div>
              <div className="text-[7px] font-semibold text-gray-400 dark:text-white/50 truncate">
                Mutual Fund
              </div>
            </div>

            {/* Gold */}
            <div
              className="p-1.5 rounded-lg bg-white dark:bg-[#0F111D] border border-gray-200 dark:border-[#1E2235]"
              data-testid="alloc-item-gold"
            >
              <div className="flex justify-between items-center text-[9.5px] font-black">
                <span className="text-mm-textPrimaryLight dark:text-white truncate">
                  {formatCompactCurrency_LiveFinancialCalculator(goldData.amount)}
                </span>
                <span className="text-[7.5px] text-[#EF4444] ml-1">{goldData.percent}</span>
              </div>
              <div className="text-[7px] font-semibold text-gray-400 dark:text-white/50 truncate">
                Gold
              </div>
            </div>

            {/* Real Estate */}
            <div
              className="p-1.5 rounded-lg bg-white dark:bg-[#0F111D] border border-gray-200 dark:border-[#1E2235]"
              data-testid="alloc-item-re"
            >
              <div className="flex justify-between items-center text-[9.5px] font-black">
                <span className="text-mm-textPrimaryLight dark:text-white truncate">
                  {formatCompactCurrency_LiveFinancialCalculator(reData.amount)}
                </span>
                <span className="text-[7.5px] text-[#3B82F6] ml-1">{reData.percent}</span>
              </div>
              <div className="text-[7px] font-semibold text-gray-400 dark:text-white/50 truncate">
                Real Estate
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
