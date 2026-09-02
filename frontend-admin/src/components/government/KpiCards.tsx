'use client';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { mockGovDashboard } from '@/mocks/govMock';

export function KpiCards() {
  const m = mockGovDashboard;
  const items: [string, string | number][] = [
    ['Trained', m.trained.toLocaleString()],
    ['Certified', m.certified.toLocaleString()],
    ['Verified employed', m.verified_employed.toLocaleString()],
    ['Unemployed', m.unemployed.toLocaleString()],
    ['Unreachable', m.unreachable.toLocaleString()],
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {items.map(([k, v]) => (
        <Card key={k}>
          <CardHeader className="text-xs text-gray-500">{k}</CardHeader>
          <CardContent className="text-xl font-semibold">{v}</CardContent>
        </Card>
      ))}
    </div>
  );
}
