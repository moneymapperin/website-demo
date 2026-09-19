import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { AuthContext } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import { useDashboard } from '../hooks/useDashboard';
import { useMasterProfile } from '../hooks/useMasterProfile';
import { useWeeklyLogs } from '../hooks/useWeeklyLogs';
import { useMarketSentiment } from '../hooks/useMarketSentiment';

function createAuthWrapper(userId: string | null = 'test-user-1') {
  const user = userId ? ({ id: userId, email: `${userId}@test.com` } as any) : null;
  return function AuthWrapper({ children }: { children: React.ReactNode }) {
    return (
      <AuthContext.Provider
        value={{
          user,
          session: user ? ({ user } as any) : null,
          isLoading: false,
          isLoggedIn: !!user,
          logout: async () => {},
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  };
}

describe('TASK 6 — Typed Data Hooks', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    apiService.clearAllAppCache();
  });

  /* -------------------------------------------------------------------------- */
  /* useDashboard Hook                                                          */
  /* -------------------------------------------------------------------------- */
  describe('useDashboard', () => {
    it('initializes with loading state, resolves data model, and supports refetch', async () => {
      vi.spyOn(apiService, 'getDashboard').mockResolvedValue({
        financial_fitness_scores: { global_fitness_score: 78 },
        income_scores: { active_income_score: 80 },
        expense_scores: { fixed_score: 70, discipline_message: 'Great budget!' },
        savings_scores: {},
        protection_scores: {},
        investment_scores: {},
      });

      const { result } = renderHook(() => useDashboard(), {
        wrapper: createAuthWrapper('user-101'),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.fitnessScore).toBe(78);
      expect(result.current.data?.summary.finTip).toBe('Great budget!');
      expect(result.current.error).toBeNull();

      // Refetch
      await act(async () => {
        await result.current.refetch();
      });
      expect(apiService.getDashboard).toHaveBeenCalledTimes(2);
    });

    it('handles error state properly when getDashboard rejects', async () => {
      vi.spyOn(apiService, 'getDashboard').mockRejectedValue(new Error('Calculations Pending'));

      const { result } = renderHook(() => useDashboard(), {
        wrapper: createAuthWrapper('user-101'),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe('Calculations Pending');
    });

    it('unmount ignores late-arriving responses without errors', async () => {
      let finishPromise: (val: any) => void;
      vi.spyOn(apiService, 'getDashboard').mockImplementation(
        () =>
          new Promise((resolve) => {
            finishPromise = resolve;
          })
      );

      const { result, unmount } = renderHook(() => useDashboard(), {
        wrapper: createAuthWrapper('user-101'),
      });

      expect(result.current.isLoading).toBe(true);
      // Unmount before network request completes
      unmount();

      // Resolve afterwards
      act(() => {
        finishPromise!({ financial_fitness_scores: { global_fitness_score: 60 } });
      });

      // State was safely discarded
      expect(result.current.data).toBeNull();
    });
  });

  /* -------------------------------------------------------------------------- */
  /* useMasterProfile Hook                                                      */
  /* -------------------------------------------------------------------------- */
  describe('useMasterProfile', () => {
    it('fetches profile and supports updateProfile', async () => {
      vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({
        data: { fullName: 'Alex', monthlyIncome: 100000 },
      });
      vi.spyOn(apiService, 'updateMasterProfile').mockResolvedValue({ status: 'success' });

      const { result } = renderHook(() => useMasterProfile(), {
        wrapper: createAuthWrapper('user-profile-1'),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.profile).toEqual({ fullName: 'Alex', monthlyIncome: 100000 });

      // Update profile
      await act(async () => {
        await result.current.updateProfile({ fullName: 'Alex Smith', monthlyIncome: 120000 });
      });

      expect(apiService.updateMasterProfile).toHaveBeenCalledWith({
        fullName: 'Alex Smith',
        monthlyIncome: 120000,
      });
      expect(result.current.profile?.fullName).toBe('Alex Smith');
    });
  });

  /* -------------------------------------------------------------------------- */
  /* useWeeklyLogs Hook                                                         */
  /* -------------------------------------------------------------------------- */
  describe('useWeeklyLogs', () => {
    it('loads logs and executes updateStatus', async () => {
      vi.spyOn(apiService, 'getWeeklyCurrent').mockResolvedValue({
        data: [{ week_index: 1, status: 'GREEN' }],
      });
      vi.spyOn(apiService, 'updateWeeklyStatus').mockResolvedValue({ status: 'success' });

      const { result } = renderHook(() => useWeeklyLogs({ month: 9, year: 2026 }), {
        wrapper: createAuthWrapper('user-weekly-1'),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.logs).toEqual([{ week_index: 1, status: 'GREEN' }]);

      await act(async () => {
        await result.current.updateStatus({ weekIndex: 2, status: 'RED' });
      });

      expect(apiService.updateWeeklyStatus).toHaveBeenCalledWith({ weekIndex: 2, status: 'RED' });
    });
  });

  /* -------------------------------------------------------------------------- */
  /* useMarketSentiment Hook                                                    */
  /* -------------------------------------------------------------------------- */
  describe('useMarketSentiment', () => {
    it('loads market sentiment', async () => {
      vi.spyOn(apiService, 'getMarketSentiment').mockResolvedValue({
        mood: 'BULLISH',
        score: 75,
      });

      const { result } = renderHook(() => useMarketSentiment());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.sentiment).toEqual({ mood: 'BULLISH', score: 75 });
    });
  });
});
