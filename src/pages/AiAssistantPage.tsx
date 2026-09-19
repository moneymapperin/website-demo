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

  // Chat messages stored in component memory ONLY (no localStorage / sessionStorage)
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

  // Initialize with welcome message on mount
  useEffect(() => {
    const welcomeMsg: ChatMessage = {
      id: 'welcome',
      sender: 'bot',
      text:
        "Hi! I'm your Assistant. You can ask me questions about your financial pillars, mutual funds, or ask me to redirect you anywhere in the app!",
      redirectTo: null,
      redirectLabel: null,
      quickActions: [
        {
          label: "What's today's best stock for me?",
          route: "What's today's best stock for me?",
        },
        {
          label: 'Which mutual fund suits my long-term goals?',
          route: 'Which mutual fund suits my long-term goals?',
        },
        {
          label: 'Best liquid fund for my emergency needs?',
          route: 'Best liquid fund for my emergency needs?',
        },
        {
          label: 'Which insurance fits my budget?',
          route: 'Which insurance fits my budget?',
        },
      ],
      timestamp: formatCurrentTime(),
    };
    setMessages([welcomeMsg]);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
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
      className="flex flex-col h-full min-h-[calc(100vh-5rem)] md:min-h-screen"
      style={{
        backgroundColor: isDark ? APP_COLORS.darkBackground : APP_COLORS.background,
        color: isDark ? APP_COLORS.textPrimaryDark : APP_COLORS.textPrimaryLight,
      }}
    >
      {/* 1. Header with Gradient */}
      <header
        data-testid="ai-header"
        className="relative px-4 py-4 pt-6 md:pt-4 border-b select-none"
        style={{
          background: isDark
            ? 'linear-gradient(180deg, #2E1065 0%, #1E0A45 70%, #0D0E15 100%)'
            : 'linear-gradient(180deg, #2E1065 0%, #1E0A45 70%, #F9FAFB 100%)',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              data-testid="ai-menu-button"
              className="md:hidden p-1.5 rounded-lg text-white hover:bg-white/10 transition-colors"
              onClick={() => {
                // Trigger sidebar or drawer if available
                const drawerBtn = document.querySelector('[data-testid="drawer-toggle-button"]');
                if (drawerBtn instanceof HTMLElement) {
                  drawerBtn.click();
                }
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
                <h1 className="text-lg md:text-xl font-black text-white tracking-tight">
                  AI Assistant
                </h1>
                {!isPro && isAiAccessible && (
                  <span
                    data-testid="ai-trial-badge"
                    className="px-2 py-0.5 text-[9px] font-black tracking-wide rounded-md border text-amber-400 bg-amber-400/10 border-amber-400/30"
                  >
                    TRIAL: {trialDays}D LEFT
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Content: Locked Screen or Interactive Chat */}
      {!isAiAccessible ? (
        <div
          data-testid="locked-ai-view"
          className="flex-1 flex items-center justify-center p-6"
        >
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
            <h2 className="text-xl font-black mb-3">
              Unlock MoneyMapper AI Assistant 🚀
            </h2>
            <p
              className="text-xs md:text-sm leading-relaxed mb-6"
              style={{
                color: isDark ? APP_COLORS.textSecondaryDark : APP_COLORS.textSecondaryLight,
              }}
            >
              Your {trialDays > 0 ? `${trialDays}-day` : '1-day'} AI Assistant trial has ended.
              Upgrade to MoneyMapper Pro for 24/7 unlimited access to AI financial advisory,
              Stock, Mutual Fund, Insurance, and IPO Score Card insights!
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
        <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto overflow-hidden">
          {/* Free Trial Banner for non-PRO users */}
          {!isPro && (
            <div
              data-testid="free-trial-banner"
              className="w-full py-1.5 px-4 text-center text-[10px] md:text-xs font-bold tracking-wide border-b"
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                borderColor: 'rgba(245, 158, 11, 0.2)',
                color: '#F59E0B',
              }}
            >
              ⚡ FREE TRIAL: {trialDays}-Day AI Assistant Access Active
            </div>
          )}

          {/* Horizontal Suggestion Chips */}
          <div
            data-testid="suggestions-row"
            className="flex items-center gap-2 overflow-x-auto py-3 px-4 scrollbar-none border-b select-none shrink-0"
            style={{
              borderColor: isDark ? APP_COLORS.darkBorder : APP_COLORS.borderLight,
            }}
          >
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                data-testid={`suggestion-chip-${idx}`}
                onClick={() => handleSendMessage(item.query)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors hover:border-indigo-500 shrink-0"
                style={{
                  backgroundColor: isDark ? APP_COLORS.darkCard : '#FFFFFF',
                  borderColor: isDark ? APP_COLORS.darkBorder : APP_COLORS.borderLight,
                  color: isDark ? APP_COLORS.textPrimaryDark : APP_COLORS.textPrimaryLight,
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Chat Messages Stream */}
          <div
            data-testid="chat-messages-container"
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  data-testid={`chat-bubble-${msg.sender}`}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-start gap-2 max-w-[88%] md:max-w-[80%]">
                    {!isUser && (
                      <div className="w-7 h-7 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 mt-1">
                        <img
                          src={mascotImg}
                          alt="Bot"
                          className="w-5 h-5 object-contain"
                        />
                      </div>
                    )}
                    <div
                      className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed border ${
                        isUser
                          ? 'rounded-br-sm text-white border-indigo-600'
                          : 'rounded-bl-sm'
                      }`}
                      style={{
                        backgroundColor: isUser
                          ? APP_COLORS.primary
                          : isDark
                          ? APP_COLORS.darkCard
                          : '#FFFFFF',
                        borderColor: isUser
                          ? APP_COLORS.primary
                          : isDark
                          ? APP_COLORS.darkBorder
                          : APP_COLORS.borderLight,
                        color: isUser
                          ? '#FFFFFF'
                          : isDark
                          ? APP_COLORS.textPrimaryDark
                          : APP_COLORS.textPrimaryLight,
                      }}
                    >
                      <div className="whitespace-pre-wrap">
                        {renderFormattedText(msg.text)}
                      </div>

                      {/* Direct Navigation Action (if specified) */}
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
                        <div
                          data-testid="quick-actions-row"
                          className="mt-3 pt-2 flex flex-wrap gap-2"
                        >
                          {msg.quickActions.map((action, actionIdx) => (
                            <button
                              key={actionIdx}
                              type="button"
                              data-testid={`quick-action-${actionIdx}`}
                              onClick={() => handleActionClick(action.route)}
                              className="px-2.5 py-1 rounded-full text-xs font-bold transition-transform active:scale-95 border"
                              style={{
                                backgroundColor: isUser
                                  ? 'rgba(255, 255, 255, 0.2)'
                                  : 'rgba(79, 70, 229, 0.08)',
                                borderColor: isUser
                                  ? 'rgba(255, 255, 255, 0.3)'
                                  : 'rgba(79, 70, 229, 0.25)',
                                color: isUser ? '#FFFFFF' : APP_COLORS.primary,
                              }}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-bold mt-1 px-1"
                    style={{
                      color: isDark
                        ? APP_COLORS.textSecondaryDark
                        : APP_COLORS.textSecondaryLight,
                    }}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div
                data-testid="typing-indicator"
                className="flex items-center gap-2 text-xs italic text-gray-400 pl-1"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center">
                  <img src={mascotImg} alt="Thinking" className="w-4 h-4 object-contain animate-pulse" />
                </div>
                <span>AI is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 3. Input Bar */}
          <div
            data-testid="ai-input-bar"
            className="p-3 md:p-4 border-t"
            style={{
              backgroundColor: isDark ? APP_COLORS.darkCard : '#FFFFFF',
              borderColor: isDark ? APP_COLORS.darkBorder : APP_COLORS.borderLight,
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                data-testid="ai-query-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything about finance..."
                disabled={isTyping}
                className="flex-1 px-4 py-3 rounded-full text-sm outline-none transition-colors border"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6',
                  borderColor: isDark ? APP_COLORS.darkBorder : APP_COLORS.borderLight,
                  color: isDark ? APP_COLORS.textPrimaryDark : APP_COLORS.textPrimaryLight,
                }}
              />
              <button
                type="submit"
                data-testid="ai-send-button"
                disabled={!inputValue.trim() || isTyping}
                className="p-3 rounded-full text-white shadow transition-transform active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                style={{ backgroundColor: APP_COLORS.primary }}
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
