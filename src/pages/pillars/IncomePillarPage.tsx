import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { useToast } from '../../context/ToastContext';
import {
  calculateIncomePillar,
  formatIncomeCompact,
  IncomePillarData,
} from '../../models/pillars/income';

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
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const p = data ?? calculateIncomePillar(null);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* App Bar / Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 data-testid="income-page-title" className="text-2xl font-black tracking-tight text-[var(--color-text)]">
            Income Analysis
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Active vs passive earnings, city benchmarks & distribution
          </p>
        </div>
      </div>

      {/* Score Header */}
      <div
        data-testid="income-score-header"
        className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between"
      >
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
            INCOME SCORE
          </span>
          <div className="text-4xl font-black text-emerald-500 mt-1">
            {p.finalPillarScore}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-2 border-emerald-500/40 flex items-center justify-center font-black text-emerald-500 text-sm">
              {p.activeScore.toFixed(0)}
            </div>
            <span className="text-[10px] font-bold text-gray-400 mt-1">Active</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-2 border-amber-500/40 flex items-center justify-center font-black text-amber-500 text-sm">
              {p.passiveScore.toFixed(0)}
            </div>
            <span className="text-[10px] font-bold text-gray-400 mt-1">Passive</span>
          </div>
        </div>
      </div>

      {/* Earnings Overview */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-400 px-1">
          EARNINGS OVERVIEW
        </h2>
        <div className="p-6 rounded-3xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-400">Total Monthly Income</span>
            <span className="text-xl font-black text-emerald-500">
              {p.hasProfileData ? formatIncomeCompact(p.totalIncome) : 'not available'}
            </span>
          </div>

          <div className="border-t border-[var(--color-border)]/50" />

          {/* Active Income Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <div>
                <div className="text-sm font-bold text-[var(--color-text)]">Active Income</div>
                <div className="text-xs text-gray-400">Salary, Business, Freelance</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-black text-[var(--color-text)]">
                  {p.hasProfileData ? formatIncomeCompact(p.activeIncome) : 'not available'}
                </div>
                {p.hasProfileData && (
                  <div className="text-[10px] font-bold text-emerald-500">
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
                className="p-1 text-emerald-500 hover:text-emerald-400 text-sm"
                title="Edit Active Income"
              >
                ✏️
              </button>
            </div>
          </div>

          <div className="border-t border-[var(--color-border)]/50" />

          {/* Passive Income Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div>
                <div className="text-sm font-bold text-[var(--color-text)]">Passive Income</div>
                <div className="text-xs text-gray-400">Rent, Dividends, Interest</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-black text-[var(--color-text)]">
                  {p.hasProfileData ? formatIncomeCompact(p.passiveIncome) : 'not available'}
                </div>
                {p.hasProfileData && (
                  <div className="text-[10px] font-bold text-amber-500">
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
                className="p-1 text-amber-500 hover:text-amber-400 text-sm"
                title="Edit Passive Income"
              >
                ✏️
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Income Mix Health */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-400 px-1">
          INCOME MIX HEALTH
        </h2>
        <div className="p-6 rounded-3xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm space-y-5">
          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-[var(--color-text)]">Active Source</span>
              <span className="text-emerald-500 font-black">{p.activeSharePct.toFixed(1)}%</span>
            </div>
            <div className="h-2.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(1, p.activeSharePct))}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-[var(--color-text)]">Passive Source</span>
              <span className="text-amber-500 font-black">{p.passiveSharePct.toFixed(1)}%</span>
            </div>
            <div className="h-2.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(1, p.passiveSharePct))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Distribution Status */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-400 px-1">
          DISTRIBUTION STATUS
        </h2>
        <div className="p-6 rounded-3xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm space-y-4">
          <div className="text-sm font-bold text-[var(--color-text)]">Distribution Health</div>

          {/* Gradient Track with Pin Indicator */}
          <div className="relative py-2">
            <div className="h-3 w-full rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500" />
            <div
              className="absolute top-1/2 -translate-y-1/2 -ml-2.5 w-5 h-5 rounded-full bg-white border-2 border-black shadow-md transition-all duration-500"
              style={{
                left: `${Math.min(100, Math.max(0, p.finalPillarScore))}%`,
              }}
            />
          </div>

          <p className="text-xs italic text-[var(--color-text-secondary)]">
            {p.finalPillarScore >= 75
              ? 'Excellent! Your income streams are well diversified.'
              : 'Strategy: Aim for passive income to reach at least 25% of your total earnings.'}
          </p>
        </div>
      </div>

      {/* Optimize Button */}
      <button
        type="button"
        data-testid="income-optimize-btn"
        onClick={() => navigate('/master-data?target=income')}
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
