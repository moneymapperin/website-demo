import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import {
  calculateIncomePillar,
  IncomePillarData,
} from '../../models/pillars/income';
import { getAnnualInflationRate } from '../../utils/dartRandom';
import { TrendingUp, Info, Sparkles } from 'lucide-react';

export function formatCompact(value: number): string {
  if (isNaN(value)) return 'not available';
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${Math.round(value)}`;
}

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <div className="text-[11px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider pl-1 mb-3">
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <h1 className="sr-only" data-testid="income-page-title">
        Income Analysis
      </h1>

      {/* 1. INCOME SCORE Card */}
      <div
        data-testid="income-score-header"
        className="p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between"
      >
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            INCOME SCORE
          </div>
          <div className="text-5xl sm:text-6xl font-black text-indigo-600 dark:text-indigo-400 mt-1 leading-none">
            {p.finalPillarScore}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <div className="w-11 h-11 rounded-full border-[3px] border-indigo-500/40 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400">
              {Math.round(p.activeScore)}
            </div>
            <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 mt-1">Active</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-11 h-11 rounded-full border-[3px] border-purple-500/40 flex items-center justify-center text-sm font-bold text-purple-600 dark:text-purple-400">
              {Math.round(p.passiveScore)}
            </div>
            <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 mt-1">Passive</span>
          </div>
        </div>
      </div>

      {/* 2. EARNINGS OVERVIEW Card */}
      <div>
        <SectionLabel label="EARNINGS OVERVIEW" />
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-5 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-zinc-400">
              Total Monthly Income
            </span>
            <span className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {p.hasProfileData ? formatCompact(total) : 'not available'}
            </span>
          </div>

          <div className="border-t border-slate-100 dark:border-indigo-500/10" />

          {/* Active Income Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-500 shrink-0" />
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Active Income</div>
                <div className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400">Salary, Business, Freelance</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {p.hasProfileData ? formatCompact(p.activeIncome) : 'not available'}
              </div>
              {p.hasProfileData && (
                <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                  {activePct.toFixed(1)}%
                </div>
              )}
            </div>
          </div>

          {/* Passive Income Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-600 dark:bg-purple-500 shrink-0" />
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Passive Income</div>
                <div className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400">Rent, Dividends, Interest</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {p.hasProfileData ? formatCompact(p.passiveIncome) : 'not available'}
              </div>
              {p.hasProfileData && (
                <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
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
        <div className="p-6 rounded-3xl bg-white dark:bg-[#131520] border border-violet-500/35 shadow-sm dark:shadow-xl space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider">
              PROJECTED INCOME – FY {nextFyYear}
            </span>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black">
              <TrendingUp className="w-3 h-3" />
              <span>+{rate.toFixed(2)}%</span>
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                Projected Monthly Income
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {p.hasProfileData ? formatCompact(forecastMonthly) : 'not available'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                +{p.hasProfileData ? formatCompact(monthlyGrowth) : 'not available'} / mo
              </div>
              <div className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                {p.hasProfileData ? formatCompact(forecastAnnual) : 'not available'} / year
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-indigo-500/10" />

          <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500 text-[10px]">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>
              Annual forecast inflation-adjusted ({rate.toFixed(2)}% rate). Updated yearly on Jan 1st.
            </span>
          </div>
        </div>
      </div>

      {/* 4. INCOME MIX HEALTH Card */}
      <div>
        <SectionLabel label="INCOME MIX HEALTH" />
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-5 transition-colors">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Income Breakdown
          </h3>

          <div className="space-y-4">
            {/* Active Source Bar */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-700 dark:text-zinc-300">Active Source</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-black">
                  {activePct.toFixed(1)}%
                </span>
              </div>
              <div className="h-[10px] w-full bg-slate-100 dark:bg-white/10 rounded-[5px] overflow-hidden">
                <div
                  className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-[5px] transition-all duration-500"
                  style={{
                    width: `${Math.min(1, Math.max(0.01, activePct / 100)) * 100}%`,
                    boxShadow: '0 2px 4px rgba(99, 102, 241, 0.3)',
                  }}
                />
              </div>
            </div>

            {/* Passive Source Bar */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-700 dark:text-zinc-300">Passive Source</span>
                <span className="text-purple-600 dark:text-purple-400 font-black">
                  {passivePct.toFixed(1)}%
                </span>
              </div>
              <div className="h-[10px] w-full bg-slate-100 dark:bg-white/10 rounded-[5px] overflow-hidden">
                <div
                  className="h-full bg-purple-600 dark:bg-purple-500 rounded-[5px] transition-all duration-500"
                  style={{
                    width: `${Math.min(1, Math.max(0.01, passivePct / 100)) * 100}%`,
                    boxShadow: '0 2px 4px rgba(168, 85, 247, 0.3)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. DISTRIBUTION STATUS Card */}
      <div>
        <SectionLabel label="DISTRIBUTION STATUS" />
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-5 transition-colors">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Distribution Health
          </h3>

          {/* Gradient slider with circular knob matching Flutter */}
          <div className="relative h-[12px] w-full rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 my-4">
            <div
              className="absolute -top-1 w-5 h-5 rounded-full bg-white border-[3px] border-black shadow-md transition-all duration-500 pointer-events-none"
              style={{
                left: `calc(${clampedScore / 100} * (100% - 20px))`,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.12)',
              }}
            />
          </div>

          <p className="text-xs italic text-slate-500 dark:text-zinc-400 leading-relaxed">
            {p.finalPillarScore >= 75
              ? 'Excellent! Your income streams are well diversified.'
              : 'Strategy: Aim for passive income to reach at least 25% of your total earnings.'}
          </p>

          <button
            type="button"
            data-testid="income-optimize-btn"
            onClick={() => navigate('/master-data?target=income')}
            className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wider uppercase shadow-lg shadow-indigo-600/25 transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Optimize Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
