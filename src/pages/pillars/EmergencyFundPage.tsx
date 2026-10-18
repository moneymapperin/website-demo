import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import {
  calculateEmergencyFundPillar,
  formatEmergencyCompact,
  getOrInitEfBaseline,
  saveEfBaseline,
  calculateFundChangePct,
  EmergencyFundPillarData,
} from '../../models/pillars/emergency';
import {
  Edit3,
  Sparkles,
} from 'lucide-react';

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <div className="text-[11px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider pl-1 mb-2">
    {label}
  </div>
);

export const EmergencyFundPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EmergencyFundPillarData | null>(null);

  // Persistent baseline for growth badge calculation
  const [baseline, setBaseline] = useState<number>(0);

  // Add savings form & confirm dialog state
  const [savingsInput, setSavingsInput] = useState('');
  const [confirmAmount, setConfirmAmount] = useState<number | null>(null);
  const [isSubmittingSavings, setIsSubmittingSavings] = useState(false);

  // Quick edit modal state for Estimated Fund
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
  const [quickEditVal, setQuickEditVal] = useState('');
  const [isUpdatingQuickEdit, setIsUpdatingQuickEdit] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashboard, profileRes] = await Promise.all([
        apiService.getDashboard().catch(() => ({})),
        apiService.getMasterProfile().catch(() => ({ data: null })),
      ]);

      const calculated = calculateEmergencyFundPillar(profileRes?.data, dashboard);
      setData(calculated);

      const userId = authService.currentUserId;
      const initialBaseline = getOrInitEfBaseline(calculated.efCurrent, userId);
      setBaseline(initialBaseline);
    } catch (err) {
      console.error('Error loading emergency fund data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSavingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(savingsInput);
    if (isNaN(amt) || amt <= 0) {
      showToast('Enter a valid amount.');
      return;
    }
    setConfirmAmount(amt);
  };

  const handleConfirmAddSavings = async () => {
    if (!confirmAmount || confirmAmount <= 0) return;

    try {
      setIsSubmittingSavings(true);
      setLoading(true);

      await apiService.addEmergencySavings(confirmAmount);
      setSavingsInput('');
      setConfirmAmount(null);

      // Wait 3 seconds for backend DB triggers to complete (public -> stg -> core)
      await new Promise((resolve) => setTimeout(resolve, 3000));

      await loadData();
      showToast('Cloud sync complete! Savings updated.');
    } catch (err: any) {
      showToast(`Update failed: ${err?.message || 'Error'}`);
    } finally {
      setIsSubmittingSavings(false);
      setLoading(false);
    }
  };

  const handleQuickEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(quickEditVal);
    if (isNaN(val) || val < 0) {
      showToast('Enter a valid amount.');
      return;
    }

    try {
      setIsUpdatingQuickEdit(true);
      const currentVal = data?.efCurrent ?? 0;

      // Right before saving, set baseline = current fund (the value before the edit) in localStorage
      const userId = authService.currentUserId;
      saveEfBaseline(currentVal, userId);
      setBaseline(currentVal);

      await apiService.updateMasterProfile({
        emergencyFundCurrent: val.toFixed(0),
      });

      // Wait 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setIsQuickEditOpen(false);
      await loadData();
      showToast('Estimated Fund updated successfully!');
    } catch (err: any) {
      showToast(`Error: ${err?.message || 'Failed to update'}`);
    } finally {
      setIsUpdatingQuickEdit(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const p = data ?? calculateEmergencyFundPillar(null, null);

  // Persistent growth badge percentage
  const pct = calculateFundChangePct(p.efCurrent, baseline);
  const isPos = pct >= 0;

  // Progress for Fund Completion
  const progressPct = p.efTarget > 0 ? (p.efCurrent / p.efTarget) * 100 : 0;
  const shortfallGap = Math.max(0, p.efTarget - p.efCurrent);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <h1 data-testid="emergency-page-title" className="sr-only">
        Savings Analysis
      </h1>

      {/* 1. Score Header */}
      <div
        data-testid="emergency-score-header"
        className="p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between"
      >
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            EMERGENCY SAVINGS SCORE
          </div>
          <div className="text-5xl sm:text-6xl font-black text-indigo-600 dark:text-indigo-400 mt-1 leading-none">
            {Math.round(p.savingsScore)}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-11 h-11 rounded-full border-[3px] border-emerald-500/40 flex items-center justify-center text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {Math.round(p.readinessScore)}
          </div>
          <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 mt-1">
            Readiness
          </span>
        </div>
      </div>

      {/* 2. Emergency Reserves */}
      <div>
        <SectionLabel label="EMERGENCY RESERVES" />
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-4 transition-colors">
          {/* Current Estimated Fund Row */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              Current Estimated Fund
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {formatEmergencyCompact(p.efCurrent)}
              </span>

              {/* Growth Badge: ALWAYS visible */}
              <span
                data-testid="growth-badge"
                className={`px-2 py-0.5 rounded-lg text-xs font-black border ${
                  isPos
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
                }`}
              >
                {isPos ? `▲ +${Math.abs(pct).toFixed(1)}%` : `▼ -${Math.abs(pct).toFixed(1)}%`}
              </span>

              <button
                type="button"
                data-testid="edit-estimated-fund-btn"
                onClick={() => {
                  setQuickEditVal(p.efCurrent.toString());
                  setIsQuickEditOpen(true);
                }}
                className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-white hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 transition-colors"
                title="Edit Current Fund"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-zinc-800" />

          {/* Target Goal Row */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
              <div>
                <div className="font-bold text-slate-900 dark:text-white">Target Goal</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">Safe Cushion</div>
              </div>
            </div>
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {formatEmergencyCompact(p.efTarget)}
            </span>
          </div>

          {/* Parked In Row */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
              <div>
                <div className="font-bold text-slate-900 dark:text-white">Parked In</div>
                <div
                  data-testid="yield-tag"
                  className="inline-block mt-1 px-2 py-0.5 rounded-md bg-sky-500/10 dark:bg-sky-500/15 border border-sky-500/30 text-sky-600 dark:text-sky-400 text-[10px] font-black"
                >
                  ⚡ {p.yieldTag}
                </div>
              </div>
            </div>
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {p.parkedLocation}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Readiness Health / Fund Completion */}
      <div>
        <SectionLabel label="READINESS HEALTH" />
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-4 transition-colors">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Fund Completion</h2>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-900 dark:text-white">Target Fulfillment</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">
                {progressPct.toFixed(1)}%
              </span>
            </div>

            <div className="h-2.5 w-full bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 shadow-sm shadow-indigo-500/50"
                style={{ width: `${Math.min(100, Math.max(1, progressPct))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Strategy & Tips / Shortfall Card */}
      <div>
        <SectionLabel label="STRATEGY & TIPS" />
        <div
          data-testid="shortfall-card"
          className="p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-4 transition-colors"
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
              Shortfall to Target
            </span>
            <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
              {formatEmergencyCompact(shortfallGap)}
            </span>
          </div>

          <p className="text-xs italic text-slate-600 dark:text-zinc-400 leading-relaxed">
            {shortfallGap > 0
              ? 'Your emergency fund is below target. Move your surplus to a Liquid Fund for safety.'
              : 'Excellent! Your emergency fund is fully funded.'}
          </p>
        </div>
      </div>

      {/* 5. Optimize Now Button */}
      <button
        type="button"
        data-testid="emergency-optimize-btn"
        onClick={() => navigate('/master-data?target=emergency')}
        className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        <span>Optimize Now</span>
      </button>

      {/* 6. Update Savings Balance */}
      <div>
        <SectionLabel label="UPDATE SAVINGS BALANCE" />
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-4 transition-colors">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Add to Emergency Fund</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Enter the amount you saved up this month.
            </p>
          </div>

          <form onSubmit={handleAddSavingsSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 block mb-1">
                Savings Amount
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-400 text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  data-testid="savings-amount-input"
                  value={savingsInput}
                  onChange={(e) => setSavingsInput(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-indigo-500/30 bg-slate-50 dark:bg-[#14102B] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Savings Amount"
                />
              </div>
            </div>

            <button
              type="submit"
              data-testid="update-fund-btn"
              disabled={isSubmittingSavings}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {isSubmittingSavings ? 'Processing...' : 'Update Fund Balance'}
            </button>
          </form>
        </div>
      </div>

      {/* Quick Edit Modal */}
      {isQuickEditOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E0B1F] border border-slate-200 dark:border-indigo-500/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Update Estimated Fund
            </h3>
            <form onSubmit={handleQuickEditSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 block mb-1">
                  New Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-400 text-sm">₹</span>
                  <input
                    type="number"
                    value={quickEditVal}
                    onChange={(e) => setQuickEditVal(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-indigo-500/30 bg-slate-50 dark:bg-[#14102B] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="Enter amount"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickEditOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingQuickEdit}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30"
                >
                  {isUpdatingQuickEdit ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Savings Confirmation Modal */}
      {confirmAmount && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E0B1F] border border-slate-200 dark:border-indigo-500/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Confirm Update</h3>
            <p className="text-xs text-slate-600 dark:text-zinc-300">
              Add ₹{confirmAmount} to your emergency fund?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmAmount(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="confirm-savings-update-btn"
                disabled={isSubmittingSavings}
                onClick={handleConfirmAddSavings}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30"
              >
                {isSubmittingSavings ? 'Processing...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
