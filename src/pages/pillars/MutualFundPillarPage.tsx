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
  TrendingUp,
  Briefcase,
  Layers,
  Coins,
  Link2,
  Edit3,
  Sparkles,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';

const SectionHeader: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 pl-1 mb-2.5">
    {icon}
    <span>{label}</span>
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
      dotBg: 'bg-[#38BDF8]',
      glowClass: 'shadow-[0_0_8px_rgba(56,189,248,0.6)]',
      colorText: 'text-[#38BDF8]',
      barBg: 'bg-gradient-to-r from-blue-600 to-sky-400',
      shadowClass: 'shadow-[0_0_12px_rgba(56,189,248,0.6)]',
    },
    {
      label: 'Mutual Fund',
      amount: p.debt,
      tag: 'Stability',
      key: 'totalDebtInvestments',
      dotBg: 'bg-[#FB923C]',
      glowClass: 'shadow-[0_0_8px_rgba(251,146,60,0.6)]',
      colorText: 'text-[#FB923C]',
      barBg: 'bg-gradient-to-r from-orange-600 to-amber-400',
      shadowClass: 'shadow-[0_0_12px_rgba(251,146,60,0.6)]',
    },
    {
      label: 'Gold',
      amount: p.gold,
      tag: 'Hedge',
      key: 'totalGoldInvestments',
      dotBg: 'bg-[#FBBF24]',
      glowClass: 'shadow-[0_0_8px_rgba(251,191,36,0.6)]',
      colorText: 'text-[#FBBF24]',
      barBg: 'bg-gradient-to-r from-amber-500 to-yellow-400',
      shadowClass: 'shadow-[0_0_12px_rgba(251,191,36,0.6)]',
    },
    {
      label: 'Real Estate',
      amount: p.realEstate,
      tag: 'Passive Assets',
      key: 'totalRealEstateInvestments',
      dotBg: 'bg-[#A855F7]',
      glowClass: 'shadow-[0_0_8px_rgba(168,85,247,0.6)]',
      colorText: 'text-[#A855F7]',
      barBg: 'bg-gradient-to-r from-purple-600 to-pink-400',
      shadowClass: 'shadow-[0_0_12px_rgba(168,85,247,0.6)]',
    },
  ];

  return (
    <div className="w-full px-4 sm:px-8 lg:px-10 py-6 space-y-5 max-w-7xl mx-auto">
      {/* Invisible SEO / Title element */}
      <h1 className="sr-only" data-testid="investments-page-title">
        Investment Analysis
      </h1>

      {/* 1. SCORE HEADER CARD */}
      <div
        data-testid="investments-score-header"
        className="relative overflow-hidden p-5 sm:p-7 rounded-[24px] bg-[#0A0B1A]/95 border border-indigo-500/30 shadow-[0_4px_30px_rgba(0,0,0,0.6),0_0_25px_rgba(99,102,241,0.15)] flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-purple-900/20 via-indigo-900/10 to-transparent pointer-events-none" />

        {/* Left: Icon Box + Score Details */}
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1E40AF] border border-blue-400/40 shadow-[0_0_20px_rgba(37,99,235,0.45)] flex items-center justify-center shrink-0">
            <TrendingUp className="w-7 h-7 text-white drop-shadow-sm" />
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
              GLOBAL PILLAR SCORE
            </div>
            <div className="text-4xl sm:text-5xl font-black text-white mt-1 leading-none tracking-tight">
              {Math.round(p.investmentScore)}
            </div>
          </div>
        </div>

        {/* Glowing Background Wave Graphic spanning from center across to rings */}
        <div className="absolute inset-y-0 left-[26%] right-0 hidden md:block pointer-events-none select-none overflow-hidden">
          <svg
            className="w-full h-full"
            viewBox="0 0 700 130"
            fill="none"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="invWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
                <stop offset="30%" stopColor="#818CF8" stopOpacity="0.85" />
                <stop offset="65%" stopColor="#A855F7" stopOpacity="1" />
                <stop offset="100%" stopColor="#D946EF" stopOpacity="0.85" />
              </linearGradient>
              <linearGradient id="invWaveFill" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#A855F7" stopOpacity="0.22" />
                <stop offset="60%" stopColor="#6366F1" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="invWaveSecondary" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#818CF8" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#A855F7" stopOpacity="0.2" />
              </linearGradient>
              <filter id="invWaveGlow" x="-20%" y="-30%" width="140%" height="160%">
                <feGaussianBlur stdDeviation="4.5" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Translucent ambient wave fill under main curve */}
            <path
              d="M 0 115 C 130 110, 200 85, 300 50 C 390 18, 470 18, 540 40 C 600 58, 650 55, 700 35 L 700 130 L 0 130 Z"
              fill="url(#invWaveFill)"
            />
            {/* Secondary subtle wave ribbon */}
            <path
              d="M 0 120 C 140 115, 230 95, 320 65 C 410 38, 490 35, 560 55 C 620 72, 665 65, 700 45"
              fill="none"
              stroke="url(#invWaveSecondary)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Primary glowing neon crest wave */}
            <path
              d="M 0 115 C 130 110, 200 85, 300 50 C 390 18, 470 18, 540 40 C 600 58, 650 55, 700 35"
              fill="none"
              stroke="url(#invWaveGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              filter="url(#invWaveGlow)"
            />
          </svg>
        </div>

        {/* Right: Asset Mix & SIP Health Score Rings */}
        <div className="flex items-center gap-6 relative z-10 self-end sm:self-center">
          {/* Asset Mix Ring */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full border-2 border-[#38BDF8] flex items-center justify-center text-base font-black text-white bg-[#071324] shadow-[0_0_18px_rgba(56,189,248,0.35)]">
              {Math.round(p.assetBalanceScore)}
            </div>
            <span className="text-[11px] font-bold text-zinc-400 mt-1.5">
              Asset Mix
            </span>
          </div>

          {/* SIP Health Ring */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full border-2 border-[#10B981] flex items-center justify-center text-base font-black text-white bg-[#052018] shadow-[0_0_18px_rgba(16,185,129,0.35)]">
              {Math.round(p.sipScore)}
            </div>
            <span className="text-[11px] font-bold text-zinc-400 mt-1.5">
              SIP Health
            </span>
          </div>
        </div>
      </div>

      {/* 2. PORTFOLIO BREAKDOWN & ALLOCATION HEALTH (2-Col Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Column 1: PORTFOLIO BREAKDOWN */}
        <div>
          <SectionHeader
            icon={<Briefcase className="w-4 h-4 text-purple-400" />}
            label="PORTFOLIO BREAKDOWN"
          />
          <div className="p-5 sm:p-6 rounded-[24px] bg-[#0A0B1A]/95 border border-white/[0.08] shadow-lg backdrop-blur-md space-y-4">
            {/* Total Wealth Assets Row */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/35 flex items-center justify-center text-blue-400 shrink-0 shadow-[0_0_12px_rgba(59,130,246,0.2)]">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="text-sm font-bold text-white">
                  Total Wealth Assets
                </div>
              </div>
              <span className="text-xl sm:text-2xl font-black text-[#38BDF8] tracking-tight">
                {formatInr(p.totalInvested)}
              </span>
            </div>

            <div className="border-t border-white/[0.06]" />

            {/* 4 Asset Rows */}
            <div className="space-y-3">
              {portfolioRows.map((row) => (
                <div key={row.key} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${row.dotBg} shrink-0 ${row.glowClass}`} />
                    <div>
                      <div className="text-sm font-bold text-white">
                        {row.label}
                      </div>
                      <div className="text-xs text-zinc-400">
                        {row.tag}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-sm sm:text-base font-bold text-white">
                      {formatInr(row.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => openQuickEdit(row.label, row.key, row.amount)}
                      className="p-1.5 rounded-lg bg-white/[0.05] border border-white/10 hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
                      title={`Edit ${row.label}`}
                      aria-label={`Edit ${row.label}`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2: ALLOCATION HEALTH */}
        <div>
          <SectionHeader
            icon={<Layers className="w-4 h-4 text-purple-400" />}
            label="ALLOCATION HEALTH"
          />
          <div className="p-5 sm:p-6 rounded-[24px] bg-[#0A0B1A]/95 border border-white/[0.08] shadow-lg backdrop-blur-md space-y-4">
            <span className="sr-only">Allocation Breakdown</span>
            {portfolioRows.map((row) => {
              const pct = p.totalInvested > 0 ? (row.amount / p.totalInvested) * 100 : 0;
              return (
                <div key={`alloc-${row.key}`} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">
                      {row.label}
                    </span>
                    <span className={`font-black ${row.colorText}`}>
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-zinc-800/80 rounded-full overflow-hidden shadow-inner">
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

      {/* 3. SIP ANALYSIS (Full Width) */}
      <div>
        <SectionHeader
          icon={<Coins className="w-4 h-4 text-purple-400" />}
          label="SIP ANALYSIS"
        />
        <div className="p-5 sm:p-6 rounded-[24px] bg-[#0A0B1A]/95 border border-white/[0.08] shadow-lg backdrop-blur-md">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            {/* Left Column: Monthly SIP Contribution & Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/35 flex items-center justify-center text-blue-400 shrink-0 shadow-[0_0_12px_rgba(59,130,246,0.2)]">
                    <Link2 className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-white">
                    Monthly SIP Contribution
                  </span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-[#38BDF8] tracking-tight">
                  {formatInr(p.monthlySipTotal)}
                </span>
              </div>

              <div className="space-y-3 pt-1">
                {/* Mutual Fund SIP */}
                <div className="flex items-center justify-between gap-4 pl-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FB923C] shrink-0 shadow-[0_0_8px_rgba(251,146,60,0.6)]" />
                    <span className="text-sm font-bold text-white">
                      Mutual Fund SIP
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-sm sm:text-base font-bold text-orange-400">
                      {formatInr(p.sipDebt)}
                    </span>
                    <button
                      type="button"
                      onClick={() => openManageSip('Mutual Fund SIP', 'mfSips', 'monthlySipDebt', p.mfSips)}
                      className="p-1.5 rounded-lg bg-white/[0.05] border border-white/10 hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
                      title="Manage Mutual Fund SIP"
                      aria-label="Manage Mutual Fund SIP"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Gold SIP */}
                <div className="flex items-center justify-between gap-4 pl-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FBBF24] shrink-0 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                    <span className="text-sm font-bold text-white">
                      Gold SIP
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-sm sm:text-base font-bold text-amber-400">
                      {formatInr(p.sipGold)}
                    </span>
                    <button
                      type="button"
                      onClick={() => openManageSip('Gold SIP', 'goldSips', 'monthlySipGold', p.goldSips)}
                      className="p-1.5 rounded-lg bg-white/[0.05] border border-white/10 hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
                      title="Manage Gold SIP"
                      aria-label="Manage Gold SIP"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Monthly Shortfall (Gap) */}
            <div className="lg:border-l lg:border-white/[0.08] lg:pl-6 space-y-3.5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-bold text-[#F43F5E]">
                  Monthly Shortfall (Gap)
                </span>
                <span className="text-xl sm:text-2xl font-black text-[#F43F5E] tracking-tight">
                  {formatInr(p.sipGap)}
                </span>
              </div>

              {/* Shortfall Progress Bar */}
              <div className="h-2.5 w-full bg-zinc-800/80 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]"
                  style={{
                    width: `${Math.min(100, Math.max(5, (p.sipProgress || 0) * 100))}%`,
                  }}
                />
              </div>

              {/* Footnote text */}
              <div className="text-xs text-zinc-400 italic">
                Increase your monthly SIP by {formatInr(p.sipGap)} to reach your financial potential.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. OPTIMIZE NOW Button */}
      <button
        type="button"
        data-testid="investments-optimize-btn"
        onClick={() => navigate('/master-data?target=investment')}
        className="w-full py-4 rounded-[20px] bg-gradient-to-r from-[#6366F1] via-[#7C3AED] to-[#9333EA] hover:opacity-95 text-white font-black text-xs uppercase tracking-widest shadow-[0_0_25px_rgba(124,58,237,0.4)] transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
      >
        <Sparkles className="w-4 h-4" />
        <span>OPTIMIZE NOW</span>
      </button>

      {/* Quick Edit Modal */}
      {editField && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0B0D1B] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              Update {editField.title}
            </h3>
            <form onSubmit={handleQuickEditSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/10 bg-[#121528] text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-zinc-600"
                    placeholder="Enter amount"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditField(null)}
                  className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-black text-xs shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  {isUpdating ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage SIP Modal */}
      {activeSipModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0B0D1B] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-base sm:text-lg font-bold text-white">
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
                className="p-1 rounded-lg text-indigo-400 hover:bg-white/[0.05] transition-colors cursor-pointer"
                title="Add SIP"
                aria-label="Add SIP"
              >
                <PlusCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {activeSipModal.list.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-400">
                  No SIPs added. Click the + button above to add one.
                </div>
              ) : (
                activeSipModal.list.map((item, index) => (
                  <div
                    key={`sip-${index}`}
                    className="p-3 rounded-xl border border-white/10 bg-[#121528] space-y-2 relative group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        placeholder="Fund or Asset Name"
                        value={item.name}
                        onChange={(e) => updateSipItem(index, 'name', e.target.value)}
                        className="bg-transparent border-b border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 w-full pb-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeSipItem(index)}
                        className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                        title="Remove SIP"
                        aria-label="Remove SIP"
                      >
                        <MinusCircle className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-0.5">Amount (₹)</label>
                        <input
                          type="number"
                          placeholder="Amount"
                          value={item.amount}
                          onChange={(e) => updateSipItem(index, 'amount', e.target.value)}
                          className="w-full px-2 py-1 rounded bg-[#0A0B1A] border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-0.5">SIP Date (1-31)</label>
                        <input
                          type="number"
                          min={1}
                          max={31}
                          placeholder="Date"
                          value={item.date}
                          onChange={(e) => updateSipItem(index, 'date', e.target.value)}
                          className="w-full px-2 py-1 rounded bg-[#0A0B1A] border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setActiveSipModal(null)}
                className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSipList}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-black text-xs shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                Save & Sync Portfolio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MutualFundPillarPage;
