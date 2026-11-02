-- Already applied by mobile app. Docs only, do not run.

-- 1. Create the announcements table in the public schema
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    html_content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    show_once_per_user BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy so any user (even logged out) can read active announcements
DROP POLICY IF EXISTS "Enable read access for all on active announcements" ON public.announcements;
CREATE POLICY "Enable read access for all on active announcements"
ON public.announcements FOR SELECT
USING (is_active = true);
