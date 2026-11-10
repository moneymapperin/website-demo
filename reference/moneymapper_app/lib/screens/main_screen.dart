import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../services/premium_service.dart';
import 'dashboard_screen.dart';
import 'recommendations_screen.dart';
import 'profile_screen.dart';
import 'ai_assistant_screen.dart';
import 'weekly_screen.dart';
import '../widgets/announcement_popup.dart';
import '../widgets/feature_flag_guard.dart';
import '../widgets/platform_glass.dart';

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

    // Check for announcements globally when the dashboard opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        AnnouncementPopup.checkAndShow(context);
      }
    });

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
            MaterialPageRoute(builder: (_) => FeatureFlagGuard(featureKey: 'weekly_expense', child: WeeklyScreen())),
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
      drawer: null,
      drawerEnableOpenDragGesture: false,
      extendBody: true, // Required for the glass nav bar effect to float over content
      body: PageView(
        controller: _pageController,
        physics: const NeverScrollableScrollPhysics(),
        children: screens,
      ),
      bottomNavigationBar: LayoutBuilder(
        builder: (context, constraints) {
          final bool isTablet = MediaQuery.of(context).size.width >= 600;
          
          Widget navBar = ClipRect(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
              child: Container(
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkCard.withOpacity(0.65) : Colors.white.withOpacity(0.8),
                  borderRadius: isTablet ? BorderRadius.circular(30) : BorderRadius.zero,
                  border: Border.all(
                    color: isDark ? Colors.white.withOpacity(0.1) : Colors.black.withOpacity(0.05),
                    width: 1,
                  ),
                  boxShadow: isTablet ? [
                    BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 20, offset: const Offset(0, 10))
                  ] : null,
                ),
                child: BottomNavigationBar(
                  currentIndex: _currentIndex,
                  onTap: _navigateToTab,
                  type: BottomNavigationBarType.fixed,
                  selectedItemColor: AppColors.primary,
                  unselectedItemColor: isDark ? Colors.grey.shade500 : Colors.grey.shade400,
                  backgroundColor: Colors.transparent,
                  elevation: 0,
                  iconSize: 22,
                  selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 9.5),
                  unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 9.5),
                  items: [
                    _buildNavItem(0, 'Home', isDark),
                    _buildNavItem(1, 'Insights', isDark),
                    _buildNavItem(2, 'AI Assistant', isDark),
                    _buildNavItem(3, 'Profile', isDark),
                  ],
                ),
              ),
            ),
          );

          return Stack(
            clipBehavior: Clip.none,
            alignment: Alignment.bottomCenter,
            children: [
              isTablet 
                  ? SafeArea(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 100, vertical: 24),
                        child: navBar,
                      ),
                    ) 
                  : navBar,
              
              // Draggable Animated Mascot for the AI Assistant Tab
              Builder(
                builder: (context) {
                  final screenSize = MediaQuery.of(context).size;
                  
                  // Compute dynamic position handling tablet shifts
                  final double tabletXOffset = isTablet ? 100 : 0;
                  final double navWidth = isTablet ? screenSize.width - 200 : screenSize.width;
                  
                  // If it's a tablet, the mascot should float directly over the island navbar
                  // If it's a phone, it sits right above the bottom nav bar
                  final defaultX = tabletXOffset + (navWidth * 0.50) + (navWidth * 0.25 / 2) - 30;
                  final defaultY = screenSize.height - (isTablet ? 130 : 100);

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
                        child: ClipRect(
                          child: Align(
                            alignment: Alignment.topCenter,
                            heightFactor: 0.9,
                            child: Image.asset(
                              'assets/mascot no background -s.png',
                              height: 75,
                              width: 75,
                              fit: BoxFit.contain,
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildNavRailIcon(int index, IconData solid, IconData outline, bool isDark, {bool isMascot = false}) {
    final selected = _currentIndex == index;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: (selected && !isMascot) ? AppColors.primary.withOpacity(0.12) : Colors.transparent,
        borderRadius: BorderRadius.circular(16),
      ),
      child: isMascot
          ? ClipRect(
              child: Align(
                alignment: Alignment.topCenter,
                heightFactor: 0.9, // Crops out the bottom empty space
                child: Image.asset(
                  'assets/mascot no background -s.png',
                  width: 34,
                  height: 34,
                  fit: BoxFit.contain,
                ),
              ),
            )
          : Icon(
              selected ? solid : outline,
              color: selected ? AppColors.primary : (isDark ? Colors.grey.shade500 : Colors.grey.shade400),
              size: 26,
            ),
    );
  }

  BottomNavigationBarItem _buildNavItem(int index, String label, bool isDark) {
    final selected = _currentIndex == index;
    return BottomNavigationBarItem(
      icon: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4), // Tighter padding
        margin: const EdgeInsets.only(bottom: 2, top: 0),
        decoration: BoxDecoration(
          color: (selected && index != 2) ? AppColors.primary.withOpacity(0.12) : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
        ),
        child: index == 2
            ? ClipRect(
                child: Align(
                  alignment: Alignment.topCenter,
                  heightFactor: 0.9, // Crops out the bottom empty space
                  child: Image.asset(
                    'assets/mascot no background -s.png',
                    width: 28,
                    height: 28,
                    fit: BoxFit.contain,
                  ),
                ),
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