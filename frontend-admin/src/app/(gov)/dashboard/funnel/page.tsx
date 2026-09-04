'use client';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getOutcomeFunnel, getOutcomeBreakdown } from '@/lib/api';
import { loadAuth } from '@/lib/auth';

export default function FunnelPage() {
  const [token, setToken] = useState<string | null>(null);
  const queryClient = useQueryClient();
  useEffect(() => {
    const a = loadAuth();
    if (a) setToken(a.accessToken);
  }, []);
  const enabled = !!token;

  const funnelQ = useQuery({
    queryKey: ['outcome-funnel'],
    queryFn: () => getOutcomeFunnel(token!),
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const breakdownQ = useQuery({
    queryKey: ['outcome-breakdown'],
    queryFn: () => getOutcomeBreakdown(token!),
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const funnel = funnelQ.data;
  const breakdown = breakdownQ.data;
  const forbidden = (funnelQ.error as Error)?.message?.includes('Forbidden') || (breakdownQ.error as Error)?.message?.includes('Forbidden') ? 'Forbidden — analytics requires government/admin' : null;
  const fetchError = (funnelQ.error || breakdownQ.error) && !forbidden;
  const loading = funnelQ.isLoading || breakdownQ.isLoading;

  const funnelSteps = funnel
    ? [
        { label: 'Registered', value: funnel.registered, color: '#1e293b' },
        { label: 'Trained', value: funnel.trained, color: '#2563eb' },
        { label: 'Certified', value: funnel.certified, color: '#059669' },
        { label: 'Employed', value: funnel.employed, color: '#d97706' },
        { label: 'Verified Employed', value: funnel.verified_employed, color: '#7c3aed' },
        { label: 'Active Retained', value: funnel.active_retained, color: '#059669' },
      ]
    : [];
  const maxVal = funnelSteps.length > 0 ? Math.max(...funnelSteps.map((s) => s.value), 1) : 1;

  return (
    <main className="space-y-4 animate-page-enter">
      <h1 className="text-xl font-bold text-slate-900">Outcome Funnel</h1>
      <p className="text-sm text-slate-500">Pipeline from registration through training, certification, employment, and retention</p>
      {forbidden && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm shadow-sm">{forbidden}</div>}
      {fetchError && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm shadow-sm flex items-center justify-between">
          <span>Failed to load funnel data</span>
          <button onClick={() => { queryClient.invalidateQueries({ queryKey: ['outcome-funnel'] }); queryClient.invalidateQueries({ queryKey: ['outcome-breakdown'] }); }} className="min-h-[32px] px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-semibold shadow-sm hover:bg-slate-800">Retry</button>
        </div>
      )}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : !funnel ? (
        <div className="bg-slate-50 border border-slate-200 text-slate-600 px-4 py-8 rounded-lg text-sm shadow-sm text-center">No funnel data available</div>
      ) : (
        <Card className="rounded-lg shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="font-semibold text-slate-900 bg-slate-50 border-b border-slate-200">Outcome Funnel — horizontal bars</CardHeader>
          <CardContent className="p-4 bg-white space-y-3">
            {funnelSteps.map((step) => (
              <div key={step.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-900">{step.label}</span>
                  <span className="text-slate-600">{step.value.toLocaleString()}</span>
                </div>
                <div className="h-4 w-full rounded bg-slate-100 border border-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-500"
                    style={{ width: `${(step.value / maxVal) * 100}%`, backgroundColor: step.color }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {breakdown && (
        <Card className="rounded-lg shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="font-semibold text-slate-900 bg-slate-50 border-b border-slate-200">Outcome Breakdown by Type</CardHeader>
          <CardContent className="p-4 bg-white">
            <div className="space-y-2">
              {breakdown.by_type.map((bt) => (
                <div key={bt.type} className="flex items-center justify-between border border-slate-100 rounded-lg p-3 bg-slate-50/40">
                  <div>
                    <span className="font-medium text-slate-900">{bt.type}</span>
                    <span className="text-xs text-slate-500 ml-2">({bt.count} total, {bt.verified} verified)</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{bt.count}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border border-amber-200 rounded-lg p-3 bg-amber-50/40">
                <span className="font-medium text-slate-900">Unemployed</span>
                <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">{breakdown.unemployed}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
