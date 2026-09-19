import React, { createContext, useContext, useState, useCallback } from 'react';
import { useHasSession } from '../hooks/useHasSession';
import { navigateTo } from '../lib/navigation';

export interface ComingSoonContextType {
  isOpen: boolean;
  featureName: string;
  openComingSoon: (featureName: string) => void;
  openLoginPrompt: (featureName: string) => void;
  closeComingSoon: () => void;
  closeLoginPrompt: () => void;
}

export const ComingSoonContext = createContext<ComingSoonContextType | undefined>(undefined);

export const ComingSoonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [featureName, setFeatureName] = useState('');
  const hasSession = useHasSession();

  const openComingSoon = useCallback(
    (feature: string) => {
      if (hasSession) {
        navigateTo('/dashboard');
        return;
      }
      setFeatureName(feature || 'This feature');
      setIsOpen(true);
    },
    [hasSession]
  );

  const closeComingSoon = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <ComingSoonContext.Provider
      value={{
        isOpen,
        featureName,
        openComingSoon,
        openLoginPrompt: openComingSoon,
        closeComingSoon,
        closeLoginPrompt: closeComingSoon,
      }}
    >
      {children}
    </ComingSoonContext.Provider>
  );
};

export const useComingSoon = (): ComingSoonContextType => {
  const context = useContext(ComingSoonContext);
  if (!context) {
    throw new Error('useComingSoon must be used within a ComingSoonProvider');
  }
  return context;
};

export const useLoginPrompt = useComingSoon;
