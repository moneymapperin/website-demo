-- Migration: Payments Infrastructure Security Lockdown
-- File: supabase/migrations/lockdown_payments_security.sql
-- IMPORTANT: Run this migration AFTER both the web app and Flutter app have been updated
-- to stop calling public.stack_subscription directly from the client.
--
-- ============================================================================
-- VERIFICATION BLOCK (Run these test queries in SQL Editor AFTER migration):
-- ============================================================================
-- 1. Verify stack_subscription is NOT executable by anon or authenticated:
--    SELECT has_function_privilege('anon', 'public.stack_subscription(uuid, integer)', 'EXECUTE'); -- Expect: FALSE
--    SELECT has_function_privilege('authenticated', 'public.stack_subscription(uuid, integer)', 'EXECUTE'); -- Expect: FALSE
--    SELECT has_function_privilege('service_role', 'public.stack_subscription(uuid, integer)', 'EXECUTE'); -- Expect: TRUE
--
-- 2. Verify payments.transactions privileges (authenticated can only SELECT, cannot INSERT/UPDATE):
--    SELECT has_table_privilege('authenticated', 'payments.transactions', 'SELECT'); -- Expect: TRUE
--    SELECT has_table_privilege('authenticated', 'payments.transactions', 'INSERT'); -- Expect: FALSE
--    SELECT has_table_privilege('authenticated', 'payments.transactions', 'UPDATE'); -- Expect: FALSE
--    SELECT has_table_privilege('anon', 'payments.transactions', 'SELECT');          -- Expect: FALSE
--
-- 3. Verify gateway_config is locked down completely from client roles:
--    SELECT has_table_privilege('authenticated', 'payments.gateway_config', 'SELECT'); -- Expect: FALSE
--    SELECT has_table_privilege('anon', 'payments.gateway_config', 'SELECT');          -- Expect: FALSE
--
-- 4. Verify unique index on gateway_transaction_id:
--    SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'transactions' AND schemaname = 'payments';
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Restrict public.stack_subscription to service_role ONLY
-- Reason: Previously, anyone (even unauthenticated anon) could invoke this RPC
-- to grant free PRO subscriptions to any user ID. Now only server-side functions
-- (like the verified finalize_transaction) running as SECURITY DEFINER or service_role
-- can execute it.
-- ----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.stack_subscription(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.stack_subscription(uuid, integer) TO service_role;

-- ----------------------------------------------------------------------------
-- STEP 2: Lock down payments.transactions from client-side inserts/mutations
-- Reason: Client apps must never insert transactions directly. Only the Supabase
-- create_checkout Edge Function (service_role) creates transactions.
-- Authenticated users need SELECT to view their purchase history.
-- ----------------------------------------------------------------------------
-- Drop permissive insert policy
DROP POLICY IF EXISTS "Allow users to insert their own transactions" ON payments.transactions;

-- Revoke mutation privileges from client roles
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON payments.transactions FROM anon, authenticated;
REVOKE ALL ON payments.transactions FROM anon;

-- Ensure authenticated users can still read their own transactions (via existing SELECT policies)
GRANT SELECT ON payments.transactions TO authenticated;

-- ----------------------------------------------------------------------------
-- STEP 3: Ensure uniqueness of gateway_transaction_id (order_id)
-- Reason: Prevents race conditions, order ID collision, and duplicate transaction tracking.
-- Pre-check query to check for existing duplicates before creating the index:
--
--   SELECT gateway_transaction_id, count(*) 
--   FROM payments.transactions 
--   GROUP BY gateway_transaction_id 
--   HAVING count(*) > 1;
-- ----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS ux_transactions_gateway_txn_id 
ON payments.transactions (gateway_transaction_id);

-- ----------------------------------------------------------------------------
-- STEP 4: Lock down payments.gateway_config from anon and authenticated
-- Reason: gateway_config stores secret_salt and api_key. Neither Web nor Flutter
-- ever accesses this table directly; only Edge Functions and finalize_transaction
-- (running as service_role/SECURITY DEFINER) read gateway configurations.
-- ----------------------------------------------------------------------------
REVOKE ALL ON payments.gateway_config FROM anon, authenticated;

-- ----------------------------------------------------------------------------
-- STEP 5: Explicit confirmation of unchanged public catalogs
-- payments.plans and payments.referral_codes keep their existing read access
-- so users can display plans and validate referral discounts.
-- ----------------------------------------------------------------------------
-- No changes to payments.plans (SELECT remains enabled for anon, authenticated)
-- No changes to payments.referral_codes (SELECT remains enabled)

