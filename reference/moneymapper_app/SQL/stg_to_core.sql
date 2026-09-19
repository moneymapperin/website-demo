-- =========================================================================
-- CORE SCHEMA: AGGREGATED ANALYTICS & SCORING
-- =========================================================================
/*
create schema if not exists core;

-- 1. Income Scores
create table core.income_scores (
  user_id uuid references auth.users primary key,
  active_income_score numeric,
  passive_income_score numeric,
  total_income_score numeric,
  updated_at timestamp with time zone default now()
);

-- 2. Expense Scores
create table core.expense_scores (
  user_id uuid references auth.users primary key,
  savings_score numeric,
  flexible_score numeric,
  fixed_score numeric,
  total_expense_score numeric,
  discipline_message text,
  updated_at timestamp with time zone default now()
);

-- 3. Savings Scores (Emergency Fund)
create table core.savings_scores (
  user_id uuid references auth.users primary key,
  ef_target_amount numeric,
  ef_current_estimated numeric,
  total_savings_score numeric,
  updated_at timestamp with time zone default now()
);

-- 4. Protection Scores
create table core.protection_scores (
  user_id uuid references auth.users primary key,
  term_score numeric,
  health_score numeric,
  total_protection_score numeric,
  term_gap numeric,
  health_gap numeric,
  updated_at timestamp with time zone default now()
);

-- 5. Investment Scores
create table core.investment_scores (
  user_id uuid references auth.users primary key,
  equity_score numeric,
  asset_balance_score numeric,
  sip_score numeric,
  total_investment_score numeric,
  sip_gap numeric,
  updated_at timestamp with time zone default now()
);

-- 6. Global Financial Fitness
create table core.financial_fitness_scores (
  user_id uuid references auth.users primary key,
  income_pillar_score numeric,
  expense_pillar_score numeric,
  savings_pillar_score numeric,
  protection_pillar_score numeric,
  investment_pillar_score numeric,
  global_fitness_score numeric,
  updated_at timestamp with time zone default now()
);

-- Enable RLS for core tables
alter table core.income_scores enable row level security;
alter table core.expense_scores enable row level security;
alter table core.savings_scores enable row level security;
alter table core.protection_scores enable row level security;
alter table core.investment_scores enable row level security;
alter table core.financial_fitness_scores enable row level security;



-- =========================================================================
-- FUNCTION: Calculate and Sync Scores to Core Schema
-- =========================================================================
CREATE OR REPLACE FUNCTION core.calculate_and_sync_scores()
RETURNS trigger AS $$
DECLARE
  v_user_id uuid;
  -- Base Data Variables
  v_income numeric := 0;
  v_city_tier text;
  v_has_passive boolean;
  v_passive_amt numeric := 0;
  v_emp_type text;
  v_fixed_exp numeric := 0;
  v_flex_exp numeric := 0;
  v_has_ef boolean;
  v_ef_range text;
  v_term_cover numeric := 0;
  v_health_cover numeric := 0;

  -- New Investment Input Variables
  v_does_invest boolean;
  v_inv_equity numeric := 0;
  v_inv_debt numeric := 0;
  v_inv_gold numeric := 0;
  v_inv_re numeric := 0;
  v_sip_equity numeric := 0;
  v_sip_debt numeric := 0;
  v_sip_gold numeric := 0;

  -- Logic Output Variables (Internal)
  v_city_min numeric;
  v_inc_active_scr numeric;
  v_inc_passive_scr numeric;
  v_inc_total_scr numeric;
  v_wk_inc numeric;
  v_wk_fixed numeric;
  v_wk_flex numeric;
  v_wk_sav numeric;
  v_sav_pct numeric;
  v_flex_pct numeric;
  v_fixed_pct numeric;
  v_exp_sav_scr numeric;
  v_exp_flex_scr numeric;
  v_exp_fixed_scr numeric;
  v_exp_total_scr numeric;
  v_exp_msg text;
  v_ef_months numeric;
  v_ef_target numeric;
  v_ef_current numeric;
  v_sav_total_scr numeric;
  v_annual_inc numeric;
  v_prot_term_scr numeric;
  v_prot_hlth_scr numeric;
  v_prot_total_scr numeric;
  v_prot_term_gap numeric;
  v_prot_hlth_gap numeric;

  -- Investment Logic Variables (FIXED DECLARATIONS)
  v_total_inv numeric := 0;
  v_asset_bal_scr numeric := 0;
  v_equity_pct numeric; v_debt_pct numeric; v_re_pct numeric; v_gold_pct numeric;
  v_eq_scr numeric := 0; v_dt_scr numeric := 0; v_re_scr numeric := 0; v_gd_scr numeric := 0;
  v_sip_contrib numeric := 0;
  v_sip_ideal numeric := 0;
  v_sip_amt_scr numeric := 0;
  v_sip_gap numeric := 0;
  v_sip_alloc_scr numeric := 0;
  v_sip_eq_pct numeric; v_sip_dt_pct numeric; v_sip_gd_pct numeric;
  v_sip_eq_scr numeric := 0; v_sip_dt_scr numeric := 0; v_sip_gd_scr numeric := 0;
  v_inv_sip_scr numeric := 0; -- Was missing before
  v_inv_total_scr numeric := 0;

  -- Global
  v_global_score numeric;
BEGIN
  IF TG_OP = 'DELETE' THEN v_user_id := OLD.user_id; ELSE v_user_id := NEW.user_id; END IF;

  -- 1. Fetch Aggregated Data
  SELECT
    COALESCE(i.monthly_active_income, 0), id.city_tier, COALESCE(i.has_passive_income, false), COALESCE(i.passive_income_amount, 0), id.employment_type,
    COALESCE(e.monthly_fixed_expenses, 0), COALESCE(e.monthly_variable_expenses, 0),
    COALESCE(p.has_emergency_fund, false), p.emergency_fund_range, COALESCE(p.term_cover_amount, 0), COALESCE(p.health_cover_amount, 0),
    COALESCE(inv.does_invest, false),
    COALESCE(inv.total_equity_investments, 0), COALESCE(inv.total_debt_investments, 0), COALESCE(inv.total_gold_investments, 0), COALESCE(inv.total_real_estate_investments, 0),
    COALESCE(inv.monthly_sip_equity, 0), COALESCE(inv.monthly_sip_debt, 0), COALESCE(inv.monthly_sip_gold, 0)
  INTO
    v_income, v_city_tier, v_has_passive, v_passive_amt, v_emp_type,
    v_fixed_exp, v_flex_exp,
    v_has_ef, v_ef_range, v_term_cover, v_health_cover,
    v_does_invest, v_inv_equity, v_inv_debt, v_inv_gold, v_inv_re,
    v_sip_equity, v_sip_debt, v_sip_gold
  FROM stg.user_identities id
  LEFT JOIN stg.user_income i ON id.user_id = i.user_id
  LEFT JOIN stg.user_expenses e ON id.user_id = e.user_id
  LEFT JOIN stg.user_protection p ON id.user_id = p.user_id
  LEFT JOIN stg.user_investments inv ON id.user_id = inv.user_id
  WHERE id.user_id = v_user_id;

  IF NOT FOUND THEN RETURN NEW; END IF;

  -- A. INCOME PILLAR
  v_city_min := CASE WHEN LOWER(v_city_tier) LIKE '%metro%' THEN 60000 WHEN LOWER(v_city_tier) LIKE '%tier 2%' THEN 40000 ELSE 25000 END;
  v_inc_active_scr := LEAST((v_income / NULLIF(v_city_min, 0)) * 100, 100);
  v_inc_passive_scr := CASE WHEN v_has_passive THEN LEAST((v_passive_amt / NULLIF(v_income, 0)) * 500, 100) ELSE 0 END;
  v_inc_total_scr := ROUND(COALESCE(v_inc_active_scr * 0.7 + v_inc_passive_scr * 0.3, 0));

  INSERT INTO core.income_scores (user_id, active_income_score, passive_income_score, total_income_score, updated_at)
  VALUES (v_user_id, v_inc_active_scr, v_inc_passive_scr, v_inc_total_scr, NOW())
  ON CONFLICT (user_id) DO UPDATE SET active_income_score = EXCLUDED.active_income_score, passive_income_score = EXCLUDED.passive_income_score, total_income_score = EXCLUDED.total_income_score, updated_at = NOW();

  -- B. EXPENSE PILLAR
  v_wk_inc := v_income / 4.33; v_wk_fixed := v_fixed_exp / 4.33; v_wk_flex := v_flex_exp / 4.33;
  v_wk_sav := COALESCE(v_wk_inc - v_wk_fixed - v_wk_flex, 0);
  v_sav_pct := v_wk_sav / NULLIF(v_wk_inc, 0); v_flex_pct := v_wk_flex / NULLIF(v_wk_inc, 0); v_fixed_pct := v_wk_fixed / NULLIF(v_wk_inc, 0);
  v_exp_sav_scr := CASE WHEN v_sav_pct >= 0.20 THEN 45 WHEN v_sav_pct >= 0.15 THEN 30 WHEN v_sav_pct >= 0.10 THEN 15 ELSE 5 END;
  v_exp_flex_scr := CASE WHEN v_flex_pct <= 0.30 THEN 35 WHEN v_flex_pct <= 0.35 THEN 20 ELSE 10 END;
  v_exp_fixed_scr := CASE WHEN v_fixed_pct <= 0.50 THEN 20 WHEN v_fixed_pct <= 0.60 THEN 10 ELSE 5 END;
  v_exp_total_scr := ROUND(COALESCE(v_exp_sav_scr + v_exp_flex_scr + v_exp_fixed_scr, 0));
  v_exp_msg := CASE WHEN v_exp_total_scr < 30 THEN 'High stress risk.' WHEN v_exp_total_scr < 70 THEN 'Moderate discipline.' ELSE 'Excellent discipline.' END;

  INSERT INTO core.expense_scores (user_id, savings_score, flexible_score, fixed_score, total_expense_score, discipline_message, updated_at)
  VALUES (v_user_id, v_exp_sav_scr, v_exp_flex_scr, v_exp_fixed_scr, v_exp_total_scr, v_exp_msg, NOW())
  ON CONFLICT (user_id) DO UPDATE SET savings_score = EXCLUDED.savings_score, flexible_score = EXCLUDED.flexible_score, fixed_score = EXCLUDED.fixed_score, total_expense_score = EXCLUDED.total_expense_score, discipline_message = EXCLUDED.discipline_message, updated_at = NOW();

  -- C. SAVINGS & D. PROTECTION
  v_ef_target := v_income * (CASE WHEN LOWER(v_emp_type) = 'salaried' THEN 6 ELSE 9 END);
  v_ef_current := CASE WHEN v_ef_range ILIKE '%6+%' THEN v_income * 6 WHEN v_has_ef THEN v_income * 2 ELSE 0 END;
  v_sav_total_scr := LEAST((v_ef_current / NULLIF(v_ef_target, 0)) * 100, 100);

  INSERT INTO core.savings_scores (user_id, ef_target_amount, ef_current_estimated, total_savings_score, updated_at)
  VALUES (v_user_id, v_ef_target, v_ef_current, v_sav_total_scr, NOW())
  ON CONFLICT (user_id) DO UPDATE SET ef_target_amount = EXCLUDED.ef_target_amount, ef_current_estimated = EXCLUDED.ef_current_estimated, total_savings_score = EXCLUDED.total_savings_score, updated_at = NOW();

  v_prot_term_scr := LEAST((v_term_cover / NULLIF(v_income * 12 * 15, 0)) * 100, 100);
  v_prot_hlth_scr := LEAST((v_health_cover / NULLIF(v_income * 12 * 5, 0)) * 100, 100);
  v_prot_total_scr := ROUND((COALESCE(v_prot_term_scr, 0) + COALESCE(v_prot_hlth_scr, 0)) / 2);

  INSERT INTO core.protection_scores (user_id, term_score, health_score, total_protection_score, updated_at)
  VALUES (v_user_id, v_prot_term_scr, v_prot_hlth_scr, v_prot_total_scr, NOW())
  ON CONFLICT (user_id) DO UPDATE SET term_score = EXCLUDED.term_score, health_score = EXCLUDED.health_score, total_protection_score = EXCLUDED.total_protection_score, updated_at = NOW();

  -- ==========================================
  -- E. NEW INVESTMENT PILLAR LOGIC
  -- ==========================================
  IF NOT v_does_invest THEN
    v_inv_total_scr := 0;
  ELSE
    -- 1. Asset Balance Score
    v_total_inv := v_inv_equity + v_inv_debt + v_inv_gold + v_inv_re;
    IF v_total_inv > 0 THEN
      v_equity_pct := v_inv_equity / v_total_inv;
      v_debt_pct := v_inv_debt / v_total_inv;
      v_gold_pct := v_inv_gold / v_total_inv;
      v_re_pct := v_inv_re / v_total_inv;

      v_eq_scr := CASE WHEN v_equity_pct BETWEEN 0.40 AND 0.55 THEN 100 WHEN v_equity_pct < 0.40 THEN (v_equity_pct/0.40)*100 ELSE (0.55/v_equity_pct)*100 END;
      v_dt_scr := CASE WHEN v_debt_pct BETWEEN 0.15 AND 0.30 THEN 100 WHEN v_debt_pct < 0.15 THEN (v_debt_pct/0.15)*100 ELSE (0.30/v_debt_pct)*100 END;
      v_re_scr := CASE WHEN v_re_pct BETWEEN 0.15 AND 0.25 THEN 100 WHEN v_re_pct < 0.15 THEN (v_re_pct/0.15)*100 ELSE (0.25/v_re_pct)*100 END;
      v_gd_scr := CASE WHEN v_gold_pct BETWEEN 0.05 AND 0.10 THEN 100 WHEN v_gold_pct < 0.05 THEN (v_gold_pct/0.05)*100 ELSE (0.10/v_gold_pct)*100 END;

      v_asset_bal_scr := ROUND((v_eq_scr + v_dt_scr + v_re_scr + v_gd_scr) / 4);
    END IF;

    -- 2. SIP Score
    v_sip_contrib := v_sip_equity + v_sip_debt + v_sip_gold;
    v_sip_ideal := v_income * 0.20;
    v_sip_amt_scr := LEAST((v_sip_contrib / NULLIF(v_sip_ideal, 0)) * 100, 100);
    v_sip_gap := GREATEST(v_sip_ideal - v_sip_contrib, 0);

    IF v_sip_contrib > 0 THEN
      v_sip_eq_pct := v_sip_equity / v_sip_contrib;
      v_sip_dt_pct := v_sip_debt / v_sip_contrib;
      v_sip_gd_pct := v_sip_gold / v_sip_contrib;

      v_sip_eq_scr := CASE WHEN v_sip_eq_pct BETWEEN 0.50 AND 0.70 THEN 100 WHEN v_sip_eq_pct < 0.50 THEN (v_sip_eq_pct/0.50)*100 ELSE (0.70/v_sip_eq_pct)*100 END;
      v_sip_dt_scr := CASE WHEN v_sip_dt_pct BETWEEN 0.20 AND 0.40 THEN 100 WHEN v_sip_dt_scr < 0.20 THEN (v_sip_dt_pct/0.20)*100 ELSE (0.40/v_sip_dt_pct)*100 END;
      v_sip_gd_scr := CASE WHEN v_sip_gd_pct BETWEEN 0.05 AND 0.15 THEN 100 WHEN v_sip_gd_pct < 0.05 THEN (v_sip_gd_pct/0.05)*100 ELSE (0.15/v_sip_gd_pct)*100 END;

      v_sip_alloc_scr := ROUND((v_sip_eq_scr + v_sip_dt_scr + v_sip_gd_scr) / 3);
    END IF;

    v_inv_sip_scr := ROUND(v_sip_amt_scr * 0.5 + v_sip_alloc_scr * 0.5);
    v_inv_total_scr := ROUND(v_asset_bal_scr * 0.6 + v_inv_sip_scr * 0.4);
  END IF;

  INSERT INTO core.investment_scores (user_id, equity_score, asset_balance_score, sip_score, total_investment_score, sip_gap, total_investment_amount, updated_at)
  VALUES (v_user_id, v_eq_scr, v_asset_bal_scr, v_inv_sip_scr, v_inv_total_scr, v_sip_gap, v_total_inv, NOW())
  ON CONFLICT (user_id) DO UPDATE SET equity_score = EXCLUDED.equity_score, asset_balance_score = EXCLUDED.asset_balance_score, sip_score = EXCLUDED.sip_score, total_investment_score = EXCLUDED.total_investment_score, sip_gap = EXCLUDED.sip_gap, total_investment_amount = EXCLUDED.total_investment_amount, updated_at = NOW();

  -- F. GLOBAL FITNESS
  v_global_score := ROUND((v_inc_total_scr + v_exp_total_scr + COALESCE(v_sav_total_scr, 0) + v_prot_total_scr + v_inv_total_scr) / 5);

  INSERT INTO core.financial_fitness_scores (user_id, income_pillar_score, expense_pillar_score, savings_pillar_score, protection_pillar_score, investment_pillar_score, global_fitness_score, updated_at)
  VALUES (v_user_id, v_inc_total_scr, v_exp_total_scr, v_sav_total_scr, v_prot_total_scr, v_inv_total_scr, v_global_score, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    income_pillar_score = EXCLUDED.income_pillar_score,
    expense_pillar_score = EXCLUDED.expense_pillar_score,
    savings_pillar_score = EXCLUDED.savings_pillar_score,
    protection_pillar_score = EXCLUDED.protection_pillar_score,
    investment_pillar_score = EXCLUDED.investment_pillar_score,
    global_fitness_score = EXCLUDED.global_fitness_score,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


ALTER TABLE core.investment_scores
ADD COLUMN equity_gap_pct numeric DEFAULT 0,
ADD COLUMN debt_gap_pct numeric DEFAULT 0,
ADD COLUMN real_estate_gap_pct numeric DEFAULT 0,
ADD COLUMN gold_gap_pct numeric DEFAULT 0,
ADD COLUMN total_investment_amount numeric DEFAULT 0;



-- =========================================================================
-- TRIGGERS: Execute Core Scoring Engine on Staging Updates
-- =========================================================================
drop trigger if exists on_stg_identities_updated on stg.user_identities;
create trigger on_stg_identities_updated
after insert or update on stg.user_identities
for each row execute function core.calculate_and_sync_scores();

drop trigger if exists on_stg_income_updated on stg.user_income;
create trigger on_stg_income_updated
after insert or update on stg.user_income
for each row execute function core.calculate_and_sync_scores();

drop trigger if exists on_stg_expenses_updated on stg.user_expenses;
create trigger on_stg_expenses_updated
after insert or update on stg.user_expenses
for each row execute function core.calculate_and_sync_scores();

drop trigger if exists on_stg_protection_updated on stg.user_protection;
create trigger on_stg_protection_updated
after insert or update on stg.user_protection
for each row execute function core.calculate_and_sync_scores();

drop trigger if exists on_stg_investments_updated on stg.user_investments;
create trigger on_stg_investments_updated
after insert or update on stg.user_investments
for each row execute function core.calculate_and_sync_scores();



ALTER TABLE weekly_logs
ADD COLUMN spent_fixed numeric DEFAULT 0,
ADD COLUMN spent_flexible numeric DEFAULT 0,
ADD COLUMN spent_savings numeric DEFAULT 0;

ALTER TABLE weekly_logs
ADD COLUMN fixed_status text check (fixed_status in ('achieved', 'missed')),
ADD COLUMN flexible_status text check (flexible_status in ('achieved', 'missed')),
ADD COLUMN savings_status text check (savings_status in ('achieved', 'missed'));


create materialized view core.corporate_analytics as
with dept_stats as (
  select
    id.employer as company_name,
    id.department,
    count(id.user_id) as dept_headcount,
    avg(fs.expense_pillar_score) as dept_avg_stress,
    avg(fs.savings_pillar_score) as dept_avg_savings
  from stg.user_identities id
  join core.financial_fitness_scores fs on id.user_id = fs.user_id
  group by id.employer, id.department
)
select
  id.employer as company_name,
  count(distinct id.user_id) as total_headcount,
  avg(fs.global_fitness_score)::int as avg_workforce_score,
  count(*) filter (where fs.global_fitness_score < 40) as critical_risk_count,
  count(*) filter (where fs.global_fitness_score between 40 and 60) as high_risk_count,
  count(*) filter (where fs.global_fitness_score between 60 and 80) as watchlist_count,
  count(*) filter (where fs.global_fitness_score > 80) as stable_count,
  jsonb_object_agg(
    coalesce(ds.department, 'General'),
    jsonb_build_object(
      'avg_stress', ds.dept_avg_stress,
      'avg_savings', ds.dept_avg_savings,
      'headcount', ds.dept_headcount
    )
  ) as dept_metrics,
  round((count(*) filter (where (inc.monthly_active_income - exp.monthly_fixed_expenses) < (inc.monthly_active_income * 0.1))::numeric / count(*)) * 100, 2) as paycheck_dependency_pct,
  round((count(*) filter (where prot.has_emergency_fund = false)::numeric / count(*)) * 100, 2) as no_emergency_fund_pct
from stg.user_identities id
join core.financial_fitness_scores fs on id.user_id = fs.user_id
join stg.user_income inc on id.user_id = inc.user_id
join stg.user_expenses exp on id.user_id = exp.user_id
join stg.user_protection prot on id.user_id = prot.user_id
left join dept_stats ds on id.employer = ds.company_name and lower(trim(id.department)) = lower(trim(ds.department))
group by id.employer;

-- 3. Add an index for instant lookups
create unique index idx_corp_analytics_company on core.corporate_analytics (company_name);


-- Run this to keep the Materialized View fresh
create or replace function stg.refresh_corporate_analytics()
returns trigger as $$
begin
  refresh materialized view concurrently core.corporate_analytics;
  return null;
end;
$$ language plpgsql;

create trigger trg_refresh_corp_analytics
after insert or update or delete on core.financial_fitness_scores
for each statement execute function stg.refresh_corporate_analytics();

*/