import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { apiService } from '../../services/apiService';
import {
  calculateInsurancePillar,
  formatInsuranceCompact,
  InsurancePillarData,
} from '../../models/pillars/insurance';

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <div className="text-[11px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider pl-1 mb-3">
    {label}
  </div>
);

const MiniScoreCircle: React.FC<{
  label: string;
  score: number;
  colorClass: string;
  borderClass: string;
}> = ({ label, score, colorClass, borderClass }) => (
  <div className="flex flex-col items-center">
    <div
      className={`w-11 h-11 rounded-full border-[3px] ${borderClass} flex items-center justify-center text-sm font-bold ${colorClass}`}
    >
      {Math.round(score)}
    </div>
    <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 mt-1">
      {label}
    </span>
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <h1 data-testid="insurance-page-title" className="sr-only">
        Protection Analysis
      </h1>

      {/* 1. SCORE HEADER */}
      <div
        data-testid="insurance-score-header"
        className="p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between"
      >
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            PROTECTION SCORE
          </div>
          <div className="text-5xl sm:text-6xl font-black text-indigo-600 dark:text-indigo-400 mt-1 leading-none">
            {Math.round(p.protectionScore)}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <MiniScoreCircle
            label="Life"
            score={p.termScore}
            colorClass="text-blue-600 dark:text-blue-400"
            borderClass="border-blue-500/40"
          />
          <MiniScoreCircle
            label="Health"
            score={p.healthScore}
            colorClass="text-teal-600 dark:text-teal-400"
            borderClass="border-teal-500/40"
          />
        </div>
      </div>

      {/* 2. ACTIVE COVERAGE */}
      <div>
        <SectionLabel label="ACTIVE COVERAGE" />
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-4 transition-colors">
          {/* Term Insurance Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  Term Insurance
                </div>
                <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                  Life Protection
                </div>
              </div>
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {formatInsuranceCompact(p.termCover)}
            </span>
          </div>

          {/* Health Insurance Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-teal-500 shrink-0" />
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  Health Insurance
                </div>
                <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                  Medical Shield
                </div>
              </div>
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {formatInsuranceCompact(p.healthCover)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. PROTECTION HEALTH */}
      <div>
        <SectionLabel label="PROTECTION HEALTH" />
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-5 transition-colors">
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            Coverage Health
          </div>

          {/* Life Cover Score */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-slate-900 dark:text-white">Life Cover Score</span>
              <span className="text-blue-600 dark:text-blue-400 font-black">
                {Math.round(p.termScore)}/100
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                data-testid="life-cover-bar"
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(1, p.termScore))}%`,
                }}
              />
            </div>
          </div>

          {/* Health Cover Score */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-slate-900 dark:text-white">Health Cover Score</span>
              <span className="text-teal-600 dark:text-teal-400 font-black">
                {Math.round(p.healthScore)}/100
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                data-testid="health-cover-bar"
                className="h-full bg-teal-500 rounded-full transition-all duration-500"
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
          className="p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-4 transition-colors"
        >
          {/* Term & Life Gap */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Term & Life Gap
            </span>
            <span
              data-testid="term-gap-text"
              className={`text-sm font-black ${
                p.termGap > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              Shortfall: {formatInsuranceCompact(p.termGap)}
            </span>
          </div>

          <div className="border-t border-slate-100 dark:border-indigo-500/10" />

          {/* Health Gap */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Health Gap
            </span>
            <span
              data-testid="health-gap-text"
              className={`text-sm font-black ${
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
        className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
      >
        <Sparkles className="w-5 h-5 text-white" />
        <span>Optimize Now</span>
      </button>
    </div>
  );
};
