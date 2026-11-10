import React from 'react';
import { PiggyBank, ShieldAlert, Layers, Compass } from 'lucide-react';

interface ProblemCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const problemCards: ProblemCard[] = [
  {
    id: 'savings',
    title: 'Savings that never stay',
    description: 'Money comes in, money goes out, nothing is left.',
    icon: <PiggyBank className="w-5 h-5 text-purple-300" />,
  },
  {
    id: 'protection',
    title: 'Protection gaps',
    description: 'Not sure if insurance is enough.',
    icon: <ShieldAlert className="w-5 h-5 text-purple-300" />,
  },
  {
    id: 'no-single-picture',
    title: 'No single picture',
    description: 'Accounts, SIPs, policies everywhere.',
    icon: <Layers className="w-5 h-5 text-purple-300" />,
  },
  {
    id: 'generic-guidance',
    title: 'Guidance that feels generic',
    description: 'Advice not built around you.',
    icon: <Compass className="w-5 h-5 text-purple-300" />,
  },
];

export const WhyMoneyMapper: React.FC = () => {
  return (
    <section className="relative py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
      <div className="max-w-4xl mx-auto text-center">
        {/* Eyebrow */}
        <p className="text-xs font-semibold tracking-widest text-purple-400 uppercase mb-3">
          WHY MONEYMAPPER
        </p>

        {/* Main Heading */}
        <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-white tracking-tight leading-[1.2]">
          Most people know they should manage money better.{' '}
          <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent">
            Few have a system.
          </span>
        </h2>

        {/* Subtitle */}
        <p className="mt-4 sm:mt-5 text-sm sm:text-base text-white/60 font-normal leading-relaxed max-w-2xl mx-auto">
          Irregular savings, poor planning, little protection and last-minute tax decisions. We built MoneyMapper to turn that into a simple, structured habit.
        </p>
      </div>

      {/* Four Cards in One Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 max-w-6xl mx-auto mt-12 sm:mt-16">
        {problemCards.map((card) => (
          <div
            key={card.id}
            className="group rounded-2xl border border-white/[0.08] bg-[#141026]/80 backdrop-blur-sm p-6 flex flex-col justify-between hover:border-purple-500/40 hover:bg-[#181330]/90 transition-all duration-300 shadow-lg shadow-black/40 text-left"
          >
            <div>
              {/* Icon Container */}
              <div className="w-11 h-11 rounded-xl bg-purple-900/25 border border-purple-500/20 flex items-center justify-center text-purple-300 mb-5 group-hover:scale-105 transition-transform duration-300">
                {card.icon}
              </div>

              {/* Title */}
              <h3 className="text-base font-bold text-white tracking-tight">
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

export default WhyMoneyMapper;
