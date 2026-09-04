import { useComingSoon } from '../context/ComingSoonContext';
import { Sparkles, Check, ArrowRight } from 'lucide-react';

export const AIAssistantSection: React.FC = () => {
  const { openComingSoon } = useComingSoon();

  const checklist = [
    '24x7 AI Support',
    'Personalized Guidance',
    'Smart Recommendations',
    'Actionable Insights',
  ];

  const quickChips = [
    'Emergency Fund',
    'Mutual Funds',
    'Edit Profile',
  ];

  return (
    <section className="relative py-16 lg:py-24 overflow-hidden">
      {/* Ambient background glow & soft lighting */}
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[500px] bg-brand-purple/10 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 right-1/4 w-[500px] h-[450px] bg-brand-magenta/10 blur-[140px] pointer-events-none -z-10" />

      {/* Subtle background star sparkles */}
      <div className="absolute top-20 right-1/3 text-purple-400/30 text-xs pointer-events-none select-none">✦</div>
      <div className="absolute bottom-16 left-1/3 text-pink-400/25 text-sm pointer-events-none select-none">✦</div>
      <div className="absolute top-1/2 right-1/6 text-purple-300/20 text-xs pointer-events-none select-none">✦</div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          
          {/* Left Column: Pill, Heading, Subtext, Checklist, CTA Button */}
          <div className="lg:col-span-6 flex flex-col items-start text-left z-10">
            
            {/* Pill Badge */}
            <div
              onClick={() => openComingSoon('AI Assistant')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#171329] border border-brand-purple/30 text-xs font-semibold text-purple-300 shadow-sm shadow-brand-purple/20 mb-6 cursor-pointer hover:border-brand-purple/50 transition-all backdrop-blur-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-magenta" />
              <span className="tracking-wide uppercase text-[11px]">AI Assistant</span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight leading-[1.15] mb-5">
              <span className="block text-white">Your Personal</span>
              <span className="block">
                <span className="text-white">Financial </span>
                <span className="bg-gradient-to-r from-[#9333ea] via-[#c026d3] to-[#ec4899] bg-clip-text text-transparent">
                  Companion
                </span>
              </span>
            </h2>

            {/* Subtext Paragraph */}
            <p className="text-sm sm:text-base text-white/60 font-normal leading-relaxed max-w-lg mb-8">
              Ask anything about finance, investments, insurance, or planning. Get instant, personalized answers.
            </p>

            {/* Checklist */}
            <div className="space-y-3.5 mb-8 w-full max-w-md select-none">
              {checklist.map((item) => (
                <div
                  key={item}
                  onClick={() => openComingSoon(item)}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-5 h-5 rounded-full bg-[#201a3d] border border-purple-500/40 flex items-center justify-center text-emerald-400 shrink-0 group-hover:border-emerald-400/70 transition-colors shadow-sm">
                    <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                  </div>
                  <span className="text-sm sm:text-base font-medium text-white/90 group-hover:text-white transition-colors">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {/* Primary Action Button */}
            <button
              id="try-ai-assistant-btn"
              onClick={() => openComingSoon('Try AI Assistant')}
              className="px-8 py-3.5 rounded-2xl font-semibold text-white bg-brand-gradient hover:opacity-95 active:scale-[0.98] shadow-lg shadow-brand-purple/30 transition-all text-base focus:outline-none cursor-pointer"
            >
              Try AI Assistant
            </button>

          </div>

          {/* Right Column: Chat Panel Card */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end z-10">
            <div className="relative w-full max-w-[460px] rounded-3xl bg-[#120e24]/90 backdrop-blur-md border border-white/10 p-5 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.7),0_0_80px_rgba(139,92,246,0.15)] flex flex-col justify-between">
              
              {/* Header Row: Title on Left, Mascot Image on Right */}
              <div className="flex items-start justify-between mb-4 relative">
                {/* Left Badge + Title */}
                <div className="flex items-center gap-2.5 pt-1">
                  <div className="w-7 h-7 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    AI Assistant
                  </h3>
                </div>

                {/* Right: Literal Mascot Image */}
                <div className="relative -mt-3 -mr-1 select-none">
                  {/* Subtle sparkle accents around mascot */}
                  <span className="absolute -top-1 -left-2 text-purple-400 text-xs animate-pulse">✦</span>
                  <span className="absolute top-6 -right-2 text-pink-400 text-[10px] animate-pulse">✦</span>
                  <img
                    src="/src/assets/mascot.png"
                    alt="MoneyMapper AI Mascot"
                    className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-[0_10px_20px_rgba(59,130,246,0.3)] transition-transform hover:scale-105 duration-200"
                  />
                </div>
              </div>

              {/* Assistant Chat Bubble */}
              <div
                onClick={() => openComingSoon('AI Assistant Message')}
                className="bg-[#1a1532] border border-white/[0.08] rounded-2xl rounded-tl-sm p-4 sm:p-5 mb-5 shadow-inner text-left cursor-pointer hover:border-white/15 transition-all active:scale-[0.99]"
              >
                <p className="text-xs sm:text-sm text-white/85 leading-relaxed font-normal">
                  Hi! I'm your financial assistant. You can ask me anything about your financial pillars, mutual funds, insurance, or planning. How can I help you today?
                </p>
              </div>

              {/* 3 Quick-Reply Chip Buttons */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-6">
                {quickChips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => openComingSoon(chip)}
                    className="flex-1 min-w-[100px] py-2 px-3 rounded-xl bg-[#1a1532] hover:bg-[#231d42] border border-white/10 hover:border-brand-purple/40 text-xs font-semibold text-white/80 hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer text-center whitespace-nowrap"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Bottom Input Field & Send Button */}
              <div
                onClick={() => openComingSoon('AI Assistant Chat')}
                className="relative flex items-center justify-between rounded-2xl bg-[#17122b] border border-white/10 hover:border-brand-purple/40 px-4 py-2.5 sm:py-3 transition-all cursor-pointer shadow-inner group"
              >
                <span className="text-xs sm:text-sm text-white/40 select-none truncate">
                  Ask me anything about finance...
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openComingSoon('AI Assistant Chat');
                  }}
                  className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white shadow-md shadow-brand-purple/30 group-hover:scale-105 transition-transform shrink-0 ml-2 focus:outline-none"
                  aria-label="Send message"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default AIAssistantSection;
