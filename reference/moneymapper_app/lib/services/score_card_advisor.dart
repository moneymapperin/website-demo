import 'dart:math';

class ScoreCardAdvisor {
  // ---------------------------------------------------------------------------
  // 1. STOCK SCORE CARD ADVISOR
  // ---------------------------------------------------------------------------

  static String generateStockAdvice(Map<String, dynamic> stock) {
    final String name = stock['company_name']?.toString() ?? stock['symbol']?.toString() ?? 'Stock';
    final String symbol = stock['symbol']?.toString() ?? '';
    final double score = _toDouble(stock['score'] ?? stock['final_score']);
    final String sector = stock['sector']?.toString() ?? 'General';
    final dynamic peVal = stock['pe_ratio'];
    final dynamic capVal = stock['market_cap'];
    final String signal = stock['signal']?.toString() ?? stock['recommendation']?.toString() ?? '';

    final bool isGood = score >= 60;
    final String decisionEmoji = isGood ? '✅' : '⚠️';
    final String decisionLabel = isGood ? 'GOOD TO BUY / POSITIVE' : 'AVOID / EXERCISE CAUTION';

    final StringBuffer sb = StringBuffer();
    sb.writeln('### 📊 **Stock Score Card: $name${symbol.isNotEmpty ? " ($symbol)" : ""}**');
    sb.writeln();
    sb.writeln('• **MoneyMapper Score:** **${score.round()}/100**');
    sb.writeln('• **Verdict:** $decisionEmoji **$decisionLabel**');
    if (signal.isNotEmpty) {
      sb.writeln('• **Signal:** `$signal`');
    }
    sb.writeln();

    sb.writeln('📌 **Key Stock Parameters:**');
    sb.writeln('• **Sector:** $sector');
    if (peVal != null && peVal.toString().isNotEmpty && peVal.toString() != 'null') {
      sb.writeln('• **P/E Ratio:** ${peVal}x');
    }
    if (capVal != null && capVal.toString().isNotEmpty && capVal.toString() != 'null') {
      final double cap = _toDouble(capVal);
      if (cap > 0) {
        sb.writeln('• **Market Cap:** ${_formatCompact(cap)}');
      }
    }
    sb.writeln();

    sb.writeln('💡 **MoneyMapper AI Analysis:**');
    final commentary = _getStockCommentary(score, sector, name);
    sb.writeln(commentary);

    return sb.toString();
  }

  static String _getStockCommentary(double score, String sector, String company) {
    final int scoreInt = score.round();
    final int seed = company.hashCode.abs() + scoreInt;
    final Random rng = Random(seed);

    if (score >= 86) {
      final templates = [
        "$company exhibits top-tier financial strength with a stellar score of $scoreInt/100. It is in the top 5% of its sector ($sector) with dominant market position and robust cash flows. Strongly recommended for core portfolio accumulation.",
        "Outstanding rating of $scoreInt/100 for $company! High operational efficiency, minimal balance sheet stress, and powerful sectoral tailwinds in $sector make this an exceptional long-term buy candidate.",
        "With a MoneyMapper Score of $scoreInt/100, $company demonstrates premium fundamental quality in $sector. Market sentiment and price action both align favorably for long-term wealth creation.",
        "Stellar $scoreInt/100 score for $company! It reflects strong return on capital, high earnings visibility, and superior competitiveness within the $sector landscape. Prime candidate for systematic accumulation.",
        "$company's score of $scoreInt/100 marks it as a market leader in $sector. Outstanding risk-reward ratio, resilient profitability, and high institutional confidence make it a strong buy.",
      ];
      return templates[rng.nextInt(templates.length)];
    } else if (score >= 76) {
      final templates = [
        "$company holds a solid $scoreInt/100 MoneyMapper Score. Strong business fundamentals and consistent profitability in $sector support a buy recommendation on dips.",
        "Healthy $scoreInt/100 rating for $company! Its $sector focus, stable margins, and favorable technical setup indicate strong potential for capital appreciation.",
        "$company scores $scoreInt/100, showing healthy fundamental stability and decent valuation comfort in $sector. Good candidate for systematic buying.",
        "A robust score of $scoreInt/100 for $company. Strong operational execution in $sector makes this stock a dependable pick for long-term growth portfolios.",
        "Score of $scoreInt/100 reflects clean financial health for $company. Favorable sector trends in $sector provide a strong tailwind for ongoing accumulation.",
      ];
      return templates[rng.nextInt(templates.length)];
    } else if (score >= 60) {
      final templates = [
        "$company crosses the $scoreInt/100 MoneyMapper threshold (>= 60), making it a favorable candidate for buying. Steady operational metrics in $sector provide downside support.",
        "With a score of $scoreInt/100, $company meets our minimum quality threshold for buying. Moderate growth outlook in $sector with reasonable entry levels.",
        "$company scores $scoreInt/100, indicating positive momentum in $sector. Good candidate for phased buying with a 1-to-3 year time horizon.",
        "Acceptable MoneyMapper score of $scoreInt/100 for $company. Fundamentals in $sector are stable, offering a satisfactory entry point for patient investors.",
        "$company scores $scoreInt/100 (above our 60 cutoff). Steady performance in $sector makes it suitable for gradual accumulation.",
      ];
      return templates[rng.nextInt(templates.length)];
    } else if (score >= 41) {
      final templates = [
        "$company scores $scoreInt/100, which is below our 60 threshold. Better to avoid new purchases for now as sectoral headwinds in $sector or valuation pressures remain.",
        "Caution advised for $company ($scoreInt/100). The score indicates sub-optimal return ratios or earnings volatility in $sector. We recommend avoiding new entry.",
        "$company's rating of $scoreInt/100 reflects moderate weakness in fundamentals or sector headwinds ($sector). Prefer waiting for score improvement above 60 before considering.",
        "With a score of $scoreInt/100, $company falls short of our 60/100 buy baseline. We advise avoiding fresh positions and focusing on higher-scoring market leaders.",
        "$company ($scoreInt/100) shows mixed financial indicators in $sector. Better to remain on the sidelines until MoneyMapper Score crosses 60.",
      ];
      return templates[rng.nextInt(templates.length)];
    } else if (score >= 21) {
      final templates = [
        "Weak rating of $scoreInt/100 for $company. Elevated financial risks or deteriorating profit margins in $sector. Avoid fresh investments completely.",
        "High risk flagged for $company ($scoreInt/100). Financial indicators in $sector are subdued. We recommend avoiding this stock.",
        "$company scores a low $scoreInt/100 due to persistent profitability drag or high leverage in $sector. Avoid buying.",
        "Subdued MoneyMapper score of $scoreInt/100 for $company. Weak operational metrics make it advisable to stay away.",
        "Avoid $company ($scoreInt/100). The low rating highlights financial stress or competitive pressure in $sector.",
      ];
      return templates[rng.nextInt(templates.length)];
    } else {
      final templates = [
        "Critical warning: $company scores only $scoreInt/100. Severe financial drag, high debt risk, or negative growth in $sector. Strictly avoid.",
        "$company ($scoreInt/100) is in the bottom rating band. Severe operational underperformance in $sector. Do not invest.",
        "Very weak score of $scoreInt/100 for $company. High vulnerability and poor capital efficiency. Avoid fresh positions completely.",
        "Lowest band score of $scoreInt/100 for $company. Serious operational concerns in $sector. Strictly avoid.",
        "$company scores a critical $scoreInt/100. Unfavorable risk-reward profile in $sector. Avoid.",
      ];
      return templates[rng.nextInt(templates.length)];
    }
  }

  // ---------------------------------------------------------------------------
  // 2. MUTUAL FUND SCORE CARD ADVISOR
  // ---------------------------------------------------------------------------

  static String generateMfAdvice(Map<String, dynamic> fund) {
    final String name = fund['scheme_name']?.toString() ?? fund['fund_name']?.toString() ?? 'Mutual Fund';
    final double score = _toDouble(fund['final_score'] ?? fund['score']);
    final String category = fund['category']?.toString() ?? fund['cluster']?.toString() ?? 'Equity';
    final dynamic cagrVal = fund['cagr_3yr'] ?? fund['cagr_3y'];
    final dynamic aumVal = fund['aum_crores'] ?? fund['aum'];
    final String riskLevel = fund['risk_level']?.toString() ?? fund['risk']?.toString() ?? 'Moderate';

    final bool isGood = score >= 50;
    final String decisionEmoji = isGood ? '✅' : '⚠️';
    final String decisionLabel = isGood ? 'GOOD FOR LONG-TERM INVESTMENT' : 'SUB-OPTIMAL / AVOID FOR LONG-TERM';

    final StringBuffer sb = StringBuffer();
    sb.writeln('### 📈 **Mutual Fund Score Card: $name**');
    sb.writeln();
    sb.writeln('• **MoneyMapper Score:** **${score.round()}/100**');
    sb.writeln('• **Verdict:** $decisionEmoji **$decisionLabel**');
    sb.writeln();

    sb.writeln('📌 **Key Scheme Parameters:**');
    sb.writeln('• **Category:** $category');
    if (cagrVal != null && cagrVal.toString().isNotEmpty && cagrVal.toString() != 'null') {
      final double cagr = _toDouble(cagrVal);
      sb.writeln('• **3-Year CAGR:** ${cagr.toStringAsFixed(1)}%');
    }
    if (aumVal != null && aumVal.toString().isNotEmpty && aumVal.toString() != 'null') {
      final double aum = _toDouble(aumVal);
      if (aum > 0) {
        sb.writeln('• **AUM (Asset Size):** ₹${_formatCompact(aum)} Cr');
      }
    }
    if (riskLevel.isNotEmpty) {
      sb.writeln('• **Risk Level:** $riskLevel');
    }
    sb.writeln();

    sb.writeln('💡 **MoneyMapper Category & Long-Term Insight:**');
    final commentary = _getMfCommentary(score, category, name);
    sb.writeln(commentary);

    return sb.toString();
  }

  static String _getMfCommentary(double score, String category, String fundName) {
    final int scoreInt = score.round();
    final int seed = fundName.hashCode.abs() + scoreInt;
    final Random rng = Random(seed);
    final String catLower = category.toLowerCase();

    final bool isGood = score >= 50;

    if (catLower.contains('small')) {
      return isGood
          ? "$fundName scores a healthy $scoreInt/100 in the Small Cap space. Small-cap funds carry higher volatility but deliver powerful long-term wealth compounding over 5+ year horizons. Excellent choice for aggressive investors via systematic SIPs."
          : "$fundName scores $scoreInt/100 (below our 50/100 long-term benchmark). In the high-risk Small Cap category, downside protection is vital. We recommend avoiding this fund and switching to a higher-scoring Small Cap scheme.";
    } else if (catLower.contains('mid')) {
      return isGood
          ? "$fundName boasts an impressive $scoreInt/100 score in Mid Cap funds. Mid caps offer the sweet spot between high growth and business maturity. Recommended for a 3-5 year investment horizon."
          : "$fundName scores $scoreInt/100, which falls below our 50/100 threshold for Mid Cap allocation. Better to stay with top-tier, higher-scoring Mid Cap funds with better downside risk protection.";
    } else if (catLower.contains('large') || catLower.contains('bluechip')) {
      return isGood
          ? "$fundName scores $scoreInt/100 in Large Cap funds. Large caps provide foundational stability, reliable liquidity, and consistent compounding through India's top 100 market leaders. Ideal core holding."
          : "$fundName scores $scoreInt/100, which is below our 50/100 threshold for Large Cap funds. In Large Cap investing, low expense ratio and low tracking error are key. Consider higher-rated Large Cap/Index funds.";
    } else if (catLower.contains('flexi') || catLower.contains('multi')) {
      return isGood
          ? "$fundName scores $scoreInt/100 in Flexi Cap allocation. Flexi-cap strategy allows the fund manager to dynamically shift capital across large, mid, and small caps based on market valuation. Excellent all-weather long-term choice."
          : "$fundName scores $scoreInt/100. Flexi Cap funds require active market-cap allocation. This score indicates sub-optimal execution. Consider higher-scoring Flexi Cap alternatives.";
    } else if (catLower.contains('elss') || catLower.contains('tax')) {
      return isGood
          ? "$fundName scores $scoreInt/100 in ELSS Tax Saver schemes. Provides Dual Benefit: Section 80C tax deduction up to ₹1.5 Lakhs along with high equity compounding. 3-year mandatory lock-in aligns perfectly with long-term wealth creation."
          : "$fundName scores $scoreInt/100. Since ELSS funds carry a strict 3-year lock-in, picking a high-scoring scheme is critical. We recommend avoiding this sub-50 score fund for tax saving.";
    } else if (catLower.contains('debt') || catLower.contains('liquid') || catLower.contains('overnight')) {
      return isGood
          ? "$fundName scores $scoreInt/100 in Debt/Liquid category. Focuses on capital preservation, credit safety, and high liquidity. Ideal for parking short-term surplus funds or emergency reserves."
          : "$fundName scores $scoreInt/100. In Debt funds, credit safety and yield-to-maturity consistency are paramount. Look for higher-scoring debt schemes with sovereign or AAA credit quality.";
    } else if (catLower.contains('index') || catLower.contains('nifty') || catLower.contains('sensex')) {
      return isGood
          ? "$fundName scores $scoreInt/100 in Index passive funds. Low expense ratio and tight tracking error allow you to capture low-cost broad market growth in India."
          : "$fundName scores $scoreInt/100 in Index space. Check for tracking error or expense ratio friction before investing.";
    } else {
      return isGood
          ? "$fundName scores a strong $scoreInt/100 in $category. The fund demonstrates consistent risk-adjusted returns and efficient portfolio management. Suitable for long-term systematic wealth building."
          : "$fundName scores $scoreInt/100 in $category (below our 50/100 cutoff). We recommend choosing higher-scoring schemes in this category for long-term wealth accumulation.";
    }
  }

  // ---------------------------------------------------------------------------
  // 3. INSURANCE SCORE CARD DETAILS (No Buy/Sell Opinions)
  // ---------------------------------------------------------------------------

  static String generateInsuranceDetails(Map<String, dynamic> plan) {
    final String company = plan['company_name']?.toString() ?? 'Insurance Provider';
    final String planName = plan['plan_name']?.toString() ?? 'Insurance Policy';
    final double score = _toDouble(plan['score'] ?? plan['final_score']);
    final String planType = plan['plan_type']?.toString() ?? plan['category']?.toString() ?? 'Health / Term';
    final dynamic csrVal = plan['claim_settlement_ratio'] ?? plan['csr'];
    final dynamic coverVal = plan['cover_amount'] ?? plan['sum_assured'];
    final dynamic premiumVal = plan['premium_annual'] ?? plan['premium'];

    final StringBuffer sb = StringBuffer();
    sb.writeln('### 🛡️ **Insurance Score Card: $planName**');
    sb.writeln();
    sb.writeln('• **Provider:** $company');
    sb.writeln('• **MoneyMapper Score:** **${score.round()}/100**');
    sb.writeln('• **Plan Type:** `$planType`');
    sb.writeln();

    sb.writeln('📋 **Policy Overview & Key Metrics:**');
    if (csrVal != null && csrVal.toString().isNotEmpty && csrVal.toString() != 'null') {
      final double csr = _toDouble(csrVal);
      sb.writeln('• **Claim Settlement Ratio (CSR):** **${csr.toStringAsFixed(1)}%**');
    }
    if (coverVal != null && coverVal.toString().isNotEmpty && coverVal.toString() != 'null') {
      final double cover = _toDouble(coverVal);
      if (cover > 0) {
        sb.writeln('• **Sum Assured / Cover:** ₹${_formatCompact(cover)}');
      }
    }
    if (premiumVal != null && premiumVal.toString().isNotEmpty && premiumVal.toString() != 'null') {
      final double prem = _toDouble(premiumVal);
      if (prem > 0) {
        sb.writeln('• **Approx Annual Premium:** ₹${_formatCompact(prem)} / yr');
      }
    }
    sb.writeln();

    sb.writeln('ℹ️ *Note: Insurance coverage details are provided for informational and policy comparison purposes.*');
    return sb.toString();
  }

  // ---------------------------------------------------------------------------
  // 4. IPO SCORE CARD DETAILS
  // ---------------------------------------------------------------------------

  static String generateIpoDetails(Map<String, dynamic> ipo) {
    final String company = ipo['company_name']?.toString() ?? ipo['name']?.toString() ?? 'Upcoming IPO';
    final double score = _toDouble(ipo['score'] ?? ipo['final_score']);
    final String priceBand = ipo['price_band']?.toString() ?? 'TBA';
    final dynamic issueSizeVal = ipo['issue_size'] ?? ipo['issue_size_cr'];
    final String dates = ipo['bidding_dates'] ?? ipo['dates'] ?? 'Upcoming';
    final String gmp = ipo['gmp']?.toString() ?? 'TBA';

    final StringBuffer sb = StringBuffer();
    sb.writeln('### 🚀 **IPO Score Card: $company**');
    sb.writeln();
    sb.writeln('• **MoneyMapper Score:** **${score.round()}/100**');
    sb.writeln();

    sb.writeln('📊 **IPO Issue Highlights & Status:**');
    sb.writeln('• **Price Band:** $priceBand');
    if (issueSizeVal != null && issueSizeVal.toString().isNotEmpty && issueSizeVal.toString() != 'null') {
      final double size = _toDouble(issueSizeVal);
      if (size > 0) {
        sb.writeln('• **Issue Size:** ₹${_formatCompact(size)} Cr');
      }
    }
    sb.writeln('• **Bidding Dates:** $dates');
    if (gmp.isNotEmpty && gmp != 'TBA') {
      sb.writeln('• **Grey Market Premium (GMP):** $gmp');
    }
    sb.writeln();

    sb.writeln('ℹ️ *Note: IPO score card metrics update live as bidding and subscription data open.*');
    return sb.toString();
  }

  // ---------------------------------------------------------------------------
  // HELPER UTILITIES
  // ---------------------------------------------------------------------------

  static double _toDouble(dynamic v) {
    if (v == null) return 0;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString()) ?? 0;
  }

  static String _formatCompact(double amount) {
    if (amount >= 10000000) {
      double cr = amount / 10000000;
      return "${cr % 1 == 0 ? cr.toInt() : cr.toStringAsFixed(2)} Cr";
    } else if (amount >= 100000) {
      double lakh = amount / 100000;
      return "${lakh % 1 == 0 ? lakh.toInt() : lakh.toStringAsFixed(2)} Lakhs";
    } else {
      return amount.round().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},');
    }
  }
}
