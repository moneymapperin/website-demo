import React, { useState } from 'react';
import mascotImg from '../assets/mascot.png';
import { Send } from 'lucide-react';

const quickChips = [
  { label: 'Reliance Stock', icon: '📊' },
  { label: 'SBI Mutual Fund', icon: '📈' },
  { label: 'Upcoming IPOs', icon: '🚀' },
  { label: 'Emergency Fund', icon: '🚨' },
  { label: 'Weekly Expenses', icon: '📅' },
  { label: 'Edit Profile', icon: '👤' },
];

const suggestionChips = [
  "What's today's best stock for me?",
  "Which mutual fund suits my long-term goals?",
  "Best liquid fund for my emergency needs?",
  "Which insurance fits my budget?",
];

export const AiAssistantFeaturePanel: React.FC = () => {
  const [inputVal, setInputVal] = useState('');

  return (
    <div className="w-full flex flex-col justify-between min-h-[460px] text-left">
      {/* 1. Header Bar at the top of the panel */}
      <div className="flex items-center gap-3 pb-3 border-b border-white/[0.08] shrink-0">
        <img
          src={mascotImg}
          alt="AI Assistant Mascot"
          className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-[0_4px_10px_rgba(59,130,246,0.3)] select-none"
        />
        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          AI Assistant
        </h3>
      </div>

      {/* 2. Quick Action Chips Row (scrollable on mobile) */}
      <div className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar shrink-0">
        {quickChips.map((chip) => (
          <button
            key={chip.label}
            type="button"
            /* Placeholder chip: visual only, no navigation or API calls */
            onClick={(e) => e.preventDefault()}
            className="px-3.5 py-1.5 rounded-full bg-[#151226] border border-white/10 hover:border-purple-500/40 text-xs font-medium text-white/85 hover:text-white transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>{chip.icon}</span>
            <span>{chip.label}</span>
          </button>
        ))}
      </div>

      {/* 3. Chat Area with Assistant Bubble */}
      <div className="flex-1 py-3 flex flex-col justify-start">
        <div className="flex items-start gap-2.5 max-w-2xl text-left">
          {/* Small Robot Avatar */}
          <div className="w-8 h-8 rounded-full bg-purple-900/30 border border-purple-500/30 flex items-center justify-center shrink-0 p-1 mt-0.5 shadow-sm">
            <img
              src={mascotImg}
              alt="Avatar"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Message Bubble + Timestamp */}
          <div className="flex flex-col items-start max-w-xl">
            <div className="rounded-2xl rounded-tl-sm bg-[#151226] border border-white/[0.08] p-4 sm:p-5 shadow-lg space-y-3.5">
              {/* Bubble Text */}
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-normal">
                Hi! I&apos;m your <strong className="font-bold text-white">AI Assistant</strong>. You can ask me questions about your financial pillars, mutual funds, or ask me to redirect you anywhere in the app!
              </p>

              {/* Four Suggestion Chips in 2 Rows */}
              <div className="flex flex-wrap gap-2 pt-1">
                {suggestionChips.map((text) => (
                  <button
                    key={text}
                    type="button"
                    /* Placeholder suggestion: visual only, no navigation or API calls */
                    onClick={(e) => e.preventDefault()}
                    className="px-3 py-1.5 rounded-full border border-purple-500/40 bg-purple-950/20 hover:bg-purple-900/30 hover:border-purple-400 text-purple-300 hover:text-purple-200 text-xs font-medium transition-all cursor-pointer text-left shadow-sm"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>

            {/* Timestamp */}
            <span className="text-[10px] text-white/40 mt-1.5 ml-1 select-none">
              06:15 PM
            </span>
          </div>
        </div>
      </div>

      {/* 4. Input Bar fixed at the bottom (Visual placeholder only — does not call any API) */}
      <div className="pt-2 shrink-0">
        <div className="rounded-2xl bg-[#0e0b1c] border border-white/[0.08] p-1.5 pl-4 sm:pl-5 flex items-center justify-between shadow-inner focus-within:border-purple-500/40 transition-colors">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                // Visual placeholder: clear without calling any API or service
                setInputVal('');
              }
            }}
            placeholder="Ask anything about your finances..."
            className="bg-transparent text-xs sm:text-sm text-white placeholder-white/35 focus:outline-none w-full mr-2"
          />
          <button
            type="button"
            onClick={() => setInputVal('')}
            aria-label="Send message (visual placeholder)"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:opacity-95 active:scale-95 flex items-center justify-center text-white shrink-0 shadow-md shadow-purple-600/30 cursor-pointer transition-all"
          >
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white -rotate-12 translate-x-[-1px]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiAssistantFeaturePanel;

