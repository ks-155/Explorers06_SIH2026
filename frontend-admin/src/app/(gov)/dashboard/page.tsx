'use client';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { KpiCards } from '@/components/government/KpiCards';
import { mockGovDashboard, mockSkillGaps } from '@/mocks/govMock';

// Layout handles RBAC guard; this page just renders KPIs (mock Phase 3, live Phase 5)
export default function GovDashboardPage() {
  const m = mockGovDashboard;
  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Government Dashboard — Overview</h1>
      <p className="text-sm text-gray-500">
        Aggregate analytics only for <code>government/admin</code> per <code>API-CONTRACT.md 8</code>. Trainee/employer blocked client+server (403).
      </p>
      <KpiCards />
      <Card>
        <CardHeader className="font-medium">Retention (mock) — Phase 5 → Recharts LineChart 3m/6m/12m/24m</CardHeader>
        <CardContent className="text-sm text-gray-600">
          <div className="flex gap-2">
            {Object.entries(m.retention).map(([k, v]) => (
              <span key={k} className="px-2 py-1 bg-gray-50 rounded border text-xs">
                {k}: {v}%
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="font-medium">Wage progression (mock)</CardHeader>
        <CardContent className="text-sm text-gray-600">Start {m.wage_progression.start.toLocaleString()} → 6m {m.wage_progression.m6.toLocaleString()} → 12m {m.wage_progression.m12.toLocaleString()} (INR)</CardContent>
      </Card>
      <Card>
        <CardHeader className="font-medium">Skill gaps (mock) — Phase 5 → `GET /analytics/skill-gaps`</CardHeader>
        <CardContent className="space-y-2">
          {mockSkillGaps.map((g) => (
            <div key={g.skill} className="border rounded p-2 text-sm">
              <div className="font-medium">{g.skill} — {g.gap_type}</div>
              <div className="text-xs text-gray-500">{g.recommendation}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
