import React from 'react';
import { ArrowRight, Sliders, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { navigateTo } from '../lib/navigation';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Map Your Cashflow',
      subtitle: 'Income & Expense Setup',
      description:
        'Log your active salary, passive income streams, and routine monthly commitments in minutes. Our intelligent engine organizes fixed vs. variable spending automatically.',
      icon: <Sliders className="w-5 h-5 text-emerald-400" />,
      accentBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
      badgeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      preview: (
        <div className="mt-4 p-3 rounded-xl bg-[#0e0b1c] border border-white/10 text-xs">
          <div className="flex justify-between items-center text-[10px] text-white/50 mb-1.5">
            <span>Monthly Cashflow</span>
            <span className="text-emerald-400 font-bold">+₹52,000 net</span>
          </div>
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden flex">
            <div className="bg-emerald-400 h-full w-[65%]" title="Income Allocated" />
            <div className="bg-amber-400 h-full w-[25%]" title="Expenses" />
            <div className="bg-purple-400 h-full w-[10%]" title="Surplus" />
          </div>
          <div className="flex justify-between text-[9px] text-white/40 mt-1">
            <span>₹1,00,000 In</span>
            <span>₹48,000 Out</span>
          </div>
        </div>
      ),
    },
    {
      number: '02',
      title: 'Audit Your 5 Pillars',
      subtitle: 'Financial Fitness Scoring',
      description:
        'Our proprietary algorithm evaluates your financial health across 5 core pillars: Income, Expenses, Emergency Fund, Protection, and Investments to generate your unified score.',
      icon: <ShieldCheck className="w-5 h-5 text-indigo-400" />,
      accentBg: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400',
      badgeColor: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
      preview: (
        <div className="mt-4 p-3 rounded-xl bg-[#0e0b1c] border border-white/10 text-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Health Status</div>
            <div className="text-sm font-extrabold text-white mt-0.5">Score: 45 / 100</div>
            <div className="text-[10px] text-amber-300 font-medium">Average • Ready to optimize</div>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-amber-400/80 bg-amber-400/10 flex items-center justify-center font-black text-xs text-amber-300">
            45
          </div>
        </div>
      ),
    },
    {
      number: '03',
      title: 'Act on AI Guidance',
      subtitle: 'Personalized Wealth Blueprint',
      description:
        'Receive actionable weekly expense limits, automated SIP gap recommendations, and insurance safety net targets calculated specifically for your lifestyle and goals.',
      icon: <Sparkles className="w-5 h-5 text-purple-400" />,
      accentBg: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
      badgeColor: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
      preview: (
        <div className="mt-4 p-3 rounded-xl bg-[#0e0b1c] border border-white/10 text-xs">
          <div className="flex items-center gap-1.5 text-purple-300 text-[10px] font-semibold mb-1">
            <Sparkles className="w-3 h-3" />
            <span>AI Copilot Recommendation</span>
          </div>
          <p className="text-[11px] text-white/80 leading-snug">
            "Increase your equity SIP by ₹3,500/mo to close your retirement gap 2.4 years earlier."
          </p>
        </div>
      ),
    },
    {
      number: '04',
      title: 'Compound & Protect',
      subtitle: 'Real-Time Tracking & Growth',
      description:
        'Monitor your net financial position in real time. Screen mutual funds and stocks, follow live 24K gold prices, and build lasting financial discipline week after week.',
      icon: <TrendingUp className="w-5 h-5 text-teal-400" />,
      accentBg: 'bg-teal-500/15 border-teal-500/30 text-teal-400',
      badgeColor: 'text-teal-400 border-teal-500/30 bg-teal-500/10',
      preview: (
        <div className="mt-4 p-3 rounded-xl bg-[#0e0b1c] border border-white/10 text-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] text-white/50 uppercase tracking-wider">Net Position Growth</div>
            <div className="text-sm font-extrabold text-[#22c55e] mt-0.5">₹2,843,000</div>
            <div className="text-[10px] text-emerald-400 font-semibold">↑ +8.3% this month</div>
          </div>
          <div className="text-right">
            <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
              Disciplined
            </span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="relative scroll-mt-24 py-16 sm:py-20 lg:py-24 overflow-hidden">
      {/* Background Ambient Lighting */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_20%,rgba(139,92,246,0.12),transparent_60%)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#171329] border border-brand-purple/30 text-xs font-semibold text-purple-300 shadow-sm shadow-brand-purple/20 mb-4 backdrop-blur-sm">
            <span className="text-brand-magenta text-sm leading-none">✦</span>
            <span className="tracking-wider uppercase text-[11px]">How It Works</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight text-white mb-4 leading-tight">
            Four Steps to Complete{' '}
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent">
              Financial Clarity
            </span>
          </h2>
          <p className="text-sm sm:text-base text-white/60 font-normal leading-relaxed">
            MoneyMapper transforms overwhelming numbers into a guided, disciplined roadmap for your money.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step) => (
            <div
              key={step.number}
              className="group relative flex flex-col justify-between rounded-3xl bg-[#141124]/90 backdrop-blur-md border border-white/[0.08] hover:border-brand-purple/50 p-6 shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-brand-purple/10"
            >
              {/* Step Number & Icon Header */}
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-2xl border text-sm font-black ${step.accentBg}`}
                  >
                    {step.icon}
                  </span>
                  <span className="text-2xl font-black text-white/20 group-hover:text-purple-400/60 transition-colors font-mono">
                    {step.number}
                  </span>
                </div>

                <div className="mb-2">
                  <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border mb-2 ${step.badgeColor}`}>
                    {step.subtitle}
                  </span>
                  <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-white transition-colors">
                    {step.title}
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-white/55 leading-relaxed font-normal">
                  {step.description}
                </p>
              </div>

              {/* Micro interactive UI preview */}
              <div className="mt-6 pt-4 border-t border-white/[0.06]">
                {step.preview}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Banner */}
        <div className="mt-12 sm:mt-16 flex flex-col sm:flex-row items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#17122e] via-[#1f163d] to-[#17122e] border border-purple-500/30 shadow-xl">
          <div className="text-left">
            <h4 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Ready to see where your money truly stands?
            </h4>
            <p className="text-xs sm:text-sm text-white/60 mt-1">
              Start mapping your financial pillars today with a free account. No credit card required.
            </p>
          </div>
          <button
            onClick={() => navigateTo('/register')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-brand-gradient hover:opacity-95 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>Start Free Journey</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
