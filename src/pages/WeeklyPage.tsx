import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeeklyTracker } from '../hooks/useWeeklyTracker';
import { useToast } from '../context/ToastContext';
import { getFinMessage } from '../models/weekly';
import {
  Flame,
  ArrowLeft,
  TrendingUp,
  Info,
  ChevronRight,
  Home,
  ShoppingCart,
  PiggyBank,
  Send,
  ChevronDown,
} from 'lucide-react';

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
      <div className="min-h-screen bg-[#0D0B14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-zinc-400">Loading weekly tracker...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0D0B14] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#161224] p-6 rounded-3xl border border-zinc-800 text-center shadow-lg">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            !
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Failed to Load Weekly Data</h2>
          <p className="text-sm text-zinc-400 mb-6">{error}</p>
          <button
            onClick={() => refetch()}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isEmpty || !currentWeek) {
    return (
      <div className="min-h-screen bg-[#0D0B14] p-4 md:p-8">
        <div className="max-w-xl mx-auto mt-12 bg-[#161224] border border-zinc-800 rounded-3xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-5 text-3xl">
            📅
          </div>
          <h1 className="text-2xl font-black text-white mb-2">No Active Week Data</h1>
          <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
            Log your parameters to derive dynamic, intelligent spending limits. Complete your profile in Master Data to get started.
          </p>
          <button
            onClick={() => navigate('/master-data?target=expenses')}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-indigo-500/25 transition"
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
    <div className="min-h-screen bg-[#09090B] text-zinc-100 pb-20">
      {/* 1. Top Header Banner Card matching Image 4 */}
      <div className="bg-gradient-to-r from-[#210B45] via-[#1A093D] to-[#120529] text-white pt-6 pb-8 px-4 md:px-8 rounded-b-[32px] border-b border-indigo-500/20 shadow-xl">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition flex items-center gap-1.5 w-fit"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
              </button>

              <div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
                  Weekly Tracker
                </h1>
                <p className="text-white/70 text-xs md:text-sm mt-1">
                  Track spending limits & achieve your financial goals
                </p>
              </div>
            </div>

            {/* Right Card: Current Week & Streak Graphic matching Image 4 */}
            <div className="p-4 px-6 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md flex items-center justify-between gap-6 min-w-[280px] shadow-lg">
              <div className="space-y-1">
                <div className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">
                  Current Week
                </div>
                <div className="text-base font-black text-white">
                  {dateFormat(currentWeek.start)} – {dateFormat(currentWeek.end)}
                </div>
                <div className="text-[11px] text-white/70 font-medium max-w-[180px]">
                  Stay consistent. Every small step builds long-term wealth.
                </div>
              </div>

              {/* Streak Badge + Chart Graphic */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-black">
                  <Flame className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{`${streakCount} STREAK`}</span>
                </div>

                {/* Rising Bar Chart Visual */}
                <div className="flex items-end gap-1 h-10 pt-2">
                  <div className="w-2.5 h-4 rounded-sm bg-purple-500/40" />
                  <div className="w-2.5 h-6 rounded-sm bg-purple-500/60" />
                  <div className="w-2.5 h-8 rounded-sm bg-purple-500/80" />
                  <div className="w-2.5 h-10 rounded-sm bg-indigo-400 flex items-center justify-center text-white">
                    <TrendingUp className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Week Tabs Strip matching Image 4 */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
            {weeks.map((w, idx) => {
              const isSelected = idx === currentViewWeekIndex;

              return (
                <button
                  key={w.index}
                  type="button"
                  onClick={() => setCurrentViewWeekIndex(idx)}
                  className={`py-2.5 px-3 rounded-xl transition-all flex flex-col items-center justify-center text-center cursor-pointer border ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/40 scale-[1.02]'
                      : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider text-white/70">
                    WEEK {w.index}
                  </span>
                  <span className="text-xs font-extrabold mt-0.5">
                    {dateFormat(w.start)} – {dateFormat(w.end)}
                  </span>
                  {isSelected && (
                    <span className="mt-1 px-2 py-0.2 rounded-full bg-white/20 text-[9px] font-black tracking-wide uppercase">
                      ACTIVE
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Main Body Grid Section matching Image 4 */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Discipline Score Card Left matching Image 4 */}
          <section className="lg:col-span-7 bg-[#14121F] p-6 rounded-3xl border border-zinc-800 shadow-sm flex flex-col justify-between space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <span>📊</span> Discipline Score <Info className="w-3.5 h-3.5 text-zinc-500" />
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">Your weekly financial discipline</p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-zinc-800 border border-zinc-700 text-xs font-black text-white">
                Hit Rate: {targetsHit}/5
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8">
              {/* Radial Concentric Ring Gauge matching Image 4 */}
              <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
                  {/* Fixed Limits Ring (Purple #818CF8) */}
                  <circle cx="60" cy="60" r="48" fill="transparent" stroke="#818CF8" strokeWidth="8" className="opacity-20" />
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    fill="transparent"
                    stroke="#818CF8"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 48}
                    strokeDashoffset={2 * Math.PI * 48 * (1 - fixedProgress)}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />

                  {/* Flexible Limits Ring (Yellow #F59E0B) */}
                  <circle cx="60" cy="60" r="36" fill="transparent" stroke="#F59E0B" strokeWidth="8" className="opacity-20" />
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

                  {/* Savings Goal Ring (Green #10B981) */}
                  <circle cx="60" cy="60" r="24" fill="transparent" stroke="#10B981" strokeWidth="8" className="opacity-20" />
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
                  <span className="text-3xl font-black text-white">{Math.round(disciplineScore)}</span>
                  <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">SCORE</span>
                </div>
              </div>

              {/* Legend matching Image 4 */}
              <div className="flex-1 w-full space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                    <span className="font-bold text-zinc-300">Fixed Limits</span>
                  </div>
                  <span className="font-black text-indigo-400">{Math.round(fixedProgress * 100)}%</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="font-bold text-zinc-300">Flexible Limits</span>
                  </div>
                  <span className="font-black text-amber-400">{Math.round(flexProgress * 100)}%</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="font-bold text-zinc-300">Savings Goal</span>
                  </div>
                  <span className="font-black text-emerald-400">{Math.round(savingsProgress * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Bottom Target Streak Badge matching Image 4 */}
            <div className="p-3 px-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center gap-2 text-xs font-bold text-zinc-300 text-center">
              <span>🎯</span>
              <span>Hit at least 5 targets this week to maintain your streak!</span>
            </div>
          </section>

          {/* Right Column: Income, Fin Tip & Submit Button matching Image 4 */}
          <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
            {/* Income Card */}
            <section className="bg-[#14121F] p-5 rounded-3xl border border-zinc-800 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
                  ₹
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                    this week's income
                  </span>
                  <div className="text-2xl font-black text-white mt-0.5">{formatInr(weeklyIncome || 25000)}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/master-data?target=expenses')}
                className="text-xs px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-white font-bold transition cursor-pointer"
              >
                Update
              </button>
            </section>

            {/* Fin Tip Card matching Image 4 */}
            <section className="bg-amber-500/10 p-5 rounded-3xl border border-amber-500/20 flex items-start gap-3.5 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 text-lg flex items-center justify-center shrink-0">
                💡
              </div>
              <div>
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider">Fin Says 🦉</span>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed font-medium">
                  {getFinMessage(disciplineScore, savingsDecision !== 'missed')}
                </p>
              </div>
            </section>

            {/* Submit Weekly Report Button matching Image 4 */}
            <button
              type="button"
              disabled={currentWeek.is_submitted || !currentWeek.is_current || isSubmitting}
              onClick={handleSubmitReport}
              className={`w-full py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 ${
                currentWeek.is_submitted
                  ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white hover:opacity-95 shadow-indigo-600/30 active:scale-[0.99] cursor-pointer'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Submitting Report...'
                  : currentWeek.is_submitted
                  ? 'SUBMITTED'
                  : 'Submit Weekly Report →'}
              </span>
            </button>
          </div>
        </div>

        {/* 3. Target Ranges Section matching Image 4 */}
        <section className="bg-[#14121F] p-6 rounded-3xl border border-zinc-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                🎯
              </div>
              <div>
                <h2 className="text-base font-black text-white">
                  Week {currentWeek.index} Target Ranges
                </h2>
                <span className="text-xs text-zinc-400">
                  {dateFormat(currentWeek.start)} – {dateFormat(currentWeek.end)}
                </span>
              </div>
            </div>

            <span className="text-xs font-bold px-3 py-1 rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1">
              3/3 Targets <ChevronDown className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* 1. Fixed Expenses Row */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Fixed expenses</div>
                  <p className="text-xs text-zinc-400">
                    Limit: {formatInr(currentWeek.range_fixed[0] || 10750)} – {formatInr(currentWeek.range_fixed[1] || 11750)}
                  </p>
                </div>
              </div>

              {/* Decision Toggle Buttons */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-400 mr-2">{formatInr(actualFixed)} spent</span>
                <button
                  type="button"
                  disabled={currentWeek.is_submitted}
                  onClick={() => handleDecision('fixed', 'missed')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    fixedDecision === 'missed'
                      ? 'bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/20'
                      : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  Missed
                </button>
                <button
                  type="button"
                  disabled={currentWeek.is_submitted}
                  onClick={() => handleOpenAchievedModal('fixed')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    fixedDecision === 'achieved'
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/20'
                      : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  Achieved
                </button>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  actualFixed > currentWeek.range_fixed[1] ? 'bg-rose-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${Math.min(100, Math.round(fixedProgress * 100))}%` }}
              />
            </div>
          </div>

          {/* 2. Flexible Expenses Row */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Flexible expenses</div>
                  <p className="text-xs text-zinc-400">
                    Limit: {formatInr(currentWeek.range_flex[0] || 8250)} – {formatInr(currentWeek.range_flex[1] || 9250)}
                  </p>
                </div>
              </div>

              {/* Decision Toggle Buttons */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-400 mr-2">{formatInr(actualFlex)} spent</span>
                <button
                  type="button"
                  disabled={currentWeek.is_submitted}
                  onClick={() => handleDecision('flexible', 'missed')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    flexibleDecision === 'missed'
                      ? 'bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/20'
                      : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  Missed
                </button>
                <button
                  type="button"
                  disabled={currentWeek.is_submitted}
                  onClick={() => handleOpenAchievedModal('flexible')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    flexibleDecision === 'achieved'
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/20'
                      : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  Achieved
                </button>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  actualFlex > currentWeek.range_flex[1] ? 'bg-rose-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, Math.round(flexProgress * 100))}%` }}
              />
            </div>
          </div>

          {/* 3. Savings Goal Row */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <PiggyBank className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Savings Goal</div>
                  <p className="text-xs text-zinc-400">
                    Target: {formatInr(currentWeek.range_save[0] || 5750)} – {formatInr(currentWeek.range_save[1] || 6750)}
                  </p>
                </div>
              </div>

              {/* Decision Toggle Buttons */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-400 mr-2">{formatInr(actualSaved)} saved</span>
                <button
                  type="button"
                  disabled={currentWeek.is_submitted}
                  onClick={() => handleDecision('savings', 'missed')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    savingsDecision === 'missed'
                      ? 'bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/20'
                      : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  Missed
                </button>
                <button
                  type="button"
                  disabled={currentWeek.is_submitted}
                  onClick={() => handleOpenAchievedModal('savings')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    savingsDecision === 'achieved'
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/20'
                      : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  Achieved
                </button>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round(savingsProgress * 100))}%` }}
              />
            </div>
          </div>
        </section>
      </main>

      {/* Log Exact Amount Modal */}
      {modalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#161224] rounded-3xl p-6 border border-zinc-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold capitalize text-white">
              Log {modalTarget} Expenses
            </h3>
            <p className="text-xs text-zinc-400">
              Enter the exact amount spent or saved this week:
            </p>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">
                ₹
              </span>
              <input
                type="number"
                autoFocus
                placeholder="0"
                value={modalAmount}
                onChange={(e) => setModalAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-zinc-700 bg-[#0D0B14] text-white font-semibold text-sm outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAmount}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm"
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
