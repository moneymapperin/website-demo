import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { useApi } from '../../hooks/useApi'
import client from '../../api/client'

export default function Recommendations() {
  const fetchRecs = useCallback(() => client.get('/api/ai/recommend'), [])
  const { data, loading, error, execute } = useApi(fetchRecs)

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center animate-pulse">Loading AI insights...</div>
  if (error || !data) return (
    <div className="flex flex-col items-center justify-center space-y-4 py-20">
      <p className="font-semibold text-danger">{error || 'Failed to load'}</p>
      <button onClick={execute} className="text-primary hover:underline">Retry</button>
    </div>
  )

  const { hub = [] } = data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">AI Recommendations</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Personalized strategy cards powered by Fin 🦉
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {hub.map((item) => (
          <Link key={item.id} to={item.path} className="block transition hover:-translate-y-0.5">
            <Card className="h-full hover:border-primary/40">
              <div className="text-3xl">{item.icon}</div>
              <h2 className="mt-3 text-lg font-extrabold text-text-primary">{item.title}</h2>
              <p className="mt-1 text-sm text-text-secondary">{item.subtitle}</p>
              <p className="mt-4 rounded-2xl bg-accent/10 px-3 py-2 text-xs font-semibold text-accent">
                🦉 {item.tip}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
