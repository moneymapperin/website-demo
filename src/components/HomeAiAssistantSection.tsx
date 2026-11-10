import React from 'react';
import { Database, Send, Sparkles } from 'lucide-react';
import mascotImg from '../assets/app/mascot.png';

export const HomeAiAssistantSection: React.FC = () => {
  return (
    <section className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 text-left">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left Column: Eyebrow, Heading, Subtitle, 2 Feature Cards */}
        <div className="lg:col-span-7 flex flex-col">
          {/* Eyebrow */}
          <p className="text-xs font-semibold tracking-wider text-purple-400 uppercase mb-3">
            AI ASSISTANT
          </p>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-white tracking-tight leading-[1.2]">
            Ask in plain words.{' '}
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent">
              Get answers
              <br className="hidden sm:inline" /> from your own numbers.
            </span>
          </h2>

          {/* Subtitle */}
          <p className="mt-4 sm:mt-5 text-sm sm:text-base text-white/60 font-normal leading-relaxed max-w-xl">
            Transparent, rule-based and private. It reads your dashboard, answers briefly and takes you to the right screen.
          </p>

          {/* Two Feature Cards on the Left */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mt-8 sm:mt-10">
            {/* Card 1: Knows your numbers */}
            <div className="group rounded-2xl border border-white/[0.08] bg-[#141026]/80 backdrop-blur-sm p-5 sm:p-6 flex flex-col justify-between hover:border-purple-500/40 hover:bg-[#181330]/90 transition-all duration-300 shadow-lg shadow-black/40">
              <div>
                <div className="w-11 h-11 rounded-xl bg-purple-900/25 border border-purple-500/20 flex items-center justify-center text-purple-300 mb-4 group-hover:scale-105 transition-transform duration-300">
                  <Database className="w-5 h-5 text-purple-300" />
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Knows your numbers
                </h3>
                <p className="text-xs sm:text-sm text-white/50 font-normal leading-relaxed mt-2">
                  Answers from your own dashboard.
                </p>
              </div>
            </div>

            {/* Card 2: Takes you to the right screen */}
            <div className="group rounded-2xl border border-white/[0.08] bg-[#141026]/80 backdrop-blur-sm p-5 sm:p-6 flex flex-col justify-between hover:border-purple-500/40 hover:bg-[#181330]/90 transition-all duration-300 shadow-lg shadow-black/40">
              <div>
                <div className="w-11 h-11 rounded-xl bg-purple-900/25 border border-purple-500/20 flex items-center justify-center text-purple-300 mb-4 group-hover:scale-105 transition-transform duration-300">
                  <Send className="w-5 h-5 text-purple-300" />
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Takes you to the right screen
                </h3>
                <p className="text-xs sm:text-sm text-white/50 font-normal leading-relaxed mt-2">
                  Quick actions after every answer.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Chat Mockup Card */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end w-full">
          <div className="w-full max-w-lg rounded-3xl border border-white/[0.08] bg-[#120e24]/90 backdrop-blur-md p-6 sm:p-7 shadow-2xl shadow-black/50 text-left">
            {/* Header: AI Assistant icon + title, Robot Mascot at top right */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-900/30 border border-purple-500/30 flex items-center justify-center text-purple-300">
                  <Sparkles className="w-4 h-4 text-purple-300" />
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  AI Assistant
                </h3>
              </div>

              {/* Robot Mascot Image */}
              <div className="relative -my-3">
                <img
                  src={mascotImg}
                  alt="AI Assistant Mascot"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_8px_16px_rgba(59,130,246,0.3)] select-none hover:scale-105 transition-transform duration-200"
                />
              </div>
            </div>

            {/* Chat Messages */}
            <div className="mt-6 space-y-4">
              {/* User Bubble (Purple gradient, right aligned) */}
              <div className="flex justify-end">
                <div className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl rounded-tr-sm bg-gradient-to-r from-purple-600 via-indigo-600 to-fuchsia-600 text-white text-xs sm:text-sm font-medium shadow-md max-w-[85%]">
                  Do I have enough insurance?
                </div>
              </div>

              {/* Assistant Bubble (Dark, left aligned) */}
              <div className="flex justify-start">
                <div className="p-4 sm:p-5 rounded-2xl rounded-tl-sm bg-[#181330] border border-white/[0.06] text-white/80 text-xs sm:text-sm leading-relaxed max-w-[95%] shadow-md">
                  Based on your income, a life cover target is about 15x your annual income. You are short on term cover. Want to open the Protection pillar?
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeAiAssistantSection;

