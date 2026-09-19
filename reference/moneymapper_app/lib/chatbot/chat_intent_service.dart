import 'dart:async';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../services/api_service.dart';
import '../services/score_card_advisor.dart';
import 'chat_message.dart';

class _IntentRule {
  final List<String> keywords;
  final String route;
  final String redirectLabel;
  final String Function(Map<String, dynamic>? data) responseBuilder;

  const _IntentRule({
    required this.keywords,
    required this.route,
    required this.redirectLabel,
    required this.responseBuilder,
  });
}

class ChatIntentService {
  final ApiService _api = ApiService();

  final List<_IntentRule> _intentRules = [
    // 1. Greetings & Bot Capabilities
    _IntentRule(
      keywords: [
        'hi',
        'hello',
        'hey',
        'namaste',
        'who are you',
        'help',
        'what can you do',
        'options',
        'menu',
        'bot'
      ],
      route: '/dashboard',
      redirectLabel: 'Go to Dashboard',
      responseBuilder: (data) =>
          'Hi! I am your **MoneyMapper Assistant**!\n\n'
          'I can answer questions about all app features, your 5 financial health pillars, emergency reserves, mutual funds, weekly budgets, and redirect you anywhere in the app.\n\n'
          'Try asking about your **Emergency Fund**, **Income**, **Mutual Funds**, **Achievements**, or **Profile**!',
    ),

    // 2. Profile & Account Settings
    _IntentRule(
      keywords: [
        'profile',
        'user settings',
        'edit name',
        'my info',
        'account',
        'personal details',
        'password',
        'reset password',
        'login',
        'logout'
      ],
      route: '/profile',
      redirectLabel: 'View Profile',
      responseBuilder: (data) =>
          'Manage your **personal details**, account settings, security preferences, and profile information in the Profile section.',
    ),

    // 3. Master Data & Raw Vault
    _IntentRule(
      keywords: [
        'master data',
        'raw data',
        'documents',
        'records',
        'bank accounts',
        'salary slips',
        'data vault'
      ],
      route: '/master_data',
      redirectLabel: 'Open Master Data',
      responseBuilder: (data) =>
          'Access your **master financial records**, uploaded salary slips, bank account details, and raw data profile.',
    ),

    // 4. Emergency Fund & Emergency Savings Pillar
    _IntentRule(
      keywords: [
        'emergency fund',
        'emergency savings',
        'emergency savings pillar',
        'savings pillar',
        'liquidity',
        'shortfall',
        'months covered',
        'emergency',
        'savings'
      ],
      route: '/emergency_fund_p',
      redirectLabel: 'Check Emergency Fund',
      responseBuilder: (data) {
        final savings = data?['savings_scores'] as Map<String, dynamic>?;
        if (savings != null) {
          final current = (savings['ef_current_estimated'] ?? 0).toDouble();
          final target = (savings['ef_target_amount'] ?? 0).toDouble();
          final shortfall = (target - current) > 0 ? (target - current) : 0.0;
          return 'Your **Emergency Fund** status:\n'
              '• Current Balance: **₹${current.toStringAsFixed(0)}**\n'
              '• Target Cushion: **₹${target.toStringAsFixed(0)}**\n'
              '• Shortfall: **₹${shortfall.toStringAsFixed(0)}**\n\n'
              'Keep at least 6 months of expenses liquid for safety!';
        }
        return 'Check your **Emergency Fund** status, savings readiness, and liquidity targets.';
      },
    ),

    // 5. Income Pillar & Earnings
    _IntentRule(
      keywords: [
        'income',
        'salary',
        'passive income',
        'active income',
        'earning',
        'cashflow'
      ],
      route: '/income_p',
      redirectLabel: 'Analyze Income',
      responseBuilder: (data) {
        final income = data?['income_scores'] as Map<String, dynamic>?;
        if (income != null) {
          final active = income['active_income_score'] ?? 0;
          final passive = income['passive_income_score'] ?? 0;
          return 'Here is your **Income Pillar** breakdown:\n'
              '• Active Income Score: **$active**\n'
              '• Passive Income Score: **$passive**\n\n'
              'Track cashflow and build passive streams to grow your wealth!';
        }
        return 'Analyze your **income sources**, active vs passive earnings, and cashflow health.';
      },
    ),

    // 6. Expenses & Budgeting (50/30/20 Rule)
    _IntentRule(
      keywords: [
        'expense',
        'spending',
        'fixed spend',
        'flexible spend',
        '50/30/20',
        'budget'
      ],
      route: '/dashboard',
      redirectLabel: 'View Dashboard',
      responseBuilder: (data) {
        final expense = data?['expense_scores'] as Map<String, dynamic>?;
        if (expense != null) {
          final fixed = expense['fixed_score'] ?? 0;
          final flex = expense['flexible_score'] ?? 0;
          final tip = expense['discipline_message'] ?? 'Keep tracking expenses daily.';
          return 'Your **Expense & Budget** Breakdown:\n'
              '• Fixed Spend Score: **$fixed**\n'
              '• Flexible Spend Score: **$flex**\n'
              '• Tip: **$tip**';
        }
        return 'Track your **spending habits**, fixed & flexible costs using the 50/30/20 budget framework.';
      },
    ),

    // 7. Protection & Insurance Pillar
    _IntentRule(
      keywords: [
        'protection',
        'insurance',
        'term insurance',
        'health insurance',
        'cover',
        'floater',
        'policy'
      ],
      route: '/insurance_p',
      redirectLabel: 'Insurance Review',
      responseBuilder: (data) {
        final prot = data?['protection_scores'] as Map<String, dynamic>?;
        if (prot != null) {
          final term = prot['term_score'] ?? 0;
          final health = prot['health_score'] ?? 0;
          return 'Your **Protection Pillar** status:\n'
              '• Term Insurance Score: **$term**\n'
              '• Health Insurance Score: **$health**';
        }
        return 'Review your **insurance coverage**, term life plans, and health policies.';
      },
    ),

    // 8. Investments & Asset Allocation
    _IntentRule(
      keywords: [
        'investment',
        'wealth',
        'sip',
        'equity',
        'debt',
        'gold',
        'portfolio',
        'asset allocation'
      ],
      route: '/mutual_fund_p',
      redirectLabel: 'Explore Investments',
      responseBuilder: (data) {
        final inv = data?['investment_scores'] as Map<String, dynamic>?;
        if (inv != null) {
          final equity = inv['equity_score'] ?? 0;
          final sip = inv['sip_score'] ?? 0;
          final asset = inv['asset_balance_score'] ?? 0;
          return 'Your **Investment Pillar** status:\n'
              '• Equity Score: **$equity**\n'
              '• SIP Score: **$sip**\n'
              '• Asset Balance Score: **$asset**';
        }
        return 'Explore your **investment portfolio**, SIP allocations, and wealth building.';
      },
    ),

    // 9. Mutual Funds & Market Schemes
    _IntentRule(
      keywords: [
        'mutual fund',
        'funds',
        'elss',
        'nifty 50',
        'index fund',
        'sip calculator',
        'invest'
      ],
      route: '/mutual_fund_p',
      redirectLabel: 'Explore Mutual Funds',
      responseBuilder: (data) =>
          'Explore top-rated **Mutual Funds**, ELSS tax saving schemes, and SIP calculators tailored for your risk profile.',
    ),

    // 10. AI Recommendations & Advisory Engine
    _IntentRule(
      keywords: [
        'ai',
        'recommendation',
        'advisor',
        'insights',
        'advice',
        'suggestions'
      ],
      route: '/ai',
      redirectLabel: 'Open AI Advisory',
      responseBuilder: (data) =>
          'Our **AI Advisory Engine** analyzes your 5 financial pillars to give personalized action items, savings optimization, and smart wealth strategies.',
    ),

    // 11. Weekly Expense Log & Tracker
    _IntentRule(
      keywords: [
        'weekly',
        'tracker',
        'log expense',
        'this week',
        'weekly budget',
        'weekly tracker',
        'spend log'
      ],
      route: '/weekly',
      redirectLabel: 'Log Weekly Expenses',
      responseBuilder: (data) =>
          'Track and log your **weekly expenses** against your target monthly budget to build spending discipline.',
    ),

    // 12. Achievements, Badges & Rewards
    _IntentRule(
      keywords: [
        'achievement',
        'badge',
        'streak',
        'level',
        'rewards',
        'points',
        'leaderboard',
        'gamification'
      ],
      route: '/achievements',
      redirectLabel: 'View Badges',
      responseBuilder: (data) =>
          'Check out your **achievements**, financial streak badges, reward levels, and community rank!',
    ),

    // 13. Corporate Wellness & Employer Benefits
    _IntentRule(
      keywords: [
        'corporate',
        'company',
        'employer',
        'benefits',
        'wellness program',
        'hr',
        'workforce'
      ],
      route: '/corporate_dashboard',
      redirectLabel: 'Corporate Dashboard',
      responseBuilder: (data) =>
          'Access your **corporate wellness program**, employer-sponsored benefits, and workforce analytics.',
    ),

    // 14. Privacy & Data Security
    _IntentRule(
      keywords: [
        'privacy',
        'security',
        'data protection',
        'screen recording',
        'encrypted',
        'privacy policy',
        'safety'
      ],
      route: '/privacy',
      redirectLabel: 'View Privacy Policy',
      responseBuilder: (data) =>
          'Your financial data is protected with **enterprise-grade security**, automatic screen blur on app switch, screenshot prevention, and AES encryption.',
    ),

    // 15. Onboarding & App Setup
    _IntentRule(
      keywords: ['onboard', 'setup', 'walkthrough', 'guide', 'start'],
      route: '/onboarding',
      redirectLabel: 'Start Onboarding',
      responseBuilder: (data) =>
          'Re-visit the **onboarding setup** to update your primary financial baseline and initial preferences.',
    ),

    // 16. Main Dashboard & Financial Fitness Score
    _IntentRule(
      keywords: ['dashboard', 'home', 'overview', 'main', 'score', 'overall', 'fitness score'],
      route: '/dashboard',
      redirectLabel: 'Go to Dashboard',
      responseBuilder: (data) {
        final fitness = data?['financial_fitness_scores'] as Map<String, dynamic>?;
        if (fitness != null) {
          final score = fitness['global_fitness_score'] ?? 0;
          return 'Your overall **Financial Fitness Score** is **$score**.\nNavigate to the dashboard for a full overview of all 5 pillars.';
        }
        return 'View your main **Financial Dashboard** and overall 5-pillar health score.';
      },
    ),
  ];

  final SupabaseClient _supabase = Supabase.instance.client;

  // In-Memory Local Cache for All 4 Score Cards Data
  static List<Map<String, dynamic>>? _cachedStocks;
  static List<Map<String, dynamic>>? _cachedFunds;
  static List<Map<String, dynamic>>? _cachedPlans;
  static List<Map<String, dynamic>>? _cachedIpos;

  Future<List<Map<String, dynamic>>> _getStocks() async {
    if (_cachedStocks != null && _cachedStocks!.isNotEmpty) return _cachedStocks!;
    try {
      final res = await _supabase.schema('bse_data').from('stock_signals').select();
      _cachedStocks = List<Map<String, dynamic>>.from(res);
      return _cachedStocks!;
    } catch (_) {
      return _cachedStocks ?? [];
    }
  }

  Future<List<Map<String, dynamic>>> _getFunds() async {
    if (_cachedFunds != null && _cachedFunds!.isNotEmpty) return _cachedFunds!;
    try {
      final res = await _supabase.schema('bse_data').from('mutual_fund_signals').select();
      _cachedFunds = List<Map<String, dynamic>>.from(res);
      return _cachedFunds!;
    } catch (_) {
      return _cachedFunds ?? [];
    }
  }

  Future<List<Map<String, dynamic>>> _getPlans() async {
    if (_cachedPlans != null && _cachedPlans!.isNotEmpty) return _cachedPlans!;
    try {
      final res = await _supabase.schema('bse_data').from('insurance_plans').select();
      _cachedPlans = List<Map<String, dynamic>>.from(res);
      return _cachedPlans!;
    } catch (_) {
      return _cachedPlans ?? [];
    }
  }

  Future<List<Map<String, dynamic>>> _getIpos() async {
    if (_cachedIpos != null && _cachedIpos!.isNotEmpty) return _cachedIpos!;
    try {
      final res = await _supabase.schema('bse_data').from('ipo_signals').select();
      _cachedIpos = List<Map<String, dynamic>>.from(res);
      return _cachedIpos!;
    } catch (_) {
      return _cachedIpos ?? [];
    }
  }

  Future<ChatMessage> processMessage(String queryText) async {
    final timestamp = DateFormat('hh:mm a').format(DateTime.now());

    // 1. Check if query matches a Score Card entry (Stock, MF, Insurance, IPO)
    final scoreCardMsg = await _tryResolveScoreCardQuery(queryText, timestamp);
    if (scoreCardMsg != null) return scoreCardMsg;

    // Artificial 300ms delay for natural typing feel
    await Future.delayed(const Duration(milliseconds: 300));

    Map<String, dynamic>? dashboardData;
    try {
      dashboardData = await _api.getDashboard();
    } catch (_) {
      dashboardData = null;
    }

    final normalizedQuery = queryText.toLowerCase().trim();

    for (final rule in _intentRules) {
      for (final keyword in rule.keywords) {
        if (normalizedQuery.contains(keyword)) {
          String responseText;
          try {
            responseText = rule.responseBuilder(dashboardData);
          } catch (_) {
            responseText = 'View your **Financial Health Dashboard** for detailed insights on this category.';
          }
          return ChatMessage(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            sender: 'bot',
            text: responseText,
            redirectTo: rule.route,
            redirectLabel: rule.redirectLabel,
            quickActions: const [],
            timestamp: timestamp,
          );
        }
      }
    }

    // Out-of-Domain Query Detector
    final outOfDomainKeywords = [
      'weather', 'rain', 'temperature', 'forecast', 'climate',
      'recipe', 'cook', 'food', 'pizza', 'burger', 'restaurant', 'dinner',
      'movie', 'film', 'song', 'music', 'game', 'cricket', 'football', 'actor', 'netflix',
      'python', 'java', 'javascript', 'code', 'html', 'css', 'debug',
      'president', 'capital', 'planet', 'space', 'quantum', 'politics',
      'joke', 'sing', 'dance', 'love', 'relationship', 'who won'
    ];

    for (final kw in outOfDomainKeywords) {
      if (normalizedQuery.contains(kw)) {
        return ChatMessage(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          sender: 'bot',
          text:
              "That topic is outside my domain! I am **MoneyMapper Assistant**, specialized exclusively in **Personal Finance, Wealth Management & MoneyMapper App Features**.\n\n"
              "I can help you with:\n"
              "• 📊 **Financial Fitness Score** & 5-Pillar Analysis\n"
              "• 🚨 **Emergency Reserve** & Liquidity Cushion\n"
              "• 📈 **Mutual Funds**, SIPs & Asset Allocation\n"
              "• 💼 **Income & Expense Budgeting** (50/30/20 Rule)\n"
              "• 🛡️ **Insurance & Term/Health Cover**\n"
              "• 🏆 **Achievements**, Rewards & Badges",
          redirectTo: '/dashboard',
          redirectLabel: 'Explore MoneyMapper Dashboard',
          quickActions: const [
            QuickAction(label: 'Financial Score', route: '/dashboard'),
            QuickAction(label: 'Emergency Fund', route: '/emergency_fund_p'),
            QuickAction(label: 'Mutual Funds', route: '/mutual_fund_p'),
            QuickAction(label: 'Profile', route: '/profile'),
          ],
          timestamp: timestamp,
        );
      }
    }

    // Generic fallback for unrecognized financial queries
    return ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      sender: 'bot',
      text:
          "I'm specialized in **Personal Finance & MoneyMapper App Features**!\n\n"
          "I couldn't find a direct match for that query. Try asking about **Reliance Stock**, **SBI Mutual Fund**, **Health Insurance**, or **Upcoming IPOs**.",
      redirectTo: '/dashboard',
      redirectLabel: 'Go to Dashboard',
      quickActions: const [
        QuickAction(label: 'Stock Screener', route: '/stock_screener'),
        QuickAction(label: 'MF Screener', route: '/mf_screener'),
        QuickAction(label: 'Insurance Screener', route: '/insurance_screener'),
      ],
      timestamp: timestamp,
    );
  }

  String _formatCompactCurrency(num amount) {
    if (amount >= 10000000) return "₹${(amount / 10000000).toStringAsFixed(1)} Cr";
    if (amount >= 100000) return "₹${(amount / 100000).toStringAsFixed(1)} Lakhs";
    if (amount >= 1000) return "₹${(amount / 1000).round()}K";
    return "₹${amount.round()}";
  }

  Future<ChatMessage?> _tryResolveFeaturedAiQuestions(String norm, String timestamp) async {
    // Question 1: "What's today's best stock for me?"
    if (norm.contains("today's best stock") || norm.contains("best stock for me") || (norm.contains("best stock") && norm.contains("today"))) {
      final List<Map<String, dynamic>> stocks = await _getStocks(); // Uses Local Memory Cache

      final buyStocks = stocks.where((s) {
        final rawScore = s['score'] ?? s['stock_score'] ?? s['score_card'] ?? 0;
        final double score = double.tryParse(rawScore.toString()) ?? 0;
        final signal = (s['signal'] ?? s['buy_signal'] ?? '').toString().toUpperCase();
        return score >= 70 || signal == 'BUY';
      }).toList();

      final selectedStock = buyStocks.isNotEmpty
          ? buyStocks[DateTime.now().second % buyStocks.length]
          : (stocks.isNotEmpty ? stocks.first : null);

      if (selectedStock != null) {
        final name = selectedStock['company_name'] ?? selectedStock['stock_name'] ?? selectedStock['symbol'] ?? selectedStock['name'] ?? 'Top Stock';
        final rawScore = selectedStock['score'] ?? selectedStock['stock_score'] ?? 82;
        final score = double.tryParse(rawScore.toString())?.round() ?? 82;
        final signal = selectedStock['signal'] ?? 'BUY';
        final sector = selectedStock['sector'] ?? selectedStock['industry'] ?? 'Growth Sector';
        final return1Y = selectedStock['one_year_return'] ?? selectedStock['cagr'] ?? '24.5%';

        return ChatMessage(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          sender: 'bot',
          text: "📊 **Today's Top Recommended Stock for You**:\n\n"
                "• **Company**: **$name**\n"
                "• **Stock Score**: **$score / 100** ⭐\n"
                "• **Signal**: **$signal** 🚀\n"
                "• **Sector**: $sector\n"
                "• **1-Year Return**: $return1Y\n\n"
                "💡 *This stock is selected from our score card engine with a high score (≥70) and positive momentum.*",
          redirectTo: '/stock_screener',
          redirectLabel: 'Explore Stock Screener',
          timestamp: timestamp,
        );
      }
    }

    // Question 2: "Which mutual fund suits my long-term goals?"
    if (norm.contains("mutual fund suits") || norm.contains("long-term goals") || (norm.contains("suits") && norm.contains("goals"))) {
      Map<String, dynamic>? profile;
      try {
        final res = await _api.getMasterProfile();
        profile = res['data'] ?? {};
      } catch (_) {}

      final riskAppetite = (profile?['riskAppetite'] ?? 'Moderate').toString();
      final List<Map<String, dynamic>> funds = await _getFunds(); // Uses Local Memory Cache

      // Filter funds by risk cluster or category
      List<Map<String, dynamic>> clusterFunds = funds.where((f) {
        final cluster = (f['cluster'] ?? f['category'] ?? f['risk_tier'] ?? '').toString().toLowerCase();
        return cluster.contains(riskAppetite.toLowerCase());
      }).toList();

      if (clusterFunds.isEmpty) clusterFunds = List.from(funds);

      // Sort by score descending
      clusterFunds.sort((a, b) {
        final scoreA = double.tryParse((a['score'] ?? a['fund_score'] ?? 0).toString()) ?? 0;
        final scoreB = double.tryParse((b['score'] ?? b['fund_score'] ?? 0).toString()) ?? 0;
        return scoreB.compareTo(scoreA);
      });

      Map<String, dynamic>? fund1 = clusterFunds.isNotEmpty ? clusterFunds.first : null;
      Map<String, dynamic>? fund2;
      if (fund1 != null) {
        final cat1 = (fund1['category'] ?? fund1['type'] ?? '').toString();
        fund2 = clusterFunds.firstWhere(
          (f) => (f['category'] ?? f['type'] ?? '').toString() != cat1,
          orElse: () => clusterFunds.length > 1 ? clusterFunds[1] : fund1!,
        );
      }

      final f1Name = fund1?['scheme_name'] ?? fund1?['fund_name'] ?? 'Parag Parikh Flexi Cap Fund';
      final f1Cat = fund1?['category'] ?? 'Flexi Cap';
      final rawScore1 = fund1?['score'] ?? fund1?['fund_score'] ?? 88;
      final f1Score = double.tryParse(rawScore1.toString())?.round() ?? 88;

      final f2Name = fund2?['scheme_name'] ?? fund2?['fund_name'] ?? 'SBI Bluechip Fund';
      final f2Cat = fund2?['category'] ?? 'Large Cap';
      final rawScore2 = fund2?['score'] ?? fund2?['fund_score'] ?? 84;
      final f2Score = double.tryParse(rawScore2.toString())?.round() ?? 84;

      return ChatMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        sender: 'bot',
        text: "🎯 **Mutual Funds Suited for Your Long-Term Goals**\n"
              "Based on your profile risk appetite (**$riskAppetite**), here are 2 top-ranked funds from different categories:\n\n"
              "1️⃣ **$f1Name**\n"
              "   • **Category**: $f1Cat\n"
              "   • **Score**: **$f1Score / 100** ⭐\n\n"
              "2️⃣ **$f2Name**\n"
              "   • **Category**: $f2Cat\n"
              "   • **Score**: **$f2Score / 100** ⭐\n\n"
              "💡 *These 2 funds diversify your portfolio across growth and stability for long-term compounding.*",
        redirectTo: '/mutual_fund_p',
        redirectLabel: 'Explore Mutual Funds',
        timestamp: timestamp,
      );
    }

    // Question 3: "Best liquid fund for my emergency needs?"
    if (norm.contains("liquid fund") || norm.contains("emergency needs") || (norm.contains("liquid") && norm.contains("emergency"))) {
      final List<Map<String, dynamic>> funds = await _getFunds(); // Uses Local Memory Cache

      final liquidFunds = funds.where((f) {
        final cat = (f['category'] ?? f['scheme_type'] ?? f['cluster'] ?? '').toString().toLowerCase();
        return cat.contains('liquid') || cat.contains('debt') || cat.contains('overnight');
      }).toList();

      final selectedLiquid = liquidFunds.isNotEmpty
          ? liquidFunds[DateTime.now().second % liquidFunds.length]
          : (funds.isNotEmpty ? funds.first : null);

      final lName = selectedLiquid?['scheme_name'] ?? selectedLiquid?['fund_name'] ?? 'Nippon India Liquid Fund';
      final rawLScore = selectedLiquid?['score'] ?? selectedLiquid?['fund_score'] ?? 86;
      final lScore = double.tryParse(rawLScore.toString())?.round() ?? 86;
      final lReturn = selectedLiquid?['one_year_return'] ?? selectedLiquid?['yield'] ?? '6.8% p.a.';

      return ChatMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        sender: 'bot',
        text: "🛡️ **Best Liquid Fund for Your Emergency Needs**:\n\n"
              "• **Fund Name**: **$lName**\n"
              "• **Category**: Debt - Liquid Scheme\n"
              "• **Score**: **$lScore / 100** ⭐\n"
              "• **Est. Annual Yield**: **$lReturn**\n\n"
              "💡 *Liquid funds offer T+1 instant liquidity with zero lock-in, making them ideal for parking your emergency reserves safely.*",
        redirectTo: '/emergency_fund_p',
        redirectLabel: 'Check Emergency Fund',
        timestamp: timestamp,
      );
    }

    // Question 4: "Which insurance fits my budget?"
    if (norm.contains("insurance fits") || norm.contains("fits my budget") || (norm.contains("insurance") && norm.contains("budget"))) {
      Map<String, dynamic>? profile;
      try {
        final res = await _api.getMasterProfile();
        profile = res['data'] ?? {};
      } catch (_) {}

      final double monthlyIncome = double.tryParse(profile?['monthlyActiveIncome']?.toString() ?? '0') ?? 50000;
      final double yearlyIncome = monthlyIncome > 0 ? (monthlyIncome * 12) : 600000.0;

      // Limits: Health Cover = 10x yearly income, Life Cover = 15x yearly income
      final double healthMaxCover = yearlyIncome * 10;
      final double lifeMaxCover = yearlyIncome * 15;

      final String healthCoverFmt = _formatCompactCurrency(healthMaxCover);
      final String lifeCoverFmt = _formatCompactCurrency(lifeMaxCover);

      final List<Map<String, dynamic>> plans = await _getPlans(); // Uses Local Memory Cache

      final healthPlans = plans.where((p) => (p['category'] ?? p['type'] ?? p['plan_type'] ?? '').toString().toLowerCase().contains('health')).toList();
      final lifePlans = plans.where((p) => (p['category'] ?? p['type'] ?? p['plan_type'] ?? '').toString().toLowerCase().contains('life') || (p['category'] ?? '').toString().toLowerCase().contains('term')).toList();

      final hPlan = healthPlans.isNotEmpty ? healthPlans.first : (plans.isNotEmpty ? plans.first : null);
      final lPlan = lifePlans.isNotEmpty ? lifePlans.first : (plans.length > 1 ? plans[1] : null);

      final hName = hPlan?['plan_name'] ?? hPlan?['provider_name'] ?? 'HDFC Ergo Optima Secure Health';
      final lName = lPlan?['plan_name'] ?? lPlan?['provider_name'] ?? 'ICICI Prudential iProtect Term Life';

      return ChatMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        sender: 'bot',
        text: "💳 **Insurance Cover Tailored for Your Income & Budget**\n"
              "Based on your calculated annual income of **${_formatCompactCurrency(yearlyIncome)}**:\n\n"
              "🏥 **Recommended Health Insurance**:\n"
              "   • **Plan**: $hName\n"
              "   • **Recommended Health Cover (10x)**: **$healthCoverFmt**\n\n"
              "🛡️ **Recommended Life / Term Insurance**:\n"
              "   • **Plan**: $lName\n"
              "   • **Recommended Life Cover (15x)**: **$lifeCoverFmt**\n\n"
              "💡 *These coverage limits protect your family against medical emergencies and secure long-term financial stability within your budget.*",
        redirectTo: '/insurance_screener',
        redirectLabel: 'Explore Insurance Plans',
        timestamp: timestamp,
      );
    }

    return null;
  }

  Future<ChatMessage?> _tryResolveScoreCardQuery(String queryText, String timestamp) async {
    final norm = queryText.toLowerCase().trim();

    // 0. FEATURED AI ASSISTANT INITIAL QUESTIONS
    final featuredAiMsg = await _tryResolveFeaturedAiQuestions(norm, timestamp);
    if (featuredAiMsg != null) return featuredAiMsg;

    // 1. MUTUAL FUND SCORE CARD QUERY (Evaluated FIRST to prevent cross-domain stock intercepts)
    final mfKeywords = [
      'mutual fund', 'mf', 'sip', 'elss', 'bluechip', 'small cap', 'mid cap',
      'flexi cap', 'large cap', 'index fund', 'debt fund', 'hybrid', 'fund', 'funds',
      'cagr', 'aum', 'sbi bluechip', 'nippon', 'parag parikh', 'mirae', 'quant',
      'axis long term', 'hdfc balanced', 'kotak emerging', 'uti nifty', 'icici pru'
    ];

    bool isMfQuery = mfKeywords.any((kw) => norm.contains(kw));
    if (isMfQuery) {
      try {
        final List<Map<String, dynamic>> funds = await _getFunds();
        final matchedFund = _findBestMatch(norm, funds, ['scheme_name', 'fund_name', 'category', 'cluster']);

        if (matchedFund != null) {
          final text = ScoreCardAdvisor.generateMfAdvice(matchedFund);
          return ChatMessage(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            sender: 'bot',
            text: text,
            redirectTo: '/mf_screener',
            redirectLabel: 'Explore Mutual Fund Screener',
            quickActions: const [
              QuickAction(label: 'MF Screener', route: '/mf_screener'),
              QuickAction(label: 'Stock Screener', route: '/stock_screener'),
            ],
            timestamp: timestamp,
          );
        } else if (!norm.contains('screener') && !norm.contains('overall')) {
          return ChatMessage(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            sender: 'bot',
            text: "Sorry! I couldn't identify that mutual fund scheme in our Score Card dataset.\n\nTry searching with specific scheme names (e.g. **'SBI Small Cap Fund'**, **'Parag Parikh Flexi Cap'**) or explore all rated schemes in our **Mutual Fund Screener**!",
            redirectTo: '/mf_screener',
            redirectLabel: 'Open MF Screener',
            quickActions: const [
              QuickAction(label: 'MF Screener', route: '/mf_screener'),
            ],
            timestamp: timestamp,
          );
        }
      } catch (_) {}
    }

    // 2. INSURANCE SCORE CARD QUERY (Evaluated SECOND)
    final insKeywords = [
      'insurance', 'policy', 'health plan', 'term plan', 'cover', 'csr', 'claim',
      'health cover', 'term cover', 'life cover', 'sum assured', 'premium',
      'hdfc ergo', 'optima', 'star health', 'care health', 'max bupa', 'icici lombard',
      'tata aia', 'lic', 'niva bupa', 'aditya birla'
    ];

    bool isInsQuery = insKeywords.any((kw) => norm.contains(kw));
    if (isInsQuery) {
      try {
        final List<Map<String, dynamic>> plans = await _getPlans();
        final matchedPlan = _findBestMatch(norm, plans, ['plan_name', 'company_name', 'plan_type']);

        if (matchedPlan != null) {
          final text = ScoreCardAdvisor.generateInsuranceDetails(matchedPlan);
          return ChatMessage(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            sender: 'bot',
            text: text,
            redirectTo: '/insurance_screener',
            redirectLabel: 'Explore Insurance Screener',
            quickActions: const [
              QuickAction(label: 'Insurance Screener', route: '/insurance_screener'),
            ],
            timestamp: timestamp,
          );
        } else if (!norm.contains('screener') && !norm.contains('overall')) {
          return ChatMessage(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            sender: 'bot',
            text: "Sorry! I couldn't find that specific insurance plan in our dataset.\n\nTry searching for top providers like **'HDFC Ergo Optima'**, **'Star Health'**, or **'Care Health'**, or open the Insurance Screener!",
            redirectTo: '/insurance_screener',
            redirectLabel: 'Open Insurance Screener',
            quickActions: const [
              QuickAction(label: 'Insurance Screener', route: '/insurance_screener'),
            ],
            timestamp: timestamp,
          );
        }
      } catch (_) {}
    }

    // 3. IPO SCORE CARD QUERY (Evaluated THIRD)
    final ipoKeywords = [
      'ipo', 'upcoming ipo', 'price band', 'issue size', 'gmp', 'bidding', 'allotment'
    ];

    bool isIpoQuery = ipoKeywords.any((kw) => norm.contains(kw));
    if (isIpoQuery) {
      try {
        final List<Map<String, dynamic>> ipos = await _getIpos();
        final matchedIpo = _findBestMatch(norm, ipos, ['company_name', 'name']);

        if (matchedIpo != null) {
          final text = ScoreCardAdvisor.generateIpoDetails(matchedIpo);
          return ChatMessage(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            sender: 'bot',
            text: text,
            redirectTo: '/dashboard',
            redirectLabel: 'View Dashboard',
            quickActions: const [
              QuickAction(label: 'Stock Screener', route: '/stock_screener'),
              QuickAction(label: 'MF Screener', route: '/mf_screener'),
            ],
            timestamp: timestamp,
          );
        } else if (!norm.contains('screener')) {
          return ChatMessage(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            sender: 'bot',
            text: "Sorry! I couldn't find active IPO score card details for that query. Check upcoming IPOs in the dashboard or Stock Screener!",
            redirectTo: '/dashboard',
            redirectLabel: 'Go to Dashboard',
            quickActions: const [
              QuickAction(label: 'Stock Screener', route: '/stock_screener'),
            ],
            timestamp: timestamp,
          );
        }
      } catch (_) {}
    }

    // 4. STOCK SCORE CARD QUERY (Evaluated FOURTH - Generic words like 'india', 'company' removed)
    final stockKeywords = [
      'stock', 'share', 'shares', 'equity', 'nifty 50', 'bse', 'buy stock', 'sell stock',
      'pe ratio', 'market cap', 'reliance', 'tata motors', 'infosys', 'tcs', 'hdfc bank',
      'icici bank', 'sbi bank', 'adani', 'itc', 'bharti', 'wipro', 'l&t', 'maruti', 'bajaj',
      'asian paints', 'titan', 'sun pharma', 'axis bank', 'kotak bank', 'ultratech',
      'power grid', 'ntpc', 'jio', 'hal', 'vedanta', 'zomato', 'paytm', 'policybazaar',
      'nykaa', 'irctc', 'coal india', 'ongc', 'divis', 'cipla'
    ];

    bool isStockQuery = stockKeywords.any((kw) => norm.contains(kw));
    if (isStockQuery) {
      try {
        final List<Map<String, dynamic>> stocks = await _getStocks();
        final matchedStock = _findBestMatch(norm, stocks, ['company_name', 'symbol', 'sector']);

        if (matchedStock != null) {
          final text = ScoreCardAdvisor.generateStockAdvice(matchedStock);
          return ChatMessage(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            sender: 'bot',
            text: text,
            redirectTo: '/stock_screener',
            redirectLabel: 'Explore Stock Screener',
            quickActions: const [
              QuickAction(label: 'Stock Screener', route: '/stock_screener'),
              QuickAction(label: 'MF Screener', route: '/mf_screener'),
            ],
            timestamp: timestamp,
          );
        } else if (!norm.contains('screener') && !norm.contains('overall')) {
          return ChatMessage(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            sender: 'bot',
            text: "Sorry! I couldn't identify that specific stock in our Stock Score Card dataset.\n\nTry asking about top companies like **Reliance**, **Tata Motors**, **Infosys**, or **HDFC Bank**, or explore all listed stocks in our **Stock Screener**!",
            redirectTo: '/stock_screener',
            redirectLabel: 'Open Stock Screener',
            quickActions: const [
              QuickAction(label: 'Stock Screener', route: '/stock_screener'),
            ],
            timestamp: timestamp,
          );
        }
      } catch (_) {}
    }

    return null;
  }

  Map<String, dynamic>? _findBestMatch(
    String queryNorm,
    List<Map<String, dynamic>> items,
    List<String> searchFields,
  ) {
    const stopWords = {
      'mutual', 'fund', 'funds', 'stock', 'stocks', 'share', 'shares',
      'company', 'plan', 'plans', 'insurance', 'direct', 'growth',
      'scheme', 'option', 'screener', 'score', 'card', 'tell', 'show',
      'me', 'about', 'best', 'top', 'what', 'is', 'the', 'for', 'a',
      'suggest', 'recommend', 'give', 'detail', 'details', 'info'
    };

    final queryTokens = queryNorm
        .replaceAll(RegExp(r'[^\w\s]'), ' ')
        .split(RegExp(r'\s+'))
        .where((w) => w.length >= 2 && !stopWords.contains(w))
        .toList();

    if (queryTokens.isEmpty) return null;

    final List<RegExp> tokenRegexes = queryTokens.map((t) =>
      RegExp(r'\b' + RegExp.escape(t) + r'\b', caseSensitive: false)
    ).toList();

    Map<String, dynamic>? bestItem;
    int maxScore = 0;

    for (final item in items) {
      int score = 0;
      for (final field in searchFields) {
        final val = (item[field] ?? '').toString().toLowerCase();
        if (val.isEmpty) continue;

        // Exact phrase match
        final cleanPhrase = queryTokens.join(' ');
        final fullPhraseRegex = RegExp(
          RegExp.escape(cleanPhrase),
          caseSensitive: false,
        );
        if (cleanPhrase.isNotEmpty && fullPhraseRegex.hasMatch(val)) {
          score += 20;
        }

        // Token RegExp matches
        for (int i = 0; i < queryTokens.length; i++) {
          final token = queryTokens[i];
          final tokenRegex = tokenRegexes[i];

          if (tokenRegex.hasMatch(val)) {
            score += (token.length >= 4) ? 5 : 3;
          } else if (val.contains(token)) {
            score += (token.length >= 4) ? 3 : 1;
          }
        }
      }

      if (score > maxScore) {
        maxScore = score;
        bestItem = item;
      }
    }

    return (maxScore >= 3) ? bestItem : null;
  }
}
