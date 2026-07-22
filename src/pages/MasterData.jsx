import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import {
  masterDataDefaults,
  masterDataTabs,
  fieldLabels,
} from '../mockData/masterData'
import { useToast } from '../context/ToastContext'

export default function MasterData() {
  const { showToast } = useToast()
  const [tab, setTab] = useState('identity')
  const [form, setForm] = useState(masterDataDefaults)

  const fields = Object.keys(form[tab] || {})

  const updateField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [tab]: { ...prev[tab], [key]: value },
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/profile" className="text-sm font-semibold text-primary hover:underline">
            ← Back to Profile
          </Link>
          <h1 className="mt-2 text-2xl font-extrabold">My Profile</h1>
          <p className="text-sm text-text-secondary">Edit master financial data (local mock)</p>
        </div>
        <Button
          onClick={() => showToast('Profile synced successfully!')}
        >
          Sync / Save
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {masterDataTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-2xl border px-4 py-2 text-sm font-bold ${
              tab === t.id
                ? 'border-primary bg-primary text-white'
                : 'border-border text-text-secondary hover:bg-border/40'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-bold capitalize">{tab} details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((key) => (
            <Input
              key={key}
              label={fieldLabels[key] || key}
              value={form[tab][key]}
              onChange={(e) => updateField(key, e.target.value)}
            />
          ))}
        </div>
      </Card>
    </div>
  )
}
