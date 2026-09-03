'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { mockGovDashboard } from '@/mocks/govMock';
import { getDistrictAnalytics } from '@/lib/api';
import { loadAuth } from '@/lib/auth';

export default function DistrictPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => { const a = loadAuth(); if (a) setToken(a.accessToken); }, []);
  const { data, error } = useQuery({ queryKey: ['district', id], queryFn: () => getDistrictAnalytics(id, token!), enabled: !!token, staleTime: 30_000, retry: 1 });
  const isLive = !error && data !== undefined;
  // Expect data shape {metrics or sector breakdown}; fallback to mock
  const sectors = (data as unknown as { topSectors?: typeof mockGovDashboard.topSectors })?.topSectors ?? mockGovDashboard.topSectors;
  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">District {id} {isLive ? <span className="text-green-700 text-sm">Live</span> : <span className="text-amber-600 text-sm">Mock</span>}</h1>
      <p className="text-sm text-gray-500">GET /api/v1/analytics/district/:id — sector breakdown, top employers</p>
      <Card>
        <CardHeader className="font-medium">Top sectors</CardHeader>
        <CardContent className="space-y-1 text-sm">
          {sectors.map((s) => (
            <div key={s.sector} className="flex justify-between border-b py-1">
              <span>{s.sector}</span>
              <span>{s.employed.toLocaleString()}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      {error && <p className="text-xs text-amber-600">Mock fallback — M4 analytics still stub</p>}
    </main>
  );
}
