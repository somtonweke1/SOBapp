import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import {
  contextFromEnum,
  parseStoredPortfolioResults,
  percentage,
  portfolioDecisionBucket,
  type PortfolioUploadResult,
} from '@/lib/portfolio-upload';

export const dynamic = 'force-dynamic';

function dateLabel(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
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

function bucketOrder(result: PortfolioUploadResult) {
  const bucket = portfolioDecisionBucket(result.report);
  if (bucket === 'escalate') return 0;
  if (bucket === 'caution') return 1;
  if (bucket === 'proceed') return 2;
  return 3;
}

export default async function PortfolioReportPage({ params }: { params: { id: string } }) {
  const upload = await prisma.portfolioUpload.findUnique({
    where: {
      reference_number: params.id,
    },
  });

  if (!upload) notFound();

  const storedResults = parseStoredPortfolioResults(upload.results_json);
  const results = storedResults?.results || [];

  const successes = results.filter((result) => result.report.status === 'success');
  const notFoundCount = results.length - successes.length;
  const proceedCount = results.filter((result) => portfolioDecisionBucket(result.report) === 'proceed').length;
  const cautionCount = results.filter((result) => portfolioDecisionBucket(result.report) === 'caution').length;
  const escalateCount = results.filter((result) => portfolioDecisionBucket(result.report) === 'escalate').length;
  const orderedResults = [...results].sort((a, b) => bucketOrder(a) - bucketOrder(b));
  const total = upload.address_count;

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-zinc-900">
      <article className="mx-auto max-w-6xl rounded-[2rem] border border-zinc-200 bg-white p-10 shadow-sm print:max-w-none print:rounded-none print:border-none print:p-0 print:shadow-none">
        <header className="border-b border-zinc-200 pb-8">
          <div className="flex items-start justify-between gap-8">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">StoneBridge Portfolio Report</p>
              <h1 className="mt-3 text-4xl font-extralight tracking-tight">Baltimore Portfolio Risk Screening</h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-600">
                Consolidated public-record screening report for a Baltimore asset list submitted through the portfolio upload workflow.
              </p>
            </div>
            <div className="text-right text-sm text-zinc-600">
              <p className="font-medium text-zinc-900">Reference: {upload.reference_number}</p>
              <p className="mt-1">Submitted: {dateLabel(upload.submitted_at)}</p>
              <p className="mt-1">Generated: {storedResults ? dateLabel(storedResults.generatedAt) : 'Pending bulk scan'}</p>
            </div>
          </div>
        </header>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-zinc-200 bg-zinc-50/70 p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Institution</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">{upload.institution_name}</h2>
            <p className="mt-3 text-sm text-zinc-600">
              {upload.contact_name} · {upload.contact_email}
            </p>
            <p className="mt-2 text-sm text-zinc-600">Deal context: {contextFromEnum(upload.deal_context)}</p>
          </div>
          <div className="rounded-3xl border border-zinc-200 bg-white p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Portfolio Coverage</p>
            <p className="mt-3 text-lg font-medium text-zinc-900">Total addresses submitted: {upload.address_count}</p>
            <p className="mt-2 text-sm text-zinc-600">Successfully scanned: {successes.length}</p>
            <p className="mt-1 text-sm text-zinc-600">Not found: {notFoundCount}</p>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-zinc-200 p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Decision Summary</p>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-rose-700">ESCALATE</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-950">{escalateCount}</p>
              <p className="mt-1 text-sm text-zinc-600">{percentage(escalateCount, total)}%</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-amber-700">CAUTION</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-950">{cautionCount}</p>
              <p className="mt-1 text-sm text-zinc-600">{percentage(cautionCount, total)}%</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-emerald-700">PROCEED</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-950">{proceedCount}</p>
              <p className="mt-1 text-sm text-zinc-600">{percentage(proceedCount, total)}%</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-700">NOT FOUND</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-950">{notFoundCount}</p>
              <p className="mt-1 text-sm text-zinc-600">{percentage(notFoundCount, total)}%</p>
            </div>
          </div>
        </section>

        <section className="mt-8 space-y-6">
          {orderedResults.length === 0 ? (
            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">
              Bulk scan has not been run yet for this portfolio upload.
            </div>
          ) : (
            orderedResults.map((result) => {
              const report = result.report;
              const subject = report.subject;
              const bucket = portfolioDecisionBucket(report);

              return (
                <section key={`${result.address}-${report.refId}`} className="rounded-3xl border border-zinc-200 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                        {bucket === 'escalate'
                          ? 'ESCALATE'
                          : bucket === 'caution'
                            ? 'CAUTION'
                            : bucket === 'proceed'
                              ? 'PROCEED'
                              : 'NOT FOUND'}
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                        {subject?.address || report.queryAddress}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-zinc-700">{report.decision.summary}</p>
                      {report.sources.address ? sourceLine(report.sources.address.label, report.sources.address.url, report.sources.address.detail) : null}
                    </div>
                    <div className="text-right text-sm text-zinc-500">
                      <p className="font-medium text-zinc-900">Scan Reference: {report.refId}</p>
                      <p className="mt-1">Generated: {dateLabel(report.runAt)}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {subject?.owner && report.sources.owner ? (
                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Owner</p>
                        <p className="mt-2 text-sm font-medium text-zinc-900">{subject.owner}</p>
                        {sourceLine(report.sources.owner.label, report.sources.owner.url, report.sources.owner.detail)}
                      </div>
                    ) : null}
                    {subject?.zoning && report.sources.zoning ? (
                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Zoning</p>
                        <p className="mt-2 text-sm font-medium text-zinc-900">{subject.zoning}</p>
                        {sourceLine(report.sources.zoning.label, report.sources.zoning.url, report.sources.zoning.detail)}
                      </div>
                    ) : null}
                    {subject?.landUse && report.sources.landUse ? (
                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Land Use</p>
                        <p className="mt-2 text-sm font-medium text-zinc-900">{subject.landUse}</p>
                        {sourceLine(report.sources.landUse.label, report.sources.landUse.url, report.sources.landUse.detail)}
                      </div>
                    ) : null}
                    {subject?.taxRecordLabel && report.sources.assessmentValue ? (
                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Assessment</p>
                        <p className="mt-2 text-sm font-medium text-zinc-900">{subject.taxRecordLabel}</p>
                        {sourceLine(report.sources.assessmentValue.label, report.sources.assessmentValue.url, report.sources.assessmentValue.detail)}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-6 grid gap-5 lg:grid-cols-2">
                    <div className="rounded-2xl border border-zinc-200 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Decision Drivers</p>
                      {report.decision.drivers.length > 0 ? (
                        <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-700">
                          {report.decision.drivers.map((driver) => (
                            <li key={driver}>{driver}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-3 text-sm leading-6 text-zinc-600">No decision drivers were returned for this address.</p>
                      )}
                    </div>
                    <div className="rounded-2xl border border-zinc-200 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Queried Sources</p>
                      <div className="mt-3 space-y-3 text-sm text-zinc-700">
                        {report.queriedSources.map((lookup) => (
                          <div key={lookup.id} className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3">
                            <p className="font-medium text-zinc-900">{lookup.label}</p>
                            <a
                              href={lookup.url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-block text-xs text-zinc-500 underline decoration-zinc-300 underline-offset-2"
                            >
                              {lookup.url}
                            </a>
                            <p className="mt-2 text-sm leading-6 text-zinc-700">{lookup.note}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              );
            })
          )}
        </section>

        <footer className="mt-8 border-t border-zinc-200 pt-5 text-xs leading-6 text-zinc-500">
          Sources queried for this report include Maryland SDAT property records and the Baltimore City datasets returned in each property section above. Limitations: this consolidated report is bounded by address match success and the live availability of each public source at the time generated. Generated on {storedResults ? dateLabel(storedResults.generatedAt) : 'pending bulk scan'}.
        </footer>
      </article>
    </main>
  );
}
