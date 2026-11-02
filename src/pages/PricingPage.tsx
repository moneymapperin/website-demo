import React, { useEffect } from 'react';
import { PricingSection } from '../components/PricingSection';

export const PricingPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Pricing | MoneyMapper';
  }, []);

  return (
    <>
      <PricingSection />
    </>
  );
};

export default PricingPage;

