class DashboardData {
  final double fitnessScore;
  final Map<String, dynamic>? fitnessBand;
  final Map<String, PillarData> pillars;
  final DashboardSummary summary;
  final String? userName;
  final bool hasFinancialData;

  DashboardData({
    required this.fitnessScore,
    this.fitnessBand,
    required this.pillars,
    required this.summary,
    this.userName,
    this.hasFinancialData = true,
  });

  factory DashboardData.fromCoreSchema(Map<String, dynamic> coreData) {
    final fitness = coreData['financial_fitness_scores'] ?? {};
    final income = coreData['income_scores'] ?? {};
    final expense = coreData['expense_scores'] ?? {};
    final savings = coreData['savings_scores'] ?? {};
    final protection = coreData['protection_scores'] ?? {};
    final investment = coreData['investment_scores'] ?? {};

    final fitnessScore = _toDouble(fitness['global_fitness_score']);

    final pillars = {
      'income': PillarData(
        score: _toDouble(fitness['income_pillar_score']),
        factors: {
          'active_income_score': _toDouble(income['active_income_score']),
          'passive_income_score': _toDouble(income['passive_income_score']),
        },
      ),
      'expenses': PillarData(
        score: _toDouble(fitness['expense_pillar_score']),
        factors: {
          'savings_score': _toDouble(expense['savings_score']),
          'flexible_score': _toDouble(expense['flexible_score']),
          'fixed_score': _toDouble(expense['fixed_score']),
          'discipline_message': expense['discipline_message'],
        },
      ),
      'emergency': PillarData(
        score: _toDouble(fitness['savings_pillar_score']),
        factors: {
          'ef_target_amount': _toDouble(savings['ef_target_amount']),
          'ef_current_estimated': _toDouble(savings['ef_current_estimated']),
        },
      ),
      'protection': PillarData(
        score: _toDouble(fitness['protection_pillar_score']),
        factors: {
          'term_score': _toDouble(protection['term_score']),
          'health_score': _toDouble(protection['health_score']),
          'term_gap': _toDouble(protection['term_gap']),
          'health_gap': _toDouble(protection['health_gap']),
        },
      ),
      'investment': PillarData(
        score: _toDouble(fitness['investment_pillar_score']),
        factors: {
          'equity_score': _toDouble(investment['equity_score']),
          'asset_balance_score': _toDouble(investment['asset_balance_score']),
          'sip_score': _toDouble(investment['sip_score']),
          'sip_gap': _toDouble(investment['sip_gap']),
        },
      ),
    };

    // Determine strongest and weakest
    var sortedPillars = pillars.entries.toList()
      ..sort((a, b) => a.value.score.compareTo(b.value.score));
    
    final weakest = sortedPillars.first;
    final strongest = sortedPillars.last;

    return DashboardData(
      fitnessScore: fitnessScore,
      fitnessBand: getBand(fitnessScore),
      pillars: pillars,
      summary: DashboardSummary(
        strongestPillar: strongest.key,
        strongestScore: strongest.value.score,
        weakestPillar: weakest.key,
        weakestScore: weakest.value.score,
        finTip: expense['discipline_message'] ?? 'Keep tracking your expenses daily.',
      ),
      hasFinancialData: true,
    );
  }

  static Map<String, dynamic> getBand(double score) {
    if (score >= 80) return {'tag': 'Excellent', 'emoji': '💎'};
    if (score >= 60) return {'tag': 'Good', 'emoji': '✅'};
    if (score >= 40) return {'tag': 'Average', 'emoji': '😐'};
    return {'tag': 'Critical', 'emoji': '⚠️'};
  }

  String get bandLabel => fitnessBand?['tag'] ?? 'Score';
  String get bandEmoji => fitnessBand?['emoji'] ?? '';

  static double _toDouble(dynamic v) {
    if (v == null) return 0;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString()) ?? 0;
  }
}

class PillarData {
  final double score;
  final Map<String, dynamic>? factors;

  PillarData({
    required this.score,
    this.factors,
  });
}

class DashboardSummary {
  final String strongestPillar;
  final double strongestScore;
  final String weakestPillar;
  final double weakestScore;
  final String finTip;

  DashboardSummary({
    required this.strongestPillar,
    required this.strongestScore,
    required this.weakestPillar,
    required this.weakestScore,
    required this.finTip,
  });
}
