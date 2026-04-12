'use client';

import Link from 'next/link';

export type AuditKind = 'financial' | 'regulatory';

export type DiscrepancyResult =
  | {
      kind: 'financial';
      status: 'hit' | 'clean';
      address: string;
      billedMeterInches: number;
      permittedMeterInches: number;
      estRecoverable: number;
      lienCheck: 'clear' | 'active';
      notes: string[];
    }
  | {
      kind: 'regulatory';
      status: 'hit' | 'clean';
      address: string;
      riskLevel: 'low' | 'medium' | 'high';
      finding: string;
      notes: string[];
    };

function currency(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function DiscrepancyReport({
  result,
  onDownloadPdf,
}: {
  result: DiscrepancyResult;
  onDownloadPdf: () => void;
}) {
  const headline =
    result.kind === 'financial'
      ? 'Forensic Discrepancy Report'
      : 'Regulatory Discrepancy Report';

  const verdict =
    result.status === 'hit'
      ? result.kind === 'financial'
        ? `POSITIVE HIT: $${currency(result.estRecoverable)} Recoverable`
        : `COMPLIANCE GAP: ${result.riskLevel.toUpperCase()} RISK`
      : 'Status: Verified Clean';

  const verdictTone =
    result.status === 'hit'
      ? result.kind === 'financial'
        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
        : 'bg-rose-50 border-rose-200 text-rose-800'
      : 'bg-gray-50 border-gray-200 text-gray-800';

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Evidence Packet</div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">{headline}</h2>
          <div className="mt-1 text-sm text-gray-600">{result.address}</div>
        </div>
        <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${verdictTone}`}>{verdict}</div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Findings</div>
        {result.kind === 'financial' ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Billed Meter</div>
              <div className="mt-2 text-lg font-bold text-gray-900">{result.billedMeterInches}&quot;</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Permitted Meter</div>
              <div className="mt-2 text-lg font-bold text-gray-900">{result.permittedMeterInches}&quot;</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Est. Recoverable</div>
              <div className="mt-2 text-lg font-bold text-emerald-700">${currency(result.estRecoverable)}</div>
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Primary Gap</div>
            <div className="mt-2 text-sm text-gray-800">{result.finding}</div>
          </div>
        )}

        <div className="mt-4 space-y-2">
          {result.notes.map((n) => (
            <div key={n} className="text-sm text-gray-700">
              {n}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onDownloadPdf}
          className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Download Evidence PDF
        </button>

        {result.kind === 'financial' ? (
          <Link
            href="/claims?zip=21201"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Start Remediation (Claim)
          </Link>
        ) : (
          <Link
            href="/compliance-shield"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            Start Remediation (Compliance)
          </Link>
        )}
      </div>
    </div>
  );
}

