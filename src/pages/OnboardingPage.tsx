import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, ApiException } from '../services/apiService';
import { useToast } from '../context/ToastContext';
import { HORIZON_OPTIONS } from '../models/masterProfile';

const STEP_TITLES = [
  'Step 1 of 3 • Income & Expenses',
  'Step 2 of 3 • Investments & Assets',
  'Step 3 of 3 • Protection',
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // Step 1 Controllers
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [fixedExpenses, setFixedExpenses] = useState('');
  const [flexibleExpenses, setFlexibleExpenses] = useState('');

  // Step 2 Controllers
  const [equityPct, setEquityPct] = useState('');
  const [debtPct, setDebtPct] = useState('');
  const [goldPct, setGoldPct] = useState('');
  const [totalInvestment, setTotalInvestment] = useState('');

  // Step 3 Controllers
  const [termCover, setTermCover] = useState('');
  const [healthCover, setHealthCover] = useState('');
  const [emergencyFund, setEmergencyFund] = useState('');
  const [investmentHorizon, setInvestmentHorizon] = useState<string>('< 3 years');

  const parseNum = (val: string): number | null => {
    const trimmed = val.trim().replace(/,/g, '');
    if (!trimmed) return null;
    const n = parseFloat(trimmed);
    return isNaN(n) ? null : n;
  };

  const isEmpty = (val: string): boolean => val.trim().length === 0;

  const validateStep = (s: number): boolean => {
    switch (s) {
      case 0:
        return (
          !isEmpty(monthlyIncome) &&
          !isEmpty(fixedExpenses) &&
          !isEmpty(flexibleExpenses) &&
          parseNum(monthlyIncome) !== null &&
          parseNum(fixedExpenses) !== null &&
          parseNum(flexibleExpenses) !== null
        );
      case 1:
        return (
          !isEmpty(equityPct) &&
          !isEmpty(debtPct) &&
          !isEmpty(goldPct) &&
          !isEmpty(totalInvestment) &&
          parseNum(equityPct) !== null &&
          parseNum(debtPct) !== null &&
          parseNum(goldPct) !== null &&
          parseNum(totalInvestment) !== null
        );
      case 2:
        return (
          !isEmpty(termCover) &&
          !isEmpty(healthCover) &&
          !isEmpty(emergencyFund) &&
          parseNum(termCover) !== null &&
          parseNum(healthCover) !== null &&
          parseNum(emergencyFund) !== null
        );
      default:
        return false;
    }
  };

  const handleNext = () => {
    setShowErrors(true);
    if (!validateStep(step)) return;
    setStep((prev) => prev + 1);
    setShowErrors(false);
  };

  const handleBack = () => {
    setStep((prev) => Math.max(0, prev - 1));
    setShowErrors(false);
  };

  const yoyFromHorizon = (): number => {
    switch (investmentHorizon) {
      case '3-7 years':
        return 0.08;
      case '> 7 years':
        return 0.10;
      default:
        return 0.05;
    }
  };

  const handleSubmit = async () => {
    setShowErrors(true);
    if (!validateStep(2)) return;

    setSubmitting(true);
    try {
      const fixed = parseNum(fixedExpenses)!;
      const flexible = parseNum(flexibleExpenses)!;

      const payload = {
        monthly_income: parseNum(monthlyIncome)!,
        monthly_expenses: fixed + flexible,
        equity_pct: parseNum(equityPct)!,
        gold_pct: parseNum(goldPct)!,
        debt_pct: parseNum(debtPct)!,
        term_cover: parseNum(termCover)!,
        health_cover: parseNum(healthCover)!,
        liquidity_fund: parseNum(emergencyFund)!,
        income_type: 'salaried',
        stability_months: 12,
        yoy_growth_pct: yoyFromHorizon(),
        source_count: 1,
        year: new Date().getFullYear(),
        month: MONTHS[new Date().getMonth()],
      };

      await apiService.submitOnboarding(payload);
      showToast({
        message: 'Profile saved successfully!',
        backgroundColor: '#10B981',
      });
      navigate('/dashboard');
    } catch (e: any) {
      const msg = e instanceof ApiException ? e.message : 'Could not save your profile. Please try again.';
      showToast({
        message: msg,
        backgroundColor: '#EF4444',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Allocation Bar widget
  const renderAllocationBar = () => {
    const equity = Math.max(0, Math.min(100, parseNum(equityPct) ?? 0));
    const debt = Math.max(0, Math.min(100, parseNum(debtPct) ?? 0));
    const gold = Math.max(0, Math.min(100, parseNum(goldPct) ?? 0));
    const total = equity + debt + gold;

    if (total <= 0) {
      return (
        <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-full my-2" data-testid="allocation-bar-empty" />
      );
    }

    return (
      <div className="space-y-2 my-2" data-testid="allocation-bar">
        <div className="h-4 flex rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-800">
          {equity > 0 && (
            <div
              style={{ width: `${(equity / total) * 100}%` }}
              className="bg-mm-secondary"
            />
          )}
          {debt > 0 && (
            <div
              style={{ width: `${(debt / total) * 100}%` }}
              className="bg-blue-600"
            />
          )}
          {gold > 0 && (
            <div
              style={{ width: `${(gold / total) * 100}%` }}
              className="bg-mm-accent"
            />
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-mm-secondary" />
            <span>Equity</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>Debt</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-mm-accent" />
            <span>Gold</span>
          </div>
        </div>
      </div>
    );
  };

  const progress = (step + 1) / 3;

  return (
    <div className="w-full min-h-screen bg-mm-background dark:bg-mm-darkBackground flex flex-col" data-testid="onboarding-page">
      {/* Top Header matching OnboardingScreen */}
      <div className="bg-mm-primary text-white pt-8 pb-6 px-6 rounded-b-[24px] shadow-md">
        <div className="max-w-xl mx-auto space-y-2">
          <h1 className="text-xl font-bold">Financial Profile</h1>
          <p className="text-white/80 text-sm">{STEP_TITLES[step]}</p>
          <div className="h-1.5 w-full bg-white/25 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-mm-accent transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Step Form Card */}
      <div className="max-w-xl mx-auto w-full px-4 py-6 flex-1 flex flex-col justify-center">
        <div className="rounded-2xl bg-white dark:bg-mm-darkCard border border-mm-borderLight dark:border-mm-darkBorder p-6 shadow-md space-y-5">
          {/* ================================================================= */}
          {/* Step 1: Income & Expenses                                         */}
          {/* ================================================================= */}
          {step === 0 && (
            <div className="space-y-4" data-testid="step-1-content">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Monthly Income
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">₹ </span>
                  <input
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    placeholder="Enter monthly income"
                    className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                      showErrors && (isEmpty(monthlyIncome) || parseNum(monthlyIncome) === null)
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-zinc-700 focus:ring-mm-primary'
                    } bg-transparent`}
                    data-testid="input-monthlyIncome"
                  />
                </div>
                {showErrors && (isEmpty(monthlyIncome) || parseNum(monthlyIncome) === null) && (
                  <span className="text-[11px] text-red-500 mt-1 block">Required</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Monthly Fixed Expenses
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">₹ </span>
                  <input
                    type="number"
                    value={fixedExpenses}
                    onChange={(e) => setFixedExpenses(e.target.value)}
                    placeholder="Rent, EMIs, utilities"
                    className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                      showErrors && (isEmpty(fixedExpenses) || parseNum(fixedExpenses) === null)
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-zinc-700 focus:ring-mm-primary'
                    } bg-transparent`}
                    data-testid="input-fixedExpenses"
                  />
                </div>
                {showErrors && (isEmpty(fixedExpenses) || parseNum(fixedExpenses) === null) && (
                  <span className="text-[11px] text-red-500 mt-1 block">Required</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Monthly Flexible Expenses
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">₹ </span>
                  <input
                    type="number"
                    value={flexibleExpenses}
                    onChange={(e) => setFlexibleExpenses(e.target.value)}
                    placeholder="Food, travel, shopping"
                    className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                      showErrors && (isEmpty(flexibleExpenses) || parseNum(flexibleExpenses) === null)
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-zinc-700 focus:ring-mm-primary'
                    } bg-transparent`}
                    data-testid="input-flexibleExpenses"
                  />
                </div>
                {showErrors && (isEmpty(flexibleExpenses) || parseNum(flexibleExpenses) === null) && (
                  <span className="text-[11px] text-red-500 mt-1 block">Required</span>
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* Step 2: Investments & Assets                                      */}
          {/* ================================================================= */}
          {step === 1 && (
            <div className="space-y-4" data-testid="step-2-content">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Equity %
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={equityPct}
                    onChange={(e) => setEquityPct(e.target.value)}
                    placeholder="0"
                    className={`w-full px-3.5 pr-8 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                      showErrors && (isEmpty(equityPct) || parseNum(equityPct) === null)
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-zinc-700 focus:ring-mm-primary'
                    } bg-transparent`}
                    data-testid="input-equityPct"
                  />
                  <span className="absolute right-3.5 top-2.5 text-gray-400 font-bold text-sm">%</span>
                </div>
                {showErrors && (isEmpty(equityPct) || parseNum(equityPct) === null) && (
                  <span className="text-[11px] text-red-500 mt-1 block">Required</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Debt %
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={debtPct}
                    onChange={(e) => setDebtPct(e.target.value)}
                    placeholder="0"
                    className={`w-full px-3.5 pr-8 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                      showErrors && (isEmpty(debtPct) || parseNum(debtPct) === null)
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-zinc-700 focus:ring-mm-primary'
                    } bg-transparent`}
                    data-testid="input-debtPct"
                  />
                  <span className="absolute right-3.5 top-2.5 text-gray-400 font-bold text-sm">%</span>
                </div>
                {showErrors && (isEmpty(debtPct) || parseNum(debtPct) === null) && (
                  <span className="text-[11px] text-red-500 mt-1 block">Required</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Gold %
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={goldPct}
                    onChange={(e) => setGoldPct(e.target.value)}
                    placeholder="0"
                    className={`w-full px-3.5 pr-8 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                      showErrors && (isEmpty(goldPct) || parseNum(goldPct) === null)
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-zinc-700 focus:ring-mm-primary'
                    } bg-transparent`}
                    data-testid="input-goldPct"
                  />
                  <span className="absolute right-3.5 top-2.5 text-gray-400 font-bold text-sm">%</span>
                </div>
                {showErrors && (isEmpty(goldPct) || parseNum(goldPct) === null) && (
                  <span className="text-[11px] text-red-500 mt-1 block">Required</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Total Investment Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">₹ </span>
                  <input
                    type="number"
                    value={totalInvestment}
                    onChange={(e) => setTotalInvestment(e.target.value)}
                    placeholder="0"
                    className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                      showErrors && (isEmpty(totalInvestment) || parseNum(totalInvestment) === null)
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-zinc-700 focus:ring-mm-primary'
                    } bg-transparent`}
                    data-testid="input-totalInvestment"
                  />
                </div>
                {showErrors && (isEmpty(totalInvestment) || parseNum(totalInvestment) === null) && (
                  <span className="text-[11px] text-red-500 mt-1 block">Required</span>
                )}
              </div>

              <div className="pt-2">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                  Allocation split
                </span>
                {renderAllocationBar()}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* Step 3: Protection (WITH Investment Horizon)                      */}
          {/* ================================================================= */}
          {step === 2 && (
            <div className="space-y-4" data-testid="step-3-content">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Term Insurance Cover
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">₹ </span>
                  <input
                    type="number"
                    value={termCover}
                    onChange={(e) => setTermCover(e.target.value)}
                    placeholder="0"
                    className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                      showErrors && (isEmpty(termCover) || parseNum(termCover) === null)
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-zinc-700 focus:ring-mm-primary'
                    } bg-transparent`}
                    data-testid="input-termCover"
                  />
                </div>
                {showErrors && (isEmpty(termCover) || parseNum(termCover) === null) && (
                  <span className="text-[11px] text-red-500 mt-1 block">Required</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Health Insurance Cover
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">₹ </span>
                  <input
                    type="number"
                    value={healthCover}
                    onChange={(e) => setHealthCover(e.target.value)}
                    placeholder="0"
                    className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                      showErrors && (isEmpty(healthCover) || parseNum(healthCover) === null)
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-zinc-700 focus:ring-mm-primary'
                    } bg-transparent`}
                    data-testid="input-healthCover"
                  />
                </div>
                {showErrors && (isEmpty(healthCover) || parseNum(healthCover) === null) && (
                  <span className="text-[11px] text-red-500 mt-1 block">Required</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Emergency Fund Available
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">₹ </span>
                  <input
                    type="number"
                    value={emergencyFund}
                    onChange={(e) => setEmergencyFund(e.target.value)}
                    placeholder="0"
                    className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                      showErrors && (isEmpty(emergencyFund) || parseNum(emergencyFund) === null)
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-zinc-700 focus:ring-mm-primary'
                    } bg-transparent`}
                    data-testid="input-emergencyFund"
                  />
                </div>
                {showErrors && (isEmpty(emergencyFund) || parseNum(emergencyFund) === null) && (
                  <span className="text-[11px] text-red-500 mt-1 block">Required</span>
                )}
              </div>

              {/* Investment Horizon dropdown is EXCLUSIVELY on Step 3 */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Investment Horizon
                </label>
                <select
                  value={investmentHorizon}
                  onChange={(e) => setInvestmentHorizon(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-mm-primary"
                  data-testid="select-investmentHorizon"
                >
                  {HORIZON_OPTIONS.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Action buttons (Next / Back / Submit) */}
          <div className="pt-4 flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={submitting}
                className="flex-1 py-3 px-4 rounded-xl border border-mm-primary text-mm-primary font-bold text-sm hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all disabled:opacity-50"
                data-testid="onboarding-back-btn"
              >
                ← Back
              </button>
            )}

            {step < 2 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={submitting}
                className="flex-1 py-3 px-4 rounded-xl bg-mm-primary hover:bg-mm-primary/90 text-white font-bold text-sm transition-all disabled:opacity-50"
                data-testid="onboarding-next-btn"
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 px-4 rounded-xl bg-mm-primary hover:bg-mm-primary/90 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                data-testid="onboarding-submit-btn"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Submit</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
