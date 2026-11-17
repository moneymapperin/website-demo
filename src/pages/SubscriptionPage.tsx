import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { RotateCw, Info } from 'lucide-react';
import { apiService } from '../services/apiService';
import { usePlan } from '../hooks/usePlan';
import { useToast } from '../context/ToastContext';
import { premiumService, PremiumService, isProPlan } from '../services/premiumService';
import { paymentService } from '../services/paymentService';
import { supabase } from '../lib/supabase';
import { validateReferralCode, REFERRAL_STORAGE_KEY } from '../services/referralService';
import { calculateDiscountedPrice } from '../config/referralRules';
import { APP_COLORS } from '../theme/tokens';
import quarterlyImg from '../assets/app/quarterly_plan.png';
import halfYearlyImg from '../assets/app/half_yearly_2.png';
import yearlyImg from '../assets/app/yearly_plan_1.png';

export interface SubPlan {
  id: string;
  planCode?: string;
  title: string;
  months: number;
  rawPrice?: number;
  storePrice: string;
  totalBilledPrice: string;
  originalPrice: string;
  discount: string;
  savings: string;
  image: string;
  isRecommended?: boolean;
}

export const SUBSCRIPTION_PLANS: SubPlan[] = [
  {
    id: 'moneymapper_quarterly_sub',
    title: 'Quarterly Plan',
    months: 3,
    rawPrice: 1497,
    storePrice: '₹499',
    totalBilledPrice: '₹1,497',
    originalPrice: '₹799',
    discount: '38% OFF',
    savings: 'SAVE ₹897',
    image: quarterlyImg,
  },
  {
    id: 'moneymapper_halfyearly_sub',
    title: 'Half-Yearly Plan',
    months: 6,
    rawPrice: 2394,
    storePrice: '₹399',
    totalBilledPrice: '₹2,394',
    originalPrice: '₹799',
    discount: '50% OFF',
    savings: 'SAVE ₹2,400',
    image: halfYearlyImg,
  },
  {
    id: 'moneymapper_yearly_sub',
    title: 'Yearly Plan',
    months: 12,
    rawPrice: 3588,
    storePrice: '₹299',
    totalBilledPrice: '₹3,588',
    originalPrice: '₹799',
    discount: '62% OFF',
    savings: 'SAVE ₹6,000',
    image: yearlyImg,
    isRecommended: true,
  },
];

export const SubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const { isPro, refreshPlan } = usePlan();
  let showToast = (_opts: any) => {};
  try {
    const toast = useToast();
    showToast = toast.showToast;
  } catch {
    // Graceful fallback for environments without ToastProvider
  }
  const [plans, setPlans] = useState<SubPlan[]>(SUBSCRIPTION_PLANS);
  const [plansAvailable, setPlansAvailable] = useState<boolean>(true);
  const [selectedPlan, setSelectedPlan] = useState<SubPlan>(SUBSCRIPTION_PLANS[2]); // Default Yearly
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const [referralCode, setReferralCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [referralMessage, setReferralMessage] = useState<string>('');
  const [isCheckingReferral, setIsCheckingReferral] = useState(false);
  const [isReferralValid, setIsReferralValid] = useState<boolean>(false);

  const handleApplyReferral = useCallback(
    async (overrideCode?: string, overridePlan?: SubPlan) => {
      const code = (overrideCode !== undefined ? overrideCode : referralCode).trim().toUpperCase();
      const planToValidate = overridePlan || selectedPlan;

      if (!code) {
        setAppliedDiscount(0);
        setReferralMessage('');
        setIsReferralValid(false);
        return;
      }

      setIsCheckingReferral(true);
      try {
        const planCode = planToValidate.planCode || planToValidate.id;
        const result = await validateReferralCode(
          code,
          supabase,
          undefined,
          planCode,
          planToValidate.rawPrice
        );
        if (result.valid) {
          setAppliedDiscount(result.discountAmount);
          setReferralMessage(result.message);
          setIsReferralValid(true);
        } else {
          setAppliedDiscount(0);
          setReferralMessage(result.message);
          setIsReferralValid(false);
        }
      } catch {
        setAppliedDiscount(0);
        setReferralMessage('Error validating code.');
        setIsReferralValid(false);
      } finally {
        setIsCheckingReferral(false);
      }
    },
    [referralCode, selectedPlan]
  );

  // Re-run validation whenever the selected plan changes. Clear the applied discount until re-validated.
  const handleSelectPlan = (newPlan: SubPlan) => {
    setSelectedPlan(newPlan);
    setAppliedDiscount(0);
    setIsReferralValid(false);
    if (referralCode.trim()) {
      handleApplyReferral(referralCode, newPlan);
    } else {
      setReferralMessage('');
    }
  };

  // Auto-fill and validate saved referral code if present in localStorage
  useEffect(() => {
    try {
      const savedCode = localStorage.getItem(REFERRAL_STORAGE_KEY);
      if (savedCode && savedCode.trim()) {
        const code = savedCode.trim().toUpperCase();
        setReferralCode(code);
        handleApplyReferral(code);
      }
    } catch (e) {
      console.warn('Could not read saved referral code:', e);
    }
  }, [handleApplyReferral]);

  const processSubscriptionDetails = useCallback(async (details: any, updateServicePlan: boolean = true) => {
    if (details?.current_period_end) {
      const rawPlan =
        details.tier ??
        details.plan ??
        (details.current_period_end && !('tier' in details) && !('plan' in details) ? PremiumService.proMembership : undefined);
      const hasPro = isProPlan(rawPlan);
      const expiry = new Date(details.current_period_end);
      const isUnexpired = !isNaN(expiry.getTime()) && expiry.getTime() > Date.now();

      if (hasPro && isUnexpired) {
        const formatted = expiry.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
        setExpiryDate(formatted);
        const targetPlan = rawPlan || PremiumService.proMembership;
        if (updateServicePlan && premiumService.getCachedPlan() !== targetPlan) {
          await premiumService.setPlan(targetPlan);
        }
      } else {
        setExpiryDate(null);
        if (updateServicePlan && premiumService.getCachedPlan() !== PremiumService.freeMembership) {
          await premiumService.setPlan(PremiumService.freeMembership);
        }
      }
    } else {
      setExpiryDate(null);
      if (updateServicePlan && premiumService.getCachedPlan() !== PremiumService.freeMembership) {
        await premiumService.setPlan(PremiumService.freeMembership);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function fetchSubscription() {
      try {
        setLoading(true);
        const details = await apiService.getSubscriptionDetails();
        if (!isMounted) return;
        await processSubscriptionDetails(details, true);
      } catch (err) {
        console.error('Could not fetch subscription details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSubscription();
    return () => {
      isMounted = false;
    };
  }, [processSubscriptionDetails]);

  // Load real plans dynamically from payments.plans in Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadDynamicPlans() {
      try {
        const { data, error } = await supabase
          .schema('payments')
          .from('plans')
          .select('*')
          .order('months_duration', { ascending: true });

        if (error || !data || data.length === 0) {
          if (error) {
            console.error('Could not load plans from payments.plans:', error);
          }
          if (isMounted) {
            setPlansAvailable(false);
            showToast('Plans are unavailable right now. Please try again later.');
          }
          return;
        }

        const loadedPlans: SubPlan[] = data.map((row: any) => {
          const rawPrice = Number(row.discounted_price);
          const originalPrice = Number(row.original_price);
          const months = Number(row.months_duration);

          const monthlyPrice = Math.round(rawPrice / months);
          const totalOriginal = originalPrice * months;
          const savingsAmt = totalOriginal - rawPrice;
          const discountPct = totalOriginal > 0 ? Math.round((savingsAmt / totalOriginal) * 100) : 0;

          let mappedImage = quarterlyImg;
          if (months === 6) {
            mappedImage = halfYearlyImg;
          } else if (months === 12) {
            mappedImage = yearlyImg;
          }

          return {
            id: String(row.id),
            planCode: String(row.plan_code),
            title: row.title,
            months,
            rawPrice,
            storePrice: `₹${monthlyPrice.toLocaleString('en-IN')}`,
            totalBilledPrice: `₹${Math.round(rawPrice).toLocaleString('en-IN')}`,
            originalPrice: `₹${Math.round(originalPrice).toLocaleString('en-IN')}`,
            discount: `${discountPct}% OFF`,
            savings: `SAVE ₹${Math.round(savingsAmt).toLocaleString('en-IN')}`,
            image: mappedImage,
            isRecommended: row.is_recommended === true,
          };
        });

        if (!isMounted) return;

        setPlans(loadedPlans);
        setPlansAvailable(true);

        const defaultPlan =
          loadedPlans.find((p) => p.isRecommended) ||
          loadedPlans.find((p) => p.months === 12) ||
          loadedPlans[0];

        setSelectedPlan((prev) => {
          const matching = loadedPlans.find((p) => p.months === prev.months);
          return matching || defaultPlan;
        });
      } catch (err) {
        console.error('Exception loading dynamic plans:', err);
        if (isMounted) {
          setPlansAvailable(false);
          showToast('Plans are unavailable right now. Please try again later.');
        }
      }
    }

    loadDynamicPlans();
    return () => {
      isMounted = false;
    };
  }, []);

  // Re-read details and update expiry banner whenever the plan changes (two-way sync)
  useEffect(() => {
    const unsubscribe = premiumService.subscribe(async () => {
      try {
        const details = await apiService.getSubscriptionDetails();
        await processSubscriptionDetails(details, false);
      } catch (err) {
        console.error('Could not update subscription on plan change:', err);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [processSubscriptionDetails]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshPlan(true);
      const details = await apiService.getSubscriptionDetails();
      await processSubscriptionDetails(details);
    } catch (err) {
      console.error('Could not refresh subscription details:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleBuyPlan = async () => {
    if (paymentLoading || isFinalizing) return;

    if (!plansAvailable || !selectedPlan.planCode) {
      showToast('Plans are unavailable right now. Please try again later.');
      return;
    }

    const canSendReferral =
      appliedDiscount > 0 &&
      isReferralValid &&
      Boolean(referralCode.trim());

    try {
      setPaymentLoading(true);
      const result = await paymentService.startCheckout(selectedPlan, {
        referralCode: canSendReferral ? referralCode.trim().toUpperCase() : undefined,
        isReferralValid: canSendReferral,
        navigate,
        showToast,
        refreshPlan,
        onFinalizingChange: setIsFinalizing,
      });
      void result;

      await refreshPlan(true);
      const details = await apiService.getSubscriptionDetails();
      await processSubscriptionDetails(details);
    } catch (err: any) {
      if (err?.isCancelled || err?.message === 'Payment cancelled.') {
        showToast('Payment cancelled.');
      } else if (
        err?.code === 'GATEWAYS_UNAVAILABLE' ||
        err?.message?.includes('temporarily down for maintenance')
      ) {
        showToast({
          message: 'Payments are temporarily down for maintenance. Please try again later.',
          backgroundColor: APP_COLORS.danger,
        });
      } else if (
        err?.message === 'Plan is not available for purchase right now.'
      ) {
        showToast('Plans are unavailable right now. Please try again later.');
      } else if (
        err?.message?.toLowerCase().includes('failed to fetch') ||
        err?.message?.toLowerCase().includes('network') ||
        err?.message?.toLowerCase().includes('unreachable')
      ) {
        showToast('Online payments are not available right now.');
      } else {
        showToast({
          message: err?.message || 'Payment initiation failed',
          backgroundColor: APP_COLORS.danger,
        });
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  const isSelectedPlanDiscounted =
    appliedDiscount > 0 &&
    isReferralValid;

  const selectedPriceCalc = isSelectedPlanDiscounted && selectedPlan.rawPrice
    ? calculateDiscountedPrice(selectedPlan.rawPrice, appliedDiscount)
    : { effectiveDiscount: 0, finalPrice: selectedPlan.rawPrice || 0 };

  const isFreeActivation = isSelectedPlanDiscounted && selectedPriceCalc.finalPrice === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-8">
      {/* Header / AppBar */}
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            data-testid="subscription-back-btn"
            onClick={() => navigate(-1)}
            className="text-xs font-bold text-gray-400 hover:text-[var(--color-text)] mb-2 flex items-center gap-1"
          >
            ← Back
          </button>
          <h1 data-testid="subscription-page-title" className="text-3xl md:text-4xl font-black tracking-tight text-[var(--color-text)]">
            Wealth Select
          </h1>
          <p className="text-xs md:text-sm text-[var(--color-text-secondary)] mt-1">
            Unlock all 5 financial health pillars and advanced market intelligence
          </p>
        </div>
      </div>

      {/* Active Subscription Banner */}
      <div
        data-testid="active-subscription-banner"
        className="p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              ACTIVE SUBSCRIPTION
            </span>
            {isPro && (
              <span
                data-testid="pro-badge"
                className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-600 dark:text-indigo-300 text-[10px] font-black uppercase tracking-wider"
              >
                PRO
              </span>
            )}
          </div>
          <div data-testid="subscription-status-text" className="text-base md:text-lg font-bold text-[var(--color-text)]">
            {loading ? (
              'Checking subscription...'
            ) : expiryDate ? (
              `Valid until: ${expiryDate}`
            ) : isPro ? (
              'PRO Plan Active'
            ) : (
              'Free Tier - Limited Access'
            )}
          </div>
        </div>

        <button
          type="button"
          data-testid="refresh-status-btn"
          disabled={refreshing || loading}
          onClick={handleRefresh}
          className="px-4 py-2.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          title="Force refresh status from server"
        >
          <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Checking...' : 'Refresh status'}
        </button>
      </div>

      {/* Plan Cards Grid */}
      <div className="space-y-6">
        <h2 className="text-xl font-black text-[var(--color-text)]">
          Upgrade to PRO 🚀
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => {
            const isSelected = selectedPlan.id === plan.id;
            const isCodeValidForThisPlan =
              isSelected &&
              appliedDiscount > 0 &&
              isReferralValid;

            const { effectiveDiscount, finalPrice } = isCodeValidForThisPlan && plan.rawPrice
              ? calculateDiscountedPrice(plan.rawPrice, appliedDiscount)
              : { effectiveDiscount: 0, finalPrice: plan.rawPrice || 0 };

            return (
              <div
                key={plan.id}
                data-testid={`sub-plan-card-${plan.months}`}
                onClick={() => handleSelectPlan(plan)}
                className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between relative ${
                  isSelected
                    ? 'bg-indigo-500/5 border-indigo-500 shadow-xl ring-2 ring-indigo-500/20 scale-[1.02]'
                    : 'bg-[var(--color-card)] border-[var(--color-border)] hover:border-gray-400/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-lg font-bold text-[var(--color-text)]">
                      {plan.title}
                    </span>
                    {plan.isRecommended && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-500 text-[10px] font-black tracking-wide">
                        BEST VALUE
                      </span>
                    )}
                  </div>

                  <div className="my-4 flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-black text-[var(--color-text)] flex items-baseline gap-2">
                        {isCodeValidForThisPlan && plan.rawPrice ? (
                          <>
                            <span className="text-emerald-600 dark:text-emerald-400">
                              ₹{Math.round(finalPrice / plan.months).toLocaleString('en-IN')}
                            </span>
                            <span className="text-lg line-through text-gray-400 font-normal">
                              {plan.storePrice}
                            </span>
                          </>
                        ) : (
                          plan.storePrice
                        )}
                      </div>
                      <div className="text-xs font-bold text-gray-400">/ month</div>
                    </div>
                    <img
                      src={plan.image}
                      alt={plan.title}
                      className="w-16 h-16 object-contain shrink-0 select-none pointer-events-none drop-shadow-sm"
                    />
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-[var(--color-border)]/50">
                    <div className="text-xs text-gray-400">
                      Billed upfront as{' '}
                      {isCodeValidForThisPlan && plan.rawPrice ? (
                        <>
                          <span className="line-through mr-1">{plan.totalBilledPrice}</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold mr-1">
                            ₹{Math.round(finalPrice).toLocaleString('en-IN')}
                          </span>
                        </>
                      ) : (
                        <>{plan.totalBilledPrice} • </>
                      )}
                      <span className="line-through">{plan.originalPrice}</span>{' '}
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">{plan.discount}</span>
                    </div>
                    {isCodeValidForThisPlan && effectiveDiscount > 0 && (
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{effectiveDiscount} Referral discount applied
                      </div>
                    )}
                    <div className="text-xs font-black text-amber-500">
                      {plan.savings}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3">
                  <div
                    className={`w-full py-2.5 rounded-xl text-center text-xs font-black uppercase tracking-wider ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-md shadow-purple-500/20'
                        : 'bg-zinc-800/10 dark:bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {isSelected ? 'SELECTED PLAN' : 'SELECT PLAN'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Referral Code Section */}
      <div
        data-testid="referral-code-section"
        className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm space-y-2"
      >
        <label
          htmlFor="referral-code-input"
          className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]"
        >
          Have a Referral Code?
        </label>
        <div className="flex gap-2.5">
          <input
            id="referral-code-input"
            type="text"
            data-testid="referral-code-input"
            value={referralCode}
            onChange={(e) => {
              setReferralCode(e.target.value.toUpperCase());
              if (appliedDiscount > 0 || referralMessage) {
                setAppliedDiscount(0);
                setReferralMessage('');
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleApplyReferral();
              }
            }}
            placeholder="Enter Referral Code (Optional)"
            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-[#070B1F]/90 border border-slate-200 dark:border-[#1E2954] rounded-xl text-[var(--color-text)] placeholder-slate-400 focus:outline-none focus:border-[#0084FF] focus:ring-1 focus:ring-[#0084FF] transition-all text-sm font-semibold uppercase tracking-wider"
          />
          <button
            type="button"
            data-testid="apply-referral-btn"
            disabled={isCheckingReferral || !referralCode.trim()}
            onClick={() => handleApplyReferral()}
            className="px-5 py-2.5 bg-[#0084FF] hover:bg-[#0070DD] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
          >
            {isCheckingReferral ? (
              <RotateCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              'APPLY'
            )}
          </button>
        </div>
        {referralMessage && (
          <p
            data-testid="referral-status-message"
            className={`text-xs font-semibold ${
              appliedDiscount > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-500 dark:text-red-400'
            }`}
          >
            {referralMessage}
          </p>
        )}
      </div>

      {/* Purchase CTA */}
      <div className="space-y-3 pt-4">
        <button
          type="button"
          disabled={paymentLoading || isFinalizing || !plansAvailable || !selectedPlan.planCode}
          title={!plansAvailable || !selectedPlan.planCode ? 'Plans are unavailable right now. Please try again later.' : undefined}
          data-testid="buy-plan-btn"
          onClick={handleBuyPlan}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:via-purple-500 hover:to-indigo-600 text-white font-bold text-sm text-center shadow-lg hover:shadow-indigo-500/25 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {paymentLoading ? (
            <span className="flex items-center justify-center gap-2">
              <RotateCw className="w-4 h-4 animate-spin" />
              Processing...
            </span>
          ) : isFreeActivation ? (
            'Activate PRO for free'
          ) : isSelectedPlanDiscounted && selectedPlan.rawPrice ? (
            `Get Financially Free (₹${Math.round(selectedPriceCalc.finalPrice).toLocaleString('en-IN')})`
          ) : (
            `Get Financially Free (${selectedPlan.totalBilledPrice})`
          )}
        </button>

        {isFreeActivation && (
          <p
            data-testid="free-activation-note"
            className="text-xs text-center text-emerald-600 dark:text-emerald-400 font-medium"
          >
            No payment needed. Your referral code covers this plan.
          </p>
        )}

        {/* Terms and conditions apply note */}
        <div className="flex justify-center pt-2">
          <Link
            to="/terms-and-conditions"
            data-testid="terms-and-conditions-link"
            className="group inline-flex flex-col items-center justify-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer p-1.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <Info className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors" />
            <span className="font-medium">Terms and conditions apply</span>
          </Link>
        </div>
      </div>

      {paymentLoading && !isFinalizing && (
        <div data-testid="payment-loading-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200 dark:border-indigo-500/30 shadow-2xl">
            <RotateCw className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
            <p className="text-xs font-bold text-slate-800 dark:text-white">Processing payment...</p>
          </div>
        </div>
      )}

      {isFinalizing && (
        <div
          data-testid="finalize-loading-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-white dark:bg-[#0E0B1F] border border-slate-200 dark:border-indigo-500/30 shadow-2xl text-center max-w-sm mx-4">
            <RotateCw className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
            <p className="text-xs font-bold text-slate-800 dark:text-white">
              Confirming your payment, please do not close or refresh this page.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
