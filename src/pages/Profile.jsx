import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { DarkModeToggle } from '../components/AppShell'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { darkMode } = useTheme()
  const { showToast } = useToast()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [reminders, setReminders] = useState(true)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)

  const rowClass =
    'flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3.5 text-left text-sm font-semibold text-text-primary transition hover:border-primary/40'

  const handleLogout = () => {
    setLogoutOpen(false)
    logout()
    navigate('/login')
  }

  // Fallback if user object doesn't have some fields
  const displayUser = user || { name: 'User', email: '', city: '' }
  const avatarInitials = displayUser.name ? displayUser.name.substring(0, 2).toUpperCase() : 'U'

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-extrabold">Profile</h1>

      <Card className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-extrabold text-white">
          {avatarInitials}
        </div>
        <div>
          <div className="text-lg font-extrabold">{displayUser.name || 'Financial Fitness User'}</div>
          <div className="text-sm text-text-secondary">{displayUser.email}</div>
          <div className="text-xs text-text-secondary">{displayUser.city || 'India'}</div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold">Dark Mode</div>
            <div className="text-xs text-text-secondary">
              {darkMode ? 'Zinc Premium Dark' : 'Light'} theme
            </div>
          </div>
          <DarkModeToggle />
        </div>
      </Card>

      <div className="space-y-2">
        <Link to="/leaderboard" className={rowClass}>
          <span>Global Leaderboard</span>
          <span className="text-text-secondary">→</span>
        </Link>
        <Link to="/achievements" className={rowClass}>
          <span>Badges & Achievements</span>
          <span className="text-text-secondary">→</span>
        </Link>
        <button
          type="button"
          className={rowClass}
          onClick={() => {
            setReminders((v) => !v)
            showToast(reminders ? 'Weekly reminders off' : 'Weekly reminders on')
          }}
        >
          <span>Weekly Reminders</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${reminders ? 'bg-success/15 text-success' : 'bg-border text-text-secondary'}`}>
            {reminders ? 'ON' : 'OFF'}
          </span>
        </button>
        <Link to="/profile/master-data" className={rowClass}>
          <span>My Profile</span>
          <span className="text-text-secondary">→</span>
        </Link>
        <button type="button" className={rowClass} onClick={() => setAboutOpen(true)}>
          <span>About MoneyMapper</span>
          <span className="text-text-secondary">→</span>
        </button>
        <Link to="/privacy" className={rowClass}>
          <span>Privacy Policy</span>
          <span className="text-text-secondary">→</span>
        </Link>
      </div>

      <Button variant="danger" className="w-full" onClick={() => setLogoutOpen(true)}>
        Logout Session
      </Button>

      <Modal open={aboutOpen} onClose={() => setAboutOpen(false)} title="About MoneyMapper">
        <p>
          MoneyMapper helps you track financial fitness across five pillars — Income, Expenses,
          Emergency Fund, Protection, and Investment.
        </p>
        <p className="mt-3">Version 1.0.0 · Production</p>
      </Modal>

      <Modal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="Logout Session?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setLogoutOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleLogout}>
              Confirm Logout
            </Button>
          </>
        }
      >
        Are you sure you want to log out?
      </Modal>
    </div>
  )
}
