import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Search, Lock, Shield, X } from 'lucide-react';
import { apiService } from '../services/apiService';
import { usePlan } from '../hooks/usePlan';
import { useToast } from '../context/ToastContext';
import { ScoreCardAdvisor } from '../services/marketAdvisor';
import { ResilienceUtils } from '../services/resilienceUtils';

export function formatCover(val: any): string {
  const value = ResilienceUtils.safeDouble(val);
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)} Cr`;
  if (value >= 100000) return `₹${Math.round(value / 100000)} Lakh`;
  return `₹${Math.round(value)}`;
}

export const InsuranceScreenerPage: React.FC = () => {
  const navigate = useNavigate();
  const { isPro } = usePlan();
  const { showToast } = useToast();

  const [allPlans, setAllPlans] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedPlanForAdvice, setSelectedPlanForAdvice] = useState<any | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const plans = await apiService.getInsurancePlans();
      setAllPlans(plans || []);
    } catch (e) {
      console.error('Failed to fetch insurance plans:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter logic matching Dart
  const filteredPlans = allPlans.filter((p) => {
    const q = searchQuery.toLowerCase();
    const nameMatch =
      !q ||
      (p.company?.toString().toLowerCase().includes(q) ?? false) ||
      (p.policy?.toString().toLowerCase().includes(q) ?? false);
    const typeMatch = selectedType === 'All' || p.insurance_type === selectedType;
    return nameMatch && typeMatch;
  });

  const handleTypeClick = (type: string) => {
    if (!isPro) {
      showToast({
        message: 'Upgrade to PRO to unlock Category Filters! 🚀',
        backgroundColor: '#F59E0B',
        action: {
          label: 'UPGRADE',
          onClick: () => navigate('/subscription'),
        },
      });
      return;
    }
    setSelectedType(type);
  };

  const handlePlanClick = (plan: any, index: number) => {
    const isLocked = !isPro && index > 0;
    if (isLocked) {
      showToast({
        message: 'Upgrade to PRO to unlock all insurance score card! 🚀',
        backgroundColor: '#F59E0B',
        action: {
          label: 'UPGRADE',
          onClick: () => navigate('/subscription'),
        },
      });
      return;
    }
    setSelectedPlanForAdvice(plan);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 text-slate-900 dark:text-white" data-testid="insurance-screener-page">
      {/* App Bar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              data-testid="insurance-back-button"
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-base font-black text-slate-900 dark:text-white">Insurance Score Card</h1>
          </div>
          <button
            type="button"
            data-testid="insurance-refresh-button"
            onClick={fetchData}
            className="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Refresh Plans"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* Search & Type Filters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="relative">
            <div className={`relative ${!isPro ? 'filter blur-xs select-none' : ''}`}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                data-testid="insurance-search-input"
                disabled={!isPro}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isPro ? 'Search company or policy...' : 'Search locked for Free users'}
                className="w-full pl-9 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {!isPro && (
              <div
                data-testid="insurance-search-locked"
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

          <div className="grid grid-cols-3 gap-2">
            {['All', 'Health', 'Life'].map((type) => {
              const isActive = selectedType === type;
              return (
                <div key={type} className="relative">
                  <button
                    type="button"
                    data-testid={`insurance-type-${type.toLowerCase()}`}
                    onClick={() => handleTypeClick(type)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-colors ${
                      !isPro ? 'filter blur-xs select-none pointer-events-none' : ''
                    } ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {type}
                  </button>

                  {!isPro && (
                    <div
                      onClick={() => handleTypeClick(type)}
                      className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/10 dark:bg-black/20 rounded-xl"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Plans List */}
        {loading ? (
          <div className="py-20 text-center text-slate-400" data-testid="insurance-loading-state">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="font-semibold text-sm">Loading insurance plans...</p>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="py-16 text-center text-slate-400" data-testid="insurance-empty-state">
            <p className="font-semibold text-sm">No plans match filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {!isPro && (
              <div
                data-testid="insurance-pro-banner"
                onClick={() => navigate('/subscription')}
                className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-center gap-3 cursor-pointer"
              >
                <Lock className="w-4 h-4 shrink-0" />
                <p className="text-xs font-bold">
                  Free users see only 1 expert pick. Upgrade to PRO to see all insurance score card! 🚀
                </p>
              </div>
            )}

            {filteredPlans.map((p, idx) => {
              const isLocked = !isPro && idx > 0;
              const score = Math.round(ResilienceUtils.safeDouble(p.smart_score || p.score));
              const csr = ResilienceUtils.safeDouble(p.claim_ratio || p.claim_settlement_ratio).toFixed(1);
              const coverFormatted = formatCover(p.cover || p.cover_amount);

              return (
                <div
                  key={p.id || idx}
                  data-testid={`insurance-card-${idx}`}
                  onClick={() => handlePlanClick(p, idx)}
                  className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm cursor-pointer hover:border-indigo-400 transition-all"
                >
                  <div className={`space-y-4 ${isLocked ? 'filter blur-[5px] select-none pointer-events-none' : ''}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-black text-base text-slate-900 dark:text-white">
                            {p.company || 'Unknown Company'}
                          </h3>
                          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                            {p.policy || ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black uppercase text-slate-400">SCORE</span>
                        <div className="w-10 h-10 rounded-full border-2 border-indigo-500/40 flex items-center justify-center font-black text-indigo-600 dark:text-indigo-400 text-sm mt-0.5">
                          {score}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">TYPE</span>
                        <p className="text-xs font-black text-blue-500 mt-0.5">{p.insurance_type || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">COVER</span>
                        <p className="text-xs font-black text-emerald-500 mt-0.5">{coverFormatted}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">CSR</span>
                        <p className="text-xs font-black text-amber-500 mt-0.5">{csr}%</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {p.is_verified === true && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase">
                          Verified
                        </span>
                      )}
                      {p.has_copay === false && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase">
                          No Co-pay
                        </span>
                      )}
                      {p.pre_existing_cover === true && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase">
                          PED Cover
                        </span>
                      )}
                      {p.critical_illness_cover === true && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase">
                          Critical Cover
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] italic text-slate-500 dark:text-slate-400">
                      Best for: {p.best_for || 'General protection'}
                    </p>
                  </div>

                  {isLocked && (
                    <div
                      data-testid={`insurance-lock-overlay-${idx}`}
                      className="absolute inset-0 bg-black/10 dark:bg-black/30 backdrop-blur-xs flex flex-col items-center justify-center rounded-3xl"
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
          </div>
        )}
      </main>

      {/* Insurance Plan Advice Modal */}
      {selectedPlanForAdvice && (
        <div
          data-testid="insurance-advice-modal"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400">
                Insurance Plan Details
              </span>
              <button
                type="button"
                onClick={() => setSelectedPlanForAdvice(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs md:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-mono">
              {ScoreCardAdvisor.generateInsuranceDetails(selectedPlanForAdvice)}
            </div>
            <button
              type="button"
              onClick={() => setSelectedPlanForAdvice(null)}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
