import React from 'react';
import { BrowserRouter, MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute, PublicOnlyRoute } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { ComingSoonProvider } from './context/ComingSoonContext';
import { ComingSoonModal } from './components/ComingSoonModal';
import { NavigationBridge } from './components/NavigationBridge';
import { AppShell } from './components/app/AppShell';
import { LandingPage } from './pages/LandingPage';
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
import { PillarGuard } from './components/common/PillarGuard';
import { InsurancePillarPage } from './pages/pillars/InsurancePillarPage';
import { IncomePillarPage } from './pages/pillars/IncomePillarPage';
import { WeeklyExpensePredictorPage } from './pages/pillars/WeeklyExpensePredictorPage';
import { MutualFundPillarPage } from './pages/pillars/MutualFundPillarPage';
import { EmergencyFundPage } from './pages/pillars/EmergencyFundPage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { ProfilePage } from './pages/ProfilePage';
import { AchievementsPage } from './pages/AchievementsPage';
import { ReferralPage } from './pages/ReferralPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { CorporateGuard } from './components/common/CorporateGuard';
import { CorporateDashboardPage } from './pages/CorporateDashboardPage';

export interface AppProps {
  initialEntries?: string[];
}

export const App: React.FC<AppProps> = ({ initialEntries }) => {
  const RouterComponent = initialEntries ? (MemoryRouter as any) : BrowserRouter;
  const routerProps = initialEntries ? { initialEntries } : {};

  return (
    <RouterComponent {...routerProps}>
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
                <Route path="/privacy" element={<PrivacyPolicyPage />} />

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
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/weekly" element={<WeeklyPage />} />
                  <Route path="/onboarding" element={<OnboardingPage />} />
                  <Route path="/master-data" element={<MasterDataPage />} />
                  <Route path="/subscription" element={<SubscriptionPage />} />
                  <Route path="/achievements" element={<AchievementsPage />} />
                  <Route path="/referral" element={<ReferralPage />} />

                  {/* Pillar Routes & Aliases */}
                  <Route path="/pillars/expenses" element={<WeeklyExpensePredictorPage />} />
                  <Route path="/pillars/weekly-expense" element={<WeeklyExpensePredictorPage />} />
                  <Route path="/pillars/income" element={<IncomePillarPage />} />
                  <Route
                    path="/pillars/emergency"
                    element={
                      <PillarGuard pillarName="emergency">
                        <EmergencyFundPage />
                      </PillarGuard>
                    }
                  />
                  <Route
                    path="/pillars/emergency-fund"
                    element={
                      <PillarGuard pillarName="emergency">
                        <EmergencyFundPage />
                      </PillarGuard>
                    }
                  />
                  <Route
                    path="/pillars/insurance"
                    element={
                      <PillarGuard pillarName="insurance">
                        <InsurancePillarPage />
                      </PillarGuard>
                    }
                  />
                  <Route
                    path="/pillars/investments"
                    element={
                      <PillarGuard pillarName="investments">
                        <MutualFundPillarPage />
                      </PillarGuard>
                    }
                  />
                  <Route
                    path="/pillars/mutual-fund"
                    element={
                      <PillarGuard pillarName="investments">
                        <MutualFundPillarPage />
                      </PillarGuard>
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

                {/* 6. Corporate Dashboard Route (Dedicated Corporate Experience) */}
                <Route
                  path="/corporate-dashboard"
                  element={
                    <ProtectedRoute>
                      <CorporateGuard>
                        <CorporateDashboardPage />
                      </CorporateGuard>
                    </ProtectedRoute>
                  }
                />

                {/* 7. Unknown Route Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>

              {/* Universal Coming Soon / Please Login Modal */}
              <ComingSoonModal />
            </ComingSoonProvider>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </RouterComponent>
  );
};

export default App;
