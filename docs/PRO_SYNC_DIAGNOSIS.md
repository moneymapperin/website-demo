# Mobile-to-Web PRO Subscription Sync Diagnostic Report

> **Target**: In-App Purchase completion in `moneymapper_app`, `bse_data.user_subscriptions` schema, and web subscription gating in `website_landing_page` (`src/services/premiumService.ts`, `src/hooks/usePlan.ts`, `src/pages/SubscriptionPage.tsx`).  
> **Investigation Scope**: Root-cause analysis of why a user who purchased PRO on the mobile companion app still sees "Standard/Free" tier and locked pillars on the website.  
> **Status**: DIAGNOSTIC ONLY. No source code modified.

---

## Root-Cause Hypothesis

The disconnect between mobile PRO status and website Standard/Free status is caused by **three compounding architectural breakdowns**:

1. **The Website's React Hook (`usePlan`) Disconnects From Supabase Subscription Data**:
   In [`src/hooks/usePlan.ts:55-57`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/hooks/usePlan.ts#L55-L57), the website evaluates PRO gating strictly via:
   ```typescript
   const localPlan = premiumService.getCachedPlan();
   const planString = localPlan || user?.user_metadata?.plan || (user as any)?.plan || 'b2c';
   const isPro = isProPlan(planString);
   ```
   This reads solely from `localStorage.getItem('user_plan')` (which was stamped with `'b2c'` upon initial registration or sign-in) or `user.user_metadata.plan`. The mobile app's in-app purchase flow completes via the `public.stack_subscription` PostgreSQL RPC, which inserts/updates the **`bse_data.user_subscriptions`** table ([`reference/moneymapper_app/README.md:181-188`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/reference/moneymapper_app/README.md#L181-L188)); it **never** updates `auth.users.raw_user_meta_data`. Because `usePlan` only checks local storage and auth metadata, it is completely blind to database subscriptions.

2. **The 5-Minute Background Poller (`PremiumService.isPro()`) Is Dead Code In Production UI**:
   While [`src/services/premiumService.ts:206-221`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/services/premiumService.ts#L206-L221) implements the mobile app's 5-minute throttle and calls `syncSubscriptionStatus()`, **`PremiumService.isPro()` is never called anywhere in the web application's components or hooks** (grep confirms it is only invoked in test files). All UI components consume `usePlan()`, and `usePlan()` only subscribes to `onAuthStateChange('SIGNED_IN')`. When a user visits the website with an existing session (or refreshes the page), Supabase dispatches `INITIAL_SESSION`, **not** `SIGNED_IN`. Consequently, `syncSubscriptionStatus()` is **never called on page load, navigation, or interval**.

3. **`SubscriptionPage.tsx` Fetches Expiry Locally but Never Updates Global Plan State or LocalStorage**:
   When the user visits [`src/pages/SubscriptionPage.tsx:68-89`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/pages/SubscriptionPage.tsx#L68-L89), `fetchSubscription()` queries `apiService.getSubscriptionDetails()`. Even if this query succeeds, it only updates a local component state `expiryDate`. It **never calls `premiumService.setPlan(...)` or `premiumService.syncSubscriptionStatus()`**. As a result, even if the subscription page displays an expiry date, `usePlan()` on the rest of the site (`PillarGuard`, `AppShell`, `DashboardPage`) remains locked to `'b2c'`. Furthermore, if `bse_data.user_subscriptions` lacks an RLS policy granting `authenticated` users `SELECT` access on their own rows, `getSubscriptionDetails()` returns `null`, causing `/subscription` to fall back to `"Free Tier - Limited Access"`.

---

## Detailed Itemized Diagnosis (Items 1 to 8)

### 1. Mobile App Post-Purchase Execution & Database Write Call
- **Investigation**: Trace in-app purchase completion in `reference/moneymapper_app`.
- **Finding**:
  - In [`reference/moneymapper_app/lib/screens/subscription_screen.dart:157-186`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/reference/moneymapper_app/lib/screens/subscription_screen.dart#L157-L186):
    ```dart
    } else if (purchaseDetails.status == PurchaseStatus.purchased ||
               purchaseDetails.status == PurchaseStatus.restored) {
      _verifyAndDeliverProduct(purchaseDetails);
    }
    ```
  - In `_verifyAndDeliverProduct`:
    ```dart
    // 1. Determine months to add based on product ID
    final plan = _plans.firstWhere((p) => p.id == purchaseDetails.productID);
    
    // 2. Call Supabase RPC to stack subscription securely
    await _api.stackSubscription(plan.months);
    
    // 3. Update local auth state to Pro
    await _premiumService.setPlan('moneymapper pro membership');
    ```
  - In [`reference/moneymapper_app/lib/services/api_service.dart:133-144`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/reference/moneymapper_app/lib/services/api_service.dart#L133-L144):
    ```dart
    await _supabase.rpc('stack_subscription', params: {
      'p_user_id': userId,
      'p_months_to_add': monthsToAdd
    });
    ```
  - Exact SQL write call executed inside `public.stack_subscription` ([`reference/moneymapper_app/README.md:181-188`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/reference/moneymapper_app/README.md#L181-L188)):
    ```sql
    INSERT INTO bse_data.user_subscriptions (user_id, tier, status, current_period_end, updated_at)
    VALUES (p_user_id, 'pro', 'active', v_new_end, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
        tier = EXCLUDED.tier,
        status = EXCLUDED.status,
        current_period_end = EXCLUDED.current_period_end,
        updated_at = NOW();
    ```
  - **Schema**: `bse_data`
  - **Table**: `user_subscriptions`
  - **Columns Written**: `user_id` (UUID), `tier` (VARCHAR), `status` (VARCHAR), `current_period_end` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).
- **Classification**: **OK** (Mobile purchase flow properly calls the database RPC and updates the table).

---

### 2. Exact Plan / Tier String Values Written
- **Investigation**: Inspect string literals written to the database and local storage.
- **Finding**:
  1. **In Database (`bse_data.user_subscriptions`)**:
     - The column written is **`tier`** (not `plan`).
     - Literal value written: **`'pro'`** (lowercase string).
     - Quote: `VALUES (p_user_id, 'pro', 'active', v_new_end, NOW())`.
  2. **In Mobile Local Storage (SharedPreferences)**:
     - Literal value written: **`'moneymapper pro membership'`**.
     - Quote: `await _premiumService.setPlan('moneymapper pro membership');` ([`subscription_screen.dart:185`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/reference/moneymapper_app/lib/screens/subscription_screen.dart#L185)).
- **Classification**: **OK** (Values are consistent with the schema contract).

---

### 3. Mobile `isPro()` Normalization Logic
- **Investigation**: Audit [`reference/moneymapper_app/lib/services/premium_service.dart:44-60`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/reference/moneymapper_app/lib/services/premium_service.dart#L44-L60).
- **Finding**:
  ```dart
  Future<bool> isPro() async {
    final prefs = await SharedPreferences.getInstance();
    final lastSync = prefs.getInt(_lastSyncKey) ?? 0;
    final now = DateTime.now().millisecondsSinceEpoch;
    if (now - lastSync > 5 * 60 * 1000) { // 5 minutes
      syncSubscriptionStatus();
    }

    final plan = await _authService.getUserPlan();
    if (plan == null) return false;
    final normalized = plan.trim().toLowerCase();
    return normalized.contains("pro") || 
           normalized.contains("paid") || 
           normalized.contains("wealth select") || 
           normalized.contains("enterprise gold") ||
           normalized == proMembership.toLowerCase();
  }
  ```
  - **Matched Substrings**: `pro`, `paid`, `wealth select`, `enterprise gold`, or exact match with `moneymapper pro membership`.
  - **Confirmation**: `'moneymapper pro membership'` satisfies `.contains("pro")` and `== proMembership.toLowerCase()`. `'pro'` satisfies `.contains("pro")`. The mobile app correctly resolves to PRO.
- **Classification**: **OK**.

---

### 4. Website `isPro()` / PRO Gating Logic Diff Against Mobile
- **Investigation**: Compare [`src/services/premiumService.ts:79-89`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/services/premiumService.ts#L79-L89) with the Dart implementation.
- **Finding**:
  - **Website Implementation**:
    ```typescript
    export function isProPlan(planString?: string | null): boolean {
      if (!planString) return false;
      const normalized = planString.trim().toLowerCase();
      return (
        normalized.includes('pro') ||
        normalized.includes('paid') ||
        normalized.includes('wealth select') ||
        normalized.includes('enterprise gold') ||
        normalized === 'moneymapper pro membership'
      );
    }
    ```
  - **Character-for-Character Diff**:
    The string normalization function `isProPlan` is an **exact match** to Dart's `normalized.contains(...)` chain.
  - **Underlying Defect**: The logic flaw is NOT in string normalization; it is in **what string is fed into `isProPlan`**:
    In [`src/hooks/usePlan.ts:55-57`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/hooks/usePlan.ts#L55-L57):
    ```typescript
    const localPlan = premiumService.getCachedPlan();
    const planString = localPlan || user?.user_metadata?.plan || (user as any)?.plan || 'b2c';
    const isPro = isProPlan(planString);
    ```
    `planString` is resolved from `localStorage.getItem('user_plan')` (which defaults to `'b2c'`) or `user_metadata.plan` (which defaults to `'b2c'`). It never inspects the database row.
- **Classification**: **CONFIRMED BUG** (Normalization logic matches, but data source fed into it is permanently stale).

---

### 5. Website Subscription Fetch Query & Timestamp Comparison
- **Investigation**: Audit [`src/services/apiService.ts:335-354`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/services/apiService.ts#L335-L354) and [`src/services/premiumService.ts:165-187`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/services/premiumService.ts#L165-L187).
- **Finding**:
  1. **Fetch Query**:
     ```typescript
     const { data, error } = await supabase
       .schema('bse_data')
       .from('user_subscriptions')
       .select()
       .eq('user_id', userId)
       .maybeSingle();
     ```
     - Schema: `'bse_data'` (Matches mobile).
     - Table: `'user_subscriptions'` (Matches mobile).
     - Filter: `user_id = userId` (Matches mobile).
  2. **Timestamp Comparison**:
     ```typescript
     const expiry = new Date(details.current_period_end);
     if (expiry.getTime() > Date.now()) {
       await this.setPlan(PremiumService.proMembership);
     } else {
       await this.setPlan(PremiumService.freeMembership);
     }
     ```
     - `details.current_period_end` is a PostgreSQL `TIMESTAMPTZ` string (e.g. `2027-09-20T05:30:00+00:00`).
     - `new Date(details.current_period_end).getTime()` correctly yields epoch milliseconds in UTC.
     - `Date.now()` also yields epoch milliseconds in UTC.
     - The mathematical comparison `expiry.getTime() > Date.now()` is correct and timezone-independent.
  3. **Potential Point of Failure (RLS Permissions)**:
     If the PostgreSQL schema `bse_data.user_subscriptions` does not have an RLS policy granting `authenticated` users permission to `SELECT` their own row (`auth.uid() = user_id`), Supabase PostgREST returns `data: null`. `apiService.getSubscriptionDetails()` then returns `null`, causing `syncSubscriptionStatus()` to downgrade the plan to `freeMembership`.
- **Classification**: **SUSPECTED** (Query structure and timestamp math are correct, but database RLS on `bse_data.user_subscriptions` may be blocking read access).

---

### 6. Stale Caching & Lack of Periodic Sync on the Website
- **Investigation**: Trace caching and synchronization lifecycles across [`src/services/premiumService.ts`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/services/premiumService.ts) and [`src/hooks/usePlan.ts`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/hooks/usePlan.ts).
- **Finding**:
  - **Local Storage Key**: `user_plan` (`localStorage.setItem('user_plan', ...)`).
  - **TTL**: `user_plan` has **no TTL / expiration**. Once set to `'b2c'` during initial login, it stays in `localStorage` indefinitely until explicitly deleted or logged out.
  - **Periodic Re-sync**:
    - Mobile app triggers `syncSubscriptionStatus()` if `now - lastSync > 5 minutes` whenever `isPro()` is checked.
    - On the website, `PremiumService.isPro()` has this 5-minute check ([`premiumService.ts:210-217`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/services/premiumService.ts#L210-L217)).
    - **CRITICAL DEFECT**: React components **never invoke `PremiumService.isPro()`**!
    - Every component calls `usePlan()`.
    - `usePlan()` ([`src/hooks/usePlan.ts:55`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/hooks/usePlan.ts#L55)) only calls `premiumService.getCachedPlan()`, which performs a synchronous read of `localStorage.getItem('user_plan')` without checking sync timestamps or triggering background refreshes.
    - `usePlan()`'s `useEffect` only listens for `event === 'SIGNED_IN'`. When the user is already logged in, visits the site, or refreshes the browser, Supabase auth issues `INITIAL_SESSION`, **never** `SIGNED_IN`.
    - Result: The website **never** checks Supabase for updated subscription status after the initial login.
- **Classification**: **CONFIRMED BUG** (Background re-sync is dead code in the React application; cached `'b2c'` plan never refreshes).

---

### 7. Website Relies on Static User Metadata Rather Than Subscription Table
- **Investigation**: Trace how `usePlan()` and auth login handlers populate plan status.
- **Finding**:
  - In [`src/services/authService.ts:267-275`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/services/authService.ts#L267-L275):
    ```typescript
    if (data.user) {
      this._currentUser = data.user;
      const metadata = data.user.user_metadata || {};
      await this.saveUser({
        name: metadata.fullName ?? '',
        email: data.user.email ?? '',
        plan: metadata.plan ?? 'b2c',
      });
    }
    ```
  - In `authService.saveUser` ([`authService.ts:96-99`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/services/authService.ts#L96-L99)):
    ```typescript
    const currentPlan = localStorage.getItem(AUTH_STORAGE_KEYS.PLAN);
    if (!currentPlan) {
      localStorage.setItem(AUTH_STORAGE_KEYS.PLAN, user.plan ?? 'b2c');
    }
    ```
  - In `QrLoginPanel.tsx`: When logging in via QR scan, `supabase.auth.setSession(...)` succeeds, but `premiumService.syncSubscriptionStatus()` is **never called**.
  - In `SubscriptionPage.tsx:68-89`: When the user navigates directly to `/subscription`, `fetchSubscription()` queries `apiService.getSubscriptionDetails()`, but it **never updates `premiumService` or `localStorage`**.
  - The website completely relies on the static value in `user_metadata` or the initial `'b2c'` stored in `localStorage`.
- **Classification**: **CONFIRMED BUG**.

---

### 8. SQL Ground Truth Query

Please execute the following SQL in the **Supabase SQL Editor** to inspect the live server-side record for the affected user:

```sql
SELECT 
    user_id, 
    tier, 
    status, 
    current_period_end, 
    updated_at
FROM bse_data.user_subscriptions
WHERE user_id = '<THE_AFFECTED_USER_UUID>'
ORDER BY updated_at DESC
LIMIT 5;
```

> **Note on column names**: In `bse_data.user_subscriptions`, the column name defined in the schema is **`tier`** (not `plan`). If your table schema has both, you can also run:
> ```sql
> SELECT * FROM bse_data.user_subscriptions WHERE user_id = '<THE_AFFECTED_USER_UUID>';
> ```

Also run this RLS policy inspection query to verify whether `authenticated` users have permission to read `bse_data.user_subscriptions`:

```sql
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual
FROM pg_policies
WHERE schemaname = 'bse_data' AND tablename = 'user_subscriptions';
```

---

## Evaluation Summary Table

| Item # | Diagnostic Area | Evaluation | File & Line Reference | Finding Summary |
|---|---|---|---|---|
| **1** | Mobile Post-Purchase Write | **OK** | [`reference/moneymapper_app/lib/screens/subscription_screen.dart:182`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/reference/moneymapper_app/lib/screens/subscription_screen.dart#L182) | Mobile calls `stack_subscription(plan.months)` RPC, writing to `bse_data.user_subscriptions`. |
| **2** | Exact Plan String Written | **OK** | [`reference/moneymapper_app/README.md:181`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/reference/moneymapper_app/README.md#L181) | DB column `tier` is set to `'pro'`. Mobile local storage is set to `'moneymapper pro membership'`. |
| **3** | Mobile `isPro()` Normalization | **OK** | [`reference/moneymapper_app/lib/services/premium_service.dart:54-60`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/reference/moneymapper_app/lib/services/premium_service.dart#L54-L60) | Correctly matches `'pro'`, `'moneymapper pro membership'`, `'paid'`, etc. |
| **4** | Website Gating vs Mobile Diff | **CONFIRMED BUG** | [`src/hooks/usePlan.ts:55-57`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/hooks/usePlan.ts#L55-L57) | String normalization matches, but `usePlan` feeds it static `'b2c'` from localStorage/user_metadata. |
| **5** | Website Subscription Query | **SUSPECTED** | [`src/services/apiService.ts:335-354`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/services/apiService.ts#L335-L354) | Query and timestamp math are sound, but database RLS may be blocking `authenticated` SELECTs. |
| **6** | Stale Caching & Missing Re-sync | **CONFIRMED BUG** | [`src/services/premiumService.ts:206-221`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/services/premiumService.ts#L206-L221) | 5-minute background sync in `premiumService.isPro()` is dead code; React components only call `getCachedPlan()`. |
| **7** | Static Metadata Dependency | **CONFIRMED BUG** | [`src/services/authService.ts:273`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/services/authService.ts#L273), [`SubscriptionPage.tsx:71`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/pages/SubscriptionPage.tsx#L71) | Mobile purchase does not touch `auth.users.raw_user_meta_data`, and web UI never syncs `bse_data` into `usePlan`. |
| **8** | Ground Truth SQL Query | **PENDING USER RUN** | SQL Editor | Query provided to inspect row values and RLS policies on `bse_data.user_subscriptions`. |
