export function getScoreLabel(score) {
  if (score >= 85) return { label: 'Excellent', emoji: '💎', color: '#10B981' }
  if (score >= 70) return { label: 'Good', emoji: '✅', color: '#10B981' }
  if (score >= 50) return { label: 'Average', emoji: '😐', color: '#F59E0B' }
  return { label: 'Critical', emoji: '⚠️', color: '#EF4444' }
}

export function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
