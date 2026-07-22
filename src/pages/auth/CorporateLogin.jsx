import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export default function CorporateLogin() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0F172A] text-sm font-extrabold text-white">
            TC
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-text-primary">Corporate Login</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Enterprise / HR access to Workforce Health
          </p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
            }}
          >
            <Input label="Work email" type="email" placeholder="hr@techcorp.in" defaultValue="hr@techcorp.in" />
            <Input label="Password" type="password" placeholder="••••••••" defaultValue="password" />
            <Input label="Organization code" placeholder="TECHCORP" defaultValue="TECHCORP" />
            <Button type="submit" className="w-full">
              Sign in to Admin
            </Button>
            <Link
              to="/corporate-dashboard"
              className="block text-center text-sm font-semibold text-primary hover:underline"
            >
              Preview Corporate Dashboard →
            </Link>
          </form>
        </div>
        <div className="mt-4 text-center text-sm">
          <Link to="/login" className="font-semibold text-text-secondary hover:text-primary">
            ← Personal Login
          </Link>
        </div>
      </div>
    </div>
  )
}
