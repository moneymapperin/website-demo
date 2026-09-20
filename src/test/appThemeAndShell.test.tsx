import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, renderHook } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import tailwindConfig from '../../tailwind.config.js';
import {
  APP_COLORS,
  APP_RADII,
  FINANCIAL_PILLARS,
} from '../theme/tokens';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';
import { usePlan } from '../hooks/usePlan';
import { authService } from '../services/authService';
import { AppShell } from '../components/app/AppShell';
import { ScoreGauge, getSegmentFill, getInterpolatedColor } from '../components/ui/ScoreGauge';
import { PillarCard } from '../components/ui/PillarCard';
import { Card } from '../components/ui/Card';
import { PrimaryButton, OutlinedButton } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { ShimmerBox, DashboardSkeleton } from '../components/ui/Skeleton';
import { SparklineChart } from '../components/ui/SparklineChart';

describe('TASK 5 — App Theme Tokens & Shell', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    // Default document state for landing page
    document.documentElement.className = 'dark';
    document.documentElement.style.colorScheme = 'dark';
  });

  afterEach(() => {
    document.documentElement.className = 'dark';
    document.documentElement.style.colorScheme = 'dark';
    delete (window as any).__MOCK_PLAN__;
  });

  /* -------------------------------------------------------------------------- */
  /* Requirement 4: Non-Self-Referential Token & Config Tests                    */
  /* -------------------------------------------------------------------------- */
  describe('Requirement 4: Non-self-referential token tests against Flutter source', () => {
    it('(a) regex parses reference app_theme.dart and matches APP_COLORS exactly', () => {
      const appThemePath = path.resolve(
        __dirname,
        '../../reference/moneymapper_app/lib/theme/app_theme.dart'
      );
      expect(fs.existsSync(appThemePath)).toBe(true);

      const content = fs.readFileSync(appThemePath, 'utf-8');

      // Match: static const name = Color(0xFFxxxxxx);
      const colorRegex =
        /static\s+const\s+([a-zA-Z0-9_]+)\s*=\s*Color\(0x[0-9A-Fa-f]{2}([0-9A-Fa-f]{6})\);/g;
      const parsedFlutterColors: Record<string, string> = {};

      let match: RegExpExecArray | null;
      while ((match = colorRegex.exec(content)) !== null) {
        const [, name, hex6] = match;
        parsedFlutterColors[name] = `#${hex6.toUpperCase()}`;
      }

      // Assert extracted keys count matches APP_COLORS
      const flutterKeys = Object.keys(parsedFlutterColors).sort();
      const tokenKeys = Object.keys(APP_COLORS).sort();

      expect(tokenKeys).toEqual(flutterKeys);

      // Assert each color matches exactly
      for (const key of flutterKeys) {
        expect(
          APP_COLORS[key as keyof typeof APP_COLORS].toUpperCase(),
          `Mismatch on color key: ${key}`
        ).toBe(parsedFlutterColors[key].toUpperCase());
      }
    });

    it('(a-2) regex parses reference main_screen.dart _pillars and matches FINANCIAL_PILLARS exactly', () => {
      const mainScreenPath = path.resolve(
        __dirname,
        '../../reference/moneymapper_app/lib/screens/main_screen.dart'
      );
      expect(fs.existsSync(mainScreenPath)).toBe(true);

      const content = fs.readFileSync(mainScreenPath, 'utf-8');

      // Match each pillar entry in _pillars list
      const pillarBlockRegex =
        /'title':\s*'([^']+)',\s*'route':\s*'([^']+)',\s*'icon':\s*[^,]+,\s*'color':\s*Color\(0x[0-9A-Fa-f]{2}([0-9A-Fa-f]{6})\),\s*'desc':\s*'([^']+)'/g;

      const parsedPillars: Array<{
        title: string;
        route: string;
        color: string;
        desc: string;
      }> = [];

      let match: RegExpExecArray | null;
      while ((match = pillarBlockRegex.exec(content)) !== null) {
        parsedPillars.push({
          title: match[1],
          route: match[2],
          color: `#${match[3].toUpperCase()}`,
          desc: match[4],
        });
      }

      expect(parsedPillars.length).toBe(5);
      expect(FINANCIAL_PILLARS.length).toBe(5);

      for (let i = 0; i < parsedPillars.length; i++) {
        expect(FINANCIAL_PILLARS[i].title).toBe(parsedPillars[i].title);
        expect(FINANCIAL_PILLARS[i].route).toBe(parsedPillars[i].route);
        expect(FINANCIAL_PILLARS[i].color.toUpperCase()).toBe(parsedPillars[i].color.toUpperCase());
        expect(FINANCIAL_PILLARS[i].desc).toBe(parsedPillars[i].desc);
      }
    });

    it('(b) tailwind.config.js mm color and radius values equal tokens.ts', () => {
      const tailwindMmColors = (tailwindConfig as any).theme?.extend?.colors?.mm;
      const tailwindMmRadii = (tailwindConfig as any).theme?.extend?.borderRadius?.mm;

      expect(tailwindMmColors).toBeDefined();
      expect(tailwindMmRadii).toBeDefined();

      // Assert mm colors match APP_COLORS
      for (const [key, value] of Object.entries(APP_COLORS)) {
        expect(
          tailwindMmColors[key]?.toUpperCase(),
          `Tailwind mm color mismatch on ${key}`
        ).toBe(value.toUpperCase());
      }

      // Assert mm radii match APP_RADII
      expect(tailwindMmRadii).toEqual(APP_RADII);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* Requirement 3: ScoreGauge Geometry & Interpolation Unit Tests              */
  /* -------------------------------------------------------------------------- */
  describe('Requirement 3: ScoreGauge geometry & fill math', () => {
    it('unit-tests fractional fill math for scores 0, 5, 50, 74, 100', () => {
      // Score = 0: All segments fill = 0
      for (let i = 0; i < 10; i++) {
        expect(getSegmentFill(0, i)).toBe(0);
      }

      // Score = 5: progress = 0.05, continuousFilled = 0.5
      // segment 0: fill = 0.5; segments 1-9: fill = 0
      expect(getSegmentFill(5, 0)).toBe(0.5);
      for (let i = 1; i < 10; i++) {
        expect(getSegmentFill(5, i)).toBe(0);
      }

      // Score = 50: progress = 0.5, continuousFilled = 5.0
      // segments 0-4: fill = 1.0; segments 5-9: fill = 0
      for (let i = 0; i < 5; i++) {
        expect(getSegmentFill(50, i)).toBe(1.0);
      }
      for (let i = 5; i < 10; i++) {
        expect(getSegmentFill(50, i)).toBe(0);
      }

      // Score = 74: progress = 0.74, continuousFilled = 7.4
      // segments 0-6: fill = 1.0; segment 7: fill = 0.4; segments 8-9: fill = 0
      for (let i = 0; i < 7; i++) {
        expect(getSegmentFill(74, i)).toBe(1.0);
      }
      expect(getSegmentFill(74, 7)).toBe(0.4);
      expect(getSegmentFill(74, 8)).toBe(0);
      expect(getSegmentFill(74, 9)).toBe(0);

      // Score = 100: progress = 1.0, continuousFilled = 10.0
      // All segments 0-9: fill = 1.0
      for (let i = 0; i < 10; i++) {
        expect(getSegmentFill(100, i)).toBe(1.0);
      }
    });

    it('unit-tests color interpolation across 5 stops at ratios 0, 0.5, 1', () => {
      // Ratio = 0 -> first stop: #EF4444
      expect(getInterpolatedColor(0).toUpperCase()).toBe('#EF4444');

      // Ratio = 0.5 -> middle stop (stop index 2): #FBBF24
      expect(getInterpolatedColor(0.5).toUpperCase()).toBe('#FBBF24');

      // Ratio = 1.0 -> last stop (stop index 4): #10B981
      expect(getInterpolatedColor(1).toUpperCase()).toBe('#10B981');
    });

    it('renders ScoreGauge component with center text score and "OF 100"', () => {
      render(
        <ThemeProvider>
          <ScoreGauge score={74} size={140} />
        </ThemeProvider>
      );

      expect(screen.getByTestId('score-gauge')).toBeInTheDocument();
      expect(screen.getByTestId('score-gauge-value').textContent).toBe('74');
      expect(screen.getByTestId('score-gauge-label').textContent).toBe('OF 100');
    });
  });

  /* -------------------------------------------------------------------------- */
  /* Requirement 5: Theme Isolation Lifecycle                                    */
  /* -------------------------------------------------------------------------- */
  describe('Requirement 5: Theme isolation between AppShell and outer pages', () => {
    it('applies light mode while AppShell is mounted, and restores landing dark styles on unmount', () => {
      // Pre-condition: landing page dark styles
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.style.colorScheme).toBe('dark');

      // Render AppShell with light theme
      localStorage.setItem('theme_mode', 'light');

      const { unmount } = render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <ThemeProvider>
            <ToastProvider>
              <AppShell>
                <div>Dashboard Inner</div>
              </AppShell>
            </ToastProvider>
          </ThemeProvider>
        </MemoryRouter>
      );

      // While mounted with light theme, dark class is removed and colorScheme is light
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(document.documentElement.style.colorScheme).toBe('light');

      // Unmount AppShell (leaving to landing/auth page)
      unmount();

      // Leaving AppShell MUST restore landing dark styles
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.style.colorScheme).toBe('dark');
    });

    it('light mode inside AppShell does not leave <html> in light mode after leaving', () => {
      localStorage.setItem('theme_mode', 'light');

      const { unmount } = render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <ThemeProvider>
            <ToastProvider>
              <AppShell>
                <div>Protected View</div>
              </AppShell>
            </ToastProvider>
          </ThemeProvider>
        </MemoryRouter>
      );

      expect(document.documentElement.style.colorScheme).toBe('light');
      unmount();
      expect(document.documentElement.style.colorScheme).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* Requirements 1 & 2: PillarCard & Locked Pillars Handling                   */
  /* -------------------------------------------------------------------------- */
  describe('Requirements 1 & 2: PillarCard & Locked Pillars', () => {
    it('usePlan returns stubbed isPro: false', () => {
      const { result } = renderHook(() => usePlan());
      expect(result.current.isPro).toBe(false);
      expect(result.current.plan).toBe('b2c');
    });

    it('PillarCard when locked displays "??" score and 0 progress', () => {
      render(
        <ThemeProvider>
          <ToastProvider>
            <MemoryRouter>
              <PillarCard title="Insurance Dashboard" score={82} isLocked={true} />
            </MemoryRouter>
          </ToastProvider>
        </ThemeProvider>
      );

      expect(screen.getByTestId('pillar-card-score').textContent).toBe('??');
      const progress = screen.getByTestId('pillar-card-progress');
      expect(progress.style.width).toBe('0%');
      expect(screen.getByTestId('pillar-card-lock')).toBeInTheDocument();
    });

    it('PillarCard unlocked calculates progress color: <40 danger, <=70 warning, >70 success', () => {
      const { rerender } = render(
        <ThemeProvider>
          <ToastProvider>
            <MemoryRouter>
              <PillarCard title="Test Pillar" score={35} />
            </MemoryRouter>
          </ToastProvider>
        </ThemeProvider>
      );

      let progress = screen.getByTestId('pillar-card-progress');
      expect(progress.style.backgroundColor).toBe('rgb(239, 68, 68)'); // #EF4444 danger

      rerender(
        <ThemeProvider>
          <ToastProvider>
            <MemoryRouter>
              <PillarCard title="Test Pillar" score={65} />
            </MemoryRouter>
          </ToastProvider>
        </ThemeProvider>
      );
      progress = screen.getByTestId('pillar-card-progress');
      expect(progress.style.backgroundColor).toBe('rgb(245, 158, 11)'); // #F59E0B warning

      rerender(
        <ThemeProvider>
          <ToastProvider>
            <MemoryRouter>
              <PillarCard title="Test Pillar" score={85} />
            </MemoryRouter>
          </ToastProvider>
        </ThemeProvider>
      );
      progress = screen.getByTestId('pillar-card-progress');
      expect(progress.style.backgroundColor).toBe('rgb(16, 185, 129)'); // #10B981 success
    });

    it('clicking a locked pillar shows toast with accent #8B5CF6 and UPGRADE action navigating to /subscription', async () => {
      let currentPath = '/dashboard';

      function RouteWatcher() {
        return (
          <div data-testid="route-indicator">
            {currentPath}
          </div>
        );
      }

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <ThemeProvider>
            <ToastProvider>
              <Routes>
                <Route
                  path="/dashboard"
                  element={
                    <div>
                      <PillarCard title="Insurance Dashboard" score={82} isLocked={true} />
                      <RouteWatcher />
                    </div>
                  }
                />
                <Route path="/subscription" element={<div>Subscription Page</div>} />
              </Routes>
            </ToastProvider>
          </ThemeProvider>
        </MemoryRouter>
      );

      // Click locked pillar
      fireEvent.click(screen.getByTestId('pillar-card'));

      // Expect toast to appear with exact user message
      const toast = await screen.findByTestId('toast-container');
      expect(toast).toHaveTextContent('Upgrade to PRO to unlock this pillar! 🚀');
      expect(toast.style.backgroundColor).toBe('rgb(139, 92, 246)'); // #8B5CF6

      // Click UPGRADE action button inside toast
      const upgradeBtn = screen.getByTestId('toast-action-button');
      expect(upgradeBtn).toHaveTextContent('UPGRADE');
      fireEvent.click(upgradeBtn);

      // Assert navigation to /subscription occurred
      await waitFor(() => {
        expect(screen.getByText('Subscription Page')).toBeInTheDocument();
      });
    });

    it('PillarCard copy exact styling: radius 24, emoji 28px, theme colors', () => {
      render(
        <ThemeProvider>
          <ToastProvider>
            <MemoryRouter>
              <PillarCard title="Emoji Test" score={75} emoji="🛡️" />
            </MemoryRouter>
          </ToastProvider>
        </ThemeProvider>
      );

      const card = screen.getByTestId('pillar-card');
      expect(card.style.minHeight).toBe('125px');
      expect(card.className).toContain('rounded-[24px]');

      const emoji = screen.getByText('🛡️');
      expect(emoji.style.fontSize).toBe('28px');
    });
  });

  /* -------------------------------------------------------------------------- */
  /* Requirement 7: AppShell Logout & Active Nested Route Highlighting          */
  /* -------------------------------------------------------------------------- */
  describe('Requirement 7: AppShell Logout & Active Route Highlighting', () => {
    it('logout button in AppShell calls authService.logout() then navigates to "/"', async () => {
      const logoutSpy = vi.spyOn(authService, 'logout').mockResolvedValue(undefined);

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <ThemeProvider>
            <ToastProvider>
              <Routes>
                <Route
                  path="/dashboard"
                  element={
                    <AppShell>
                      <div>Dashboard Content</div>
                    </AppShell>
                  }
                />
                <Route path="/" element={<div data-testid="landing-landing">Landing Screen</div>} />
              </Routes>
            </ToastProvider>
          </ThemeProvider>
        </MemoryRouter>
      );

      const logoutBtn = screen.getByTestId('logout-button');
      fireEvent.click(logoutBtn);

      await waitFor(() => {
        expect(logoutSpy).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(screen.getByTestId('landing-landing')).toBeInTheDocument();
      });
    });

    it('highlights the active route for nested paths (e.g. /pillars/income)', () => {
      render(
        <MemoryRouter initialEntries={['/pillars/income']}>
          <ThemeProvider>
            <ToastProvider>
              <AppShell>
                <div>Income Pillar Page</div>
              </AppShell>
            </ToastProvider>
          </ThemeProvider>
        </MemoryRouter>
      );

      const incomeTile = screen.getByTestId('pillar-nav-income-pillar-matrix');
      expect(incomeTile.className).toContain('ring-1 ring-indigo-500');
    });

    it('shows lock on 3 premium pillars for non-pro user and clicking them triggers upgrade toast', async () => {
      (window as any).__MOCK_PLAN__ = {
        isPro: false,
        isFeatureAccessible: false,
        trialActive: false,
        canAccessPremium: false,
        trialDaysRemaining: 0,
        plan: 'b2c',
      };

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <ThemeProvider>
            <ToastProvider>
              <Routes>
                <Route
                  path="/dashboard"
                  element={
                    <AppShell>
                      <div>Dashboard</div>
                    </AppShell>
                  }
                />
                <Route path="/subscription" element={<div>Subscription Screen</div>} />
              </Routes>
            </ToastProvider>
          </ThemeProvider>
        </MemoryRouter>
      );

      // Premium pillars: Insurance, Mutual Fund, Emergency
      const insuranceTile = screen.getByTestId('pillar-nav-insurance-dashboard');
      expect(insuranceTile).toHaveTextContent('🔒');

      const mfTile = screen.getByTestId('pillar-nav-mutual-fund-dashboard');
      expect(mfTile).toHaveTextContent('🔒');

      const emergencyTile = screen.getByTestId('pillar-nav-emergency-readiness');
      expect(emergencyTile).toHaveTextContent('🔒');

      // Free pillars: Income and Expenses do NOT have locks
      const incomeTile = screen.getByTestId('pillar-nav-income-pillar-matrix');
      expect(incomeTile).not.toHaveTextContent('🔒');

      const expenseTile = screen.getByTestId('pillar-nav-weekly-expense-predictor');
      expect(expenseTile).not.toHaveTextContent('🔒');

      // Clicking locked pillar triggers toast
      fireEvent.click(insuranceTile);
      const toast = await screen.findByTestId('toast-container');
      expect(toast).toHaveTextContent('Upgrade to PRO to unlock this pillar! 🚀');
    });
  });

  /* -------------------------------------------------------------------------- */
  /* UI Primitives Tests (Card, Button, TextField, Skeleton, Sparkline)          */
  /* -------------------------------------------------------------------------- */
  describe('UI Primitives Rendering & Tokens', () => {
    it('Card primitive renders with 24px radius', () => {
      render(
        <ThemeProvider>
          <Card data-testid="test-card">Card Content</Card>
        </ThemeProvider>
      );

      const card = screen.getByTestId('test-card');
      expect(card.className).toContain('rounded-[24px]');
      expect(card.className).toContain('border');
    });

    it('Button primitive renders primary and outlined with 16px radius', () => {
      render(
        <ThemeProvider>
          <PrimaryButton data-testid="btn-pri">Primary</PrimaryButton>
          <OutlinedButton data-testid="btn-out">Outlined</OutlinedButton>
        </ThemeProvider>
      );

      const pri = screen.getByTestId('btn-pri');
      expect(pri.style.borderRadius).toBe('16px');
      expect(pri.className).toContain('bg-[#4F46E5]');

      const out = screen.getByTestId('btn-out');
      expect(out.style.borderRadius).toBe('16px');
      expect(out.className).toContain('border');
    });

    it('TextField renders with 16px radius, label, error', () => {
      render(
        <ThemeProvider>
          <TextField label="Annual Income" error="Invalid input" />
        </ThemeProvider>
      );

      expect(screen.getByText(/annual income/i)).toBeInTheDocument();
      expect(screen.getByText('Invalid input')).toBeInTheDocument();
      const input = screen.getByRole('textbox');
      expect(input.style.borderRadius).toBe('16px');
    });

    it('Skeleton and SparklineChart render properly', () => {
      render(
        <ThemeProvider>
          <ShimmerBox width={100} height={20} />
          <DashboardSkeleton />
          <SparklineChart data={[10, 20, 15, 30, 25, 40]} />
        </ThemeProvider>
      );

      expect(screen.getAllByTestId('shimmer-box').length).toBeGreaterThan(0);
      expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
      expect(screen.getByTestId('sparkline-chart')).toBeInTheDocument();
    });
  });
});
