import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { ScoreGauge } from '../components/ScoreGauge'
import { PillarCard } from '../components/PillarCard'
import { DashboardSkeleton } from '../components/Skeleton'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDashboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await client.get('/api/dashboard')
      setData(res.data)
    } catch (err) {
      if (err.response?.status === 404) {
        navigate('/onboarding')
      } else {
        setError('Failed to load dashboard data.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  if (loading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-20">
        <p className="font-semibold text-danger">{error}</p>
        <Button onClick={fetchDashboard}>Retry</Button>
      </div>
    )
  }

  if (!data) return null

  const firstName = user?.name ? user.name.split(' ')[0] : 'User'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary md:text-3xl">
            Hi {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Here&apos;s your financial fitness snapshot
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data.weeklyDiscipline != null && (
            <Badge variant="warning">🔥 {data.weeklyDiscipline} WEEKS</Badge>
          )}
        </div>
      </div>

      <Card className="flex flex-col items-center py-8">
        <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-secondary">
          Global Fitness Score
        </p>
        <ScoreGauge score={data.fitnessScore} size={200} stroke={14} />
        <div className="mt-4 flex flex-col items-center">
          <span className="text-xl font-bold" style={{ color: data.fitnessBand.color }}>
            {data.fitnessBand.emoji} {data.fitnessBand.band}
          </span>
          <span className="text-sm font-semibold text-text-secondary">
            Tag: {data.fitnessBand.tag}
          </span>
        </div>
      </Card>

      <div>
        <h2 className="mb-3 text-base font-bold text-text-primary">Your 5 Pillars</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {[
            { id: 'income', name: 'Income', icon: '💰', path: '/pillars/income', color: '#4F46E5' },
            { id: 'expenses', name: 'Expenses', icon: '🧾', path: '/pillars/expenses', color: '#8B5CF6' },
            { id: 'emergency', name: 'Emergency Fund', icon: '🛡️', path: '/pillars/emergency-fund', color: '#F59E0B' },
            { id: 'protection', name: 'Protection', icon: '☂️', path: '/pillars/protection', color: '#10B981' },
            { id: 'investment', name: 'Investment', icon: '📈', path: '/pillars/investment', color: '#EF4444' },
          ].map((cfg) => (
            <PillarCard key={cfg.id} pillar={{ ...cfg, score: data.pillars?.[cfg.id]?.score || 0 }} />
          ))}
        </div>
      </div>

      {data.summary?.strongest && data.summary?.weakest && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="border-success/30 bg-success/5">
            <div className="text-xs font-bold uppercase tracking-wide text-success">Strongest Pillar</div>
            <div className="mt-2 text-lg font-extrabold text-text-primary">
              {data.summary.strongest.pillar}
            </div>
            <div className="text-sm text-text-secondary">Score {data.summary.strongest.score}/100</div>
          </Card>
          <Card className="border-warning/30 bg-warning/5">
            <div className="text-xs font-bold uppercase tracking-wide text-warning">Weakest Pillar</div>
            <div className="mt-2 text-lg font-extrabold text-text-primary">
              {data.summary.weakest.pillar}
            </div>
            <div className="text-sm text-text-secondary">Score {data.summary.weakest.score}/100</div>
          </Card>
        </div>
      )}

      {data.summary?.finTip && (
        <Card className="border-accent/30 bg-accent/5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🦉</span>
            <div>
              <h3 className="font-bold text-text-primary">Fin Says</h3>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">{data.summary.finTip}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
