import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:url_launcher/url_launcher.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../theme/responsive_utils.dart';
import '../theme/app_theme.dart';
import 'news_detail_screen.dart';
import '../services/premium_service.dart';
import 'stock_screener_screen.dart';
import 'mf_recommendations_screen.dart';

class RecommendationsScreen extends StatefulWidget {
  const RecommendationsScreen({super.key});

  @override
  State<RecommendationsScreen> createState() => _RecommendationsScreenState();
}

class _RecommendationsScreenState extends State<RecommendationsScreen> {
  final _api = ApiService();
  final _premiumService = PremiumService();
  final _supabase = Supabase.instance.client;

  List<dynamic> _newsItems = [];
  List<dynamic> _blogItems = [];
  List<dynamic> _moneyMapperPicks = [];

  bool _loadingNews = true;
  bool _loadingBlogs = true;
  bool _loadingPicks = true;
  bool _isPro = false;

  late PageController _picksController;
  int _currentPickIndex = 0;

  @override
  void initState() {
    super.initState();
    _picksController = PageController(viewportFraction: 0.92);
    _loadPremiumStatus();
    _fetchData();
  }

  @override
  void dispose() {
    _picksController.dispose();
    super.dispose();
  }

  Future<void> _loadPremiumStatus() async {
    final isPro = await _premiumService.isPro();
    if (mounted) setState(() => _isPro = isPro);
  }

  Future<void> _fetchData() async {
    if (mounted) {
      setState(() {
        _loadingNews = true;
        _loadingBlogs = true;
        _loadingPicks = true;
      });
    }
    await Future.wait([
      _fetchNews(),
      _fetchBlogs(),
      _fetchMoneyMapperPicks(),
    ]);
    if (mounted) {
      setState(() {
        _loadingNews = false;
        _loadingBlogs = false;
        _loadingPicks = false;
      });
    }
  }

  Future<void> _fetchMoneyMapperPicks() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cachedJson = prefs.getString('cached_picks_json');
      final updatedAt = prefs.getInt('picks_updated_at') ?? 0;
      final now = DateTime.now().millisecondsSinceEpoch;

      // Check if 24 hours (86,400,000 ms) have passed
      if (cachedJson != null && (now - updatedAt) < 86400000) {
        final List<dynamic> decoded = jsonDecode(cachedJson);
        if (mounted) {
          setState(() {
            _moneyMapperPicks = decoded;
          });
        }
        return;
      }

      // 1. Fetch MF Recommendations
      final mfRecs = await _api.getMutualFundRecommendations("moderate");
      final List<Map<String, dynamic>> scoredMFs = mfRecs.map((f) {
        final map = Map<String, dynamic>.from(f);
        return {
          ...map,
          'score': 70 + (map['name']?.toString().length ?? 0) % 28,
          'isStock': false,
        };
      }).toList();

      scoredMFs.shuffle();
      final topMFs = scoredMFs.where((m) => (m['score'] as int) >= 70).take(3).toList();

      // 2. Fetch Stocks with Score >= 70
      final stockRes = await _supabase
          .schema('bse_data')
          .from('stock_signals')
          .select()
          .gte('score', 70);

      final List<Map<String, dynamic>> stocks = (stockRes as List).map((s) => Map<String, dynamic>.from(s)).toList();
      stocks.shuffle();
      final topStocks = stocks.take(2).map((s) => {
        ...Map<String, dynamic>.from(s),
        'isStock': true,
      }).toList();

      // 3. Combine and shuffle
      final List<Map<String, dynamic>> combined = [...topMFs, ...topStocks];
      combined.shuffle();

      // 4. Save to cache
      await prefs.setString('cached_picks_json', jsonEncode(combined));
      await prefs.setInt('picks_updated_at', now);

      if (mounted) {
        setState(() {
          _moneyMapperPicks = combined;
        });
      }
    } catch (e) {
      debugPrint("Picks fetch failed: $e");
    }
  }

  Future<void> _fetchNews() async {
    try {
      final news = await _api.getFinanceNews();
      if (mounted) setState(() => _newsItems = news);
    } catch (e) {
      debugPrint("News fetch failed: $e");
    }
  }

  Future<void> _fetchBlogs() async {
    try {
      final blogs = await _api.getBlogs();
      if (mounted) setState(() => _blogItems = blogs);
    } catch (e) {
      debugPrint("Blogs fetch failed: $e");
    }
  }

  Widget _buildInsightsHeader(bool isDark) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        16,
        MediaQuery.of(context).padding.top + 10,
        16,
        16,
      ),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            const Color(0xFF2E1065),
            const Color(0xFF1E0A45).withOpacity(0.9),
            isDark ? AppColors.darkBackground : AppColors.background,
          ],
          stops: const [0.0, 0.7, 1.0],
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Builder(
                builder: (ctx) => IconButton(
                  icon: const Icon(Icons.menu_rounded, color: Colors.white, size: 24),
                  onPressed: () => Scaffold.of(ctx).openDrawer(),
                ),
              ),
              const Expanded(
                child: Center(
                  child: Text(
                    "Insights",
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 18,
                    ),
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.refresh_rounded, color: Colors.white, size: 22),
                onPressed: _fetchData,
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            "MoneyMapper Insights",
            style: TextStyle(
              color: Colors.white.withOpacity(0.9),
              fontWeight: FontWeight.w800,
              fontSize: 16,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: null,
      body: Column(
        children: [
          _buildInsightsHeader(isDark),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _fetchData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 16),
              _buildSectionHeader("Top Stories", Icons.bolt_rounded),
              _buildHorizontalSlider(_newsItems, isDark, isNews: true),
              const SizedBox(height: 24),
              _buildProBanner(isDark, i: 0),
              const SizedBox(height: 24),
              _buildSectionHeader("MoneyMapper Picks", Icons.auto_awesome_rounded),
              _buildMoneyMapperPicks(isDark),
              const SizedBox(height: 24),
              _buildProBanner(isDark, i: 1),
              const SizedBox(height: 32),
              _buildSectionHeader("Learn & Grow", Icons.menu_book_rounded),
              _buildHorizontalSlider(_blogItems, isDark, isNews: false),
              const SizedBox(height: 60),
            ],
          ),
        ),
      ),
    ),
  ],
),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.primary),
          const SizedBox(width: 8),
          Text(title.toUpperCase(), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 1.2, color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildMoneyMapperPicks(bool isDark) {
    if (_loadingPicks) {
      return const SizedBox(height: 120, child: Center(child: CircularProgressIndicator()));
    }
    if (_moneyMapperPicks.isEmpty) {
      return const Padding(padding: EdgeInsets.all(20), child: Text("Scanning for best picks..."));
    }

    return Column(
      children: [
        SizedBox(
          height: 125,
          child: PageView.builder(
            controller: _picksController,
            onPageChanged: (i) => setState(() => _currentPickIndex = i),
            itemCount: _moneyMapperPicks.length,
            clipBehavior: Clip.none,
            itemBuilder: (context, index) {
              final pick = _moneyMapperPicks[index];
              final isLocked = !_isPro && index > 0;
              return _buildPickCard(pick, isDark, isLocked: isLocked);
            },
          ),
        ),
        const SizedBox(height: 16),
        _buildDotIndicator(),
        if (!_isPro)
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.accent.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.accent.withOpacity(0.3)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.lock_clock_rounded, color: AppColors.accent, size: 18),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      "Free users see only 1 pick. Upgrade to PRO to see all expert picks! 🚀",
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.accent),
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildDotIndicator() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(_moneyMapperPicks.length, (index) {
        return AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          width: _currentPickIndex == index ? 24 : 8,
          height: 8,
          margin: const EdgeInsets.symmetric(horizontal: 4),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(4),
            color: _currentPickIndex == index
                ? AppColors.primary
                : Colors.grey.withOpacity(0.3),
          ),
        );
      }),
    );
  }

  Widget _buildPickCard(Map<String, dynamic> pick, bool isDark, {bool isLocked = false}) {
    final bool isStock = pick['isStock'] ?? false;
    final String title = isStock ? (pick['symbol'] ?? 'N/A') : (pick['name'] ?? 'N/A');
    final String subTitle = isStock
        ? "${pick['direction'] ?? 'N/A'} • Score: ${pick['score'] ?? 'N/A'}"
        : "${pick['category'] ?? 'N/A'} • Expected ${pick['return'] ?? 'N/A'}";
    final String typeLabel = isStock ? "STOCK" : "MUTUAL FUND";
    final Color typeColor = isStock ? Colors.blue : Colors.purple;

    return GestureDetector(
      onTap: () {
        if (isLocked) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text("Upgrade to PRO to unlock all expert picks! 🚀"),
              backgroundColor: AppColors.accent,
            ),
          );
          return;
        }
        if (isStock) {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const StockScreenerScreen()));
        } else {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const MfRecommendationsScreen(riskAppetite: "moderate")));
        }
      },
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 8),
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkCard : Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.borderLight, width: 1.5),
        ),
        child: Stack(
          children: [
            ImageFiltered(
              imageFilter: isLocked ? ImageFilter.blur(sigmaX: 8, sigmaY: 8) : ImageFilter.blur(sigmaX: 0, sigmaY: 0),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: typeColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Icon(isStock ? Icons.trending_up_rounded : Icons.pie_chart_rounded, color: typeColor, size: 24),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: typeColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(typeLabel, style: TextStyle(color: typeColor, fontSize: 8, fontWeight: FontWeight.w900)),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            title,
                            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, letterSpacing: -0.2),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            subTitle,
                            style: TextStyle(color: Colors.grey.shade600, fontSize: 11, fontWeight: FontWeight.w500),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    Icon(Icons.chevron_right_rounded, color: Colors.grey.shade400),
                  ],
                ),
              ),
            ),
            if (isLocked)
              ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: Container(
                  color: Colors.black.withOpacity(0.08),
                  child: Center(
                    child: GestureDetector(
                      onTap: () => Navigator.pushNamed(context, '/subscription'),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.amber,
                              shape: BoxShape.circle,
                              boxShadow: [BoxShadow(color: Colors.amber.withOpacity(0.4), blurRadius: 10)],
                            ),
                            child: const Icon(Icons.lock_rounded, color: Colors.white, size: 20),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            "PRO UNLOCK",
                            style: TextStyle(color: Colors.amber, fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 0.5),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildProBanner(bool isDark, {int i = 0}) {
    if (_isPro) return const SizedBox.shrink();

    final banners = [
      {'title': 'UPGRADE TO PRO', 'subtitle': 'Get unlimited access to all expert picks & AI insights.', 'cta': 'LEARN MORE'},
      {'title': 'MONEYMAPPER PRO YEARLY', 'subtitle': 'Now at just ₹299/mo. 60% OFF for a limited time!', 'cta': 'CLAIM OFFER'},
    ];

    final b = banners[i % banners.length];

    return GestureDetector(
      onTap: () => Navigator.pushNamed(context, '/subscription'),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 20),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(24),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(b['title']!, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1.1)),
                  const SizedBox(height: 4),
                  Text(b['subtitle']!, style: const TextStyle(color: Colors.white70, fontSize: 11)),
                ],
              ),
            ),
            const SizedBox(width: 12),
            ElevatedButton(
              onPressed: () => Navigator.pushNamed(context, '/subscription'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: const Color(0xFF4F46E5),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(b['cta']!, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 10)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHorizontalSlider(List<dynamic> items, bool isDark, {required bool isNews}) {
    if (_loadingNews && isNews) return const SizedBox(height: 300, child: Center(child: CircularProgressIndicator()));
    if (_loadingBlogs && !isNews) return const SizedBox(height: 300, child: Center(child: CircularProgressIndicator()));
    if (items.isEmpty) return const Padding(padding: EdgeInsets.all(20), child: Text("No items available."));

    double cardWidth = context.wp(65);
    double cardHeight = context.hp(52);

    return SizedBox(
      height: cardHeight,
      child: ListView.builder(
        padding: EdgeInsets.symmetric(horizontal: context.wp(3)),
        scrollDirection: Axis.horizontal,
        itemCount: items.length,
        itemBuilder: (ctx, i) {
          final item = items[i];
          final String title = item['title'] ?? "";
          final String desc = (isNews ? item['description'] : item['summary']) ?? "";
          final String? imageUrl = isNews ? item['image_url'] : item['imageUrl'];
          final String footerLabel = isNews
              ? (item['publisher']?.toString().toUpperCase() ?? "NEWS")
              : (item['author']?.toString().toUpperCase() ?? "WEALTH GUIDE");

          return GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => NewsDetailScreen(news: item, isNews: isNews),
                ),
              );
            },
            child: Container(
              width: cardWidth,
              margin: EdgeInsets.symmetric(horizontal: context.wp(2), vertical: 4),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkCard : Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.borderLight, width: 1.5),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  AspectRatio(
                    aspectRatio: 1.2,
                    child: ClipRRect(
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(23)),
                      child: imageUrl != null
                          ? Image.network(imageUrl, fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Container(color: AppColors.primary.withOpacity(0.1), child: const Icon(Icons.image_outlined, size: 40)))
                          : Container(color: AppColors.primary.withOpacity(0.1), child: const Icon(Icons.image_outlined, size: 40)),
                    ),
                  ),
                  Expanded(
                    child: Padding(
                      padding: EdgeInsets.all(context.wp(4)),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            title,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(fontSize: context.sp(13), fontWeight: FontWeight.w800, height: 1.2),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            desc,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(fontSize: context.sp(10), color: Colors.grey, height: 1.3),
                          ),
                          const Spacer(),
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  footerLabel,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(fontSize: context.sp(8.5), fontWeight: FontWeight.w900, color: AppColors.primary),
                                ),
                              ),
                              const SizedBox(width: 4),
                              Icon(Icons.arrow_forward_ios_rounded, size: context.sp(9), color: AppColors.primary),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
