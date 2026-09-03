'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { QueryErrorState, QueryEmptyState } from '@/components/ui/query-state';
import { getDistrictAnalytics, type DistrictAnalytics } from '@/lib/api';
import { loadAuth } from '@/lib/auth';

export default function DistrictPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const a = loadAuth();
    if (a) setToken(a.accessToken);
  }, []);
  const { data, error, isLoading, refetch, isSuccess } = useQuery({
    queryKey: ['district', id],
    queryFn: () => getDistrictAnalytics(id, token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const district = data as DistrictAnalytics | undefined;
  const sectors = district?.topSectors ?? [];
  const maxEmployed = Math.max(...sectors.map((s) => s.employed), 1);
  const sectorsWithPlacement = sectors.map((s) => ({
    ...s,
    placement: Math.round((s.employed / maxEmployed) * 100),
  }));
  const forbidden = (error as Error)?.message?.includes('Forbidden')
    ? 'Forbidden — analytics requires government/admin'
    : null;

  return (
    <main className="space-y-4 animate-page-enter">
      <h1 className="text-xl font-bold text-slate-900">
        {district?.district_name ?? `District ${id}`}
        {isSuccess && (
          <span className="ml-2 text-[#059669] text-sm font-semibold">Live data</span>
        )}
      </h1>
      <p className="text-sm text-slate-500">
        District-level outcome breakdown · trainees, placements and sector performance.
      </p>
      {forbidden && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm shadow-sm">
          {forbidden}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : error && !forbidden ? (
        <QueryErrorState message={(error as Error).message} onRetry={() => refetch()} />
      ) : district ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="rounded-lg shadow-sm border-slate-200">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">Total trainees</p>
              <p className="text-2xl font-bold text-slate-900">{district.total_trainees.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="rounded-lg shadow-sm border-slate-200">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">Active placements</p>
              <p className="text-2xl font-bold text-slate-900">{district.placements.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="rounded-lg shadow-sm border-slate-200">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">Placement rate</p>
              <p className="text-2xl font-bold text-slate-900">{district.placement_rate}%</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card className="rounded-lg shadow-sm border-slate-200">
        <CardHeader className="font-semibold text-slate-900 bg-slate-50">
          Sector breakdown
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          {isLoading ? (
            <>
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </>
          ) : sectorsWithPlacement.length === 0 ? (
            <QueryEmptyState
              title="No sector data for this district"
              message="Sector outcomes appear once trainees in this district have training and employment records."
            />
          ) : (
            sectorsWithPlacement.map((s) => (
              <div key={s.sector} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-900">{s.sector}</span>
                  <span className="text-slate-600">{s.employed.toLocaleString()} employed</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#059669] transition-all duration-500"
                    style={{ width: `${s.placement}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </main>
  );
}
