import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardData } from '../../models/dashboard';
import { formatQuickStatsCurrency_DashboardScreen } from '../../lib/formatters';

export interface FinancialBreakdownSectionProps {
  data: DashboardData;
  monthlyIncome: number;
  monthlyExpenses: number;
  emergencyCurrent: number;
  sipRecommendation: number;
  isPro?: boolean;
  isFeatureAccessible?: boolean;
  canAccessPremium?: boolean;
  onLockedClick?: (pillarTitle: string) => void;
}

export const FinancialBreakdownSection: React.FC<FinancialBreakdownSectionProps> = ({
  data,
  monthlyIncome,
  monthlyExpenses,
  emergencyCurrent,
  sipRecommendation,
  isPro = false,
  isFeatureAccessible = true,
  canAccessPremium,
  onLockedClick,
}) => {
  const navigate = useNavigate();
  const effectiveCanAccess = canAccessPremium !== undefined ? canAccessPremium : (isPro || isFeatureAccessible);

  const incomeScore = data.pillars['income']?.score ?? 0;
  const expensesScore = data.pillars['expenses']?.score ?? 0;
  const savingsScore = data.pillars['emergency']?.score ?? 0;
  const protectionScore = data.pillars['protection']?.score ?? 0;
  const investmentScore = data.pillars['investment']?.score ?? 0;

  // Flutter lines 929-933 exact strings
  const fmtIncome = `${formatQuickStatsCurrency_DashboardScreen(monthlyIncome > 0 ? monthlyIncome : 85000)} / month`;
  const fmtExpenses = `${formatQuickStatsCurrency_DashboardScreen(monthlyExpenses)} / month`;
  const fmtSavings = `${formatQuickStatsCurrency_DashboardScreen(emergencyCurrent)} / month`;
  const fmtProtection = 'Life Cover: ₹1.20 Cr';
  const fmtInvestment = `${formatQuickStatsCurrency_DashboardScreen(sipRecommendation)} / month`;

  const pillarConfigs = [
    {
      key: 'income',
      title: 'Income',
      score: incomeScore,
      subtitle: fmtIncome,
      accentColor: '#10B981',
      emoji: '💰',
      isLocked: false,
      showTrialBadge: false,
      route: '/pillars/income',
    },
    {
      key: 'expenses',
      title: 'Expenses',
      score: expensesScore,
      subtitle: fmtExpenses,
      accentColor: '#EF4444',
      emoji: '💳',
      isLocked: false,
      showTrialBadge: false,
      route: '/pillars/expenses',
    },
    {
      key: 'emergency',
      title: 'Emergency Savings',
      score: savingsScore,
      subtitle: fmtSavings,
      accentColor: '#3B82F6',
      emoji: '🛡️',
      isLocked: !effectiveCanAccess,
      showTrialBadge: !isPro && effectiveCanAccess,
      route: '/pillars/emergency',
    },
    {
      key: 'protection',
      title: 'Protection',
      score: protectionScore,
      subtitle: fmtProtection,
      accentColor: '#A855F7',
      emoji: '☂️',
      isLocked: !effectiveCanAccess,
      showTrialBadge: !isPro && effectiveCanAccess,
      route: '/pillars/insurance',
    },
    {
      key: 'investment',
      title: 'Investment',
      score: investmentScore,
      subtitle: fmtInvestment,
      accentColor: '#F59E0B',
      emoji: '📈',
      isLocked: !effectiveCanAccess,
      showTrialBadge: !isPro && effectiveCanAccess,
      route: '/pillars/investments',
    },
  ];

  // Identify strongest and weakest pillars by score
  const scores = pillarConfigs.map((p) => p.score);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);

  const handleRowClick = (item: typeof pillarConfigs[0]) => {
    if (item.isLocked) {
      if (onLockedClick) {
        onLockedClick(item.title);
      } else {
        navigate('/subscription');
      }
      return;
    }
    navigate(item.route);
  };

  return (
    <div
      className="rounded-[24px] bg-white dark:bg-[#0D0E15] border-[1.5px] border-gray-200 dark:border-[#1E202E] p-4 sm:p-5 shadow-sm dark:shadow-[0_8px_20px_rgba(0,0,0,0.4)] mb-4"
      data-testid="financial-breakdown-section"
    >
      {/* Header Row (lines 956-976: NO View Details link as requested in Flutter) */}
      <div className="flex items-center space-x-1.5 mb-4">
        <span className="text-[13px] font-black tracking-wider text-mm-textPrimaryLight dark:text-white">
          FINANCIAL BREAKDOWN
        </span>
        <span className="text-[11px] font-semibold text-gray-500 dark:text-white/50">
          (Your 5 Pillars)
        </span>
      </div>

      {/* Pillar Rows */}
      <div className="divide-y divide-gray-100 dark:divide-[#1B1E2E]">
        {pillarConfigs.map((item) => {
          const progress = Math.min(1.0, Math.max(0.0, item.score / 100));
          const isStrongest = item.score === maxScore && maxScore > 0;
          const isWeakest = item.score === minScore && minScore < 100 && maxScore !== minScore;

          return (
            <div
              key={item.key}
              onClick={() => handleRowClick(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleRowClick(item);
              }}
              className="py-2.5 sm:py-3 flex items-center justify-between cursor-pointer rounded-xl hover:bg-gray-50/70 dark:hover:bg-white/[0.02] px-1 transition-colors"
              data-testid={`pillar-row-${item.key}`}
            >
              {/* 1. Glowing Icon Box */}
              <div
                style={{
                  backgroundColor: `${item.accentColor}2E`,
                  borderColor: `${item.accentColor}4D`,
                }}
                className="w-8 h-8 rounded-[10px] border flex items-center justify-center text-sm flex-shrink-0 mr-2.5"
              >
                <span>{item.emoji}</span>
              </div>

              {/* 2. Pillar Title Column */}
              <div className="flex-1 min-w-0 mr-2">
                <div className="flex items-center space-x-1.5 flex-wrap">
                  <span className="text-[12.5px] font-extrabold text-mm-textPrimaryLight dark:text-white truncate">
                    {item.title}
                  </span>

                  {item.showTrialBadge && (
                    <span className="px-1 py-0.5 rounded text-[7px] font-black bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700">
                      BASIC
                    </span>
                  )}

                  {isStrongest && (
                    <span
                      className="px-1.5 py-0.2 rounded-full text-[8px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      data-testid="strongest-badge"
                    >
                      STRONGEST
                    </span>
                  )}

                  {isWeakest && (
                    <span
                      className="px-1.5 py-0.2 rounded-full text-[8px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                      data-testid="weakest-badge"
                    >
                      NEEDS FOCUS
                    </span>
                  )}
                </div>

                <div className="text-[9px] font-medium text-gray-400 dark:text-white/50 truncate mt-0.5">
                  {item.subtitle}
                </div>
              </div>

              {/* 3. Score Column */}
              <div className="flex items-baseline space-x-0.5 mr-3 flex-shrink-0">
                <span
                  style={{ color: item.accentColor }}
                  className="text-[15px] font-black leading-none"
                >
                  {Math.round(item.score)}
                </span>
                <span className="text-[9px] font-semibold text-gray-400 dark:text-white/50">
                  /100
                </span>
              </div>

              {/* 4. Progress Bar */}
              <div className="w-16 sm:w-24 h-1.5 rounded-full bg-gray-200 dark:bg-[#222638] overflow-hidden flex-shrink-0 mr-2.5">
                <div
                  style={{
                    width: `${progress * 100}%`,
                    backgroundColor: item.accentColor,
                  }}
                  className="h-full rounded-full transition-all duration-300"
                />
              </div>

              {/* 5. Chevron or Lock Icon */}
              <div
                style={{
                  backgroundColor: `${item.accentColor}1F`,
                }}
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              >
                {item.isLocked ? (
                  <svg
                    className="w-3 h-3 text-mm-warning"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    data-testid={`locked-icon-${item.key}`}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                ) : (
                  <svg
                    style={{ color: item.accentColor }}
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
