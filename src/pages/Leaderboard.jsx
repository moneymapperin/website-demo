// TODO: wire to real endpoint when available
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { leaderboard } from '../mockData/achievements'

export default function Leaderboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Global Leaderboard</h1>
        <p className="mt-1 text-sm text-text-secondary">Mock ranks by Global Fitness Score</p>
      </div>

      <Card className="overflow-hidden !p-0">
        <div className="grid grid-cols-[48px_1fr_80px] gap-2 border-b border-border bg-background px-4 py-3 text-xs font-bold uppercase tracking-wide text-text-secondary">
          <span>Rank</span>
          <span>Name</span>
          <span className="text-right">Score</span>
        </div>
        {leaderboard.map((row) => (
          <div
            key={row.rank}
            className={`grid grid-cols-[48px_1fr_80px] items-center gap-2 border-b border-border px-4 py-3 last:border-0 ${
              row.isYou ? 'bg-primary/5' : ''
            }`}
          >
            <span className="font-extrabold text-text-primary">#{row.rank}</span>
            <div>
              <div className="flex items-center gap-2 font-semibold">
                {row.name}
                {row.isYou && <Badge variant="default">You</Badge>}
              </div>
              <div className="text-xs text-text-secondary">{row.city}</div>
            </div>
            <span className="text-right text-lg font-extrabold text-primary">{row.score}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}
