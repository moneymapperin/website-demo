import React, { useState } from 'react';
import { Sparkles, LayoutGrid, TrendingUp, Lock } from 'lucide-react';

interface FeatureItem {
  id: string;
  title: string;
  subtitle: string;
  boxTitle: string;
  description: string;
  icon: React.ReactNode;
  panelIcon: string;
  iconBg: string;
  hoverBorder: string;
  activeBorder: string;
  activeBg: string;
}

const features: FeatureItem[] = [
  {
    id: 'ai-assistant',
    title: 'AI Assistant',
    subtitle: 'Smart Guidance',
    boxTitle: 'AI Assistant (Smart Guidance)',
    description:
      'Get personalized, AI-driven guidance on your money decisions, answering questions in plain language and suggesting next steps based on your financial profile.',
    icon: <Sparkles className="w-5 h-5 text-purple-400" />,
    panelIcon: '/icons/features/ai-assistant.svg',
    iconBg: 'bg-purple-900/30 border-purple-500/30',
    hoverBorder: 'hover:border-purple-500/40',
    activeBorder: 'border-purple-500/70 shadow-[0_0_20px_rgba(168,85,247,0.18)]',
    activeBg: 'bg-[#1c1733]/90',
  },
  {
    id: 'pillars',
    title: '5 Financial Pillars',
    subtitle: 'Holistic View',
    boxTitle: '5 Financial Pillars (Holistic View)',
    description:
      'We look at five pillars of your finances together: Investment, Protection, Emergency, Income, and Expenses, so you see the full picture, not just one number.',
    icon: <LayoutGrid className="w-5 h-5 text-pink-400" />,
    panelIcon: '/icons/features/five-pillars.svg',
    iconBg: 'bg-pink-900/30 border-pink-500/30',
    hoverBorder: 'hover:border-pink-500/40',
    activeBorder: 'border-pink-500/70 shadow-[0_0_20px_rgba(236,72,153,0.18)]',
    activeBg: 'bg-[#22152a]/90',
  },
  {
    id: 'insights',
    title: 'Real-time Insights',
    subtitle: 'Data that matters',
    boxTitle: 'Real-time Insights (Data that matters)',
    description:
      'Your dashboard updates as your numbers change, highlighting the trends and figures that actually affect your financial health.',
    icon: <TrendingUp className="w-5 h-5 text-blue-400" />,
    panelIcon: '/icons/features/real-time-insights.svg',
    iconBg: 'bg-blue-900/30 border-blue-500/30',
    hoverBorder: 'hover:border-blue-500/40',
    activeBorder: 'border-blue-500/70 shadow-[0_0_20px_rgba(59,130,246,0.18)]',
    activeBg: 'bg-[#141b33]/90',
  },
  {
    id: 'secure',
    title: 'Secure & Private',
    subtitle: 'Your data, your control',
    boxTitle: 'Secure & Private (Your data, your control)',
    description:
      'Your financial data is encrypted and protected, and you decide what you share and what you delete at any time.',
    icon: <Lock className="w-5 h-5 text-teal-400" />,
    panelIcon: '/icons/features/secure-private.svg',
    iconBg: 'bg-teal-900/30 border-teal-500/30',
    hoverBorder: 'hover:border-teal-500/40',
    activeBorder: 'border-teal-500/70 shadow-[0_0_20px_rgba(20,184,166,0.18)]',
    activeBg: 'bg-[#112229]/90',
  },
];

export const FeatureCards: React.FC = () => {
  const [activeId, setActiveId] = useState('ai-assistant');
  const activeFeature = features.find((f) => f.id === activeId) || features[0];

  return (
    <section className="relative py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
      <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 lg:gap-8 max-w-5xl mx-auto">
        {/* 4 Feature-Teaser Cards Column */}
        <div className="flex flex-col gap-3.5 w-full md:w-[320px] lg:w-[340px] shrink-0">
          {features.map((feature) => {
            const isSelected = feature.id === activeId;
            return (
              <div
                key={feature.id}
                role="button"
                tabIndex={0}
                onClick={() => setActiveId(feature.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveId(feature.id);
                  }
                }}
                aria-selected={isSelected}
                className={`group p-3.5 sm:p-4 rounded-2xl backdrop-blur-sm border flex items-center gap-3.5 shadow-lg transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? `${feature.activeBorder} ${feature.activeBg} translate-x-1 sm:translate-x-1.5`
                    : `bg-[#151322]/80 border-white/[0.08] ${feature.hoverBorder} hover:translate-x-1.5 shadow-black/40`
                }`}
              >
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
                  <p className="text-xs text-white/50 font-normal">
                    {feature.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail Box on the Right */}
        <div className="w-full md:flex-1 rounded-2xl bg-[#151322]/80 backdrop-blur-sm border border-white/[0.08] p-6 sm:p-8 lg:p-10 shadow-xl shadow-black/40 flex flex-col justify-center min-h-[220px] md:min-h-[280px] transition-all duration-200">
          <div key={activeFeature.id} className="animate-fade-in text-left">
            <img
              src={activeFeature.panelIcon}
              alt=""
              className="w-20 h-20 sm:w-24 sm:h-24 md:w-[120px] md:h-[120px] object-contain mx-auto block mb-4 sm:mb-5 transition-all duration-200"
            />
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mb-3">
              {activeFeature.boxTitle}
            </h3>
            <p className="text-sm sm:text-base text-white/70 leading-relaxed font-normal">
              {activeFeature.description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureCards;
