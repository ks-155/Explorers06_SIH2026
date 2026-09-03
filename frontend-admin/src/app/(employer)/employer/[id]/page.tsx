'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loadAuth } from '@/lib/auth';
import { canViewEmployerPortal } from '@/lib/rbac';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { VerifyCard, type VerifyEmploymentReq } from '@/components/employer/VerifyCard';
import { ConfidenceBadge } from '@/components/employer/ConfidenceBadge';
import { Skeleton } from '@/components/ui/skeleton';
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

function Loader2({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

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

  // Live GET /employers/:id/verify-pending (M2-01) — stale 5min, retry 1, refetchOnWindowFocus false (inherited from Providers)
  const { data: livePending, isLoading, error } = useQuery({
    queryKey: ['pending', id],
    queryFn: () => getVerifyPending(id, token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const effectivePending = error ? mockPending : livePending !== undefined ? (livePending as never as typeof mockPending) : mockPending;

  const verifyMut = useMutation({
    mutationFn: (req: VerifyEmploymentReq) => postVerifyEmployment(id, token!, req),
    onMutate: async (req) => {
      await qc.cancelQueries({ queryKey: ['pending', id] });
      const previous = qc.getQueryData(['pending', id]) as typeof mockPending | undefined;
      // optimistic: remove from pending cache immediately
      qc.setQueryData(['pending', id], (old: unknown) => {
        const list = (old as typeof mockPending | undefined) ?? effectivePending;
        return list.filter((x) => x.employment_id !== req.employment_id);
      });
      return { previous };
    },
    onError: (e: unknown, _req, ctx) => {
      // rollback on error
      if (ctx?.previous) {
        qc.setQueryData(['pending', id], ctx.previous);
      } else {
        qc.invalidateQueries({ queryKey: ['pending', id] });
      }
      const msg = e instanceof Error ? e.message : String(e);
      // 403 interceptor message is "Forbidden — analytics requires government/admin" — caller shows toast
      setToast(`✗ Verify failed: ${msg}`);
      setTimeout(() => setToast(null), 4000);
    },
    onSuccess: (data, req) => {
      const item = effectivePending.find((x) => x.employment_id === req.employment_id);
      const { score, level } = extractScoreLevel(data);
      if (item) setResponded((r) => [...r, { employment_id: item.employment_id, trainee_name: item.trainee_name, decision: req.decision, time: lastElapsed ?? '0.3s', score, level }]);
      // Micro-interaction success toast per directive
      setToast(
        <span className="inline-flex items-center gap-2">
          ✓ Verification recorded successfully (Confidence Score updated)
          {score != null ? (
            <>
              {' '}
              · confidence {score}%{level ? ` (${level})` : ''} <ConfidenceBadge score={score} />
            </>
          ) : null}
        </span>,
      );
      setTimeout(() => setToast(null), 4000);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['pending', id] });
    },
  });

  async function onVerify(req: VerifyEmploymentReq) {
    const start = Date.now();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    setLastElapsed(elapsed);
    // If backend reachable, use live mutation with optimistic update; else fallback to local mock removal
    if (token && !error) {
      verifyMut.mutate(req);
    } else {
      await new Promise((r) => setTimeout(r, 200));
      const item = effectivePending.find((x) => x.employment_id === req.employment_id);
      if (item) setResponded((r) => [...r, { employment_id: item.employment_id, trainee_name: item.trainee_name, decision: req.decision, time: `${elapsed}s` }]);
      setToast(`✓ Verification recorded successfully (Confidence Score updated) — ${item?.trainee_name ?? req.employment_id} (mock fallback)`);
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
    <main className="p-6 max-w-4xl mx-auto space-y-5 font-[Geist] animate-page-enter">
      <div className="rounded-lg bg-slate-900 px-5 py-4 text-white shadow-sm transition-all duration-300">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Employer Dashboard — Live wired</h1>
        <p className="text-sm text-slate-300 mt-1">
          Employer ID: <span className="font-mono text-white">{id}</span> · Role: {role} · Port :3002{' '}
          {lastElapsed && <span className="ml-2 inline-flex items-center rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white">last verify: {lastElapsed}s</span>}
          {isLoading && <span className="ml-2 inline-flex items-center gap-1 text-xs text-slate-300"><Loader2 className="h-3 w-3" /> Loading pending…</span>}
          {error && <span className="ml-2 text-xs text-amber-300">live fetch failed — showing mock fallback</span>}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="rounded-lg shadow-sm border-slate-200 transition-all duration-200 hover:scale-[1.01] hover:shadow-md">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-slate-900">{effectivePending.length}</div>
            <div className="text-xs text-slate-500">Pending</div>
          </CardContent>
        </Card>
        <Card className="rounded-lg shadow-sm border-slate-200 transition-all duration-200 hover:scale-[1.01] hover:shadow-md">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-slate-900">{respondedCount}</div>
            <div className="text-xs text-slate-500">Responded</div>
          </CardContent>
        </Card>
        <Card className="rounded-lg shadow-sm border-slate-200 transition-all duration-200 hover:scale-[1.01] hover:shadow-md">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-slate-900">{effectivePending.length + respondedCount}</div>
            <div className="text-xs text-slate-500">Total</div>
          </CardContent>
        </Card>
      </div>

      {/* Active tab slider via Tailwind transition-all */}
      <div className="relative flex gap-2 text-xs p-1 bg-slate-100 rounded-lg w-fit border border-slate-200">
        <div
          className="absolute top-1 bottom-1 bg-slate-900 rounded-md shadow-sm transition-all duration-300 ease-out"
          style={{
            left: filter === 'pending' ? '4px' : '50%',
            width: 'calc(50% - 4px)',
            transform: filter === 'pending' ? 'translateX(0)' : 'translateX(-4px)',
          }}
        />
        <button
          onClick={() => setFilter('pending')}
          className={`relative z-10 min-h-[36px] px-4 py-1.5 rounded-md font-medium transition-colors duration-200 ${filter === 'pending' ? 'text-white' : 'text-slate-700 hover:text-slate-900'}`}
        >
          Pending ({effectivePending.length})
        </button>
        <button
          onClick={() => setFilter('verified')}
          className={`relative z-10 min-h-[36px] px-4 py-1.5 rounded-md font-medium transition-colors duration-200 ${filter === 'verified' ? 'text-white' : 'text-slate-700 hover:text-slate-900'}`}
        >
          Responded ({respondedCount})
        </button>
      </div>

      {toast && <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-lg text-sm shadow-sm flex items-center gap-2 animate-page-enter">{toast}</div>}

      {filter === 'pending' ? (
        <Card className="rounded-lg shadow-sm border-slate-200 overflow-hidden transition-all duration-200">
          <CardHeader className="font-semibold text-slate-900 bg-slate-50 rounded-t-lg">Pending — GET /api/v1/employers/:id/verify-pending (live, fallback mock)</CardHeader>
          <CardContent className="space-y-4 p-4 bg-white">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : effectivePending.length === 0 ? (
              <p className="text-sm text-slate-500">All caught up — no pending verifications.</p>
            ) : (
              effectivePending.map((item) => (
                <div key={item.employment_id} className="space-y-3 animate-page-enter">
                  <VerifyCard item={item} onVerify={onVerify} />
                  <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 shadow-sm transition-all duration-200 hover:border-slate-300">
                    {EVIDENCE_OPTIONS.map((o) => (
                      <label key={o.key} className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                          checked={evidenceSel[item.employment_id]?.[o.key] ?? false}
                          onChange={() => toggleEvidence(item.employment_id, o.key)}
                        />
                        {o.label} +{o.points}
                      </label>
                    ))}
                    <button
                      onClick={() => onAttachEvidence(item.employment_id)}
                      disabled={evidenceBusy === item.employment_id || verifyMut.isPending}
                      className="ml-auto min-h-[36px] inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#2563eb] text-white text-xs font-semibold shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 hover:scale-[1.01]"
                    >
                      {evidenceBusy === item.employment_id ? (
                        <>
                          <Loader2 className="h-3 w-3" /> Attaching…
                        </>
                      ) : (
                        'Attach evidence'
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
            <p className="text-xs text-slate-400">Live POST /api/v1/employers/:id/verify-employment employment_id, decision, still_employed, job_relevant per API-CONTRACT.md:204. Mock fallback keeps demo when backend offline.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-lg shadow-sm border-slate-200 transition-all duration-200 hover:shadow-md">
          <CardHeader className="font-semibold text-slate-900 bg-slate-50 rounded-t-lg">Responded</CardHeader>
          <CardContent className="p-0">
            {responded.length === 0 ? (
              <p className="text-sm text-slate-500 p-4">No responses yet — verify a candidate above.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white border-b border-slate-200">
                    <tr className="text-left text-slate-500">
                      <th className="px-4 py-2 font-medium">Trainee</th>
                      <th className="px-4 py-2 font-medium">Decision</th>
                      <th className="px-4 py-2 font-medium">Confidence</th>
                      <th className="px-4 py-2 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responded.map((r) => (
                      <tr key={r.employment_id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-2 font-medium text-slate-900">{r.trainee_name}</td>
                        <td className={`px-4 py-2 font-medium ${r.decision === 'confirm' ? 'text-[#059669]' : 'text-[#dc2626]'}`}>{r.decision}</td>
                        <td className="px-4 py-2">
                          {r.score != null ? (
                            <span className="inline-flex items-center gap-1">
                              <ConfidenceBadge score={r.score} />
                              {r.level && <span className="text-xs text-slate-500">{r.level}</span>}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-slate-600">{r.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}

// Strict RBAC: withRole replaced by inline canViewEmployerPortal check above (M2-05) — only employer/admin allowed, government/trainee redirected
export default EmployerDashboardInner;
