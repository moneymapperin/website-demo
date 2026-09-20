# QR Login Flow Diagnostic Report

> **Investigation Scope**: Web QR Login flow vs. Flutter mobile app (`reference/moneymapper_app/lib/screens/qr_scanner_screen.dart`, `api_service.dart`) and Supabase `public.web_sessions`.  
> **Status**: DIAGNOSTIC ONLY. No source code or database migrations modified.

---

## Executive Summary

The website's QR login is broken due to a fundamental architectural mismatch introduced in the web app:
1. **The Mobile App Contract (Unchanged)**: The Flutter app scans the QR token and executes `_supabase.from('web_sessions').upsert(...)` with `status: 'AUTHENTICATED'`, expecting the web client to be listening via **Supabase Realtime (`postgres_changes`)** on `public.web_sessions`.
2. **The Current Web Implementation (`src/components/QrLoginPanel.tsx`)**: The Realtime subscription and initial `PENDING` row insertion were **completely removed**. Instead, the web code polls a custom PostgreSQL RPC function `claim_web_session(p_token)` every 2 seconds. Because the backend is unchanged and does not have this RPC function, the polling fails or returns empty, and the mobile app's Realtime `UPDATE` is never received.
3. **The Standalone Route (`src/pages/QrLoginPage.tsx`)**: In commit `431efee`, `QrLoginPage.tsx` was gutted into a redirect to `/login` (`<Navigate to="/login" replace />`), while the previous commit (`5398be3`) had its own isolated Supabase client with hardcoded credentials and race conditions.

---

## Detailed Investigation (Items 1 to 8)

### 1. Supabase Client Initialization
- **Question**: Does `src/pages/QrLoginPage.tsx` (or wherever QR login lives now) create its OWN Supabase client with a hardcoded/placeholder `SUPABASE_ANON_KEY`, instead of using `src/lib/supabase.ts`?
- **Finding**:
  - **In Current `src/pages/QrLoginPage.tsx`** ([`src/pages/QrLoginPage.tsx:1-12`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/pages/QrLoginPage.tsx#L1-L12)):
    `QrLoginPage.tsx` no longer initializes any client; it simply redirects:
    ```tsx
    export const QrLoginPage: React.FC = () => {
      return <Navigate to="/login" replace />;
    };
    ```
  - **In Original `src/pages/QrLoginPage.tsx` (Git History - commit `0dfd6e8` / `d62b836` / `5398be3`)**:
    Commit `0dfd6e8` initialized its own client with placeholder `'YOUR_SUPABASE_ANON_KEY'`:
    ```tsx
    // Lines 17-21 in commit 0dfd6e8
    const supabase = createClient(
      'https://upxsmlmsqxcwknvtywgk.supabase.co',
      'YOUR_SUPABASE_ANON_KEY'
    );
    ```
    Commit `d62b836` added `/rest/v1/` to the base URL and hardcoded the JWT anon key:
    ```tsx
    // Lines 17-21 in commit d62b836
    const supabase = createClient(
      'https://upxsmlmsqxcwknvtywgk.supabase.co/rest/v1/',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    );
    ```
    Commit `5398be3` created its own separate client instance with fallback hardcoded credentials rather than importing `src/lib/supabase.ts`:
    ```tsx
    // Lines 17-24 in commit 5398be3
    const SUPABASE_URL =
      import.meta.env.VITE_SUPABASE_URL || 'https://upxsmlmsqxcwknvtywgk.supabase.co';
    const SUPABASE_ANON_KEY =
      import.meta.env.VITE_SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    ```
  - **In Current `src/components/QrLoginPanel.tsx`** ([`src/components/QrLoginPanel.tsx:6`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/components/QrLoginPanel.tsx#L6)):
    Uses the shared singleton client from `src/lib/supabase.ts`:
    ```tsx
    import { supabase } from '../lib/supabase';
    ```
- **Classification**:
  - **CONFIRMED BUG** in original `QrLoginPage.tsx` (created duplicate client with hardcoded credentials and malformed `/rest/v1/` URL).
  - **OK** in current `QrLoginPanel.tsx` (imports `supabase` from `../lib/supabase`).

---

### 2. Order of Operations: Channel Subscribe vs. Row Insert
- **Question**: Does the code call `supabase.channel(...).subscribe()` BEFORE or AFTER the `.insert()` of the PENDING row?
- **Finding**:
  - **In Original `QrLoginPage.tsx` (commit `0dfd6e8` / `5398be3`)**:
    Lines 34-42 called `initSession()` (`.insert()`) **before** `channel.subscribe()`:
    ```tsx
    // 2. Insert initial pending session record in Supabase
    const initSession = async () => {
      await supabase.from('web_sessions').insert({
        session_token: token,
        status: 'PENDING',
      });
      setLoading(false);
    };

    initSession(); // <--- Fired first, unawaited

    // 3. Listen via Supabase Realtime for mobile app's scan event
    const channel: RealtimeChannel = supabase
      .channel(`qr-login-${token}`)
      .on('postgres_changes', { ... }, ...)
      .subscribe(); // <--- Subscribed AFTER insert initiated
    ```
    Because `initSession()` is initiated before the WebSocket channel connection handshake completes (`.subscribe()` is asynchronous), there is a severe race condition: if a mobile user scans immediately upon QR display, the mobile app writes `AUTHENTICATED` before the web client finishes subscribing, causing the `UPDATE` event to be missed.
  - **In Current `src/components/QrLoginPanel.tsx`**:
    Neither `.insert()` nor `.subscribe()` exists! The code completely skips inserting `status: 'PENDING'` and skips subscribing to Realtime channels.
- **Classification**:
  - **CONFIRMED BUG**: Insert was executed before subscription was established in `QrLoginPage.tsx`, creating an unhandled race window.
  - **CONFIRMED BUG**: In current `QrLoginPanel.tsx`, Realtime subscription and pending row creation are entirely omitted.

---

### 3. QR Code `value` Prop Format
- **Question**: Confirm the QR code's `value` prop is the RAW `session_token` UUID string only — no JSON wrapping, no prefix/URL — matching what the Flutter scanner's `barcode.rawValue` expects.
- **Finding**:
  - **Flutter Scanner Expectation** ([`reference/moneymapper_app/lib/screens/qr_scanner_screen.dart:46-49`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/reference/moneymapper_app/lib/screens/qr_scanner_screen.dart#L46-L49)):
    ```dart
    final String? code = barcode.rawValue;
    if (code != null) {
      _handleScan(code); // Passes raw string directly to _api.loginWithQr(token)
    }
    ```
    Flutter expects the raw `session_token` string.
  - **Web QR Value** ([`src/components/QrLoginPanel.tsx:192-201`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/components/QrLoginPanel.tsx#L192-L201)):
    ```tsx
    <QRCodeSVG
      data-testid="qr-code-svg"
      data-token={sessionToken}
      value={sessionToken}
      size={184}
      level="M"
      includeMargin={false}
    />
    ```
    `sessionToken` is initialized via `const newToken = uuidv4()` ([`line 40`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/components/QrLoginPanel.tsx#L40)). It is a raw standard UUID string with no JSON formatting, no prefix (`moneymapper://`), and no URL wrapping.
- **Classification**: **OK** (Matches Flutter scanner expectation).

---

### 4. Realtime Filter & Table Specification
- **Question**: Confirm the realtime filter is exactly `session_token=eq.${token}` and table/schema is `public.web_sessions` (not core/bse_data).
- **Finding**:
  - **In Original `QrLoginPage.tsx` (commit `0dfd6e8` / `5398be3`)**:
    Lines 48-53:
    ```tsx
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'web_sessions',
        filter: `session_token=eq.${token}`,
      },
      async (payload) => { ... }
    )
    ```
    The filter parameters (`schema: 'public'`, `table: 'web_sessions'`, `filter: session_token=eq.${token}`) were syntactically correct.
  - **In Current Web Code (`src/components/QrLoginPanel.tsx`)**:
    Realtime is **completely absent**. Lines 62-64 show:
    ```tsx
    const { data, error } = await supabase.rpc('claim_web_session', {
      p_token: newToken,
    });
    ```
- **Classification**:
  - **OK** in original guide specification.
  - **CONFIRMED BUG** in current codebase: Realtime filter and listener are completely missing.

---

### 5. Environment Variables & Build Inlining
- **Question**: Are `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` actually set and being read? Log what `import.meta.env` resolves to in a build.
- **Finding**:
  - Local `.env` contains:
    ```env
    VITE_SUPABASE_URL=https://upxsmlmsqxcwknvtywgk.supabase.co
    VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVweHNtbG1zcXhjd2tudnR5d2drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNjc3OTQsImV4cCI6MjA5NDc0Mzc5NH0.WTim-6TNx9l8TSmKJKf5xZVN1ZAy3uMKPUyi1otCblk
    ```
  - In Vite production bundle (`dist/assets/index-B86o7GZ4.js`), `getSupabaseEnv()` compiles into:
    ```javascript
    return {
      url: "https://upxsmlmsqxcwknvtywgk.supabase.co",
      anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVweHNtbG1zcXhjd2tudnR5d2drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNjc3OTQsImV4cCI6MjA5NDc0Mzc5NH0.WTim-6TNx9l8TSmKJKf5xZVN1ZAy3uMKPUyi1otCblk"
    };
    ```
  - **Cloudflare Build Risk**: `.env` is gitignored. In `wrangler.jsonc`, no build environment variables are defined. If deployed on Cloudflare Pages without configuring `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Cloudflare Pages Settings → Environment Variables, `src/lib/supabase.ts:11-15` throws an Uncaught Error on app launch, resulting in a blank screen.
- **Classification**:
  - Local Build: **OK**.
  - Production Deployment (Cloudflare Pages): **SUSPECTED** if environment variables are not configured in the Cloudflare dashboard.

---

### 6. Browser Console Error Patterns
- **Question**: Check browser console error patterns to anticipate: CORS, RLS 401/403 on insert, WebSocket connection failures, CSP blocking Supabase realtime websocket.
- **Finding**:
  1. **RPC 404 / 400 (`claim_web_session`)**:
     - Current `QrLoginPanel.tsx` logs repeated failed RPC attempts:
       `POST https://upxsmlmsqxcwknvtywgk.supabase.co/rest/v1/rpc/claim_web_session 404 (Not Found)` or `400 (Bad Request: Could not find function public.claim_web_session(p_token) in schema cache)`.
  2. **RLS 401 / 403 on `.insert()`**:
     - In Realtime mode, the web user is unauthenticated (`anon` role). If `public.web_sessions` does not have an RLS policy granting `anon` INSERT permissions (`WITH CHECK (status = 'PENDING')`), the browser console displays:
       `POST https://upxsmlmsqxcwknvtywgk.supabase.co/rest/v1/web_sessions 403 (Forbidden: new row violates row-level security policy for table "web_sessions")`.
  3. **Realtime Silent Event Dropping (RLS on SELECT)**:
     - Supabase Realtime evaluates Row Level Security for postgres_changes. If `anon` role does not have `SELECT` permission on `public.web_sessions`, Supabase Realtime connects successfully over WebSocket, but **silently drops the `UPDATE` event**, never delivering it to the client.
  4. **Table Not in Realtime Publication**:
     - If `public.web_sessions` is missing from `supabase_realtime` publication (`ALTER PUBLICATION supabase_realtime ADD TABLE public.web_sessions;`), postgres change events are not published to the WebSocket server.
  5. **CORS / CSP**:
     - **OK**: No CSP restrictions in `index.html`. Supabase REST endpoints support CORS for the configured domain.
- **Classification**: **CONFIRMED BUG** (RPC function missing on unchanged backend; RLS on `web_sessions` must permit anon INSERT/SELECT if Realtime is used).

---

### 7. `setSession()` Arguments & Navigation Race Condition
- **Question**: Confirm `setSession()` receives `access_token`/`refresh_token` as separate named args (not swapped) and that navigation after `setSession` isn't firing before the session is actually persisted.
- **Finding**:
  - **Argument Names & Ordering**:
    In both original `QrLoginPage.tsx` ([commit `0dfd6e8`]) and `QrLoginPanel.tsx` ([`src/components/QrLoginPanel.tsx:86-89`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/components/QrLoginPanel.tsx#L86-L89)):
    ```tsx
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: sessionRow.access_token,
      refresh_token: sessionRow.refresh_token,
    });
    ```
    Parameters are correctly named `access_token` and `refresh_token` (matching Supabase JS v2). They are not swapped.
  - **Navigation Race in Original `QrLoginPage.tsx`**:
    Lines 69-76 of commit `0dfd6e8`:
    ```tsx
    await supabase.auth.setSession({ ... });
    await supabase.from('web_sessions').delete().eq('session_token', token);
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 800);
    ```
    Using `window.location.href = '/dashboard'` causes a hard page reload, bypassing React Router, and hardcodes `/dashboard` (ignoring whether the user is a corporate admin).
  - **Navigation in Current `QrLoginPanel.tsx`**:
    Lines 86-110 await `supabase.auth.setSession(...)`, inspect `sessionData.session`, check corporate admin status via `apiService.getCorporateAdmin(userEmail)`, and navigate using `navigate(isCorporate ? '/corporate-dashboard' : '/dashboard', { replace: true })`.
- **Classification**:
  - Token arguments: **OK**.
  - Navigation implementation in original guide: **CONFIRMED BUG** (`window.location.href` bypasses router and ignores corporate routing).

---

### 8. Other Divergences Against Mobile Integration Guide
- **Question**: List any other divergence between current code and the integration guide.
- **Finding**:
  1. **Realtime WebSocket vs. Polling Divergence (Critical)**:
     - **Guide**: Web app subscribes to Supabase Realtime channel `qr-login-${token}` listening for `UPDATE` events on `public.web_sessions`.
     - **Current Code**: Realtime is completely removed; relies on `claim_web_session` RPC polling.
  2. **Pending Row Initialization Omission**:
     - **Guide**: Web app inserts `{ session_token: token, status: 'PENDING' }` on mount.
     - **Current Code**: Never inserts a row in `web_sessions`.
  3. **Route Replacement**:
     - **Guide**: Web app exposes a dedicated `/qr-login` page (`QrLoginPage.tsx`).
     - **Current Code**: `/qr-login` redirects to `/login` (`<Navigate to="/login" replace />`), rendering as an embedded right-hand panel (`QrLoginPanel.tsx`).
  4. **Row Cleanup**:
     - **Guide**: Web app calls `await supabase.from('web_sessions').delete().eq('session_token', token)` after setting session.
     - **Current Code**: Does not call `.delete()`, assuming RPC handled it.
  5. **Session Expiry & Refresh UI**:
     - **Guide**: Basic QR display with no timeout or refresh controls.
     - **Current Code**: Added a 120-second countdown with automatic expiration overlay and refresh button.

---

## Summary of Diagnostic Statuses

| # | Item | Status | Key Code Location |
|---|---|---|---|
| 1 | Supabase Client Init | **CONFIRMED BUG** (Original `QrLoginPage.tsx`) / **OK** (`QrLoginPanel.tsx`) | `src/pages/QrLoginPage.tsx` (commit `5398be3:18-25`), `src/components/QrLoginPanel.tsx:6` |
| 2 | Order of Operations (Subscribe vs. Insert) | **CONFIRMED BUG** | `src/pages/QrLoginPage.tsx` (commit `5398be3:42,80`), `src/components/QrLoginPanel.tsx:50-120` |
| 3 | QR Code `value` Prop Format | **OK** | `src/components/QrLoginPanel.tsx:195` |
| 4 | Realtime Filter & Table Contract | **CONFIRMED BUG** | Realtime completely omitted in `src/components/QrLoginPanel.tsx` |
| 5 | Environment Variables & Inlining | **OK** (Local) / **SUSPECTED** (Cloudflare Pages CI) | `src/lib/supabase.ts:8-15`, `.env:1-2`, `dist/assets/index-B86o7GZ4.js` |
| 6 | Console Errors (RPC 404 / RLS 403) | **CONFIRMED BUG** | Backend lacks `claim_web_session` RPC; `public.web_sessions` RLS policies |
| 7 | `setSession()` Arguments & Navigation | **OK** (Args) / **CONFIRMED BUG** (Original navigation) | `src/components/QrLoginPanel.tsx:86-110`, `src/pages/QrLoginPage.tsx` (commit `5398be3:72`) |
| 8 | Protocol Divergences vs. Guide | **CONFIRMED BUG** | Realtime vs. polling mismatch, missing `PENDING` insert, missing `.delete()` cleanup |
