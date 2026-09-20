import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { useToast } from '../../context/ToastContext';
import {
  calculateInvestmentPillar,
  formatInr,
  InvestmentPillarData,
} from '../../models/pillars/investments';

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
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const p = data ?? calculateInvestmentPillar(null, null);

  const assetList = [
    { label: 'Stock', amount: p.equity, color: 'text-blue-500', bg: 'bg-blue-500', tag: 'High Growth', key: 'totalEquityInvestments' },
    { label: 'Mutual Fund', amount: p.debt, color: 'text-amber-500', bg: 'bg-amber-500', tag: 'Stability', key: 'totalDebtInvestments' },
    { label: 'Gold', amount: p.gold, color: 'text-yellow-500', bg: 'bg-yellow-500', tag: 'Hedge', key: 'totalGoldInvestments' },
    { label: 'Real Estate', amount: p.realEstate, color: 'text-purple-500', bg: 'bg-purple-500', tag: 'Passive Assets', key: 'totalRealEstateInvestments' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* App Bar / Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 data-testid="investments-page-title" className="text-2xl font-black tracking-tight text-[var(--color-text)]">
            Investment Analysis
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Portfolio asset mix, SIP contributions & target gap
          </p>
        </div>
      </div>

      {/* Score Header */}
      <div
        data-testid="investments-score-header"
        className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between"
      >
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
            GLOBAL PILLAR SCORE
          </span>
          <div className="text-4xl font-black text-emerald-500 mt-1">
            {p.investmentScore.toFixed(0)}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-2 border-blue-500/40 flex items-center justify-center font-black text-blue-500 text-sm">
              {p.assetBalanceScore.toFixed(0)}
            </div>
            <span className="text-[10px] font-bold text-gray-400 mt-1">Asset Mix</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-2 border-emerald-500/40 flex items-center justify-center font-black text-emerald-500 text-sm">
              {p.sipScore.toFixed(0)}
            </div>
            <span className="text-[10px] font-bold text-gray-400 mt-1">SIP Health</span>
          </div>
        </div>
      </div>

      {/* Portfolio Breakdown */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-400 px-1">
          PORTFOLIO BREAKDOWN
        </h2>
        <div className="p-6 rounded-3xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-400">Total Wealth Assets</span>
            <span className="text-xl font-black text-emerald-500">
              {p.hasProfileData ? formatInr(p.totalInvested) : 'not available'}
            </span>
          </div>

          <div className="border-t border-[var(--color-border)]/50" />

          {assetList.map((asset) => (
            <div key={asset.key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${asset.bg}`} />
                <div>
                  <div className="text-sm font-bold text-[var(--color-text)]">{asset.label}</div>
                  <div className="text-xs text-gray-400">{asset.tag}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm font-black text-[var(--color-text)]">
                  {p.hasProfileData ? formatInr(asset.amount) : 'not available'}
                </div>
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
                  className={`p-1 ${asset.color} hover:opacity-75 text-sm`}
                  title={`Edit ${asset.label}`}
                >
                  ✏️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Allocation Health */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-400 px-1">
          ALLOCATION HEALTH
        </h2>
        <div className="p-6 rounded-3xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm space-y-5">
          {assetList.map((asset) => {
            const pct = p.totalInvested > 0 ? (asset.amount / p.totalInvested) * 100 : 0;
            return (
              <div key={`alloc-${asset.key}`}>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-[var(--color-text)]">{asset.label}</span>
                  <span className={`${asset.color} font-black`}>
                    {p.hasProfileData ? `${pct.toFixed(1)}%` : 'not available'}
                  </span>
                </div>
                <div className="h-2.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${asset.bg} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(100, Math.max(1, pct))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SIP Analysis */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-400 px-1">
          SIP ANALYSIS
        </h2>
        <div className="p-6 rounded-3xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[var(--color-text)]">
              Monthly SIP Contribution
            </span>
            <span className="text-base font-black text-emerald-500">
              {p.hasProfileData ? formatInr(p.monthlySipTotal) : 'not available'}
            </span>
          </div>

          <div className="border-t border-[var(--color-border)]/50" />

          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Mutual Fund SIP</span>
            <span className="font-bold text-amber-500">
              {p.hasProfileData ? formatInr(p.sipDebt) : 'not available'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Gold SIP</span>
            <span className="font-bold text-yellow-500">
              {p.hasProfileData ? formatInr(p.sipGold) : 'not available'}
            </span>
          </div>

          <div className="border-t border-[var(--color-border)]/50" />

          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-rose-500">Monthly Shortfall (Gap)</span>
            <span className="text-base font-black text-rose-500">
              {p.hasProfileData ? formatInr(p.sipGap) : 'not available'}
            </span>
          </div>

          {/* SIP Progress Bar */}
          <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                p.sipProgress >= 0.8 ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, p.sipProgress * 100))}%` }}
            />
          </div>

          <p className="text-xs italic text-[var(--color-text-secondary)]">
            {p.sipProgress >= 1.0
              ? 'Excellent! You are meeting your 20% savings target.'
              : `Increase your monthly SIP by ${formatInr(p.sipGap)} to reach your financial potential.`}
          </p>
        </div>
      </div>

      {/* Optimize Button */}
      <button
        type="button"
        data-testid="investments-optimize-btn"
        onClick={() => navigate('/master-data?target=investment')}
        className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg hover:shadow-emerald-500/25 transition-all active:scale-98 flex items-center justify-center gap-2"
      >
        <span>⚡</span> Optimize Now
      </button>

      {/* Quick Edit Modal */}
      {editField && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[var(--color-text)]">
              Update {editField.title}
            </h3>
            <form onSubmit={handleQuickEditSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">
                  New Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="Enter amount"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditField(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-[var(--color-text)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
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
