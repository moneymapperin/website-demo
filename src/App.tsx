import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute, PublicOnlyRoute } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { ComingSoonProvider } from './context/ComingSoonContext';
import { ComingSoonModal } from './components/ComingSoonModal';
import { NavigationBridge } from './components/NavigationBridge';
import { AppShell } from './components/app/AppShell';
import { LandingPage } from './pages/LandingPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { CorporateLoginPage } from './pages/CorporateLoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MasterDataPage } from './pages/MasterDataPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { WeeklyPage } from './pages/WeeklyPage';
import { InsightsPage } from './pages/InsightsPage';
import { NewsDetailPage } from './pages/NewsDetailPage';
import { GoldRatesPage } from './pages/GoldRatesPage';
import { StockScreenerPage } from './pages/StockScreenerPage';
import { MutualFundScreenerPage } from './pages/MutualFundScreenerPage';
import { MfRecommendationsPage } from './pages/MfRecommendationsPage';
import { InsuranceScreenerPage } from './pages/InsuranceScreenerPage';
import { AiAssistantPage } from './pages/AiAssistantPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <ComingSoonProvider>
              <NavigationBridge />
              <Routes>
                {/* 1. Landing Page */}
                <Route path="/" element={<LandingPage />} />

                {/* 2. QR Login Redirect */}
                <Route path="/qr-login" element={<Navigate to="/login" replace />} />

                {/* 3. Public Auth Routes */}
                <Route
                  path="/login"
                  element={
                    <PublicOnlyRoute>
                      <LoginPage />
                    </PublicOnlyRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicOnlyRoute>
                      <RegisterPage />
                    </PublicOnlyRoute>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <PublicOnlyRoute>
                      <ForgotPasswordPage />
                    </PublicOnlyRoute>
                  }
                />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/corporate-login" element={<CorporateLoginPage />} />
                <Route
                  path="/privacy"
                  element={
                    <PlaceholderPage title="Privacy Policy" description="MoneyMapper security and encryption terms." />
                  }
                />

                {/* 4. Canonical Redirects */}
                <Route path="/main" element={<Navigate to="/dashboard" replace />} />
                <Route path="/assistant" element={<Navigate to="/ai-assistant" replace />} />
                <Route path="/corporate/login" element={<Navigate to="/corporate-login" replace />} />
                <Route path="/corporate/dashboard" element={<Navigate to="/corporate-dashboard" replace />} />
                <Route path="/emergency_fund_p" element={<Navigate to="/pillars/emergency" replace />} />
                <Route path="/income_p" element={<Navigate to="/pillars/income" replace />} />
                <Route path="/mutual_fund_p" element={<Navigate to="/pillars/investments" replace />} />
                <Route path="/insurance_p" element={<Navigate to="/pillars/insurance" replace />} />
                <Route path="/weekly_expense_p" element={<Navigate to="/pillars/expenses" replace />} />
                <Route path="/ai" element={<Navigate to="/insights" replace />} />
                <Route path="/stock_screener" element={<Navigate to="/stock-screener" replace />} />
                <Route path="/mf_screener" element={<Navigate to="/mf-screener" replace />} />
                <Route path="/insurance_screener" element={<Navigate to="/insurance-screener" replace />} />
                <Route path="/master_data" element={<Navigate to="/master-data" replace />} />

                {/* 5. Protected Routes wrapped in ProtectedRoute + AppShell */}
                <Route
                  element={
                    <ProtectedRoute>
                      <AppShell />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/insights" element={<InsightsPage />} />
                  <Route path="/ai-assistant" element={<AiAssistantPage />} />
                  <Route
                    path="/profile"
                    element={
                      <PlaceholderPage title="Profile" description="User profile and security settings." />
                    }
                  />
                  <Route path="/weekly" element={<WeeklyPage />} />
                  <Route path="/onboarding" element={<OnboardingPage />} />
                  <Route path="/master-data" element={<MasterDataPage />} />
                  <Route
                    path="/subscription"
                    element={
                      <PlaceholderPage title="Subscription" description="MoneyMapper Pro plan details (read-only)." />
                    }
                  />
                  <Route
                    path="/achievements"
                    element={
                      <PlaceholderPage title="Achievements" description="Gamification badges and streaks." />
                    }
                  />
                  <Route
                    path="/referral"
                    element={
                      <PlaceholderPage title="Referral" description="Invite friends and track referral benefits." />
                    }
                  />
                  <Route
                    path="/corporate-dashboard"
                    element={
                      <PlaceholderPage title="Corporate Dashboard" description="Workforce health analytics." />
                    }
                  />

                  {/* Pillar Routes */}
                  <Route
                    path="/pillars/expenses"
                    element={
                      <PlaceholderPage title="Expense Pillar" description="Discipline scoring and expense analysis." />
                    }
                  />
                  <Route
                    path="/pillars/income"
                    element={
                      <PlaceholderPage title="Income Pillar" description="Active vs passive income benchmarks." />
                    }
                  />
                  <Route
                    path="/pillars/emergency"
                    element={
                      <PlaceholderPage title="Emergency Fund Pillar" description="Runway and liquid asset analysis." />
                    }
                  />
                  <Route
                    path="/pillars/insurance"
                    element={
                      <PlaceholderPage title="Insurance Pillar" description="Life and health protection gaps." />
                    }
                  />
                  <Route
                    path="/pillars/investments"
                    element={
                      <PlaceholderPage title="Investment Pillar" description="Portfolio asset allocation and SIPs." />
                    }
                  />

                  {/* Screener & Market Routes */}
                  <Route path="/gold-rates" element={<GoldRatesPage />} />
                  <Route path="/market/gold" element={<GoldRatesPage />} />
                  <Route path="/stock-screener" element={<StockScreenerPage />} />
                  <Route path="/market/stocks" element={<StockScreenerPage />} />
                  <Route path="/mf-screener" element={<MutualFundScreenerPage />} />
                  <Route path="/market/funds" element={<MutualFundScreenerPage />} />
                  <Route path="/mf-recommendations" element={<MfRecommendationsPage />} />
                  <Route path="/insurance-screener" element={<InsuranceScreenerPage />} />
                  <Route path="/market/insurance" element={<InsuranceScreenerPage />} />
                  <Route path="/news/:id" element={<NewsDetailPage />} />
                </Route>

                {/* 6. Unknown Route Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>

              {/* Universal Coming Soon / Please Login Modal */}
              <ComingSoonModal />
            </ComingSoonProvider>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
