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
  ShieldPlus,
  Wallet,
} from 'lucide-react';

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 pl-1 mb-2">
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
    <div className="w-full px-8 lg:px-10 py-6 space-y-6">
      <h1 data-testid="emergency-page-title" className="sr-only">
        Savings Analysis
      </h1>

      {/* 1. HERO EMERGENCY SAVINGS SCORE Card */}
      <div
        data-testid="emergency-score-header"
        className="relative overflow-hidden p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#0B0D1B] border border-slate-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
      >
        {/* Subtle Ambient Glow on the Right */}
        <div className="hidden dark:block absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-emerald-900/20 via-purple-900/10 to-transparent pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <ShieldPlus className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              EMERGENCY SAVINGS SCORE
            </div>
            <div className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white mt-0.5 leading-none tracking-tight">
              {Math.round(p.savingsScore)}
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-medium">
              {p.savingsScore >= 70
                ? 'Your emergency readiness is strong'
                : 'Build a 6-month safety cushion for stability'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 relative z-10 self-end sm:self-center">
          {/* Readiness Ring */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full border-2 border-[#059669] dark:border-[#10B981] flex items-center justify-center text-base font-black text-slate-900 dark:text-white bg-emerald-50 dark:bg-emerald-950/30 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
              {Math.round(p.readinessScore)}
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mt-1.5">
              Readiness
            </span>
          </div>
        </div>
      </div>

      {/* 2. EMERGENCY RESERVES Card */}
      <div>
        <SectionLabel label="EMERGENCY RESERVES" />
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0B0D1B] border border-slate-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-xl space-y-5">
          {/* Current Estimated Fund Row */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Current Estimated Fund</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Total liquid cushion readily accessible</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-2xl sm:text-3xl font-black text-[#059669] dark:text-[#10B981] tracking-tight">
                {formatEmergencyCompact(p.efCurrent)}
              </span>

              {/* Growth Badge: ALWAYS visible */}
              <span
                data-testid="growth-badge"
                className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${
                  isPos
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/25 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/25 dark:border-rose-500/30 text-rose-600 dark:text-rose-400'
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
                className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-white transition-all cursor-pointer"
                title="Edit Current Fund"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-white/[0.06]" />

          {/* Target Goal Row */}
          <div className="flex items-center justify-between gap-4 pl-1">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#6366F1] shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">Target Goal</div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Safe Cushion</div>
              </div>
            </div>
            <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {formatEmergencyCompact(p.efTarget)}
            </span>
          </div>

          {/* Parked In Row */}
          <div className="flex items-center justify-between gap-4 pl-1">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0284C7] dark:bg-[#38BDF8] shrink-0 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">Parked In</div>
                <div
                  data-testid="yield-tag"
                  className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-blue-500/15 border border-sky-200 dark:border-blue-500/30 text-sky-600 dark:text-blue-400 text-[11px] font-bold"
                >
                  ⚡ {p.yieldTag}
                </div>
              </div>
            </div>
            <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {p.parkedLocation}
            </span>
          </div>
        </div>
      </div>

      {/* 3. READINESS HEALTH Card */}
      <div>
        <SectionLabel label="READINESS HEALTH" />
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0B0D1B] border border-slate-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Fund Completion</h2>
            <span className="text-xs font-bold text-[#059669] dark:text-emerald-400">
              {progressPct.toFixed(1)}%
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-500 dark:text-zinc-400 font-medium">
              <span>Target Fulfillment</span>
            </div>

            <div className="h-3 w-full bg-slate-100 dark:bg-[#121528] border border-slate-200/60 dark:border-white/[0.06] rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-[#4F46E5] to-[#A855F7] rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                style={{ width: `${Math.min(100, Math.max(1, progressPct))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. STRATEGY & TIPS Card */}
      <div>
        <SectionLabel label="STRATEGY & TIPS" />
        <div
          data-testid="shortfall-card"
          className="p-6 rounded-2xl bg-white dark:bg-[#0B0D1B] border border-slate-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-xl space-y-3"
        >
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-[#E11D48] dark:text-[#F43F5E]">
              Shortfall to Target
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#E11D48] dark:text-[#F43F5E] tracking-tight">
              {formatEmergencyCompact(shortfallGap)}
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-medium">
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
        className="w-full py-4 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#4338CA] hover:from-[#4338CA] hover:to-[#3730A3] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
      >
        <Sparkles className="w-4 h-4" />
        <span>OPTIMIZE NOW</span>
      </button>

      {/* 6. UPDATE SAVINGS BALANCE Card */}
      <div>
        <SectionLabel label="UPDATE SAVINGS BALANCE" />
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0B0D1B] border border-slate-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-xl space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Add to Emergency Fund</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Enter the amount you saved up this month.
            </p>
          </div>

          <form onSubmit={handleAddSavingsSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                Savings Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-400 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  data-testid="savings-amount-input"
                  value={savingsInput}
                  onChange={(e) => setSavingsInput(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121528] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#4F46E5] transition-colors placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                  placeholder="Savings Amount"
                />
              </div>
            </div>

            <button
              type="submit"
              data-testid="update-fund-btn"
              disabled={isSubmittingSavings}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#4338CA] hover:from-[#4338CA] hover:to-[#3730A3] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingSavings ? 'Processing...' : 'UPDATE FUND BALANCE'}
            </button>
          </form>
        </div>
      </div>

      {/* Quick Edit Modal */}
      {isQuickEditOpen && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#0B0D1B] border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Update Estimated Fund
            </h3>
            <form onSubmit={handleQuickEditSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                  New Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    value={quickEditVal}
                    onChange={(e) => setQuickEditVal(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121528] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#4F46E5] placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                    placeholder="Enter amount"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickEditOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingQuickEdit}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 cursor-pointer"
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
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#0B0D1B] border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Confirm Update</h3>
            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
              Add ₹{confirmAmount} to your emergency fund?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmAmount(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="confirm-savings-update-btn"
                disabled={isSubmittingSavings}
                onClick={handleConfirmAddSavings}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 cursor-pointer"
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
