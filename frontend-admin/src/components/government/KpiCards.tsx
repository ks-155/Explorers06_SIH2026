'use client';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

type Props = { data: { trained: number; certified: number; verified_employed: number; unemployed: number; unreachable: number } | null };

export function KpiCards({ data }: Props) {
  if (!data)
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse bg-slate-200 rounded-lg" />
        ))}
      </div>
    );

  const formatNum = (val: number | undefined | null) =>
    typeof val === 'number' ? val.toLocaleString() : '0';

  const items: { label: string; value: string; color: string }[] = [
    { label: 'Trained', value: formatNum(data.trained), color: '#1e293b' },
    { label: 'Certified', value: formatNum(data.certified), color: '#2563eb' },
    { label: 'Verified employed', value: formatNum(data.verified_employed), color: '#059669' },
    { label: 'Unemployed', value: formatNum(data.unemployed), color: '#d97706' },
    { label: 'Unreachable', value: formatNum(data.unreachable), color: '#dc2626' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 animate-page-enter">
      {items.map((it) => (
        <Card key={it.label} className="rounded-lg shadow-sm bg-white hover:shadow-md transition-all duration-200 hover:scale-[1.01]" style={{ borderTopWidth: 3, borderTopColor: it.color }}>
          <CardHeader className="text-xs font-medium text-slate-500 pb-1 pt-3 px-3">{it.label}</CardHeader>
          <CardContent className="px-3 pb-3 pt-0">
            <div className="text-xl font-bold text-slate-900 tracking-tight">{it.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
