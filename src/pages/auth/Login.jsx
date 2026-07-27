import { Link } from 'react-router-dom'
import { AuthLayout } from '../../components/AuthLayout'
import { LoginForm } from '../../components/LoginForm'

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
      <LoginForm variant="user" redirectTo="/dashboard" />

      <div className="mt-6 text-center">
        <Link to="/corporate-login" className="text-sm font-semibold text-text-secondary hover:text-primary">
          Corporate / HR Login →
        </Link>
      </div>
    </AuthLayout>
  )
}
