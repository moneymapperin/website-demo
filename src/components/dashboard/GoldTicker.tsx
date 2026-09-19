import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatGoldPrice_DashboardScreen } from '../../lib/formatters';

export interface GoldTickerProps {
  goldData?: Record<string, any> | null;
  isLoading?: boolean;
}

export const GoldTicker: React.FC<GoldTickerProps> = ({ goldData, isLoading }) => {
  const navigate = useNavigate();
  const price24k = Number(goldData?.['24K (999 Purity)'] ?? goldData?.price24k ?? 0);

  // Flutter lines 1254-1270: Show placeholder loader if data isn't ready yet
  if (isLoading || !goldData || price24k <= 0) {
    return (
      <div
        className="mb-4 p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] flex items-center space-x-3 border border-gray-200/50 dark:border-zinc-800"
        data-testid="gold-ticker-loading"
      >
        <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wide">
          Syncing Live Gold Rates...
        </span>
      </div>
    );
  }

  // Flutter lines 1275-1353
  return (
    <div
      onClick={() => navigate('/market/gold')}
      className="mb-4 relative h-[110px] rounded-[20px] bg-white dark:bg-mm-darkCard border-[1.5px] border-[#D4AF37]/30 shadow-[0_4px_16px_rgba(212,175,55,0.08)] cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-[0_6px_20px_rgba(212,175,55,0.16)] hover:border-[#D4AF37]/50"
      data-testid="gold-ticker"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          navigate('/market/gold');
        }
      }}
    >
      {/* Background Gold Shimmer / Brick Graphic (lines 1303-1311) */}
      <div className="absolute -right-4 -bottom-3 select-none pointer-events-none opacity-80 dark:opacity-70">
        <svg
          width="130"
          height="95"
          viewBox="0 0 100 70"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 45 L40 20 L90 20 L75 55 L25 55 Z"
            fill="url(#goldBarGrad)"
            stroke="#D4AF37"
            strokeWidth="1.5"
          />
          <path d="M40 20 L55 5 L105 5 L90 20 Z" fill="#F59E0B" fillOpacity="0.8" />
          <path d="M90 20 L105 5 L90 40 L75 55 Z" fill="#B45309" fillOpacity="0.8" />
          <defs>
            <linearGradient id="goldBarGrad" x1="10" y1="20" x2="90" y2="55">
              <stop stopColor="#FDE68A" />
              <stop offset="0.5" stopColor="#F59E0B" />
              <stop offset="1" stopColor="#D97706" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Foreground Content (lines 1318-1345) */}
      <div className="relative z-10 h-full flex flex-col justify-center px-5 py-3">
        <span className="text-[12px] font-black tracking-wider text-gray-500 dark:text-zinc-400">
          LIVE GOLD RATE 24K
        </span>
        <span className="text-[10px] font-extrabold text-black/45 dark:text-white/60 mb-1">
          (PER GRAM)
        </span>
        <span className="text-2xl font-black text-mm-textPrimaryLight dark:text-white tracking-tight">
          {formatGoldPrice_DashboardScreen(price24k)}
        </span>
      </div>
    </div>
  );
};
