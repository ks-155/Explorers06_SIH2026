'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { QueryErrorState, QueryEmptyState } from '@/components/ui/query-state';
import { getSkillGaps, type SkillGap } from '@/lib/api';
import { loadAuth } from '@/lib/auth';

export default function SkillGapsPage() {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const a = loadAuth();
    if (a) setToken(a.accessToken);
  }, []);
  const { data, error, isLoading, refetch, isSuccess } = useQuery({
    queryKey: ['skill-gaps-page'],
    queryFn: () => getSkillGaps(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  const gaps: SkillGap[] = data ?? [];
  const forbidden = (error as Error)?.message?.includes('Forbidden')
    ? 'Forbidden — analytics requires government/admin'
    : null;

  return (
    <main className="space-y-4 animate-page-enter">
      <h1 className="text-xl font-bold text-slate-900">
        Skill gap intelligence
        {isSuccess && (
          <span className="ml-2 text-[#059669] text-sm font-semibold">Live data</span>
        )}
      </h1>
      <p className="text-sm text-slate-500">
        Detected gaps from outcome signals → evidence → recommended curriculum actions.
      </p>
      {forbidden && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm shadow-sm">
          {forbidden}
        </div>
      )}
      <div className="space-y-3">
        {isLoading ? (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : error && !forbidden ? (
          <QueryErrorState message={(error as Error).message} onRetry={() => refetch()} />
        ) : gaps.length === 0 ? (
          <QueryEmptyState
            title="No skill gaps recorded"
            message="Gaps are identified from employer feedback, retention and wage analysis."
          />
        ) : (
          gaps.map((g, i) => {
            const skill = g.skill_name ?? g.skill ?? 'Skill gap';
            return (
              <Card key={`${skill}-${i}`} className="rounded-lg shadow-sm border-amber-300 bg-amber-50/40 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 border border-amber-300 text-amber-700 text-xs font-bold">
                          !
                        </span>
                        <h3 className="font-semibold text-slate-900">{skill}</h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                          {g.gap_type}
                        </span>
                      </div>
                      {g.gap_description && (
                        <p className="text-sm text-slate-600 pl-9">
                          <span className="font-medium text-slate-700">Observed signal: </span>
                          {g.gap_description}
                        </p>
                      )}
                      <p className="text-sm text-slate-600 pl-9">
                        <span className="font-medium text-slate-700">Recommended action: </span>
                        {g.recommendation}
                      </p>
                    </div>
                    <span className="inline-flex items-center self-start shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#059669] text-white">
                      Curriculum update
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </main>
  );
}
