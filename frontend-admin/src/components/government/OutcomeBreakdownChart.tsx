'use client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

type OutcomeItem = { label: string; count: number; type?: string };

const COLORS: Record<string, string> = {
  full_time: '#2563eb',
  part_time: '#3b82f6',
  contract: '#6366f1',
  self_employed: '#059669',
  apprenticeship: '#0d9488',
  unemployed: '#d97706',
  unreachable: '#dc2626',
};

export function OutcomeBreakdownChart({ data }: { data: OutcomeItem[] }) {
  if (!data.length) {
    return (
      <p className="text-sm text-slate-500 text-center py-6">
        No employment outcome breakdown recorded yet.
      </p>
    );
  }

  const total = data.reduce((s, d) => s + d.count, 0);
  const chartData = data.map((d) => ({
    ...d,
    pct: total > 0 ? Math.round((d.count / total) * 1000) / 10 : 0,
  }));

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ left: 8, right: 12, top: 8, bottom: 48 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#475569' }}
            angle={-25}
            textAnchor="end"
            interval={0}
            height={60}
          />
          <YAxis tick={{ fontSize: 11, fill: '#475569' }} allowDecimals={false} />
          <Tooltip
            formatter={(v: number, _n, p) => {
              const payload = p?.payload as { pct?: number };
              return [`${v} trainees (${payload?.pct ?? 0}%)`, 'Count'];
            }}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry) => (
              <Cell
                key={entry.label}
                fill={COLORS[entry.type ?? ''] ?? '#64748b'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-2">
        {chartData.map((d) => (
          <span
            key={d.label}
            className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-full px-2 py-0.5"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: COLORS[d.type ?? ''] ?? '#64748b' }}
            />
            {d.label}: {d.count} ({d.pct}%)
          </span>
        ))}
      </div>
    </div>
  );
}
