/**
 * ScoreCardAdvisor and AdvisoryService ported 1:1 from Flutter:
 * - reference/moneymapper_app/lib/services/score_card_advisor.dart
 * - reference/moneymapper_app/lib/services/advisory_service.dart
 */

export class ScoreCardAdvisor {
  // ---------------------------------------------------------------------------
  // 1. STOCK SCORE CARD ADVISOR
  // ---------------------------------------------------------------------------

  static generateStockAdvice(stock: Record<string, any>): string {
    const name = stock.company_name?.toString() ?? stock.symbol?.toString() ?? 'Stock';
    const symbol = stock.symbol?.toString() ?? '';
    const score = this._toDouble(stock.score ?? stock.final_score);
    const sector = stock.sector?.toString() ?? 'General';
    const peVal = stock.pe_ratio;
    const capVal = stock.market_cap;
    const signal = stock.signal?.toString() ?? stock.recommendation?.toString() ?? '';

    const isGood = score >= 60;
    const decisionEmoji = isGood ? '✅' : '⚠️';
    const decisionLabel = isGood ? 'GOOD TO BUY / POSITIVE' : 'AVOID / EXERCISE CAUTION';

    const lines: string[] = [];
    lines.push(`### 📊 **Stock Score Card: ${name}${symbol ? ` (${symbol})` : ''}**\n`);
    lines.push(`• **MoneyMapper Score:** **${Math.round(score)}/100**`);
    lines.push(`• **Verdict:** ${decisionEmoji} **${decisionLabel}**`);
    if (signal) {
      lines.push(`• **Signal:** \`${signal}\``);
    }
    lines.push('');

    lines.push('📌 **Key Stock Parameters:**');
    lines.push(`• **Sector:** ${sector}`);
    if (peVal !== null && peVal !== undefined && peVal.toString() !== '' && peVal.toString() !== 'null') {
      lines.push(`• **P/E Ratio:** ${peVal}x`);
    }
    if (capVal !== null && capVal !== undefined && capVal.toString() !== '' && capVal.toString() !== 'null') {
      const cap = this._toDouble(capVal);
      if (cap > 0) {
        lines.push(`• **Market Cap:** ${this._formatCompact(cap)}`);
      }
    }
    lines.push('');

    lines.push('💡 **MoneyMapper AI Analysis:**');
    const commentary = this._getStockCommentary(score, sector, name);
    lines.push(commentary);

    return lines.join('\n');
  }

  private static _getStockCommentary(score: number, sector: string, company: string): string {
    const scoreInt = Math.round(score);
    // Simple pseudo-random index based on company name hash and score for deterministic consistency
    let hash = 0;
    for (let i = 0; i < company.length; i++) {
      hash = (hash << 5) - hash + company.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash) + scoreInt;

    if (score >= 86) {
      const templates = [
        `${company} exhibits top-tier financial strength with a stellar score of ${scoreInt}/100. It is in the top 5% of its sector (${sector}) with dominant market position and robust cash flows. Strongly recommended for core portfolio accumulation.`,
        `Outstanding rating of ${scoreInt}/100 for ${company}! High operational efficiency, minimal balance sheet stress, and powerful sectoral tailwinds in ${sector} make this an exceptional long-term buy candidate.`,
        `With a MoneyMapper Score of ${scoreInt}/100, ${company} demonstrates premium fundamental quality in ${sector}. Market sentiment and price action both align favorably for long-term wealth creation.`,
        `Stellar ${scoreInt}/100 score for ${company}! It reflects strong return on capital, high earnings visibility, and superior competitiveness within the ${sector} landscape. Prime candidate for systematic accumulation.`,
        `${company}'s score of ${scoreInt}/100 marks it as a market leader in ${sector}. Outstanding risk-reward ratio, resilient profitability, and high institutional confidence make it a strong buy.`,
      ];
      return templates[seed % templates.length];
    } else if (score >= 76) {
      const templates = [
        `${company} holds a solid ${scoreInt}/100 MoneyMapper Score. Strong business fundamentals and consistent profitability in ${sector} support a buy recommendation on dips.`,
        `Healthy ${scoreInt}/100 rating for ${company}! Its ${sector} focus, stable margins, and favorable technical setup indicate strong potential for capital appreciation.`,
        `${company} scores ${scoreInt}/100, showing healthy fundamental stability and decent valuation comfort in ${sector}. Good candidate for systematic buying.`,
        `A robust score of ${scoreInt}/100 for ${company}. Strong operational execution in ${sector} makes this stock a dependable pick for long-term growth portfolios.`,
        `Score of ${scoreInt}/100 reflects clean financial health for ${company}. Favorable sector trends in ${sector} provide a strong tailwind for ongoing accumulation.`,
      ];
      return templates[seed % templates.length];
    } else if (score >= 60) {
      const templates = [
        `${company} crosses the ${scoreInt}/100 MoneyMapper threshold (>= 60), making it a favorable candidate for buying. Steady operational metrics in ${sector} provide downside support.`,
        `With a score of ${scoreInt}/100, ${company} meets our minimum quality threshold for buying. Moderate growth outlook in ${sector} with reasonable entry levels.`,
        `${company} scores ${scoreInt}/100, indicating positive momentum in ${sector}. Good candidate for phased buying with a 1-to-3 year time horizon.`,
        `Acceptable MoneyMapper score of ${scoreInt}/100 for ${company}. Fundamentals in ${sector} are stable, offering a satisfactory entry point for patient investors.`,
        `${company} scores ${scoreInt}/100 (above our 60 cutoff). Steady performance in ${sector} makes it suitable for gradual accumulation.`,
      ];
      return templates[seed % templates.length];
    } else if (score >= 41) {
      const templates = [
        `${company} scores ${scoreInt}/100, which is below our 60 threshold. Better to avoid new purchases for now as sectoral headwinds in ${sector} or valuation pressures remain.`,
        `Caution advised for ${company} (${scoreInt}/100). The score indicates sub-optimal return ratios or earnings volatility in ${sector}. We recommend avoiding new entry.`,
        `${company}'s rating of ${scoreInt}/100 reflects moderate weakness in fundamentals or sector headwinds (${sector}). Prefer waiting for score improvement above 60 before considering.`,
        `With a score of ${scoreInt}/100, ${company} falls short of our 60/100 buy baseline. We advise avoiding fresh positions and focusing on higher-scoring market leaders.`,
        `${company} (${scoreInt}/100) shows mixed financial indicators in ${sector}. Better to remain on the sidelines until MoneyMapper Score crosses 60.`,
      ];
      return templates[seed % templates.length];
    } else if (score >= 21) {
      const templates = [
        `Weak rating of ${scoreInt}/100 for ${company}. Elevated financial risks or deteriorating profit margins in ${sector}. Avoid fresh investments completely.`,
        `High risk flagged for ${company} (${scoreInt}/100). Financial indicators in ${sector} are subdued. We recommend avoiding this stock.`,
        `${company} scores a low ${scoreInt}/100 due to persistent profitability drag or high leverage in ${sector}. Avoid buying.`,
        `Subdued MoneyMapper score of ${scoreInt}/100 for ${company}. Weak operational metrics make it advisable to stay away.`,
        `Avoid ${company} (${scoreInt}/100). The low rating highlights financial stress or competitive pressure in ${sector}.`,
      ];
      return templates[seed % templates.length];
    } else {
      const templates = [
        `Critical warning: ${company} scores only ${scoreInt}/100. Severe financial drag, high debt risk, or negative growth in ${sector}. Strictly avoid.`,
        `${company} (${scoreInt}/100) is in the bottom rating band. Severe operational underperformance in ${sector}. Do not invest.`,
        `Very weak score of ${scoreInt}/100 for ${company}. High vulnerability and poor capital efficiency. Avoid fresh positions completely.`,
        `Lowest band score of ${scoreInt}/100 for ${company}. Serious operational concerns in ${sector}. Strictly avoid.`,
        `${company} scores a critical ${scoreInt}/100. Unfavorable risk-reward profile in ${sector}. Avoid.`,
      ];
      return templates[seed % templates.length];
    }
  }

  // ---------------------------------------------------------------------------
  // 2. MUTUAL FUND SCORE CARD ADVISOR
  // ---------------------------------------------------------------------------

  static generateMfAdvice(fund: Record<string, any>): string {
    const name = fund.scheme_name?.toString() ?? fund.fund_name?.toString() ?? 'Mutual Fund';
    const score = this._toDouble(fund.final_score ?? fund.score);
    const category = fund.category?.toString() ?? fund.cluster?.toString() ?? 'Equity';
    const cagrVal = fund.cagr_3yr ?? fund.cagr_3y;
    const aumVal = fund.aum_crores ?? fund.aum;
    const riskLevel = fund.risk_level?.toString() ?? fund.risk?.toString() ?? 'Moderate';

    const isGood = score >= 50;
    const decisionEmoji = isGood ? '✅' : '⚠️';
    const decisionLabel = isGood ? 'GOOD FOR LONG-TERM INVESTMENT' : 'SUB-OPTIMAL / AVOID FOR LONG-TERM';

    const lines: string[] = [];
    lines.push(`### 📈 **Mutual Fund Score Card: ${name}**\n`);
    lines.push(`• **MoneyMapper Score:** **${Math.round(score)}/100**`);
    lines.push(`• **Verdict:** ${decisionEmoji} **${decisionLabel}**\n`);

    lines.push('📌 **Key Scheme Parameters:**');
    lines.push(`• **Category:** ${category}`);
    if (cagrVal !== null && cagrVal !== undefined && cagrVal.toString() !== '' && cagrVal.toString() !== 'null') {
      const cagr = this._toDouble(cagrVal);
      lines.push(`• **3-Year CAGR:** ${cagr.toFixed(1)}%`);
    }
    if (aumVal !== null && aumVal !== undefined && aumVal.toString() !== '' && aumVal.toString() !== 'null') {
      const aum = this._toDouble(aumVal);
      if (aum > 0) {
        lines.push(`• **AUM (Asset Size):** ₹${this._formatCompact(aum)} Cr`);
      }
    }
    if (riskLevel) {
      lines.push(`• **Risk Level:** ${riskLevel}`);
    }
    lines.push('');

    lines.push('💡 **MoneyMapper Category & Long-Term Insight:**');
    const commentary = this._getMfCommentary(score, category, name);
    lines.push(commentary);

    return lines.join('\n');
  }

  private static _getMfCommentary(score: number, category: string, fundName: string): string {
    const scoreInt = Math.round(score);
    const catLower = category.toLowerCase();
    const isGood = score >= 50;

    if (catLower.includes('small')) {
      return isGood
        ? `${fundName} scores a healthy ${scoreInt}/100 in the Small Cap space. Small-cap funds carry higher volatility but deliver powerful long-term wealth compounding over 5+ year horizons. Excellent choice for aggressive investors via systematic SIPs.`
        : `${fundName} scores ${scoreInt}/100 (below our 50/100 long-term benchmark). In the high-risk Small Cap category, downside protection is vital. We recommend avoiding this fund and switching to a higher-scoring Small Cap scheme.`;
    } else if (catLower.includes('mid')) {
      return isGood
        ? `${fundName} boasts an impressive ${scoreInt}/100 score in Mid Cap funds. Mid caps offer the sweet spot between high growth and business maturity. Recommended for a 3-5 year investment horizon.`
        : `${fundName} scores ${scoreInt}/100, which falls below our 50/100 threshold for Mid Cap allocation. Better to stay with top-tier, higher-scoring Mid Cap funds with better downside risk protection.`;
    } else if (catLower.includes('large') || catLower.includes('bluechip')) {
      return isGood
        ? `${fundName} scores ${scoreInt}/100 in Large Cap funds. Large caps provide foundational stability, reliable liquidity, and consistent compounding through India's top 100 market leaders. Ideal core holding.`
        : `${fundName} scores ${scoreInt}/100, which is below our 50/100 threshold for Large Cap funds. In Large Cap investing, low expense ratio and low tracking error are key. Consider higher-rated Large Cap/Index funds.`;
    } else if (catLower.includes('flexi') || catLower.includes('multi')) {
      return isGood
        ? `${fundName} scores ${scoreInt}/100 in Flexi Cap allocation. Flexi-cap strategy allows the fund manager to dynamically shift capital across large, mid, and small caps based on market valuation. Excellent all-weather long-term choice.`
        : `${fundName} scores ${scoreInt}/100. Flexi Cap funds require active market-cap allocation. This score indicates sub-optimal execution. Consider higher-scoring Flexi Cap alternatives.`;
    } else if (catLower.includes('elss') || catLower.includes('tax')) {
      return isGood
        ? `${fundName} scores ${scoreInt}/100 in ELSS Tax Saver schemes. Provides Dual Benefit: Section 80C tax deduction up to ₹1.5 Lakhs along with high equity compounding. 3-year mandatory lock-in aligns perfectly with long-term wealth creation.`
        : `${fundName} scores ${scoreInt}/100. Since ELSS funds carry a strict 3-year lock-in, picking a high-scoring scheme is critical. We recommend avoiding this sub-50 score fund for tax saving.`;
    } else if (catLower.includes('debt') || catLower.includes('liquid') || catLower.includes('overnight')) {
      return isGood
        ? `${fundName} scores ${scoreInt}/100 in Debt/Liquid category. Focuses on capital preservation, credit safety, and high liquidity. Ideal for parking short-term surplus funds or emergency reserves.`
        : `${fundName} scores ${scoreInt}/100. In Debt funds, credit safety and yield-to-maturity consistency are paramount. Look for higher-scoring debt schemes with sovereign or AAA credit quality.`;
    } else if (catLower.includes('index') || catLower.includes('nifty') || catLower.includes('sensex')) {
      return isGood
        ? `${fundName} scores ${scoreInt}/100 in Index passive funds. Low expense ratio and tight tracking error allow you to capture low-cost broad market growth in India.`
        : `${fundName} scores ${scoreInt}/100 in Index space. Check for tracking error or expense ratio friction before investing.`;
    } else {
      return isGood
        ? `${fundName} scores a strong ${scoreInt}/100 in ${category}. The fund demonstrates consistent risk-adjusted returns and efficient portfolio management. Suitable for long-term systematic wealth building.`
        : `${fundName} scores ${scoreInt}/100 in ${category} (below our 50/100 cutoff). We recommend choosing higher-scoring schemes in this category for long-term wealth accumulation.`;
    }
  }

  // ---------------------------------------------------------------------------
  // 3. INSURANCE SCORE CARD DETAILS (No Buy/Sell Opinions)
  // ---------------------------------------------------------------------------

  static generateInsuranceDetails(plan: Record<string, any>): string {
    const company = plan.company_name?.toString() ?? plan.company?.toString() ?? 'Insurance Provider';
    const planName = plan.plan_name?.toString() ?? plan.policy?.toString() ?? 'Insurance Policy';
    const score = this._toDouble(plan.score ?? plan.smart_score ?? plan.final_score);
    const planType = plan.plan_type?.toString() ?? plan.insurance_type?.toString() ?? plan.category?.toString() ?? 'Health / Term';
    const csrVal = plan.claim_settlement_ratio ?? plan.csr ?? plan.claim_ratio;
    const coverVal = plan.cover_amount ?? plan.cover ?? plan.sum_assured;
    const premiumVal = plan.premium_annual ?? plan.premium;

    const lines: string[] = [];
    lines.push(`### 🛡️ **Insurance Score Card: ${planName}**\n`);
    lines.push(`• **Provider:** ${company}`);
    lines.push(`• **MoneyMapper Score:** **${Math.round(score)}/100**`);
    lines.push(`• **Plan Type:** \`${planType}\`\n`);

    lines.push('📋 **Policy Overview & Key Metrics:**');
    if (csrVal !== null && csrVal !== undefined && csrVal.toString() !== '' && csrVal.toString() !== 'null') {
      const csr = this._toDouble(csrVal);
      lines.push(`• **Claim Settlement Ratio (CSR):** **${csr.toFixed(1)}%**`);
    }
    if (coverVal !== null && coverVal !== undefined && coverVal.toString() !== '' && coverVal.toString() !== 'null') {
      const cover = this._toDouble(coverVal);
      if (cover > 0) {
        lines.push(`• **Sum Assured / Cover:** ₹${this._formatCompact(cover)}`);
      }
    }
    if (premiumVal !== null && premiumVal !== undefined && premiumVal.toString() !== '' && premiumVal.toString() !== 'null') {
      const prem = this._toDouble(premiumVal);
      if (prem > 0) {
        lines.push(`• **Approx Annual Premium:** ₹${this._formatCompact(prem)} / yr`);
      }
    }
    lines.push('');
    lines.push('ℹ️ *Note: Insurance coverage details are provided for informational and policy comparison purposes.*');

    return lines.join('\n');
  }

  // ---------------------------------------------------------------------------
  // 4. IPO SCORE CARD DETAILS
  // ---------------------------------------------------------------------------

  static generateIpoDetails(ipo: Record<string, any>): string {
    const company = ipo.company_name?.toString() ?? ipo.name?.toString() ?? 'Upcoming IPO';
    const score = this._toDouble(ipo.score ?? ipo.final_score);
    const priceBand = ipo.price_band?.toString() ?? 'TBA';
    const issueSizeVal = ipo.issue_size ?? ipo.issue_size_cr;
    const dates = ipo.bidding_dates?.toString() ?? ipo.dates?.toString() ?? 'Upcoming';
    const gmp = ipo.gmp?.toString() ?? 'TBA';

    const lines: string[] = [];
    lines.push(`### 🚀 **IPO Score Card: ${company}**\n`);
    lines.push(`• **MoneyMapper Score:** **${Math.round(score)}/100**\n`);

    lines.push('📊 **IPO Issue Highlights & Status:**');
    lines.push(`• **Price Band:** ${priceBand}`);
    if (issueSizeVal !== null && issueSizeVal !== undefined && issueSizeVal.toString() !== '' && issueSizeVal.toString() !== 'null') {
      const size = this._toDouble(issueSizeVal);
      if (size > 0) {
        lines.push(`• **Issue Size:** ₹${this._formatCompact(size)} Cr`);
      }
    }
    lines.push(`• **Bidding Dates:** ${dates}`);
    if (gmp && gmp !== 'TBA') {
      lines.push(`• **Grey Market Premium (GMP):** ${gmp}`);
    }
    lines.push('');

    lines.push('ℹ️ *Note: IPO score card metrics update live as bidding and subscription data open.*');
    return lines.join('\n');
  }

  // ---------------------------------------------------------------------------
  // HELPER UTILITIES
  // ---------------------------------------------------------------------------

  private static _toDouble(v: any): number {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'number') return v;
    const parsed = parseFloat(v.toString());
    return isNaN(parsed) ? 0 : parsed;
  }

  private static _formatCompact(amount: number): string {
    if (amount >= 10000000) {
      const cr = amount / 10000000;
      return `${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      const lakh = amount / 100000;
      return `${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(2)} Lakhs`;
    } else {
      return Math.round(amount)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
  }
}

export class AdvisoryService {
  private static readonly _incomeAdvisories: Record<string, string[]> = {
    '1-10': [
      'Stop all non-essential spending immediately - no dining out, subscriptions, or shopping this month.',
      'List every expense from the last 30 days to see exactly where money is leaking.',
      "Cancel every subscription you haven't used in the last 30 days, starting today.",
      "Separate 'needs' (rent, food, EMI) from 'wants' and cut every 'want' this month.",
      "Call your lenders today to discuss restructuring any EMI you're struggling to pay.",
    ],
    '11-20': [
      'Build your first monthly budget covering rent, food, bills, EMI, and savings as fixed categories.',
      'Track every expense for 30 days using a simple app or notebook - awareness is the first fix.',
      'Identify your top 3 spending leaks (subscriptions, food delivery, impulse buys) and cut them by half.',
      'Set a weekly cash/UPI limit for discretionary spending and stick to it strictly.',
      'Review all EMIs and loans - list interest rates and prioritize paying off the highest-rate one first.',
    ],
    '21-30': [
      'Formalize your budget into fixed categories (needs, wants, savings, debt) with monthly limits for each.',
      'Set a target to bring total EMI + rent under 40% of your monthly take-home income.',
      'Track discretionary spending weekly and set a hard cap that reduces by 5% each month.',
      'Review all subscriptions every quarter and cancel anything with under 2 uses per month.',
      'Set up separate accounts for fixed expenses and discretionary spending to avoid overlap.',
    ],
    high: [
      'Keep maintaining your high-discipline income structure.',
      'Continue diversifying your income streams across multiple assets.',
      'Focus on automating at least 15% of all new inflows into passive investments.',
      'Review your tax optimization quarterly to ensure maximum take-home value.',
    ],
  };

  private static readonly _expenseAdvisories: Record<string, string[]> = {
    '1-10': [
      'Stop all non-essential spending immediately - no dining out, subscriptions, or shopping this month.',
      'List every expense from the last 30 days to see exactly where money is leaking.',
      "Cancel every subscription you haven't used in the last 30 days, starting today.",
      "Separate 'needs' (rent, food, EMI) from 'wants' and cut every 'want' this month.",
    ],
    '11-20': [
      'Build your first monthly budget covering rent, food, bills, EMI, and savings as fixed categories.',
      'Track every expense for 30 days using a simple app or notebook - awareness is the first fix.',
      'Identify your top 3 spending leaks (subscriptions, food delivery, impulse buys) and cut them by half.',
    ],
    '21-30': [
      'Formalize your budget into fixed categories (needs, wants, savings, debt) with monthly limits for each.',
      'Set a target to bring total EMI + rent under 40% of your monthly take-home income.',
      'Track discretionary spending weekly and set a hard cap that reduces by 5% each month.',
    ],
    high: [
      'Your expense control is excellent. Automate remaining payments.',
      "Focus on reducing 'lifestyle creep' by capping annual expense growth.",
      'Review your Household Efficiency ratio monthly to spot minor optimizations.',
      'Set a goal to redirect 100% of any expense-saving into appreciating assets.',
    ],
  };

  static getAdvisoryText(pillarId: string, score: number): string {
    let rangeKey = 'high';
    if (score <= 10) rangeKey = '1-10';
    else if (score <= 20) rangeKey = '11-20';
    else if (score <= 30) rangeKey = '21-30';

    const advisories =
      pillarId === 'income'
        ? this._incomeAdvisories[rangeKey] ?? this._incomeAdvisories.high
        : this._expenseAdvisories[rangeKey] ?? this._expenseAdvisories.high;

    return advisories[0]; // Deterministic first element for stable web rendering
  }
}
