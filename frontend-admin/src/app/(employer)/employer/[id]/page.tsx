'use client';
import { useEffect, useState } from 'react';
import { loadAuth } from '@/lib/auth';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

// Phase 1 shell — Phase 2 builds VerifyCard, Phase 4 wires POST /employers/:id/verify-employment
export default function EmployerDashboard({ params }: { params: { id: string } }) {
  const id = params.id;
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    const a = loadAuth();
    setRole(a?.role ?? null);
  }, []);
  return (
    <main className="p-6 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Employer Dashboard</h1>
      <p className="text-sm text-gray-500">
        Employer ID: <span className="font-mono">{id}</span> · Role: {role ?? '—'} · Port :3002
      </p>
      <Card>
        <CardHeader className="font-medium">Pending verifications</CardHeader>
        <CardContent className="text-sm text-gray-600">
          Phase 1: shell only. Phase 2 (idle/UI prep per WORKFLOW-FLOW.md:117) adds pending table via
          <code> GET /api/v1/employers/:id/verify-pending</code>. Phase 4 wires
          <code> POST /api/v1/employers/:id/verify-employment</code> — confirm/deny + still_employed + job_relevant in one click &lt;30s.
        </CardContent>
      </Card>
    </main>
  );
}
