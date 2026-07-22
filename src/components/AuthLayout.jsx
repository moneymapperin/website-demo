import { Link } from 'react-router-dom'
import { Logo } from './AppShell'

export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size="lg" compact />
          <h1 className="mt-6 text-2xl font-extrabold text-text-primary">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-text-secondary">{subtitle}</p>}
        </div>
        <div className="rounded-3xl border border-border bg-card p-6">{children}</div>
        {footer && <div className="mt-4 text-center text-sm text-text-secondary">{footer}</div>}
        <div className="mt-6 text-center">
          <Link to="/dashboard" className="text-xs font-semibold text-primary hover:underline">
            Skip to Dashboard (UI preview)
          </Link>
        </div>
      </div>
    </div>
  )
}
