'use client';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

type Props = { data: { trained: number; certified: number; verified_employed: number; unemployed: number; unreachable: number } | null };

export function KpiCards({ data }: Props) {
  if (!data) return <div className="text-sm text-gray-500">Loading KPIs…</div>;
  const items: [string, string | number][] = [
    ['Trained', data.trained.toLocaleString()],
    ['Certified', data.certified.toLocaleString()],
    ['Verified employed', data.verified_employed.toLocaleString()],
    ['Unemployed', data.unemployed.toLocaleString()],
    ['Unreachable', data.unreachable.toLocaleString()],
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
