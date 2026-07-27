import { Link } from 'react-router-dom'
import { LoginForm } from '../../components/LoginForm'

export default function CorporateLogin() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0F172A] text-sm font-extrabold text-white">
            TC
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-text-primary">Corporate / Workforce Health Login</h1>
          <p className="mt-2 text-sm">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              For HR & Enterprise Admins
            </span>
          </p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6">
          <LoginForm variant="corporate" redirectTo="/corporate-dashboard" />
        </div>
        <div className="mt-4 text-center text-sm">
          <Link to="/login" className="font-semibold text-text-secondary hover:text-primary">
            Not an admin? Go to regular login
          </Link>
        </div>
      </div>
    </div>
  )
}
