import React from 'react';
import { BrowserRouter, MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute, PublicOnlyRoute } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { ComingSoonProvider } from './context/ComingSoonContext';
import { FeatureFlagProvider } from './context/FeatureFlagContext';
import { ComingSoonModal } from './components/ComingSoonModal';
import { NavigationBridge } from './components/NavigationBridge';
import { AppShell } from './components/app/AppShell';
import { PublicLayout } from './components/PublicLayout';

import { LandingPage } from './pages/LandingPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { InsightsMarketingPage } from './pages/InsightsMarketingPage';
import { PricingPage } from './pages/PricingPage';
import { AboutPage } from './pages/AboutPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
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
import { FeatureFlagGuard } from './components/common/FeatureFlagGuard';
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

const LegalRedirect: React.FC<{ url: string }> = ({ url }) => {
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.replace(url);
    }
  }, [url]);
  return null;
};

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
              <FeatureFlagProvider>
                <NavigationBridge />
                <Routes>
                  {/* 1. Landing Page (Full Interactive 10-Section Experience) */}
                  <Route path="/" element={<LandingPage />} />

                  {/* 1b. Public Dedicated Marketing Routes */}
                  <Route element={<PublicLayout />}>
                    <Route path="/features" element={<FeaturesPage />} />
                    <Route path="/explore-insights" element={<InsightsMarketingPage />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/about" element={<AboutPage />} />
                  </Route>

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
                  <Route path="/auth/callback" element={<AuthCallbackPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/corporate-login" element={<CorporateLoginPage />} />

                  {/* Legal Pages & Static Policy Direct Access */}
                  <Route path="/privacy" element={<PrivacyPolicyPage />} />
                  <Route path="/disclaimer" element={<LegalRedirect url="/disclaimer-and-data-processing-consent.html" />} />
                  <Route path="/disclaimer-and-data-processing-consent.html" element={<LegalRedirect url="/disclaimer-and-data-processing-consent.html" />} />
                  <Route path="/terms" element={<LegalRedirect url="/terms-and-conditions.html" />} />
                  <Route path="/terms-and-conditions.html" element={<LegalRedirect url="/terms-and-conditions.html" />} />
                  <Route path="/cookie-policy.html" element={<LegalRedirect url="/cookie-policy.html" />} />
                  <Route path="/grievance-redressal-policy.html" element={<LegalRedirect url="/grievance-redressal-policy.html" />} />
                  <Route path="/privacy-policy.html" element={<LegalRedirect url="/privacy-policy.html" />} />
                  <Route path="/delete_my_data" element={<LegalRedirect url="/delete_my_data.html" />} />
                  <Route path="/delete_my_data.html" element={<LegalRedirect url="/delete_my_data.html" />} />
                  <Route path="/data-deletion-request.html" element={<Navigate to="/delete_my_data" replace />} />
                  <Route path="/data-deletion-request" element={<Navigate to="/delete_my_data" replace />} />

                  {/* 4. Legacy Flutter & Mobile Screen URL Redirects */}
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

                  {/* 5. Protected In-App Workspace Experience (Wrapped in responsive AppShell) */}
                  <Route
                    element={
                      <ProtectedRoute>
                        <AppShell />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/insights" element={<InsightsPage />} />
                    <Route
                      path="/ai-assistant"
                      element={
                        <FeatureFlagGuard featureKey="ai_assistant">
                          <AiAssistantPage />
                        </FeatureFlagGuard>
                      }
                    />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route
                      path="/weekly"
                      element={
                        <FeatureFlagGuard featureKey="weekly_expense">
                          <WeeklyPage />
                        </FeatureFlagGuard>
                      }
                    />
                    <Route path="/onboarding" element={<OnboardingPage />} />
                    <Route path="/master-data" element={<MasterDataPage />} />
                    <Route path="/subscription" element={<SubscriptionPage />} />
                    <Route path="/achievements" element={<AchievementsPage />} />
                    <Route path="/referral" element={<ReferralPage />} />

                    {/* 5 Deep-Dive Financial Pillar Routes */}
                    <Route
                      path="/pillars/expenses"
                      element={
                        <FeatureFlagGuard featureKey="weekly_expense">
                          <WeeklyExpensePredictorPage />
                        </FeatureFlagGuard>
                      }
                    />
                    <Route
                      path="/pillars/weekly-expense"
                      element={
                        <FeatureFlagGuard featureKey="weekly_expense">
                          <WeeklyExpensePredictorPage />
                        </FeatureFlagGuard>
                      }
                    />
                    <Route
                      path="/pillars/income"
                      element={
                        <FeatureFlagGuard featureKey="income_pillar">
                          <IncomePillarPage />
                        </FeatureFlagGuard>
                      }
                    />
                    <Route
                      path="/pillars/emergency"
                      element={
                        <FeatureFlagGuard featureKey="emergency_fund">
                          <PillarGuard pillarName="emergency">
                            <EmergencyFundPage />
                          </PillarGuard>
                        </FeatureFlagGuard>
                      }
                    />
                    <Route
                      path="/pillars/emergency-fund"
                      element={
                        <FeatureFlagGuard featureKey="emergency_fund">
                          <PillarGuard pillarName="emergency">
                            <EmergencyFundPage />
                          </PillarGuard>
                        </FeatureFlagGuard>
                      }
                    />
                    <Route
                      path="/pillars/insurance"
                      element={
                        <FeatureFlagGuard featureKey="insurance">
                          <PillarGuard pillarName="insurance">
                            <InsurancePillarPage />
                          </PillarGuard>
                        </FeatureFlagGuard>
                      }
                    />
                    <Route
                      path="/pillars/investments"
                      element={
                        <FeatureFlagGuard featureKey="mutual_funds">
                          <PillarGuard pillarName="investments">
                            <MutualFundPillarPage />
                          </PillarGuard>
                        </FeatureFlagGuard>
                      }
                    />
                    <Route
                      path="/pillars/mutual-fund"
                      element={
                        <FeatureFlagGuard featureKey="mutual_funds">
                          <PillarGuard pillarName="investments">
                            <MutualFundPillarPage />
                          </PillarGuard>
                        </FeatureFlagGuard>
                      }
                    />

                    {/* Screener, Advisory & Live Market Tools */}
                    <Route
                      path="/gold-rates"
                      element={
                        <FeatureFlagGuard featureKey="gold_rates">
                          <GoldRatesPage />
                        </FeatureFlagGuard>
                      }
                    />
                    <Route
                      path="/market/gold"
                      element={
                        <FeatureFlagGuard featureKey="gold_rates">
                          <GoldRatesPage />
                        </FeatureFlagGuard>
                      }
                    />
                    <Route
                      path="/stock-screener"
                      element={
                        <FeatureFlagGuard featureKey="stock_screener">
                          <StockScreenerPage />
                        </FeatureFlagGuard>
                      }
                    />
                    <Route
                      path="/market/stocks"
                      element={
                        <FeatureFlagGuard featureKey="stock_screener">
                          <StockScreenerPage />
                        </FeatureFlagGuard>
                      }
                    />
                    <Route
                      path="/mf-screener"
                      element={
                        <FeatureFlagGuard featureKey="mutual_funds">
                          <MutualFundScreenerPage />
                        </FeatureFlagGuard>
                      }
                    />
                    <Route
                      path="/market/funds"
                      element={
                        <FeatureFlagGuard featureKey="mutual_funds">
                          <MutualFundScreenerPage />
                        </FeatureFlagGuard>
                      }
                    />
                    <Route path="/mf-recommendations" element={<MfRecommendationsPage />} />
                    <Route
                      path="/insurance-screener"
                      element={
                        <FeatureFlagGuard featureKey="insurance">
                          <InsuranceScreenerPage />
                        </FeatureFlagGuard>
                      }
                    />
                    <Route
                      path="/market/insurance"
                      element={
                        <FeatureFlagGuard featureKey="insurance">
                          <InsuranceScreenerPage />
                        </FeatureFlagGuard>
                      }
                    />
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
              </FeatureFlagProvider>
            </ComingSoonProvider>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </RouterComponent>
  );
};

export default App;
