'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function WageChart({ wage }: { wage: Record<string, number> }) {
  const data = Object.entries(wage).map(([k, v]) => ({ period: k, wage: v }));
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="period" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="wage" stroke="#7c3aed" strokeWidth={2} dot />
      </LineChart>
    </ResponsiveContainer>
  );
}
