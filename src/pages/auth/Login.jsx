import { Link } from 'react-router-dom'
import { AuthLayout } from '../../components/AuthLayout'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export default function Login() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue your financial fitness journey"
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-bold text-primary hover:underline">
            Register
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
        }}
      >
        <Input label="Email" type="email" placeholder="you@email.com" defaultValue="rahul.sharma@email.com" />
        <Input label="Password" type="password" placeholder="••••••••" defaultValue="password" />
        <div className="text-right">
          <Link to="/reset-password" className="text-sm font-semibold text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full">
          Sign In
        </Button>
        <Link to="/corporate-login" className="block text-center text-sm font-semibold text-text-secondary hover:text-primary">
          Corporate / HR Login →
        </Link>
      </form>
    </AuthLayout>
  )
}
