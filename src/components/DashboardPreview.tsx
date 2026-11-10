import React, { useState } from 'react';
import logoImg from '../assets/logo.png';
import { AiAssistantFeaturePanel } from './AiAssistantFeaturePanel';
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  TrendingUp,
  PieChart,
  Shield,
  Target,
  Bot,
  HelpCircle,
  Crown,
  Maximize2,
  CheckCircle2,
  Lock,
  Pencil,
} from 'lucide-react';

type TabType = 'Overview' | 'Insights' | 'Investments' | 'Insurance' | 'Goals' | 'AI Assistant';

export const DashboardPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('Overview');

  const sidebarItems: { label: TabType; icon: React.ReactNode }[] = [
    { label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Insights', icon: <TrendingUp className="w-4 h-4" /> },
    { label: 'Investments', icon: <PieChart className="w-4 h-4" /> },
    { label: 'Insurance', icon: <Shield className="w-4 h-4" /> },
    { label: 'Goals', icon: <Target className="w-4 h-4" /> },
    { label: 'AI Assistant', icon: <Bot className="w-4 h-4" /> },
  ];

  {/* ========================================================= */}
  {/* PANEL 1: OVERVIEW */}
  {/* ========================================================= */}
  const renderOverviewPanel = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
      {/* Card 1: Financial Fitness Score */}
      <div className="rounded-2xl bg-[#151226] border border-white/[0.08] p-4 flex flex-col justify-between hover:border-brand-purple/40 transition-all shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-white/70 flex items-center gap-1.5">
            Financial Fitness Score
            <HelpCircle className="w-3.5 h-3.5 text-white/40" />
          </span>
          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold inline-flex items-center gap-1">
            <span>😐</span> AVERAGE
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Donut Gauge */}
          <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r="33"
                stroke="#282245"
                strokeWidth="7"
                fill="none"
              />
              <circle
                cx="40"
                cy="40"
                r="33"
                stroke="url(#dashGaugeGrad)"
                strokeWidth="7"
                strokeDasharray="207.3"
                strokeDashoffset="114.0"
                strokeLinecap="round"
                fill="none"
              />
              <defs>
                <linearGradient id="dashGaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#eab308" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-white leading-none">45</span>
              <span className="text-[8px] font-bold text-white/40 uppercase tracking-tight mt-0.5">OF 100</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold w-fit">
              <span>↑</span> +12 pts from last month
            </span>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Based on spending ratio, investments &amp; debts.
            </p>
          </div>
        </div>
      </div>

      {/* Card 2: Net Financial Position */}
      <div className="rounded-2xl bg-[#151226] border border-white/[0.08] p-4 flex flex-col justify-between hover:border-brand-purple/40 transition-all shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-white/70">
            Net Financial Position
          </span>
          <Maximize2 className="w-3.5 h-3.5 text-emerald-400/80" />
        </div>

        <div className="flex items-end justify-between gap-2">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#22c55e] tracking-tight">
              ₹2,843,000
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs font-bold text-[#22c55e]">
                ↑ ₹18,450 (8.3%)
              </span>
              <span className="text-[10px] text-white/40">
                vs last month
              </span>
            </div>
          </div>

          <div className="w-36 sm:w-44 h-16 relative flex items-end">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 130 55">
              <defs>
                <linearGradient id="dashAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.5" />
                  <stop offset="60%" stopColor="#8b5cf6" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                </linearGradient>
                <filter id="purpleGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#c084fc" floodOpacity="0.8" />
                </filter>
              </defs>

              <path
                d="M0,45 C10,45 14,32 22,32 C28,32 32,40 38,40 C46,40 50,24 58,24 C64,24 68,30 76,30 C84,30 88,14 96,14 C102,14 106,20 114,20 C122,20 124,6 128,6 L128,55 L0,55 Z"
                fill="url(#dashAreaGrad)"
              />

              <path
                d="M0,45 C10,45 14,32 22,32 C28,32 32,40 38,40 C46,40 50,24 58,24 C64,24 68,30 76,30 C84,30 88,14 96,14 C102,14 106,20 114,20 C122,20 124,6 128,6"
                fill="none"
                stroke="#c084fc"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#purpleGlowFilter)"
              />

              <circle cx="22" cy="32" r="2.5" fill="#a855f7" stroke="#ffffff" strokeWidth="1" />
              <circle cx="58" cy="24" r="2.5" fill="#a855f7" stroke="#ffffff" strokeWidth="1" />
              <circle cx="96" cy="14" r="2.5" fill="#c084fc" stroke="#ffffff" strokeWidth="1" />
              <circle cx="128" cy="6" r="4" fill="#ec4899" className="animate-pulse" />
              <circle cx="128" cy="6" r="2" fill="#ffffff" />
            </svg>
          </div>
        </div>
      </div>

      {/* Card 3: Live Gold Rate 24K */}
      <div className="rounded-2xl bg-[#fffbf0] text-slate-900 border border-amber-200/90 p-4 flex items-center justify-between hover:border-amber-400 transition-all shadow-lg">
        <div>
          <span className="block text-[11px] font-bold text-amber-900/80 uppercase tracking-wider">
            Live Gold Rate 24K
          </span>
          <span className="block text-[10px] text-amber-800/60 mb-0.5">
            (per gram)
          </span>
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            ₹15,118
          </span>
          <div className="mt-1 text-[10px] text-amber-700 font-semibold">
            MCX Gold Spot
          </div>
        </div>

        {/* Stacked CSS Gold Bullion Bars */}
        <div className="relative w-28 h-18 flex items-center justify-center">
          <div className="absolute top-1 right-3 w-20 h-9 rounded-md bg-gradient-to-r from-[#d97706] via-[#f59e0b] to-[#fbbf24] shadow-md border-t border-yellow-200/70 transform rotate-[-7deg] flex items-center justify-center">
            <div className="w-16 h-5 rounded border border-amber-900/30 bg-gradient-to-b from-yellow-300/30 to-transparent flex items-center justify-between px-1.5">
              <span className="text-[7px] font-black text-amber-950/80 tracking-tighter">999.9</span>
              <span className="text-[6px] font-extrabold text-amber-950/70">FINE GOLD</span>
            </div>
          </div>

          <div className="absolute bottom-1 right-1 w-22 h-10 rounded-md bg-gradient-to-r from-[#b45309] via-[#f59e0b] to-[#fde047] shadow-xl border-t border-yellow-100/90 flex items-center justify-center z-10">
            <div className="w-18 h-6 rounded border border-amber-950/30 bg-gradient-to-b from-yellow-200/50 to-transparent flex items-center justify-between px-2 shadow-inner">
              <span className="text-[9px] font-black text-amber-950 tracking-tighter">24K</span>
              <div className="flex flex-col items-center">
                <span className="text-[6px] font-bold text-amber-950 leading-none">GOLD</span>
                <span className="text-[5px] text-amber-950/80 font-mono">100g</span>
              </div>
            </div>
            <div className="absolute inset-x-2 top-0.5 h-[1px] bg-white/80 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Card 4: Estimated Spending Limit */}
      <div className="rounded-2xl bg-white text-slate-900 border border-slate-200 p-4 flex items-center justify-between hover:border-indigo-300 transition-all shadow-lg">
        <div>
          <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Estimated Spending Limit
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight my-1">
            ₹13,300 – ₹14,700
          </div>
          <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
            <span className="font-semibold text-slate-600">This Week Tonight</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-emerald-600 font-bold">Safe buffer</span>
          </div>
        </div>

        <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
          <div className="w-13 h-15 rounded-xl bg-slate-100 border border-slate-300 p-1.5 shadow-md flex flex-col justify-between">
            <div className="w-4 h-1.5 bg-slate-400 rounded-full mx-auto"></div>
            <div className="space-y-1 my-1">
              <div className="w-full h-1.5 bg-blue-400 rounded-full"></div>
              <div className="w-3/4 h-1.5 bg-emerald-400 rounded-full"></div>
              <div className="w-1/2 h-1.5 bg-amber-400 rounded-full"></div>
            </div>
            <div className="w-full h-1 bg-slate-300 rounded-full"></div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-500 border-2 border-white shadow flex items-center justify-center text-white">
            <Target className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );

  {/* ========================================================= */}
  {/* PANEL 2: INSIGHTS */}
  {/* ========================================================= */}
  const renderInsightsPanel = () => (
    <div className="space-y-5 text-left">
      {/* Top Stories */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
          <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
            TOP STORIES
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Story 1 */}
          <div className="rounded-2xl bg-[#151226] border border-white/[0.08] p-3.5 flex flex-col justify-between hover:border-purple-500/40 transition-all shadow-lg">
            <div>
              <div className="w-full h-28 sm:h-32 rounded-xl bg-gradient-to-br from-[#1e1a38] to-[#120f24] border border-white/[0.05] mb-3 flex items-center justify-center relative overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400/50">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">
                NEWS SOURCE
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-white leading-snug tracking-tight mb-1.5 line-clamp-2">
                India-born financial journalist rings closing bell of London...
              </h4>
              <p className="text-[11px] text-white/50 leading-relaxed font-normal line-clamp-2">
                Shruti Tripathi Chopra rings London Stock Exchange closing bell, marking...
              </p>
            </div>
            <div className="mt-3 flex justify-end">
              <span className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer inline-flex items-center gap-1">
                Read Story →
              </span>
            </div>
          </div>

          {/* Story 2 */}
          <div className="rounded-2xl bg-[#151226] border border-white/[0.08] p-3.5 flex flex-col justify-between hover:border-purple-500/40 transition-all shadow-lg">
            <div>
              <div className="w-full h-28 sm:h-32 rounded-xl bg-gradient-to-br from-[#1e1a38] to-[#120f24] border border-white/[0.05] mb-3 flex items-center justify-center relative overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400/50">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">
                NEWS SOURCE
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-white leading-snug tracking-tight mb-1.5 line-clamp-2">
                BANKING AND FINANCE NEWS
              </h4>
              <p className="text-[11px] text-white/50 leading-relaxed font-normal line-clamp-2">
                Banking/ Finance News - Get the latest news on banking &amp; finance, money,...
              </p>
            </div>
            <div className="mt-3 flex justify-end">
              <span className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer inline-flex items-center gap-1">
                Read Story →
              </span>
            </div>
          </div>

          {/* Story 3 */}
          <div className="rounded-2xl bg-[#151226] border border-white/[0.08] p-3.5 flex flex-col justify-between hover:border-purple-500/40 transition-all shadow-lg">
            <div>
              <div className="w-full h-28 sm:h-32 rounded-xl bg-gradient-to-br from-[#1e1a38] to-[#120f24] border border-white/[0.05] mb-3 flex items-center justify-center relative overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400/50">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">
                NEWS SOURCE
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-white leading-snug tracking-tight mb-1.5 line-clamp-2">
                OPINION | India&apos;s 16th Finance Commission: Status quo amids...
              </h4>
              <p className="text-[11px] text-white/50 leading-relaxed font-normal line-clamp-2">
                Along with intergovernmental fiscal transfers, 16th Finance Commission...
              </p>
            </div>
            <div className="mt-3 flex justify-end">
              <span className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer inline-flex items-center gap-1">
                Read Story →
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MoneyMapper Picks */}
      <div className="pt-2 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
          <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
            MONEYMAPPER PICKS
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
          {/* Pick 1: THERMAX */}
          <div className="rounded-2xl bg-[#151226] border border-white/[0.08] p-3.5 flex items-center gap-3.5 hover:border-purple-500/40 transition-all shadow-md">
            <div className="w-11 h-11 rounded-xl bg-blue-900/30 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-[9px] font-bold text-blue-300 uppercase tracking-wider inline-block mb-1">
                STOCK
              </span>
              <h4 className="text-sm font-bold text-white tracking-tight">THERMAX</h4>
              <p className="text-xs text-white/50 font-normal">BUY • Score: 70</p>
            </div>
          </div>

          {/* Pick 2: AIAENG */}
          <div className="rounded-2xl bg-[#151226] border border-white/[0.08] p-3.5 flex items-center gap-3.5 hover:border-purple-500/40 transition-all shadow-md">
            <div className="w-11 h-11 rounded-xl bg-blue-900/30 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-[9px] font-bold text-blue-300 uppercase tracking-wider inline-block mb-1">
                STOCK
              </span>
              <h4 className="text-sm font-bold text-white tracking-tight">AIAENG</h4>
              <p className="text-xs text-white/50 font-normal">BUY • Score: 70</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  {/* ========================================================= */}
  {/* PANEL 3: INVESTMENTS */}
  {/* ========================================================= */}
  const renderInvestmentsPanel = () => (
    <div className="space-y-4 text-left">
      {/* Top Card: Global Pillar Score */}
      <div className="rounded-2xl bg-[#151226] border border-white/[0.08] p-5 sm:p-6 flex items-center justify-between shadow-lg">
        <div>
          <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block mb-1">
            GLOBAL PILLAR SCORE
          </span>
          <div className="text-4xl sm:text-5xl font-black text-purple-300 tracking-tight">
            28
          </div>
        </div>
        <div className="flex items-center gap-5 sm:gap-6">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-2 border-blue-500 bg-[#191530] flex items-center justify-center text-sm font-bold text-white shadow-sm">
              46
            </div>
            <span className="text-[11px] text-white/50 text-center mt-1.5 font-medium">
              Asset Mix
            </span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-2 border-emerald-500 bg-[#191530] flex items-center justify-center text-sm font-bold text-white shadow-sm">
              0
            </div>
            <span className="text-[11px] text-white/50 text-center mt-1.5 font-medium">
              SIP Health
            </span>
          </div>
        </div>
      </div>

      {/* Portfolio Breakdown */}
      <div>
        <span className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 block">
          PORTFOLIO BREAKDOWN
        </span>
        <div className="rounded-2xl bg-[#151226] border border-white/[0.08] p-5 sm:p-6 shadow-lg">
          <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06]">
            <span className="text-sm font-medium text-white/70">
              Total Wealth Assets
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#22c55e] tracking-tight">
              ₹70,000
            </span>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {/* Stock */}
            <div className="py-3 flex items-center justify-between first:pt-3.5 last:pb-0">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                <div>
                  <h5 className="text-sm font-bold text-white tracking-tight">Stock</h5>
                  <p className="text-xs text-white/50">High Growth</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-base font-bold text-white">₹20,000</span>
                <Pencil className="w-3.5 h-3.5 text-blue-400" />
              </div>
            </div>

            {/* Mutual Fund */}
            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <div>
                  <h5 className="text-sm font-bold text-white tracking-tight">Mutual Fund</h5>
                  <p className="text-xs text-white/50">Stability</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-base font-bold text-white">₹10,000</span>
                <Pencil className="w-3.5 h-3.5 text-amber-400" />
              </div>
            </div>

            {/* Gold */}
            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0" />
                <div>
                  <h5 className="text-sm font-bold text-white tracking-tight">Gold</h5>
                  <p className="text-xs text-white/50">Hedge</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-base font-bold text-white">₹40,000</span>
                <Pencil className="w-3.5 h-3.5 text-yellow-400" />
              </div>
            </div>

            {/* Real Estate */}
            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shrink-0" />
                <div>
                  <h5 className="text-sm font-bold text-white tracking-tight">Real Estate</h5>
                  <p className="text-xs text-white/50">Passive Assets</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-base font-bold text-white">₹0</span>
                <Pencil className="w-3.5 h-3.5 text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  {/* ========================================================= */}
  {/* PANEL 4: INSURANCE */}
  {/* ========================================================= */}
  const renderInsurancePanel = () => (
    <div className="space-y-4 text-left">
      {/* Top Card: Protection Score */}
      <div className="rounded-2xl bg-[#151226] border border-white/[0.08] p-5 sm:p-6 flex items-center justify-between shadow-lg">
        <div>
          <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block mb-1">
            PROTECTION SCORE
          </span>
          <div className="text-4xl sm:text-5xl font-black text-purple-300 tracking-tight">
            36
          </div>
        </div>
        <div className="flex items-center gap-5 sm:gap-6">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-2 border-blue-500 bg-[#191530] flex items-center justify-center text-sm font-bold text-white shadow-sm">
              56
            </div>
            <span className="text-[11px] text-white/50 text-center mt-1.5 font-medium">
              Life
            </span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-2 border-teal-400 bg-[#191530] flex items-center justify-center text-sm font-bold text-white shadow-sm">
              17
            </div>
            <span className="text-[11px] text-white/50 text-center mt-1.5 font-medium">
              Health
            </span>
          </div>
        </div>
      </div>

      {/* Active Coverage */}
      <div>
        <span className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 block">
          ACTIVE COVERAGE
        </span>
        <div className="rounded-2xl bg-[#151226] border border-white/[0.08] p-4 sm:p-5 shadow-lg space-y-3.5">
          {/* Term Insurance */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
              <div>
                <h5 className="text-sm font-bold text-white tracking-tight">Term Insurance</h5>
                <p className="text-xs text-white/50">Life Protection</p>
              </div>
            </div>
            <span className="text-base sm:text-lg font-bold text-white font-mono">₹10000.0L</span>
          </div>

          {/* Health Insurance */}
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shrink-0" />
              <div>
                <h5 className="text-sm font-bold text-white tracking-tight">Health Insurance</h5>
                <p className="text-xs text-white/50">Medical Shield</p>
              </div>
            </div>
            <span className="text-base sm:text-lg font-bold text-white font-mono">₹1000.0L</span>
          </div>
        </div>
      </div>

      {/* Protection Health */}
      <div>
        <span className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 block">
          PROTECTION HEALTH
        </span>
        <div className="rounded-2xl bg-[#151226] border border-white/[0.08] p-4 sm:p-5 shadow-lg">
          <h5 className="text-sm font-bold text-white mb-3">Coverage Health</h5>

          {/* Life Cover Score */}
          <div className="mb-3.5">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-white/80">Life Cover Score</span>
              <span className="text-blue-400">56/100</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#1e1935] overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '56%' }} />
            </div>
          </div>

          {/* Health Cover Score */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-white/80">Health Cover Score</span>
              <span className="text-teal-400">17/100</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#1e1935] overflow-hidden">
              <div className="h-full bg-teal-400 rounded-full" style={{ width: '17%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  {/* ========================================================= */}
  {/* PANEL 5: GOALS */}
  {/* ========================================================= */}
  const renderGoalsPanel = () => (
    <div className="space-y-4 text-left">
      {/* Top Card: Expense Score */}
      <div className="rounded-2xl bg-[#151226] border border-white/[0.08] p-5 sm:p-6 flex items-center justify-between shadow-lg">
        <div>
          <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block mb-1">
            EXPENSE SCORE
          </span>
          <div className="text-4xl sm:text-5xl font-black text-purple-300 tracking-tight">
            79
          </div>
        </div>
        <div className="flex items-center gap-5 sm:gap-6">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-2 border-purple-500 bg-[#191530] flex items-center justify-center text-sm font-bold text-white shadow-sm">
              79
            </div>
            <span className="text-[11px] text-white/50 text-center mt-1.5 font-medium">
              Discipline
            </span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-2 border-teal-400 bg-[#191530] flex items-center justify-center text-sm font-bold text-white shadow-sm">
              1/5
            </div>
            <span className="text-[11px] text-white/50 text-center mt-1.5 font-medium">
              Hit Rate
            </span>
          </div>
        </div>
      </div>

      {/* 5 Week Buttons Row */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {/* Week 1 */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#151226] p-2.5 sm:p-3 text-center flex flex-col items-center justify-center">
          <span className="text-xs text-white/60 mb-1.5">Week 1</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>

        {/* Week 2 (Selected) */}
        <div className="rounded-2xl border border-indigo-500/70 bg-gradient-to-br from-indigo-600 to-purple-600 p-2.5 sm:p-3 text-center flex flex-col items-center justify-center shadow-lg shadow-indigo-600/30">
          <span className="text-xs font-bold text-white mb-0.5">Week 2</span>
          <span className="text-[11px] font-semibold text-white/95">Nov 8</span>
        </div>

        {/* Week 3 */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#151226] p-2.5 sm:p-3 text-center flex flex-col items-center justify-center">
          <span className="text-xs text-white/60 mb-0.5">Week 3</span>
          <span className="text-[11px] text-white/40">Nov 15</span>
        </div>

        {/* Week 4 */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#151226] p-2.5 sm:p-3 text-center flex flex-col items-center justify-center text-white/30">
          <span className="text-xs text-white/40 mb-1">Week 4</span>
          <Lock className="w-3.5 h-3.5 text-white/30" />
        </div>

        {/* Week 5 */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#151226] p-2.5 sm:p-3 text-center flex flex-col items-center justify-center text-white/30">
          <span className="text-xs text-white/40 mb-1">Week 5</span>
          <Lock className="w-3.5 h-3.5 text-white/30" />
        </div>
      </div>

      {/* Week 2 Target Overview Card */}
      <div className="rounded-2xl bg-[#151226] border border-white/[0.08] p-5 sm:p-6 shadow-lg">
        <div className="flex items-center justify-between mb-1">
          <h5 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Week 2 Target Overview
          </h5>
          <span className="px-2.5 py-0.5 rounded-full bg-purple-900/40 border border-purple-500/30 text-[10px] font-bold text-purple-300 uppercase tracking-wider">
            CURRENT WEEK
          </span>
        </div>
        <p className="text-xs text-white/40 mb-5">Nov 8 – Nov 14</p>

        <div className="space-y-3.5">
          {/* Fixed Expenses */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
              <span className="text-sm font-medium text-white">Fixed Expenses</span>
            </div>
            <span className="text-xs sm:text-sm text-white/70 font-mono">
              Range: ₹10,75,000 – ₹11,75,000
            </span>
          </div>

          {/* Flexible Expenses */}
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span className="text-sm font-medium text-white">Flexible Expenses</span>
            </div>
            <span className="text-xs sm:text-sm text-white/70 font-mono">
              Range: ₹8,25,000 – ₹9,25,000
            </span>
          </div>

          {/* Savings Goal */}
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-sm font-medium text-white">Savings Goal</span>
            </div>
            <span className="text-xs sm:text-sm text-white/70 font-mono">
              Range: ₹6,21,000 – ₹7,29,000
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full rounded-3xl bg-[#0b0818] border border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.85),0_0_100px_rgba(139,92,246,0.12)] p-4 sm:p-5 lg:p-6 overflow-hidden select-none">
      {/* Dashboard Inner Shell: Sidebar + Main Content */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left Mini Sidebar */}
        <aside className="w-full lg:w-48 xl:w-52 shrink-0 flex flex-col lg:border-r border-white/[0.08] pr-0 lg:pr-4">
          {/* Logo & Brand in Sidebar */}
          <div className="flex items-center gap-2 mb-3 lg:mb-4 px-2 shrink-0">
            <img
              src={logoImg}
              alt="Logo"
              className="w-5 h-5 object-contain"
            />
            <span className="text-sm font-bold text-white tracking-tight">MoneyMapper</span>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[8px] font-extrabold rounded-full bg-gradient-to-r from-brand-purple to-brand-magenta text-white uppercase tracking-wider">
              <Crown className="w-2 h-2" />
              PREMIUM
            </span>
          </div>

          {/* Sidebar Nav Items: Horizontal on mobile, vertical on desktop */}
          <div className="flex flex-row lg:flex-col gap-1 w-full overflow-x-auto pb-2 lg:pb-0 no-scrollbar shrink-0">
            {sidebarItems.map((item) => {
              const isSelected = activeTab === item.label;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setActiveTab(item.label)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer text-left shrink-0 ${
                    isSelected
                      ? 'bg-purple-900/40 text-brand-purple border border-purple-500/30 font-semibold shadow-sm'
                      : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Main Dashboard Area */}
        <main className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Top Bar: Dropdown + Bell + Profile */}
          <div className="flex items-center justify-end gap-3 pb-1 border-b border-white/[0.04]">
            {/* "This Month ▾" Pill Dropdown */}
            <div
              id="dashboard-date-filter-btn"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#161327] border border-white/10 text-xs font-medium text-white/80"
            >
              <span>This Month</span>
              <ChevronDown className="w-3.5 h-3.5 text-white/50" />
            </div>

            {/* Notification Bell */}
            <div
              id="dashboard-bell-btn"
              className="relative p-2 rounded-xl bg-[#161327] border border-white/10 text-white/70"
              aria-hidden="true"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-[#161327]"></span>
            </div>

            {/* User Profile Avatar */}
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-magenta flex items-center justify-center text-xs font-bold text-white shadow-md">
              S
            </div>
          </div>

          {/* Active Content Panel */}
          <div key={activeTab} className="min-h-[440px] flex flex-col justify-start transition-opacity duration-200">
            {activeTab === 'Overview' && renderOverviewPanel()}
            {activeTab === 'Insights' && renderInsightsPanel()}
            {activeTab === 'Investments' && renderInvestmentsPanel()}
            {activeTab === 'Insurance' && renderInsurancePanel()}
            {activeTab === 'Goals' && renderGoalsPanel()}
            {activeTab === 'AI Assistant' && <AiAssistantFeaturePanel />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPreview;
