import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

export function LoginForm({ variant = 'user', redirectTo = '/dashboard' }) {
  const navigate = useNavigate()
  const { login, loginWithQr } = useAuth()
  const [activeTab, setActiveTab] = useState('password') // 'password' | 'qr'
  
  // Password state
  const [email, setEmail] = useState(variant === 'corporate' ? 'hr@techcorp.in' : 'rahul.sharma@email.com')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // QR state
  const [qrToken, setQrToken] = useState(null)
  const [qrStatus, setQrStatus] = useState('pending') // 'pending' | 'approved' | 'expired'
  const pollingRef = useRef(null)

  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await login(email, password)
    if (res.success) {
      navigate(redirectTo)
    } else {
      setError(res.error || 'Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const generateQr = async () => {
    try {
      setQrStatus('pending')
      setQrToken(null)
      const res = await client.post('/api/qr-login/generate', { loginType: variant })
      if (res.data.sessionToken) {
        setQrToken(res.data.sessionToken)
      }
    } catch (err) {
      console.error('Failed to generate QR code', err)
      // Fallback for UI demo
      setQrToken(`mock-session-${Date.now()}`)
    }
  }

  useEffect(() => {
    if (activeTab === 'qr') {
      generateQr()
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current)
      setQrToken(null)
      setQrStatus('pending')
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [activeTab])

  useEffect(() => {
    if (qrToken && qrStatus === 'pending') {
      pollingRef.current = setInterval(async () => {
        try {
          const res = await client.get(`/api/qr-login/status/${qrToken}`)
          if (res.data.status === 'approved') {
            clearInterval(pollingRef.current)
            setQrStatus('approved')
            if (res.data.token) {
              loginWithQr(res.data.token, res.data.user)
              navigate(redirectTo)
            }
          } else if (res.data.status === 'expired') {
            clearInterval(pollingRef.current)
            setQrStatus('expired')
          }
        } catch (err) {
          console.error('Polling error', err)
        }
      }, 3000)
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [qrToken, qrStatus, navigate, redirectTo])

  return (
    <>
      <div className="mb-6 flex rounded-xl bg-background p-1 shadow-inner">
        <button
          onClick={() => setActiveTab('password')}
          className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${
            activeTab === 'password' ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Password
        </button>
        <button
          onClick={() => setActiveTab('qr')}
          className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${
            activeTab === 'qr' ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Scan QR
        </button>
      </div>

      {activeTab === 'password' && (
        <form className="space-y-4" onSubmit={handlePasswordLogin}>
          {error && <div className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</div>}
          <Input 
            label="Email" 
            type="email" 
            name="email"
            placeholder="you@email.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input 
            label="Password" 
            type="password"
            name="password" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="text-right">
            <Link to="/reset-password" className="text-sm font-semibold text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
      )}

      {activeTab === 'qr' && (
        <div className="flex flex-col items-center justify-center space-y-6 py-4">
          {qrToken ? (
            <div className="relative">
              <div className={`rounded-2xl bg-white p-4 shadow-xl transition ${qrStatus === 'expired' ? 'opacity-30 blur-sm' : ''}`}>
                <QRCodeSVG value={`moneymapper://qr-login?token=${qrToken}`} size={200} />
              </div>
              {qrStatus === 'expired' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
                  <div className="rounded-full bg-danger/10 px-4 py-1 text-sm font-bold text-danger">
                    QR Expired
                  </div>
                  <Button onClick={generateQr} size="sm">
                    Generate New QR
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-[232px] w-[232px] items-center justify-center rounded-2xl bg-border/30">
              <span className="text-sm font-semibold text-text-secondary animate-pulse">Generating...</span>
            </div>
          )}
          <div className="text-center">
            <p className="text-sm font-semibold text-text-secondary">
              Scan this QR from the MoneyMapper app to log in
            </p>
          </div>
        </div>
      )}
    </>
  )
}
