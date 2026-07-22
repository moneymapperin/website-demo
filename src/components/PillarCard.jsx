import { Link } from 'react-router-dom'
import { Card } from './ui/Card'
import { getScoreLabel } from '../utils/helpers'

export function PillarCard({ pillar }) {
  const meta = getScoreLabel(pillar.score)
  return (
    <Link to={pillar.path} className="block transition hover:-translate-y-0.5">
      <Card className="h-full hover:border-primary/40">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-2xl">{pillar.icon}</span>
          <span className="text-xs font-bold" style={{ color: meta.color }}>
            {meta.emoji}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-text-secondary">{pillar.name}</h3>
        <div className="mt-1 flex items-end gap-1">
          <span className="text-2xl font-extrabold text-text-primary">{pillar.score}</span>
          <span className="mb-1 text-xs text-text-secondary">/100</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pillar.score}%`, backgroundColor: pillar.color || meta.color }}
          />
        </div>
      </Card>
    </Link>
  )
}
