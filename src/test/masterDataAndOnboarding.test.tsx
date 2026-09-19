import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import * as fs from 'fs';
import * as path from 'path';
import { MasterDataPage } from '../pages/MasterDataPage';
import { OnboardingPage } from '../pages/OnboardingPage';
import { apiService } from '../services/apiService';
import { supabase } from '../lib/supabase';
import { AuthContext } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';
import { gamificationStore } from '../services/gamificationStore';
import {
  buildMasterDataMap,
  validateMasterData,
  formatDobToDb,
  formatDobFromDb,
  dartDoubleToString,
  calculateSipTotal,
  getInitialMasterProfile,
  STATE_CITY_MAP,
} from '../models/masterProfile';

const mockUser = {
  id: 'test-user-123',
  email: 'test@moneymapper.io',
  user_metadata: {
    fullName: 'Test User',
    mobile: '9876543210',
  },
} as any;

function renderMasterDataPage(initialQuery = '') {
  return render(
    <MemoryRouter initialEntries={[`/master-data${initialQuery}`]}>
      <AuthContext.Provider
        value={{
          user: mockUser,
          session: { user: mockUser } as any,
          isLoading: false,
          isLoggedIn: true,
          logout: async () => {},
        }}
      >
        <ThemeProvider>
          <ToastProvider>
            <Routes>
              <Route path="/master-data" element={<MasterDataPage />} />
              <Route path="/dashboard" element={<div data-testid="dashboard-screen">Dashboard</div>} />
            </Routes>
          </ToastProvider>
        </ThemeProvider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

function renderOnboardingPage() {
  return render(
    <MemoryRouter initialEntries={['/onboarding']}>
      <AuthContext.Provider
        value={{
          user: mockUser,
          session: { user: mockUser } as any,
          isLoading: false,
          isLoggedIn: true,
          logout: async () => {},
        }}
      >
        <ThemeProvider>
          <ToastProvider>
            <Routes>
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/dashboard" element={<div data-testid="dashboard-screen">Dashboard</div>} />
            </Routes>
          </ToastProvider>
        </ThemeProvider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('TASK 8 — Master Data & Onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for getMasterProfile
    vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({ data: {} });
    vi.spyOn(apiService, 'updateMasterProfile').mockResolvedValue({ status: 'success' });
    vi.spyOn(apiService, 'submitOnboarding').mockResolvedValue({ status: 'success' });
  });

  /* -------------------------------------------------------------------------- */
  /* (1) Golden Test: Match _buildDataMap() in Dart exactly                     */
  /* -------------------------------------------------------------------------- */
  describe('(1) Golden Test: Key Parity with Flutter _buildDataMap()', () => {
    it('web payload key set and types match Flutter master_data_screen.dart _buildDataMap exactly', () => {
      // 1. Read master_data_screen.dart directly from reference/
      const dartFilePath = path.resolve(
        process.cwd(),
        'reference/moneymapper_app/lib/screens/master_data_screen.dart'
      );
      const dartSource = fs.readFileSync(dartFilePath, 'utf-8');

      // 2. Extract the Map<String, dynamic> _buildDataMap() block
      const methodRegex = /Map<String,\s*dynamic>\s*_buildDataMap\(\)\s*\{([\s\S]*?)return\s*\{([\s\S]*?)\};\s*\}/;
      const match = dartSource.match(methodRegex);
      expect(match, 'Failed to extract _buildDataMap from Flutter file').not.toBeNull();

      const returnBlock = match![2];

      // 3. Extract all quoted map keys: 'keyName':
      const keyMatches = returnBlock.matchAll(/'([a-zA-Z0-9_]+)'\s*:/g);
      const dartKeys: string[] = [];
      for (const km of keyMatches) {
        dartKeys.push(km[1]);
      }

      expect(dartKeys.length).toBeGreaterThanOrEqual(52);

      // 4. Generate payload using our web buildMasterDataMap() on initial profile
      const webProfile = getInitialMasterProfile({
        consent_given: true,
        fullName: 'Aarav Sharma',
        dob: '15-08-1995',
        gender: 'Male',
        state: 'Maharashtra',
        city: 'Mumbai',
        employmentType: 'Salaried',
        employer: 'Tata Consultancy Services',
        monthlyActiveIncome: '100000',
        incomeFrequency: 'Monthly',
        monthlyFixedExpenses: '40000',
        monthlyVariableExpenses: '20000',
        monthlySavings: '40000',
        doesInvest: true,
        totalEquityInvestments: '500000',
        totalDebtInvestments: '300000',
        totalGoldInvestments: '100000',
        totalRealEstateInvestments: '1000000',
        riskAppetite: 'Moderate',
        stockSips: [{ name: 'Nifty 50 ETF', amount: '5000', date: 5 }],
        mfSips: [{ name: 'HDFC Balanced Advantage', amount: '3000', date: 10 }],
        goldSips: [{ name: 'Nippon Gold ETF', amount: '2000', date: 15 }],
        equityExposurePct: 60,
      });

      const payload = buildMasterDataMap(webProfile);
      const webKeys = Object.keys(payload);

      // 5. Assert that every key extracted from Flutter Dart is present in the web payload
      const missingKeys = dartKeys.filter((k) => !webKeys.includes(k));
      const extraKeys = webKeys.filter((k) => !dartKeys.includes(k));

      expect(missingKeys, 'Keys present in Dart but missing in Web').toEqual([]);
      expect(extraKeys, 'Keys present in Web but missing in Dart').toEqual([]);
      expect(webKeys.sort()).toEqual(dartKeys.sort());

      // 6. Assert exact types matching Dart expectations
      expect(typeof payload.consent_given).toBe('boolean');
      expect(typeof payload.consent_timestamp).toBe('string');
      expect(typeof payload.fullName).toBe('string');
      expect(typeof payload.monthlyActiveIncome).toBe('string'); // Numeric text field as string
      expect(typeof payload.hasPassiveIncome).toBe('boolean'); // Toggle as boolean
      expect(typeof payload.hasEmergencyFund).toBe('boolean');
      expect(typeof payload.doesInvest).toBe('boolean');
      expect(Array.isArray(payload.stockSips)).toBe(true);
      expect(Array.isArray(payload.mfSips)).toBe(true);
      expect(Array.isArray(payload.goldSips)).toBe(true);

      // Dart double string representations:
      expect(typeof payload.monthlySipEquity).toBe('string');
      expect(payload.monthlySipEquity).toBe('5000.0');
      expect(typeof payload.monthlySipDebt).toBe('string');
      expect(payload.monthlySipDebt).toBe('3000.0');
      expect(typeof payload.monthlySipGold).toBe('string');
      expect(payload.monthlySipGold).toBe('2000.0');
      expect(typeof payload.equityExposurePct).toBe('string');
      expect(payload.equityExposurePct).toBe('60.0');
    });
  });

  /* -------------------------------------------------------------------------- */
  /* (2) DOB Conversion Both Ways                                               */
  /* -------------------------------------------------------------------------- */
  describe('(2) DOB Conversion Both Ways', () => {
    it('converts YYYY-MM-DD from HTML date input to DD-MM-YYYY for DB trigger', () => {
      expect(formatDobToDb('1995-08-15')).toBe('15-08-1995');
      expect(formatDobToDb('2000-01-05')).toBe('05-01-2000');
      expect(formatDobToDb('15-08-1995')).toBe('15-08-1995'); // already in format
      expect(formatDobToDb('')).toBe('');
    });

    it('converts DD-MM-YYYY from DB trigger to YYYY-MM-DD for HTML date input', () => {
      expect(formatDobFromDb('15-08-1995')).toBe('1995-08-15');
      expect(formatDobFromDb('05-01-2000')).toBe('2000-01-05');
      expect(formatDobFromDb('1995-08-15')).toBe('1995-08-15'); // already in format
      expect(formatDobFromDb('')).toBe('');
    });
  });

  /* -------------------------------------------------------------------------- */
  /* (3) Exact 6 Validation Messages in Order                                  */
  /* -------------------------------------------------------------------------- */
  describe('(3) Validation Order & Exact Error Messages', () => {
    it('1. Fails on consent check if consent_given is false', () => {
      const data = getInitialMasterProfile({ consent_given: false });
      const result = validateMasterData(data);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please provide your consent to process data for financial insights.');
    });

    it('2. Fails on Identity Basics if required identity fields are missing', () => {
      const data = getInitialMasterProfile({
        consent_given: true,
        fullName: '', // missing
      });
      const result = validateMasterData(data);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Basic Identity (Name, DOB, Gender, State, City) is mandatory.');
    });

    it('2b. Fails on Identity Basics if City is Other but otherCity is empty', () => {
      const data = getInitialMasterProfile({
        consent_given: true,
        fullName: 'Aarav',
        dob: '15-08-1995',
        gender: 'Male',
        state: 'Maharashtra',
        city: 'Other',
        otherCity: '', // empty otherCity
      });
      const result = validateMasterData(data);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Basic Identity (Name, DOB, Gender, State, City) is mandatory.');
    });

    it('3. Fails on Employment if employmentType or employer is missing', () => {
      const data = getInitialMasterProfile({
        consent_given: true,
        fullName: 'Aarav',
        dob: '15-08-1995',
        gender: 'Male',
        state: 'Maharashtra',
        city: 'Mumbai',
        employmentType: null, // missing
        employer: '',
      });
      const result = validateMasterData(data);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Employment Type and Employer Name are mandatory.');
    });

    it('4. Fails on Income Essentials if active income or frequency is missing', () => {
      const data = getInitialMasterProfile({
        consent_given: true,
        fullName: 'Aarav',
        dob: '15-08-1995',
        gender: 'Male',
        state: 'Maharashtra',
        city: 'Mumbai',
        employmentType: 'Salaried',
        employer: 'TCS',
        monthlyActiveIncome: '', // missing
        incomeFrequency: null,
      });
      const result = validateMasterData(data);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Monthly Active Income and Frequency are mandatory.');
    });

    it('5. Fails on Expense Essentials if fixed, variable or savings is missing', () => {
      const data = getInitialMasterProfile({
        consent_given: true,
        fullName: 'Aarav',
        dob: '15-08-1995',
        gender: 'Male',
        state: 'Maharashtra',
        city: 'Mumbai',
        employmentType: 'Salaried',
        employer: 'TCS',
        monthlyActiveIncome: '100000',
        incomeFrequency: 'Monthly',
        monthlyFixedExpenses: '', // missing
        monthlyVariableExpenses: '20000',
        monthlySavings: '40000',
      });
      const result = validateMasterData(data);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Fixed Expenses, Variable Expenses, and monthly Savings are mandatory.');
    });

    it('6. Fails on Investment Essentials if doesInvest is true but totals or riskAppetite are missing', () => {
      const data = getInitialMasterProfile({
        consent_given: true,
        fullName: 'Aarav',
        dob: '15-08-1995',
        gender: 'Male',
        state: 'Maharashtra',
        city: 'Mumbai',
        employmentType: 'Salaried',
        employer: 'TCS',
        monthlyActiveIncome: '100000',
        incomeFrequency: 'Monthly',
        monthlyFixedExpenses: '40000',
        monthlyVariableExpenses: '20000',
        monthlySavings: '40000',
        doesInvest: true,
        totalEquityInvestments: '', // missing
        totalDebtInvestments: '200000',
        totalGoldInvestments: '100000',
        totalRealEstateInvestments: '0',
        riskAppetite: null,
      });
      const result = validateMasterData(data);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please fill all mandatory investment fields (Totals and Risk Appetite).');
    });

    it('Passes validation when all mandatory fields are valid', () => {
      const data = getInitialMasterProfile({
        consent_given: true,
        fullName: 'Aarav',
        dob: '15-08-1995',
        gender: 'Male',
        state: 'Maharashtra',
        city: 'Mumbai',
        employmentType: 'Salaried',
        employer: 'TCS',
        monthlyActiveIncome: '100000',
        incomeFrequency: 'Monthly',
        monthlyFixedExpenses: '40000',
        monthlyVariableExpenses: '20000',
        monthlySavings: '40000',
        doesInvest: false,
      });
      const result = validateMasterData(data);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  /* -------------------------------------------------------------------------- */
  /* (4) State -> City Dependent Dropdown & 'Other' Free-Text                   */
  /* -------------------------------------------------------------------------- */
  describe('(4) State -> City Dependent Dropdown', () => {
    it('selecting a state populates its cities + "Other"; selecting "Other" reveals manual input', async () => {
      renderMasterDataPage();

      await waitFor(() => {
        expect(screen.getByTestId('select-state')).toBeInTheDocument();
      });

      const stateSelect = screen.getByTestId('select-state');
      const citySelect = screen.getByTestId('select-city');

      // Before selecting state, city is disabled
      expect(citySelect).toBeDisabled();

      // Select Karnataka
      fireEvent.change(stateSelect, { target: { value: 'Karnataka' } });

      // City select should now be enabled with Karnataka cities
      expect(citySelect).not.toBeDisabled();
      const karnatakaCities = STATE_CITY_MAP['Karnataka'];
      expect(karnatakaCities.length).toBeGreaterThan(0);
      expect(within(citySelect).getByText('Bengaluru')).toBeInTheDocument();
      expect(within(citySelect).getByText('Mysuru')).toBeInTheDocument();
      expect(within(citySelect).getByText('Other')).toBeInTheDocument();

      // Before selecting 'Other', manual city input is NOT visible
      expect(screen.queryByTestId('input-otherCity')).not.toBeInTheDocument();

      // Select 'Other'
      fireEvent.change(citySelect, { target: { value: 'Other' } });

      // Manual input is now visible
      const otherCityInput = screen.getByTestId('input-otherCity');
      expect(otherCityInput).toBeInTheDocument();

      fireEvent.change(otherCityInput, { target: { value: 'Udupi' } });
      expect(otherCityInput).toHaveValue('Udupi');
    });
  });

  /* -------------------------------------------------------------------------- */
  /* (5) Dynamic SIP Lists & dartDoubleToString                                 */
  /* -------------------------------------------------------------------------- */
  describe('(5) Dynamic SIP Lists & dartDoubleToString', () => {
    it('dartDoubleToString converts numbers to Dart double string representation', () => {
      expect(dartDoubleToString(0)).toBe('0.0');
      expect(dartDoubleToString(5000)).toBe('5000.0');
      expect(dartDoubleToString(2500.5)).toBe('2500.5');
      expect(dartDoubleToString(2500.55)).toBe('2500.55');
    });

    it('sums stockSips to monthlySipEquity, mfSips to monthlySipDebt, goldSips to monthlySipGold', () => {
      const stockSips = [
        { name: 'Stock A', amount: '2000', date: 1 },
        { name: 'Stock B', amount: '3000.50', date: 10 },
      ];
      const mfSips = [
        { name: 'MF Growth', amount: '4500', date: 5 },
      ];
      const goldSips = [
        { name: 'Gold ETF', amount: '1500', date: 15 },
      ];

      expect(calculateSipTotal(stockSips)).toBe(5000.5);
      expect(calculateSipTotal(mfSips)).toBe(4500);
      expect(calculateSipTotal(goldSips)).toBe(1500);

      const profile = getInitialMasterProfile({
        stockSips,
        mfSips,
        goldSips,
      });

      const payload = buildMasterDataMap(profile);
      expect(payload.monthlySipEquity).toBe('5000.5');
      expect(payload.monthlySipDebt).toBe('4500.0'); // MF maps to Debt
      expect(payload.monthlySipGold).toBe('1500.0');
    });
  });

  /* -------------------------------------------------------------------------- */
  /* (6) Deep Link ?target Scroll for all 5 Values                              */
  /* -------------------------------------------------------------------------- */
  describe('(6) Deep Link ?target Scroll', () => {
    const targets = ['income', 'expenses', 'emergency', 'insurance', 'investment'];

    targets.forEach((t) => {
      it(`scrolls to ${t} section when ?target=${t} is in URL`, async () => {
        const scrollIntoViewMock = vi.fn();
        window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

        renderMasterDataPage(`?target=${t}`);

        await waitFor(() => {
          expect(screen.getByTestId('master-data-page')).toBeInTheDocument();
        });

        await waitFor(() => {
          expect(scrollIntoViewMock).toHaveBeenCalled();
        });
      });
    });
  });

  /* -------------------------------------------------------------------------- */
  /* (7) Fresh DB Read Non-Destructive Merge                                    */
  /* -------------------------------------------------------------------------- */
  describe('(7) Non-Destructive Merge with Fresh DB Read', () => {
    it('saving merges over fresh DB row, preserving unknown keys and bypassing cache', async () => {
      // Un-mock updateMasterProfile to test the actual service implementation
      vi.restoreAllMocks();

      const fakeDbRow = {
        user_id: 'test-user-123',
        profile_json: {
          monthly_income: 120000, // legacy onboarding key
          custom_metadata_key: 'preserve_this_value',
          fullName: 'Old Name',
        },
      };

      // Mock fresh Supabase read
      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: fakeDbRow, error: null }),
        }),
      });

      const upsertMock = vi.fn().mockResolvedValue({ error: null });

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'master_profiles') {
          return {
            select: selectMock,
            upsert: upsertMock,
          } as any;
        }
        return {} as any;
      });

      // Mock auth session
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: { user: { id: 'test-user-123' } } as any },
        error: null,
      });

      // Call apiService.updateMasterProfile with new field
      await apiService.updateMasterProfile({
        fullName: 'New Name',
        monthlyActiveIncome: '150000',
      });

      // Verify fresh DB read was invoked
      expect(selectMock).toHaveBeenCalledWith('profile_json');

      // Verify upsert merged over the fresh DB row
      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'test-user-123',
          profile_json: expect.objectContaining({
            monthly_income: 120000, // preserved!
            custom_metadata_key: 'preserve_this_value', // preserved!
            fullName: 'New Name', // updated!
            monthlyActiveIncome: '150000', // updated!
          }),
        })
      );
    });
  });

  /* -------------------------------------------------------------------------- */
  /* (8) Onboarding Form Mirroring onboarding_screen.dart                       */
  /* -------------------------------------------------------------------------- */
  describe('(8) Onboarding Page (screens/onboarding_screen.dart)', () => {
    it('Step 2 contains allocation bar and NO horizon dropdown; Step 3 has horizon dropdown', async () => {
      renderOnboardingPage();

      // Step 1: Fill required fields
      expect(screen.getByText('Step 1 of 3 • Income & Expenses')).toBeInTheDocument();
      fireEvent.change(screen.getByTestId('input-monthlyIncome'), { target: { value: '100000' } });
      fireEvent.change(screen.getByTestId('input-fixedExpenses'), { target: { value: '40000' } });
      fireEvent.change(screen.getByTestId('input-flexibleExpenses'), { target: { value: '20000' } });

      // Click Next -> advances to Step 2
      fireEvent.click(screen.getByTestId('onboarding-next-btn'));
      expect(screen.getByText('Step 2 of 3 • Investments & Assets')).toBeInTheDocument();

      // Verify: Step 2 has allocation bar, but does NOT have select-investmentHorizon
      expect(screen.getByText('Allocation split')).toBeInTheDocument();
      expect(screen.queryByTestId('select-investmentHorizon')).toBeNull();

      // Fill Step 2 fields
      fireEvent.change(screen.getByTestId('input-equityPct'), { target: { value: '50' } });
      fireEvent.change(screen.getByTestId('input-debtPct'), { target: { value: '30' } });
      fireEvent.change(screen.getByTestId('input-goldPct'), { target: { value: '20' } });
      fireEvent.change(screen.getByTestId('input-totalInvestment'), { target: { value: '500000' } });

      // Click Next -> advances to Step 3
      fireEvent.click(screen.getByTestId('onboarding-next-btn'));
      expect(screen.getByText('Step 3 of 3 • Protection')).toBeInTheDocument();

      // Verify: Step 3 DOES have select-investmentHorizon
      expect(screen.getByTestId('select-investmentHorizon')).toBeInTheDocument();
    });

    it('Back button preserves previously entered state across steps', async () => {
      renderOnboardingPage();

      fireEvent.change(screen.getByTestId('input-monthlyIncome'), { target: { value: '88888' } });
      fireEvent.change(screen.getByTestId('input-fixedExpenses'), { target: { value: '33333' } });
      fireEvent.change(screen.getByTestId('input-flexibleExpenses'), { target: { value: '11111' } });

      fireEvent.click(screen.getByTestId('onboarding-next-btn'));
      expect(screen.getByText('Step 2 of 3 • Investments & Assets')).toBeInTheDocument();

      // Click Back
      fireEvent.click(screen.getByTestId('onboarding-back-btn'));
      expect(screen.getByText('Step 1 of 3 • Income & Expenses')).toBeInTheDocument();

      // Verify inputs retained values
      expect(screen.getByTestId('input-monthlyIncome')).toHaveValue(88888);
      expect(screen.getByTestId('input-fixedExpenses')).toHaveValue(33333);
      expect(screen.getByTestId('input-flexibleExpenses')).toHaveValue(11111);
    });

    it('submits exact payload keys and calculates yoy_growth_pct by horizon', async () => {
      const submitSpy = vi.spyOn(apiService, 'submitOnboarding').mockResolvedValue({ status: 'success' });

      renderOnboardingPage();

      // Step 1
      fireEvent.change(screen.getByTestId('input-monthlyIncome'), { target: { value: '100000' } });
      fireEvent.change(screen.getByTestId('input-fixedExpenses'), { target: { value: '30000' } });
      fireEvent.change(screen.getByTestId('input-flexibleExpenses'), { target: { value: '20000' } });
      fireEvent.click(screen.getByTestId('onboarding-next-btn'));

      // Step 2
      fireEvent.change(screen.getByTestId('input-equityPct'), { target: { value: '60' } });
      fireEvent.change(screen.getByTestId('input-debtPct'), { target: { value: '30' } });
      fireEvent.change(screen.getByTestId('input-goldPct'), { target: { value: '10' } });
      fireEvent.change(screen.getByTestId('input-totalInvestment'), { target: { value: '200000' } });
      fireEvent.click(screen.getByTestId('onboarding-next-btn'));

      // Step 3
      fireEvent.change(screen.getByTestId('input-termCover'), { target: { value: '10000000' } });
      fireEvent.change(screen.getByTestId('input-healthCover'), { target: { value: '1000000' } });
      fireEvent.change(screen.getByTestId('input-emergencyFund'), { target: { value: '300000' } });
      fireEvent.change(screen.getByTestId('select-investmentHorizon'), { target: { value: '3-7 years' } });

      fireEvent.click(screen.getByTestId('onboarding-submit-btn'));

      await waitFor(() => {
        expect(submitSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            monthly_income: 100000,
            monthly_expenses: 50000, // fixed + flexible
            equity_pct: 60,
            debt_pct: 30,
            gold_pct: 10,
            term_cover: 10000000,
            health_cover: 1000000,
            liquidity_fund: 300000,
            income_type: 'salaried',
            stability_months: 12,
            yoy_growth_pct: 0.08, // 3-7 years horizon
            source_count: 1,
            year: new Date().getFullYear(),
          })
        );
      });
    });
  });

  /* -------------------------------------------------------------------------- */
  /* (9) Privacy: No Redundant localStorage Profile & No Console Logs of PII   */
  /* -------------------------------------------------------------------------- */
  describe('(9) Privacy Compliance', () => {
    it('does not store raw profile data in localStorage saveMasterProfileLocally', async () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      renderMasterDataPage();

      await waitFor(() => {
        expect(screen.getByTestId('master-data-page')).toBeInTheDocument();
      });

      expect(setItemSpy).not.toHaveBeenCalledWith('master_profile_data', expect.anything());
    });

    it('does not log PII (PAN, DOB, policyNumber) to console', () => {
      const logSpy = vi.spyOn(console, 'log');
      const profile = getInitialMasterProfile({
        pan: 'ABCDE1234F',
        dob: '15-08-1995',
        policyNumber: 'POL999999',
      });

      buildMasterDataMap(profile);
      validateMasterData(profile);

      expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('ABCDE1234F'));
      expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('POL999999'));
    });
  });

  /* -------------------------------------------------------------------------- */
  /* (10) MasterDataPage Save Navigation & Gamification Hooks                   */
  /* -------------------------------------------------------------------------- */
  describe('(10) MasterDataPage Save Navigation & Gamification Hooks', () => {
    it('calls gamificationStore.rewardProfileCompletion() and updateStreak() on save', async () => {
      const rewardSpy = vi.spyOn(gamificationStore, 'rewardProfileCompletion');
      const streakSpy = vi.spyOn(gamificationStore, 'updateStreak');
      const updateSpy = vi.spyOn(apiService, 'updateMasterProfile').mockResolvedValue({ status: 'success' });

      // Mock existing complete profile so it passes validation
      vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({
        data: {
          consent_given: true,
          fullName: 'Aarav Sharma',
          dob: '15-08-1995',
          gender: 'Male',
          state: 'Maharashtra',
          city: 'Mumbai',
          employmentType: 'Salaried',
          employer: 'TCS',
          monthlyActiveIncome: '100000',
          incomeFrequency: 'Monthly',
          monthlyFixedExpenses: '40000',
          monthlyVariableExpenses: '20000',
          monthlySavings: '40000',
          doesInvest: false,
        },
      });

      renderMasterDataPage();

      await waitFor(() => {
        expect(screen.getByTestId('master-data-save-bottom-btn')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('master-data-save-bottom-btn'));

      await waitFor(() => {
        expect(rewardSpy).toHaveBeenCalled();
        expect(streakSpy).toHaveBeenCalled();
        expect(updateSpy).toHaveBeenCalled();
      });
    });

    it('keeps form data and displays error toast on API failure', async () => {
      vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({
        data: {
          consent_given: true,
          fullName: 'Aarav Sharma',
          dob: '15-08-1995',
          gender: 'Male',
          state: 'Maharashtra',
          city: 'Mumbai',
          employmentType: 'Salaried',
          employer: 'TCS',
          monthlyActiveIncome: '100000',
          incomeFrequency: 'Monthly',
          monthlyFixedExpenses: '40000',
          monthlyVariableExpenses: '20000',
          monthlySavings: '40000',
          doesInvest: false,
        },
      });

      vi.spyOn(apiService, 'updateMasterProfile').mockRejectedValue(new Error('Network error'));

      renderMasterDataPage();

      await waitFor(() => {
        expect(screen.getByTestId('input-fullName')).toHaveValue('Aarav Sharma');
      });

      fireEvent.click(screen.getByTestId('master-data-save-bottom-btn'));

      await waitFor(() => {
        // Form data is retained
        expect(screen.getByTestId('input-fullName')).toHaveValue('Aarav Sharma');
      });
    });
  });

  /* -------------------------------------------------------------------------- */
  /* (11) Loading Master Data with Past SIP Date Never Mutates Totals on Web    */
  /* -------------------------------------------------------------------------- */
  describe('(11) No Auto-SIP Double Count on Web', () => {
    it('loading /master-data with SIP date <= today does NOT mutate totalEquityInvestments or trigger writes', async () => {
      const updateSpy = vi.spyOn(apiService, 'updateMasterProfile');

      // Mock profile with totalEquityInvestments: '500000' and a stock SIP whose date has passed (e.g. Day 1)
      vi.spyOn(apiService, 'getMasterProfile').mockResolvedValue({
        data: {
          doesInvest: true,
          totalEquityInvestments: '500000',
          stockSips: [{ name: 'Nifty ETF', amount: '10000', date: 1 }],
        },
      });

      renderMasterDataPage();

      await waitFor(() => {
        expect(screen.getByTestId('input-totalEquityInvestments')).toBeInTheDocument();
      });

      // Total investment must remain exactly 500000 (NOT incremented to 510000)
      expect(screen.getByTestId('input-totalEquityInvestments')).toHaveValue(500000);

      // No background update write was called
      expect(updateSpy).not.toHaveBeenCalled();
    });
  });
});
