import 'dart:math';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class AdvisoryService {
  static final Map<String, List<String>> _incomeAdvisories = {
    '1-10': [
      "Stop all non-essential spending immediately - no dining out, subscriptions, or shopping this month.",
      "List every expense from the last 30 days to see exactly where money is leaking.",
      "Cancel every subscription you haven't used in the last 30 days, starting today.",
      "Separate 'needs' (rent, food, EMI) from 'wants' and cut every 'want' this month.",
      "Call your lenders today to discuss restructuring any EMI you're struggling to pay.",
      "Avoid taking any new loan or credit card to cover daily expenses - it deepens the crisis.",
      "Move to a stricter, cash-only system for groceries and daily spends for the next 30 days.",
      "Negotiate rent or move to lower-cost housing if rent exceeds 40% of your income.",
      "Pause all discretionary shopping (clothes, gadgets, entertainment) until expenses stabilize.",
      "Talk to family about temporarily sharing costs (food, rent) while you stabilize.",
      "Use public transport instead of cabs/fuel wherever possible to cut daily costs immediately.",
      "Switch to home-cooked meals entirely - eating out is one of the fastest expense leaks.",
      "Check for any auto-debit you've forgotten about and cancel it within the next 24 hours.",
      "Avoid EMI-based purchases of any kind (gadgets, appliances) until your situation stabilizes.",
      "Ask utility providers about installment or hardship plans if bills are piling up.",
      "Set a hard daily spending limit and track every rupee against it without exception.",
      "Delay any planned travel or big-ticket purchase until your expenses are under control.",
      "Consolidate multiple small debts into one manageable plan to stop juggling payments.",
      "Ask for salary advance from your employer only as an absolute last resort, not a routine.",
      "Create a bare-minimum survival budget covering only rent, food, and essential bills."
    ],
    '11-20': [
      "Build your first monthly budget covering rent, food, bills, EMI, and savings as fixed categories.",
      "Track every expense for 30 days using a simple app or notebook - awareness is the first fix.",
      "Identify your top 3 spending leaks (subscriptions, food delivery, impulse buys) and cut them by half.",
      "Set a weekly cash/UPI limit for discretionary spending and stick to it strictly.",
      "Review all EMIs and loans - list interest rates and prioritize paying off the highest-rate one first.",
      "Cancel at least 2 subscriptions you're not using regularly, starting this week.",
      "Move fixed bill payments to auto-debit to avoid late fees, but track them weekly.",
      "Set a rule: no purchase above ₹2,000 without a 24-hour cooling-off period.",
      "Reduce food delivery orders to twice a week and cook the rest at home.",
      "Compare your rent/EMI to the 40% income rule and plan to bring it within limits.",
      "Build a 'wants' jar - a fixed monthly amount for discretionary spends, nothing beyond it.",
      "Review your mobile, OTT, and internet plans for cheaper alternatives with the same usage.",
      "Set a goal to reduce total monthly expenses by 10% over the next 60 days.",
      "Avoid using credit cards for daily expenses until you can pay the full bill each month.",
      "List all due dates for bills/EMIs in one place to avoid late payment penalties.",
      "Set a small emergency buffer goal (1 week of expenses) before any discretionary spending resumes.",
      "Review your last 3 months' bank statement to spot recurring, avoidable expenses.",
      "Switch one high-cost habit (branded groceries, daily cabs) to a lower-cost alternative this month.",
      "Set a rule to pay EMIs and bills on the 1st, before any discretionary spending happens.",
      "Have one no-spend day per week as a simple, repeatable discipline builder."
    ],
    '21-30': [
      "Formalize your budget into fixed categories (needs, wants, savings, debt) with monthly limits for each.",
      "Set a target to bring total EMI + rent under 40% of your monthly take-home income.",
      "Track discretionary spending weekly and set a hard cap that reduces by 5% each month.",
      "Review all subscriptions every quarter and cancel anything with under 2 uses per month.",
      "Set up separate accounts for fixed expenses and discretionary spending to avoid overlap.",
      "Build a 1-month expense buffer in a separate account before increasing any discretionary spend.",
      "Negotiate one recurring bill (insurance, internet, phone plan) for a better rate this month.",
      "Set a rule: any purchase above ₹5,000 needs a 48-hour wait and written justification.",
      "Review your grocery and food delivery spend - aim to cut it by 15% this quarter.",
      "Consolidate any high-interest debt into a lower-interest option if available to you.",
      "Set a target to save the difference every time you find a cheaper alternative to a fixed cost.",
      "Track your expense-to-income ratio monthly and aim to lower it by 2-3% each quarter.",
      "Avoid lifestyle upgrades (new gadgets, upgraded plans) until your expense ratio stabilizes.",
      "Set a clear EMI payoff order - highest interest rate first, while paying minimums on others.",
      "Review annual expenses (insurance premiums, subscriptions) for consolidation and better rates.",
      "Build the habit of comparing prices before any purchase above ₹1,000.",
      "Set a monthly 'review day' to check spending against budget and course-correct early.",
      "Reduce impulse spending by unsubscribing from shopping app notifications and promotional emails.",
      "Set a target to keep discretionary spending under 20% of your take-home income.",
      "Track and reduce any 'convenience' spending (delivery fees, express charges) that adds up unnoticed."
    ],
    'high': [
      "Keep maintaining your high-discipline income structure.",
      "Continue diversifying your income streams across multiple assets.",
      "Focus on automating at least 15% of all new inflows into passive investments.",
      "Review your tax optimization quarterly to ensure maximum take-home value."
    ]
  };

  static final Map<String, List<String>> _expenseAdvisories = {
    '1-10': [
      "Stop all non-essential spending immediately - no dining out, subscriptions, or shopping this month.",
      "List every expense from the last 30 days to see exactly where money is leaking.",
      "Cancel every subscription you haven't used in the last 30 days, starting today.",
      "Separate 'needs' (rent, food, EMI) from 'wants' and cut every 'want' this month.",
      "Call your lenders today to discuss restructuring any EMI you're struggling to pay.",
      "Avoid taking any new loan or credit card to cover daily expenses - it deepens the crisis.",
      "Move to a stricter, cash-only system for groceries and daily spends for the next 30 days.",
      "Negotiate rent or move to lower-cost housing if rent exceeds 40% of your income.",
      "Pause all discretionary shopping (clothes, gadgets, entertainment) until expenses stabilize.",
      "Talk to family about temporarily sharing costs (food, rent) while you stabilize.",
      "Use public transport instead of cabs/fuel wherever possible to cut daily costs immediately.",
      "Switch to home-cooked meals entirely - eating out is one of the fastest expense leaks.",
      "Check for any auto-debit you've forgotten about and cancel it within the next 24 hours.",
      "Avoid EMI-based purchases of any kind (gadgets, appliances) until your situation stabilizes.",
      "Ask utility providers about installment or hardship plans if bills are piling up.",
      "Set a hard daily spending limit and track every rupee against it without exception.",
      "Delay any planned travel or big-ticket purchase until your expenses are under control.",
      "Consolidate multiple small debts into one manageable plan to stop juggling payments.",
      "Ask for salary advance from your employer only as an absolute last resort, not a routine.",
      "Create a bare-minimum survival budget covering only rent, food, and essential bills."
    ],
    '11-20': [
      "Build your first monthly budget covering rent, food, bills, EMI, and savings as fixed categories.",
      "Track every expense for 30 days using a simple app or notebook - awareness is the first fix.",
      "Identify your top 3 spending leaks (subscriptions, food delivery, impulse buys) and cut them by half.",
      "Set a weekly cash/UPI limit for discretionary spending and stick to it strictly.",
      "Review all EMIs and loans - list interest rates and prioritize paying off the highest-rate one first.",
      "Cancel at least 2 subscriptions you're not using regularly, starting this week.",
      "Move fixed bill payments to auto-debit to avoid late fees, but track them weekly.",
      "Set a rule: no purchase above ₹2,000 without a 24-hour cooling-off period.",
      "Reduce food delivery orders to twice a week and cook the rest at home.",
      "Compare your rent/EMI to the 40% income rule and plan to bring it within limits.",
      "Build a 'wants' jar - a fixed monthly amount for discretionary spends, nothing beyond it.",
      "Review your mobile, OTT, and internet plans for cheaper alternatives with the same usage.",
      "Set a goal to reduce total monthly expenses by 10% over the next 60 days.",
      "Avoid using credit cards for daily expenses until you can pay the full bill each month.",
      "List all due dates for bills/EMIs in one place to avoid late payment penalties.",
      "Set a small emergency buffer goal (1 week of expenses) before any discretionary spending resumes.",
      "Review your last 3 months' bank statement to spot recurring, avoidable expenses.",
      "Switch one high-cost habit (branded groceries, daily cabs) to a lower-cost alternative this month.",
      "Set a rule to pay EMIs and bills on the 1st, before any discretionary spending happens.",
      "Have one no-spend day per week as a simple, repeatable discipline builder."
    ],
    '21-30': [
      "Formalize your budget into fixed categories (needs, wants, savings, debt) with monthly limits for each.",
      "Set a target to bring total EMI + rent under 40% of your monthly take-home income.",
      "Track discretionary spending weekly and set a hard cap that reduces by 5% each month.",
      "Review all subscriptions every quarter and cancel anything with under 2 uses per month.",
      "Set up separate accounts for fixed expenses and discretionary spending to avoid overlap.",
      "Build a 1-month expense buffer in a separate account before increasing any discretionary spend.",
      "Negotiate one recurring bill (insurance, internet, phone plan) for a better rate this month.",
      "Set a rule: any purchase above ₹5,000 needs a 48-hour wait and written justification.",
      "Review your grocery and food delivery spend - aim to cut it by 15% this quarter.",
      "Consolidate any high-interest debt into a lower-interest option if available to you.",
      "Set a target to save the difference every time you find a cheaper alternative to a fixed cost.",
      "Track your expense-to-income ratio monthly and aim to lower it by 2-3% each quarter.",
      "Avoid lifestyle upgrades (new gadgets, upgraded plans) until your expense ratio stabilizes.",
      "Set a clear EMI payoff order - highest interest rate first, while paying minimums on others.",
      "Review annual expenses (insurance premiums, subscriptions) for consolidation and better rates.",
      "Build the habit of comparing prices before any purchase above ₹1,000.",
      "Set a monthly 'review day' to check spending against budget and course-correct early.",
      "Reduce impulse spending by unsubscribing from shopping app notifications and promotional emails.",
      "Set a target to keep discretionary spending under 20% of your take-home income.",
      "Track and reduce any 'convenience' spending (delivery fees, express charges) that adds up unnoticed."
    ],
    'high': [
      "Your expense control is excellent. Automate remaining payments.",
      "Focus on reducing 'lifestyle creep' by capping annual expense growth.",
      "Review your Household Efficiency ratio monthly to spot minor optimizations.",
      "Set a goal to redirect 100% of any expense-saving into appreciating assets."
    ]
  };

  static String getAdvisoryText(String pillarId, double score) {
    String rangeKey = 'high';
    if (score <= 10) rangeKey = '1-10';
    else if (score <= 20) rangeKey = '11-20';
    else if (score <= 30) rangeKey = '21-30';

    final List<String> advisories = (pillarId == 'income')
        ? (_incomeAdvisories[rangeKey] ?? _incomeAdvisories['high']!)
        : (_expenseAdvisories[rangeKey] ?? _expenseAdvisories['high']!);

    return advisories[Random().nextInt(advisories.length)];
  }

  static void showAdvisory(BuildContext context, String pillarId, double score) {
    String rangeKey = 'high';
    if (score <= 10) rangeKey = '1-10';
    else if (score <= 20) rangeKey = '11-20';
    else if (score <= 30) rangeKey = '21-30';

    final List<String> advisories = (pillarId == 'income')
        ? (_incomeAdvisories[rangeKey] ?? _incomeAdvisories['high']!)
        : (_expenseAdvisories[rangeKey] ?? _expenseAdvisories['high']!);

    final randomAdvice = advisories[Random().nextInt(advisories.length)];

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Row(
          children: [
            const Icon(Icons.auto_awesome, color: AppColors.primary),
            const SizedBox(width: 10),
            Text(pillarId == 'income' ? 'Income Advisory' : 'Expense Advisory',
              style: const TextStyle(fontWeight: FontWeight.w900)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              "Based on your current score of ${score.round()}, here is a recommended action:",
              style: const TextStyle(fontSize: 13, color: Colors.grey),
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.05),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.primary.withOpacity(0.1)),
              ),
              child: Text(
                randomAdvice,
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, height: 1.5),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Got it!', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
