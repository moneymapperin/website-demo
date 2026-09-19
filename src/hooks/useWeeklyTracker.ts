import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/apiService';
import { gamificationStore } from '../services/gamificationStore';
import {
  WeekInfo,
  HeatmapDay,
  calculateMonthWeeks,
  calculateCategoryScore,
  calculateLocalDisciplineScore,
  deriveHeatmapDays,
} from '../models/weekly';

export interface UseWeeklyTrackerResult {
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  currentYear: number;
  currentMonth: number;
  weeks: WeekInfo[];
  currentViewWeekIndex: number;
  activeCalendarWeekIndex: number;
  weeklyIncome: number;
  monthlyActiveIncome: number;
  expenseScore: number;
  disciplineScore: number;
  targetsHit: string;
  disciplineMsg: string;
  heatmapDays: HeatmapDay[];
  streakCount: number;
  fixedDecision?: 'achieved' | 'missed';
  flexibleDecision?: 'achieved' | 'missed';
  savingsDecision?: 'achieved' | 'missed';
  actualFixed: number;
  actualFlex: number;
  actualSaved: number;
  setCurrentViewWeekIndex: (index: number) => void;
  handleDecision: (
    type: 'fixed' | 'flexible' | 'savings',
    decision: 'achieved' | 'missed',
    amount?: number
  ) => void;
  submitWeek: () => Promise<{ success: boolean; error?: string }>;
  refetch: () => Promise<void>;
}

export function useWeeklyTracker(): UseWeeklyTrackerResult {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState<boolean>(false);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-based

  const [weeks, setWeeks] = useState<WeekInfo[]>([]);
  const [currentViewWeekIndex, setCurrentViewWeekIndex] = useState<number>(0);
  const [activeCalendarWeekIndex, setActiveCalendarWeekIndex] = useState<number>(0);

  const [weeklyIncome, setWeeklyIncome] = useState<number>(0);
  const [monthlyActiveIncome, setMonthlyActiveIncome] = useState<number>(0);
  const [expenseScore, setExpenseScore] = useState<number>(0);
  const [disciplineScore, setDisciplineScore] = useState<number>(0);
  const [targetsHit, setTargetsHit] = useState<string>('0/4');
  const [disciplineMsg, setDisciplineMsg] = useState<string>(
    'Your financial discipline message will appear here.'
  );

  const [fixedDecision, setFixedDecision] = useState<'achieved' | 'missed' | undefined>();
  const [flexibleDecision, setFlexibleDecision] = useState<'achieved' | 'missed' | undefined>();
  const [savingsDecision, setSavingsDecision] = useState<'achieved' | 'missed' | undefined>();

  const [actualFixed, setActualFixed] = useState<number>(0);
  const [actualFlex, setActualFlex] = useState<number>(0);
  const [actualSaved, setActualSaved] = useState<number>(0);

  const [fixedScore, setFixedScore] = useState<number>(0);
  const [flexScore, setFlexScore] = useState<number>(0);
  const [saveScore, setSaveScore] = useState<number>(0);

  const [streakCount, setStreakCount] = useState<number>(0);

  const isMountedRef = useRef<boolean>(true);

  const updateViewDecisions = useCallback(
    (weeksList: WeekInfo[], viewIndex: number) => {
      if (weeksList.length === 0 || viewIndex >= weeksList.length) return;
      const cur = weeksList[viewIndex];

      const fDec = cur.fixed_status;
      const flDec = cur.flexible_status;
      const sDec = cur.savings_status;

      setFixedDecision(fDec);
      setFlexibleDecision(flDec);
      setSavingsDecision(sDec);

      setActualFixed(cur.spent_fixed ?? 0);
      setActualFlex(cur.spent_flexible ?? 0);
      setActualSaved(cur.spent_savings ?? 0);

      // Reloading a submitted week shows base scores only (Flutter lines 150-168)
      const fSc = fDec === 'achieved' ? 15 : 0;
      const flSc = flDec === 'achieved' ? 15 : 0;
      const sSc = sDec === 'achieved' ? 10 : 0;

      setFixedScore(fSc);
      setFlexScore(flSc);
      setSaveScore(sSc);

      const disc = calculateLocalDisciplineScore(fSc, flSc, sSc);
      setDisciplineScore(disc);
      // NOTE: We do NOT call setLocalExpenseScore here to avoid Flutter's zero-score quirk!
    },
    []
  );

  const loadWeeklyData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsEmpty(false);

    try {
      const [dashboardRes, weeklyLogsRes, profileRes] = await Promise.allSettled([
        apiService.getDashboard(),
        apiService.getWeeklyCurrent({ month: currentMonth, year: currentYear }),
        apiService.getMasterProfile(),
      ]);

      if (!isMountedRef.current) return;

      // Check if dashboard has pending calculations (404) or failed
      if (dashboardRes.status === 'rejected') {
        const err = dashboardRes.reason;
        const msg = String(err?.message || err);
        if (
          msg.includes('404') ||
          msg.includes('Calculations Pending') ||
          msg.includes('No weekly') ||
          err?.statusCode === 404
        ) {
          setIsEmpty(true);
          setLoading(false);
          return;
        }
        throw err;
      }

      const dashboard = dashboardRes.value ?? {};
      const weeklyLogsData =
        weeklyLogsRes.status === 'fulfilled' ? weeklyLogsRes.value?.data ?? [] : [];
      const profileData =
        profileRes.status === 'fulfilled' ? profileRes.value?.data ?? {} : {};

      const profileJson = profileData.profile_json ?? profileData;
      const mIncome =
        Number(profileJson.monthlyActiveIncome || profileData.monthlyActiveIncome || 0) || 0;
      const wIncome = mIncome / 4;

      const expPillarScore = Number(
        dashboard.financial_fitness_scores?.expense_pillar_score ?? 0
      );
      const expScores = dashboard.expense_scores ?? {};
      const discMsg = expScores.discipline_message || 'Keep tracking your expenses daily.';

      const generatedWeeks = calculateMonthWeeks(
        currentYear,
        currentMonth,
        wIncome,
        expPillarScore,
        new Date(),
        weeklyLogsData
      );

      // Determine active calendar week index
      let activeIdx = 0;
      const currentWeekIdx = generatedWeeks.findIndex((w) => w.is_current);
      if (currentWeekIdx !== -1) {
        activeIdx = currentWeekIdx;
      } else {
        // Default to first unsubmitted or last week
        const firstUnsubmitted = generatedWeeks.findIndex((w) => !w.is_submitted);
        activeIdx = firstUnsubmitted !== -1 ? firstUnsubmitted : 0;
      }

      // Hit rate: achieved logs / total weekCount
      const hitCount = weeklyLogsData.filter(
        (l: any) => l.status === 'achieved'
      ).length;
      const hitStr = `${hitCount}/${generatedWeeks.length}`;

      setWeeklyIncome(wIncome);
      setMonthlyActiveIncome(mIncome);
      setExpenseScore(expPillarScore);
      setDisciplineMsg(discMsg);
      setWeeks(generatedWeeks);
      setActiveCalendarWeekIndex(activeIdx);
      setCurrentViewWeekIndex(activeIdx);
      setTargetsHit(hitStr);

      updateViewDecisions(generatedWeeks, activeIdx);

      // Refresh streak
      const streak = gamificationStore.getStreak();
      setStreakCount(streak);

      setLoading(false);
    } catch (e: any) {
      if (!isMountedRef.current) return;
      const msg = e?.message || String(e);
      if (
        msg.includes('404') ||
        msg.includes('Calculations Pending') ||
        msg.includes('No weekly') ||
        e?.statusCode === 404
      ) {
        setIsEmpty(true);
        setError(null);
      } else {
        setError(msg);
      }
      setLoading(false);
    }
  }, [currentMonth, currentYear, updateViewDecisions]);

  useEffect(() => {
    isMountedRef.current = true;
    loadWeeklyData();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadWeeklyData]);

  const handleSelectWeek = useCallback(
    (index: number) => {
      if (index < 0 || index >= weeks.length) return;
      setCurrentViewWeekIndex(index);
      updateViewDecisions(weeks, index);
    },
    [weeks, updateViewDecisions]
  );

  const handleDecision = useCallback(
    (
      type: 'fixed' | 'flexible' | 'savings',
      decision: 'achieved' | 'missed',
      amount?: number
    ) => {
      if (weeks.length === 0 || currentViewWeekIndex >= weeks.length) return;
      const cur = weeks[currentViewWeekIndex];

      let newFixedDec = fixedDecision;
      let newFlexDec = flexibleDecision;
      let newSaveDec = savingsDecision;

      let newFixedAmt = actualFixed;
      let newFlexAmt = actualFlex;
      let newSaveAmt = actualSaved;

      let newFixedScore = fixedScore;
      let newFlexScore = flexScore;
      let newSaveScore = saveScore;

      if (decision === 'missed') {
        if (type === 'fixed') {
          newFixedDec = 'missed';
          newFixedScore = 0;
          newFixedAmt = 0;
        } else if (type === 'flexible') {
          newFlexDec = 'missed';
          newFlexScore = 0;
          newFlexAmt = 0;
        } else if (type === 'savings') {
          newSaveDec = 'missed';
          newSaveScore = 0;
          newSaveAmt = 0;
        }
      } else {
        // achieved
        const amt = amount ?? 0;
        if (type === 'fixed') {
          newFixedDec = 'achieved';
          newFixedAmt = amt;
          newFixedScore = calculateCategoryScore(amt, cur.range_fixed[0], cur.range_fixed[1], 'fixed');
        } else if (type === 'flexible') {
          newFlexDec = 'achieved';
          newFlexAmt = amt;
          newFlexScore = calculateCategoryScore(amt, cur.range_flex[0], cur.range_flex[1], 'flexible');
        } else if (type === 'savings') {
          newSaveDec = 'achieved';
          newSaveAmt = amt;
          newSaveScore = calculateCategoryScore(amt, cur.range_save[0], cur.range_save[1], 'savings');
        }
      }

      setFixedDecision(newFixedDec);
      setFlexibleDecision(newFlexDec);
      setSavingsDecision(newSaveDec);

      setActualFixed(newFixedAmt);
      setActualFlex(newFlexAmt);
      setActualSaved(newSaveAmt);

      setFixedScore(newFixedScore);
      setFlexScore(newFlexScore);
      setSaveScore(newSaveScore);

      const newDiscScore = calculateLocalDisciplineScore(newFixedScore, newFlexScore, newSaveScore);
      setDisciplineScore(newDiscScore);

      // Writes local_expense_score ONLY when user marks a decision!
      gamificationStore.setLocalExpenseScore(newDiscScore);
    },
    [weeks, currentViewWeekIndex, fixedDecision, flexibleDecision, savingsDecision, actualFixed, actualFlex, actualSaved, fixedScore, flexScore, saveScore]
  );

  const submitWeek = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!fixedDecision || !flexibleDecision || !savingsDecision) {
      return { success: false, error: 'Please mark all three targets before submitting.' };
    }

    if (weeks.length === 0 || currentViewWeekIndex >= weeks.length) {
      return { success: false, error: 'Invalid week.' };
    }

    const cur = weeks[currentViewWeekIndex];
    const overallStatus =
      fixedDecision === 'achieved' &&
      flexibleDecision === 'achieved' &&
      savingsDecision === 'achieved'
        ? 'achieved'
        : 'missed';

    try {
      await apiService.updateWeeklyStatus({
        weekIndex: cur.index, // 1-BASED
        month: currentMonth,
        year: currentYear,
        status: overallStatus,
        fixedStatus: fixedDecision,
        flexibleStatus: flexibleDecision,
        savingsStatus: savingsDecision,
        spentFixed: actualFixed,
        spentFlexible: actualFlex,
        spentSavings: actualSaved,
      });

      // Update streak and XP triggers (Flutter lines 324-326)
      gamificationStore.updateStreak();
      gamificationStore.rewardWeeklyCheckin();

      // Persist local_expense_score to override dashboard
      gamificationStore.setLocalExpenseScore(disciplineScore);

      // Refetch updated data
      await loadWeeklyData();

      return { success: true };
    } catch (e: any) {
      const msg = e?.message || String(e);
      return { success: false, error: msg };
    }
  }, [
    fixedDecision,
    flexibleDecision,
    savingsDecision,
    weeks,
    currentViewWeekIndex,
    currentMonth,
    currentYear,
    actualFixed,
    actualFlex,
    actualSaved,
    disciplineScore,
    loadWeeklyData,
  ]);

  const heatmapDays = deriveHeatmapDays(currentYear, currentMonth, weeks);

  return {
    loading,
    error,
    isEmpty,
    currentYear,
    currentMonth,
    weeks,
    currentViewWeekIndex,
    activeCalendarWeekIndex,
    weeklyIncome,
    monthlyActiveIncome,
    expenseScore,
    disciplineScore,
    targetsHit,
    disciplineMsg,
    heatmapDays,
    streakCount,
    fixedDecision,
    flexibleDecision,
    savingsDecision,
    actualFixed,
    actualFlex,
    actualSaved,
    setCurrentViewWeekIndex: handleSelectWeek,
    handleDecision,
    submitWeek,
    refetch: loadWeeklyData,
  };
}
