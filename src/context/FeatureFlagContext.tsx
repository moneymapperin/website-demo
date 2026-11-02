import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { featureFlagService, FeatureKey } from '../services/featureFlagService';

export interface FeatureFlagContextType {
  flags: Record<string, boolean>;
  isLoading: boolean;
  isEnabled: (key: FeatureKey | string) => boolean;
}

export const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

const FOCUS_REFETCH_THROTTLE_MS = 60000; // 60 seconds max refetch on focus

export const FeatureFlagProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flags, setFlags] = useState<Record<string, boolean>>(() => featureFlagService.getAllFlags());
  const [isLoading, setIsLoading] = useState<boolean>(!featureFlagService.isInitialized);
  const lastFetchTimeRef = useRef<number>(0);

  const loadFlags = useCallback(async () => {
    try {
      const updatedFlags = await featureFlagService.fetchFlags();
      setFlags(updatedFlags);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    lastFetchTimeRef.current = Date.now();
    loadFlags();

    const handleFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      const now = Date.now();
      if (now - lastFetchTimeRef.current >= FOCUS_REFETCH_THROTTLE_MS) {
        lastFetchTimeRef.current = now;
        loadFlags();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [loadFlags]);

  const isEnabled = useCallback(
    (key: FeatureKey | string): boolean => {
      return flags[key] ?? featureFlagService.isEnabled(key);
    },
    [flags]
  );

  return (
    <FeatureFlagContext.Provider value={{ flags, isLoading, isEnabled }}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

const DEFAULT_FEATURE_FLAG_CONTEXT: FeatureFlagContextType = {
  flags: {},
  isLoading: false,
  isEnabled: (_key: FeatureKey | string) => true,
};

export const useFeatureFlags = (): FeatureFlagContextType => {
  const context = useContext(FeatureFlagContext);
  return context ?? DEFAULT_FEATURE_FLAG_CONTEXT;
};

export const useFeatureFlag = (key: FeatureKey | string): boolean => {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    return true;
  }
  return context.isEnabled(key);
};
