import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  SCHEMAS,
  SCHEMA_TABLES,
  TABLE_CONTRACTS,
  RPC_CONTRACTS,
  AUTH_SIGN_UP_METADATA_KEYS,
  ONBOARDING_PROFILE_KEYS,
  MASTER_DATA_PROFILE_KEYS,
  WEEKLY_LOGS_COLUMNS,
  WEB_SESSIONS_COLUMNS,
  SHARED_PREFERENCES_KEYS,
} from '../lib/schemaContract';
// @ts-expect-error - verify-contract.mjs is an executable ESM script with its own type declaration
import { verifyContract } from '../../scripts/verify-contract.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('src/lib/schemaContract export integrity', () => {
  it('exports all 3 required schemas', () => {
    expect(SCHEMAS).toEqual(['public', 'bse_data', 'core']);
  });

  it('exports the exact tables in public schema', () => {
    expect(SCHEMA_TABLES.public).toEqual([
      'market_sentiment',
      'master_profiles',
      'weekly_logs',
      'app_logs',
      'web_sessions',
      'corporate_admins',
    ]);
  });

  it('exports the exact tables in bse_data schema', () => {
    expect(SCHEMA_TABLES.bse_data).toEqual([
      'stock_signals',
      'mutual_fund_signals',
      'insurance_plans',
      'ipo_signals',
      'finance_news',
      'blogs',
      'live_metal_rates',
      'user_subscriptions',
    ]);
  });

  it('exports the exact tables in core schema', () => {
    expect(SCHEMA_TABLES.core).toEqual([
      'financial_fitness_scores',
      'income_scores',
      'expense_scores',
      'savings_scores',
      'protection_scores',
      'investment_scores',
      'corporate_analytics',
      'workforce_intelligence',
    ]);
  });

  it('contains TABLE_CONTRACTS covering every schema table', () => {
    const totalExpectedTables =
      SCHEMA_TABLES.public.length +
      SCHEMA_TABLES.bse_data.length +
      SCHEMA_TABLES.core.length;

    expect(TABLE_CONTRACTS.length).toBe(totalExpectedTables);

    for (const contract of TABLE_CONTRACTS) {
      expect(SCHEMA_TABLES[contract.schema]).toContain(contract.table);
      expect(contract.operations.length).toBeGreaterThan(0);
    }
  });

  it('exports stack_subscription RPC contract in public schema', () => {
    const stackRpc = RPC_CONTRACTS.find((r) => r.name === 'stack_subscription');
    expect(stackRpc).toBeDefined();
    expect(stackRpc?.schema).toBe('public');
    expect(stackRpc?.params).toEqual({
      p_user_id: 'UUID',
      p_months_to_add: 'INT',
    });
  });

  it('exports auth signUp metadata keys matching register_screen.dart', () => {
    expect(AUTH_SIGN_UP_METADATA_KEYS).toEqual(['fullName', 'mobile', 'plan']);
  });

  it('exports onboarding wizard profile keys matching onboarding_screen.dart', () => {
    expect(ONBOARDING_PROFILE_KEYS.length).toBe(14);
    expect(ONBOARDING_PROFILE_KEYS).toContain('monthly_income');
    expect(ONBOARDING_PROFILE_KEYS).toContain('monthly_expenses');
    expect(ONBOARDING_PROFILE_KEYS).toContain('equity_pct');
    expect(ONBOARDING_PROFILE_KEYS).toContain('gold_pct');
    expect(ONBOARDING_PROFILE_KEYS).toContain('debt_pct');
    expect(ONBOARDING_PROFILE_KEYS).toContain('term_cover');
    expect(ONBOARDING_PROFILE_KEYS).toContain('health_cover');
    expect(ONBOARDING_PROFILE_KEYS).toContain('liquidity_fund');
  });

  it('exports 52 master data profile keys + consent flags matching master_data_screen.dart', () => {
    expect(MASTER_DATA_PROFILE_KEYS).toContain('consent_given');
    expect(MASTER_DATA_PROFILE_KEYS).toContain('consent_timestamp');
    expect(MASTER_DATA_PROFILE_KEYS).toContain('fullName');
    expect(MASTER_DATA_PROFILE_KEYS).toContain('monthlyActiveIncome');
    expect(MASTER_DATA_PROFILE_KEYS).toContain('monthlyFixedExpenses');
    expect(MASTER_DATA_PROFILE_KEYS).toContain('emergencyFundCurrent');
    expect(MASTER_DATA_PROFILE_KEYS).toContain('healthCover');
    expect(MASTER_DATA_PROFILE_KEYS).toContain('doesInvest');
    expect(MASTER_DATA_PROFILE_KEYS).toContain('stockSips');
    expect(MASTER_DATA_PROFILE_KEYS).toContain('mfSips');
    expect(MASTER_DATA_PROFILE_KEYS).toContain('goldSips');
  });

  it('exports weekly_logs columns matching api_service.dart and SQL', () => {
    expect(WEEKLY_LOGS_COLUMNS).toEqual([
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
    ]);
  });

  it('exports web_sessions columns matching QrLoginPage and api_service.dart', () => {
    expect(WEB_SESSIONS_COLUMNS).toEqual([
      'session_token',
      'user_id',
      'access_token',
      'refresh_token',
      'status',
      'created_at',
      'authenticated_at',
    ]);
  });

  it('exports SharedPreferences keys worth mirroring on web', () => {
    expect(SHARED_PREFERENCES_KEYS).toContain('theme_mode');
    expect(SHARED_PREFERENCES_KEYS).toContain('user_plan');
    expect(SHARED_PREFERENCES_KEYS).toContain('jwt_token');
    expect(SHARED_PREFERENCES_KEYS).toContain('user_xp');
    expect(SHARED_PREFERENCES_KEYS).toContain('user_streak');
  });
});

describe('scripts/verify-contract verification logic', () => {
  const rootDir = path.resolve(__dirname, '../..');
  const refDir = path.join(rootDir, 'reference/moneymapper_app/lib');
  const contractPath = path.join(rootDir, 'src/lib/schemaContract.ts');
  const scriptPath = path.join(rootDir, 'scripts/verify-contract.mjs');

  it('passes positive verification against live reference code with scanned items > 0', () => {
    const result = verifyContract({
      referenceDir: refDir,
      contractPath: contractPath,
    });

    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.dartFilesCount).toBeGreaterThan(0);
    expect(result.tablesScannedCount).toBeGreaterThan(0);
    expect(result.columnsScannedCount).toBeGreaterThan(0);
    expect(result.rpcsScannedCount).toBeGreaterThan(0);
    expect(result.scannedTables).toContain('public.master_profiles');
    expect(result.scannedTables).toContain('bse_data.live_metal_rates');
    expect(result.scannedTables).toContain('core.financial_fitness_scores');
  });

  it('runs CLI verify script and exits with code 0', () => {
    const run = spawnSync('node', [scriptPath], {
      cwd: rootDir,
      encoding: 'utf-8',
    });

    expect(run.status).toBe(0);
    expect(run.stdout).toContain('CONTRACT VERIFIED: ZERO DRIFT!');
  });

  it('NEGATIVE TEST 1: fails when a real table is removed from contract', () => {
    const validContent = fs.readFileSync(contractPath, 'utf-8');
    // Remove 'master_profiles' from contract
    const brokenContent = validContent.replace("'master_profiles',", '');

    const tempFile = path.join(os.tmpdir(), `test-missing-table-${Date.now()}.ts`);
    fs.writeFileSync(tempFile, brokenContent, 'utf-8');

    try {
      // 1. Programmatic verify logic check
      const result = verifyContract({
        referenceDir: refDir,
        contractPath: tempFile,
      });

      expect(result.passed).toBe(false);
      expect(result.errors.some((err: string) => err.includes('master_profiles'))).toBe(true);

      // 2. CLI exit code 1 check
      const run = spawnSync('node', [scriptPath, tempFile], {
        cwd: rootDir,
        encoding: 'utf-8',
      });

      expect(run.status).toBe(1);
      expect(run.stderr).toContain('VERIFICATION FAILED: Contract Drift Detected!');
      expect(run.stderr).toContain('master_profiles');
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });

  it('NEGATIVE TEST 2: fails when a phantom non-existent table is added to contract', () => {
    const validContent = fs.readFileSync(contractPath, 'utf-8');
    // Add a phantom table 'phantom_bogus_table' to public schema
    const brokenContent = validContent.replace(
      "'corporate_admins',",
      "'corporate_admins',\n    'phantom_bogus_table',"
    );

    const tempFile = path.join(os.tmpdir(), `test-phantom-table-${Date.now()}.ts`);
    fs.writeFileSync(tempFile, brokenContent, 'utf-8');

    try {
      // 1. Programmatic verify logic check
      const result = verifyContract({
        referenceDir: refDir,
        contractPath: tempFile,
      });

      expect(result.passed).toBe(false);
      expect(result.errors.some((err: string) => err.includes('phantom_bogus_table'))).toBe(true);

      // 2. CLI exit code 1 check
      const run = spawnSync('node', [scriptPath, tempFile], {
        cwd: rootDir,
        encoding: 'utf-8',
      });

      expect(run.status).toBe(1);
      expect(run.stderr).toContain('VERIFICATION FAILED: Contract Drift Detected!');
      expect(run.stderr).toContain('phantom_bogus_table');
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });
});
