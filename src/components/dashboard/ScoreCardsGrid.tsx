import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ScoreCardConfig {
  id: string;
  title: string;
  scoreValue: string;
  category: string;
  description: string;
  color: string;
  cardType: 'stock' | 'mf' | 'insurance' | 'ipo';
  route?: string;
  isComingSoon?: boolean;
}

const CARDS: ScoreCardConfig[] = [
  {
    id: 'stock',
    title: 'Stock Score',
    scoreValue: '75',
    category: 'NIFTY 500 COMPANIES',
    description: 'Buy / Sell Recommendations',
    color: '#10B981',
    cardType: 'stock',
    route: '/market/stocks',
  },
  {
    id: 'mf',
    title: 'Mutual Fund Score',
    scoreValue: '82',
    category: '3000+ MUTUAL FUNDS',
    description: 'Top Performing Funds',
    color: '#3B82F6',
    cardType: 'mf',
    route: '/market/funds',
  },
  {
    id: 'insurance',
    title: 'Insurance Score',
    scoreValue: '83',
    category: '83 LIFE & HEALTH PLANS',
    description: 'Best Plans for You',
    color: '#A855F7',
    cardType: 'insurance',
    route: '/market/insurance',
  },
  {
    id: 'ipo',
    title: 'IPO Score',
    scoreValue: '78',
    category: 'UPCOMING IPOs',
    description: 'Analysis & Recommendations',
    color: '#F59E0B',
    cardType: 'ipo',
    isComingSoon: true,
  },
];

export const ScoreCardsGrid: React.FC = () => {
  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleClick = (card: ScoreCardConfig) => {
    if (card.isComingSoon) {
      setToastMessage('IPO Score coming soon!');
      setTimeout(() => setToastMessage(null), 2500);
    } else if (card.route) {
      navigate(card.route);
    }
  };

  return (
    <div className="mb-4 relative" data-testid="score-cards-section">
      <h3 className="text-[13px] font-black tracking-wider text-mm-textPrimaryLight dark:text-white mb-3">
        MONEYMAPPER SCORE CARDS
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CARDS.map((card) => {
          return (
            <div
              key={card.id}
              onClick={() => handleClick(card)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleClick(card);
              }}
              style={{
                borderColor: `${card.color}59`,
                boxShadow: `0 6px 16px ${card.color}14`,
              }}
              className="group cursor-pointer relative h-[185px] rounded-[22px] bg-white dark:bg-[#0D0E15] border-[1.5px] p-3.5 flex flex-col justify-between overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              data-testid={`score-card-${card.id}`}
            >
              {/* Background Wave Graphic & Watermark Icon */}
              <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
                <svg
                  className="w-full h-full opacity-60 dark:opacity-40"
                  viewBox="0 0 200 185"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M 0 96 C 50 70, 120 107, 200 40 L 200 185 L 0 185 Z"
                    fill={`${card.color}15`}
                  />
                  <path
                    d="M 0 96 C 50 70, 120 107, 200 40"
                    fill="none"
                    stroke={`${card.color}80`}
                    strokeWidth="2"
                  />
                </svg>

                {/* Watermark type icon */}
                <div
                  style={{ color: card.color }}
                  className="absolute right-6 top-9 opacity-25 dark:opacity-30"
                >
                  {card.cardType === 'stock' && (
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  )}
                  {card.cardType === 'mf' && (
                    <svg className="w-11 h-11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                    </svg>
                  )}
                  {card.cardType === 'insurance' && (
                    <svg className="w-11 h-11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  )}
                  {card.cardType === 'ipo' && (
                    <span className="text-3xl -rotate-12 inline-block">🚀</span>
                  )}
                </div>
              </div>

              {/* Foreground Top Row: Icon + Title */}
              <div className="relative z-10 flex items-center space-x-2">
                <div
                  style={{
                    backgroundColor: `${card.color}2E`,
                  }}
                  className="p-1.5 rounded-[10px] flex items-center justify-center text-xs"
                >
                  <span style={{ color: card.color }}>
                    {card.cardType === 'stock' && '📈'}
                    {card.cardType === 'mf' && '📊'}
                    {card.cardType === 'insurance' && '🛡️'}
                    {card.cardType === 'ipo' && '🚀'}
                  </span>
                </div>
                <span
                  style={{ color: card.color }}
                  className="text-[13px] font-black tracking-wide truncate"
                >
                  {card.title}
                </span>
              </div>

              {/* Foreground Middle Section: Score + Category + Description */}
              <div className="relative z-10 my-auto">
                <div className="flex items-baseline space-x-1">
                  <span className="text-[28px] font-black leading-none text-mm-textPrimaryLight dark:text-white">
                    {card.scoreValue}
                  </span>
                  <span className="text-xs font-bold text-gray-400 dark:text-white/50">/100</span>
                </div>
                <div className="text-[10.5px] font-black tracking-wider text-mm-textPrimaryLight dark:text-white mt-1.5 truncate">
                  {card.category}
                </div>
                <div className="text-[9.5px] font-medium text-gray-500 dark:text-white/50 truncate">
                  {card.description}
                </div>
              </div>

              {/* Foreground Bottom Right: Chevron */}
              <div className="relative z-10 self-end">
                <div
                  style={{
                    backgroundColor: `${card.color}40`,
                    borderColor: `${card.color}80`,
                  }}
                  className="w-7 h-7 rounded-full border-[1.2px] flex items-center justify-center transition-transform group-hover:translate-x-0.5"
                >
                  <svg
                    style={{ color: card.color }}
                    className="w-4 h-4"
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
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold shadow-xl animate-fade-in"
          role="status"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};
