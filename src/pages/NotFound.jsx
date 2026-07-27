import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Logo } from '../components/AppShell'

export default function NotFound() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  // Redirect to login if user hits an unknown route while unauthenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <Logo size="lg" />
      <h1 className="mt-8 text-4xl font-extrabold text-text-primary">404</h1>
      <p className="mt-2 text-lg font-medium text-text-secondary">
        We couldn't find the page you're looking for.
      </p>
      <div className="mt-8">
        <Link to="/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}
