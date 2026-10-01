import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, UserPlus, Copy, Share2 } from 'lucide-react';
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

  const handleShare = async () => {
    const shareMessage = getReferralShareMessage(code);
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'MoneyMapper Referral',
          text: shareMessage,
          url: 'https://moneymapper.in',
        });
        return;
      } catch {
        // Fallback to WhatsApp / clipboard if Web Share cancelled or unsupported
      }
    }

    const url = getReferralWhatsAppUrl(code);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="min-h-screen py-6 px-4 sm:px-6 lg:px-8 transition-colors duration-200"
      style={{
        backgroundColor: isDark ? APP_COLORS.darkBackground : APP_COLORS.background,
        color: isDark ? APP_COLORS.textPrimaryDark : APP_COLORS.textPrimaryLight,
      }}
    >
      <div className="max-w-md mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800/80">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <h1 className="text-base md:text-lg font-bold text-center flex-1 pr-14 text-slate-900 dark:text-white">
            Invite a Friend
          </h1>
        </div>

        <div className="flex flex-col items-center text-center pt-2">
          {/* Hero Icon */}
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-[#181335] border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 shadow-md">
            <UserPlus className="w-8 h-8" />
          </div>

          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
            Spread Financial Wellness
          </h2>
          <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-8 max-w-sm">
            Invite your friends to MoneyMapper and help them improve their financial fitness score.
          </p>

          {/* Referral Code Card */}
          <div
            data-testid="referral-code-card"
            className="w-full rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#0F0D1E] border border-slate-200 dark:border-indigo-500/20 shadow-xl mb-8"
          >
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">
              YOUR UNIQUE CODE
            </div>

            <div
              onClick={handleCopyCode}
              className="flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-indigo-50/80 dark:bg-[#16122C] border-2 border-dashed border-indigo-300 dark:border-indigo-600/50 hover:border-indigo-500 transition-colors cursor-pointer select-all"
            >
              <span
                data-testid="referral-code-text"
                className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-300 tracking-widest"
              >
                {code}
              </span>
              <button
                data-testid="copy-referral-btn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyCode();
                }}
                className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-300 hover:scale-110 active:scale-95 transition"
                title="Copy code"
                aria-label="Copy referral code"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Share CTA Button */}
          <button
            data-testid="share-whatsapp-btn"
            type="button"
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-black text-white text-sm md:text-base shadow-lg transition-transform active:scale-[0.99] bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/30 cursor-pointer"
          >
            <Share2 className="w-5 h-5 text-white" />
            <span>Share with Friends</span>
          </button>
        </div>
      </div>
    </div>
  );
};
