import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { useToast } from '../../context/ToastContext';
import {
  calculateEmergencyFundPillar,
  formatEmergencyCompact,
  calculateSessionGrowthPct,
  EmergencyFundPillarData,
} from '../../models/pillars/emergency';

export const EmergencyFundPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EmergencyFundPillarData | null>(null);

  // In-session baseline for growth badge calculation (null until user updates savings in this session)
  const [sessionPrevFund, setSessionPrevFund] = useState<number | null>(null);

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
      const currentVal = data?.efCurrent ?? 0;
      setSessionPrevFund(currentVal);

      await apiService.addEmergencySavings(confirmAmount);
      showToast('Cloud sync complete! Savings updated.');
      setSavingsInput('');
      setConfirmAmount(null);
      await loadData();
    } catch (err: any) {
      showToast(`Update failed: ${err?.message || 'Error'}`);
    } finally {
      setIsSubmittingSavings(false);
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
      setSessionPrevFund(currentVal);

      await apiService.updateMasterProfile({
        emergencyFundCurrent: val.toFixed(0),
      });
      showToast('Estimated Fund updated successfully!');
      setIsQuickEditOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(`Error updating: ${err?.message || 'Failed to update'}`);
    } finally {
      setIsUpdatingQuickEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const p = data ?? calculateEmergencyFundPillar(null, null);

  // In-session growth percentage
  const growthPct = sessionPrevFund !== null ? calculateSessionGrowthPct(p.efCurrent, sessionPrevFund) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* App Bar / Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 data-testid="emergency-page-title" className="text-2xl font-black tracking-tight text-[var(--color-text)]">
            Savings Analysis
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Emergency readiness runway & liquidity reserve evaluation
          </p>
        </div>
      </div>

      {/* Score Header */}
      <div
        data-testid="emergency-score-header"
        className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between"
      >
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
            EMERGENCY SAVINGS SCORE
          </span>
          <div className="text-4xl font-black text-emerald-500 mt-1">
            {p.savingsScore.toFixed(0)}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-2 border-emerald-500/40 flex items-center justify-center font-black text-emerald-500 text-sm">
              {p.readinessScore.toFixed(0)}
            </div>
            <span className="text-[10px] font-bold text-gray-400 mt-1">Readiness</span>
          </div>
        </div>
      </div>

      {/* Readiness Card */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-400 px-1">
          EMERGENCY RESERVES
        </h2>
        <div className="p-6 rounded-3xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-400">Current Estimated Fund</span>
            <div className="flex items-center gap-3">
              <span className="text-xl font-black text-emerald-500">
                {p.hasProfileData ? formatEmergencyCompact(p.efCurrent) : 'not available'}
              </span>

              {/* Growth Badge: Hidden on initial render; shown only after session change */}
              {growthPct !== null && (
                <span
                  data-testid="growth-badge"
                  className={`px-2 py-0.5 rounded-lg text-xs font-black border ${
                    growthPct >= 0
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-500'
                  }`}
                >
                  {growthPct >= 0 ? `▲ +${growthPct.toFixed(1)}%` : `▼ -${Math.abs(growthPct).toFixed(1)}%`}
                </span>
              )}

              <button
                type="button"
                data-testid="edit-estimated-fund-btn"
                onClick={() => {
                  setQuickEditVal(p.efCurrent.toString());
                  setIsQuickEditOpen(true);
                }}
                className="p-1 text-emerald-500 hover:text-emerald-400 text-sm"
                title="Edit Current Fund"
              >
                ✏️
              </button>
            </div>
          </div>

          <div className="border-t border-[var(--color-border)]/50" />

          {/* Target Goal */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <div>
                <div className="text-sm font-bold text-[var(--color-text)]">Target Goal</div>
                <div className="text-xs text-gray-400">Safe Cushion</div>
              </div>
            </div>
            <div className="text-sm font-black text-[var(--color-text)]">
              {p.hasProfileData ? formatEmergencyCompact(p.efTarget) : 'not available'}
            </div>
          </div>

          <div className="border-t border-[var(--color-border)]/50" />

          {/* Parked Location with Yield Tag */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <div>
                <div className="text-sm font-bold text-[var(--color-text)]">Parked In</div>
                <div data-testid="yield-tag" className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[10px] font-black">
                  ⚡ {p.yieldTag}
                </div>
              </div>
            </div>
            <div className="text-sm font-black text-[var(--color-text)]">
              {p.hasProfileData ? p.parkedLocation : 'not available'}
            </div>
          </div>
        </div>
      </div>

      {/* Fund Completion */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-400 px-1">
          READINESS HEALTH
        </h2>
        <div className="p-6 rounded-3xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm space-y-4">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-[var(--color-text)]">Target Fulfillment</span>
            <span className="text-emerald-500 font-black">
              {p.hasProfileData ? `${p.progressPct.toFixed(1)}%` : 'not available'}
            </span>
          </div>
          <div className="h-2.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(1, p.progressPct))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Strategy & Tips */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-400 px-1">
          STRATEGY & TIPS
        </h2>
        <div
          data-testid="shortfall-card"
          className="p-6 rounded-3xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-rose-500">Shortfall to Target</span>
            <span className="text-xl font-black text-rose-500">
              {p.hasProfileData ? formatEmergencyCompact(p.shortfall) : 'not available'}
            </span>
          </div>
          <p className="text-xs italic text-[var(--color-text-secondary)]">
            {p.shortfall > 0
              ? 'Your emergency fund is below target. Move your surplus to a Liquid Fund for safety.'
              : 'Excellent! Your emergency fund is fully funded.'}
          </p>
        </div>
      </div>

      {/* Add Savings Card */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-400 px-1">
          UPDATE SAVINGS BALANCE
        </h2>
        <div className="p-6 rounded-3xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm space-y-4">
          <div>
            <div className="text-sm font-bold text-[var(--color-text)]">Add to Emergency Fund</div>
            <p className="text-xs text-gray-400">Enter the amount you saved up this month.</p>
          </div>

          <form onSubmit={handleAddSavingsSubmit} className="space-y-4">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
              <input
                type="number"
                data-testid="savings-amount-input"
                value={savingsInput}
                onChange={(e) => setSavingsInput(e.target.value)}
                className="w-full pl-8 pr-4 py-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:border-emerald-500"
                placeholder="Savings Amount"
              />
            </div>

            <button
              type="submit"
              data-testid="update-fund-btn"
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all active:scale-98"
            >
              Update Fund Balance
            </button>
          </form>
        </div>
      </div>

      {/* Optimize Button */}
      <button
        type="button"
        data-testid="emergency-optimize-btn"
        onClick={() => navigate('/master-data?target=emergency')}
        className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg hover:shadow-emerald-500/25 transition-all active:scale-98 flex items-center justify-center gap-2"
      >
        <span>⚡</span> Optimize Now
      </button>

      {/* Confirmation Dialog */}
      {confirmAmount !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[var(--color-text)]">Confirm Update</h3>
            <p className="text-xs text-gray-400">
              Add ₹{confirmAmount.toFixed(0)} to your emergency fund?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmAmount(null)}
                className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-[var(--color-text)]"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="confirm-savings-update-btn"
                disabled={isSubmittingSavings}
                onClick={handleConfirmAddSavings}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                {isSubmittingSavings ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Edit Modal */}
      {isQuickEditOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[var(--color-text)]">Update Estimated Fund</h3>
            <form onSubmit={handleQuickEditSubmit} className="space-y-4">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                <input
                  type="number"
                  value={quickEditVal}
                  onChange={(e) => setQuickEditVal(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="New Amount (₹)"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickEditOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-[var(--color-text)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingQuickEdit}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  {isUpdatingQuickEdit ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
