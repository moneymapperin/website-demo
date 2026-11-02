import React, { useEffect } from 'react';
import { InsightsSection } from '../components/InsightsSection';

export const InsightsMarketingPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Insights | MoneyMapper';
  }, []);

  return (
    <>
      <InsightsSection />
    </>
  );
};

export default InsightsMarketingPage;

