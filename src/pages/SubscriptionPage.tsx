import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCw } from 'lucide-react';
import { apiService } from '../services/apiService';
import { usePlan } from '../hooks/usePlan';
import { premiumService, PremiumService, isProPlan } from '../services/premiumService';
import quarterlyImg from '../assets/app/quarterly_plan.png';
import halfYearlyImg from '../assets/app/half_yearly_2.png';
import yearlyImg from '../assets/app/yearly_plan_1.png';

export interface SubPlan {
  id: string;
  title: string;
  months: number;
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
  const [selectedPlan, setSelectedPlan] = useState<SubPlan>(SUBSCRIPTION_PLANS[2]); // Default Yearly
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const processSubscriptionDetails = useCallback(async (details: any) => {
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
        await premiumService.setPlan(rawPlan || PremiumService.proMembership);
      } else {
        setExpiryDate(null);
        await premiumService.setPlan(PremiumService.freeMembership);
      }
    } else {
      setExpiryDate(null);
      await premiumService.setPlan(PremiumService.freeMembership);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function fetchSubscription() {
      try {
        setLoading(true);
        const details = await apiService.getSubscriptionDetails();
        if (!isMounted) return;
        await processSubscriptionDetails(details);
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
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isSelected = selectedPlan.id === plan.id;
            return (
              <div
                key={plan.id}
                data-testid={`sub-plan-card-${plan.months}`}
                onClick={() => setSelectedPlan(plan)}
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
                      <div className="text-3xl font-black text-[var(--color-text)]">
                        {plan.storePrice}
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
                      Billed upfront as {plan.totalBilledPrice} • <span className="line-through">{plan.originalPrice}</span>{' '}
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">{plan.discount}</span>
                    </div>
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

      {/* Read-Only Purchase CTA */}
      <div className="space-y-3 pt-4">
        <button
          type="button"
          disabled
          data-testid="buy-plan-btn"
          className="w-full py-4 rounded-2xl bg-gray-300 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold text-sm cursor-not-allowed text-center shadow-inner"
        >
          Purchase in the MoneyMapper mobile app
        </button>

        <p
          data-testid="platform-fee-footnote"
          className="text-[9.5px] text-center text-gray-500 font-medium leading-relaxed"
        >
          *Final checkout price includes standard Google Play / App Store platform fees applied to base plan rates.
        </p>
      </div>
    </div>
  );
};
