import React from 'react';
import { Sparkles, LayoutGrid, TrendingUp, Lock } from 'lucide-react';

export const FeatureCards: React.FC = () => {
  const features = [
    {
      id: 'ai-assistant',
      title: 'AI Assistant',
      subtitle: 'Smart Guidance',
      badge: '24x7 Copilot',
      icon: <Sparkles className="w-5 h-5 text-purple-300" />,
      iconBg: 'bg-purple-900/40 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.25)]',
      hoverBorder: 'hover:border-purple-500/50',
    },
    {
      id: 'pillars',
      title: '5 Financial Pillars',
      subtitle: 'Holistic View',
      badge: 'Unified',
      icon: <LayoutGrid className="w-5 h-5 text-pink-300" />,
      iconBg: 'bg-pink-900/40 border-pink-500/40 shadow-[0_0_15px_rgba(236,72,153,0.25)]',
      hoverBorder: 'hover:border-pink-500/50',
    },
    {
      id: 'insights',
      title: 'Real-time Insights',
      subtitle: 'Data that matters',
      badge: 'Live Signals',
      icon: <TrendingUp className="w-5 h-5 text-blue-300" />,
      iconBg: 'bg-blue-900/40 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.25)]',
      hoverBorder: 'hover:border-blue-500/50',
    },
    {
      id: 'secure',
      title: 'Secure & Private',
      subtitle: 'Your data, your control',
      badge: '256-bit SSL',
      icon: <Lock className="w-5 h-5 text-teal-300" />,
      iconBg: 'bg-teal-900/40 border-teal-500/40 shadow-[0_0_15px_rgba(20,184,166,0.25)]',
      hoverBorder: 'hover:border-teal-500/50',
    },
  ];

  return (
    <div className="flex flex-col gap-3.5 w-full max-w-[260px] sm:max-w-[280px]">
      {features.map((feature) => (
        <div
          key={feature.id}
          className={`group p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#171329]/90 to-[#120f22]/90 backdrop-blur-md border border-white/[0.09] ${feature.hoverBorder} flex items-center justify-between shadow-xl transition-all duration-300 hover:translate-x-1.5 hover:shadow-brand-purple/10 cursor-default`}
        >
          <div className="flex items-center gap-3.5">
            {/* Icon in colored rounded-square */}
            <div
              className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${feature.iconBg} group-hover:scale-105 transition-transform duration-200`}
            >
              {feature.icon}
            </div>

            {/* Title & Subtitle */}
            <div className="text-left">
              <h4 className="text-sm font-bold text-white tracking-tight group-hover:text-white/95">
                {feature.title}
              </h4>
              <p className="text-[11px] text-white/50 font-normal">
                {feature.subtitle}
              </p>
            </div>
          </div>

          <span className="hidden sm:inline-block text-[9px] font-mono text-purple-300/80 px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
            {feature.badge}
          </span>
        </div>
      ))}
    </div>
  );
};

export default FeatureCards;
