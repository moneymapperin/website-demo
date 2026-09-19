import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardData } from '../../models/dashboard';
import { ScoreGauge } from '../ui/ScoreGauge';
import { SparklineChart } from './SparklineChart';
import { formatNetPosition_DashboardScreen } from '../../lib/formatters';
import { gamificationStore } from '../../services/gamificationStore';

export interface FinancialPositionCardProps {
  data: DashboardData;
  netPosition: number;
  isPro?: boolean;
  isFeatureAccessible?: boolean;
  scorePtsFromLastMonth?: number;
}

export const FinancialPositionCard: React.FC<FinancialPositionCardProps> = ({
  data,
  netPosition,
  isPro = false,
  isFeatureAccessible = true,
  scorePtsFromLastMonth = 12,
}) => {
  const navigate = useNavigate();
  const [showScoreModal, setShowScoreModal] = useState(false);

  // If feature access is expired/locked for non-pro user (lines 576-578, 871-920)
  if (!isFeatureAccessible) {
    return (
      <div
        className="rounded-[24px] bg-white dark:bg-[#0D0E15] border-[1.5px] border-[#F59E0B]/40 p-6 shadow-lg text-center"
        data-testid="locked-pro-card"
      >
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#F59E0B]/10 flex items-center justify-center text-[#F59E0B]">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-black text-mm-textPrimaryLight dark:text-white mb-2">
          Unlock MoneyMapper Pro 🚀
        </h3>
        <p className="text-xs leading-relaxed text-gray-600 dark:text-zinc-400 max-w-md mx-auto mb-4">
          Your 7-day trial has ended. Subscribe to Pro to unlock your Financial Fitness Score, Net Financial Position analysis, and personalized wealth recommendations.
        </p>
        <button
          onClick={() => navigate('/subscription')}
          className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-[#F59E0B] text-white font-black text-xs tracking-wider shadow-md hover:bg-[#D97706] transition-colors"
        >
          UPGRADE TO PRO
        </button>
      </div>
    );
  }

  // Get improvement stats from gamificationStore (mirrors xp_service lines 86-103)
  const stats = gamificationStore.getImprovementStats(data.fitnessScore);
  const baselineRounded = Math.round(stats.baseline);
  const currentRounded = Math.round(data.fitnessScore);
  const isPositive = stats.percentage >= 0;
  const pctString = `${isPositive ? '+' : ''}${stats.percentage.toFixed(1)}%`;

  return (
    <div
      className="rounded-[24px] bg-white dark:bg-[#0D0E15] border-[1.5px] border-gray-200 dark:border-[#1E202E] p-5 md:p-6 shadow-sm dark:shadow-[0_8px_20px_rgba(0,0,0,0.4)]"
      data-testid="financial-position-card"
    >
      {/* ---------------- SECTION 1: FINANCIAL FITNESS SCORE ---------------- */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div className="flex items-center space-x-1.5">
          <span className="text-[12px] font-black tracking-wider text-gray-500 dark:text-white/70">
            FINANCIAL FITNESS SCORE
          </span>
          <button
            onClick={() => setShowScoreModal(true)}
            aria-label="Score info"
            data-testid="score-info-btn"
            className="text-gray-400 dark:text-white/50 hover:text-mm-primary transition-colors focus:outline-none"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>

        {!isPro && (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-zinc-700">
            BASIC
          </span>
        )}
      </div>

      {/* Score Gauge + Details (lines 653-752) */}
      <div className="flex flex-col sm:flex-row items-center gap-5">
        <div className="flex-shrink-0 flex items-center justify-center">
          <ScoreGauge score={data.fitnessScore} size={130} />
        </div>

        <div className="flex-1 w-full space-y-2">
          {/* Status Badge */}
          <div className="flex items-center space-x-1.5">
            <span className="text-base leading-none">{data.bandEmoji}</span>
            <span
              className={`text-sm font-black tracking-wide ${
                data.fitnessScore >= 70
                  ? 'text-mm-success'
                  : data.fitnessScore >= 40
                  ? 'text-mm-warning'
                  : 'text-mm-danger'
              }`}
            >
              {data.bandLabel.toUpperCase()}
            </span>
          </div>

          {/* Actionable Advice */}
          <p className="text-[11px] leading-relaxed font-medium text-gray-600 dark:text-white/70 line-clamp-3">
            You're on track. Focus on investing more and building your emergency fund.
          </p>

          {/* Improvement Badge */}
          <div className="inline-flex flex-col px-2.5 py-1.5 rounded-xl bg-gray-50 dark:bg-[#161B26] border border-gray-200 dark:border-[#272F40]">
            <div className="flex items-center space-x-1 text-mm-vibrantGreen">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
              <span className="text-xs font-black">+{scorePtsFromLastMonth} pts</span>
            </div>
            <span className="text-[9px] font-semibold text-gray-400 dark:text-white/40">
              from last month
            </span>
          </div>
        </div>
      </div>

      <div className="my-5 border-t border-gray-100 dark:border-[#1E202E]" />

      {/* ---------------- SECTION 2: NET FINANCIAL POSITION (lines 761-868) ---------------- */}
      <div>
        <span className="text-[11px] font-black tracking-wider text-gray-500 dark:text-white/70 block mb-2">
          NET FINANCIAL POSITION
        </span>

        <div className="flex items-end justify-between gap-2">
          <div className="flex-1">
            <div className="text-2xl md:text-[26px] font-black text-mm-vibrantGreen tracking-tight">
              {formatNetPosition_DashboardScreen(netPosition)}
            </div>
            <div className="text-[11px] font-semibold text-gray-400 dark:text-white/40 mt-0.5">
              Total Assets – Total Liabilities
            </div>

            {/* Growth Tag Box */}
            <div className="mt-3 inline-flex flex-col px-2.5 py-1.5 rounded-xl bg-gray-50 dark:bg-[#161B26] border border-gray-200 dark:border-[#272F40]">
              <div className="flex items-center space-x-1 text-mm-vibrantGreen">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
                <span className="text-[11.5px] font-black">+₹18,450 (8.3%)</span>
              </div>
              <span className="text-[9px] font-semibold text-gray-400 dark:text-white/40">
                vs last month
              </span>
            </div>
          </div>

          {/* Decorative Wave Sparkline Graph (no data series props passed, exactly as in Flutter line 859) */}
          <div className="flex-shrink-0 pb-1">
            <SparklineChart width={110} height={55} />
          </div>
        </div>
      </div>

      {/* Score Improvement Dialog Modal (lines 500-572) */}
      {showScoreModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          data-testid="score-details-modal"
        >
          <div className="w-full max-w-sm rounded-[24px] bg-white dark:bg-mm-darkCard border border-gray-200 dark:border-zinc-800 p-6 shadow-2xl">
            <div className="flex items-center space-x-2 text-mm-success mb-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
              <h3 className="text-base font-black text-gray-900 dark:text-white">
                Score Improvement
              </h3>
            </div>

            <p className="text-xs text-gray-600 dark:text-zinc-400 mb-4">
              Comparison since your first audit:
            </p>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-zinc-400 font-bold">Starting Score:</span>
                <span className="font-black text-gray-900 dark:text-white" data-testid="starting-score">
                  {baselineRounded}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-zinc-400 font-bold">Current Score:</span>
                <span className="font-black text-gray-900 dark:text-white" data-testid="current-score">
                  {currentRounded}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-zinc-800 py-3 text-center">
              <div
                className={`text-3xl font-black ${isPositive ? 'text-mm-success' : 'text-mm-danger'}`}
                data-testid="overall-improvement-percentage"
              >
                {pctString}
              </div>
              <div className="text-xs font-bold text-gray-400 dark:text-zinc-500">
                Overall Improvement
              </div>
            </div>

            <p
              className="text-xs text-center text-gray-600 dark:text-zinc-300 font-medium mb-5"
              data-testid="score-improvement-message"
            >
              {isPositive
                ? 'Great job! You have improved your financial health. Keep going! 🚀'
                : 'Your score has decreased slightly since last month. Please follow the recommendations to improve.'}
            </p>

            <button
              onClick={() => setShowScoreModal(false)}
              className="w-full py-2.5 rounded-xl bg-mm-primary text-white font-bold text-sm shadow hover:bg-mm-primary/90 transition-colors"
              data-testid="close-score-modal-btn"
            >
              Great!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
