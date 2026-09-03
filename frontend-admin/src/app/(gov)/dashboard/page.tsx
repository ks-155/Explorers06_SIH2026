'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { KpiCards } from '@/components/government/KpiCards';
import { RetentionChart } from '@/components/government/RetentionChart';
import { WageChart } from '@/components/government/WageChart';
import { mockGovDashboard, mockSkillGaps } from '@/mocks/govMock';
import { getAnalyticsDashboard, getSkillGaps } from '@/lib/api';
import { loadAuth } from '@/lib/auth';

// Layout handles RBAC; this page fetches live analytics with mock fallback (M2-02)
export default function GovDashboardPage() {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const a = loadAuth();
    if (a) setToken(a.accessToken);
  }, []);
  const enabled = !!token;

  const dashQ = useQuery({
    queryKey: ['gov-dashboard'],
    queryFn: () => getAnalyticsDashboard(token!),
    enabled,
    staleTime: 30_000,
    retry: 1,
  });

  const gapsQ = useQuery({
    queryKey: ['skill-gaps'],
    queryFn: () => getSkillGaps(token!),
    enabled,
    staleTime: 30_000,
    retry: 1,
  });

  const dashboard = (dashQ.data as unknown as typeof mockGovDashboard) ?? mockGovDashboard;
  const gaps = (gapsQ.data as unknown as typeof mockSkillGaps) ?? mockSkillGaps;
  const isLive = !dashQ.error && dashQ.data !== undefined;

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Government Dashboard — Overview</h1>
      <p className="text-sm text-gray-500">
        Aggregate analytics only for <code>government/admin</code> per <code>API-CONTRACT.md 8</code>. {isLive ? <span className="text-green-700">Live</span> : <span className="text-amber-600">Mock fallback (M4 analytics stub when offline)</span>} · Trainee/employer blocked client+server (403).
      </p>
      <KpiCards data={dashboard} />
      <Card>
        <CardHeader className="font-medium">Retention — 3m/6m/12m/24m</CardHeader>
        <CardContent>
          <RetentionChart retention={dashboard.retention} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="font-medium">Wage progression — start → 6m → 12m</CardHeader>
        <CardContent>
          <WageChart wage={dashboard.wage_progression} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="font-medium">Skill gaps — GET /analytics/skill-gaps</CardHeader>
        <CardContent className="space-y-2">
          {(gaps as never[]).map((g: unknown, i: number) => {
            const gg = g as Record<string, unknown>;
            const skill = (gg.skill_name ?? gg.skill) as string;
            const type = gg.gap_type as string;
            const rec = gg.recommendation as string;
            return (
              <div key={String(skill ?? i)} className="border rounded p-2 text-sm">
                <div className="font-medium">{skill ?? 'Gap'} — {type}</div>
                <div className="text-xs text-gray-500">{rec}</div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      {(dashQ.error || gapsQ.error) && <p className="text-xs text-amber-600">Live fetch failed — showing mock. M4 analytics backend still stub (skill-gaps.service.ts). Will auto-switch when live.</p>}
    </main>
  );
}
