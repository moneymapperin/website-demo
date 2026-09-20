import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { ThemeProvider } from '../context/ThemeContext';
import { authService } from '../services/authService';
import { apiService } from '../services/apiService';
import { gamificationStore } from '../services/gamificationStore';
import {
  ALL_BADGES,
  evaluateBadgeCriteria,
  checkAndUnlockBadges,
  BadgeEvaluationContext,
} from '../services/badgeService';
import {
  exportProfileAsCsv,
  exportProfileAsJson,
  escapeCsvCell,
  getExportFilename,
} from '../services/exportService';
import {
  generateReferralCode,
  getReferralShareMessage,
  getReferralWhatsAppUrl,
  ReferralPage,
} from '../pages/ReferralPage';
import { sanitizeHtml } from '../utils/sanitizeHtml';
import { PrivacyPolicyPage } from '../pages/PrivacyPolicyPage';
import { ProfilePage } from '../pages/ProfilePage';
import { AchievementsPage } from '../pages/AchievementsPage';
import { DashboardPage } from '../pages/DashboardPage';

// Mock authService and apiService
vi.mock('../services/apiService', () => ({
  apiService: {
    getMasterProfile: vi.fn(),
    getDashboard: vi.fn(),
  },
}));

vi.mock('../services/authService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/authService')>();
  return {
    ...actual,
    authService: {
      ...actual.authService,
      getUserName: vi.fn(),
      getUserEmail: vi.fn(),
      getUserPlan: vi.fn(),
      getMasterProfileLocally: vi.fn(),
      logout: vi.fn().mockResolvedValue(undefined),
    },
  };
});

describe('TASK 13 — Profile Tab and Secondary Screens', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  const renderWithProviders = (
    ui: React.ReactNode,
    {
      user = null,
      initialRoute = '/profile',
    }: { user?: any; initialRoute?: string } = {}
  ) => {
    const authContextValue = {
      user,
      session: user ? ({ user } as any) : null,
      loading: false,
      isLoading: false,
      isLoggedIn: !!user,
      isCorporateAdmin: false,
      refreshSession: vi.fn(),
      logout: vi.fn().mockResolvedValue(undefined),
    };

    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthContext.Provider value={authContextValue}>
          <ThemeProvider>
            <ToastProvider>
              <Routes>
                <Route path="/profile" element={ui} />
                <Route path="/achievements" element={<AchievementsPage />} />
                <Route path="/referral" element={<ReferralPage />} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/master-data" element={<div data-testid="master-data-page">Master Data Page</div>} />
                <Route path="/subscription" element={<div data-testid="subscription-page">Subscription Page</div>} />
                <Route path="/" element={<div data-testid="landing-page">Landing Page</div>} />
              </Routes>
            </ToastProvider>
          </ThemeProvider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };

  // --------------------------------------------------------------------------
  // 1. User Header & Profile Screen Rendering
  // --------------------------------------------------------------------------
  describe('1. Profile Page Rendering', () => {
    it('renders user info from session metadata and shows initials, greeting, streak badge, and standard plan', async () => {
      vi.mocked(authService.getUserName).mockResolvedValue('Aarav Sharma');
      vi.mocked(authService.getUserEmail).mockResolvedValue('aarav@moneymapper.io');
      vi.mocked(authService.getUserPlan).mockResolvedValue('b2c');
      localStorage.setItem('streak_count_weekly', '3');

      renderWithProviders(<ProfilePage />, {
        user: {
          id: 'usr-12345678',
          email: 'aarav@moneymapper.io',
          user_metadata: { fullName: 'Aarav Sharma' },
        },
      });

      // Name & Email
      expect(await screen.findByTestId('user-name')).toHaveTextContent('Aarav Sharma');
      expect(screen.getByTestId('user-email')).toHaveTextContent('aarav@moneymapper.io');

      // Initials: Aarav Sharma -> AS
      expect(screen.getByTestId('user-avatar')).toHaveTextContent('AS');

      // Streak badge: 3 WEEKS
      expect(screen.getByTestId('streak-badge')).toHaveTextContent('3 WEEKS');

      // Subscription card: Basic Access (Free)
      expect(screen.getByTestId('subscription-card')).toHaveTextContent('BASIC ACCESS (FREE)');
      expect(screen.queryByTestId('pro-badge')).toBeNull();
    });

    it('renders PRO badge and WEALTH SELECT (PRO) when user is PRO', async () => {
      vi.mocked(authService.getUserName).mockResolvedValue('Priya Patel');
      vi.mocked(authService.getUserEmail).mockResolvedValue('priya@moneymapper.io');
      localStorage.setItem('user_plan', 'pro');

      renderWithProviders(<ProfilePage />, {
        user: {
          id: 'usr-pro-1234',
          email: 'priya@moneymapper.io',
          user_metadata: { fullName: 'Priya Patel' },
        },
      });

      expect(await screen.findByTestId('pro-badge')).toHaveTextContent('PRO');
      expect(screen.getByTestId('subscription-card')).toHaveTextContent('WEALTH SELECT (PRO)');
    });

    it('renders only SSL SECURED trust badge and omits SEBI CERTIFIED', async () => {
      renderWithProviders(<ProfilePage />);

      expect(await screen.findByTestId('trust-badge-ssl')).toHaveTextContent('SSL SECURED');
      expect(screen.queryByText(/SEBI CERTIFIED/i)).toBeNull();
    });

    it('does not render mobile-only App Lock or Weekly Reminders settings', async () => {
      renderWithProviders(<ProfilePage />);

      expect(screen.queryByText('App Lock')).toBeNull();
      expect(screen.queryByText('Weekly Reminders')).toBeNull();
      expect(screen.queryByLabelText('App lock toggle')).toBeNull();
      expect(screen.queryByLabelText('Weekly reminders toggle')).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // 2. Logout Flow
  // --------------------------------------------------------------------------
  describe('2. Logout Flow', () => {
    it('opens confirm dialog on click and cancels without calling authService.logout', async () => {
      renderWithProviders(<ProfilePage />);

      const logoutBtn = await screen.findByTestId('btn-logout');
      fireEvent.click(logoutBtn);

      expect(screen.getByTestId('logout-dialog')).toBeInTheDocument();

      // Click cancel
      const cancelBtn = screen.getByTestId('logout-cancel-btn');
      fireEvent.click(cancelBtn);

      expect(screen.queryByTestId('logout-dialog')).toBeNull();
      expect(authService.logout).not.toHaveBeenCalled();
    });

    it('confirms logout, calls authService.logout, and redirects to /', async () => {
      renderWithProviders(<ProfilePage />);

      const logoutBtn = await screen.findByTestId('btn-logout');
      fireEvent.click(logoutBtn);

      const confirmBtn = screen.getByTestId('logout-confirm-btn');
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(authService.logout).toHaveBeenCalled();
        expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // 3. Theme Toggle Persistence
  // --------------------------------------------------------------------------
  describe('3. Theme Toggle Persistence', () => {
    it('toggling theme mode updates ThemeProvider and persists to localStorage', async () => {
      renderWithProviders(<ProfilePage />);

      const darkBtn = await screen.findByTestId('theme-btn-dark');
      fireEvent.click(darkBtn);
      expect(localStorage.getItem('theme_mode')).toBe('dark');

      const lightBtn = screen.getByTestId('theme-btn-light');
      fireEvent.click(lightBtn);
      expect(localStorage.getItem('theme_mode')).toBe('light');

      const systemBtn = screen.getByTestId('theme-btn-system');
      fireEvent.click(systemBtn);
      expect(localStorage.getItem('theme_mode')).toBeNull(); // removed for system
    });
  });

  // --------------------------------------------------------------------------
  // 4. Financial Profile Export (CSV & JSON)
  // --------------------------------------------------------------------------
  describe('4. Financial Profile Export (CSV & JSON)', () => {
    const sampleProfile = {
      fullName: 'Sarthak Nigam',
      email: 'sarthak@moneymapper.io',
      monthlyActiveIncome: 150000,
      monthlyFixedExpenses: 50000,
      activeLoans: 0,
      termCover: 10000000,
      emergencyFundCurrent: 300000,
      access_token: 'secret-token-must-be-omitted',
      refresh_token: 'refresh-token-must-be-omitted',
    };

    it('exportProfileAsCsv produces valid CSV with UTF-8 BOM, headers, and values matching fixture', () => {
      const columns = ['fullName', 'email', 'monthlyActiveIncome', 'monthlyFixedExpenses', 'activeLoans'];
      const csv = exportProfileAsCsv(sampleProfile, columns);

      // Must start with UTF-8 BOM
      expect(csv.startsWith('\uFEFF')).toBe(true);

      // Must contain header row and value row
      const lines = csv.replace('\uFEFF', '').trim().split('\r\n');
      expect(lines[0]).toBe('fullName,email,monthlyActiveIncome,monthlyFixedExpenses,activeLoans');
      expect(lines[1]).toBe('Sarthak Nigam,sarthak@moneymapper.io,150000,50000,0');
    });

    it('escapes quotes, commas, and newlines per RFC 4180', () => {
      expect(escapeCsvCell('Hello, World')).toBe('"Hello, World"');
      expect(escapeCsvCell('Line 1\nLine 2')).toBe('"Line 1\nLine 2"');
      expect(escapeCsvCell('He said "Hello"')).toBe('"He said ""Hello"""');
    });

    it('guards against CSV formula injection by prefixing =, +, -, @, \\t, \\r with single quote', () => {
      expect(escapeCsvCell('=cmd|/C calc')).toBe("'=cmd|/C calc");
      expect(escapeCsvCell('+12345')).toBe("'+12345");
      expect(escapeCsvCell('-999')).toBe("'-999");
      expect(escapeCsvCell('@SUM')).toBe("'@SUM");
      expect(escapeCsvCell('@SUM(1,2)')).toBe('"\'@SUM(1,2)"');
      expect(escapeCsvCell('\ttext')).toBe("'\ttext");
      expect(escapeCsvCell('\rtext')).toBe('"\'\rtext"');
    });

    it('filters out sensitive auth tokens and session keys in CSV and JSON output', () => {
      const csv = exportProfileAsCsv(sampleProfile);
      expect(csv).not.toContain('secret-token-must-be-omitted');
      expect(csv).not.toContain('access_token');
      expect(csv).not.toContain('refresh_token');

      const json = exportProfileAsJson(sampleProfile);
      expect(json).not.toContain('secret-token-must-be-omitted');
      expect(json).not.toContain('access_token');
      expect(json).not.toContain('refresh_token');

      const parsed = JSON.parse(json);
      expect(parsed.fullName).toBe('Sarthak Nigam');
      expect(parsed.activeLoans).toBe(0);
      expect(parsed.access_token).toBeUndefined();
    });

    it('generates filename in format moneymapper_profile_YYYY-MM-DD.csv/.json', () => {
      const testDate = new Date(2026, 4, 30); // May 30, 2026
      expect(getExportFilename('csv', testDate)).toBe('moneymapper_profile_2026-05-30.csv');
      expect(getExportFilename('json', testDate)).toBe('moneymapper_profile_2026-05-30.json');
    });

    it('does not render export financial profile or web login QR tile on profile page', async () => {
      renderWithProviders(<ProfilePage />);

      expect(screen.queryByTestId('btn-export-profile')).toBeNull();
      expect(screen.queryByTestId('tile-web-login')).toBeNull();
      expect(screen.queryByTestId('export-dialog')).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // 5. Table-Driven Badge Evaluation Rules
  // --------------------------------------------------------------------------
  describe('5. Badge Evaluation Rules (badgeService)', () => {
    it('debt_free: unlocks ONLY when activeLoans is defined and numerically 0', () => {
      // Missing profile -> false
      expect(evaluateBadgeCriteria('debt_free', { profile: null })).toBe(false);

      // Missing activeLoans key -> false (Web deviation)
      expect(evaluateBadgeCriteria('debt_free', { profile: { fullName: 'John' } })).toBe(false);

      // Blank string -> false
      expect(evaluateBadgeCriteria('debt_free', { profile: { activeLoans: '   ' } })).toBe(false);

      // Non-zero loans -> false
      expect(evaluateBadgeCriteria('debt_free', { profile: { activeLoans: '2' } })).toBe(false);
      expect(evaluateBadgeCriteria('debt_free', { profile: { activeLoans: 1 } })).toBe(false);

      // Numerically 0 -> true!
      expect(evaluateBadgeCriteria('debt_free', { profile: { activeLoans: 0 } })).toBe(true);
      expect(evaluateBadgeCriteria('debt_free', { profile: { activeLoans: '0' } })).toBe(true);
    });

    it('emergency_complete: unlocks when emergency pillar score >= 100', () => {
      expect(
        evaluateBadgeCriteria('emergency_complete', {
          dashboard: { pillars: { emergency: { score: 99 } } },
        })
      ).toBe(false);

      expect(
        evaluateBadgeCriteria('emergency_complete', {
          dashboard: { pillars: { emergency: { score: 100 } } },
        })
      ).toBe(true);

      expect(
        evaluateBadgeCriteria('emergency_complete', {
          dashboard: { pillars: { emergency: { score: 105 } } },
        })
      ).toBe(true);
    });

    it('investment_starter: unlocks when investment pillar score > 0', () => {
      expect(
        evaluateBadgeCriteria('investment_starter', {
          dashboard: { pillars: { investment: { score: 0 } } },
        })
      ).toBe(false);

      expect(
        evaluateBadgeCriteria('investment_starter', {
          dashboard: { pillars: { investment: { score: 1 } } },
        })
      ).toBe(true);
    });

    it('protection_pro: unlocks when protection pillar score >= 90', () => {
      expect(
        evaluateBadgeCriteria('protection_pro', {
          dashboard: { pillars: { protection: { score: 89 } } },
        })
      ).toBe(false);

      expect(
        evaluateBadgeCriteria('protection_pro', {
          dashboard: { pillars: { protection: { score: 90 } } },
        })
      ).toBe(true);
    });

    it('comeback_kid: unlocks when streak >= 1 and streak_reset_happened is true', () => {
      expect(
        evaluateBadgeCriteria('comeback_kid', {
          streak: 0,
          streakResetHappened: true,
        })
      ).toBe(false);

      expect(
        evaluateBadgeCriteria('comeback_kid', {
          streak: 2,
          streakResetHappened: false,
        })
      ).toBe(false);

      expect(
        evaluateBadgeCriteria('comeback_kid', {
          streak: 1,
          streakResetHappened: true,
        })
      ).toBe(true);
    });

    it('checkAndUnlockBadges unlocks eligible badges, grants +100 XP once, and clears streak_reset_happened', async () => {
      localStorage.setItem('streak_reset_happened', 'true');

      const context: BadgeEvaluationContext = {
        profile: { activeLoans: 0 },
        dashboard: {
          pillars: {
            emergency: { score: 100 },
            investment: { score: 50 },
            protection: { score: 95 },
          },
        },
        streak: 2,
        streakResetHappened: true,
      };

      const startXp = gamificationStore.getTotalXp();
      const newlyUnlocked = await checkAndUnlockBadges(context, gamificationStore);

      // All 5 badges are eligible!
      expect(newlyUnlocked).toHaveLength(5);
      expect(newlyUnlocked).toEqual(
        expect.arrayContaining([
          'debt_free',
          'emergency_complete',
          'investment_starter',
          'protection_pro',
          'comeback_kid',
        ])
      );

      // +100 XP per badge = +500 XP
      expect(gamificationStore.getTotalXp()).toBe(startXp + 500);

      // streak_reset_happened flag cleared
      expect(localStorage.getItem('streak_reset_happened')).toBe('false');

      // Second call is idempotent (rewardBadge returns false if already unlocked)
      const secondCall = await checkAndUnlockBadges(context, gamificationStore);
      expect(secondCall).toHaveLength(0);
      expect(gamificationStore.getTotalXp()).toBe(startXp + 500);
    });

    it('DashboardPage: triggers checkAndUnlockBadges on data load and records unlocked badges', async () => {
      const mockDashboardData = {
        financial_fitness_scores: {
          global_fitness_score: 85,
          income_pillar_score: 80,
          expense_pillar_score: 70,
          savings_pillar_score: 100,
          protection_pillar_score: 92,
          investment_pillar_score: 75,
        },
      };

      vi.mocked(apiService.getDashboard).mockResolvedValue(mockDashboardData as any);
      vi.mocked(apiService.getMasterProfile).mockResolvedValue({ activeLoans: 0 } as any);

      renderWithProviders(<DashboardPage />, {
        initialRoute: '/dashboard',
        user: { id: 'usr-dash-1' },
      });

      await waitFor(() => {
        const unlocked = gamificationStore.getUnlockedBadges();
        expect(unlocked).toContain('emergency_complete');
        expect(unlocked).toContain('investment_starter');
        expect(unlocked).toContain('protection_pro');
      });
    });
  });

  // --------------------------------------------------------------------------
  // 6. Referral Screen & Code Generation
  // --------------------------------------------------------------------------
  describe('6. Referral Screen (/referral)', () => {
    it('calculates referral code as MM + last 6 characters uppercased, or MMUSER when missing/short', () => {
      expect(generateReferralCode(null)).toBe('MMUSER');
      expect(generateReferralCode('')).toBe('MMUSER');
      expect(generateReferralCode('12345')).toBe('MMUSER');
      expect(generateReferralCode('user-id-xyz890')).toBe('MMXYZ890');
      expect(generateReferralCode('abcdef123456')).toBe('MM123456');
    });

    it('renders referral code and WhatsApp share button with exact message', () => {
      const testUser = { id: 'usr-uuid-abcdef' };
      renderWithProviders(<ReferralPage />, { user: testUser });

      expect(screen.getByTestId('referral-code-text')).toHaveTextContent('MMABCDEF');

      const expectedMsg = getReferralShareMessage('MMABCDEF');
      expect(expectedMsg).toBe(
        "Hey! I'm using MoneyMapper to track my financial health. Use my referral code *MMABCDEF* to join and get your financial score! Download here: https://moneymapper.in"
      );

      const expectedUrl = getReferralWhatsAppUrl('MMABCDEF');
      expect(expectedUrl).toBe(`https://wa.me/?text=${encodeURIComponent(expectedMsg)}`);

      // Verify omission of unverified audit bonus sentence
      expect(screen.queryByText(/free financial audit/i)).toBeNull();
    });

    it('clicking copy referral code triggers toast', async () => {
      renderWithProviders(<ReferralPage />, { user: { id: 'usr-uuid-123456' } });

      const copyBtn = screen.getByTestId('copy-referral-btn');
      fireEvent.click(copyBtn);

      expect(await screen.findByText('Code copied to clipboard!')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 7. Privacy Page HTML Sanitization
  // --------------------------------------------------------------------------
  describe('7. Privacy Page HTML Sanitization', () => {
    it('sanitizes dangerous tags (script, iframe, form, object, embed)', () => {
      const malicious = `
        <div>
          <h1>Privacy Terms</h1>
          <script>alert('XSS')</script>
          <iframe src="https://evil.com"></iframe>
          <form action="/steal"><input type="text" /></form>
          <p>Valid content here</p>
        </div>
      `;
      const clean = sanitizeHtml(malicious);
      expect(clean).not.toContain('<script');
      expect(clean).not.toContain('<iframe');
      expect(clean).not.toContain('<form');
      expect(clean).toContain('<h1>Privacy Terms</h1>');
      expect(clean).toContain('<p>Valid content here</p>');
    });

    it('strips inline event handler attributes (onerror, onload, onclick)', () => {
      const malicious = '<img src="invalid.jpg" onerror="alert(1)" onclick="steal()" />';
      const clean = sanitizeHtml(malicious);
      expect(clean).not.toContain('onerror');
      expect(clean).not.toContain('onclick');
    });

    it('strips javascript: pseudo-protocol URLs and adds rel="noopener noreferrer" to links', () => {
      const malicious = '<a href="javascript:alert(1)">Click me</a>';
      const clean = sanitizeHtml(malicious);
      expect(clean).not.toContain('javascript:');

      const safeLink = '<a href="https://moneymapper.in">Home</a>';
      const cleanLink = sanitizeHtml(safeLink);
      expect(cleanLink).toContain('rel="noopener noreferrer"');
      expect(cleanLink).toContain('target="_blank"');
    });

    it('renders privacy policy document in PrivacyPolicyPage with back button', async () => {
      renderWithProviders(<PrivacyPolicyPage />);

      expect(await screen.findByTestId('privacy-policy-content')).toBeInTheDocument();
      expect(screen.getAllByText('Privacy Policy').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Information We Collect/i)).toBeInTheDocument();
      expect(screen.getByText(/Data Security & Storage/i)).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 8. Achievements Page Rendering
  // --------------------------------------------------------------------------
  describe('8. Achievements Page (/achievements)', () => {
    it('renders level, XP progress, and lists all 5 badges with locked and unlocked states', async () => {
      localStorage.setItem('user_total_xp', '450');
      localStorage.setItem('unlocked_badges_list', JSON.stringify(['debt_free']));
      localStorage.setItem('streak_count_weekly', '4');

      renderWithProviders(<AchievementsPage />);

      // Level 2 (450 XP is in level 2: 300 - 700)
      expect(await screen.findByText('LVL 2')).toBeInTheDocument();
      expect(screen.getByText(/450 \/ 700 XP/)).toBeInTheDocument();

      // Debt free is unlocked
      const debtCard = screen.getByTestId('badge-card-debt_free');
      expect(debtCard).toHaveTextContent('UNLOCKED • +100 XP');

      // Emergency complete is locked
      const emergencyCard = screen.getByTestId('badge-card-emergency_complete');
      expect(emergencyCard).toHaveTextContent('LOCKED');

      // Verify all 5 badges exist
      ALL_BADGES.forEach((b) => {
        expect(screen.getByTestId(`badge-card-${b.id}`)).toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // 9. Support & Feedback Modals
  // --------------------------------------------------------------------------
  describe('9. Support & Feedback Modals', () => {
    it('opens FAQ modal and toggles question expansion', async () => {
      renderWithProviders(<ProfilePage />);

      const faqBtn = await screen.findByTestId('btn-faq-modal');
      fireEvent.click(faqBtn);

      expect(screen.getByTestId('faq-modal')).toBeInTheDocument();

      // Click first FAQ
      const firstFaq = screen.getByText('How does MoneyMapper make me better with money?');
      fireEvent.click(firstFaq);

      // Answer should now be visible
      expect(
        screen.getByText(/MoneyMapper converts your income, expenses, savings, protection, and investments/i)
      ).toBeInTheDocument();
    });

    it('submits rating feedback via mailto and shows thank you toast', async () => {
      renderWithProviders(<ProfilePage />);

      const rateBtn = await screen.findByTestId('btn-rate-modal');
      fireEvent.click(rateBtn);

      expect(screen.getByTestId('rating-dialog')).toBeInTheDocument();

      // Pick 4 stars
      const star4 = screen.getByTestId('rate-star-4');
      fireEvent.click(star4);

      // Enter feedback text
      const input = screen.getByTestId('rating-feedback-input');
      fireEvent.change(input, { target: { value: 'Great financial insights!' } });

      // Click submit
      const submitBtn = screen.getByTestId('rating-submit-btn');
      fireEvent.click(submitBtn);

      expect(await screen.findByText('Thank you for your feedback!')).toBeInTheDocument();
      expect(screen.queryByTestId('rating-dialog')).toBeNull();
    });
  });
});
