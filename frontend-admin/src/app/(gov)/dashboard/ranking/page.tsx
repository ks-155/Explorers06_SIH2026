'use client';
import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { mockProviderRanking } from '@/mocks/govMock';
import { getProviderRanking } from '@/lib/api';
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
  const { data, error, isLoading } = useQuery({
    queryKey: ['provider-ranking'],
    queryFn: () => getProviderRanking(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  const rows = (data as unknown as typeof mockProviderRanking) ?? mockProviderRanking;
  const isLive = !error && data !== undefined;
  const [sortKey, setSortKey] = useState<SortKey>('placement');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const forbidden = (error as Error)?.message?.includes('Forbidden') ? 'Forbidden — analytics requires government/admin' : null;

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
    const copy = [...rows] as typeof mockProviderRanking;
    copy.sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortKey] as string | number;
      const bv = (b as Record<string, unknown>)[sortKey] as string | number;
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
    <span className={`ml-1 inline-block text-[10px] ${active ? 'text-slate-900' : 'text-slate-400'}`}>{active ? (dir === 'asc' ? '▲' : '▼') : '↕'}</span>
  );

  return (
    <main className="space-y-4 animate-page-enter">
      <h1 className="text-xl font-bold text-slate-900">
        Provider Ranking {isLive ? <span className="text-[#059669] text-sm font-semibold">Live</span> : <span className="text-[#d97706] text-sm font-semibold">Mock fallback</span>}
      </h1>
      <p className="text-sm text-slate-500">GET /api/v1/analytics/provider-ranking (gov/admin only) {isLoading ? '' : ''} {error ? (forbidden ? forbidden : 'mock fallback') : ''}</p>
      {forbidden && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm shadow-sm">{forbidden}</div>}
      <Card className="rounded-lg shadow-sm border-slate-200 overflow-hidden transition-all duration-200 hover:shadow-md">
        <CardHeader className="font-semibold text-slate-900 bg-slate-50 border-b border-slate-200 flex flex-wrap justify-between items-center gap-2">
          <span>Providers — sortable table · sticky headers · pagination</span>
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
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="overflow-auto max-h-[420px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
                  <tr className="text-left text-slate-500">
                    <th className="px-4 py-2.5 font-semibold cursor-pointer select-none hover:text-slate-900 transition-colors" onClick={() => toggleSort('name')}>
                      Name <SortIcon active={sortKey === 'name'} dir={sortDir} />
                    </th>
                    <th className="px-4 py-2.5 font-semibold cursor-pointer select-none hover:text-slate-900 transition-colors" onClick={() => toggleSort('district')}>
                      District <SortIcon active={sortKey === 'district'} dir={sortDir} />
                    </th>
                    <th className="px-4 py-2.5 font-semibold cursor-pointer select-none hover:text-slate-900 transition-colors" onClick={() => toggleSort('placement')}>
                      Placement <SortIcon active={sortKey === 'placement'} dir={sortDir} />
                    </th>
                    <th className="px-4 py-2.5 font-semibold cursor-pointer select-none hover:text-slate-900 transition-colors" onClick={() => toggleSort('retention')}>
                      Retention <SortIcon active={sortKey === 'retention'} dir={sortDir} />
                    </th>
                    <th className="px-4 py-2.5 font-semibold">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((p) => (
                    <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-slate-900">{p.name}</td>
                      <td className="px-4 py-2.5 text-slate-700">{p.district}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1">
                          <span className="font-semibold text-slate-900">{p.placement}%</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${confidenceColor(p.placement)}`}>{p.placement >= 80 ? 'HIGH' : p.placement >= 50 ? 'MEDIUM' : 'LOW'}</span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1">
                          <span className="font-semibold text-slate-900">{p.retention}%</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${confidenceColor(p.retention)}`}>{p.retention >= 80 ? 'HIGH' : p.retention >= 50 ? 'MEDIUM' : 'LOW'}</span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border shadow-sm ${confidenceColor(p.placement)}`}>{p.placement >= 80 ? 'HIGH' : p.placement >= 50 ? 'MEDIUM' : 'LOW'} {p.placement}%</span>
                      </td>
                    </tr>
                  ))}
                  {paged.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">
                        No providers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs">
            <span className="text-slate-500">
              Page {page} of {totalPages} · {sorted.length} providers
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="min-h-[32px] px-3 py-1 rounded-lg border bg-white text-slate-700 border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-medium transition-all duration-200"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`min-h-[32px] min-w-[32px] px-2 py-1 rounded-lg border font-semibold shadow-sm transition-all duration-200 ${page === n ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="min-h-[32px] px-3 py-1 rounded-lg border bg-white text-slate-700 border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-medium transition-all duration-200"
              >
                Next
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
