import { useState } from 'react';
import { useComingSoon } from '../context/ComingSoonContext';
import { Building2, ChevronRight, TrendingUp } from 'lucide-react';

export const InsightsSection: React.FC = () => {
  const { openComingSoon } = useComingSoon();
  const [activeTab, setActiveTab] = useState<'top' | 'learn'>('top');

  const articles = [
    {
      id: 'article-1',
      title: 'India urged to review green finance rules, build workforce for nuclear sector',
      source: 'Financial Express',
      image: '/images/news-ocean.jpg',
      gradientFallback: 'from-cyan-900 via-teal-950 to-slate-900',
    },
    {
      id: 'article-2',
      title: "$111 billion in new funds set to boost India's growth story",
      source: 'MoneyControl',
      image: '/images/news-lens.jpg',
      gradientFallback: 'from-neutral-800 via-zinc-900 to-black',
    },
    {
      id: 'article-3',
      title: 'Oil prices edge lower on US-Iran war uncertainty',
      source: 'Bloomberg',
      image: '/images/news-oil-war.jpg',
      gradientFallback: 'from-orange-600 via-red-900 to-stone-950',
    },
  ];

  return (
    <section className="relative py-16 lg:py-24 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 right-1/4 w-[650px] h-[550px] bg-brand-purple/10 blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 left-1/3 w-[500px] h-[450px] bg-brand-violet/10 blur-[130px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Centered Heading Block */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-white mb-3">
            Insights That Drive Better Decisions
          </h2>
          <p className="text-sm sm:text-base text-white/60 font-normal leading-relaxed">
            Stay updated with market trends, expert analysis and personalized picks.
          </p>
        </div>

        {/* Tab Controls (Top Stories / Learn & Grow) */}
        <div className="flex items-center gap-2 mb-6 select-none">
          <button
            id="tab-top-stories-btn"
            onClick={() => {
              setActiveTab('top');
              openComingSoon('Top Stories');
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm ${
              activeTab === 'top'
                ? 'bg-[#231b3e] text-purple-300 border border-purple-500/40 shadow-purple-900/20'
                : 'text-white/60 hover:text-white border border-transparent hover:bg-white/5'
            }`}
          >
            Top Stories
          </button>
          <button
            id="tab-learn-grow-btn"
            onClick={() => {
              setActiveTab('learn');
              openComingSoon('Learn & Grow');
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'learn'
                ? 'bg-[#231b3e] text-purple-300 border border-purple-500/40'
                : 'text-white/60 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/5'
            }`}
          >
            Learn &amp; Grow
          </button>
        </div>

        {/* 3 News Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {articles.map((article) => (
            <div
              key={article.id}
              onClick={() => openComingSoon(article.title)}
              className="rounded-2xl bg-[#141124] border border-white/[0.08] hover:border-white/20 overflow-hidden shadow-lg transition-all duration-200 hover:-translate-y-1.5 active:scale-[0.99] cursor-pointer flex flex-col justify-between group"
            >
              {/* Card Thumbnail */}
              <div className={`h-48 w-full relative overflow-hidden bg-gradient-to-br ${article.gradientFallback}`}>
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback to CSS gradient if image fails
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              {/* Card Body */}
              <div className="p-4 sm:p-5 flex flex-col justify-between flex-1">
                <h3 className="text-sm sm:text-base font-bold text-white/90 group-hover:text-white leading-snug mb-4 line-clamp-2">
                  {article.title}
                </h3>

                {/* Source Tag */}
                <div className="flex items-center gap-1.5 text-xs text-white/50">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-medium">{article.source}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* MoneyMapper Picks Section */}
        <div>
          <span className="block text-sm font-bold text-brand-purple mb-3 tracking-wide">
            MoneyMapper Picks
          </span>

          {/* Stock Pick Row Card */}
          <div
            onClick={() => openComingSoon('MoneyMapper Picks')}
            className="rounded-2xl bg-[#141124] border border-white/[0.08] hover:border-brand-purple/50 p-4 sm:p-5 flex items-center justify-between shadow-xl transition-all duration-200 hover:translate-x-1 active:scale-[0.99] cursor-pointer group select-none"
          >
            {/* Left: Ticker icon badge + Stock Name + Recommendation Score */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Circular / Rounded Ticker Badge */}
              <div className="w-11 h-11 rounded-xl bg-blue-600/25 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>

              <div>
                <h4 className="text-base sm:text-lg font-bold text-white tracking-tight group-hover:text-white/95">
                  NATCOPHARM
                </h4>
                <div className="text-xs font-semibold flex items-center gap-1.5 mt-0.5">
                  <span className="text-emerald-400">Buy</span>
                  <span className="text-white/40">•</span>
                  <span className="text-white/50 font-normal">Score: 70</span>
                </div>
              </div>
            </div>

            {/* Right: Price + Change% + Green Sparkline + Chevron */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Price & Growth */}
              <div className="text-right">
                <div className="text-base sm:text-xl font-black text-white tracking-tight">
                  ₹1,234.50
                </div>
                <div className="text-xs font-bold text-[#22c55e] flex items-center justify-end gap-1">
                  <span>+2.35</span>
                  <span>(1.94%)</span>
                </div>
              </div>

              {/* Green Stock Sparkline with Real Market Peaks & Nodes */}
              <div className="hidden sm:flex w-24 sm:w-28 h-10 items-end">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 36">
                  <defs>
                    <linearGradient id="natcoGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Area fill */}
                  <path
                    d="M0,28 C10,28 14,18 22,18 C28,18 32,26 38,26 C46,26 50,14 58,14 C64,14 68,22 76,22 C84,22 88,8 96,8 L96,36 L0,36 Z"
                    fill="url(#natcoGlow)"
                  />
                  {/* Sparkline line */}
                  <path
                    d="M0,28 C10,28 14,18 22,18 C28,18 32,26 38,26 C46,26 50,14 58,14 C64,14 68,22 76,22 C84,22 88,8 96,8"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Inflection points nodes */}
                  <circle cx="22" cy="18" r="2" fill="#22c55e" stroke="#ffffff" strokeWidth="0.8" />
                  <circle cx="58" cy="14" r="2" fill="#22c55e" stroke="#ffffff" strokeWidth="0.8" />
                  <circle cx="96" cy="8" r="3" fill="#22c55e" className="animate-pulse" />
                  <circle cx="96" cy="8" r="1.2" fill="#ffffff" />
                </svg>
              </div>

              {/* Chevron Arrow */}
              <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default InsightsSection;
