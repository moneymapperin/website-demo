import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Search, Lock, X, PieChart } from 'lucide-react';
import { apiService } from '../services/apiService';
import { usePlan } from '../hooks/usePlan';
import { useToast } from '../context/ToastContext';
import { ScoreCardAdvisor } from '../services/marketAdvisor';
import { ResilienceUtils } from '../services/resilienceUtils';

export const MutualFundScreenerPage: React.FC = () => {
  const navigate = useNavigate();
  const { isPro } = usePlan();
  const { showToast } = useToast();

  const [allFunds, setAllFunds] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCluster, setSelectedCluster] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  // Incremental rendering
  const [visibleCount, setVisibleCount] = useState(50);

  // Modal State
  const [selectedFundForAdvice, setSelectedFundForAdvice] = useState<any | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const funds = await apiService.getMutualFundSignals();
      setAllFunds(funds || []);

      const uniqueCats = Array.from(
        new Set((funds || []).map((f: any) => f.category?.toString() || 'Uncategorised'))
      ).sort() as string[];
      setCategories(['All', ...uniqueCats]);
    } catch (e) {
      console.error('Failed to fetch MF signals:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter logic matching Dart
  const filteredFunds = allFunds.filter((f) => {
    const q = searchQuery.toLowerCase();
    const nameMatch =
      !q ||
      (f.scheme_name?.toString().toLowerCase().includes(q) ?? false) ||
      (f.fund_house?.toString().toLowerCase().includes(q) ?? false);
    const clusterMatch = selectedCluster === 'All' || f.cluster === selectedCluster;
    const categoryMatch = selectedCategory === 'All' || f.category === selectedCategory;
    return nameMatch && clusterMatch && categoryMatch;
  });

  const displayList = filteredFunds.slice(0, visibleCount);

  const handleFundClick = (fund: any, index: number) => {
    const isLocked = !isPro && index > 0;
    if (isLocked) {
      showToast({
        message: 'Upgrade to PRO to unlock all daily signals! 🚀',
        backgroundColor: '#F59E0B',
        action: {
          label: 'UPGRADE',
          onClick: () => navigate('/subscription'),
        },
      });
      return;
    }
    setSelectedFundForAdvice(fund);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 text-slate-900 dark:text-white" data-testid="mf-screener-page">
      {/* App Bar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              data-testid="mf-back-button"
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-base font-black text-slate-900 dark:text-white">Mutual Fund Score Card</h1>
          </div>
          <button
            type="button"
            data-testid="mf-refresh-button"
            onClick={fetchData}
            className="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Refresh Funds"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* Search and Filters Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="relative">
            <div className={`relative ${!isPro ? 'filter blur-xs select-none' : ''}`}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                data-testid="mf-search-input"
                disabled={!isPro}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isPro ? 'Search fund or AMC...' : 'Search locked for Free users'}
                className="w-full pl-9 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {!isPro && (
              <div
                data-testid="mf-search-locked"
                onClick={() => navigate('/subscription')}
                className="absolute inset-0 flex items-center justify-center cursor-pointer"
              >
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[10px] font-black tracking-wider uppercase shadow-sm">
                  <Lock className="w-3 h-3" />
                  <span>PRO SEARCH</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">CLUSTER</label>
              <select
                data-testid="mf-cluster-select"
                disabled={!isPro}
                value={selectedCluster}
                onChange={(e) => setSelectedCluster(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none"
              >
                <option value="All">All Clusters</option>
                <option value="Conservative">Conservative</option>
                <option value="Moderate">Moderate</option>
                <option value="Aggressive">Aggressive</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">CATEGORY</label>
              <select
                data-testid="mf-category-select"
                disabled={!isPro}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Funds List */}
        {loading ? (
          <div className="py-20 text-center text-slate-400" data-testid="mf-loading-state">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="font-semibold text-sm">Loading funds...</p>
          </div>
        ) : displayList.length === 0 ? (
          <div className="py-16 text-center text-slate-400" data-testid="mf-empty-state">
            <p className="font-semibold text-sm">No funds match filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {!isPro && (
              <div
                data-testid="mf-pro-banner"
                onClick={() => navigate('/subscription')}
                className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-center gap-3 cursor-pointer"
              >
                <Lock className="w-4 h-4 shrink-0" />
                <p className="text-xs font-bold">
                  Free users see only 1 daily pick. Upgrade to PRO to see all Mutual Fund Score Card signals! 🚀
                </p>
              </div>
            )}

            {displayList.map((f, idx) => {
              const isLocked = !isPro && idx > 0;
              const confidence = f.confidence_level || 'Medium';
              const cluster = f.cluster || 'Moderate';
              const finalScore = Math.round(ResilienceUtils.safeDouble(f.final_score));
              const riskScore = Math.round(ResilienceUtils.safeDouble(f.risk_score));
              const growthScore = Math.round(ResilienceUtils.safeDouble(f.growth_score));
              const cagr3y = ResilienceUtils.safeDouble(f.cagr_3y).toFixed(1);

              return (
                <div
                  key={f.id || idx}
                  data-testid={`mf-card-${idx}`}
                  onClick={() => handleFundClick(f, idx)}
                  className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm cursor-pointer hover:border-indigo-400 transition-all"
                >
                  <div className={`space-y-4 ${isLocked ? 'filter blur-[5px] select-none pointer-events-none' : ''}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs">
                            <PieChart className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-black text-base text-slate-900 dark:text-white line-clamp-1">
                              {f.scheme_name || 'Unknown Fund'}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {f.category || ''} • {f.fund_house || ''}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                          {confidence}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
                          {cluster}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">SCORE</span>
                        <p className="text-base font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                          {finalScore}
                        </p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">RISK</span>
                        <p className="text-sm font-black text-rose-500 mt-0.5">{riskScore}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">GROWTH</span>
                        <p className="text-sm font-black text-emerald-500 mt-0.5">{growthScore}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">3Y CAGR</span>
                        <p className="text-sm font-black text-amber-500 mt-0.5">{cagr3y}%</p>
                      </div>
                    </div>
                  </div>

                  {isLocked && (
                    <div
                      data-testid={`mf-lock-overlay-${idx}`}
                      className="absolute inset-0 bg-black/10 dark:bg-black/30 backdrop-blur-xs flex flex-col items-center justify-center rounded-2xl"
                    >
                      <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg">
                        <Lock className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider mt-1.5">
                        PRO UNLOCK
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {visibleCount < filteredFunds.length && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  data-testid="load-more-mf"
                  onClick={() => setVisibleCount((prev) => prev + 50)}
                  className="px-6 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-colors shadow-sm"
                >
                  Load More ({filteredFunds.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Fund Advice Modal */}
      {selectedFundForAdvice && (
        <div
          data-testid="mf-advice-modal"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400">
                AI Fund Analysis
              </span>
              <button
                type="button"
                onClick={() => setSelectedFundForAdvice(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs md:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-mono">
              {ScoreCardAdvisor.generateMfAdvice(selectedFundForAdvice)}
            </div>
            <button
              type="button"
              onClick={() => setSelectedFundForAdvice(null)}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
            >
              Close Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
