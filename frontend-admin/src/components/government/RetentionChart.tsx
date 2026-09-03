'use client';
import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const ORDER = ['3m', '6m', '12m', '24m'] as const;
type Range = (typeof ORDER)[number];

export function RetentionChart({ retention }: { retention: Record<string, number> }) {
  const [range, setRange] = useState<Range>('24m');
  const data = useMemo(() => {
    const entries = Object.entries(retention)
      .map(([k, v]) => ({ period: k, rate: v }))
      .sort((a, b) => ORDER.indexOf(a.period as Range) - ORDER.indexOf(b.period as Range));
    const idx = ORDER.indexOf(range);
    if (idx === -1) return entries;
    const allowed = new Set(ORDER.slice(0, idx + 1));
    const filtered = entries.filter((e) => allowed.has(e.period as Range));
    return filtered.length ? filtered : entries;
  }, [retention, range]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {ORDER.map((r) => (
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
        <LineChart data={data} margin={{ left: 8, right: 12, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#475569' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={{ stroke: '#e2e8f0' }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#475569' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={{ stroke: '#e2e8f0' }} unit="%" />
          <Tooltip
            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontSize: '12px', color: '#1e293b' }}
            cursor={{ stroke: '#cbd5e1', strokeDasharray: '3 3' }}
            labelStyle={{ color: '#475569', fontWeight: 600 }}
            formatter={(v: number) => [`${v}%`, 'Retention']}
          />
          <Line type="monotone" dataKey="rate" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, fill: '#ffffff', stroke: '#2563eb' }} activeDot={{ r: 6, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }} />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-slate-500">Smooth monotone curve · retention % over time · toggles 3m/6m/12m/24m filter visible points</p>
    </div>
  );
}
