import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import {
  calculateIncomePillar,
  formatIncomeCompact,
  IncomePillarData,
} from '../../models/pillars/income';
import {
  Coins,
  Wallet,
  TrendingUp,
  PieChart,
  Target,
  BarChart2,
  Sparkles,
  Info,
  Layers,
} from 'lucide-react';

const SectionHeader: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 pl-1 mb-2.5">
    {icon}
    <span>{label}</span>
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
      console.error('Error loading income pillar data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const p = data ?? calculateIncomePillar(null);

  const total = p.activeIncome + p.passiveIncome;
  const activePct = total > 0 ? (p.activeIncome / total) * 100 : 0;
  const passivePct = total > 0 ? (p.passiveIncome / total) * 100 : 0;

  // Forecast calculations (inflation-adjusted 7.73% rate)
  const rate = 7.73;
  const forecastMonthly = total * (1 + rate / 100);
  const monthlyGrowth = forecastMonthly - total;
  const forecastAnnual = forecastMonthly * 12;
  const nextFyYear = new Date().getFullYear() + 1;

  // Clamped score for distribution meter
  const clampedScore = Math.min(100, Math.max(0, p.finalPillarScore));

  return (
    <div className="w-full px-4 sm:px-8 lg:px-10 py-6 space-y-5 max-w-7xl mx-auto">
      <h1 className="sr-only" data-testid="income-page-title">
        Income Analysis
      </h1>

      {/* 1. HERO INCOME SCORE Card */}
      <div
        data-testid="income-score-header"
        className="relative overflow-hidden p-5 sm:p-7 rounded-[24px] bg-[#0A0B1A]/95 border border-indigo-500/30 shadow-[0_4px_30px_rgba(0,0,0,0.6),0_0_25px_rgba(99,102,241,0.15)] flex flex-col md:flex-row md:items-center justify-between gap-6 min-h-[140px]"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-purple-900/25 via-indigo-900/15 to-transparent pointer-events-none" />

        {/* Left: Coins Icon Box + Score Details */}
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1E40AF] border border-blue-400/40 shadow-[0_0_20px_rgba(37,99,235,0.45)] flex items-center justify-center shrink-0">
            <Coins className="w-7 h-7 text-white drop-shadow-sm" />
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
              INCOME SCORE
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-4xl sm:text-5xl font-black text-white leading-none tracking-tight">
                {p.finalPillarScore}
              </span>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/40 text-xs font-semibold text-white/90 shadow-[0_0_12px_rgba(99,102,241,0.25)]">
                <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  {p.finalPillarScore >= 70
                    ? 'Good Position'
                    : p.finalPillarScore >= 40
                    ? 'Average Position'
                    : 'Needs Focus'}
                </span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 font-medium mt-1.5">
              Your income position looks good.
            </p>
          </div>
        </div>

        {/* Glowing Background Wave Graphic spanning from center across to rings */}
        <div className="absolute inset-y-0 left-[26%] right-0 hidden md:block pointer-events-none select-none overflow-hidden">
          <svg
            className="w-full h-full"
            viewBox="0 0 700 130"
            fill="none"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="incWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
                <stop offset="30%" stopColor="#818CF8" stopOpacity="0.85" />
                <stop offset="65%" stopColor="#A855F7" stopOpacity="1" />
                <stop offset="100%" stopColor="#D946EF" stopOpacity="0.85" />
              </linearGradient>
              <linearGradient id="incWaveFill" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#A855F7" stopOpacity="0.22" />
                <stop offset="60%" stopColor="#6366F1" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="incWaveSecondary" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#818CF8" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#A855F7" stopOpacity="0.2" />
              </linearGradient>
              <filter id="incWaveGlow" x="-20%" y="-30%" width="140%" height="160%">
                <feGaussianBlur stdDeviation="4.5" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Translucent ambient wave fill under main curve */}
            <path
              d="M 0 115 C 130 110, 200 85, 300 50 C 390 18, 470 18, 540 40 C 600 58, 650 55, 700 35 L 700 130 L 0 130 Z"
              fill="url(#incWaveFill)"
            />
            {/* Secondary subtle wave ribbon */}
            <path
              d="M 0 120 C 140 115, 230 95, 320 65 C 410 38, 490 35, 560 55 C 620 72, 665 65, 700 45"
              fill="none"
              stroke="url(#incWaveSecondary)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Primary glowing neon crest wave */}
            <path
              d="M 0 115 C 130 110, 200 85, 300 50 C 390 18, 470 18, 540 40 C 600 58, 650 55, 700 35"
              fill="none"
              stroke="url(#incWaveGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              filter="url(#incWaveGlow)"
            />
          </svg>
        </div>

        {/* Right: Active and Passive Rings */}
        <div className="flex items-center gap-6 relative z-10 self-end sm:self-center">
          {/* Active Ring */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full border-2 border-[#38BDF8] flex items-center justify-center text-base font-black text-white bg-[#071324] shadow-[0_0_18px_rgba(56,189,248,0.35)]">
              {Math.round(p.activeScore)}
            </div>
            <span className="text-[11px] font-bold text-zinc-400 mt-1.5">Active</span>
          </div>

          {/* Passive Ring */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full border-2 border-[#A855F7] flex items-center justify-center text-base font-black text-white bg-[#150a24] shadow-[0_0_18px_rgba(168,85,247,0.35)]">
              {Math.round(p.passiveScore)}
            </div>
            <span className="text-[11px] font-bold text-zinc-400 mt-1.5">Passive</span>
          </div>
        </div>
      </div>

      {/* 2-Column Grid matching Screenshot 1:1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Earnings Overview + Next Year Forecast */}
        <div className="space-y-5">
          {/* 2. EARNINGS OVERVIEW Card */}
          <div>
            <SectionHeader
              icon={<Layers className="w-4 h-4 text-purple-400" />}
              label="EARNINGS OVERVIEW"
            />
            <div className="p-5 sm:p-6 rounded-[24px] bg-[#0A0B1A]/95 border border-white/[0.08] shadow-lg backdrop-blur-md space-y-4">
              {/* Total Monthly Income Header Row */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-purple-600/20 border border-purple-500/35 flex items-center justify-center text-purple-400 shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Total Monthly Income</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Combined view of all your income streams</p>
                  </div>
                </div>
                <span className="text-2xl sm:text-3xl font-black text-[#38BDF8] tracking-tight">
                  {p.hasProfileData ? formatIncomeCompact(total) : 'not available'}
                </span>
              </div>

              <div className="border-t border-white/[0.06]" />

              {/* Inner Rows */}
              <div className="space-y-3.5 pt-1">
                {/* Active Income Row */}
                <div className="flex items-center justify-between gap-4 pl-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] shrink-0 shadow-[0_0_8px_#38BDF8]" />
                    <div>
                      <div className="text-sm font-bold text-white">Active Income</div>
                      <div className="text-xs text-zinc-400 mt-0.5">Salary, Business, Freelance</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm sm:text-base font-bold text-white">
                      {p.hasProfileData ? formatIncomeCompact(p.activeIncome) : 'not available'}
                    </div>
                    {p.hasProfileData && (
                      <div className="text-xs font-bold text-[#38BDF8] mt-0.5">
                        {activePct.toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>

                {/* Passive Income Row */}
                <div className="flex items-center justify-between gap-4 pl-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#A855F7] shrink-0 shadow-[0_0_8px_#A855F7]" />
                    <div>
                      <div className="text-sm font-bold text-white">Passive Income</div>
                      <div className="text-xs text-zinc-400 mt-0.5">Rent, Dividends, Interest</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm sm:text-base font-bold text-white">
                      {p.hasProfileData ? formatIncomeCompact(p.passiveIncome) : 'not available'}
                    </div>
                    {p.hasProfileData && (
                      <div className="text-xs font-bold text-[#A855F7] mt-0.5">
                        {passivePct.toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. NEXT YEAR INCOME FORECAST Card */}
          <div>
            <SectionHeader
              icon={<TrendingUp className="w-4 h-4 text-purple-400" />}
              label="NEXT YEAR INCOME FORECAST"
            />
            <div className="p-5 sm:p-6 rounded-[24px] bg-[#0A0B1A]/95 border border-white/[0.08] shadow-lg backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                {/* Left Column: Icon + Projection Values */}
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/35 flex items-center justify-center text-blue-400 shrink-0 shadow-[0_0_12px_rgba(59,130,246,0.2)]">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase text-indigo-400 tracking-wider">
                      PROJECTED INCOME – FY {nextFyYear}
                    </span>
                    <div className="text-xs text-zinc-400 mt-0.5 font-medium">
                      Projected Monthly Income
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
                      {p.hasProfileData ? formatIncomeCompact(forecastMonthly) : 'not available'}
                    </div>
                  </div>
                </div>

                {/* Middle Graphic: 3D/Glass Rising Bars with Curved Arrow */}
                <div className="hidden sm:flex items-end justify-center px-2 h-16 select-none">
                  <svg className="w-36 h-16 overflow-visible" viewBox="0 0 160 80" fill="none">
                    <defs>
                      <linearGradient id="projBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#C084FC" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="#7E22CE" stopOpacity="0.25" />
                      </linearGradient>
                      <linearGradient id="projArrowGrad" x1="0" y1="1" x2="1" y2="0">
                        <stop offset="0%" stopColor="#818CF8" />
                        <stop offset="100%" stopColor="#E879F9" />
                      </linearGradient>
                      <filter id="projArrowGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#C084FC" floodOpacity="0.6" />
                      </filter>
                    </defs>
                    <rect x="8" y="58" width="16" height="22" rx="4" fill="url(#projBarGrad)" />
                    <rect x="32" y="46" width="16" height="34" rx="4" fill="url(#projBarGrad)" />
                    <rect x="56" y="34" width="16" height="46" rx="4" fill="url(#projBarGrad)" />
                    <rect x="80" y="22" width="16" height="58" rx="4" fill="url(#projBarGrad)" />
                    <rect x="104" y="10" width="16" height="70" rx="4" fill="url(#projBarGrad)" />
                    <path
                      d="M 12 55 Q 60 48, 112 8"
                      stroke="url(#projArrowGrad)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      fill="none"
                      filter="url(#projArrowGlow)"
                    />
                    <path
                      d="M 100 6 L 115 6 L 115 21"
                      stroke="url(#projArrowGrad)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                      filter="url(#projArrowGlow)"
                    />
                  </svg>
                </div>

                {/* Right Column: Growth Badge & Stats */}
                <div className="text-right shrink-0">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+{rate.toFixed(2)}%</span>
                  </div>
                  <div className="text-sm font-bold text-[#10B981] mt-1.5">
                    +{p.hasProfileData ? formatIncomeCompact(monthlyGrowth) : 'not available'} / mo
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {p.hasProfileData ? formatIncomeCompact(forecastAnnual) : 'not available'} / year
                  </div>
                </div>
              </div>

              {/* Footnote */}
              <div className="border-t border-white/[0.06] pt-3 flex items-center gap-2 text-zinc-400 text-xs">
                <Info className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                <span>
                  Annual forecast inflation-adjusted ({rate.toFixed(2)}% rate). Updated yearly on Jan 1st.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Income Mix Health + Distribution Status */}
        <div className="space-y-5">
          {/* 4. INCOME MIX HEALTH Card */}
          <div>
            <SectionHeader
              icon={<PieChart className="w-4 h-4 text-purple-400" />}
              label="INCOME MIX HEALTH"
            />
            <div className="p-5 sm:p-6 rounded-[24px] bg-[#0A0B1A]/95 border border-white/[0.08] shadow-lg backdrop-blur-md space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/35 flex items-center justify-center text-purple-400 shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                  <PieChart className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-sm font-bold text-white">
                  Income Breakdown
                </h3>
              </div>

              {/* Progress Bars */}
              <div className="w-full space-y-3.5 pt-1">
                {/* Active Source Bar */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="text-xs font-semibold text-zinc-300 w-28 shrink-0">
                    Active Source
                  </span>
                  <div className="flex-1 h-2.5 rounded-full bg-zinc-800/80 overflow-hidden relative shadow-inner">
                    <div
                      className="h-full bg-[#38BDF8] rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(56,189,248,0.7)]"
                      style={{
                        width: `${Math.min(100, Math.max(0, activePct))}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-white w-14 text-right shrink-0">
                    {activePct.toFixed(1)}%
                  </span>
                </div>

                {/* Passive Source Bar */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="text-xs font-semibold text-zinc-300 w-28 shrink-0">
                    Passive Source
                  </span>
                  <div className="flex-1 h-2.5 rounded-full bg-zinc-800/80 overflow-hidden relative shadow-inner">
                    <div
                      className="h-full bg-[#A855F7] rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(168,85,247,0.7)]"
                      style={{
                        width: `${Math.min(100, Math.max(0, passivePct))}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-white w-14 text-right shrink-0">
                    {passivePct.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. DISTRIBUTION STATUS Card */}
          <div>
            <SectionHeader
              icon={<Target className="w-4 h-4 text-purple-400" />}
              label="DISTRIBUTION STATUS"
            />
            <div className="p-5 sm:p-6 rounded-[24px] bg-[#0A0B1A]/95 border border-white/[0.08] shadow-lg backdrop-blur-md space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/35 flex items-center justify-center text-purple-400 shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                  <Target className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-sm font-bold text-white">
                  Distribution Health
                </h3>
              </div>

              {/* Multi-color continuous gradient meter bar */}
              <div className="relative h-3 w-full rounded-full bg-gradient-to-r from-[#EF4444] via-[#FACC15] to-[#10B981] my-2 shadow-inner">
                <div
                  className="absolute -top-1 w-5 h-5 rounded-full bg-white border-2 border-slate-900 shadow-[0_0_10px_rgba(255,255,255,0.9)] transition-all duration-500 pointer-events-none"
                  style={{
                    left: `calc(${clampedScore / 100} * (100% - 20px))`,
                  }}
                />
              </div>

              <p className="text-xs italic text-zinc-400 pl-0.5">
                Strategy: Aim for passive income to reach at least 25% of your total earnings.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Full Width Bottom OPTIMIZE NOW Button */}
      <button
        type="button"
        data-testid="income-optimize-btn"
        onClick={() => navigate('/master-data?target=income')}
        className="w-full py-4 rounded-[20px] bg-gradient-to-r from-[#6366F1] via-[#7C3AED] to-[#9333EA] hover:opacity-95 text-white font-black text-xs uppercase tracking-widest shadow-[0_0_25px_rgba(124,58,237,0.4)] transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
      >
        <Sparkles className="w-4 h-4" />
        <span>OPTIMIZE NOW</span>
      </button>
    </div>
  );
};

export default IncomePillarPage;
