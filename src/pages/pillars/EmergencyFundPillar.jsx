import { useState } from 'react'
import { ScoreGauge } from '../../components/ScoreGauge'
import { PillarLayout } from '../../components/PillarLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { pillarsData } from '../../mockData/pillars'
import { formatINR } from '../../utils/helpers'
import { useToast } from '../../context/ToastContext'

export default function EmergencyFundPillar() {
  const initial = pillarsData.emergencyFund
  const [fund, setFund] = useState(initial.currentFund)
  const [amount, setAmount] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { showToast } = useToast()

  const target = initial.targetFund
  const completionPct = Math.min(Math.round((fund / target) * 100), 100)
  const shortfall = Math.max(target - fund, 0)

  const confirmAdd = () => {
    const n = Number(amount)
    if (!n || n <= 0) return
    setFund((f) => f + n)
    setAmount('')
    setConfirmOpen(false)
    showToast(`Added ${formatINR(n)} to Emergency Fund`)
  }

  return (
    <PillarLayout
      title={initial.title}
      headerColor={initial.headerColor}
      scoreRing={<ScoreGauge score={initial.score} size={160} />}
      gap={`Shortfall of ${formatINR(shortfall)} to reach ${initial.targetMonths}-month cover.`}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <div className="text-sm font-semibold text-text-secondary">Current Estimated Fund</div>
          <div className="mt-1 text-2xl font-extrabold">{formatINR(fund)}</div>
          <div className="mt-1 text-xs text-text-secondary">
            ~{((fund / (target / initial.targetMonths))).toFixed(1)} months covered
          </div>
        </Card>
        <Card>
          <div className="text-sm font-semibold text-text-secondary">Target Fund</div>
          <div className="mt-1 text-2xl font-extrabold">{formatINR(target)}</div>
          <div className="mt-1 text-xs text-text-secondary">{initial.targetMonths} months of expenses</div>
        </Card>
      </div>

      <Card>
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-bold text-text-primary">Fund Completion</span>
          <span className="font-semibold text-warning">{completionPct}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-border">
          <div className="h-full rounded-full bg-warning" style={{ width: `${completionPct}%` }} />
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-bold text-text-primary">Add to Emergency Fund</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            label="Amount (₹)"
            type="number"
            placeholder="e.g. 5000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <div className="flex items-end">
            <Button className="w-full sm:w-auto" onClick={() => amount && setConfirmOpen(true)}>
              Confirm Add
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm contribution"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmAdd}>Confirm</Button>
          </>
        }
      >
        Add {formatINR(Number(amount) || 0)} to your emergency fund? (local mock only)
      </Modal>
    </PillarLayout>
  )
}
