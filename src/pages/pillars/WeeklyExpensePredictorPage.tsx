import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeeklyTracker } from '../../hooks/useWeeklyTracker';
import { useToast } from '../../context/ToastContext';
import {
  Wallet,
  Lock,
  CheckCircle2,
  Sparkles,
  Lightbulb,
  TrendingUp,
  Target,
  BarChart3,
  X,
} from 'lucide-react';

const EXPENSE_ADVISORIES: Record<string, string[]> = {
  '1-10': [
    "Cancel every subscription you haven't used in the last 30 days, starting today.",
    "Separate 'needs' (rent, food, EMI) from 'wants' and cut every 'want' this month.",
    'Move to cash or debit-only for 2 weeks to immediately stop credit card overspending.',
  ],
  '11-20': [
    'Build your first monthly budget covering rent, food, bills, EMI, and savings as fixed categories.',
    'Track every expense for 30 days using a simple app or notebook - awareness is the first fix.',
    'Identify your top 3 spending leaks (subscriptions, food delivery, impulse buys) and cut them by half.',
  ],
  '21-30': [
    'Formalize your budget into fixed categories (needs, wants, savings, debt) with monthly limits for each.',
    'Set a target to bring total EMI + rent under 40% of your monthly take-home income.',
    'Track discretionary spending weekly and set a hard cap that reduces by 5% each month.',
  ],
  high: [
    'Review annual expenses (insurance premiums, subscriptions) for consolidation and better rates.',
    'Build the habit of comparing prices before any purchase above ₹1,000.',
    "Set a monthly 'review day' to check spending against budget and course-correct early.",
    'Reduce impulse spending by unsubscribing from shopping app notifications and promotional emails.',
    'Set a target to keep discretionary spending under 20% of your take-home income.',
    "Track and reduce any 'convenience' spending (delivery fees, express charges) that adds up unnoticed.",
  ],
};

function getRandomExpenseAdvice(score: number): string {
  let rangeKey = 'high';
  if (score <= 10) rangeKey = '1-10';
  else if (score <= 20) rangeKey = '11-20';
  else if (score <= 30) rangeKey = '21-30';

  const list = EXPENSE_ADVISORIES[rangeKey] ?? EXPENSE_ADVISORIES.high;
  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}

export const WeeklyExpensePredictorPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const {
    loading,
    weeks,
    currentViewWeekIndex,
    setCurrentViewWeekIndex,
    reportingWeek,
    fixedDecision,
    flexibleDecision,
    savingsDecision,
    actualFixed,
    actualFlex,
    actualSaved,
    handleDecision,
    submitWeek,
    expenseScore,
    disciplineScore,
    targetsHit,
    disciplineMsg,
  } = useWeeklyTracker();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for the Log Amount modal
  const [modalTarget, setModalTarget] = useState<'fixed' | 'flexible' | 'savings' | null>(null);
  const [modalAmount, setModalAmount] = useState<string>('');

  // State for the Expense Advisory modal
  const [showAdvisoryDialog, setShowAdvisoryDialog] = useState<boolean>(false);
  const [dialogAdvice, setDialogAdvice] = useState<string>('');

  // Recommended Expense Action
  const recommendedExpenseAction =
    'Review your Household Efficiency ratio monthly to spot minor optimizations.';

  const formatDateShort = (d: Date): string => {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatRupees = (val: number): string => {
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  const currentWeek = weeks[currentViewWeekIndex] ?? weeks[0];
  const activeReportingWeek = reportingWeek ?? currentWeek;
  const isTargetWeekSubmitted = Boolean(activeReportingWeek?.is_submitted);

  const handleOpenAchievedModal = (type: 'fixed' | 'flexible' | 'savings') => {
    if (isTargetWeekSubmitted) return;
    setModalTarget(type);
    const existing =
      type === 'fixed' ? actualFixed : type === 'flexible' ? actualFlex : actualSaved;
    setModalAmount(existing > 0 ? existing.toString() : '');
  };

  const handleConfirmAmount = () => {
    if (!modalTarget) return;
    const amt = parseFloat(modalAmount) || 0;
    handleDecision(modalTarget, 'achieved', amt);
    setModalTarget(null);
    setModalAmount('');
  };

  const handleMarkMissed = (type: 'fixed' | 'flexible' | 'savings') => {
    if (isTargetWeekSubmitted) return;
    handleDecision(type, 'missed');
  };

  const handleSubmitReport = async () => {
    if (isTargetWeekSubmitted || isSubmitting) return;

    if (!fixedDecision || !flexibleDecision || !savingsDecision) {
      showToast('Please mark all three targets before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await submitWeek();
      if (res?.success) {
        showToast('Weekly targets updated successfully! 🎉');
      } else {
        showToast(res?.error || 'Failed to submit report');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAdvisoryDialog = () => {
    const advice = getRandomExpenseAdvice(expenseScore);
    setDialogAdvice(advice);
    setShowAdvisoryDialog(true);
  };

  const getCategoryLabel = (type: 'fixed' | 'flexible' | 'savings') => {
    if (type === 'fixed') return 'Fixed Expenses';
    if (type === 'flexible') return 'Flexible Expenses';
    return 'Savings Goal';
  };

  if (loading && weeks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-8 lg:px-10 py-6 space-y-5 max-w-7xl mx-auto">
      <h1 data-testid="weekly-page-title" className="sr-only">
        Weekly Tracker
      </h1>

      {/* Row 1: HERO EXPENSE SCORE Card + Current Week Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* HERO EXPENSE SCORE Card (Left ~60% if current week shown, else full) */}
        <div
          data-testid="weekly-score-header"
          className={`${
            currentWeek?.is_current ? 'lg:col-span-7' : 'lg:col-span-12'
          } relative overflow-hidden p-5 sm:p-7 rounded-[24px] bg-[#0A0B1A]/95 border border-indigo-500/30 shadow-[0_4px_30px_rgba(0,0,0,0.6),0_0_25px_rgba(99,102,241,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-6`}
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-purple-900/20 to-transparent pointer-events-none" />

          {/* Left: Wallet Icon Box + Score */}
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1E40AF] border border-blue-400/40 shadow-[0_0_20px_rgba(37,99,235,0.45)] flex items-center justify-center shrink-0">
              <Wallet className="w-7 h-7 text-white drop-shadow-sm" />
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                EXPENSE SCORE
              </div>
              <div className="text-4xl sm:text-5xl font-black text-white mt-1 leading-none tracking-tight">
                {Math.round(expenseScore)}
              </div>
            </div>
          </div>

          {/* Glowing Background Wave Graphic spanning from center across to rings */}
          <div className="absolute inset-y-0 left-[28%] right-0 hidden md:block pointer-events-none select-none overflow-hidden">
            <svg
              className="w-full h-full"
              viewBox="0 0 700 130"
              fill="none"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="expWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
                  <stop offset="30%" stopColor="#818CF8" stopOpacity="0.85" />
                  <stop offset="65%" stopColor="#A855F7" stopOpacity="1" />
                  <stop offset="100%" stopColor="#D946EF" stopOpacity="0.85" />
                </linearGradient>
                <linearGradient id="expWaveFill" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#A855F7" stopOpacity="0.22" />
                  <stop offset="60%" stopColor="#6366F1" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="expWaveSecondary" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#818CF8" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#A855F7" stopOpacity="0.2" />
                </linearGradient>
                <filter id="expWaveGlow" x="-20%" y="-30%" width="140%" height="160%">
                  <feGaussianBlur stdDeviation="4.5" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Translucent ambient wave fill under main curve */}
              <path
                d="M 0 115 C 130 110, 200 85, 300 50 C 390 18, 470 18, 540 40 C 600 58, 650 55, 700 35 L 700 130 L 0 130 Z"
                fill="url(#expWaveFill)"
              />
              {/* Secondary subtle wave ribbon */}
              <path
                d="M 0 120 C 140 115, 230 95, 320 65 C 410 38, 490 35, 560 55 C 620 72, 665 65, 700 45"
                fill="none"
                stroke="url(#expWaveSecondary)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Primary glowing neon crest wave */}
              <path
                d="M 0 115 C 130 110, 200 85, 300 50 C 390 18, 470 18, 540 40 C 600 58, 650 55, 700 35"
                fill="none"
                stroke="url(#expWaveGrad)"
                strokeWidth="3.5"
                strokeLinecap="round"
                filter="url(#expWaveGlow)"
              />
            </svg>
          </div>

          {/* Right: Discipline & Hit Rate Rings */}
          <div className="flex items-center gap-5 relative z-10 self-end sm:self-center">
            {/* Discipline Ring */}
            <div className="flex flex-col items-center">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full border-2 border-[#A855F7] flex items-center justify-center text-base font-black text-white bg-[#150a24] shadow-[0_0_18px_rgba(168,85,247,0.35)]">
                {Math.round(disciplineScore)}
              </div>
              <span className="text-[11px] font-bold text-zinc-400 mt-1.5">
                Discipline
              </span>
            </div>

            {/* Hit Rate Ring */}
            <div className="flex flex-col items-center">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full border-2 border-[#38BDF8] flex items-center justify-center text-base font-black text-white bg-[#071324] shadow-[0_0_18px_rgba(56,189,248,0.35)]">
                {targetsHit}
              </div>
              <span className="text-[11px] font-bold text-zinc-400 mt-1.5">
                Hit Rate
              </span>
            </div>
          </div>
        </div>

        {/* Current Week Card (Right ~40%) */}
        <div
          className="lg:col-span-5 relative overflow-hidden p-5 sm:p-6 rounded-[24px] bg-[#0A0B1A]/95 border border-indigo-500/30 shadow-[0_4px_30px_rgba(0,0,0,0.6),0_0_25px_rgba(99,102,241,0.15)] flex items-center justify-between"
        >
          {/* Subtle Wave Graphic matching mockup */}
          <div className="absolute inset-y-0 right-0 w-3/5 hidden sm:block pointer-events-none select-none overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 300 100" fill="none" preserveAspectRatio="none">
              <path
                d="M 0 80 C 80 75, 160 35, 300 50"
                stroke="url(#expWaveGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.6"
              />
            </svg>
          </div>

          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/35 flex items-center justify-center text-purple-300 shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <Target className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Current Week</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Week {currentWeek?.index ?? 1} · {currentWeek ? `${formatDateShort(currentWeek.start)} - ${formatDateShort(currentWeek.end)}` : ''}
              </p>
            </div>
          </div>

          <span className="px-3 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 text-xs font-bold tracking-wider uppercase relative z-10">
            CURRENT WEEK
          </span>
        </div>
      </div>

      {/* Row 2: Horizontal Week Selector Strip */}
      <div className="grid grid-cols-5 gap-3">
        {weeks.map((w, idx) => {
          const isSelected = idx === currentViewWeekIndex;
          const isLocked = w.is_locked;
          const isDone = w.is_submitted;

          return (
            <button
              key={w.index}
              type="button"
              data-testid={`week-tab-${w.index}`}
              disabled={isLocked}
              onClick={() => {
                if (!isLocked) setCurrentViewWeekIndex(idx);
              }}
              className={`py-3.5 px-3 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-gradient-to-r from-[#4F46E5] to-[#6366F1] border-2 border-[#818CF8] shadow-[0_0_20px_rgba(99,102,241,0.4)] text-white scale-[1.02]'
                  : 'bg-[#0B0D1B]/95 border-white/[0.08] text-zinc-400 hover:border-white/20 hover:text-white'
              } ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <span
                className={`text-[11px] font-semibold tracking-wide ${
                  isSelected ? 'text-white' : 'text-zinc-400'
                }`}
              >
                Week {w.index}
              </span>
              <div className="h-5 flex items-center justify-center mt-1">
                {isLocked ? (
                  <Lock
                    data-testid={`week-tab-lock-${w.index}`}
                    className="w-4 h-4 text-zinc-500"
                  />
                ) : isDone || isSelected ? (
                  <div className="w-4 h-4 rounded-full border border-sky-400 flex items-center justify-center text-[10px] text-sky-400">
                    ✓
                  </div>
                ) : (
                  <span className="text-xs font-bold text-zinc-200">
                    {formatDateShort(w.start)}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Row 3: 2-Column Grid (Week Target Overview + Observation on Left, Target Ranges on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Target Overview + Financial Observation */}
        <div className="space-y-5">
          {/* Week N Target Overview Card */}
          {currentWeek?.is_current && (
            <div
              data-testid="current-week-overview-card"
              className="p-5 sm:p-6 rounded-2xl bg-[#0B0D1B]/95 border border-white/[0.08] shadow-lg backdrop-blur-md space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-5 h-5 text-purple-400 shrink-0" />
                  <div>
                    <h2 className="text-base font-bold text-white">
                      <span className="text-[#38BDF8]">Week {currentWeek.index}</span> Target Overview
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {formatDateShort(currentWeek.start)} - {formatDateShort(currentWeek.end)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 font-semibold text-white">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] shrink-0 shadow-[0_0_8px_#38BDF8]" />
                    <span>Fixed Expenses</span>
                  </div>
                  <span className="text-zinc-400">
                    Range: {formatRupees(currentWeek.range_fixed[0])} – {formatRupees(currentWeek.range_fixed[1])}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 font-semibold text-white">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shrink-0 shadow-[0_0_8px_#F59E0B]" />
                    <span>Flexible Expenses</span>
                  </div>
                  <span className="text-zinc-400">
                    Range: {formatRupees(currentWeek.range_flex[0])} – {formatRupees(currentWeek.range_flex[1])}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 font-semibold text-white">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#A855F7] shrink-0 shadow-[0_0_8px_#A855F7]" />
                    <span>Savings Goal</span>
                  </div>
                  <span className="text-zinc-400">
                    Range: {formatRupees(currentWeek.range_save[0])} – {formatRupees(currentWeek.range_save[1])}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Financial Observation Card */}
          <div
            data-testid="weekly-observation-card"
            className="p-5 sm:p-6 rounded-2xl bg-[#0B0D1B]/95 border border-white/[0.08] shadow-lg backdrop-blur-md space-y-4"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <TrendingUp className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Financial Observation</span>
              </div>

              <button
                type="button"
                data-testid="expense-advice-chip"
                onClick={handleOpenAdvisoryDialog}
                className="px-3 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-400 text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-900/60 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Expense Advice</span>
              </button>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed font-medium">
              {disciplineMsg || 'Excellent discipline.'}
            </p>

            {recommendedExpenseAction && (
              <div className="p-4 rounded-xl bg-[#121528] border border-indigo-500/20 flex items-start gap-3.5">
                <Lightbulb className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-xs font-bold text-indigo-400">
                    Recommended Expense Action
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed font-medium">
                    {recommendedExpenseAction}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Week N Target Ranges Card */}
        <div>
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0B0D1B]/95 border border-white/[0.08] shadow-lg backdrop-blur-md space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Target className="w-5 h-5 text-purple-400 shrink-0" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Week {activeReportingWeek.index} Target Ranges
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {formatDateShort(activeReportingWeek.start)} - {formatDateShort(activeReportingWeek.end)}
                  </p>
                </div>
              </div>
              {isTargetWeekSubmitted && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>COMPLETED</span>
                </div>
              )}
            </div>

            {/* Fixed Expenses Decision */}
            <div data-testid="decision-card-fixed" className="space-y-2 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-sm font-bold text-white">Fixed Expenses</span>
                <div className="text-right">
                  <span className="text-xs text-zinc-400">
                    Range: {formatRupees(activeReportingWeek.range_fixed[0])} – {formatRupees(activeReportingWeek.range_fixed[1])}
                  </span>
                  {actualFixed > 0 && (
                    <span className="text-xs font-bold text-[#10B981] ml-2">
                      (Logged: {formatRupees(actualFixed)})
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  data-testid="fixed-missed-btn"
                  disabled={isTargetWeekSubmitted}
                  onClick={() => handleMarkMissed('fixed')}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center cursor-pointer ${
                    fixedDecision === 'missed'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/30'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                  } ${isTargetWeekSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Missed
                </button>
                <button
                  type="button"
                  data-testid="fixed-achieved-btn"
                  disabled={isTargetWeekSubmitted}
                  onClick={() => handleOpenAchievedModal('fixed')}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center cursor-pointer ${
                    fixedDecision === 'achieved'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/30'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  } ${isTargetWeekSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Achieved
                </button>
              </div>
            </div>

            {/* Flexible Expenses Decision */}
            <div data-testid="decision-card-flexible" className="space-y-2 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-sm font-bold text-white">Flexible Expenses</span>
                <div className="text-right">
                  <span className="text-xs text-zinc-400">
                    Range: {formatRupees(activeReportingWeek.range_flex[0])} – {formatRupees(activeReportingWeek.range_flex[1])}
                  </span>
                  {actualFlex > 0 && (
                    <span className="text-xs font-bold text-[#10B981] ml-2">
                      (Logged: {formatRupees(actualFlex)})
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  data-testid="flexible-missed-btn"
                  disabled={isTargetWeekSubmitted}
                  onClick={() => handleMarkMissed('flexible')}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center cursor-pointer ${
                    flexibleDecision === 'missed'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/30'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                  } ${isTargetWeekSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Missed
                </button>
                <button
                  type="button"
                  data-testid="flexible-achieved-btn"
                  disabled={isTargetWeekSubmitted}
                  onClick={() => handleOpenAchievedModal('flexible')}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center cursor-pointer ${
                    flexibleDecision === 'achieved'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/30'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  } ${isTargetWeekSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Achieved
                </button>
              </div>
            </div>

            {/* Savings Goal Decision */}
            <div data-testid="decision-card-savings" className="space-y-2 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-sm font-bold text-white">Savings Goal</span>
                <div className="text-right">
                  <span className="text-xs text-zinc-400">
                    Range: {formatRupees(activeReportingWeek.range_save[0])} – {formatRupees(activeReportingWeek.range_save[1])}
                  </span>
                  {actualSaved > 0 && (
                    <span className="text-xs font-bold text-[#10B981] ml-2">
                      (Logged: {formatRupees(actualSaved)})
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  data-testid="savings-missed-btn"
                  disabled={isTargetWeekSubmitted}
                  onClick={() => handleMarkMissed('savings')}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center cursor-pointer ${
                    savingsDecision === 'missed'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/30'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                  } ${isTargetWeekSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Missed
                </button>
                <button
                  type="button"
                  data-testid="savings-achieved-btn"
                  disabled={isTargetWeekSubmitted}
                  onClick={() => handleOpenAchievedModal('savings')}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center cursor-pointer ${
                    savingsDecision === 'achieved'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/30'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  } ${isTargetWeekSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Achieved
                </button>
              </div>
            </div>

            {/* Submit / Status Button */}
            <div className="pt-2">
              <button
                type="button"
                data-testid="submit-week-btn"
                disabled={isTargetWeekSubmitted || isSubmitting}
                onClick={handleSubmitReport}
                className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isTargetWeekSubmitted
                    ? 'bg-[#181B2B] text-zinc-400 cursor-not-allowed border border-white/5'
                    : 'bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:opacity-95 text-white shadow-[0_0_20px_rgba(99,102,241,0.35)] active:scale-[0.99]'
                }`}
              >
                <span>
                  {isTargetWeekSubmitted
                    ? `SUBMITTED FOR WEEK ${activeReportingWeek.index}`
                    : isSubmitting
                    ? 'Submitting...'
                    : `SUBMIT REPORT FOR WEEK ${activeReportingWeek.index}`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Full-Width OPTIMIZE NOW Button */}
      <button
        type="button"
        data-testid="weekly-optimize-btn"
        onClick={() => navigate('/master-data?target=expenses')}
        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#A855F7] hover:opacity-95 text-white font-black text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
      >
        <Sparkles className="w-4 h-4 text-white" />
        <span>OPTIMIZE NOW</span>
      </button>

      {/* Log Exact Amount Modal */}
      {modalTarget && activeReportingWeek && (
        <div
          data-testid="log-amount-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-md bg-[#0B0D1B] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-lg font-bold text-white">
                Log {getCategoryLabel(modalTarget)} (Week {activeReportingWeek.index})
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Enter the exact amount for {getCategoryLabel(modalTarget)} for Week {activeReportingWeek.index}:
              </p>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">
                ₹
              </span>
              <input
                type="number"
                data-testid="modal-amount-input"
                autoFocus
                placeholder="0"
                value={modalAmount}
                onChange={(e) => setModalAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmAmount();
                }}
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-[#121528] border border-white/10 text-white font-bold text-base focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setModalTarget(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="modal-confirm-btn"
                onClick={handleConfirmAmount}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#4F46E5] to-[#6366F1] shadow-lg shadow-indigo-600/30 hover:opacity-90 transition-opacity"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advisory Modal */}
      {showAdvisoryDialog && (
        <div
          data-testid="expense-advisory-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-md bg-[#0B0D1B] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Expense Advisory</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAdvisoryDialog(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Based on your current score of <span className="font-bold text-white">{Math.round(expenseScore)}</span>:
            </p>

            <div className="p-4 rounded-xl bg-[#121528] border border-indigo-500/20 text-xs text-zinc-200 leading-relaxed font-medium">
              {dialogAdvice}
            </div>

            <button
              type="button"
              onClick={() => setShowAdvisoryDialog(false)}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#4F46E5] to-[#6366F1] shadow-lg shadow-indigo-600/30 hover:opacity-90 transition-opacity"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyExpensePredictorPage;
