-- ==============================================================================
-- Migration: corporate_rls.sql
-- Description: Hardens Row-Level Security for B2B Corporate Intelligence tables:
--              1. public.corporate_admins
--              2. core.corporate_analytics
--              3. core.workforce_intelligence
-- Security Model:
--              - Anon role has ZERO access (REVOKE ALL).
--              - Authenticated user can only read their own corporate_admins row
--                matching lower(admin_email) = lower(auth.jwt() ->> 'email').
--              - Authenticated user can only read core.corporate_analytics and
--                core.workforce_intelligence for company_name mapped to their admin email.
--              - Exact lowercase equality is used to avoid ILIKE wildcard (% / _) injection.
-- DO NOT EXECUTE AUTOMATICALLY. PROPOSAL ONLY FOR SUPABASE SQL EDITOR.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. INSPECTION SCRIPT (Run independently to verify current state before migration)
-- ------------------------------------------------------------------------------
/*
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE (schemaname = 'public' AND tablename = 'corporate_admins')
   OR (schemaname = 'core' AND tablename IN ('corporate_analytics', 'workforce_intelligence'));

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE (schemaname = 'public' AND tablename = 'corporate_admins')
   OR (schemaname = 'core' AND tablename IN ('corporate_analytics', 'workforce_intelligence'));
*/

-- ------------------------------------------------------------------------------
-- 1. Enable Row Level Security on all three tables
-- ------------------------------------------------------------------------------
ALTER TABLE public.corporate_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.corporate_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.workforce_intelligence ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. Drop any existing permissive or legacy policies
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 3. Revoke all permissions from anon role
-- ------------------------------------------------------------------------------
REVOKE ALL ON TABLE public.corporate_admins FROM anon;
REVOKE ALL ON TABLE core.corporate_analytics FROM anon;
REVOKE ALL ON TABLE core.workforce_intelligence FROM anon;

-- Grant selective read to authenticated role
GRANT SELECT ON TABLE public.corporate_admins TO authenticated;
GRANT SELECT ON TABLE core.corporate_analytics TO authenticated;
GRANT SELECT ON TABLE core.workforce_intelligence TO authenticated;

-- ------------------------------------------------------------------------------
-- 4. Create Hardened Row Level Security Policies
-- ------------------------------------------------------------------------------

-- (a) public.corporate_admins: Caller reads ONLY their own admin row
-- Note: Uses exact lower() equality. Never use ILIKE in RLS policies because
-- characters like '%' and '_' in email addresses act as pattern wildcards.
CREATE POLICY "corporate_admins_auth_select_own"
ON public.corporate_admins
FOR SELECT
TO authenticated
USING (
  lower(admin_email) = lower(auth.jwt() ->> 'email')
);

-- (b) core.corporate_analytics: Caller reads analytics only for authorized company
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

-- (c) core.workforce_intelligence: Caller reads intelligence only for authorized company
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

-- ==============================================================================
-- 5. ROLLBACK SCRIPT (EMERGENCY ONLY)
-- In the event of application regression, execute this block to restore permissive baseline.
-- ==============================================================================
/*
-- EMERGENCY ONLY ROLLBACK:
DROP POLICY IF EXISTS "corporate_admins_auth_select_own" ON public.corporate_admins;
DROP POLICY IF EXISTS "corporate_analytics_auth_select_by_company" ON core.corporate_analytics;
DROP POLICY IF EXISTS "workforce_intelligence_auth_select_by_company" ON core.workforce_intelligence;

-- Restore baseline permissions
GRANT SELECT ON TABLE public.corporate_admins TO anon, authenticated;
GRANT SELECT ON TABLE core.corporate_analytics TO authenticated;
GRANT SELECT ON TABLE core.workforce_intelligence TO authenticated;
*/
