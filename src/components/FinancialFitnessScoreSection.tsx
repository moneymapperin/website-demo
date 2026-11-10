import React from 'react';

interface PillarBar {
  name: string;
  score: number;
  color: string;
}

const pillarBars: PillarBar[] = [
  { name: 'Income', score: 62, color: 'bg-amber-500' },
  { name: 'Expenses', score: 48, color: 'bg-amber-500' },
  { name: 'Savings', score: 35, color: 'bg-red-500' },
  { name: 'Protection', score: 40, color: 'bg-amber-500' },
  { name: 'Investment', score: 40, color: 'bg-amber-500' },
];

export const FinancialFitnessScoreSection: React.FC = () => {
  return (
    <section className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left Column: Eyebrow, Heading, Subtitle, Score Bands, CTA Button */}
        <div className="lg:col-span-6 flex flex-col text-left">
          {/* Eyebrow */}
          <p className="text-xs font-semibold tracking-wider text-purple-400 uppercase mb-3">
            THE FINANCIAL FITNESS SCORE
          </p>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-white tracking-tight leading-[1.18]">
            One number for your{' '}
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent">
              entire
            </span>
            <br className="hidden sm:inline" />{' '}
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent">
              financial health
            </span>
          </h2>

          {/* Subtitle */}
          <p className="mt-4 sm:mt-5 text-sm sm:text-base text-white/60 font-normal leading-relaxed max-w-xl">
            Every pillar is scored from 0 to 100. Your Financial Fitness Score is the average of all five, so one weak pillar cannot hide behind a strong one.
          </p>

          {/* Score Band Rows */}
          <div className="mt-8 flex flex-col gap-3 w-full">
            {/* Band 1: Red */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#141026]/80 p-4 sm:p-4.5 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                <span className="text-sm font-bold text-white">Below 40</span>
                <span className="text-sm text-white/50">Needs attention</span>
              </div>
            </div>

            {/* Band 2: Orange */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#141026]/80 p-4 sm:p-4.5 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span className="text-sm font-bold text-white">40 to 70</span>
                <span className="text-sm text-white/50">Room to improve</span>
              </div>
            </div>

            {/* Band 3: Green */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#141026]/80 p-4 sm:p-4.5 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-sm font-bold text-white">Above 70</span>
                <span className="text-sm text-white/50">Healthy</span>
              </div>
            </div>
          </div>

          {/* Full-width Button */}
          <div className="mt-8 w-full">
            <a
              href="/moneymapper-score-story.html"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 hover:opacity-95 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-center flex items-center justify-center gap-2"
            >
              How the score works →
            </a>
          </div>
        </div>

        {/* Right Column: Sample Card */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end w-full">
          <div className="w-full max-w-xl rounded-3xl border border-white/[0.08] bg-[#141026]/90 backdrop-blur-md p-6 sm:p-8 lg:p-10 shadow-2xl shadow-black/50 text-left">
            {/* Header: Label & SAMPLE Badge */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-white/70 uppercase">
                FINANCIAL FITNESS SCORE
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-900/40 border border-purple-500/30 text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                SAMPLE
              </span>
            </div>

            {/* Big Score Number */}
            <div className="mt-5 flex items-baseline">
              <span className="text-5xl sm:text-6xl font-extrabold text-amber-400 tracking-tight">
                45
              </span>
              <span className="text-base sm:text-lg font-normal text-white/40 ml-2">
                /100
              </span>
            </div>

            {/* Pillar Progress Bars */}
            <div className="mt-8 sm:mt-10 space-y-5">
              {pillarBars.map((pillar) => (
                <div key={pillar.name} className="space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-medium text-white/90">{pillar.name}</span>
                    <span className="font-normal text-white/50">{pillar.score}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pillar.color}`}
                      style={{ width: `${pillar.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Note */}
            <p className="mt-8 text-[11px] sm:text-xs text-white/40 font-normal">
              Illustration with sample numbers, not real user data.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinancialFitnessScoreSection;

