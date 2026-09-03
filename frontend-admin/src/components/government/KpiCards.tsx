'use client';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export type DashboardKpis = {
  trained: number;
  certified: number;
  verified_employed: number;
  unemployed: number;
  unreachable: number;
};

type Props = { data: DashboardKpis | null };

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

  const raw = data as unknown as Record<string, unknown>;
  const items: { label: string; value: string; color: string; hint: string }[] = [
    {
      label: 'Trained',
      value: formatNum((raw.trained as number) ?? (raw.total_trainees as number)),
      color: '#1e293b',
      hint: 'Trainees with training records',
    },
    {
      label: 'Certified',
      value: formatNum(raw.certified as number),
      color: '#2563eb',
      hint: 'Completed certification',
    },
    {
      label: 'Verified employed',
      value: formatNum((raw.verified_employed as number) ?? (raw.verified_placements as number)),
      color: '#059669',
      hint: 'Employer or evidence confirmed',
    },
    {
      label: 'Unemployed',
      value: formatNum(raw.unemployed as number),
      color: '#d97706',
      hint: 'Certified, no active employment',
    },
    {
      label: 'Unreachable',
      value: formatNum(raw.unreachable as number),
      color: '#dc2626',
      hint: 'Follow-ups failed (all channels)',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 animate-page-enter">
      {items.map((it) => (
        <Card key={it.label} className="rounded-lg shadow-sm border-slate-200 bg-white hover:shadow-md transition-all duration-200 hover:border-slate-300">
          <CardHeader className="text-xs font-medium text-slate-500 pb-1 pt-3 px-3">{it.label}</CardHeader>
          <CardContent className="px-3 pb-3 pt-0">
            <div className="text-xl font-bold text-slate-900 tracking-tight">{it.value}</div>
            <p className="mt-2 text-[11px] text-slate-500 leading-snug">{it.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
