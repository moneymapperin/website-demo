# MoneyMapper Five Pillar Dashboards & PRO Gating Specification

Technical specification for the five financial pillars, PRO gating architecture, PremiumService synchronization, and read-only subscription page mirroring Flutter mobile:
- `reference/moneymapper_app/lib/insurance_dashboard.dart`
- `reference/moneymapper_app/lib/income_pillar.dart`
- `reference/moneymapper_app/lib/weekly_expense_tracker.dart`
- `reference/moneymapper_app/lib/mutual_fund.dart`
- `reference/moneymapper_app/lib/emergency_fund.dart`
- `reference/moneymapper_app/lib/services/premium_service.dart`
- `reference/moneymapper_app/lib/screens/subscription_screen.dart`

---

## 1. Route Mapping & Aliases

| Screen / Pillar | Web Route | Canonical Aliases | Gating Status |
| :--- | :--- | :--- | :--- |
| **Insurance Dashboard** | `/pillars/insurance` | `/insurance_p` | **Premium** (`canAccessPremium`) |
| **Income Pillar** | `/pillars/income` | `/income_p` | **Free** (Always unlocked) |
| **Weekly Expense Predictor** | `/pillars/expenses` | `/pillars/weekly-expense`, `/weekly_expense_p` | **Free** (Always unlocked) |
| **Mutual Fund Dashboard** | `/pillars/investments` | `/pillars/mutual-fund`, `/mutual_fund_p` | **Premium** (`canAccessPremium`) |
| **Emergency Fund Dashboard**| `/pillars/emergency` | `/pillars/emergency-fund`, `/emergency_fund_p` | **Premium** (`canAccessPremium`) |
| **Wealth Select Subscription**| `/subscription` | — | **Public/Protected Read-Only** |

---

## 2. Gating Architecture

### Unified Rule: `canAccessPremium`
In the web application, access to premium features is unified through:
$$\text{canAccessPremium} = \text{isPro} \lor \text{isFeatureAccessible}$$
where:
- $\text{isPro}$: User has an active pro membership plan string or valid unexpired subscription in `bse_data.user_subscriptions`.
- $\text{isFeatureAccessible}$: User is within their 7-day free trial period ($\text{daysPassed} < 7$, anchored to `user.created_at`).

### Application Enforcement:
1. **`PillarGuard`**: Wraps the 3 premium pillar routes (`/pillars/insurance`, `/pillars/investments` + `/pillars/mutual-fund`, `/pillars/emergency` + `/pillars/emergency-fund`).
   - If $\text{canAccessPremium}$ is true, renders the pillar dashboard.
   - If false, renders a locked card view and triggers toast: `"Upgrade to PRO to unlock this pillar!"` with an action button navigating to `/subscription`.
2. **AppShell Sidebar & Drawer**:
   - In Flutter (`main_screen.dart`), the drawer checked `isPremiumPillar && !_isPro` (ignoring the 7-day trial).
   - On web, the drawer and desktop sidebar use the unified $\text{canAccessPremium}$ rule, so users in their active 7-day trial have full access without misleading lock badges.
3. **Dashboard (`/dashboard`)**:
   - Pillar cards, SIP card, and Financial Position card unlock during active trial or PRO.
4. **Free Pillars**:
   - Income (`/pillars/income`) and Weekly Expense (`/pillars/expenses` / `/pillars/weekly-expense`) are **never gated** and remain 100% accessible to free users.

---

## 3. PremiumService Architecture & Deviations

### Plan Normalization
A user plan is considered PRO if `plan.trim().toLowerCase()`:
- Contains `'pro'`, `'paid'`, `'wealth select'`, or `'enterprise gold'`.
- Equals `'moneymapper pro membership'`.

### Network Sync & Backoff
- `syncSubscriptionStatus()`: Queries `bse_data.user_subscriptions` for `user_id`.
  - If row or `current_period_end` is null $\to$ plan is set to `'moneymapper free membership'`.
  - If `new Date(current_period_end) > now` $\to$ plan is set to `'moneymapper pro membership'`.
  - Else $\to$ `'moneymapper free membership'`.
- **Deviation (Bugfix from Flutter)**: Flutter mobile only updated `_lastSyncKey` on the non-null path, causing free users without subscription rows to execute a network query on every single `isPro()` call. On web, `lastSync` is updated on **every completed sync** (including null/free responses).
- **Network Error Handling**: If the sync query throws a network exception, the existing plan is preserved, `lastSync` is not bumped to 5 minutes, and a **60-second backoff** is set to prevent hammering.
- **Fire-and-Forget**: `isPro()` never awaits the network; if 5 minutes have elapsed, it triggers `syncSubscriptionStatus()` in the background while immediately returning the current synchronous evaluation.

### Reactive `usePlan` Hook
`usePlan()` subscribes to `premiumService` plan change events via an event listener pattern:
- Whenever `syncSubscriptionStatus()` resolves or `setPlan()` is called, all mounted subscribers re-render automatically without requiring a browser reload.
- Auth state changes (`SIGNED_IN`, `INITIAL_SESSION`) trigger an initial sync; `SIGNED_OUT` resets the local plan state to `'b2c'`.

---

## 4. Mathematical Models & Calculations

### 4.1 Insurance Pillar (`insurance_dashboard.dart`)
- Inputs from `master_profiles` & `core.protection_scores`:
  $$\text{annualIncome} = \text{monthlyActiveIncome} \times 12$$
  $$\text{lifeTarget} = \text{annualIncome} \times 15$$
  $$\text{totalLifeCover} = \text{termCover} + \text{lifeCover}$$
  $$\text{termGap} = \max(0, \text{lifeTarget} - \text{totalLifeCover})$$
  $$\text{healthTarget} = \text{annualIncome} \times 10$$
  $$\text{healthGap} = \max(0, \text{healthTarget} - \text{healthCover})$$
- Formatter:
  - $\ge 10^5 \to \text{"₹(val / 100000).toFixed(1)L"}$
  - $\ge 1000 \to \text{"₹Math.round(val / 1000)K"}$
  - else $\to \text{"₹Math.round(val)"}$
- Missing profile data: Displays `"not available"`, never fabricates numbers.

### 4.2 Income Pillar (`income_pillar.dart`)
- **Client-Side Scoring Note**: `IncomePillarDashboard` in Flutter computes its score client-side from the master profile rather than taking the server's `financial_fitness_scores.income_pillar_score`. This client calculation is ported 1:1.
- City Tier Minimums:
  - `metro`: ₹60,000
  - `tier2`: ₹40,000
  - `tier3`: ₹25,000
- Mapping: `rawTier = cityTier.toLowerCase().trim()`. If contains `'metro'` $\to$ `metro`; if contains `'tier 3'` $\to$ `tier3`; else `tier2`.
- Scores:
  $$\text{activeScore} = \min\left(\frac{\text{activeIncome}}{\text{cityMin}} \times 100, 100\right)$$
  $$\text{passiveScore} = (\text{hasPassive} \land \text{activeIncome} > 0) ? \min\left(\frac{\text{passiveIncome}}{\text{activeIncome}} \times 500, 100\right) : 0$$
  $$\text{finalScore} = \text{round}(\text{activeScore} \times 0.7 + \text{passiveScore} \times 0.3)$$
  $$\text{total} = \text{activeIncome} + \text{passiveIncome}$$
  $$\text{passiveSharePct} = \text{total} > 0 ? \frac{\text{passiveIncome}}{\text{total}} \times 100 : 0$$
  $$\text{activeSharePct} = \text{total} > 0 ? 100 - \text{passiveSharePct} : 0$$
- **Omission of Inflation Forecast Card**: In Flutter, `_buildIncomeForecastCard` generated an inflation rate using `Random(currentYear * 1009)` in the range 6.70%–8.20%. This is fabricated pseudo-random data that cannot be reproduced across platforms and has no econometric validity. It is intentionally omitted from the web application.
- Formatter:
  - $\ge 10^5 \to \text{"₹(val / 100000).toFixed(2)L"}$
  - $\ge 1000 \to \text{"₹(val / 1000).toFixed(1)K"}$
  - else $\to \text{"₹Math.round(val)"}$

### 4.3 Weekly Expense Predictor (`weekly_expense_tracker.dart`)
- Reuses `src/models/weekly.ts` and `src/hooks/useWeeklyTracker.ts` from Task 9:
  - Header: Score header and mini gauge.
  - Week strip with dynamic week count and current week selection.
  - Decision cards for Fixed Expenses, Flexible Expenses, and Savings Goal.
  - "Log Exact Amount" modal when Achieved is clicked; sets 0 when Missed is clicked.
  - Submit button blocked until all 3 categories have decisions (`'Please mark all three targets before submitting.'`).
  - Writes `local_expense_score` ONLY on user decision or submit.
  - Optimize button navigates to `/master-data?target=expenses`.

### 4.4 Mutual Fund / Investment Pillar (`mutual_fund.dart`)
- Inputs from `core.investment_scores` & `master_profiles`:
  $$\text{monthlySipTotal} = \text{monthlySipEquity} + \text{monthlySipDebt} + \text{monthlySipGold}$$
  $$\text{idealSip} = \text{monthlySipTotal} + \text{sipGap}$$
  $$\text{progress} = \text{idealSip} > 0 ? \frac{\text{monthlySipTotal}}{\text{idealSip}} : 0$$
- Asset mix percentages: $(\text{asset} / \text{totalInvested}) \times 100$ for Stock, Mutual Fund, Gold, and Real Estate.
- Formatter: Currency amounts formatted with standard Indian rupee grouping.

### 4.5 Emergency Fund Pillar (`emergency_fund.dart`)
- Inputs from `core.savings_scores` & `master_profiles`:
  $$\text{progress} = \text{efTarget} > 0 ? \frac{\text{efCurrent}}{\text{efTarget}} \times 100 : 0$$
  $$\text{shortfall} = \max(0, \text{efTarget} - \text{efCurrent})$$
- Parked Location Yield Tags:
  - Contains `'savings'` $\to$ `'~3.0% Annual Yield'`
  - `'fd'` or `'fixed deposit'` $\to$ `'~5.0% - 6.5% Annual Yield'`
  - `'liquid'` $\to$ `'~6.5% - 7.0% Annual Yield'`
  - `'cash'` $\to$ `'0.0% (No Yield)'`
  - else $\to$ `'~3.5% Estimated Yield'`
- **Session-Only Growth Badge**: In Flutter, `emergency_fund.dart` hardcoded an artificial baseline `prev = current * 0.952` in SharedPreferences. On web, the growth badge is hidden on initial render and appears only after the user adds savings or updates the fund in that specific session ($\Delta \% = (\text{current} - \text{prev}) / \text{prev} \times 100$).
- `addEmergencySavings`:
  1. Validates `amount > 0` (else alert: `'Enter a valid amount.'`).
  2. Opens confirmation modal titled `"Confirm Update"` with text `"Add ₹{amount} to your emergency fund?"`.
  3. Bypasses cached profile; fetches fresh profile from Supabase.
  4. Formats `profile.emergencyFundCurrent = (currentVal + amount).toFixed(0)` as a STRING.
  5. Merges into `profile_json`, updates `master_profiles` with UTC `updated_at`.
  6. Busts `profile_<uid>` and `dashboard_<uid>` cache keys.
  7. Updates UI state and displays success toast: `"Cloud sync complete! Savings updated."`.
- Formatter:
  - $\ge 10^7 \to \text{"₹(val / 10000000).toFixed(2)Cr"}$
  - $\ge 10^5 \to \text{"₹(val / 100000).toFixed(2)L"}$
  - $\ge 1000 \to \text{"₹Math.round(val / 1000)K"}$
  - else $\to \text{"₹Math.round(val)"}$

---

## 5. Read-Only Subscription Page (`/subscription`)

- Route: `/subscription`
- Appbar: Title `"Wealth Select"`, back button.
- Active Subscription Banner:
  - If active PRO: `"Valid until: {dd MMM yyyy}"`
  - If free/expired: `"Free Tier - Limited Access"` or `"Subscription Expired"`
- 3 Subscription Tiers:
  1. **Quarterly Plan**: 3 months, ₹589/month (Total billed: ₹1,767 upfront, Original ₹799, 38% OFF, SAVE ₹897).
  2. **Half-Yearly Plan**: 6 months, ₹469/month (Total billed: ₹2,814 upfront, Original ₹799, 50% OFF, SAVE ₹2,400).
  3. **Yearly Plan**: 12 months, ₹349/month (Total billed: ₹4,188 upfront, Original ₹799, 63% OFF, SAVE ₹6,000, Recommended Badge).
- Platform Fee Footnote:
  `"*Final checkout price includes standard Google Play / App Store platform fees applied to base plan rates."`
- Buy Button:
  - Disabled / Informational button with label: **"Purchase in the MoneyMapper mobile app"**.
  - **Zero payment gateway integration; NEVER calls `stack_subscription` RPC.**
