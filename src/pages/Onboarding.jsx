import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Logo } from '../components/AppShell'
import client from '../api/client'
import { useToast } from '../context/ToastContext'

const steps = [
  {
    id: 1,
    title: 'Identity',
    fields: [
      { key: 'fullName', label: 'Full name', placeholder: 'Rahul Sharma' },
      { key: 'mobile', label: 'Mobile', placeholder: '+91 98765 43210' },
      { key: 'city', label: 'City', placeholder: 'Bengaluru' },
      { key: 'employmentType', label: 'Employment Type', placeholder: 'Salaried' },
    ],
  },
  {
    id: 2,
    title: 'Income',
    fields: [
      { key: 'monthlyActiveIncome', label: 'Monthly Active Income (₹)', placeholder: '100000', type: 'number' },
      { key: 'hasPassiveIncome', label: 'Has Passive Income?', placeholder: 'true', type: 'text' },
      { key: 'passiveIncomeAmount', label: 'Passive Income Amount (₹)', placeholder: '25000', type: 'number' },
    ],
  },
  {
    id: 3,
    title: 'Expenses',
    fields: [
      { key: 'monthlyFixedExpenses', label: 'Monthly Fixed Expenses (₹)', placeholder: '42000', type: 'number' },
      { key: 'monthlyVariableExpenses', label: 'Monthly Variable Expenses (₹)', placeholder: '26000', type: 'number' },
      { key: 'totalEmi', label: 'Total EMI (₹)', placeholder: '25000', type: 'number' },
    ],
  },
  {
    id: 4,
    title: 'Emergency Fund',
    fields: [
      { key: 'hasEmergencyFund', label: 'Has Emergency Fund?', placeholder: 'true', type: 'text' },
      { key: 'emergencyFundRange', label: 'Emergency Fund Range', placeholder: '1-3L' },
    ],
  },
  {
    id: 5,
    title: 'Protection',
    fields: [
      { key: 'hasHealthInsurance', label: 'Has Health Insurance?', placeholder: 'true', type: 'text' },
      { key: 'healthCover', label: 'Health cover (₹)', placeholder: '500000', type: 'number' },
      { key: 'hasTermPlan', label: 'Has Term Plan?', placeholder: 'true', type: 'text' },
      { key: 'termCover', label: 'Term cover (₹)', placeholder: '5000000', type: 'number' },
    ],
  },
  {
    id: 6,
    title: 'Investment',
    fields: [
      { key: 'doesInvest', label: 'Do you invest?', placeholder: 'true', type: 'text' },
      { key: 'monthlyInvestment', label: 'Monthly Investment (₹)', placeholder: '15000', type: 'number' },
      { key: 'existingPortfolio', label: 'Existing Portfolio (₹)', placeholder: '920000', type: 'number' },
    ],
  },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    fullName: 'Rahul Sharma',
    mobile: '+91 98765 43210',
    city: 'Bengaluru',
    employmentType: 'Salaried',
    monthlyActiveIncome: '100000',
    hasPassiveIncome: 'true',
    passiveIncomeAmount: '25000',
    monthlyFixedExpenses: '42000',
    monthlyVariableExpenses: '26000',
    totalEmi: '25000',
    hasEmergencyFund: 'true',
    emergencyFundRange: '1-3L',
    hasHealthInsurance: 'true',
    healthCover: '500000',
    hasTermPlan: 'true',
    termCover: '5000000',
    doesInvest: 'true',
    monthlyInvestment: '15000',
    existingPortfolio: '920000',
  })

  const isReview = step === steps.length
  const current = steps[step]

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Map form values to appropriate types for the backend
      const payload = {
        identity: {
          fullName: form.fullName,
          mobile: form.mobile,
          city: form.city,
          employmentType: form.employmentType,
        },
        income: {
          monthlyActiveIncome: Number(form.monthlyActiveIncome) || 0,
          hasPassiveIncome: form.hasPassiveIncome === 'true',
          passiveIncomeAmount: Number(form.passiveIncomeAmount) || 0,
        },
        expenses: {
          monthlyFixedExpenses: Number(form.monthlyFixedExpenses) || 0,
          monthlyVariableExpenses: Number(form.monthlyVariableExpenses) || 0,
          totalEmi: Number(form.totalEmi) || 0,
        },
        emergencyFund: {
          hasEmergencyFund: form.hasEmergencyFund === 'true',
          emergencyFundRange: form.emergencyFundRange,
        },
        protection: {
          hasHealthInsurance: form.hasHealthInsurance === 'true',
          healthCover: Number(form.healthCover) || 0,
          hasTermPlan: form.hasTermPlan === 'true',
          termCover: Number(form.termCover) || 0,
        },
        investment: {
          doesInvest: form.doesInvest === 'true',
          monthlyInvestment: Number(form.monthlyInvestment) || 0,
          existingPortfolio: Number(form.existingPortfolio) || 0,
        }
      }

      await client.post('/api/monthly/onboard', payload)
      showToast('Onboarding complete!')
      navigate('/dashboard')
    } catch (err) {
      showToast('Failed to save onboarding data', 'error')
    } finally {
      setLoading(false)
    }
  }

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
              Confirm your details.
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
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
