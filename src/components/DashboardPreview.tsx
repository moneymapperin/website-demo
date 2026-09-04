import { useComingSoon } from '../context/ComingSoonContext';
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
  LayoutGrid,
  Flame,
  Maximize2
} from 'lucide-react';

export const DashboardPreview: React.FC = () => {
  const { openComingSoon } = useComingSoon();

  const sidebarItems = [
    { label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" />, active: true },
    { label: 'Insights', icon: <TrendingUp className="w-4 h-4" /> },
    { label: 'Investments', icon: <PieChart className="w-4 h-4" /> },
    { label: 'Insurance', icon: <Shield className="w-4 h-4" /> },
    { label: 'Goals', icon: <Target className="w-4 h-4" /> },
    { label: 'Transactions', icon: <Receipt className="w-4 h-4" /> },
    { label: 'AI Assistant', icon: <Bot className="w-4 h-4" /> },
    { label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const scoreCards = [
    {
      title: 'Stock Score',
      score: '75',
      caption: 'NIFTY 50 Companies',
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
      icon: <TrendingUp className="w-4 h-4" />,
      stroke: '#34d399',
      path: 'M0,17 C4,17 7,11 11,11 C15,11 17,19 22,19 C27,19 30,8 35,8 C39,8 43,15 47,15 C49,15 51,5 54,2',
      endPoint: { x: 54, y: 2 },
    },
    {
      title: 'Mutual Fund Score',
      score: '82',
      caption: 'Top Performing Funds',
      color: 'text-blue-400',
      badgeBg: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
      icon: <LayoutGrid className="w-4 h-4" />,
      stroke: '#60a5fa',
      path: 'M0,18 C5,18 8,10 13,10 C17,10 20,18 25,18 C29,18 33,6 39,6 C43,6 46,12 50,12 C52,12 53,5 54,3',
      endPoint: { x: 54, y: 3 },
    },
    {
      title: 'Insurance Score',
      score: '83',
      caption: '32 Life & Health Plans',
      color: 'text-purple-400',
      badgeBg: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
      icon: <Shield className="w-4 h-4" />,
      stroke: '#c084fc',
      path: 'M0,16 C5,16 8,19 13,19 C18,19 21,8 27,8 C32,8 35,16 41,16 C45,16 48,7 54,4',
      endPoint: { x: 54, y: 4 },
    },
    {
      title: 'IPO Score',
      score: '78',
      caption: 'Upcoming IPOs',
      color: 'text-amber-400',
      badgeBg: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
      icon: <Flame className="w-4 h-4" />,
      stroke: '#fbbf24',
      path: 'M0,19 C4,19 7,7 13,7 C17,7 20,18 26,18 C31,18 35,9 41,9 C45,9 48,14 54,3',
      endPoint: { x: 54, y: 3 },
    },
  ];

  return (
    <div className="w-full rounded-3xl bg-[#0b0818] border border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.85),0_0_100px_rgba(139,92,246,0.12)] p-4 sm:p-5 lg:p-6 overflow-hidden select-none">
      
      {/* Dashboard Inner Shell: Sidebar + Main Content */}
      <div className="flex flex-col lg:flex-row gap-5">
        
        {/* Left Mini Sidebar */}
        <aside className="w-full lg:w-48 xl:w-52 shrink-0 flex flex-row lg:flex-col justify-between lg:justify-start gap-1 pb-3 lg:pb-0 lg:border-r border-white/[0.08] pr-0 lg:pr-4 overflow-x-auto no-scrollbar">
          
          {/* Logo & Brand in Sidebar */}
          <div
            onClick={() => openComingSoon('MoneyMapper Pro')}
            className="flex items-center gap-2 mb-4 px-2 cursor-pointer shrink-0"
          >
            <img
              src="/src/assets/logo.png"
              alt="Logo"
              className="w-5 h-5 object-contain"
            />
            <span className="text-sm font-bold text-white tracking-tight">MoneyMapper</span>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[8px] font-extrabold rounded-full bg-gradient-to-r from-brand-purple to-brand-magenta text-white uppercase tracking-wider">
              <Crown className="w-2 h-2" />
              PREMIUM
            </span>
          </div>

          {/* Sidebar Nav Items */}
          <div className="flex flex-row lg:flex-col gap-1 w-full shrink-0">
            {sidebarItems.map((item) => (
              <button
                key={item.label}
                onClick={() => openComingSoon(`Dashboard: ${item.label}`)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  item.active
                    ? 'bg-purple-900/40 text-brand-purple border border-purple-500/30 font-semibold shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

        </aside>

        {/* Right Main Dashboard Area */}
        <main className="flex-1 flex flex-col gap-4 min-w-0">
          
          {/* Top Bar: Dropdown + Bell + Profile */}
          <div className="flex items-center justify-end gap-3 pb-1 border-b border-white/[0.04]">
            {/* "This Month ▾" Pill Dropdown */}
            <button
              id="dashboard-date-filter-btn"
              onClick={() => openComingSoon('Date Range: This Month')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#161327] border border-white/10 hover:border-white/20 text-xs font-medium text-white/80 transition-all cursor-pointer"
            >
              <span>This Month</span>
              <ChevronDown className="w-3.5 h-3.5 text-white/50" />
            </button>

            {/* Notification Bell */}
            <button
              id="dashboard-bell-btn"
              onClick={() => openComingSoon('Notifications Center')}
              className="relative p-2 rounded-xl bg-[#161327] border border-white/10 hover:border-white/20 text-white/70 hover:text-white transition-all cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-[#161327]"></span>
            </button>

            {/* User Profile Avatar */}
            <div
              onClick={() => openComingSoon('User Profile Settings')}
              className="w-7 h-7 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-magenta flex items-center justify-center text-xs font-bold text-white shadow-md cursor-pointer hover:opacity-90 transition-opacity"
            >
              S
            </div>
          </div>

          {/* 2x2 Grid of Main Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Card 1: Financial Fitness Score (Dark card) */}
            <div
              onClick={() => openComingSoon('Financial Fitness Score')}
              className="rounded-2xl bg-[#151226] border border-white/[0.08] p-4 flex flex-col justify-between hover:border-brand-purple/40 transition-all cursor-pointer shadow-lg active:scale-[0.99]"
            >
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

            {/* Card 2: Net Financial Position (Dark card) */}
            <div
              onClick={() => openComingSoon('Net Financial Position')}
              className="rounded-2xl bg-[#151226] border border-white/[0.08] p-4 flex flex-col justify-between hover:border-brand-purple/40 transition-all cursor-pointer shadow-lg active:scale-[0.99]"
            >
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

                {/* Authentic Stock Market Graph with peaks, troughs, area glow & inflection nodes */}
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

                    {/* Gradient Area Fill */}
                    <path
                      d="M0,45 C10,45 14,32 22,32 C28,32 32,40 38,40 C46,40 50,24 58,24 C64,24 68,30 76,30 C84,30 88,14 96,14 C102,14 106,20 114,20 C122,20 124,6 128,6 L128,55 L0,55 Z"
                      fill="url(#dashAreaGrad)"
                    />

                    {/* Main Market Graph Line */}
                    <path
                      d="M0,45 C10,45 14,32 22,32 C28,32 32,40 38,40 C46,40 50,24 58,24 C64,24 68,30 76,30 C84,30 88,14 96,14 C102,14 106,20 114,20 C122,20 124,6 128,6"
                      fill="none"
                      stroke="#c084fc"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#purpleGlowFilter)"
                    />

                    {/* Chart Peak Nodes matching reference image 02 */}
                    <circle cx="22" cy="32" r="2.5" fill="#a855f7" stroke="#ffffff" strokeWidth="1" />
                    <circle cx="58" cy="24" r="2.5" fill="#a855f7" stroke="#ffffff" strokeWidth="1" />
                    <circle cx="96" cy="14" r="2.5" fill="#c084fc" stroke="#ffffff" strokeWidth="1" />
                    
                    {/* Final Pulse Peak Indicator */}
                    <circle cx="128" cy="6" r="4" fill="#ec4899" className="animate-pulse" />
                    <circle cx="128" cy="6" r="2" fill="#ffffff" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Card 3: Live Gold Rate 24K (Warm cream/amber light card matching image 02) */}
            <div
              onClick={() => openComingSoon('Live Gold Rate 24K')}
              className="rounded-2xl bg-[#fffbf0] text-slate-900 border border-amber-200/90 p-4 flex items-center justify-between hover:border-amber-400 transition-all cursor-pointer shadow-lg active:scale-[0.99]"
            >
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
                {/* Back Bar */}
                <div className="absolute top-1 right-3 w-20 h-9 rounded-md bg-gradient-to-r from-[#d97706] via-[#f59e0b] to-[#fbbf24] shadow-md border-t border-yellow-200/70 transform rotate-[-7deg] flex items-center justify-center">
                  <div className="w-16 h-5 rounded border border-amber-900/30 bg-gradient-to-b from-yellow-300/30 to-transparent flex items-center justify-between px-1.5">
                    <span className="text-[7px] font-black text-amber-950/80 tracking-tighter">999.9</span>
                    <span className="text-[6px] font-extrabold text-amber-950/70">FINE GOLD</span>
                  </div>
                </div>

                {/* Front Bar */}
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

            {/* Card 4: Estimated Spending Limit (White/light card matching image 02) */}
            <div
              onClick={() => openComingSoon('Estimated Spending Limit')}
              className="rounded-2xl bg-white text-slate-900 border border-slate-200 p-4 flex items-center justify-between hover:border-indigo-300 transition-all cursor-pointer shadow-lg active:scale-[0.99]"
            >
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

              {/* Graphic Clipboard / Target illustration on right */}
              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                {/* Clipboard background */}
                <div className="w-13 h-15 rounded-xl bg-slate-100 border border-slate-300 p-1.5 shadow-md flex flex-col justify-between">
                  <div className="w-4 h-1.5 bg-slate-400 rounded-full mx-auto"></div>
                  {/* Mini bar chart lines */}
                  <div className="space-y-1 my-1">
                    <div className="w-full h-1.5 bg-blue-400 rounded-full"></div>
                    <div className="w-3/4 h-1.5 bg-emerald-400 rounded-full"></div>
                    <div className="w-1/2 h-1.5 bg-amber-400 rounded-full"></div>
                  </div>
                  <div className="w-full h-1 bg-slate-300 rounded-full"></div>
                </div>
                {/* Target badge overlay */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-500 border-2 border-white shadow flex items-center justify-center text-white">
                  <Target className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Row: "MoneyMapper Score Cards" */}
          <div className="mt-1">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/70">
                MoneyMapper Score Cards
              </h4>
              <span className="text-[10px] text-brand-purple hover:underline cursor-pointer" onClick={() => openComingSoon('All Score Cards')}>
                View All Categories →
              </span>
            </div>

            {/* 4 Score Cards Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {scoreCards.map((sc) => (
                <div
                  key={sc.title}
                  onClick={() => openComingSoon(sc.title)}
                  className="rounded-xl bg-[#151226] border border-white/[0.08] hover:border-white/20 p-3 flex flex-col justify-between transition-all cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white/80">
                      {sc.title}
                    </span>
                    <div className={`p-1.5 rounded-lg border ${sc.badgeBg}`}>
                      {sc.icon}
                    </div>
                  </div>

                  <div className="flex items-end justify-between mt-1">
                    <div>
                      <div className="text-xl font-black text-white tracking-tight flex items-baseline gap-1">
                        <span className={sc.color}>{sc.score}</span>
                        <span className="text-[10px] text-white/40 font-bold">/ 100</span>
                      </div>
                      <p className="text-[9.5px] text-white/50 truncate max-w-[110px] mt-0.5">
                        {sc.caption}
                      </p>
                    </div>

                    {/* Mini Stock Market Sparkline SVG */}
                    <div className="w-14 h-7 flex items-end">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 56 22">
                        <path
                          d={sc.path}
                          fill="none"
                          stroke={sc.stroke}
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx={sc.endPoint.x}
                          cy={sc.endPoint.y}
                          r="2.5"
                          fill={sc.stroke}
                          className="animate-pulse"
                        />
                        <circle
                          cx={sc.endPoint.x}
                          cy={sc.endPoint.y}
                          r="1"
                          fill="#ffffff"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </main>

      </div>

    </div>
  );
};

export default DashboardPreview;
