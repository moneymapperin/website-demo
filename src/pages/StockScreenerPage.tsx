import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Search, Lock, Info, X } from 'lucide-react';
import { apiService } from '../services/apiService';
import { usePlan } from '../hooks/usePlan';
import { useToast } from '../context/ToastContext';
import { SentimentGauge, calculateSentimentValue } from '../components/market/SentimentGauge';
import { LockedCardPlaceholder, LockedRowPlaceholder, ProLockOverlay, ProSearchLock, ProUpsellBlock } from '../components/market/ProAccessComponents';
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
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

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
        isPro ? apiService.getMarketSentiment() : Promise.resolve(null),
      ]);

      setAllSignals(signals || []);
      if (isPro && sentiment && Object.keys(sentiment).length > 0) {
        setSentimentData(sentiment);
        setSentimentValue(calculateSentimentValue(sentiment.needle_angle));
        setSentimentDirection(sentiment.master_direction || 'NEUTRAL');
      } else if (!isPro) {
        setSentimentData(null);
        setSentimentValue(50);
        setSentimentDirection('NEUTRAL');
      }
    } catch (e) {
      console.error('Failed to fetch stock screener data:', e);
    } finally {
      setLoading(false);
    }
  }, [isPro]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Client-side search filtering matching Dart
  const filteredSignals = allSignals.filter((s) => {
    if (!searchQuery) return true;
    return (s.symbol || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  const displayList = filteredSignals.slice(0, visibleCount);
  const visibleSignals = isPro ? displayList : displayList.slice(0, 1);

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
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              data-testid="stock-back-button"
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-base md:text-lg font-black text-slate-900 dark:text-white">Stocks Score Card</h1>
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

      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-6 space-y-6">
        {/* Top Controls Grid: Search Bar (7 cols) + Market Sentiment Card (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
              NIFTY 500 Intelligence Engine
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Real-time Heikin Ashi, Bollinger & Pivot trend reversal analysis across top Indian equities.
            </p>

            {/* Search Bar (gated for Pro users) */}
            <div className="relative pt-2">
              {isPro ? (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    data-testid="stock-search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search ticker (e.g. RELIANCE)..."
                    className="w-full pl-9 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>
              ) : (
                <ProSearchLock
                  inputTestId="stock-search-input"
                  lockTestId="stock-search-locked"
                  placeholder="Search NIFTY 500 stocks..."
                  ariaLabel="NIFTY 500 stocks"
                />
              )}
            </div>
          </div>

          {/* Market Sentiment Gauge Card */}
          <section
            data-testid="sentiment-card"
            onClick={!isPro ? () => navigate('/subscription') : undefined}
            className={`relative lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col items-center text-center ${!isPro ? 'cursor-pointer' : ''}`}
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              MARKET SENTIMENT
            </span>

            {isPro ? (
              <>
                <SentimentGauge value={sentimentValue} size={200} />
                <span
                  data-testid="sentiment-direction-label"
                  className={`text-xs md:text-sm font-black tracking-wider mt-2 ${sentimentColor}`}
                >
                  {sentimentSubLabel}
                </span>
                {sentimentData?.updated_at && (
                  <span className="text-[10px] font-bold text-slate-400 mt-1">
                    Updated: {new Date(sentimentData.updated_at).toLocaleDateString()}
                  </span>
                )}
              </>
            ) : (
              <>
                <div aria-hidden="true" className="pointer-events-none blur-md opacity-70">
                  <SentimentGauge value={50} size={200} />
                </div>
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-white/20 p-3 dark:bg-slate-950/25">
                  <ProLockOverlay
                    testId="sentiment-lock-overlay"
                    size="card"
                    description="Unlock live market mood"
                  />
                </div>
              </>
            )}
          </section>
        </div>

        {/* Web Analytics KPI Summary Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] font-black uppercase text-slate-400">Total Tracked</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {allSignals.length} <span className="text-xs font-normal text-slate-400">Equities</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">High Confidence (&gt;70)</span>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {allSignals.filter((s) => ResilienceUtils.safeDouble(s.score) >= 70).length}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">Buy Signals</span>
            <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
              {allSignals.filter((s) => s.direction === 'BUY').length}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">Avg Market Score</span>
            <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
              {allSignals.length > 0
                ? Math.round(allSignals.reduce((a, b) => a + ResilienceUtils.safeDouble(b.score), 0) / allSignals.length)
                : 0}
              <span className="text-xs font-normal text-slate-400">/100</span>
            </div>
          </div>
        </div>

        {/* Section Header & View Switcher */}
        <div className="flex items-center justify-between gap-4 my-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              NIFTY 500 SIGNALS &amp; STOCKS
            </span>
            <span className="text-xs font-semibold text-slate-400">({filteredSignals.length} items)</span>
          </div>

          {/* Desktop Table vs Grid Toggle */}
          <div className="hidden sm:flex items-center p-1 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Grid View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Table View
            </button>
          </div>
        </div>

        {/* Signals List / Desktop View */}
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
                <p className="flex-1 text-xs font-bold">Free users see only 1 daily signal.</p>
                <button type="button" onClick={(event) => { event.stopPropagation(); navigate('/subscription'); }} className="rounded-lg bg-brand-gradient px-3 py-2 text-[10px] font-black text-white shadow-sm">Upgrade</button>
              </div>
            )}

            {/* Desktop Table View */}
            {viewMode === 'table' ? (
              <div className="overflow-x-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <th className="py-3.5 px-4">TICKER</th>
                      <th className="py-3.5 px-4">SCORE</th>
                      <th className="py-3.5 px-4">SIGNAL</th>
                      <th className="py-3.5 px-4">ENTRY ZONE</th>
                      <th className="py-3.5 px-4">TARGET RANGE</th>
                      <th className="py-3.5 px-4">STOP LOSS</th>
                      <th className="py-3.5 px-4">EST. RETURN</th>
                      <th className="py-3.5 px-4 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                    {visibleSignals.map((s, idx) => {
                      const score = Math.round(ResilienceUtils.safeDouble(s.score));
                      let direction = (s.direction || 'WAIT').toString();
                      if (direction === 'HOLD' || score === 0) direction = 'WAIT';
                      const isBuy = direction === 'BUY';
                      const isWait = direction === 'WAIT';
                      const upside = calculateUpsidePct(s.entry_range, s.target_range);

                      return (
                        <tr
                          key={s.id || idx}
                          data-testid={`stock-card-${idx}`}
                          onClick={() => handleStockClick(s, idx)}
                          className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        >
                          <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                            <span>{s.symbol || 'Unknown'}</span>
                          </td>
                          <td className="py-3.5 px-4 font-black">
                            <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-black">
                              {score}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider text-white ${
                                isWait ? 'bg-slate-400' : isBuy ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            >
                              {direction}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-600 dark:text-slate-300">
                            {s.entry_range || '–'}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                            {s.target_range || '–'}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-rose-500">
                            {s.sl_range || '–'}
                          </td>
                          <td className="py-3.5 px-4 font-black">
                            {!isWait && upside ? (
                              <span className={isBuy ? 'text-emerald-600' : 'text-rose-600'}>
                                +{upside}
                              </span>
                            ) : (
                              '–'
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition shadow-xs"
                            >
                              Analyze
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {!isPro && Array.from({ length: 5 }, (_, index) => (
                      <LockedRowPlaceholder
                        key={`locked-stock-${index}`}
                        kind="stock"
                        index={index + 1}
                        onClick={() => handleStockClick(null, index + 1)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Desktop Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleSignals.map((s, idx) => {
                  const score = Math.round(ResilienceUtils.safeDouble(s.score));
                  let direction = (s.direction || 'WAIT').toString();
                  if (direction === 'HOLD' || score === 0) direction = 'WAIT';

                  const isBuy = direction === 'BUY';
                  const isWait = direction === 'WAIT';
                  const upside = calculateUpsidePct(s.entry_range, s.target_range);

                  return (
                    <div
                      key={s.id || idx}
                      data-testid={`stock-card-${idx}`}
                      onClick={() => handleStockClick(s, idx)}
                      className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm cursor-pointer hover:border-indigo-400 transition-all"
                    >
                      <div className="space-y-4">
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

                    </div>
                  );
                })}
                {!isPro && Array.from({ length: 5 }, (_, index) => (
                  <LockedCardPlaceholder
                    key={`locked-stock-card-${index}`}
                    kind="stock"
                    index={index + 1}
                    onClick={() => handleStockClick(null, index + 1)}
                  />
                ))}
              </div>
            )}

            {!isPro && <ProUpsellBlock count={filteredSignals.length} itemLabel="signals" />}

            {/* Incremental Load More */}
            {isPro && visibleCount < filteredSignals.length && (
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
