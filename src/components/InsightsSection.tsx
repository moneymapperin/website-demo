import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Building2, ChevronRight, PieChart, TrendingUp } from 'lucide-react';
import { apiService } from '../services/apiService';
import { loadMoneyMapperPicks, type PickItem } from '../pages/InsightsPage';
import { SparklineChart } from './ui/SparklineChart';
import logoImg from '../assets/logo.png';

type LandingArticle = {
  id?: string | number;
  title?: string;
  publisher?: string;
  source_id?: string;
  author?: string;
  image_url?: string;
  imageUrl?: string;
  imageFallback?: string;
  gradientFallback?: string;
};

const FALLBACK_ARTICLES: LandingArticle[] = [
  {
    id: 'article-1',
    title: 'India urged to review green finance rules, build workforce for nuclear sector',
    publisher: 'Financial Express',
    image_url: '/images/news-ocean.jpg',
    imageFallback: '/images/news-ocean.jpg',
    gradientFallback: 'from-cyan-900 via-teal-950 to-slate-900',
  },
  {
    id: 'article-2',
    title: "$111 billion in new funds set to boost India's growth story",
    publisher: 'MoneyControl',
    imageFallback: '/images/news-lens.jpg',
    gradientFallback: 'from-neutral-800 via-zinc-900 to-black',
  },
  {
    id: 'article-3',
    title: 'Oil prices edge lower on US-Iran war uncertainty',
    publisher: 'Bloomberg',
    image_url: '/images/news-oil-war.jpg',
    imageFallback: '/images/news-oil-war.jpg',
    gradientFallback: 'from-orange-600 via-red-900 to-stone-950',
  },
  {
    id: 'article-4',
    title: 'Global bond yields keep fixed-income markets in focus',
    publisher: 'MoneyMapper Briefing',
    imageFallback: '/images/news-lens.jpg',
    gradientFallback: 'from-blue-950 via-slate-900 to-cyan-950',
  },
  {
    id: 'article-5',
    title: 'Investors watch renewable energy and infrastructure themes',
    publisher: 'MoneyMapper Briefing',
    imageFallback: '/images/news-ocean.jpg',
    gradientFallback: 'from-emerald-950 via-teal-950 to-slate-900',
  },
  {
    id: 'article-6',
    title: 'Earnings outlook puts Indian technology shares in focus',
    publisher: 'MoneyMapper Briefing',
    imageFallback: '/images/news-lens.jpg',
    gradientFallback: 'from-indigo-950 via-slate-900 to-blue-950',
  },
  {
    id: 'article-7',
    title: 'Diversification remains central to long-term portfolio planning',
    publisher: 'MoneyMapper Briefing',
    gradientFallback: 'from-violet-950 via-slate-900 to-fuchsia-950',
  },
  {
    id: 'article-8',
    title: 'Households compare savings options as interest rates shift',
    publisher: 'MoneyMapper Briefing',
    gradientFallback: 'from-cyan-950 via-slate-900 to-blue-950',
  },
  {
    id: 'article-9',
    title: 'Gold demand keeps precious metals on investor watchlists',
    publisher: 'MoneyMapper Briefing',
    imageFallback: '/images/gold-bars.jpg',
    gradientFallback: 'from-amber-950 via-stone-900 to-orange-950',
  },
  {
    id: 'article-10',
    title: 'Markets weigh policy signals ahead of the next trading week',
    publisher: 'MoneyMapper Briefing',
    gradientFallback: 'from-slate-900 via-zinc-900 to-neutral-950',
  },
];

const FALLBACK_PICK: PickItem = {
  isStock: true,
  name: 'NATCOPHARM',
  symbol: 'NATCOPHARM',
  direction: 'BUY',
  score: 70,
  price: 1234.5,
  change: 2.35,
  changePercent: 1.94,
};

const FALLBACK_GRADIENTS = [
  'from-cyan-900 via-teal-950 to-slate-900',
  'from-neutral-800 via-zinc-900 to-black',
  'from-orange-600 via-red-900 to-stone-950',
];

const getLocalImageFallback = (title: string): string | undefined => {
  const normalizedTitle = title.toLowerCase();
  if (/gold|metal|bullion/.test(normalizedTitle)) return '/images/gold-bars.jpg';
  if (/oil|iran|war/.test(normalizedTitle)) return '/images/news-oil-war.jpg';
  if (/green|renewable|climate|environment|nuclear/.test(normalizedTitle)) return '/images/news-ocean.jpg';
  if (/bond|fund|market|invest|stock|earnings|finance|rate/.test(normalizedTitle)) return '/images/news-lens.jpg';
  return undefined;
};

interface FeedCardImageProps {
  source?: string;
  localFallback?: string;
  title: string;
  gradient: string;
}

const FeedCardImage: React.FC<FeedCardImageProps> = ({ source, localFallback, title, gradient }) => {
  const [imageSource, setImageSource] = useState(source || localFallback || null);
  const [fallbackAttempted, setFallbackAttempted] = useState(!source && Boolean(localFallback));
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageError = () => {
    if (!fallbackAttempted && localFallback && imageSource !== localFallback) {
      setImageSource(localFallback);
      setFallbackAttempted(true);
      setImageLoaded(false);
      return;
    }
    setImageSource(null);
    setFallbackAttempted(true);
  };

  return (
    <div className={`relative h-48 w-full shrink-0 overflow-hidden bg-gradient-to-br ${gradient}`}>
      {imageSource ? (
        <>
          {!imageLoaded && <div className="absolute inset-0 animate-pulse bg-white/[0.06]" />}
          <img
            src={imageSource}
            alt={title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={handleImageError}
          />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0b0a14]/25">
          <img src={logoImg} alt="MoneyMapper" className="h-16 w-16 object-contain opacity-80" />
        </div>
      )}
    </div>
  );
};

const getRotatedItems = <T,>(items: T[], startIndex: number, count = 3): T[] => {
  if (items.length === 0) return [];
  return Array.from({ length: Math.min(count, items.length) }, (_, offset) =>
    items[(startIndex + offset) % items.length]
  );
};

const getFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parsed = Number(value.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
};

const getPickPrice = (pick: PickItem): number | null =>
  getFiniteNumber(pick.price ?? pick.last_close ?? pick.lastClose ?? pick.current_price);

const getPickChange = (pick: PickItem): { amount: number | null; percent: number | null } => ({
  amount: getFiniteNumber(pick.change_amount ?? pick.changeAmount ?? pick.change),
  percent: getFiniteNumber(
    pick.change_percent ?? pick.change_percentage ?? pick.changePercent ?? pick.change_pct
  ),
});

const getSparklinePoints = (pick: PickItem, changePercent: number | null): number[] => {
  const rawSeries = pick.sparkline_data ?? pick.sparkline;
  if (Array.isArray(rawSeries)) {
    const realPoints = rawSeries
      .map((point: unknown) => {
        if (typeof point === 'number') return getFiniteNumber(point);
        if (point && typeof point === 'object') {
          const value = point as Record<string, unknown>;
          return getFiniteNumber(value.close ?? value.price ?? value.value);
        }
        return null;
      })
      .filter((point: number | null): point is number => point !== null);
    if (realPoints.length >= 2) return realPoints;
  }

  const seedText = String(pick.symbol ?? pick.name ?? pick.company_name ?? 'MoneyMapper');
  let seed = Array.from(seedText).reduce((value, character) => value + character.charCodeAt(0), 17);
  const trend = changePercent === null ? 0 : Math.sign(changePercent);
  let level = 50;

  return Array.from({ length: 8 }, (_, index) => {
    seed = (seed * 9301 + 49297) % 233280;
    const variation = ((seed / 233280) - 0.5) * 2.4;
    level += variation + trend * 0.55;
    return level + index * trend * 0.25;
  });
};

const formatPrice = (value: number): string =>
  new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

const fetchLandingNews = async (): Promise<LandingArticle[]> => {
  let items = await apiService.getFinanceNews();
  if (Array.isArray(items) && items.length > 0) return items;

  apiService.clearCache(['finance_news']);
  items = await apiService.getFinanceNews();
  if (!Array.isArray(items) || items.length === 0) {
    apiService.clearCache(['finance_news']);
  }
  return Array.isArray(items) ? items : [];
};

export const InsightsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'top' | 'learn'>('top');
  const [newsItems, setNewsItems] = useState<LandingArticle[]>([]);
  const [blogItems, setBlogItems] = useState<LandingArticle[]>([]);
  const [picks, setPicks] = useState<PickItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [loadingPicks, setLoadingPicks] = useState(true);
  const [newsStartIndex, setNewsStartIndex] = useState(0);
  const [blogStartIndex, setBlogStartIndex] = useState(0);
  const [pickIndex, setPickIndex] = useState(0);
  const [feedVisible, setFeedVisible] = useState(true);
  const [pickVisible, setPickVisible] = useState(true);
  const [feedHovered, setFeedHovered] = useState(false);
  const [pickHovered, setPickHovered] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState === 'visible'
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  );
  const feedTransitionTimer = useRef<number | null>(null);
  const pickTransitionTimer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetchLandingNews()
      .then((items) => {
        if (cancelled) return;
        const availableItems = Array.isArray(items) ? items : [];
        const displayItems = availableItems.length > 0 ? availableItems : FALLBACK_ARTICLES;
        setNewsItems(displayItems);
        setNewsStartIndex(
          displayItems.length > 3 ? Math.floor(Math.random() * displayItems.length) : 0
        );
      })
      .catch((error) => {
        console.error('Landing finance news fetch failed:', error);
        apiService.clearCache(['finance_news']);
        if (!cancelled) {
          setNewsItems(FALLBACK_ARTICLES);
          setNewsStartIndex(Math.floor(Math.random() * FALLBACK_ARTICLES.length));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingNews(false);
      });

    void apiService.getBlogs()
      .then((items) => {
        if (cancelled) return;
        const availableItems = Array.isArray(items) ? items : [];
        setBlogItems(availableItems);
        setBlogStartIndex(
          availableItems.length > 3 ? Math.floor(Math.random() * availableItems.length) : 0
        );
      })
      .catch((error) => {
        console.error('Landing blogs fetch failed:', error);
        if (!cancelled) setBlogItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingBlogs(false);
      });

    void loadMoneyMapperPicks()
      .then((items) => {
        if (cancelled) return;
        const availablePicks = Array.isArray(items) && items.length > 0 ? items : [FALLBACK_PICK];
        setPicks(availablePicks);
        setPickIndex(availablePicks.length > 1 ? Math.floor(Math.random() * availablePicks.length) : 0);
      })
      .catch((error) => {
        console.error('Landing picks fetch failed:', error);
        if (!cancelled) {
          setPicks([FALLBACK_PICK]);
          setPickIndex(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingPicks(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => setDocumentVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVisibilityChange);

    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const onMotionPreferenceChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    if (mediaQuery?.addEventListener) {
      mediaQuery.addEventListener('change', onMotionPreferenceChange);
    } else {
      mediaQuery?.addListener(onMotionPreferenceChange);
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (mediaQuery?.removeEventListener) {
        mediaQuery.removeEventListener('change', onMotionPreferenceChange);
      } else {
        mediaQuery?.removeListener(onMotionPreferenceChange);
      }
    };
  }, []);

  const transitionFeed = useCallback((update: () => void) => {
    if (feedTransitionTimer.current !== null) window.clearTimeout(feedTransitionTimer.current);
    if (prefersReducedMotion) {
      update();
      setFeedVisible(true);
      return;
    }
    setFeedVisible(false);
    feedTransitionTimer.current = window.setTimeout(() => {
      update();
      setFeedVisible(true);
      feedTransitionTimer.current = null;
    }, 180);
  }, [prefersReducedMotion]);

  const transitionPick = useCallback((update: () => void) => {
    if (pickTransitionTimer.current !== null) window.clearTimeout(pickTransitionTimer.current);
    if (prefersReducedMotion) {
      update();
      setPickVisible(true);
      return;
    }
    setPickVisible(false);
    pickTransitionTimer.current = window.setTimeout(() => {
      update();
      setPickVisible(true);
      pickTransitionTimer.current = null;
    }, 180);
  }, [prefersReducedMotion]);

  useEffect(() => () => {
    if (feedTransitionTimer.current !== null) window.clearTimeout(feedTransitionTimer.current);
    if (pickTransitionTimer.current !== null) window.clearTimeout(pickTransitionTimer.current);
  }, []);

  const activeItems = activeTab === 'top' ? newsItems : blogItems;
  const activeStartIndex = activeTab === 'top' ? newsStartIndex : blogStartIndex;
  const loadingFeed = activeTab === 'top' ? loadingNews : loadingBlogs;
  const visibleItems = getRotatedItems(activeItems, activeStartIndex);
  const pageCanRotate = documentVisible && !prefersReducedMotion;

  useEffect(() => {
    if (!pageCanRotate || feedHovered || activeItems.length <= 3) return;

    const interval = window.setInterval(() => {
      transitionFeed(() => {
        if (activeTab === 'top') {
          setNewsStartIndex((index) => (index + 1) % newsItems.length);
        } else {
          setBlogStartIndex((index) => (index + 1) % blogItems.length);
        }
      });
    }, 9000);

    return () => window.clearInterval(interval);
  }, [activeItems.length, activeTab, blogItems.length, feedHovered, newsItems.length, pageCanRotate, transitionFeed]);

  useEffect(() => {
    if (!pageCanRotate || pickHovered || picks.length <= 1) return;

    const interval = window.setInterval(() => {
      transitionPick(() => setPickIndex((index) => (index + 1) % picks.length));
    }, 10000);

    return () => window.clearInterval(interval);
  }, [pageCanRotate, pickHovered, picks.length, transitionPick]);

  const handleTabChange = (tab: 'top' | 'learn') => {
    if (tab !== activeTab) transitionFeed(() => setActiveTab(tab));
  };

  const activePick = picks[pickIndex] ?? FALLBACK_PICK;
  const isStock = Boolean(activePick.isStock);
  const pickTitle = String(
    activePick.company_name ?? activePick.name ?? activePick.symbol ?? activePick.ticker ?? 'MoneyMapper Pick'
  );
  const pickSymbol = activePick.symbol ?? activePick.ticker;
  const recommendation = activePick.direction ?? activePick.recommendation ?? activePick.action;
  const pickScore = getFiniteNumber(activePick.score);
  const pickPrice = getPickPrice(activePick);
  const { amount: pickChangeAmount, percent: pickChangePercent } = getPickChange(activePick);
  const pickChangeDirection = pickChangePercent ?? pickChangeAmount;
  const pickTrendColor = pickChangeDirection === null
    ? '#60a5fa'
    : pickChangeDirection >= 0 ? '#22c55e' : '#ef4444';
  const sparklinePoints = getSparklinePoints(activePick, pickChangePercent);
  const changeTextColor = pickChangeDirection === null
    ? 'text-white/45'
    : pickChangeDirection >= 0 ? 'text-emerald-400' : 'text-rose-400';

  return (
    <section id="insights" className="scroll-mt-24 relative py-16 lg:py-24 overflow-hidden">
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

        <div
          className="mb-6"
          onMouseEnter={() => setFeedHovered(true)}
          onMouseLeave={() => setFeedHovered(false)}
        >
          <div className="flex items-center gap-2 mb-6 select-none">
            <button
              id="tab-top-stories-btn"
              type="button"
              onClick={() => handleTabChange('top')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm ${
                activeTab === 'top'
                  ? 'bg-[#231b3e] text-purple-300 border border-purple-500/40 shadow-purple-900/20'
                  : 'text-white/60 hover:text-white border border-transparent hover:bg-white/5'
              }`}
            >
              Top Stories
            </button>
            <button
              id="tab-learn-grow-btn"
              type="button"
              onClick={() => handleTabChange('learn')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'learn'
                  ? 'bg-[#231b3e] text-purple-300 border border-purple-500/40'
                  : 'text-white/60 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              Learn &amp; Grow
            </button>
          </div>

          {loadingFeed ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5" aria-label="Loading insights">
              {[0, 1, 2].map((index) => (
                <div key={index} className="h-[360px] rounded-2xl border border-white/[0.08] bg-[#141124] overflow-hidden">
                  <div className="h-48 animate-pulse bg-white/[0.06]" />
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="h-3 w-1/3 rounded bg-white/[0.08] animate-pulse" />
                    <div className="h-4 w-full rounded bg-white/[0.08] animate-pulse" />
                    <div className="h-4 w-2/3 rounded bg-white/[0.08] animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : visibleItems.length > 0 ? (
            <div
              id="landing-insights-panel"
              role="tabpanel"
              aria-labelledby={activeTab === 'top' ? 'tab-top-stories-btn' : 'tab-learn-grow-btn'}
              className={`grid grid-cols-1 md:grid-cols-3 gap-5 transition-all duration-300 motion-reduce:transition-none ${
                feedVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
              }`}
            >
              {visibleItems.map((item, index) => {
                const title = item.title || 'Finance news';
                const source = activeTab === 'top'
                  ? item.publisher || item.source_id || 'FINANCE NEWS'
                  : item.author || item.publisher || 'WEALTH GUIDE';
                const image = activeTab === 'top' ? item.image_url : item.imageUrl || item.image_url;
                const imageFallback = item.imageFallback || getLocalImageFallback(title);
                const gradient = item.gradientFallback || FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length];

                return (
                  <div
                    key={`${activeTab}-${item.id ?? title}`}
                    className="group h-[360px] min-w-0 rounded-2xl bg-[#141124] border border-white/[0.08] hover:border-white/20 overflow-hidden shadow-lg transition-all duration-200 hover:-translate-y-1.5 flex flex-col"
                  >
                    <FeedCardImage source={image} localFallback={imageFallback} title={title} gradient={gradient} />
                    <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 min-h-[164px]">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-white/50">
                          <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="font-medium truncate">{source}</span>
                        </div>
                        <h3 className="min-h-[3.25rem] text-sm sm:text-base font-bold text-white/90 group-hover:text-white leading-6 mt-2 line-clamp-2 break-words">
                          {title}
                        </h3>
                      </div>
                      <div className="flex items-center justify-end text-white/50 text-xs font-bold gap-1">
                        <span>{activeTab === 'top' ? 'Top Story' : 'Learn & Grow'}</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[360px] flex items-center justify-center bg-[#141124] rounded-2xl border border-white/[0.08] text-sm text-white/50">
              No learning guides available right now.
            </div>
          )}
        </div>

        <div>
          <span className="block text-sm font-bold text-brand-purple mb-3 tracking-wide">
            MoneyMapper Picks
          </span>

          {loadingPicks ? (
            <div className="h-[112px] rounded-2xl border border-white/[0.08] bg-[#141124] p-5 animate-pulse" aria-label="Loading MoneyMapper Picks">
              <div className="h-4 w-1/4 rounded bg-white/[0.08]" />
              <div className="mt-3 h-3 w-1/2 rounded bg-white/[0.08]" />
            </div>
          ) : (
            <div
              onMouseEnter={() => setPickHovered(true)}
              onMouseLeave={() => setPickHovered(false)}
              className={`w-full min-h-[112px] rounded-2xl bg-[#141124] border border-white/[0.08] hover:border-brand-purple/50 p-4 sm:p-5 flex items-center justify-between gap-3 shadow-xl transition-all duration-300 hover:translate-x-1 group select-none motion-reduce:transition-none ${
                pickVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
              }`}
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300 ${
                  isStock
                    ? 'bg-blue-600/25 border-blue-500/40 text-blue-400'
                    : 'bg-purple-600/25 border-purple-500/40 text-purple-300'
                }`}>
                  {isStock ? <TrendingUp className="w-5 h-5" /> : <PieChart className="w-5 h-5" />}
                </div>

                <div className="min-w-0">
                  <span className={`text-[9px] font-black uppercase tracking-wider ${isStock ? 'text-blue-300' : 'text-purple-300'}`}>
                    {isStock ? 'STOCK' : 'MUTUAL FUND'}
                  </span>
                  <h4 className="text-sm sm:text-lg font-bold text-white tracking-tight group-hover:text-white/95 truncate">
                    {pickTitle}
                  </h4>
                  <div className="text-xs font-semibold flex flex-wrap items-center gap-1.5 mt-0.5">
                    {recommendation && (
                      <span className={String(recommendation).toLowerCase().includes('sell') ? 'text-rose-400' : 'text-emerald-400'}>
                        {String(recommendation).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())}
                      </span>
                    )}
                    {recommendation && pickScore !== null && <span className="text-white/40">•</span>}
                    {pickScore !== null && <span className="text-white/50 font-normal">Score: {pickScore}</span>}
                    {pickSymbol && pickSymbol !== pickTitle && <span className="text-white/45 font-normal">{pickSymbol}</span>}
                    {!isStock && activePick.category && <span className="text-white/50 font-normal">{activePick.category}</span>}
                    {pickScore === null && !recommendation && isStock && <span className="text-white/50 font-normal">Stock signal</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-5 shrink-0">
                <div className="text-right min-w-[76px]">
                  <div className="text-sm sm:text-xl font-black text-white tracking-tight">
                    {pickPrice === null ? '—' : `₹${formatPrice(pickPrice)}`}
                  </div>
                  <div className={`text-[10px] sm:text-xs font-bold flex items-center justify-end gap-1 ${changeTextColor}`}>
                    {pickChangeAmount !== null && (
                      <span>{pickChangeAmount >= 0 ? '+' : '-'}{formatPrice(Math.abs(pickChangeAmount))}</span>
                    )}
                    {pickChangePercent !== null && (
                      <span>({pickChangePercent < 0 ? '-' : ''}{Math.abs(pickChangePercent).toFixed(2)}%)</span>
                    )}
                    {pickChangeAmount === null && pickChangePercent === null && <span>Change unavailable</span>}
                  </div>
                </div>

                <div className="hidden sm:flex w-24 sm:w-28 h-10 items-end">
                  <SparklineChart data={sparklinePoints} width={112} height={40} color={pickTrendColor} />
                </div>
                <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};

export default InsightsSection;
