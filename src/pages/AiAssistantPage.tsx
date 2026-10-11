import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { usePlan } from '../hooks/usePlan';
import { chatIntentService, ChatMessage, normalizeRoute } from '../services/chatIntentService';
import { APP_COLORS } from '../theme/tokens';
import mascotImg from '../assets/app/mascot.png';
import {
  Send,
  Lock,
  ChevronRight,
} from 'lucide-react';

/**
 * Safe markdown tokenizer for bold text (**text**) and line breaks.
 * Complete protection against XSS: never uses dangerouslySetInnerHTML.
 */
export function renderFormattedText(text: string): React.ReactNode {
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    const parts: React.ReactNode[] = [];
    const regex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index));
      }
      parts.push(
        <strong key={`bold-${lineIdx}-${match.index}`} className="font-bold">
          {match[1]}
        </strong>
      );
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }

    return (
      <React.Fragment key={`line-${lineIdx}`}>
        {parts}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

export const AiAssistantPage: React.FC = () => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const { isPro, isFeatureAccessible, trialDaysRemaining } = usePlan();
  const navigate = useNavigate();

  // Assistant accessible if PRO or trial is active
  const isAiAccessible = isPro || (isFeatureAccessible && trialDaysRemaining > 0);
  const trialDays = Math.max(0, trialDaysRemaining);

  // Chat messages stored in component memory ONLY
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    { label: '📊 Reliance Stock', query: 'Reliance stock score' },
    { label: '📈 SBI Mutual Fund', query: 'SBI Bluechip Mutual Fund' },
    { label: '🚀 Upcoming IPOs', query: 'Upcoming IPO score' },
    { label: '🚨 Emergency Fund', query: 'Emergency Fund' },
    { label: '📅 Weekly Expenses', query: 'Weekly Expenses' },
    { label: '👤 Edit Profile', query: 'Edit Profile' },
  ];



  // Initialize with welcome message on mount
  useEffect(() => {
    const welcomeMsg: ChatMessage = {
      id: 'welcome',
      sender: 'bot',
      text:
        "Hi! I'm your **AI Assistant.** You can ask me questions about your financial pillars, mutual funds, or ask me to redirect you anywhere in the app!",
      redirectTo: null,
      redirectLabel: null,
      quickActions: [
        { label: "What's today's best stock for me?", route: "What's today's best stock for me?" },
        { label: 'Which mutual fund suits my long-term goals?', route: 'Which mutual fund suits my long-term goals?' },
        { label: 'Best liquid fund for my emergency needs?', route: 'Best liquid fund for my emergency needs?' },
        { label: 'Which insurance fits my budget?', route: 'Which insurance fits my budget?' },
      ],
      timestamp: formatCurrentTime(),
    };
    setMessages([welcomeMsg]);
  }, []);

  // Auto-scroll to bottom when user sends a message
  useEffect(() => {
    if (messages.length > 1 && typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  function formatCurrentTime(): string {
    const date = new Date();
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    const hoursStr = hours < 10 ? '0' + hours : hours;
    return `${hoursStr}:${minutesStr} ${ampm}`;
  }

  const handleSendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: trimmed,
      quickActions: [],
      timestamp: formatCurrentTime(),
    };

    setInputValue('');
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const botReply = await chatIntentService.processMessage(userMsg.text);
      setMessages((prev) => [...prev, botReply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: 'Sorry, I encountered an unexpected error processing your request. Please try again.',
          redirectTo: '/dashboard',
          redirectLabel: 'Go to Dashboard',
          quickActions: [],
          timestamp: formatCurrentTime(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleActionClick = (route: string) => {
    if (route.startsWith('/')) {
      navigate(normalizeRoute(route));
    } else {
      handleSendMessage(route);
    }
  };

  return (
    <div
      data-testid="ai-assistant-page"
      className="flex flex-col min-h-screen pb-12 transition-colors duration-200"
      style={{
        backgroundColor: isDark ? '#09090B' : '#F8FAFC',
        color: isDark ? '#FAFAFA' : '#0F172A',
      }}
    >
      {/* 1. Header with Search Bar & User Controls */}
      <header
        data-testid="ai-header"
        className="px-4 md:px-8 py-4 border-b select-none backdrop-blur-md sticky top-0 z-20 transition-colors"
        style={{
          background: isDark
            ? 'linear-gradient(180deg, #180B30 0%, #0D0E15 100%)'
            : 'rgba(255, 255, 255, 0.95)',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img
              src={mascotImg}
              alt="MoneyMapper Mascot"
              data-testid="ai-header-mascot"
              className="w-10 h-10 object-contain drop-shadow"
            />
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                AI Assistant
              </h1>
              {!isPro && isAiAccessible && (
                <span
                  data-testid="ai-trial-badge"
                  className="px-2 py-0.5 text-[9px] font-black tracking-wide rounded-md border text-amber-500 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-400/10 border-amber-500/30 dark:border-amber-400/30"
                >
                  TRIAL: {trialDays}D LEFT
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. Horizontal Suggestion Chips */}
      <div
        data-testid="suggestions-row"
        className="flex items-center gap-2 overflow-x-auto py-3 px-4 md:px-8 scrollbar-none border-b select-none shrink-0 bg-slate-100 dark:bg-[#0E0B1A] transition-colors"
        style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
      >
        {suggestions.map((item, idx) => (
          <button
            key={idx}
            type="button"
            data-testid={`suggestion-chip-${idx}`}
            onClick={() => handleSendMessage(item.query)}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all hover:border-indigo-500 shrink-0 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/90 hover:bg-slate-50 dark:hover:bg-white/10 shadow-xs dark:shadow-none"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 3. Main Dashboard View matching Image 1 */}
      {!isAiAccessible ? (
        <div data-testid="locked-ai-view" className="flex-1 flex items-center justify-center p-6">
          <div
            className="max-w-md w-full p-8 rounded-3xl text-center border shadow-xl"
            style={{
              backgroundColor: isDark ? APP_COLORS.darkCard : '#FFFFFF',
              borderColor: 'rgba(245, 158, 11, 0.4)',
            }}
          >
            <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center bg-amber-500/15 text-amber-500">
              <Lock size={32} />
            </div>
            <h2 className="text-xl font-black mb-3">Unlock MoneyMapper AI Assistant 🚀</h2>
            <p
              className="text-xs md:text-sm leading-relaxed mb-6"
              style={{ color: isDark ? APP_COLORS.textSecondaryDark : APP_COLORS.textSecondaryLight }}
            >
              Your trial has ended. Upgrade to MoneyMapper Pro for 24/7 unlimited access to AI financial advisory!
            </p>
            <button
              type="button"
              data-testid="upgrade-to-pro-btn"
              onClick={() => navigate('/subscription')}
              className="w-full py-3.5 px-6 rounded-2xl font-black text-xs tracking-wider uppercase text-white shadow-lg transition-transform active:scale-95"
              style={{ backgroundColor: '#F59E0B' }}
            >
              UPGRADE TO PRO
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6 space-y-6 pb-32">
          {/* Free Trial Banner */}
          {!isPro && (
            <div
              data-testid="free-trial-banner"
              className="w-full py-2 px-4 rounded-xl text-center text-xs font-bold tracking-wide border"
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                borderColor: 'rgba(245, 158, 11, 0.3)',
                color: '#F59E0B',
              }}
            >
              ⚡ FREE TRIAL: {trialDays}-Day AI Assistant Access Active
            </div>
          )}



          {/* Live Chat Messages Stream */}
          <div data-testid="chat-messages-container" className="space-y-4 pt-4">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  data-testid={`chat-bubble-${msg.sender}`}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-start gap-2.5 max-w-[90%] md:max-w-[80%]">
                    {!isUser && (
                      <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-1">
                        <img src={mascotImg} alt="Bot" className="w-6 h-6 object-contain" />
                      </div>
                    )}
                    <div
                      className={`p-4 rounded-2xl shadow-md text-sm leading-relaxed border ${
                        isUser ? 'rounded-br-xs text-white border-indigo-600' : 'rounded-bl-xs'
                      }`}
                      style={{
                        backgroundColor: isUser
                          ? APP_COLORS.primary
                          : isDark
                          ? '#141419'
                          : '#FFFFFF',
                        borderColor: isUser
                          ? APP_COLORS.primary
                          : isDark
                          ? 'rgba(255,255,255,0.1)'
                          : APP_COLORS.borderLight,
                        color: isUser ? '#FFFFFF' : isDark ? '#FAFAFA' : APP_COLORS.textPrimaryLight,
                      }}
                    >
                      <div className="whitespace-pre-wrap">{renderFormattedText(msg.text)}</div>

                      {/* Direct Navigation Action */}
                      {msg.redirectTo && msg.redirectLabel && (
                        <div className="mt-3 pt-3 border-t border-indigo-500/20">
                          <button
                            type="button"
                            data-testid="bot-redirect-button"
                            onClick={() => navigate(normalizeRoute(msg.redirectTo!))}
                            className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            <span>{msg.redirectLabel}</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      )}

                      {/* Quick Action Chips */}
                      {msg.quickActions && msg.quickActions.length > 0 && (
                        <div data-testid="quick-actions-row" className="mt-3 pt-2 flex flex-wrap gap-2">
                          {msg.quickActions.map((action, actionIdx) => (
                            <button
                              key={actionIdx}
                              type="button"
                              data-testid={`quick-action-${actionIdx}`}
                              onClick={() => handleActionClick(action.route)}
                              className="px-3 py-1 rounded-full text-xs font-bold transition-transform active:scale-95 border"
                              style={{
                                backgroundColor: isUser
                                  ? 'rgba(255, 255, 255, 0.2)'
                                  : 'rgba(79, 70, 229, 0.15)',
                                borderColor: isUser
                                  ? 'rgba(255, 255, 255, 0.3)'
                                  : 'rgba(79, 70, 229, 0.3)',
                                color: isUser ? '#FFFFFF' : '#818CF8',
                              }}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 mt-1 px-1">{msg.timestamp}</span>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div data-testid="typing-indicator" className="flex items-center gap-2 text-xs italic text-slate-500 dark:text-zinc-400 pl-1">
                <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center">
                  <img src={mascotImg} alt="Thinking" className="w-4 h-4 object-contain animate-pulse" />
                </div>
                <span>AI is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Permanent Fixed Command Input Bar */}
          <div
            data-testid="ai-input-bar"
            className="p-3.5 rounded-2xl border bg-white/95 dark:bg-zinc-950/95 border-slate-200 dark:border-zinc-800/90 shadow-xl dark:shadow-[0_-10px_35px_rgba(0,0,0,0.85)] backdrop-blur-xl fixed bottom-4 left-4 right-4 md:left-72 max-w-5xl mx-auto z-40 transition-colors"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="flex items-center gap-3"
            >
              <input
                type="text"
                data-testid="ai-query-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask anything about your finances..."
                disabled={isTyping}
                className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 font-medium"
              />

              <button
                type="submit"
                data-testid="ai-send-button"
                disabled={!inputValue.trim() || isTyping}
                className="p-2.5 rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
