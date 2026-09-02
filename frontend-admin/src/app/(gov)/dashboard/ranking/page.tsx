'use client';
import { mockProviderRanking } from '@/mocks/govMock';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export default function RankingPage() {
  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">Provider Ranking (mock Phase 3)</h1>
      <p className="text-sm text-gray-500">Sortable table Phase 5 → `GET /api/v1/analytics/provider-ranking` (gov/admin only)</p>
      <Card>
        <CardHeader className="font-medium">Providers — sortable by placement/retention</CardHeader>
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
              {mockProviderRanking.map((p) => (
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
