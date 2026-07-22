import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '../../components/AuthLayout'
import { Button } from '../../components/ui/Button'

export default function VerifyOtp() {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])

  const update = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[index] = digit
    setOtp(next)
    if (digit && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  return (
    <AuthLayout
      title="Verify OTP"
      subtitle="Enter the 6-digit code sent to your phone"
      footer={
        <Link to="/login" className="font-bold text-primary hover:underline">
          Back to Login
        </Link>
      }
    >
      <div className="flex justify-center gap-2">
        {otp.map((d, i) => (
          <input
            key={i}
            id={`otp-${i}`}
            value={d}
            onChange={(e) => update(i, e.target.value)}
            maxLength={1}
            className="h-12 w-10 rounded-2xl border border-border bg-background text-center text-lg font-bold outline-none focus:border-2 focus:border-primary"
          />
        ))}
      </div>
      <Button className="mt-6 w-full" type="button">
        Verify
      </Button>
      <button type="button" className="mt-4 w-full text-sm font-semibold text-text-secondary">
        Resend code in 0:30
      </button>
    </AuthLayout>
  )
}
