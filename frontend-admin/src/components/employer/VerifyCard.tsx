'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
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
    <Card className="border-teal-200">
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <p className="font-medium">Candidate {item.trainee_name} lists your org as employer</p>
          <p className="text-xs text-gray-500">
            Role: {item.job_role} {item.training_job_role ? `· Training: ${item.training_job_role}` : ''} · Employed since {item.joining_date || '—'}
          </p>
        </div>
        <ConfidenceBadge score={item.confidence_score} />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={stillEmployed} onChange={(e) => setStillEmployed(e.target.checked)} /> Still employed?
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={jobRelevant} onChange={(e) => setJobRelevant(e.target.checked)} /> Job relevant to training?
          </label>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handle('confirm')} disabled={!!loading} className="flex-1 bg-green-600 hover:bg-green-700">
            {loading === 'confirm' ? 'Confirming…' : 'Confirm — Yes, employed'}
          </Button>
          <Button onClick={() => handle('deny')} disabled={!!loading} className="flex-1 bg-white border border-gray-300 text-gray-800 hover:bg-gray-50">
            {loading === 'deny' ? 'Sending…' : 'Deny'}
          </Button>
        </div>
        <p className="text-xs text-gray-400">One-click &lt;30s — SOIS-CORE-MODULES.md:201 · Phase 2 mocked, Phase 4 live POST /employers/:id/verify-employment</p>
      </CardContent>
    </Card>
  );
}
