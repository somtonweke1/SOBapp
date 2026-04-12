import InternalOpsNavigation from '@/components/internal-ops/Navigation';
import { getPatternLibraryData } from '@/lib/patterns';

export const dynamic = 'force-dynamic';

function percentWidth(value: number) {
  return `${Math.min(Math.max(value, 0), 100)}%`;
}

function dateLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export default async function PatternLibraryPage() {
  const data = await getPatternLibraryData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 text-zinc-600">
      <div className="mx-auto min-h-screen max-w-[1800px]">
        <InternalOpsNavigation />
        <main className="space-y-8 px-6 pb-12 pt-8 md:px-10">
          <section className="rounded-2xl border border-zinc-200/50 bg-white/95 p-8 shadow-lg">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Institutional Ops</p>
                <h1 className="mt-1 text-3xl font-extralight tracking-tight text-zinc-900">Pattern Library</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">
                  Every successful scan and institutional stub accumulates here. This is the Baltimore deal-pattern
                  base layer for repeat underwriting insight.
                </p>
              </div>
              <a
                href="/api/patterns?format=csv"
                className="inline-flex items-center rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
              >
                Export DealRecords CSV
              </a>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Total Deals</p>
                <p className="mt-2 text-3xl font-extralight tracking-tight text-zinc-900">{data.totalDeals}</p>
              </div>
              {data.decisionDistribution.map((item) => (
                <div key={item.key} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{item.key}</p>
                  <p className="mt-2 text-3xl font-extralight tracking-tight text-zinc-900">{item.count}</p>
                  <p className="mt-1 text-sm text-zinc-500">{item.percent}% of library</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-8">
              <section className="rounded-2xl border border-zinc-200/50 bg-white/95 p-8 shadow-lg">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Decision Distribution</p>
                <div className="mt-6 space-y-4">
                  {data.decisionDistribution.map((item) => (
                    <div key={item.key}>
                      <div className="flex items-center justify-between text-sm text-zinc-700">
                        <span>{item.key}</span>
                        <span>
                          {item.count} records · {item.percent}%
                        </span>
                      </div>
                      <div className="mt-2 h-3 overflow-hidden rounded-full bg-zinc-100">
                        <div className="h-full rounded-full bg-zinc-900" style={{ width: percentWidth(item.percent) }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-200/50 bg-white/95 p-8 shadow-lg">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Top 5 Zip Codes by Volume</p>
                    <div className="mt-4 space-y-3">
                      {data.byZipCode.slice(0, 5).map((item) => (
                        <div key={item.key} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
                          <span className="font-medium text-zinc-900">{item.key}</span>
                          <span className="text-zinc-600">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Top 5 Zip Codes by Escalate Rate</p>
                    <div className="mt-4 space-y-3">
                      {data.anomalies.zipCodesByEscalateRate.slice(0, 5).map((item) => (
                        <div key={item.zipCode} className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-zinc-900">{item.zipCode}</span>
                            <span className="text-zinc-600">{item.escalateRate}%</span>
                          </div>
                          <p className="mt-1 text-xs text-zinc-500">
                            {item.escalates} escalates across {item.total} records
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-200/50 bg-white/95 p-8 shadow-lg">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Recent Deals</p>
                <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200">
                  <table className="min-w-full divide-y divide-zinc-200">
                    <thead className="bg-zinc-50/80">
                      <tr className="text-left text-xs uppercase tracking-[0.16em] text-zinc-500">
                        <th className="px-4 py-3 font-medium">Address</th>
                        <th className="px-4 py-3 font-medium">Zip</th>
                        <th className="px-4 py-3 font-medium">Property Type</th>
                        <th className="px-4 py-3 font-medium">Decision</th>
                        <th className="px-4 py-3 font-medium">Submitted By</th>
                        <th className="px-4 py-3 font-medium">Scanned</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 bg-white text-sm text-zinc-700">
                      {data.recentDeals.map((record) => (
                        <tr key={record.id}>
                          <td className="px-4 py-3 font-medium text-zinc-900">{record.address}</td>
                          <td className="px-4 py-3">{record.zip_code || 'Unknown'}</td>
                          <td className="px-4 py-3">{record.property_type || 'Unknown'}</td>
                          <td className="px-4 py-3">{record.decision}</td>
                          <td className="px-4 py-3">{record.submitted_by}</td>
                          <td className="px-4 py-3">{dateLabel(record.scan_timestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <section className="rounded-2xl border border-zinc-200/50 bg-white/95 p-8 shadow-lg">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Property Type Breakdown</p>
                <div className="mt-4 space-y-3">
                  {data.byPropertyType.map((item) => (
                    <div key={item.key} className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-zinc-900">{item.key}</span>
                        <span className="text-zinc-600">{item.count}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                        <div className="h-full rounded-full bg-zinc-900" style={{ width: percentWidth(item.percent) }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-200/50 bg-white/95 p-8 shadow-lg">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Assessment Ranges Correlating With Escalate</p>
                <div className="mt-4 space-y-3 text-sm">
                  {data.anomalies.assessmentRangesByEscalateRate.map((item) => (
                    <div key={item.range} className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-zinc-900">{item.range}</span>
                        <span className="text-zinc-600">{item.escalateRate}% escalate</span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">
                        {item.escalates} escalates across {item.total} records
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-200/50 bg-white/95 p-8 shadow-lg">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Addresses With No Permit History by Zone Type</p>
                <div className="mt-4 space-y-4 text-sm text-zinc-700">
                  {data.anomalies.addressesWithoutPermitsByZone.slice(0, 5).map((item) => (
                    <div key={item.zoningCode} className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-zinc-900">{item.zoningCode}</span>
                        <span className="text-zinc-600">{item.count} addresses</span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-zinc-500">{item.addresses.join('; ')}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-200/50 bg-white/95 p-8 shadow-lg">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Neighborhood Breakdown</p>
                {data.byNeighborhood.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {data.byNeighborhood.slice(0, 5).map((item) => (
                      <div key={item.key} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
                        <span className="font-medium text-zinc-900">{item.key}</span>
                        <span className="text-zinc-600">{item.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-zinc-600">
                    No neighborhood mapping data is stored yet. Zip code coverage is available now; neighborhood can be
                    added later when a verified crosswalk is introduced.
                  </p>
                )}
              </section>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
