export const dashboardData = {
  globalScore: 72,
  startingScore: 55,
  currentScore: 72,
  streakWeeks: 4,
  strongestPillar: { id: 'income', name: 'Income', score: 88 },
  weakestPillar: { id: 'emergency-fund', name: 'Emergency Fund', score: 42 },
  pillars: [
    { id: 'income', name: 'Income', icon: '💰', score: 88, path: '/pillars/income', color: '#4F46E5' },
    { id: 'expenses', name: 'Expenses', icon: '🧾', score: 74, path: '/pillars/expenses', color: '#8B5CF6' },
    { id: 'emergency-fund', name: 'Emergency Fund', icon: '🛡️', score: 42, path: '/pillars/emergency-fund', color: '#F59E0B' },
    { id: 'protection', name: 'Protection', icon: '☂️', score: 65, path: '/pillars/protection', color: '#10B981' },
    { id: 'investment', name: 'Investment', icon: '📈', score: 70, path: '/pillars/investment', color: '#EF4444' },
  ],
}
