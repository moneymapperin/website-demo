import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import React from 'react';
import { ComingSoonProvider, useComingSoon } from '../context/ComingSoonContext';
import { ComingSoonModal } from '../components/ComingSoonModal';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { PillarsSection } from '../components/PillarsSection';
import { FeatureCards } from '../components/FeatureCards';
import { Footer } from '../components/Footer';
import { AIAssistantSection } from '../components/AIAssistantSection';
import { InsightsSection } from '../components/InsightsSection';
import * as navigation from '../lib/navigation';
import * as hasSessionHook from '../hooks/useHasSession';

function ModalTestWrapper({
  featureName = 'Emergency Fund',
  children,
}: {
  featureName?: string;
  children?: React.ReactNode;
}) {
  const { openComingSoon } = useComingSoon();
  return (
    <div>
      <button id="test-open-btn" onClick={() => openComingSoon(featureName)}>
        Open Modal
      </button>
      {children}
      <ComingSoonModal />
    </div>
  );
}

describe('Task 1: Please Login First Modal & Navigation', () => {
  let navigateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    navigateSpy = vi.spyOn(navigation, 'navigateTo').mockImplementation(() => {});
    vi.spyOn(hasSessionHook, 'useHasSession').mockReturnValue(false);
  });

  describe('ComingSoonModal Behavior and Copy', () => {
    it('is hidden by default', () => {
      render(
        <ComingSoonProvider>
          <ComingSoonModal />
        </ComingSoonProvider>
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('opens with the correct featureName and shows "Please login first 🔒"', () => {
      render(
        <ComingSoonProvider>
          <ModalTestWrapper featureName="Emergency Fund Pillar" />
        </ComingSoonProvider>
      );

      fireEvent.click(screen.getByText('Open Modal'));

      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
      expect(within(modal).getByText('Please login first 🔒')).toBeInTheDocument();
      expect(within(modal).getByText('Emergency Fund Pillar')).toBeInTheDocument();
      expect(
        within(modal).getByText(/is available after you log in\. Log in to continue\./i)
      ).toBeInTheDocument();
    });

    it('contains zero user-visible "Coming Soon" or "on its way" text', () => {
      render(
        <ComingSoonProvider>
          <ModalTestWrapper featureName="Investment Tracker" />
        </ComingSoonProvider>
      );

      fireEvent.click(screen.getByText('Open Modal'));

      expect(screen.queryByText(/Coming Soon/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/on its way/i)).not.toBeInTheDocument();
    });

    it('"Login" button calls navigateTo("/login") and closes the modal', () => {
      render(
        <ComingSoonProvider>
          <ModalTestWrapper featureName="Stock Signals" />
        </ComingSoonProvider>
      );

      fireEvent.click(screen.getByText('Open Modal'));
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();

      const loginBtn = within(modal).getByRole('button', { name: /^Login$/i });
      fireEvent.click(loginBtn);

      expect(navigateSpy).toHaveBeenCalledWith('/login');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('"Not now" button closes the modal without navigating', () => {
      render(
        <ComingSoonProvider>
          <ModalTestWrapper />
        </ComingSoonProvider>
      );

      fireEvent.click(screen.getByText('Open Modal'));
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();

      const notNowBtn = within(modal).getByRole('button', { name: /Not now/i });
      fireEvent.click(notNowBtn);

      expect(navigateSpy).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('Escape key closes the modal', () => {
      render(
        <ComingSoonProvider>
          <ModalTestWrapper />
        </ComingSoonProvider>
      );

      fireEvent.click(screen.getByText('Open Modal'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('Backdrop click closes the modal', () => {
      render(
        <ComingSoonProvider>
          <ModalTestWrapper />
        </ComingSoonProvider>
      );

      fireEvent.click(screen.getByText('Open Modal'));
      const backdrop = screen.getByRole('dialog');
      fireEvent.click(backdrop);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Navbar Direct Navigation & Modals', () => {
    it('Navbar Login buttons navigate directly to /login with no popup', () => {
      render(
        <ComingSoonProvider>
          <Navbar />
          <ComingSoonModal />
        </ComingSoonProvider>
      );

      const navLoginBtn = screen.getByRole('button', { name: /^Login$/i });
      fireEvent.click(navLoginBtn);

      expect(navigateSpy).toHaveBeenCalledWith('/login');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('Navbar "Get Started" buttons navigate directly to /register', () => {
      render(
        <ComingSoonProvider>
          <Navbar />
          <ComingSoonModal />
        </ComingSoonProvider>
      );

      const navGetStartedBtn = screen.getByRole('button', { name: /^Get Started$/i });
      fireEvent.click(navGetStartedBtn);

      expect(navigateSpy).toHaveBeenCalledWith('/register');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('Navbar section links scroll without opening a popup', () => {
      const scrollIntoView = vi.fn();
      render(
        <ComingSoonProvider>
          <Navbar />
          <ComingSoonModal />
          <section id="pricing" ref={(element) => {
            if (element) element.scrollIntoView = scrollIntoView;
          }} />
        </ComingSoonProvider>
      );

      const pricingLink = screen.getByRole('button', { name: /^Pricing$/i });
      fireEvent.click(pricingLink);

      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
      expect(window.location.hash).toBe('#pricing');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Pricing$/i })).toHaveAttribute('aria-current', 'location');
    });
  });

  describe('Landing page interactions without login prompts', () => {
    it('Hero Explore Features scrolls to Features and Get Started Free navigates to /register', () => {
      const scrollSpy = vi.spyOn(navigation, 'scrollToLandingSection').mockImplementation(() => {});
      render(
        <ComingSoonProvider>
          <Hero />
          <ComingSoonModal />
        </ComingSoonProvider>
      );

      const exploreBtn = screen.getByRole('button', { name: /Explore Features/i });
      fireEvent.click(exploreBtn);
      expect(scrollSpy).toHaveBeenCalledWith('features');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      const getStartedFreeBtn = screen.getByRole('button', { name: /Get Started Free/i });
      fireEvent.click(getStartedFreeBtn);
      expect(navigateSpy).toHaveBeenCalledWith('/register');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('pillar and feature cards are inert', () => {
      render(
        <ComingSoonProvider>
          <PillarsSection />
          <FeatureCards />
          <ComingSoonModal />
        </ComingSoonProvider>
      );

      const mutualFundsCard = screen.getByRole('heading', { name: 'Mutual Funds' });
      fireEvent.click(mutualFundsCard);
      fireEvent.click(screen.getByText('Secure & Private'));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('Footer section links scroll and informational links are inert', () => {
      const scrollSpy = vi.spyOn(navigation, 'scrollToLandingSection').mockImplementation(() => {});
      render(
        <ComingSoonProvider>
          <Footer />
          <ComingSoonModal />
        </ComingSoonProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: 'About Us' }));
      expect(scrollSpy).toHaveBeenCalledWith('about');

      const careersLink = screen.getByText('Careers');
      expect(careersLink.tagName).toBe('SPAN');
      fireEvent.click(careersLink);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('AI Assistant CTA navigates to /register without opening a popup', () => {
      render(
        <ComingSoonProvider>
          <AIAssistantSection />
          <ComingSoonModal />
        </ComingSoonProvider>
      );

      const aiBtn = screen.getByRole('button', { name: /Try AI Assistant/i });
      fireEvent.click(aiBtn);

      expect(navigateSpy).toHaveBeenCalledWith('/register');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('Insights tabs switch content without opening a popup', async () => {
      render(
        <ComingSoonProvider>
          <InsightsSection />
          <ComingSoonModal />
        </ComingSoonProvider>
      );

      const learnGrowTab = screen.getByRole('button', { name: /Learn & Grow/i });
      fireEvent.click(learnGrowTab);

      await waitFor(() => expect(learnGrowTab).toHaveClass('bg-[#231b3e]'));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(navigateSpy).not.toHaveBeenCalled();
    });
  });

  describe('Mocked Active Session Behavior', () => {
    it('with a mocked session, a click goes directly to /dashboard with no popup', () => {
      vi.spyOn(hasSessionHook, 'useHasSession').mockReturnValue(true);

      render(
        <ComingSoonProvider>
          <ModalTestWrapper featureName="Emergency Fund Pillar" />
        </ComingSoonProvider>
      );

      fireEvent.click(screen.getByText('Open Modal'));

      expect(navigateSpy).toHaveBeenCalledWith('/dashboard');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('with a mocked session, clicking a landing pillar card remains inert', () => {
      vi.spyOn(hasSessionHook, 'useHasSession').mockReturnValue(true);

      render(
        <ComingSoonProvider>
          <PillarsSection />
          <ComingSoonModal />
        </ComingSoonProvider>
      );

      const insuranceCard = screen.getByRole('heading', { name: 'Insurance' });
      fireEvent.click(insuranceCard);

      expect(navigateSpy).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
