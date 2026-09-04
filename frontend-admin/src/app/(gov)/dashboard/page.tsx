'use client';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { KpiCards } from '@/components/government/KpiCards';
import { RetentionChart } from '@/components/government/RetentionChart';
import { WageChart } from '@/components/government/WageChart';
import { Skeleton, ChartSkeleton, KpiSkeleton } from '@/components/ui/skeleton';
import { getAnalyticsDashboard, getSkillGaps } from '@/lib/api';
import { loadAuth } from '@/lib/auth';

export default function GovDashboardPage() {
  const [token, setToken] = useState<string | null>(null);
  const queryClient = useQueryClient();
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
  const dashboard = dashQ.data;
  const gaps = gapsQ.data;
  const forbiddenMsg = (dashQ.error as Error)?.message?.includes('Forbidden') || (gapsQ.error as Error)?.message?.includes('Forbidden') ? 'Forbidden — analytics requires government/admin' : null;

  const dashError = dashQ.error && !forbiddenMsg;
  const gapsError = gapsQ.error && !forbiddenMsg;

  return (
    <main className="space-y-5 animate-page-enter">
      <div className="rounded-lg bg-slate-900 px-5 py-4 text-white shadow-sm transition-all duration-300">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Government Dashboard — Overview</h1>
        <p className="text-sm text-slate-300 mt-1">
          Aggregate analytics only for <code className="bg-white/10 px-1 py-0.5 rounded text-white">government/admin</code> per <code className="bg-white/10 px-1 py-0.5 rounded text-white">API-CONTRACT.md 8</code>. Trainee/employer blocked client+server (403).
        </p>
      </div>
      {forbiddenMsg && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm shadow-sm">{forbiddenMsg}</div>}
      {dashError && !isDashLoading && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm shadow-sm flex items-center justify-between">
          <span>Failed to load dashboard data</span>
          <button onClick={() => queryClient.invalidateQueries({ queryKey: ['gov-dashboard'] })} className="min-h-[32px] px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-semibold shadow-sm hover:bg-slate-800">Retry</button>
        </div>
      )}
      {!dashboard && !isDashLoading && !dashError && (
        <div className="bg-slate-50 border border-slate-200 text-slate-600 px-4 py-8 rounded-lg text-sm shadow-sm text-center">No data available</div>
      )}
      {isDashLoading ? (
        <KpiSkeleton />
      ) : dashboard ? (
        <KpiCards data={dashboard} />
      ) : null}
      <Card className="rounded-lg shadow-sm border-slate-200 overflow-hidden transition-all duration-200 hover:scale-[1.01] hover:shadow-md hover:border-slate-300">
        <CardHeader className="font-semibold text-slate-900 bg-slate-50 border-b border-slate-200">Retention — 3m/6m/12m/24m · smooth monotone curves · clear tooltips</CardHeader>
        <CardContent className="p-4 bg-white">
          {isDashLoading ? <ChartSkeleton /> : dashboard?.retention ? <RetentionChart retention={dashboard.retention} /> : <div className="text-sm text-slate-400 py-4 text-center">No retention data</div>}
        </CardContent>
      </Card>
      <Card className="rounded-lg shadow-sm border-slate-200 overflow-hidden transition-all duration-200 hover:scale-[1.01] hover:shadow-md hover:border-slate-300">
        <CardHeader className="font-semibold text-slate-900 bg-slate-50 border-b border-slate-200">Wage progression — start → 6m → 12m · smooth monotone · toggles</CardHeader>
        <CardContent className="p-4 bg-white">
          {isDashLoading ? <ChartSkeleton /> : dashboard?.wage_progression ? <WageChart wage={dashboard.wage_progression} /> : <div className="text-sm text-slate-400 py-4 text-center">No wage data</div>}
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
          ) : gapsError ? (
            <div className="text-sm text-red-600 py-2">Failed to load skill gaps</div>
          ) : gaps && gaps.length > 0 ? (
            gaps.map((g, i) => {
              const skill = g.skill_name ?? g.skill ?? 'Gap';
              const type = g.gap_type;
              const rec = g.recommendation;
              return (
                <div key={String(skill ?? i)} className="border border-amber-200 bg-amber-50/30 rounded-lg p-3 text-sm shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 transition-all duration-200 hover:scale-[1.01] hover:shadow-md">
                  <div>
                    <div className="font-semibold text-slate-900">{skill} — <span className="text-amber-700">{type}</span></div>
                    <div className="text-xs text-slate-600">{rec}</div>
                  </div>
                  <span className="inline-flex items-center self-start shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#059669] text-white border border-[#059669] shadow-sm">Recommended Curriculum Update</span>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-slate-400 py-2 text-center">No skill gaps identified</div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
