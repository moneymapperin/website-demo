import React, { useState } from 'react';
import {
  Wallet,
  CreditCard,
  Shield,
  Umbrella,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { navigateTo } from '../lib/navigation';

export const PillarsSection: React.FC = () => {
  const [selectedPillar, setSelectedPillar] = useState<'income' | 'expenses' | 'emergency' | 'protection' | 'investment'>('expenses');

  const pillarCards = [
    {
      id: 'income',
      title: 'Income',
      desc: 'Analyse all your active & passive earnings',
      icon: <Wallet className="w-5 h-5 text-emerald-400" />,
      badgeBg: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
      titleColor: 'text-white',
      borderColor: 'border-emerald-500/40',
      activeColor: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
      metric: '₹1.10L / mo',
      badge: 'Active & Passive',
    },
    {
      id: 'expenses',
      title: 'Expenses',
      desc: 'Forecast, track and control weekly spending',
      icon: <CreditCard className="w-5 h-5 text-amber-400" />,
      badgeBg: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
      titleColor: 'text-amber-300',
      borderColor: 'border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.2)] bg-[#191522]',
      activeColor: 'from-amber-500/20 via-amber-500/5 to-transparent',
      metric: '85% Hit Rate',
      badge: 'Weekly Predictor',
    },
    {
      id: 'emergency-savings',
      title: 'Emergency Savings',
      desc: 'Build & monitor your financial safety net',
      icon: <Shield className="w-5 h-5 text-teal-400" />,
      badgeBg: 'bg-teal-500/20 border-teal-500/30 text-teal-400',
      titleColor: 'text-white',
      borderColor: 'border-teal-500/40',
      activeColor: 'from-teal-500/20 via-teal-500/5 to-transparent',
      metric: '6.2 Mo Runway',
      badge: 'Safety Net',
    },
    {
      id: 'protection',
      title: 'Protection',
      desc: 'Audit life, health & asset insurance health',
      icon: <Umbrella className="w-5 h-5 text-purple-400" />,
      badgeBg: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
      titleColor: 'text-white',
      borderColor: 'border-purple-500/40',
      activeColor: 'from-purple-500/20 via-purple-500/5 to-transparent',
      metric: '₹1.5 Cr Cover',
      badge: 'Policy Audit',
    },
    {
      id: 'investment',
      title: 'Investment',
      desc: 'Monitor mutual funds, stocks & portfolio growth',
      icon: <TrendingUp className="w-5 h-5 text-blue-400" />,
      badgeBg: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
      titleColor: 'text-white',
      borderColor: 'border-blue-500/40',
      activeColor: 'from-blue-500/20 via-blue-500/5 to-transparent',
      metric: '₹15K SIP / mo',
      badge: 'Portfolio Growth',
    },
  ];

  const pillarDetails = {
    expenses: {
      tagline: 'Weekly Expense Predictor & Budget Discipline',
      summary: 'Replace month-end surprise with real-time weekly control. Predict weekly outflow limits, track category caps, and build a lasting habit streak.',
      features: [
        'Weekly expense forecasting with automated safe buffers',
        'Daily budget allocations across Essentials, Lifestyle, and Discretionary',
        'Expense Hit Rate & Discipline Score tracked weekly',
        'Direct synchronization with monthly financial goals',
      ],
      sampleCard: (
        <div className="rounded-2xl bg-[#0d0a1a] border border-amber-500/30 p-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">This Week Tonight</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">● Safe Buffer Active</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">₹13,300 – ₹14,700</div>
          <p className="text-xs text-white/50 mt-1">Estimated optimal spending limit for Week 4</p>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs text-white/70">
              <span>Groceries & Utilities</span>
              <span className="font-mono font-bold text-white">₹6,200 / ₹7,000</span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full w-[88%]" />
            </div>
            <div className="flex justify-between text-xs text-white/70">
              <span>Dining & Leisure</span>
              <span className="font-mono font-bold text-white">₹2,800 / ₹4,000</span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full w-[70%]" />
            </div>
          </div>
        </div>
      ),
    },
    income: {
      tagline: 'Multi-Stream Income Matrix & Stability',
      summary: 'Analyze all your revenue sources in one unified matrix. Track salary reliability, freelance inflows, rental yields, and dividend compounding.',
      features: [
        'Separation of Active Salary vs. Passive Investment income',
        'Income Stability Index calculated from variance across 12 months',
        'Month-on-Month growth analytics and projection modeling',
        'Tax-advantaged stream tagging for financial optimization',
      ],
      sampleCard: (
        <div className="rounded-2xl bg-[#0d0a1a] border border-emerald-500/30 p-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Total Monthly Income</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">Score: 85/100</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">₹1,10,000</div>
          <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="text-white/50 text-[10px]">Active Salary</div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">₹95,000</div>
              <div className="text-[10px] text-emerald-400">Stable Employer</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="text-white/50 text-[10px]">Passive Streams</div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">₹15,000</div>
              <div className="text-[10px] text-purple-300">Dividends + Yield</div>
            </div>
          </div>
        </div>
      ),
    },
    emergency: {
      tagline: 'Emergency Readiness & Safety Net Runway',
      summary: 'Calculate your exact required liquidity buffer based on non-negotiable living costs. Ensure you can survive life shocks with zero debt stress.',
      features: [
        'Calculates 6-month non-negotiable family survival budget',
        'Liquid bank savings vs. target emergency threshold tracker',
        'Runway health rating (Critical, Moderate, Secure, Fortress)',
        'Automated transfer recommendations to close readiness gaps',
      ],
      sampleCard: (
        <div className="rounded-2xl bg-[#0d0a1a] border border-teal-500/30 p-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">Emergency Buffer Status</span>
            <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400 text-[10px] font-bold">Secure</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">6.2 Months</div>
          <p className="text-xs text-white/50 mt-1">₹3,10,000 liquid of ₹3,00,000 target runway</p>
          <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden mt-4">
            <div className="bg-teal-400 h-full w-[103%]" />
          </div>
          <div className="flex justify-between text-[10px] text-white/50 mt-1.5">
            <span>Safety Threshold: 6.0 Months</span>
            <span className="text-teal-400 font-bold">103% Funded</span>
          </div>
        </div>
      ),
    },
    protection: {
      tagline: 'Insurance Health Audit & Policy Evaluator',
      summary: 'Detect dangerous under-insurance before health or life events occur. Evaluate Term Life, Health, and Motor coverage gaps comprehensively.',
      features: [
        'Human Life Value (HLV) calculation for optimal Term Life coverage',
        'Family Health Insurance sum insured sufficiency check',
        'Policy renewal calendar with automated reminder alerts',
        'Direct score checking against 32 top Indian insurance plans',
      ],
      sampleCard: (
        <div className="rounded-2xl bg-[#0d0a1a] border border-purple-500/30 p-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Insurance Coverage Audit</span>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold">Score: 75/100</span>
          </div>
          <div className="space-y-3 mt-2 text-xs">
            <div className="flex justify-between items-center p-2 rounded-xl bg-white/[0.03]">
              <div>
                <div className="font-semibold text-white">Term Life Cover</div>
                <div className="text-[10px] text-white/50">HDFC Life Click 2 Protect</div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-emerald-400">₹1.50 Cr</div>
                <div className="text-[9px] text-emerald-400">Adequate (15x)</div>
              </div>
            </div>
            <div className="flex justify-between items-center p-2 rounded-xl bg-white/[0.03]">
              <div>
                <div className="font-semibold text-white">Health Floater</div>
                <div className="text-[10px] text-white/50">Family Cover (2A + 1C)</div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-amber-300">₹10 Lakh</div>
                <div className="text-[9px] text-amber-300">+₹15L Top-up advised</div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    investment: {
      tagline: 'Mutual Funds, Equity & Portfolio Growth',
      summary: 'Track equity allocations, mutual fund performance, and live bullion prices. Automate SIP shortfall calculations to meet your compounding targets.',
      features: [
        'Automated SIP Shortfall Gap calculations for retirement & goals',
        'Asset allocation matrix: Equity, Debt, Gold, and Real Estate',
        'Stock & Mutual Fund Score Cards powered by live market signals',
        'Real-time MCX 24K and 22K gold rate tracking with bullion valuations',
      ],
      sampleCard: (
        <div className="rounded-2xl bg-[#0d0a1a] border border-blue-500/30 p-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">Investment Portfolio</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold">Score: 78/100</span>
          </div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-2xl font-black text-white font-mono">₹14,20,000</span>
            <span className="text-xs font-bold text-emerald-400 font-mono">+14.2% CAGR</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs mt-3">
            <div className="p-2 rounded-xl bg-white/[0.03]">
              <div className="text-[10px] text-white/50">Equity</div>
              <div className="font-bold text-white font-mono">55%</div>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.03]">
              <div className="text-[10px] text-white/50">Debt / MF</div>
              <div className="font-bold text-white font-mono">30%</div>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.03]">
              <div className="text-[10px] text-white/50">24K Gold</div>
              <div className="font-bold text-amber-300 font-mono">15%</div>
            </div>
          </div>
        </div>
      ),
    },
  };

  const activePillarKey = selectedPillar === 'emergency' ? 'emergency' : selectedPillar;
  const currentDetail = pillarDetails[activePillarKey];

  return (
    <section id="features" className="scroll-mt-24 relative py-16 sm:py-20 lg:py-24 overflow-hidden">
      {/* Background Subtle Radial Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-brand-purple/10 blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Centered Heading Block */}
        <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#171329] border border-brand-purple/30 text-xs font-semibold text-purple-300 shadow-sm shadow-brand-purple/20 mb-4 backdrop-blur-sm">
            <span className="text-brand-magenta text-sm leading-none">✦</span>
            <span className="tracking-wider uppercase text-[11px]">The 5 Financial Pillars</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight mb-4 text-white">
            Your Entire Financial World{' '}
            <span className="bg-gradient-to-r from-[#9333ea] via-[#c026d3] to-[#ec4899] bg-clip-text text-transparent">
              in One Place
            </span>
          </h2>
          <p className="text-sm sm:text-base text-white/60 font-normal leading-relaxed max-w-2xl mx-auto">
            MoneyMapper audits, tracks, and optimizes the 5 vital pillars of personal finance with AI-driven forecasting and live market intelligence.
          </p>
        </div>

        {/* Row of 5 Pillar Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
          {pillarCards.map((card) => {
            const isSelected =
              (card.id === 'income' && selectedPillar === 'income') ||
              (card.id === 'expenses' && selectedPillar === 'expenses') ||
              (card.id === 'emergency-savings' && selectedPillar === 'emergency') ||
              (card.id === 'protection' && selectedPillar === 'protection') ||
              (card.id === 'investment' && selectedPillar === 'investment');

            return (
              <div
                key={card.id}
                onClick={() => {
                  if (card.id === 'income') setSelectedPillar('income');
                  else if (card.id === 'expenses') setSelectedPillar('expenses');
                  else if (card.id === 'emergency-savings') setSelectedPillar('emergency');
                  else if (card.id === 'protection') setSelectedPillar('protection');
                  else if (card.id === 'investment') setSelectedPillar('investment');
                }}
                className={`rounded-2xl p-5 text-center flex flex-col items-center justify-between bg-[#141124]/90 backdrop-blur-sm border transition-all duration-300 cursor-pointer shadow-lg ${
                  isSelected
                    ? `${card.borderColor} bg-gradient-to-b ${card.activeColor} -translate-y-1`
                    : 'border-white/[0.08] hover:border-white/25 hover:-translate-y-0.5'
                }`}
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-3 shadow-inner ${card.badgeBg}`}
                  >
                    {card.icon}
                  </div>

                  <h3 className={`text-base font-bold mb-1 tracking-tight ${card.titleColor}`}>
                    {card.title}
                  </h3>

                  <p className="text-xs text-white/50 leading-relaxed font-normal mb-3">
                    {card.desc}
                  </p>
                </div>

                <div className="w-full pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px]">
                  <span className="font-mono text-white/80 font-bold">{card.metric}</span>
                  <span className="text-purple-300 font-medium">{card.badge}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Pillar Interactive Spotlight Panel */}
        <div className="rounded-3xl bg-gradient-to-b from-[#16122c] to-[#0f0c20] border border-white/10 p-6 sm:p-8 lg:p-10 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Description & Feature Checklist */}
            <div className="lg:col-span-7 text-left">
              <span className="inline-block px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-3">
                {currentDetail.tagline}
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4">
                Structured, intelligent control over your {selectedPillar}
              </h3>
              <p className="text-sm text-white/65 leading-relaxed mb-6 font-normal">
                {currentDetail.summary}
              </p>

              <div className="space-y-3 mb-8">
                {currentDetail.features.map((feat) => (
                  <div key={feat} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-white/85">{feat}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => navigateTo('/register')}
                  className="px-6 py-3 rounded-2xl bg-brand-gradient hover:opacity-95 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                >
                  Start Tracking Free
                </button>
                <button
                  onClick={() => {
                    document.getElementById('dashboard-preview')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-6 py-3 rounded-2xl bg-[#141026] hover:bg-[#1a1532] border border-white/15 text-white font-semibold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  See in Dashboard
                </button>
              </div>
            </div>

            {/* Right Column: Live Sample Interactive UI Card */}
            <div className="lg:col-span-5">
              {currentDetail.sampleCard}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PillarsSection;
