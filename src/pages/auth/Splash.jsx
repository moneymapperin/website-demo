import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../../components/AppShell'

export default function Splash() {
  const navigate = useNavigate()

  useEffect(() => {
    const t = setTimeout(() => navigate('/dashboard'), 1800)
    return () => clearTimeout(t)
  }, [navigate])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Logo size="lg" compact />
      <div className="mt-10 h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary" />
      <p className="mt-4 text-sm font-semibold text-text-secondary">Loading MoneyMapper…</p>
      <Link to="/dashboard" className="mt-8 text-xs font-semibold text-primary hover:underline">
        Continue to Dashboard
      </Link>
    </div>
  )
}
