import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { gamificationStore } from '../services/gamificationStore';
import { ALL_BADGES } from '../services/badgeService';
import { APP_COLORS } from '../theme/tokens';
import { ArrowLeft, CheckCircle2, Award, Flame } from 'lucide-react';

export const AchievementsPage: React.FC = () => {
  const navigate = useNavigate();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [unlockedBadgeIds, setUnlockedBadgeIds] = useState<string[]>([]);
  const [totalXp, setTotalXp] = useState<number>(0);
  const [levelInfo, setLevelInfo] = useState({ level: 1, minXp: 0, maxXp: 300, progress: 0 });
  const [streak, setStreak] = useState<number>(0);

  useEffect(() => {
    const xp = gamificationStore.getTotalXp();
    const info = gamificationStore.getLevelInfo(xp);
    const badges = gamificationStore.getUnlockedBadges();
    const streakCount = gamificationStore.getStreak();

    setTotalXp(xp);
    setLevelInfo(info);
    setUnlockedBadgeIds(badges);
    setStreak(streakCount);
  }, []);

  return (
    <div
      className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200"
      style={{
        backgroundColor: isDark ? APP_COLORS.darkBackground : APP_COLORS.background,
        color: isDark ? APP_COLORS.textPrimaryDark : APP_COLORS.textPrimaryLight,
      }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Navigation Header */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <h1 className="text-lg font-bold text-center flex-1 pr-14">Badges & Achievements</h1>
        </div>

        {/* Level & XP Overview Banner */}
        <div className="rounded-3xl p-6 mb-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="text-lg font-black tracking-tight flex items-center gap-2">
                  <span>LVL {levelInfo.level}</span>
                  <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                    Financial Navigator
                  </span>
                </div>
                <div className="text-xs text-zinc-500">
                  {totalXp} / {levelInfo.maxXp} XP earned
                </div>
              </div>
            </div>

            {/* Streak Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-xs">
              <Flame className="w-4 h-4 fill-amber-500" />
              <span>{streak} WEEKS</span>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.round(levelInfo.progress * 100)}%` }}
            />
          </div>
        </div>

        {/* Badge List */}
        <div className="space-y-4">
          {ALL_BADGES.map((badge) => {
            const isUnlocked = unlockedBadgeIds.includes(badge.id);

            return (
              <div
                key={badge.id}
                data-testid={`badge-card-${badge.id}`}
                className={`rounded-3xl p-5 sm:p-6 transition-all border ${
                  isUnlocked
                    ? 'bg-white dark:bg-zinc-900 border-indigo-300 dark:border-indigo-700/60 shadow-lg shadow-indigo-500/5 opacity-100'
                    : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800/80 opacity-50'
                }`}
              >
                <div className="flex items-center gap-4 sm:gap-6">
                  {/* Badge Emoji Circle */}
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shrink-0 ${
                      isUnlocked
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40'
                        : 'bg-zinc-200 dark:bg-zinc-800'
                    }`}
                  >
                    <span>{badge.emoji}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-base font-black truncate">{badge.title}</h3>
                      {isUnlocked && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-2 leading-snug">
                      {badge.desc}
                    </p>
                    <div
                      className={`text-[11px] font-black tracking-wider uppercase ${
                        isUnlocked ? 'text-emerald-500' : 'text-zinc-400'
                      }`}
                    >
                      {isUnlocked ? 'UNLOCKED • +100 XP' : 'LOCKED'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
