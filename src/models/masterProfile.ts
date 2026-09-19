/**
 * Master Profile Schema, Constants, Types & Validation
 * 
 * Direct 1:1 port of Flutter's:
 * - screens/master_data_screen.dart (lines 281-359, 411-457, 751-781, 904-910)
 * - screens/onboarding_screen.dart
 */

export interface SipEntry {
  name: string;
  amount: string;
  date: number;
}

export interface MasterProfileFormData {
  // Consent
  consent_given: boolean;
  consent_timestamp?: string;

  // Category 1: Basic Identity (14 fields + otherCity helper)
  fullName: string;
  mobile: string;
  email: string;
  dob: string; // Stored as "DD-MM-YYYY"
  gender: string | null;
  city: string | null;
  otherCity?: string;
  state: string | null;
  employmentType: string | null;
  dependents: string;
  maritalStatus: string | null;
  pan: string;
  employer: string;
  department: string;
  designation: string;

  // Category 2: Income Pillar (7 fields)
  monthlyActiveIncome: string;
  incomeFrequency: string | null;
  cityTier: string | null;
  hasPassiveIncome: boolean;
  passiveIncomeAmount: string;
  passiveIncomeSource: string | null;
  salaryBreakup: string;

  // Category 3: Expenses Pillar (7 fields)
  monthlyFixedExpenses: string;
  monthlyVariableExpenses: string;
  totalEmi: string;
  activeLoans: string;
  monthlySavings: string;
  loanDetails: string;
  expenseCategoryBreakdown: string;

  // Category 4: Emergency Fund Pillar (3 fields)
  hasEmergencyFund: boolean;
  emergencyFundCurrent: string;
  emergencyFundParked: string | null;

  // Category 5: Insurance Pillar (12 fields)
  hasHealthInsurance: boolean;
  healthCover: string;
  isFamilyCovered: boolean;
  hasLifeInsurance: boolean;
  lifeCover: string;
  hasTermPlan: boolean;
  termCover: string;
  insurerName: string;
  policyNumber: string;
  policyExpiry: string;
  hasCriticalIllness: boolean;
  hasAccidentalCover: boolean;

  // Category 6: Investment Pillar (12 fields)
  doesInvest: boolean;
  totalEquityInvestments: string;
  totalDebtInvestments: string;
  totalGoldInvestments: string;
  totalRealEstateInvestments: string;

  // Dynamic Lists
  stockSips: SipEntry[];
  mfSips: SipEntry[];
  goldSips: SipEntry[];

  // Backward Compatibility Sums (strings from Dart double)
  monthlySipEquity?: string;
  monthlySipDebt?: string;
  monthlySipGold?: string;

  riskAppetite: string | null;
  primaryInvestmentGoal: string | null;
  existingPortfolio: string;
  equityExposurePct: number | string; // Slider percentage 0-100
}

export const STATE_CITY_MAP: Record<string, string[]> = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati'],
  'Arunachal Pradesh': ['Itanagar', 'Tawang', 'Ziro'],
  'Assam': ['Guwahati', 'Dibrugarh', 'Silchar', 'Jorhat'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'],
  'Haryana': ['Faridabad', 'Gurugram', 'Panipat', 'Ambala', 'Hisar'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur'],
  'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Rewa'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad'],
  'Manipur': ['Imphal'],
  'Meghalaya': ['Shillong'],
  'Mizoram': ['Aizawl'],
  'Nagaland': ['Kohima', 'Dimapur'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Sambalpur'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur'],
  'Sikkim': ['Gangtok'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam'],
  'Tripura': ['Agartala'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Noida'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani'],
  'West Bengal': ['Kolkata', 'Asansol', 'Siliguri', 'Durgapur', 'Howrah'],
  'Delhi': ['New Delhi', 'Delhi Cantt', 'Dwarka', 'Rohini'],
};

export const GENDER_OPTIONS = ['Male', 'Female', 'Other'] as const;
export const EMPLOYMENT_TYPE_OPTIONS = ['Salaried', 'Self-Employed', 'Business', 'Freelancer', 'Retired'] as const;
export const MARITAL_STATUS_OPTIONS = ['Single', 'Married', 'Other'] as const;
export const INCOME_FREQUENCY_OPTIONS = ['Monthly', 'Weekly', 'Irregular'] as const;
export const CITY_TIER_OPTIONS = ['Metro City / Tier 1', 'Tier 2', 'Tier 3'] as const;
export const PASSIVE_INCOME_SOURCE_OPTIONS = ['Rent', 'Dividends', 'Interest', 'Other'] as const;
export const EMERGENCY_FUND_PARKED_OPTIONS = ['Savings A/C', 'FD', 'Liquid Fund', 'Cash', 'Other'] as const;
export const RISK_APPETITE_OPTIONS = ['Conservative', 'Moderate', 'Aggressive'] as const;
export const INVESTMENT_GOAL_OPTIONS = ['Wealth', 'Retirement', 'Child', 'Home', 'Emergency', 'Other'] as const;
export const HORIZON_OPTIONS = ['< 3 years', '3-7 years', '> 7 years'] as const;

/**
 * Emulates Dart's double.toString() behavior:
 * - Whole numbers format with .0 (e.g. 0 -> "0.0", 5000 -> "5000.0")
 * - Fractional numbers format directly (e.g. 2500.5 -> "2500.5", 2500.55 -> "2500.55")
 */
export function dartDoubleToString(num: number): string {
  if (isNaN(num)) return '0.0';
  if (num % 1 === 0) {
    return num.toFixed(1);
  }
  return num.toString();
}

/**
 * Calculates total amount of a dynamic SIP list
 */
export function calculateSipTotal(sips: SipEntry[] = []): number {
  let total = 0;
  for (const sip of sips) {
    const val = parseFloat(String(sip.amount ?? '0').replace(/,/g, ''));
    if (!isNaN(val)) total += val;
  }
  return total;
}

/**
 * Converts HTML date input string "YYYY-MM-DD" to DB trigger format "DD-MM-YYYY".
 */
export function formatDobToDb(dateStr: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  // If already DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) return trimmed;
  // If YYYY-MM-DD
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  return trimmed;
}

/**
 * Converts DB trigger format "DD-MM-YYYY" to HTML date input string "YYYY-MM-DD".
 */
export function formatDobFromDb(dbStr: string): string {
  if (!dbStr) return '';
  const trimmed = dbStr.trim();
  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  // If DD-MM-YYYY
  const match = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  return trimmed;
}

/**
 * Constructs exact payload map matching Flutter master_data_screen.dart _buildDataMap()
 */
export function buildMasterDataMap(formData: MasterProfileFormData): Record<string, any> {
  const stockSips = formData.stockSips ?? [];
  const mfSips = formData.mfSips ?? [];
  const goldSips = formData.goldSips ?? [];

  const rawExposure = typeof formData.equityExposurePct === 'number'
    ? formData.equityExposurePct
    : (parseFloat(String(formData.equityExposurePct || '0')) || 0);

  return {
    consent_given: Boolean(formData.consent_given),
    consent_timestamp: formData.consent_timestamp || new Date().toISOString(),

    // Category 1
    fullName: formData.fullName || '',
    mobile: formData.mobile || '',
    email: formData.email || '',
    dob: formatDobToDb(formData.dob || ''),
    gender: formData.gender ?? null,
    city: formData.city === 'Other' ? (formData.otherCity || '') : (formData.city ?? null),
    state: formData.state ?? null,
    employmentType: formData.employmentType ?? null,
    dependents: formData.dependents || '',
    maritalStatus: formData.maritalStatus ?? null,
    pan: formData.pan || '',
    employer: formData.employer || '',
    department: formData.department || '',
    designation: formData.designation || '',

    // Category 2
    monthlyActiveIncome: formData.monthlyActiveIncome || '0',
    incomeFrequency: formData.incomeFrequency ?? null,
    cityTier: formData.cityTier ?? null,
    hasPassiveIncome: Boolean(formData.hasPassiveIncome),
    passiveIncomeAmount: formData.passiveIncomeAmount || '0',
    passiveIncomeSource: formData.passiveIncomeSource ?? null,
    salaryBreakup: formData.salaryBreakup || '',

    // Category 3
    monthlyFixedExpenses: formData.monthlyFixedExpenses || '0',
    monthlyVariableExpenses: formData.monthlyVariableExpenses || '0',
    totalEmi: formData.totalEmi || '0',
    activeLoans: formData.activeLoans || '0',
    monthlySavings: formData.monthlySavings || '0',
    loanDetails: formData.loanDetails || '',
    expenseCategoryBreakdown: formData.expenseCategoryBreakdown || '',

    // Category 4
    hasEmergencyFund: Boolean(formData.hasEmergencyFund),
    emergencyFundCurrent: formData.emergencyFundCurrent || '0',
    emergencyFundParked: formData.emergencyFundParked ?? null,

    // Category 5
    hasHealthInsurance: Boolean(formData.hasHealthInsurance),
    healthCover: formData.healthCover || '0',
    isFamilyCovered: Boolean(formData.isFamilyCovered),
    hasLifeInsurance: Boolean(formData.hasLifeInsurance),
    lifeCover: formData.lifeCover || '0',
    hasTermPlan: Boolean(formData.hasTermPlan),
    termCover: formData.termCover || '0',
    insurerName: formData.insurerName || '',
    policyNumber: formData.policyNumber || '',
    policyExpiry: formData.policyExpiry || '',
    hasCriticalIllness: Boolean(formData.hasCriticalIllness),
    hasAccidentalCover: Boolean(formData.hasAccidentalCover),

    // Category 6
    doesInvest: Boolean(formData.doesInvest),
    totalEquityInvestments: formData.totalEquityInvestments || '0',
    totalDebtInvestments: formData.totalDebtInvestments || '0',
    totalGoldInvestments: formData.totalGoldInvestments || '0',
    totalRealEstateInvestments: formData.totalRealEstateInvestments || '0',

    // Dynamic Lists
    stockSips: stockSips,
    mfSips: mfSips,
    goldSips: goldSips,

    // Backward Compatibility Sums (Dart double strings)
    monthlySipEquity: dartDoubleToString(calculateSipTotal(stockSips)),
    monthlySipDebt: dartDoubleToString(calculateSipTotal(mfSips)),
    monthlySipGold: dartDoubleToString(calculateSipTotal(goldSips)),

    riskAppetite: formData.riskAppetite ?? null,
    primaryInvestmentGoal: formData.primaryInvestmentGoal ?? null,
    existingPortfolio: formData.existingPortfolio || '',
    equityExposurePct: dartDoubleToString(rawExposure),
  };
}

/**
 * Validates form data strictly in Flutter Dart order with exact messages:
 * 1. Consent
 * 2. Identity Basics
 * 3. Employment
 * 4. Income Essentials
 * 5. Expense Essentials
 * 6. Investment Essentials (if doesInvest)
 */
export function validateMasterData(data: MasterProfileFormData): { isValid: boolean; error?: string } {
  // 1. Consent Check
  if (!data.consent_given) {
    return {
      isValid: false,
      error: 'Please provide your consent to process data for financial insights.',
    };
  }

  // 2. Identity Basics
  const hasValidCity = Boolean(
    data.city && (data.city !== 'Other' || (data.otherCity && data.otherCity.trim().length > 0))
  );

  if (
    !data.fullName?.trim() ||
    !data.dob?.trim() ||
    !data.gender ||
    !data.state ||
    !hasValidCity
  ) {
    return {
      isValid: false,
      error: 'Basic Identity (Name, DOB, Gender, State, City) is mandatory.',
    };
  }

  // 3. Employment
  if (!data.employmentType || !data.employer?.trim()) {
    return {
      isValid: false,
      error: 'Employment Type and Employer Name are mandatory.',
    };
  }

  // 4. Income Essentials
  if (!data.monthlyActiveIncome?.trim() || !data.incomeFrequency) {
    return {
      isValid: false,
      error: 'Monthly Active Income and Frequency are mandatory.',
    };
  }

  // 5. Expense Essentials
  if (
    !data.monthlyFixedExpenses?.trim() ||
    !data.monthlyVariableExpenses?.trim() ||
    !data.monthlySavings?.trim()
  ) {
    return {
      isValid: false,
      error: 'Fixed Expenses, Variable Expenses, and monthly Savings are mandatory.',
    };
  }

  // 6. Investment Essentials
  if (data.doesInvest) {
    if (
      !data.totalEquityInvestments?.trim() ||
      !data.totalDebtInvestments?.trim() ||
      !data.totalGoldInvestments?.trim() ||
      !data.totalRealEstateInvestments?.trim() ||
      !data.riskAppetite
    ) {
      return {
        isValid: false,
        error: 'Please fill all mandatory investment fields (Totals and Risk Appetite).',
      };
    }
  }

  return { isValid: true };
}

/**
 * Returns default empty form state with optional prefill
 */
export function getInitialMasterProfile(prefill?: Partial<MasterProfileFormData>): MasterProfileFormData {
  return {
    consent_given: false,
    fullName: '',
    mobile: '',
    email: '',
    dob: '',
    gender: null,
    city: null,
    otherCity: '',
    state: null,
    employmentType: null,
    dependents: '',
    maritalStatus: null,
    pan: '',
    employer: '',
    department: '',
    designation: '',
    monthlyActiveIncome: '0',
    incomeFrequency: null,
    cityTier: null,
    hasPassiveIncome: false,
    passiveIncomeAmount: '0',
    passiveIncomeSource: null,
    salaryBreakup: '',
    monthlyFixedExpenses: '0',
    monthlyVariableExpenses: '0',
    totalEmi: '0',
    activeLoans: '0',
    monthlySavings: '0',
    loanDetails: '',
    expenseCategoryBreakdown: '',
    hasEmergencyFund: false,
    emergencyFundCurrent: '0',
    emergencyFundParked: null,
    hasHealthInsurance: false,
    healthCover: '0',
    isFamilyCovered: false,
    hasLifeInsurance: false,
    lifeCover: '0',
    hasTermPlan: false,
    termCover: '0',
    insurerName: '',
    policyNumber: '',
    policyExpiry: '',
    hasCriticalIllness: false,
    hasAccidentalCover: false,
    doesInvest: false,
    totalEquityInvestments: '0',
    totalDebtInvestments: '0',
    totalGoldInvestments: '0',
    totalRealEstateInvestments: '0',
    stockSips: [],
    mfSips: [],
    goldSips: [],
    riskAppetite: null,
    primaryInvestmentGoal: null,
    existingPortfolio: '',
    equityExposurePct: 0.0,
    ...prefill,
  };
}
