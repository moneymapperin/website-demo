import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { useToast } from '../../context/ToastContext';
import {
  calculateIncomePillar,
  formatIncomeCompact,
  IncomePillarData,
} from '../../models/pillars/income';
import {
  TrendingUp,
  Award,
  Wallet,
  DollarSign,
  PieChart,
  Edit3,
  ArrowRight,
  ShieldAlert,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Layers,
} from 'lucide-react';

export const IncomePillarPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<IncomePillarData | null>(null);

  // Quick edit modal state
  const [editField, setEditField] = useState<{ title: string; key: string; currentVal: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const profileRes = await apiService.getMasterProfile().catch(() => ({ data: null }));
      const calculated = calculateIncomePillar(profileRes?.data);
      setData(calculated);
    } catch (err) {
      console.error('Error loading income pillar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editField) return;

    try {
      setIsUpdating(true);
      await apiService.updateMasterProfile({
        [editField.key]: editValue,
      });
      showToast(`${editField.title} updated successfully!`);
      setEditField(null);
      await loadData();
    } catch (err: any) {
      showToast(`Error updating: ${err?.message || 'Failed to update'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const p = data ?? calculateIncomePillar(null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. Top Hero Header & Quote Card (Rich Gradient for both light/dark) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 dark:from-[#2E1065] dark:via-[#1E0A45] dark:to-[#120D2C] text-white shadow-xl border border-indigo-400/20 dark:border-indigo-500/20 relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20 text-indigo-300">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 data-testid="income-page-title" className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Income Analysis
            </h1>
            <p className="text-xs md:text-sm text-indigo-200/80">
              Active vs passive earnings, city benchmarks & distribution
            </p>
          </div>
        </div>

        {/* Quote Block */}
        <div className="relative z-10 max-w-md p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/10 text-indigo-300 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold italic text-indigo-100">
            &ldquo;A stronger income today builds a more flexible tomorrow.&rdquo;
          </p>
        </div>
      </div>

      {/* 2. Hero Score Card & 4 Mini Stat Cards */}
      <div
        data-testid="income-score-header"
        className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-6 transition-colors"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Circular Gauge & Progress Message */}
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
                  strokeDasharray={`${Math.min(100, Math.max(0, p.finalPillarScore))}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{p.finalPillarScore}</span>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-300 uppercase">/ 100</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-amber-500 font-bold text-sm mb-1">
                <Award className="w-4 h-4" />
                <span>Good progress!</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed max-w-sm">
                You have an active income source. Diversify and increase your income for greater financial stability.
              </p>
            </div>
          </div>

          {/* 4 Mini Stat Cards */}
          <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 text-center">
              <div className="w-7 h-7 mx-auto mb-1.5 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white">1</div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">Active Source</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 text-center">
              <div className="w-7 h-7 mx-auto mb-1.5 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white">0</div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">Passive Source</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 text-center">
              <div className="w-7 h-7 mx-auto mb-1.5 rounded-lg bg-pink-500/10 dark:bg-pink-500/20 flex items-center justify-center text-pink-600 dark:text-pink-400">
                <PieChart className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">{p.activeSharePct.toFixed(0)}%</div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">Active Share</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 text-center">
              <div className="w-7 h-7 mx-auto mb-1.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-amber-600 dark:text-amber-400">{p.passiveSharePct.toFixed(0)}%</div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">Passive Share</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Earnings Overview Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-5 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Earnings Overview</h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Your monthly income streams</p>
                </div>
              </div>
              <select className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#171338] border border-slate-200 dark:border-indigo-500/20 text-xs font-bold text-slate-700 dark:text-indigo-300 outline-none">
                <option>Monthly</option>
                <option>Annualized</option>
              </select>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Total Monthly Income</span>
              <div className="text-right">
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {p.hasProfileData ? formatIncomeCompact(p.totalIncome) : 'not available'}
                </div>
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">↑ 0% vs last month</div>
              </div>
            </div>

            <div className="space-y-3">
              {/* Active Income Row */}
              <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-[#14102B]/60 border border-slate-200/60 dark:border-indigo-500/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-indigo-600 dark:bg-indigo-500 shadow-sm" />
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">Active Income</div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400">Salary, Business, Freelance</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      {p.hasProfileData ? formatIncomeCompact(p.activeIncome) : 'not available'}
                    </div>
                    {p.hasProfileData && (
                      <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        {p.activeSharePct.toFixed(1)}%
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    data-testid="edit-active-income-btn"
                    onClick={() => {
                      setEditField({
                        title: 'Active Income',
                        key: 'monthlyActiveIncome',
                        currentVal: p.activeIncome,
                      });
                      setEditValue(p.activeIncome.toString());
                    }}
                    className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-colors"
                    title="Edit Active Income"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Passive Income Row */}
              <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-[#14102B]/60 border border-slate-200/60 dark:border-indigo-500/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-purple-600 dark:bg-purple-500 shadow-sm" />
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">Passive Income</div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400">Rent, Dividends, Interest</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      {p.hasProfileData ? formatIncomeCompact(p.passiveIncome) : 'not available'}
                    </div>
                    {p.hasProfileData && (
                      <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                        {p.passiveSharePct.toFixed(1)}%
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    data-testid="edit-passive-income-btn"
                    onClick={() => {
                      setEditField({
                        title: 'Passive Income',
                        key: 'passiveIncomeAmount',
                        currentVal: p.passiveIncome,
                      });
                      setEditValue(p.passiveIncome.toString());
                    }}
                    className="p-1.5 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/20 transition-colors"
                    title="Edit Passive Income"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Income Health & Benchmarks Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-4 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Income Health & Benchmarks</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">See how your income performance looks and what to focus on</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 space-y-2">
                <div className="p-2 w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-indigo-500/20 text-emerald-600 dark:text-indigo-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Income Stability</div>
                <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">Good</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 leading-tight">You have a consistent income source.</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 space-y-2">
                <div className="p-2 w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Growth Potential</div>
                <div className="text-sm font-black text-blue-600 dark:text-blue-400">Moderate</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 leading-tight">Consider adding additional income streams.</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 space-y-2">
                <div className="p-2 w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Diversification</div>
                <div className="text-sm font-black text-amber-600 dark:text-amber-400">Needs Attention</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 leading-tight">Your income is currently dependent on a single source.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Income Mix Health Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-4 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Income Mix Health</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Balance between active and passive income</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-700 dark:text-zinc-300">Active Source</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-black">{p.activeSharePct.toFixed(1)}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(1, p.activeSharePct))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-700 dark:text-zinc-300">Passive Source</span>
                  <span className="text-purple-600 dark:text-purple-400 font-black">{p.passiveSharePct.toFixed(1)}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 dark:bg-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(1, p.passiveSharePct))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Distribution Status Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-4 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Distribution Status</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Is your income well balanced?</p>
              </div>
            </div>

            {/* Gradient Slider with Knob */}
            <div className="relative py-3">
              <div className="h-3 w-full rounded-full bg-gradient-to-r from-purple-600 via-indigo-500 to-amber-500 shadow-inner" />
              <div
                className="absolute top-1/2 -translate-y-1/2 -ml-3 w-6 h-6 rounded-full bg-white border-2 border-indigo-600 shadow-lg transition-all duration-500"
                style={{
                  left: `${Math.min(100, Math.max(0, p.finalPillarScore))}%`,
                }}
              />
            </div>

            <p className="text-xs italic text-indigo-700 dark:text-indigo-300/80 leading-relaxed">
              {p.finalPillarScore >= 75
                ? 'Excellent! Your income streams are well diversified.'
                : 'Strategy: Aim for passive income to reach at least 25% of your total earnings.'}
            </p>
          </div>

          {/* Update Income Details Action Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-4 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                <Edit3 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Update Income Details</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Update your income sources or amounts anytime.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditField({
                  title: 'Active Income',
                  key: 'monthlyActiveIncome',
                  currentVal: p.activeIncome,
                });
                setEditValue(p.activeIncome.toString());
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wider uppercase shadow-lg shadow-indigo-600/25 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Update Income Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Optimize Now CTA */}
          <button
            type="button"
            data-testid="income-optimize-btn"
            onClick={() => navigate('/master-data?target=income')}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            <span>⚡ Optimize Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Edit Modal */}
      {editField && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E0B1F] border border-slate-200 dark:border-indigo-500/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Update {editField.title}
            </h3>
            <form onSubmit={handleQuickEditSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 block mb-1">
                  New Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-400 text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-indigo-500/30 bg-slate-50 dark:bg-[#14102B] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="Enter amount"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditField(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30"
                >
                  {isUpdating ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
