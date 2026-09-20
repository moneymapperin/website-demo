import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import {
  calculateInsurancePillar,
  formatInsuranceCompact,
  InsurancePillarData,
} from '../../models/pillars/insurance';

export const InsurancePillarPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InsurancePillarData | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [dashboard, profileRes] = await Promise.all([
          apiService.getDashboard().catch(() => ({})),
          apiService.getMasterProfile().catch(() => ({ data: null })),
        ]);

        if (isMounted) {
          const calculated = calculateInsurancePillar(profileRes?.data, dashboard);
          setData(calculated);
        }
      } catch (err) {
        console.error('Error loading insurance pillar data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const p = data ?? calculateInsurancePillar(null, null);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* App Bar / Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 data-testid="insurance-page-title" className="text-2xl font-black tracking-tight text-[var(--color-text)]">
            Protection Analysis
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Life, health & asset coverage evaluation
          </p>
        </div>
      </div>

      {/* Score Header */}
      <div
        data-testid="insurance-score-header"
        className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between"
      >
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
            PROTECTION SCORE
          </span>
          <div className="text-4xl font-black text-emerald-500 mt-1">
            {p.protectionScore.toFixed(0)}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-2 border-blue-500/40 flex items-center justify-center font-black text-blue-500 text-sm">
              {p.termScore.toFixed(0)}
            </div>
            <span className="text-[10px] font-bold text-gray-400 mt-1">Life</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-2 border-teal-500/40 flex items-center justify-center font-black text-teal-500 text-sm">
              {p.healthScore.toFixed(0)}
            </div>
            <span className="text-[10px] font-bold text-gray-400 mt-1">Health</span>
          </div>
        </div>
      </div>

      {/* Active Coverage */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-400 px-1">
          ACTIVE COVERAGE
        </h2>
        <div className="p-6 rounded-3xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <div>
                <div className="text-sm font-bold text-[var(--color-text)]">Term Insurance</div>
                <div className="text-xs text-gray-400">Life Protection</div>
              </div>
            </div>
            <div className="text-sm font-black text-[var(--color-text)]">
              {p.hasProfileData ? formatInsuranceCompact(p.termCover) : 'not available'}
            </div>
          </div>

          <div className="border-t border-[var(--color-border)]/50" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-teal-500" />
              <div>
                <div className="text-sm font-bold text-[var(--color-text)]">Health Insurance</div>
                <div className="text-xs text-gray-400">Medical Shield</div>
              </div>
            </div>
            <div className="text-sm font-black text-[var(--color-text)]">
              {p.hasProfileData ? formatInsuranceCompact(p.healthCover) : 'not available'}
            </div>
          </div>
        </div>
      </div>

      {/* Coverage Health */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-400 px-1">
          PROTECTION HEALTH
        </h2>
        <div className="p-6 rounded-3xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm space-y-5">
          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-[var(--color-text)]">Life Cover Score</span>
              <span className="text-blue-500 font-black">{p.termScore.toFixed(0)}/100</span>
            </div>
            <div className="h-2.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(1, p.termScore))}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-[var(--color-text)]">Health Cover Score</span>
              <span className="text-teal-500 font-black">{p.healthScore.toFixed(0)}/100</span>
            </div>
            <div className="h-2.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(1, p.healthScore))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Shortfall Analysis */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-400 px-1">
          SHORTFALL ANALYSIS
        </h2>
        <div className="p-6 rounded-3xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[var(--color-text)]">Term & Life Gap</span>
            <span
              className={`text-sm font-black ${
                p.termGap > 0 ? 'text-rose-500' : 'text-emerald-500'
              }`}
            >
              Shortfall: {p.hasProfileData ? formatInsuranceCompact(p.termGap) : 'not available'}
            </span>
          </div>

          <div className="border-t border-[var(--color-border)]/50" />

          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[var(--color-text)]">Health Gap</span>
            <span
              className={`text-sm font-black ${
                p.healthGap > 0 ? 'text-rose-500' : 'text-emerald-500'
              }`}
            >
              Shortfall: {p.hasProfileData ? formatInsuranceCompact(p.healthGap) : 'not available'}
            </span>
          </div>
        </div>
      </div>

      {/* Optimize Button */}
      <button
        type="button"
        data-testid="insurance-optimize-btn"
        onClick={() => navigate('/master-data?target=insurance')}
        className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg hover:shadow-emerald-500/25 transition-all active:scale-98 flex items-center justify-center gap-2"
      >
        <span>⚡</span> Optimize Now
      </button>
    </div>
  );
};
