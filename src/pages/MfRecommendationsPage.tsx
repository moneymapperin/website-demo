import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Lock, PieChart } from 'lucide-react';
import { apiService } from '../services/apiService';
import { usePlan } from '../hooks/usePlan';
import { useToast } from '../context/ToastContext';

export const MfRecommendationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isPro } = usePlan();
  const { showToast } = useToast();

  const riskParam = (searchParams.get('risk') || 'moderate').toLowerCase();

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    apiService
      .getMutualFundRecommendations(riskParam)
      .then((recs) => {
        if (isMounted) {
          setRecommendations(recs || []);
          setLoading(false);
        }
      })
      .catch((e) => {
        console.error('Failed to load MF recommendations:', e);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [riskParam]);

  const handleFundClick = (index: number) => {
    const isLocked = !isPro && index > 0;
    if (isLocked) {
      showToast({
        message: 'Upgrade to PRO to unlock all wealth blueprints! 🚀',
        backgroundColor: '#F59E0B',
        action: {
          label: 'UPGRADE',
          onClick: () => navigate('/subscription'),
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 text-slate-900 dark:text-white" data-testid="mf-recommendations-page">
      {/* App Bar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            type="button"
            data-testid="mf-recs-back-button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <h1 className="text-sm font-black text-slate-800 dark:text-slate-100">
            Wealth Growth Blueprint
          </h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        {/* Strategy Header */}
        <div
          data-testid="mf-recs-header"
          className="w-full bg-indigo-50/70 dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 rounded-3xl p-6 text-center shadow-xs"
        >
          <div className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-base md:text-lg tracking-wider uppercase">
            <PieChart className="w-5 h-5" />
            <span>{riskParam.toUpperCase()} STRATEGY</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Curated high-growth funds matching your wealth profile.
          </p>
        </div>

        {!isPro && (
          <div
            data-testid="mf-recs-pro-banner"
            onClick={() => navigate('/subscription')}
            className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-center gap-3 cursor-pointer"
          >
            <Lock className="w-4 h-4 shrink-0" />
            <p className="text-xs font-bold">
              Free users see only 1 expert pick. Upgrade to PRO to see all wealth blueprints! 🚀
            </p>
          </div>
        )}

        {/* Blueprint List */}
        {loading ? (
          <div className="py-20 text-center text-slate-400" data-testid="mf-recs-loading">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="font-semibold text-sm">Generating wealth blueprints...</p>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <p className="font-semibold text-sm">No funds available for this strategy.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((f, idx) => {
              const isLocked = !isPro && idx > 0;
              const fundType = f.type || 'Moderate';
              const name = f.name || f.schemeName || 'Unknown Fund';
              const category = (f.category || 'EQUITY').toUpperCase();

              return (
                <div
                  key={idx}
                  data-testid={`mf-rec-card-${idx}`}
                  onClick={() => handleFundClick(idx)}
                  className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm cursor-pointer hover:border-indigo-400 transition-all"
                >
                  <div className={`space-y-4 ${isLocked ? 'filter blur-[5px] select-none pointer-events-none' : ''}`}>
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider">
                        {category}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                        {fundType.toUpperCase()}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-2">
                      {name}
                    </h3>
                  </div>

                  {isLocked && (
                    <div
                      data-testid={`mf-rec-lock-overlay-${idx}`}
                      className="absolute inset-0 bg-black/10 dark:bg-black/30 backdrop-blur-xs flex flex-col items-center justify-center rounded-3xl"
                    >
                      <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg">
                        <Lock className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider mt-1.5">
                        PRO
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Verbatim Disclaimer and Action */}
        <div className="pt-6 space-y-4">
          <p
            data-testid="mf-recs-disclaimer"
            className="text-center text-xs text-slate-400 dark:text-slate-500 leading-relaxed px-4"
          >
            Disclaimer: Mutual fund investments are subject to market risks. Please read all scheme-related documents carefully before investing.
          </p>

          <div className="space-y-3 pt-2">
            <a
              href="https://wa.me/917987469093?text=Hi!+I+want+to+start+my+investments.+Can+you+help+me?"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="start-investment-button"
              className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
            >
              Start My Investment
            </a>

            <button
              type="button"
              onClick={() => navigate('/insights')}
              className="w-full py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            >
              Got it, Back to Strategy
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
