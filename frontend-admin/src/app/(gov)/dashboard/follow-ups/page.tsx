'use client';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getFollowUpMonitoring } from '@/lib/api';
import { loadAuth } from '@/lib/auth';

const statusColors: Record<string, string> = {
  scheduled: 'bg-slate-100 text-slate-700 border-slate-200',
  sent: 'bg-blue-50 text-blue-700 border-blue-200',
  responded: 'bg-emerald-50 text-[#059669] border-emerald-200',
  failed: 'bg-red-50 text-[#dc2626] border-red-200',
  cancelled: 'bg-amber-50 text-[#d97706] border-amber-200',
};

export default function FollowUpsPage() {
  const [token, setToken] = useState<string | null>(null);
  const queryClient = useQueryClient();
  useEffect(() => {
    const a = loadAuth();
    if (a) setToken(a.accessToken);
  }, []);

  const { data, error, isLoading } = useQuery({
    queryKey: ['follow-up-monitoring'],
    queryFn: () => getFollowUpMonitoring(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const forbidden = (error as Error)?.message?.includes('Forbidden') ? 'Forbidden — analytics requires government/admin' : null;
  const fetchError = error && !forbidden;

  return (
    <main className="space-y-4 animate-page-enter">
      <h1 className="text-xl font-bold text-slate-900">Follow-up Monitoring</h1>
      <p className="text-sm text-slate-500">Status breakdown and non-placement reasons for follow-up outreach</p>
      {forbidden && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm shadow-sm">{forbidden}</div>}
      {fetchError && !isLoading && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm shadow-sm flex items-center justify-between">
          <span>Failed to load follow-up data</span>
          <button onClick={() => queryClient.invalidateQueries({ queryKey: ['follow-up-monitoring'] })} className="min-h-[32px] px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-semibold shadow-sm hover:bg-slate-800">Retry</button>
        </div>
      )}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !data ? (
        <div className="bg-slate-50 border border-slate-200 text-slate-600 px-4 py-8 rounded-lg text-sm shadow-sm text-center">No follow-up data available</div>
      ) : (
        <>
          <Card className="rounded-lg shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="font-semibold text-slate-900 bg-slate-50 border-b border-slate-200">Status Breakdown</CardHeader>
            <CardContent className="p-4 bg-white">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(data.status_breakdown).map(([status, count]) => (
                  <div key={status} className={`rounded-lg border p-3 text-center ${statusColors[status] ?? 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-xs font-medium mt-1 capitalize">{status}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="font-semibold text-slate-900 bg-slate-50 border-b border-slate-200">Non-placement Reasons</CardHeader>
            <CardContent className="p-4 bg-white">
              {data.non_placement_reasons.length === 0 ? (
                <div className="text-sm text-slate-400 py-2 text-center">No non-placement reasons recorded</div>
              ) : (
                <div className="space-y-2">
                  {data.non_placement_reasons.map((r) => (
                    <div key={r.reason} className="flex items-center justify-between border border-slate-100 rounded-lg p-3 bg-slate-50/40">
                      <span className="text-sm font-medium text-slate-900">{r.reason}</span>
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{r.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
