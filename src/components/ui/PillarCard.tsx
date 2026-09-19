import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { APP_COLORS } from '../../theme/tokens';

export interface PillarCardProps {
  title: string;
  score: number;
  barColor?: string;
  fullWidth?: boolean;
  onTap?: () => void;
  isLocked?: boolean;
  showScore?: boolean;
  showProgress?: boolean;
  showTitle?: boolean;
  imagePath?: string;
  vertical?: boolean;
  backgroundIcon?: React.ReactNode;
  emoji?: string;
  className?: string;
}

export const PillarCard: React.FC<PillarCardProps> = ({
  title,
  score,
  barColor,
  fullWidth = false,
  onTap,
  isLocked = false,
  showScore = true,
  showProgress = true,
  showTitle = true,
  imagePath,
  vertical = false,
  backgroundIcon,
  emoji,
  className = '',
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isPressed, setIsPressed] = useState(false);

  const getProgressColor = (s: number): string => {
    if (barColor) return barColor;
    if (s < 40) return APP_COLORS.danger; // #EF4444
    if (s <= 70) return APP_COLORS.warning; // #F59E0B
    return APP_COLORS.success; // #10B981
  };

  const progress = isLocked ? 0 : Math.min(Math.max(score, 0), 100) / 100;
  const displayScore = isLocked ? '??' : Math.round(score).toString();

  const titleColor = isDark ? '#FFFFFF' : '#18181B';
  const cardBgColor = isDark ? '#0D0E15' : '#F3F7FC';
  const borderColor = isDark ? '#27272A' : '#E5E7EB';
  const trackColor = isDark ? '#27272A' : '#F3F4F6';
  const progressFillColor = getProgressColor(score);

  const handleClick = () => {
    if (isLocked) {
      showToast({
        message: 'Upgrade to PRO to unlock this pillar! 🚀',
        backgroundColor: APP_COLORS.accent, // #8B5CF6
        action: {
          label: 'UPGRADE',
          onClick: () => {
            navigate('/subscription');
          },
        },
      });
      return;
    }
    onTap?.();
  };

  return (
    <div
      data-testid="pillar-card"
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      style={{
        backgroundColor: cardBgColor,
        borderColor: borderColor,
        minHeight: '125px',
        boxShadow: isDark ? '0 8px 16px rgba(0, 0, 0, 0.3)' : '0 8px 16px rgba(79, 70, 229, 0.04)',
        transform: isPressed ? 'scale(0.97)' : 'scale(1)',
      }}
      className={`relative cursor-pointer select-none rounded-[24px] border transition-transform duration-100 ease-out overflow-hidden ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
    >
      {/* Background Image if supplied */}
      {imagePath && (
        <div
          className="absolute -right-3 -bottom-3 pointer-events-none"
          style={{ opacity: showTitle ? 0.35 : 1 }}
        >
          <img src={imagePath} alt="" className="h-[85px] object-contain" />
        </div>
      )}

      {/* Background Icon & Emoji Overlay */}
      {(backgroundIcon || emoji) && showTitle && (
        <div className="absolute -right-2 -bottom-2 flex items-center justify-center pointer-events-none">
          {backgroundIcon && (
            <div
              className="text-[90px] leading-none"
              style={{
                opacity: isDark ? 0.05 : 0.08,
                color: isDark ? '#FFFFFF' : APP_COLORS.primary,
              }}
            >
              {backgroundIcon}
            </div>
          )}
          {emoji && (
            <span
              className="absolute right-4 bottom-4 leading-none"
              style={{ fontSize: '28px' }}
            >
              {emoji}
            </span>
          )}
        </div>
      )}

      {/* Card Content Overlay */}
      {(showTitle || showScore) && (
        <div className="p-4 h-full flex flex-col justify-between relative z-10">
          {vertical ? (
            <div className="flex flex-col justify-start">
              {showTitle && (
                <h3
                  data-testid="pillar-card-title"
                  className="text-[15px] font-black line-clamp-2"
                  style={{ color: titleColor }}
                >
                  {title}
                </h3>
              )}
              {showScore && (
                <div className="flex items-baseline gap-1 mt-1.5">
                  <span
                    data-testid="pillar-card-score"
                    className="text-[22px] font-black leading-none"
                    style={{ color: titleColor }}
                  >
                    {displayScore}
                  </span>
                  <span
                    className="text-[9px] font-bold tracking-wider"
                    style={{ color: isDark ? APP_COLORS.textSecondaryDark : APP_COLORS.textSecondaryLight }}
                  >
                    SCORE
                  </span>
                </div>
              )}
              {showProgress && (
                <div
                  data-testid="pillar-card-track"
                  className="w-full h-1.5 rounded-[6px] overflow-hidden mt-2"
                  style={{ backgroundColor: trackColor }}
                >
                  <div
                    data-testid="pillar-card-progress"
                    className="h-full rounded-[6px] transition-all duration-300"
                    style={{
                      width: `${progress * 100}%`,
                      backgroundColor: progressFillColor,
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col justify-between h-full">
              {showTitle && (
                <div>
                  <h3
                    data-testid="pillar-card-title"
                    className="text-[14px] font-black line-clamp-2"
                    style={{ color: titleColor }}
                  >
                    {title}
                  </h3>
                  {showProgress && (
                    <div
                      data-testid="pillar-card-track"
                      className="w-[75px] h-[5px] rounded-[6px] overflow-hidden mt-1"
                      style={{ backgroundColor: trackColor }}
                    >
                      <div
                        data-testid="pillar-card-progress"
                        className="h-full rounded-[6px] transition-all duration-300"
                        style={{
                          width: `${progress * 100}%`,
                          backgroundColor: progressFillColor,
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
              {showScore && (
                <div className="flex flex-col items-start mt-2">
                  <span
                    data-testid="pillar-card-score"
                    className="text-[20px] font-black leading-none"
                    style={{ color: titleColor }}
                  >
                    {displayScore}
                  </span>
                  <span
                    className="text-[9px] font-bold tracking-wider"
                    style={{ color: isDark ? APP_COLORS.textSecondaryDark : APP_COLORS.textSecondaryLight }}
                  >
                    SCORE
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lock Icon Badge */}
      {isLocked && (
        <div
          data-testid="pillar-card-lock"
          className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 text-white flex items-center justify-center z-20"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
};
