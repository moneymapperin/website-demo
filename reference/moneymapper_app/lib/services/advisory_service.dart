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

  // ---------------------------------------------------------------------------
  // 52 DYNAMIC GLOBAL FITNESS SCORE ADVISORIES (4 SCORE BANDS)
  // ---------------------------------------------------------------------------

  static final List<String> _criticalAdvisories = [
    "High financial stress detected. Pause all discretionary spending and focus strictly on essential rent, groceries, and EMIs.",
    "Your liquid savings are critically low. Cut non-essential subscriptions and build a 1-month emergency buffer immediately.",
    "High debt-to-income ratio flagged. Avoid taking new credit cards or loans until your primary cashflow stabilizes.",
    "Your spending exceeds safe limits. Separate needs from wants and track every daily outflow without exception.",
    "Critical liquidity shortfall! Avoid high-risk investments and prioritize liquid savings first.",
    "Review all active EMIs today and prioritize clearing the highest-interest loans first.",
    "Your fixed expenses absorb too much income. Negotiate lower costs or pause non-vital commitments.",
    "No health cover detected. A single medical emergency can wipe out savings—get basic health insurance first.",
    "High lifestyle spending risk. Stick to a strict cash-only or pre-budgeted UPI allowance for the next 30 days.",
    "Your financial baseline needs urgent stabilization. Focus on clearing high-interest debt and building emergency cash.",
    "Pause new SIPs temporarily if EMIs or basic bills are struggling to be paid on time.",
    "Cancel all unused OTT, gym, or digital subscriptions today to plug immediate spending leaks.",
    "Create a bare-minimum survival budget covering only essential food, shelter, and mandatory bills.",
    "Avoid EMI-based purchases for gadgets or lifestyle items until your fitness score crosses 50.",
    "Set a hard daily spending limit and log every expense to regain complete cashflow control.",
  ];

  static final List<String> _averageAdvisories = [
    "You're on track! Focus on building a 3 to 6-month liquid emergency cushion before scaling investments.",
    "Apply the 50/30/20 budget rule: 50% for Needs, 30% for Wants, and 20% dedicated to systematic savings.",
    "Your fixed costs are moderate. Cap discretionary spending to boost your monthly investment surplus.",
    "Good progress! Ensure your term life insurance covers at least 10x your annual take-home income.",
    "Reduce high-interest credit card debt or personal loans to free up monthly cashflow for SIPs.",
    "Automate your emergency fund savings on the 1st of every month before discretionary spending occurs.",
    "Review your health insurance coverage—ensure a minimum ₹5 Lakhs individual or floater policy is active.",
    "Your cashflow is stable but vulnerable. Avoid new long-term loan commitments for the next 6 months.",
    "Increase your monthly SIPs by 5% every time you get a salary increment or bonus.",
    "Track weekly variable expenses to prevent weekend spending from eating into your monthly savings target.",
    "Keep your debt EMI payments under 30% of your total monthly take-home income.",
    "Diversify short-term savings into Liquid Mutual Funds or High-Yield Savings Accounts for easy access.",
    "Re-evaluate impulse buys: enforce a 48-hour cooling period before any non-essential purchase above ₹3,000.",
    "Consolidate small multiple debt payments into one low-cost structured payback plan.",
    "Maintain 3 months of fixed expenses in a liquid fund so unexpected hiccups don't disrupt your investments.",
  ];

  static final List<String> _goodAdvisories = [
    "Strong financial discipline! Focus on optimizing asset allocation across Equity, Debt, and Gold.",
    "Your emergency cushion is healthy. Step up equity SIPs to compound wealth over 5+ year horizons.",
    "Ensure 100% of your family health and term life insurance gaps are fully covered with adequate sum assured.",
    "Great job! Increase your annual SIP step-up rate by 10% to accelerate your long-term goal timeline.",
    "Maintain a balanced portfolio: 60% Equity for growth, 30% Debt/Liquid for safety, and 10% Gold as a hedge.",
    "Your expense-to-income ratio is healthy. Channel extra cashflow into low-cost Index or Flexi-Cap funds.",
    "Review portfolio performance quarterly and rebalance if equity exposure drifts by more than 10%.",
    "Maximize Section 80C and tax-saving avenues using ELSS funds with a 3-year compounding perspective.",
    "Your cashflow is well-managed. Focus on creating passive income streams alongside your primary salary.",
    "Keep term insurance pure: avoid mixing investment with insurance (avoid traditional LIC endowment policies).",
    "Build dedicated goal-based buckets for short-term goals (car, travel) without touching core retirement SIPs.",
    "Consolidate scattered mutual fund folios into a clean, trackable portfolio of 4-5 high-scoring funds.",
  ];

  static final List<String> _excellentAdvisories = [
    "Stellar financial health! Your 5-pillar ecosystem is operating at peak compounding efficiency.",
    "Optimal risk-reward balance achieved. Focus on tax-efficient harvest strategies and asset preservation.",
    "Your emergency cushion and insurance coverage are fully fortified. Expand passive income avenues.",
    "Exceptional expense control and high investment surplus! Explore strategic international or factor investing.",
    "Maintain annual portfolio rebalancing to lock in gains and protect against sudden market downturns.",
    "Your financial freedom runway is expanding rapidly. Focus on long-term capital preservation & estate planning.",
    "Automate 100% of new passive cashflows back into high-compounding core wealth assets.",
    "Your debt-to-asset ratio is near zero. Continue building multi-generational wealth with low-cost index assets.",
    "Mastery level achieved! Mentor family members or review advanced tax-harvesting techniques with an advisor.",
    "Top-tier score! Maintain quarterly health checks to ensure your financial fortress stays invincible.",
  ];

  static String getGlobalFitnessAdvisory(double score) {
    List<String> list;
    if (score < 40) {
      list = _criticalAdvisories;
    } else if (score < 60) {
      list = _averageAdvisories;
    } else if (score < 80) {
      list = _goodAdvisories;
    } else {
      list = _excellentAdvisories;
    }

    final int seed = score.round() + DateTime.now().day;
    return list[Random(seed).nextInt(list.length)];
  }
}
