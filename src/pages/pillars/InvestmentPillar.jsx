import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { ScoreGauge } from '../../components/ScoreGauge'
import { PillarLayout } from '../../components/PillarLayout'
import { Card } from '../../components/ui/Card'
import { pillarsData } from '../../mockData/pillars'
import { formatINR } from '../../utils/helpers'

const COLORS = ['#4F46E5', '#10B981', '#F59E0B']

export default function InvestmentPillar() {
  const d = pillarsData.investment
  const pieData = [
    { name: 'Equity', value: d.equityPct },
    { name: 'Debt', value: d.debtPct },
    { name: 'Gold', value: d.goldPct },
  ]

  return (
    <PillarLayout
      title={d.title}
      headerColor={d.headerColor}
      scoreRing={<ScoreGauge score={d.score} size={160} />}
      gap={`Monthly SIP shortfall of ${formatINR(d.sipShortfall)}. Current SIP ${formatINR(d.monthlySip)} vs recommended ${formatINR(d.recommendedSip)}.`}
    >
      <Card>
        <div className="text-sm font-semibold text-text-secondary">Total Wealth Assets</div>
        <div className="mt-1 text-3xl font-extrabold">{formatINR(d.totalWealth)}</div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Equity', value: d.equity, pct: d.equityPct },
          { label: 'Debt', value: d.debt, pct: d.debtPct },
          { label: 'Gold', value: d.gold, pct: d.goldPct },
        ].map((item) => (
          <Card key={item.label}>
            <div className="text-xs font-semibold text-text-secondary">{item.label}</div>
            <div className="mt-1 text-lg font-extrabold">{formatINR(item.value)}</div>
            <div className="text-xs text-text-secondary">{item.pct}%</div>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="mb-2 font-bold text-text-primary">Allocation Breakdown</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v}%`, 'Allocation']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-4 text-xs font-semibold">
          {pieData.map((p, i) => (
            <span key={p.name} className="flex items-center gap-1.5 text-text-secondary">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i] }} />
              {p.name} {p.value}%
            </span>
          ))}
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border-success/30">
          <div className="text-xs font-bold text-success">Monthly SIP</div>
          <div className="mt-1 text-2xl font-extrabold">{formatINR(d.monthlySip)}</div>
        </Card>
        <Card className="border-danger/30">
          <div className="text-xs font-bold text-danger">Monthly Shortfall</div>
          <div className="mt-1 text-2xl font-extrabold">{formatINR(d.sipShortfall)}</div>
        </Card>
      </div>
    </PillarLayout>
  )
}
