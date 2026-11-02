import { ArrowRight, Eye, LockKeyhole, Shield, Sparkles, Target, TrendingUp, Users, Wallet } from 'lucide-react';
import { navigateTo } from '../lib/navigation';

const pillars = [
  { number: '01', title: 'Stock & Investment', description: 'Track your stocks, ETFs and portfolio performance', icon: TrendingUp },
  { number: '02', title: 'Mutual Funds', description: 'Monitor SIPs, returns and top performing funds', icon: Sparkles },
  { number: '03', title: 'Insurance', description: 'Keep track of your policies & coverage', icon: Shield },
  { number: '04', title: 'Emergency Fund', description: 'Build & track your financial safety net', icon: Wallet },
  { number: '05', title: 'Goals & Planning', description: 'Plan your goals and achieve them step by step', icon: Target },
];

const scores = [
  { title: 'Stock Score', score: '75', detail: 'NIFTY 50 Companies' },
  { title: 'Mutual Fund Score', score: '82', detail: 'Top Performing Funds' },
  { title: 'Insurance Score', score: '83', detail: '32 Life & Health Plans' },
  { title: 'IPO Score', score: '78', detail: 'Upcoming IPOs' },
];

const cardHover = 'transition-all duration-300 motion-reduce:transition-none motion-reduce:transform-none motion-reduce:hover:transform-none md:hover:-translate-y-1.5 md:hover:border-brand-purple/40 md:hover:shadow-lg md:hover:shadow-brand-purple/15';

export const AboutSection: React.FC = () => (
  <section id="about" className="relative scroll-mt-24 overflow-hidden py-16 sm:py-20 lg:py-24">
    <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_70%_12%,rgba(124,58,237,0.16),transparent_48%)]" />
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-purple-300">ABOUT US</p>
          <h2 className="max-w-2xl text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            We’re building a <span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">better relationship</span> with money.
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/65 sm:text-base">
            At MoneyMapper, we believe financial freedom isn’t about earning more — it’s about having clarity, discipline and the right guidance at every step of your journey.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button onClick={() => navigateTo('/register')} className="group inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-white transition-all duration-200 md:hover:opacity-95 active:scale-[0.98] motion-reduce:transition-none">
              Get Started Free <ArrowRight className="h-4 w-4 transition-transform duration-200 md:group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:transform-none" />
            </button>
            <a href="#our-story" className="rounded-xl border border-white/15 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white transition-all duration-200 md:hover:border-white/30 md:hover:bg-[#1c1930] active:scale-[0.98] motion-reduce:transition-none">
              Our Story
            </a>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-8 gap-y-4">
            {[['5', 'Financial Pillars'], ['1', 'AI Assistant'], ['1', 'Clearer You']].map(([value, label]) => (
              <div key={label} className={`group min-w-24 border-r border-white/10 pr-7 last:border-0 ${cardHover}`}>
                <strong className="block text-2xl font-bold text-purple-300">{value}</strong>
                <span className="text-xs text-white/60">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { title: 'AI Assistant', detail: 'Smart Guidance', icon: Sparkles, color: 'text-purple-300 bg-purple-400/10' },
            { title: '5 Financial Pillars', detail: 'Holistic View', icon: Target, color: 'text-cyan-300 bg-cyan-400/10' },
            { title: 'Real-time Insights', detail: 'Data that matters', icon: TrendingUp, color: 'text-emerald-300 bg-emerald-400/10' },
            { title: 'Secure & Private', detail: 'Your data, your control', icon: LockKeyhole, color: 'text-amber-300 bg-amber-400/10' },
          ].map(({ title, detail, icon: Icon, color }) => (
            <div key={title} className={`group flex items-center gap-3 rounded-xl border border-white/[0.09] bg-[#141124]/90 p-4 sm:p-5 ${cardHover}`}>
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg transition-all duration-300 md:group-hover:scale-105 md:group-hover:shadow-[0_0_18px_rgba(168,85,247,0.25)] motion-reduce:transition-none motion-reduce:transform-none ${color}`}><Icon className="h-5 w-5" /></span>
              <div><h3 className="text-sm font-semibold text-white transition-colors duration-200 group-hover:text-white">{title}</h3><p className="mt-1 text-xs text-white/50">{detail}</p></div>
            </div>
          ))}
          <div className={`group relative flex min-h-36 items-center justify-center overflow-hidden rounded-xl border border-purple-400/20 bg-[#141124] sm:col-span-2 ${cardHover} md:hover:scale-[1.01]`}>
            <div className="absolute h-32 w-32 rounded-full border-[18px] border-purple-400/20 shadow-[0_0_55px_rgba(124,58,237,0.3)]" />
            <p className="relative text-center text-sm italic text-white/70">From confusion<br /><span className="text-purple-300">To confidence</span></p>
          </div>
        </div>
      </div>

      <div className="mt-20 lg:mt-28">
        <div className="mb-8 max-w-2xl">
          <h3 className="text-2xl font-bold text-white sm:text-3xl">Our <span className="text-purple-300">Mission, Vision & Beliefs</span></h3>
          <p className="mt-3 text-sm leading-6 text-white/60">We are on a mission to make financial discipline simple, accessible and actionable for every Indian — through the right blend of human guidance and technology.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className={`group rounded-xl border border-white/[0.08] bg-[#141124]/90 p-5 ${cardHover}`}>
            <Target className="h-5 w-5 text-purple-300 transition-all duration-300 md:group-hover:scale-105 md:group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.6)] motion-reduce:transition-none motion-reduce:transform-none" />
            <h4 className="mt-4 text-base font-semibold text-white transition-colors duration-200 group-hover:text-white">Our Mission</h4>
            <p className="mt-2 text-sm leading-6 text-white/60">To empower individuals and organizations to take control of their financial life through clarity, discipline and AI-powered insights.</p>
          </article>
          <article className={`group rounded-xl border border-white/[0.08] bg-[#141124]/90 p-5 ${cardHover}`}>
            <Eye className="h-5 w-5 text-cyan-300 transition-all duration-300 md:group-hover:scale-105 md:group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.55)] motion-reduce:transition-none motion-reduce:transform-none" />
            <h4 className="mt-4 text-base font-semibold text-white transition-colors duration-200 group-hover:text-white">Our Vision</h4>
            <p className="mt-2 text-sm leading-6 text-white/60">A financially aware and secure India, where every individual and organization has the tools, support and confidence to make better money decisions.</p>
          </article>
          <article className={`group rounded-xl border border-white/[0.08] bg-[#141124]/90 p-5 ${cardHover}`}>
            <Users className="h-5 w-5 text-emerald-300 transition-all duration-300 md:group-hover:scale-105 md:group-hover:drop-shadow-[0_0_8px_rgba(52,211,153,0.55)] motion-reduce:transition-none motion-reduce:transform-none" />
            <h4 className="mt-4 text-base font-semibold text-white transition-colors duration-200 group-hover:text-white">Our Beliefs</h4>
            <ul className="mt-3 space-y-2 text-sm leading-5 text-white/60">
              <li>Financial discipline leads to freedom</li>
              <li>Simple tools create lasting habits</li>
              <li>Technology should empower, not confuse</li>
              <li>Better financial decisions build better lives</li>
            </ul>
          </article>
          <div className={`group flex flex-col justify-center rounded-xl border border-purple-400/20 bg-[#141124]/70 p-5 text-center italic text-white/65 ${cardHover}`}>
            <span>From confusion</span><span className="my-2 text-xl text-purple-300">↓</span><span>To confidence</span>
          </div>
        </div>
      </div>

      <div className="mt-20 lg:mt-28">
        <p className="font-mono text-xs text-purple-300">The MoneyMapper System</p>
        <h3 className="mt-2 text-2xl font-bold text-white sm:text-3xl">A complete view of your <span className="text-purple-300">financial life.</span></h3>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">We help you bring structure, clarity and discipline across 5 core pillars, with weekly behavior tracking and monthly strategic planning.</p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {pillars.map(({ number, title, description, icon: Icon }) => (
            <article key={number} className={`group rounded-xl border border-white/[0.08] bg-[#141124]/90 p-4 ${cardHover}`}>
              <Icon className="h-5 w-5 text-purple-300 transition-transform duration-300 md:group-hover:scale-105 md:group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.6)] motion-reduce:transition-none motion-reduce:transform-none" />
              <span className="mt-4 block text-xs text-purple-300">{number}</span>
              <h4 className="mt-1 text-sm font-semibold text-white">{title}</h4>
              <p className="mt-2 text-xs leading-5 text-white/55">{description}</p>
            </article>
          ))}
        </div>
      </div>

      <div className={`mt-10 rounded-xl border border-white/[0.09] bg-[#100e1b] p-4 sm:p-6 ${cardHover}`}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div><strong className="text-sm text-white">MoneyMapper</strong><span className="ml-2 rounded-full bg-purple-500/20 px-2 py-1 text-[10px] font-semibold text-purple-200">PREMIUM</span></div>
          <span className="text-xs text-white/50">This Month</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className={`group rounded-lg border border-white/[0.08] bg-white/[0.025] p-4 ${cardHover}`}>
            <h4 className="text-xs font-semibold text-white/75 transition-colors duration-200 group-hover:text-white">Financial Fitness Score · AVERAGE</h4>
            <div className="mt-3 flex items-center gap-4"><strong className="text-3xl text-amber-300">45<span className="text-xs text-white/50"> / 100</span></strong><div><p className="text-xs text-emerald-300">↗ +12 pts from last month</p><p className="mt-1 text-xs text-white/45">Based on spending ratio, investments & debts.</p></div></div>
          </div>
          <div className={`group rounded-lg border border-white/[0.08] bg-white/[0.025] p-4 ${cardHover}`}>
            <h4 className="text-xs font-semibold text-white/75 transition-colors duration-200 group-hover:text-white">Net Financial Position</h4>
            <strong className="mt-2 block text-2xl text-white">₹2,843,000</strong>
            <p className="mt-1 text-xs text-emerald-300">+₹18,450 (8.3%) <span className="text-white/45">vs last month</span></p>
          </div>
          <div className={`group rounded-lg border border-white/[0.08] bg-white/[0.025] p-4 ${cardHover}`}>
            <h4 className="text-xs font-semibold text-white/75 transition-colors duration-200 group-hover:text-white">LIVE GOLD RATE 24K <span className="font-normal">(PER GRAM)</span></h4>
          </div>
          <div className={`group rounded-lg border border-white/[0.08] bg-white/[0.025] p-4 ${cardHover}`}>
            <h4 className="text-xs font-semibold text-white/75 transition-colors duration-200 group-hover:text-white">ESTIMATED SPENDING LIMIT</h4>
            <strong className="mt-2 block text-lg text-white">₹13,300 - ₹14,700</strong>
            <p className="mt-1 text-xs text-white/50">This Week Tonight <span className="text-emerald-300">● Safe buffer</span></p>
          </div>
        </div>
        <h4 className="mb-3 mt-5 text-xs font-semibold text-white/70">MONEYMAPPER SCORE CARDS</h4>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {scores.map(({ title, score, detail }) => <div key={title} className={`group rounded-lg border border-white/[0.08] bg-white/[0.025] p-3 ${cardHover}`}><h5 className="text-xs text-white/65 transition-colors duration-200 group-hover:text-white">{title}</h5><strong className="mt-2 block text-xl text-emerald-300">{score} <span className="text-xs text-white/40">/100</span></strong><span className="text-[10px] text-white/40">{detail}</span></div>)}
        </div>
      </div>

      <div id="our-story" className={`group mt-16 grid scroll-mt-24 gap-8 rounded-xl border border-white/[0.08] bg-[#141124]/70 p-6 sm:p-9 lg:grid-cols-[1.2fr_0.8fr] lg:p-12 ${cardHover}`}>
        <div>
          <p className="text-xs font-semibold text-purple-300">Our Story</p>
          <h3 className="mt-2 text-2xl font-bold text-white transition-colors duration-200 group-hover:text-white sm:text-3xl">Why <span className="text-purple-300">MoneyMapper?</span></h3>
          <p className="mt-4 text-sm leading-6 text-white/65">We started MoneyMapper with a simple observation — most people know they should manage their money better, but they don’t have a simple system, the right guidance, or the discipline to do it consistently.</p>
          <p className="mt-3 text-sm leading-6 text-white/65">We’ve seen friends, families and colleagues struggle with the same challenges — irregular savings, poor planning, lack of protection and last-minute tax decisions. We built MoneyMapper to solve this through a structured, technology-enabled and human-centred approach.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 self-center text-center text-xs font-bold tracking-wide text-white/65">
          <span className={`rounded-lg border border-white/[0.08] bg-black/20 p-4 ${cardHover}`}>FROM<br />FINANCIAL STRESS</span>
          <span className={`rounded-lg border border-white/[0.08] bg-black/20 p-4 ${cardHover}`}>TO<br />FINANCIAL FREEDOM</span>
          {['CLARITY', 'DISCIPLINE', 'BETTER DECISIONS', 'BRIGHTER FUTURE'].map((value) => <span key={value} className={`rounded-lg border border-purple-400/15 bg-purple-400/[0.06] p-3 text-purple-200 ${cardHover}`}>{value}</span>)}
        </div>
      </div>
    </div>
  </section>
);

export default AboutSection;