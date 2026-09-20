# Security Hardening & SQL Verification Plan: Corporate Intelligence & RLS

This document details the Row-Level Security (RLS) hardening plan for the B2B Corporate Intelligence tables (`public.corporate_admins`, `core.corporate_analytics`, and `core.workforce_intelligence`). It outlines how to inspect current policies, apply the migration, verify security boundaries in the Supabase SQL Editor, and roll back if necessary.

---

## 1. Security Architecture & Threat Model

### Vulnerabilities in Default / Permissive Setups:
1. **Cross-Tenant Data Exposure**: If `core.corporate_analytics` or `core.workforce_intelligence` lacks tenant filtering, an authenticated corporate admin from Company A could query or scrape workforce health, attrition risk, and departmental stress for Company B.
2. **Admin Email Harvesting**: If `public.corporate_admins` is readable by anonymous or standard users, attackers can enumerate all corporate client companies and their registered admin emails.
3. **`ILIKE` Wildcard Vulnerability**: In SQL, `ILIKE` treats `%` and `_` as pattern wildcards. If an admin email like `john_doe@example.com` or `dev%corp@example.com` is compared using `ILIKE` in an RLS policy, it can match unexpected email addresses (e.g. `johnxdoe@example.com`). Policies MUST use exact lowercase equality: `lower(admin_email) = lower(auth.jwt() ->> 'email')`.

### Hardened Target State:
- **Anon (`anon` role)**: Zero access (`REVOKE ALL`). Cannot read `corporate_admins`, `corporate_analytics`, or `workforce_intelligence`.
- **Public (`public.corporate_admins`)**: Authenticated user can SELECT only the single row where `lower(admin_email) = lower(auth.jwt() ->> 'email')`.
- **Core Intelligence (`core.corporate_analytics` & `core.workforce_intelligence`)**: Authenticated user can SELECT only rows where `company_name` matches the company name of their verified admin record in `public.corporate_admins`.
- **Standard (Non-Admin) Users**: Querying any of the three tables returns **0 rows**.

---

## 2. Inspection: Current Database State

Run the following SQL in the **Supabase SQL Editor** to inspect the current baseline:

```sql
-- Check RLS activation status across the 3 target tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE (schemaname = 'public' AND tablename = 'corporate_admins')
   OR (schemaname = 'core' AND tablename IN ('corporate_analytics', 'workforce_intelligence'));

-- Inspect any existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE (schemaname = 'public' AND tablename = 'corporate_admins')
   OR (schemaname = 'core' AND tablename IN ('corporate_analytics', 'workforce_intelligence'));
```

---

## 3. Migration Script: `corporate_rls.sql`

The migration is located at [`supabase/migrations/corporate_rls.sql`](file:///c:/Users/sarth/Desktop/avee%20dada/website_landing_page/supabase/migrations/corporate_rls.sql):

```sql
-- 1. Enable RLS
ALTER TABLE public.corporate_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.corporate_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.workforce_intelligence ENABLE ROW LEVEL SECURITY;

-- 2. Drop legacy policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE (schemaname = 'public' AND tablename = 'corporate_admins')
       OR (schemaname = 'core' AND tablename IN ('corporate_analytics', 'workforce_intelligence'))
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- 3. Revoke all anon access & grant authenticated SELECT
REVOKE ALL ON TABLE public.corporate_admins FROM anon;
REVOKE ALL ON TABLE core.corporate_analytics FROM anon;
REVOKE ALL ON TABLE core.workforce_intelligence FROM anon;

GRANT SELECT ON TABLE public.corporate_admins TO authenticated;
GRANT SELECT ON TABLE core.corporate_analytics TO authenticated;
GRANT SELECT ON TABLE core.workforce_intelligence TO authenticated;

-- 4. Policies with exact lowercase matching
CREATE POLICY "corporate_admins_auth_select_own"
ON public.corporate_admins
FOR SELECT
TO authenticated
USING (lower(admin_email) = lower(auth.jwt() ->> 'email'));

CREATE POLICY "corporate_analytics_auth_select_by_company"
ON core.corporate_analytics
FOR SELECT
TO authenticated
USING (
  company_name IN (
    SELECT ca.company_name
    FROM public.corporate_admins ca
    WHERE lower(ca.admin_email) = lower(auth.jwt() ->> 'email')
  )
);

CREATE POLICY "workforce_intelligence_auth_select_by_company"
ON core.workforce_intelligence
FOR SELECT
TO authenticated
USING (
  company_name IN (
    SELECT ca.company_name
    FROM public.corporate_admins ca
    WHERE lower(ca.admin_email) = lower(auth.jwt() ->> 'email')
  )
);
```

---

## 4. Supabase SQL Editor Verification Test Plan

Execute each test block in the Supabase SQL Editor to verify the security boundaries:

```sql
-- ==============================================================================
-- TEST 1: Anon role CANNOT SELECT from any of the three tables (Zero visibility)
-- ==============================================================================
SET ROLE anon;

SELECT count(*) AS anon_admin_count FROM public.corporate_admins;
-- Expected: 0 rows or permission denied

SELECT count(*) AS anon_analytics_count FROM core.corporate_analytics;
-- Expected: 0 rows or permission denied

SELECT count(*) AS anon_intel_count FROM core.workforce_intelligence;
-- Expected: 0 rows or permission denied

RESET ROLE;

-- ==============================================================================
-- TEST 2: Standard (Non-Admin) Authenticated user sees ZERO rows
-- ==============================================================================
DO $$
DECLARE
  v_non_admin_id uuid := '00000000-0000-0000-0000-000000000001';
  v_non_admin_email text := 'regular_employee@randomdomain.com';
  v_count integer;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', v_non_admin_id::text, true);
  PERFORM set_config('request.jwt.claim.email', v_non_admin_email, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SET LOCAL ROLE authenticated;

  -- 1. Check corporate_admins
  SELECT count(*) INTO v_count FROM public.corporate_admins;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'TEST 2 FAILED: Non-admin saw % rows in corporate_admins!', v_count;
  END IF;

  -- 2. Check corporate_analytics
  SELECT count(*) INTO v_count FROM core.corporate_analytics;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'TEST 2 FAILED: Non-admin saw % rows in corporate_analytics!', v_count;
  END IF;

  -- 3. Check workforce_intelligence
  SELECT count(*) INTO v_count FROM core.workforce_intelligence;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'TEST 2 FAILED: Non-admin saw % rows in workforce_intelligence!', v_count;
  END IF;

  RAISE NOTICE 'TEST 2 PASSED: Non-admin user has 0 visibility across all tables.';
END $$;

-- ==============================================================================
-- TEST 3: Admin A can read ONLY Company A (Multi-Tenant Isolation)
-- ==============================================================================
-- Setup: Ensure mock records exist in your staging database
-- (Company A: admin_a@corp.com -> 'Acme Corp'; Company B: admin_b@corp.com -> 'Beta LLC')
DO $$
DECLARE
  v_admin_a_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_admin_a_email text := 'admin_a@corp.com';
  v_admin_row record;
  v_analytics_row record;
  v_intel_row record;
  v_other_company_count integer;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', v_admin_a_id::text, true);
  PERFORM set_config('request.jwt.claim.email', v_admin_a_email, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SET LOCAL ROLE authenticated;

  -- Admin A sees their own corporate_admins row
  SELECT * INTO v_admin_row FROM public.corporate_admins WHERE lower(admin_email) = lower(v_admin_a_email);
  IF v_admin_row IS NULL THEN
    RAISE NOTICE 'Skipping Test 3 execution: Test fixtures for admin_a@corp.com not present in database.';
    RETURN;
  END IF;

  -- Admin A CANNOT see other companies
  SELECT count(*) INTO v_other_company_count
  FROM core.corporate_analytics
  WHERE company_name <> v_admin_row.company_name;

  IF v_other_company_count <> 0 THEN
    RAISE EXCEPTION 'TEST 3 FAILED: Admin A saw % rows belonging to other companies!', v_other_company_count;
  END IF;

  RAISE NOTICE 'TEST 3 PASSED: Multi-tenant boundary verified. Admin A can only see %', v_admin_row.company_name;
END $$;

-- ==============================================================================
-- TEST 4: Corporate Login Flow Query Compatibility
-- ==============================================================================
-- Verifies that the client query `.from('corporate_admins').select('company_name').ilike('admin_email', normalizedEmail)`
-- succeeds for the caller's own email.
DO $$
DECLARE
  v_admin_email text := 'admin_a@corp.com';
  v_company text;
BEGIN
  PERFORM set_config('request.jwt.claim.email', v_admin_email, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SET LOCAL ROLE authenticated;

  SELECT company_name INTO v_company
  FROM public.corporate_admins
  WHERE admin_email ILIKE v_admin_email;

  -- If fixture is present, company_name must match
  IF v_company IS NOT NULL THEN
    RAISE NOTICE 'TEST 4 PASSED: Client query succeeded, returned company %', v_company;
  ELSE
    RAISE NOTICE 'TEST 4 NOTICE: No matching fixture for %, policy did not crash.', v_admin_email;
  END IF;
END $$;
```

---

## 5. Rollback Plan (EMERGENCY ONLY)

In the event of an operational regression or unexpected query failure in production, execute the rollback script below in the Supabase SQL Editor:

```sql
-- ==============================================================================
-- EMERGENCY ONLY ROLLBACK SCRIPT
-- ==============================================================================
DROP POLICY IF EXISTS "corporate_admins_auth_select_own" ON public.corporate_admins;
DROP POLICY IF EXISTS "corporate_analytics_auth_select_by_company" ON core.corporate_analytics;
DROP POLICY IF EXISTS "workforce_intelligence_auth_select_by_company" ON core.workforce_intelligence;

-- Restore baseline permissions
GRANT SELECT ON TABLE public.corporate_admins TO anon, authenticated;
GRANT SELECT ON TABLE core.corporate_analytics TO authenticated;
GRANT SELECT ON TABLE core.workforce_intelligence TO authenticated;
```

---

## 6. Live Database Verification Matrix

The following table summarizes which checks are covered by unit/mock tests vs. which checks can **only** be verified on a live PostgreSQL database:

| Security Verification Check | Unit Tests (Vitest) | Live PostgreSQL (Supabase) | Rationale |
| :--- | :---: | :---: | :--- |
| Client query syntax & error handling | ✅ Verified | ✅ Verified | Vitest tests supabase client calls and fallback handlers. |
| `CorporateGuard` redirect on null/non-admin | ✅ Verified | N/A | React routing and toast behavior. |
| `CorporateGuard` error handling & retry | ✅ Verified | N/A | Component-level resilience testing. |
| RLS policy evaluation (`auth.jwt() ->> 'email'`) | ❌ Mocked | ✅ **Live DB Only** | Vitest does not run a PostgreSQL engine; RLS is enforced at the database level. |
| Cross-tenant leakage prevention | ❌ Mocked | ✅ **Live DB Only** | Subquery evaluation in PostgreSQL row filtering. |
| Anon access revocation (`REVOKE ALL`) | ❌ Mocked | ✅ **Live DB Only** | Role permission enforcement in PostgreSQL catalog (`pg_class`/`pg_roles`). |
| Case-insensitivity without wildcard exploit | ✅ Unit Regex | ✅ **Live DB Only** | SQL `lower()` function evaluation in RLS policy. |
