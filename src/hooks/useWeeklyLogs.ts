import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

export interface UseWeeklyLogsOptions {
  month?: number;
  year?: number;
}

export interface UseWeeklyLogsResult {
  logs: any[];
  isLoading: boolean;
  error: string | null;
  updateStatus: (params: {
    weekIndex: number;
    status: string;
    month?: number;
    year?: number;
    fixedStatus?: string;
    flexibleStatus?: string;
    savingsStatus?: string;
    spentFixed?: number;
    spentFlexible?: number;
    spentSavings?: number;
  }) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useWeeklyLogs(options?: UseWeeklyLogsOptions): UseWeeklyLogsResult {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const month = options?.month;
  const year = options?.year;

  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const activeUserIdRef = useRef<string | null>(userId);
  activeUserIdRef.current = userId;
  const isMountedRef = useRef<boolean>(true);
  const inFlightRef = useRef<Promise<void> | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!userId) {
      setLogs([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (inFlightRef.current) {
      return inFlightRef.current;
    }

    setIsLoading(true);
    setError(null);

    const promise = (async () => {
      try {
        const res = await apiService.getWeeklyCurrent({ month, year });
        if (!isMountedRef.current || activeUserIdRef.current !== userId) {
          return;
        }
        setLogs(Array.isArray(res.data) ? res.data : []);
        setError(null);
      } catch (err: any) {
        if (!isMountedRef.current || activeUserIdRef.current !== userId) {
          return;
        }
        setError(err?.message ?? 'Failed to load weekly logs');
        setLogs([]);
      } finally {
        if (isMountedRef.current && activeUserIdRef.current === userId) {
          setIsLoading(false);
        }
        inFlightRef.current = null;
      }
    })();

    inFlightRef.current = promise;
    return promise;
  }, [userId, month, year]);

  const updateStatus = useCallback(
    async (params: {
      weekIndex: number;
      status: string;
      month?: number;
      year?: number;
      fixedStatus?: string;
      flexibleStatus?: string;
      savingsStatus?: string;
      spentFixed?: number;
      spentFlexible?: number;
      spentSavings?: number;
    }) => {
      setIsLoading(true);
      setError(null);
      try {
        await apiService.updateWeeklyStatus(params);
        await fetchLogs();
      } catch (err: any) {
        if (isMountedRef.current && activeUserIdRef.current === userId) {
          setError(err?.message ?? 'Failed to update weekly status');
        }
        throw err;
      } finally {
        if (isMountedRef.current && activeUserIdRef.current === userId) {
          setIsLoading(false);
        }
      }
    },
    [userId, fetchLogs]
  );

  useEffect(() => {
    isMountedRef.current = true;
    fetchLogs();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchLogs]);

  return { logs, isLoading, error, updateStatus, refetch: fetchLogs };
}
