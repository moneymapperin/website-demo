import { useMemo, useState } from 'react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { ScoreGauge } from '../components/ScoreGauge'
import { weeklyInitialData } from '../mockData/weekly'
import { formatINR } from '../utils/helpers'
import { useToast } from '../context/ToastContext'

const heatColors = {
  missed: 'bg-danger/80',
  optimal: 'bg-success',
  safe: 'bg-warning',
}

export default function WeeklyTracker() {
  const { showToast } = useToast()
  const [data, setData] = useState(weeklyInitialData)
  const [activeWeekId, setActiveWeekId] = useState(data.currentWeekId)
  const [logOpen, setLogOpen] = useState(false)
  const [targetsOpen, setTargetsOpen] = useState(false)
  const [logForm, setLogForm] = useState({ groceries: '', dining: '', transport: '' })
  const [targetForm, setTargetForm] = useState(data.targets)
  const [incomeEdit, setIncomeEdit] = useState('')

  const week = useMemo(
    () => data.weeks.find((w) => w.id === activeWeekId) || data.weeks[0],
    [data, activeWeekId]
  )

  const openLog = () => {
    setLogForm({
      groceries: String(week.logged.groceries),
      dining: String(week.logged.dining),
      transport: String(week.logged.transport),
    })
    setLogOpen(true)
  }

  const confirmLog = () => {
    setData((prev) => ({
      ...prev,
      weeks: prev.weeks.map((w) =>
        w.id === activeWeekId
          ? {
              ...w,
              logged: {
                groceries: Number(logForm.groceries) || 0,
                dining: Number(logForm.dining) || 0,
                transport: Number(logForm.transport) || 0,
              },
              score: Math.min(100, Math.max(40, w.score + 2)),
            }
          : w
      ),
    }))
    setLogOpen(false)
    showToast('Week logged & score recalculated (mock)')
  }

  const saveTargets = () => {
    setData((prev) => ({ ...prev, targets: targetForm }))
    setTargetsOpen(false)
    showToast('Targets updated')
  }

  const saveIncome = () => {
    const n = Number(incomeEdit)
    if (!n) return
    setData((prev) => ({
      ...prev,
      weeks: prev.weeks.map((w) => (w.id === activeWeekId ? { ...w, income: n } : w)),
    }))
    setIncomeEdit('')
    showToast('Weekly income updated')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Weekly Expense Tracker</h1>
          <p className="mt-1 text-sm text-text-secondary">{week.range}</p>
        </div>
        <Badge variant="warning">🔥 {data.streakWeeks} Week Streak</Badge>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {data.weeks.map((w) => (
          <button
            key={w.id}
            onClick={() => setActiveWeekId(w.id)}
            className={`shrink-0 rounded-2xl border px-4 py-2 text-sm font-bold transition ${
              activeWeekId === w.id
                ? 'border-primary bg-primary text-white'
                : 'border-border text-text-secondary hover:bg-border/40'
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_200px]">
        <div className="grid gap-3 sm:grid-cols-3">
          {Object.entries(data.targets).map(([key, range]) => (
            <Card key={key}>
              <div className="text-xs font-bold uppercase tracking-wide text-text-secondary">{key}</div>
              <div className="mt-2 text-lg font-extrabold text-text-primary">
                {formatINR(week.logged[key])}
              </div>
              <div className="mt-1 text-xs text-text-secondary">
                Target {formatINR(range.min)} – {formatINR(range.max)}
              </div>
            </Card>
          ))}
        </div>
        <Card className="flex flex-col items-center justify-center">
          <ScoreGauge score={week.score} size={140} stroke={10} />
          <div className="mt-2 text-xs font-semibold text-text-secondary">Weekly Score</div>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={openLog}>Log This Week</Button>
        <Button variant="secondary" onClick={() => { setTargetForm(data.targets); setTargetsOpen(true) }}>
          Update Targets
        </Button>
      </div>

      <Card>
        <h2 className="mb-3 font-bold">Habit Heatmap</h2>
        <div className="grid grid-cols-7 gap-2">
          {data.dayLabels.map((d) => (
            <div key={d} className="text-center text-[10px] font-bold text-text-secondary">
              {d}
            </div>
          ))}
          {week.heatmap.map((status, i) => (
            <div
              key={i}
              title={status}
              className={`aspect-square rounded-xl ${heatColors[status]}`}
            />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-text-secondary">
          <span className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded bg-danger/80" /> Missed</span>
          <span className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded bg-warning" /> Safe</span>
          <span className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded bg-success" /> Optimal</span>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-bold">This week&apos;s income</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <div className="mb-1 text-sm text-text-secondary">Current: {formatINR(week.income)}</div>
            <Input
              type="number"
              placeholder="Update income"
              value={incomeEdit}
              onChange={(e) => setIncomeEdit(e.target.value)}
            />
          </div>
          <Button onClick={saveIncome}>Save</Button>
        </div>
      </Card>

      <Card className="border-accent/30 bg-accent/5">
        <h2 className="font-bold text-text-primary">Financial Observation</h2>
        <p className="mt-2 text-sm text-text-secondary">{week.observation}</p>
      </Card>

      <Modal
        open={logOpen}
        onClose={() => setLogOpen(false)}
        title="Log This Week"
        footer={
          <>
            <Button variant="ghost" onClick={() => setLogOpen(false)}>Cancel</Button>
            <Button onClick={confirmLog}>Confirm & Calculate Score</Button>
          </>
        }
      >
        <div className="space-y-3">
          {['groceries', 'dining', 'transport'].map((k) => (
            <Input
              key={k}
              label={`${k[0].toUpperCase()}${k.slice(1)} (₹)`}
              type="number"
              value={logForm[k]}
              onChange={(e) => setLogForm((f) => ({ ...f, [k]: e.target.value }))}
            />
          ))}
        </div>
      </Modal>

      <Modal
        open={targetsOpen}
        onClose={() => setTargetsOpen(false)}
        title="Update Targets"
        footer={
          <>
            <Button variant="ghost" onClick={() => setTargetsOpen(false)}>Cancel</Button>
            <Button onClick={saveTargets}>Save Targets</Button>
          </>
        }
      >
        <div className="space-y-4">
          {Object.keys(targetForm).map((key) => (
            <div key={key} className="grid grid-cols-2 gap-2">
              <Input
                label={`${key} min`}
                type="number"
                value={targetForm[key].min}
                onChange={(e) =>
                  setTargetForm((t) => ({
                    ...t,
                    [key]: { ...t[key], min: Number(e.target.value) },
                  }))
                }
              />
              <Input
                label={`${key} max`}
                type="number"
                value={targetForm[key].max}
                onChange={(e) =>
                  setTargetForm((t) => ({
                    ...t,
                    [key]: { ...t[key], max: Number(e.target.value) },
                  }))
                }
              />
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
