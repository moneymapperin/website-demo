import React from 'react';
import { Building2, Network, Smartphone, IndianRupee } from 'lucide-react';
import { navigateTo } from '../lib/navigation';

interface BusinessCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const businessCards: BusinessCard[] = [
  {
    id: 'workforce-health',
    title: 'Workforce financial health',
    description: 'Aggregate score for your team.',
    icon: <Building2 className="w-5 h-5 text-purple-300" />,
  },
  {
    id: 'department-breakdown',
    title: 'Department breakdown',
    description: 'Find where support is needed.',
    icon: <Network className="w-5 h-5 text-purple-300" />,
  },
  {
    id: 'employee-access',
    title: 'Employee app access',
    description: 'Every employee gets the full app.',
    icon: <Smartphone className="w-5 h-5 text-purple-300" />,
  },
  {
    id: 'pricing',
    title: '₹199 per employee per month',
    description: 'Simple per-seat pricing.',
    icon: <IndianRupee className="w-5 h-5 text-purple-300" />,
  },
];

export const BusinessSection: React.FC = () => {
  return (
    <section className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 text-left">
      <div className="max-w-4xl">
        {/* Eyebrow */}
        <p className="text-xs font-semibold tracking-wider text-purple-400 uppercase mb-3">
          MONEYMAPPER FOR BUSINESS
        </p>

        {/* Heading */}
        <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-white tracking-tight leading-[1.2]">
          Financial wellness for{' '}
          <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent">
            your whole team
          </span>
        </h2>

        {/* Subtitle */}
        <p className="mt-3 text-sm sm:text-base text-white/60 font-normal leading-relaxed max-w-2xl">
          Reduce money stress and improve retention. Aggregate insights for leaders, a private app for every employee.
        </p>
      </div>

      {/* Four Cards in One Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mt-10 sm:mt-12">
        {businessCards.map((card) => (
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

      {/* Two Buttons Below the Cards */}
      <div className="mt-10 sm:mt-12 flex flex-wrap items-center gap-4">
        {/* Filled Gradient Button */}
        <a
          href="/business-details.html"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 hover:opacity-95 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer inline-flex items-center gap-2"
        >
          Full business details →
        </a>

        {/* Dark Outlined Button */}
        <button
          type="button"
          onClick={() => navigateTo('/corporate-login')}
          className="px-6 py-3.5 rounded-2xl bg-[#141026] hover:bg-[#1a1532] border border-white/15 hover:border-white/30 text-white font-semibold text-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer inline-flex items-center"
        >
          Corporate login
        </button>
      </div>
    </section>
  );
};

export default BusinessSection;

