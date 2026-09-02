'use client';
import { mockGovDashboard } from '@/mocks/govMock';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export default function DistrictPage({ params }: { params: { id: string } }) {
  const id = params.id;
  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">District {id} (mock)</h1>
      <p className="text-sm text-gray-500">Phase 5 → `GET /api/v1/analytics/district/:id` — sector breakdown, top employers</p>
      <Card>
        <CardHeader className="font-medium">Top sectors</CardHeader>
        <CardContent className="space-y-1 text-sm">
          {mockGovDashboard.topSectors.map((s) => (
            <div key={s.sector} className="flex justify-between border-b py-1">
              <span>{s.sector}</span>
              <span>{s.employed.toLocaleString()}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
