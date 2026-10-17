import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../services/premium_service.dart';
import 'dashboard_screen.dart';
import 'recommendations_screen.dart';
import 'profile_screen.dart';
import 'ai_assistant_screen.dart';
import 'weekly_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> with SingleTickerProviderStateMixin {
  int _currentIndex = 0;
  late final PageController _pageController;
  late final AnimationController _mascotAnimController;
  late final Animation<double> _mascotScaleAnimation;
  final PremiumService _premiumService = PremiumService();
  bool _isPro = false;

  // Mascot position state
  Offset? _mascotPosition;

  // Financial pillars that require PRO membership
  static const _premiumPillars = [
    'Insurance Dashboard',
    'Mutual Fund Dashboard',
    'Emergency Readiness',
  ];

  // Financial pillars list for side Drawer
  static const _pillars = [
    {
      'title': 'Insurance Dashboard',
      'route': '/insurance_p',
      'icon': Icons.gpp_good_rounded,
      'color': Color(0xFF08796F),
      'desc': 'Life, health & asset coverage overview',
    },
    {
      'title': 'Income Pillar Matrix',
      'route': '/income_p',
      'icon': Icons.account_balance_wallet_rounded,
      'color': Color(0xFF208858),
      'desc': 'Analyse all your income streams',
    },
    {
      'title': 'Weekly Expense Predictor',
      'route': '/weekly_expense_p',
      'icon': Icons.track_changes_rounded,
      'color': Color(0xFFC9A84C),
      'desc': 'Forecast & control weekly spending',
    },
    {
      'title': 'Mutual Fund Dashboard',
      'route': '/mutual_fund_p',
      'icon': Icons.analytics_rounded,
      'color': Color(0xFF35C4C4),
      'desc': 'Monitor your MF portfolio growth',
    },
    {
      'title': 'Emergency Readiness',
      'route': '/emergency_fund_p',
      'icon': Icons.health_and_safety_rounded,
      'color': Color(0xFFF06464),
      'desc': 'Emergency fund status & readiness',
    },
  ];

  @override
  void initState() {
    super.initState();
    _pageController = PageController(initialPage: _currentIndex);
    _loadPremiumStatus();

    _mascotAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);

    _mascotScaleAnimation = Tween<double>(begin: 1.0, end: 1.12).animate(
      CurvedAnimation(parent: _mascotAnimController, curve: Curves.easeInOut),
    );
  }

  Future<void> _loadPremiumStatus() async {
    await _premiumService.syncSubscriptionStatus();
    final pro = await _premiumService.isPro();
    if (mounted) {
      setState(() => _isPro = pro);
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    _mascotAnimController.dispose();
    super.dispose();
  }

  void _navigateToTab(int index) {
    if (index == _currentIndex) return;
    setState(() => _currentIndex = index);
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOutCubic,
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final List<Widget> screens = [
      DashboardScreen(
        onOpenAi: () => _navigateToTab(2),      // Slide to AI Tab (Index 2)
        onOpenWeekly: () {
          // Push Weekly Tracker onto the stack as a full page
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const WeeklyScreen()),
          );
        },
        onOpenProfile: () => _navigateToTab(3), // Slide to Profile Tab (Index 3)
      ),
      const RecommendationsScreen(),
      const AiAssistantScreen(),
      const ProfileScreen(),
    ];

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: null,
      drawer: _buildDrawer(isDark),
      body: PageView(
        controller: _pageController,
        physics: const NeverScrollableScrollPhysics(),
        children: screens,
      ),
      bottomNavigationBar: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkCard : Colors.white,
              border: Border(
                top: BorderSide(
                  color: isDark ? AppColors.darkBorder : AppColors.borderLight,
                  width: 1,
                ),
              ),
            ),
            child: BottomNavigationBar(
              currentIndex: _currentIndex,
              onTap: _navigateToTab,
              type: BottomNavigationBarType.fixed,
              selectedItemColor: AppColors.primary,
              unselectedItemColor: isDark ? Colors.grey.shade500 : Colors.grey.shade400,
              backgroundColor: isDark ? AppColors.darkCard : Colors.white,
              elevation: 0,
              selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 10),
              unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 10),
              items: [
                _buildNavItem(0, 'Home', isDark),
                _buildNavItem(1, 'Insights', isDark),
                _buildNavItem(2, 'AI Assistant', isDark),
                _buildNavItem(3, 'Profile', isDark),
              ],
            ),
          ),
          // Draggable Animated Mascot for the AI Assistant Tab
          Builder(
            builder: (context) {
              final screenSize = MediaQuery.of(context).size;
              // Default position: 3rd tab area (index 2), pushed up to clear label
              final defaultX = screenSize.width * 0.50 + (screenSize.width * 0.25 / 2) - 30;
              final defaultY = screenSize.height - 110;

              final x = _mascotPosition?.dx ?? defaultX;
              final y = _mascotPosition?.dy ?? defaultY;

              return Positioned(
                left: x,
                top: y,
                child: GestureDetector(
                  onPanUpdate: (details) {
                    setState(() {
                      _mascotPosition = Offset(
                        (x + details.delta.dx).clamp(0.0, screenSize.width - 60),
                        (y + details.delta.dy).clamp(0.0, screenSize.height - 60),
                      );
                    });
                  },
                  onTap: () => _navigateToTab(2),
                  child: ScaleTransition(
                    scale: _mascotScaleAnimation,
                    child: Image.asset(
                      'assets/mascot no background -s.png',
                      height: 75,
                      width: 75,
                      fit: BoxFit.contain,
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  BottomNavigationBarItem _buildNavItem(int index, String label, bool isDark) {
    final selected = _currentIndex == index;
    return BottomNavigationBarItem(
      icon: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        margin: const EdgeInsets.only(bottom: 4, top: 4),
        decoration: BoxDecoration(
          color: (selected && index != 2) ? AppColors.primary.withOpacity(0.12) : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
        ),
        child: index == 2
            ? Image.asset(
                'assets/mascot no background -s.png',
                width: 34,
                height: 34,
                fit: BoxFit.contain,
              )
            : Icon(
                _iconFor(index, selected),
                color: selected ? AppColors.primary : (isDark ? Colors.grey.shade500 : Colors.grey.shade400),
              ),
      ),
      label: label,
    );
  }

  Widget _buildDrawer(bool isDark) {
    return Drawer(
      backgroundColor: isDark ? AppColors.darkBackground : const Color(0xFFF9FAFB),
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'MoneyMapper',
                    style: TextStyle(
                      color: isDark ? Colors.white : AppColors.textPrimaryLight,
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Active Financial Pillars',
                    style: TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
            Divider(color: isDark ? AppColors.darkBorder : AppColors.borderLight, height: 1),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                children: _pillars
                    .map((p) => _buildDrawerNavTile(
                          context,
                          p['title'] as String,
                          p['route'] as String,
                          p['icon'] as IconData,
                          p['color'] as Color,
                          isDark,
                          p['desc'] as String,
                        ))
                    .toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDrawerNavTile(
    BuildContext context,
    String title,
    String routeName,
    IconData icon,
    Color color,
    bool isDark,
    String desc,
  ) {
    final bool isPremiumPillar = _premiumPillars.contains(title);
    final bool isLocked = isPremiumPillar && !_isPro;

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: Material(
        color: isDark ? AppColors.darkCard : Colors.white,
        clipBehavior: Clip.antiAlias,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: BorderSide(
            color: isDark ? AppColors.darkBorder : AppColors.borderLight,
            width: 0.8,
          ),
        ),
        child: ListTile(
          dense: true,
          leading: CircleAvatar(
            backgroundColor: isLocked ? Colors.grey.withOpacity(0.12) : color.withOpacity(0.12),
            radius: 16,
            child: Icon(icon, color: isLocked ? Colors.grey : color, size: 16),
          ),
          title: Opacity(
            opacity: isLocked ? 0.5 : 1.0,
            child: Text(
              title,
              style: TextStyle(
                color: isDark ? Colors.white : AppColors.textPrimaryLight,
                fontSize: 13,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          subtitle: Opacity(
            opacity: isLocked ? 0.4 : 1.0,
            child: Text(
              desc,
              style: const TextStyle(fontSize: 10, color: Colors.grey),
            ),
          ),
          trailing: isLocked
              ? const Icon(Icons.lock_rounded, color: Color(0xFFFFD700), size: 14)
              : const Icon(Icons.arrow_forward_ios_rounded, color: Colors.grey, size: 12),
          onTap: () {
            if (isLocked) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: const Text('Upgrade to PRO to unlock this pillar!'),
                  backgroundColor: AppColors.primary,
                  behavior: SnackBarBehavior.floating,
                  action: SnackBarAction(
                    label: 'UPGRADE',
                    textColor: Colors.white,
                    onPressed: () {
                      Navigator.pop(context);
                      Navigator.pushNamed(context, '/subscription');
                    },
                  ),
                ),
              );
              return;
            }
            Navigator.pop(context); // Close drawer
            Navigator.pushNamed(context, routeName);
          },
        ),
      ),
    );
  }

  IconData _iconFor(int index, bool selected) {
    switch (index) {
      case 0:
        return selected ? Icons.home : Icons.home_outlined;
      case 1:
        return selected ? Icons.menu_book : Icons.menu_book_outlined;
      case 2:
        return selected ? Icons.smart_toy : Icons.smart_toy_outlined;
      case 3:
        return selected ? Icons.person : Icons.person_outline;
      default:
        return Icons.circle;
    }
  }
}