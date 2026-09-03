'use client';
import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const WAGE_ORDER = ['start', '3m', 'm6', '6m', 'm12', '12m', '24m'] as const;
const TOGGLE_RANGES = ['3m', '6m', '12m', '24m'] as const;
type ToggleRange = (typeof TOGGLE_RANGES)[number];

function normalizeKey(k: string): string {
  if (k === 'm6' || k === '6m') return '6m';
  if (k === 'm12' || k === '12m') return '12m';
  return k;
}

export function WageChart({ wage }: { wage: Record<string, number> | null | undefined }) {
  const [range, setRange] = useState<ToggleRange>('24m');

  const data = useMemo(() => {
    const safeWage = wage && typeof wage === 'object' ? wage : {};
    const entries = Object.entries(safeWage)
      .map(([k, v]) => ({ period: normalizeKey(k), raw: k, wage: v }))
      .sort((a, b) => WAGE_ORDER.indexOf(a.raw as never) - WAGE_ORDER.indexOf(b.raw as never));
    // filter by toggle: show up to selected range inclusive, always include start
    const orderIdx: Record<string, number> = { start: -1, '3m': 0, '6m': 1, '12m': 2, '24m': 3 };
    const selectedIdx = orderIdx[range] ?? 3;
    const filtered = entries.filter((e) => {
      if (e.period === 'start') return true;
      const idx = orderIdx[e.period] ?? 99;
      return idx <= selectedIdx;
    });
    return filtered.length ? filtered : entries;
  }, [wage, range]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {TOGGLE_RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`min-h-[32px] px-3 py-1 text-xs font-semibold rounded-lg border shadow-sm transition-colors ${range === r ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
          >
            {r}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data as unknown as { period: string; wage: number }[]} margin={{ left: 8, right: 12, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#475569' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={{ stroke: '#e2e8f0' }} />
          <YAxis tick={{ fontSize: 12, fill: '#475569' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={{ stroke: '#e2e8f0' }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontSize: '12px', color: '#1e293b' }}
            cursor={{ stroke: '#cbd5e1', strokeDasharray: '3 3' }}
            labelStyle={{ color: '#475569', fontWeight: 600 }}
            formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Wage']}
          />
          <Line type="monotone" dataKey="wage" stroke="#059669" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, fill: '#ffffff', stroke: '#059669' }} activeDot={{ r: 6, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }} />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-slate-500">Smooth monotone curve · wage progression start → 6m → 12m · toggles 3m/6m/12m/24m filter visible points</p>
    </div>
  );
}
