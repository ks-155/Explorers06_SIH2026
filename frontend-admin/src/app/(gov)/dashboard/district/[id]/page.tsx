'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { mockGovDashboard } from '@/mocks/govMock';
import { getDistrictAnalytics } from '@/lib/api';
import { loadAuth } from '@/lib/auth';

export default function DistrictPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const a = loadAuth();
    if (a) setToken(a.accessToken);
  }, []);
  const { data, error, isLoading } = useQuery({
    queryKey: ['district', id],
    queryFn: () => getDistrictAnalytics(id, token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  const isLive = !error && data !== undefined;
  const forbidden = (error as Error)?.message?.includes('Forbidden') ? 'Forbidden — analytics requires government/admin' : null;
  const sectors = (data as unknown as { topSectors?: typeof mockGovDashboard.topSectors })?.topSectors ?? mockGovDashboard.topSectors;
  const maxEmployed = Math.max(...sectors.map((s) => s.employed), 1);
  const sectorsWithPlacement = sectors.map((s) => ({
    ...s,
    placement: Math.round((s.employed / maxEmployed) * 100),
  }));

  return (
    <main className="space-y-4 animate-page-enter">
      <h1 className="text-xl font-bold text-slate-900">
        District {id} {isLive ? <span className="text-[#059669] text-sm font-semibold">Live</span> : <span className="text-[#d97706] text-sm font-semibold">Mock</span>}
      </h1>
      <p className="text-sm text-slate-500">GET /api/v1/analytics/district/:id — sector breakdown, top employers · cards with placement % progress bars</p>
      {forbidden && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm shadow-sm">{forbidden}</div>}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {sectorsWithPlacement.map((s) => (
            <Card key={s.sector} className="rounded-lg shadow-sm border-slate-200 bg-white overflow-hidden hover:shadow-md transition-all duration-200 hover:scale-[1.01] hover:border-slate-300">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">{s.sector}</h3>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{s.placement}%</span>
                </div>
                <p className="text-xs text-slate-500">{s.employed.toLocaleString()} employed</p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${s.placement}%`,
                      backgroundColor: s.placement >= 80 ? '#059669' : s.placement >= 50 ? '#d97706' : '#dc2626',
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Placement</span>
                  <span className="font-semibold text-slate-900">{s.placement}%</span>
                </div>
                <div className="flex gap-1.5 mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border shadow-sm ${s.placement >= 80 ? 'bg-[#059669] text-white border-[#059669]' : s.placement >= 50 ? 'bg-[#d97706] text-white border-[#d97706]' : 'bg-[#dc2626] text-white border-[#dc2626]'}`}>
                    {s.placement >= 80 ? 'HIGH' : s.placement >= 50 ? 'MEDIUM' : 'LOW'}
                  </span>
                  <span className="text-xs text-slate-400">· sector performance</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Card className="rounded-lg shadow-sm border-slate-200 transition-all duration-200 hover:shadow-md">
        <CardHeader className="font-semibold text-slate-900 bg-slate-50">Top sectors — detailed</CardHeader>
        <CardContent className="space-y-3 p-4">
          {isLoading ? (
            <>
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </>
          ) : (
            sectorsWithPlacement.map((s) => (
              <div key={s.sector} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-900">{s.sector}</span>
                  <span className="text-slate-600">{s.employed.toLocaleString()} · {s.placement}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${s.placement}%`, backgroundColor: s.placement >= 80 ? '#059669' : s.placement >= 50 ? '#2563eb' : '#d97706' }}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      {error && !forbidden && <p className="text-xs text-amber-600">Mock fallback — M4 analytics still stub</p>}
    </main>
  );
}
