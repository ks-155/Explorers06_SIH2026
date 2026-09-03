'use client';

type Props = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function QueryErrorState({ title = 'Unable to load data', message, onRetry }: Props) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-sm shadow-sm">
      <h3 className="font-semibold text-red-900">{title}</h3>
      <p className="mt-1 text-red-800">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 min-h-[36px] rounded-lg bg-red-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-800"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function QueryEmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm shadow-sm">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-slate-600">{message}</p>
    </div>
  );
}
