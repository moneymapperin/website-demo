-- Already applied by mobile app. Docs only, do not run.

-- 1. Create the feature_flags table
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_key VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy so any user (even logged out) can read the flags
DROP POLICY IF EXISTS "Enable read access for all on feature flags" ON public.feature_flags;
CREATE POLICY "Enable read access for all on feature flags"
ON public.feature_flags FOR SELECT
USING (true);

-- 4. Insert default feature flags for the app
INSERT INTO public.feature_flags (feature_key, title, description, is_enabled)
VALUES 
    ('stock_screener', 'Stock Screener', 'Advanced equity screening tools and charts', true),
    ('mutual_funds', 'Mutual Funds', 'Mutual fund recommendations and tracking', true),
    ('insurance', 'Insurance Screener', 'Compare and buy insurance policies', true),
    ('ai_assistant', 'AI Assistant', 'AI-powered financial advice', true),
    ('gold_rates', 'Live Gold Rates', 'Live market updates for precious metals', true),
    ('income_pillar', 'Income Management', 'Manage active and passive income streams', true),
    ('emergency_fund', 'Emergency Fund', 'Emergency fund tracking and optimization', true),
    ('savings_recs', 'Savings Recommendations', 'Tailored savings goals and logic', true),
    ('weekly_expense', 'Weekly Expense Tracker', 'Track weekly spending trends', true)
ON CONFLICT (feature_key) 
DO UPDATE SET 
    title = EXCLUDED.title,
    description = EXCLUDED.description;
