import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ requireCorporate = false }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-primary font-bold animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated && localStorage.getItem('mm_preview_mode') !== 'true') {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Simple placeholder logic for corporate access guard (if implemented later)
  if (requireCorporate && user?.role !== 'admin' && user?.role !== 'corporate') {
    // For now we just let them pass as we don't have a strict role in the mock yet, 
    // but we can enforce it if the backend returns a role.
    // return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
