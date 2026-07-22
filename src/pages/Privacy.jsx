import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <Link to="/profile" className="text-sm font-semibold text-primary hover:underline">
        ← Back
      </Link>
      <h1 className="text-3xl font-extrabold">Privacy Policy</h1>
      <p className="text-sm text-text-secondary">Last updated: July 22, 2026 · Placeholder text for UI demo</p>

      <Card className="space-y-4 text-sm leading-relaxed text-text-secondary">
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. MoneyMapper collects financial
          profile information you voluntarily provide to calculate fitness scores across income,
          expenses, emergency fund, protection, and investment pillars.
        </p>
        <p>
          Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
          veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
          nulla pariatur.
        </p>
        <h2 className="text-base font-bold text-text-primary">Data we process</h2>
        <p>
          Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit
          anim id est laborum. We may process contact details, income and expense figures, insurance
          covers, and investment holdings for scoring and recommendations.
        </p>
        <h2 className="text-base font-bold text-text-primary">Your choices</h2>
        <p>
          You may request export or deletion of your profile data. This web preview does not
          connect to a live backend; no real personal data is transmitted.
        </p>
        <h2 className="text-base font-bold text-text-primary">Contact</h2>
        <p>privacy@moneymapper.app (placeholder)</p>
      </Card>
    </div>
  )
}
