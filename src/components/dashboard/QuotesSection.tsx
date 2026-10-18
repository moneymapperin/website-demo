import React, { useMemo } from 'react';

export const QUOTES = [
  'Beware of little expenses; a small leak will sink a great ship. 🚢',
  "Don't save what is left after spending; spend what is left after saving. 💰",
  'A budget is telling your money where to go instead of wondering where it went. 📈',
  'Financial freedom is available to those who learn about it and work for it. 🗽',
  "The goal isn't more money. The goal is living life on your terms. 🌟",
  'Wealth consists not in having great possessions, but in having few wants. 🧘',
  'Investing should be more like watching paint dry or watching grass grow. 🌱',
  'Rich people have small TVs and big libraries, and poor people have small libraries and big TVs. 📚',
  'Never depend on single income. Make investment to create a second source. 🔄',
  'The best time to plant a tree was 20 years ago. The second best time is now. 🌳',
  'Do not put all your eggs in one basket. 🧺',
  'Opportunity is missed by most people because it is dressed in overalls and looks like work. 🛠️',
  'Someone is sitting in the shade today because someone planted a tree a long time ago. 🌳',
  'Price is what you pay. Value is what you get. 💎',
  'Money is a terrible master but an excellent servant. 💼',
  'Formal education will make you a living; self-education will make you a fortune. 🎓',
  'The more you learn, the more you earn. 📖',
  'It’s not how much money you make, but how much money you keep. 🏦',
  'Compound interest is the eighth wonder of the world. 🌀',
  "If you don't find a way to make money while you sleep, you will work until you die. 💤",
];

export interface QuotesSectionProps {
  quoteOverride?: string;
}

export const QuotesSection: React.FC<QuotesSectionProps> = ({ quoteOverride }) => {
  const quote = useMemo(() => {
    if (quoteOverride) return quoteOverride;
    const idx = Math.floor(Math.random() * QUOTES.length);
    return QUOTES[idx];
  }, [quoteOverride]);

  return (
    <div
      className="relative rounded-3xl bg-gradient-to-r from-[#1c0830] via-[#2f0e57] to-[#1c0830] border border-[#5B1D99]/50 shadow-[0_10px_30px_rgba(28,8,48,0.4)] overflow-hidden p-6 sm:p-7 text-center"
      data-testid="quotes-section"
    >
      <div className="relative z-10 flex items-center justify-center gap-3 sm:gap-4 max-w-4xl mx-auto">
        <span className="text-3xl sm:text-5xl font-serif font-black leading-none text-[#A855F7] select-none shrink-0 opacity-80">
          “
        </span>
        <p className="text-sm sm:text-base md:text-lg leading-relaxed font-semibold text-white/95 text-center px-1">
          {quote}
        </p>
        <span className="text-3xl sm:text-5xl font-serif font-black leading-none text-[#A855F7] select-none shrink-0 opacity-80">
          ”
        </span>
      </div>
    </div>
  );
};
