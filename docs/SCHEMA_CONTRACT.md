# MoneyMapper Database & Schema Contract

> **Source of Truth**: Flutter mobile app code located at `reference/moneymapper_app/lib/`.  
> Per Master Rule 1: **The CODE wins**. Never invent or rename schemas, tables, columns, RPCs, auth metadata keys, or profile keys.

---

## 1. Supabase Schemas & Tables Overview

The backend uses three active schemas queried from application code:
- `public`: Core user state, profile payloads, authentication handshakes, and logs.
- `bse_data`: Market feeds, signals, recommendations, content, and subscriptions.
- `core`: Aggregated scoring engine metrics, financial fitness pillars, and corporate intelligence.

### Table Classification by Schema

| Schema | Table Name | Referenced In Flutter Code |
| :--- | :--- | :--- |
| **`public`** | `market_sentiment` | `lib/services/api_service.dart` |
| **`public`** | `master_profiles` | `lib/services/api_service.dart`, `screens/master_data_screen.dart`, `weekly_expense_tracker.dart`, etc. |
| **`public`** | `weekly_logs` | `lib/services/api_service.dart`, `screens/weekly_screen.dart`, `weekly_expense_tracker.dart` |
| **`public`** | `app_logs` | `lib/services/api_service.dart` |
| **`public`** | `web_sessions` | `lib/services/api_service.dart`, `src/pages/QrLoginPage.tsx` |
| **`public`** | `corporate_admins` | `lib/services/api_service.dart`, `lib/services/security_service.dart` |
| **`bse_data`** | `stock_signals` | `screens/stock_screener_screen.dart`, `screens/recommendations_screen.dart`, `chatbot/chat_intent_service.dart` |
| **`bse_data`** | `mutual_fund_signals`| `screens/mf_screener_screen.dart`, `chatbot/chat_intent_service.dart` |
| **`bse_data`** | `insurance_plans` | `screens/insurance_screener_screen.dart`, `chatbot/chat_intent_service.dart` |
| **`bse_data`** | `ipo_signals` | `chatbot/chat_intent_service.dart` |
| **`bse_data`** | `finance_news` | `lib/services/api_service.dart` |
| **`bse_data`** | `blogs` | `lib/services/api_service.dart` |
| **`bse_data`** | `live_metal_rates` | `lib/services/market_data_service.dart` |
| **`bse_data`** | `user_subscriptions` | `lib/services/api_service.dart`, `lib/services/premium_service.dart` |
| **`core`** | `financial_fitness_scores`| `lib/services/api_service.dart`, `lib/models/dashboard_model.dart` |
| **`core`** | `income_scores` | `lib/services/api_service.dart`, `lib/models/dashboard_model.dart`, `income_pillar.dart` |
| **`core`** | `expense_scores` | `lib/services/api_service.dart`, `lib/models/dashboard_model.dart`, `weekly_expense_tracker.dart` |
| **`core`** | `savings_scores` | `lib/services/api_service.dart`, `lib/models/dashboard_model.dart`, `emergency_fund.dart` |
| **`core`** | `protection_scores` | `lib/services/api_service.dart`, `lib/models/dashboard_model.dart`, `insurance_dashboard.dart` |
| **`core`** | `investment_scores` | `lib/services/api_service.dart`, `lib/models/dashboard_model.dart`, `mutual_fund.dart` |
| **`core`** | `corporate_analytics` | `lib/services/api_service.dart`, `screens/corporate_dashboard_screen.dart` |
| **`core`** | `workforce_intelligence`| `lib/services/api_service.dart`, `screens/corporate_dashboard_screen.dart` |

---

## 2. Table Specifications & CRUD Operations

### 2.1 Schema: `public`

#### `public.master_profiles`
- **Read**:
  - Code: `_supabase.from('master_profiles').select().eq('user_id', userId).maybeSingle()`
  - Columns read: `profile_json`, `user_id`, `updated_at`
  - Filter: `.eq('user_id', userId)`
- **Write (Upsert)**:
  - Code: `_supabase.from('master_profiles').upsert({ 'user_id': userId, 'profile_json': data, 'updated_at': DateTime.now().toIso8601String() })`
  - Columns written: `user_id`, `profile_json`, `updated_at`
  - Conflict target: implicit primary key `user_id`

#### `public.weekly_logs`
- **Read**:
  - Code: `_supabase.from('weekly_logs').select().eq('user_id', userId).eq('log_month', targetMonth).eq('log_year', targetYear).order('week_index', ascending: true)`
  - Columns read: all (`id`, `user_id`, `week_index`, `log_month`, `log_year`, `status`, `fixed_status`, `flexible_status`, `savings_status`, `spent_fixed`, `spent_flexible`, `spent_savings`, `updated_at`)
  - Filters: `.eq('user_id', userId)`, `.eq('log_month', month)`, `.eq('log_year', year)`
  - Order: `.order('week_index', ascending: true)`
- **Write (Upsert)**:
  - Code:
    ```dart
    _supabase.from('weekly_logs').upsert({
      'user_id': userId,
      'week_index': weekIndex,
      'log_month': targetMonth,
      'log_year': targetYear,
      'status': status,
      'fixed_status': fixedStatus,
      'flexible_status': flexibleStatus,
      'savings_status': savingsStatus,
      'spent_fixed': spentFixed,
      'spent_flexible': spentFlexible,
      'spent_savings': spentSavings,
      'updated_at': DateTime.now().toIso8601String(),
    }, onConflict: 'user_id,week_index,log_month,log_year')
    ```
  - Columns written: `user_id`, `week_index`, `log_month`, `log_year`, `status`, `fixed_status`, `flexible_status`, `savings_status`, `spent_fixed`, `spent_flexible`, `spent_savings`, `updated_at`
  - Upsert onConflict: `'user_id,week_index,log_month,log_year'`

#### `public.web_sessions`
- **Insert (Web Initialisation)**:
  - Code: `supabase.from('web_sessions').insert({ session_token: token, status: 'PENDING' })`
  - Columns written: `session_token`, `status`
- **Realtime Listen (Web)**:
  - Channel filter: `postgres_changes`, `schema: 'public'`, `table: 'web_sessions'`, `filter: 'session_token=eq.${token}'`
- **Upsert (Mobile QR Scan)**:
  - Code:
    ```dart
    _supabase.from('web_sessions').upsert({
      'session_token': token,
      'user_id': userId,
      'access_token': session.accessToken,
      'refresh_token': session.refreshToken,
      'status': 'AUTHENTICATED',
      'authenticated_at': DateTime.now().toIso8601String(),
    }, onConflict: 'session_token')
    ```
  - Columns written: `session_token`, `user_id`, `access_token`, `refresh_token`, `status`, `authenticated_at`
  - Upsert onConflict: `'session_token'`
- **Delete (Web Post-Hydration)**:
  - Code: `supabase.from('web_sessions').delete().eq('session_token', token)`

#### `public.corporate_admins`
- **Read (Admin Email Check)**:
  - `api_service.dart`: `_supabase.from('corporate_admins').select('company_name').ilike('admin_email', normalizedEmail).maybeSingle()`
  - `security_service.dart`: `_supabase.from('corporate_admins').select('secure_flag').ilike('admin_email', email).maybeSingle()`
  - Columns read: `company_name`, `secure_flag`
  - Filter: `.ilike('admin_email', email)`

#### `public.app_logs`
- **Insert (Client Diagnostics & Audit)**:
  - Code:
    ```dart
    _supabase.from('app_logs').insert({
      'user_id': userId,
      'log_level': 'ERROR',
      'context': context,
      'message': error.toString(),
      'metadata': {
        'timestamp': DateTime.now().toIso8601String(),
        'stack_trace': stack?.toString(),
      },
    })
    ```
  - Columns written: `user_id`, `log_level`, `context`, `message`, `metadata`

#### `public.market_sentiment`
- **Read**:
  - Code: `_supabase.from('market_sentiment').select().order('updated_at', ascending: false).limit(1).maybeSingle()`
  - Columns read: all (`sentiment_score`, `label`, `updated_at`, etc.)

---

### 2.2 Schema: `bse_data`

#### `bse_data.stock_signals`
- **Read**:
  - Code: `_supabase.schema('bse_data').from('stock_signals').select()`
  - Columns read: all (`ticker`, `symbol`, `company_name`, `sector`, `signal`, `score`, `price`, `target_price`, `cagr`, `sharpe_ratio`, `risk_level`, `updated_at`, etc.)

#### `bse_data.mutual_fund_signals`
- **Read**:
  - Code: `_supabase.schema('bse_data').from('mutual_fund_signals').select()`
  - Columns read: all (`scheme_code`, `fund_name`, `category`, `sub_category`, `nav`, `cagr_3y`, `cagr_5y`, `sharpe_ratio`, `expense_ratio`, `rating`, `updated_at`, etc.)

#### `bse_data.insurance_plans`
- **Read**:
  - Code: `_supabase.schema('bse_data').from('insurance_plans').select()`
  - Columns read: all (`plan_id`, `company`, `policy_name`, `plan_type`, `premium`, `cover_amount`, `claim_ratio`, `rating`, `best_for`, `tag`, `updated_at`, etc.)

#### `bse_data.ipo_signals`
- **Read**:
  - Code: `_supabase.schema('bse_data').from('ipo_signals').select()`
  - Columns read: all (`company_name`, `open_date`, `close_date`, `price_band`, `issue_size`, `gmp`, `status`, `updated_at`, etc.)

#### `bse_data.live_metal_rates`
- **Read**:
  - Code: `_supabase.schema('bse_data').from('live_metal_rates').select()`
  - Columns read: `purity`, `price`, `updated_at` (e.g. `'24K'`, `'22K'`)

#### `bse_data.finance_news`
- **Read**:
  - Code: `_supabase.schema('bse_data').from('finance_news').select().order('updated_at', ascending: false).limit(10)`
  - Columns read: all (`id`, `title`, `summary`, `content`, `url`, `publisher`, `published_at`, `updated_at`, etc.)
  - *WEB-ONLY Deep Link Fallback*: `_supabase.schema('bse_data').from('finance_news').select().eq('id', id).maybeSingle()` (used when `/news/:id?type=news` is loaded directly without router state; requires `id` column to exist).

#### `bse_data.blogs`
- **Read**:
  - Code: `_supabase.schema('bse_data').from('blogs').select().order('updated_at', ascending: false).limit(10)`
  - Columns read: all (`id`, `title`, `author`, `read_time`, `content`, `tags`, `updated_at`, etc.)
  - *WEB-ONLY Deep Link Fallback*: `_supabase.schema('bse_data').from('blogs').select().eq('id', id).maybeSingle()` (used when `/news/:id?type=blog` is loaded directly without router state; requires `id` column to exist).

#### `bse_data.user_subscriptions`
- **Read**:
  - Code: `_supabase.schema('bse_data').from('user_subscriptions').select().eq('user_id', userId).maybeSingle()`
  - Columns read: all (`user_id`, `tier`, `status`, `current_period_end`, `updated_at`)
  - Filter: `.eq('user_id', userId)`

---

### 2.3 Schema: `core`

All `core` scoring tables are queried with `.eq('user_id', userId).maybeSingle()`.

#### `core.financial_fitness_scores`
- **Read**:
  - Code: `_supabase.schema('core').from('financial_fitness_scores').select().eq('user_id', userId).maybeSingle()`
  - Columns read: `user_id`, `income_pillar_score`, `expense_pillar_score`, `savings_pillar_score`, `protection_pillar_score`, `investment_pillar_score`, `global_fitness_score`, `updated_at`

#### `core.income_scores`
- **Read**:
  - Code: `_supabase.schema('core').from('income_scores').select().eq('user_id', userId).maybeSingle()`
  - Columns read: `user_id`, `active_income_score`, `passive_income_score`, `total_income_score`, `updated_at`

#### `core.expense_scores`
- **Read**:
  - Code: `_supabase.schema('core').from('expense_scores').select().eq('user_id', userId).maybeSingle()`
  - Columns read: `user_id`, `savings_score`, `flexible_score`, `fixed_score`, `total_expense_score`, `discipline_message`, `updated_at`

#### `core.savings_scores`
- **Read**:
  - Code: `_supabase.schema('core').from('savings_scores').select().eq('user_id', userId).maybeSingle()`
  - Columns read: `user_id`, `ef_target_amount`, `ef_current_estimated`, `total_savings_score`, `updated_at`

#### `core.protection_scores`
- **Read**:
  - Code: `_supabase.schema('core').from('protection_scores').select().eq('user_id', userId).maybeSingle()`
  - Columns read: `user_id`, `term_score`, `health_score`, `total_protection_score`, `term_gap`, `health_gap`, `updated_at`

#### `core.investment_scores`
- **Read**:
  - Code: `_supabase.schema('core').from('investment_scores').select().eq('user_id', userId).maybeSingle()`
  - Columns read: `user_id`, `equity_score`, `asset_balance_score`, `sip_score`, `total_investment_score`, `sip_gap`, `total_investment_amount`, `equity_gap_pct`, `debt_gap_pct`, `real_estate_gap_pct`, `gold_gap_pct`, `updated_at`

#### `core.corporate_analytics`
- **Read**:
  - Code: `_supabase.schema('core').from('corporate_analytics').select().eq('company_name', companyName).maybeSingle()`
  - Columns read: `company_name`, `total_headcount`, `avg_workforce_score`, `critical_risk_count`, `high_risk_count`, `watchlist_count`, `stable_count`, `dept_metrics`, `paycheck_dependency_pct`, `no_emergency_fund_pct`

#### `core.workforce_intelligence`
- **Read**:
  - Code: `_supabase.schema('core').from('workforce_intelligence').select().eq('company_name', companyName).maybeSingle()`
  - Columns read: all pillar intelligence metrics aggregated by company name.

---

## 3. Remote Procedure Calls (RPCs)

### `public.stack_subscription`
- **Schema**: `public` (default Supabase RPC schema)
- **Code Call**:
  ```dart
  await _supabase.rpc('stack_subscription', params: {
    'p_user_id': userId,
    'p_months_to_add': monthsToAdd,
  });
  ```
- **Parameters**:
  - `p_user_id`: UUID
  - `p_months_to_add`: integer
- **Behavior**: If `current_period_end` is NULL or `<= NOW()`, sets expiry to `NOW() + INTERVAL`; otherwise extends from existing `current_period_end`. Inserts/updates `bse_data.user_subscriptions`.

---

## 4. Auth Sign Up Metadata Keys

Used in `_supabase.auth.signUp(email, password, data: metadata)`:
- `fullName`: string (User's full display name)
- `mobile`: string (Contact phone number)
- `plan`: string (Defaults to `'b2c'`)

---

## 5. Profile JSON Schema Contract

Stored in `public.master_profiles.profile_json` (JSONB).

### 5.1 Onboarding Wizard Keys (`onboarding_screen.dart`)
1. `monthly_income` (number)
2. `monthly_expenses` (number)
3. `equity_pct` (number)
4. `gold_pct` (number)
5. `debt_pct` (number)
6. `term_cover` (number)
7. `health_cover` (number)
8. `liquidity_fund` (number)
9. `income_type` (string: `'salaried'` | `'business'` | etc.)
10. `stability_months` (number: 12)
11. `yoy_growth_pct` (number: derived from horizon)
12. `source_count` (number: 1)
13. `year` (number: current calendar year)
14. `month` (string: English month name, e.g. `'September'`)

### 5.2 Comprehensive Master Data Keys (`master_data_screen.dart` - 52 Fields + Consent)
- **Consent Metadata**:
  - `consent_given` (boolean)
  - `consent_timestamp` (ISO8601 string)

- **Category 1: Basic Identity (14 fields)**:
  - `fullName` (string)
  - `mobile` (string)
  - `email` (string)
  - `dob` (string: DD-MM-YYYY)
  - `gender` (string: 'Male' | 'Female' | 'Other')
  - `city` (string)
  - `state` (string)
  - `employmentType` (string: 'Salaried' | 'Business' | etc.)
  - `dependents` (string / int)
  - `maritalStatus` (string: 'Single' | 'Married')
  - `pan` (string)
  - `employer` (string: company name)
  - `department` (string)
  - `designation` (string)

- **Category 2: Income Pillar (7 fields)**:
  - `monthlyActiveIncome` (string / numeric)
  - `incomeFrequency` (string: 'Monthly' | etc.)
  - `cityTier` (string: 'Metro' | 'Tier 2' | 'Tier 3')
  - `hasPassiveIncome` (boolean)
  - `passiveIncomeAmount` (string / numeric)
  - `passiveIncomeSource` (string)
  - `salaryBreakup` (string)

- **Category 3: Expenses Pillar (7 fields)**:
  - `monthlyFixedExpenses` (string / numeric)
  - `monthlyVariableExpenses` (string / numeric)
  - `totalEmi` (string / numeric)
  - `activeLoans` (string / int)
  - `monthlySavings` (string / numeric)
  - `loanDetails` (string)
  - `expenseCategoryBreakdown` (string)

- **Category 4: Emergency Fund Pillar (3 fields)**:
  - `hasEmergencyFund` (boolean)
  - `emergencyFundCurrent` (string / numeric)
  - `emergencyFundParked` (string: 'Savings Account' | 'Liquid Funds' | 'FD')

- **Category 5: Insurance Pillar (12 fields)**:
  - `hasHealthInsurance` (boolean)
  - `healthCover` (string / numeric)
  - `isFamilyCovered` (boolean)
  - `hasLifeInsurance` (boolean)
  - `lifeCover` (string / numeric)
  - `hasTermPlan` (boolean)
  - `termCover` (string / numeric)
  - `insurerName` (string)
  - `policyNumber` (string)
  - `policyExpiry` (string)
  - `hasCriticalIllness` (boolean)
  - `hasAccidentalCover` (boolean)

- **Category 6: Investment Pillar (12 fields)**:
  - `doesInvest` (boolean)
  - `totalEquityInvestments` (string / numeric)
  - `totalDebtInvestments` (string / numeric)
  - `totalGoldInvestments` (string / numeric)
  - `totalRealEstateInvestments` (string / numeric)
  - `stockSips` (array of objects `{ name, amount, date }`)
  - `mfSips` (array of objects `{ name, amount, date }`)
  - `goldSips` (array of objects `{ name, amount, date }`)
  - `monthlySipEquity` (string / numeric)
  - `monthlySipDebt` (string / numeric)
  - `monthlySipGold` (string / numeric)
  - `riskAppetite` (string: 'Conservative' | 'Moderate' | 'Aggressive')
  - `primaryInvestmentGoal` (string)
  - `existingPortfolio` (string)
  - `equityExposurePct` (string / numeric)

---

## 6. SharedPreferences / LocalStorage Keys to Mirror

Keys persisted locally on client:
- `theme_mode`: `'dark'` | `'light'` | null (system default)
- `jwt_token`: active access token
- `user_name`: user display name
- `user_email`: user email
- `user_plan`: subscription plan (`'b2c'`, `'pro'`, etc.)
- `master_profile_data`: cached raw JSON string of `profile_json`
- `user_xp`: gamification total XP (integer)
- `user_streak`: active weekly tracking streak (integer)
- `user_streak_last_week`: last logged week number
- `user_streak_last_year`: last logged year
- `last_score`: last evaluated financial fitness score
- `baseline_score`: initial baseline financial fitness score
- `mastered_pillars`: list of strings (mastered pillar names)
- `unlocked_badges`: list of unlocked badge IDs
- `premium_last_sync`: timestamp of last subscription sync
- `user_first_login_ts`: first login timestamp
- `reminder_notifications_enabled`: boolean (weekly reminder setting)
- `app_lock_enabled`: boolean (mobile-only biometrics)
- `local_expense_score`: last cached discipline score
- `ef_prev_current`: last cached emergency fund current amount
- Cache Prefixes:
  - `mm_cache_<key>`: TTL data cache
  - `mm_cache_ts_<key>`: Timestamp of cached item

---

## 7. Mismatches Between `reference/README.md` and Actual CODE

| Subject | `reference/README.md` Claim | Actual Flutter CODE Reality | Resolution (Rule 1) |
| :--- | :--- | :--- | :--- |
| **`corporate_admins` Primary Key** | Table definition claims `user_id UUID PRIMARY KEY`. | `api_service.dart` and `security_service.dart` query using `.ilike('admin_email', email)`. SQL script `public_to_stg.sql` defines `id uuid primary key, admin_email text unique not null, company_name text not null`. No `user_id` is queried. | **The CODE wins**. Web queries by `admin_email`. |
| **`corporate_admins.secure_flag`** | README lists `secure_flag BOOLEAN DEFAULT true`. | `security_service.dart` queries `.select('secure_flag')`. However, `secure_flag` is **NOT** defined in `SQL/public_to_stg.sql`! | **Note on Live DB**: `secure_flag` is consumed by code and should exist in the live database schema, but must be verified against the live instance. |
| **Metal Rates Table** | README Section 6.1 claims table is `bse_data.gold_rates`. | `market_data_service.dart` line 26 queries `bse_data.live_metal_rates`. | **The CODE wins**. Use `bse_data.live_metal_rates`. |
| **Mutual Fund Signals Table** | README Section 6.3 claims table is `bse_data.mf_signals`. | `mf_screener_screen.dart` line 58 and `chat_intent_service.dart` line 373 query `bse_data.mutual_fund_signals`. | **The CODE wins**. Use `bse_data.mutual_fund_signals`. |

---

## 8. Environment Security Notice

- `.env.example` must contain **only placeholder values** (e.g. `https://your-project-id.supabase.co`).
- Never commit `.env` or real API keys to version control.
- `.env` and `.env.*` must remain gitignored.
