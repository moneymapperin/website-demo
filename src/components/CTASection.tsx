import React from 'react';
import { useComingSoon } from '../context/ComingSoonContext';
import { navigateTo } from '../lib/navigation';
import { PhoneMockup } from './PhoneMockup';

export const CTASection: React.FC = () => {
  const { openComingSoon } = useComingSoon();

  return (
    <section className="relative pt-16 sm:pt-20 lg:pt-24 pb-12 lg:pb-0 overflow-hidden bg-gradient-to-b from-[#090714] via-[#0d0a1c] to-[#070511]">
      {/* Background Ambient Glow & Wavy Accent Lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft Purple Ambient Glow */}
        <div className="absolute right-0 sm:right-1/4 top-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute left-10 top-1/3 w-[350px] h-[350px] bg-brand-magenta/5 rounded-full blur-[100px]" />

        {/* Dynamic Curved Flow Lines behind the phone */}
        <svg
          className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[500px] opacity-20 hidden sm:block"
          viewBox="0 0 600 500"
          fill="none"
        >
          <path
            d="M50 400C180 380 250 220 380 260C510 300 540 100 620 80"
            stroke="url(#ctaLineGradient1)"
            strokeWidth="1.5"
          />
          <path
            d="M0 320C150 300 220 160 360 200C500 240 520 60 620 40"
            stroke="url(#ctaLineGradient2)"
            strokeWidth="1.2"
          />
          <path
            d="M100 480C220 450 300 310 440 340C560 370 580 180 650 140"
            stroke="url(#ctaLineGradient1)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <defs>
            <linearGradient id="ctaLineGradient1" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9333ea" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#c026d3" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="ctaLineGradient2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.1" />
              <stop offset="60%" stopColor="#8b5cf6" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Left Column: Heading, Subtext, Dual Buttons */}
          <div className="lg:col-span-6 z-10 text-center lg:text-left pt-2 pb-6 lg:pb-24">
            <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold tracking-tight text-white leading-[1.18]">
              Take Control of <br />
              <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent">
                Your Financial Journey
              </span>
            </h2>

            <p className="mt-4 text-white/60 text-sm sm:text-base leading-relaxed max-w-lg mx-auto lg:mx-0">
              Join thousands of smart investors who are building wealth with clarity and confidence.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4">
              {/* Primary Solid Gradient Button */}
              <button
                onClick={() => navigateTo('/register')}
                className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 hover:opacity-95 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                Get Started Free
              </button>

              {/* Secondary Outline Button */}
              <button
                onClick={() => openComingSoon('Explore Features')}
                className="px-7 py-3.5 rounded-2xl bg-[#141026] hover:bg-[#1a1532] border border-white/15 hover:border-white/30 text-white font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                Explore Features
              </button>
            </div>
          </div>

          {/* Right Column: Reused CSS Phone Mockup Component with slight tilt & size match */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end overflow-hidden pt-4 lg:pt-0 -mb-6 sm:-mb-10 lg:-mb-14">
            <div className="relative transform rotate-[1.5deg] scale-[0.88] sm:scale-95 lg:scale-100 origin-top transition-transform duration-500 hover:rotate-0">
              <PhoneMockup />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default CTASection;
