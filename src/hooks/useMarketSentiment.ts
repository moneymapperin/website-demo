import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/apiService';

export interface UseMarketSentimentResult {
  sentiment: Record<string, any> | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMarketSentiment(): UseMarketSentimentResult {
  const [sentiment, setSentiment] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef<boolean>(true);
  const inFlightRef = useRef<Promise<void> | null>(null);

  const fetchSentiment = useCallback(async () => {
    if (inFlightRef.current) {
      return inFlightRef.current;
    }

    setIsLoading(true);
    setError(null);

    const promise = (async () => {
      try {
        const res = await apiService.getMarketSentiment();
        if (!isMountedRef.current) return;
        setSentiment(res);
        setError(null);
      } catch (err: any) {
        if (!isMountedRef.current) return;
        setError(err?.message ?? 'Failed to load market sentiment');
        setSentiment(null);
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
        inFlightRef.current = null;
      }
    })();

    inFlightRef.current = promise;
    return promise;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchSentiment();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchSentiment]);

  return { sentiment, isLoading, error, refetch: fetchSentiment };
}
