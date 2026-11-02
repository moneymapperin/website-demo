import React, { useEffect } from 'react';
import { PillarsSection } from '../components/PillarsSection';
import { AIAssistantSection } from '../components/AIAssistantSection';

export const FeaturesPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Features | MoneyMapper';
  }, []);

  return (
    <>
      <PillarsSection />
      <AIAssistantSection />
    </>
  );
};

export default FeaturesPage;

