import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { apiService } from '../../services/apiService';
import {
  calculateInsurancePillar,
  formatInsuranceCompact,
  InsurancePillarData,
} from '../../models/pillars/insurance';

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 pl-1 mb-2.5">
    {label}
  </div>
);

export const InsurancePillarPage: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InsurancePillarData | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [dashboard, profileRes] = await Promise.all([
          apiService.getDashboard().catch(() => ({})),
          apiService.getMasterProfile().catch(() => ({ data: null })),
        ]);

        if (isMounted) {
          const calculated = calculateInsurancePillar(profileRes?.data, dashboard);
          setData(calculated);
        }
      } catch (err) {
        console.error('Error loading insurance pillar data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const p = data ?? calculateInsurancePillar(null, null);

  return (
    <div className="w-full px-8 lg:px-10 py-6 space-y-6">
      <h1 data-testid="insurance-page-title" className="sr-only">
        Protection Analysis
      </h1>

      {/* 1. SCORE HEADER */}
      <div
        data-testid="insurance-score-header"
        className="relative overflow-hidden p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#0B0D1B] border border-slate-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
      >
        {/* Subtle Ambient Glow on the Right */}
        <div className="hidden dark:block absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-indigo-900/20 via-teal-900/10 to-transparent pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/25 dark:border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0 shadow-[0_0_15px_rgba(20,184,166,0.15)]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              PROTECTION SCORE
            </div>
            <div className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white mt-0.5 leading-none tracking-tight">
              {Math.round(p.protectionScore)}
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-medium">
              {p.protectionScore >= 70
                ? 'Your coverage position is strong'
                : 'Safeguard your family with adequate term & health covers'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 relative z-10 self-end sm:self-center">
          {/* Life Score Ring */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full border-2 border-[#0284C7] dark:border-[#38BDF8] flex items-center justify-center text-base font-black text-slate-900 dark:text-white bg-sky-50 dark:bg-sky-950/30 shadow-[0_0_15px_rgba(56,189,248,0.25)]">
              {Math.round(p.termScore)}
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mt-1.5">
              Life
            </span>
          </div>

          {/* Health Score Ring */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full border-2 border-[#0D9488] dark:border-[#14B8A6] flex items-center justify-center text-base font-black text-slate-900 dark:text-white bg-teal-50 dark:bg-teal-950/30 shadow-[0_0_15px_rgba(20,184,166,0.25)]">
              {Math.round(p.healthScore)}
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mt-1.5">
              Health
            </span>
          </div>
        </div>
      </div>

      {/* 2. ACTIVE COVERAGE */}
      <div>
        <SectionLabel label="ACTIVE COVERAGE" />
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0B0D1B] border border-slate-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-xl space-y-5">
          {/* Term Insurance Row */}
          <div className="flex items-center justify-between gap-4 pl-1">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0284C7] dark:bg-[#38BDF8] shrink-0 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  Term Insurance
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Life Protection
                </div>
              </div>
            </div>
            <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {formatInsuranceCompact(p.termCover)}
            </span>
          </div>

          <div className="border-t border-slate-100 dark:border-white/[0.06]" />

          {/* Health Insurance Row */}
          <div className="flex items-center justify-between gap-4 pl-1">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0D9488] dark:bg-[#14B8A6] shrink-0 shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  Health Insurance
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Medical Shield
                </div>
              </div>
            </div>
            <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {formatInsuranceCompact(p.healthCover)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. PROTECTION HEALTH */}
      <div>
        <SectionLabel label="PROTECTION HEALTH" />
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0B0D1B] border border-slate-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-xl space-y-5">
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            Coverage Health
          </div>

          {/* Life Cover Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-zinc-300">Life Cover Score</span>
              <span className="text-xs font-black text-[#0284C7] dark:text-[#38BDF8]">
                {Math.round(p.termScore)}/100
              </span>
            </div>
            <div className="h-3 w-full bg-slate-100 dark:bg-[#121528] border border-slate-200/60 dark:border-white/[0.06] rounded-full overflow-hidden p-0.5">
              <div
                data-testid="life-cover-bar"
                className="h-full bg-gradient-to-r from-[#2563EB] to-[#38BDF8] rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(56,189,248,0.4)]"
                style={{
                  width: `${Math.min(100, Math.max(1, p.termScore))}%`,
                }}
              />
            </div>
          </div>

          {/* Health Cover Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-zinc-300">Health Cover Score</span>
              <span className="text-xs font-black text-[#0D9488] dark:text-[#14B8A6]">
                {Math.round(p.healthScore)}/100
              </span>
            </div>
            <div className="h-3 w-full bg-slate-100 dark:bg-[#121528] border border-slate-200/60 dark:border-white/[0.06] rounded-full overflow-hidden p-0.5">
              <div
                data-testid="health-cover-bar"
                className="h-full bg-gradient-to-r from-[#0D9488] to-[#2DD4BF] rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(45,212,191,0.4)]"
                style={{
                  width: `${Math.min(100, Math.max(1, p.healthScore))}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. SHORTFALL ANALYSIS */}
      <div>
        <SectionLabel label="SHORTFALL ANALYSIS" />
        <div
          data-testid="insurance-shortfall-card"
          className="p-6 rounded-2xl bg-white dark:bg-[#0B0D1B] border border-slate-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-xl space-y-4"
        >
          {/* Term & Life Gap */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Term & Life Gap
              </div>
              <div className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Recommended 15x annual income cushion
              </div>
            </div>
            <span
              data-testid="term-gap-text"
              className={`text-sm sm:text-base font-black ${
                p.termGap > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              Shortfall: {formatInsuranceCompact(p.termGap)}
            </span>
          </div>

          <div className="border-t border-slate-100 dark:border-white/[0.06]" />

          {/* Health Gap */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Health Gap
              </div>
              <div className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Recommended 10x medical emergency buffer
              </div>
            </div>
            <span
              data-testid="health-gap-text"
              className={`text-sm sm:text-base font-black ${
                p.healthGap > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              Shortfall: {formatInsuranceCompact(p.healthGap)}
            </span>
          </div>
        </div>
      </div>

      {/* 5. OPTIMIZE NOW BUTTON */}
      <button
        type="button"
        data-testid="insurance-optimize-btn"
        onClick={() => navigate('/master-data?target=insurance')}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#4338CA] hover:from-[#4338CA] hover:to-[#3730A3] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
      >
        <Sparkles className="w-4 h-4" />
        <span>OPTIMIZE NOW</span>
      </button>
    </div>
  );
};
