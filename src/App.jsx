import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { AppShell } from './components/AppShell'

import Dashboard from './pages/Dashboard'
import WeeklyTracker from './pages/WeeklyTracker'
import Recommendations from './pages/recommendations/Recommendations'
import MutualFunds from './pages/recommendations/MutualFunds'
import InsuranceRecs from './pages/recommendations/InsuranceRecs'
import SavingsRecs from './pages/recommendations/SavingsRecs'
import IncomePillar from './pages/pillars/IncomePillar'
import ExpensesPillar from './pages/pillars/ExpensesPillar'
import EmergencyFundPillar from './pages/pillars/EmergencyFundPillar'
import ProtectionPillar from './pages/pillars/ProtectionPillar'
import InvestmentPillar from './pages/pillars/InvestmentPillar'
import Profile from './pages/Profile'
import MasterData from './pages/MasterData'
import Achievements from './pages/Achievements'
import Leaderboard from './pages/Leaderboard'
import Onboarding from './pages/Onboarding'
import Splash from './pages/auth/Splash'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import VerifyOtp from './pages/auth/VerifyOtp'
import ResetPassword from './pages/auth/ResetPassword'
import CorporateLogin from './pages/auth/CorporateLogin'
import CorporateDashboard from './pages/CorporateDashboard'
import Privacy from './pages/Privacy'

const shellRoutes = new Set([
  '/dashboard',
  '/weekly',
  '/recommendations',
  '/recommendations/mutual-funds',
  '/recommendations/insurance',
  '/recommendations/savings',
  '/pillars/income',
  '/pillars/expenses',
  '/pillars/emergency-fund',
  '/pillars/protection',
  '/pillars/investment',
  '/profile',
  '/profile/master-data',
  '/achievements',
  '/leaderboard',
])

function AppRoutes() {
  const location = useLocation()
  const useShell = shellRoutes.has(location.pathname)

  const routes = (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/weekly" element={<WeeklyTracker />} />
      <Route path="/recommendations" element={<Recommendations />} />
      <Route path="/recommendations/mutual-funds" element={<MutualFunds />} />
      <Route path="/recommendations/insurance" element={<InsuranceRecs />} />
      <Route path="/recommendations/savings" element={<SavingsRecs />} />
      <Route path="/pillars/income" element={<IncomePillar />} />
      <Route path="/pillars/expenses" element={<ExpensesPillar />} />
      <Route path="/pillars/emergency-fund" element={<EmergencyFundPillar />} />
      <Route path="/pillars/protection" element={<ProtectionPillar />} />
      <Route path="/pillars/investment" element={<InvestmentPillar />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/profile/master-data" element={<MasterData />} />
      <Route path="/achievements" element={<Achievements />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/splash" element={<Splash />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/corporate-login" element={<CorporateLogin />} />
      <Route path="/corporate-dashboard" element={<CorporateDashboard />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )

  if (useShell) {
    return <AppShell>{routes}</AppShell>
  }

  return routes
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  )
}
