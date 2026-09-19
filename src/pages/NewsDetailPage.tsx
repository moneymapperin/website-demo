import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, AlertCircle } from 'lucide-react';
import { apiService } from '../services/apiService';

export function cleanArticleText(rawText: string = ''): string {
  if (!rawText) return '';
  // Strip HTML tags and &nbsp;
  let cleaned = rawText.replace(/<[^>]*>|&nbsp;/gi, ' ');
  // Collapse multiple whitespaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

export const NewsDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const state = location.state as { item?: any; isNews?: boolean } | null;
  const queryType = searchParams.get('type');
  const initialIsNews = state?.isNews ?? (queryType === 'blog' ? false : true);

  const [article, setArticle] = useState<any | null>(state?.item || null);
  const [isNews, setIsNews] = useState<boolean>(initialIsNews);
  const [loading, setLoading] = useState<boolean>(!state?.item);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If state is already present, no need to fetch
    if (state?.item) {
      setArticle(state.item);
      setIsNews(state.isNews ?? true);
      setLoading(false);
      return;
    }

    // Deep link or refresh: fetch by id
    if (!id) {
      setError('Article ID is missing');
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const type: 'news' | 'blog' = queryType === 'blog' ? 'blog' : 'news';
    apiService
      .getNewsById(id, type)
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setArticle(data);
          setIsNews(type === 'news');
          setError(null);
        } else {
          setError('Article not found');
        }
      })
      .catch((_err) => {
        if (!isMounted) return;
        setError('Failed to load article');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, queryType, state]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex items-center justify-center text-slate-500">
        <div className="text-center" data-testid="news-loading-state">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="font-semibold text-sm">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex items-center justify-center" data-testid="news-not-found-state">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Story Not Found</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {error || "The article or guide you are looking for is no longer available or couldn't be loaded."}
          </p>
          <button
            type="button"
            data-testid="news-back-button"
            onClick={() => navigate('/insights')}
            className="mt-6 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
          >
            Back to Insights
          </button>
        </div>
      </div>
    );
  }

  // Field mapping exactly as news_detail_screen.dart
  const title = article.title || 'No Title';
  const imageUrl = isNews ? article.image_url : article.imageUrl;
  const rawDescription = isNews
    ? article.description ?? article.content ?? 'No description available.'
    : article.fullContent ?? article.summary ?? 'No content available.';

  const source = isNews
    ? (article.publisher ?? article.source_id ?? 'FINANCE NEWS').toString().toUpperCase()
    : (article.author ?? article.publisher ?? 'WEALTH BLOG').toString().toUpperCase();

  const externalLink = article.url ?? article.link;
  const isExternalHttp = Boolean(
    externalLink && (externalLink.startsWith('http://') || externalLink.startsWith('https://'))
  );

  const cleanDescription = cleanArticleText(rawDescription);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 text-slate-900 dark:text-white" data-testid="news-detail-page">
      {/* App Bar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            type="button"
            data-testid="news-back-button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <h1 className="text-sm font-black text-slate-800 dark:text-slate-100">
            {isNews ? 'Market Story' : 'Wealth Guide'}
          </h1>
          <div className="w-16" /> {/* spacer */}
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        {imageUrl && (
          <div className="rounded-3xl overflow-hidden shadow-sm max-h-80 bg-slate-100 dark:bg-slate-800">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="inline-block px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black tracking-wider uppercase">
            {source}
          </div>

          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight">
            {title}
          </h2>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Render content as plain text strictly (never dangerouslySetInnerHTML) */}
          <div
            data-testid="article-plain-content"
            className="text-sm md:text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line"
          >
            {cleanDescription}
          </div>

          {isExternalHttp && (
            <div className="pt-4">
              <a
                href={externalLink}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="news-external-link"
                className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <span>Read Full Article on Source</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </article>
    </div>
  );
};
