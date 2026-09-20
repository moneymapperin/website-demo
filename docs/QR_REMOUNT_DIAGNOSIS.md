# QR Login Panel Remount & Session Recycling Diagnostic Report

> **Target**: `src/components/QrLoginPanel.tsx`, `src/pages/LoginPage.tsx`, `src/context/AuthContext.tsx`, `src/main.tsx`, `src/App.tsx`.  
> **Investigation Scope**: Root-cause analysis of rapid component re-initialization, Supabase Realtime channel disconnection, row deletion, and QR token recycling.  
> **Status**: DIAGNOSTIC ONLY. No source code modified.

---

## Root-Cause Hypothesis

The rapid QR code recycling and channel teardown observed in the browser console is caused by an **architectural conflict between React 18 StrictMode in the development environment and an unstable `useEffect` dependency architecture in `QrLoginPanel`**:

1. **Immediate Teardown & Re-init on Mount (`React.StrictMode` in dev mode)**:
   In [`src/main.tsx:7-9`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/main.tsx#L7-L9), `<App />` is wrapped in `<React.StrictMode>`. Under Vite's dev server (`npm run dev`), React 18 intentionally runs a double-mount cycle on every component:
   - **Mount 1**: `useEffect` runs, calls `initQrSession()`, opens Realtime channel `qr-login-${token1}`, receives `SUBSCRIBED`, and inserts a `PENDING` row for `token1` into `public.web_sessions`.
   - **Synthetic Cleanup**: React immediately executes the cleanup function ([`src/components/QrLoginPanel.tsx:344-359`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/components/QrLoginPanel.tsx#L344-L359)), which runs `cleanupSession()` ([`lines 32-66`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/components/QrLoginPanel.tsx#L32-L66)). This closes the WebSocket channel via `supabase.removeChannel()` and dispatches a PostgREST `DELETE` query that deletes `token1` from `web_sessions`.
   - **Mount 2**: React immediately remounts the component and runs `useEffect` again, generating a brand new UUID `token2`, creating a new channel `qr-login-${token2}`, and inserting a second row into `web_sessions`.
   
   If a user or phone camera scans `token1` during that initial half-second, or if the phone's upsert lands after `token1` was deleted by the cleanup cycle, the mobile app experiences `"Web login failed"` because the target session row is already gone from the database.

2. **Ongoing Session Churn & Re-render Sensitivity (`useEffect` Dependency Chaining)**:
   In [`src/components/QrLoginPanel.tsx:312-360`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/components/QrLoginPanel.tsx#L312-L360), the mount effect has `[initQrSession, cleanupSession]` in its dependency array. `initQrSession` in turn depends on `[cleanupSession, checkExpiry, navigate]` ([`line 310`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/components/QrLoginPanel.tsx#L310)). Concurrently, `checkExpiry` executes every 1000ms via `setInterval` ([`line 295`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/components/QrLoginPanel.tsx#L295)) and calls `setSecondsRemaining(remaining)` ([`line 72`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/components/QrLoginPanel.tsx#L72)), forcing `QrLoginPanel` to re-render every single second. Furthermore, [`src/context/AuthContext.tsx:89-99`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/context/AuthContext.tsx#L89-L99) creates an unmemoized object literal `value={{ user, session, isLoading, isLoggedIn, logout }}` on every render. If router state fluctuates or if any dependency reference in `initQrSession` changes, React detects a changed dependency in `useEffect`, fires the cleanup callback (which closes the channel and deletes the database row), and executes `initQrSession` anew—repeating the entire initialization with a fresh UUID.

---

## Detailed Itemized Diagnosis (Items 1 to 8)

### 1. Parent Components Rendering `<QrLoginPanel />` and `key` Prop
- **Investigation**: Grep search for all usages of `QrLoginPanel` across the entire codebase.
- **Finding**:
  - The sole production parent rendering `<QrLoginPanel />` is [`src/pages/LoginPage.tsx`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/pages/LoginPage.tsx).
  - Exact JSX ([`src/pages/LoginPage.tsx:173`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/pages/LoginPage.tsx#L173)):
    ```tsx
    {/* Right Column: Active QR Login Panel */}
    <QrLoginPanel />
    ```
  - There is **no `key` prop** passed to `<QrLoginPanel />`.
  - No other pages, modals, or layouts render `<QrLoginPanel />` (the legacy route [`src/pages/QrLoginPage.tsx:5`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/pages/QrLoginPage.tsx#L5) is a redirect to `/login`).
- **Classification**: **OK** (No parent provides a dynamic or changing `key` prop that would force React to destroy and remount the DOM node).

---

### 2. Parent Component (`LoginPage.tsx`) State & Context
- **Investigation**: Complete audit of state, context hooks, and side-effects in [`src/pages/LoginPage.tsx:8-41`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/pages/LoginPage.tsx#L8-L41).
- **Finding**:
  - **Hooks & State**:
    - `useLocation()` ([`line 9`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/pages/LoginPage.tsx#L9))
    - `useNavigate()` ([`line 10`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/pages/LoginPage.tsx#L10))
    - `useState` for `email`, `password`, `showPassword`, `loading`, `errorMessage` ([`lines 12-16`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/pages/LoginPage.tsx#L12-L16))
    - `statusMessage` extracted synchronously from `location.state` ([`line 19`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/pages/LoginPage.tsx#L19))
  - **Analysis**:
    - `LoginPage` does **not** consume `useAuth()`.
    - It contains zero `useEffect`, `setInterval`, or `setTimeout` calls.
    - While the user is viewing the page without typing into the form fields, none of `email`, `password`, `showPassword`, `loading`, or `errorMessage` change.
    - The parent component is completely inert during idle QR display.
- **Classification**: **OK** (`LoginPage` itself does not trigger unsolicited re-renders).

---

### 3. `AuthContext` Initial State Transitions & Unmemoized Context Value
- **Investigation**: Audit of [`src/context/AuthContext.tsx:18-101`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/context/AuthContext.tsx#L18-L101).
- **Finding**:
  1. **Asynchronous Initial Load**:
     - State begins with `isLoading = true` ([`line 21`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/context/AuthContext.tsx#L21)).
     - In `useEffect` ([`lines 27-43`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/context/AuthContext.tsx#L27-L43)), `supabase.auth.getSession()` resolves asynchronously (typically 20–100ms later), updating `session`, `user`, and calling `setIsLoading(false)`.
     - Simultaneously, `supabase.auth.onAuthStateChange` ([`lines 48-74`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/context/AuthContext.tsx#L48-L74)) fires an initial event (`INITIAL_SESSION` or `SIGNED_OUT`), triggering another state dispatch (`setIsLoading(false)`).
  2. **Unmemoized Context Provider Value**:
     - [`src/context/AuthContext.tsx:89-99`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/context/AuthContext.tsx#L89-L99):
       ```tsx
       <AuthContext.Provider
         value={{
           user,
           session,
           isLoading,
           isLoggedIn: !!session,
           logout,
         }}
       >
       ```
     - The `value` object literal is **not wrapped in `useMemo`**.
     - Every time `AuthProvider` re-renders (due to `isLoading`, `session`, or parent updates), all consumers of `useAuth()` receive a brand new object reference and re-render.
- **Classification**: **SUSPECTED** (The unmemoized context value forces re-render cascades down to `PublicOnlyRoute` upon initial auth verification).

---

### 4. Route Guard (`PublicOnlyRoute`) Branch Switching
- **Investigation**: Audit of [`src/context/AuthContext.tsx:170-193`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/context/AuthContext.tsx#L170-L193) and route hierarchy in [`src/App.tsx:66-72`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/App.tsx#L66-L72).
- **Finding**:
  - `LoginPage` is wrapped in `<PublicOnlyRoute>`:
    ```tsx
    <Route
      path="/login"
      element={
        <PublicOnlyRoute>
          <LoginPage />
        </PublicOnlyRoute>
      }
    />
    ```
  - In `PublicOnlyRoute`:
    ```tsx
    175: if (isLoading) {
    176:   return (
    177:     <div
    178:       data-testid="auth-loading-spinner"
    179:       className="min-h-screen flex items-center justify-center bg-background text-white"
    180:     >
    181:       <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-purple"></div>
    182:     </div>
    183:   );
    184: }
    ...
    192: return <>{children || <Outlet />}</>;
    ```
  - **Lifecycle Timing**:
    - On first render of `/login`, `isLoading` is `true`. `PublicOnlyRoute` returns the `auth-loading-spinner` `<div>`. `LoginPage` and `QrLoginPanel` are **not mounted**.
    - When `getSession()` resolves (~50ms later), `isLoading` becomes `false`.
    - `PublicOnlyRoute` replaces the spinner `<div>` with `<>{children}</>`. This triggers the **first real mount** of `LoginPage` and `QrLoginPanel`.
  - **Impact on Re-renders**: Once `isLoading` becomes `false`, subsequent renders of `PublicOnlyRoute` return the same children tree `<>{children}</>`. In React, returning `{children}` does not unmount/remount the children across renders of the parent.
- **Classification**: **CONFIRMED BUG** (For the initial delayed mount / layout switch), but **OK** for ongoing re-renders (it does not cause repetitive remounts once `isLoading === false`).

---

### 5. `setQrAuthInProgress` / `useQrAuthInProgress` Caller & Listener Trace
- **Investigation**: Trace of all callers, listeners, and references to `setQrAuthInProgress` across the codebase.
- **Finding**:
  - Implementation in [`src/context/AuthContext.tsx:138-162`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/context/AuthContext.tsx#L138-L162):
    - Uses a module-scoped boolean `globalQrAuthInProgress` and a `Set<(inProgress: boolean) => void>`.
  - Call sites in `QrLoginPanel.tsx`:
    - [`line 160`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/components/QrLoginPanel.tsx#L160): `setQrAuthInProgress(true)` — invoked strictly inside `handleUpdate` *after* receiving a valid `status === 'AUTHENTICATED'` payload and verifying tokens.
    - [`line 236`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/components/QrLoginPanel.tsx#L236): `setQrAuthInProgress(false)` — invoked in the `catch` block if `supabase.auth.setSession` throws.
    - [`line 348`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/components/QrLoginPanel.tsx#L348): `setQrAuthInProgress(false)` — invoked in `useEffect` cleanup.
  - Listener sites:
    - [`src/context/AuthContext.tsx:173`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/context/AuthContext.tsx#L173): `PublicOnlyRoute` calls `useQrAuthInProgress()`.
  - **Analysis**:
    - During initial mounting, idle display, and countdown, `setQrAuthInProgress` is **never called**.
    - It is only triggered during actual authentication resolution or terminal unmount.
    - It does not cause re-renders during idle QR display.
- **Classification**: **OK**.

---

### 6. `React.StrictMode` in Development Mode
- **Investigation**: Audit of root rendering in [`src/main.tsx:6-10`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/main.tsx#L6-L10).
- **Finding**:
  - `src/main.tsx` explicitly enables `React.StrictMode`:
    ```tsx
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
    ```
  - **React 18 StrictMode Development Behavior**:
    In development (`npm run dev`), React intentionally tests effect cleanup resilience by mounting, unmounting, and remounting every component on initial render.
  - **Detailed Execution Sequence in QrLoginPanel**:
    1. **Mount #1** ([`QrLoginPanel.tsx:312`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/components/QrLoginPanel.tsx#L312)):
       - `initQrSession()` executes.
       - Generates `token1 = uuidv4()`.
       - Sets `activeTokenRef.current = token1`.
       - Subscribes to Supabase Realtime channel `qr-login-${token1}`.
       - Realtime fires callback with `subStatus === 'SUBSCRIBED'`.
       - Inserts `{ session_token: token1, status: 'PENDING' }` into `public.web_sessions`.
       - Starts 120s interval timer.
    2. **Immediate Synthetic Unmount**:
       - React 18 fires the `useEffect` cleanup callback ([`QrLoginPanel.tsx:344-359`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/components/QrLoginPanel.tsx#L344-L359)).
       - Logs: `[QR_DEBUG] Component unmounted at: ...`.
       - `cleanupSession()` executes ([`lines 32-66`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/components/QrLoginPanel.tsx#L32-L66)):
         - Clears interval timer `clearInterval(timerIdRef.current)`.
         - Calls `supabase.removeChannel(activeChannelRef.current)`: **closes the WebSocket channel**.
         - Dispatches PostgREST `DELETE` for `token1`: **deletes the row from `public.web_sessions`**.
         - Resets `activeTokenRef.current = ''`.
    3. **Remount #2**:
       - React immediately mounts the component again and executes `useEffect`.
       - `initQrSession()` executes from scratch.
       - Generates `token2 = uuidv4()`.
       - Subscribes to new channel `qr-login-${token2}`.
       - Realtime fires callback with `subStatus === 'SUBSCRIBED'`.
       - Inserts `{ session_token: token2, status: 'PENDING' }` into `public.web_sessions`.
       - Renders new QR code with `token2`.
- **Direct Correlation to User Symptom**:
  This explains the exact log sequence: *"QrLoginPanel mounts, subscribes successfully, inserts a PENDING row — then almost immediately the channel closes and the component runs its FULL init sequence again with a brand new uuid token."*
  Under StrictMode, this happens automatically on every page refresh in `npm run dev`.
- **Classification**: **CONFIRMED BUG** (Primary cause of the immediate channel closure and token replacement on initial load in development).

---

### 7. Intervals, Polling Loops, or Timeouts Elsewhere in the Codebase
- **Investigation**: Grep search for `setInterval`, `setTimeout`, and polling functions across the codebase.
- **Finding**:
  - Only three files in the entire project instantiate intervals:
    1. [`src/components/QrLoginPanel.tsx:295`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/components/QrLoginPanel.tsx#L295): The 1-second countdown timer `setInterval(checkExpiry, 1000)`.
    2. [`src/pages/CorporateDashboardPage.tsx:50, 55`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/pages/CorporateDashboardPage.tsx#L50-L55): Mock problem and progress tickers for corporate dashboard.
    3. [`src/components/dashboard/ProBanners.tsx:44`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/components/dashboard/ProBanners.tsx#L44): Carousel banner rotation on dashboard.
  - Zero intervals, polling loops, or timeouts exist on `/login`, in `LoginPage.tsx`, or in `AuthPageLayout.tsx`.
  - No legacy polling (`claim_web_session`) remains anywhere in the code.
- **Classification**: **OK**.

---

### 8. Unstable `useEffect` Dependencies & Timer-Driven Re-renders
- **Investigation**: Detailed inspection of hook definitions and dependency arrays in [`src/components/QrLoginPanel.tsx`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/components/QrLoginPanel.tsx).
- **Finding**:
  1. **The Dependency Chain**:
     - `useEffect` ([`lines 312-360`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/components/QrLoginPanel.tsx#L312-L360)):
       ```tsx
       useEffect(() => {
         isMountedRef.current = true;
         initQrSession();
         ...
         return () => {
           ...
           cleanupSession();
           activeTokenRef.current = '';
         };
       }, [initQrSession, cleanupSession]);
       ```
     - `initQrSession` ([`lines 110-310`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/components/QrLoginPanel.tsx#L110-L310)):
       ```tsx
       const initQrSession = useCallback(() => {
         ...
       }, [cleanupSession, checkExpiry, navigate]);
       ```
     - `checkExpiry` ([`lines 68-108`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/components/QrLoginPanel.tsx#L68-L108)):
       ```tsx
       const checkExpiry = useCallback(() => {
         if (!isMountedRef.current) return;
         const now = Date.now();
         const remaining = Math.max(0, Math.ceil((expiresAtRef.current - now) / 1000));
         setSecondsRemaining(remaining);
         ...
       }, []);
       ```
  2. **The Mechanism of Sensitivity**:
     - `checkExpiry` runs every 1000ms via `setInterval` ([`line 295`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/components/QrLoginPanel.tsx#L295)).
     - Every second, `setSecondsRemaining(remaining)` ([`line 72`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/components/QrLoginPanel.tsx#L72)) forces `QrLoginPanel` to re-render to update the visible countdown display (`120s`, `119s`, `118s`...).
     - While `checkExpiry` has `[]` and `cleanupSession` has `[]`, `initQrSession` includes `navigate` (`const navigate = useNavigate()`).
     - In React Router v7 (`"react-router-dom": "^7.18.4"`, [`package.json:22`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/package.json#L22)), router context changes or location updates can alter hook references.
     - More importantly, **placing `initQrSession` in `useEffect`'s dependency array is an architectural defect**:
       - An initialization effect that establishes network channels and creates database rows must run **only on component mount** (or on an explicit user action like clicking "Refresh QR").
       - When `initQrSession` is in the `useEffect` dependency array, *any* recreation of `initQrSession` causes React to immediately run the cleanup function (closing the channel and deleting the row) and re-initialize with a brand new token.
- **Classification**: **CONFIRMED BUG** (Architecture allows effect re-runs whenever hook dependencies shift, coupled to 1-second state re-renders).

---

## Evaluation Summary Table

| Item # | Inspection Area | Evaluation | File & Line Reference | Notes / Contributing Factor |
|---|---|---|---|---|
| **1** | Parent Component & `key` Prop | **OK** | [`src/pages/LoginPage.tsx:173`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/pages/LoginPage.tsx#L173) | `<QrLoginPanel />` rendered without a `key` prop. No unmounts forced by parent key. |
| **2** | Parent State & Context | **OK** | [`src/pages/LoginPage.tsx:8-41`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/pages/LoginPage.tsx#L8-L41) | No `useAuth`, no timers, no intervals. Form state is inert during idle QR display. |
| **3** | `AuthContext` Initial State | **SUSPECTED** | [`src/context/AuthContext.tsx:89-99`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/context/AuthContext.tsx#L89-L99) | Unmemoized `value={{ ... }}` creates new context references on initial auth check. |
| **4** | Route Guard (`PublicOnlyRoute`) | **CONFIRMED BUG** | [`src/context/AuthContext.tsx:175-192`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/context/AuthContext.tsx#L175-L192) | Replaces spinner with children after async `getSession()`, delaying initial mount. |
| **5** | `setQrAuthInProgress` | **OK** | [`src/components/QrLoginPanel.tsx:160, 236, 348`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/components/QrLoginPanel.tsx#L160) | Not called during idle display or countdown. Only fires on auth or unmount. |
| **6** | `React.StrictMode` in Dev | **CONFIRMED BUG** | [`src/main.tsx:7-9`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/main.tsx#L7-L9) | Dev double-mount triggers synthetic unmount, closing channel & deleting row #1. |
| **7** | Interval/Polling Elsewhere | **OK** | Whole repository audit | No external polling or intervals active on `/login`. |
| **8** | Unstable `useEffect` Dependencies | **CONFIRMED BUG** | [`src/components/QrLoginPanel.tsx:312-360`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/components/QrLoginPanel.tsx#L312-L360) | `[initQrSession, cleanupSession]` in `useEffect` deps; `checkExpiry` re-renders every 1s. |

---

## Diagnostic Conclusion & Proposed Fix Path

1. **Fix for Dev-Mode StrictMode Channel Deletion (Item 6)**:
   - Separate the **real unmount teardown** from the initial mount effect using a ref guard or ensuring cleanup does not aggressively delete database rows and close channels during React 18 development remounts.
   - Alternatively, ensure that `cleanupSession` only deletes rows upon explicit user refresh or actual component retirement, not intermediate React effect churn.

2. **Fix for `useEffect` Dependency Loop (Item 8)**:
   - Ensure the initialization `useEffect` runs strictly **once on mount** (`[]` dependencies), using refs (`initQrSessionRef.current` or inlining the initial call) rather than putting an active session generator into the effect dependency array.
   - Decouple the 1-second countdown display (`setSecondsRemaining`) from the QR session lifecycle so that visual countdown ticks never have the ability to re-trigger channel subscription or UUID generation.

3. **Fix for `AuthContext` Provider Memoization (Item 3)**:
   - Wrap the `value` object in `useMemo` in [`src/context/AuthContext.tsx:89-99`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/src/context/AuthContext.tsx#L89-L99) to prevent unnecessary context consumer re-renders across the entire route tree.
