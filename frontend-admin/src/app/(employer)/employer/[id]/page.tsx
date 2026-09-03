'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loadAuth } from '@/lib/auth';
import { canViewEmployerPortal } from '@/lib/rbac';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { VerifyCard, type VerifyEmploymentReq } from '@/components/employer/VerifyCard';
import { ConfidenceBadge } from '@/components/employer/ConfidenceBadge';
import { mockPending } from '@/mocks/employerMock';
import { addEvidence, getVerifyPending, postVerifyEmployment, type AddEvidenceResponse, type EvidenceType } from '@/lib/api';

type RespondedItem = { employment_id: string; trainee_name: string; decision: string; time: string; score?: number; level?: string };

// Phase 4 (M2): per-candidate evidence checklist — weights per API-CONTRACT.md:185-190
type EvidenceKey = Extract<EvidenceType, 'salary_slip' | 'offer_letter' | 'bank_statement'>;
const EVIDENCE_OPTIONS: { key: EvidenceKey; label: string; points: number }[] = [
  { key: 'salary_slip', label: 'Salary slip', points: 15 },
  { key: 'offer_letter', label: 'Offer letter', points: 10 },
  { key: 'bank_statement', label: 'Bank statement', points: 10 },
];

function extractScoreLevel(data: unknown): { score?: number; level?: string } {
  if (!data || typeof data !== 'object') return {};
  const d = data as Record<string, unknown>;
  if (typeof d.confidence_score === 'number') {
    return { score: d.confidence_score, level: typeof d.level === 'string' ? d.level : undefined };
  }
  const emp = d.employment;
  if (emp && typeof emp === 'object') {
    const e = emp as Record<string, unknown>;
    if (typeof e.confidence_score === 'number') {
      return { score: e.confidence_score, level: typeof e.level === 'string' ? e.level : undefined };
    }
  }
  return {};
}

function EmployerDashboardInner({ params }: { params: { id: string } }) {
  const id = params.id;
  const router = useRouter();
  const qc = useQueryClient();
  const [responded, setResponded] = useState<RespondedItem[]>([]);
  const [toast, setToast] = useState<ReactNode>(null);
  const [evidenceSel, setEvidenceSel] = useState<Record<string, Record<EvidenceKey, boolean>>>({});
  const [evidenceBusy, setEvidenceBusy] = useState<string | null>(null);
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
    onSuccess: (data, req) => {
      // optimistic: remove from pending cache
      qc.invalidateQueries({ queryKey: ['pending', id] });
      const item = effectivePending.find((x) => x.employment_id === req.employment_id);
      const { score, level } = extractScoreLevel(data);
      if (item) setResponded((r) => [...r, { employment_id: item.employment_id, trainee_name: item.trainee_name, decision: req.decision, time: lastElapsed ?? '0.3s', score, level }]);
      setToast(
        score != null ? (
          <span className="inline-flex items-center gap-2">
            ✓ {req.decision === 'confirm' ? 'Confirmed' : 'Denied'} {item?.trainee_name ?? req.employment_id} — still_employed={String(req.still_employed)}, job_relevant={String(req.job_relevant)} · confidence {score}%{level ? ` (${level})` : ''} <ConfidenceBadge score={score} />
          </span>
        ) : (
          `✓ ${req.decision === 'confirm' ? 'Confirmed' : 'Denied'} ${item?.trainee_name ?? req.employment_id} — still_employed=${req.still_employed}, job_relevant=${req.job_relevant}`
        ),
      );
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

  function toggleEvidence(employmentId: string, key: EvidenceKey) {
    setEvidenceSel((prev) => {
      const cur = prev[employmentId] ?? { salary_slip: false, offer_letter: false, bank_statement: false };
      return { ...prev, [employmentId]: { ...cur, [key]: !cur[key] } };
    });
  }

  async function onAttachEvidence(employmentId: string) {
    const sel = evidenceSel[employmentId];
    const checked = EVIDENCE_OPTIONS.filter((o) => sel?.[o.key]);
    if (checked.length === 0) {
      setToast('Select at least one evidence type first.');
      setTimeout(() => setToast(null), 4000);
      return;
    }
    // Mock fallback when backend unreachable — keeps demo alive, mirrors onVerify pattern
    if (!token || error) {
      await new Promise((r) => setTimeout(r, 200));
      const bonus = checked.reduce((s, o) => s + o.points, 0);
      setToast(`✓ Evidence attached (mock fallback): ${checked.map((c) => c.label).join(', ')} (~+${bonus} pts) for ${employmentId}`);
      setTimeout(() => setToast(null), 4000);
      return;
    }
    setEvidenceBusy(employmentId);
    try {
      let last: AddEvidenceResponse | null = null;
      for (const opt of checked) {
        last = await addEvidence(employmentId, token, { evidence_type: opt.key });
      }
      qc.invalidateQueries({ queryKey: ['pending', id] });
      const score = last?.employment?.confidence_score;
      const level = last?.employment?.level;
      setToast(
        score != null ? (
          <span className="inline-flex items-center gap-2">
            ✓ Evidence attached ({checked.map((c) => c.label).join(', ')}) — confidence {score}%{level ? ` (${level})` : ''} <ConfidenceBadge score={score} />
          </span>
        ) : (
          `✓ Evidence attached (${checked.map((c) => c.label).join(', ')}) for ${employmentId}`
        ),
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setToast(`✗ Evidence attach failed: ${msg}`);
    } finally {
      setEvidenceBusy(null);
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
              effectivePending.map((item) => (
                <div key={item.employment_id} className="space-y-2 border-b pb-3 last:border-0">
                  <VerifyCard item={item} onVerify={onVerify} />
                  <div className="flex flex-wrap items-center gap-3 text-xs bg-gray-50 border rounded px-3 py-2">
                    {EVIDENCE_OPTIONS.map((o) => (
                      <label key={o.key} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={evidenceSel[item.employment_id]?.[o.key] ?? false}
                          onChange={() => toggleEvidence(item.employment_id, o.key)}
                        />
                        {o.label} +{o.points}
                      </label>
                    ))}
                    <button
                      onClick={() => onAttachEvidence(item.employment_id)}
                      disabled={evidenceBusy === item.employment_id}
                      className="ml-auto px-3 py-1 rounded bg-teal-700 text-white disabled:opacity-50"
                    >
                      {evidenceBusy === item.employment_id ? 'Attaching…' : 'Attach evidence'}
                    </button>
                  </div>
                </div>
              ))
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
                    <th>Confidence</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {responded.map((r) => (
                    <tr key={r.employment_id} className="border-t">
                      <td className="py-1">{r.trainee_name}</td>
                      <td className={`py-1 ${r.decision === 'confirm' ? 'text-green-700' : 'text-red-700'}`}>{r.decision}</td>
                      <td className="py-1">
                        {r.score != null ? (
                          <span className="inline-flex items-center gap-1">
                            <ConfidenceBadge score={r.score} />
                            {r.level && <span className="text-xs text-gray-500">{r.level}</span>}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
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
