import InternalOpsNavigation from '@/components/internal-ops/Navigation';

const pricingTiers = [
  {
    name: 'PILOT',
    lines: ['Free', 'Up to 10 deals', '24 hour turnaround', 'Feedback required'],
  },
  {
    name: 'MONTHLY RETAINER',
    lines: ['$1,500 / month', 'Up to 20 deals per month', '$75 per deal over 20', '24 hour turnaround', 'Monthly pattern report included'],
  },
  {
    name: 'PER DEAL',
    lines: ['$150 per deal', '48 hour turnaround', 'No commitment'],
  },
  {
    name: 'PORTFOLIO SCREENING',
    lines: [
      '$500 flat for up to 25 addresses',
      '$1,500 flat for up to 100 addresses',
      'Custom pricing over 100 addresses',
      '24-48 hour turnaround',
      'One consolidated report',
      'CSV export included',
    ],
  },
  {
    name: 'ENTERPRISE',
    lines: ['Portfolio assessment pricing on request', 'API access on request', 'White label on request'],
  },
];

export default function PricingReferencePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 text-zinc-600">
      <div className="mx-auto min-h-screen max-w-[1800px]">
        <InternalOpsNavigation />
        <main className="space-y-8 px-6 pb-12 pt-8 md:px-10">
          <section className="rounded-2xl border border-zinc-200/50 bg-white/95 p-8 shadow-lg">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Internal Reference</p>
            <h1 className="mt-1 text-3xl font-extralight tracking-tight text-zinc-900">Pricing</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
              Starting numbers for institutional buyer conversations. These are negotiation anchors, not a public price sheet.
            </p>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            {pricingTiers.map((tier) => (
              <div key={tier.name} className="rounded-2xl border border-zinc-200/50 bg-white/95 p-8 shadow-lg">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{tier.name}</p>
                <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-700">
                  {tier.lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}
