import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePlan } from '../hooks/usePlan';
import { authService } from '../services/authService';
import { gamificationStore } from '../services/gamificationStore';
import { ALL_BADGES, checkAndUnlockBadges } from '../services/badgeService';
import { APP_COLORS } from '../theme/tokens';
import {
  Star,
  Trophy,
  UserPlus,
  Moon,
  Sun,
  Lock,
  Headphones,
  HelpCircle,
  MessageSquare,
  User,
  Info,
  LogOut,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Crown,
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

interface SettingsTileProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
  testId?: string;
}

const SettingsTile: React.FC<SettingsTileProps> = ({
  icon,
  title,
  subtitle,
  onClick,
  trailing,
  testId,
}) => (
  <div
    data-testid={testId}
    onClick={onClick}
    className={`p-4 md:p-5 flex items-center justify-between gap-3 ${
      onClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors' : ''
    }`}
  >
    <div className="flex items-center gap-3.5 min-w-0">
      <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{title}</div>
        <div className="text-xs text-slate-500 dark:text-zinc-400 truncate">{subtitle}</div>
      </div>
    </div>
    <div className="shrink-0">
      {trailing ?? <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-400" />}
    </div>
  </div>
);

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  ariaLabel: string;
  testId?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, ariaLabel, testId }) => (
  <button
    type="button"
    role="switch"
    aria-label={ariaLabel}
    aria-checked={checked}
    data-testid={testId}
    onClick={(e) => {
      e.stopPropagation();
      onChange(!checked);
    }}
    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
      checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-zinc-700'
    }`}
  >
    <div
      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPro } = usePlan();
  const { effectiveTheme, setThemeMode } = useTheme();
  const isDark = effectiveTheme === 'dark';

  // Profile data states
  const [userName, setUserName] = useState<string>('User');
  const [userEmail, setUserEmail] = useState<string>('');
  const [streakCount, setStreakCount] = useState<number>(0);
  const [totalXp, setTotalXp] = useState<number>(0);
  const [levelInfo, setLevelInfo] = useState(() => gamificationStore.getLevelInfo(0));
  const [unlockedBadges, setUnlockedBadges] = useState<Array<{ id: string; emoji: string; title: string }>>([]);

  // Modals state
  const [showLogoutDialog, setShowLogoutDialog] = useState<boolean>(false);
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

  // Preference switch handlers
  const handleToggleDarkMode = (enabled: boolean) => {
    setThemeMode(enabled ? 'dark' : 'light');
  };

  const handleShareFeedback = () => {
    window.open(
      'https://wa.me/917987469093?text=Hi+MoneyMapper+Team%2C+I+have+some+feedback+to+share%3A',
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleInviteFriend = () => {
    navigate('/referral');
  };

  return (
    <div
      data-testid="profile-page"
      className="min-h-screen pb-16 transition-colors duration-200"
      style={{
        backgroundColor: isDark ? '#09090B' : APP_COLORS.background,
        color: isDark ? '#FAFAFA' : APP_COLORS.textPrimaryLight,
      }}
    >
      {/* 1. HEADER matching Flutter profile */}
      <div
        data-testid="profile-header"
        className="px-4 pt-6 pb-8 rounded-b-[28px] text-center select-none bg-gradient-to-b from-[#2E1065] via-[#1E0A45] to-transparent text-white"
      >
        <div className="max-w-2xl mx-auto space-y-3">
          {/* Page title */}
          <div className="text-center pb-1">
            <h1 className="text-lg font-black text-white tracking-wide">Profile</h1>
          </div>

          {/* Centered avatar circle with initial (tap opens master data) */}
          <div
            data-testid="user-avatar"
            onClick={() => navigate('/master-data')}
            className="cursor-pointer mx-auto w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/20 text-white flex items-center justify-center text-2xl md:text-3xl font-black shadow-md border-2 border-white/20 transition-transform active:scale-95"
            title="Open Master Data"
          >
            {initials}
          </div>

          {/* Greeting line with streak pill */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="text-xs md:text-sm text-white/70 font-medium">{greeting} 🌟</span>
            <div
              data-testid="streak-badge"
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 text-white text-[9px] font-extrabold tracking-wide"
            >
              <span className="text-[11px]">🔥</span>
              <span>{streakCount} WEEKS</span>
            </div>
          </div>

          {/* User name with PRO badge next to it only when isPro */}
          <div className="flex items-center justify-center gap-2">
            <h2 data-testid="user-name" className="text-xl md:text-2xl font-black text-white">
              {userName}
            </h2>
            {isPro && (
              <span
                data-testid="pro-badge"
                className="px-2 py-0.5 rounded-full bg-[#6D28D9] text-white text-[9px] font-bold tracking-wider"
              >
                PRO
              </span>
            )}
          </div>

          {/* Email below */}
          <div data-testid="user-email" className="text-xs text-white/70 font-medium">
            {userEmail}
          </div>
        </div>
      </div>

      {/* Main Single Column Container */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 2. SUBSCRIPTION CARD */}
        <div
          data-testid="subscription-card"
          onClick={() => navigate('/subscription')}
          className={`cursor-pointer rounded-3xl p-5 md:p-6 transition-all hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden flex flex-col justify-between shadow-xl ${
            isPro
              ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white'
              : 'bg-gradient-to-br from-gray-700 to-gray-500 text-white'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-1 rounded-full bg-white/20 text-[10px] font-black tracking-wider uppercase">
                {isPro ? 'WEALTH SELECT (PRO)' : 'BASIC ACCESS (FREE)'}
              </span>
              {isPro ? (
                <Crown className="w-5 h-5 text-white" />
              ) : (
                <Lock className="w-5 h-5 text-white" />
              )}
            </div>

            <h3 className="text-base md:text-lg font-bold mb-1 text-white">
              {isPro ? 'MoneyMapper Pro Membership' : 'MoneyMapper Free Membership'}
            </h3>
            <p className="text-xs text-white/85 leading-relaxed">
              {isPro
                ? 'All 5 Financial Pillars, Screener Intelligence & AI Assistant Unlocked.'
                : 'Free Tier — Upgrade to PRO to unlock full screeners, AI assistant & deep insights.'}
            </p>
          </div>

          <div className="mt-4 flex justify-end">
            <span className="text-white/70 text-[10px] md:text-xs font-bold hover:text-white transition-colors">
              Tap to manage membership →
            </span>
          </div>
        </div>

        {/* 3. Section GAMIFIED MILESTONES */}
        <div className="space-y-2">
          <div className="px-2 text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-zinc-400">
            GAMIFIED MILESTONES
          </div>
          <div className="rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl overflow-hidden transition-colors">
            {/* Progress Row */}
            <div className="p-4 md:p-5 space-y-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                    <Star className="w-5 h-5 fill-amber-500" />
                  </div>
                  <div>
                    <div className="text-sm md:text-base font-black text-slate-900 dark:text-white">
                      LVL {levelInfo.level}
                    </div>
                    <div className="text-[10px] font-extrabold tracking-wider text-slate-500 dark:text-zinc-400 uppercase">
                      Financial Navigator
                    </div>
                  </div>
                </div>
                <div className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                  {totalXp} / {levelInfo.maxXp} XP
                </div>
              </div>

              {/* Progress bar (no minimum clamp of 10%) */}
              <div className="h-2 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, levelInfo.progress * 100))}%` }}
                />
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-white/10" />

            {/* Badges & Achievements tile */}
            <SettingsTile
              icon={<Trophy className="w-5 h-5" />}
              title="Badges & Achievements"
              subtitle="Review your earned financial milestones"
              onClick={() => navigate('/achievements')}
            />

            {/* Horizontally scrollable row of round emoji-only badges */}
            {unlockedBadges.length > 0 && (
              <div className="px-4 md:px-5 pb-4 flex items-center gap-3 overflow-x-auto scrollbar-none">
                {unlockedBadges.map((item) => (
                  <div
                    key={item.id}
                    className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 border border-purple-500/20 flex items-center justify-center text-2xl shrink-0 shadow-xs"
                  >
                    {item.emoji}
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-slate-100 dark:border-white/10" />

            {/* Invite a Friend tile */}
            <SettingsTile
              icon={<UserPlus className="w-5 h-5" />}
              title="Invite a Friend"
              subtitle="Help others improve their financial score"
              onClick={handleInviteFriend}
            />
          </div>
        </div>

        {/* 4. Section SECURITY & PREFERENCES */}
        <div className="space-y-2">
          <div className="px-2 text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-zinc-400">
            SECURITY & PREFERENCES
          </div>
          <div className="rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl overflow-hidden transition-colors">
            {/* Dark Mode */}
            <SettingsTile
              icon={isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              title="Dark Mode"
              subtitle="Optimizes interface for low-light conditions"
              trailing={
                <ToggleSwitch
                  checked={isDark}
                  onChange={handleToggleDarkMode}
                  ariaLabel="Dark mode toggle"
                  testId="toggle-dark-mode"
                />
              }
            />
          </div>
        </div>

        {/* 5. Section SUPPORT */}
        <div className="space-y-2">
          <div className="px-2 text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-zinc-400">
            SUPPORT
          </div>
          <div className="rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl overflow-hidden transition-colors">
            <SettingsTile
              testId="btn-support-modal"
              icon={<Headphones className="w-5 h-5" />}
              title="Help & Support"
              subtitle="Contact us via WhatsApp or Email"
              onClick={() => setShowSupportModal(true)}
            />

            <div className="border-t border-slate-100 dark:border-white/10" />

            <SettingsTile
              testId="btn-faq-modal"
              icon={<HelpCircle className="w-5 h-5" />}
              title="FAQ"
              subtitle="Learn how MoneyMapper works"
              onClick={() => setShowFaqModal(true)}
            />

            <div className="border-t border-slate-100 dark:border-white/10" />

            <SettingsTile
              testId="btn-share-feedback"
              icon={<MessageSquare className="w-5 h-5" />}
              title="Share your Feedback"
              subtitle="Help us improve MoneyMapper"
              onClick={handleShareFeedback}
            />
          </div>
        </div>

        {/* 6. Section MY PROFILE */}
        <div className="space-y-2">
          <div className="px-2 text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-zinc-400">
            MY PROFILE
          </div>
          <div className="rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl overflow-hidden transition-colors">
            <SettingsTile
              testId="link-master-data"
              icon={<User className="w-5 h-5" />}
              title="My Profile"
              subtitle="Manage your 52 core identity & pillar data fields"
              onClick={() => navigate('/master-data')}
            />
          </div>
        </div>

        {/* 7. Section ABOUT & COMPLIANCE */}
        <div className="space-y-2">
          <div className="px-2 text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-zinc-400">
            ABOUT & COMPLIANCE
          </div>
          <div className="rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl overflow-hidden transition-colors">
            <SettingsTile
              testId="link-privacy-policy"
              icon={<Info className="w-5 h-5" />}
              title="About MoneyMapper"
              subtitle="Version 1.0.0 (Production build)"
              onClick={() => navigate('/privacy')}
            />
          </div>
        </div>

        {/* 8. Logout Session Button */}
        <div className="pt-2">
          <button
            type="button"
            data-testid="btn-logout"
            onClick={() => setShowLogoutDialog(true)}
            className="w-full py-3.5 rounded-2xl border-2 border-rose-500/60 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-sm flex items-center justify-center gap-2 transition-colors active:scale-98"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Session</span>
          </button>
        </div>

        {/* 9. Trust Badges Row BELOW Logout */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <div
            data-testid="trust-badge-ssl"
            className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-black tracking-wider uppercase"
          >
            SSL SECURED
          </div>
          <div
            data-testid="trust-badge-sebi"
            className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-black tracking-wider uppercase"
          >
            SEBI CERTIFIED
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            data-testid="logout-dialog"
            className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200 dark:border-indigo-500/30 p-6 shadow-2xl space-y-4 text-center"
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-xl">
              🚪
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Logout</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Are you sure you want to log out of MoneyMapper?
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                data-testid="logout-cancel-btn"
                onClick={() => setShowLogoutDialog(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="logout-confirm-btn"
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition shadow-lg"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help & Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            data-testid="support-modal"
            className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200 dark:border-indigo-500/30 p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-base font-black text-slate-900 dark:text-white text-center">
              How can we help?
            </h3>

            <div className="space-y-3 pt-2">
              <a
                href="https://wa.me/917987469093?text=Hi+MoneyMapper+Team%2C+I+need+help+with..."
                target="_blank"
                rel="noreferrer"
                onClick={() => setShowSupportModal(false)}
                className="w-full p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200 flex items-center gap-3 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition"
              >
                <div className="w-9 h-9 rounded-xl bg-[#25D366] text-white flex items-center justify-center text-lg shrink-0">
                  💬
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold">WhatsApp Chat</div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-300/80">
                    Fastest way to get a response
                  </div>
                </div>
              </a>

              <a
                href="mailto:info@moneymapper.in?subject=Help%20Requested&body=Hi%20Team%2C%0A%0AI%20need%20help%20with..."
                onClick={() => setShowSupportModal(false)}
                className="w-full p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 text-indigo-800 dark:text-indigo-200 flex items-center gap-3 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg shrink-0">
                  ✉️
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold">Email Support</div>
                  <div className="text-[10px] text-indigo-700 dark:text-indigo-300/80">
                    info@moneymapper.in
                  </div>
                </div>
              </a>
            </div>

            <button
              type="button"
              onClick={() => setShowSupportModal(false)}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition mt-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* FAQ Modal */}
      {showFaqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            data-testid="faq-modal"
            className="w-full max-w-xl max-h-[80vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200 dark:border-indigo-500/30 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-gray-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                FAQ
              </h3>
              <button
                type="button"
                onClick={() => setShowFaqModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 space-y-2"
                >
                  <div
                    onClick={() => setExpandedFaqIndex(expandedFaqIndex === idx ? null : idx)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 pr-2">
                      <span className="text-lg shrink-0">{faq.icon}</span>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {faq.question}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                          {faq.subtitle}
                        </div>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 dark:text-gray-400 transition-transform shrink-0 ${
                        expandedFaqIndex === idx ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                  {expandedFaqIndex === idx && (
                    <p className="text-xs text-slate-600 dark:text-gray-400 pt-1 leading-relaxed border-t border-slate-200/60 dark:border-zinc-800">
                      {faq.answer}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
