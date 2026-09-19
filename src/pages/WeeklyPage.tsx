import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeeklyTracker } from '../hooks/useWeeklyTracker';
import { useToast } from '../context/ToastContext';
import { getFinMessage } from '../models/weekly';

export const WeeklyPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const {
    loading,
    error,
    isEmpty,
    weeks,
    currentViewWeekIndex,
    weeklyIncome,
    disciplineScore,
    targetsHit,
    heatmapDays,
    streakCount,
    fixedDecision,
    flexibleDecision,
    savingsDecision,
    actualFixed,
    actualFlex,
    actualSaved,
    setCurrentViewWeekIndex,
    handleDecision,
    submitWeek,
    refetch,
  } = useWeeklyTracker();

  // State for the "Log Exact Amount" modal
  const [modalTarget, setModalTarget] = useState<'fixed' | 'flexible' | 'savings' | null>(null);
  const [modalAmount, setModalAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Helper for Indian currency formatting
  const formatInr = (val: number): string => {
    if (isNaN(val) || val === 0) return '₹0';
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  const currentWeek = weeks[currentViewWeekIndex];

  // Concentric Radial Ring progress calculations
  const fixedProgress =
    currentWeek && currentWeek.range_fixed[1] > 0
      ? Math.min(1, Math.max(0, actualFixed / currentWeek.range_fixed[1]))
      : 0;
  const flexProgress =
    currentWeek && currentWeek.range_flex[1] > 0
      ? Math.min(1, Math.max(0, actualFlex / currentWeek.range_flex[1]))
      : 0;
  const savingsProgress =
    currentWeek && currentWeek.range_save[1] > 0
      ? Math.min(1, Math.max(0, actualSaved / currentWeek.range_save[1]))
      : 0;

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

  const handleSubmitReport = async () => {
    if (currentWeek?.is_submitted || !currentWeek?.is_current) return;
    setIsSubmitting(true);
    const res = await submitWeek();
    setIsSubmitting(false);

    if (res.success) {
      showToast({
        message: 'Weekly report submitted!',
        backgroundColor: '#10B981',
      });
    } else {
      showToast({
        message: res.error || 'Failed to submit report',
        backgroundColor: '#EF4444',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0D0B14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading weekly tracker...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0D0B14] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-[#161224] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-lg">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            !
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Failed to Load Weekly Data</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => refetch()}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isEmpty || !currentWeek) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0D0B14] p-4 md:p-8">
        <div className="max-w-xl mx-auto mt-12 bg-white dark:bg-[#161224] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-5 text-3xl">
            📅
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">No Active Week Data</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            Log your parameters to derive dynamic, intelligent spending limits. Complete your profile in Master Data to get started.
          </p>
          <button
            onClick={() => navigate('/master-data?target=expenses')}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/25 transition"
          >
            Submit Parameters
          </button>
        </div>
      </div>
    );
  }

  const dateFormat = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0B14] text-slate-900 dark:text-slate-100 pb-20">
      {/* Top Header with Gradient (mirrors Flutter weekly_screen.dart) */}
      <div className="bg-gradient-to-b from-[#2E1065] via-[#1E0A45] to-slate-50 dark:to-[#0D0B14] text-white pt-8 pb-8 px-4 md:px-8 rounded-b-[32px] shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 transition text-sm flex items-center gap-1.5"
            >
              ← Dashboard
            </button>
            {/* Streak Flame Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur border border-white/20 text-xs font-bold tracking-wider">
              <span>🔥</span>
              <span>{streakCount} STREAK</span>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Weekly Tracker</h1>
            <p className="text-white/70 text-xs md:text-sm mt-1">Track spending limits & goals</p>
          </div>

          {/* Week Strip Tabs */}
          <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {weeks.map((w, idx) => {
              const isSelected = idx === currentViewWeekIndex;
              const isPast = w.is_past;

              return (
                <button
                  key={w.index}
                  onClick={() => setCurrentViewWeekIndex(idx)}
                  className={`py-2.5 px-2 rounded-xl transition flex flex-col items-center justify-center text-center ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-white/10 hover:bg-white/15 text-white/80 border border-white/10'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider text-white/70">
                    WEEK {w.index}
                  </span>
                  <span className="text-xs font-extrabold mt-0.5">
                    {w.is_current ? 'ACTIVE' : isPast ? (w.is_submitted ? '✓' : '–') : '–'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <main className="max-w-4xl mx-auto px-4 md:px-8 mt-6 space-y-6">
        {/* Concentric Rings + Stat Card */}
        <section className="bg-white dark:bg-[#161224] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-8">
          {/* Radial Concentric SVG visualization */}
          <div className="relative w-36 h-36 flex-shrink-0">
            <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
              {/* Outer Ring: Fixed limits (#6366F1) */}
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="transparent"
                stroke="#6366F1"
                strokeWidth="8"
                className="opacity-15"
              />
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="transparent"
                stroke="#6366F1"
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 48}
                strokeDashoffset={2 * Math.PI * 48 * (1 - fixedProgress)}
                strokeLinecap="round"
                className="transition-all duration-500"
              />

              {/* Middle Ring: Flexible limits (#F59E0B) */}
              <circle
                cx="60"
                cy="60"
                r="36"
                fill="transparent"
                stroke="#F59E0B"
                strokeWidth="8"
                className="opacity-15"
              />
              <circle
                cx="60"
                cy="60"
                r="36"
                fill="transparent"
                stroke="#F59E0B"
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 36}
                strokeDashoffset={2 * Math.PI * 36 * (1 - flexProgress)}
                strokeLinecap="round"
                className="transition-all duration-500"
              />

              {/* Inner Ring: Savings Goal (#10B981) */}
              <circle
                cx="60"
                cy="60"
                r="24"
                fill="transparent"
                stroke="#10B981"
                strokeWidth="8"
                className="opacity-15"
              />
              <circle
                cx="60"
                cy="60"
                r="24"
                fill="transparent"
                stroke="#10B981"
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 24}
                strokeDashoffset={2 * Math.PI * 24 * (1 - savingsProgress)}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-black">{Math.round(disciplineScore)}</span>
              <span className="text-[9px] uppercase font-bold text-slate-400">Score</span>
            </div>
          </div>

          {/* Stats Group & Legend */}
          <div className="flex-1 w-full space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="font-semibold">Fixed Limits</span>
              </div>
              <span className="font-bold text-indigo-500">{Math.round(fixedProgress * 100)}%</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="font-semibold">Flexible Limits</span>
              </div>
              <span className="font-bold text-amber-500">{Math.round(flexProgress * 100)}%</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-semibold">Savings Goal</span>
              </div>
              <span className="font-bold text-emerald-500">{Math.round(savingsProgress * 100)}%</span>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-black tracking-wider text-indigo-600 dark:text-indigo-400">
                {Math.round(disciplineScore)} DISCIPLINE SCORE
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Hit Rate: <strong className="text-slate-900 dark:text-white">{targetsHit}</strong>
              </span>
            </div>
          </div>
        </section>

        {/* Calendar Habit Heatmap Card */}
        <section className="bg-white dark:bg-[#161224] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold tracking-tight">Habit Heatmap</h2>
            <span className="text-[10px] text-slate-400">Daily updates</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {heatmapDays.map((d) => {
              let bg = 'bg-slate-100 dark:bg-[#1C1C1F] text-slate-400 dark:text-white/30';
              if (d.status === 'optimal') {
                bg = 'bg-emerald-500 text-white font-bold shadow-sm shadow-emerald-500/20';
              } else if (d.status === 'missed') {
                bg = 'bg-red-500/80 text-white font-bold';
              } else if (d.status === 'safe') {
                bg = 'bg-indigo-500 text-white font-bold';
              }

              return (
                <div
                  key={d.day}
                  className={`aspect-square rounded-lg flex items-center justify-center text-[10px] transition ${bg}`}
                  title={`Day ${d.day} (Week ${d.weekIndex}): ${d.status}`}
                >
                  {d.day}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-3 mt-4 text-[10px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-red-500/80" />
              <span>Missed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
              <span>Optimal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-indigo-500" />
              <span>Safe</span>
            </div>
          </div>
        </section>

        {/* Income Card */}
        <section className="bg-white dark:bg-[#161224] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
              this week's income
            </span>
            <div className="text-2xl font-black mt-0.5">{formatInr(weeklyIncome)}</div>
          </div>

          {weeklyIncome > 0 ? (
            <button
              onClick={() => navigate('/master-data?target=expenses')}
              className="text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition"
            >
              Update
            </button>
          ) : (
            <button
              onClick={() => navigate('/master-data?target=expenses')}
              className="text-xs px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-sm"
            >
              Setup Income
            </button>
          )}
        </section>

        {/* Targets Section (Fixed / Flexible / Savings) */}
        <section className="bg-white dark:bg-[#161224] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Week {currentWeek.index} Target Ranges
              </h2>
              <span className="text-xs text-slate-400">
                {dateFormat(currentWeek.start)} – {dateFormat(currentWeek.end)}
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-400">Achieved / Missed</span>
          </div>

          {/* 1. Fixed Expenses Row */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold">Fixed expenses</span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Limit: {formatInr(currentWeek.range_fixed[0])} – {formatInr(currentWeek.range_fixed[1])}
                </p>
              </div>

              {/* Decision Toggle Buttons */}
              <div className="flex items-center gap-2">
                <button
                  disabled={currentWeek.is_submitted}
                  onClick={() => handleDecision('fixed', 'missed')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                    fixedDecision === 'missed'
                      ? 'bg-red-500 text-white border-red-500 shadow-sm shadow-red-500/20'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  } ${currentWeek.is_submitted ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  Missed
                </button>
                <button
                  disabled={currentWeek.is_submitted}
                  onClick={() => handleOpenAchievedModal('fixed')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                    fixedDecision === 'achieved'
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  } ${currentWeek.is_submitted ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  Achieved
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  actualFixed > currentWeek.range_fixed[1] ? 'bg-red-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${Math.min(100, Math.round(fixedProgress * 100))}%` }}
              />
            </div>
            <div className="text-right text-xs font-bold text-slate-500">
              {formatInr(actualFixed)} spent
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* 2. Flexible Expenses Row */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold">Flexible expenses</span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Limit: {formatInr(currentWeek.range_flex[0])} – {formatInr(currentWeek.range_flex[1])}
                </p>
              </div>

              {/* Decision Toggle Buttons */}
              <div className="flex items-center gap-2">
                <button
                  disabled={currentWeek.is_submitted}
                  onClick={() => handleDecision('flexible', 'missed')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                    flexibleDecision === 'missed'
                      ? 'bg-red-500 text-white border-red-500 shadow-sm shadow-red-500/20'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  } ${currentWeek.is_submitted ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  Missed
                </button>
                <button
                  disabled={currentWeek.is_submitted}
                  onClick={() => handleOpenAchievedModal('flexible')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                    flexibleDecision === 'achieved'
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  } ${currentWeek.is_submitted ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  Achieved
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  actualFlex > currentWeek.range_flex[1] ? 'bg-red-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, Math.round(flexProgress * 100))}%` }}
              />
            </div>
            <div className="text-right text-xs font-bold text-slate-500">
              {formatInr(actualFlex)} spent
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* 3. Savings Goal Row */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold">Savings Goal</span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Target: {formatInr(currentWeek.range_save[0])} – {formatInr(currentWeek.range_save[1])}
                </p>
              </div>

              {/* Decision Toggle Buttons */}
              <div className="flex items-center gap-2">
                <button
                  disabled={currentWeek.is_submitted}
                  onClick={() => handleDecision('savings', 'missed')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                    savingsDecision === 'missed'
                      ? 'bg-red-500 text-white border-red-500 shadow-sm shadow-red-500/20'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  } ${currentWeek.is_submitted ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  Missed
                </button>
                <button
                  disabled={currentWeek.is_submitted}
                  onClick={() => handleOpenAchievedModal('savings')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                    savingsDecision === 'achieved'
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  } ${currentWeek.is_submitted ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  Achieved
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${Math.min(100, Math.round(savingsProgress * 100))}%` }}
              />
            </div>
            <div className="text-right text-xs font-bold text-slate-500">
              {formatInr(actualSaved)} saved
            </div>
          </div>
        </section>

        {/* Fin Observation Card */}
        <section className="bg-indigo-50/50 dark:bg-[#161224] p-5 rounded-2xl border border-indigo-100 dark:border-indigo-950 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-lg flex items-center justify-center flex-shrink-0">
            🦉
          </div>
          <div>
            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">Fin Says 🦉</span>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              {getFinMessage(disciplineScore, savingsDecision !== 'missed')}
            </p>
          </div>
        </section>

        {/* Submit Weekly Report Button */}
        <button
          disabled={currentWeek.is_submitted || !currentWeek.is_current || isSubmitting}
          onClick={handleSubmitReport}
          className={`w-full py-4 px-6 rounded-2xl font-bold text-sm transition shadow-lg ${
            currentWeek.is_submitted
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30 active:scale-[0.99]'
          }`}
        >
          {isSubmitting
            ? 'Submitting Report...'
            : currentWeek.is_submitted
            ? 'SUBMITTED'
            : 'SUBMIT WEEKLY REPORT'}
        </button>
      </main>

      {/* Exact Amount Modal for Achieved Decision */}
      {modalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-[#161224] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold capitalize">
              Log {modalTarget} Expenses
            </h3>
            <p className="text-xs text-slate-500">
              Enter the exact amount spent or saved this week:
            </p>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                ₹
              </span>
              <input
                type="number"
                autoFocus
                placeholder="0"
                value={modalAmount}
                onChange={(e) => setModalAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0D0B14] font-semibold text-sm outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setModalTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAmount}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm"
              >
                Confirm & Calculate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
