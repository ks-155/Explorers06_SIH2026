'use client';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ConfidenceBadge } from './ConfidenceBadge';

// Frozen type — API-CONTRACT.md 7 POST /employers/:id/verify-employment
// { employment_id, decision: 'confirm'|'deny', still_employed: boolean, job_relevant: boolean }
export type VerifyDecision = 'confirm' | 'deny';
export type VerifyEmploymentReq = {
  employment_id: string;
  decision: VerifyDecision;
  still_employed: boolean;
  job_relevant: boolean;
};

export type PendingItem = {
  employment_id: string;
  trainee_name: string;
  job_role: string; // from training_records
  training_job_role?: string;
  confidence_score?: number;
  joining_date?: string;
};

function ToggleGroup({
  label,
  value,
  onChange,
  idPrefix,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  idPrefix: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange(true)}
          aria-pressed={value === true}
          className={`min-h-[44px] rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
            value === true ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          aria-pressed={value === false}
          className={`min-h-[44px] rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
            value === false ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          No
        </button>
      </div>
    </div>
  );
}

function Loader2({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export function VerifyCard({ item, onVerify }: { item: PendingItem; onVerify: (req: VerifyEmploymentReq) => Promise<void> }) {
  const [stillEmployed, setStillEmployed] = useState<boolean>(true);
  const [jobRelevant, setJobRelevant] = useState<boolean>(true);
  const [loading, setLoading] = useState<VerifyDecision | null>(null);

  async function handle(decision: VerifyDecision) {
    setLoading(decision);
    try {
      await onVerify({ employment_id: item.employment_id, decision, still_employed: stillEmployed, job_relevant: jobRelevant });
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card className="overflow-hidden rounded-lg shadow-sm border-slate-200 transition-all duration-200 hover:scale-[1.01] hover:shadow-md hover:border-slate-300">
      {/* One-Click Action Banner — slate-900 header */}
      <div className="bg-slate-900 px-5 py-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white leading-tight">Candidate {item.trainee_name} lists your org as employer</h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Role: {item.job_role} {item.training_job_role ? `· Training: ${item.training_job_role}` : ''} · Employed since {item.joining_date || '—'}
          </p>
        </div>
        <div className="shrink-0 pt-2 sm:pt-0">
          <ConfidenceBadge score={item.confidence_score} />
        </div>
      </div>
      <CardContent className="space-y-4 p-5 bg-white">
        {/* 30-Second Verification Form: 2 toggles */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#2563eb] text-white text-xs font-bold">30s</span>
            30-Second Verification Form
            <span className="text-xs font-normal text-slate-500">— one click, no reload</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <ToggleGroup label="Employed now?" value={stillEmployed} onChange={setStillEmployed} idPrefix={`${item.employment_id}-employed`} />
            <ToggleGroup label="Job relevant to training?" value={jobRelevant} onChange={setJobRelevant} idPrefix={`${item.employment_id}-relevant`} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handle('confirm')}
            disabled={!!loading}
            className="min-h-[44px] inline-flex items-center justify-center rounded-lg bg-[#059669] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-all duration-200 hover:scale-[1.01]"
          >
            {loading === 'confirm' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2" /> Confirming…
              </>
            ) : (
              'Confirm — Yes, employed'
            )}
          </button>
          <button
            type="button"
            onClick={() => handle('deny')}
            disabled={!!loading}
            className="min-h-[44px] inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-all duration-200 hover:scale-[1.01]"
          >
            {loading === 'deny' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2" /> Sending…
              </>
            ) : (
              'Deny'
            )}
          </button>
        </div>
        <p className="text-xs text-slate-400">One-click &lt;30s — no reload, toast with ConfidenceBadge · Phase 4 live POST /employers/:id/verify-employment</p>
      </CardContent>
    </Card>
  );
}
