# Master Data & Onboarding Specification (Flutter to Web)

This document specifies the exact contract, field definitions, option lists, validation sequences, data types, and deliberate web deviations for:
1. **Master Data (`/master-data`)**: Mirroring `screens/master_data_screen.dart` (1,140 lines).
2. **Legacy Onboarding (`/onboarding`)**: Mirroring `screens/onboarding_screen.dart` (623 lines).

---

## 1. Master Profile Payload Schema (`_buildDataMap`)

Stored in `public.master_profiles.profile_json`.

### Exact Key List & Types (Mirroring `master_data_screen.dart` lines 281–359)

| Section | Key Name | Form Type / Input | Output Type | Default / Example |
| :--- | :--- | :--- | :--- | :--- |
| **Consent** | `consent_given` | Checkbox | `boolean` | `false` |
| **Consent** | `consent_timestamp`| Automatic | `string` (ISO8601) | `"2026-09-19T12:00:00.000Z"` |
| **1. Identity** | `fullName` | Text input | `string` | `""` |
| **1. Identity** | `mobile` | Phone text input | `string` | `""` |
| **1. Identity** | `email` | Email text input | `string` | `""` |
| **1. Identity** | `dob` | Date picker | `string` (`DD-MM-YYYY`) | `"15-08-1995"` |
| **1. Identity** | `gender` | Dropdown | `string` \| `null` | `'Male'` \| `'Female'` \| `'Other'` |
| **1. Identity** | `city` | Dependent Dropdown / Text | `string` \| `null` | If `'Other'`, uses `otherCity` text |
| **1. Identity** | `state` | Dropdown | `string` \| `null` | One of 26 states |
| **1. Identity** | `employmentType`| Dropdown | `string` \| `null` | `'Salaried'` \| `'Self-Employed'` \| `'Business'` \| `'Freelancer'` \| `'Retired'` |
| **1. Identity** | `dependents` | Number input | `string` | `""` |
| **1. Identity** | `maritalStatus` | Dropdown (optional) | `string` \| `null` | `'Single'` \| `'Married'` \| `'Other'` |
| **1. Identity** | `pan` | Text input (optional) | `string` | `""` |
| **1. Identity** | `employer` | Text input | `string` | `""` |
| **1. Identity** | `department` | Text input | `string` | `""` |
| **1. Identity** | `designation` | Text input | `string` | `""` |
| **2. Income** | `monthlyActiveIncome` | Number input | `string` | `"0"` |
| **2. Income** | `incomeFrequency` | Dropdown | `string` \| `null` | `'Monthly'` \| `'Weekly'` \| `'Irregular'` |
| **2. Income** | `cityTier` | Dropdown | `string` \| `null` | `'Metro City / Tier 1'` \| `'Tier 2'` \| `'Tier 3'` |
| **2. Income** | `hasPassiveIncome` | Switch toggle | `boolean` | `false` |
| **2. Income** | `passiveIncomeAmount`| Number input | `string` | `"0"` |
| **2. Income** | `passiveIncomeSource`| Dropdown | `string` \| `null` | `'Rent'` \| `'Dividends'` \| `'Interest'` \| `'Other'` |
| **2. Income** | `salaryBreakup` | Textarea (optional) | `string` | `""` |
| **3. Expenses** | `monthlyFixedExpenses` | Number input | `string` | `"0"` |
| **3. Expenses** | `monthlyVariableExpenses`| Number input | `string` | `"0"` |
| **3. Expenses** | `totalEmi` | Number input | `string` | `"0"` |
| **3. Expenses** | `activeLoans` | Number input | `string` | `"0"` |
| **3. Expenses** | `monthlySavings` | Number input | `string` | `"0"` |
| **3. Expenses** | `loanDetails` | Textarea (optional) | `string` | `""` |
| **3. Expenses** | `expenseCategoryBreakdown`| Textarea (optional) | `string` | `""` |
| **4. Emergency**| `hasEmergencyFund` | Switch toggle | `boolean` | `false` |
| **4. Emergency**| `emergencyFundCurrent`| Number input | `string` | `"0"` |
| **4. Emergency**| `emergencyFundParked`| Dropdown | `string` \| `null` | `'Savings A/C'` \| `'FD'` \| `'Liquid Fund'` \| `'Cash'` \| `'Other'` |
| **5. Insurance**| `hasHealthInsurance`| Switch toggle | `boolean` | `false` |
| **5. Insurance**| `healthCover` | Number input | `string` | `"0"` |
| **5. Insurance**| `isFamilyCovered` | Switch toggle | `boolean` | `false` |
| **5. Insurance**| `hasLifeInsurance` | Switch toggle | `boolean` | `false` |
| **5. Insurance**| `lifeCover` | Number input | `string` | `"0"` |
| **5. Insurance**| `hasTermPlan` | Switch toggle | `boolean` | `false` |
| **5. Insurance**| `termCover` | Number input | `string` | `"0"` |
| **5. Insurance**| `insurerName` | Text input (optional) | `string` | `""` |
| **5. Insurance**| `policyNumber` | Text input (optional) | `string` | `""` |
| **5. Insurance**| `policyExpiry` | Text input (optional) | `string` | `""` |
| **5. Insurance**| `hasCriticalIllness`| Switch toggle | `boolean` | `false` |
| **5. Insurance**| `hasAccidentalCover`| Switch toggle | `boolean` | `false` |
| **6. Investments**| `doesInvest` | Switch toggle | `boolean` | `false` |
| **6. Investments**| `totalEquityInvestments`| Number input | `string` | `"0"` |
| **6. Investments**| `totalDebtInvestments`| Number input | `string` | `"0"` |
| **6. Investments**| `totalGoldInvestments`| Number input | `string` | `"0"` |
| **6. Investments**| `totalRealEstateInvestments`| Number input | `string` | `"0"` |
| **6. Investments**| `stockSips` | Dynamic array | `Array<{name: string, amount: string, date: number}>` | `[]` |
| **6. Investments**| `mfSips` | Dynamic array | `Array<{name: string, amount: string, date: number}>` | `[]` |
| **6. Investments**| `goldSips` | Dynamic array | `Array<{name: string, amount: string, date: number}>` | `[]` |
| **6. Investments**| `monthlySipEquity`| Auto-calculated | `string` (Dart double: e.g. `"5000.0"`) | Sum of `stockSips` amounts |
| **6. Investments**| `monthlySipDebt` | Auto-calculated | `string` (Dart double: e.g. `"2000.0"`) | Sum of `mfSips` amounts |
| **6. Investments**| `monthlySipGold` | Auto-calculated | `string` (Dart double: e.g. `"1000.0"`) | Sum of `goldSips` amounts |
| **6. Investments**| `riskAppetite` | Dropdown | `string` \| `null` | `'Conservative'` \| `'Moderate'` \| `'Aggressive'` |
| **6. Investments**| `primaryInvestmentGoal`| Dropdown (optional) | `string` \| `null` | `'Wealth'` \| `'Retirement'` \| `'Child'` \| `'Home'` \| `'Emergency'` \| `'Other'` |
| **6. Investments**| `existingPortfolio`| Text input (optional) | `string` | `""` |
| **6. Investments**| `equityExposurePct`| Slider (0–100) | `string` (Dart double: e.g. `"50.0"`) | `"0.0"` |

---

## 2. Validation Rules & Exact Error Messages (Save-time only)

Validated strictly in this order on Save (mirroring `master_data_screen.dart` lines 411–457):

1. **Consent Check**:
   - Condition: `!consent_given`
   - Message: `"Please provide your consent to process data for financial insights."`
2. **Basic Identity**:
   - Condition: `fullName.trim().isEmpty || dob.trim().isEmpty || gender == null || state == null || (city == null || (city == 'Other' && otherCity.trim().isEmpty))`
   - Message: `"Basic Identity (Name, DOB, Gender, State, City) is mandatory."`
3. **Employment**:
   - Condition: `employmentType == null || employer.trim().isEmpty`
   - Message: `"Employment Type and Employer Name are mandatory."`
4. **Income Essentials**:
   - Condition: `monthlyActiveIncome.trim().isEmpty || incomeFrequency == null`
   - Message: `"Monthly Active Income and Frequency are mandatory."`
5. **Expense Essentials**:
   - Condition: `monthlyFixedExpenses.trim().isEmpty || monthlyVariableExpenses.trim().isEmpty || monthlySavings.trim().isEmpty`
   - Message: `"Fixed Expenses, Variable Expenses, and monthly Savings are mandatory."`
6. **Investment Essentials** (Evaluated only if `doesInvest === true`):
   - Condition: `totalEquityInvestments.trim().isEmpty || totalDebtInvestments.trim().isEmpty || totalGoldInvestments.trim().isEmpty || totalRealEstateInvestments.trim().isEmpty || riskAppetite == null`
   - Message: `"Please fill all mandatory investment fields (Totals and Risk Appetite)."`

---

## 3. Deliberate Web Deviations from Mobile App

1. **Omission of `_runAutoSipLogic`**:
   - In Flutter `master_data_screen.dart` lines 909–950, when the user opens the master data screen, an auto-SIP routine checks if today's date `>= sip.date` and increments `total*Investments` by the SIP amount, tracking completion in a device-local SharedPreferences key (`sip_last_processed_<type>_<index>`).
   - If executed on Web, the user's investments would be incremented twice (once on mobile, once on web).
   - Therefore, `_runAutoSipLogic` is omitted on web. Loading `/master-data` on web never mutates investment totals or triggers a background write.
2. **Non-Destructive Profile Merging**:
   - Flutter's `updateMasterProfile` and `submitOnboarding` overwrite `master_profiles.profile_json` entirely.
   - On Web, `apiService.updateMasterProfile` and `apiService.submitOnboarding` perform a **fresh DB read** of `master_profiles.profile_json` (bypassing the local cache) and merge: `{ ...(freshRow?.profile_json ?? {}), ...data }`.
   - This ensures legacy/onboarding snake_case keys and mobile-specific keys are preserved.
3. **No Redundant LocalStorage Copy**:
   - Flutter calls `AuthService().saveMasterProfileLocally(jsonStr)`.
   - On Web, no separate `master_profile_data` key is written to localStorage. The Task 6 TTL cache is sufficient and is flushed on logout.
4. **Privacy / Zero PII Console Logs**:
   - Sensitive user data (PAN, DOB, policy numbers) is never printed via `console.log`.
5. **History Back Navigation**:
   - Flutter uses `Navigator.pop(context, true)`. Web uses `navigate(-1)` with fallback to `/dashboard`.
6. **Task 7 Empty-State Fix**:
   - In `DashboardPage.tsx`, clicking "Set Up Financial Profile" navigates to `/master-data` (mirroring Flutter `dashboard_screen.dart` line 352).

---

## 4. Legacy Onboarding (`/onboarding`) Specification

Mirroring `screens/onboarding_screen.dart` (3-step form):

### Step Titles:
- Step 1: `'Step 1 of 3 • Income & Expenses'`
- Step 2: `'Step 2 of 3 • Investments & Assets'`
- Step 3: `'Step 3 of 3 • Protection'`

### Field Placement:
- **Step 1**:
  - `monthlyIncome` (`Monthly Income`, required number)
  - `fixedExpenses` (`Monthly Fixed Expenses`, required number, hint: `Rent, EMIs, utilities`)
  - `flexibleExpenses` (`Monthly Flexible Expenses`, required number, hint: `Food, travel, shopping`)
- **Step 2**:
  - `equityPct` (`Equity %`, required number)
  - `debtPct` (`Debt %`, required number)
  - `goldPct` (`Gold %`, required number)
  - `totalInvestment` (`Total Investment Amount`, required number)
  - Allocation Bar: visual breakdown (`Equity`: `#8B5CF6`, `Debt`: `#2563EB`, `Gold`: `#F59E0B`)
  - **Notice**: Horizon dropdown is **NOT** on Step 2.
- **Step 3**:
  - `termCover` (`Term Insurance Cover`, required number)
  - `healthCover` (`Health Insurance Cover`, required number)
  - `emergencyFund` (`Emergency Fund Available`, required number)
  - `investmentHorizon` (`Investment Horizon`, options: `'< 3 years'`, `'3-7 years'`, `'> 7 years'`)

### Payload Submitted to `apiService.submitOnboarding`:
```ts
{
  monthly_income: number,
  monthly_expenses: number, // fixedExpenses + flexibleExpenses
  equity_pct: number,
  gold_pct: number,
  debt_pct: number,
  term_cover: number,
  health_cover: number,
  liquidity_fund: number, // emergencyFund
  income_type: 'salaried',
  stability_months: 12,
  yoy_growth_pct: horizon === '3-7 years' ? 0.08 : horizon === '> 7 years' ? 0.10 : 0.05,
  source_count: 1,
  year: number, // current calendar year
  month: string // English month name e.g. 'September'
}
```
Numbers are numbers (floats/integers). Non-destructively merged over fresh DB row, then navigates to `/dashboard`.
