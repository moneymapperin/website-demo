import { Link } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { savingsInstruments } from '../../mockData/recommendations'

export default function SavingsRecsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">AI Recommended Parking</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Instruments for emergency & short-term surplus
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {savingsInstruments.map((item) => (
          <Card key={item.name}>
            <Badge variant="warning">{item.type}</Badge>
            <h2 className="mt-3 font-bold text-text-primary">{item.name}</h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-background p-3">
                <div className="text-xs text-text-secondary">Expected</div>
                <div className="font-extrabold text-success">{item.expectedReturn}</div>
              </div>
              <div className="rounded-2xl bg-background p-3">
                <div className="text-xs text-text-secondary">Liquidity</div>
                <div className="font-extrabold text-text-primary">{item.liquidity}</div>
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
