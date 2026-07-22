import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Logo } from '../components/AppShell'

const steps = [
  {
    id: 1,
    title: 'Identity basics',
    fields: [
      { key: 'name', label: 'Full name', placeholder: 'Rahul Sharma' },
      { key: 'age', label: 'Age', placeholder: '28', type: 'number' },
      { key: 'city', label: 'City', placeholder: 'Bengaluru' },
    ],
  },
  {
    id: 2,
    title: 'Income sources',
    fields: [
      { key: 'activeIncome', label: 'Active income (₹/mo)', placeholder: '100000', type: 'number' },
      { key: 'passiveIncome', label: 'Passive income (₹/mo)', placeholder: '25000', type: 'number' },
    ],
  },
  {
    id: 3,
    title: 'Monthly expenses',
    fields: [
      { key: 'fixedExpenses', label: 'Fixed amount (₹)', placeholder: '42000', type: 'number' },
      { key: 'flexibleExpenses', label: 'Flexible amount (₹)', placeholder: '26000', type: 'number' },
      { key: 'currentSavings', label: 'Current savings (₹)', placeholder: '185000', type: 'number' },
    ],
  },
  {
    id: 4,
    title: 'Insurance',
    fields: [
      { key: 'termCover', label: 'Term cover (₹)', placeholder: '5000000', type: 'number' },
      { key: 'healthCover', label: 'Health cover (₹)', placeholder: '500000', type: 'number' },
    ],
  },
  {
    id: 5,
    title: 'Investments',
    fields: [
      { key: 'equity', label: 'Equity amount (₹)', placeholder: '552000', type: 'number' },
      { key: 'debt', label: 'Debt amount (₹)', placeholder: '276000', type: 'number' },
      { key: 'monthlySip', label: 'Monthly SIP (₹)', placeholder: '15000', type: 'number' },
    ],
  },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: 'Rahul Sharma',
    age: '28',
    city: 'Bengaluru',
    activeIncome: '100000',
    passiveIncome: '25000',
    fixedExpenses: '42000',
    flexibleExpenses: '26000',
    currentSavings: '185000',
    termCover: '5000000',
    healthCover: '500000',
    equity: '552000',
    debt: '276000',
    monthlySip: '15000',
  })

  const isReview = step === steps.length
  const current = steps[step]

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
      <div className="mb-6 flex justify-center">
        <Logo size="lg" compact />
      </div>

      <div className="mb-6 flex justify-center gap-2">
        {steps.map((s, i) => (
          <span
            key={s.id}
            className={`h-2.5 w-2.5 rounded-full ${i <= step ? 'bg-primary' : 'bg-border'}`}
          />
        ))}
        <span className={`h-2.5 w-2.5 rounded-full ${isReview ? 'bg-primary' : 'bg-border'}`} />
      </div>

      <Card>
        {!isReview ? (
          <>
            <div className="text-xs font-bold uppercase tracking-wide text-primary">
              Step {step + 1} of {steps.length}
            </div>
            <h1 className="mt-1 text-xl font-extrabold">{current.title}</h1>
            <div className="mt-5 space-y-3">
              {current.fields.map((f) => (
                <Input
                  key={f.key}
                  label={f.label}
                  type={f.type || 'text'}
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <h1 className="text-xl font-extrabold">Review & Submit</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Confirm your details. Submit navigates to dashboard (no real save).
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              {Object.entries(form).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-border py-1.5">
                  <dt className="capitalize text-text-secondary">{k.replace(/([A-Z])/g, ' $1')}</dt>
                  <dd className="font-semibold text-text-primary">{v}</dd>
                </div>
              ))}
            </dl>
          </>
        )}

        <div className="mt-6 flex justify-between gap-2">
          <Button
            variant="ghost"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Back
          </Button>
          {!isReview ? (
            <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
          ) : (
            <Button onClick={() => navigate('/dashboard')}>Submit</Button>
          )}
        </div>
      </Card>
    </div>
  )
}
