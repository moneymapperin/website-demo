import React from 'react';
import { Lock, Server, EyeOff, Timer, Trash2, Key } from 'lucide-react';

interface SecurityCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  isHighlighted?: boolean;
}

const securityCards: SecurityCard[] = [
  {
    id: 'encrypted',
    title: 'Encrypted',
    description: 'In transit and at rest.',
    icon: <Lock className="w-5 h-5 text-purple-300" />,
  },
  {
    id: 'hosted-in-india',
    title: 'Hosted in India',
    description: 'Servers located in India.',
    icon: <Server className="w-5 h-5 text-purple-300" />,
  },
  {
    id: 'never-sold',
    title: 'Never sold',
    description: 'No data selling, ever.',
    icon: <EyeOff className="w-5 h-5 text-purple-300" />,
  },
  {
    id: 'secure-sessions',
    title: 'Secure sessions',
    description: 'Auto logout when idle.',
    icon: <Timer className="w-5 h-5 text-purple-300" />,
    isHighlighted: true,
  },
  {
    id: 'delete-anytime',
    title: 'Delete anytime',
    description: 'You control your data.',
    icon: <Trash2 className="w-5 h-5 text-purple-300" />,
  },
  {
    id: 'no-bank-login',
    title: 'No bank login',
    description: 'You enter your own numbers.',
    icon: <Key className="w-5 h-5 text-purple-300" />,
  },
];

export const SecurityPrivacySection: React.FC = () => {
  return (
    <section className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 text-left">
      <div className="max-w-4xl">
        {/* Eyebrow */}
        <p className="text-xs font-semibold tracking-wider text-purple-400 uppercase mb-3">
          SECURITY AND PRIVACY
        </p>

        {/* Heading */}
        <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-white tracking-tight leading-[1.2]">
          Your money is personal.{' '}
          <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent">
            So is your data.
          </span>
        </h2>
      </div>

      {/* Six Cards in a 3 x 2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mt-10 sm:mt-12">
        {securityCards.map((card) => (
          <div
            key={card.id}
            className={`group rounded-2xl border p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 text-left ${
              card.isHighlighted
                ? 'border-purple-500/70 bg-[#17122e]/95 shadow-[0_0_25px_rgba(168,85,247,0.18)]'
                : 'border-white/[0.08] bg-[#141026]/80 backdrop-blur-sm hover:border-purple-500/40 hover:bg-[#181330]/90 shadow-lg shadow-black/40'
            }`}
          >
            <div>
              {/* Icon Container */}
              <div
                className={`w-11 h-11 rounded-xl border flex items-center justify-center text-purple-300 mb-5 transition-transform duration-300 ${
                  card.isHighlighted
                    ? 'bg-purple-900/40 border-purple-500/40'
                    : 'bg-purple-900/25 border-purple-500/20 group-hover:scale-105'
                }`}
              >
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

export default SecurityPrivacySection;

