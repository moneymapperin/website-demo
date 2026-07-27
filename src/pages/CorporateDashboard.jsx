import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '../components/ui/Card'
import { ScoreGauge } from '../components/ScoreGauge'
import { corporateData } from '../mockData/corporate'
// TODO: wire to real endpoint when available
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function CorporateDashboard() {
  const d = corporateData

  return (
    <div className="min-h-screen bg-background px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-primary">B2B Admin</div>
            <h1 className="text-2xl font-extrabold md:text-3xl">Workforce Health</h1>
            <p className="mt-1 text-sm text-text-secondary">{d.orgName} · mock org analytics</p>
          </div>
          <Link to="/dashboard" className="text-sm font-semibold text-primary hover:underline">
            ← Consumer App
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="flex flex-col items-center py-6 md:col-span-1">
            <div className="mb-2 text-sm font-semibold text-text-secondary">Org Avg Fitness</div>
            <ScoreGauge score={d.avgFitnessScore} size={160} />
          </Card>
          <Card className="md:col-span-1">
            <div className="text-sm font-semibold text-text-secondary">Employees</div>
            <div className="mt-2 text-4xl font-extrabold text-text-primary">{d.employeeCount}</div>
            <p className="mt-2 text-sm text-text-secondary">Active enrolled workforce</p>
          </Card>
          <Card className="md:col-span-1">
            <div className="text-sm font-semibold text-text-secondary">Critical Band</div>
            <div className="mt-2 text-4xl font-extrabold text-danger">
              {d.riskBands.find((b) => b.name === 'Critical')?.value}
            </div>
            <p className="mt-2 text-sm text-text-secondary">Employees needing attention</p>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="mb-4 font-bold">Pillar-wise Org Averages</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.pillarAverages}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#4F46E5" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 font-bold">Risk-band Distribution</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={d.riskBands}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {d.riskBands.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 text-xs font-semibold">
              {d.riskBands.map((b) => (
                <span key={b.name} className="flex items-center gap-1.5 text-text-secondary">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.color }} />
                  {b.name} ({b.value})
                </span>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
