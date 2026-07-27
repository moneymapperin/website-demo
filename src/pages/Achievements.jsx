// TODO: wire to real endpoint when available
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { achievements } from '../mockData/achievements'

export default function Achievements() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Badges & Achievements</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Unlock badges as you improve your financial fitness
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {achievements.map((badge) => (
          <Card
            key={badge.id}
            className={badge.unlocked ? '' : 'opacity-55 grayscale'}
          >
            <div className="text-3xl">{badge.icon}</div>
            <h2 className="mt-3 font-bold text-text-primary">{badge.title}</h2>
            <p className="mt-1 text-xs text-text-secondary">{badge.description}</p>
            <div className="mt-3">
              <Badge variant={badge.unlocked ? 'success' : 'muted'}>
                {badge.unlocked ? 'Unlocked' : 'Locked'}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
