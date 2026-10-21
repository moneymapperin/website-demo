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
  Edit3,
  Sparkles,
  PlusCircle,
  MinusCircle,
  TrendingUp,
  Briefcase,
  PieChart,
  Coins,
} from 'lucide-react';

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 pl-1 mb-2.5">
    {label}
  </div>
);

interface SipItem {
  name: string;
  amount: string;
  date: number;
}

export const MutualFundPillarPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InvestmentPillarData | null>(null);

  // Quick edit modal state
  const [editField, setEditField] = useState<{ title: string; key: string; currentVal: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Manage SIP modal state
  const [activeSipModal, setActiveSipModal] = useState<{
    title: string;
    listKey: 'mfSips' | 'goldSips';
    summaryKey: 'monthlySipDebt' | 'monthlySipGold';
    list: SipItem[];
  } | null>(null);

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

  const openQuickEdit = (title: string, key: string, currentVal: number) => {
    setEditField({ title, key, currentVal });
    setEditValue(Math.round(currentVal).toString());
  };

  const handleQuickEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editField) return;

    try {
      setIsUpdating(true);
      setLoading(true);
      const fieldTitle = editField.title;
      const key = editField.key;
      setEditField(null);

      await apiService.updateMasterProfile({
        [key]: editValue,
      });

      // Brief delay for DB recalculations (same as mobile app)
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await loadData();
      showToast(`${fieldTitle} updated successfully!`);
    } catch (err: any) {
      showToast(`Error: ${err?.message || 'Failed to update'}`);
    } finally {
      setIsUpdating(false);
      setLoading(false);
    }
  };

  const openManageSip = (
    title: string,
    listKey: 'mfSips' | 'goldSips',
    summaryKey: 'monthlySipDebt' | 'monthlySipGold',
    currentList: any[]
  ) => {
    const deepCopy: SipItem[] = (currentList || []).map((item) => ({
      name: item?.name ?? '',
      amount: (item?.amount ?? '0').toString(),
      date: Number(item?.date) || 1,
    }));
    setActiveSipModal({
      title,
      listKey,
      summaryKey,
      list: deepCopy,
    });
  };

  const updateSipItem = (index: number, field: keyof SipItem, val: any) => {
    setActiveSipModal((prev) => {
      if (!prev) return null;
      const updated = [...prev.list];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, list: updated };
    });
  };

  const removeSipItem = (index: number) => {
    setActiveSipModal((prev) => {
      if (!prev) return null;
      const updated = prev.list.filter((_, i) => i !== index);
      return { ...prev, list: updated };
    });
  };

  const handleSaveSipList = async () => {
    if (!activeSipModal) return;
    try {
      setLoading(true);
      const { listKey, summaryKey, list } = activeSipModal;
      setActiveSipModal(null);

      const total = list.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

      await apiService.updateMasterProfile({
        [listKey]: list,
        [summaryKey]: total.toString(),
      });

      // Brief delay for backend recalculation & scores refresh
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await loadData();
      showToast('Portfolio updated and synced!');
    } catch (err: any) {
      showToast(`Error: ${err?.message || 'Failed to update'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const p = data ?? calculateInvestmentPillar(null, null);

  const portfolioRows = [
    {
      label: 'Stock',
      amount: p.equity,
      tag: 'High Growth',
      key: 'totalEquityInvestments',
      dotBg: 'bg-blue-500',
      colorText: 'text-blue-600 dark:text-blue-400',
      barBg: 'bg-gradient-to-r from-blue-600 to-sky-400',
      shadowClass: 'shadow-[0_0_12px_rgba(59,130,246,0.4)]',
    },
    {
      label: 'Mutual Fund',
      amount: p.debt,
      tag: 'Stability',
      key: 'totalDebtInvestments',
      dotBg: 'bg-orange-500',
      colorText: 'text-orange-600 dark:text-orange-400',
      barBg: 'bg-gradient-to-r from-orange-600 to-amber-400',
      shadowClass: 'shadow-[0_0_12px_rgba(249,115,22,0.4)]',
    },
    {
      label: 'Gold',
      amount: p.gold,
      tag: 'Hedge',
      key: 'totalGoldInvestments',
      dotBg: 'bg-amber-500',
      colorText: 'text-amber-600 dark:text-amber-400',
      barBg: 'bg-gradient-to-r from-amber-500 to-yellow-400',
      shadowClass: 'shadow-[0_0_12px_rgba(245,158,11,0.4)]',
    },
    {
      label: 'Real Estate',
      amount: p.realEstate,
      tag: 'Passive Assets',
      key: 'totalRealEstateInvestments',
      dotBg: 'bg-purple-500',
      colorText: 'text-purple-600 dark:text-purple-400',
      barBg: 'bg-gradient-to-r from-purple-600 to-pink-400',
      shadowClass: 'shadow-[0_0_12px_rgba(168,85,247,0.4)]',
    },
  ];

  return (
    <div className="w-full px-8 lg:px-10 py-6 space-y-6">
      {/* Invisible SEO / Title element */}
      <h1 className="sr-only" data-testid="investments-page-title">
        Investment Analysis
      </h1>

      {/* 1. SCORE HEADER CARD */}
      <div
        data-testid="investments-score-header"
        className="relative overflow-hidden p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#0B0D1B] border border-slate-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
      >
        {/* Subtle Ambient Glow on the Right */}
        <div className="hidden dark:block absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-cyan-900/20 via-indigo-900/10 to-transparent pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/15 border border-cyan-500/25 dark:border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              GLOBAL PILLAR SCORE
            </div>
            <div className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white mt-0.5 leading-none tracking-tight">
              {Math.round(p.investmentScore)}
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-medium">
              {p.investmentScore >= 70
                ? 'Your portfolio allocation is on track'
                : 'Boost your regular SIPs and balance equity-debt ratio'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 relative z-10 self-end sm:self-center">
          {/* Asset Mix Circle */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full border-2 border-[#0284C7] dark:border-[#38BDF8] flex items-center justify-center text-base font-black text-slate-900 dark:text-white bg-sky-50 dark:bg-sky-950/30 shadow-[0_0_15px_rgba(56,189,248,0.25)]">
              {Math.round(p.assetBalanceScore)}
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mt-1.5">
              Asset Mix
            </span>
          </div>

          {/* SIP Health Circle */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full border-2 border-[#059669] dark:border-[#10B981] flex items-center justify-center text-base font-black text-slate-900 dark:text-white bg-emerald-50 dark:bg-emerald-950/30 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
              {Math.round(p.sipScore)}
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mt-1.5">
              SIP Health
            </span>
          </div>
        </div>
      </div>

      {/* 2. PORTFOLIO BREAKDOWN */}
      <div>
        <SectionLabel label="PORTFOLIO BREAKDOWN" />
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0B0D1B] border border-slate-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-xl space-y-5">
          {/* Top row */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Total Wealth Assets</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Cumulative portfolio value across all asset classes</p>
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-black text-[#059669] dark:text-[#10B981] tracking-tight">
              {formatInr(p.totalInvested)}
            </span>
          </div>

          <div className="border-t border-slate-100 dark:border-white/[0.06]" />

          {/* 4 Asset rows */}
          <div className="space-y-3.5">
            {portfolioRows.map((row) => (
              <div key={row.key} className="flex items-center justify-between gap-4 pl-1">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full ${row.dotBg} shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.6)]`} />
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {row.label}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      {row.tag}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {formatInr(row.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => openQuickEdit(row.label, row.key, row.amount)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                    title={`Edit ${row.label}`}
                    aria-label={`Edit ${row.label}`}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. ALLOCATION HEALTH */}
      <div>
        <SectionLabel label="ALLOCATION HEALTH" />
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0B0D1B] border border-slate-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-xl space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/25 dark:border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <PieChart className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Allocation Breakdown
            </h3>
          </div>

          <div className="space-y-4 pt-1">
            {portfolioRows.map((row) => {
              const pct = p.totalInvested > 0 ? (row.amount / p.totalInvested) * 100 : 0;
              return (
                <div key={`alloc-${row.key}`} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-zinc-300">
                      {row.label}
                    </span>
                    <span className={`font-black ${row.colorText}`}>
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 dark:bg-[#121528] border border-slate-200/60 dark:border-white/[0.06] rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full ${row.barBg} ${row.shadowClass} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(100, Math.max(1, pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. SIP ANALYSIS */}
      <div>
        <SectionLabel label="SIP ANALYSIS" />
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0B0D1B] border border-slate-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-xl space-y-5">
          {/* Top row */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/25 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Monthly SIP Contribution</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Active automated systematic investments</p>
              </div>
            </div>
            <span className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 shrink-0">
              {formatInr(p.monthlySipTotal)}
            </span>
          </div>

          <div className="border-t border-slate-100 dark:border-white/[0.06]" />

          <div className="space-y-3.5">
            {/* Mutual Fund SIP */}
            <div className="flex items-center justify-between gap-4 pl-1">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Mutual Fund SIP
                </span>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                  {formatInr(p.sipDebt)}
                </span>
                <button
                  type="button"
                  onClick={() => openManageSip('Mutual Fund SIP', 'mfSips', 'monthlySipDebt', p.mfSips)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-orange-600 dark:text-orange-400 transition-all cursor-pointer"
                  title="Manage Mutual Fund SIP"
                  aria-label="Manage Mutual Fund SIP"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Gold SIP */}
            <div className="flex items-center justify-between gap-4 pl-1">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Gold SIP
                </span>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  {formatInr(p.sipGold)}
                </span>
                <button
                  type="button"
                  onClick={() => openManageSip('Gold SIP', 'goldSips', 'monthlySipGold', p.goldSips)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-amber-600 dark:text-amber-400 transition-all cursor-pointer"
                  title="Manage Gold SIP"
                  aria-label="Manage Gold SIP"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-white/[0.06]" />

          {/* Monthly Shortfall */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
              Monthly Shortfall (Gap)
            </span>
            <span className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 shrink-0">
              {formatInr(p.sipGap)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-3 w-full bg-slate-100 dark:bg-[#121528] border border-slate-200/60 dark:border-white/[0.06] rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full ${
                (p.sipProgress || 0) >= 0.8
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  : 'bg-gradient-to-r from-amber-500 to-rose-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
              } rounded-full transition-all duration-500`}
              style={{
                width: `${Math.min(100, Math.max(5, (p.sipProgress || 0) * 100))}%`,
              }}
            />
          </div>

          {/* Message under progress */}
          <div className="text-xs text-slate-500 dark:text-zinc-400 italic">
            {(p.sipProgress || 0) >= 1
              ? 'Excellent! You are meeting your 20% savings target.'
              : `Increase your monthly SIP by ${formatInr(p.sipGap)} to reach your financial potential.`}
          </div>
        </div>
      </div>

      {/* 5. Optimize Now Button */}
      <button
        type="button"
        data-testid="investments-optimize-btn"
        onClick={() => navigate('/master-data?target=investment')}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#4338CA] hover:from-[#4338CA] hover:to-[#3730A3] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
      >
        <Sparkles className="w-4 h-4" />
        <span>Optimize Now</span>
      </button>

      {/* 6. Manage SIP Modal */}
      {activeSipModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#0B0D1B] border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Manage {activeSipModal.title}
              </h3>
              <button
                type="button"
                onClick={() =>
                  setActiveSipModal((prev) =>
                    prev
                      ? { ...prev, list: [...prev.list, { name: '', amount: '0', date: 1 }] }
                      : null
                  )
                }
                className="p-1 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
                title="Add SIP"
                aria-label="Add SIP"
              >
                <PlusCircle className="w-5 h-5" />
              </button>
            </div>

            {activeSipModal.list.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
                No SIPs added yet.
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[50vh] pr-1 py-1">
                {activeSipModal.list.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {/* Fund Name Input */}
                    <input
                      type="text"
                      placeholder="Fund Name"
                      value={item.name}
                      onChange={(e) => updateSipItem(idx, 'name', e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121528] text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />

                    {/* Amount Input with ₹ prefix */}
                    <div className="relative w-24 sm:w-28 shrink-0">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-400 text-xs font-semibold">
                        ₹
                      </span>
                      <input
                        type="number"
                        placeholder="Amount"
                        value={item.amount}
                        onChange={(e) => updateSipItem(idx, 'amount', e.target.value)}
                        className="w-full pl-6 pr-2 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121528] text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Date Selector */}
                    <div className="flex flex-col items-center shrink-0">
                      <span className="text-[8px] font-bold text-slate-400 dark:text-zinc-500">
                        DATE
                      </span>
                      <select
                        value={item.date}
                        onChange={(e) => updateSipItem(idx, 'date', Number(e.target.value))}
                        className="px-1.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121528] text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => removeSipItem(idx)}
                      className="p-1 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0 cursor-pointer"
                      title="Remove SIP"
                      aria-label="Remove SIP"
                    >
                      <MinusCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSaveSipList}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.99] cursor-pointer"
              >
                Save & Sync Portfolio
              </button>
              <button
                type="button"
                onClick={() => setActiveSipModal(null)}
                className="w-full py-2 text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Quick Edit Modal */}
      {editField && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#0B0D1B] border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Update {editField.title}
            </h3>
            <form onSubmit={handleQuickEditSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  New Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-400 text-sm font-semibold">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121528] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="Enter amount"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditField(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 cursor-pointer"
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
