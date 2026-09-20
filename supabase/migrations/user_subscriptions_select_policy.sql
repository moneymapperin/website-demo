-- Migration: Add SELECT policy on bse_data.user_subscriptions for authenticated users
-- Purpose: Allow authenticated users to query their own subscription record (user_id = auth.uid())
-- Without this policy, PostgREST queries on bse_data.user_subscriptions silently return null,
-- causing the website to display 'Free Tier' even when a valid pro row exists.

-- 1. Ensure RLS is enabled on bse_data.user_subscriptions
ALTER TABLE bse_data.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policy if any exists with the same name to ensure idempotency
DROP POLICY IF EXISTS "Allow authenticated users to read own subscription" ON bse_data.user_subscriptions;

-- 3. Create SELECT policy for authenticated users
CREATE POLICY "Allow authenticated users to read own subscription"
ON bse_data.user_subscriptions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
