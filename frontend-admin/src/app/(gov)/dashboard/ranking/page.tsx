'use client';
import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { QueryErrorState, QueryEmptyState } from '@/components/ui/query-state';
import { getProviderRanking, type ProviderRank } from '@/lib/api';
import { loadAuth } from '@/lib/auth';

type SortKey = 'name' | 'district' | 'placement' | 'retention';
type SortDir = 'asc' | 'desc';

function confidenceColor(score: number): string {
  if (score >= 80) return 'bg-[#059669] text-white border-[#059669]';
  if (score >= 50) return 'bg-[#d97706] text-white border-[#d97706]';
  return 'bg-[#dc2626] text-white border-[#dc2626]';
}

export default function RankingPage() {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const a = loadAuth();
    if (a) setToken(a.accessToken);
  }, []);
  const { data, error, isLoading, refetch, isSuccess } = useQuery({
    queryKey: ['provider-ranking'],
    queryFn: () => getProviderRanking(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  const rows: ProviderRank[] = data ?? [];
  const [sortKey, setSortKey] = useState<SortKey>('placement');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const forbidden = (error as Error)?.message?.includes('Forbidden')
    ? 'Forbidden — analytics requires government/admin'
    : null;

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' || key === 'district' ? 'asc' : 'desc');
    }
    setPage(1);
  }

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortKey as keyof ProviderRank];
      const bv = b[sortKey as keyof ProviderRank];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      const an = av as number;
      const bn = bv as number;
      return sortDir === 'asc' ? an - bn : bn - an;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) => (
    <span className={`ml-1 inline-block text-[10px] ${active ? 'text-slate-900' : 'text-slate-400'}`}>
      {active ? (dir === 'asc' ? '▲' : '▼') : '↕'}
    </span>
  );

  return (
    <main className="space-y-4 animate-page-enter">
      <h1 className="text-xl font-bold text-slate-900">
        Provider performance ranking
        {isSuccess && (
          <span className="ml-2 text-[#059669] text-sm font-semibold">Live data</span>
        )}
      </h1>
      <p className="text-sm text-slate-500">
        Compare training providers by placement outcomes — not enrolment alone.
      </p>
      {forbidden && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm shadow-sm">
          {forbidden}
        </div>
      )}
      <Card className="rounded-lg shadow-sm border-slate-200 overflow-hidden">
        <CardHeader className="font-semibold text-slate-900 bg-slate-50 border-b border-slate-200 flex flex-wrap justify-between items-center gap-2">
          <span>Training providers</span>
          <span className="text-xs text-slate-500">
            Sorted by <span className="font-semibold text-slate-900">{sortKey}</span> {sortDir}
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : error && !forbidden ? (
            <div className="p-4">
              <QueryErrorState message={(error as Error).message} onRetry={() => refetch()} />
            </div>
          ) : rows.length === 0 ? (
            <div className="p-4">
              <QueryEmptyState
                title="No provider data"
                message="Provider rankings appear once training providers and outcome records exist."
              />
            </div>
          ) : (
            <div className="overflow-auto max-h-[420px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
                  <tr className="text-left text-slate-500">
                    <th className="px-4 py-2.5 font-semibold cursor-pointer select-none" onClick={() => toggleSort('name')}>
                      Provider <SortIcon active={sortKey === 'name'} dir={sortDir} />
                    </th>
                    <th className="px-4 py-2.5 font-semibold cursor-pointer select-none" onClick={() => toggleSort('district')}>
                      District <SortIcon active={sortKey === 'district'} dir={sortDir} />
                    </th>
                    <th className="px-4 py-2.5 font-semibold">Trainees</th>
                    <th className="px-4 py-2.5 font-semibold cursor-pointer select-none" onClick={() => toggleSort('placement')}>
                      Placement rate <SortIcon active={sortKey === 'placement'} dir={sortDir} />
                    </th>
                    <th className="px-4 py-2.5 font-semibold">Retention</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((p) => (
                    <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="px-4 py-2.5 font-medium text-slate-900">{p.name}</td>
                      <td className="px-4 py-2.5 text-slate-700">{p.district}</td>
                      <td className="px-4 py-2.5 text-slate-700">{p.total_trainees ?? '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1">
                          <span className="font-semibold text-slate-900">{p.placement}%</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${confidenceColor(p.placement)}`}>
                            {p.placement >= 80 ? 'HIGH' : p.placement >= 50 ? 'MEDIUM' : 'LOW'}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">
                        {p.retention != null ? `${p.retention}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {rows.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs">
              <span className="text-slate-500">
                Page {page} of {totalPages} · {sorted.length} providers
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="min-h-[32px] px-3 py-1 rounded-lg border bg-white text-slate-700 border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="min-h-[32px] px-3 py-1 rounded-lg border bg-white text-slate-700 border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
