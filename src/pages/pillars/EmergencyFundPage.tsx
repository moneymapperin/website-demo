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
import {
  ShieldAlert,
  Award,
  Wallet,
  Target,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Edit3,
  Lightbulb,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  Zap,
  ChevronRight,
} from 'lucide-react';

export const EmergencyFundPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EmergencyFundPillarData | null>(null);

  // In-session baseline for growth badge calculation
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
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const p = data ?? calculateEmergencyFundPillar(null, null);

  // In-session growth percentage
  const growthPct = sessionPrevFund !== null ? calculateSessionGrowthPct(p.efCurrent, sessionPrevFund) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. Top Header Banner & Quote Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 dark:from-[#170E38] dark:via-[#100D28] dark:to-[#0A0B14] border border-indigo-400/20 dark:border-indigo-500/20 shadow-lg dark:shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-white/15 dark:bg-indigo-500/20 border border-white/20 dark:border-indigo-500/30 text-white dark:text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 data-testid="emergency-page-title" className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Emergency Savings Analysis
            </h1>
            <p className="text-xs md:text-sm text-indigo-100 dark:text-zinc-400">
              Emergency readiness runway & liquidity reserve evaluation
            </p>
          </div>
        </div>

        {/* Quote Block matching App Theme */}
        <div className="relative z-10 max-w-md p-3.5 rounded-2xl bg-white/10 dark:bg-indigo-950/40 border border-white/20 dark:border-indigo-500/20 backdrop-blur-md flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/20 dark:bg-indigo-500/20 text-white dark:text-indigo-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold italic text-indigo-50 dark:text-indigo-200">
            &ldquo;A strong emergency fund keeps you prepared for life&apos;s uncertainties.&rdquo;
          </p>
        </div>
      </div>

      {/* 2. Hero Score Header & 4 Mini Stat Cards matching App Theme */}
      <div
        data-testid="emergency-score-header"
        className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-6 transition-colors"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Circular Gauge */}
          <div className="lg:col-span-6 flex items-center gap-5">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100 dark:text-indigo-950"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-indigo-600 dark:text-indigo-500 transition-all duration-1000 ease-out"
                  strokeDasharray={`${Math.min(100, Math.max(0, p.savingsScore))}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{p.savingsScore.toFixed(0)}</span>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-300 uppercase">/ 100</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-sm mb-1">
                <Award className="w-4 h-4" />
                <span>Good readiness!</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed max-w-sm">
                You are on track, but increasing your emergency fund can give you more financial security.
              </p>
            </div>
          </div>

          {/* 4 Mini Stat Cards */}
          <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-100 dark:border-indigo-500/15 text-center transition-colors">
              <div className="w-7 h-7 mx-auto mb-1.5 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="text-base font-black text-indigo-600 dark:text-indigo-400">
                {p.hasProfileData ? formatEmergencyCompact(p.efCurrent) : 'N/A'}
              </div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">Current Fund</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-100 dark:border-indigo-500/15 text-center transition-colors">
              <div className="w-7 h-7 mx-auto mb-1.5 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Target className="w-4 h-4" />
              </div>
              <div className="text-base font-black text-slate-900 dark:text-white">
                {p.hasProfileData ? formatEmergencyCompact(p.efTarget) : 'N/A'}
              </div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">Target Goal</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-100 dark:border-indigo-500/15 text-center transition-colors">
              <div className="w-7 h-7 mx-auto mb-1.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-amber-600 dark:text-amber-400">{p.monthsCoverage}</div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">Months Coverage</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-100 dark:border-indigo-500/15 text-center transition-colors">
              <div className="w-7 h-7 mx-auto mb-1.5 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Award className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white">{p.readinessScore.toFixed(0)}</div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">Readiness Score</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Mid Section: Emergency Reserves & Strategy & Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Emergency Reserves */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-5 transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Emergency Reserves</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Your current progress toward a safe financial cushion</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Current Estimated Fund */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/60 dark:border-indigo-500/15 flex items-center justify-between transition-colors">
              <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Current Estimated Fund</span>
              <div className="flex items-center gap-3">
                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                  {p.hasProfileData ? formatEmergencyCompact(p.efCurrent) : 'not available'}
                </span>

                {/* Growth Badge */}
                {growthPct !== null && (
                  <span
                    data-testid="growth-badge"
                    className={`px-2 py-0.5 rounded-lg text-xs font-black border ${
                      growthPct >= 0
                        ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
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
                  className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-white hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20 transition-colors"
                  title="Edit Current Fund"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Target Goal */}
            <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-[#14102B]/60 border border-slate-200/50 dark:border-indigo-500/10 flex items-center justify-between text-xs transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Target Goal</div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">Safe Cushion (6 months of living expenses)</div>
                </div>
              </div>
              <span className="font-black text-slate-900 dark:text-white">
                {p.hasProfileData ? formatEmergencyCompact(p.efTarget) : 'not available'}
              </span>
            </div>

            {/* Parked Location & Yield Tag */}
            <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-[#14102B]/60 border border-slate-200/50 dark:border-indigo-500/10 flex items-center justify-between text-xs transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Parked In</div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">Savings Account / FD / Liquid Fund</div>
                  <div
                    data-testid="yield-tag"
                    className="inline-block mt-1 px-2 py-0.5 rounded-md bg-sky-500/10 dark:bg-sky-500/15 border border-sky-500/30 text-sky-600 dark:text-sky-400 text-[10px] font-black"
                  >
                    ⚡ {p.yieldTag}
                  </div>
                </div>
              </div>
              <span className="font-black text-slate-900 dark:text-white">
                {p.hasProfileData ? p.parkedLocation : 'not available'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Strategy & Tips */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                <Lightbulb className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Strategy & Tips</h2>
            </div>
            <button type="button" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/60 dark:border-indigo-500/15 flex items-center justify-between transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Increase Emergency Fund</div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">Aim for at least 6&ndash;12 months of expenses.</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/60 dark:border-indigo-500/15 flex items-center justify-between transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Keep in Liquid Instruments</div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">Use high-interest savings accounts or liquid funds.</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/60 dark:border-indigo-500/15 flex items-center justify-between transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Review Quarterly</div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">Update your emergency fund based on lifestyle changes.</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Readiness Health & Update Savings Balance / Shortfall */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Readiness Health Bar Card */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-4 transition-colors">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-900 dark:text-white text-base">Readiness Health</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-black text-sm">
              {p.hasProfileData ? `${p.progressPct.toFixed(1)}%` : 'not available'}
            </span>
          </div>

          <div className="h-3 w-full bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 shadow-sm shadow-indigo-500/50"
              style={{ width: `${Math.min(100, Math.max(1, p.progressPct))}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/60 dark:border-indigo-500/15 transition-colors">
              <div className="text-slate-500 dark:text-zinc-400 text-[11px]">Recommended Coverage</div>
              <div className="font-bold text-slate-900 dark:text-white mt-0.5">6 &ndash; 12 months</div>
              <div className="text-[10px] text-slate-400 dark:text-zinc-400 mt-0.5">of living expenses</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/60 dark:border-indigo-500/15 transition-colors">
              <div className="text-slate-500 dark:text-zinc-400 text-[11px]">Your Coverage</div>
              <div className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{p.monthsCoverage} months</div>
              <div className="text-[10px] text-slate-400 dark:text-zinc-400 mt-0.5">You are within the safe range</div>
            </div>
          </div>
        </div>

        {/* Update Savings Balance & Shortfall Analysis Card */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-5 transition-colors">
          {/* Shortfall warning */}
          <div data-testid="shortfall-card" className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-rose-800 dark:text-rose-300">Shortfall to Target</span>
                <span className="text-sm font-black text-rose-600 dark:text-rose-400">{formatEmergencyCompact(p.shortfall)}</span>
              </div>
              <p className="text-[11px] text-rose-700 dark:text-rose-200/80 mt-1 leading-normal">
                Your emergency fund is below target. Move your surplus to a Liquid Fund for safety.
              </p>
            </div>
          </div>

          {/* Add Savings Form */}
          <form onSubmit={handleAddSavingsSubmit} className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Update Savings Balance</h2>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">Enter the amount you saved up this month.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-400 text-sm">₹</span>
                <input
                  type="number"
                  data-testid="savings-amount-input"
                  value={savingsInput}
                  onChange={(e) => setSavingsInput(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-indigo-500/30 bg-slate-50 dark:bg-[#14102B] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Savings Amount"
                />
              </div>

              <button
                type="submit"
                data-testid="update-fund-btn"
                className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all active:scale-95 whitespace-nowrap"
              >
                Update Fund Balance
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 5. Bottom CTA Button */}
      <button
        type="button"
        onClick={() => navigate('/master-data?target=emergency')}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-indigo-600/30 transition-all active:scale-98 flex items-center justify-center gap-2"
      >
        <span>⚡ Optimize Now</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      {/* Quick Edit Modal */}
      {isQuickEditOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E0B1F] border border-slate-200 dark:border-indigo-500/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Update Current Estimated Fund
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
                {isSubmittingSavings ? 'Processing...' : 'Confirm Deposit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
