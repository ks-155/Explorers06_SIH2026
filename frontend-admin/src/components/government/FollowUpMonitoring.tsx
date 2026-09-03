'use client';

type FollowUpData = {
  scheduled: number;
  sent: number;
  responded: number;
  failed: number;
  cancelled: number;
  response_rate: number;
};

export function FollowUpMonitoring({ data }: { data: FollowUpData }) {
  const items = [
    { label: 'Scheduled', value: data.scheduled, color: 'bg-slate-100 text-slate-800 border-slate-200' },
    { label: 'Sent', value: data.sent, color: 'bg-blue-50 text-blue-800 border-blue-200' },
    { label: 'Completed', value: data.responded, color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    { label: 'Failed / unreachable', value: data.failed, color: 'bg-red-50 text-red-800 border-red-200' },
    { label: 'Cancelled', value: data.cancelled, color: 'bg-slate-50 text-slate-600 border-slate-200' },
  ];

  const total = items.reduce((s, i) => s + i.value, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {items.map((item) => (
          <div
            key={item.label}
            className={`rounded-lg border p-3 text-center ${item.color}`}
          >
            <p className="text-2xl font-bold tabular-nums">{item.value}</p>
            <p className="text-xs font-medium mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Follow-up response rate</p>
          <p className="text-xs text-slate-500">
            Completed vs failed among resolved follow-ups ({total} total scheduled)
          </p>
        </div>
        <span className="text-2xl font-bold text-slate-900 tabular-nums">{data.response_rate}%</span>
      </div>
      <p className="text-xs text-slate-500">
        Automated longitudinal tracking at 30 days, 3 months, 6 months, 12 months and 24 months after certification.
      </p>
    </div>
  );
}
