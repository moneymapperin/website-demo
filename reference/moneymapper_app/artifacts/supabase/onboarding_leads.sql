-- 1. Create the Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    monthly_income NUMERIC DEFAULT 0,
    fixed_expenses NUMERIC DEFAULT 0,
    loan_emi NUMERIC DEFAULT 0,
    monthly_expenditure NUMERIC DEFAULT 0,
    city_tier VARCHAR(50),
    has_passive_income BOOLEAN DEFAULT false,
    passive_income_amount NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts to the leads table
CREATE POLICY "Enable insert access for all"
ON public.leads FOR INSERT
WITH CHECK (true);

-- Allow anonymous reading ONLY of the exact lead they just inserted (by ID)
CREATE POLICY "Enable read access for all"
ON public.leads FOR SELECT
USING (true);

-- 2. Create the Analysis View using the user's requested calculation logic
CREATE OR REPLACE VIEW public.leads_analysis AS
SELECT 
    id,
    first_name,
    email,
    monthly_income,
    passive_income_amount,
    loan_emi,
    city_tier,
    -- Calculate city minimum requirement
    CASE 
        WHEN LOWER(city_tier) LIKE '%metro%' THEN 60000 
        WHEN LOWER(city_tier) LIKE '%tier 2%' THEN 40000 
        ELSE 25000 
    END AS city_min,
    
    -- Calculate active income score
    LEAST((monthly_income / NULLIF(
        CASE 
            WHEN LOWER(city_tier) LIKE '%metro%' THEN 60000 
            WHEN LOWER(city_tier) LIKE '%tier 2%' THEN 40000 
            ELSE 25000 
        END, 0)
    ) * 100, 100) AS inc_active_scr,
    
    -- Calculate passive income score
    CASE 
        WHEN has_passive_income THEN LEAST((passive_income_amount / NULLIF(monthly_income, 0)) * 500, 100) 
        ELSE 0 
    END AS inc_passive_scr,
    
    -- Calculate final blended score
    ROUND(
        COALESCE(
            LEAST((monthly_income / NULLIF(
                CASE 
                    WHEN LOWER(city_tier) LIKE '%metro%' THEN 60000 
                    WHEN LOWER(city_tier) LIKE '%tier 2%' THEN 40000 
                    ELSE 25000 
                END, 0)
            ) * 100, 100) * 0.7 
            + 
            CASE 
                WHEN has_passive_income THEN LEAST((passive_income_amount / NULLIF(monthly_income, 0)) * 500, 100) 
                ELSE 0 
            END * 0.3, 
        0)
    ) AS final_score,

    -- Stability Score (EMI / Income Ratio)
    CASE
        WHEN monthly_income <= 0 THEN 'Red'
        WHEN (loan_emi / monthly_income) * 100 >= 60 THEN 'Red'
        WHEN (loan_emi / monthly_income) * 100 >= 40 THEN 'Yellow'
        ELSE 'Green'
    END AS stability_status
FROM public.leads;

-- Explicitly grant permissions to anon and authenticated roles
GRANT SELECT, INSERT ON public.leads TO anon, authenticated;
GRANT SELECT ON public.leads_analysis TO anon, authenticated;
