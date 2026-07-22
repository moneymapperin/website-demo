import { Link } from 'react-router-dom'
import { Button } from './ui/Button'

export function PillarLayout({ title, headerColor, scoreRing, children, gap }) {
  return (
    <div className="-mx-4 -mt-6 md:-mx-8">
      <div className="px-4 pb-8 pt-6 text-white md:px-8" style={{ backgroundColor: headerColor }}>
        <Link to="/dashboard" className="mb-4 inline-flex text-sm font-semibold text-white/90 hover:text-white">
          ← Back to Dashboard
        </Link>
        <h1 className="text-2xl font-extrabold">{title}</h1>
        <div className="mt-6 flex justify-center">
          <div className="rounded-full bg-white/10 p-4 backdrop-blur">{scoreRing}</div>
        </div>
      </div>
      <div className="space-y-4 px-4 py-6 md:px-8">
        {children}
        {gap && (
          <div className="rounded-3xl border border-danger/30 bg-danger/5 p-5">
            <div className="text-sm font-bold text-danger">Gap / Shortfall</div>
            <p className="mt-1 text-sm text-text-secondary">{gap}</p>
          </div>
        )}
        <div className="pt-2">
          <Link to="/recommendations">
            <Button variant="secondary" className="w-full sm:w-auto">
              View AI Recommendations
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
