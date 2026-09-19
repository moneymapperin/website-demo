import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

export interface UseMasterProfileResult {
  profile: Record<string, any> | null;
  isLoading: boolean;
  error: string | null;
  updateProfile: (data: Record<string, any>) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useMasterProfile(): UseMasterProfileResult {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const activeUserIdRef = useRef<string | null>(userId);
  activeUserIdRef.current = userId;
  const isMountedRef = useRef<boolean>(true);
  const inFlightRef = useRef<Promise<void> | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
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
        const res = await apiService.getMasterProfile();
        if (!isMountedRef.current || activeUserIdRef.current !== userId) {
          return;
        }
        setProfile(res.data);
        setError(null);
      } catch (err: any) {
        if (!isMountedRef.current || activeUserIdRef.current !== userId) {
          return;
        }
        setError(err?.message ?? 'Failed to load profile');
        setProfile(null);
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

  const updateProfile = useCallback(
    async (data: Record<string, any>) => {
      setIsLoading(true);
      setError(null);
      try {
        await apiService.updateMasterProfile(data);
        if (isMountedRef.current && activeUserIdRef.current === userId) {
          setProfile(data);
        }
      } catch (err: any) {
        if (isMountedRef.current && activeUserIdRef.current === userId) {
          setError(err?.message ?? 'Failed to update profile');
        }
        throw err;
      } finally {
        if (isMountedRef.current && activeUserIdRef.current === userId) {
          setIsLoading(false);
        }
      }
    },
    [userId]
  );

  useEffect(() => {
    isMountedRef.current = true;
    fetchProfile();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchProfile]);

  return { profile, isLoading, error, updateProfile, refetch: fetchProfile };
}
