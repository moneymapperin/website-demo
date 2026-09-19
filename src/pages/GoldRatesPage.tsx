import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Info } from 'lucide-react';
import { marketDataService, GoldRateData } from '../services/marketDataService';
import { ResilienceUtils } from '../services/resilienceUtils';

export function formatIndianCurrency(amount: number): string {
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatGoldUpdateTime(goldData: GoldRateData | null): string {
  if (!goldData) return 'Now';
  if (goldData.updated_at) {
    try {
      const d = new Date(goldData.updated_at);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString();
      }
    } catch {
      // Fall through
    }
  }
  return goldData.time || 'Now';
}

export const GoldRatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [goldData, setGoldData] = useState<GoldRateData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRates = useCallback(async (force = false) => {
    setLoading(true);
    try {
      const data = await marketDataService.getGoldRate({ forceRefresh: force });
      setGoldData(data);
    } catch (e) {
      console.error('Failed to load gold rates:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  const price24k_10g = goldData ? ResilienceUtils.safeDouble(goldData['24K (999 Purity)']) * 10 : 0;
  const timeInfo = formatGoldUpdateTime(goldData);

  const metalCards = [
    { label: '24K (999 Purity)', price: goldData?.['24K (999 Purity)'] },
    { label: '22K (916 Purity)', price: goldData?.['22K (916 Purity)'] },
    { label: '18K (750 Purity)', price: goldData?.['18K (750 Purity)'] },
    { label: '14K (585 Purity)', price: goldData?.['14K (585 Purity)'] },
  ];

  return (
    <div className="min-h-screen bg-amber-50/40 dark:bg-slate-950 pb-20 text-slate-900 dark:text-white" data-testid="gold-rates-page">
      {/* App Bar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-amber-200/50 dark:border-slate-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            type="button"
            data-testid="gold-back-button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <h1 className="text-sm font-black text-slate-800 dark:text-slate-100">Live Gold Market</h1>
          <button
            type="button"
            data-testid="gold-refresh-button"
            onClick={() => loadRates(true)}
            className="p-2 rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-slate-800 transition-all"
            aria-label="Refresh Rates"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        {/* Header Gold Ticker Card */}
        <div
          data-testid="gold-ticker-card"
          className="w-full bg-white dark:bg-slate-900 border-2 border-amber-400/50 dark:border-amber-500/30 rounded-3xl p-6 md:p-8 shadow-xl shadow-amber-500/5 text-center relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black tracking-widest uppercase text-amber-600 dark:text-amber-400">
              24K GOLD RATE
            </span>
            <span
              data-testid="gold-status-badge"
              className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider"
            >
              {goldData?.status || 'LIVE SYNC'}
            </span>
          </div>

          <div className="flex items-baseline justify-center gap-2 my-3">
            <span className="text-2xl md:text-3xl font-black text-amber-500">₹</span>
            <span
              data-testid="gold-10g-price"
              className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white"
            >
              {formatIndianCurrency(price24k_10g)}
            </span>
          </div>

          <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400">
            per 10 gm / tola
          </p>

          <p
            data-testid="gold-update-time"
            className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-4"
          >
            {goldData?.updated_at ? `Updated: ${timeInfo}` : `Last Update: ${timeInfo}`}
          </p>
        </div>

        {/* Market Rates Per Gram */}
        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
            MARKET RATES (PER GRAM)
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {metalCards.map((card, idx) => {
              const priceNum = ResilienceUtils.safeDouble(card.price);
              const purityLabel = card.label.split(' ')[0];
              const purityCode = card.label.includes('(')
                ? card.label.substring(card.label.indexOf('('))
                : '';

              return (
                <div
                  key={idx}
                  data-testid={`metal-card-${idx}`}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white">{purityLabel}</h3>
                    <p className="text-[10px] font-bold text-slate-400">{purityCode}</p>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-baseline gap-1 text-amber-500 font-black">
                      <span className="text-sm">₹</span>
                      <span className="text-xl md:text-2xl text-slate-900 dark:text-white">
                        {formatIndianCurrency(priceNum)}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">per 1 Gram</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Verbatim Disclaimer */}
        <div
          data-testid="gold-disclaimer"
          className="p-4 rounded-2xl bg-amber-100/50 dark:bg-slate-900/50 border border-amber-200/50 dark:border-slate-800 text-slate-600 dark:text-slate-400 space-y-1.5"
        >
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            <Info className="w-3.5 h-3.5" />
            <span>DISCLAIMER</span>
          </div>
          <p className="text-xs leading-relaxed">
            Rates are indicative. Retail prices may vary across different jewelers and cities due to local taxes (GST) and making charges.
          </p>
        </div>
      </main>
    </div>
  );
};
