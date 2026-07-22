import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ScoreGauge } from '../../components/ScoreGauge'
import { PillarLayout } from '../../components/PillarLayout'
import { Card } from '../../components/ui/Card'
import { pillarsData } from '../../mockData/pillars'
import { formatINR } from '../../utils/helpers'

export default function ExpensesPillar() {
  const d = pillarsData.expenses
  const chartData = [
    { name: 'Fixed', value: d.fixedPct, amount: d.fixed },
    { name: 'Flexible', value: d.flexiblePct, amount: d.flexible },
    { name: 'Savings', value: d.savingsPct, amount: d.savings },
  ]

  return (
    <PillarLayout
      title={d.title}
      headerColor={d.headerColor}
      scoreRing={<ScoreGauge score={d.score} size={160} />}
      gap={d.gap}
    >
      <Card>
        <div className="text-sm font-semibold text-text-secondary">Total Monthly Expenses</div>
        <div className="mt-1 text-3xl font-extrabold text-text-primary">
          {formatINR(d.totalMonthlyExpenses)}
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Fixed', value: d.fixed, pct: d.fixedPct },
          { label: 'Flexible', value: d.flexible, pct: d.flexiblePct },
          { label: 'Savings', value: d.savings, pct: d.savingsPct },
        ].map((item) => (
          <Card key={item.label}>
            <div className="text-xs font-semibold text-text-secondary">{item.label}</div>
            <div className="mt-1 text-lg font-extrabold">{formatINR(item.value)}</div>
            <div className="text-xs text-text-secondary">{item.pct}%</div>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="mb-4 font-bold text-text-primary">Expense Mix</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(v, _n, props) => [`${v}% (${formatINR(props.payload.amount)})`, 'Share']}
              />
              <Bar dataKey="value" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </PillarLayout>
  )
}
