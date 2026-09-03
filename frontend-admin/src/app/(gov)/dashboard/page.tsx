'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { KpiCards } from '@/components/government/KpiCards';
import { RetentionChart } from '@/components/government/RetentionChart';
import { WageChart } from '@/components/government/WageChart';
import { OutcomeFunnel } from '@/components/government/OutcomeFunnel';
import { OutcomeBreakdownChart } from '@/components/government/OutcomeBreakdownChart';
import { FollowUpMonitoring } from '@/components/government/FollowUpMonitoring';
import { NonPlacementSection } from '@/components/government/NonPlacementSection';
import { VerificationPanel } from '@/components/government/VerificationPanel';
import { Skeleton, ChartSkeleton, KpiSkeleton } from '@/components/ui/skeleton';
import { QueryErrorState, QueryEmptyState } from '@/components/ui/query-state';
import { getAnalyticsDashboard, getSkillGaps, type SkillGap } from '@/lib/api';
import { loadAuth } from '@/lib/auth';

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

  const dashboard = dashQ.data;
  const gaps = gapsQ.data ?? [];
  const forbiddenMsg =
    (dashQ.error as Error)?.message?.includes('Forbidden') ||
    (gapsQ.error as Error)?.message?.includes('Forbidden')
      ? 'Forbidden — analytics requires government/admin'
      : null;

  const loading = dashQ.isLoading;
  const dashError = dashQ.error && !forbiddenMsg;

  return (
    <main className="space-y-5 animate-page-enter">
      <div className="rounded-lg bg-slate-900 px-5 py-4 text-white shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Maharashtra Outcome Intelligence
        </h1>
        <p className="text-sm text-slate-300 mt-1 max-w-3xl">
          Problem Statement 26135 — tracks what happens <em>after</em> skill training: employment verification,
          longitudinal follow-up, retention, wage progression, and actionable intelligence for government.
          {dashQ.isSuccess && (
            <span className="ml-2 inline-flex items-center rounded-full bg-[#059669] px-2.5 py-0.5 text-xs font-semibold text-white">
              Live PostgreSQL data
            </span>
          )}
        </p>
      </div>

      {forbiddenMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm shadow-sm">
          {forbiddenMsg}
        </div>
      )}

      {loading ? (
        <KpiSkeleton />
      ) : dashError ? (
        <QueryErrorState message={(dashQ.error as Error).message} onRetry={() => dashQ.refetch()} />
      ) : dashboard ? (
        <KpiCards data={dashboard} />
      ) : null}

      <Card className="rounded-lg shadow-sm border-slate-200 overflow-hidden">
        <CardHeader className="font-semibold text-slate-900 bg-slate-50 border-b border-slate-200">
          Employment outcome funnel
        </CardHeader>
        <CardContent className="p-4 bg-white">
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : dashError ? (
            <QueryErrorState message="Funnel data unavailable." onRetry={() => dashQ.refetch()} />
          ) : dashboard?.funnel ? (
            <OutcomeFunnel funnel={dashboard.funnel} />
          ) : (
            <QueryEmptyState title="No funnel data" message="Outcome funnel populates as trainees progress through training and employment." />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="rounded-lg shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="font-semibold text-slate-900 bg-slate-50 border-b border-slate-200">
            Employment outcome breakdown
          </CardHeader>
          <CardContent className="p-4 bg-white">
            {loading ? (
              <ChartSkeleton />
            ) : dashboard?.outcome_breakdown ? (
              <OutcomeBreakdownChart data={dashboard.outcome_breakdown} />
            ) : (
              <QueryEmptyState title="No outcomes" message="Employment types appear once trainees report outcomes." />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="font-semibold text-slate-900 bg-slate-50 border-b border-slate-200">
            Retention — 3m / 6m / 12m / 24m
          </CardHeader>
          <CardContent className="p-4 bg-white">
            {loading ? (
              <ChartSkeleton />
            ) : dashboard?.retention ? (
              <RetentionChart retention={dashboard.retention} />
            ) : (
              <QueryEmptyState title="No retention data" message="Retention rates appear after certified trainees have follow-up outcomes." />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg shadow-sm border-slate-200 overflow-hidden">
        <CardHeader className="font-semibold text-slate-900 bg-slate-50 border-b border-slate-200">
          Wage progression
        </CardHeader>
        <CardContent className="p-4 bg-white">
          {loading ? (
            <ChartSkeleton />
          ) : dashboard?.wage_progression ? (
            <WageChart wage={dashboard.wage_progression} />
          ) : (
            <QueryEmptyState title="No wage data" message="Wage progression appears once salary records are captured." />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="rounded-lg shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="font-semibold text-slate-900 bg-slate-50 border-b border-slate-200">
            Follow-up monitoring
          </CardHeader>
          <CardContent className="p-4 bg-white">
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : dashboard?.follow_up_monitoring ? (
              <FollowUpMonitoring data={dashboard.follow_up_monitoring} />
            ) : (
              <QueryEmptyState title="No follow-ups" message="Follow-ups are scheduled at 30d, 3m, 6m, 12m and 24m after certification." />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="font-semibold text-slate-900 bg-slate-50 border-b border-slate-200">
            Non-placement analytics
          </CardHeader>
          <CardContent className="p-4 bg-white">
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : dashboard?.non_placement_reasons ? (
              <NonPlacementSection reasons={dashboard.non_placement_reasons} />
            ) : (
              <QueryEmptyState title="No non-placement data" message="Reasons are captured when trainees respond to follow-up surveys." />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg shadow-sm border-slate-200 overflow-hidden">
        <CardHeader className="font-semibold text-slate-900 bg-slate-50 border-b border-slate-200">
          Employment verification intelligence
        </CardHeader>
        <CardContent className="p-4 bg-white">
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : dashboard?.verification ? (
            <VerificationPanel data={dashboard.verification} />
          ) : (
            <QueryEmptyState title="No verification data" message="Verification status appears as trainees report employment and employers confirm." />
          )}
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-sm border-slate-200 overflow-hidden">
        <CardHeader className="font-semibold text-slate-900 bg-slate-50 border-b border-slate-200">
          Skill gap intelligence
        </CardHeader>
        <CardContent className="space-y-2 p-4 bg-white">
          {gapsQ.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : gapsQ.error && !forbiddenMsg ? (
            <QueryErrorState message={(gapsQ.error as Error).message} onRetry={() => gapsQ.refetch()} />
          ) : gaps.length === 0 ? (
            <QueryEmptyState title="No skill gaps detected" message="Gaps are identified from employer feedback and outcome analysis." />
          ) : (
            gaps.map((g: SkillGap, i: number) => {
              const skill = g.skill_name ?? g.skill ?? 'Skill gap';
              return (
                <div
                  key={`${skill}-${i}`}
                  className="border border-amber-200 bg-amber-50/30 rounded-lg p-3 text-sm shadow-sm flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2"
                >
                  <div>
                    <div className="font-semibold text-slate-900">
                      {skill} — <span className="text-amber-700">{g.gap_type}</span>
                    </div>
                    {g.gap_description && (
                      <p className="text-xs text-slate-600 mt-0.5">
                        <span className="font-medium">Signal: </span>{g.gap_description}
                      </p>
                    )}
                    <p className="text-xs text-slate-600 mt-1">
                      <span className="font-medium">Action: </span>{g.recommendation}
                    </p>
                  </div>
                  <span className="inline-flex items-center self-start shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#059669] text-white">
                    Curriculum update
                  </span>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </main>
  );
}
