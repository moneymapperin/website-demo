import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Umbrella,
  HeartPulse,
  Target,
  Sparkles,
} from 'lucide-react';
import { apiService } from '../../services/apiService';
import {
  calculateInsurancePillar,
  formatInsuranceCompact,
  InsurancePillarData,
} from '../../models/pillars/insurance';

const SectionHeader: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex items-center gap-2 text-xs font-bold uppercase text-white/90 tracking-wider mb-2.5 pl-0.5">
    {icon}
    <span>{label}</span>
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
    <div className="w-full px-4 sm:px-8 lg:px-10 py-6 space-y-5 max-w-7xl mx-auto">
      <h1 data-testid="insurance-page-title" className="sr-only">
        Protection Analysis
      </h1>

      {/* 1. HERO PROTECTION SCORE Card */}
      <div
        data-testid="insurance-score-header"
        className="relative overflow-hidden p-5 sm:p-7 rounded-[24px] bg-[#0A0B1A]/95 border border-indigo-500/30 shadow-[0_4px_30px_rgba(0,0,0,0.6),0_0_25px_rgba(99,102,241,0.15)] flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-purple-900/20 via-indigo-900/10 to-transparent pointer-events-none" />

        {/* Left: Shield Icon Box + Score Details */}
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1E40AF] border border-blue-400/40 shadow-[0_0_20px_rgba(37,99,235,0.45)] flex items-center justify-center shrink-0">
            <Shield className="w-7 h-7 text-white drop-shadow-sm" />
          </div>

          <div className="h-11 w-[1px] bg-white/10 hidden sm:block" />

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
              PROTECTION SCORE
            </div>
            <div className="text-4xl sm:text-5xl font-black text-white mt-1 leading-none tracking-tight">
              {Math.round(p.protectionScore)}
            </div>
          </div>
        </div>

        {/* Center: Glowing Wave Chart Graphic */}
        <div className="hidden lg:flex flex-1 items-center justify-center px-4 max-w-[280px] xl:max-w-[340px] h-16 pointer-events-none select-none relative z-10">
          <svg className="w-full h-16 overflow-visible" viewBox="0 0 300 70" fill="none">
            <defs>
              <linearGradient id="protWaveLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
                <stop offset="35%" stopColor="#6366F1" stopOpacity="0.85" />
                <stop offset="70%" stopColor="#A855F7" stopOpacity="1" />
                <stop offset="100%" stopColor="#C084FC" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="protWaveFillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#A855F7" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
              </linearGradient>
              <filter id="protWaveGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#A855F7" floodOpacity="0.6" />
              </filter>
            </defs>
            <path
              d="M0 65 Q 40 65, 80 50 T 160 30 T 230 18 T 300 35 L 300 70 L 0 70 Z"
              fill="url(#protWaveFillGrad)"
            />
            <path
              d="M0 65 Q 40 65, 80 50 T 160 30 T 230 18 T 300 35"
              fill="none"
              stroke="url(#protWaveLineGrad)"
              strokeWidth="3"
              strokeLinecap="round"
              filter="url(#protWaveGlow)"
            />
          </svg>
        </div>

        {/* Right: Life and Health Score Rings */}
        <div className="flex items-center gap-6 relative z-10 self-end sm:self-center">
          {/* Life Score Ring */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full border-2 border-[#38BDF8] flex items-center justify-center text-base font-black text-white bg-[#071324] shadow-[0_0_18px_rgba(56,189,248,0.35)]">
              {Math.round(p.termScore)}
            </div>
            <span className="text-[11px] font-bold text-zinc-400 mt-1.5">
              Life
            </span>
          </div>

          {/* Health Score Ring */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full border-2 border-[#14B8A6] flex items-center justify-center text-base font-black text-white bg-[#071a18] shadow-[0_0_18px_rgba(20,184,166,0.35)]">
              {Math.round(p.healthScore)}
            </div>
            <span className="text-[11px] font-bold text-zinc-400 mt-1.5">
              Health
            </span>
          </div>
        </div>
      </div>

      {/* 2. 2-Column Grid: ACTIVE COVERAGE + PROTECTION HEALTH */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Column 1: ACTIVE COVERAGE */}
        <div>
          <SectionHeader
            icon={<Umbrella className="w-4 h-4 text-purple-400" />}
            label="ACTIVE COVERAGE"
          />
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0B0D1B]/95 border border-white/[0.08] shadow-lg backdrop-blur-md space-y-4">
            {/* Term Insurance Row */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/35 flex items-center justify-center text-blue-400 shrink-0 shadow-[0_0_12px_rgba(59,130,246,0.2)]">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    Term Insurance
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    Life Protection
                  </div>
                </div>
              </div>
              <span className="text-base sm:text-lg font-bold text-white tracking-tight">
                {formatInsuranceCompact(p.termCover)}
              </span>
            </div>

            {/* Health Insurance Row */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-teal-600/20 border border-teal-500/35 flex items-center justify-center text-teal-400 shrink-0 shadow-[0_0_12px_rgba(20,184,166,0.2)]">
                  <HeartPulse className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    Health Insurance
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    Medical Shield
                  </div>
                </div>
              </div>
              <span className="text-base sm:text-lg font-bold text-white tracking-tight">
                {formatInsuranceCompact(p.healthCover)}
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: PROTECTION HEALTH */}
        <div>
          <SectionHeader
            icon={<Shield className="w-4 h-4 text-purple-400" />}
            label="PROTECTION HEALTH"
          />
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0B0D1B]/95 border border-white/[0.08] shadow-lg backdrop-blur-md space-y-4">
            <div className="text-sm font-bold text-white">
              Coverage Health
            </div>

            {/* Life Cover Score */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-300">Life Cover Score</span>
                <span className="text-xs font-black text-[#38BDF8]">
                  {Math.round(p.termScore)}/100
                </span>
              </div>
              <div className="h-2.5 w-full bg-zinc-800/80 rounded-full overflow-hidden shadow-inner">
                <div
                  data-testid="life-cover-bar"
                  className="h-full bg-gradient-to-r from-[#2563EB] to-[#38BDF8] rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(56,189,248,0.6)]"
                  style={{
                    width: `${Math.min(100, Math.max(1, p.termScore))}%`,
                  }}
                />
              </div>
            </div>

            {/* Health Cover Score */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-300">Health Cover Score</span>
                <span className="text-xs font-black text-[#14B8A6]">
                  {Math.round(p.healthScore)}/100
                </span>
              </div>
              <div className="h-2.5 w-full bg-zinc-800/80 rounded-full overflow-hidden shadow-inner">
                <div
                  data-testid="health-cover-bar"
                  className="h-full bg-gradient-to-r from-[#0D9488] to-[#14B8A6] rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(20,184,166,0.6)]"
                  style={{
                    width: `${Math.min(100, Math.max(1, p.healthScore))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SHORTFALL ANALYSIS (Full Width) */}
      <div>
        <SectionHeader
          icon={<Target className="w-4 h-4 text-purple-400" />}
          label="SHORTFALL ANALYSIS"
        />
        <div
          data-testid="insurance-shortfall-card"
          className="p-5 sm:p-6 rounded-2xl bg-[#0B0D1B]/95 border border-white/[0.08] shadow-lg backdrop-blur-md space-y-4"
        >
          {/* Term & Life Gap */}
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm font-bold text-white">
              Term & Life Gap
            </div>
            <span
              data-testid="term-gap-text"
              className={`text-sm sm:text-base font-black ${
                p.termGap > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-[#38BDF8]'
              }`}
            >
              Shortfall: {formatInsuranceCompact(p.termGap)}
            </span>
          </div>

          <div className="border-t border-white/[0.06]" />

          {/* Health Gap */}
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm font-bold text-white">
              Health Gap
            </div>
            <span
              data-testid="health-gap-text"
              className={`text-sm sm:text-base font-black ${
                p.healthGap > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-[#38BDF8]'
              }`}
            >
              Shortfall: {formatInsuranceCompact(p.healthGap)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. OPTIMIZE NOW BUTTON */}
      <button
        type="button"
        data-testid="insurance-optimize-btn"
        onClick={() => navigate('/master-data?target=insurance')}
        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#A855F7] hover:opacity-95 text-white font-black text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
      >
        <Sparkles className="w-4 h-4 text-white" />
        <span>OPTIMIZE NOW</span>
      </button>
    </div>
  );
};

export default InsurancePillarPage;
