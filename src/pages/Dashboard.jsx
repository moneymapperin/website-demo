import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { ScoreGauge } from '../components/ScoreGauge'
import { PillarCard } from '../components/PillarCard'
import { DashboardSkeleton } from '../components/Skeleton'
import { dashboardData } from '../mockData/dashboard'
import { currentUser, finTip } from '../mockData/user'

export default function Dashboard() {
  const [showSkeleton, setShowSkeleton] = useState(false)
  const data = dashboardData

  if (showSkeleton) {
    return (
      <div>
        <div className="mb-4 flex justify-end">
          <Button variant="ghost" onClick={() => setShowSkeleton(false)}>
            Hide Skeleton
          </Button>
        </div>
        <DashboardSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary md:text-3xl">
            Hi {currentUser.firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Here&apos;s your financial fitness snapshot
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="warning">🔥 {data.streakWeeks} WEEKS</Badge>
          <Button variant="ghost" className="!py-2 text-xs" onClick={() => setShowSkeleton(true)}>
            Dev: Skeleton
          </Button>
        </div>
      </div>

      <Card className="flex flex-col items-center py-8">
        <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-secondary">
          Global Fitness Score
        </p>
        <ScoreGauge score={data.globalScore} size={200} stroke={14} />
      </Card>

      <Card>
        <h2 className="text-base font-bold text-text-primary">Score Improvement</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-background p-4">
            <div className="text-xs font-semibold text-text-secondary">Starting Score</div>
            <div className="mt-1 text-2xl font-extrabold text-text-secondary">{data.startingScore}</div>
          </div>
          <div className="rounded-2xl bg-primary/10 p-4">
            <div className="text-xs font-semibold text-primary">Current Score</div>
            <div className="mt-1 text-2xl font-extrabold text-primary">{data.currentScore}</div>
          </div>
        </div>
        <div className="mt-3 text-sm font-semibold text-success">
          +{data.currentScore - data.startingScore} points since you started
        </div>
      </Card>

      <div>
        <h2 className="mb-3 text-base font-bold text-text-primary">Your 5 Pillars</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {data.pillars.map((p) => (
            <PillarCard key={p.id} pillar={p} />
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border-success/30 bg-success/5">
          <div className="text-xs font-bold uppercase tracking-wide text-success">Strongest Pillar</div>
          <div className="mt-2 text-lg font-extrabold text-text-primary">
            {data.strongestPillar.name}
          </div>
          <div className="text-sm text-text-secondary">Score {data.strongestPillar.score}/100</div>
        </Card>
        <Card className="border-warning/30 bg-warning/5">
          <div className="text-xs font-bold uppercase tracking-wide text-warning">Weakest Pillar</div>
          <div className="mt-2 text-lg font-extrabold text-text-primary">
            {data.weakestPillar.name}
          </div>
          <div className="text-sm text-text-secondary">Score {data.weakestPillar.score}/100</div>
        </Card>
      </div>

      <Card className="border-accent/30 bg-accent/5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🦉</span>
          <div>
            <h3 className="font-bold text-text-primary">Fin Says</h3>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">{finTip}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
