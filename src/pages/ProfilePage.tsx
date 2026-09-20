import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { usePlan } from '../hooks/usePlan';
import { authService } from '../services/authService';
import { gamificationStore } from '../services/gamificationStore';
import { ALL_BADGES, checkAndUnlockBadges } from '../services/badgeService';
import { APP_COLORS } from '../theme/tokens';
import {
  Flame,
  Award,
  Trophy,
  UserPlus,
  Headphones,
  HelpCircle,
  MessageSquare,
  Star,
  User,
  Info,
  LogOut,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  X,
  ExternalLink,
} from 'lucide-react';

export const FAQS = [
  {
    question: 'How does MoneyMapper make me better with money?',
    subtitle: 'Turns your finances into one clear, trackable score',
    answer:
      'MoneyMapper converts your income, expenses, savings, protection, and investments into a single humAIn IQ Score (0-100) — so instead of guessing where you stand financially, you get a clear, data-backed roadmap of exactly what to improve.',
    icon: '💰',
  },
  {
    question: 'How is my score calculated?',
    subtitle: '5 pillars combine into your overall score',
    answer:
      'Your score is based on 5 pillars — Income, Expenses, Savings, Protection, and Investment. Each pillar gets its own sub-score from your real financial data (transactions, savings, cover, investments), and the overall score is the average of all five.',
    icon: '📊',
  },
  {
    question: 'Is my financial data safe?',
    subtitle: 'Your data stays private and is never sold',
    answer:
      'Yes — your financial data is fully secure and used only to generate your score and recommendations. We never sell or share your personal financial data with third parties.',
    icon: '🔒',
  },
  {
    question: 'How long does it take to improve my score?',
    subtitle: 'Small wins in weeks, bigger shifts in months',
    answer:
      'Depends on your gaps — smaller changes (like fixing budget adherence) can reflect in 2-4 weeks, while bigger structural moves (like building an emergency fund or increasing insurance cover) can take 3-6 months. Streaks and milestones in the app help you track progress along the way.',
    icon: '⏳',
  },
  {
    question: 'How often do recommendations update?',
    subtitle: 'Advice refreshes automatically with your data',
    answer:
      'As soon as your financial data changes — a new transaction, a new investment, updated income — your score and recommendations refresh automatically, so the advice always matches your current situation.',
    icon: '🔄',
  },
  {
    question: 'Is MoneyMapper only for individuals, or can companies use it too?',
    subtitle: 'Available for both individuals and companies',
    answer:
      "MoneyMapper works for individuals (B2C) as well as companies (B2B corporate wellness) — where organizations can track their employees' financial wellness and help them make better financial decisions.",
    icon: '🏢',
  },
];

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPro } = usePlan();
  const { themeMode, effectiveTheme, setThemeMode } = useTheme();
  const { showToast } = useToast();
  const isDark = effectiveTheme === 'dark';

  // Profile data states
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [streakCount, setStreakCount] = useState<number>(0);
  const [totalXp, setTotalXp] = useState<number>(0);
  const [levelInfo, setLevelInfo] = useState({ level: 1, minXp: 0, maxXp: 300, progress: 0 });
  const [unlockedBadges, setUnlockedBadges] = useState<Array<{ id: string; emoji: string; title: string }>>([]);

  // Modals state
  const [showLogoutDialog, setShowLogoutDialog] = useState<boolean>(false);
  const [showRatingDialog, setShowRatingDialog] = useState<boolean>(false);
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [showSupportModal, setShowSupportModal] = useState<boolean>(false);
  const [showFaqModal, setShowFaqModal] = useState<boolean>(false);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  // Load user data
  useEffect(() => {
    async function loadData() {
      const storedName = await authService.getUserName();
      const storedEmail = await authService.getUserEmail();

      const name = user?.user_metadata?.fullName || user?.user_metadata?.name || storedName || 'User';
      const email = user?.email || storedEmail || '';
      setUserName(name);
      setUserEmail(email);

      const streak = gamificationStore.getStreak();
      const xp = gamificationStore.getTotalXp();
      const lvl = gamificationStore.getLevelInfo(xp);
      const unlockedIds = gamificationStore.getUnlockedBadges();

      setStreakCount(streak);
      setTotalXp(xp);
      setLevelInfo(lvl);

      const badges = ALL_BADGES.filter((b) => unlockedIds.includes(b.id));
      setUnlockedBadges(badges);

      // Evaluate badges in background
      try {
        await checkAndUnlockBadges();
        const freshUnlocked = gamificationStore.getUnlockedBadges();
        setUnlockedBadges(ALL_BADGES.filter((b) => freshUnlocked.includes(b.id)));
      } catch {
        // ignore evaluation failure
      }
    }

    loadData();
  }, [user]);

  // Initials computation
  const initials = useMemo(() => {
    const parts = userName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return userName.length > 0 ? userName[0].toUpperCase() : 'U';
  }, [userName]);

  // Dynamic greeting logic
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Handle Logout
  const handleConfirmLogout = async () => {
    setShowLogoutDialog(false);
    try {
      await authService.logout();
    } catch {
      // ignore
    } finally {
      navigate('/');
    }
  };

  // Handle Feedback Submission
  const handleSubmitRating = () => {
    setShowRatingDialog(false);
    const subject = `MoneyMapper feedback (${ratingScore}/5)`;
    const mailtoUrl = `mailto:info@moneymapper.in?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(feedbackText)}`;
    window.location.href = mailtoUrl;

    showToast({
      message: 'Thank you for your feedback!',
      backgroundColor: APP_COLORS.success,
    });
    setFeedbackText('');
  };

  return (
    <div
      data-testid="profile-page"
      className="min-h-screen pb-16 transition-colors duration-200"
      style={{
        backgroundColor: isDark ? APP_COLORS.darkBackground : APP_COLORS.background,
        color: isDark ? APP_COLORS.textPrimaryDark : APP_COLORS.textPrimaryLight,
      }}
    >
      {/* 1. Header with Gradient Background */}
      <div
        data-testid="profile-header"
        onClick={() => navigate('/master-data')}
        className="cursor-pointer px-4 pt-8 pb-10 rounded-b-[32px] text-white select-none transition shadow-lg"
        style={{
          background: isDark
            ? 'linear-gradient(to bottom, #2E1065, #1E0A45 70%, #09090B)'
            : 'linear-gradient(to bottom, #2E1065, #1E0A45 70%, #F9FAFB)',
        }}
      >
        <div className="max-w-xl mx-auto flex flex-col items-center text-center">
          <div className="text-xs font-black uppercase tracking-widest text-indigo-300/80 mb-4">
            PROFILE
          </div>

          {/* Avatar Initials */}
          <div
            data-testid="user-avatar"
            className="w-20 h-20 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-2xl font-black shadow-md mb-4"
          >
            {initials}
          </div>

          {/* Greeting & Streak Badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-white/80">{greeting} 🌟</span>
            <div
              data-testid="streak-badge"
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 text-white text-[11px] font-black"
            >
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{streakCount} WEEKS</span>
            </div>
          </div>

          {/* User Name & PRO Badge */}
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 data-testid="user-name" className="text-2xl font-black tracking-tight text-white">
              {userName}
            </h1>
            {isPro && (
              <span
                data-testid="pro-badge"
                className="px-2 py-0.5 rounded-full bg-[#8B5CF6] text-white text-[10px] font-black uppercase tracking-wider"
              >
                PRO
              </span>
            )}
          </div>

          {/* Email */}
          <div data-testid="user-email" className="text-xs text-white/70">
            {userEmail}
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 mt-6 space-y-6">
        {/* 2. Subscription Card */}
        <div
          data-testid="subscription-card"
          onClick={() => navigate('/subscription')}
          className="cursor-pointer rounded-3xl p-6 text-white transition-transform hover:scale-[1.01] active:scale-[0.99] shadow-xl"
          style={{
            background: isPro
              ? 'linear-gradient(135deg, #4F46E5, #8B5CF6)'
              : 'linear-gradient(135deg, #374151, #4B5563)',
            boxShadow: isPro
              ? '0 10px 25px -5px rgba(79, 70, 229, 0.3)'
              : '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="px-3 py-1 rounded-full bg-white/20 text-[10px] font-black tracking-wider uppercase">
              {isPro ? 'WEALTH SELECT (PRO)' : 'BASIC ACCESS (FREE)'}
            </span>
            <Award className="w-5 h-5" />
          </div>

          <h3 className="text-lg font-black mb-1">
            {isPro ? 'MoneyMapper Pro Membership' : 'MoneyMapper Free Membership'}
          </h3>
          <p className="text-xs text-white/80 leading-relaxed mb-4">
            {isPro
              ? 'All 5 Financial Pillars, Screener Intelligence & AI Assistant Unlocked.'
              : 'Free Tier — Upgrade to PRO to unlock full screeners, AI assistant & deep insights.'}
          </p>
          <div className="text-[11px] font-bold text-white/75 text-right">
            Tap to manage membership →
          </div>
        </div>

        {/* 3. GAMIFIED MILESTONES */}
        <section data-testid="gamified-milestones">
          <div className="text-[11px] font-black tracking-wider uppercase text-zinc-400 mb-2 px-2">
            GAMIFIED MILESTONES
          </div>
          <div className="rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 shadow-sm">
            {/* Level & XP Banner */}
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Star className="w-5 h-5 fill-amber-500" />
                  </div>
                  <div>
                    <div className="text-base font-black tracking-tight">
                      LVL {levelInfo.level}
                    </div>
                    <div className="text-[10px] font-extrabold uppercase text-zinc-400">
                      Financial Navigator
                    </div>
                  </div>
                </div>
                <div className="text-xs font-black text-[#4F46E5] dark:text-indigo-400">
                  {totalXp} / {levelInfo.maxXp} XP
                </div>
              </div>

              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${Math.round(levelInfo.progress * 100)}%` }}
                />
              </div>
            </div>

            {/* Badges & Achievements link */}
            <div
              data-testid="link-achievements"
              onClick={() => navigate('/achievements')}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
            >
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-[#8B5CF6]" />
                <div>
                  <div className="text-sm font-bold">Badges & Achievements</div>
                  <div className="text-[11px] text-zinc-400">
                    Review your earned financial milestones
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </div>

            {/* Unlocked Badges Horizontal Row */}
            {unlockedBadges.length > 0 && (
              <div data-testid="unlocked-badges-row" className="p-4 flex gap-3 overflow-x-auto">
                {unlockedBadges.map((badge) => (
                  <div
                    key={badge.id}
                    title={badge.title}
                    className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-zinc-800 border border-indigo-200 dark:border-zinc-700 flex items-center justify-center text-2xl shrink-0 shadow-sm"
                  >
                    {badge.emoji}
                  </div>
                ))}
              </div>
            )}

            {/* Invite a Friend link */}
            <div
              data-testid="link-referral"
              onClick={() => navigate('/referral')}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
            >
              <div className="flex items-center gap-3">
                <UserPlus className="w-5 h-5 text-[#4F46E5]" />
                <div>
                  <div className="text-sm font-bold">Invite a Friend</div>
                  <div className="text-[11px] text-zinc-400">
                    Help others improve their financial score
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </div>
          </div>
        </section>

        {/* 4. SECURITY & PREFERENCES */}
        <section data-testid="security-preferences">
          <div className="text-[11px] font-black tracking-wider uppercase text-zinc-400 mb-2 px-2">
            SECURITY & PREFERENCES
          </div>
          <div className="rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            {/* Theme Selector Wired to ThemeProvider */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold">Theme Mode</div>
                <div className="text-[11px] text-zinc-400">
                  Select Light, Dark, or System theme
                </div>
              </div>
              <div
                data-testid="theme-toggle-group"
                className="flex items-center rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1"
              >
                {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
                  <button
                    key={mode}
                    data-testid={`theme-btn-${mode}`}
                    onClick={() => setThemeMode(mode)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg capitalize transition ${
                      themeMode === mode
                        ? 'bg-white dark:bg-zinc-700 text-[#4F46E5] dark:text-indigo-300 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 5. SUPPORT */}
        <section data-testid="support-section">
          <div className="text-[11px] font-black tracking-wider uppercase text-zinc-400 mb-2 px-2">
            SUPPORT
          </div>
          <div className="rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 shadow-sm">
            {/* Help & Support modal */}
            <div
              data-testid="btn-support-modal"
              onClick={() => setShowSupportModal(true)}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
            >
              <div className="flex items-center gap-3">
                <Headphones className="w-5 h-5 text-[#4F46E5]" />
                <div>
                  <div className="text-sm font-bold">Help & Support</div>
                  <div className="text-[11px] text-zinc-400">
                    Contact us via WhatsApp or Email
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </div>

            {/* App FAQs */}
            <div
              data-testid="btn-faq-modal"
              onClick={() => setShowFaqModal(true)}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-[#4F46E5]" />
                <div>
                  <div className="text-sm font-bold">App FAQs</div>
                  <div className="text-[11px] text-zinc-400">
                    Learn how MoneyMapper works
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </div>

            {/* Share Feedback */}
            <a
              data-testid="link-share-feedback"
              href="https://wa.me/917987469093?text=Hi+MoneyMapper+Team%2C+I+have+some+feedback+to+share%3A"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-[#4F46E5]" />
                <div>
                  <div className="text-sm font-bold">Share your Feedback</div>
                  <div className="text-[11px] text-zinc-400">
                    Help us improve MoneyMapper
                  </div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-zinc-400" />
            </a>

            {/* Rate MoneyMapper */}
            <div
              data-testid="btn-rate-modal"
              onClick={() => setShowRatingDialog(true)}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
            >
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-[#4F46E5]" />
                <div>
                  <div className="text-sm font-bold">Rate MoneyMapper</div>
                  <div className="text-[11px] text-zinc-400">
                    Help us grow by rating your experience
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </div>
          </div>
        </section>

        {/* 6. MY PROFILE & DATA */}
        <section data-testid="my-profile-section">
          <div className="text-[11px] font-black tracking-wider uppercase text-zinc-400 mb-2 px-2">
            MY PROFILE & DATA
          </div>
          <div className="rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            {/* Master Data */}
            <div
              data-testid="link-master-data"
              onClick={() => navigate('/master-data')}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
            >
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-[#4F46E5]" />
                <div>
                  <div className="text-sm font-bold">My Profile</div>
                  <div className="text-[11px] text-zinc-400">
                    Manage your 52 core identity & pillar data fields
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </div>
          </div>
        </section>

        {/* 7. ABOUT & COMPLIANCE */}
        <section data-testid="compliance-section">
          <div className="text-[11px] font-black tracking-wider uppercase text-zinc-400 mb-2 px-2">
            ABOUT & COMPLIANCE
          </div>
          <div className="rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div
              data-testid="link-privacy-policy"
              onClick={() => navigate('/privacy')}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
            >
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-[#4F46E5]" />
                <div>
                  <div className="text-sm font-bold">About MoneyMapper & Privacy Policy</div>
                  <div className="text-[11px] text-zinc-400">
                    Version 1.0.0 (Production build)
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </div>
          </div>
        </section>

        {/* 8. Logout Button */}
        <div className="pt-2">
          <button
            data-testid="btn-logout"
            onClick={() => setShowLogoutDialog(true)}
            className="w-full py-3.5 px-4 rounded-2xl border-2 border-red-500 text-red-500 hover:bg-red-500/10 font-bold text-sm flex items-center justify-center gap-2 transition active:scale-[0.99]"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Session</span>
          </button>
        </div>

        {/* 9. Trust Badges (Only SSL SECURED per instruction 4) */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <div
            data-testid="trust-badge-ssl"
            className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black tracking-widest uppercase"
          >
            SSL SECURED
          </div>
        </div>
      </div>

      {/* --- MODALS & DIALOGS --- */}

      {/* Logout Confirmation Dialog */}
      {showLogoutDialog && (
        <div
          data-testid="logout-dialog"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm rounded-3xl p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <h3 className="text-lg font-black mb-2">Logout</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              Are you sure you want to log out of MoneyMapper?
            </p>
            <div className="flex gap-3">
              <button
                data-testid="logout-cancel-btn"
                onClick={() => setShowLogoutDialog(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 font-bold text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button
                data-testid="logout-confirm-btn"
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support Modal (WhatsApp & Email) */}
      {showSupportModal && (
        <div
          data-testid="support-modal"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black">How can we help?</h3>
              <button
                onClick={() => setShowSupportModal(false)}
                className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="space-y-3">
              <a
                data-testid="support-whatsapp-btn"
                href="https://wa.me/917987469093?text=Hi+MoneyMapper+Team%2C+I+need+help+with..."
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowSupportModal(false)}
                className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-black">WhatsApp Chat</div>
                  <div className="text-xs text-zinc-500">Fastest way to get a response</div>
                </div>
              </a>

              <a
                data-testid="support-email-btn"
                href="mailto:info@moneymapper.in?subject=Help%20Requested&body=Hi%20Team%2C%0A%0AI%20need%20help%20with..."
                onClick={() => setShowSupportModal(false)}
                className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-[#4F46E5] flex items-center justify-center">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-black">Email Support</div>
                  <div className="text-xs text-zinc-500">info@moneymapper.in</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* App FAQs Modal */}
      {showFaqModal && (
        <div
          data-testid="faq-modal"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-lg font-black">App Frequently Asked Questions</h3>
              <button
                onClick={() => setShowFaqModal(false)}
                className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {FAQS.map((faq, idx) => {
                const isExpanded = expandedFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 transition bg-zinc-50/50 dark:bg-zinc-800/30"
                  >
                    <button
                      onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                      className="w-full flex items-start justify-between text-left gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{faq.icon}</span>
                        <div>
                          <div className="text-sm font-black leading-snug">{faq.question}</div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">{faq.subtitle}</div>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed pl-8">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Rate MoneyMapper Dialog */}
      {showRatingDialog && (
        <div
          data-testid="rating-dialog"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm rounded-3xl p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl text-center">
            <h3 className="text-lg font-black mb-1">Rate MoneyMapper</h3>
            <p className="text-xs text-zinc-500 mb-5">How are you enjoying the app so far?</p>

            {/* 5-Star Selection */}
            <div data-testid="star-rating-container" className="flex items-center justify-center gap-2 mb-5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  data-testid={`rate-star-${star}`}
                  onClick={() => setRatingScore(star)}
                  className="p-1 hover:scale-110 active:scale-95 transition"
                  aria-label={`Rate ${star} stars`}
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= ratingScore
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-zinc-300 dark:text-zinc-700'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Optional Feedback Textarea */}
            <textarea
              data-testid="rating-feedback-input"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Share your feedback (optional)"
              rows={3}
              className="w-full rounded-2xl p-3 text-xs bg-zinc-100 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-[#4F46E5] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 resize-none mb-5"
            />

            <div className="flex gap-3">
              <button
                data-testid="rating-cancel-btn"
                onClick={() => setShowRatingDialog(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 font-bold text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button
                data-testid="rating-submit-btn"
                onClick={handleSubmitRating}
                className="flex-1 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-indigo-600 text-white font-bold text-sm shadow-md transition"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
