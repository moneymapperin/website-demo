import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import client from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('mm_token'))
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const validateToken = useCallback(async () => {
    if (!token && localStorage.getItem('mm_preview_mode') !== 'true') {
      setIsLoading(false)
      setIsAuthenticated(false)
      setUser(null)
      return
    }

    if (localStorage.getItem('mm_preview_mode') === 'true') {
      try {
        const { currentUser } = await import('../mockData/user.js')
        setUser(currentUser)
        setIsAuthenticated(true)
      } catch (e) {
        console.error('Failed to load mock user', e)
      }
      setIsLoading(false)
      return
    }

    try {
      // Validate token using a simple backend call
      const res = await client.get('/api/dashboard')
      // If successful, we assume auth is good. Backend may return user details, but we will rely on token validity for now.
      setIsAuthenticated(true)
      // Attempt to load user if endpoint returns it, or fallback.
      setUser(res.data?.user || { email: 'user@example.com' }) // Fallback to basic user object
    } catch (err) {
      console.error('Token validation failed', err)
      logout()
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    validateToken()
  }, [validateToken])

  const login = async (email, password) => {
    try {
      const res = await client.post('/api/auth/login', { email, password })
      if (res.data.token) {
        localStorage.setItem('mm_token', res.data.token)
        setToken(res.data.token)
        setUser(res.data.user || { email })
        setIsAuthenticated(true)
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.status === 401 ? 'Invalid credentials' : 'Login failed' }
    }
  }

  const loginWithQr = (sessionToken, userData) => {
    localStorage.setItem('mm_token', sessionToken)
    setToken(sessionToken)
    setUser(userData || null)
    setIsAuthenticated(true)
  }

  const logout = () => {
    localStorage.removeItem('mm_token')
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
  }

  const register = async (userData) => {
    // Add real register logic later if backend provides endpoint
    console.warn('Register not fully implemented via API, mocking success')
    return { success: true }
  }

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    loginWithQr,
    logout,
    register,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
