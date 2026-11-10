import React, { useEffect } from 'react';
import { Hero } from '../components/Hero';
import { FeatureCards } from '../components/FeatureCards';
import { WhyMoneyMapper } from '../components/WhyMoneyMapper';
import { FinancialFitnessScoreSection } from '../components/FinancialFitnessScoreSection';
import { ProductPreviewSection } from '../components/ProductPreviewSection';
import { HowItWorksSection } from '../components/HowItWorksSection';
import { HomeAiAssistantSection } from '../components/HomeAiAssistantSection';
import { InsideDashboardSection } from '../components/InsideDashboardSection';
import { BusinessSection } from '../components/BusinessSection';
import { SecurityPrivacySection } from '../components/SecurityPrivacySection';
import { TeamSection } from '../components/TeamSection';
import { StartJourneySection } from '../components/StartJourneySection';
import { CTASection } from '../components/CTASection';

export const HomePage: React.FC = () => {
  useEffect(() => {
    document.title = 'MoneyMapper - Understand Your Money. Own Your Future.';
  }, []);

  return (
    <>
      <Hero />
      <FeatureCards />
      <WhyMoneyMapper />
      <FinancialFitnessScoreSection />
      <ProductPreviewSection />
      <HowItWorksSection />
      <HomeAiAssistantSection />
      <InsideDashboardSection />
      <BusinessSection />
      <SecurityPrivacySection />
      <TeamSection />
      <StartJourneySection />
      <CTASection />
    </>
  );
};

export default HomePage;

