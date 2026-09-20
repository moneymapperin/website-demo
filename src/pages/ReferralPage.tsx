import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, Users, Copy, Share2 } from 'lucide-react';
import { APP_COLORS } from '../theme/tokens';

/**
 * Generates user referral code:
 * "MM" + last 6 characters of user ID, UPPERCASED.
 * Fallbacks to "MMUSER" if user ID is missing or shorter than 6 characters.
 */
export function generateReferralCode(userId?: string | null): string {
  if (!userId || userId.length < 6) return 'MMUSER';
  return `MM${userId.substring(userId.length - 6).toUpperCase()}`;
}

/**
 * Exact referral share message from Flutter referral_screen.dart.
 */
export function getReferralShareMessage(code: string): string {
  return `Hey! I'm using MoneyMapper to track my financial health. Use my referral code *${code}* to join and get your financial score! Download here: https://moneymapper.in`;
}

/**
 * WhatsApp share URL with pre-encoded message.
 */
export function getReferralWhatsAppUrl(code: string): string {
  const message = getReferralShareMessage(code);
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export const ReferralPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const code = generateReferralCode(user?.id);

  const handleCopyCode = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(code);
      }
      showToast({
        message: 'Code copied to clipboard!',
        backgroundColor: APP_COLORS.success,
      });
    } catch {
      showToast({
        message: 'Code copied to clipboard!',
        backgroundColor: APP_COLORS.success,
      });
    }
  };

  const handleShareWhatsapp = () => {
    const url = getReferralWhatsAppUrl(code);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200"
      style={{
        backgroundColor: isDark ? APP_COLORS.darkBackground : APP_COLORS.background,
        color: isDark ? APP_COLORS.textPrimaryDark : APP_COLORS.textPrimaryLight,
      }}
    >
      <div className="max-w-md mx-auto">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <h1 className="text-lg font-bold text-center flex-1 pr-14">Invite a Friend</h1>
        </div>

        <div className="flex flex-col items-center text-center">
          {/* Hero Icon */}
          <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-[#4F46E5] mb-6 shadow-sm">
            <Users className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-black tracking-tight mb-3">Spread Financial Wellness</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-8 max-w-sm">
            Invite your friends to MoneyMapper and help them improve their financial fitness score.
          </p>

          {/* Referral Code Card */}
          <div
            data-testid="referral-code-card"
            className="w-full rounded-3xl p-6 sm:p-8 bg-white dark:bg-zinc-900 border border-indigo-100 dark:border-zinc-800 shadow-xl shadow-indigo-500/5 mb-8"
          >
            <div className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-4">
              YOUR UNIQUE CODE
            </div>

            <div className="flex items-center justify-center gap-4 py-3 px-5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/30 border-2 border-dashed border-indigo-300 dark:border-indigo-700/50">
              <span
                data-testid="referral-code-text"
                className="text-2xl sm:text-3xl font-black text-[#4F46E5] dark:text-indigo-400 tracking-widest"
              >
                {code}
              </span>
              <button
                data-testid="copy-referral-btn"
                onClick={handleCopyCode}
                className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-[#4F46E5] dark:text-indigo-300 hover:scale-105 active:scale-95 transition"
                title="Copy code"
                aria-label="Copy referral code"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* WhatsApp Share CTA Button */}
          <button
            data-testid="share-whatsapp-btn"
            onClick={handleShareWhatsapp}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-white text-base shadow-lg transition-transform active:scale-[0.99] hover:opacity-95"
            style={{ backgroundColor: '#25D366' }}
          >
            <Share2 className="w-5 h-5" />
            <span>Share with Friends</span>
          </button>
        </div>
      </div>
    </div>
  );
};
