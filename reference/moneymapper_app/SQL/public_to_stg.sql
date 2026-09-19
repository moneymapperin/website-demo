/*
-- Create the schema if it doesn't already exist
create schema if not exists stg;

-- 1. Identity & Employment
create table stg.user_identities (
  user_id uuid references auth.users primary key,
  full_name text,
  dob date,
  gender text,
  city text,
  state text,
  employment_type text,
  employer text,
  pan text,
  city_tier text,
  mobile_number text,
  email text,
  company text,
  department text,
  designation text,
  dependents int,
  marital_status text,
  updated_at timestamp with time zone default now()
);

-- 2. Income Pillar
create table stg.user_income (
  user_id uuid references auth.users primary key,
  monthly_active_income numeric,
  income_frequency text,
  has_passive_income boolean,
  passive_income_amount numeric,
  passive_income_source text,
  salary_breakup text,
  updated_at timestamp with time zone default now()
);

-- 3. Expenses & Debt
create table stg.user_expenses (
  user_id uuid references auth.users primary key,
  monthly_fixed_expenses numeric,
  monthly_variable_expenses numeric,
  total_monthly_emi numeric,
  active_loans_count int,
  monthly_savings numeric,
  loan_details text,
  expense_category_breakdown text,
  updated_at timestamp with time zone default now()
);

-- 4. Insurance & Emergency
create table stg.user_protection (
  user_id uuid references auth.users primary key,
  has_emergency_fund boolean,
  emergency_fund_range text,
  has_health_insurance boolean,
  health_cover_amount numeric,
  has_life_insurance boolean,
  life_cover_amount numeric,
  has_term_plan boolean,
  term_cover_amount numeric,
  family_cover boolean,
  insurer_name text,
  policy_number text,
  policy_expiry text,
  has_accidental_cover boolean,
  has_critical_illness boolean,
  emergency_fund_parked text,
  updated_at timestamp with time zone default now()
);

-- 5. Investments
create table stg.user_investments (
  user_id uuid references auth.users primary key,
  does_invest boolean,
  monthly_investment numeric,
  risk_appetite text,
  primary_goal text,
  equity_exposure_pct numeric,
  total_invested_amount numeric,
  investment_types text,
  existing_portfolio text,
  updated_at timestamp with time zone default now()
);

-- Enable RLS for all in the stg schema
alter table stg.user_identities enable row level security;
alter table stg.user_income enable row level security;
alter table stg.user_expenses enable row level security;
alter table stg.user_protection enable row level security;
alter table stg.user_investments enable row level security;


ALTER TABLE stg.user_investments
ADD COLUMN total_equity_investments numeric DEFAULT 0,
ADD COLUMN total_debt_investments numeric DEFAULT 0,
ADD COLUMN total_gold_investments numeric DEFAULT 0,
ADD COLUMN total_real_estate_investments numeric DEFAULT 0,
ADD COLUMN monthly_sip_equity numeric DEFAULT 0,
ADD COLUMN monthly_sip_debt numeric DEFAULT 0,
ADD COLUMN monthly_sip_gold numeric DEFAULT 0;


CREATE OR REPLACE FUNCTION stg.sync_master_data_to_tables()
RETURNS trigger AS $$
BEGIN
  -- 1. Sync Identity (Existing logic remains same)
  INSERT INTO stg.user_identities (
    user_id, full_name, dob, gender, city, state, employment_type, employer,
    pan, city_tier, mobile_number, email, company, department, designation, dependents, marital_status
  )
  VALUES (
    new.user_id,
    new.profile_json->>'fullName',
    CASE WHEN (new.profile_json->>'dob') ~ '^\d{2}-\d{2}-\d{4}$'
         THEN TO_DATE(new.profile_json->>'dob', 'DD-MM-YYYY')
         ELSE NULL END,
    new.profile_json->>'gender',
    new.profile_json->>'city',
    new.profile_json->>'state',
    new.profile_json->>'employmentType',
    new.profile_json->>'employer',
    new.profile_json->>'pan',
    new.profile_json->>'cityTier',
    new.profile_json->>'mobile',
    new.profile_json->>'email',
    new.profile_json->>'company',
    new.profile_json->>'department',
    new.profile_json->>'designation',
    NULLIF(NULLIF(new.profile_json->>'dependents', ''), 'null')::int,
    new.profile_json->>'maritalStatus'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    dob = EXCLUDED.dob,
    gender = EXCLUDED.gender,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    employment_type = EXCLUDED.employment_type,
    employer = EXCLUDED.employer,
    pan = EXCLUDED.pan,
    city_tier = EXCLUDED.city_tier,
    mobile_number = EXCLUDED.mobile_number,
    email = EXCLUDED.email,
    company = EXCLUDED.company,
    department = EXCLUDED.department,
    designation = EXCLUDED.designation,
    dependents = EXCLUDED.dependents,
    marital_status = EXCLUDED.marital_status,
    updated_at = NOW();

  -- 2. Sync Income (Existing logic remains same)
  INSERT INTO stg.user_income (
    user_id, monthly_active_income, income_frequency, has_passive_income,
    passive_income_amount, passive_income_source, salary_breakup
  )
  VALUES (
    new.user_id,
    NULLIF(NULLIF(new.profile_json->>'monthlyActiveIncome', ''), 'null')::numeric,
    new.profile_json->>'incomeFrequency',
    NULLIF(NULLIF(new.profile_json->>'hasPassiveIncome', ''), 'null')::boolean,
    NULLIF(NULLIF(new.profile_json->>'passiveIncomeAmount', ''), 'null')::numeric,
    new.profile_json->>'passiveIncomeSource',
    new.profile_json->>'salaryBreakup'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    monthly_active_income = EXCLUDED.monthly_active_income,
    income_frequency = EXCLUDED.income_frequency,
    has_passive_income = EXCLUDED.has_passive_income,
    passive_income_amount = EXCLUDED.passive_income_amount,
    passive_income_source = EXCLUDED.passive_income_source,
    salary_breakup = EXCLUDED.salary_breakup,
    updated_at = NOW();

  -- 3. Sync Expenses (Existing logic remains same)
  INSERT INTO stg.user_expenses (
    user_id, monthly_fixed_expenses, monthly_variable_expenses, total_monthly_emi,
    active_loans_count, monthly_savings, loan_details, expense_category_breakdown
  )
  VALUES (
    new.user_id,
    NULLIF(NULLIF(new.profile_json->>'monthlyFixedExpenses', ''), 'null')::numeric,
    NULLIF(NULLIF(new.profile_json->>'monthlyVariableExpenses', ''), 'null')::numeric,
    NULLIF(NULLIF(new.profile_json->>'totalEmi', ''), 'null')::numeric,
    NULLIF(NULLIF(new.profile_json->>'activeLoans', ''), 'null')::int,
    NULLIF(NULLIF(new.profile_json->>'monthlySavings', ''), 'null')::numeric,
    new.profile_json->>'loanDetails',
    new.profile_json->>'expenseCategoryBreakdown'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    monthly_fixed_expenses = EXCLUDED.monthly_fixed_expenses,
    monthly_variable_expenses = EXCLUDED.monthly_variable_expenses,
    total_monthly_emi = EXCLUDED.total_monthly_emi,
    active_loans_count = EXCLUDED.active_loans_count,
    monthly_savings = EXCLUDED.monthly_savings,
    loan_details = EXCLUDED.loan_details,
    expense_category_breakdown = EXCLUDED.expense_category_breakdown,
    updated_at = NOW();

  -- 4. Sync Protection (Existing logic remains same)
  INSERT INTO stg.user_protection (
    user_id, has_emergency_fund, emergency_fund_range, has_health_insurance, health_cover_amount,
    has_life_insurance, life_cover_amount, has_term_plan, term_cover_amount,
    family_cover, insurer_name, policy_number, policy_expiry, has_accidental_cover,
    has_critical_illness, emergency_fund_parked
  )
  VALUES (
    new.user_id,
    NULLIF(NULLIF(new.profile_json->>'hasEmergencyFund', ''), 'null')::boolean,
    new.profile_json->>'emergencyFundRange',
    NULLIF(NULLIF(new.profile_json->>'hasHealthInsurance', ''), 'null')::boolean,
    NULLIF(NULLIF(new.profile_json->>'healthCover', ''), 'null')::numeric,
    NULLIF(NULLIF(new.profile_json->>'hasLifeInsurance', ''), 'null')::boolean,
    NULLIF(NULLIF(new.profile_json->>'lifeCover', ''), 'null')::numeric,
    NULLIF(NULLIF(new.profile_json->>'hasTermPlan', ''), 'null')::boolean,
    NULLIF(NULLIF(new.profile_json->>'termCover', ''), 'null')::numeric,
    NULLIF(NULLIF(new.profile_json->>'isFamilyCovered', ''), 'null')::boolean,
    new.profile_json->>'insurerName',
    new.profile_json->>'policyNumber',
    new.profile_json->>'policyExpiry',
    NULLIF(NULLIF(new.profile_json->>'hasAccidentalCover', ''), 'null')::boolean,
    NULLIF(NULLIF(new.profile_json->>'hasCriticalIllness', ''), 'null')::boolean,
    new.profile_json->>'emergencyFundParked'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    has_emergency_fund = EXCLUDED.has_emergency_fund,
    emergency_fund_range = EXCLUDED.emergency_fund_range,
    has_health_insurance = EXCLUDED.has_health_insurance,
    health_cover_amount = EXCLUDED.health_cover_amount,
    has_life_insurance = EXCLUDED.has_life_insurance,
    life_cover_amount = EXCLUDED.life_cover_amount,
    has_term_plan = EXCLUDED.has_term_plan,
    term_cover_amount = EXCLUDED.term_cover_amount,
    family_cover = EXCLUDED.family_cover,
    insurer_name = EXCLUDED.insurer_name,
    policy_number = EXCLUDED.policy_number,
    policy_expiry = EXCLUDED.policy_expiry,
    has_accidental_cover = EXCLUDED.has_accidental_cover,
    has_critical_illness = EXCLUDED.has_critical_illness,
    emergency_fund_parked = EXCLUDED.emergency_fund_parked,
    updated_at = NOW();

  -- 5. Sync Investments (UPDATED with new Asset breakdown)
  INSERT INTO stg.user_investments (
    user_id, does_invest, risk_appetite, primary_goal,
    equity_exposure_pct, existing_portfolio,
    total_equity_investments, total_debt_investments,
    total_gold_investments, total_real_estate_investments,
    monthly_sip_equity, monthly_sip_debt, monthly_sip_gold
  )
  VALUES (
    new.user_id,
    NULLIF(NULLIF(new.profile_json->>'doesInvest', ''), 'null')::boolean,
    new.profile_json->>'riskAppetite',
    new.profile_json->>'primaryInvestmentGoal',
    NULLIF(NULLIF(new.profile_json->>'equityExposurePct', ''), 'null')::numeric,
    new.profile_json->>'existingPortfolio',
    NULLIF(NULLIF(new.profile_json->>'totalEquityInvestments', ''), 'null')::numeric,
    NULLIF(NULLIF(new.profile_json->>'totalDebtInvestments', ''), 'null')::numeric,
    NULLIF(NULLIF(new.profile_json->>'totalGoldInvestments', ''), 'null')::numeric,
    NULLIF(NULLIF(new.profile_json->>'totalRealEstateInvestments', ''), 'null')::numeric,
    NULLIF(NULLIF(new.profile_json->>'monthlySipEquity', ''), 'null')::numeric,
    NULLIF(NULLIF(new.profile_json->>'monthlySipDebt', ''), 'null')::numeric,
    NULLIF(NULLIF(new.profile_json->>'monthlySipGold', ''), 'null')::numeric
  )
  ON CONFLICT (user_id) DO UPDATE SET
    does_invest = EXCLUDED.does_invest,
    risk_appetite = EXCLUDED.risk_appetite,
    primary_goal = EXCLUDED.primary_goal,
    equity_exposure_pct = EXCLUDED.equity_exposure_pct,
    existing_portfolio = EXCLUDED.existing_portfolio,
    total_equity_investments = EXCLUDED.total_equity_investments,
    total_debt_investments = EXCLUDED.total_debt_investments,
    total_gold_investments = EXCLUDED.total_gold_investments,
    total_real_estate_investments = EXCLUDED.total_real_estate_investments,
    monthly_sip_equity = EXCLUDED.monthly_sip_equity,
    monthly_sip_debt = EXCLUDED.monthly_sip_debt,
    monthly_sip_gold = EXCLUDED.monthly_sip_gold,
    updated_at = NOW();

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



-- Execute the trigger on the master_profiles table to sync with stg tables
drop trigger if exists on_master_profile_updated on master_profiles;
create trigger on_master_profile_updated
after insert or update on master_profiles
for each row execute function stg.sync_master_data_to_tables();

alter function stg.sync_master_data_to_tables() security definer;

create table app_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users,
  log_level text not null,
  context text,
  message text,
  metadata jsonb,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table app_logs enable row level security;

-- Allow users to only insert their own logs
create policy "Users can insert their own logs"
  on app_logs for insert
  with check (auth.uid() = user_id);

CREATE POLICY "Enable read access for all users"
ON core.financial_fitness_scores
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Enable read access for all users"
ON core.expense_scores
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Enable read access for all users"
ON core.income_scores
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Enable read access for all users"
ON core.investment_scores
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Enable read access for all users"
ON core.protection_scores
FOR SELECT
USING (auth.uid() = user_id);


CREATE POLICY "Enable read access for all users"
ON core.savings_scores
FOR SELECT
USING (auth.uid() = user_id);



-- 1. Create the companies mapping table
create table corporate_admins (
  id uuid default gen_random_uuid() primary key,
  admin_email text unique not null,
  company_name text not null,
  created_at timestamp with time zone default now()
);

-- 2. Enable RLS (Only service role or super admin can manage this table)
alter table corporate_admins enable row level security;




-- 1. Enable RLS (if not already enabled)
alter table public.corporate_admins enable row level security;

-- 2. Create a policy to allow anyone to check if an email exists
-- (This is safe because it only allows reading the table)
create policy "Allow public read access for admin check"
  on public.corporate_admins
  for select
  using (true);

-- 3. Ensure the authenticated role can see the table
grant select on public.corporate_admins to authenticated;
grant select on public.corporate_admins to anon;
*/