'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadAuth } from '@/lib/auth';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { VerifyCard, type VerifyEmploymentReq } from '@/components/employer/VerifyCard';
import { mockPending } from '@/mocks/employerMock';

type RespondedItem = { employment_id: string; trainee_name: string; decision: string; time: string };

export default function EmployerDashboard({ params }: { params: { id: string } }) {
  const id = params.id;
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [pending, setPending] = useState(mockPending);
  const [responded, setResponded] = useState<RespondedItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('pending');
  const [lastElapsed, setLastElapsed] = useState<string | null>(null);

  useEffect(() => {
    const a = loadAuth();
    if (!a) {
      router.replace('/login');
      return;
    }
    setRole(a.role);
    // RBAC: employer/admin only for this portal (government blocked here)
    if (a.role !== 'employer' && a.role !== 'admin') {
      // still show but warn — Phase 1 RBAC shell: government sees dashboard, employer sees this
      // don't redirect hard, just show notice; Phase 3 will enforce strictly
    }
  }, [router]);

  async function onVerify(req: VerifyEmploymentReq) {
    // Phase 2 mocked — Phase 4 will do: authFetch(`/employers/${id}/verify-employment`, token, {method:'POST', body:JSON.stringify(req)})
    const start = Date.now();
    await new Promise((r) => setTimeout(r, 300)); // mimic network
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    setLastElapsed(elapsed);
    const item = pending.find((x) => x.employment_id === req.employment_id);
    setPending((p) => p.filter((x) => x.employment_id !== req.employment_id));
    if (item) setResponded((r) => [...r, { employment_id: item.employment_id, trainee_name: item.trainee_name, decision: req.decision, time: `${elapsed}s` }]);
    setToast(`✓ ${req.decision === 'confirm' ? 'Confirmed' : 'Denied'} ${item?.trainee_name} in ${elapsed}s — still_employed=${req.still_employed}, job_relevant=${req.job_relevant} (mock)`);
    setTimeout(() => setToast(null), 4000);
  }

  const respondedCount = responded.length;
  const isBlocked = role === 'government' || role === 'trainee';

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Employer Dashboard — Phase 2 (mocked)</h1>
      <p className="text-sm text-gray-500">
        Employer ID: <span className="font-mono">{id}</span> · Role: {role ?? '—'} · Port :3002 · One-click &lt;30s <span className="text-green-600">MEMBER-2-FRONTEND.md:58</span>{' '}
        {lastElapsed && <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">last verify: {lastElapsed}s</span>}
      </p>

      {isBlocked && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded text-sm">
          Note: Role `{role}` cannot verify — portal is for `employer/admin` only. Switch to employer login. (RBAC `MEMBER-2-FRONTEND.md:42`)
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold">{pending.length}</div>
            <div className="text-xs text-gray-500">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold">{respondedCount}</div>
            <div className="text-xs text-gray-500">Responded</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold">{mockPending.length}</div>
            <div className="text-xs text-gray-500">Total assigned</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 text-xs">
        <button onClick={() => setFilter('pending')} className={`px-3 py-1 rounded ${filter === 'pending' ? 'bg-teal-700 text-white' : 'bg-gray-100'}`}>
          Pending ({pending.length})
        </button>
        <button onClick={() => setFilter('verified')} className={`px-3 py-1 rounded ${filter === 'verified' ? 'bg-teal-700 text-white' : 'bg-gray-100'}`}>
          Responded ({respondedCount})
        </button>
      </div>

      {toast && <div className="bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded text-sm">{toast}</div>}

      {filter === 'pending' ? (
        <Card>
          <CardHeader className="font-medium">Pending — GET /api/v1/employers/:id/verify-pending (mock until Phase 4)</CardHeader>
          <CardContent className="space-y-3">
            {pending.length === 0 ? (
              <p className="text-sm text-gray-500">All caught up — no pending verifications.</p>
            ) : (
              pending.map((item) => <VerifyCard key={item.employment_id} item={item} onVerify={onVerify} />)
            )}
            <p className="text-xs text-gray-400">
              Phase 4 wires live POST /api/v1/employers/:id/verify-employment employment_id, decision, still_employed, job_relevant per API-CONTRACT.md. One click → score 87% (20 self +40 employer +27 evidence).
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="font-medium">Responded</CardHeader>
          <CardContent>
            {responded.length === 0 ? (
              <p className="text-sm text-gray-500">No responses yet — verify a candidate above.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th>Trainee</th>
                    <th>Decision</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {responded.map((r) => (
                    <tr key={r.employment_id} className="border-t">
                      <td className="py-1">{r.trainee_name}</td>
                      <td className={`py-1 ${r.decision === 'confirm' ? 'text-green-700' : 'text-red-700'}`}>{r.decision}</td>
                      <td className="py-1">{r.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
