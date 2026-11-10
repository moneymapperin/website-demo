import React from 'react';
import { ArrowRight } from 'lucide-react';
import { navigateTo } from '../lib/navigation';

export const StartJourneySection: React.FC = () => {
  return (
    <section className="relative py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 text-left">
      <div className="relative w-full rounded-3xl border border-white/[0.08] bg-[#120e24]/90 backdrop-blur-md p-8 sm:p-12 lg:p-16 overflow-hidden shadow-2xl shadow-black/50">
        {/* Soft Purple Glow on the Right Side */}
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-[550px] h-[380px] bg-gradient-to-l from-purple-600/35 via-fuchsia-600/15 to-transparent rounded-full blur-[110px] pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          {/* Eyebrow */}
          <p className="text-xs font-semibold tracking-wider text-purple-400 uppercase mb-3">
            START YOUR JOURNEY TODAY
          </p>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.18]">
            Take Control of
            <br />
            Your{' '}
            <span className="bg-gradient-to-r from-purple-300 via-fuchsia-300 to-purple-400 bg-clip-text text-transparent">
              Financial Life
            </span>
          </h2>

          {/* Subtitle */}
          <p className="mt-4 text-sm sm:text-base text-white/60 font-normal leading-relaxed max-w-xl">
            Join thousands of individuals who are building a more secure and stress-free future with MoneyMapper.
          </p>

          {/* Button */}
          <div className="mt-8">
            <button
              type="button"
              onClick={() => navigateTo('/register')}
              className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 hover:opacity-95 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer inline-flex items-center gap-2"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StartJourneySection;

