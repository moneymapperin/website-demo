import { useComingSoon } from '../context/ComingSoonContext';
import logoImg from '../assets/logo.png';
import {
  Bell,
  HelpCircle,
  TrendingUp,
  Home,
  FileText,
  Shield,
  Bot,
  Crown
} from 'lucide-react';

interface PhoneMockupProps {
  className?: string;
  style?: React.CSSProperties;
}

export const PhoneMockup: React.FC<PhoneMockupProps> = ({ className = '', style }) => {
  const { openComingSoon } = useComingSoon();

  return (
    <div
      style={style}
      className={`relative mx-auto w-[310px] sm:w-[330px] select-none transition-transform duration-300 ${className}`}
    >
      {/* Outer Phone Hardware Bezel */}
      <div className="relative rounded-[46px] p-[10px] bg-gradient-to-b from-[#3a2f58] via-[#211938] to-[#120d24] border border-[#524177]/60 shadow-[0_25px_70px_rgba(139,92,246,0.35),0_0_80px_rgba(168,85,247,0.15)]">
        
        {/* Phone Glass / Inner Screen */}
        <div className="relative rounded-[38px] bg-[#0d0a1a] overflow-hidden border border-white/[0.08] flex flex-col min-h-[640px]">
          
          {/* Top Speaker / Dynamic Pill */}
          <div className="w-full pt-3 pb-2 px-6 flex items-center justify-between z-20">
            {/* Clock / Carrier dummy */}
            <span className="text-[11px] font-semibold text-white/70">9:41</span>
            
            {/* Camera / Pill Notch */}
            <div className="w-24 h-4 bg-black rounded-full flex items-center justify-center gap-2 px-2">
              <div className="w-2 h-2 rounded-full bg-[#1b1928] border border-white/10"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-900/60"></div>
            </div>

            {/* Signal & Battery */}
            <div className="flex items-center gap-1.5 text-white/70">
              <div className="w-3 h-2 border border-white/70 rounded-[1px] p-[1px] flex items-center">
                <div className="w-full h-full bg-white/80 rounded-[0.5px]"></div>
              </div>
            </div>
          </div>

          {/* Phone In-App Header */}
          <div className="px-4 py-2 flex items-center justify-between border-b border-white/[0.05]">
            <div
              onClick={() => openComingSoon('Mobile Brand Dashboard')}
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <img
                src={logoImg}
                alt="Logo"
                className="w-5 h-5 object-contain"
              />
              <span className="text-xs font-bold text-white tracking-tight">MoneyMapper</span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-brand-purple text-[8px] font-bold text-white uppercase tracking-wider">
                <Crown className="w-2 h-2" />
                Premium
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => openComingSoon('Notifications')}
                className="relative p-1 rounded-full text-white/70 hover:text-white transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-[#0d0a1a]"></span>
              </button>
              <div
                onClick={() => openComingSoon('User Profile')}
                className="w-6 h-6 rounded-full bg-gradient-to-tr from-brand-purple to-brand-magenta flex items-center justify-center text-[10px] font-bold text-white shadow-sm cursor-pointer"
              >
                S
              </div>
            </div>
          </div>

          {/* Scrollable Phone Content */}
          <div className="p-3.5 space-y-3 flex-1 overflow-y-auto no-scrollbar">

            {/* 1. White Card: FINANCIAL FITNESS SCORE */}
            <div
              onClick={() => openComingSoon('Financial Fitness Score')}
              className="bg-white rounded-2xl p-3.5 shadow-md text-slate-900 cursor-pointer hover:shadow-lg transition-all active:scale-[0.99]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1">
                  Financial Fitness Score
                  <HelpCircle className="w-3 h-3 text-slate-400 inline" />
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[9px] font-bold inline-flex items-center gap-1">
                  <span>😐</span> AVERAGE
                </span>
              </div>

              <div className="flex items-start gap-3">
                {/* Donut Gauge with perfect centering */}
                <div className="relative w-[76px] h-[76px] shrink-0 flex items-center justify-center">
                  <svg className="w-[76px] h-[76px] -rotate-90" viewBox="0 0 76 76">
                    {/* Background Track */}
                    <circle
                      cx="38"
                      cy="38"
                      r="31"
                      stroke="#f1f5f9"
                      strokeWidth="6"
                      fill="none"
                    />
                    {/* Gauge Arc (45% of 194.8 circumference = 87.6) */}
                    <circle
                      cx="38"
                      cy="38"
                      r="31"
                      stroke="url(#scoreGradient)"
                      strokeWidth="6"
                      strokeDasharray="194.8"
                      strokeDashoffset="107.1"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ea580c" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-extrabold text-slate-900 leading-none">45</span>
                    <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">OF 100</span>
                  </div>
                </div>

                {/* Score Advice Details */}
                <div className="flex-1 flex flex-col justify-between self-stretch">
                  <p className="text-[10px] text-slate-600 leading-[1.3] mb-1.5">
                    You're on track. Focus on investing more and building your emergency fund.
                  </p>
                  <div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[8.5px] font-semibold text-emerald-700">
                      <span className="text-emerald-600 font-bold">↑</span> +12 pts from last month
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. NET FINANCIAL POSITION */}
            <div
              onClick={() => openComingSoon('Net Financial Position')}
              className="bg-[#18152c] border border-white/10 rounded-2xl p-3.5 shadow-md cursor-pointer hover:border-brand-purple/40 transition-all active:scale-[0.99]"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold tracking-wider text-white/50 uppercase">
                  Net Financial Position
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-2xl font-black text-[#22c55e] tracking-tight">
                    ₹2,843,000
                  </div>
                  <p className="text-[9px] text-white/40 mb-2">
                    Total Assets - Total Liabilities
                  </p>
                  <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#22c55e]">
                    <TrendingUp className="w-3 h-3 inline" />
                    <span>+ ₹18,450 (8.3%)</span>
                    <span className="text-[8px] text-white/40 font-normal">vs last month</span>
                  </div>
                </div>

                {/* Upward Stock Market Graph */}
                <div className="w-26 h-13 relative flex items-end">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 110 44">
                    <defs>
                      <linearGradient id="purpleGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Area fill */}
                    <path
                      d="M0,36 C8,36 12,26 18,26 C24,26 28,32 34,32 C40,32 44,20 50,20 C56,20 60,25 66,25 C72,25 76,12 82,12 C88,12 92,17 98,17 C104,17 106,5 110,5 L110,44 L0,44 Z"
                      fill="url(#purpleGlow)"
                    />
                    {/* Sparkline stroke */}
                    <path
                      d="M0,36 C8,36 12,26 18,26 C24,26 28,32 34,32 C40,32 44,20 50,20 C56,20 60,25 66,25 C72,25 76,12 82,12 C88,12 92,17 98,17 C104,17 106,5 110,5"
                      fill="none"
                      stroke="#c084fc"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Intermediate Nodes */}
                    <circle cx="18" cy="26" r="2" fill="#a855f7" stroke="#ffffff" strokeWidth="0.8" />
                    <circle cx="50" cy="20" r="2" fill="#a855f7" stroke="#ffffff" strokeWidth="0.8" />
                    <circle cx="82" cy="12" r="2" fill="#c084fc" stroke="#ffffff" strokeWidth="0.8" />
                    {/* End point dot */}
                    <circle cx="110" cy="5" r="3.5" fill="#ec4899" className="animate-pulse" />
                    <circle cx="110" cy="5" r="1.5" fill="#ffffff" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 3. LIVE GOLD RATE 24K (PER GRAM) + CSS GOLD BARS */}
            <div
              onClick={() => openComingSoon('Live 24K Gold Rate')}
              className="bg-[#18152c] border border-white/10 rounded-2xl p-3.5 shadow-md flex items-center justify-between cursor-pointer hover:border-amber-500/40 transition-all active:scale-[0.99]"
            >
              <div>
                <span className="block text-[9px] font-bold text-white/70 uppercase tracking-wider">
                  Live Gold Rate 24K
                </span>
                <span className="block text-[8px] text-white/40 mb-1">
                  (PER GRAM)
                </span>
                <span className="text-xl font-black text-white tracking-tight">
                  ₹15,118
                </span>
              </div>

              {/* CSS-Only Stacked Gold Bullion Bars */}
              <div className="relative w-24 h-16 flex items-center justify-center">
                {/* Back / Lower Gold Bar */}
                <div className="absolute top-1 right-2 w-16 h-7 rounded-md bg-gradient-to-r from-[#d97706] via-[#f59e0b] to-[#fbbf24] shadow-md border-t border-yellow-200/60 transform rotate-[-8deg] flex items-center justify-center">
                  <div className="w-12 h-3.5 rounded border border-amber-800/20 bg-gradient-to-b from-yellow-300/30 to-transparent flex items-center justify-between px-1">
                    <span className="text-[6px] font-black text-amber-950/70 tracking-tighter">999.9</span>
                    <span className="text-[5px] font-extrabold text-amber-950/60">FINE GOLD</span>
                  </div>
                </div>

                {/* Front / Top Gold Bar */}
                <div className="absolute bottom-1 right-1 w-18 h-8 rounded-md bg-gradient-to-r from-[#b45309] via-[#f59e0b] to-[#fde047] shadow-xl border-t border-yellow-100/90 flex items-center justify-center z-10">
                  <div className="w-14 h-4.5 rounded border border-amber-900/30 bg-gradient-to-b from-yellow-200/40 to-transparent flex items-center justify-between px-1.5 shadow-inner">
                    <span className="text-[7px] font-black text-amber-950 tracking-tighter">24K</span>
                    <div className="flex flex-col items-center">
                      <span className="text-[5px] font-bold text-amber-900 leading-none">GOLD</span>
                      <span className="text-[4px] text-amber-950/70 font-mono">100g</span>
                    </div>
                  </div>
                  {/* Sheen reflection line */}
                  <div className="absolute inset-x-2 top-0.5 h-[1px] bg-white/70 rounded-full"></div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Tab Bar */}
          <div className="bg-[#0b0916] border-t border-white/[0.08] px-3 py-2 flex items-center justify-around z-20">
            <button
              onClick={() => openComingSoon('Mobile App: Home')}
              className="flex flex-col items-center gap-0.5 text-brand-purple"
            >
              <Home className="w-4 h-4" />
              <span className="text-[8px] font-bold">Home</span>
            </button>
            <button
              onClick={() => openComingSoon('Mobile App: Insights')}
              className="flex flex-col items-center gap-0.5 text-white/50 hover:text-white transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span className="text-[8px] font-medium">Insights</span>
            </button>
            <button
              onClick={() => openComingSoon('Mobile App: Portfolio')}
              className="flex flex-col items-center gap-0.5 text-white/50 hover:text-white transition-colors"
            >
              <Shield className="w-4 h-4" />
              <span className="text-[8px] font-medium">Portfolio</span>
            </button>
            <button
              onClick={() => openComingSoon('Mobile App: AI Assistant')}
              className="flex flex-col items-center gap-0.5 text-white/50 hover:text-white transition-colors"
            >
              <Bot className="w-4 h-4" />
              <span className="text-[8px] font-medium">AI Assistant</span>
            </button>
          </div>

          {/* Bottom Home Indicator Bar */}
          <div className="w-full pb-1 pt-0.5 bg-[#0b0916] flex justify-center">
            <div className="w-28 h-1 bg-white/30 rounded-full"></div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PhoneMockup;
