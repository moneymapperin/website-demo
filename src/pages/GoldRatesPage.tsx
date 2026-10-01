import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Info, TrendingUp } from 'lucide-react';
import { marketDataService, GoldRateData } from '../services/marketDataService';
import { ResilienceUtils } from '../services/resilienceUtils';
import goldBrickImg from '../assets/app/gold_brick.png';

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
    <div className="min-h-screen pb-20 transition-colors duration-200" data-testid="gold-rates-page">
      {/* 1. App Bar Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-3.5 select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            type="button"
            data-testid="gold-back-button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
            Live Gold Market
          </h1>

          <button
            type="button"
            data-testid="gold-refresh-button"
            onClick={() => loadRates(true)}
            className="p-2 rounded-xl text-amber-500 hover:bg-amber-500/10 transition-all"
            aria-label="Refresh Rates"
            title="Refresh Gold Rates"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-6 space-y-8">
        {/* Top Hero Gold Ticker Banner matching attached design */}
        <div
          data-testid="gold-ticker-card"
          className="w-full bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-950 dark:from-[#170E38] dark:via-[#100D28] dark:to-[#0A0B14] border border-indigo-500/30 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-white"
        >
          {/* Subtle background glow effect */}
          <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
            {/* Left Info Column */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex items-center gap-3">
                <img src={goldBrickImg} alt="Gold Icon" className="w-8 h-8 object-contain drop-shadow" />
                <span className="text-sm font-black tracking-widest uppercase text-amber-400">
                  24K GOLD RATE
                </span>
                <span
                  data-testid="gold-status-badge"
                  className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-wider"
                >
                  {goldData?.status || 'LIVE (IBJA)'}
                </span>
              </div>

              <div className="flex items-baseline gap-2 my-2">
                <span className="text-3xl md:text-4xl font-black text-purple-400">₹</span>
                <span
                  data-testid="gold-10g-price"
                  className="text-4xl md:text-6xl font-black tracking-tight text-white drop-shadow-md"
                >
                  {formatIndianCurrency(price24k_10g)}
                </span>
              </div>

              <div>
                <p className="text-xs md:text-sm font-semibold text-zinc-300">
                  per 10 gm / tola
                </p>
                <p
                  data-testid="gold-update-time"
                  className="text-[11px] font-medium text-zinc-400 mt-2"
                >
                  {goldData?.updated_at ? `Updated: ${timeInfo}` : `Updated: ${timeInfo}`}
                </p>
              </div>
            </div>

            {/* Right Visual 3D Gold Bars Image Column */}
            <div className="md:col-span-5 flex justify-center md:justify-end relative">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-purple-600/20 rounded-full blur-2xl group-hover:blur-3xl transition-all" />
                <img
                  src={goldBrickImg}
                  alt="3D Gold Bars"
                  className="w-48 sm:w-60 md:w-72 h-auto object-contain drop-shadow-[0_15px_30px_rgba(245,158,11,0.35)] relative z-10 transition-transform duration-500 hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Market Rates (Per Gram) Section */}
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 px-1">
            MARKET RATES (PER GRAM)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metalCards.map((card, idx) => {
              const priceNum = ResilienceUtils.safeDouble(card.price);
              const purityLabel = card.label.split(' ')[0];
              const purityCode = card.label.includes('(')
                ? card.label.substring(card.label.indexOf('('))
                : '';
              const isSelected = idx === 0; // 24K is active/selected card

              return (
                <div
                  key={idx}
                  data-testid={`metal-card-${idx}`}
                  className={`rounded-3xl p-5 shadow-sm transition-all duration-200 flex flex-col justify-between relative overflow-hidden ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#1C1238] to-[#140D2B] dark:bg-[#170E38] border-2 border-indigo-500 shadow-xl shadow-indigo-500/20 text-white'
                      : 'bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 hover:border-indigo-500/40 text-slate-900 dark:text-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className={`font-black text-lg ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                        {purityLabel}
                      </h3>
                      <p className={`text-xs font-bold ${isSelected ? 'text-indigo-300' : 'text-slate-400 dark:text-zinc-400'}`}>
                        {purityCode}
                      </p>
                    </div>

                    <img src={goldBrickImg} alt="Gold icon" className="w-8 h-8 object-contain shrink-0 drop-shadow-sm" />
                  </div>

                  <div className="mt-6">
                    <div className="flex items-baseline gap-1 font-black">
                      <span className={`text-sm ${isSelected ? 'text-amber-400' : 'text-amber-500'}`}>₹</span>
                      <span className={`text-2xl md:text-3xl tracking-tight ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                        {formatIndianCurrency(priceNum)}
                      </span>
                    </div>
                    <span className={`text-xs font-bold ${isSelected ? 'text-indigo-200/80' : 'text-slate-400 dark:text-zinc-400'}`}>
                      per 1 Gram
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Verbatim Disclaimer */}
        <div
          data-testid="gold-disclaimer"
          className="p-4 rounded-2xl bg-amber-50 dark:bg-slate-900/50 border border-amber-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 space-y-1.5 transition-colors"
        >
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-300">
            <Info className="w-3.5 h-3.5 text-amber-500" />
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

