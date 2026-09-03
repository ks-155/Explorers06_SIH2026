'use client';

type VerificationData = {
  self_reported: number;
  pending: number;
  employer_confirmed: number;
  evidence_confirmed: number;
  rejected: number;
  confidence: { high: number; medium: number; low: number; unverified: number };
};

export function VerificationPanel({ data }: { data: VerificationData }) {
  const statusItems = [
    { label: 'Self-reported', value: data.self_reported, hint: 'Initial trainee report (+20 confidence)' },
    { label: 'Pending verification', value: data.pending, hint: 'Awaiting employer response' },
    { label: 'Employer confirmed', value: data.employer_confirmed, hint: 'Employer verified (+40 confidence)' },
    { label: 'Evidence confirmed', value: data.evidence_confirmed, hint: 'Salary/offer/EPFO evidence attached' },
    { label: 'Rejected', value: data.rejected, hint: 'Employer denied claim' },
  ];

  const confidenceItems = [
    { label: 'HIGH', sub: '80–100', value: data.confidence.high, color: 'bg-[#059669] text-white' },
    { label: 'MEDIUM', sub: '50–79', value: data.confidence.medium, color: 'bg-[#d97706] text-white' },
    { label: 'LOW', sub: '20–49', value: data.confidence.low, color: 'bg-slate-600 text-white' },
    { label: 'UNVERIFIED', sub: '0–19', value: data.confidence.unverified, color: 'bg-slate-400 text-white' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-slate-900">Verification status</h4>
        {statusItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">{item.label}</p>
              <p className="text-[11px] text-slate-500">{item.hint}</p>
            </div>
            <span className="text-lg font-bold text-slate-900 tabular-nums">{item.value}</span>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-slate-900">Confidence distribution</h4>
        <div className="grid grid-cols-2 gap-2">
          {confidenceItems.map((item) => (
            <div
              key={item.label}
              className={`rounded-lg px-3 py-3 text-center ${item.color}`}
            >
              <p className="text-xs font-semibold opacity-90">{item.label}</p>
              <p className="text-[10px] opacity-75">{item.sub}</p>
              <p className="text-2xl font-bold mt-1 tabular-nums">{item.value}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 pt-1">
          Confidence = self-report + employer confirmation + evidence weights (salary slip, EPFO, etc.), capped at 100.
        </p>
      </div>
    </div>
  );
}
