import { useState, useEffect } from 'react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { ScoreGauge } from '../components/ScoreGauge'
import { formatINR } from '../utils/helpers'
import { useToast } from '../context/ToastContext'
import client from '../api/client'

const heatColors = {
  missed: 'bg-danger/80',
  optimal: 'bg-success',
  safe: 'bg-warning',
}

export default function WeeklyTracker() {
  const { showToast } = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [activeWeekId, setActiveWeekId] = useState(null)
  const [logOpen, setLogOpen] = useState(false)
  const [targetsOpen, setTargetsOpen] = useState(false)
  const [logForm, setLogForm] = useState({ weeklyIncome: '', fixedSpend: '', flexSpend: '', savings: '' })
  const [targetForm, setTargetForm] = useState(null)
  const [incomeEdit, setIncomeEdit] = useState('')

  const fetchWeekly = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await client.get('/api/weekly/current')
      setData(res.data)
      if (res.data.currentWeekId && !activeWeekId) {
        setActiveWeekId(res.data.currentWeekId)
      } else if (!activeWeekId && res.data.weeks?.length > 0) {
        setActiveWeekId(res.data.weeks[0].id)
      }
      setTargetForm(res.data.targets)
    } catch (err) {
      setError('Failed to load weekly tracker data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWeekly()
  }, [])

  if (loading) {
    return <div className="animate-pulse flex min-h-[50vh] items-center justify-center">Loading weekly data...</div>
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-20">
        <p className="font-semibold text-danger">{error || 'No data found'}</p>
        <Button onClick={fetchWeekly}>Retry</Button>
      </div>
    )
  }

  const week = data.weeks?.find((w) => w.id === activeWeekId) || data.weeks?.[0]
  if (!week) return <div className="py-20 text-center">No weeks found.</div>

  const openLog = () => {
    setLogForm({
      weeklyIncome: String(week.income || ''),
      fixedSpend: String(week.logged?.fixed_expenses || ''),
      flexSpend: String(week.logged?.flexible_expenses || ''),
      savings: String(week.logged?.savings || ''),
    })
    setLogOpen(true)
  }

  const confirmLog = async () => {
    try {
      await client.post('/api/weekly/submit', {
        weekId: activeWeekId,
        income: Number(logForm.weeklyIncome) || week.income,
        logged: {
          fixed_expenses: Number(logForm.fixedSpend) || 0,
          flexible_expenses: Number(logForm.flexSpend) || 0,
          savings: Number(logForm.savings) || 0,
        }
      })
      showToast('Week logged successfully')
      setLogOpen(false)
      fetchWeekly()
    } catch (err) {
      showToast('Failed to log week', 'error')
    }
  }

  const saveTargets = async () => {
    try {
      await client.post('/api/weekly/redgreen', { targets: targetForm })
      showToast('Targets updated')
      setTargetsOpen(false)
      fetchWeekly()
    } catch (err) {
      showToast('Failed to update targets', 'error')
    }
  }

  const saveIncome = async () => {
    const n = Number(incomeEdit)
    if (!n) return
    try {
      await client.post('/api/weekly/submit', {
        weekId: activeWeekId,
        income: n,
        logged: week.logged
      })
      showToast('Weekly income updated')
      setIncomeEdit('')
      fetchWeekly()
    } catch (err) {
      showToast('Failed to update income', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Weekly Expense Tracker</h1>
          <p className="mt-1 text-sm text-text-secondary">{week.range}</p>
        </div>
        {data.streakWeeks != null && (
          <Badge variant="warning">🔥 {data.streakWeeks} Week Streak</Badge>
        )}
      </div>

      {data.weeks && (
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
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_200px]">
        {data.targets && week.logged && (
          <div className="grid gap-3 sm:grid-cols-3">
            {Object.entries(data.targets).map(([key, range]) => {
              const mappedKey = key === 'fixed' ? 'fixed_expenses' : key === 'flexible' ? 'flexible_expenses' : 'savings';
              return (
                <Card key={key}>
                  <div className="text-xs font-bold uppercase tracking-wide text-text-secondary">{key}</div>
                  <div className="mt-2 text-lg font-extrabold text-text-primary">
                    {formatINR(week.logged[mappedKey])}
                  </div>
                  <div className="mt-1 text-xs text-text-secondary">
                    Target {formatINR(range.min)} – {formatINR(range.max)}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
        <Card className="flex flex-col items-center justify-center">
          <ScoreGauge score={week.discipline_score || 0} size={140} stroke={10} />
          <div className="mt-2 text-xs font-semibold text-text-secondary">Weekly Score</div>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={openLog}>Log This Week</Button>
        <Button variant="secondary" onClick={() => { setTargetForm(data.targets); setTargetsOpen(true) }}>
          Update Targets
        </Button>
      </div>

      {data.dayLabels && week.heatmap && (
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
                className={`aspect-square rounded-xl ${heatColors[status] || 'bg-border'}`}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-text-secondary">
            <span className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded bg-danger/80" /> Missed</span>
            <span className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded bg-warning" /> Safe</span>
            <span className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded bg-success" /> Optimal</span>
          </div>
        </Card>
      )}

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

      {week.observation && (
        <Card className="border-accent/30 bg-accent/5">
          <h2 className="font-bold text-text-primary">Financial Observation</h2>
          <p className="mt-2 text-sm text-text-secondary">{week.observation}</p>
        </Card>
      )}

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
          {[
            { key: 'weeklyIncome', label: 'Weekly Income' },
            { key: 'fixedSpend', label: 'Fixed Spend' },
            { key: 'flexSpend', label: 'Flexible Spend' },
            { key: 'savings', label: 'Savings' }
          ].map(({key, label}) => (
            <Input
              key={key}
              label={`${label} (₹)`}
              type="number"
              value={logForm[key]}
              onChange={(e) => setLogForm((f) => ({ ...f, [key]: e.target.value }))}
            />
          ))}
        </div>
      </Modal>

      {targetForm && (
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
      )}
    </div>
  )
}
