'use client';

import type { ForensicReport } from '@/lib/api/forensic-scan';

function dateLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString();
}

export default function EvidencePacket({ report }: { report: ForensicReport }) {
  const subject = report.subject;
  const successfulSources = report.queriedSources.filter((lookup) => lookup.status === 'success').length;

  const fieldRows = [
    subject?.owner && report.sources.owner
      ? { label: 'Owner', value: subject.owner, source: report.sources.owner }
      : null,
    subject?.zoning && report.sources.zoning
      ? { label: 'Zoning Code', value: subject.zoning, source: report.sources.zoning }
      : null,
    subject?.landUse && report.sources.landUse
      ? { label: 'Land Use', value: subject.landUse, source: report.sources.landUse }
      : null,
    subject?.taxRecordLabel && report.sources.assessmentValue
      ? { label: 'Assessment', value: subject.taxRecordLabel, source: report.sources.assessmentValue }
      : null,
  ].filter(Boolean) as Array<{
    label: string;
    value: string;
    source: NonNullable<ForensicReport['sources'][keyof ForensicReport['sources']]>;
  }>;

  return (
    <section id="evidence-print-root" className="evidence-print w-full bg-white text-gray-900">
      <article className="rounded-2xl border border-gray-300 bg-white p-8 shadow-sm print:rounded-none print:border-none print:shadow-none">
        <header className="border-b border-gray-300 pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-600">FREE PREVIEW | VERIFIED PUBLIC RECORD SUMMARY</p>
          <h1 className="mt-2 text-2xl font-bold">STONEBRIDGE PROPERTY SCREEN | REF: {report.refId}</h1>
          <p className="mt-1 text-sm text-gray-600">Prepared on {dateLabel(report.runAt)}</p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-700">
            This packet is the preview layer. The paid StoneBridge memo adds the formal Proceed / Caution / Escalate
            recommendation, lender-grade framing, and the diligence questions needed to move an actual deal.
          </p>
        </header>

        <section className="mt-6 space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider">Section 1: Subject Property</h2>
          <p className="text-sm">
            <span className="font-semibold">Address:</span> {subject?.address || report.queryAddress}
          </p>
          {report.sources.address ? (
            <p className="text-xs text-gray-600">
              Source: {report.sources.address.label} {report.sources.address.detail ? `(${report.sources.address.detail})` : ''}
            </p>
          ) : null}
        </section>

        {fieldRows.length > 0 ? (
          <section className="mt-6">
            <h2 className="text-sm font-bold uppercase tracking-wider">Section 2: Verified Fields</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {fieldRows.map((row) => (
                <div key={row.label} className="rounded-lg border border-gray-300 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">{row.label}</p>
                  <p className="mt-2 text-base font-bold">{row.value}</p>
                  <p className="mt-2 text-xs text-gray-600">
                    Source: {row.source.label} {row.source.detail ? `(${row.source.detail})` : ''}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wider">Section 3: Decision</h2>
          <p className="mt-2 text-sm font-semibold text-gray-900">{report.decision.summary}</p>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            {report.decision.rationale.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {report.decision.drivers.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {report.decision.drivers.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wider">Section 4: Queried Sources</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">Sources queried</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{report.queriedSources.length}</p>
            </div>
            <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">Verified returns</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{successfulSources}</p>
            </div>
            <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">Memo escalation</p>
              <p className="mt-2 text-base font-bold text-gray-900">Required for final call</p>
            </div>
          </div>
          <div className="mt-2 overflow-hidden rounded-lg border border-gray-300">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border-b border-gray-300 px-3 py-2 text-left">Source</th>
                  <th className="border-b border-gray-300 px-3 py-2 text-left">Status</th>
                  <th className="border-b border-gray-300 px-3 py-2 text-left">Note</th>
                </tr>
              </thead>
              <tbody>
                {report.queriedSources.map((lookup) => (
                  <tr key={lookup.id}>
                    <td className="border-b border-gray-200 px-3 py-2">{lookup.label}</td>
                    <td className="border-b border-gray-200 px-3 py-2">{lookup.status}</td>
                    <td className="border-b border-gray-200 px-3 py-2">{lookup.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wider">Section 5: City Dataset Results</h2>
          <div className="mt-3 space-y-4">
            <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">Permit History</p>
              <p className="mt-2 text-sm text-gray-800">{report.datasets.permits.note}</p>
            </div>
            <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">Code Enforcement Violations</p>
              <p className="mt-2 text-sm text-gray-800">{report.datasets.codeViolations.note}</p>
            </div>
            <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">Vacant Building Notices</p>
              <p className="mt-2 text-sm text-gray-800">{report.datasets.vacantBuildingNotices.note}</p>
            </div>
          </div>
        </section>

        <footer className="mt-6 text-xs text-gray-600">
          Data sources queried for this packet: {report.queriedSources.map((lookup) => lookup.label).join('; ')}.
        </footer>
      </article>

      <style jsx global>{`
        @media print {
          @page {
            size: Letter;
            margin: 0.5in;
          }

          body {
            margin: 0;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .no-print,
          nav,
          header.app-header,
          footer.app-footer,
          button {
            display: none !important;
          }

          .evidence-print {
            max-width: 100% !important;
          }
        }
      `}</style>
    </section>
  );
}
