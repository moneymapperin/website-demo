import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { formatINR } from '../../utils/helpers'
import { useApi } from '../../hooks/useApi'
import client from '../../api/client'

export default function InsuranceRecsPage() {
  const fetchRecs = useCallback(() => client.get('/api/ai/recommend'), [])
  const { data, loading, error, execute } = useApi(fetchRecs)

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center animate-pulse">Loading AI insights...</div>
  if (error || !data) return (
    <div className="flex flex-col items-center justify-center space-y-4 py-20">
      <p className="font-semibold text-danger">{error || 'Failed to load'}</p>
      <button onClick={execute} className="text-primary hover:underline">Retry</button>
    </div>
  )

  const { insuranceProducts = [] } = data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">AI Recommended Protection</h1>
        <p className="mt-1 text-sm text-text-secondary">Close your term & health coverage gaps</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {insuranceProducts.map((p) => (
          <Card key={p.name}>
            <Badge variant={p.type.includes('Term') ? 'default' : 'success'}>{p.type}</Badge>
            <h2 className="mt-3 font-bold text-text-primary">{p.name}</h2>
            <div className="mt-4 text-sm text-text-secondary">Recommended cover</div>
            <div className="text-xl font-extrabold">{formatINR(p.cover)}</div>
            <div className="mt-2 text-sm font-semibold text-primary">{p.premium}</div>
          </Card>
        ))}
      </div>

      <Link to="/recommendations">
        <Button variant="secondary">Got it, Back to Strategy</Button>
      </Link>
    </div>
  )
}
