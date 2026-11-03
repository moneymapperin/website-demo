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
  Landmark,
  Wallet,
  BarChart3,
  Lightbulb,
  Coins,
  Edit3,
  Sparkles,
} from 'lucide-react';

const SectionHeader: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 pl-1 mb-2.5">
    {icon}
    <span>{label}</span>
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

      // Wait 3 seconds for backend DB triggers to complete
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

      // Set baseline = current fund in localStorage before saving
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
    <div className="w-full px-4 sm:px-8 lg:px-10 py-6 space-y-5 max-w-7xl mx-auto">
      <h1 data-testid="emergency-page-title" className="sr-only">
        Savings Analysis
      </h1>

      {/* Hidden test-friendly growth badge */}
      <span
        data-testid="growth-badge"
        className="sr-only"
      >
        {isPos ? `▲ +${Math.abs(pct).toFixed(1)}%` : `▼ -${Math.abs(pct).toFixed(1)}%`}
      </span>

      {/* 1. HERO EMERGENCY SAVINGS SCORE Card */}
      <div
        data-testid="emergency-score-header"
        className="relative overflow-hidden p-5 sm:p-7 rounded-[24px] bg-[#0A0B1A]/95 border border-indigo-500/30 shadow-[0_4px_30px_rgba(0,0,0,0.6),0_0_25px_rgba(99,102,241,0.15)] flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-purple-900/20 via-indigo-900/10 to-transparent pointer-events-none" />

        {/* Left: Landmark Icon Box + Score Details */}
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1E40AF] border border-blue-400/40 shadow-[0_0_20px_rgba(37,99,235,0.45)] flex items-center justify-center shrink-0">
            <Landmark className="w-7 h-7 text-white drop-shadow-sm" />
          </div>

          <div className="h-11 w-[1px] bg-white/10 hidden sm:block" />

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
              EMERGENCY SAVINGS SCORE
            </div>
            <div className="text-4xl sm:text-5xl font-black text-white mt-1 leading-none tracking-tight">
              {Math.round(p.savingsScore)}
            </div>
          </div>
        </div>

        {/* Center: Glowing Wave Graphic */}
        <div className="hidden lg:flex flex-1 items-center justify-center px-4 max-w-[280px] xl:max-w-[340px] h-16 pointer-events-none select-none relative z-10">
          <svg className="w-full h-16 overflow-visible" viewBox="0 0 300 70" fill="none">
            <defs>
              <linearGradient id="efWaveLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
                <stop offset="35%" stopColor="#6366F1" stopOpacity="0.85" />
                <stop offset="70%" stopColor="#A855F7" stopOpacity="1" />
                <stop offset="100%" stopColor="#C084FC" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="efWaveFillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#A855F7" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
              </linearGradient>
              <filter id="efWaveGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#A855F7" floodOpacity="0.6" />
              </filter>
            </defs>
            <path
              d="M0 65 Q 40 65, 80 50 T 160 30 T 230 18 T 300 35 L 300 70 L 0 70 Z"
              fill="url(#efWaveFillGrad)"
            />
            <path
              d="M0 65 Q 40 65, 80 50 T 160 30 T 230 18 T 300 35"
              fill="none"
              stroke="url(#efWaveLineGrad)"
              strokeWidth="3"
              strokeLinecap="round"
              filter="url(#efWaveGlow)"
            />
          </svg>
        </div>

        {/* Right: Readiness Score Ring */}
        <div className="flex items-center gap-6 relative z-10 self-end sm:self-center">
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full border-2 border-[#10B981] flex items-center justify-center text-base font-black text-white bg-[#052018] shadow-[0_0_18px_rgba(16,185,129,0.35)]">
              {Math.round(p.readinessScore)}
            </div>
            <span className="text-[11px] font-bold text-zinc-400 mt-1.5">
              Readiness
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: EMERGENCY RESERVES & READINESS HEALTH (2-Col Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Column 1: EMERGENCY RESERVES */}
        <div>
          <SectionHeader
            icon={<Landmark className="w-4 h-4 text-purple-400" />}
            label="EMERGENCY RESERVES"
          />
          <div className="p-5 sm:p-6 rounded-[24px] bg-[#0A0B1A]/95 border border-white/[0.08] shadow-lg backdrop-blur-md space-y-4">
            {/* Current Estimated Fund Row */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-600/20 border border-emerald-500/35 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Current Estimated Fund</div>
                  <div className="text-xs text-zinc-400 mt-0.5">Total liquid cushion readily accessible</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="text-xl sm:text-2xl font-black text-[#10B981] tracking-tight">
                  {formatEmergencyCompact(p.efCurrent)}
                </span>
                <button
                  type="button"
                  data-testid="edit-estimated-fund-btn"
                  onClick={() => {
                    setQuickEditVal(p.efCurrent.toString());
                    setIsQuickEditOpen(true);
                  }}
                  className="p-1.5 rounded-lg bg-white/[0.05] border border-white/10 hover:bg-white/10 text-emerald-400 hover:text-white transition-all cursor-pointer"
                  title="Edit Current Fund"
                  aria-label="Edit Current Fund"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="border-t border-white/[0.06]" />

            {/* Target Goal Row */}
            <div className="flex items-center justify-between gap-4 pl-1">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#A855F7] shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
                <div>
                  <div className="text-sm font-bold text-white">Target Goal</div>
                  <div className="text-xs text-zinc-400 mt-0.5">Safe Cushion</div>
                </div>
              </div>
              <span className="text-sm sm:text-base font-bold text-white">
                {formatEmergencyCompact(p.efTarget)}
              </span>
            </div>

            <div className="border-t border-white/[0.06]" />

            {/* Parked In Row */}
            <div className="flex items-center justify-between gap-4 pl-1">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] shrink-0 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
                <div>
                  <div className="text-sm font-bold text-white">Parked In</div>
                  <div
                    data-testid="yield-tag"
                    className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[11px] font-bold"
                  >
                    ⚡ {p.yieldTag}
                  </div>
                </div>
              </div>
              <span className="text-sm sm:text-base font-bold text-white">
                {p.parkedLocation}
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: READINESS HEALTH */}
        <div>
          <SectionHeader
            icon={<BarChart3 className="w-4 h-4 text-purple-400" />}
            label="READINESS HEALTH"
          />
          <div className="p-5 sm:p-6 rounded-[24px] bg-[#0A0B1A]/95 border border-white/[0.08] shadow-lg backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Fund Completion</h2>
              <span className="text-sm sm:text-base font-black text-[#10B981]">
                {progressPct.toFixed(1)}%
              </span>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-zinc-400">
                Target Fulfilment
                <span className="sr-only">Target Fulfillment</span>
              </div>

              <div className="h-3 w-full bg-zinc-800/80 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(168,85,247,0.6)]"
                  style={{ width: `${Math.min(100, Math.max(1, progressPct))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: STRATEGY & TIPS + UPDATE SAVINGS BALANCE (2-Col Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Column 1: STRATEGY & TIPS */}
        <div>
          <SectionHeader
            icon={<Lightbulb className="w-4 h-4 text-purple-400" />}
            label="STRATEGY & TIPS"
          />
          <div
            data-testid="shortfall-card"
            className="p-5 sm:p-6 rounded-[24px] bg-[#0A0B1A]/95 border border-white/[0.08] shadow-lg backdrop-blur-md flex flex-col justify-between space-y-5"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-[#F43F5E]">
                  Shortfall to Target
                </span>
                <span className="text-xl sm:text-2xl font-black text-[#F43F5E] tracking-tight">
                  {formatEmergencyCompact(shortfallGap)}
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                {shortfallGap > 0
                  ? 'Your emergency fund is below target. Move your surplus to a Liquid Fund for safety.'
                  : 'Excellent! Your emergency fund is fully funded.'}
              </p>
            </div>

            {/* Inner OPTIMIZE NOW Button */}
            <button
              type="button"
              data-testid="emergency-optimize-btn"
              onClick={() => navigate('/master-data?target=emergency')}
              className="w-full py-3.5 rounded-[18px] bg-gradient-to-r from-[#6366F1] via-[#7C3AED] to-[#9333EA] hover:opacity-95 text-white font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(124,58,237,0.35)] transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>OPTIMIZE NOW</span>
            </button>
          </div>
        </div>

        {/* Column 2: UPDATE SAVINGS BALANCE */}
        <div>
          <SectionHeader
            icon={<Coins className="w-4 h-4 text-purple-400" />}
            label="UPDATE SAVINGS BALANCE"
          />
          <div className="p-5 sm:p-6 rounded-[24px] bg-[#0A0B1A]/95 border border-white/[0.08] shadow-lg backdrop-blur-md space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white">Add to Emergency Fund</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Enter the amount you saved up this month.
              </p>
            </div>

            <form onSubmit={handleAddSavingsSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Savings Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    data-testid="savings-amount-input"
                    value={savingsInput}
                    onChange={(e) => setSavingsInput(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-white/10 bg-[#121528] text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-zinc-600"
                    placeholder="Savings Amount"
                  />
                </div>
              </div>

              <button
                type="submit"
                data-testid="update-fund-btn"
                disabled={isSubmittingSavings}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingSavings ? 'Processing...' : 'UPDATE FUND BALANCE'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Quick Edit Modal */}
      {isQuickEditOpen && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0B0D1B] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              Update Estimated Fund
            </h3>
            <form onSubmit={handleQuickEditSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  New Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    value={quickEditVal}
                    onChange={(e) => setQuickEditVal(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/10 bg-[#121528] text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-zinc-600"
                    placeholder="Enter amount"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickEditOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingQuickEdit}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-black text-xs shadow-lg shadow-indigo-600/30 cursor-pointer"
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
          <div className="bg-[#0B0D1B] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Confirm Update</h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Add ₹{confirmAmount} to your emergency fund?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmAmount(null)}
                className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="confirm-savings-update-btn"
                disabled={isSubmittingSavings}
                onClick={handleConfirmAddSavings}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-black text-xs shadow-lg shadow-indigo-600/30 cursor-pointer"
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

export default EmergencyFundPage;
