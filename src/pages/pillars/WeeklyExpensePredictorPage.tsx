import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeeklyTracker } from '../../hooks/useWeeklyTracker';
import { useToast } from '../../context/ToastContext';
import { AdvisoryService } from '../../services/marketAdvisor';
import {
  Lock,
  CheckCircle2,
  Sparkles,
  Lightbulb,
  LineChart,
} from 'lucide-react';

const EXPENSE_ADVISORIES: Record<string, string[]> = {
  '1-10': [
    'Stop all non-essential spending immediately - no dining out, subscriptions, or shopping this month.',
    'List every expense from the last 30 days to see exactly where money is leaking.',
    "Cancel every subscription you haven't used in the last 30 days, starting today.",
    "Separate 'needs' (rent, food, EMI) from 'wants' and cut every 'want' this month.",
    "Call your lenders today to discuss restructuring any EMI you're struggling to pay.",
    'Avoid taking any new loan or credit card to cover daily expenses - it deepens the crisis.',
    'Move to a stricter, cash-only system for groceries and daily spends for the next 30 days.',
    'Negotiate rent or move to lower-cost housing if rent exceeds 40% of your income.',
    'Pause all discretionary shopping (clothes, gadgets, entertainment) until expenses stabilize.',
    'Talk to family about temporarily sharing costs (food, rent) while you stabilize.',
    'Use public transport instead of cabs/fuel wherever possible to cut daily costs immediately.',
    'Switch to home-cooked meals entirely - eating out is one of the fastest expense leaks.',
    "Check for any auto-debit you've forgotten about and cancel it within the next 24 hours.",
    'Avoid EMI-based purchases of any kind (gadgets, appliances) until your situation stabilizes.',
    'Ask utility providers about installment or hardship plans if bills are piling up.',
    'Set a hard daily spending limit and track every rupee against it without exception.',
    'Delay any planned travel or big-ticket purchase until your expenses are under control.',
    'Consolidate multiple small debts into one manageable plan to stop juggling payments.',
    'Ask for salary advance from your employer only as an absolute last resort, not a routine.',
    'Create a bare-minimum survival budget covering only rent, food, and essential bills.',
  ],
  '11-20': [
    'Build your first monthly budget covering rent, food, bills, EMI, and savings as fixed categories.',
    'Track every expense for 30 days using a simple app or notebook - awareness is the first fix.',
    'Identify your top 3 spending leaks (subscriptions, food delivery, impulse buys) and cut them by half.',
    'Set a weekly cash/UPI limit for discretionary spending and stick to it strictly.',
    'Review all EMIs and loans - list interest rates and prioritize paying off the highest-rate one first.',
    "Cancel at least 2 subscriptions you're not using regularly, starting this week.",
    'Move fixed bill payments to auto-debit to avoid late fees, but track them weekly.',
    'Set a rule: no purchase above ₹2,000 without a 24-hour cooling-off period.',
    'Reduce food delivery orders to twice a week and cook the rest at home.',
    'Compare your rent/EMI to the 40% income rule and plan to bring it within limits.',
    "Build a 'wants' jar - a fixed monthly amount for discretionary spends, nothing beyond it.",
    'Review your mobile, OTT, and internet plans for cheaper alternatives with the same usage.',
    'Set a goal to reduce total monthly expenses by 10% over the next 60 days.',
    'Avoid using credit cards for daily expenses until you can pay the full bill each month.',
    'List all due dates for bills/EMIs in one place to avoid late payment penalties.',
    'Set a small emergency buffer goal (1 week of expenses) before any discretionary spending resumes.',
    "Review your last 3 months' bank statement to spot recurring, avoidable expenses.",
    'Switch one high-cost habit (branded groceries, daily cabs) to a lower-cost alternative this month.',
    'Set a rule to pay EMIs and bills on the 1st, before any discretionary spending happens.',
    'Have one no-spend day per week as a simple, repeatable discipline builder.',
  ],
  '21-30': [
    'Formalize your budget into fixed categories (needs, wants, savings, debt) with monthly limits for each.',
    'Set a target to bring total EMI + rent under 40% of your monthly take-home income.',
    'Track discretionary spending weekly and set a hard cap that reduces by 5% each month.',
    'Review all subscriptions every quarter and cancel anything with under 2 uses per month.',
    'Set up separate accounts for fixed expenses and discretionary spending to avoid overlap.',
    'Build a 1-month expense buffer in a separate account before increasing any discretionary spend.',
    'Negotiate one recurring bill (insurance, internet, phone plan) for a better rate this month.',
    'Set a rule: any purchase above ₹5,000 needs a 48-hour wait and written justification.',
    'Review your grocery and food delivery spend - aim to cut it by 15% this quarter.',
    'Consolidate any high-interest debt into a lower-interest option if available to you.',
    'Set a target to save the difference every time you find a cheaper alternative to a fixed cost.',
    'Track your expense-to-income ratio monthly and aim to lower it by 2-3% each quarter.',
    'Avoid lifestyle upgrades (new gadgets, upgraded plans) until your expense ratio stabilizes.',
    'Set a clear EMI payoff order - highest interest rate first, while paying minimums on others.',
    'Review annual expenses (insurance premiums, subscriptions) for consolidation and better rates.',
    'Build the habit of comparing prices before any purchase above ₹1,000.',
    "Set a monthly 'review day' to check spending against budget and course-correct early.",
    'Reduce impulse spending by unsubscribing from shopping app notifications and promotional emails.',
    'Set a target to keep discretionary spending under 20% of your take-home income.',
    "Track and reduce any 'convenience' spending (delivery fees, express charges) that adds up unnoticed.",
  ],
  high: [
    'Your expense control is excellent. Automate remaining payments.',
    "Focus on reducing 'lifestyle creep' by capping annual expense growth.",
    'Review your Household Efficiency ratio monthly to spot minor optimizations.',
    'Set a goal to redirect 100% of any expense-saving into appreciating assets.',
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
    isEmpty,
    weeks,
    reportingWeek,
    currentViewWeekIndex,
    expenseScore,
    disciplineScore,
    targetsHit,
    disciplineMsg,
    fixedDecision,
    flexibleDecision,
    savingsDecision,
    actualFixed,
    actualFlex,
    actualSaved,
    setCurrentViewWeekIndex,
    handleDecision,
    submitWeek,
  } = useWeeklyTracker();

  // State for the "Log Exact Amount" modal
  const [modalTarget, setModalTarget] = useState<'fixed' | 'flexible' | 'savings' | null>(null);
  const [modalAmount, setModalAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // State for the Expense Advisory modal
  const [showAdvisoryDialog, setShowAdvisoryDialog] = useState<boolean>(false);
  const [dialogAdvice, setDialogAdvice] = useState<string>('');

  // Recommended Expense Action (computed once per load)
  const [recommendedExpenseAction, setRecommendedExpenseAction] = useState<string>('');
  const adviceComputedRef = useRef(false);

  useEffect(() => {
    if (!loading && !adviceComputedRef.current) {
      adviceComputedRef.current = true;
      const advice = AdvisoryService.getAdvisoryText('expenses', expenseScore);
      setRecommendedExpenseAction(advice || '');
    }
  }, [loading, expenseScore]);

  const formatDateShort = (d: Date): string => {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatRupees = (val: number): string => {
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  const currentWeek = weeks[currentViewWeekIndex];
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
    if (!activeReportingWeek || isTargetWeekSubmitted) return;

    if (!fixedDecision || !flexibleDecision || !savingsDecision) {
      showToast('Please mark all three targets before submitting.');
      return;
    }

    setIsSubmitting(true);
    const res = await submitWeek();
    setIsSubmitting(false);

    if (res.success) {
      showToast(`Weekly report for Week ${activeReportingWeek.index} submitted!`);
    } else {
      showToast(res.error || 'Failed to submit report');
    }
  };

  const handleOpenAdvisoryDialog = () => {
    setDialogAdvice(getRandomExpenseAdvice(expenseScore));
    setShowAdvisoryDialog(true);
  };

  const getCategoryLabel = (type: 'fixed' | 'flexible' | 'savings'): string => {
    if (type === 'fixed') return 'Fixed Expenses';
    if (type === 'flexible') return 'Flexible Expenses';
    return 'Savings';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isEmpty || !currentWeek || !activeReportingWeek) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-slate-500 dark:text-zinc-400">Missing Data.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <h1 data-testid="weekly-page-title" className="sr-only">
        Weekly Tracker
      </h1>

      {/* 1. Score Header */}
      <div
        data-testid="weekly-score-header"
        className="p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between"
      >
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            EXPENSE SCORE
          </div>
          <div className="text-5xl sm:text-6xl font-black text-indigo-600 dark:text-indigo-400 mt-1 leading-none">
            {Math.round(expenseScore)}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <div className="w-11 h-11 rounded-full border-[3px] border-purple-500/40 flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400">
              {Math.round(disciplineScore)}
            </div>
            <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 mt-1">
              Discipline
            </span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-11 h-11 rounded-full border-[3px] border-teal-500/40 flex items-center justify-center text-xs font-bold text-teal-600 dark:text-teal-400">
              {targetsHit}
            </div>
            <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 mt-1">
              Hit Rate
            </span>
          </div>
        </div>
      </div>

      {/* 2. Horizontal Scrollable Week Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
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
              className={`w-20 shrink-0 py-2.5 rounded-2xl flex flex-col items-center justify-center transition-all border ${
                isSelected
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'bg-white dark:bg-[#0E0B1F] border-slate-200 dark:border-indigo-500/20 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              } ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <span
                className={`text-[9px] font-bold ${
                  isSelected ? 'text-white/80' : 'text-slate-400 dark:text-zinc-500'
                }`}
              >
                Week {w.index}
              </span>
              <div className="h-5 flex items-center justify-center mt-1">
                {isLocked ? (
                  <Lock
                    data-testid={`week-tab-lock-${w.index}`}
                    className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500"
                  />
                ) : isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <span
                    className={`text-[11px] font-bold ${
                      isSelected ? 'text-white' : 'text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    {formatDateShort(w.start)}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Week N Target Overview (Shown ONLY when selected week is current week) */}
      {currentWeek.is_current && (
        <div
          data-testid="current-week-overview-card"
          className="p-5 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-indigo-500/25 dark:border-indigo-500/25 shadow-sm dark:shadow-xl space-y-4 transition-colors"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-indigo-600 dark:text-indigo-400">
              Week {currentWeek.index} Target Overview
            </h2>
            <span className="px-2.5 py-0.5 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold tracking-wider">
              CURRENT WEEK
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-zinc-400 -mt-2">
            {formatDateShort(currentWeek.start)} - {formatDateShort(currentWeek.end)}
          </div>

          <div className="space-y-3 pt-1 divide-y divide-slate-100 dark:divide-zinc-800/80">
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-zinc-200">
                <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                <span>Fixed Expenses</span>
              </div>
              <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                Range: {formatRupees(currentWeek.range_fixed[0])} - {formatRupees(currentWeek.range_fixed[1])}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-zinc-200">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Flexible Expenses</span>
              </div>
              <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                Range: {formatRupees(currentWeek.range_flex[0])} - {formatRupees(currentWeek.range_flex[1])}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-zinc-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Savings Goal</span>
              </div>
              <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                Range: {formatRupees(currentWeek.range_save[0])} - {formatRupees(currentWeek.range_save[1])}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Target Ranges Reporting Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-6 transition-colors">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Week {activeReportingWeek.index} Target Ranges
          </h2>
          <div className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            {formatDateShort(activeReportingWeek.start)} - {formatDateShort(activeReportingWeek.end)}
          </div>
        </div>

        {/* 4A. Fixed Expenses Decision Block */}
        <div
          data-testid="decision-card-fixed"
          className="space-y-3 pt-1"
        >
          <div className="flex justify-between items-start text-xs">
            <span className="text-sm font-bold text-slate-900 dark:text-white">Fixed Expenses</span>
            <div className="text-right">
              <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                Range: {formatRupees(activeReportingWeek.range_fixed[0])} - {formatRupees(activeReportingWeek.range_fixed[1])}
              </div>
              {actualFixed > 0 && (
                <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Logged: {formatRupees(actualFixed)}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              data-testid="fixed-missed-btn"
              disabled={isTargetWeekSubmitted}
              onClick={() => handleMarkMissed('fixed')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center ${
                fixedDecision === 'missed'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/25'
                  : 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/15'
              } ${isTargetWeekSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Missed
            </button>
            <button
              type="button"
              data-testid="fixed-achieved-btn"
              disabled={isTargetWeekSubmitted}
              onClick={() => handleOpenAchievedModal('fixed')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center ${
                fixedDecision === 'achieved'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25'
                  : 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15'
              } ${isTargetWeekSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Achieved
            </button>
          </div>
        </div>

        <hr className="border-slate-100 dark:border-zinc-800" />

        {/* 4B. Flexible Expenses Decision Block */}
        <div
          data-testid="decision-card-flexible"
          className="space-y-3"
        >
          <div className="flex justify-between items-start text-xs">
            <span className="text-sm font-bold text-slate-900 dark:text-white">Flexible Expenses</span>
            <div className="text-right">
              <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                Range: {formatRupees(activeReportingWeek.range_flex[0])} - {formatRupees(activeReportingWeek.range_flex[1])}
              </div>
              {actualFlex > 0 && (
                <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Logged: {formatRupees(actualFlex)}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              data-testid="flexible-missed-btn"
              disabled={isTargetWeekSubmitted}
              onClick={() => handleMarkMissed('flexible')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center ${
                flexibleDecision === 'missed'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/25'
                  : 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/15'
              } ${isTargetWeekSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Missed
            </button>
            <button
              type="button"
              data-testid="flexible-achieved-btn"
              disabled={isTargetWeekSubmitted}
              onClick={() => handleOpenAchievedModal('flexible')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center ${
                flexibleDecision === 'achieved'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25'
                  : 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15'
              } ${isTargetWeekSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Achieved
            </button>
          </div>
        </div>

        <hr className="border-slate-100 dark:border-zinc-800" />

        {/* 4C. Savings Goal Decision Block */}
        <div
          data-testid="decision-card-savings"
          className="space-y-3"
        >
          <div className="flex justify-between items-start text-xs">
            <span className="text-sm font-bold text-slate-900 dark:text-white">Savings Goal</span>
            <div className="text-right">
              <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                Range: {formatRupees(activeReportingWeek.range_save[0])} - {formatRupees(activeReportingWeek.range_save[1])}
              </div>
              {actualSaved > 0 && (
                <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Logged: {formatRupees(actualSaved)}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              data-testid="savings-missed-btn"
              disabled={isTargetWeekSubmitted}
              onClick={() => handleMarkMissed('savings')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center ${
                savingsDecision === 'missed'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/25'
                  : 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/15'
              } ${isTargetWeekSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Missed
            </button>
            <button
              type="button"
              data-testid="savings-achieved-btn"
              disabled={isTargetWeekSubmitted}
              onClick={() => handleOpenAchievedModal('savings')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center ${
                savingsDecision === 'achieved'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25'
                  : 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15'
              } ${isTargetWeekSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Achieved
            </button>
          </div>
        </div>

        {/* 4D. Submit Button */}
        <div className="pt-2">
          <button
            type="button"
            data-testid="submit-week-btn"
            disabled={isTargetWeekSubmitted || isSubmitting}
            onClick={handleSubmitReport}
            className={`w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 ${
              isTargetWeekSubmitted
                ? 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25 active:scale-[0.99]'
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

      {/* 5. Financial Observation Card */}
      <div
        data-testid="weekly-observation-card"
        className="p-5 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-indigo-500/20 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-3 transition-colors"
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs sm:text-sm">
            <LineChart className="w-4 h-4 shrink-0" />
            <span className="text-slate-900 dark:text-white">Financial Observation</span>
          </div>

          <button
            type="button"
            data-testid="expense-advice-chip"
            onClick={handleOpenAdvisoryDialog}
            className="px-2.5 py-1 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-500/20 transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Expense Advice</span>
          </button>
        </div>

        <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">
          {disciplineMsg}
        </p>

        {recommendedExpenseAction && (
          <div className="p-3.5 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/15 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
              <Lightbulb className="w-4 h-4 shrink-0" />
              <span>Recommended Expense Action</span>
            </div>
            <p className="text-xs text-slate-800 dark:text-zinc-200 leading-relaxed font-medium">
              {recommendedExpenseAction}
            </p>
          </div>
        )}
      </div>

      {/* 6. Optimize Now Button */}
      <button
        type="button"
        data-testid="weekly-optimize-btn"
        onClick={() => navigate('/master-data?target=expenses')}
        className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        <span>Optimize Now</span>
      </button>

      {/* Log Exact Amount Modal */}
      {modalTarget && activeReportingWeek && (
        <div
          data-testid="log-amount-modal"
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-[#0E0B1F] border border-slate-200 dark:border-indigo-500/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Log {getCategoryLabel(modalTarget)} (Week {activeReportingWeek.index})
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Enter the exact amount for {getCategoryLabel(modalTarget)} for Week {activeReportingWeek.index}:
            </p>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-400 text-sm">
                ₹
              </span>
              <input
                type="number"
                data-testid="modal-amount-input"
                value={modalAmount}
                onChange={(e) => setModalAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-indigo-500/30 bg-slate-50 dark:bg-[#14102B] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                placeholder="Amount (₹)"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalTarget(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="modal-confirm-btn"
                onClick={handleConfirmAmount}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30"
              >
                Confirm &amp; Calculate Score
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expense Advisory Dialog Modal */}
      {showAdvisoryDialog && (
        <div
          data-testid="expense-advisory-dialog"
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-[#0E0B1F] border border-slate-200 dark:border-indigo-500/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Expense Advisory
              </h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Based on your current score of {Math.round(expenseScore)}, here is a recommended action:
            </p>

            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-slate-800 dark:text-zinc-100 text-sm font-semibold leading-relaxed">
              {dialogAdvice}
            </div>

            <button
              type="button"
              onClick={() => setShowAdvisoryDialog(false)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
