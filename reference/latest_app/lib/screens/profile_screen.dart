import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/auth_service.dart';
import '../services/notification_service.dart';
import '../services/security_service.dart';
import '../services/streak_service.dart';
import '../services/premium_service.dart';
import '../services/xp_service.dart';
import '../theme/app_theme.dart';
import 'master_data_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final AuthService _auth = AuthService();
  final PremiumService _premiumService = PremiumService();

  String _name = '';
  String _email = '';
  String _plan = 'b2c';
  int _streakCount = 0;
  int _totalXp = 0;
  int _level = 1;
  int _maxXp = 300;
  double _xpProgress = 0.0;
  List<Map<String, String>> _unlockedBadges = [];
  bool _loading = true;
  bool _isPro = false;

  // Notification toggles
  bool _weeklyReminders = true;
  bool _appLockEnabled = false;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final name = await _auth.getUserName();
    final email = await _auth.getUserEmail();
    final reminders = await NotificationService().isEnabled();
    final lockEnabled = await SecurityService().isAppLockEnabled();
    final streak = await StreakService().getStreak();
    
    await _premiumService.syncSubscriptionStatus();
    final plan = await _auth.getUserPlan();
    final isPro = await _premiumService.isPro();

    final xpService = XpService();
    final xp = await xpService.getTotalXp();
    final info = xpService.getLevelInfo(xp);

    // Load unlocked badges for display
    final unlockedIds = await xpService.getUnlockedBadges();
    final badgeMap = {
      'debt_free': {'emoji': '🎉', 'title': 'Debt Free Milestone'},
      'emergency_complete': {'emoji': '🛡️', 'title': 'Emergency Fund Complete'},
      'investment_starter': {'emoji': '🌱', 'title': 'Investment Starter'},
      'protection_pro': {'emoji': '👨‍👩‍👧', 'title': 'Protection Pro'},
      'comeback_kid': {'emoji': '⚡', 'title': 'Comeback Kid'},
    };
    final badges = unlockedIds
        .where((id) => badgeMap.containsKey(id))
        .map((id) => badgeMap[id]!)
        .toList()
        .cast<Map<String, String>>();

    setState(() {
      _name = name ?? 'User';
      _email = email ?? '';
      _plan = plan ?? 'b2c';
      _weeklyReminders = reminders;
      _appLockEnabled = lockEnabled;
      _streakCount = streak;
      _isPro = isPro;
      _totalXp = xp;
      _level = info['level'];
      _maxXp = info['maxXp'];
      _xpProgress = info['progress'];
      _unlockedBadges = badges;
      _loading = false;
    });
  }

  String get _initials {
    final parts = _name.trim().split(RegExp(r'\s+'));
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[parts.length - 1][0]}'.toUpperCase();
    }
    return _name.isNotEmpty ? _name[0].toUpperCase() : 'U';
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Logout'),
        content: const Text('Are you sure you want to log out of MoneyMapper?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('Cancel', style: TextStyle(color: Colors.grey.shade600)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.danger,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Log out', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) {
      await _auth.logout();
      Navigator.of(context).pushNamedAndRemoveUntil('/login', (_) => false);
    }
  }

  // FAQ Data
  final List<Map<String, String>> _faqs = [
    {
      'question': 'How does MoneyMapper make me better with money?',
      'subtitle': 'Turns your finances into one clear, trackable score',
      'answer': 'MoneyMapper converts your income, expenses, savings, protection, and investments into a single humAIn IQ Score (0-100) — so instead of guessing where you stand financially, you get a clear, data-backed roadmap of exactly what to improve.',
      'icon': '💰'
    },
    {
      'question': 'How is my score calculated?',
      'subtitle': '5 pillars combine into your overall score',
      'answer': 'Your score is based on 5 pillars — Income, Expenses, Savings, Protection, and Investment. Each pillar gets its own sub-score from your real financial data (transactions, savings, cover, investments), and the overall score is the average of all five.',
      'icon': '📊'
    },
    {
      'question': 'Is my financial data safe?',
      'subtitle': 'Your data stays private and is never sold',
      'answer': 'Yes — your financial data is fully secure and used only to generate your score and recommendations. We never sell or share your personal financial data with third parties.',
      'icon': '🔒'
    },
    {
      'question': 'How long does it take to improve my score?',
      'subtitle': 'Small wins in weeks, bigger shifts in months',
      'answer': 'Depends on your gaps — smaller changes (like fixing budget adherence) can reflect in 2-4 weeks, while bigger structural moves (like building an emergency fund or increasing insurance cover) can take 3-6 months. Streaks and milestones in the app help you track progress along the way.',
      'icon': '⏳'
    },
    {
      'question': 'How often do recommendations update?',
      'subtitle': 'Advice refreshes automatically with your data',
      'answer': 'As soon as your financial data changes — a new transaction, a new investment, updated income — your score and recommendations refresh automatically, so the advice always matches your current situation.',
      'icon': '🔄'
    },
    {
      'question': 'Is MoneyMapper only for individuals, or can companies use it too?',
      'subtitle': 'Available for both individuals and companies',
      'answer': 'MoneyMapper works for individuals (B2C) as well as companies (B2B corporate wellness) — where organizations can track their employees\' financial wellness and help them make better financial decisions.',
      'icon': '🏢'
    },
  ];

  void _showRatingDialog() {
    int selectedRating = 0;
    final feedbackController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: const Text(
            'Rate MoneyMapper',
            textAlign: TextAlign.center,
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'How are you enjoying the app so far?',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: Colors.grey),
              ),
              const SizedBox(height: 20),
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Wrap(
                  alignment: WrapAlignment.center,
                  spacing: 4,
                  children: List.generate(5, (index) {
                    return InkWell(
                      onTap: () => setState(() => selectedRating = index + 1),
                      borderRadius: BorderRadius.circular(20),
                      child: Padding(
                        padding: const EdgeInsets.all(6.0),
                        child: Icon(
                          index < selectedRating ? Icons.star_rounded : Icons.star_outline_rounded,
                          color: index < selectedRating ? AppColors.warning : Colors.grey,
                          size: 32,
                        ),
                      ),
                    );
                  }),
                ),
              ),
              const SizedBox(height: 20),
              TextField(
                controller: feedbackController,
                maxLines: 3,
                style: const TextStyle(fontSize: 14),
                decoration: InputDecoration(
                  hintText: 'Share your feedback (optional)',
                  hintStyle: const TextStyle(fontSize: 13),
                  filled: true,
                  fillColor: Theme.of(context).brightness == Brightness.dark
                      ? Colors.white.withOpacity(0.05)
                      : Colors.grey.shade100,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
            ],
          ),
          actionsPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          actions: [
            Row(
              children: [
                Expanded(
                  child: TextButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Thank you for your feedback!'),
                          backgroundColor: AppColors.success,
                          behavior: SnackBarBehavior.floating,
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                    child: const Text('Submit', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showFaqOptions() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (_, scrollController) => Column(
          children: [
            const SizedBox(height: 12),
            Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.withOpacity(0.3), borderRadius: BorderRadius.circular(2))),
            const Padding(
              padding: EdgeInsets.all(24),
              child: Text('App Frequently Asked Questions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            ),
            Expanded(
              child: ListView.builder(
                controller: scrollController,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _faqs.length,
                itemBuilder: (ctx, i) {
                  final faq = _faqs[i];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkCard : Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.grey.withOpacity(0.2)),
                    ),
                    child: Theme(
                      data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                      child: ExpansionTile(
                        leading: Text(faq['icon']!, style: const TextStyle(fontSize: 20)),
                        title: Text(faq['question']!, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        subtitle: Text(faq['subtitle']!, style: const TextStyle(fontSize: 10, color: Colors.grey)),
                        children: [
                          Padding(
                            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                            child: Text(faq['answer']!, style: const TextStyle(fontSize: 12, height: 1.5, color: Colors.grey)),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showSupportOptions() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('How can we help?', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),
            ListTile(
              leading: const Icon(Icons.chat_bubble_outline_rounded, color: Color(0xFF25D366)),
              title: const Text('WhatsApp Chat', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: const Text('Fastest way to get a response'),
              onTap: () {
                Navigator.pop(ctx);
                _launchUrl("https://wa.me/917987469093?text=Hi+MoneyMapper+Team%2C+I+need+help+with...");
              },
            ),
            ListTile(
              leading: const Icon(Icons.email_outlined, color: AppColors.primary),
              title: const Text('Email Support', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: const Text('info@moneymapper.in'),
              onTap: () {
                Navigator.pop(ctx);
                _launchUrl("mailto:info@moneymapper.in?subject=Help%20Requested&body=Hi%20Team%2C%0A%0AI%20need%20help%20with...");
              },
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  void _showPlanToggle() {
    Navigator.of(context).pushNamed('/subscription');
  }

  Future<void> _updatePlan(String newPlan) async {
    Navigator.pop(context);
    await _premiumService.setPlan(newPlan);
    final isPro = await _premiumService.isPro();
    setState(() {
      _plan = newPlan;
      _isPro = isPro;
    });
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(isPro ? 'Switched to MoneyMapper Pro (Paid Mode)!' : 'Switched to MoneyMapper Free (Unpaid Mode)!'),
          backgroundColor: isPro ? AppColors.success : AppColors.primary,
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _launchUrl(String url) async {
    final Uri uri = Uri.parse(url);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open the link.')),
        );
      }
    }
  }

  void _exportData() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Export Financial Profile'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Select format for export:'),
            SizedBox(height: 12),
            Material(
              color: Colors.transparent,
              child: ListTile(
                leading: Icon(Icons.table_chart_outlined, color: AppColors.success),
                title: Text('CSV Format (Excel compatible)'),
                subtitle: Text('Full monthly logs & targets'),
                dense: true,
              ),
            ),
            Material(
              color: Colors.transparent,
              child: ListTile(
                leading: Icon(Icons.code, color: AppColors.primary),
                title: Text('JSON Data Profile'),
                subtitle: Text('Developer format backup'),
                dense: true,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Financial profile exported to downloads folder.'), backgroundColor: AppColors.success),
              );
            },
            child: const Text('Export Now', style: TextStyle(color: Colors.white)),
          )
        ],
      ),
    );
  }

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : CustomScrollView(
              slivers: [
                SliverToBoxAdapter(child: _buildHeader(isDark)),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        _buildSubscriptionCard(isDark),
                        const SizedBox(height: 18),
                        _buildSettingsGroup(
                          title: 'GAMIFIED MILESTONES',
                          isDark: isDark,
                          children: [
                            Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: AppColors.warning.withOpacity(0.1),
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(Icons.stars_rounded, color: AppColors.warning, size: 24),
                                      ),
                                      const SizedBox(width: 12),
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            'LVL $_level',
                                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
                                          ),
                                          Text(
                                            'Financial Navigator',
                                            style: TextStyle(
                                              fontSize: 10,
                                              color: isDark ? Colors.white60 : Colors.black54,
                                              fontWeight: FontWeight.w800,
                                              letterSpacing: 0.5,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const Spacer(),
                                      Text(
                                        '$_totalXp / $_maxXp XP',
                                        style: const TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w900,
                                          color: AppColors.primary,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 14),
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(6),
                                    child: LinearProgressIndicator(
                                      value: _xpProgress,
                                      minHeight: 8,
                                      backgroundColor: isDark ? Colors.white.withOpacity(0.08) : Colors.grey.shade200,
                                      valueColor: const AlwaysStoppedAnimation<Color>(AppColors.success),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const Divider(height: 1, indent: 16, endIndent: 16),
                            ListTile(
                              leading: const Icon(Icons.emoji_events_outlined, color: AppColors.accent),
                              title: const Text('Badges & Achievements', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                              subtitle: const Text('Review your earned financial milestones', style: TextStyle(fontSize: 11)),
                              trailing: const Icon(Icons.chevron_right, size: 20),
                              onTap: () {
                                Navigator.pushNamed(context, '/achievements');
                              },
                            ),
                            if (_unlockedBadges.isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                                child: SizedBox(
                                  height: 50,
                                  child: ListView.builder(
                                    scrollDirection: Axis.horizontal,
                                    itemCount: _unlockedBadges.length,
                                    itemBuilder: (ctx, i) {
                                      final item = _unlockedBadges[i];
                                      return Container(
                                        width: 50,
                                        height: 50,
                                        margin: const EdgeInsets.only(right: 12),
                                        decoration: BoxDecoration(
                                          color: isDark ? Colors.white.withOpacity(0.05) : Colors.grey.shade100,
                                          shape: BoxShape.circle,
                                          border: Border.all(color: AppColors.accent.withOpacity(0.2)),
                                        ),
                                        child: Center(
                                          child: Text(
                                            item['emoji']!,
                                            style: const TextStyle(fontSize: 24),
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                ),
                              ),
                            const Divider(height: 1, indent: 16, endIndent: 16),
                            ListTile(
                              leading: const Icon(Icons.person_add_alt_1_outlined, color: AppColors.primary),
                              title: const Text('Invite a Friend', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                              subtitle: const Text('Help others improve their financial score', style: TextStyle(fontSize: 11)),
                              trailing: const Icon(Icons.chevron_right, size: 20),
                              onTap: () {
                                Navigator.pushNamed(context, '/referral');
                              },
                            ),
                          ],
                        ),
                        const SizedBox(height: 18),
                        _buildSettingsGroup(
                          title: 'SECURITY & PREFERENCES',
                          isDark: isDark,
                          children: [
                            _buildDarkModeTile(isDark),
                            const Divider(height: 1, indent: 16, endIndent: 16),
                            SwitchListTile(
                              secondary: Icon(
                                Icons.lock_outline_rounded,
                                color: AppColors.primary,
                              ),
                              title: const Text('App Lock', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                              subtitle: const Text('Secure app with Biometric/PIN', style: TextStyle(fontSize: 11)),
                              value: _appLockEnabled,
                              activeColor: AppColors.primary,
                              onChanged: (val) async {
                                final success = await SecurityService().authenticate();
                                if (success) {
                                  await SecurityService().setAppLockEnabled(val);
                                  setState(() => _appLockEnabled = val);
                                }
                              },
                            ),
                            const Divider(height: 1, indent: 16, endIndent: 16),
                            SwitchListTile(
                              title: const Text('Weekly Reminders', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                              subtitle: const Text('Weekly budget journal summaries', style: TextStyle(fontSize: 11)),
                              value: _weeklyReminders,
                              activeColor: AppColors.primary,
                              onChanged: (val) async {
                                setState(() => _weeklyReminders = val);
                                try {
                                  await NotificationService().setEnabled(val);
                                } catch (e) {
                                  print("Toggle Error: $e");
                                }
                              },
                            ),
                          ],
                        ),
                        const SizedBox(height: 18),
                        _buildSettingsGroup(
                          title: 'SUPPORT',
                          isDark: isDark,
                          children: [
                            ListTile(
                              leading: const Icon(Icons.headset_mic_outlined, color: AppColors.primary),
                              title: const Text('Help & Support', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                              subtitle: const Text('Contact us via WhatsApp or Email', style: TextStyle(fontSize: 11)),
                              trailing: const Icon(Icons.chevron_right, size: 20),
                              onTap: _showSupportOptions,
                            ),
                            const Divider(height: 1, indent: 16, endIndent: 16),
                            ListTile(
                              leading: const Icon(Icons.help_outline_rounded, color: AppColors.primary),
                              title: const Text('App FAQs', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                              subtitle: const Text('Learn how MoneyMapper works', style: TextStyle(fontSize: 11)),
                              trailing: const Icon(Icons.chevron_right, size: 20),
                              onTap: _showFaqOptions,
                            ),
                            const Divider(height: 1, indent: 16, endIndent: 16),
                            ListTile(
                              leading: const Icon(Icons.rate_review_outlined, color: AppColors.primary),
                              title: const Text('Share your Feedback', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                              subtitle: const Text('Help us improve MoneyMapper', style: TextStyle(fontSize: 11)),
                              trailing: const Icon(Icons.chevron_right, size: 20),
                              onTap: () => _launchUrl("https://wa.me/917987469093?text=Hi+MoneyMapper+Team%2C+I+have+some+feedback+to+share%3A"),
                            ),
                            const Divider(height: 1, indent: 16, endIndent: 16),
                            ListTile(
                              leading: const Icon(Icons.star_outline_rounded, color: AppColors.primary),
                              title: const Text('Rate MoneyMapper', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                              subtitle: const Text('Help us grow by rating your experience', style: TextStyle(fontSize: 11)),
                              trailing: const Icon(Icons.chevron_right, size: 20),
                              onTap: _showRatingDialog,
                            ),
                          ],
                        ),
                        const SizedBox(height: 18),
                        _buildSettingsGroup(
                          title: 'MY PROFILE',
                          isDark: isDark,
                          children: [
                            ListTile(
                              leading: const Icon(Icons.badge_outlined, color: AppColors.primary),
                              title: const Text('My Profile', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                              subtitle: const Text('Manage your 52 core identity & pillar data fields', style: TextStyle(fontSize: 11)),
                              trailing: const Icon(Icons.chevron_right, size: 20),
                              onTap: () {
                                Navigator.pushNamed(context, '/master_data');
                              },
                            ),
                            const Divider(height: 1, indent: 16, endIndent: 16),
                            ListTile(
                              leading: const Icon(Icons.qr_code_scanner_rounded, color: AppColors.primary),
                              title: const Text('Web Login', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                              subtitle: const Text('Scan QR code to login on web browser', style: TextStyle(fontSize: 11)),
                              trailing: const Icon(Icons.chevron_right, size: 20),
                              onTap: () {
                                Navigator.pushNamed(context, '/qr_scanner');
                              },
                            ),
                          ],
                        ),
                        const SizedBox(height: 18),
                        _buildSettingsGroup(
                          title: 'ABOUT & COMPLIANCE',
                          isDark: isDark,
                          children: [
                            ListTile(
                              leading: const Icon(Icons.info_outline, color: AppColors.primary),
                              title: const Text('About MoneyMapper', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                              subtitle: const Text('Version 1.0.0 (Production build)', style: TextStyle(fontSize: 11)),
                              onTap: () {
                                Navigator.pushNamed(context, '/privacy');
                              },
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),
                        _buildLogoutButton(),
                        const SizedBox(height: 24),
                        _buildTrustBadges(isDark),
                        const SizedBox(height: 32),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildHeader(bool isDark) {
    return GestureDetector(
      onTap: () => Navigator.pushNamed(context, '/master_data'),
      child: Container(
        padding: EdgeInsets.fromLTRB(16, MediaQuery.of(context).padding.top + 10, 16, 24),
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
          borderRadius: const BorderRadius.only(
            bottomLeft: Radius.circular(28),
            bottomRight: Radius.circular(28),
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
                    child: Padding(
                      padding: EdgeInsets.only(right: 48),
                      child: Text(
                        "Profile",
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          fontSize: 18,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            CircleAvatar(
              radius: 40,
              backgroundColor: Colors.white.withOpacity(0.2),
              child: Text(
                _initials,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '${_greeting()} 🌟',
                  style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w500),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('🔥', style: TextStyle(fontSize: 11)),
                      const SizedBox(width: 4),
                      Text('$_streakCount WEEKS', style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w800)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  _name,
                  style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900),
                ),
                if (_isPro) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.accent,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      'PRO',
                      style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 4),
            Text(
              _email,
              style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSubscriptionCard(bool isDark) {
    return InkWell(
      onTap: _showPlanToggle,
      borderRadius: BorderRadius.circular(24),
      child: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: _isPro
                ? [AppColors.primary, AppColors.accent]
                : [Colors.grey.shade700, Colors.grey.shade500],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: (_isPro ? AppColors.primary : Colors.grey).withOpacity(0.24),
              blurRadius: 16,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    _isPro ? 'WEALTH SELECT (PRO)' : 'BASIC ACCESS (FREE)',
                    style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 0.8),
                  ),
                ),
                Icon(_isPro ? Icons.workspace_premium : Icons.lock_outline, color: Colors.white, size: 24),
              ],
            ),
            const SizedBox(height: 14),
            Text(
              _isPro ? 'MoneyMapper Pro Membership' : 'MoneyMapper Free Membership',
              style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Text(
              _isPro
                  ? 'All 5 Financial Pillars, Screener Intelligence & AI Assistant Unlocked.'
                  : 'Free Tier — Upgrade to PRO to unlock full screeners, AI assistant & deep insights.',
              style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 11),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Text(
                  'Tap to manage membership →',
                  style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingsGroup({
    required String title,
    required bool isDark,
    required List<Widget> children,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 8, bottom: 8),
          child: Text(
            title,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
              letterSpacing: 0.5,
            ),
          ),
        ),
        Material(
          color: isDark ? AppColors.darkCard : AppColors.card,
          clipBehavior: Clip.antiAlias,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: BorderSide(
              color: isDark ? AppColors.darkBorder : AppColors.borderLight,
            ),
          ),
          child: Column(
            children: children,
          ),
        ),
      ],
    );
  }

  Widget _buildDarkModeTile(bool isDark) {
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: AppTheme.themeModeNotifier,
      builder: (context, mode, child) {
        final isDarkTheme = mode == ThemeMode.dark;
        return SwitchListTile(
          secondary: Icon(
            isDarkTheme ? Icons.dark_mode_outlined : Icons.light_mode_outlined,
            color: AppColors.primary,
          ),
          title: const Text('Dark Mode', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          subtitle: const Text('Optimizes interface for low-light conditions', style: TextStyle(fontSize: 11)),
          value: isDarkTheme,
          activeColor: AppColors.primary,
          onChanged: (val) {
            AppTheme.setThemeMode(val ? ThemeMode.dark : ThemeMode.light);
          },
        );
      },
    );
  }

  Widget _buildLogoutButton() {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: _logout,
        icon: const Icon(Icons.logout, color: AppColors.danger, size: 18),
        label: const Text('Logout Session', style: TextStyle(color: AppColors.danger, fontSize: 15)),
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: AppColors.danger, width: 1.5),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
      ),
    );
  }

  Widget _buildTrustBadges(bool isDark) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Icon(Icons.shield_rounded, size: 16, color: AppColors.success),
        const SizedBox(width: 10),
        _buildTrustBadge('SSL SECURED'),
        const SizedBox(width: 8),
        _buildTrustBadge('SEBI CERTIFIED'),
      ],
    );
  }

  Widget _buildTrustBadge(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.success.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: AppColors.success.withOpacity(0.2)),
      ),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.w900,
          color: AppColors.success,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}