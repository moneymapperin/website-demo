/**
 * MoneyMapper Design Tokens
 * 
 * Source of truth:
 * - reference/moneymapper_app/lib/theme/app_theme.dart (AppColors)
 * - reference/moneymapper_app/lib/screens/main_screen.dart (_pillars)
 */

export const APP_COLORS = {
  // Brand Colors
  primary: '#4F46E5',
  secondary: '#10B981',
  success: '#10B981',
  vibrantGreen: '#00E676',
  accent: '#8B5CF6',
  warning: '#F59E0B',
  danger: '#EF4444',
  headerPurple: '#2E1065',
  headerPurpleDark: '#1E0A45',

  // Light Mode Colors
  background: '#F9FAFB',
  card: '#FFFFFF',
  borderLight: '#E5E7EB',
  textPrimaryLight: '#111827',
  textSecondaryLight: '#4B5563',

  // Dark Mode Colors (Zinc Premium Dark Theme)
  darkBackground: '#09090B',
  darkCard: '#0D0E15',
  darkBorder: '#27272A',
  textPrimaryDark: '#FAFAFA',
  textSecondaryDark: '#A1A1AA',
} as const;

export const APP_RADII = {
  card: '24px',
  input: '16px',
  button: '16px',
} as const;

export interface FinancialPillar {
  title: string;
  route: string;
  webRoute: string;
  color: string;
  desc: string;
  isPremium: boolean;
}

export const PREMIUM_PILLAR_TITLES = [
  'Insurance Dashboard',
  'Mutual Fund Dashboard',
  'Emergency Readiness',
] as const;

export const FINANCIAL_PILLARS: readonly FinancialPillar[] = [
  {
    title: 'Insurance Dashboard',
    route: '/insurance_p',
    webRoute: '/pillars/insurance',
    color: '#08796F',
    desc: 'Life, health & asset coverage overview',
    isPremium: true,
  },
  {
    title: 'Income Pillar Matrix',
    route: '/income_p',
    webRoute: '/pillars/income',
    color: '#208858',
    desc: 'Analyse all your income streams',
    isPremium: false,
  },
  {
    title: 'Weekly Expense Predictor',
    route: '/weekly_expense_p',
    webRoute: '/pillars/expenses',
    color: '#C9A84C',
    desc: 'Forecast & control weekly spending',
    isPremium: false,
  },
  {
    title: 'Mutual Fund Dashboard',
    route: '/mutual_fund_p',
    webRoute: '/pillars/investments',
    color: '#35C4C4',
    desc: 'Monitor your MF portfolio growth',
    isPremium: true,
  },
  {
    title: 'Emergency Readiness',
    route: '/emergency_fund_p',
    webRoute: '/pillars/emergency',
    color: '#F06464',
    desc: 'Emergency fund status & readiness',
    isPremium: true,
  },
] as const;

export interface NavItem {
  id: string;
  label: string;
  path: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'home', label: 'Home', path: '/dashboard' },
  { id: 'insights', label: 'Insights', path: '/insights' },
  { id: 'ai-assistant', label: 'AI Assistant', path: '/ai-assistant' },
  { id: 'profile', label: 'Profile', path: '/profile' },
] as const;
