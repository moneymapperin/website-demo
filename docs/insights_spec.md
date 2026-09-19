# Insights Hub and Market Screens Specification

## Overview
The Insights section mirrors the Flutter mobile app's `RecommendationsScreen` and market screen ecosystem (`stock_screener_screen.dart`, `mf_screener_screen.dart`, `mf_recommendations_screen.dart`, `insurance_screener_screen.dart`, `gold_rates_screen.dart`, `news_detail_screen.dart`).

---

## 1. Insights Page (`/insights`) Section Hierarchy

1. **Header**:
   - Mobile hamburger button (opens navigation/pillars drawer; hidden on desktop where sidebar is always visible).
   - Page title `"Insights"`.
   - Refresh button (triggers full refresh of news, blogs, and picks, re-displaying loading states).
   - Header subtitle `"MoneyMapper Insights"`.
   - *Note*: Flutter's `RecommendationsScreen` does NOT have a Market Sentiment Gauge or IPO Radar. Market sentiment is placed in `StockScreenerScreen`.
2. **"Top Stories" Slider**:
   - Horizontal slider of articles from `bse_data.finance_news` (ordered by `updated_at DESC`, limit 10).
   - Tapping an item navigates to `/news/:id?type=news` with state `{ item, isNews: true }`.
3. **PRO Banner `i: 0`**:
   - Hidden for PRO users (`isPro === true`).
   - Title: `"UPGRADE TO PRO"`
   - Subtitle: `"Get unlimited access to all expert picks & AI insights."`
   - CTA: `"LEARN MORE"` (navigates to `/subscription`).
4. **"MoneyMapper Picks" Slider**:
   - 3 mutual funds from `apiService.getMutualFundRecommendations("moderate")` + 2 stocks from `bse_data.stock_signals` with `score >= 70`.
   - Combined and shuffled.
   - Cached in `localStorage` under `cached_picks_json` and `picks_updated_at` (valid for 24h = 86,400,000 ms).
   - Free users see pick 0 unlocked; picks 1–4 are blurred with a "PRO UNLOCK" badge.
   - Tapping locked card shows toast: `"Upgrade to PRO to unlock all expert picks! 🚀"` with action navigating to `/subscription`.
   - Non-pro banner: `"Free users see only 1 pick. Upgrade to PRO to see all expert picks! 🚀"`.
   - Tapping an unlocked stock opens `/stock-screener`.
   - Tapping an unlocked MF opens `/mf-recommendations?risk=moderate`.
5. **PRO Banner `i: 1`**:
   - Hidden for PRO users (`isPro === true`).
   - Title: `"MONEYMAPPER PRO YEARLY"`
   - Subtitle: `"Now at just ₹299/mo. 60% OFF for a limited time!"`
   - CTA: `"CLAIM OFFER"` (navigates to `/subscription`).
6. **"Learn & Grow" Slider**:
   - Horizontal slider of educational guides from `bse_data.blogs` (ordered by `updated_at DESC`, limit 10).
   - Tapping an item navigates to `/news/:id?type=blog` with state `{ item, isNews: false }`.

---

## 2. Documented Deviations from Flutter Mobile

### Deviation 1: Strict Omission of Fabricated MF Metrics
- **Flutter Implementation**: In `recommendations_screen.dart`, Flutter invents an MF pick score (`70 + name.length % 28`), and in `api_service.dart` (`_formatMF`), it generates an expected return (`"${15 + code % 25}%"`) and star rating (`4 + code % 2`) derived purely from the fund's `schemeCode`.
- **Web Policy & Rationale**: On web, we strictly **OMIT** score, expected return %, and star rating for all MF picks and recommendation screens. Scheme codes are arbitrary numeric identifiers assigned by AMFI and have no mathematical or financial correlation with fund performance, risk, or returns. Displaying fabricated performance metrics is misleading.
- **Web Display**: MF cards display the authentic scheme name, category tag, and official risk disclaimer only. Real database scores (`score` column from `bse_data.stock_signals`) are preserved for stocks.

### Deviation 2: Screen and Architecture Separation
- **IPO Radar**: Omitted from Insights page on web (Flutter's `RecommendationsScreen` does not have IPO radar; IPO radar belongs to Chatbot Task 11).
- **Market Sentiment Gauge**: Displayed in `StockScreenerScreen` where Flutter uses it, rather than `RecommendationsScreen`.
- **Strategy Blueprints**: `InsuranceRecommendationsScreen` and `SavingsRecommendationsScreen` belong to `insurance_dashboard.dart` and `emergency_fund.dart` respectively, and are deferred to Task 12.

### Deviation 3: Gold Time Honesty
- **Flutter Implementation**: Sets `rates['time']` to the client's current fetch time even when Supabase rows are stale.
- **Web Policy**: Preserves the same response shape and status strings, but on the UI displays the newest `updated_at` timestamp from the database rows as `"Updated <date, time>"`. The fetch time is used as a fallback only when `updated_at` is absent.

---

## 3. Verbatim Disclaimers

1. **Mutual Fund Recommendations (`/mf-recommendations`)**:
   `"Disclaimer: Mutual fund investments are subject to market risks. Please read all scheme-related documents carefully before investing."`
2. **Stock Screener (`/stock-screener`)**:
   `"Scores above 70 indicate high-confidence signals. Always follow the Stop Loss range for risk management."`
3. **Gold Rates (`/gold-rates`)**:
   `"Rates are indicative. Retail prices may vary across different jewelers and cities due to local taxes (GST) and making charges."`
