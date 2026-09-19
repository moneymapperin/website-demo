import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService, ApiException } from '../services/apiService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { gamificationStore } from '../services/gamificationStore';
import {
  MasterProfileFormData,
  SipEntry,
  STATE_CITY_MAP,
  GENDER_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  INCOME_FREQUENCY_OPTIONS,
  CITY_TIER_OPTIONS,
  PASSIVE_INCOME_SOURCE_OPTIONS,
  EMERGENCY_FUND_PARKED_OPTIONS,
  RISK_APPETITE_OPTIONS,
  INVESTMENT_GOAL_OPTIONS,
  getInitialMasterProfile,
  buildMasterDataMap,
  validateMasterData,
  formatDobToDb,
  formatDobFromDb,
} from '../models/masterProfile';

export const MasterDataPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<MasterProfileFormData>(getInitialMasterProfile());

  // Section Refs for smooth scrolling
  const identityRef = useRef<HTMLDivElement>(null);
  const incomeRef = useRef<HTMLDivElement>(null);
  const expensesRef = useRef<HTMLDivElement>(null);
  const emergencyRef = useRef<HTMLDivElement>(null);
  const insuranceRef = useRef<HTMLDivElement>(null);
  const investmentRef = useRef<HTMLDivElement>(null);

  // Active Tab for TabBar highlighting
  const [activeTab, setActiveTab] = useState(0);

  // 1. Data Loading on mount
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const res = await apiService.getMasterProfile();
        if (res?.data && typeof res.data === 'object' && Object.keys(res.data).length > 0) {
          if (!mounted) return;
          const data = res.data;

          // Parse city & check if it belongs to state list or 'Other'
          let state = data.state?.toString() || null;
          let city = data.city?.toString() || null;
          let otherCity = '';

          if (state && city && STATE_CITY_MAP[state]) {
            const cityList = STATE_CITY_MAP[state];
            const match = cityList.find((c) => c.toLowerCase() === city!.trim().toLowerCase());
            if (match) {
              city = match;
            } else {
              otherCity = city;
              city = 'Other';
            }
          }

          setFormData({
            consent_given: Boolean(data.consent_given),
            consent_timestamp: data.consent_timestamp,
            fullName: data.fullName?.toString() || '',
            mobile: data.mobile?.toString() || '',
            email: data.email?.toString() || '',
            dob: data.dob?.toString() || '',
            gender: data.gender?.toString() || null,
            state,
            city,
            otherCity,
            employmentType: data.employmentType?.toString() || null,
            dependents: data.dependents?.toString() || '',
            maritalStatus: data.maritalStatus?.toString() || null,
            pan: data.pan?.toString() || '',
            employer: data.employer?.toString() || '',
            department: data.department?.toString() || '',
            designation: data.designation?.toString() || '',
            monthlyActiveIncome: data.monthlyActiveIncome?.toString() || '0',
            incomeFrequency: data.incomeFrequency?.toString() || null,
            cityTier: data.cityTier?.toString() || null,
            hasPassiveIncome: Boolean(data.hasPassiveIncome),
            passiveIncomeAmount: data.passiveIncomeAmount?.toString() || '0',
            passiveIncomeSource: data.passiveIncomeSource?.toString() || null,
            salaryBreakup: data.salaryBreakup?.toString() || '',
            monthlyFixedExpenses: data.monthlyFixedExpenses?.toString() || '0',
            monthlyVariableExpenses: data.monthlyVariableExpenses?.toString() || '0',
            totalEmi: data.totalEmi?.toString() || '0',
            activeLoans: data.activeLoans?.toString() || '0',
            monthlySavings: data.monthlySavings?.toString() || '0',
            loanDetails: data.loanDetails?.toString() || '',
            expenseCategoryBreakdown: data.expenseCategoryBreakdown?.toString() || '',
            hasEmergencyFund: Boolean(data.hasEmergencyFund),
            emergencyFundCurrent: data.emergencyFundCurrent?.toString() || '0',
            emergencyFundParked: data.emergencyFundParked?.toString() || null,
            hasHealthInsurance: Boolean(data.hasHealthInsurance),
            healthCover: data.healthCover?.toString() || '0',
            isFamilyCovered: Boolean(data.isFamilyCovered),
            hasLifeInsurance: Boolean(data.hasLifeInsurance),
            lifeCover: data.lifeCover?.toString() || '0',
            hasTermPlan: Boolean(data.hasTermPlan),
            termCover: data.termCover?.toString() || '0',
            insurerName: data.insurerName?.toString() || '',
            policyNumber: data.policyNumber?.toString() || '',
            policyExpiry: data.policyExpiry?.toString() || '',
            hasCriticalIllness: Boolean(data.hasCriticalIllness),
            hasAccidentalCover: Boolean(data.hasAccidentalCover),
            doesInvest: Boolean(data.doesInvest),
            totalEquityInvestments: data.totalEquityInvestments?.toString() || '0',
            totalDebtInvestments: data.totalDebtInvestments?.toString() || '0',
            totalGoldInvestments: data.totalGoldInvestments?.toString() || '0',
            totalRealEstateInvestments: data.totalRealEstateInvestments?.toString() || '0',
            stockSips: Array.isArray(data.stockSips) ? data.stockSips : [],
            mfSips: Array.isArray(data.mfSips) ? data.mfSips : [],
            goldSips: Array.isArray(data.goldSips) ? data.goldSips : [],
            riskAppetite: data.riskAppetite?.toString() || null,
            primaryInvestmentGoal: data.primaryInvestmentGoal?.toString() || null,
            existingPortfolio: data.existingPortfolio?.toString() || '',
            equityExposurePct: typeof data.equityExposurePct === 'number'
              ? data.equityExposurePct
              : (parseFloat(data.equityExposurePct?.toString() || '0') || 0),
          });
          setLoading(false);
          return;
        }
      } catch {
        // Fallback to auth session metadata
      }

      if (mounted) {
        setFormData((prev) => ({
          ...prev,
          fullName: user?.user_metadata?.fullName || user?.user_metadata?.full_name || '',
          email: user?.email || '',
          mobile: user?.user_metadata?.mobile || '',
        }));
        setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [user]);

  // 2. Deep linking query parameter scroll (?target=income etc.)
  useEffect(() => {
    if (loading) return;

    const target = searchParams.get('target')?.toLowerCase();
    if (!target) return;

    const timer = setTimeout(() => {
      scrollToSection(target);
    }, 150);

    return () => clearTimeout(timer);
  }, [loading, searchParams]);

  const scrollToSection = (target: string) => {
    let ref: React.RefObject<HTMLDivElement | null> | null = null;
    let tabIndex = 0;

    if (target === 'identity') {
      ref = identityRef;
      tabIndex = 0;
    } else if (target === 'income') {
      ref = incomeRef;
      tabIndex = 1;
    } else if (target === 'expenses') {
      ref = expensesRef;
      tabIndex = 2;
    } else if (target === 'emergency' || target === 'savings') {
      ref = emergencyRef;
      tabIndex = 3;
    } else if (target === 'insurance' || target === 'protection') {
      ref = insuranceRef;
      tabIndex = 4;
    } else if (target === 'investment' || target === 'investments') {
      ref = investmentRef;
      tabIndex = 5;
    }

    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveTab(tabIndex);
    }
  };

  // 3. Field update handler
  const updateField = <K extends keyof MasterProfileFormData>(key: K, value: MasterProfileFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // State change resets city
  const handleStateChange = (newState: string | null) => {
    setFormData((prev) => ({
      ...prev,
      state: newState,
      city: null,
      otherCity: '',
    }));
  };

  // City change handler
  const handleCityChange = (newCity: string | null) => {
    setFormData((prev) => ({
      ...prev,
      city: newCity,
      otherCity: newCity === 'Other' ? prev.otherCity : '',
    }));
  };

  // Dynamic SIP helpers
  const addSip = (type: 'stockSips' | 'mfSips' | 'goldSips') => {
    setFormData((prev) => ({
      ...prev,
      [type]: [...prev[type], { name: '', amount: '0', date: 1 }],
    }));
  };

  const removeSip = (type: 'stockSips' | 'mfSips' | 'goldSips', index: number) => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  const updateSip = (
    type: 'stockSips' | 'mfSips' | 'goldSips',
    index: number,
    field: keyof SipEntry,
    value: any
  ) => {
    setFormData((prev) => {
      const copy = [...prev[type]];
      copy[index] = { ...copy[index], [field]: value };
      return { ...prev, [type]: copy };
    });
  };

  // 4. Save Handler
  const handleSave = async () => {
    // Exact 6 validation checks in order
    const validation = validateMasterData(formData);
    if (!validation.isValid) {
      showToast({
        message: validation.error || 'Please fill in required fields.',
        backgroundColor: '#EF4444',
      });
      return;
    }

    setSaving(true);
    try {
      const payload = buildMasterDataMap(formData);

      // Port streak & XP rewards
      gamificationStore.rewardProfileCompletion();
      gamificationStore.updateStreak();

      // Submit with fresh DB read-before-write non-destructive merge
      await apiService.updateMasterProfile(payload);

      showToast({
        message: 'Profile synced successfully!',
        backgroundColor: '#10B981',
      });

      // History back navigation with /dashboard fallback
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/dashboard');
      }
    } catch (e: any) {
      const msg = e instanceof ApiException ? e.message : 'Sync failed. Please try again.';
      showToast({
        message: msg,
        backgroundColor: '#EF4444',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-mm-background dark:bg-mm-darkBackground" data-testid="master-data-loading">
        <div className="w-10 h-10 border-4 border-mm-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sortedStates = Object.keys(STATE_CITY_MAP).sort();
  const availableCities = formData.state && STATE_CITY_MAP[formData.state]
    ? [...STATE_CITY_MAP[formData.state]].sort().concat('Other')
    : [];

  return (
    <div className="w-full min-h-screen bg-mm-background dark:bg-mm-darkBackground pb-20" data-testid="master-data-page">
      {/* 1. App Header */}
      <div className="sticky top-0 z-30 bg-mm-primary text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Go Back"
              data-testid="master-data-back-btn"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-bold">My Profile</h1>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 disabled:opacity-50 text-white font-bold text-sm transition-all"
            data-testid="master-data-save-header-btn"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
            <span>Save</span>
          </button>
        </div>

        {/* TabBar Navigation */}
        <div className="max-w-4xl mx-auto px-2 flex overflow-x-auto scrollbar-none border-t border-white/10 text-xs font-semibold">
          {[
            { label: 'Identity', target: 'identity' },
            { label: 'Income', target: 'income' },
            { label: 'Expenses', target: 'expenses' },
            { label: 'Emergency', target: 'emergency' },
            { label: 'Insurance', target: 'insurance' },
            { label: 'Investments', target: 'investment' },
          ].map((tab, idx) => (
            <button
              key={tab.target}
              onClick={() => scrollToSection(tab.target)}
              className={`px-4 py-3 whitespace-nowrap border-b-2 transition-colors ${
                activeTab === idx
                  ? 'border-mm-secondary text-white font-bold'
                  : 'border-transparent text-white/70 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* ========================================================================= */}
        {/* Category 1: Basic Identity                                               */}
        {/* ========================================================================= */}
        <div ref={identityRef} id="section-identity" className="scroll-mt-32">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-mm-primary text-xl">👤</span>
            <h2 className="text-base font-black text-gray-900 dark:text-white">1. Basic Identity</h2>
          </div>

          <div className="rounded-2xl bg-white dark:bg-mm-darkCard border border-mm-borderLight dark:border-mm-darkBorder p-5 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                placeholder="Aarav Sharma"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                data-testid="input-fullName"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => updateField('mobile', e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                  data-testid="input-mobile"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                  data-testid="input-email"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={formatDobFromDb(formData.dob)}
                  onChange={(e) => updateField('dob', formatDobToDb(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                  data-testid="input-dob"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                <select
                  value={formData.gender || ''}
                  onChange={(e) => updateField('gender', e.target.value || null)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                  data-testid="select-gender"
                >
                  <option value="">Select Gender</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">State</label>
                <select
                  value={formData.state || ''}
                  onChange={(e) => handleStateChange(e.target.value || null)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                  data-testid="select-state"
                >
                  <option value="">Select State</option>
                  {sortedStates.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">City</label>
                <select
                  value={formData.city || ''}
                  disabled={!formData.state}
                  onChange={(e) => handleCityChange(e.target.value || null)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary disabled:opacity-50"
                  data-testid="select-city"
                >
                  <option value="">Select City</option>
                  {availableCities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {formData.city === 'Other' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Specify City Name</label>
                <input
                  type="text"
                  value={formData.otherCity || ''}
                  onChange={(e) => updateField('otherCity', e.target.value)}
                  placeholder="Enter city name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                  data-testid="input-otherCity"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Employment Type</label>
                <select
                  value={formData.employmentType || ''}
                  onChange={(e) => updateField('employmentType', e.target.value || null)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                  data-testid="select-employmentType"
                >
                  <option value="">Select Employment Type</option>
                  {EMPLOYMENT_TYPE_OPTIONS.map((et) => (
                    <option key={et} value={et}>{et}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Employer / Company Name</label>
                <input
                  type="text"
                  value={formData.employer}
                  onChange={(e) => updateField('employer', e.target.value)}
                  placeholder="Acme Technologies"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                  data-testid="input-employer"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Number of Dependents</label>
                <input
                  type="number"
                  value={formData.dependents}
                  onChange={(e) => updateField('dependents', e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                  data-testid="input-dependents"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Marital Status (optional)</label>
                <select
                  value={formData.maritalStatus || ''}
                  onChange={(e) => updateField('maritalStatus', e.target.value || null)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                  data-testid="select-maritalStatus"
                >
                  <option value="">Select Status</option>
                  {MARITAL_STATUS_OPTIONS.map((ms) => (
                    <option key={ms} value={ms}>{ms}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">PAN Number (optional)</label>
                <input
                  type="text"
                  value={formData.pan}
                  onChange={(e) => updateField('pan', e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                  data-testid="input-pan"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => updateField('department', e.target.value)}
                  placeholder="Engineering / Operations"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                  data-testid="input-department"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Designation / Role</label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => updateField('designation', e.target.value)}
                  placeholder="Senior Consultant"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                  data-testid="input-designation"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Category 2: Income Pillar                                                 */}
        {/* ========================================================================= */}
        <div ref={incomeRef} id="section-income" className="scroll-mt-32">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-mm-primary text-xl">💳</span>
            <h2 className="text-base font-black text-gray-900 dark:text-white">2. Income Pillar</h2>
          </div>

          <div className="rounded-2xl bg-white dark:bg-mm-darkCard border border-mm-borderLight dark:border-mm-darkBorder p-5 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Monthly Active Income (Net Take-home)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-gray-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  value={formData.monthlyActiveIncome}
                  onChange={(e) => updateField('monthlyActiveIncome', e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                  data-testid="input-monthlyActiveIncome"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Income Frequency</label>
                <select
                  value={formData.incomeFrequency || ''}
                  onChange={(e) => updateField('incomeFrequency', e.target.value || null)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                  data-testid="select-incomeFrequency"
                >
                  <option value="">Select Frequency</option>
                  {INCOME_FREQUENCY_OPTIONS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">City Tier</label>
                <select
                  value={formData.cityTier || ''}
                  onChange={(e) => updateField('cityTier', e.target.value || null)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                  data-testid="select-cityTier"
                >
                  <option value="">Select City Tier</option>
                  {CITY_TIER_OPTIONS.map((tier) => (
                    <option key={tier} value={tier}>{tier}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-zinc-800">
              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  Do you have Passive Income?
                </span>
                <input
                  type="checkbox"
                  checked={formData.hasPassiveIncome}
                  onChange={(e) => updateField('hasPassiveIncome', e.target.checked)}
                  className="w-5 h-5 rounded text-mm-primary focus:ring-mm-primary"
                  data-testid="toggle-hasPassiveIncome"
                />
              </label>

              {formData.hasPassiveIncome && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-purple-50/50 dark:bg-purple-950/20 p-4 rounded-xl">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Passive Income Amount (Monthly)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-gray-400 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        value={formData.passiveIncomeAmount}
                        onChange={(e) => updateField('passiveIncomeAmount', e.target.value)}
                        className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                        data-testid="input-passiveIncomeAmount"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Passive Income Source
                    </label>
                    <select
                      value={formData.passiveIncomeSource || ''}
                      onChange={(e) => updateField('passiveIncomeSource', e.target.value || null)}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                      data-testid="select-passiveIncomeSource"
                    >
                      <option value="">Select Source</option>
                      {PASSIVE_INCOME_SOURCE_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Salary Breakup (HRA, Basic, etc.) (optional)
              </label>
              <textarea
                rows={3}
                value={formData.salaryBreakup}
                onChange={(e) => updateField('salaryBreakup', e.target.value)}
                placeholder="Basic: 50,000, HRA: 25,000, Special Allowance: 25,000"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                data-testid="input-salaryBreakup"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Category 3: Expenses Pillar                                               */}
        {/* ========================================================================= */}
        <div ref={expensesRef} id="section-expenses" className="scroll-mt-32">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-mm-primary text-xl">🛍️</span>
            <h2 className="text-base font-black text-gray-900 dark:text-white">3. Expenses Pillar</h2>
          </div>

          <div className="rounded-2xl bg-white dark:bg-mm-darkCard border border-mm-borderLight dark:border-mm-darkBorder p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Monthly Fixed Expenses (Rent, Subscriptions, EMI)
                </label>
                <input
                  type="number"
                  value={formData.monthlyFixedExpenses}
                  onChange={(e) => updateField('monthlyFixedExpenses', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                  data-testid="input-monthlyFixedExpenses"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Monthly Variable Expenses (Groceries, Fuel, Misc)
                </label>
                <input
                  type="number"
                  value={formData.monthlyVariableExpenses}
                  onChange={(e) => updateField('monthlyVariableExpenses', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                  data-testid="input-monthlyVariableExpenses"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Total Monthly EMI Obligations
                </label>
                <input
                  type="number"
                  value={formData.totalEmi}
                  onChange={(e) => updateField('totalEmi', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                  data-testid="input-totalEmi"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Number of Active Loans
                </label>
                <input
                  type="number"
                  value={formData.activeLoans}
                  onChange={(e) => updateField('activeLoans', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                  data-testid="input-activeLoans"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Monthly Savings (Approx)
                </label>
                <input
                  type="number"
                  value={formData.monthlySavings}
                  onChange={(e) => updateField('monthlySavings', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                  data-testid="input-monthlySavings"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Loan Details (Type, Balance, Interest) (optional)
              </label>
              <textarea
                rows={2}
                value={formData.loanDetails}
                onChange={(e) => updateField('loanDetails', e.target.value)}
                placeholder="Home loan: 30L @ 8.5%, Car loan: 5L @ 9%"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                data-testid="input-loanDetails"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Expense Category Breakdown (optional)
              </label>
              <textarea
                rows={2}
                value={formData.expenseCategoryBreakdown}
                onChange={(e) => updateField('expenseCategoryBreakdown', e.target.value)}
                placeholder="Rent: 20k, Food: 15k, Utilities: 5k"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                data-testid="input-expenseCategoryBreakdown"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Category 4: Emergency Fund                                                */}
        {/* ========================================================================= */}
        <div ref={emergencyRef} id="section-emergency" className="scroll-mt-32">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-mm-primary text-xl">🛡️</span>
            <h2 className="text-base font-black text-gray-900 dark:text-white">4. Emergency Fund</h2>
          </div>

          <div className="rounded-2xl bg-white dark:bg-mm-darkCard border border-mm-borderLight dark:border-mm-darkBorder p-5 shadow-sm space-y-4">
            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                Do you have an Emergency Fund?
              </span>
              <input
                type="checkbox"
                checked={formData.hasEmergencyFund}
                onChange={(e) => updateField('hasEmergencyFund', e.target.checked)}
                className="w-5 h-5 rounded text-mm-primary focus:ring-mm-primary"
                data-testid="toggle-hasEmergencyFund"
              />
            </label>

            {formData.hasEmergencyFund && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Total Current Emergency Fund (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.emergencyFundCurrent}
                    onChange={(e) => updateField('emergencyFundCurrent', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                    data-testid="input-emergencyFundCurrent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Where is it Parked?
                  </label>
                  <select
                    value={formData.emergencyFundParked || ''}
                    onChange={(e) => updateField('emergencyFundParked', e.target.value || null)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                    data-testid="select-emergencyFundParked"
                  >
                    <option value="">Select Location</option>
                    {EMERGENCY_FUND_PARKED_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Category 5: Insurance Protection                                          */}
        {/* ========================================================================= */}
        <div ref={insuranceRef} id="section-insurance" className="scroll-mt-32">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-mm-primary text-xl">🩺</span>
            <h2 className="text-base font-black text-gray-900 dark:text-white">5. Insurance Protection</h2>
          </div>

          <div className="rounded-2xl bg-white dark:bg-mm-darkCard border border-mm-borderLight dark:border-mm-darkBorder p-5 shadow-sm space-y-4">
            {/* Health Insurance */}
            <div className="p-3.5 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  Health Insurance — Do you have it?
                </span>
                <input
                  type="checkbox"
                  checked={formData.hasHealthInsurance}
                  onChange={(e) => updateField('hasHealthInsurance', e.target.checked)}
                  className="w-5 h-5 rounded text-mm-primary focus:ring-mm-primary"
                  data-testid="toggle-hasHealthInsurance"
                />
              </label>

              {formData.hasHealthInsurance && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Health Cover Amount
                    </label>
                    <input
                      type="number"
                      value={formData.healthCover}
                      onChange={(e) => updateField('healthCover', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                      data-testid="input-healthCover"
                    />
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isFamilyCovered}
                        onChange={(e) => updateField('isFamilyCovered', e.target.checked)}
                        className="w-4 h-4 rounded text-mm-primary focus:ring-mm-primary"
                        data-testid="toggle-isFamilyCovered"
                      />
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        Is Family Covered under Health?
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Life Insurance */}
            <div className="p-3.5 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  Life Insurance — Do you have it?
                </span>
                <input
                  type="checkbox"
                  checked={formData.hasLifeInsurance}
                  onChange={(e) => updateField('hasLifeInsurance', e.target.checked)}
                  className="w-5 h-5 rounded text-mm-primary focus:ring-mm-primary"
                  data-testid="toggle-hasLifeInsurance"
                />
              </label>

              {formData.hasLifeInsurance && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Life Cover Amount
                  </label>
                  <input
                    type="number"
                    value={formData.lifeCover}
                    onChange={(e) => updateField('lifeCover', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                    data-testid="input-lifeCover"
                  />
                </div>
              )}
            </div>

            {/* Term Plan */}
            <div className="p-3.5 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  Term Plan — Do you have it?
                </span>
                <input
                  type="checkbox"
                  checked={formData.hasTermPlan}
                  onChange={(e) => updateField('hasTermPlan', e.target.checked)}
                  className="w-5 h-5 rounded text-mm-primary focus:ring-mm-primary"
                  data-testid="toggle-hasTermPlan"
                />
              </label>

              {formData.hasTermPlan && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Term Cover Amount
                  </label>
                  <input
                    type="number"
                    value={formData.termCover}
                    onChange={(e) => updateField('termCover', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                    data-testid="input-termCover"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Existing Insurer Name(s) (optional)
                </label>
                <input
                  type="text"
                  value={formData.insurerName}
                  onChange={(e) => updateField('insurerName', e.target.value)}
                  placeholder="HDFC ERGO, LIC"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                  data-testid="input-insurerName"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Policy Number(s) (optional)
                </label>
                <input
                  type="text"
                  value={formData.policyNumber}
                  onChange={(e) => updateField('policyNumber', e.target.value)}
                  placeholder="POL12345678"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                  data-testid="input-policyNumber"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Policy Expiry Date(s) (optional)
                </label>
                <input
                  type="text"
                  value={formData.policyExpiry}
                  onChange={(e) => updateField('policyExpiry', e.target.value)}
                  placeholder="DD-MM-YYYY"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                  data-testid="input-policyExpiry"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasCriticalIllness}
                  onChange={(e) => updateField('hasCriticalIllness', e.target.checked)}
                  className="w-4 h-4 rounded text-mm-primary focus:ring-mm-primary"
                  data-testid="toggle-hasCriticalIllness"
                />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Critical Illness Cover?
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasAccidentalCover}
                  onChange={(e) => updateField('hasAccidentalCover', e.target.checked)}
                  className="w-4 h-4 rounded text-mm-primary focus:ring-mm-primary"
                  data-testid="toggle-hasAccidentalCover"
                />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Accidental Cover?
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Category 6: Investment & Growth                                           */}
        {/* ========================================================================= */}
        <div ref={investmentRef} id="section-investment" className="scroll-mt-32">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-mm-primary text-xl">📈</span>
            <h2 className="text-base font-black text-gray-900 dark:text-white">6. Investment & Growth</h2>
          </div>

          <div className="rounded-2xl bg-white dark:bg-mm-darkCard border border-mm-borderLight dark:border-mm-darkBorder p-5 shadow-sm space-y-4">
            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                Do you Invest?
              </span>
              <input
                type="checkbox"
                checked={formData.doesInvest}
                onChange={(e) => updateField('doesInvest', e.target.checked)}
                className="w-5 h-5 rounded text-mm-primary focus:ring-mm-primary"
                data-testid="toggle-doesInvest"
              />
            </label>

            {formData.doesInvest && (
              <div className="space-y-6 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Total Stock Investment (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.totalEquityInvestments}
                      onChange={(e) => updateField('totalEquityInvestments', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                      data-testid="input-totalEquityInvestments"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Total Mutual Fund Investment (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.totalDebtInvestments}
                      onChange={(e) => updateField('totalDebtInvestments', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                      data-testid="input-totalDebtInvestments"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Total Gold Investments (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.totalGoldInvestments}
                      onChange={(e) => updateField('totalGoldInvestments', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                      data-testid="input-totalGoldInvestments"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Total Real Estate Investment (₹) — excluding home you live in
                    </label>
                    <input
                      type="number"
                      value={formData.totalRealEstateInvestments}
                      onChange={(e) => updateField('totalRealEstateInvestments', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                      data-testid="input-totalRealEstateInvestments"
                    />
                  </div>
                </div>

                <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/30 rounded-xl text-[11px] italic text-gray-500 dark:text-gray-400">
                  Note: SIPs are added automatically every month. For any irregular (one-time) investments, please update the Total values manually here.
                </div>

                {/* Dynamic SIP Section: Mutual Funds (maps to Debt) */}
                <div className="pt-2 border-t border-gray-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Monthly Mutual Fund SIPs
                    </span>
                    <button
                      type="button"
                      onClick={() => addSip('mfSips')}
                      className="text-xs font-bold text-mm-primary hover:text-mm-secondary flex items-center gap-1"
                      data-testid="btn-add-mfSip"
                    >
                      + Add SIP
                    </button>
                  </div>

                  {formData.mfSips.map((sip, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Fund Name"
                        value={sip.name}
                        onChange={(e) => updateSip('mfSips', idx, 'name', e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent text-xs"
                      />
                      <div className="relative w-28">
                        <span className="absolute left-2.5 top-1.5 text-gray-400 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          placeholder="Amount"
                          value={sip.amount}
                          onChange={(e) => updateSip('mfSips', idx, 'amount', e.target.value)}
                          className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent text-xs"
                        />
                      </div>
                      <select
                        value={sip.date}
                        onChange={(e) => updateSip('mfSips', idx, 'date', parseInt(e.target.value, 10))}
                        className="px-2 py-1.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent text-xs"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>Day {d}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeSip('mfSips', idx)}
                        className="p-1.5 text-mm-danger hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg"
                        aria-label="Remove SIP"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Dynamic SIP Section: Gold */}
                <div className="pt-2 border-t border-gray-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Monthly Gold SIPs
                    </span>
                    <button
                      type="button"
                      onClick={() => addSip('goldSips')}
                      className="text-xs font-bold text-mm-primary hover:text-mm-secondary flex items-center gap-1"
                      data-testid="btn-add-goldSip"
                    >
                      + Add SIP
                    </button>
                  </div>

                  {formData.goldSips.map((sip, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Gold Scheme Name"
                        value={sip.name}
                        onChange={(e) => updateSip('goldSips', idx, 'name', e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent text-xs"
                      />
                      <div className="relative w-28">
                        <span className="absolute left-2.5 top-1.5 text-gray-400 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          placeholder="Amount"
                          value={sip.amount}
                          onChange={(e) => updateSip('goldSips', idx, 'amount', e.target.value)}
                          className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent text-xs"
                        />
                      </div>
                      <select
                        value={sip.date}
                        onChange={(e) => updateSip('goldSips', idx, 'date', parseInt(e.target.value, 10))}
                        className="px-2 py-1.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent text-xs"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>Day {d}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeSip('goldSips', idx)}
                        className="p-1.5 text-mm-danger hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg"
                        aria-label="Remove Gold SIP"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-zinc-800">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Risk Appetite
                    </label>
                    <select
                      value={formData.riskAppetite || ''}
                      onChange={(e) => updateField('riskAppetite', e.target.value || null)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                      data-testid="select-riskAppetite"
                    >
                      <option value="">Select Risk Appetite</option>
                      {RISK_APPETITE_OPTIONS.map((ra) => (
                        <option key={ra} value={ra}>{ra}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Primary Investment Goal (optional)
                    </label>
                    <select
                      value={formData.primaryInvestmentGoal || ''}
                      onChange={(e) => updateField('primaryInvestmentGoal', e.target.value || null)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                      data-testid="select-primaryInvestmentGoal"
                    >
                      <option value="">Select Goal</option>
                      {INVESTMENT_GOAL_OPTIONS.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Existing MF Portfolio (Folio Details) (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.existingPortfolio}
                    onChange={(e) => updateField('existingPortfolio', e.target.value)}
                    placeholder="Folio numbers or distributor codes"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                    data-testid="input-existingPortfolio"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Equity Exposure % (Approx) (optional)
                    </label>
                    <span className="text-xs font-bold text-mm-primary">
                      {Math.round(Number(formData.equityExposurePct))}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.equityExposurePct}
                    onChange={(e) => updateField('equityExposurePct', parseFloat(e.target.value) || 0)}
                    className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-mm-primary"
                    data-testid="slider-equityExposurePct"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Data Processing Consent Section                                          */}
        {/* ========================================================================= */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            formData.consent_given
              ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500'
              : 'bg-white dark:bg-mm-darkCard border-gray-200 dark:border-zinc-800'
          }`}
          data-testid="consent-card"
        >
          <label className="flex items-start gap-3.5 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.consent_given}
              onChange={(e) => updateField('consent_given', e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded text-mm-primary focus:ring-mm-primary"
              data-testid="checkbox-consent"
            />
            <div className="space-y-1">
              <span className="text-sm font-bold text-gray-900 dark:text-white block">
                Data Processing Consent
              </span>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                I agree to share and process my data for providing personalized financial insights and statistics. I understand I can opt-out by sending a formal email to remove my data.
              </p>
            </div>
          </label>
        </div>

        {/* ========================================================================= */}
        {/* Save Button at bottom                                                     */}
        {/* ========================================================================= */}
        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 rounded-2xl bg-mm-primary hover:bg-mm-primary/90 text-white font-black text-base shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            data-testid="master-data-save-bottom-btn"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            )}
            <span>Save My Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MasterDataPage;
