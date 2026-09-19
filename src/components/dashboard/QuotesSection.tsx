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
      className="relative min-h-[105px] rounded-[22px] bg-gradient-to-br from-[#200B3B] via-[#3B126A] to-[#280B4D] border-[1.2px] border-[#5B1D99]/60 shadow-[0_6px_16px_rgba(32,11,59,0.5)] overflow-hidden p-4 sm:p-5 mb-4"
      data-testid="quotes-section"
    >
      {/* Right Side Graphics: Arrow + Compass Watermark */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-2 pointer-events-none select-none opacity-40">
        <svg className="w-7 h-7 text-[#A855F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 19L19 5m0 0H8m11 0v11" />
        </svg>
        <div className="w-14 h-14 rounded-full border border-[#A855F7]/30 flex items-center justify-center text-[#A855F7]">
          🧭
        </div>
      </div>

      {/* Quote text */}
      <div className="relative z-10 flex items-start space-x-2.5 max-w-[80%] sm:max-w-[85%]">
        <span className="text-3xl font-black leading-none text-[#A855F7] select-none">“</span>
        <p className="text-[12.5px] leading-snug font-semibold text-white/95 mt-1">
          {quote}
        </p>
      </div>
    </div>
  );
};
