import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeeklyTracker } from '../../hooks/useWeeklyTracker';
import { useToast } from '../../context/ToastContext';
import { getFinMessage } from '../../models/weekly';
import {
  Calendar,
  Award,
  Target,
  Percent,
  CheckCircle2,
  XCircle,
  TrendingUp,
  PieChart,
  Lightbulb,
  BookOpen,
  ArrowRight,
  Zap,
  ShoppingBag,
  Home,
  PiggyBank,
  Check,
  ChevronRight,
} from 'lucide-react';

export const WeeklyExpensePredictorPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const {
    loading,
    isEmpty,
    weeks,
    currentViewWeekIndex,
    weeklyIncome: _weeklyIncome,
    disciplineScore,
    targetsHit,
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

  const formatInr = (val: number): string => {
    if (isNaN(val) || val === 0) return '₹0';
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  const formatDate = (d: Date): string => {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const currentWeek = weeks[currentViewWeekIndex];
  const prevWeek = currentViewWeekIndex > 0 ? weeks[currentViewWeekIndex - 1] : null;

  const handleOpenAchievedModal = (type: 'fixed' | 'flexible' | 'savings') => {
    if (currentWeek?.is_submitted) return;
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
    if (currentWeek?.is_submitted) return;
    handleDecision(type, 'missed', 0);
  };

  const handleSubmitReport = async () => {
    if (!currentWeek) return;
    if (currentWeek.is_submitted || !currentWeek.is_current) return;

    // Check if all 3 decisions are made
    if (!fixedDecision || !flexibleDecision || !savingsDecision) {
      showToast('Please mark all three targets before submitting.');
      return;
    }

    setIsSubmitting(true);
    const res = await submitWeek();
    setIsSubmitting(false);

    if (res.success) {
      showToast('Weekly report submitted!');
    } else {
      showToast(res.error || 'Failed to submit report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isEmpty || !currentWeek) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-slate-500 dark:text-zinc-400">Missing Data.</p>
      </div>
    );
  }

  const totalSpentCalculated = (actualFixed || 0) + (actualFlex || 0) + (actualSaved || 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. Top Header & Quote Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 dark:from-[#2E1065] dark:via-[#1E0A45] dark:to-[#120D2C] text-white shadow-xl border border-indigo-400/20 dark:border-indigo-500/20 relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20 text-indigo-300">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 data-testid="weekly-page-title" className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Weekly Tracker
            </h1>
            <p className="text-xs md:text-sm text-indigo-200/80">
              Expense discipline scoring and weekly target ranges
            </p>
          </div>
        </div>

        {/* Quote Block */}
        <div className="relative z-10 max-w-md p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/10 text-indigo-300 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold italic text-indigo-100">
            &ldquo;Control your expenses today for a richer tomorrow.&rdquo;
          </p>
        </div>
      </div>

      {/* 2. Hero Score Header & 4 Mini Stat Cards */}
      <div
        data-testid="weekly-score-header"
        className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-6 transition-colors"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Gauge & Progress Text */}
          <div className="lg:col-span-6 flex items-center gap-5">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200 dark:text-indigo-950"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-indigo-600 dark:text-indigo-500 transition-all duration-1000 ease-out"
                  strokeDasharray={`${Math.min(100, Math.max(0, (targetsHit / 5) * 100))}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{targetsHit}/5</span>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-300 uppercase">Score</span>
              </div>
            </div>

            <div>
              <div className="text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-1">
                Let&apos;s build better spending habits!
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed max-w-sm">
                Hit at least 5 targets this week to improve your expense discipline.
              </p>
            </div>
          </div>

          {/* 4 Mini Stat Cards */}
          <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 text-center">
              <div className="w-7 h-7 mx-auto mb-1.5 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white">{targetsHit}</div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">Targets Achieved</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 text-center">
              <div className="w-7 h-7 mx-auto mb-1.5 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Target className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white">5</div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">Total Targets</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 text-center">
              <div className="w-7 h-7 mx-auto mb-1.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Percent className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-amber-600 dark:text-amber-400">{((targetsHit / 5) * 100).toFixed(0)}%</div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">Success Rate</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 text-center">
              <div className="w-7 h-7 mx-auto mb-1.5 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-white">Week {currentWeek.index}</div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">
                {formatDate(currentWeek.start)} - {formatDate(currentWeek.end)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Week Tabs Strip & Previous Week Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {weeks.map((w, idx) => {
            const isSelected = idx === currentViewWeekIndex;
            return (
              <button
                key={w.index}
                type="button"
                data-testid={`week-tab-${w.index}`}
                onClick={() => setCurrentViewWeekIndex(idx)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/25'
                    : 'bg-white dark:bg-[#0E0B1F] border-slate-200 dark:border-indigo-500/15 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Week {w.index}
                <div className="text-[9px] font-normal opacity-80">
                  {formatDate(w.start)} - {formatDate(w.end)}
                </div>
              </button>
            );
          })}
        </div>

        {/* Previous Week Card Mini */}
        {prevWeek && currentWeek.is_current && !currentWeek.is_submitted ? (
          <div
            data-testid="prev-week-mini"
            className="p-3 px-4 rounded-2xl bg-white dark:bg-[#0E0B1F] border border-slate-200 dark:border-indigo-500/20 flex items-center justify-between gap-3 text-xs shrink-0"
          >
            <span className="text-slate-500 dark:text-zinc-400 font-semibold">Previous Week ({prevWeek.index})</span>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                prevWeek.status === 'achieved'
                  ? 'bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                  : 'bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400'
              }`}
            >
              {prevWeek.status === 'achieved' ? 'ACHIEVED' : 'MISSED'}
            </span>
          </div>
        ) : (
          <div className="p-3 px-4 rounded-2xl bg-white dark:bg-[#0E0B1F] border border-slate-200 dark:border-indigo-500/20 flex items-center justify-between gap-3 text-xs shrink-0">
            <span className="text-slate-500 dark:text-zinc-400 font-semibold">Current Week</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-black uppercase text-[10px]">
              {currentWeek.is_submitted ? 'Submitted ✓' : 'In Progress'}
            </span>
          </div>
        )}
      </div>

      {/* 4. 2-Column Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Target Ranges */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-6 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Week {currentWeek.index} Target Ranges
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Track your actual spending against recommended limits
                </p>
              </div>
            </div>

            {/* Fixed Expenses Decision Card */}
            <div data-testid="decision-card-fixed" className="p-4 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                    <Home className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Fixed Expenses</div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400">Rent, EMI, Bills, Subscriptions</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    Target: {formatInr(currentWeek.range_fixed[0])} - {formatInr(currentWeek.range_fixed[1])}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-zinc-400">{formatInr(actualFixed)} spent</div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  data-testid="fixed-achieved-btn"
                  onClick={() => handleOpenAchievedModal('fixed')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    fixedDecision === 'achieved'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                      : 'bg-white dark:bg-[#0E0B1F] border border-slate-200 dark:border-indigo-500/20 text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{fixedDecision === 'achieved' ? `Achieved (${formatInr(actualFixed)})` : 'Achieved'}</span>
                </button>
                <button
                  type="button"
                  data-testid="fixed-missed-btn"
                  onClick={() => handleMarkMissed('fixed')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    fixedDecision === 'missed'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                      : 'bg-white dark:bg-[#0E0B1F] border border-slate-200 dark:border-rose-500/20 text-slate-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Missed</span>
                </button>
              </div>
            </div>

            {/* Flexible Expenses Decision Card */}
            <div data-testid="decision-card-flexible" className="p-4 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Flexible Expenses</div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400">Food, Shopping, Travel, Others</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    Target: {formatInr(currentWeek.range_flex[0])} - {formatInr(currentWeek.range_flex[1])}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-zinc-400">{formatInr(actualFlex)} spent</div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  data-testid="flexible-achieved-btn"
                  onClick={() => handleOpenAchievedModal('flexible')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    flexibleDecision === 'achieved'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                      : 'bg-white dark:bg-[#0E0B1F] border border-slate-200 dark:border-indigo-500/20 text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{flexibleDecision === 'achieved' ? `Achieved (${formatInr(actualFlex)})` : 'Achieved'}</span>
                </button>
                <button
                  type="button"
                  data-testid="flexible-missed-btn"
                  onClick={() => handleMarkMissed('flexible')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    flexibleDecision === 'missed'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                      : 'bg-white dark:bg-[#0E0B1F] border border-slate-200 dark:border-rose-500/20 text-slate-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Missed</span>
                </button>
              </div>
            </div>

            {/* Savings Goal Decision Card */}
            <div data-testid="decision-card-savings" className="p-4 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
                    <PiggyBank className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Savings Goal</div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400">Investments, Emergency Fund</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    Target: {formatInr(currentWeek.range_save?.[0] ?? 0)} - {formatInr(currentWeek.range_save?.[1] ?? 0)}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-zinc-400">{formatInr(actualSaved)} saved</div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  data-testid="savings-achieved-btn"
                  onClick={() => handleOpenAchievedModal('savings')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    savingsDecision === 'achieved'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                      : 'bg-white dark:bg-[#0E0B1F] border border-slate-200 dark:border-indigo-500/20 text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{savingsDecision === 'achieved' ? `Achieved (${formatInr(actualSaved)})` : 'Achieved'}</span>
                </button>
                <button
                  type="button"
                  data-testid="savings-missed-btn"
                  onClick={() => handleMarkMissed('savings')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    savingsDecision === 'missed'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                      : 'bg-white dark:bg-[#0E0B1F] border border-slate-200 dark:border-rose-500/20 text-slate-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Missed</span>
                </button>
              </div>
            </div>

            {/* Bottom Action Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                data-testid="submit-week-btn"
                disabled={isSubmitting || currentWeek.is_submitted}
                onClick={handleSubmitReport}
                className={`w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 ${
                  currentWeek.is_submitted
                    ? 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25 active:scale-95'
                }`}
              >
                <span>{currentWeek.is_submitted ? 'SUBMITTED' : isSubmitting ? 'Submitting...' : 'SUBMIT WEEKLY REPORT'}</span>
              </button>

              <button
                type="button"
                data-testid="weekly-optimize-btn"
                onClick={() => navigate('/master-data?target=expenses')}
                className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/25 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span>⚡ Optimize Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Weekly Expense Overview, Observation & Tips */}
        <div className="lg:col-span-5 space-y-6">
          {/* Weekly Expense Overview Chart Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-4 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Weekly Expense Overview</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Your spending breakdown this week</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 py-2">
              {/* Donut Chart Graphic */}
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200 dark:text-zinc-900"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-indigo-600 dark:text-indigo-500"
                    strokeDasharray="40, 100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-sm font-black text-slate-900 dark:text-white">{formatInr(totalSpentCalculated)}</span>
                  <span className="text-[9px] text-slate-500 dark:text-zinc-400">Total Spent</span>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-500" />
                  <span className="text-slate-700 dark:text-zinc-300">Fixed Expenses</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-slate-700 dark:text-zinc-300">Flexible Expenses</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-slate-700 dark:text-zinc-300">Savings</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span className="text-slate-700 dark:text-zinc-300">Others</span>
                </div>
              </div>
            </div>
          </div>

          {/* Observation Card */}
          <div
            data-testid="weekly-observation-card"
            className="p-6 rounded-3xl bg-amber-50 dark:bg-[#0E0B1F] border border-amber-200 dark:border-amber-500/30 shadow-sm dark:shadow-xl space-y-3 relative overflow-hidden transition-colors"
          >
            <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 font-bold text-xs">
              <Lightbulb className="w-4 h-4" />
              <span>Observation</span>
            </div>
            <p className="text-xs text-slate-800 dark:text-zinc-200 leading-relaxed">
              {getFinMessage(disciplineScore, savingsDecision === 'achieved')}
            </p>
          </div>

          {/* Tips to Improve Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Tips to Improve</h2>
              </div>
              <button type="button" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1">
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Reduce discretionary spending</div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">Avoid unnecessary shopping and eating out.</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Increase weekly savings</div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">Try to save at least 25% of your income.</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Track daily expenses</div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">Log your expenses to stay within limits.</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Log Exact Amount Modal */}
      {modalTarget && (
        <div data-testid="log-amount-modal" className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E0B1F] border border-slate-200 dark:border-indigo-500/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Log {modalTarget === 'fixed' ? 'Fixed Expenses' : modalTarget === 'flexible' ? 'Flexible Expenses' : 'Savings'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Enter the exact amount for this week:
            </p>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-400 text-sm">₹</span>
              <input
                type="number"
                data-testid="modal-amount-input"
                value={modalAmount}
                onChange={(e) => setModalAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-indigo-500/30 bg-slate-50 dark:bg-[#14102B] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                placeholder="Enter amount"
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
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
