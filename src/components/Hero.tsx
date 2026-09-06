import { useComingSoon } from '../context/ComingSoonContext';
import { PhoneMockup } from './PhoneMockup';
import { FeatureCards } from './FeatureCards';
import { Star } from 'lucide-react';

export const Hero: React.FC = () => {
  const { openComingSoon } = useComingSoon();

  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24">
      {/* Background Radial Glow & Ambient Lighting */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[1000px] h-[650px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/25 via-[#1a1138]/20 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-10 w-[550px] h-[550px] bg-brand-violet/15 rounded-full blur-[130px] pointer-events-none -z-10" />
      
      {/* Subtle curved tech line / mesh in background */}
      <svg
        className="absolute bottom-10 left-1/4 w-[750px] h-[350px] text-purple-600/10 pointer-events-none -z-10"
        viewBox="0 0 750 350"
        fill="none"
      >
        <path
          d="M0 250 C 200 350, 450 150, 750 220"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <path
          d="M-50 200 C 180 320, 500 120, 800 190"
          stroke="currentColor"
          strokeWidth="1"
        />
        <path
          d="M20 280 C 220 380, 480 180, 780 250"
          stroke="currentColor"
          strokeWidth="0.8"
        />
      </svg>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline, Subtext, Buttons, Social Proof & Press Logos */}
          <div className="lg:col-span-6 flex flex-col items-start text-left z-10">
            
            {/* Pill Badge */}
            <div
              onClick={() => openComingSoon('AI Financial Navigation')}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#171329] border border-brand-purple/30 text-xs font-medium text-purple-300 shadow-sm shadow-brand-purple/20 mb-6 cursor-pointer hover:border-brand-purple/50 transition-all backdrop-blur-sm"
            >
              <span className="text-brand-magenta text-sm leading-none">✦</span>
              <span>AI-Powered Financial Navigation</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[62px] xl:text-[68px] font-extrabold tracking-tight leading-[1.08] mb-6">
              <span className="block text-white">Map Your Money.</span>
              <span className="block bg-gradient-to-r from-[#9333ea] via-[#c026d3] to-[#ec4899] bg-clip-text text-transparent">
                Build Your Future.
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-base sm:text-lg text-white/60 font-normal leading-relaxed max-w-xl mb-8">
              One app. Five pillars. Complete financial clarity. Track, Analyze &amp; Grow your wealth with AI.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 mb-9 w-full sm:w-auto">
              <button
                id="hero-get-started-btn"
                onClick={() => openComingSoon('Get Started Free')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-white bg-brand-gradient hover:opacity-95 active:scale-[0.98] shadow-xl shadow-brand-purple/30 transition-all text-base focus:outline-none cursor-pointer"
              >
                Get Started Free
              </button>
              <button
                id="hero-explore-features-btn"
                onClick={() => openComingSoon('Explore Features')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-white bg-[#151322] border border-white/15 hover:border-white/30 hover:bg-[#1c1930] active:scale-[0.98] transition-all text-base focus:outline-none cursor-pointer"
              >
                Explore Features
              </button>
            </div>

            {/* Social Proof: Avatars + Rating */}
            <div className="flex items-center gap-3.5 mb-12 select-none">
              {/* Overlapping Avatars */}
              <div className="flex items-center -space-x-2.5">
                <img
                  src="/images/user-avatar.jpg"
                  alt="Member"
                  className="w-9 h-9 rounded-full border-2 border-[#0b0a14] object-cover ring-1 ring-white/10"
                />
                <img
                  src="/src/assets/mascot.png"
                  alt="MoneyMapper Mascot"
                  className="w-9 h-9 rounded-full border-2 border-[#0b0a14] object-contain bg-[#1c1736] p-0.5 ring-1 ring-white/10"
                />
                <div className="w-9 h-9 rounded-full border-2 border-[#0b0a14] bg-gradient-to-tr from-brand-violet to-brand-magenta flex items-center justify-center text-[11px] font-bold text-white ring-1 ring-white/10">
                  +10k
                </div>
              </div>

              {/* Text & 5-Star Row */}
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-white/90">
                  Trusted by 10,000+ users
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-white/80">4.8/5</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Realistic Phone Mockup + 4 Stacked Feature Cards */}
          <div className="lg:col-span-6 flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-6 z-10">
            {/* Realistic Phone Mockup matching exact orientation in reference image 01 */}
            <PhoneMockup className="transition-transform duration-300 hover:scale-[1.01]" />

            {/* 4 Feature-Teaser Cards */}
            <FeatureCards />
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
