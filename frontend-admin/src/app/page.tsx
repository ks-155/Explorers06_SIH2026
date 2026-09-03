'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadAuth, type Role } from '@/lib/auth';
import { redirectPathForRole } from '@/lib/rbac';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Home() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    const a = loadAuth();
    if (a?.role) {
      setRole(a.role);
      router.replace(redirectPathForRole(a.role as never));
    }
  }, [router]);

  const isGov = role === 'government' || role === 'admin';
  const isEmployer = role === 'employer' || role === 'admin';
  const continueHref = role ? redirectPathForRole(role) : '/login';

  return (
    <main className="max-w-4xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">SOIS Admin (Member 2) — Frontend :3002</h1>
        <p className="text-sm text-gray-600 mt-2">Modules M4 Employer Portal + M5 Outcome Analytics. See /login.</p>
      </div>

      {role && (
        <Card className="border-teal-200 bg-teal-50">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <p className="text-sm">
              Signed in as <span className="font-mono font-medium">{role}</span> — continue to your dashboard
            </p>
            <Button onClick={() => router.push(continueHref)} className="shrink-0">
              Continue → {continueHref}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={isGov ? 'ring-1 ring-teal-600' : ''}>
          <CardHeader className="font-semibold flex items-center justify-between">
            <span>Government Analytics</span>
            {role && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full border ${isGov ? 'bg-teal-700 text-white border-teal-700' : 'bg-amber-50 text-amber-700 border-amber-200'}`}
              >
                {isGov ? 'Your role ✓' : 'Requires gov/admin'}
              </span>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Aggregate outcome analytics for <code>government/admin</code> per <code>API-CONTRACT.md 8</code>. Placement,
              retention, wage progression, provider ranking, district &amp; skill gaps.
            </p>
            <ul className="text-xs text-gray-500 list-disc ml-4 space-y-0.5">
              <li>KPI — trained / certified / verified employed</li>
              <li>Retention 3m/6m/12m/24m + wage start→12m (Recharts)</li>
              <li>Provider ranking &amp; district breakdown · tanstack stale 30s</li>
            </ul>
            <div className="flex gap-2 pt-1">
              <Button onClick={() => router.push('/dashboard')}>Open Gov Dashboard</Button>
              <button
                className="inline-flex items-center justify-center rounded-md border border-teal-200 bg-white px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50"
                onClick={() => router.push('/dashboard/ranking')}
              >
                Ranking
              </button>
            </div>
            <p className="text-xs text-gray-400">Live GET /analytics/dashboard with mock fallback (M4 stub) — auto-fallback on error only.</p>
          </CardContent>
        </Card>

        <Card className={isEmployer ? 'ring-1 ring-teal-600' : ''}>
          <CardHeader className="font-semibold flex items-center justify-between">
            <span>Employer Portal</span>
            {role && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full border ${isEmployer ? 'bg-teal-700 text-white border-teal-700' : 'bg-amber-50 text-amber-700 border-amber-200'}`}
              >
                {isEmployer ? 'Your role ✓' : 'Requires employer/admin'}
              </span>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Verify pending employments and attach evidence checklist per <code>API-CONTRACT.md 154</code> — salary slip
              +15, bank statement +10, offer letter +10, weights capped at 100.
            </p>
            <ul className="text-xs text-gray-500 list-disc ml-4 space-y-0.5">
              <li>Live GET /employers/:id/verify-pending + POST verify-employment</li>
              <li>Evidence POST /employment/:id/evidence with confidence badge</li>
              <li>Phase 4 mock fallback preserved when backend offline</li>
            </ul>
            <div className="flex gap-2 pt-1">
              <Button onClick={() => router.push('/employer/me')}>Open Employer Dashboard</Button>
              <button
                className="inline-flex items-center justify-center rounded-md border border-teal-200 bg-white px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50"
                onClick={() => router.push('/login')}
              >
                Login
              </button>
            </div>
            <p className="text-xs text-gray-400">RBAC: employer/admin only · gov/trainee → 403 + redirect /login.</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <a href="/login" className="text-teal-700 underline">
          Login (gov / employer)
        </a>
        <span className="text-gray-300">·</span>
        <a href="/health" className="text-teal-700 underline">
          Health → proxy to :3001
        </a>
        <span className="text-gray-300">·</span>
        <a href="/dashboard/skill-gaps" className="text-teal-700 underline">
          Skill gaps
        </a>
        <span className="text-gray-300">·</span>
        <a href="/dashboard/district/pune" className="text-teal-700 underline">
          District Pune
        </a>
      </div>

      <p className="text-xs text-gray-400">Next 14 · proxy /api/v1 → {`{NEXT_PUBLIC_API_URL}`}/api/v1 · API-CONTRACT.md v1.0.0</p>
    </main>
  );
}
