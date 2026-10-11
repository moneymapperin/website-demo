import 'package:flutter/material.dart';
import '../services/xp_service.dart';
import '../theme/app_theme.dart';

class AchievementsScreen extends StatefulWidget {
  const AchievementsScreen({super.key});

  @override
  State<AchievementsScreen> createState() => _AchievementsScreenState();
}

class _AchievementsScreenState extends State<AchievementsScreen> {
  final XpService _xpService = XpService();
  List<String> _unlockedBadgeIds = [];
  bool _loading = true;

  final List<Map<String, String>> _allBadges = [
    {
      'id': 'debt_free',
      'emoji': '🎉',
      'title': 'Debt Free Milestone',
      'desc': 'Reported zero active loans in your financial profile.'
    },
    {
      'id': 'emergency_complete',
      'emoji': '🛡️',
      'title': 'Emergency Fund Complete',
      'desc': 'Built a secure 3-month liquidity buffer.'
    },
    {
      'id': 'investment_starter',
      'emoji': '🌱',
      'title': 'Investment Starter',
      'desc': 'Started your wealth growth journey with mutual funds.'
    },
    {
      'id': 'protection_pro',
      'emoji': '👨‍👩‍👧',
      'title': 'Protection Pro',
      'desc': 'Verified adequate life and health insurance coverage.'
    },
    {
      'id': 'comeback_kid',
      'emoji': '⚡',
      'title': 'Comeback Kid',
      'desc': 'Resumed your financial discipline streak after a break.'
    },
  ];

  @override
  void initState() {
    super.initState();
    _loadBadges();
  }

  Future<void> _loadBadges() async {
    final unlocked = await _xpService.getUnlockedBadges();
    if (mounted) {
      setState(() {
        _unlockedBadgeIds = unlocked;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: AppBar(
        title: const Text('Badges & Achievements',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        centerTitle: true,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _allBadges.length,
              itemBuilder: (context, index) {
                final badge = _allBadges[index];
                final isUnlocked = _unlockedBadgeIds.contains(badge['id']);

                return Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkCard : Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: isUnlocked
                        ? AppColors.primary.withOpacity(0.5)
                        : (isDark ? AppColors.darkBorder : AppColors.borderLight),
                      width: 1.5,
                    ),
                    boxShadow: isUnlocked ? [
                      BoxShadow(
                        color: AppColors.primary.withOpacity(0.1),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      )
                    ] : null,
                  ),
                  child: Opacity(
                    opacity: isUnlocked ? 1.0 : 0.5,
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Row(
                        children: [
                          Container(
                            width: 64,
                            height: 64,
                            decoration: BoxDecoration(
                              color: isUnlocked
                                ? AppColors.primary.withOpacity(0.1)
                                : Colors.grey.withOpacity(0.1),
                              shape: BoxShape.circle,
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              badge['emoji']!,
                              style: const TextStyle(fontSize: 32),
                            ),
                          ),
                          const SizedBox(width: 20),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        badge['title']!,
                                        style: TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w900,
                                          color: isDark ? Colors.white : AppColors.textPrimaryLight,
                                        ),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    if (isUnlocked) ...[
                                      const SizedBox(width: 6),
                                      const Icon(Icons.check_circle, color: AppColors.success, size: 16),
                                    ],
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  badge['desc']!,
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  isUnlocked ? 'UNLOCKED • +100 XP' : 'LOCKED',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1,
                                    color: isUnlocked ? AppColors.success : Colors.grey,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
    );
  }
}
