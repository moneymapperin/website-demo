import { NavLink } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { currentUser } from '../mockData/user'
import { cn } from '../utils/helpers'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/weekly', label: 'Weekly Tracker', icon: '📅' },
  { to: '/recommendations', label: 'AI Recommendations', icon: '🦉' },
  { to: '/achievements', label: 'Achievements', icon: '🏆' },
  { to: '/profile', label: 'Profile', icon: '👤' },
]

function Logo({ compact = false, size = 'md' }) {
  const sizes = {
    sm: 'h-9 w-9',
    md: compact ? 'h-10 w-10' : 'h-14 w-14',
    lg: 'h-28 w-28',
  }

  return (
    <img
      src="/money-mapper-logo.png"
      alt="MoneyMapper"
      className={`${sizes[size] || sizes.md} shrink-0 object-contain`}
    />
  )
}

function DarkModeToggle({ className = '' }) {
  const { darkMode, toggleDarkMode } = useTheme()
  return (
    <button
      onClick={toggleDarkMode}
      className={cn(
        'rounded-2xl border border-border px-3 py-2 text-sm font-semibold text-text-secondary hover:bg-border/40',
        className
      )}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
    >
      {darkMode ? '☀️ Light' : '🌙 Dark'}
    </button>
  )
}

export function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card p-5 md:flex">
        <Logo />
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:bg-border/50 hover:text-text-primary'
                )
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 rounded-2xl border border-border bg-background p-3">
          <div className="text-xs font-bold uppercase tracking-wide text-text-secondary">
            Dev Preview
          </div>
          <NavLink
            to="/login"
            className="mt-2 block text-sm font-semibold text-primary hover:underline"
          >
            Auth Screens (Preview)
          </NavLink>
          <NavLink
            to="/corporate-dashboard"
            className="mt-1 block text-sm font-semibold text-primary hover:underline"
          >
            Corporate Dashboard
          </NavLink>
          <NavLink
            to="/onboarding"
            className="mt-1 block text-sm font-semibold text-primary hover:underline"
          >
            Onboarding
          </NavLink>
        </div>
      </aside>

      {/* Main column */}
      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/90 px-4 py-3 backdrop-blur md:px-8">
          <div className="md:hidden">
            <Logo compact />
          </div>
          <div className="hidden text-sm font-semibold text-text-secondary md:block">
            Your financial fitness cockpit
          </div>
          <div className="flex items-center gap-3">
            <DarkModeToggle />
            <div className="flex items-center gap-2 rounded-2xl border border-border px-2 py-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {currentUser.avatarInitials}
              </div>
              <span className="hidden text-sm font-semibold sm:inline">{currentUser.name}</span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 pb-28 md:px-8 md:pb-10">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-between px-1 py-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-semibold',
                  isActive ? 'text-primary' : 'text-text-secondary'
                )
              }
            >
              <span className="text-base">{item.icon}</span>
              <span className="truncate">{item.label.split(' ')[0]}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

export { Logo, DarkModeToggle }
