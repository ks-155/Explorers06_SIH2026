'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { mockSkillGaps } from '@/mocks/govMock';
import { getSkillGaps } from '@/lib/api';
import { loadAuth } from '@/lib/auth';

export default function SkillGapsPage() {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const a = loadAuth();
    if (a) setToken(a.accessToken);
  }, []);
  const { data, error, isLoading } = useQuery({ queryKey: ['skill-gaps-page'], queryFn: () => getSkillGaps(token!), enabled: !!token, staleTime: 5 * 60 * 1000, retry: 1, refetchOnWindowFocus: false });
  const gaps = (data as unknown as typeof mockSkillGaps) ?? mockSkillGaps;
  const isLive = !error && data !== undefined;
  const forbidden = (error as Error)?.message?.includes('Forbidden') ? 'Forbidden — analytics requires government/admin' : null;
  return (
    <main className="space-y-4 animate-page-enter">
      <h1 className="text-xl font-bold text-slate-900">
        Skill Gaps {isLive ? <span className="text-[#059669] text-sm font-semibold">Live</span> : <span className="text-[#d97706] text-sm font-semibold">Mock fallback</span>}
      </h1>
      <p className="text-sm text-slate-500">Per SOIS-CORE-MODULES.md:268 — GET /analytics/skill-gaps · warning cards with Recommended Curriculum Updates</p>
      {forbidden && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm shadow-sm">{forbidden}</div>}
      <div className="space-y-3">
        {isLoading ? (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : (
          (gaps as unknown[]).map((g: unknown, i: number) => {
            const gg = g as Record<string, unknown>;
            const skill = (gg.skill_name ?? gg.skill) as string;
            const gapType = (gg.gap_type as string) ?? 'gap';
            const rec = (gg.recommendation as string) ?? 'Review curriculum';
            return (
              <Card key={String(skill ?? i)} className="rounded-lg shadow-sm border-amber-300 bg-amber-50/40 overflow-hidden hover:shadow-md transition-all duration-200 hover:scale-[1.01]">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 border border-amber-300 text-amber-700 text-xs font-bold">!</span>
                        <h3 className="font-semibold text-slate-900">{skill ?? 'Gap'}</h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">{gapType}</span>
                      </div>
                      <p className="text-sm text-slate-600 pl-9">{rec}</p>
                    </div>
                    <span className="inline-flex items-center self-start shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#059669] text-white border border-[#059669] shadow-sm">
                      Recommended Curriculum Update
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5 pl-9">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-[#059669] border border-emerald-200">Emerald badge</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white text-slate-600 border border-slate-200">{skill} · gap</span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
      <Card className="rounded-lg shadow-sm border-amber-200 bg-white transition-all duration-200 hover:shadow-md hover:scale-[1.01]">
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#059669]" /> Recommended Curriculum Updates — summary
          </h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {isLoading ? (
              <Skeleton className="h-6 w-48" />
            ) : (
              (gaps as unknown[]).slice(0, 4).map((g: unknown, i: number) => {
                const gg = g as Record<string, unknown>;
                const rec = (gg.recommendation as string) ?? '';
                return (
                  <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#059669] border border-emerald-200 shadow-sm">
                    {rec}
                  </span>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
