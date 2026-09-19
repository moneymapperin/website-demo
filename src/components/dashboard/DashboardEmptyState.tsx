import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GoldTicker } from './GoldTicker';
import { ScoreCardsGrid } from './ScoreCardsGrid';
import { QUOTES } from './QuotesSection';

export interface DashboardEmptyStateProps {
  userName?: string | null;
  userEmail?: string | null;
  goldData?: Record<string, any> | null;
  isGoldLoading?: boolean;
}

export const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({
  userName,
  userEmail,
  goldData,
  isGoldLoading,
}) => {
  const navigate = useNavigate();
  const quote = QUOTES[0];

  return (
    <div className="space-y-6" data-testid="dashboard-empty-state">
      {/* 1. Market Tools For New Users */}
      <GoldTicker goldData={goldData} isLoading={isGoldLoading} />
      <ScoreCardsGrid />

      {/* 2. Setup Profile Card */}
      <div className="rounded-[24px] bg-[#FFFBEB] dark:bg-[#2C2516] border-[1.5px] border-[#FDE68A] dark:border-[#5F4E2B] p-6 text-center shadow-sm">
        <div className="text-5xl mb-4 select-none">💡</div>
        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-3">
          Welcome to MoneyMapper!
        </h2>
        <p className="text-[15px] italic text-gray-600 dark:text-white/70 max-w-lg mx-auto mb-6">
          “{quote}”
        </p>

        <div className="border-t border-amber-200/60 dark:border-amber-900/40 my-4" />

        <p className="text-xs leading-relaxed text-gray-500 dark:text-white/60 max-w-md mx-auto mb-6">
          Your financial profile is currently empty. To see your fitness score and personalized insights, please fill in your master data.
        </p>

        <button
          onClick={() => navigate('/master-data')}
          className="w-full py-4 rounded-2xl bg-mm-primary hover:bg-mm-primary/90 text-white font-black text-sm tracking-wide shadow-md transition-colors"
          data-testid="onboarding-cta-btn"
        >
          Set Up Financial Profile
        </button>
      </div>

      {/* 3. Basic Identity Box */}
      <div className="rounded-[24px] bg-white dark:bg-mm-darkCard border border-mm-borderLight dark:border-mm-darkBorder p-5 shadow-sm">
        <div className="text-[11px] font-black tracking-[1.1px] text-gray-400 dark:text-zinc-500 mb-4">
          YOUR BASIC IDENTITY
        </div>

        <div className="space-y-4 divide-y divide-gray-100 dark:divide-zinc-800">
          {/* Name Row */}
          <div className="flex items-center space-x-3 pt-1">
            <div className="w-8 h-8 rounded-full bg-mm-primary/10 text-mm-primary flex items-center justify-center text-sm">
              👤
            </div>
            <div>
              <div className="text-[11px] text-gray-400 dark:text-zinc-400">Name</div>
              <div className="text-sm font-bold text-mm-textPrimaryLight dark:text-white">
                {userName || 'Not Set'}
              </div>
            </div>
          </div>

          {/* Email Row */}
          <div className="flex items-center space-x-3 pt-3">
            <div className="w-8 h-8 rounded-full bg-mm-primary/10 text-mm-primary flex items-center justify-center text-sm">
              ✉️
            </div>
            <div>
              <div className="text-[11px] text-gray-400 dark:text-zinc-400">Email</div>
              <div className="text-sm font-bold text-mm-textPrimaryLight dark:text-white">
                {userEmail || 'Not Set'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
