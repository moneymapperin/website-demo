import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import {
  masterDataTabs,
  fieldLabels,
} from '../mockData/masterData'
import { useToast } from '../context/ToastContext'
import client from '../api/client'

export default function MasterData() {
  const { showToast } = useToast()
  const [tab, setTab] = useState('identity')
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const fetchMasterData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await client.get('/api/profile/master')
      setForm(res.data)
    } catch (err) {
      setError('Failed to load master data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMasterData()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await client.post('/api/profile/master', form)
      showToast('Profile synced successfully!')
    } catch (err) {
      showToast('Failed to sync profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [tab]: { ...prev[tab], [key]: value },
    }))
  }

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center animate-pulse">Loading profile data...</div>
  }

  if (error || !form) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-20">
        <p className="font-semibold text-danger">{error}</p>
        <Button onClick={fetchMasterData}>Retry</Button>
      </div>
    )
  }

  const fields = Object.keys(form[tab] || {})

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/profile" className="text-sm font-semibold text-primary hover:underline">
            ← Back to Profile
          </Link>
          <h1 className="mt-2 text-2xl font-extrabold">My Profile</h1>
          <p className="text-sm text-text-secondary">Edit master financial data</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Syncing...' : 'Sync / Save'}
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
          {fields.map((key) => {
            const val = form[tab][key]
            const isBool = typeof val === 'boolean'
            return (
              <Input
                key={key}
                label={fieldLabels[key] || key}
                value={val == null ? '' : isBool ? val.toString() : val}
                type={typeof val === 'number' ? 'number' : 'text'}
                onChange={(e) => {
                  let newVal = e.target.value
                  if (isBool) {
                    if (newVal === 'true') newVal = true
                    else if (newVal === 'false') newVal = false
                  } else if (typeof val === 'number') {
                    newVal = newVal ? Number(newVal) : 0
                  }
                  updateField(key, newVal)
                }}
              />
            )
          })}
        </div>
      </Card>
    </div>
  )
}
