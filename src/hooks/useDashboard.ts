import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/apiService';
import { DashboardData } from '../models/dashboard';
import { useAuth } from '../context/AuthContext';

export interface UseDashboardResult {
  data: DashboardData | null;
  rawData: Record<string, any> | null;
  isLoading: boolean;
  error: string | null;
  statusCode: number | null;
  isPending: boolean;
  refetch: () => Promise<void>;
}

export function useDashboard(): UseDashboardResult {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [data, setData] = useState<DashboardData | null>(null);
  const [rawData, setRawData] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);

  const activeUserIdRef = useRef<string | null>(userId);
  activeUserIdRef.current = userId;
  const isMountedRef = useRef<boolean>(true);
  const inFlightRef = useRef<Promise<void> | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!userId) {
      setData(null);
      setRawData(null);
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
        const res = await apiService.getDashboard();
        if (!isMountedRef.current || activeUserIdRef.current !== userId) {
          return;
        }
        const model = DashboardData.fromCoreSchema(res);
        setRawData(res);
        setData(model);
        setStatusCode(null);
        setError(null);
      } catch (err: any) {
        if (!isMountedRef.current || activeUserIdRef.current !== userId) {
          return;
        }
        const status = err?.statusCode ?? (err?.message?.includes('404') ? 404 : null);
        setStatusCode(status);
        setError(err?.message ?? 'Failed to load dashboard');
        setData(null);
        setRawData(null);
      } finally {
        if (isMountedRef.current && activeUserIdRef.current === userId) {
          setIsLoading(false);
        }
        inFlightRef.current = null;
      }
    })();

    inFlightRef.current = promise;
    return promise;
  }, [userId]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchDashboard();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchDashboard]);

  const isPending =
    statusCode === 404 ||
    statusCode === 401 ||
    error === 'Calculations Pending' ||
    error?.includes('Calculations Pending') === true;

  return { data, rawData, isLoading, error, statusCode, isPending, refetch: fetchDashboard };
}
