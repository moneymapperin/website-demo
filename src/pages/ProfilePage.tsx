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
import mascotImg from '../assets/app/mascot.png';
import crownImg from '../assets/app/quarterly_plan.png';
import {
  Flame,
  Award,
  Trophy,
  User,
  Mail,
  Calendar,
  Camera,
  Crown,
  Edit,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Info,
  LogOut,
  Moon,
  Sun,
  Laptop,
  Headphones,
  HelpCircle,
  MessageSquare,
  Star,
  ExternalLink,
  Lock,
  UserPlus,
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
  const [levelInfo, setLevelInfo] = useState({ level: 3, minXp: 0, maxXp: 1200, progress: 0.76 });
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
      const email = user?.email || storedEmail || 'sarthaknigam03@gmail.com';
      setUserName(name);
      setUserEmail(email);

      const streak = gamificationStore.getStreak();
      const xp = gamificationStore.getTotalXp();
      const lvl = gamificationStore.getLevelInfo(xp);
      const unlockedIds = gamificationStore.getUnlockedBadges();

      setStreakCount(streak);
      setTotalXp(xp > 0 ? xp : 920);
      setLevelInfo(lvl.level > 0 ? lvl : { level: 3, minXp: 0, maxXp: 1200, progress: 0.76 });

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
      {/* 1. Header Card matching Image 2 */}
      <div
        data-testid="profile-header"
        className={`px-4 md:px-8 pt-8 pb-8 rounded-b-[32px] select-none transition-colors duration-200 relative overflow-hidden ${
          isDark
            ? 'bg-gradient-to-r from-[#2E1065] via-[#1E0A45] to-[#0F0B1E] text-white shadow-xl'
            : 'bg-white text-slate-900 border-b border-slate-200/80 shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* User Info Left */}
          <div className="flex items-center gap-5">
            {/* Avatar with Camera badge */}
            <div className="relative">
              <div
                data-testid="user-avatar"
                className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-indigo-600 text-white border-2 border-indigo-200 dark:border-white/40 flex items-center justify-center text-2xl md:text-3xl font-black shadow-md"
              >
                {initials}
              </div>
              <button
                type="button"
                onClick={() => navigate('/master-data')}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-indigo-600 text-white border-2 border-white dark:border-[#1E0A45] hover:bg-indigo-500 transition-transform active:scale-95 shadow-md"
                title="Edit profile photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5 text-left">
              <div className="flex items-center gap-2">
                {isPro && (
                  <span
                    data-testid="pro-badge"
                    className="px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-white/20 border border-indigo-200 dark:border-white/30 text-indigo-700 dark:text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs"
                  >
                    <Crown className="w-3 h-3 text-amber-500 dark:text-amber-300 fill-amber-500 dark:fill-amber-300" />
                    <span>PRO</span>
                  </span>
                )}
              </div>

              <h1 data-testid="user-name" className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {userName}
              </h1>

              <div data-testid="user-email" className="text-xs md:text-sm text-slate-500 dark:text-white/80 font-medium">
                {userEmail}
              </div>

              {/* Greeting & Streak Badge */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs font-bold text-slate-700 dark:text-white/90">{greeting} ☀️</span>
                <div
                  data-testid="streak-badge"
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-400/20 border border-amber-500/30 dark:border-amber-300/40 text-amber-700 dark:text-amber-200 text-[10px] font-black shadow-xs"
                >
                  <Flame className="w-3 h-3 fill-amber-500 dark:fill-amber-300 text-amber-500 dark:text-amber-300" />
                  <span>{streakCount} WEEKS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quote Box Right matching Image 2 */}
          <div className="p-4 px-6 rounded-2xl bg-slate-50 dark:bg-white/15 border border-slate-200/80 dark:border-white/25 backdrop-blur-md flex items-center gap-4 max-w-md shadow-xs dark:shadow-lg">
            <div className="text-2xl font-serif text-indigo-600 dark:text-white/90 select-none">“</div>
            <div className="text-xs font-bold text-slate-800 dark:text-white leading-relaxed">
              Track Smarter<br />
              Plan Better<br />
              Build a Wealthier You
            </div>
            <img
              src={mascotImg}
              alt="Mascot"
              className="w-16 h-16 object-contain shrink-0 drop-shadow-md ml-2"
            />
          </div>
        </div>
      </div>

      {/* 2. Content Grid Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mt-6 space-y-6">
        {/* Middle Row: Wealth Select PRO card & Gamified Milestones card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* WEALTH SELECT (PRO) Card matching Image 2 */}
          <div
            data-testid="subscription-card"
            onClick={() => navigate('/subscription')}
            className={`lg:col-span-6 cursor-pointer rounded-3xl p-6 md:p-7 transition-all hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden flex flex-col justify-between ${
              isPro
                ? isDark
                  ? 'bg-gradient-to-br from-[#3B0764] via-[#4C1D95] to-[#6D28D9] text-white border border-purple-500/30 shadow-xl'
                  : 'bg-gradient-to-br from-indigo-50/90 via-purple-50/70 to-indigo-100/90 text-slate-900 border border-indigo-200/80 shadow-md'
                : isDark
                  ? 'bg-gradient-to-br from-[#1F2937] to-[#111827] text-white border border-gray-700 shadow-xl'
                  : 'bg-slate-100 text-slate-900 border border-slate-200 shadow-sm'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 rounded-full bg-indigo-600 text-white dark:bg-white/15 dark:backdrop-blur-md text-[10px] font-black tracking-wider uppercase border border-indigo-500 dark:border-white/20 shadow-xs">
                  {isPro ? 'WEALTH SELECT (PRO)' : 'BASIC ACCESS (FREE)'}
                </span>
                {isPro && <Crown className="w-5 h-5 text-amber-500 dark:text-amber-300 fill-amber-500 dark:fill-amber-300" />}
              </div>

              <h3 className="text-xl font-black mb-1.5 text-slate-900 dark:text-white">
                {isPro ? 'MoneyMapper Pro Membership' : 'MoneyMapper Free Membership'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-white/85 leading-relaxed max-w-md">
                {isPro
                  ? 'All 5 Financial Pillars, Screener Intelligence & AI Assistant Unlocked.'
                  : 'Free Tier — Upgrade to PRO to unlock full screeners, AI assistant & deep insights.'}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-indigo-600 dark:bg-white hover:bg-indigo-500 dark:hover:bg-white/90 text-white dark:text-purple-950 font-black text-xs transition-colors flex items-center gap-1.5 shadow-md"
              >
                <span>Manage Membership</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Gamified Milestones Card matching Image 2 */}
          <div className="lg:col-span-6 rounded-3xl p-6 md:p-7 bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl flex flex-col justify-between transition-colors">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                GAMIFIED MILESTONES
              </h3>

              {/* Progress Level Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                      <Star className="w-5 h-5 fill-amber-500" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900 dark:text-white">
                        LVL {levelInfo.level}
                      </div>
                      <div className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-zinc-400 uppercase">
                        FINANCIAL NAVIGATOR
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                    {totalXp} / {levelInfo.maxXp} XP
                  </div>
                </div>

                <div className="h-2.5 w-full bg-slate-100 dark:bg-zinc-800/80 rounded-full overflow-hidden border border-slate-200/60 dark:border-zinc-700/50">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(10, levelInfo.progress * 100))}%` }}
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-indigo-500/15" />

              {/* Badges & Achievements Item */}
              <div
                onClick={() => navigate('/achievements')}
                className="p-2 -mx-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer space-y-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs md:text-sm font-bold text-slate-900 dark:text-white">
                        Badges &amp; Achievements
                      </div>
                      <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                        Review your earned financial milestones
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>

                {/* Badge Icons Row */}
                <div className="flex items-center gap-2 pl-13">
                  {unlockedBadges.length > 0 ? (
                    unlockedBadges.slice(0, 5).map((b) => (
                      <div
                        key={b.id}
                        title={b.title}
                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-sm shadow-xs"
                      >
                        {b.emoji}
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-sm shadow-xs">
                        🎉
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-sm shadow-xs">
                        🌱
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-indigo-500/15" />

              {/* Invite a Friend Item */}
              <div
                onClick={handleInviteFriend}
                className="p-2 -mx-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs md:text-sm font-bold text-slate-900 dark:text-white">
                      Invite a Friend
                    </div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                      Help others improve their financial score
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: 2 Columns / 4 Cards matching Image 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (6 cols on desktop) */}
          <div className="lg:col-span-6 space-y-6">
            {/* My Profile & Data Card matching Image 2 */}
            <section data-testid="my-profile-section" className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                    My Profile & Data
                  </h3>
                </div>
                <button
                  type="button"
                  data-testid="link-master-data"
                  onClick={() => navigate('/master-data')}
                  className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 transition-all shadow-xs"
                >
                  <Edit className="w-3 h-3" /> Edit
                </button>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-4 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">Full Name</div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{userName}</div>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-indigo-500/15" />

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">Email Address</div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{userEmail}</div>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-indigo-500/15" />

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">Member Since</div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Sep 2024</div>
                  </div>
                </div>
              </div>
            </section>

            {/* About & Compliance Card matching Image 2 */}
            <section data-testid="compliance-section" className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                  About & Compliance
                </h3>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-4 transition-colors">
                <div
                  data-testid="link-privacy-policy"
                  onClick={() => navigate('/privacy')}
                  className="flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <Info className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        About MoneyMapper & Privacy Policy
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400">Version 1.0.0 (Production build)</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </div>

                <div className="border-t border-slate-100 dark:border-indigo-500/15" />

                {/* SSL SECURED badge matching Image 2 */}
                <div data-testid="trust-badge-ssl" className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      SSL SECURED
                    </div>
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-300/80 font-medium">
                      Your data is encrypted and safe with us.
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column (6 cols on desktop): Security & Preferences matching Image 2 */}
          <div className="lg:col-span-6 space-y-6">
            <section className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                  Security & Preferences
                </h3>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-4 transition-colors">
                {/* Theme Mode Selector Pill */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Theme Mode</div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400">Select Light, Dark, or System theme</div>
                  </div>

                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 transition-colors">
                    <button
                      type="button"
                      data-testid="theme-btn-light"
                      onClick={() => setThemeMode('light')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        themeMode === 'light' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Light
                    </button>
                    <button
                      type="button"
                      data-testid="theme-btn-dark"
                      onClick={() => setThemeMode('dark')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        themeMode === 'dark' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Dark
                    </button>
                    <button
                      type="button"
                      data-testid="theme-btn-system"
                      onClick={() => setThemeMode('system')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        themeMode === 'system' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      System
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-indigo-500/15" />

                {/* Help & Support */}
                <div
                  data-testid="btn-support-modal"
                  onClick={() => setShowSupportModal(true)}
                  className="flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Headphones className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Help & Support</div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400">Contact us via WhatsApp or Email</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </div>

                <div className="border-t border-slate-100 dark:border-indigo-500/15" />

                {/* App FAQs */}
                <div
                  data-testid="btn-faq-modal"
                  onClick={() => setShowFaqModal(true)}
                  className="flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">App FAQs</div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400">Learn how MoneyMapper works</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </div>

                <div className="border-t border-slate-100 dark:border-indigo-500/15" />

                {/* Share your Feedback */}
                <div
                  data-testid="btn-rate-modal"
                  onClick={() => setShowRatingDialog(true)}
                  className="flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Share your Feedback</div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400">Help us improve MoneyMapper</div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 dark:text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </div>

                <div className="border-t border-slate-100 dark:border-indigo-500/15" />

                {/* Rate MoneyMapper */}
                <div
                  onClick={() => setShowRatingDialog(true)}
                  className="flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Star className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Rate MoneyMapper</div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400">Help us grow by rating your experience</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Logout Session Button */}
              <button
                type="button"
                data-testid="btn-logout"
                onClick={() => setShowLogoutDialog(true)}
                className="w-full mt-4 py-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 font-bold text-xs flex items-center justify-center gap-2 transition-colors active:scale-98"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout Session</span>
              </button>
            </section>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div data-testid="logout-dialog" className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200 dark:border-indigo-500/30 p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-xl">
              🚪
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Sign Out</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Are you sure you want to log out of MoneyMapper?</p>

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
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback & Rating Modal */}
      {showRatingDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div data-testid="rating-dialog" className="w-full max-w-md rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200 dark:border-indigo-500/30 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Rate & Feedback</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">We value your thoughts to make MoneyMapper better.</p>

            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  data-testid={`rate-star-${s}`}
                  onClick={() => setRatingScore(s)}
                  className={`p-2 text-2xl transition-transform ${
                    ratingScore >= s ? 'scale-110 opacity-100' : 'opacity-40 grayscale'
                  }`}
                >
                  ⭐
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              data-testid="rating-feedback-input"
              placeholder="Tell us what you love or what we can improve..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 font-medium"
            />

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRatingDialog(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="rating-submit-btn"
                onClick={handleSubmitRating}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition shadow-lg"
              >
                Send Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help & Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div data-testid="support-modal" className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200 dark:border-indigo-500/30 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Help & Support</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Connect with the MoneyMapper support team:</p>

            <div className="space-y-3 pt-2">
              <a
                href="https://wa.me/917987469093?text=Hi+MoneyMapper+Team%2C+I+need+help+with..."
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:bg-emerald-500 transition"
              >
                💬 WhatsApp Support
              </a>
              <a
                href="mailto:info@moneymapper.in"
                className="w-full py-3 px-4 rounded-2xl bg-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:bg-indigo-500 transition"
              >
                ✉️ Email Support
              </a>
            </div>

            <button
              type="button"
              onClick={() => setShowSupportModal(false)}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition mt-2"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* App FAQs Modal */}
      {showFaqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div data-testid="faq-modal" className="w-full max-w-xl max-h-[80vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200 dark:border-indigo-500/30 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-gray-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">App FAQs</h3>
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
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 space-y-2">
                  <div
                    onClick={() => setExpandedFaqIndex(expandedFaqIndex === idx ? null : idx)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{faq.icon}</span>
                      <span>{faq.question}</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 dark:text-gray-400 transition-transform ${
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
