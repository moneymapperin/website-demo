import React, { useEffect } from 'react';
import { Hero } from '../components/Hero';
import { CTASection } from '../components/CTASection';

export const HomePage: React.FC = () => {
  useEffect(() => {
    document.title = 'MoneyMapper - Map Your Money. Build Your Future.';
  }, []);

  return (
    <>
      <Hero />
      <CTASection />
    </>
  );
};

export default HomePage;

