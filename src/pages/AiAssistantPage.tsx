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
  Menu,
  ChevronRight,
  Bell,
  Paperclip,
  Mic,
  TrendingUp,
  PieChart,
  Shield,
  Calendar,
  ArrowRight,
  FileText,
  DollarSign,
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
    { label: '🛡️ Health Insurance', query: 'HDFC Ergo Health Insurance' },
    { label: '🚀 Upcoming IPOs', query: 'Upcoming IPO score' },
    { label: '🚨 Emergency Fund', query: 'Emergency Fund' },
    { label: '📅 Weekly Expenses', query: 'Weekly Expenses' },
    { label: '👤 Edit Profile', query: 'Edit Profile' },
  ];

  // Feature cards matching Image 1
  const featureCards = [
    {
      title: 'Market Insights',
      desc: 'Get real-time stock analysis and recommendations',
      icon: <TrendingUp className="w-5 h-5 text-blue-400" />,
      bg: 'bg-[#0F172A]',
      route: '/market/stocks',
    },
    {
      title: 'Mutual Funds',
      desc: 'Find funds matching your goals and risk profile',
      icon: <PieChart className="w-5 h-5 text-purple-400" />,
      bg: 'bg-[#1E1B4B]',
      route: '/market/funds',
    },
    {
      title: 'Insurance Guidance',
      desc: 'Compare and choose the best insurance plans',
      icon: <Shield className="w-5 h-5 text-emerald-400" />,
      bg: 'bg-[#064E3B]',
      route: '/pillars/insurance',
    },
    {
      title: 'Expense Planner',
      desc: 'Track, predict and optimize your expenses',
      icon: <Calendar className="w-5 h-5 text-amber-400" />,
      bg: 'bg-[#451A03]',
      route: '/pillars/expenses',
    },
  ];

  // Popular questions matching Image 1
  const popularQuestions = [
    { label: 'Summarize my current financial health', icon: <FileText className="w-3.5 h-3.5 text-blue-400" /> },
    { label: 'Show my upcoming bill payments', icon: <Calendar className="w-3.5 h-3.5 text-amber-400" /> },
    { label: 'Best tax saving options this year', icon: <FileText className="w-3.5 h-3.5 text-emerald-400" /> },
    { label: 'How much should I save monthly?', icon: <DollarSign className="w-3.5 h-3.5 text-purple-400" /> },
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
          <div className="flex items-center gap-3">
            <button
              type="button"
              data-testid="ai-menu-button"
              className="md:hidden p-1.5 rounded-lg text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              onClick={() => {
                const drawerBtn = document.querySelector('[data-testid="drawer-toggle-button"]');
                if (drawerBtn instanceof HTMLElement) drawerBtn.click();
              }}
              aria-label="Open navigation drawer"
            >
              <Menu size={22} />
            </button>
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

          {/* Top Right Controls: Notification Bell, User Avatar */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="relative p-2 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-white transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            </button>

            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center border border-indigo-400 shadow-sm">
              PK
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

          {/* Hero Banner Card matching Image 1 */}
          <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-white dark:bg-gradient-to-r dark:from-[#170E3B] dark:via-[#1F1250] dark:to-[#0F1C42] border border-slate-200/80 dark:border-indigo-500/30 shadow-sm dark:shadow-2xl text-slate-900 dark:text-white transition-colors">
            {/* Background subtle glow circles */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/15 blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Mascot image */}
              <img
                src={mascotImg}
                alt="AI Assistant Mascot"
                className="w-28 h-28 md:w-36 md:h-36 object-contain shrink-0 drop-shadow-[0_10px_25px_rgba(79,70,229,0.25)]"
              />

              <div className="flex-1 text-center md:text-left space-y-3">
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Hi! I'm your{' '}
                  <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 dark:from-indigo-400 dark:via-purple-300 dark:to-pink-400 bg-clip-text text-transparent">
                    AI Assistant.
                  </span>
                </h2>

                <p className="text-xs md:text-sm text-slate-600 dark:text-white/80 leading-relaxed max-w-2xl font-medium">
                  You can ask me questions about your financial pillars, mutual funds, or ask me to redirect you anywhere in the app!
                </p>

                {/* 4 Quick Action Prompt Buttons */}
                <div className="pt-2 flex flex-wrap gap-2.5 justify-center md:justify-start">
                  {[
                    { label: "📊 What's today's best stock for me?", query: "What's today's best stock for me?" },
                    { label: '📈 Which mutual fund suits my long-term goals?', query: 'Which mutual fund suits my long-term goals?' },
                    { label: '🐷 Best liquid fund for my emergency needs?', query: 'Best liquid fund for my emergency needs?' },
                    { label: '🛡️ Which insurance fits my budget?', query: 'Which insurance fits my budget?' },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(item.query)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 border border-slate-200/80 dark:border-white/15 text-xs font-bold text-slate-800 dark:text-white transition-all active:scale-95 text-left shadow-xs"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4 Feature Category Cards matching Image 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featureCards.map((card, idx) => (
              <div
                key={idx}
                onClick={() => navigate(card.route)}
                className="p-5 rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col justify-between group shadow-sm dark:shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">{card.icon}</div>
                    <div className="w-7 h-7 rounded-full bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{card.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Popular Questions Section matching Image 1 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <span>💡</span> Popular Questions
              </h3>
              <button
                type="button"
                onClick={() => handleSendMessage('Summarize my financial health')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View All &gt;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {popularQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(q.label)}
                  className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 hover:border-indigo-500/40 text-xs font-bold text-slate-800 dark:text-white/90 text-left flex items-center gap-2.5 transition-all hover:bg-slate-50 dark:hover:bg-zinc-800/50 shadow-xs dark:shadow-none"
                >
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 shrink-0">{q.icon}</div>
                  <span className="truncate">{q.label}</span>
                </button>
              ))}
            </div>
          </div>

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
              <button type="button" className="p-2 rounded-xl text-slate-400 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                data-testid="ai-query-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask anything about your finances..."
                disabled={isTyping}
                className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 font-medium"
              />

              <button type="button" className="p-2 rounded-xl text-slate-400 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                <Mic className="w-4 h-4" />
              </button>

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
