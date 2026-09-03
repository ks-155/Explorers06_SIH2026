'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { mockProviderRanking } from '@/mocks/govMock';
import { getProviderRanking } from '@/lib/api';
import { loadAuth } from '@/lib/auth';

export default function RankingPage() {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => { const a = loadAuth(); if (a) setToken(a.accessToken); }, []);
  const { data, error, isLoading } = useQuery({
    queryKey: ['provider-ranking'],
    queryFn: () => getProviderRanking(token!),
    enabled: !!token,
    staleTime: 30_000,
    retry: 1,
  });
  const rows = (data as unknown as typeof mockProviderRanking) ?? mockProviderRanking;
  const isLive = !error && data !== undefined;
  const [sort, setSort] = useState<'placement' | 'retention'>('placement');
  const sorted = [...rows].sort((a, b) => (b[sort] as number) - (a[sort] as number));

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">Provider Ranking {isLive ? <span className="text-green-700 text-sm">Live</span> : <span className="text-amber-600 text-sm">Mock fallback</span>}</h1>
      <p className="text-sm text-gray-500">GET /api/v1/analytics/provider-ranking (gov/admin only) — {isLoading ? 'Loading…' : ''} {error ? 'mock fallback' : ''}</p>
      <Card>
        <CardHeader className="font-medium flex justify-between items-center">
          Providers — sortable by placement/retention
          <span className="text-xs flex gap-2">
            <button onClick={() => setSort('placement')} className={`px-2 py-1 rounded ${sort === 'placement' ? 'bg-teal-700 text-white' : 'bg-gray-100'}`}>Placement</button>
            <button onClick={() => setSort('retention')} className={`px-2 py-1 rounded ${sort === 'retention' ? 'bg-teal-700 text-white' : 'bg-gray-100'}`}>Retention</button>
          </span>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th>Name</th>
                <th>District</th>
                <th>Placement</th>
                <th>Retention</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="py-1 font-medium">{p.name}</td>
                  <td>{p.district}</td>
                  <td>{p.placement}%</td>
                  <td>{p.retention}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  );
}
