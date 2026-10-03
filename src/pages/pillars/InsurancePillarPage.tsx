import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Heart, Home, Car, Plus, ChevronRight, Sparkles, AlertCircle, TrendingUp, ArrowRight } from 'lucide-react';
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
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const p = data ?? calculateInsurancePillar(null, null);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. Top Hero Header & Quote Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 dark:from-[#2E1065] dark:via-[#1E0A45] dark:to-[#120D2C] text-white shadow-xl border border-indigo-400/20 dark:border-indigo-500/20 relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20 text-indigo-300">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 data-testid="insurance-page-title" className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Protection Analysis
            </h1>
            <p className="text-xs md:text-sm text-indigo-200/80">
              Life, health & asset coverage evaluation
            </p>
          </div>
        </div>

        {/* Right Quote Glass Banner */}
        <div className="relative z-10 max-w-md p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/10 text-indigo-300 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold italic text-indigo-100">
            &ldquo;The right insurance today, for a more secure tomorrow.&rdquo;
          </p>
        </div>
      </div>

      {/* 2. Score Header with 4 Mini Coverage Count Cards */}
      <div
        data-testid="insurance-score-header"
        className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm dark:shadow-xl transition-colors"
      >
        <div className="flex items-center gap-6">
          {/* Radial Circular Score Badge */}
          <div className="relative w-24 h-24 md:w-28 md:h-28 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-200 dark:text-indigo-950"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                className="text-indigo-600 dark:text-indigo-500 transition-all duration-700"
                fill="transparent"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * Math.min(100, Math.max(0, p.protectionScore))) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                {p.protectionScore.toFixed(0)}
              </span>
              <span className="text-[9px] font-bold text-slate-500 dark:text-indigo-300 uppercase tracking-wide">/ 100</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              PROTECTION HEALTH SCORE
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {p.protectionScore >= 75 ? 'Optimal Coverage' : p.protectionScore >= 50 ? 'Moderate Protection' : 'Needs Optimization'}
            </h2>
            <p className="text-xs text-slate-600 dark:text-zinc-300 mt-1 max-w-sm leading-relaxed">
              Your overall insurance health based on health, life term, vehicle, and asset policies.
            </p>
          </div>
        </div>

        {/* 4 Mini Coverage Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 text-center min-w-[100px]">
            <div className="w-7 h-7 mx-auto mb-1.5 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Heart className="w-4 h-4" />
            </div>
            <div className="text-sm font-black text-slate-900 dark:text-white">{p.hasProfileData ? formatInsuranceCompact(p.healthCover) : 'N/A'}</div>
            <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">Health</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 text-center min-w-[100px]">
            <div className="w-7 h-7 mx-auto mb-1.5 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Shield className="w-4 h-4" />
            </div>
            <div className="text-sm font-black text-slate-900 dark:text-white">{p.hasProfileData ? formatInsuranceCompact(p.lifeTermCover) : 'N/A'}</div>
            <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">Life Term</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 text-center min-w-[100px]">
            <div className="w-7 h-7 mx-auto mb-1.5 rounded-lg bg-pink-500/10 dark:bg-pink-500/20 flex items-center justify-center text-pink-600 dark:text-pink-400">
              <Car className="w-4 h-4" />
            </div>
            <div className="text-sm font-black text-slate-900 dark:text-white">{p.hasProfileData ? formatInsuranceCompact(p.vehicleCover) : 'N/A'}</div>
            <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">Vehicle</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 text-center min-w-[100px]">
            <div className="w-7 h-7 mx-auto mb-1.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Home className="w-4 h-4" />
            </div>
            <div className="text-sm font-black text-slate-900 dark:text-white">{p.hasProfileData ? formatInsuranceCompact(p.assetCover) : 'N/A'}</div>
            <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">Asset</div>
          </div>
        </div>
      </div>

      {/* 3. Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 Cols): Active Coverage & Shortfall */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Coverage List Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Active Coverage Summary</h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Current active insurance policies</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/master-data?target=insurance')}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Policy</span>
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                    <Heart className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">Health Insurance</div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400">Family Floater & Individual</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-slate-900 dark:text-white">{p.hasProfileData ? formatInsuranceCompact(p.healthCover) : 'not available'}</div>
                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Active</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">Life Term Insurance</div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400">Term Plan Coverage</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-slate-900 dark:text-white">{p.hasProfileData ? formatInsuranceCompact(p.lifeTermCover) : 'not available'}</div>
                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Active</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-pink-500/10 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400">
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">Vehicle Insurance</div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400">Comprehensive Motor Policy</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-slate-900 dark:text-white">{p.hasProfileData ? formatInsuranceCompact(p.vehicleCover) : 'not available'}</div>
                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Active</div>
                </div>
              </div>
            </div>
          </div>

          {/* Shortfall Analysis Card */}
          <div
            data-testid="insurance-shortfall-card"
            className="p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-4 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Shortfall Analysis</h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Identified coverage gaps in your portfolio</p>
                </div>
              </div>
              <span className="text-sm font-black text-rose-600 dark:text-rose-400">{formatInsuranceCompact(p.shortfall)}</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
              Your recommended coverage gap is {formatInsuranceCompact(p.shortfall)}. Optimize your policies to ensure adequate protection against health or term contingencies.
            </p>

            <button
              type="button"
              data-testid="insurance-optimize-btn"
              onClick={() => navigate('/master-data?target=insurance')}
              className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/25 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>⚡ Optimize Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column (5 Cols): Progress Bars & Recommendations */}
        <div className="lg:col-span-5 space-y-6">
          {/* Protection Health Progress Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-5 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Protection Health</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Coverage progress against targets</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-700 dark:text-zinc-300">Health Coverage</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-black">{(p.healthRatioPct ?? 0).toFixed(1)}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(1, p.healthRatioPct ?? 0))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-700 dark:text-zinc-300">Life Term Coverage</span>
                  <span className="text-purple-600 dark:text-purple-400 font-black">{(p.lifeTermRatioPct ?? 0).toFixed(1)}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 dark:bg-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(1, p.lifeTermRatioPct ?? 0))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-700 dark:text-zinc-300">Vehicle Coverage</span>
                  <span className="text-pink-600 dark:text-pink-400 font-black">{(p.vehicleRatioPct ?? 0).toFixed(1)}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pink-600 dark:bg-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(1, p.vehicleRatioPct ?? 0))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 shadow-sm dark:shadow-xl space-y-4 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Recommendations</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Tailored suggestions for protection</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Increase Term Life Coverage</div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">Aim for at least 10x annual income.</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Add Super Top-Up Health Plan</div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">Enhance medical limit cost-effectively.</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
