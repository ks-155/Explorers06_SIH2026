'use client';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

type Props = { data: { trained: number; certified: number; verified_employed: number; unemployed: number; unreachable: number } | null };

function Sparkline({ values, color = '#2563eb' }: { values: number[]; color?: string }) {
  const w = 80;
  const h = 24;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" aria-hidden>
      <polyline fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" points={points} opacity={0.9} />
      {/* subtle fill under line */}
      <polyline
        fill={color}
        fillOpacity={0.08}
        stroke="none"
        points={`${points} ${w},${h} 0,${h}`}
      />
    </svg>
  );
}

export function KpiCards({ data }: Props) {
  if (!data)
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse bg-slate-200 rounded-lg" />
        ))}
      </div>
    );
  const items: { label: string; value: string; spark: number[]; color: string; trend: string }[] = [
    { label: 'Trained', value: data.trained.toLocaleString(), spark: [82, 88, 92, 96, 100], color: '#1e293b', trend: '+4.2%' },
    { label: 'Certified', value: data.certified.toLocaleString(), spark: [70, 75, 80, 78, 82], color: '#2563eb', trend: '+2.1%' },
    { label: 'Verified employed', value: data.verified_employed.toLocaleString(), spark: [40, 44, 48, 50, 51], color: '#059669', trend: '+5.8%' },
    { label: 'Unemployed', value: data.unemployed.toLocaleString(), spark: [12, 11, 10, 9, 9], color: '#d97706', trend: '-3.4%' },
    { label: 'Unreachable', value: data.unreachable.toLocaleString(), spark: [14, 13, 12, 11, 10], color: '#dc2626', trend: '-2.0%' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 animate-page-enter">
      {items.map((it) => (
        <Card key={it.label} className="rounded-lg shadow-sm border-slate-200 bg-white hover:shadow-md transition-all duration-200 hover:scale-[1.01] hover:border-slate-300">
          <CardHeader className="text-xs font-medium text-slate-500 pb-1 pt-3 px-3">{it.label}</CardHeader>
          <CardContent className="px-3 pb-3 pt-0">
            <div className="text-xl font-bold text-slate-900 tracking-tight">{it.value}</div>
            <div className="flex items-center justify-between mt-2">
              <Sparkline values={it.spark} color={it.color} />
              <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${it.trend.startsWith('+') ? 'bg-emerald-50 text-[#059669]' : it.trend.startsWith('-') && it.label !== 'Unemployed' && it.label !== 'Unreachable' ? 'bg-red-50 text-[#dc2626]' : 'bg-amber-50 text-[#d97706]'}`}>
                {it.trend}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
