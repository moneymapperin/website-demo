# MoneyMapper Application Feature Map (Flutter Mobile ➔ Web)

This document maps every Flutter route and screen from `main.dart`, `main_screen.dart`, and child screens to their proposed Web SPA route, one-line feature summary, and status of platform-specific features.

---

## 1. Route & Screen Mapping

| Flutter Route / Screen | Proposed Web Route | One-Line Feature Summary | Mobile vs Web Notes |
| :--- | :--- | :--- | :--- |
| **`SplashScreen`** (`AuthGate`) | `/` | Checks Supabase auth session; redirects to `/main` if logged in or `/login` if unauthenticated. | Identical behavior via React auth state check. |
| **`LoginScreen`** (`/login`) | `/login` | User login using email and password with error handling and link to registration/reset. | Retains option to use `/qr-login` for passwordless instant handoff. |
| **`RegisterScreen`** (`/register`) | `/register` | User sign-up capturing `fullName`, `email`, `mobile`, `password`, initializing profile metadata. | Sends `fullName`, `mobile`, `plan: 'b2c'`. |
| **`ResetPasswordScreen`** (`/reset_password`) | `/reset-password` | Password recovery via Supabase email reset trigger. | Mobile handles deep link `moneymapper://reset-callback`; Web handles direct URL callback. |
| **`QrScannerScreen`** (`/qr_scanner`) | `/qr-login` *(Desktop Receiver)* | Mobile scans Web QR code to push active session tokens to `web_sessions`. | **Mobile only camera scanner**. On web, `/qr-login` generates the QR code to be scanned. |
| **`MainScreen`** (`/main`) | `/app` or `/dashboard` | 4-tab core application shell (Home, Insights, AI Assistant, Profile) with side navigation drawer. | Web uses responsive sidebar / navigation shell. |
| **`OnboardingScreen`** (`/onboarding`) | `/onboarding` | 3-step initial financial wizard capturing income, expense split, asset allocation, and insurance. | Identical form steps syncing to `master_profiles`. |
| **`DashboardScreen`** (`/dashboard`) | `/dashboard` | Dynamic 0–100 Financial Fitness score gauge, 5 pillar cards, quick stat summaries, and action alerts. | Core dashboard view on web. |
| **`WeeklyScreen`** (`/weekly`) | `/weekly` | Weekly budget logging and discipline tracker (50/30/20 rule: fixed, flexible, savings). | Reads/writes `weekly_logs`. |
| **`WeeklyExpensePredictor`** (`/weekly_expense_p`) | `/pillars/expenses` | Deep-dive expense analysis, discipline scoring, spending benchmarks, and expense category breakdown. | Pillar drill-down screen. |
| **`IncomePillarDashboard`** (`/income_p`) | `/pillars/income` | Active vs passive income analysis, city tier benchmarks, and stability scoring. | Pillar drill-down screen. |
| **`EmergencyFundDashboard`** (`/emergency_fund_p`) | `/pillars/emergency` | Emergency readiness runway calculator (months of fixed expenses) and liquid asset tracker. | Pillar drill-down screen. |
| **`InsuranceDashboard`** (`/insurance_p`) | `/pillars/insurance` | Protection gap analysis comparing life (15x income) and health (10x income) against existing policies. | Pillar drill-down screen. |
| **`MutualFundDashboard`** (`/mutual_fund_p`) | `/pillars/investments` | Asset allocation balance (equity/debt/gold/real estate) and monthly SIP gap evaluation. | Pillar drill-down screen. |
| **`RecommendationsScreen`** (`/ai`) | `/insights` | Live intelligence feed: market sentiment gauge, top stock signals, mutual fund picks, financial news, blogs. | Tab 2 on Main Screen. |
| **`AiAssistantScreen`** (`/ai_assistant`) | `/assistant` | Interactive financial chatbot with intent classification and quick prompts. | Tab 3 on Main Screen. |
| **`ProfileScreen`** (`/profile`) | `/profile` | User identity summary, plan status, quick links to master data, security settings, referrals, logout. | Tab 4 on Main Screen. |
| **`MasterDataScreen`** (`/master_data`) | `/master-data` | Comprehensive 6-category, 52-field financial profile editor syncing to `public.master_profiles`. | Full profile manager. |
| **`AchievementsScreen`** (`/achievements`) | `/achievements` | Gamification hub displaying total XP, streak counters, unlocked badges, and pillar mastery milestones. | Gamification view. |
| **`ReferralScreen`** (`/referral`) | `/referral` | User referral code generation, sharing options, and referral reward tracking. | Social referral view. |
| **`SubscriptionScreen`** (`/subscription`) | `/subscription` | Wealth Select Pro membership paywall detailing benefits (quarterly, half-yearly, yearly). | **Read-Only on Web** (see notes below). |
| **`CorporateLoginScreen`** (`/corporate_login`) | `/corporate/login` | Email-based corporate admin verification against `public.corporate_admins`. | Enterprise access portal. |
| **`CorporateDashboardScreen`** (`/corporate_dashboard`)| `/corporate/dashboard`| Aggregate workforce analytics, financial stress index, department breakdown, and risk counts. | B2B enterprise dashboard. |
| **`PrivacyPolicyScreen`** (`/privacy`) | `/privacy` | Data privacy terms, encryption disclaimers, and user data rights documentation. | Static compliance page. |
| **`GoldRatesScreen`** (child route) | `/market/gold` | Live 24K and 22K IBJA gold rates with update timestamps and historical comparison. | Market intelligence tool. |
| **`StockScreenerScreen`** (child route) | `/market/stocks` | Searchable Nifty 500 stock signals with technical indicator metrics and buy/sell/wait filters. | Screener tool. |
| **`MutualFundScreenerScreen`** (child route) | `/market/funds` | Filterable mutual fund list sorted by category, rating, 3Y/5Y CAGR, and Sharpe ratio. | Screener tool. |
| **`InsuranceScreenerScreen`** (child route) | `/market/insurance` | Curated health and life insurance policies with Claim Settlement Ratios (CSR) and premium ranges. | Screener tool. |
| **`NewsDetailScreen`** (child route) | `/news/:id` | Full article reader for financial news stories and educational blog posts from `bse_data`. | Reader view. |

---

## 2. Platform-Specific Feature Treatment (Mobile vs Web)

| Feature | Mobile Implementation | Web Treatment | Status / Rationale |
| :--- | :--- | :--- | :--- |
| **Biometric App Lock** | `local_auth` (Face ID, Touch ID, Android BiometricPrompt) | **N/A on web** | Browser security relies on standard session management, secure cookies/storage, and inactivity timeout. |
| **Screenshot / Recording Blocking** | `FLAG_SECURE` on Android Window, iOS screen capture notification listener | **N/A on web** | Browsers cannot prevent OS-level screenshots or screen recordings. |
| **In-App Purchase** | `in_app_purchase` via Google Play Billing and Apple StoreKit | **N/A on web** | **Subscription page on web is read-only; no payment gateway (no Stripe/Razorpay) will be built.** Web displays active plan details and directs users to the mobile app for tier upgrades. |
| **Local Push Notifications** | `flutter_local_notifications` (weekly reminder cron) | **N/A on web** | Web does not schedule background OS notifications for expense tracking. |
| **QR Code Scanner** | `mobile_scanner` using native device camera | **N/A on web (Scanner)** | Web acts as the **display receiver** generating the QR token via `qrcode.react`, which mobile scans. |
