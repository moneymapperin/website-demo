import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class LiveFinancialCalculator extends StatelessWidget {
  final double monthlyIncome;
  final double monthlyExpenses;
  final double availableBalance;
  final double emergencyCurrent;
  final double emergencyTarget;
  final double sipRecommendation;
  final Map<String, Map<String, dynamic>> wealthAllocations;
  final bool isSipLocked;
  final bool showSipTrialBadge;

  const LiveFinancialCalculator({
    super.key,
    this.monthlyIncome = 70000,
    this.monthlyExpenses = 45000,
    double? availableBalance,
    this.emergencyCurrent = 310000,
    this.emergencyTarget = 420000,
    this.sipRecommendation = 10000,
    this.wealthAllocations = const {
      'Stock': {'amount': 42000.0, 'percent': '2%'},
      'Mutual Fund': {'amount': 30000.0, 'percent': '1%'},
      'Gold': {'amount': 21000.0, 'percent': '1%'},
      'Real Estate': {'amount': 2500000.0, 'percent': '96%'},
    },
    this.isSipLocked = false,
    this.showSipTrialBadge = false,
  }) : availableBalance = availableBalance ?? (monthlyIncome - monthlyExpenses);

  String _formatCurrency(double amount) {
    return "₹${amount.round().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}";
  }

  String _formatCompactCurrency(double amount) {
    if (amount >= 10000000) {
      double cr = amount / 10000000;
      return "₹${cr % 1 == 0 ? cr.toInt() : cr.toStringAsFixed(1)}Cr";
    } else if (amount >= 100000) {
      double lakh = amount / 100000;
      return "₹${lakh % 1 == 0 ? lakh.toInt() : lakh.toStringAsFixed(1)}L";
    } else {
      return "₹${amount.round().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}";
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final double efProgress = emergencyTarget > 0 ? (emergencyCurrent / emergencyTarget).clamp(0.0, 1.0) : 0.0;
    final int efPercentage = (efProgress * 100).round();

    final stockData = wealthAllocations['Stock'] ?? {'amount': 42000.0, 'percent': '2%'};
    final mfData = wealthAllocations['Mutual Fund'] ?? {'amount': 30000.0, 'percent': '1%'};
    final goldData = wealthAllocations['Gold'] ?? {'amount': 21000.0, 'percent': '1%'};
    final reData = wealthAllocations['Real Estate'] ?? {'amount': 2500000.0, 'percent': '96%'};

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0D0E15) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? const Color(0xFF1E202E) : AppColors.borderLight,
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.4 : 0.08),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ----------------- HEADER ROW -----------------
          Row(
            children: [
              Expanded(
                child: FittedBox(
                  alignment: Alignment.centerLeft,
                  fit: BoxFit.scaleDown,
                  child: Text(
                    'LIVE FINANCIAL CALCULATOR',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.8,
                      color: isDark ? Colors.white : AppColors.textPrimaryLight,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Live & Calculated ',
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF10B981),
                      ),
                    ),
                    Icon(Icons.circle, size: 6, color: Color(0xFF10B981)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // ----------------- EQUATION ROW (INCOME - EXPENSES = AVAILABLE) -----------------
          Row(
            children: [
              // INCOME
              Expanded(
                child: _equationCard(
                  title: 'INCOME',
                  amount: _formatCurrency(monthlyIncome),
                  icon: Icons.savings_outlined,
                  accentColor: const Color(0xFF10B981),
                  isDark: isDark,
                ),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 2),
                child: Text(
                  '-',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white54),
                ),
              ),
              // EXPENSES
              Expanded(
                child: _equationCard(
                  title: 'EXPENSES',
                  amount: _formatCurrency(monthlyExpenses),
                  icon: Icons.account_balance_wallet_outlined,
                  accentColor: const Color(0xFFEF4444),
                  isDark: isDark,
                ),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 2),
                child: Text(
                  '=',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white54),
                ),
              ),
              // AVAILABLE
              Expanded(
                child: _equationCard(
                  title: 'AVAILABLE',
                  amount: _formatCurrency(availableBalance),
                  icon: Icons.account_balance_outlined,
                  accentColor: const Color(0xFF3B82F6),
                  isDark: isDark,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // ----------------- EMERGENCY FUND CARD -----------------
          Container(
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF161826) : AppColors.background,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark ? const Color(0xFF23283B) : AppColors.borderLight,
              ),
            ),
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.shield_outlined, size: 16, color: Color(0xFFA855F7)),
                    SizedBox(width: 6),
                    Text(
                      'EMERGENCY FUND',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFFA855F7),
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(
                      _formatCurrency(emergencyCurrent),
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: isDark ? Colors.white : AppColors.textPrimaryLight,
                      ),
                    ),
                    Text(
                      ' / ${_formatCurrency(emergencyTarget)}',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: isDark ? Colors.white54 : AppColors.textSecondaryLight,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: LinearProgressIndicator(
                          value: efProgress,
                          minHeight: 6,
                          backgroundColor: isDark ? const Color(0xFF272F40) : Colors.grey.shade300,
                          valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFA855F7)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      '$efPercentage%',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFFA855F7),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Recommended: 6 Months Expenses',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                    color: isDark ? Colors.white38 : Colors.black45,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // ----------------- BOTTOM ROW (SIP RECOMMENDATION & WEALTH ALLOCATION) -----------------
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // LEFT: SIP RECOMMENDATION
                Expanded(
                  flex: 1,
                  child: Stack(
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF161826) : AppColors.background,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isDark ? const Color(0xFF23283B) : AppColors.borderLight,
                          ),
                        ),
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Icon(Icons.show_chart_rounded, size: 14, color: Color(0xFFF59E0B)),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const FittedBox(
                                        fit: BoxFit.scaleDown,
                                        alignment: Alignment.centerLeft,
                                        child: Text(
                                          'SIP',
                                          style: TextStyle(
                                            fontSize: 9,
                                            fontWeight: FontWeight.w900,
                                            color: Color(0xFFF59E0B),
                                            letterSpacing: 0.3,
                                          ),
                                        ),
                                      ),
                                      FittedBox(
                                        fit: BoxFit.scaleDown,
                                        alignment: Alignment.centerLeft,
                                        child: Text(
                                          'RECOMMENDATION',
                                          style: TextStyle(
                                            fontSize: 7.5,
                                            fontWeight: FontWeight.w900,
                                            color: const Color(0xFFF59E0B),
                                            letterSpacing: 0.1,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                if (showSipTrialBadge) ...[
                                  const SizedBox(width: 2),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF59E0B).withOpacity(0.15),
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.4), width: 0.6),
                                    ),
                                    child: const Text(
                                      'TRIAL: 1D',
                                      style: TextStyle(
                                        fontSize: 7,
                                        fontWeight: FontWeight.w900,
                                        color: Color(0xFFF59E0B),
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                            const SizedBox(height: 8),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                FittedBox(
                                  fit: BoxFit.scaleDown,
                                  child: Text(
                                    _formatCurrency(sipRecommendation),
                                    style: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w900,
                                      color: isDark ? Colors.white : AppColors.textPrimaryLight,
                                    ),
                                  ),
                                ),
                                Text(
                                  '/ month',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w600,
                                    color: isDark ? Colors.white54 : AppColors.textSecondaryLight,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      if (isSipLocked)
                        Positioned.fill(
                          child: Container(
                            decoration: BoxDecoration(
                              color: Colors.black.withOpacity(0.85),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            padding: const EdgeInsets.all(6),
                            child: const Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.lock_rounded, size: 16, color: Color(0xFFF59E0B)),
                                SizedBox(height: 4),
                                Text(
                                  'PRO FEATURE',
                                  style: TextStyle(
                                    fontSize: 8,
                                    fontWeight: FontWeight.w900,
                                    color: Color(0xFFF59E0B),
                                    letterSpacing: 0.5,
                                  ),
                                ),
                                SizedBox(height: 2),
                                Text(
                                  'Unlock SIP Advisor',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontSize: 7.5,
                                    color: Colors.white70,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),

                // RIGHT: WEALTH ALLOCATION (Allocation Breakdown)
                Expanded(
                  flex: 1,
                  child: Container(
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF161826) : AppColors.background,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isDark ? const Color(0xFF23283B) : AppColors.borderLight,
                      ),
                    ),
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'WEALTH ALLOCATION',
                              style: TextStyle(
                                fontSize: 8.5,
                                fontWeight: FontWeight.w900,
                                color: isDark ? Colors.white70 : AppColors.textSecondaryLight,
                                letterSpacing: 0.2,
                              ),
                            ),
                            Text(
                              '(Allocation Breakdown)',
                              style: TextStyle(
                                fontSize: 8,
                                fontWeight: FontWeight.w600,
                                color: isDark ? Colors.white38 : Colors.black45,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),

                        // 2x2 Grid: Stock, Mutual Fund, Gold, Real Estate
                        Column(
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: _allocItem(
                                    title: 'Stock',
                                    amount: _formatCompactCurrency(stockData['amount'] as double),
                                    percent: stockData['percent'].toString(),
                                    badgeColor: const Color(0xFF10B981),
                                    isDark: isDark,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: _allocItem(
                                    title: 'Mutual Fund',
                                    amount: _formatCompactCurrency(mfData['amount'] as double),
                                    percent: mfData['percent'].toString(),
                                    badgeColor: const Color(0xFFF59E0B),
                                    isDark: isDark,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Expanded(
                                  child: _allocItem(
                                    title: 'Gold',
                                    amount: _formatCompactCurrency(goldData['amount'] as double),
                                    percent: goldData['percent'].toString(),
                                    badgeColor: const Color(0xFFEF4444),
                                    isDark: isDark,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: _allocItem(
                                    title: 'Real Estate',
                                    amount: _formatCompactCurrency(reData['amount'] as double),
                                    percent: reData['percent'].toString(),
                                    badgeColor: const Color(0xFF3B82F6),
                                    isDark: isDark,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _equationCard({
    required String title,
    required String amount,
    required IconData icon,
    required Color accentColor,
    required bool isDark,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF161826) : AppColors.background,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: accentColor.withOpacity(0.3),
          width: 1,
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 10, color: accentColor),
              const SizedBox(width: 2),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 7.5,
                    fontWeight: FontWeight.w900,
                    color: accentColor,
                    letterSpacing: 0.2,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(
              amount,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w900,
                color: isDark ? Colors.white : AppColors.textPrimaryLight,
              ),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            '/ month',
            style: TextStyle(
              fontSize: 7.5,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.white38 : Colors.black45,
            ),
          ),
        ],
      ),
    );
  }

  Widget _allocItem({
    required String title,
    required String amount,
    required String percent,
    required Color badgeColor,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 5),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F111D) : Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isDark ? const Color(0xFF1E2235) : AppColors.borderLight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text(
                    amount,
                    style: TextStyle(
                      fontSize: 9.5,
                      fontWeight: FontWeight.w900,
                      color: isDark ? Colors.white : AppColors.textPrimaryLight,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 2),
              Text(
                percent,
                style: TextStyle(
                  fontSize: 7.5,
                  fontWeight: FontWeight.w900,
                  color: badgeColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 2),
          Text(
            title,
            style: TextStyle(
              fontSize: 7,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.white54 : AppColors.textSecondaryLight,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
