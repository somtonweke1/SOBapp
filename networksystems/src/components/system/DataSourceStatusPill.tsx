import type { DataSourceStatus } from '@/lib/api/data-source-status';

const STYLE_BY_PROVIDER: Record<'CITY' | 'STATE' | 'FEDERAL' | 'NONE', string> = {
  CITY: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  STATE: 'border-amber-200 bg-amber-50 text-amber-700',
  FEDERAL: 'border-violet-200 bg-violet-50 text-violet-700',
  NONE: 'border-rose-200 bg-rose-50 text-rose-700',
};

const LABEL_BY_PROVIDER: Record<'CITY' | 'STATE' | 'FEDERAL' | 'NONE', string> = {
  CITY: 'City',
  STATE: 'State',
  FEDERAL: 'Federal',
  NONE: 'Offline',
};

export default function DataSourceStatusPill({ status }: { status: DataSourceStatus | null }) {
  if (!status) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-600">
        Data Source: Checking...
      </div>
    );
  }

  return (
    <div
      title={`${status.source}. ${status.message}`}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${STYLE_BY_PROVIDER[status.provider]}`}
    >
      <span className="inline-block h-2 w-2 rounded-full bg-current" />
      <span>{`Engine: ${LABEL_BY_PROVIDER[status.provider]}`}</span>
    </div>
  );
}
