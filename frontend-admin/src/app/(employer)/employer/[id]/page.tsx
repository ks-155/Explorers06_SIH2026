'use client';
import { useEffect, useState } from 'react';
import { loadAuth } from '@/lib/auth';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { VerifyCard, type VerifyEmploymentReq } from '@/components/employer/VerifyCard';
import { mockPending } from '@/mocks/employerMock';

export default function EmployerDashboard({ params }: { params: { id: string } }) {
  const id = params.id;
  const [role, setRole] = useState<string | null>(null);
  const [pending, setPending] = useState(mockPending);
  const [toast, setToast] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('all');

  useEffect(() => {
    const a = loadAuth();
    setRole(a?.role ?? null);
  }, []);

  async function onVerify(req: VerifyEmploymentReq) {
    // Phase 2 mocked — Phase 4 will do: authFetch(`/employers/${id}/verify-employment`, token, {method:'POST', body:JSON.stringify(req)})
    const start = Date.now();
    await new Promise((r) => setTimeout(r, 400)); // mimic network
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    setPending((p) => p.filter((x) => x.employment_id !== req.employment_id));
    setToast(`✓ ${req.decision === 'confirm' ? 'Confirmed' : 'Denied'} in ${elapsed}s — still_employed=${req.still_employed}, job_relevant=${req.job_relevant} (mock)`);
    setTimeout(() => setToast(null), 3000);
  }

  const respondedCount = mockPending.length - pending.length;

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Employer Dashboard — Phase 2 (mocked)</h1>
      <p className="text-sm text-gray-500">
        Employer ID: <span className="font-mono">{id}</span> · Role: {role ?? '—'} · Port :3002 · One-click &lt;30s <span className="text-green-600">MEMBER-2-FRONTEND.md:58</span>
      </p>

      <div className="flex gap-2 text-xs">
        <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-teal-700 text-white' : 'bg-gray-100'}`}>
          All ({mockPending.length})
        </button>
        <button onClick={() => setFilter('pending')} className={`px-3 py-1 rounded ${filter === 'pending' ? 'bg-teal-700 text-white' : 'bg-gray-100'}`}>
          Pending ({pending.length})
        </button>
        <button onClick={() => setFilter('verified')} className={`px-3 py-1 rounded ${filter === 'verified' ? 'bg-teal-700 text-white' : 'bg-gray-100'}`}>
          Responded ({respondedCount})
        </button>
      </div>

      {toast && <div className="bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded text-sm">{toast}</div>}

      <Card>
        <CardHeader className="font-medium">Pending verifications — GET /api/v1/employers/:id/verify-pending (mock until Phase 4)</CardHeader>
        <CardContent className="space-y-3">
          {pending.length === 0 ? (
            <p className="text-sm text-gray-500">All caught up — no pending verifications.</p>
          ) : (
            pending.map((item) => <VerifyCard key={item.employment_id} item={item} onVerify={onVerify} />)
          )}
          <p className="text-xs text-gray-400">
            Phase 4 will wire live POST /api/v1/employers/:id/verify-employment employment_id, decision, still_employed, job_relevant per API-CONTRACT.md. Confidence badge shows current score (cap 100, Phase 4 returns 87% after confirm+evidence).
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
