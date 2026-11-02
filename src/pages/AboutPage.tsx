import React, { useEffect } from 'react';
import { AboutSection } from '../components/AboutSection';

export const AboutPage: React.FC = () => {
  useEffect(() => {
    document.title = 'About Us | MoneyMapper';
  }, []);

  return (
    <>
      <AboutSection />
    </>
  );
};

export default AboutPage;

