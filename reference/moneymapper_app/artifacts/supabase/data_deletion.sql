-- 1. Create the Deletion Requests Table
CREATE TABLE IF NOT EXISTS public.deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    reason TEXT,
    status TEXT DEFAULT 'pending', -- pending, cancelled, completed
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Users can insert their own requests
CREATE POLICY "Users can insert their own deletion requests"
ON public.deletion_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. Policy: Users can view their own requests
CREATE POLICY "Users can view their own deletion requests"
ON public.deletion_requests
FOR SELECT
USING (auth.uid() = user_id);

-- 5. Policy: Users can update (cancel) their own requests
CREATE POLICY "Users can update their own deletion requests"
ON public.deletion_requests
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Grant basic permissions to the authenticated role
GRANT SELECT, INSERT, UPDATE ON public.deletion_requests TO authenticated;


/*
   --- BACKEND AUTOMATION ---
   To actually execute the deletions after the 7-day period expires,
   you can use Supabase's built-in pg_cron extension.

   Run this separately in your SQL editor to schedule the cleanup:
*/

-- Uncomment below to enable pg_cron if not already active:
-- create extension if not exists pg_cron;

-- Uncomment below to schedule the daily sweep of expired accounts:
/*
SELECT cron.schedule(
    'process-data-deletion',
    '0 0 * * *', -- Run every day at midnight
    $$
    -- Delete users from the auth schema where the 7 day timer has elapsed.
    -- Because foreign keys are set to ON DELETE CASCADE (or will be manually swept here),
    -- deleting the auth.users record will permanently erase their data footprint.
    DELETE FROM auth.users
    WHERE id IN (
        SELECT user_id
        FROM public.deletion_requests
        WHERE status = 'pending'
        AND scheduled_for <= NOW()
    );

    -- Mark those requests as completed
    UPDATE public.deletion_requests
    SET status = 'completed'
    WHERE status = 'pending'
    AND scheduled_for <= NOW();
    $$
);
*/

-- 7. Policy: Users can delete (withdraw) their own requests
CREATE POLICY "Users can delete their own deletion requests"
ON public.deletion_requests
FOR DELETE
USING (auth.uid() = user_id);

GRANT DELETE ON public.deletion_requests TO authenticated;
