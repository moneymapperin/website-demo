import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiService } from '../services/apiService';
import { authService } from '../services/authService';

export const MIN_COHORT_SIZE = 5;

const PROBLEMS = [
  '67% employees live paycheck to paycheck',
  'Financial stress causes burnout',
  'Low emergency savings increase attrition risk',
  'Medical emergencies destroy productivity',
  'Employees without investments face future instability',
];

interface InfoModalState {
  title: string;
  details: string[];
}

export const CorporateDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { effectiveTheme, toggleTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const navigate = useNavigate();

  // Intro Screen State
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [problemIndex, setProblemIndex] = useState<number>(0);
  const [scanProgress, setScanProgress] = useState<number>(0.0);

  // Dashboard Data State
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [stats, setStats] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // UI Modals
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [infoModal, setInfoModal] = useState<InfoModalState | null>(null);

  // 1. Intro sequence timers
  useEffect(() => {
    if (!showIntro) return;

    // Rotate problem statement every 1s
    const problemTimer = setInterval(() => {
      setProblemIndex((prev) => (prev + 1) % PROBLEMS.length);
    }, 1000);

    // Progress bar increment every 320ms by 0.08
    const progressTimer = setInterval(() => {
      setScanProgress((prev) => {
        const next = Math.min(1.0, prev + 0.08);
        return next;
      });
    }, 320);

    // Auto transition to dashboard after 5.2s
    const autoCloseTimer = setTimeout(() => {
      setShowIntro(false);
    }, 5200);

    return () => {
      clearInterval(problemTimer);
      clearInterval(progressTimer);
      clearTimeout(autoCloseTimer);
    };
  }, [showIntro]);

  // 2. Load Stats
  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getCorporateWorkforceStats();
      setStats(res);
    } catch (e: any) {
      setError(e?.message || 'Failed to load workforce intelligence data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // 3. Refresh Action (clears cache key corp_stats_<uid> and refetches)
  const handleRefresh = async () => {
    if (user?.id) {
      apiService.clearCache([`corp_stats_${user.id}`]);
    }
    setRefreshing(true);
    try {
      const res = await apiService.getCorporateWorkforceStats();
      setStats(res);
    } catch (e: any) {
      setError(e?.message || 'Failed to refresh corporate statistics.');
    } finally {
      setRefreshing(false);
    }
  };

  // 4. Logout Action
  const handleLogout = async () => {
    setShowLogoutModal(false);
    try {
      await authService.logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  // Skip intro
  const handleContinueToDashboard = () => {
    setShowIntro(false);
  };

  // Render Section Header
  const renderSectionHeader = (title: string, onInfo?: () => void) => (
    <div className="flex items-center justify-between pl-1 pb-3">
      <h3 className="text-[11px] font-black tracking-wider uppercase text-zinc-400">
        {title}
      </h3>
      {onInfo && (
        <button
          onClick={onInfo}
          aria-label={`More info about ${title}`}
          className="text-zinc-400 hover:text-zinc-200 p-1 rounded-full hover:bg-zinc-800/40 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      )}
    </div>
  );

  // Meter component
  const renderLinearMeter = (
    label: string,
    hits: number,
    total: number,
    color: string,
    subtitle?: string
  ) => {
    const pct = total > 0 ? (hits / total) * 100 : 0;
    const clampedWidth = Math.max(1, Math.min(100, pct));

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="font-bold">{label}</span>
            {subtitle && (
              <span className="ml-2 text-[10px] text-zinc-400">({subtitle})</span>
            )}
          </div>
          <span className="font-black text-xs" style={{ color }}>
            {hits} / {total}
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${clampedWidth}%`, backgroundColor: color }}
          />
        </div>
      </div>
    );
  };

  // 1. INTRO SCREEN
  if (showIntro) {
    return (
      <div
        data-testid="corporate-intro-screen"
        className="min-h-screen w-full flex flex-col justify-center bg-[#07110F] text-white p-6 sm:p-12 transition-colors duration-300"
      >
        <div className="max-w-xl mx-auto w-full space-y-8">
          <div>
            <span className="text-[#35C4C4] font-bold text-xs uppercase tracking-wider">
              MoneyMapper Intelligence
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-3 leading-tight">
              Workforce stress is a silent productivity leak.
            </h1>
          </div>

          <div className="min-h-[48px] flex items-center">
            <p
              key={problemIndex}
              data-testid="corporate-problem-statement"
              className="text-[#F1B957] font-bold text-base sm:text-lg animate-fadeIn"
            >
              {PROBLEMS[problemIndex]}
            </p>
          </div>

          {/* Web Scan Panel */}
          <div
            data-testid="corporate-scan-panel"
            className="p-6 rounded-2xl bg-[#0D1B18] border border-white/10 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
              <span>AI Workforce Scan</span>
              <span>{Math.round(scanProgress * 100)}%</span>
            </div>

            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#44D18C] transition-all duration-300"
                style={{ width: `${Math.min(100, scanProgress * 100)}%` }}
              />
            </div>

            <p className="text-xs text-zinc-400 pt-1">
              Use the mobile app QR scanner to sign in on other devices
            </p>

            <div className="pt-2">
              <button
                data-testid="continue-to-dashboard-btn"
                onClick={handleContinueToDashboard}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 active:scale-98 transition-all"
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Derived values from stats
  const orgName = stats?.company_name || 'My Organization';
  const score = Number(stats?.avg_workforce_score ?? 0);
  const headcount = Number(stats?.total_headcount ?? 0);
  const adminEmail = user?.email || 'Admin';
  const avatarInitial = adminEmail[0]?.toUpperCase() || 'A';

  const intel = stats?.pillar_intel || {};
  const getHit = (val: any) =>
    headcount > 0 ? Math.round(((Number(val) || 0) / 100) * headcount) : 0;

  const stableCount = Number(stats?.stable_count ?? 0);
  const watchCount = Number(stats?.watchlist_count ?? 0);
  const highCount = Number(stats?.high_risk_count ?? 0);
  const critCount = Number(stats?.critical_risk_count ?? 0);

  const paycheckPct = Number(stats?.paycheck_dependency_pct ?? 0);
  const efGapPct = Number(stats?.no_emergency_fund_pct ?? 0);

  const deptMetrics: Record<string, any> = stats?.dept_metrics || {};
  const deptEntries = Object.entries(deptMetrics);
  const visibleDepts = deptEntries.filter(
    ([, data]) => Number(data?.headcount ?? 0) >= MIN_COHORT_SIZE
  );

  return (
    <div
      data-testid="corporate-dashboard-page"
      className={`min-h-screen ${
        isDark ? 'bg-[#0B1115] text-zinc-100' : 'bg-slate-50 text-zinc-900'
      } transition-colors duration-200`}
    >
      {/* 2. CORPORATE TOP APP BAR */}
      <header
        className={`sticky top-0 z-30 border-b ${
          isDark
            ? 'bg-[#121B20]/95 border-zinc-800/80 backdrop-blur-md'
            : 'bg-white/95 border-slate-200 backdrop-blur-md'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowLogoutModal(true)}
              aria-label="Logout or Back"
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">
                Corporate Portal
              </span>
              <h1 className="text-base sm:text-lg font-black tracking-tight leading-tight truncate max-w-[200px] sm:max-w-sm">
                {orgName}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Refresh Button */}
            <button
              data-testid="corporate-refresh-btn"
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="Refresh Dashboard"
              className={`p-2 rounded-xl border ${
                isDark
                  ? 'border-zinc-700/60 bg-zinc-800/40 hover:bg-zinc-800 text-zinc-300'
                  : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
              } transition-colors`}
            >
              <svg
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>

            {/* Web QR Info */}
            <button
              onClick={() => setShowQrModal(true)}
              aria-label="Web QR Scanner"
              className={`p-2 rounded-xl border ${
                isDark
                  ? 'border-zinc-700/60 bg-zinc-800/40 hover:bg-zinc-800 text-emerald-400'
                  : 'border-slate-200 bg-white hover:bg-slate-100 text-emerald-600'
              } transition-colors`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
            </button>

            {/* Theme Toggle */}
            <button
              data-testid="corporate-theme-btn"
              onClick={toggleTheme}
              aria-label="Switch Theme"
              className={`p-2 rounded-xl border ${
                isDark
                  ? 'border-zinc-700/60 bg-zinc-800/40 hover:bg-zinc-800 text-amber-400'
                  : 'border-slate-200 bg-white hover:bg-slate-100 text-amber-500'
              } transition-colors`}
            >
              {isDark ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Avatar Initial with Logout trigger */}
            <button
              data-testid="corporate-avatar-btn"
              onClick={() => setShowLogoutModal(true)}
              className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shadow-md active:scale-95 transition-all"
              title={`Logged in as ${adminEmail}`}
            >
              {avatarInitial}
            </button>
          </div>
        </div>
      </header>

      {/* 3. MAIN DASHBOARD CONTENT */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {loading ? (
          <div
            data-testid="corporate-loading"
            className="py-24 flex flex-col items-center justify-center text-zinc-400 space-y-3"
          >
            <div className="w-10 h-10 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-500">
              Aggregating Workforce Metrics...
            </p>
          </div>
        ) : error ? (
          <div
            data-testid="corporate-error-state"
            role="alert"
            className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-4"
          >
            <p className="text-sm font-bold text-red-400">{error}</p>
            <button
              onClick={loadStats}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow transition-all"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* No-Data Banner */}
            {headcount === 0 && (
              <div
                data-testid="no-data-banner"
                className="w-full bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl text-center"
              >
                <span className="text-amber-500 text-xs font-bold tracking-wider">
                  NO DATA — Registered employee signals needed.
                </span>
              </div>
            )}

            {/* Score Header */}
            <section
              data-testid="corporate-score-header"
              className={`p-6 sm:p-8 rounded-3xl border ${
                isDark
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-emerald-50/70 border-emerald-500/20'
              } flex items-center justify-between`}
            >
              <div className="space-y-1">
                <span className="text-[10px] sm:text-xs font-black tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
                  WORKFORCE HEALTH INDEX
                </span>
                <div className="text-4xl sm:text-5xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                  {score}
                </div>
                <div className="pt-1">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-black ${
                      score >= 75
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    }`}
                  >
                    {score >= 75 ? 'STABLE' : 'WATCHLIST'}
                  </span>
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="flex justify-end text-emerald-600 dark:text-emerald-400">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {headcount}
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400">
                  EMPLOYEES
                </span>
              </div>
            </section>

            {/* Pillar Hit-Rates Module ("Workforce Intelligence") */}
            <section
              data-testid="corporate-pillar-hitrates"
              className={`p-6 rounded-3xl border ${
                isDark ? 'bg-[#121B20] border-zinc-800' : 'bg-white border-slate-200'
              } space-y-4 shadow-sm`}
            >
              {renderSectionHeader('Workforce Intelligence', () =>
                setInfoModal({
                  title: 'Workforce Intelligence',
                  details: [
                    "This module shows the percentage of employees achieving 'Stable' status in each financial pillar.",
                    'A 100% rate means every employee is financially healthy in that specific category.',
                    'Use these meters to identify where your workforce needs the most support (e.g., Insurance or Emergency funds).',
                  ],
                })
              )}

              <div className="space-y-4 pt-1">
                {renderLinearMeter(
                  'Income Stability',
                  getHit(intel.avg_income_score),
                  headcount,
                  '#10B981',
                  'Estimated employees'
                )}
                {renderLinearMeter(
                  'Expense Discipline',
                  getHit(intel.avg_expense_score),
                  headcount,
                  '#EF4444',
                  'Estimated employees'
                )}
                {renderLinearMeter(
                  'Emergency Ready',
                  getHit(intel.avg_savings_score),
                  headcount,
                  '#8B5CF6',
                  'Estimated employees'
                )}
                {renderLinearMeter(
                  'Insurance Protected',
                  getHit(intel.avg_protection_score),
                  headcount,
                  '#3B82F6',
                  'Estimated employees'
                )}
                {renderLinearMeter(
                  'Investment Growth',
                  getHit(intel.avg_investment_score),
                  headcount,
                  '#F59E0B',
                  'Estimated employees'
                )}
              </div>
            </section>

            {/* Critical Outcomes Module */}
            <section
              data-testid="corporate-critical-outcomes"
              className={`p-6 rounded-3xl border ${
                isDark ? 'bg-[#121B20] border-zinc-800' : 'bg-white border-slate-200'
              } space-y-4 shadow-sm`}
            >
              {renderSectionHeader('Critical Outcomes', () =>
                setInfoModal({
                  title: 'Workforce Outcomes',
                  details: [
                    'Paycheck Dependency: Employees living with less than 10% monthly surplus.',
                    'Emergency Fund Gap: Percentage of staff lacking a 3-month basic survival cushion.',
                    'High numbers here correlate directly with increased workplace stress and turnover risk.',
                  ],
                })
              )}

              <div className="space-y-4 divide-y divide-zinc-200 dark:divide-zinc-800/60">
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <h4 className="text-sm font-bold">Paycheck Dependency</h4>
                    <p className="text-xs text-zinc-400">
                      Affects {paycheckPct}% of staff.
                    </p>
                  </div>
                  <div className="text-lg sm:text-xl font-black text-red-500">
                    {paycheckPct}%
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <h4 className="text-sm font-bold">Emergency Fund Gap</h4>
                    <p className="text-xs text-zinc-400">
                      Affects {efGapPct}% of workforce.
                    </p>
                  </div>
                  <div className="text-lg sm:text-xl font-black text-amber-500">
                    {efGapPct}%
                  </div>
                </div>
              </div>
            </section>

            {/* Risk Distribution Module */}
            <section
              data-testid="corporate-risk-distribution"
              className={`p-6 rounded-3xl border ${
                isDark ? 'bg-[#121B20] border-zinc-800' : 'bg-white border-slate-200'
              } space-y-4 shadow-sm`}
            >
              {renderSectionHeader('Risk Distribution', () =>
                setInfoModal({
                  title: 'Risk Cohorts',
                  details: [
                    'Stable: Low financial risk, high productivity.',
                    'Watchlist: Early signs of financial instability.',
                    'High Risk: Significant stress, needs benefit intervention.',
                    'Critical: Severe instability; high probability of attrition.',
                  ],
                })
              )}

              <div className="space-y-4 pt-1">
                {renderLinearMeter('Stable Cohort', stableCount, headcount, '#10B981')}
                {renderLinearMeter('Watchlist', watchCount, headcount, '#F59E0B')}
                {renderLinearMeter('High Risk', highCount, headcount, '#EF4444')}
                {renderLinearMeter('Critical Risk', critCount, headcount, '#A98BFF')}
              </div>
            </section>

            {/* Department Heatmap */}
            <section
              data-testid="corporate-dept-heatmap"
              className={`p-6 rounded-3xl border ${
                isDark ? 'bg-[#121B20] border-zinc-800' : 'bg-white border-slate-200'
              } space-y-4 shadow-sm`}
            >
              {renderSectionHeader('Department Heatmap', () =>
                setInfoModal({
                  title: 'Departmental Insights',
                  details: [
                    'A granular view of financial stress across your organization.',
                    'Stress % represents the average expense-to-income tension in each team.',
                    'Red Tags: Teams needing immediate wellness support or compensation review.',
                  ],
                })
              )}

              <div className="space-y-3 pt-1">
                {visibleDepts.length === 0 ? (
                  <p className="text-xs text-zinc-400">No departmental data yet.</p>
                ) : (
                  visibleDepts.map(([name, data]) => {
                    const stress = Number(data?.avg_stress ?? 0);
                    const deptHeadcount = Number(data?.headcount ?? 0);
                    const isHighRisk = stress > 65;

                    return (
                      <div
                        key={name}
                        data-testid={`dept-row-${name.toLowerCase().replace(/\s+/g, '-')}`}
                        className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800/40 last:border-0"
                      >
                        <div>
                          <h4 className="text-sm font-bold">{name}</h4>
                          <span className="text-[10px] text-zinc-400">
                            {deptHeadcount} Members
                          </span>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span
                            className="text-sm font-black"
                            style={{ color: isHighRisk ? '#EF4444' : '#10B981' }}
                          >
                            {Math.round(stress)}%
                          </span>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                            style={{
                              backgroundColor: isHighRisk
                                ? 'rgba(239, 68, 68, 0.1)'
                                : 'rgba(16, 185, 129, 0.1)',
                              color: isHighRisk ? '#EF4444' : '#10B981',
                            }}
                          >
                            {isHighRisk ? 'HIGH RISK' : 'STABLE'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Privacy disclaimer */}
                {MIN_COHORT_SIZE > 0 && (
                  <p className="text-[11px] text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800/40 italic">
                    Departments with fewer than 5 employees are hidden to protect anonymity.
                  </p>
                )}
              </div>
            </section>

            {/* Privacy Banner */}
            <section
              data-testid="corporate-privacy-banner"
              className={`p-5 rounded-3xl border ${
                isDark ? 'bg-[#121B20] border-zinc-800' : 'bg-white border-slate-200'
              } flex items-center space-x-4 shadow-sm`}
            >
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                Privacy-First: All signals are anonymized and aggregated.
              </p>
            </section>
          </>
        )}
      </main>

      {/* MODAL: Intelligence Details */}
      {infoModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
        >
          <div
            className={`max-w-md w-full p-6 rounded-3xl border ${
              isDark ? 'bg-[#121B20] border-zinc-700 text-zinc-100' : 'bg-white border-slate-200 text-zinc-900'
            } shadow-2xl space-y-4`}
          >
            <h3 className="text-base font-bold">{infoModal.title}</h3>
            <div className="space-y-3 pt-2">
              {infoModal.details.map((d, i) => (
                <div key={i} className="flex items-start space-x-3 text-xs text-zinc-400 leading-relaxed">
                  <svg className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{d}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setInfoModal(null)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all mt-4"
            >
              Close Intelligence
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Web QR Info */}
      {showQrModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div
            className={`max-w-md w-full p-6 rounded-3xl border ${
              isDark ? 'bg-[#121B20] border-zinc-700 text-zinc-100' : 'bg-white border-slate-200 text-zinc-900'
            } shadow-2xl space-y-4 text-center`}
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <h3 className="text-base font-bold">Web QR Login</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Use the mobile app QR scanner to sign in on other devices without entering your corporate credentials manually.
            </p>
            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Confirm Logout */}
      {showLogoutModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div
            className={`max-w-sm w-full p-6 rounded-3xl border ${
              isDark ? 'bg-[#121B20] border-zinc-700 text-zinc-100' : 'bg-white border-slate-200 text-zinc-900'
            } shadow-2xl space-y-4`}
          >
            <h3 className="text-base font-bold">Confirm Logout</h3>
            <p className="text-xs text-zinc-400">
              Are you sure you want to end your corporate admin session?
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                data-testid="corporate-confirm-logout-btn"
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow transition-all"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
