'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { KpiCards } from '@/components/government/KpiCards';
import { RetentionChart } from '@/components/government/RetentionChart';
import { WageChart } from '@/components/government/WageChart';
import { Skeleton, ChartSkeleton, KpiSkeleton } from '@/components/ui/skeleton';
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
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const gapsQ = useQuery({
    queryKey: ['skill-gaps'],
    queryFn: () => getSkillGaps(token!),
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const isDashLoading = dashQ.isLoading;
  const isGapsLoading = gapsQ.isLoading;
  const dashboard = (dashQ.data as unknown as typeof mockGovDashboard) ?? mockGovDashboard;
  const gaps = (gapsQ.data as unknown as typeof mockSkillGaps) ?? mockSkillGaps;
  const isLive = !dashQ.error && dashQ.data !== undefined;
  const forbiddenMsg = (dashQ.error as Error)?.message?.includes('Forbidden') || (gapsQ.error as Error)?.message?.includes('Forbidden') ? 'Forbidden — analytics requires government/admin' : null;

  return (
    <main className="space-y-5 animate-page-enter">
      <div className="rounded-lg bg-slate-900 px-5 py-4 text-white shadow-sm transition-all duration-300">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Government Dashboard — Overview</h1>
        <p className="text-sm text-slate-300 mt-1">
          Aggregate analytics only for <code className="bg-white/10 px-1 py-0.5 rounded text-white">government/admin</code> per <code className="bg-white/10 px-1 py-0.5 rounded text-white">API-CONTRACT.md 8</code>.{' '}
          {isLive ? <span className="inline-flex items-center rounded-full bg-[#059669] px-2.5 py-0.5 text-xs font-semibold text-white">Live</span> : <span className="inline-flex items-center rounded-full bg-[#d97706] px-2.5 py-0.5 text-xs font-semibold text-white">Mock fallback (M4 analytics stub when offline)</span>} · Trainee/employer blocked client+server (403).
        </p>
      </div>
      {forbiddenMsg && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm shadow-sm">{forbiddenMsg}</div>}
      {isDashLoading ? (
        <KpiSkeleton />
      ) : (
        <KpiCards data={dashboard} />
      )}
      <Card className="rounded-lg shadow-sm border-slate-200 overflow-hidden transition-all duration-200 hover:scale-[1.01] hover:shadow-md hover:border-slate-300">
        <CardHeader className="font-semibold text-slate-900 bg-slate-50 border-b border-slate-200">Retention — 3m/6m/12m/24m · smooth monotone curves · clear tooltips</CardHeader>
        <CardContent className="p-4 bg-white">
          {isDashLoading ? <ChartSkeleton /> : <RetentionChart retention={dashboard.retention} />}
        </CardContent>
      </Card>
      <Card className="rounded-lg shadow-sm border-slate-200 overflow-hidden transition-all duration-200 hover:scale-[1.01] hover:shadow-md hover:border-slate-300">
        <CardHeader className="font-semibold text-slate-900 bg-slate-50 border-b border-slate-200">Wage progression — start → 6m → 12m · smooth monotone · toggles</CardHeader>
        <CardContent className="p-4 bg-white">
          {isDashLoading ? <ChartSkeleton /> : <WageChart wage={dashboard.wage_progression} />}
        </CardContent>
      </Card>
      <Card className="rounded-lg shadow-sm border-slate-200 overflow-hidden transition-all duration-200 hover:shadow-md">
        <CardHeader className="font-semibold text-slate-900 bg-slate-50 border-b border-slate-200">Skill gaps — GET /analytics/skill-gaps · warning amber · emerald badges</CardHeader>
        <CardContent className="space-y-2 p-4 bg-white">
          {isGapsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            (gaps as never[]).map((g: unknown, i: number) => {
              const gg = g as Record<string, unknown>;
              const skill = (gg.skill_name ?? gg.skill) as string;
              const type = gg.gap_type as string;
              const rec = gg.recommendation as string;
              return (
                <div key={String(skill ?? i)} className="border border-amber-200 bg-amber-50/30 rounded-lg p-3 text-sm shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 transition-all duration-200 hover:scale-[1.01] hover:shadow-md">
                  <div>
                    <div className="font-semibold text-slate-900">{skill ?? 'Gap'} — <span className="text-amber-700">{type}</span></div>
                    <div className="text-xs text-slate-600">{rec}</div>
                  </div>
                  <span className="inline-flex items-center self-start shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#059669] text-white border border-[#059669] shadow-sm">Recommended Curriculum Update</span>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
      {(dashQ.error || gapsQ.error) && !forbiddenMsg && <p className="text-xs text-amber-600">Live fetch failed — showing mock. M4 analytics backend still stub (skill-gaps.service.ts). Will auto-switch when live.</p>}
    </main>
  );
}
