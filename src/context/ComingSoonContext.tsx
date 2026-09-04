import React, { createContext, useContext, useState, useCallback } from 'react';

export interface ComingSoonContextType {
  isOpen: boolean;
  featureName: string;
  openComingSoon: (featureName: string) => void;
  closeComingSoon: () => void;
}

export const ComingSoonContext = createContext<ComingSoonContextType | undefined>(undefined);

export const ComingSoonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [featureName, setFeatureName] = useState('');

  const openComingSoon = useCallback((feature: string) => {
    setFeatureName(feature || 'This feature');
    setIsOpen(true);
  }, []);

  const closeComingSoon = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <ComingSoonContext.Provider
      value={{
        isOpen,
        featureName,
        openComingSoon,
        closeComingSoon,
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
