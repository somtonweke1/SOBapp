import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function engagementLabel(value: string) {
  return value.replace(/_/g, ' ');
}

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const engagement = await prisma.clientEngagement.findUnique({
    where: { id: params.id },
  });

  if (!engagement) notFound();

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const dealsDelivered = await prisma.dealRecord.count({
    where: {
      institution_name: engagement.institution_name,
      scan_timestamp: {
        gte: monthStart,
      },
    },
  });

  const lineItems: Array<{ label: string; amountCents: number }> = [];
  if (engagement.monthly_fee) {
    lineItems.push({
      label: 'Monthly retainer fee',
      amountCents: engagement.monthly_fee,
    });
  }
  if (engagement.per_deal_fee) {
    lineItems.push({
      label: `Per-deal fees: ${dealsDelivered} deal${dealsDelivered === 1 ? '' : 's'} at ${formatCurrency(engagement.per_deal_fee)}`,
      amountCents: dealsDelivered * engagement.per_deal_fee,
    });
  }

  const total = lineItems.reduce((sum, item) => sum + item.amountCents, 0);
  const referenceNumber = `INV-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${engagement.id.slice(-6).toUpperCase()}`;

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-zinc-900">
      <article className="mx-auto max-w-4xl rounded-[2rem] border border-zinc-200 bg-white p-10 shadow-sm print:max-w-none print:rounded-none print:border-none print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-8 border-b border-zinc-200 pb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">StoneBridge</p>
            <h1 className="mt-3 text-4xl font-extralight tracking-tight">Invoice</h1>
            <p className="mt-4 text-sm leading-6 text-zinc-600">
              Services rendered: Baltimore property risk screening per engagement agreement.
            </p>
          </div>
          <div className="text-right text-sm text-zinc-600">
            <p className="font-medium text-zinc-900">Reference: {referenceNumber}</p>
            <p className="mt-1">Invoice date: {formatDate(now)}</p>
          </div>
        </header>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Bill To</p>
            <p className="mt-3 text-lg font-medium text-zinc-900">{engagement.institution_name}</p>
            <p className="mt-1 text-sm text-zinc-600">{engagement.contact_name}</p>
            <p className="text-sm text-zinc-600">{engagement.contact_email}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Engagement</p>
            <p className="mt-3 text-lg font-medium text-zinc-900">{engagementLabel(engagement.engagement_type)}</p>
            <p className="mt-1 text-sm text-zinc-600">Contract status: {engagement.contract_status}</p>
            <p className="text-sm text-zinc-600">Deals delivered this month: {dealsDelivered}</p>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr className="text-left text-xs uppercase tracking-[0.16em] text-zinc-500">
                <th className="px-4 py-3 font-medium">Line Item</th>
                <th className="px-4 py-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white text-sm text-zinc-700">
              {lineItems.map((item) => (
                <tr key={item.label}>
                  <td className="px-4 py-3">{item.label}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900">{formatCurrency(item.amountCents)}</td>
                </tr>
              ))}
              <tr className="bg-zinc-50/70">
                <td className="px-4 py-3 text-sm font-semibold text-zinc-900">Total Due</td>
                <td className="px-4 py-3 text-sm font-semibold text-zinc-900">{formatCurrency(total)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Payment Instructions</p>
          <p className="mt-3 text-sm leading-6 text-zinc-700">
            Payment by bank transfer or check. Reply to this invoice for remittance instructions.
          </p>
        </section>
      </article>
    </main>
  );
}
