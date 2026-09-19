/**
 * MONEYMAPPER BACKEND SCHEMA CONTRACT
 *
 * Source of Truth: Flutter mobile codebase located at `reference/moneymapper_app/lib/`.
 * Per Master Rule 1: Every schema, table, column, RPC, auth metadata key, and profile key
 * MUST match the Flutter code exactly.
 */

export const SCHEMAS = ['public', 'bse_data', 'core'] as const;
export type SchemaName = typeof SCHEMAS[number];

export interface TableContract {
  schema: SchemaName;
  table: string;
  operations: ('SELECT' | 'INSERT' | 'UPSERT' | 'DELETE')[];
  columnsRead: string[];
  columnsWritten: string[];
  filters?: string[];
  upsertOnConflict?: string;
  notes?: string;
}

export const SCHEMA_TABLES: Record<SchemaName, readonly string[]> = {
  public: [
    'market_sentiment',
    'master_profiles',
    'weekly_logs',
    'app_logs',
    'web_sessions',
    'corporate_admins',
  ],
  bse_data: [
    'stock_signals',
    'mutual_fund_signals',
    'insurance_plans',
    'ipo_signals',
    'finance_news',
    'blogs',
    'live_metal_rates',
    'user_subscriptions',
  ],
  core: [
    'financial_fitness_scores',
    'income_scores',
    'expense_scores',
    'savings_scores',
    'protection_scores',
    'investment_scores',
    'corporate_analytics',
    'workforce_intelligence',
  ],
} as const;

export const TABLE_CONTRACTS: TableContract[] = [
  // --- public schema ---
  {
    schema: 'public',
    table: 'market_sentiment',
    operations: ['SELECT'],
    columnsRead: ['*'],
    columnsWritten: [],
    notes: 'Ordered by updated_at descending, limit 1',
  },
  {
    schema: 'public',
    table: 'master_profiles',
    operations: ['SELECT', 'UPSERT'],
    columnsRead: ['profile_json', 'user_id', 'updated_at'],
    columnsWritten: ['user_id', 'profile_json', 'updated_at'],
    filters: ['user_id=eq'],
    upsertOnConflict: 'user_id',
  },
  {
    schema: 'public',
    table: 'weekly_logs',
    operations: ['SELECT', 'UPSERT'],
    columnsRead: [
      'id',
      'user_id',
      'week_index',
      'log_month',
      'log_year',
      'status',
      'fixed_status',
      'flexible_status',
      'savings_status',
      'spent_fixed',
      'spent_flexible',
      'spent_savings',
      'updated_at',
    ],
    columnsWritten: [
      'user_id',
      'week_index',
      'log_month',
      'log_year',
      'status',
      'fixed_status',
      'flexible_status',
      'savings_status',
      'spent_fixed',
      'spent_flexible',
      'spent_savings',
      'updated_at',
    ],
    filters: ['user_id=eq', 'log_month=eq', 'log_year=eq'],
    upsertOnConflict: 'user_id,week_index,log_month,log_year',
  },
  {
    schema: 'public',
    table: 'app_logs',
    operations: ['INSERT'],
    columnsRead: [],
    columnsWritten: ['user_id', 'log_level', 'context', 'message', 'metadata'],
  },
  {
    schema: 'public',
    table: 'web_sessions',
    operations: ['INSERT', 'UPSERT', 'SELECT', 'DELETE'],
    columnsRead: [
      'session_token',
      'user_id',
      'access_token',
      'refresh_token',
      'status',
      'created_at',
      'authenticated_at',
    ],
    columnsWritten: [
      'session_token',
      'user_id',
      'access_token',
      'refresh_token',
      'status',
      'authenticated_at',
    ],
    filters: ['session_token=eq'],
    upsertOnConflict: 'session_token',
  },
  {
    schema: 'public',
    table: 'corporate_admins',
    operations: ['SELECT'],
    columnsRead: ['company_name', 'secure_flag'],
    columnsWritten: [],
    filters: ['admin_email=ilike'],
    notes: 'Queried by admin_email. secure_flag used in security_service.dart',
  },

  // --- bse_data schema ---
  {
    schema: 'bse_data',
    table: 'stock_signals',
    operations: ['SELECT'],
    columnsRead: ['*'],
    columnsWritten: [],
  },
  {
    schema: 'bse_data',
    table: 'mutual_fund_signals',
    operations: ['SELECT'],
    columnsRead: ['*'],
    columnsWritten: [],
  },
  {
    schema: 'bse_data',
    table: 'insurance_plans',
    operations: ['SELECT'],
    columnsRead: ['*'],
    columnsWritten: [],
  },
  {
    schema: 'bse_data',
    table: 'ipo_signals',
    operations: ['SELECT'],
    columnsRead: ['*'],
    columnsWritten: [],
  },
  {
    schema: 'bse_data',
    table: 'finance_news',
    operations: ['SELECT'],
    columnsRead: ['*'],
    columnsWritten: [],
    filters: ['id=eq'],
    notes: 'Ordered by updated_at descending, limit 10. WEB-ONLY fallback: .eq("id", id).maybeSingle() (requires id column)',
  },
  {
    schema: 'bse_data',
    table: 'blogs',
    operations: ['SELECT'],
    columnsRead: ['*'],
    columnsWritten: [],
    filters: ['id=eq'],
    notes: 'Ordered by updated_at descending, limit 10. WEB-ONLY fallback: .eq("id", id).maybeSingle() (requires id column)',
  },
  {
    schema: 'bse_data',
    table: 'live_metal_rates',
    operations: ['SELECT'],
    columnsRead: ['purity', 'price', 'updated_at'],
    columnsWritten: [],
  },
  {
    schema: 'bse_data',
    table: 'user_subscriptions',
    operations: ['SELECT'],
    columnsRead: ['*'],
    columnsWritten: [],
    filters: ['user_id=eq'],
  },

  // --- core schema ---
  {
    schema: 'core',
    table: 'financial_fitness_scores',
    operations: ['SELECT'],
    columnsRead: [
      'user_id',
      'income_pillar_score',
      'expense_pillar_score',
      'savings_pillar_score',
      'protection_pillar_score',
      'investment_pillar_score',
      'global_fitness_score',
      'updated_at',
    ],
    columnsWritten: [],
    filters: ['user_id=eq'],
  },
  {
    schema: 'core',
    table: 'income_scores',
    operations: ['SELECT'],
    columnsRead: [
      'user_id',
      'active_income_score',
      'passive_income_score',
      'total_income_score',
      'updated_at',
    ],
    columnsWritten: [],
    filters: ['user_id=eq'],
  },
  {
    schema: 'core',
    table: 'expense_scores',
    operations: ['SELECT'],
    columnsRead: [
      'user_id',
      'savings_score',
      'flexible_score',
      'fixed_score',
      'total_expense_score',
      'discipline_message',
      'updated_at',
    ],
    columnsWritten: [],
    filters: ['user_id=eq'],
  },
  {
    schema: 'core',
    table: 'savings_scores',
    operations: ['SELECT'],
    columnsRead: [
      'user_id',
      'ef_target_amount',
      'ef_current_estimated',
      'total_savings_score',
      'updated_at',
    ],
    columnsWritten: [],
    filters: ['user_id=eq'],
  },
  {
    schema: 'core',
    table: 'protection_scores',
    operations: ['SELECT'],
    columnsRead: [
      'user_id',
      'term_score',
      'health_score',
      'total_protection_score',
      'term_gap',
      'health_gap',
      'updated_at',
    ],
    columnsWritten: [],
    filters: ['user_id=eq'],
  },
  {
    schema: 'core',
    table: 'investment_scores',
    operations: ['SELECT'],
    columnsRead: [
      'user_id',
      'equity_score',
      'asset_balance_score',
      'sip_score',
      'total_investment_score',
      'sip_gap',
      'total_investment_amount',
      'updated_at',
    ],
    columnsWritten: [],
    filters: ['user_id=eq'],
  },
  {
    schema: 'core',
    table: 'corporate_analytics',
    operations: ['SELECT'],
    columnsRead: [
      'company_name',
      'total_headcount',
      'avg_workforce_score',
      'critical_risk_count',
      'high_risk_count',
      'watchlist_count',
      'stable_count',
      'dept_metrics',
      'paycheck_dependency_pct',
      'no_emergency_fund_pct',
    ],
    columnsWritten: [],
    filters: ['company_name=eq'],
  },
  {
    schema: 'core',
    table: 'workforce_intelligence',
    operations: ['SELECT'],
    columnsRead: ['*'],
    columnsWritten: [],
    filters: ['company_name=eq'],
  },
];

export interface RpcContract {
  name: string;
  schema: SchemaName;
  params: Record<string, string>;
  returns: string;
  notes?: string;
}

export const RPC_CONTRACTS: RpcContract[] = [
  {
    name: 'stack_subscription',
    schema: 'public',
    params: {
      p_user_id: 'UUID',
      p_months_to_add: 'INT',
    },
    returns: 'void',
    notes: 'Stacks duration to user_subscriptions under bse_data',
  },
];

export const AUTH_SIGN_UP_METADATA_KEYS = ['fullName', 'mobile', 'plan'] as const;

export const ONBOARDING_PROFILE_KEYS = [
  'monthly_income',
  'monthly_expenses',
  'equity_pct',
  'gold_pct',
  'debt_pct',
  'term_cover',
  'health_cover',
  'liquidity_fund',
  'income_type',
  'stability_months',
  'yoy_growth_pct',
  'source_count',
  'year',
  'month',
] as const;

export const MASTER_DATA_PROFILE_KEYS = [
  // Consent
  'consent_given',
  'consent_timestamp',
  // Basic Identity
  'fullName',
  'mobile',
  'email',
  'dob',
  'gender',
  'city',
  'state',
  'employmentType',
  'dependents',
  'maritalStatus',
  'pan',
  'employer',
  'department',
  'designation',
  // Income Pillar
  'monthlyActiveIncome',
  'incomeFrequency',
  'cityTier',
  'hasPassiveIncome',
  'passiveIncomeAmount',
  'passiveIncomeSource',
  'salaryBreakup',
  // Expenses Pillar
  'monthlyFixedExpenses',
  'monthlyVariableExpenses',
  'totalEmi',
  'activeLoans',
  'monthlySavings',
  'loanDetails',
  'expenseCategoryBreakdown',
  // Emergency Fund Pillar
  'hasEmergencyFund',
  'emergencyFundCurrent',
  'emergencyFundParked',
  // Insurance Pillar
  'hasHealthInsurance',
  'healthCover',
  'isFamilyCovered',
  'hasLifeInsurance',
  'lifeCover',
  'hasTermPlan',
  'termCover',
  'insurerName',
  'policyNumber',
  'policyExpiry',
  'hasCriticalIllness',
  'hasAccidentalCover',
  // Investment Pillar
  'doesInvest',
  'totalEquityInvestments',
  'totalDebtInvestments',
  'totalGoldInvestments',
  'totalRealEstateInvestments',
  'stockSips',
  'mfSips',
  'goldSips',
  'monthlySipEquity',
  'monthlySipDebt',
  'monthlySipGold',
  'riskAppetite',
  'primaryInvestmentGoal',
  'existingPortfolio',
  'equityExposurePct',
] as const;

export const WEEKLY_LOGS_COLUMNS = [
  'id',
  'user_id',
  'week_index',
  'log_month',
  'log_year',
  'status',
  'fixed_status',
  'flexible_status',
  'savings_status',
  'spent_fixed',
  'spent_flexible',
  'spent_savings',
  'updated_at',
] as const;

export const WEB_SESSIONS_COLUMNS = [
  'session_token',
  'user_id',
  'access_token',
  'refresh_token',
  'status',
  'created_at',
  'authenticated_at',
] as const;

export const SHARED_PREFERENCES_KEYS = [
  'theme_mode',
  'jwt_token',
  'user_name',
  'user_email',
  'user_plan',
  'master_profile_data',
  'user_xp',
  'user_streak',
  'user_streak_last_week',
  'user_streak_last_year',
  'last_score',
  'baseline_score',
  'mastered_pillars',
  'unlocked_badges',
  'premium_last_sync',
  'user_first_login_ts',
  'reminder_notifications_enabled',
  'app_lock_enabled',
  'local_expense_score',
  'ef_prev_current',
] as const;
