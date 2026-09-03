'use client';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { QueryErrorState, QueryEmptyState } from '@/components/ui/query-state';
import { getCourseAnalytics, type CourseAnalyticsRow } from '@/lib/api';
import { loadAuth } from '@/lib/auth';

type SortKey = 'sector' | 'total_trainees' | 'placements' | 'placement_rate';

export default function CourseAnalyticsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('placement_rate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const a = loadAuth();
    if (a) setToken(a.accessToken);
  }, []);

  const { data, error, isLoading, refetch, isSuccess } = useQuery({
    queryKey: ['course-analytics'],
    queryFn: () => getCourseAnalytics(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const rows: CourseAnalyticsRow[] = data ?? [];
  const forbidden = (error as Error)?.message?.includes('Forbidden')
    ? 'Forbidden — analytics requires government/admin'
    : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const copy = rows.filter((r) => !q || r.sector.toLowerCase().includes(q));
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === 'asc' ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
    return copy;
  }, [rows, query, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir(key === 'sector' ? 'asc' : 'desc');
    }
  }

  return (
    <main className="space-y-4 animate-page-enter">
      <h1 className="text-xl font-bold text-slate-900">
        Course / sector analytics
        {isSuccess && <span className="ml-2 text-[#059669] text-sm font-semibold">Live data</span>}
      </h1>
      <p className="text-sm text-slate-500">
        Which courses actually lead to employment — placement rate from training records linked to active jobs.
      </p>
      {forbidden && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
          {forbidden}
        </div>
      )}
      <Card className="rounded-lg shadow-sm border-slate-200 overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <span className="font-semibold text-slate-900">Sectors</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sector"
            aria-label="Search sector"
            className="h-9 w-full sm:w-56 rounded-md border border-slate-200 px-3 text-sm"
          />
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : error && !forbidden ? (
            <div className="p-4">
              <QueryErrorState message={(error as Error).message} onRetry={() => refetch()} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4">
              <QueryEmptyState
                title="No course analytics yet"
                message="Sector placement rates appear once training records are linked to employment outcomes."
              />
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white border-b border-slate-200">
                  <tr className="text-left text-slate-500">
                    <th className="px-4 py-2.5 font-semibold cursor-pointer" onClick={() => toggleSort('sector')}>
                      Sector
                    </th>
                    <th className="px-4 py-2.5 font-semibold cursor-pointer" onClick={() => toggleSort('total_trainees')}>
                      Enrolled
                    </th>
                    <th className="px-4 py-2.5 font-semibold cursor-pointer" onClick={() => toggleSort('placements')}>
                      Employed
                    </th>
                    <th className="px-4 py-2.5 font-semibold cursor-pointer" onClick={() => toggleSort('placement_rate')}>
                      Placement rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.sector} className="border-t border-slate-100">
                      <td className="px-4 py-2.5 font-medium text-slate-900">{r.sector}</td>
                      <td className="px-4 py-2.5 tabular-nums">{r.total_trainees}</td>
                      <td className="px-4 py-2.5 tabular-nums">{r.placements}</td>
                      <td className="px-4 py-2.5">
                        <span className="font-semibold tabular-nums">{r.placement_rate}%</span>
                        <div className="mt-1 h-1.5 w-28 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-[#059669]"
                            style={{ width: `${Math.min(100, r.placement_rate)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
