import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeeklyTracker } from '../../hooks/useWeeklyTracker';
import { useToast } from '../../context/ToastContext';
import { getFinMessage } from '../../models/weekly';

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
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isEmpty || !currentWeek) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-400">Missing Data.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* App Bar / Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 data-testid="weekly-page-title" className="text-2xl font-black tracking-tight text-[var(--color-text)]">
            Weekly Tracker
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Expense discipline scoring and weekly target ranges
          </p>
        </div>
      </div>

      {/* Score Header */}
      <div
        data-testid="weekly-score-header"
        className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between"
      >
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
            EXPENSE DISCIPLINE SCORE
          </span>
          <div className="text-4xl font-black text-emerald-500 mt-1">
            {disciplineScore.toFixed(0)}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-2 border-emerald-500/40 flex items-center justify-center font-black text-emerald-500 text-sm">
              {targetsHit}
            </div>
            <span className="text-[10px] font-bold text-gray-400 mt-1">Target Rate</span>
          </div>
        </div>
      </div>

      {/* Week Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {weeks.map((w, idx) => {
          const isSelected = idx === currentViewWeekIndex;
          return (
            <button
              key={w.index}
              type="button"
              data-testid={`week-tab-${w.index}`}
              onClick={() => setCurrentViewWeekIndex(idx)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              Week {w.index}
              {w.is_submitted && ' ✓'}
            </button>
          );
        })}
      </div>

      {/* Previous Week Mini Overview */}
      {prevWeek && currentWeek.is_current && !currentWeek.is_submitted && (
        <div
          data-testid="prev-week-mini"
          className="p-4 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-between text-xs"
        >
          <span className="text-gray-400">Previous Week ({prevWeek.index})</span>
          <span
            className={`font-black uppercase ${
              prevWeek.status === 'achieved' ? 'text-emerald-500' : 'text-rose-500'
            }`}
          >
            {prevWeek.status === 'achieved' ? 'Target Achieved' : 'Missed'}
          </span>
        </div>
      )}

      {/* Target Ranges Section */}
      <div className="p-6 rounded-3xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text)]">
            Week {currentWeek.index} Target Ranges
          </h2>
          <p className="text-xs text-gray-400">
            {formatDate(currentWeek.start)} - {formatDate(currentWeek.end)}
          </p>
        </div>

        {/* Fixed Expenses Decision Card */}
        <div data-testid="decision-card-fixed" className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[var(--color-text)]">Fixed Expenses</span>
            <span className="text-gray-400">
              Target: {formatInr(currentWeek.range_fixed[0])} - {formatInr(currentWeek.range_fixed[1])}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              data-testid="fixed-achieved-btn"
              onClick={() => handleOpenAchievedModal('fixed')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                fixedDecision === 'achieved'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-[var(--color-bg)] border border-[var(--color-border)] text-gray-400 hover:text-emerald-500'
              }`}
            >
              {fixedDecision === 'achieved' ? `Achieved (${formatInr(actualFixed)})` : 'Achieved'}
            </button>
            <button
              type="button"
              data-testid="fixed-missed-btn"
              onClick={() => handleMarkMissed('fixed')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                fixedDecision === 'missed'
                  ? 'bg-rose-600 text-white shadow'
                  : 'bg-[var(--color-bg)] border border-[var(--color-border)] text-gray-400 hover:text-rose-500'
              }`}
            >
              Missed
            </button>
          </div>
        </div>

        <div className="border-t border-[var(--color-border)]/50" />

        {/* Flexible Expenses Decision Card */}
        <div data-testid="decision-card-flexible" className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[var(--color-text)]">Flexible Expenses</span>
            <span className="text-gray-400">
              Target: {formatInr(currentWeek.range_flex[0])} - {formatInr(currentWeek.range_flex[1])}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              data-testid="flexible-achieved-btn"
              onClick={() => handleOpenAchievedModal('flexible')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                flexibleDecision === 'achieved'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-[var(--color-bg)] border border-[var(--color-border)] text-gray-400 hover:text-emerald-500'
              }`}
            >
              {flexibleDecision === 'achieved' ? `Achieved (${formatInr(actualFlex)})` : 'Achieved'}
            </button>
            <button
              type="button"
              data-testid="flexible-missed-btn"
              onClick={() => handleMarkMissed('flexible')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                flexibleDecision === 'missed'
                  ? 'bg-rose-600 text-white shadow'
                  : 'bg-[var(--color-bg)] border border-[var(--color-border)] text-gray-400 hover:text-rose-500'
              }`}
            >
              Missed
            </button>
          </div>
        </div>

        <div className="border-t border-[var(--color-border)]/50" />

        {/* Savings Goal Decision Card */}
        <div data-testid="decision-card-savings" className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[var(--color-text)]">Savings Goal</span>
            <span className="text-gray-400">
              Target: {formatInr(currentWeek.range_save[0])} - {formatInr(currentWeek.range_save[1])}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              data-testid="savings-achieved-btn"
              onClick={() => handleOpenAchievedModal('savings')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                savingsDecision === 'achieved'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-[var(--color-bg)] border border-[var(--color-border)] text-gray-400 hover:text-emerald-500'
              }`}
            >
              {savingsDecision === 'achieved' ? `Achieved (${formatInr(actualSaved)})` : 'Achieved'}
            </button>
            <button
              type="button"
              data-testid="savings-missed-btn"
              onClick={() => handleMarkMissed('savings')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                savingsDecision === 'missed'
                  ? 'bg-rose-600 text-white shadow'
                  : 'bg-[var(--color-bg)] border border-[var(--color-border)] text-gray-400 hover:text-rose-500'
              }`}
            >
              Missed
            </button>
          </div>
        </div>

        {/* Submit Full Week Button */}
        <button
          type="button"
          data-testid="submit-week-btn"
          disabled={isSubmitting || currentWeek.is_submitted}
          onClick={handleSubmitReport}
          className={`w-full py-4 rounded-2xl font-bold text-sm transition-all ${
            currentWeek.is_submitted
              ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg active:scale-98'
          }`}
        >
          {currentWeek.is_submitted ? 'SUBMITTED' : isSubmitting ? 'Submitting...' : 'SUBMIT WEEKLY REPORT'}
        </button>
      </div>

      {/* Observation Card */}
      <div
        data-testid="weekly-observation-card"
        className="p-6 rounded-3xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm space-y-2"
      >
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
          OBSERVATION
        </span>
        <p className="text-xs text-[var(--color-text)] leading-relaxed">
          {getFinMessage(disciplineScore, savingsDecision === 'achieved')}
        </p>
      </div>

      {/* Optimize Button */}
      <button
        type="button"
        data-testid="weekly-optimize-btn"
        onClick={() => navigate('/master-data?target=expenses')}
        className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg hover:shadow-emerald-500/25 transition-all active:scale-98 flex items-center justify-center gap-2"
      >
        <span>⚡</span> Optimize Now
      </button>

      {/* Log Exact Amount Modal */}
      {modalTarget && (
        <div data-testid="log-amount-modal" className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[var(--color-text)]">
              Log {modalTarget === 'fixed' ? 'Fixed Expenses' : modalTarget === 'flexible' ? 'Flexible Expenses' : 'Savings'}
            </h3>
            <p className="text-xs text-gray-400">
              Enter the exact amount for this week:
            </p>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
              <input
                type="number"
                data-testid="modal-amount-input"
                value={modalAmount}
                onChange={(e) => setModalAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:border-emerald-500"
                placeholder="Enter amount"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalTarget(null)}
                className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-[var(--color-text)]"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="modal-confirm-btn"
                onClick={handleConfirmAmount}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
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
