'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function RetentionChart({ retention }: { retention: Record<string, number> }) {
  const data = Object.entries(retention).map(([k, v]) => ({ period: k, rate: v }));
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="period" />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Line type="monotone" dataKey="rate" stroke="#0f766e" strokeWidth={2} dot />
      </LineChart>
    </ResponsiveContainer>
  );
}
