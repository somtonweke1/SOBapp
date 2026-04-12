import InternalOpsNavigation from '@/components/internal-ops/Navigation';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function formatCurrency(cents: number | null | undefined) {
  if (typeof cents !== 'number') return 'Not set';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function engagementLabel(value: string) {
  return value.replace(/_/g, ' ');
}

export default async function BillingDashboardPage() {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const engagements = await prisma.clientEngagement.findMany({
    where: {
      contract_status: {
        in: ['PILOT', 'ACTIVE'],
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  const rows = await Promise.all(
    engagements.map(async (engagement) => {
      const dealsDelivered = await prisma.dealRecord.count({
        where: {
          institution_name: engagement.institution_name,
          scan_timestamp: {
            gte: monthStart,
          },
        },
      });

      return {
        engagement,
        dealsDelivered,
      };
    })
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 text-zinc-600">
      <div className="mx-auto min-h-screen max-w-[1800px]">
        <InternalOpsNavigation />
        <main className="space-y-8 px-6 pb-12 pt-8 md:px-10">
          <section className="rounded-2xl border border-zinc-200/50 bg-white/95 p-8 shadow-lg">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Institutional Ops</p>
            <h1 className="mt-1 text-3xl font-extralight tracking-tight text-zinc-900">Billing</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">
              Engagement billing reference tied to delivered Baltimore property screening activity.
            </p>
          </section>

          <section className="rounded-2xl border border-zinc-200/50 bg-white/95 p-8 shadow-lg">
            <div className="overflow-hidden rounded-2xl border border-zinc-200">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50/80">
                  <tr className="text-left text-xs uppercase tracking-[0.16em] text-zinc-500">
                    <th className="px-4 py-3 font-medium">Institution</th>
                    <th className="px-4 py-3 font-medium">Engagement</th>
                    <th className="px-4 py-3 font-medium">Fee Structure</th>
                    <th className="px-4 py-3 font-medium">Deals This Month</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white text-sm text-zinc-700">
                  {rows.map(({ engagement, dealsDelivered }) => (
                    <tr key={engagement.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-900">{engagement.institution_name}</div>
                        <div className="text-xs text-zinc-500">{engagement.contact_name} · {engagement.contact_email}</div>
                      </td>
                      <td className="px-4 py-3">{engagementLabel(engagement.engagement_type)}</td>
                      <td className="px-4 py-3">
                        <div>Monthly: {formatCurrency(engagement.monthly_fee)}</div>
                        <div>Per deal: {formatCurrency(engagement.per_deal_fee)}</div>
                      </td>
                      <td className="px-4 py-3">{dealsDelivered}</td>
                      <td className="px-4 py-3">
                        <a
                          href={`/invoice/${engagement.id}`}
                          className="inline-flex items-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-800"
                        >
                          Generate Invoice
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
