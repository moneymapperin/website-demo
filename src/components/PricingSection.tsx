import { useState } from 'react';
import { ArrowRight, Check, Crown } from 'lucide-react';
import { navigateTo } from '../lib/navigation';

const benefits = [
  'Full access to all 5 financial pillars',
  'AI-powered insights & recommendations',
  'Weekly financial tracking & reports',
  'Monthly detailed analysis',
  'Access on web and mobile',
];

const plans = [
  { id: 'quarterly', name: 'Quarterly', price: '499', action: 'Get Quarterly Plan', highlight: false },
  { id: 'halfYearly', name: 'Half Yearly', price: '399', action: 'Get Half Yearly Plan', highlight: 'popular' as const },
  { id: 'yearly', name: 'Yearly', price: '299', action: 'Get Yearly Plan', highlight: 'value' as const },
];

type PlanId = (typeof plans)[number]['id'];

export const PricingSection: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('yearly');

  return (
  <section id="pricing" className="relative scroll-mt-24 overflow-hidden py-16 sm:py-20 lg:py-24">
    <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(124,58,237,0.15),transparent_52%)]" />
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.18em] text-purple-300">PRICING</p>
        <h2 className="mt-3 text-4xl font-extrabold leading-tight text-white sm:text-5xl">Choose a Plan<br />for a Smarter<br /><span className="text-purple-300">Financial.</span></h2>
        <p className="mt-4 max-w-lg text-sm leading-6 text-white/65 sm:text-base">Simple, affordable plans to help you track, plan and grow your money with AI-powered insights.</p>
      </div>

      <div className="mt-16 border-t border-white/[0.08] pt-10 sm:mt-20 sm:pt-12">
        <p className="text-xs font-semibold tracking-[0.18em] text-purple-300">PRICING PLANS</p>
        <h3 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Pick the plan that <span className="text-purple-300">works for you.</span></h3>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">All plans include full access to MoneyMapper, AI insights and complete financial tracking across 5 pillars.</p>

        <div className="mt-8 flex flex-wrap items-center gap-2" role="tablist" aria-label="Pricing plans">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <button
                key={plan.id}
                id={`pricing-tab-${plan.id}`}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls={`pricing-plan-${plan.id}`}
                onClick={() => setSelectedPlan(plan.id)}
                className={`rounded-full border px-4 py-2 text-xs transition-all duration-200 motion-reduce:transition-none active:scale-[0.98] ${isSelected ? 'border-purple-400/40 bg-purple-500/20 font-semibold text-white' : 'border-white/10 text-white/55 md:hover:border-white/30 md:hover:bg-white/5 md:hover:text-white'}`}
              >
                {plan.name}
              </button>
            );
          })}
          <span className="ml-1 text-xs italic text-purple-200">Best Value</span>
        </div>

        <div className="mt-7 grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.id}
              id={`pricing-plan-${plan.id}`}
              role="tabpanel"
              aria-labelledby={`pricing-tab-${plan.id}`}
              onClick={() => setSelectedPlan(plan.id)}
              className={`group relative flex cursor-pointer flex-col rounded-xl border bg-gradient-to-b from-[#151329] to-[#0e0c1a] p-5 transition-all duration-300 motion-reduce:transition-none motion-reduce:transform-none motion-reduce:hover:transform-none md:hover:-translate-y-2 md:hover:border-brand-purple/50 md:hover:shadow-xl md:hover:shadow-brand-purple/20 sm:p-6 ${selectedPlan === plan.id ? '-translate-y-2 border-brand-purple/50 shadow-xl shadow-brand-purple/20 motion-reduce:translate-y-0' : 'border-white/10'}`}
            >
              {plan.highlight && <span className={`absolute right-4 top-4 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold ${plan.highlight === 'value' ? 'bg-rose-500 text-white' : 'border border-cyan-400/30 bg-cyan-500/10 text-cyan-100'}`}><Crown className="h-3 w-3" />{plan.highlight === 'value' ? 'BEST VALUE' : 'MOST POPULAR'}</span>}
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-purple-400/10 text-purple-300 transition-all duration-300 md:group-hover:scale-105 md:group-hover:shadow-[0_0_18px_rgba(168,85,247,0.3)] motion-reduce:transition-none motion-reduce:transform-none"><Crown className="h-5 w-5" /></div>
              <h4 className="mt-4 text-xl font-semibold text-white transition-colors duration-200 md:group-hover:text-white">{plan.name}</h4>
              <p className="mt-1 text-sm text-white/60">{plan.name === 'Quarterly' ? 'Quarterly' : plan.name === 'Half Yearly' ? 'Half Yearly' : 'Yearly'}</p>
              <div className="mt-5 text-4xl font-bold text-white transition-colors duration-200 md:group-hover:text-purple-100">₹{plan.price}<span className="text-sm font-medium text-white/55"> / month</span></div>
              <button onClick={() => navigateTo('/register')} className={`mt-5 inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition-all duration-200 motion-reduce:transition-none active:scale-[0.98] ${selectedPlan === plan.id ? 'border-transparent bg-brand-gradient text-white md:hover:opacity-95' : 'border-purple-400/50 text-white md:hover:border-white/30 md:hover:bg-[#1c1930] md:hover:opacity-95'}`}>
                {plan.action} <ArrowRight className="h-4 w-4 transition-transform duration-200 md:group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:transform-none" />
              </button>
              <ul className="mt-6 space-y-3 text-xs leading-5 text-white/75">
                {benefits.map((benefit) => <li key={benefit} className="flex items-start gap-2.5 transition-all duration-200 md:hover:translate-x-1 md:hover:text-white motion-reduce:transition-none motion-reduce:transform-none"><span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border border-purple-400/40 bg-purple-400/15 text-purple-200"><Check className="h-2.5 w-2.5" /></span><span>{benefit}</span></li>)}
              </ul>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-12 grid gap-3 rounded-xl border border-purple-400/20 bg-[#141124]/80 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
        {['Track Today', 'Build Discipline', 'Make Smarter Decisions', 'Financial Freedom'].map((step) => <div key={step} className="flex min-h-12 items-center justify-center rounded-lg bg-white/[0.025] px-3 text-center text-xs font-medium text-white/70">{step}</div>)}
      </div>

      <div className="relative mt-8 overflow-hidden rounded-xl border border-purple-400/25 bg-[radial-gradient(ellipse_at_80%_50%,rgba(124,58,237,0.25),transparent_52%),linear-gradient(110deg,#150d2b,#100c1c)] p-6 sm:p-9 lg:p-12">
        <p className="text-xs font-semibold tracking-[0.18em] text-purple-300">START YOUR JOURNEY TODAY</p>
        <h3 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl">Take Control of<br />Your <span className="text-purple-300">Financial Life</span></h3>
        <p className="mt-4 max-w-lg text-sm leading-6 text-white/65 sm:text-base">Join thousands of individuals who are building a more secure and stress-free future with MoneyMapper.</p>
        <button onClick={() => navigateTo('/register')} className="group mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-6 py-3.5 text-sm font-semibold text-white transition-all duration-200 md:hover:opacity-95 active:scale-[0.98] motion-reduce:transition-none">Get Started Now <ArrowRight className="h-4 w-4 transition-transform duration-200 md:group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:transform-none" /></button>
      </div>
    </div>
  </section>
  );
};

export default PricingSection;