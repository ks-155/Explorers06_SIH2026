'use client';

type Reason = { reason: string; count: number; percentage: number };

function formatReason(reason: string): string {
  return reason
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function NonPlacementSection({ reasons }: { reasons: Reason[] }) {
  if (!reasons.length) {
    return (
      <p className="text-sm text-slate-500 text-center py-6">
        No non-placement reasons recorded yet. Reasons are captured when trainees respond to follow-up surveys.
      </p>
    );
  }

  const max = Math.max(...reasons.map((r) => r.count), 1);

  return (
    <div className="space-y-3">
      {reasons.map((r) => (
        <div key={r.reason} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-slate-900">{formatReason(r.reason)}</span>
            <span className="text-slate-600 tabular-nums">
              {r.count} · {r.percentage}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: `${Math.round((r.count / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
      <p className="text-xs text-slate-500 pt-1">
        Why trainees are not getting placed — use this to identify remedial programme actions.
      </p>
    </div>
  );
}
