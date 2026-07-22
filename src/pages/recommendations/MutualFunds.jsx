import { Link } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { mutualFunds } from '../../mockData/recommendations'

export default function MutualFundsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">AI Recommended Funds</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Suggested allocation based on your moderate risk profile
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {mutualFunds.map((fund) => (
          <Card key={fund.name}>
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-bold text-text-primary">{fund.name}</h2>
              <Badge variant="accent">{fund.category}</Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-background p-3">
                <div className="text-xs text-text-secondary">3Y Return</div>
                <div className="text-lg font-extrabold text-success">{fund.return3Y}%</div>
              </div>
              <div className="rounded-2xl bg-background p-3">
                <div className="text-xs text-text-secondary">Allocation</div>
                <div className="text-lg font-extrabold text-primary">{fund.allocation}%</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Link to="/recommendations">
        <Button variant="secondary">Got it, Back to Strategy</Button>
      </Link>
    </div>
  )
}
