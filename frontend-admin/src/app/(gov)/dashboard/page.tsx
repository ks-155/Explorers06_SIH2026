'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadAuth } from '@/lib/auth';
import { canViewAnalytics } from '@/lib/rbac';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

// Phase 1: shell + RBAC guard; Phase 3/5 will wire real GET /analytics/dashboard
export default function GovDashboardPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const a = loadAuth();
    if (!a) {
      router.replace('/login');
      return;
    }
    setRole(a.role);
    if (!canViewAnalytics(a.role)) {
      router.replace('/login');
      return;
    }
    setChecked(true);
  }, [router]);

  if (!checked) return <p className="p-8 text-sm text-gray-500">Checking access…</p>;

  return (
    <main className="p-6 max-w-6xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Government Dashboard</h1>
      <p className="text-sm text-gray-500">
        Role: <span className="font-mono">{role}</span> · Aggregate analytics only for government/admin (API-CONTRACT.md 8). Employer blocked client + server.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          ['Trained', '—'],
          ['Certified', '—'],
          ['Verified employed', '—'],
          ['Unemployed', '—'],
          ['Unreachable', '—'],
        ].map(([k, v]) => (
          <Card key={k}>
            <CardHeader className="text-xs text-gray-500">{k}</CardHeader>
            <CardContent className="text-xl font-semibold">{v}</CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="font-medium">Phase 1 — Mock KPIs</CardHeader>
        <CardContent className="text-sm text-gray-600">
          Real KPIs arrive Phase 5 via <code>GET /api/v1/analytics/dashboard</code> (government/admin only). Phase 1 shows shell + RBAC guard.
          <ul className="list-disc ml-5 mt-2">
            <li>Retention 3m/6m/12m/24m → Recharts LineChart (Phase 5)</li>
            <li>Provider ranking → sortable table (Phase 5)</li>
            <li>Skill gaps → cards (Phase 5)</li>
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
