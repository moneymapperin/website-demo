import { ScoreGauge } from '../../components/ScoreGauge'
import { PillarLayout } from '../../components/PillarLayout'
import { Card } from '../../components/ui/Card'
import { pillarsData } from '../../mockData/pillars'
import { formatINR } from '../../utils/helpers'

export default function IncomePillar() {
  const d = pillarsData.income
  return (
    <PillarLayout
      title={d.title}
      headerColor={d.headerColor}
      scoreRing={<ScoreGauge score={d.score} size={160} />}
    >
      <Card>
        <div className="text-sm font-semibold text-text-secondary">Total Monthly Income</div>
        <div className="mt-1 text-3xl font-extrabold text-text-primary">
          {formatINR(d.totalMonthlyIncome)}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-bold text-text-primary">Income Breakdown</h2>
        <div className="space-y-4">
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-semibold text-text-primary">Active</span>
              <span className="text-text-secondary">
                {formatINR(d.activeIncome)} · {d.activePct}%
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-primary" style={{ width: `${d.activePct}%` }} />
            </div>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-semibold text-text-primary">Passive</span>
              <span className="text-text-secondary">
                {formatINR(d.passiveIncome)} · {d.passivePct}%
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-secondary" style={{ width: `${d.passivePct}%` }} />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="font-bold text-text-primary">Distribution Health</h2>
        <p className="mt-2 text-sm text-text-secondary">{d.distributionHealth}</p>
      </Card>
    </PillarLayout>
  )
}
