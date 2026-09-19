# Dashboard Specification (`/dashboard`)

> **Source of Truth**: Flutter mobile app implementation at `reference/moneymapper_app/lib/screens/dashboard_screen.dart` (2,377 lines), along with:
> - `reference/moneymapper_app/lib/widgets/score_gauge.dart`
> - `reference/moneymapper_app/lib/widgets/pillar_card.dart`
> - `reference/moneymapper_app/lib/widgets/sparkline_chart.dart`
> - `reference/moneymapper_app/lib/widgets/dashboard_skeleton.dart`
> - `reference/moneymapper_app/lib/widgets/sentiment_gauge.dart`
> - `reference/moneymapper_app/lib/widgets/live_financial_calculator.dart`
> - `reference/moneymapper_app/lib/services/premium_service.dart`
> - `reference/moneymapper_app/lib/services/xp_service.dart`
> - `reference/moneymapper_app/lib/services/streak_service.dart`

---

## 1. Overview & Architectural Boundaries

The `/dashboard` route serves as the authenticated home screen. All data is fetched strictly via Task 6's `apiService` and custom React hooks:
- `useDashboard()`: Queries `core.financial_fitness_scores`, `core.income_scores`, `core.expense_scores`, `core.savings_scores`, `core.protection_scores`, `core.investment_scores`.
- `useMasterProfile()`: Queries `public.master_profiles` (`monthlyActiveIncome`, `passiveIncomeAmount`, `monthlyFixedExpenses`, `monthlyVariableExpenses`, `emergencyFundCurrent`, `totalEquityInvestments`, `totalDebtInvestments`, `totalGoldInvestments`, `totalRealEstateInvestments`, `activeLoans`, `stockSips`, `mfSips`, `goldSips`, etc.).
- `usePlan()`: Provides user plan status (`isPro`, `isFeatureAccessible`, `trialDaysRemaining`).
- Live Metal Rates: Fetches live 24K gold rates from `bse_data.live_metal_rates`.

### Documented Architectural Deviations from Mobile App:
1. **Trial/Paywall Anchor**:
   - Flutter uses a device-local `first_login_timestamp` stored in `SharedPreferences` (`premium_service.dart` lines 62-90).
   - On web, we do **NOT** store the paywall anchor in `localStorage` (as that allows trivial client resets). Instead, the trial start is anchored on the Supabase user's `created_at` timestamp behind the abstraction `getTrialStartMs(user)`.
   - Semantics remain 100% identical: `daysPassed = Math.floor((nowMs - trialStartMs) / 86400000)`; accessible while `daysPassed < 7`; `remaining = Math.max(0, 7 - daysPassed)`; `isPro` grants 365 days and perpetual access.
2. **Gamification Store**:
   - In Flutter, `user_total_xp`, `baseline_fitness_score`, `last_known_fitness_score`, `streak_count_weekly`, and `unlocked_badges_list` are stored in device-local `SharedPreferences`.
   - On web, these are managed via `gamificationStore` (currently backed by `localStorage` until server-side synchronization is established). Overall Improvement is computed as `((current - baseline) / baseline) * 100`, exactly matching `xp_service.dart`.
3. **Number Formatters**:
   - The Flutter code does not use Indian lakh grouping regex (`##,##,###`). Instead, the Dart codebase uses `(\d{1,3})(?=(\d{3})+(?!\d))` on `amount.round()` across `live_financial_calculator.dart` and `dashboard_screen.dart`.
   - Web formatters are ported 1:1 per Dart source file (`formatCurrency_LiveFinancialCalculator`, `formatCompactCurrency_LiveFinancialCalculator`, `formatGoldPrice_DashboardScreen`, `formatNetPosition_DashboardScreen`, `formatQuickStatsCurrency_DashboardScreen`).

---

## 2. Page Hierarchy & Responsive Layout

- **Mobile (< 768px)**: Single column vertical stack matching mobile view hierarchy.
- **Desktop (>= 1024px)**: Responsive multi-column layout (`grid-cols-12`, 7/5 split) maximizing screen real estate:
  - Left Column (7 cols): Financial Position Card, Pro Banners, Weekly Spending Limit, Financial Breakdown (5 Pillars), Quotes Section.
  - Right Column (5 cols): Live Gold Ticker, MoneyMapper Score Cards Grid, Live Financial Calculator.
  - Footer spans full width across all breakpoints.

---

## 3. Sections in Exact Order

1. **Dashboard Header Bar**:
   - MoneyMapper 3D Compass Logo + Title `"MoneyMapper"`
   - Tagline: `"Your Financial Navigation System"`
   - Premium Badge: `"👑 PREMIUM"` (only if `isPro`)
   - Notification Bell: Pure no-op button with unread red badge dot (no mock notification state)
   - User Avatar: Display initials computed from user's full name (e.g. `"SN"` or fallback `"S"`), click navigates to `/profile`
   - Quick navigation links: AI Assistant (`/ai-assistant`) and Weekly Tracker (`/weekly`)
2. **Financial Position Card / Locked Pro Card**:
   - If `!isFeatureAccessible`: Renders locked card with icon, `"Unlock MoneyMapper Pro 🚀"`, trial ended text, and `"UPGRADE TO PRO"` CTA.
   - If accessible:
     - Section 1: `"FINANCIAL FITNESS SCORE"`, info button opening Score Improvement modal, `BASIC` badge if `!isPro`.
     - Score Gauge (130px): 10 segmented arc painter, 270° sweep, score and `"OF 100"`.
     - Status Badge: `{bandEmoji} {bandLabel.toUpperCase()}` (`AVERAGE`, `EXCELLENT`, etc.).
     - Advice: `"You're on track. Focus on investing more and building your emergency fund."`
     - Improvement: `"+12 pts from last month"`.
     - Section 2: `"NET FINANCIAL POSITION"`, formatted currency, `"Total Assets – Total Liabilities"`, growth tag `"+₹18,450 (8.3%) vs last month"`.
     - Decorative Wave Sparkline Graph (110x55, no data props).
3. **Pro Banners (3-Card Carousel)**:
   - Visible only when `!isPro`. Title: `"Unlock MoneyMapper Pro 🚀"`.
   - Cards: Quarterly Plan (`₹499/mo`, `38% OFF`, `SAVE ₹897`), Half-Yearly Plan (`₹399/mo`, `50% OFF`, `SAVE ₹2400`), Yearly Plan (`₹299/mo`, `63% OFF`, `SAVE ₹6000`), `"CLAIM OFFER"` -> `/subscription`.
4. **Live Gold Ticker**:
   - 24K IBJA rate per gram from `bse_data.live_metal_rates`.
   - If loading: `"Syncing Live Gold Rates..."`.
   - If loaded: `"LIVE GOLD RATE 24K"`, `"(PER GRAM)"`, `₹{price}`, click navigates to `/market/gold`.
5. **Estimated Spending Limit (Weekly)**:
   - Rendered when `monthlyIncome > 0`.
   - Formula: `weekly = monthlyIncome / 4`; `fMid = clamp(0.25 + score/100 * 0.10, 0.25, 0.35)`; `xMid = clamp(0.55 - score/100 * 0.10, 0.45, 0.55)`; `min = weekly * ((xMid - 0.02) + (fMid - 0.02))`; `max = weekly * ((xMid + 0.02) + (fMid + 0.02))`.
   - Labels: `"ESTIMATED SPENDING LIMIT"`, `"(THIS WEEK)"`, `"TARGET"`.
6. **MoneyMapper Score Cards (2x2 Screener Grid)**:
   - Stock Score: `75/100`, `"NIFTY 500 COMPANIES"`, `"Buy / Sell Recommendations"`, `#10B981`, click -> `/market/stocks`.
   - Mutual Fund Score: `82/100`, `"3000+ MUTUAL FUNDS"`, `"Top Performing Funds"`, `#3B82F6`, click -> `/market/funds`.
   - Insurance Score: `83/100`, `"83 LIFE & HEALTH PLANS"`, `"Best Plans for You"`, `#A855F7`, click -> `/market/insurance`.
   - IPO Score: `78/100`, `"UPCOMING IPOs"`, `"Analysis & Recommendations"`, `#F59E0B`, click -> toast `"IPO Score coming soon!"`.
7. **Live Financial Calculator**:
   - Header: `"LIVE FINANCIAL CALCULATOR"`, `"Live & Calculated"`.
   - Equation Row: `[INCOME: ₹{monthlyIncome}/mo] - [EXPENSES: ₹{monthlyExpenses}/mo] = [AVAILABLE: ₹{availableBalance}/mo]`.
   - Emergency Fund Card: `"EMERGENCY FUND"`, `₹{current} / ₹{target}`, progress bar, percentage, `"Recommended: 6 Months Expenses"`.
   - Bottom Row:
     - Left: `"SIP"`, `"RECOMMENDATION"`, `₹{sipRecommendation} / month`, trial badge `"TRIAL: 1D"`, locked overlay `"PRO FEATURE"`, `"Unlock SIP Advisor"`.
     - Right: `"WEALTH ALLOCATION"`, `"(Allocation Breakdown)"`, 2x2 grid for `Stock`, `Mutual Fund`, `Gold`, `Real Estate`.
8. **Financial Breakdown (Your 5 Pillars)**:
   - Header: `"FINANCIAL BREAKDOWN (Your 5 Pillars)"`.
   - Strict sequence: Income, Expenses, Emergency Savings, Protection, Investment.
   - Highlights: Strongest pillar marked `"STRONGEST"`, weakest marked `"NEEDS FOCUS"`.
   - Locked pillars (`!isFeatureAccessible`): Emergency Savings, Protection, Investment show lock icon; click triggers toast `"Upgrade to PRO to unlock this pillar! 🚀"` with action `"UPGRADE"`.
9. **Financial Quotes of Wisdom**:
   - Purple gradient container with quote glyph `“`.
   - Daily rotating quote selected from the 20 quotes bank in Flutter lines 83-102.
10. **Dashboard Footer**:
    - `"MoneyMapper"`, `"Your Financial Navigation System"`.
11. **Empty State ("Calculations Pending" / 404 / 401)**:
    - Renders Header, Live Gold Ticker, Score Cards Grid, Setup Profile Card with quote and `"Set Up Financial Profile"` CTA (navigates to `/onboarding`), and Basic Identity card.
12. **Loading State**:
    - `DashboardHeaderSkeleton` and `DashboardSkeleton` with smooth shimmer sweep.
13. **Error State**:
    - Cloud off icon, error text with fallback `"Could not load dashboard data"`, `"Retry"` button.

---

## 4. Score Color Bands & Logic

- `< 40`: Danger (`#EF4444`, Red)
- `40 - 70`: Warning (`#F59E0B`, Amber/Orange)
- `> 70`: Success (`#10B981`, Emerald Green)
- Applied to Score Gauge status text, Pillar progress bar fills, and Score Cards accent borders.

---

## 5. Master Flutter-to-Web Parity Table

| Section / State | Flutter File + Line Range | Web Component | Verbatim Copied Strings | Covering Test |
| :--- | :--- | :--- | :--- | :--- |
| **Top Header Bar** | `screens/dashboard_screen.dart:360-492` | `DashboardPage.tsx` | `'MoneyMapper'`, `'PREMIUM'`, `'Your Financial Navigation System'` | `dashboardPage.test.tsx` ("Header click targets navigate to /ai-assistant, /weekly, /profile", "Notification bell is a no-op") |
| **Financial Position Card** | `screens/dashboard_screen.dart:575-868` | `FinancialPositionCard.tsx` | `'FINANCIAL FITNESS SCORE'`, `'BASIC'`, `'NET FINANCIAL POSITION'`, `'Total Assets – Total Liabilities'`, `'+12 pts'`, `'from last month'`, `'+₹18,450 (8.3%)'`, `'vs last month'` | `dashboardPage.test.tsx` ("1. Fixture-driven rendering of full dashboard data") |
| **Score Improvement Modal** | `screens/dashboard_screen.dart:494-572` | `FinancialPositionCard.tsx` | `'Score Improvement'`, `'Comparison since your first audit:'`, `'Starting Score:'`, `'Current Score:'`, `'Overall Improvement'`, `'Great job! You have improved your financial health. Keep going! 🚀'`, `'Your score has decreased slightly since last month. Please follow the recommendations to improve.'`, `'Great!'` | `dashboardPage.test.tsx` ("Score improvement dialog displays exact verbatim copy and stats") |
| **Locked Pro Card** | `screens/dashboard_screen.dart:871-920` | `FinancialPositionCard.tsx` | `'Unlock MoneyMapper Pro 🚀'`, `'Your 7-day trial has ended. Subscribe to Pro to unlock your Financial Fitness Score, Net Financial Position analysis, and personalized wealth recommendations.'`, `'UPGRADE TO PRO'` | `dashboardPage.test.tsx` ("Locked Pro Card renders when trial has expired") |
| **Pro Banners** | `screens/dashboard_screen.dart:1607-1819` | `ProBanners.tsx` | `'Unlock MoneyMapper Pro 🚀'`, `'Quarterly Plan'`, `'₹499'`, `'₹799'`, `'38% OFF'`, `'SAVE ₹897'`, `'Half-Yearly Plan'`, `'₹399'`, `'50% OFF'`, `'SAVE ₹2400'`, `'Yearly Plan'`, `'₹299'`, `'63% OFF'`, `'SAVE ₹6000'`, `'CLAIM OFFER'` | `dashboardPage.test.tsx` ("8. PRO banners depend on plan (visible for non-PRO, hidden for PRO)") |
| **Live Gold Ticker** | `screens/dashboard_screen.dart:1253-1353` | `GoldTicker.tsx` | `'Syncing Live Gold Rates...'`, `'LIVE GOLD RATE 24K'`, `'(PER GRAM)'` | `dashboardPage.test.tsx` ("7. Gold ticker renders live 24K rate and navigates to /market/gold") |
| **Estimated Spending Limit**| `screens/dashboard_screen.dart:2125-2205` | `EstimatedSpendingLimit.tsx` | `'ESTIMATED SPENDING LIMIT'`, `'(THIS WEEK)'`, `'TARGET'` | `dashboardPage.test.tsx` ("EstimatedSpendingLimit table-driven calculations") |
| **Score Cards 2x2 Grid** | `screens/dashboard_screen.dart:1355-1450` | `ScoreCardsGrid.tsx` | `'MONEYMAPPER SCORE CARDS'`, `'Stock Score'`, `'75'`, `'NIFTY 500 COMPANIES'`, `'Buy / Sell Recommendations'`, `'Mutual Fund Score'`, `'82'`, `'3000+ MUTUAL FUNDS'`, `'Top Performing Funds'`, `'Insurance Score'`, `'83'`, `'83 LIFE & HEALTH PLANS'`, `'Best Plans for You'`, `'IPO Score'`, `'78'`, `'UPCOMING IPOs'`, `'Analysis & Recommendations'`, `'IPO Score coming soon!'` | `dashboardPage.test.tsx` ("10. Score cards navigate to corresponding screener tools and IPO triggers toast") |
| **Live Financial Calculator**| `widgets/live_financial_calculator.dart:81-513` | `LiveFinancialCalculator.tsx`| `'LIVE FINANCIAL CALCULATOR'`, `'Live & Calculated'`, `'INCOME'`, `'EXPENSES'`, `'AVAILABLE'`, `'/ month'`, `'EMERGENCY FUND'`, `'Recommended: 6 Months Expenses'`, `'SIP'`, `'RECOMMENDATION'`, `'TRIAL: 1D'`, `'PRO FEATURE'`, `'Unlock SIP Advisor'`, `'WEALTH ALLOCATION'`, `'(Allocation Breakdown)'`, `'Stock'`, `'Mutual Fund'`, `'Gold'`, `'Real Estate'` | `dashboardPage.test.tsx` ("LiveFinancialCalculator table-driven hand-derived values") |
| **5 Pillars Breakdown** | `screens/dashboard_screen.dart:922-1048` | `FinancialBreakdownSection.tsx`| `'FINANCIAL BREAKDOWN'`, `'(Your 5 Pillars)'`, `'Income'`, `'Expenses'`, `'Emergency Savings'`, `'Protection'`, `'Investment'`, `'Life Cover: ₹1.20 Cr'`, `'STRONGEST'`, `'NEEDS FOCUS'`, `'Upgrade to PRO to unlock this pillar! 🚀'` | `dashboardPage.test.tsx` ("5. Pillar order and formatted values in strict sequence", "6. Highlights strongest and weakest pillars", "11. Locked pillars trigger PRO upgrade toast with action") |
| **Quotes Section** | `screens/dashboard_screen.dart:82-103, 1980-2068` | `QuotesSection.tsx` | Verbatim 20 quotes bank (e.g. `'Beware of little expenses; a small leak will sink a great ship. 🚢'`) | `dashboardPage.test.tsx` ("QuotesSection renders valid quote from 20 quotes bank") |
| **Footer** | `screens/dashboard_screen.dart:2070-2097` | `DashboardFooter.tsx` | `'MoneyMapper'`, `'Your Financial Navigation System'` | `dashboardPage.test.tsx` ("Footer renders on populated and empty states") |
| **Empty State** | `screens/dashboard_screen.dart:1843-1949` | `DashboardEmptyState.tsx` | `'Welcome to MoneyMapper!'`, `'Your financial profile is currently empty. To see your fitness score and personalized insights, please fill in your master data.'`, `'Set Up Financial Profile'`, `'YOUR BASIC IDENTITY'`, `'Name'`, `'Email'` | `dashboardPage.test.tsx` ("2. Calculations Pending (404) -> renders the app empty state with CTA navigating to /onboarding") |
| **Loading Skeleton** | `screens/dashboard_screen.dart:2248-2251`, `widgets/dashboard_skeleton.dart:70-172` | `DashboardSkeleton.tsx` | Shimmer elements | `dashboardPage.test.tsx` ("3. Loading state displays DashboardHeaderSkeleton and DashboardSkeleton") |
| **Error & Retry View** | `screens/dashboard_screen.dart:1821-1841` | `DashboardPage.tsx` | `'Could not load dashboard data'`, `'Retry'` | `dashboardPage.test.tsx` ("4. Fatal error displays error view and Retry button triggers re-fetch") |
| **Decorative Sparkline** | `screens/dashboard_screen.dart:857-864` | `SparklineChart.tsx` | Purely decorative bezier curve, no data series | `dashboardPage.test.tsx` ("Decorative Sparkline receives no external data props") |
| **Trial Boundaries** | `services/premium_service.dart:62-94` | `premiumService.ts` | Paywall access boundaries (6d23h, 7d0h, PRO, 7..0 days) | `premiumService.test.ts` ("isFeatureAccessible and getTrialDaysRemaining boundaries") |
| **1:1 Dart Formatters** | `widgets/live_financial_calculator.dart:33-47`, `screens/dashboard_screen.dart:581, 1337` | `formatters.ts` | `15000 -> ₹15,000`, `99999.6 -> ₹100,000`, `100000 -> ₹1L`, `125000 -> ₹1.3L`, `12000000 -> ₹1.2Cr`, `20000000 -> ₹2Cr`, `0 -> ₹0` | `formatters.test.ts` ("Ported Dart Formatters 1:1 tests") |
