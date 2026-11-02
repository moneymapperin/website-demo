import React, { useState } from 'react';
import logoImg from '../assets/logo.png';
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  TrendingUp,
  PieChart,
  Shield,
  Target,
  Receipt,
  Bot,
  Settings,
  HelpCircle,
  Crown,
  Maximize2,
  Wallet,
  CreditCard,
  Umbrella,
  ArrowUpRight,
  ArrowDownRight,
  QrCode,
  Calculator,
  Flame,
  CheckCircle2,
  Sparkles,
  Lock,
} from 'lucide-react';
import { navigateTo } from '../lib/navigation';

export const DashboardPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState('This Month');
  const [hoveredChartPoint, setHoveredChartPoint] = useState<number | null>(null);

  // Interactive Live Calculator state inside dashboard preview
  const [calcIncome, setCalcIncome] = useState<number>(110000);
  const [calcExpenses, setCalcExpenses] = useState<number>(48000);

  const calcSurplus = Math.max(0, calcIncome - calcExpenses);
  const calcEmergencyTarget = calcExpenses * 6;
  const calcEmergencyCurrent = 310000;
  const calcEmergencyPercent = Math.min(100, Math.round((calcEmergencyCurrent / calcEmergencyTarget) * 100));
  const calcSipRecommended = Math.round(calcSurplus * 0.4);

  const sidebarItems = [
    { label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Investments', icon: <PieChart className="w-4 h-4" /> },
    { label: 'Insurance', icon: <Shield className="w-4 h-4" /> },
    { label: 'Goals', icon: <Target className="w-4 h-4" /> },
    { label: 'Transactions', icon: <Receipt className="w-4 h-4" /> },
    { label: 'AI Assistant', icon: <Bot className="w-4 h-4" /> },
    { label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const pillarScores = [
    { name: 'Income', score: 85, metric: '₹1.10L / mo', icon: <Wallet className="w-3.5 h-3.5 text-emerald-400" />, color: 'text-emerald-400', barColor: 'bg-emerald-400' },
    { name: 'Expenses', score: 72, metric: '85% Hit Rate', icon: <CreditCard className="w-3.5 h-3.5 text-amber-400" />, color: 'text-amber-400', barColor: 'bg-amber-400' },
    { name: 'Emergency', score: 80, metric: '6.2 mo Runway', icon: <Shield className="w-3.5 h-3.5 text-teal-400" />, color: 'text-teal-400', barColor: 'bg-teal-400' },
    { name: 'Protection', score: 75, metric: '₹1.5 Cr Cover', icon: <Umbrella className="w-3.5 h-3.5 text-purple-400" />, color: 'text-purple-400', barColor: 'bg-purple-400' },
    { name: 'Investment', score: 78, metric: '₹15,000 SIP', icon: <TrendingUp className="w-3.5 h-3.5 text-blue-400" />, color: 'text-blue-400', barColor: 'bg-blue-400' },
  ];

  const screenerScores = [
    { title: 'Stock Score', score: '75', total: '100', subtitle: 'NIFTY 500 COMPANIES', action: 'Buy / Sell Signals', color: 'text-emerald-400', border: 'border-emerald-500/30' },
    { title: 'Mutual Fund Score', score: '82', total: '100', subtitle: '3,000+ MUTUAL FUNDS', action: 'Top Performing Funds', color: 'text-blue-400', border: 'border-blue-500/30' },
    { title: 'Insurance Score', score: '83', total: '100', subtitle: '83 LIFE & HEALTH PLANS', action: 'Best Plans for You', color: 'text-purple-400', border: 'border-purple-500/30' },
    { title: 'IPO Score', score: '78', total: '100', subtitle: 'UPCOMING IPOs', action: 'Listing Day Analysis', color: 'text-amber-400', border: 'border-amber-500/30' },
  ];

  const chartPoints = [
    { x: 22, y: 32, label: 'Week 1', value: '₹26.85L' },
    { x: 58, y: 24, label: 'Week 2', value: '₹27.40L' },
    { x: 96, y: 14, label: 'Week 3', value: '₹28.12L' },
    { x: 128, y: 6, label: 'Week 4', value: '₹28.43L (+8.3%)' },
  ];

  const recentTransactions = [
    { name: 'Tata Consultancy Services', category: 'Salary Credit', amount: '+₹95,000', type: 'inflow', time: 'Today, 10:15 AM' },
    { name: 'Nature\'s Basket Supermarket', category: 'Groceries & Home', amount: '-₹3,420', type: 'outflow', time: 'Yesterday, 6:40 PM' },
    { name: 'Nippon India Large Cap Fund', category: 'Mutual Fund SIP', amount: '-₹15,000', type: 'outflow', time: '01 Nov, 9:00 AM' },
    { name: 'HDFC ERGO Health Insurance', category: 'Health Premium', amount: '-₹1,850', type: 'outflow', time: '28 Oct, 3:15 PM' },
  ];

  return (
    <div
      id="dashboard-preview"
      className="scroll-mt-24 w-full rounded-3xl bg-gradient-to-b from-[#120e24] via-[#0c0919] to-[#070512] border border-white/[0.12] shadow-[0_30px_90px_rgba(0,0,0,0.85),0_0_120px_rgba(139,92,246,0.18)] p-3 sm:p-5 lg:p-7 overflow-hidden select-none transition-all"
    >
      {/* macOS Style Window Frame Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-white/[0.08]">
        {/* Left: Window Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] inline-block shadow-sm" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] inline-block shadow-sm" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] inline-block shadow-sm" />
          </div>

          {/* Browser Address Bar with Lock */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[11px] text-white/50 font-mono">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span className="text-white/70">https://</span>
            <span>app.moneymapper.in</span>
            <span className="text-purple-300 font-semibold">/dashboard</span>
          </div>
        </div>

        {/* Right: Live Sync & Action Pill */}
        <div className="flex items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Mobile App Synced</span>
          </div>

          <button
            onClick={() => navigateTo('/register')}
            className="px-4 py-1.5 rounded-xl bg-brand-gradient hover:opacity-95 text-white font-semibold text-xs shadow-md shadow-brand-purple/20 transition-all cursor-pointer flex items-center gap-1"
          >
            <span>Launch Live App</span>
            <Sparkles className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Dashboard Inner Shell: Sidebar + Main Content */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left Mini Sidebar */}
        <aside className="w-full lg:w-48 xl:w-52 shrink-0 flex flex-row lg:flex-col justify-between lg:justify-start gap-1 pb-3 lg:pb-0 lg:border-r border-white/[0.08] pr-0 lg:pr-4 overflow-x-auto no-scrollbar">
          {/* Logo & Brand in Sidebar */}
          <div className="flex items-center gap-2.5 mb-4 px-2 shrink-0">
            <img src={logoImg} alt="MoneyMapper" className="w-6 h-6 object-contain drop-shadow" />
            <div>
              <span className="text-sm font-bold text-white tracking-tight block leading-tight">
                MoneyMapper
              </span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[8px] font-extrabold rounded-full bg-gradient-to-r from-amber-500 to-brand-purple text-white uppercase tracking-wider">
                <Crown className="w-2 h-2" />
                PREMIUM
              </span>
            </div>
          </div>

          {/* Sidebar Nav Items */}
          <div className="flex flex-row lg:flex-col gap-1 w-full shrink-0">
            {sidebarItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setActiveTab(item.label)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer text-left ${
                  activeTab === item.label
                    ? 'bg-purple-600/25 text-purple-200 border border-purple-500/40 font-semibold shadow-inner'
                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Quick Pro Upgrade Teaser in Sidebar */}
          <div className="hidden lg:block mt-auto p-3 rounded-2xl bg-gradient-to-br from-purple-900/30 to-fuchsia-950/20 border border-purple-500/20 text-xs">
            <div className="flex items-center gap-1.5 text-purple-300 font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Wealth Select</span>
            </div>
            <p className="text-[10px] text-white/50 leading-relaxed">
              All 5 pillars, AI copilot & screeners unlocked.
            </p>
          </div>
        </aside>

        {/* Right Main Dashboard Area */}
        <main className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Top Bar: Dropdown + Bell + Profile */}
          <div className="flex items-center justify-between gap-3 pb-2 border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Personal Financial Command Center
              </h3>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-bold">
                Live Overview
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* "This Month ▾" Pill Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  id="dashboard-date-filter-btn"
                  onClick={() => setDateFilterOpen(!dateFilterOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#161327] hover:bg-[#1e1936] border border-white/10 hover:border-white/25 text-xs font-medium text-white/80 transition-colors cursor-pointer"
                >
                  <span>{selectedRange}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-white/50" />
                </button>
                {dateFilterOpen && (
                  <div className="absolute right-0 mt-1 w-36 rounded-xl bg-[#161327] border border-white/15 p-1 z-30 shadow-2xl text-xs">
                    {['This Week', 'This Month', 'Last 90 Days', 'Year to Date'].map((range) => (
                      <button
                        key={range}
                        onClick={() => {
                          setSelectedRange(range);
                          setDateFilterOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Notification Bell */}
              <div
                id="dashboard-bell-btn"
                className="relative p-2 rounded-xl bg-[#161327] border border-white/10 text-white/70"
                aria-hidden="true"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#161327] animate-pulse" />
              </div>

              {/* User Profile Avatar */}
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-magenta flex items-center justify-center text-xs font-bold text-white shadow-md ring-1 ring-white/20">
                S
              </div>
            </div>
          </div>

          {/* 2x2 Grid of Main Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Financial Fitness Score */}
            <div className="rounded-2xl bg-gradient-to-b from-[#18142c] to-[#120e24] border border-white/[0.09] p-4 sm:p-5 flex flex-col justify-between hover:border-brand-purple/50 transition-all shadow-xl group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-white/70 flex items-center gap-1.5 tracking-wide uppercase">
                  Financial Fitness Score
                  <HelpCircle className="w-3.5 h-3.5 text-white/40 group-hover:text-white/70 transition-colors" />
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold inline-flex items-center gap-1">
                  <span>😐</span> AVERAGE
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* Donut Gauge with Centered Score */}
                <div className="relative w-22 h-22 shrink-0 flex items-center justify-center">
                  <svg className="w-22 h-22 -rotate-90" viewBox="0 0 88 88">
                    <circle cx="44" cy="44" r="36" stroke="#251d3d" strokeWidth="8" fill="none" />
                    <circle
                      cx="44"
                      cy="44"
                      r="36"
                      stroke="url(#dashGaugeGrad)"
                      strokeWidth="8"
                      strokeDasharray="226.2"
                      strokeDashoffset="124.4"
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
                    <span className="text-2xl font-black text-white leading-none font-mono">45</span>
                    <span className="text-[8px] font-bold text-white/40 uppercase tracking-tight mt-0.5">OF 100</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold w-fit">
                    <span>↑</span> +12 pts from last month
                  </span>
                  <p className="text-[11px] text-white/55 leading-relaxed">
                    Based on spending ratio, investments, debt burden &amp; emergency runway.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: Net Financial Position with Interactive Chart */}
            <div className="rounded-2xl bg-gradient-to-b from-[#18142c] to-[#120e24] border border-white/[0.09] p-4 sm:p-5 flex flex-col justify-between hover:border-brand-purple/50 transition-all shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-white/70 uppercase tracking-wide">
                  Net Financial Position
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Real-time</span>
                </span>
              </div>

              <div className="flex items-end justify-between gap-2">
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-[#22c55e] tracking-tight font-mono">
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

                {/* Interactive Stock Market Graph */}
                <div className="w-36 sm:w-44 h-16 relative flex items-end">
                  {hoveredChartPoint !== null && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-purple-900 border border-purple-400 text-[9px] text-white font-mono whitespace-nowrap shadow-lg z-20">
                      {chartPoints[hoveredChartPoint].label}: {chartPoints[hoveredChartPoint].value}
                    </div>
                  )}
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
                    {chartPoints.map((pt, idx) => (
                      <circle
                        key={idx}
                        cx={pt.x}
                        cy={pt.y}
                        r={hoveredChartPoint === idx ? 4.5 : 2.5}
                        fill={idx === 3 ? '#ec4899' : '#a855f7'}
                        stroke="#ffffff"
                        strokeWidth="1"
                        className="cursor-pointer transition-all"
                        onMouseEnter={() => setHoveredChartPoint(idx)}
                        onMouseLeave={() => setHoveredChartPoint(null)}
                      />
                    ))}
                    <circle cx="128" cy="6" r="4.5" fill="#ec4899" className="animate-pulse pointer-events-none" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Card 3: Live Gold Rate 24K */}
            <div className="rounded-2xl bg-[#fffbf0] text-slate-900 border border-amber-300/90 p-4 sm:p-5 flex items-center justify-between hover:border-amber-400 transition-all shadow-xl group">
              <div>
                <span className="block text-[11px] font-bold text-amber-900/80 uppercase tracking-wider">
                  Live Gold Rate 24K
                </span>
                <span className="block text-[10px] text-amber-800/60 mb-0.5 font-medium">
                  (per gram)
                </span>
                <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                  ₹15,118
                </span>
                <div className="mt-1 text-[10px] text-amber-800 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  <span>MCX Gold Spot • 24K 999.9 Pure</span>
                </div>
              </div>

              {/* Stacked CSS 3D Gold Bullion Bars */}
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
                  <div className="absolute inset-x-2 top-0.5 h-[1px] bg-white/80 rounded-full" />
                </div>
              </div>
            </div>

            {/* Card 4: Estimated Spending Limit */}
            <div className="rounded-2xl bg-white text-slate-900 border border-slate-200 p-4 sm:p-5 flex items-center justify-between hover:border-indigo-400 transition-all shadow-xl group">
              <div>
                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Estimated Spending Limit
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight my-1 font-mono">
                  ₹13,300 – ₹14,700
                </div>
                <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                  <span className="font-semibold text-slate-600">This Week Tonight</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-emerald-600 font-bold">Safe buffer</span>
                </div>
              </div>

              {/* Graphic Target Clipboard */}
              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                <div className="w-13 h-15 rounded-xl bg-slate-100 border border-slate-300 p-1.5 shadow-md flex flex-col justify-between">
                  <div className="w-4 h-1.5 bg-slate-400 rounded-full mx-auto" />
                  <div className="space-y-1 my-1">
                    <div className="w-full h-1.5 bg-blue-400 rounded-full" />
                    <div className="w-3/4 h-1.5 bg-emerald-400 rounded-full" />
                    <div className="w-1/2 h-1.5 bg-amber-400 rounded-full" />
                  </div>
                  <div className="w-full h-1 bg-slate-300 rounded-full" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-500 border-2 border-white shadow flex items-center justify-center text-white">
                  <Target className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Row 5: MoneyMapper Score Cards (2x2 Screener Matrix) */}
          <div>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <span className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>MoneyMapper Screener Score Cards</span>
              </span>
              <span className="text-[10px] text-purple-300 font-semibold">
                Real-Time Signals
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {screenerScores.map((screener) => (
                <div
                  key={screener.title}
                  className={`rounded-2xl bg-[#141124] border ${screener.border} p-3.5 flex flex-col justify-between hover:bg-[#18142a] hover:scale-[1.02] transition-all shadow-md cursor-pointer`}
                >
                  <div>
                    <span className="text-[11px] font-semibold text-white/70 block">
                      {screener.title}
                    </span>
                    <span className="text-[9px] text-white/40 block mt-0.5">
                      {screener.subtitle}
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className={`text-xl font-black font-mono ${screener.color}`}>
                      {screener.score} <span className="text-[10px] text-white/40 font-normal">/{screener.total}</span>
                    </span>
                    <span className="text-[9px] text-emerald-400 font-medium">
                      {screener.action}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Row 6: Interactive Live Financial Calculator with Interactive Sliders */}
          <div className="rounded-2xl bg-[#141124] border border-purple-500/30 p-4 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-white/95 uppercase tracking-wide">
                  Live Financial Calculator &amp; Allocator
                </span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[9px] font-bold">
                  Interactive Preview
                </span>
              </div>
              <span className="text-[10px] text-white/40 hidden sm:inline">
                Slide to test cashflow scenarios
              </span>
            </div>

            {/* Live Interactive Sliders Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] mb-3">
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-white/60 font-medium">Monthly Inflow (Salary + Active)</span>
                  <span className="font-mono font-bold text-emerald-400">₹{calcIncome.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="250000"
                  step="5000"
                  value={calcIncome}
                  onChange={(e) => setCalcIncome(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-white/60 font-medium">Monthly Living Expenses</span>
                  <span className="font-mono font-bold text-amber-400">₹{calcExpenses.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="20000"
                  max="150000"
                  step="2000"
                  value={calcExpenses}
                  onChange={(e) => setCalcExpenses(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Dynamic Equation Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 p-3 rounded-xl bg-black/40 border border-white/[0.08] text-center mb-3">
              <div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">INCOME</span>
                <span className="text-base font-black text-white font-mono">₹{calcIncome.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-t md:border-t-0 md:border-l border-white/10 pt-2 md:pt-0">
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">EXPENSES</span>
                <span className="text-base font-black text-white font-mono">₹{calcExpenses.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-t md:border-t-0 md:border-l border-white/10 pt-2 md:pt-0">
                <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider block">AVAILABLE SURPLUS</span>
                <span className="text-base font-black text-[#22c55e] font-mono">₹{calcSurplus.toLocaleString('en-IN')} / mo</span>
              </div>
            </div>

            {/* Bottom Row: Emergency Fund Runway + SIP Recommendation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-white/70">EMERGENCY FUND RUNWAY</span>
                  <span className="text-[10px] text-teal-400 font-bold font-mono">{calcEmergencyPercent}% Funded</span>
                </div>
                <div className="text-sm font-bold text-white font-mono">
                  ₹{calcEmergencyCurrent.toLocaleString('en-IN')} <span className="text-xs text-white/40 font-normal">/ ₹{calcEmergencyTarget.toLocaleString('en-IN')} target</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-teal-400 h-full transition-all duration-300"
                    style={{ width: `${calcEmergencyPercent}%` }}
                  />
                </div>
                <span className="text-[9px] text-white/40 mt-1 block">Target: 6 Months Survival Expenses</span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white/70">RECOMMENDED MONTHLY SIP</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[9px] font-bold">40% SURPLUS</span>
                </div>
                <div className="text-sm font-bold text-white font-mono mt-1">
                  ₹{calcSipRecommended.toLocaleString('en-IN')} / month
                </div>
                <div className="flex justify-between text-[9px] text-white/50 mt-2 pt-1 border-t border-white/[0.06]">
                  <span>Stocks 50%</span>
                  <span>MFs 30%</span>
                  <span>Gold 15%</span>
                  <span>Debt 5%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 7: 5 Pillars Quick Status Strip */}
          <div className="rounded-2xl bg-[#141124] border border-white/[0.08] p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
                5 Pillars Performance Health
              </span>
              <span className="text-[10px] text-white/40">
                Audit Status: Active
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {pillarScores.map((pillar) => (
                <div
                  key={pillar.name}
                  className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-2.5 flex flex-col justify-between hover:border-purple-500/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                      {pillar.icon}
                      <span>{pillar.name}</span>
                    </span>
                    <span className={`text-xs font-black font-mono ${pillar.color}`}>
                      {pillar.score}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pillar.barColor}`}
                      style={{ width: `${pillar.score}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-white/40 mt-1 font-mono">
                    {pillar.metric}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Row 8: Recent Transactions & Weekly Discipline Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Recent Transactions List */}
            <div className="lg:col-span-7 rounded-2xl bg-[#141124] border border-white/[0.08] p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-white/80">
                  Recent Verified Activity
                </span>
                <span className="text-[10px] text-purple-300 font-semibold cursor-pointer">
                  View All (42)
                </span>
              </div>
              <div className="space-y-2">
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.name}
                    className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          tx.type === 'inflow'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-white/10 text-white/70'
                        }`}
                      >
                        {tx.type === 'inflow' ? (
                          <ArrowDownRight className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-medium text-white truncate">
                          {tx.name}
                        </div>
                        <div className="text-[10px] text-white/40">
                          {tx.category} • {tx.time}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold font-mono shrink-0 ml-2 ${
                        tx.type === 'inflow' ? 'text-emerald-400' : 'text-white/90'
                      }`}
                    >
                      {tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Spending Discipline Status */}
            <div className="lg:col-span-5 rounded-2xl bg-[#141124] border border-white/[0.08] p-4 shadow-lg flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-white/80 block mb-1">
                  Weekly Budget Pace
                </span>
                <span className="text-[10px] text-white/40">
                  Target: Maintain safe buffer through Sunday
                </span>

                <div className="mt-4">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-lg font-black text-white font-mono">
                      ₹11,400
                    </span>
                    <span className="text-xs text-white/50">
                      of ₹14,000 cap
                    </span>
                  </div>

                  <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-500 w-[81%]" />
                  </div>

                  <div className="flex justify-between items-center text-[10px] mt-2">
                    <span className="text-emerald-400 font-bold">
                      ● ₹2,600 Safe Buffer Left
                    </span>
                    <span className="text-white/40">3 Days Remaining</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-purple-900/20 border border-purple-500/20 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-purple-200">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Discipline Streak: <strong className="text-white">4 Weeks</strong></span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>On Target</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPreview;
