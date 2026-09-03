'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loadAuth } from '@/lib/auth';
import { canViewEmployerPortal } from '@/lib/rbac';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { VerifyCard, type VerifyEmploymentReq } from '@/components/employer/VerifyCard';
import { mockPending } from '@/mocks/employerMock';
import { getVerifyPending, postVerifyEmployment } from '@/lib/api';

type RespondedItem = { employment_id: string; trainee_name: string; decision: string; time: string };

function EmployerDashboardInner({ params }: { params: { id: string } }) {
  const id = params.id;
  const router = useRouter();
  const qc = useQueryClient();
  const [responded, setResponded] = useState<RespondedItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'verified'>('pending');
  const [lastElapsed, setLastElapsed] = useState<string | null>(null);
  const [auth, setAuth] = useState<{ token: string; role: string } | null>(null);

  useEffect(() => {
    const a = loadAuth();
    if (!a) {
      router.replace('/login');
      return;
    }
    setAuth({ token: a.accessToken, role: a.role });
    if (!canViewEmployerPortal(a.role as never)) {
      router.replace('/login');
      return;
    }
  }, [router]);

  const token = auth?.token ?? null;
  const role = auth?.role ?? null;

  // Live GET /employers/:id/verify-pending (M2-01)
  const { data: livePending, isLoading, error } = useQuery({
    queryKey: ['pending', id],
    queryFn: () => getVerifyPending(id, token!),
    enabled: !!token,
    staleTime: 30_000,
    retry: 1,
  });

  // Fallback to mock if backend not reachable or empty (keeps demo alive before M4 analytics)
  const pending = (livePending as unknown as typeof mockPending) ?? null;
  const displayPending = pending && pending.length >= 0 ? pending : mockPending;
  // If live returned empty array but we have mock, prefer live when success; if error, use mock
  const effectivePending = error ? mockPending : livePending !== undefined ? (livePending as never as typeof mockPending) : mockPending;

  const verifyMut = useMutation({
    mutationFn: (req: VerifyEmploymentReq) => postVerifyEmployment(id, token!, req),
    onSuccess: (_, req) => {
      // optimistic: remove from pending cache
      qc.invalidateQueries({ queryKey: ['pending', id] });
      const item = effectivePending.find((x) => x.employment_id === req.employment_id);
      if (item) setResponded((r) => [...r, { employment_id: item.employment_id, trainee_name: item.trainee_name, decision: req.decision, time: lastElapsed ?? '0.3s' }]);
      setToast(`✓ ${req.decision === 'confirm' ? 'Confirmed' : 'Denied'} ${item?.trainee_name ?? req.employment_id} — still_employed=${req.still_employed}, job_relevant=${req.job_relevant}`);
      setTimeout(() => setToast(null), 4000);
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e);
      setToast(`✗ Verify failed: ${msg}`);
      setTimeout(() => setToast(null), 4000);
    },
  });

  async function onVerify(req: VerifyEmploymentReq) {
    const start = Date.now();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    setLastElapsed(elapsed);
    // If backend reachable, use live mutation; else fallback to local mock removal (keeps Phase 2 demo)
    if (token && !error) {
      verifyMut.mutate(req);
    } else {
      // Fallback mock path (when M3 not yet deployed)
      await new Promise((r) => setTimeout(r, 200));
      const item = effectivePending.find((x) => x.employment_id === req.employment_id);
      // mutate local state via refetch simulation: we can't mutate query cache easily for mock, just show toast
      if (item) setResponded((r) => [...r, { employment_id: item.employment_id, trainee_name: item.trainee_name, decision: req.decision, time: `${elapsed}s` }]);
      setToast(`✓ ${req.decision === 'confirm' ? 'Confirmed' : 'Denied'} ${item?.trainee_name} in ${elapsed}s (mock fallback — wiring live in Phase 4)`);
      setTimeout(() => setToast(null), 4000);
    }
  }

  if (!auth) return <p className="p-8 text-sm text-gray-500">Checking employer access…</p>;
  if (!canViewEmployerPortal(role as never)) return <p className="p-8 text-sm text-red-600">403 — Employer/Admin only</p>;

  const respondedCount = responded.length;

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Employer Dashboard — Live wired</h1>
      <p className="text-sm text-gray-500">
        Employer ID: <span className="font-mono">{id}</span> · Role: {role} · Port :3002{' '}
        {lastElapsed && <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">last verify: {lastElapsed}s</span>}
        {isLoading && <span className="ml-2 text-xs">Loading pending…</span>}
        {error && <span className="ml-2 text-xs text-amber-600">live fetch failed — showing mock fallback</span>}
      </p>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold">{effectivePending.length}</div>
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
            <div className="text-2xl font-bold">{effectivePending.length + respondedCount}</div>
            <div className="text-xs text-gray-500">Total</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 text-xs">
        <button onClick={() => setFilter('pending')} className={`px-3 py-1 rounded ${filter === 'pending' ? 'bg-teal-700 text-white' : 'bg-gray-100'}`}>
          Pending ({effectivePending.length})
        </button>
        <button onClick={() => setFilter('verified')} className={`px-3 py-1 rounded ${filter === 'verified' ? 'bg-teal-700 text-white' : 'bg-gray-100'}`}>
          Responded ({respondedCount})
        </button>
      </div>

      {toast && <div className="bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded text-sm">{toast}</div>}

      {filter === 'pending' ? (
        <Card>
          <CardHeader className="font-medium">Pending — GET /api/v1/employers/:id/verify-pending (live, fallback mock)</CardHeader>
          <CardContent className="space-y-3">
            {effectivePending.length === 0 ? (
              <p className="text-sm text-gray-500">All caught up — no pending verifications.</p>
            ) : (
              effectivePending.map((item) => <VerifyCard key={item.employment_id} item={item} onVerify={onVerify} />)
            )}
            <p className="text-xs text-gray-400">Live POST /api/v1/employers/:id/verify-employment employment_id, decision, still_employed, job_relevant per API-CONTRACT.md:204. Mock fallback keeps demo when backend offline.</p>
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

// Strict RBAC: withRole replaced by inline canViewEmployerPortal check above (M2-05) — only employer/admin allowed, government/trainee redirected
export default EmployerDashboardInner;
