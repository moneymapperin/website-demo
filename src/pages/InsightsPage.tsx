import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Menu, TrendingUp, PieChart, Lock, ChevronRight, ArrowRight } from 'lucide-react';
import { apiService } from '../services/apiService';
import { usePlan } from '../hooks/usePlan';
import { useToast } from '../context/ToastContext';

export interface PickItem {
  isStock?: boolean;
  name?: string;
  symbol?: string;
  direction?: string;
  score?: number;
  category?: string;
  [key: string]: any;
}

export async function loadMoneyMapperPicks(
  api = apiService,
  rng: () => number = Math.random,
  forceRefresh = false
): Promise<PickItem[]> {
  try {
    const cachedJson = localStorage.getItem('cached_picks_json');
    const updatedAt = parseInt(localStorage.getItem('picks_updated_at') || '0', 10);
    const now = Date.now();

    // 24 hours (86,400,000 ms) validity
    if (!forceRefresh && cachedJson && now - updatedAt < 86400000) {
      try {
        return JSON.parse(cachedJson);
      } catch {
        // Corrupted cache fallback
      }
    }

    // 1. Fetch MF Recommendations ("moderate")
    const mfRecs = await api.getMutualFundRecommendations('moderate', rng);
    // Shuffle and take 3
    const shuffledMFs = [...mfRecs].sort(() => rng() - 0.5);
    const topMFs = shuffledMFs.slice(0, 3).map((f) => ({
      ...f,
      isStock: false,
    }));

    // 2. Fetch Stocks with score >= 70
    const stocks = await api.getPickStocks();
    const shuffledStocks = [...stocks].sort(() => rng() - 0.5);
    const topStocks = shuffledStocks.slice(0, 2).map((s) => ({
      ...s,
      isStock: true,
    }));

    // 3. Combine and shuffle
    const combined = [...topMFs, ...topStocks].sort(() => rng() - 0.5);

    // 4. Save to cache
    localStorage.setItem('cached_picks_json', JSON.stringify(combined));
    localStorage.setItem('picks_updated_at', now.toString());

    return combined;
  } catch (e) {
    console.error('Picks fetch failed:', e);
    return [];
  }
}

export const InsightsPage: React.FC<{ rng?: () => number }> = ({ rng }) => {
  const navigate = useNavigate();
  const { isPro } = usePlan();
  const { showToast } = useToast();

  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [blogItems, setBlogItems] = useState<any[]>([]);
  const [picks, setPicks] = useState<PickItem[]>([]);

  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [loadingPicks, setLoadingPicks] = useState(true);

  const fetchData = useCallback(
    async (force = false) => {
      setLoadingNews(true);
      setLoadingBlogs(true);
      setLoadingPicks(true);

      try {
        const [news, blogs, loadedPicks] = await Promise.all([
          apiService.getFinanceNews(),
          apiService.getBlogs(),
          loadMoneyMapperPicks(apiService, rng, force),
        ]);

        setNewsItems(news || []);
        setBlogItems(blogs || []);
        setPicks(loadedPicks || []);
      } catch (err) {
        console.error('Insights data fetch error:', err);
      } finally {
        setLoadingNews(false);
        setLoadingBlogs(false);
        setLoadingPicks(false);
      }
    },
    [rng]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePickClick = (pick: PickItem, index: number) => {
    const isLocked = !isPro && index > 0;
    if (isLocked) {
      showToast({
        message: 'Upgrade to PRO to unlock all expert picks! 🚀',
        backgroundColor: '#F59E0B',
        action: {
          label: 'UPGRADE',
          onClick: () => navigate('/subscription'),
        },
      });
      return;
    }

    if (pick.isStock) {
      navigate('/stock-screener');
    } else {
      navigate('/mf-recommendations?risk=moderate');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 text-slate-900 dark:text-white" data-testid="insights-page">
      {/* 1. Header (No sentiment gauge per Flutter spec) */}
      <header
        data-testid="insights-header"
        className="px-6 pt-6 pb-6 bg-gradient-to-b from-purple-950 via-purple-900/90 to-transparent border-b border-purple-800/20"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              data-testid="insights-menu-button"
              className="md:hidden p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Open Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">Insights</h1>
              <p className="text-xs md:text-sm font-bold text-white/80 tracking-wide mt-0.5">
                MoneyMapper Insights
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="insights-refresh-button"
            onClick={() => fetchData(true)}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all"
            aria-label="Refresh Insights"
          >
            <RefreshCw className={`w-4 h-4 ${loadingNews || loadingPicks ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 space-y-8 mt-4">
        {/* 2. Top Stories Slider */}
        <section data-testid="section-top-stories">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Top Stories
            </h2>
          </div>

          {loadingNews ? (
            <div className="h-44 flex items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-sm font-semibold text-slate-400 animate-pulse">Loading top stories...</span>
            </div>
          ) : newsItems.length === 0 ? (
            <div className="h-32 flex items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-sm text-slate-400">No news available.</span>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-3 pt-1 snap-x scrollbar-none">
              {newsItems.map((item, idx) => (
                <div
                  key={item.id || idx}
                  data-testid={`news-card-${idx}`}
                  onClick={() =>
                    navigate(`/news/${item.id || idx}?type=news`, {
                      state: { item, isNews: true },
                    })
                  }
                  className="min-w-[280px] md:min-w-[320px] max-w-[320px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-all flex flex-col snap-start"
                >
                  <div className="h-36 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title || 'News'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <TrendingUp className="w-8 h-8 opacity-40" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        {item.publisher || item.source_id || 'FINANCE NEWS'}
                      </span>
                      <h3 className="text-sm font-bold line-clamp-2 mt-1">{item.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {item.description || item.content || ''}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-end text-indigo-600 dark:text-indigo-400 text-xs font-bold gap-1">
                      <span>Read Story</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 3. PRO Banner i: 0 (Hidden for PRO) */}
        {!isPro && (
          <section
            data-testid="pro-banner-0"
            onClick={() => navigate('/subscription')}
            className="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md cursor-pointer flex items-center justify-between gap-4"
          >
            <div>
              <h3 className="text-xs font-black tracking-wider uppercase">UPGRADE TO PRO</h3>
              <p className="text-xs md:text-sm text-white/90 mt-1">
                Get unlimited access to all expert picks &amp; AI insights.
              </p>
            </div>
            <button
              type="button"
              data-testid="pro-banner-0-cta"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/subscription');
              }}
              className="px-4 py-2 rounded-xl bg-white text-indigo-700 text-xs font-black uppercase tracking-wider hover:bg-white/90 transition-colors shrink-0 shadow"
            >
              LEARN MORE
            </button>
          </section>
        )}

        {/* 4. MoneyMapper Picks */}
        <section data-testid="section-picks">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              MoneyMapper Picks
            </h2>
          </div>

          {loadingPicks ? (
            <div className="h-36 flex items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-sm font-semibold text-slate-400 animate-pulse">
                Scanning for best picks...
              </span>
            </div>
          ) : picks.length === 0 ? (
            <div className="h-32 flex items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-sm text-slate-400">Scanning for best picks...</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {picks.map((pick, idx) => {
                  const isStock = Boolean(pick.isStock);
                  const isLocked = !isPro && idx > 0;
                  const title = isStock ? pick.symbol || 'N/A' : pick.name || pick.schemeName || 'N/A';
                  const badge = isStock ? 'STOCK' : 'MUTUAL FUND';

                  // No fabricated metrics for mutual funds
                  const subTitle = isStock
                    ? `${pick.direction || 'BUY'} • Score: ${pick.score ?? 'N/A'}`
                    : `${pick.category || 'Equity'}`;

                  return (
                    <div
                      key={idx}
                      data-testid={`pick-card-${idx}`}
                      onClick={() => handlePickClick(pick, idx)}
                      className={`relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 cursor-pointer transition-all hover:border-indigo-400 ${
                        isLocked ? 'overflow-hidden' : ''
                      }`}
                    >
                      <div className={`flex items-center gap-4 ${isLocked ? 'filter blur-[5px] select-none pointer-events-none' : ''}`}>
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                            isStock
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                              : 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                          }`}
                        >
                          {isStock ? <TrendingUp className="w-6 h-6" /> : <PieChart className="w-6 h-6" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                              isStock
                                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                                : 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                            }`}
                          >
                            {badge}
                          </span>
                          <h4 className="font-bold text-sm truncate mt-1 text-slate-900 dark:text-white">
                            {title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {subTitle}
                          </p>
                        </div>

                        <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                      </div>

                      {isLocked && (
                        <div
                          data-testid={`pick-locked-overlay-${idx}`}
                          className="absolute inset-0 bg-black/10 dark:bg-black/30 backdrop-blur-xs flex flex-col items-center justify-center rounded-2xl"
                        >
                          <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
                            <Lock className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 tracking-wider uppercase mt-1">
                            PRO UNLOCK
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!isPro && (
                <div
                  data-testid="picks-pro-notice"
                  className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center gap-3 text-amber-800 dark:text-amber-300"
                >
                  <Lock className="w-4 h-4 shrink-0" />
                  <p className="text-xs font-bold">
                    Free users see only 1 pick. Upgrade to PRO to see all expert picks! 🚀
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* 5. PRO Banner i: 1 (Hidden for PRO) */}
        {!isPro && (
          <section
            data-testid="pro-banner-1"
            onClick={() => navigate('/subscription')}
            className="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md cursor-pointer flex items-center justify-between gap-4"
          >
            <div>
              <h3 className="text-xs font-black tracking-wider uppercase">MONEYMAPPER PRO YEARLY</h3>
              <p className="text-xs md:text-sm text-white/90 mt-1">
                Now at just ₹299/mo. 60% OFF for a limited time!
              </p>
            </div>
            <button
              type="button"
              data-testid="pro-banner-1-cta"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/subscription');
              }}
              className="px-4 py-2 rounded-xl bg-white text-purple-700 text-xs font-black uppercase tracking-wider hover:bg-white/90 transition-colors shrink-0 shadow"
            >
              CLAIM OFFER
            </button>
          </section>
        )}

        {/* 6. Learn & Grow Slider */}
        <section data-testid="section-learn-grow">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Learn &amp; Grow
            </h2>
          </div>

          {loadingBlogs ? (
            <div className="h-44 flex items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-sm font-semibold text-slate-400 animate-pulse">Loading guides...</span>
            </div>
          ) : blogItems.length === 0 ? (
            <div className="h-32 flex items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-sm text-slate-400">No items available.</span>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-3 pt-1 snap-x scrollbar-none">
              {blogItems.map((item, idx) => (
                <div
                  key={item.id || idx}
                  data-testid={`blog-card-${idx}`}
                  onClick={() =>
                    navigate(`/news/${item.id || idx}?type=blog`, {
                      state: { item, isNews: false },
                    })
                  }
                  className="min-w-[280px] md:min-w-[320px] max-w-[320px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-all flex flex-col snap-start"
                >
                  <div className="h-36 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                    {item.imageUrl || item.image_url ? (
                      <img
                        src={item.imageUrl || item.image_url}
                        alt={item.title || 'Blog'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <PieChart className="w-8 h-8 opacity-40" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        {item.author || item.publisher || 'WEALTH GUIDE'}
                      </span>
                      <h3 className="text-sm font-bold line-clamp-2 mt-1">{item.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {item.summary || item.fullContent || ''}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-end text-emerald-600 dark:text-emerald-400 text-xs font-bold gap-1">
                      <span>Read Guide</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
