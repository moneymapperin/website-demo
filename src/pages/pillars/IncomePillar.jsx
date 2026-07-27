import { useCallback } from 'react'
import { ScoreGauge } from '../../components/ScoreGauge'
import { PillarLayout } from '../../components/PillarLayout'
import { Card } from '../../components/ui/Card'
import { useApi } from '../../hooks/useApi'
import client from '../../api/client'

export default function IncomePillar() {
  const fetchDashboard = useCallback(() => client.get('/api/dashboard'), [])
  const { data, loading, error, execute } = useApi(fetchDashboard)

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center animate-pulse">Loading pillar...</div>
  if (error || !data) return (
    <div className="flex flex-col items-center justify-center space-y-4 py-20">
      <p className="font-semibold text-danger">{error || 'Failed to load'}</p>
      <button onClick={execute} className="text-primary hover:underline">Retry</button>
    </div>
  )

  const d = data.pillars?.income
  if (!d) return <div className="py-20 text-center">Pillar data not found.</div>

  return (
    <PillarLayout
      title={d.title || 'Income'}
      headerColor={d.headerColor || '#4F46E5'}
      scoreRing={<ScoreGauge score={d.score || 0} size={160} />}
    >
      <Card>
        <h2 className="mb-4 font-bold text-text-primary">Income Factors</h2>
        <div className="space-y-4">
          {d.factors && Object.entries(d.factors).map(([key, val]) => (
            <div key={key}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-semibold capitalize text-text-primary">{key}</span>
                <span className="text-text-secondary">{val}/100</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </PillarLayout>
  )
}
