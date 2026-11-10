import React from 'react';

interface ScoreCard {
  title: string;
  score: number;
  subtitle: string;
}

const scoreCards: ScoreCard[] = [
  {
    title: 'Stock Score',
    score: 75,
    subtitle: 'NIFTY 50 Companies',
  },
  {
    title: 'Mutual Fund Score',
    score: 82,
    subtitle: 'Top Performing Funds',
  },
  {
    title: 'Insurance Score',
    score: 83,
    subtitle: '32 Life & Health Plans',
  },
  {
    title: 'IPO Score',
    score: 78,
    subtitle: 'Upcoming IPOs',
  },
];

export const ProductPreviewSection: React.FC = () => {
  return (
    <section className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 text-left">
      <div className="max-w-4xl">
        {/* Eyebrow */}
        <p className="text-xs font-semibold tracking-wider text-purple-400 uppercase mb-3">
          PRODUCT PREVIEW
        </p>

        {/* Heading */}
        <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-white tracking-tight leading-[1.2]">
          See your whole money picture in{' '}
          <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent">
            one screen.
          </span>
        </h2>
      </div>

      {/* Dashboard Preview Card */}
      <div className="w-full rounded-3xl border border-white/[0.08] bg-[#0f0c1e]/90 backdrop-blur-md p-6 sm:p-8 lg:p-10 shadow-2xl shadow-black/60 text-left mt-10 sm:mt-12">
        {/* Dashboard Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 sm:pb-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <span className="text-base sm:text-lg font-bold text-white tracking-tight">
              MoneyMapper
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-900/40 border border-purple-500/30 text-[10px] font-bold text-purple-300 uppercase tracking-wider">
              PREMIUM
            </span>
          </div>
          <span className="text-xs sm:text-sm text-white/50 font-normal">
            This Month
          </span>
        </div>

        {/* 2x2 Main Tiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mt-6">
          {/* Tile 1: Financial Fitness Score */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#141026]/80 p-5 sm:p-6 flex flex-col justify-between hover:border-purple-500/30 transition-all shadow-md">
            <div>
              <span className="text-xs font-semibold text-white/70 uppercase tracking-wider block mb-3">
                Financial Fitness Score · AVERAGE
              </span>
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-extrabold text-amber-400">
                  45{' '}
                  <span className="text-xs sm:text-sm font-normal text-white/40">
                    /100
                  </span>
                </span>
                <span className="text-xs font-semibold text-emerald-400 inline-flex items-center gap-1">
                  ↗ +12 pts from last month
                </span>
              </div>
            </div>
            <p className="text-xs text-white/45 font-normal mt-3 leading-relaxed">
              Based on spending ratio, investments &amp; debts.
            </p>
          </div>

          {/* Tile 2: Net Financial Position */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#141026]/80 p-5 sm:p-6 flex flex-col justify-between hover:border-purple-500/30 transition-all shadow-md">
            <div>
              <span className="text-xs font-semibold text-white/70 tracking-wider block mb-1">
                Net Financial Position
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight block mt-2">
                ₹2,843,000
              </span>
            </div>
            <p className="text-xs font-semibold text-emerald-400 mt-3">
              +₹18,450 (8.3%) vs last month
            </p>
          </div>

          {/* Tile 3: Live Gold Rate */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#141026]/80 p-5 sm:p-6 flex flex-col justify-between hover:border-purple-500/30 transition-all shadow-md">
            <div>
              <span className="text-xs font-semibold text-white/70 tracking-wider block mb-1">
                LIVE GOLD RATE 24K (PER GRAM)
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight block mt-2">
                ₹15,118
              </span>
            </div>
          </div>

          {/* Tile 4: Estimated Spending Limit */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#141026]/80 p-5 sm:p-6 flex flex-col justify-between hover:border-purple-500/30 transition-all shadow-md">
            <div>
              <span className="text-xs font-semibold text-white/70 tracking-wider block mb-1">
                ESTIMATED SPENDING LIMIT
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-white tracking-tight block mt-2">
                ₹13,300 – ₹14,700
              </span>
            </div>
            <div className="text-xs text-white/50 mt-3 flex items-center gap-1.5">
              <span>This Week Tonight</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              <span className="text-emerald-400 font-semibold">Safe buffer</span>
            </div>
          </div>
        </div>

        {/* Sub-section: MONEYMAPPER SCORE CARDS */}
        <div className="mt-8 sm:mt-10">
          <span className="text-xs font-semibold tracking-wider text-white/60 uppercase mb-4 block">
            MONEYMAPPER SCORE CARDS
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {scoreCards.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-white/[0.08] bg-[#141026]/80 p-4 sm:p-5 flex flex-col justify-between hover:border-purple-500/30 transition-all shadow-md text-left"
              >
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-white/70">
                    {card.title}
                  </h4>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-2">
                    {card.score}{' '}
                    <span className="text-xs font-normal text-white/40">
                      /100
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-white/40 mt-3">
                  {card.subtitle}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductPreviewSection;

