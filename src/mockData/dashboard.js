export const dashboardData = {
  fitnessScore: 72,
  fitnessBand: {
    band: 'Financially Active',
    color: '#10B981',
    emoji: '✅',
    tag: 'Good',
  },
  pillars: {
    income: { score: 88, factors: { stability: 90, growth: 85, diversity: 70 } },
    expenses: { score: 74 },
    emergency: { score: 42, factors: { liquidityFund: 185000 }, coverageMonths: 2.4 },
    protection: { score: 65, factors: { termInsurance: 5000000, healthInsurance: 500000 } },
    investment: { score: 70, factors: { mutualFunds: 420000, goldSip: 10000, debtFunds: 180000 } },
  },
  summary: {
    strongest: { pillar: 'Income', score: 88 },
    weakest: { pillar: 'Emergency Fund', score: 42 },
    finTip: 'Trim flexible spends by ₹14k to boost your emergency fund.',
  },
  weeklyDiscipline: 4,
  userName: 'Rahul',
}
