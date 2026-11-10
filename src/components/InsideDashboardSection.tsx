import React from 'react';
import { Landmark, Gauge, Coins, Calculator, Target, Bell } from 'lucide-react';

interface ToolCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const tools: ToolCard[] = [
  {
    id: 'net-financial-position',
    title: 'Net Financial Position',
    description: 'Assets minus liabilities at a glance.',
    icon: <Landmark className="w-5 h-5 text-purple-300" />,
  },
  {
    id: 'weekly-spending-limit',
    title: 'Weekly Spending Limit',
    description: 'A safe range to spend this week.',
    icon: <Gauge className="w-5 h-5 text-purple-300" />,
  },
  {
    id: 'live-gold-rate',
    title: 'Live Gold Rate',
    description: '24K and 22K rates, updated.',
    icon: <Coins className="w-5 h-5 text-purple-300" />,
  },
  {
    id: 'live-calculator',
    title: 'Live Calculator',
    description: 'Try changes before you make them.',
    icon: <Calculator className="w-5 h-5 text-purple-300" />,
  },
  {
    id: 'strongest-weakest-pillar',
    title: 'Strongest and weakest pillar',
    description: 'Know where to focus first.',
    icon: <Target className="w-5 h-5 text-purple-300" />,
  },
  {
    id: 'smart-alerts',
    title: 'Smart alerts and next steps',
    description: 'Clear actions from your own data.',
    icon: <Bell className="w-5 h-5 text-purple-300" />,
  },
];

export const InsideDashboardSection: React.FC = () => {
  return (
    <section className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 text-left">
      <div className="max-w-4xl">
        {/* Eyebrow */}
        <p className="text-xs font-semibold tracking-wider text-purple-400 uppercase mb-3">
          INSIDE YOUR DASHBOARD
        </p>

        {/* Heading */}
        <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-white tracking-tight leading-[1.2]">
          Everything you need,{' '}
          <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent">
            one screen
          </span>
        </h2>

        {/* Subtitle */}
        <p className="mt-3 text-sm sm:text-base text-white/60 font-normal leading-relaxed">
          Six tools that make the numbers useful every day.
        </p>
      </div>

      {/* Six Cards in a 3 x 2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mt-10 sm:mt-12">
        {tools.map((card) => (
          <div
            key={card.id}
            className="group rounded-2xl border border-white/[0.08] bg-[#141026]/80 backdrop-blur-sm p-6 sm:p-7 flex flex-col justify-between hover:border-purple-500/40 hover:bg-[#181330]/90 transition-all duration-300 shadow-lg shadow-black/40 text-left"
          >
            <div>
              {/* Icon Container */}
              <div className="w-11 h-11 rounded-xl bg-purple-900/25 border border-purple-500/20 flex items-center justify-center text-purple-300 mb-5 group-hover:scale-105 transition-transform duration-300">
                {card.icon}
              </div>

              {/* Title */}
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {card.title}
              </h3>

              {/* Description */}
              <p className="text-xs sm:text-sm text-white/50 font-normal leading-relaxed mt-2">
                {card.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default InsideDashboardSection;

