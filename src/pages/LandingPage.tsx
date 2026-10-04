import React from 'react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { PillarsSection } from '../components/PillarsSection';
import { AIAssistantSection } from '../components/AIAssistantSection';
import { InsightsSection } from '../components/InsightsSection';
import { AboutSection } from '../components/AboutSection';
import { PricingSection } from '../components/PricingSection';
import { CTASection } from '../components/CTASection';
import { Footer } from '../components/Footer';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-white flex flex-col selection:bg-brand-purple/30 selection:text-white">
      {/* Sticky Glassmorphic Navbar */}
      <Navbar />

      {/* Sections */}
      <main className="flex-1">
        <Hero />
        <PillarsSection />
        <AIAssistantSection />
        <InsightsSection />
        <PricingSection />
        <AboutSection />
        <CTASection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
