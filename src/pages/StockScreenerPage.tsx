import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Search, Lock, Info, X } from 'lucide-react';
import { apiService } from '../services/apiService';
import { usePlan } from '../hooks/usePlan';
import { useToast } from '../context/ToastContext';
import { SentimentGauge, calculateSentimentValue } from '../components/market/SentimentGauge';
import { ScoreCardAdvisor } from '../services/marketAdvisor';
import { ResilienceUtils } from '../services/resilienceUtils';

export function getMinValue(val: string = ''): number {
  try {
    const clean = val.replace(/[^0-9.]/g, ' ').trim();
    if (!clean) return 0;
    const parts = clean.split(/\s+/);
    let minVal: number | null = null;
    for (const p of parts) {
      const d = parseFloat(p);
      if (!isNaN(d)) {
        if (minVal === null || d < minVal) minVal = d;
      }
    }
    return minVal ?? 0;
  } catch {
    return 0;
  }
}

export function getMaxValue(val: string = ''): number {
  try {
    const clean = val.replace(/[^0-9.]/g, ' ').trim();
    if (!clean) return 0;
    const parts = clean.split(/\s+/);
    let maxVal: number | null = null;
    for (const p of parts) {
      const d = parseFloat(p);
      if (!isNaN(d)) {
        if (maxVal === null || d > maxVal) maxVal = d;
      }
    }
    return maxVal ?? 0;
  } catch {
    return 0;
  }
}

export function calculateUpsidePct(entryRange: string = '', targetRange: string = ''): string {
  const entry = getMinValue(entryRange);
  const target = getMaxValue(targetRange);
  if (entry <= 0 || target <= 0) return '';
  const pct = Math.abs((target - entry) / entry) * 100;
  if (pct === 0) return '';
  return `${pct.toFixed(1)}%`;
}

export const StockScreenerPage: React.FC = () => {
  const navigate = useNavigate();
  const { isPro } = usePlan();
  const { showToast } = useToast();

  const [allSignals, setAllSignals] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Sentiment State
  const [sentimentData, setSentimentData] = useState<any | null>(null);
  const [sentimentValue, setSentimentValue] = useState(50);
  const [sentimentDirection, setSentimentDirection] = useState('NEUTRAL');

  // Incremental rendering
  const [visibleCount, setVisibleCount] = useState(50);

  // Advisory Modal State
  const [selectedStockForAdvice, setSelectedStockForAdvice] = useState<any | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [signals, sentiment] = await Promise.all([
        apiService.getStockSignals(),
        apiService.getMarketSentiment(),
      ]);

      setAllSignals(signals || []);
      if (sentiment && Object.keys(sentiment).length > 0) {
        setSentimentData(sentiment);
        setSentimentValue(calculateSentimentValue(sentiment.needle_angle));
        setSentimentDirection(sentiment.master_direction || 'NEUTRAL');
      }
    } catch (e) {
      console.error('Failed to fetch stock screener data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Client-side search filtering matching Dart
  const filteredSignals = allSignals.filter((s) => {
    if (!searchQuery) return true;
    return (s.symbol || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  const displayList = filteredSignals.slice(0, visibleCount);

  // Sentiment Label
  let sentimentSubLabel = 'STABLE MARKET';
  let sentimentColor = 'text-amber-500';
  if (sentimentDirection === 'BUY') {
    sentimentSubLabel = 'BULLISH / GREED';
    sentimentColor = 'text-emerald-500';
  } else if (sentimentDirection === 'SELL') {
    sentimentSubLabel = 'BEARISH / FEAR';
    sentimentColor = 'text-rose-500';
  }

  const handleStockClick = (stock: any, index: number) => {
    const isLocked = !isPro && index > 0;
    if (isLocked) {
      showToast({
        message: 'Upgrade to PRO to unlock all signals! 🚀',
        backgroundColor: '#F59E0B',
        action: {
          label: 'UPGRADE',
          onClick: () => navigate('/subscription'),
        },
      });
      return;
    }
    setSelectedStockForAdvice(stock);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 text-slate-900 dark:text-white" data-testid="stock-screener-page">
      {/* App Bar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              data-testid="stock-back-button"
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-base font-black text-slate-900 dark:text-white">Stocks Score Card</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="stock-info-button"
              onClick={() => setShowInfoModal(true)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Strategy Guide"
            >
              <Info className="w-4 h-4" />
            </button>
            <button
              type="button"
              data-testid="stock-refresh-button"
              onClick={fetchData}
              className="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Refresh Signals"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* Search Bar (gated for Pro users) */}
        <div className="relative">
          <div className={`relative ${!isPro ? 'filter blur-xs select-none' : ''}`}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              data-testid="stock-search-input"
              disabled={!isPro}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isPro ? 'Search ticker (e.g. RELIANCE)...' : 'Search locked for Free users'}
              className="w-full pl-9 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {!isPro && (
            <div
              data-testid="stock-search-locked"
              onClick={() => navigate('/subscription')}
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
            >
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[10px] font-black tracking-wider uppercase shadow-sm">
                <Lock className="w-3 h-3" />
                <span>UPGRADE TO PRO</span>
              </div>
            </div>
          )}
        </div>

        {/* Market Sentiment Gauge Card */}
        <section
          data-testid="sentiment-card"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center"
        >
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
            MARKET SENTIMENT
          </span>

          <SentimentGauge value={sentimentValue} size={240} />

          <span
            data-testid="sentiment-direction-label"
            className={`text-sm font-black tracking-wider mt-3 ${sentimentColor}`}
          >
            {sentimentSubLabel}
          </span>

          {sentimentData?.updated_at && (
            <span className="text-[10px] font-bold text-slate-400 mt-1">
              Updated: {new Date(sentimentData.updated_at).toLocaleDateString()}
            </span>
          )}
        </section>

        {/* Section Divider */}
        <div className="flex items-center gap-4 my-4">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">
            NIFTY 500 SIGNALS &amp; STOCKS
          </span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
        </div>

        {/* Signals List */}
        {loading ? (
          <div className="py-20 text-center text-slate-400" data-testid="stock-loading-state">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="font-semibold text-sm">Scanning Nifty 500 signals...</p>
          </div>
        ) : displayList.length === 0 ? (
          <div className="py-16 text-center text-slate-400" data-testid="stock-empty-state">
            <p className="font-semibold text-sm">
              {searchQuery ? 'No matching stocks found.' : 'Scanning Nifty 500 signals...'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {!isPro && (
              <div
                data-testid="screener-pro-banner"
                onClick={() => navigate('/subscription')}
                className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-center gap-3 cursor-pointer"
              >
                <Lock className="w-4 h-4 shrink-0" />
                <p className="text-xs font-bold">
                  Free users see only 1 daily signal. Upgrade to PRO! 🚀
                </p>
              </div>
            )}

            {displayList.map((s, idx) => {
              const score = Math.round(ResilienceUtils.safeDouble(s.score));
              let direction = (s.direction || 'WAIT').toString();
              if (direction === 'HOLD' || score === 0) direction = 'WAIT';

              const isBuy = direction === 'BUY';
              const isWait = direction === 'WAIT';
              const isLocked = !isPro && idx > 0;
              const upside = calculateUpsidePct(s.entry_range, s.target_range);

              return (
                <div
                  key={s.id || idx}
                  data-testid={`stock-card-${idx}`}
                  onClick={() => handleStockClick(s, idx)}
                  className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm cursor-pointer hover:border-indigo-400 transition-all"
                >
                  <div className={`space-y-4 ${isLocked ? 'filter blur-[5px] select-none pointer-events-none' : ''}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-lg text-slate-900 dark:text-white">
                            {s.symbol || 'Unknown'}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400 font-bold">
                          <span>Score:</span>
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            {score}
                          </span>
                          <span>/100</span>
                          {!isWait && upside && (
                            <span className={isBuy ? 'text-emerald-600' : 'text-rose-600'}>
                              • Expected Return: {upside}
                            </span>
                          )}
                        </div>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider text-white ${
                          isWait ? 'bg-slate-400' : isBuy ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      >
                        {direction}
                      </span>
                    </div>

                    {!isWait && (
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                        <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400">
                          <span className="text-[9px] font-black uppercase">STOP LOSS</span>
                          <p className="text-xs font-black mt-0.5">{s.sl_range || 'N/A'}</p>
                        </div>
                        <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400">
                          <span className="text-[9px] font-black uppercase">ENTRY ZONE</span>
                          <p className="text-xs font-black mt-0.5">{s.entry_range || 'N/A'}</p>
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
                          <span className="text-[9px] font-black uppercase">TARGET</span>
                          <p className="text-xs font-black mt-0.5">{s.target_range || 'N/A'}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {isLocked && (
                    <div
                      data-testid={`stock-lock-overlay-${idx}`}
                      className="absolute inset-0 bg-black/10 dark:bg-black/30 backdrop-blur-xs flex flex-col items-center justify-center rounded-2xl"
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

            {/* Incremental Load More */}
            {visibleCount < filteredSignals.length && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  data-testid="load-more-stocks"
                  onClick={() => setVisibleCount((prev) => prev + 50)}
                  className="px-6 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-colors shadow-sm"
                >
                  Load More ({filteredSignals.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Verbatim Stock Screener Disclaimer */}
        <div
          data-testid="stock-disclaimer"
          className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs italic"
        >
          Scores above 70 indicate high-confidence signals. Always follow the Stop Loss range for risk management.
        </div>
      </main>

      {/* Strategy Guide Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black">AI Strategy Guide</h3>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Our AI scanner identifies high-probability reversals using:
            </p>
            <ul className="text-xs space-y-1 text-slate-500 dark:text-slate-400">
              <li>• Heikin Ashi: Trend confirmation</li>
              <li>• Bollinger Bands: Volatility exhaustion</li>
              <li>• Pivot Analysis: Trend-cycle detection</li>
            </ul>
            <p className="text-[11px] italic text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
              Scores above 70 indicate high-confidence signals. Always follow the Stop Loss range for risk management.
            </p>
            <button
              type="button"
              onClick={() => setShowInfoModal(false)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Stock Advice Modal */}
      {selectedStockForAdvice && (
        <div
          data-testid="stock-advice-modal"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400">
                AI Stock Analysis
              </span>
              <button
                type="button"
                onClick={() => setSelectedStockForAdvice(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs md:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-mono">
              {ScoreCardAdvisor.generateStockAdvice(selectedStockForAdvice)}
            </div>
            <button
              type="button"
              onClick={() => setSelectedStockForAdvice(null)}
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
