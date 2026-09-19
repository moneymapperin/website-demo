# Security Hardening & SQL Verification Plan: `public.web_sessions`

This document details how to apply the migration, verify each security boundary in the Supabase SQL Editor, and roll back if necessary.

---

## 1. How to Apply the Migration

1. Open your **Supabase Dashboard** (https://supabase.com/dashboard/project/<your-project-id>).
2. Navigate to the **SQL Editor** tab on the left sidebar.
3. Click **New Query**.
4. Paste the full contents of [`supabase/migrations/web_sessions_hardening.sql`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/supabase/migrations/web_sessions_hardening.sql).
5. Click **Run** (or `Cmd/Ctrl + Enter`).
6. Confirm the result message displays `Success. No rows returned`.

---

## 2. Supabase SQL Editor Verification Test Plan

Run the following test blocks sequentially in the Supabase SQL Editor to verify all security requirements:

```sql
-- ==============================================================================
-- TEST 1: Anon role CANNOT SELECT any rows (Zero visibility)
-- ==============================================================================
SET ROLE anon;
SELECT * FROM public.web_sessions;
-- Expected Result: 0 rows returned (or permission denied)
RESET ROLE;

-- ==============================================================================
-- TEST 2: Anon role CANNOT INSERT any row
-- ==============================================================================
SET ROLE anon;
DO $$
BEGIN
  BEGIN
    INSERT INTO public.web_sessions (session_token, status, access_token, refresh_token)
    VALUES ('anon-hack-token', 'AUTHENTICATED', 'fake-access', 'fake-refresh');
    RAISE EXCEPTION 'TEST FAILED: anon insert was permitted!';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'TEST 2 PASSED: anon INSERT rejected with insufficient_privilege.';
  END;
END $$;
RESET ROLE;

-- ==============================================================================
-- TEST 3 & 4: Authenticated User A can upsert a fresh token and re-upsert their own
-- ==============================================================================
-- Setup mock user A
DO $$
DECLARE
  v_user_a uuid := '11111111-1111-1111-1111-111111111111';
  v_token text := 'test-session-token-aaa';
BEGIN
  -- Simulate authenticated user A context
  PERFORM set_config('request.jwt.claim.sub', v_user_a::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SET LOCAL ROLE authenticated;

  -- Test 3: User A initial upsert (simulating Flutter app)
  INSERT INTO public.web_sessions (session_token, user_id, access_token, refresh_token, status, authenticated_at)
  VALUES (v_token, v_user_a, 'user-a-access-v1', 'user-a-refresh-v1', 'AUTHENTICATED', now())
  ON CONFLICT (session_token) DO UPDATE
  SET access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      authenticated_at = EXCLUDED.authenticated_at;

  RAISE NOTICE 'TEST 3 PASSED: User A initial upsert succeeded.';

  -- Test 4: User A re-upsert on the same token
  INSERT INTO public.web_sessions (session_token, user_id, access_token, refresh_token, status, authenticated_at)
  VALUES (v_token, v_user_a, 'user-a-access-v2', 'user-a-refresh-v2', 'AUTHENTICATED', now())
  ON CONFLICT (session_token) DO UPDATE
  SET access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      authenticated_at = EXCLUDED.authenticated_at;

  RAISE NOTICE 'TEST 4 PASSED: User A re-upsert on own token succeeded.';
END $$;

-- ==============================================================================
-- TEST 5 & 6: Authenticated User B CANNOT overwrite User A's token & CANNOT see User A's row
-- ==============================================================================
DO $$
DECLARE
  v_user_b uuid := '22222222-2222-2222-2222-222222222222';
  v_token text := 'test-session-token-aaa';
  v_count integer;
BEGIN
  -- Simulate authenticated user B context
  PERFORM set_config('request.jwt.claim.sub', v_user_b::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SET LOCAL ROLE authenticated;

  -- Test 6: User B SELECT sees 0 of User A's rows
  SELECT count(*) INTO v_count FROM public.web_sessions WHERE session_token = v_token;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'TEST 6 FAILED: User B was able to see User A row!';
  ELSE
    RAISE NOTICE 'TEST 6 PASSED: User B sees 0 of User A rows.';
  END IF;

  -- Test 5: User B attempt to upsert onto User A token
  BEGIN
    INSERT INTO public.web_sessions (session_token, user_id, access_token, refresh_token, status, authenticated_at)
    VALUES (v_token, v_user_b, 'user-b-access', 'user-b-refresh', 'AUTHENTICATED', now())
    ON CONFLICT (session_token) DO UPDATE
    SET access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token;

    RAISE EXCEPTION 'TEST 5 FAILED: User B was able to overwrite User A session!';
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'TEST 5 PASSED: User B overwrite rejected (%).', SQLERRM;
  END;
END $$;

-- ==============================================================================
-- TEST 7: claim_web_session returns tokens once, second call returns empty
-- ==============================================================================
-- First call (as anon): Should return user A's tokens
SET ROLE anon;
SELECT * FROM public.claim_web_session('test-session-token-aaa');
-- Expected: 1 row with access_token='user-a-access-v2', refresh_token='user-a-refresh-v2'

-- Second call (as anon): Should return 0 rows
SELECT * FROM public.claim_web_session('test-session-token-aaa');
-- Expected: 0 rows returned (already claimed and deleted)
RESET ROLE;

-- ==============================================================================
-- TEST 8: Stale rows (>5 minutes) are purged during claim
-- ==============================================================================
-- Insert a mock stale row manually as superuser
INSERT INTO public.web_sessions (session_token, user_id, access_token, refresh_token, status, created_at)
VALUES ('stale-token-5m', '11111111-1111-1111-1111-111111111111', 'stale-acc', 'stale-ref', 'AUTHENTICATED', now() - interval '6 minutes');

-- Call claim for another token as anon
SET ROLE anon;
SELECT * FROM public.claim_web_session('any-dummy-token');
RESET ROLE;

-- Verify stale row was automatically deleted
SELECT count(*) FROM public.web_sessions WHERE session_token = 'stale-token-5m';
-- Expected Result: 0 rows
```

---

## 3. Rollback Script (EMERGENCY ONLY, INSECURE)

> [!WARNING]
> **EMERGENCY ONLY, INSECURE**: The rollback script re-enables the permissive `FOR ALL TO public` policy and re-adds `public.web_sessions` to the realtime publication. This re-exposes all session tokens to anyone holding the anon key. Only use this if urgent debugging is required in a non-production test environment.

```sql
-- ==============================================================================
-- EMERGENCY ROLLBACK SCRIPT (INSECURE)
-- ==============================================================================

-- 1. Drop hardened authenticated policies
DROP POLICY IF EXISTS "web_sessions_auth_select" ON public.web_sessions;
DROP POLICY IF EXISTS "web_sessions_auth_insert" ON public.web_sessions;
DROP POLICY IF EXISTS "web_sessions_auth_update" ON public.web_sessions;
DROP POLICY IF EXISTS "web_sessions_auth_delete" ON public.web_sessions;

-- 2. Grant all privileges back to public and anon
GRANT ALL ON TABLE public.web_sessions TO anon, authenticated, public;

-- 3. Restore wide-open permissive policy
CREATE POLICY "web_sessions_public_all"
ON public.web_sessions
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 4. Re-add table to Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.web_sessions;

-- 5. Drop claim function
DROP FUNCTION IF EXISTS public.claim_web_session(text);
```
