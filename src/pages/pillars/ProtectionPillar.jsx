import { ScoreGauge } from '../../components/ScoreGauge'
import { PillarLayout } from '../../components/PillarLayout'
import { Card } from '../../components/ui/Card'
import { pillarsData } from '../../mockData/pillars'
import { formatINR } from '../../utils/helpers'

export default function ProtectionPillar() {
  const d = pillarsData.protection
  return (
    <PillarLayout
      title={d.title}
      headerColor={d.headerColor}
      scoreRing={<ScoreGauge score={d.score} size={160} />}
      gap={d.coverageHealth}
    >
      <Card>
        <h2 className="mb-4 font-bold text-text-primary">Coverage Health</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-background p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-text-secondary">Term Life</div>
            <div className="mt-2 text-xl font-extrabold">{formatINR(d.termCover)}</div>
            <div className="mt-1 text-xs text-text-secondary">
              Recommended {formatINR(d.termRecommended)}
            </div>
            <div className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-xs font-semibold text-danger">
              Gap {formatINR(d.termGap)}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-background p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-text-secondary">Health</div>
            <div className="mt-2 text-xl font-extrabold">{formatINR(d.healthCover)}</div>
            <div className="mt-1 text-xs text-text-secondary">
              Recommended {formatINR(d.healthRecommended)}
            </div>
            <div className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-xs font-semibold text-danger">
              Gap {formatINR(d.healthGap)}
            </div>
          </div>
        </div>
      </Card>
    </PillarLayout>
  )
}
