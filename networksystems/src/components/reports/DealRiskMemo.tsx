'use client';

import type { ForensicLookupRecord, ForensicReport } from '@/lib/api/forensic-scan';

function dateLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

function decisionStyles(outcome: ForensicReport['decision']['outcome']) {
  switch (outcome) {
    case 'escalate':
      return {
        badge: 'border-rose-200 bg-rose-50 text-rose-700',
        accent: 'text-rose-700',
        label: 'ESCALATE',
      };
    case 'caution':
      return {
        badge: 'border-amber-200 bg-amber-50 text-amber-700',
        accent: 'text-amber-700',
        label: 'CAUTION',
      };
    case 'proceed':
      return {
        badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        accent: 'text-emerald-700',
        label: 'PROCEED',
      };
    default:
      return {
        badge: 'border-zinc-300 bg-zinc-100 text-zinc-700',
        accent: 'text-zinc-800',
        label: 'MANUAL REVIEW REQUIRED',
      };
  }
}

function lookupStatusLabel(lookup: ForensicLookupRecord) {
  switch (lookup.status) {
    case 'success':
      return 'Returned data';
    case 'empty':
      return 'Queried - no records found';
    default:
      return 'Unavailable';
  }
}

function lookupStatusStyle(lookup: ForensicLookupRecord) {
  switch (lookup.status) {
    case 'success':
      return 'text-emerald-700';
    case 'empty':
      return 'text-zinc-700';
    default:
      return 'text-rose-700';
  }
}

function sourceLine(label: string, url: string, detail?: string) {
  return (
    <p className="mt-2 text-xs leading-5 text-zinc-500">
      Source:{' '}
      <a href={url} target="_blank" rel="noreferrer" className="underline decoration-zinc-300 underline-offset-2">
        {label}
      </a>
      {detail ? ` (${detail})` : ''}
    </p>
  );
}

export default function DealRiskMemo({ report }: { report: ForensicReport }) {
  const styles = decisionStyles(report.decision.outcome);
  const subject = report.subject;
  const address = subject?.address || report.queryAddress;

  const fieldRows = [
    subject?.owner && report.sources.owner
      ? {
          label: 'Owner',
          value: subject.owner,
          source: report.sources.owner,
        }
      : null,
    subject?.zoning && report.sources.zoning
      ? {
          label: 'Zoning Code',
          value: subject.zoning,
          source: report.sources.zoning,
        }
      : null,
    subject?.landUse && report.sources.landUse
      ? {
          label: 'Land Use Classification',
          value: subject.landUse,
          source: report.sources.landUse,
        }
      : null,
    subject?.taxRecordLabel && report.sources.assessmentValue
      ? {
          label: 'Assessment Value',
          value: subject.taxRecordLabel,
          source: report.sources.assessmentValue,
        }
      : null,
  ].filter(Boolean) as Array<{
    label: string;
    value: string;
    source: NonNullable<ForensicReport['sources'][keyof ForensicReport['sources']]>;
  }>;

  return (
    <main className="w-full bg-white text-zinc-900">
      <article className="mx-auto max-w-5xl rounded-[2rem] border border-zinc-200 bg-white p-10 shadow-sm print:max-w-none print:rounded-none print:border-none print:p-0 print:shadow-none">
        <header className="border-b border-zinc-200 pb-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">StoneBridge Decision Memo</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950">Baltimore Property Risk Memo</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
                Verified public-record summary for underwriting and portfolio screening. Only fields backed by a live
                queried source are shown below.
              </p>
            </div>
            <div className="text-right text-sm text-zinc-600">
              <p className="font-medium text-zinc-900">Reference: {report.refId}</p>
              <p className="mt-1">Generated: {dateLabel(report.runAt)}</p>
            </div>
          </div>
        </header>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-zinc-200 bg-zinc-50/70 p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Asset</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">{address}</h2>
            {report.sources.address ? sourceLine(report.sources.address.label, report.sources.address.url, report.sources.address.detail) : null}
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Decision</p>
            <div className={`mt-3 inline-flex rounded-full border px-4 py-2 text-sm font-semibold ${styles.badge}`}>
              {styles.label}
            </div>
            <p className={`mt-4 text-lg font-semibold ${styles.accent}`}>{report.decision.summary}</p>
            {report.decision.computedFrom.length > 0 ? (
              <p className="mt-4 text-xs leading-5 text-zinc-500">
                Computed from query outcomes for: {report.decision.computedFrom.join(', ')}.
              </p>
            ) : null}
          </div>
        </section>

        {fieldRows.length > 0 ? (
          <section className="mt-8 rounded-3xl border border-zinc-200 p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Verified Property Fields</p>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {fieldRows.map((row) => (
                <div key={row.label} className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
                  <dt className="text-xs uppercase tracking-[0.16em] text-zinc-500">{row.label}</dt>
                  <dd className="mt-2 text-sm font-medium text-zinc-900">{row.value}</dd>
                  {sourceLine(row.source.label, row.source.url, row.source.detail)}
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <section className="rounded-3xl border border-zinc-200 p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Decision Basis</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-700">
              {report.decision.rationale.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {report.decision.drivers.length > 0 ? (
              <>
                <p className="mt-6 text-xs uppercase tracking-[0.18em] text-zinc-500">Decision Drivers</p>
                <ul className="mt-3 space-y-3 text-sm leading-6 text-zinc-700">
                  {report.decision.drivers.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </section>

          <section className="rounded-3xl border border-zinc-200 p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Queried Sources</p>
            <div className="mt-4 space-y-4 text-sm text-zinc-700">
              {report.queriedSources.map((lookup) => (
                <div key={lookup.id} className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-zinc-900">{lookup.label}</p>
                      <a
                        href={lookup.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs text-zinc-500 underline decoration-zinc-300 underline-offset-2"
                      >
                        {lookup.url}
                      </a>
                    </div>
                    <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${lookupStatusStyle(lookup)}`}>
                      {lookupStatusLabel(lookup)}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-700">{lookup.note}</p>
                </div>
              ))}
            </div>
          </section>
        </section>

        <section className="mt-8 space-y-5">
          <section className="rounded-3xl border border-zinc-200 p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Permit History</p>
            {sourceLine(report.datasets.permits.source.label, report.datasets.permits.source.url, report.datasets.permits.source.detail)}
            <p className="mt-3 text-sm font-medium text-zinc-900">
              Status:{' '}
              {report.datasets.permits.status === 'returned_data'
                ? 'Returned data'
                : report.datasets.permits.status === 'no_records_found'
                  ? 'Queried - no records found'
                  : 'Unavailable'}
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-700">{report.datasets.permits.note}</p>
            {report.datasets.permits.records.length > 0 ? (
              <div className="mt-4 grid gap-4">
                {report.datasets.permits.records.map((record) => (
                  <div key={record.caseNumber} className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
                    <p className="text-sm font-semibold text-zinc-900">{record.caseNumber}</p>
                    <p className="mt-1 text-sm text-zinc-700">{record.address}</p>
                    {record.issuedDate ? <p className="mt-1 text-xs text-zinc-500">Issued: {dateLabel(record.issuedDate)}</p> : null}
                    {record.description ? <p className="mt-2 text-sm leading-6 text-zinc-700">{record.description}</p> : null}
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <section className="rounded-3xl border border-zinc-200 p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Code Enforcement Violations</p>
            {sourceLine(
              report.datasets.codeViolations.source.label,
              report.datasets.codeViolations.source.url,
              report.datasets.codeViolations.source.detail
            )}
            <p className="mt-3 text-sm font-medium text-zinc-900">
              Status:{' '}
              {report.datasets.codeViolations.status === 'returned_data'
                ? 'Returned data'
                : report.datasets.codeViolations.status === 'no_records_found'
                  ? 'Queried - no records found'
                  : 'Unavailable'}
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-700">{report.datasets.codeViolations.note}</p>
            {report.datasets.codeViolations.records.length > 0 ? (
              <div className="mt-4 grid gap-4">
                {report.datasets.codeViolations.records.map((record) => (
                  <div key={record.citationNumber} className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
                    <p className="text-sm font-semibold text-zinc-900">{record.citationNumber}</p>
                    <p className="mt-1 text-sm text-zinc-700">{record.address}</p>
                    {record.citationStatus ? <p className="mt-1 text-xs text-zinc-500">Status: {record.citationStatus.trim()}</p> : null}
                    {record.noticeDate ? <p className="mt-1 text-xs text-zinc-500">Notice Date: {dateLabel(record.noticeDate)}</p> : null}
                    <p className="mt-2 text-sm leading-6 text-zinc-700">{record.violationText}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <section className="rounded-3xl border border-zinc-200 p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Vacant Building Notices</p>
            {sourceLine(
              report.datasets.vacantBuildingNotices.source.label,
              report.datasets.vacantBuildingNotices.source.url,
              report.datasets.vacantBuildingNotices.source.detail
            )}
            <p className="mt-3 text-sm font-medium text-zinc-900">
              Status:{' '}
              {report.datasets.vacantBuildingNotices.status === 'returned_data'
                ? 'Returned data'
                : report.datasets.vacantBuildingNotices.status === 'no_records_found'
                  ? 'Queried - no records found'
                  : 'Unavailable'}
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-700">{report.datasets.vacantBuildingNotices.note}</p>
            {report.datasets.vacantBuildingNotices.records.length > 0 ? (
              <div className="mt-4 grid gap-4">
                {report.datasets.vacantBuildingNotices.records.map((record) => (
                  <div key={record.noticeNumber} className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
                    <p className="text-sm font-semibold text-zinc-900">{record.noticeNumber}</p>
                    <p className="mt-1 text-sm text-zinc-700">{record.address}</p>
                    {record.noticeType ? <p className="mt-1 text-xs text-zinc-500">Type: {record.noticeType}</p> : null}
                    {record.noticeDate ? <p className="mt-1 text-xs text-zinc-500">Notice Date: {dateLabel(record.noticeDate)}</p> : null}
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        </section>

        <footer className="mt-8 border-t border-zinc-200 pt-5 text-xs leading-6 text-zinc-500">
          Data sources queried for this memo: {report.queriedSources.map((lookup) => lookup.label).join('; ')}.
          StoneBridge does not display fields that did not return from a verified queried source.
        </footer>
      </article>

      <style jsx global>{`
        @media print {
          @page {
            size: Letter;
            margin: 0.5in;
          }

          body {
            background: #fff;
            margin: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .no-print,
          nav,
          button,
          header.app-header,
          footer.app-footer {
            display: none !important;
          }
        }
      `}</style>
    </main>
  );
}
