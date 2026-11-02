import React from 'react';
import {
  Compass,
  CalendarCheck2,
  AlertTriangle,
  Bot,
  QrCode,
  Lock,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { navigateTo } from '../lib/navigation';

export const BenefitsSection: React.FC = () => {
  const benefits = [
    {
      icon: <Compass className="w-6 h-6 text-indigo-400" />,
      title: '360° Financial Clarity',
      description:
        'Stop juggling separate apps for bank balance, mutual funds, gold, insurance, and budgets. MoneyMapper unifies your entire net worth in one clear dashboard.',
      bullet: 'Consolidate assets, debts, and investments in real time',
      color: 'from-indigo-500/20 to-purple-500/10 border-indigo-500/30',
      iconBg: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400',
    },
    {
      icon: <CalendarCheck2 className="w-6 h-6 text-amber-400" />,
      title: 'Weekly Expense Discipline',
      description:
        'Monthly budgets fail because you only notice overspending when it is too late. Our weekly predictor provides real-time safe buffers and discipline scores.',
      bullet: 'Weekly hit rate targets with automated safe buffers',
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30',
      iconBg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    },
    {
      icon: <AlertTriangle className="w-6 h-6 text-teal-400" />,
      title: 'Zero Financial Blindspots',
      description:
        'Continuous audits highlight hidden coverage gaps in health and term life insurance, as well as shortfalls in your 6-month emergency safety net.',
      bullet: 'Automatic emergency runway and policy coverage checks',
      color: 'from-teal-500/20 to-emerald-500/10 border-teal-500/30',
      iconBg: 'bg-teal-500/15 border-teal-500/30 text-teal-400',
    },
    {
      icon: <Bot className="w-6 h-6 text-purple-400" />,
      title: 'AI Financial Copilot',
      description:
        'Have finance questions? Your AI assistant provides tailored calculations for SIP allocation gaps, loan payoffs, and savings opportunities 24/7.',
      bullet: 'Data-driven recommendations tuned to your financial fitness',
      color: 'from-purple-500/20 to-pink-500/10 border-purple-500/30',
      iconBg: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
    },
    {
      icon: <QrCode className="w-6 h-6 text-emerald-400" />,
      title: 'Instant QR Web & Mobile Sync',
      description:
        'Log quick expenses on your phone on the go. When you want deep portfolio analysis on desktop, simply scan the screen QR code to log in instantly.',
      bullet: 'Zero password friction between mobile app and web workstation',
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
      iconBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    },
    {
      icon: <Lock className="w-6 h-6 text-rose-400" />,
      title: 'Bank-Grade Security & Privacy',
      description:
        'Your financial figures belong to you. We employ industry-standard encryption, strict access controls, and zero sale of personal data to third parties.',
      bullet: 'No spam, no cold calls, no selling of personal data',
      color: 'from-rose-500/20 to-red-500/10 border-rose-500/30',
      iconBg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
    },
  ];

  return (
    <section id="benefits" className="relative scroll-mt-24 py-16 sm:py-20 lg:py-24 overflow-hidden">
      {/* Ambient background lighting */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_30%_60%,rgba(168,85,247,0.12),transparent_55%)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#171329] border border-brand-purple/30 text-xs font-semibold text-purple-300 shadow-sm shadow-brand-purple/20 mb-4 backdrop-blur-sm">
            <span className="text-brand-magenta text-sm leading-none">✦</span>
            <span className="tracking-wider uppercase text-[11px]">Why MoneyMapper</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight text-white mb-4 leading-tight">
            Designed for Real Wealth &amp;{' '}
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent">
              Peace of Mind
            </span>
          </h2>
          <p className="text-sm sm:text-base text-white/60 font-normal leading-relaxed">
            Built on proven wealth-building principles to replace financial anxiety with structure, clarity, and discipline.
          </p>
        </div>

        {/* 6 Benefit Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="group relative flex flex-col justify-between rounded-3xl bg-[#141124]/90 backdrop-blur-md border border-white/[0.08] hover:border-brand-purple/50 p-6 sm:p-7 shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-brand-purple/15"
            >
              <div>
                {/* Icon in colored rounded-square */}
                <div
                  className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-5 ${benefit.iconBg} group-hover:scale-105 transition-transform duration-300`}
                >
                  {benefit.icon}
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mb-2.5 group-hover:text-white transition-colors">
                  {benefit.title}
                </h3>

                <p className="text-xs sm:text-sm text-white/60 leading-relaxed font-normal mb-5">
                  {benefit.description}
                </p>
              </div>

              {/* Feature highlight bullet */}
              <div className="pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs font-medium text-white/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{benefit.bullet}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Stats Callout */}
        <div className="mt-12 sm:mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 sm:p-8 rounded-3xl bg-[#100d20] border border-white/[0.08] text-center">
          <div>
            <div className="text-3xl sm:text-4xl font-black text-purple-300 font-mono">5</div>
            <div className="text-xs text-white/50 font-medium mt-1">Core Financial Pillars</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">100%</div>
            <div className="text-xs text-white/50 font-medium mt-1">Private &amp; Encrypted</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">24/7</div>
            <div className="text-xs text-white/50 font-medium mt-1">AI Financial Copilot</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-cyan-300 font-mono">1 Tap</div>
            <div className="text-xs text-white/50 font-medium mt-1">Instant QR Web Sync</div>
          </div>
        </div>

        {/* Quick CTA */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigateTo('/login')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-purple-300 hover:text-white transition-colors group cursor-pointer"
          >
            <span>Have the mobile app? Scan to login to the web version</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
