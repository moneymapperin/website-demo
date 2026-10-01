import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { useToast } from '../../context/ToastContext';
import {
  calculateInvestmentPillar,
  formatInr,
  InvestmentPillarData,
} from '../../models/pillars/investments';
import {
  PieChart,
  Award,
  Layers,
  TrendingUp,
  Edit3,
  ArrowRight,
  Shield,
  Lightbulb,
  Building2,
  Coins,
  BarChart3,
  ChevronRight,
  Zap,
} from 'lucide-react';

export const MutualFundPillarPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InvestmentPillarData | null>(null);

  // Quick edit modal state
  const [editField, setEditField] = useState<{ title: string; key: string; currentVal: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashboard, profileRes] = await Promise.all([
        apiService.getDashboard().catch(() => ({})),
        apiService.getMasterProfile().catch(() => ({ data: null })),
      ]);

      const calculated = calculateInvestmentPillar(profileRes?.data, dashboard);
      setData(calculated);
    } catch (err) {
      console.error('Error loading investment pillar:', err);
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

  const p = data ?? calculateInvestmentPillar(null, null);

  const assetList = [
    { label: 'Gold', amount: p.gold, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500', recommended: '5% - 15%', key: 'totalGoldInvestments' },
    { label: 'Stock', amount: p.equity, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500', recommended: '30% - 50%', key: 'totalEquityInvestments' },
    { label: 'Mutual Fund', amount: p.debt, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500', recommended: '20% - 40%', key: 'totalDebtInvestments' },
    { label: 'Real Estate', amount: p.realEstate, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-500', recommended: '5% - 15%', key: 'totalRealEstateInvestments' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. Header Banner & Quote Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 dark:from-[#2E1065] dark:via-[#1E0A45] dark:to-[#120D2C] text-white shadow-xl border border-indigo-400/20 dark:border-indigo-500/20 relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20 text-indigo-300">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <h1 data-testid="investments-page-title" className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Investment Analysis
            </h1>
            <p className="text-xs md:text-sm text-indigo-200/80">
              Portfolio asset mix, SIP contributions & target gap
            </p>
          </div>
        </div>

        {/* Quote Block */}
        <div className="relative z-10 max-w-md p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/10 text-indigo-300 shrink-0">
            <PieChart className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold italic text-indigo-100">
            &ldquo;Invest consistently today for a wealthier tomorrow.&rdquo;
          </p>
        </div>
      </div>

      {/* 2. Hero Score Header & 4 Mini Stat Cards */}
      <div
        data-testid="investments-score-header"
        className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-6 transition-colors"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Circular Gauge */}
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
                  strokeDasharray={`${Math.min(100, Math.max(0, p.investmentScore))}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{p.investmentScore.toFixed(0)}</span>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-300 uppercase">/ 100</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-amber-500 font-bold text-sm mb-1">
                <Award className="w-4 h-4" />
                <span>Good progress!</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed max-w-sm">
                Your investments portfolio is on track. Increase diversification to reduce risk and grow wealth.
              </p>
            </div>
          </div>

          {/* 4 Mini Stat Cards */}
          <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 text-center">
              <div className="w-7 h-7 mx-auto mb-1.5 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <PieChart className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white">{p.assetBalanceScore.toFixed(0)}</div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">Asset Mix Score</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 text-center">
              <div className="w-7 h-7 mx-auto mb-1.5 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white">{p.sipScore.toFixed(0)}</div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">SIP Health Score</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 text-center">
              <div className="w-7 h-7 mx-auto mb-1.5 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Coins className="w-4 h-4" />
              </div>
              <div className="text-base font-black text-indigo-600 dark:text-indigo-400">{formatInr(p.totalInvested)}</div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">Total Portfolio</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 text-center">
              <div className="w-7 h-7 mx-auto mb-1.5 rounded-lg bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <Shield className="w-4 h-4" />
              </div>
              <div className="text-base font-black text-rose-600 dark:text-rose-400">{formatInr(p.sipGap)}</div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">Shortfall (Gap)</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Mid Section: Portfolio Breakdown & Allocation Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Mid Left: Portfolio Breakdown */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-5 transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Portfolio Breakdown</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Your total investments across asset classes</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
            {/* Donut Chart */}
            <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-slate-100 dark:text-zinc-900" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-amber-500" strokeDasharray="57, 100" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-blue-500" strokeDasharray="28, 100" strokeDashoffset="-57" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-purple-500" strokeDasharray="14, 100" strokeDashoffset="-85" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-sm font-black text-slate-900 dark:text-white">{formatInr(p.totalInvested)}</span>
                <span className="text-[9px] text-slate-500 dark:text-zinc-400 uppercase font-bold">Total Value</span>
              </div>
            </div>

            {/* Asset Rows */}
            <div className="w-full space-y-2.5">
              {assetList.map((asset) => {
                const pct = p.totalInvested > 0 ? (asset.amount / p.totalInvested) * 100 : 0;
                return (
                  <div key={asset.key} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50/80 dark:bg-[#14102B]/60 border border-slate-200/60 dark:border-indigo-500/10">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${asset.bg}`} />
                      <span className="font-bold text-slate-900 dark:text-white">{asset.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-black ${asset.color}`}>{pct.toFixed(1)}%</span>
                      <span className="font-bold text-slate-700 dark:text-zinc-300">{formatInr(asset.amount)}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditField({
                            title: asset.label,
                            key: asset.key,
                            currentVal: asset.amount,
                          });
                          setEditValue(asset.amount.toString());
                        }}
                        className={`p-1 ${asset.color} hover:opacity-80 transition-opacity`}
                        title={`Edit ${asset.label}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mid Right: Allocation Health */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-5 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Allocation Health</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Compare current allocation with recommended range</p>
              </div>
            </div>
            <button type="button" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1">
              <span>View Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {assetList.map((asset) => {
              const pct = p.totalInvested > 0 ? (asset.amount / p.totalInvested) * 100 : 0;
              return (
                <div key={`alloc-health-${asset.key}`} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-800 dark:text-zinc-200">{asset.label}</span>
                    <span className={`${asset.color} font-black`}>{pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${asset.bg} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(100, Math.max(1, pct))}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-zinc-400 text-right">
                    Recommended: {asset.recommended}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: SIP Analysis & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SIP Analysis */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">SIP Analysis</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Your monthly SIP contributions and goal progress</p>
              </div>
            </div>
            <button type="button" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1">
              <span>View Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15">
              <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Monthly SIP Contribution</div>
              <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">{formatInr(p.monthlySipTotal)}</div>
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">↑ 12% vs last month</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15">
              <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Active SIPs</div>
              <div className="text-xl font-black text-slate-900 dark:text-white">2</div>
              <div className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">Mutual Fund: 1 | Gold: 1</div>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-zinc-300">SIP Goal Progress</span>
              <span className="text-indigo-600 dark:text-indigo-400">Target: {formatInr(p.idealSip ?? 500000)}</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(1, p.sipProgress ?? 0))}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500 dark:text-zinc-400">
              You are {(p.sipProgress ?? 0).toFixed(0)}% towards your investment goal.
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Recommendations</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Ways to improve your investment strategy</p>
              </div>
            </div>
            <button type="button" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Increase Equity Allocation</div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">Consider increasing stocks to 30% &ndash; 50%.</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Start a Real Estate Fund</div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">Diversify with REITs or property funds.</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Continue & Increase SIPs</div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">Increase SIP by 10&ndash;20% annually.</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
            </div>
          </div>
        </div>
      </div>

      {/* 5. Bottom CTA Button */}
      <button
        type="button"
        data-testid="investments-optimize-btn"
        onClick={() => navigate('/master-data?target=investment')}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all active:scale-98 flex items-center justify-center gap-2"
      >
        <span>⚡ Optimize Now</span>
        <ArrowRight className="w-4 h-4" />
      </button>

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
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-400 text-sm">₹</span>
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
