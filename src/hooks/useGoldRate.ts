import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/apiService';

export interface UseGoldRateResult {
  goldData: Record<string, any> | null;
  isLoading: boolean;
  refetch: (forceRefresh?: boolean) => Promise<void>;
}

export function useGoldRate(): UseGoldRateResult {
  const [goldData, setGoldData] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isMountedRef = useRef<boolean>(true);

  const fetchRate = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      const res = await apiService.getGoldRate(forceRefresh);
      if (isMountedRef.current) {
        setGoldData(res);
      }
    } catch {
      if (isMountedRef.current) {
        setGoldData(null);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchRate();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchRate]);

  return { goldData, isLoading, refetch: fetchRate };
}
