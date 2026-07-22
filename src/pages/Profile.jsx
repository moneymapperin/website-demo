import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { DarkModeToggle } from '../components/AppShell'
import { currentUser } from '../mockData/user'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'

export default function Profile() {
  const { darkMode } = useTheme()
  const { showToast } = useToast()
  const [reminders, setReminders] = useState(true)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)

  const rowClass =
    'flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3.5 text-left text-sm font-semibold text-text-primary transition hover:border-primary/40'

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-extrabold">Profile</h1>

      <Card className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-extrabold text-white">
          {currentUser.avatarInitials}
        </div>
        <div>
          <div className="text-lg font-extrabold">{currentUser.name}</div>
          <div className="text-sm text-text-secondary">{currentUser.email}</div>
          <div className="text-xs text-text-secondary">{currentUser.city}</div>
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
        <button type="button" className={rowClass} onClick={() => setExportOpen(true)}>
          <span>Export Financial Profile</span>
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
          Emergency Fund, Protection, and Investment. This web UI is a static demo clone of the
          Flutter app.
        </p>
        <p className="mt-3">Version 1.0.0 · UI Preview</p>
      </Modal>

      <Modal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export Financial Profile"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setExportOpen(false)
                showToast('CSV export queued (mock)')
              }}
            >
              Export CSV
            </Button>
            <Button
              onClick={() => {
                setExportOpen(false)
                showToast('JSON export queued (mock)')
              }}
            >
              Export JSON
            </Button>
          </>
        }
      >
        Choose a format. No real file download in this UI-only iteration.
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
            <Button
              variant="danger"
              onClick={() => {
                setLogoutOpen(false)
                showToast('Logged out (mock — still on app)', 'warning')
              }}
            >
              Confirm Logout
            </Button>
          </>
        }
      >
        This is a UI preview — logout will not clear a real session.
      </Modal>
    </div>
  )
}
