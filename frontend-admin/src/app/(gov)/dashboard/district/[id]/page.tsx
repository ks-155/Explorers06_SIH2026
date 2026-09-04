'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getDistrictAnalytics } from '@/lib/api';
import { loadAuth } from '@/lib/auth';

type DistrictSector = { sector: string; total_trainees: number; placements: number; placement_rate: number; employed: number };
type DistrictData = { district_id: string; total_trainees: number; placements: number; verified_placements: number; sectors: DistrictSector[] };

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
  const districtData = data as DistrictData | undefined;
  const sectors = districtData?.sectors ?? [];
  const forbidden = (error as Error)?.message?.includes('Forbidden') ? 'Forbidden — analytics requires government/admin' : null;
  const fetchError = error && !forbidden;

  return (
    <main className="space-y-4 animate-page-enter">
      <h1 className="text-xl font-bold text-slate-900">
        District {id}
      </h1>
      <p className="text-sm text-slate-500">GET /api/v1/analytics/district/:id — sector breakdown, top employers · cards with placement % progress bars</p>
      {forbidden && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm shadow-sm">{forbidden}</div>}
      {fetchError && !isLoading && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm shadow-sm">
          Failed to load district data
        </div>
      )}
      {!isLoading && !error && !districtData && (
        <div className="bg-slate-50 border border-slate-200 text-slate-600 px-4 py-8 rounded-lg text-sm shadow-sm text-center">District not found</div>
      )}
      {districtData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="rounded-lg shadow-sm border-slate-200 bg-white overflow-hidden hover:shadow-md transition-all duration-200 hover:scale-[1.01] hover:border-slate-300">
            <CardHeader className="pb-2">
              <h3 className="font-semibold text-slate-900">Total Trainees</h3>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{districtData.total_trainees.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="rounded-lg shadow-sm border-slate-200 bg-white overflow-hidden hover:shadow-md transition-all duration-200 hover:scale-[1.01] hover:border-slate-300">
            <CardHeader className="pb-2">
              <h3 className="font-semibold text-slate-900">Placements</h3>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{districtData.placements.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="rounded-lg shadow-sm border-slate-200 bg-white overflow-hidden hover:shadow-md transition-all duration-200 hover:scale-[1.01] hover:border-slate-300">
            <CardHeader className="pb-2">
              <h3 className="font-semibold text-slate-900">Verified Placements</h3>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{districtData.verified_placements.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : sectors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {sectors.map((s) => (
            <Card key={s.sector} className="rounded-lg shadow-sm border-slate-200 bg-white overflow-hidden hover:shadow-md transition-all duration-200 hover:scale-[1.01] hover:border-slate-300">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">{s.sector}</h3>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{s.placement_rate}%</span>
                </div>
                <p className="text-xs text-slate-500">{s.employed.toLocaleString()} employed</p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${s.placement_rate}%`,
                      backgroundColor: s.placement_rate >= 80 ? '#059669' : s.placement_rate >= 50 ? '#d97706' : '#dc2626',
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Placement</span>
                  <span className="font-semibold text-slate-900">{s.placement_rate}%</span>
                </div>
                <div className="flex gap-1.5 mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border shadow-sm ${s.placement_rate >= 80 ? 'bg-[#059669] text-white border-[#059669]' : s.placement_rate >= 50 ? 'bg-[#d97706] text-white border-[#d97706]' : 'bg-[#dc2626] text-white border-[#dc2626]'}`}>
                    {s.placement_rate >= 80 ? 'HIGH' : s.placement_rate >= 50 ? 'MEDIUM' : 'LOW'}
                  </span>
                  <span className="text-xs text-slate-400">· sector performance</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
      <Card className="rounded-lg shadow-sm border-slate-200 transition-all duration-200 hover:shadow-md">
        <CardHeader className="font-semibold text-slate-900 bg-slate-50">Top sectors — detailed</CardHeader>
        <CardContent className="space-y-3 p-4">
          {isLoading ? (
            <>
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </>
          ) : sectors.length > 0 ? (
            sectors.map((s) => (
              <div key={s.sector} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-900">{s.sector}</span>
                  <span className="text-slate-600">{s.employed.toLocaleString()} · {s.placement_rate}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${s.placement_rate}%`, backgroundColor: s.placement_rate >= 80 ? '#059669' : s.placement_rate >= 50 ? '#2563eb' : '#d97706' }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-400 py-2 text-center">No sector data</div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
