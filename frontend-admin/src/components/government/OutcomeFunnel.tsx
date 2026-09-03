'use client';

type FunnelData = {
  enrolled: number;
  trained: number;
  certified: number;
  placed: number;
  verified: number;
  retention_3m: number;
  retention_6m: number;
  retention_12m: number;
  retention_24m: number;
};

const STEPS: { key: keyof FunnelData; label: string; subtitle?: string }[] = [
  { key: 'enrolled', label: 'Enrolled' },
  { key: 'trained', label: 'Trained' },
  { key: 'certified', label: 'Certified' },
  { key: 'placed', label: 'Placed' },
  { key: 'verified', label: 'Verified employment' },
  { key: 'retention_3m', label: '3M retention', subtitle: 'Still employed' },
  { key: 'retention_6m', label: '6M retention', subtitle: 'Still employed' },
  { key: 'retention_12m', label: '12M retention', subtitle: 'Still employed' },
  { key: 'retention_24m', label: '24M retention', subtitle: 'Still employed' },
];

export function OutcomeFunnel({ funnel }: { funnel: FunnelData }) {
  const max = Math.max(...STEPS.map((s) => funnel[s.key]), 1);

  return (
    <div className="space-y-2">
      {STEPS.map((step, i) => {
        const value = funnel[step.key];
        const width = Math.max(8, Math.round((value / max) * 100));
        return (
          <div key={step.key} className="relative">
            {i > 0 && (
              <div className="absolute -top-2 left-4 text-slate-300 text-xs" aria-hidden>
                ↓
              </div>
            )}
            <div className="flex items-center gap-3 py-1.5">
              <div className="w-36 shrink-0 text-right">
                <p className="text-xs font-semibold text-slate-900">{step.label}</p>
                {step.subtitle && (
                  <p className="text-[10px] text-slate-500">{step.subtitle}</p>
                )}
              </div>
              <div className="flex-1 h-8 rounded-md bg-slate-100 border border-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-md bg-slate-800 transition-all duration-500 flex items-center px-2"
                  style={{ width: `${width}%`, minWidth: value > 0 ? '2.5rem' : 0 }}
                >
                  {value > 0 && (
                    <span className="text-xs font-semibold text-white whitespace-nowrap">
                      {value.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <span className="w-12 text-right text-sm font-bold text-slate-900 tabular-nums">
                {value.toLocaleString()}
              </span>
            </div>
          </div>
        );
      })}
      <p className="text-xs text-slate-500 pt-1">
        Longitudinal outcome funnel — from training enrolment through verified employment and multi-year retention.
      </p>
    </div>
  );
}
