import React from 'react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { PillarsSection } from '../components/PillarsSection';
import { DashboardPreview } from '../components/DashboardPreview';
import { HowItWorksSection } from '../components/HowItWorksSection';
import { BenefitsSection } from '../components/BenefitsSection';
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

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 1. Hero Section */}
        <Hero />

        {/* 2. Features Section (5 Financial Pillars Deep Dive) */}
        <PillarsSection />

        {/* 3. Dashboard Preview Section */}
        <section id="dashboard-preview" className="relative scroll-mt-24 py-16 sm:py-20 lg:py-24 overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_10%,rgba(139,92,246,0.14),transparent_65%)]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#171329] border border-brand-purple/30 text-xs font-semibold text-purple-300 shadow-sm shadow-brand-purple/20 mb-4 backdrop-blur-sm">
                <span className="text-brand-magenta text-sm leading-none">✦</span>
                <span className="tracking-wider uppercase text-[11px]">Interactive Workspace</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight text-white mb-4 leading-tight">
                Experience the MoneyMapper{' '}
                <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent">
                  Web Dashboard
                </span>
              </h2>
              <p className="text-sm sm:text-base text-white/60 font-normal leading-relaxed">
                A desktop-optimized command center built for deep portfolio audits, weekly budget forecasting, and live financial fitness monitoring.
              </p>
            </div>
            <DashboardPreview />
          </div>
        </section>

        {/* 4. How It Works Section */}
        <HowItWorksSection />

        {/* 5. Benefits Section */}
        <BenefitsSection />

        {/* 6. AI Assistant Section */}
        <AIAssistantSection />

        {/* 7. Insights & News Section */}
        <InsightsSection />

        {/* 8. Pricing Section */}
        <PricingSection />

        {/* 9. About Section */}
        <AboutSection />

        {/* 10. Call To Action Section */}
        <CTASection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
