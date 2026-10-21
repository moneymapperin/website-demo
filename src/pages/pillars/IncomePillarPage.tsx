import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import {
  calculateIncomePillar,
  IncomePillarData,
} from '../../models/pillars/income';
import { getAnnualInflationRate } from '../../utils/dartRandom';
import {
  BarChart3,
  Wallet,
  TrendingUp,
  PieChart,
  Target,
  Info,
  Sparkles,
} from 'lucide-react';

export function formatCompact(value: number): string {
  if (isNaN(value)) return 'not available';
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${Math.round(value)}`;
}

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <div className="text-[11px] font-bold uppercase text-slate-500 dark:text-zinc-400 tracking-wider pl-0.5 mb-2.5">
    {label}
  </div>
);

export const IncomePillarPage: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<IncomePillarData | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const profileRes = await apiService.getMasterProfile().catch(() => ({ data: null }));
      const calculated = calculateIncomePillar(profileRes?.data);
      setData(calculated);
    } catch (err) {
      console.error('Error loading income pillar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const p = data ?? calculateIncomePillar(null);

  // Shares computed dynamically from current data
  const total = p.activeIncome + p.passiveIncome;
  const activePct = total > 0 ? (p.activeIncome / total) * 100 : 0;
  const passivePct = total > 0 ? (p.passiveIncome / total) * 100 : 0;

  // Next Year Income Forecast calculations (1:1 with Flutter app)
  const currentMonthly = p.activeIncome + p.passiveIncome;
  const rate = getAnnualInflationRate();
  const forecastMonthly = currentMonthly * (1 + rate / 100);
  const forecastAnnual = forecastMonthly * 12;
  const monthlyGrowth = forecastMonthly - currentMonthly;
  const nextFyYear = new Date().getFullYear() + 1;

  // Clamped score for distribution meter
  const clampedScore = Math.min(100, Math.max(0, p.finalPillarScore));

  return (
    <div className="w-full px-8 lg:px-10 py-6 space-y-6">
      <h1 className="sr-only" data-testid="income-page-title">
        Income Analysis
      </h1>

      {/* 1. HERO INCOME SCORE Card */}
      <div
        data-testid="income-score-header"
        className="relative overflow-hidden p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#0B0D1B] border border-slate-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
      >
        {/* Subtle Ambient Glow on the Right */}
        <div className="hidden dark:block absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-purple-900/20 to-transparent pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/25 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              INCOME SCORE
            </div>
            <div className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white mt-0.5 leading-none tracking-tight">
              {p.finalPillarScore}
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-medium">
              {p.finalPillarScore >= 70
                ? 'Your income position looks good'
                : 'Consider diversifying into passive streams'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 relative z-10 self-end sm:self-center">
          {/* Active Ring */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full border-2 border-[#0284C7] dark:border-[#38BDF8] flex items-center justify-center text-base font-black text-slate-900 dark:text-white bg-sky-50 dark:bg-blue-950/30 shadow-[0_0_15px_rgba(56,189,248,0.25)]">
              {Math.round(p.activeScore)}
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mt-1.5">Active</span>
          </div>

          {/* Passive Ring */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full border-2 border-[#9333EA] dark:border-[#A855F7] flex items-center justify-center text-base font-black text-slate-900 dark:text-white bg-purple-50 dark:bg-purple-950/30 shadow-[0_0_15px_rgba(168,85,247,0.25)]">
              {Math.round(p.passiveScore)}
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mt-1.5">Passive</span>
          </div>
        </div>
      </div>

      {/* 2. EARNINGS OVERVIEW Card */}
      <div>
        <SectionLabel label="EARNINGS OVERVIEW" />
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0B0D1B] border border-slate-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-xl space-y-5">
          {/* Total Monthly Income Header Row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/25 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Total Monthly Income</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Combined view of all your income streams</p>
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#0284C7] dark:text-[#38BDF8] tracking-tight">
              {p.hasProfileData ? formatCompact(total) : 'not available'}
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-white/[0.06]" />

          {/* Active Income Row */}
          <div className="flex items-center justify-between gap-4 pl-1">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0284C7] dark:bg-[#38BDF8] shrink-0 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">Active Income</div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Salary, Business, Freelance</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {p.hasProfileData ? formatCompact(p.activeIncome) : 'not available'}
              </div>
              {p.hasProfileData && (
                <div className="text-xs font-semibold text-[#0284C7] dark:text-[#38BDF8] mt-0.5">
                  {activePct.toFixed(1)}%
                </div>
              )}
            </div>
          </div>

          {/* Passive Income Row */}
          <div className="flex items-center justify-between gap-4 pl-1">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#9333EA] dark:bg-[#A855F7] shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">Passive Income</div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Rent, Dividends, Interest</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {p.hasProfileData ? formatCompact(p.passiveIncome) : 'not available'}
              </div>
              {p.hasProfileData && (
                <div className="text-xs font-semibold text-[#9333EA] dark:text-[#A855F7] mt-0.5">
                  {passivePct.toFixed(1)}%
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. NEXT YEAR INCOME FORECAST Card */}
      <div>
        <SectionLabel label="NEXT YEAR INCOME FORECAST" />
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0B0D1B] border border-slate-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/25 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                  PROJECTED INCOME – FY {nextFyYear}
                </span>
                <div className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">
                  Projected Monthly Income
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
                  {p.hasProfileData ? formatCompact(forecastMonthly) : 'not available'}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+{rate.toFixed(2)}%</span>
              </div>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                +{p.hasProfileData ? formatCompact(monthlyGrowth) : 'not available'} / mo
              </div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                {p.hasProfileData ? formatCompact(forecastAnnual) : 'not available'} / year
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-white/[0.06] pt-3 flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs">
            <Info className="w-4 h-4 shrink-0 text-slate-400 dark:text-zinc-400" />
            <span>
              Annual forecast inflation-adjusted ({rate.toFixed(2)}% rate). Updated yearly on Jan 1st.
            </span>
          </div>
        </div>
      </div>

      {/* 4. INCOME MIX HEALTH Card */}
      <div>
        <SectionLabel label="INCOME MIX HEALTH" />
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0B0D1B] border border-slate-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-xl space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/25 dark:border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <PieChart className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Income Breakdown
            </h3>
          </div>

          <div className="space-y-4 pt-1">
            {/* Active Source Bar */}
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 w-28 sm:w-32 shrink-0">
                Active Source
              </span>
              <div className="flex-1 h-3 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden relative">
                <div
                  className="h-full bg-[#2563EB] rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(37,99,235,0.6)]"
                  style={{
                    width: `${Math.min(100, Math.max(0, activePct))}%`,
                  }}
                />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white w-14 text-right shrink-0">
                {activePct.toFixed(1)}%
              </span>
            </div>

            {/* Passive Source Bar */}
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 w-28 sm:w-32 shrink-0">
                Passive Source
              </span>
              <div className="flex-1 h-3 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden relative">
                <div
                  className="h-full bg-[#A855F7] rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(168,85,247,0.6)]"
                  style={{
                    width: `${Math.min(100, Math.max(0, passivePct))}%`,
                  }}
                />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white w-14 text-right shrink-0">
                {passivePct.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. DISTRIBUTION STATUS Card */}
      <div>
        <SectionLabel label="DISTRIBUTION STATUS" />
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0B0D1B] border border-slate-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/25 dark:border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Distribution Health
              </h3>
            </div>
          </div>

          <p className="text-xs italic text-slate-600 dark:text-zinc-400 leading-relaxed">
            Strategy: Aim for passive income to reach at least 25% of your total earnings.
          </p>

          {/* Smooth Continuous Gradient Bar with White Handle */}
          <div className="relative h-3.5 w-full rounded-full bg-gradient-to-r from-[#EF4444] via-[#F59E0B] to-[#10B981] my-4 shadow-inner">
            <div
              className="absolute -top-1 w-4 h-5.5 rounded-full bg-white border-2 border-slate-700 dark:border-black shadow-[0_2px_8px_rgba(0,0,0,0.4)] transition-all duration-500 pointer-events-none"
              style={{
                left: `calc(${clampedScore / 100} * (100% - 16px))`,
              }}
            />
          </div>

          <button
            type="button"
            data-testid="income-optimize-btn"
            onClick={() => navigate('/master-data?target=income')}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#4338CA] hover:from-[#4338CA] hover:to-[#3730A3] text-white font-bold text-xs tracking-wider uppercase shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            <Sparkles className="w-4 h-4" />
            <span>OPTIMIZE NOW</span>
          </button>
        </div>
      </div>
    </div>
  );
};
