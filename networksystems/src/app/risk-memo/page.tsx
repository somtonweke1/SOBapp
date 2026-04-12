import Link from 'next/link';
import DealRiskMemo from '@/components/reports/DealRiskMemo';
import { performForensicScan } from '@/lib/api/forensic-scan';

export const dynamic = 'force-dynamic';

export default async function RiskMemoPage({
  searchParams,
}: {
  searchParams?: { address?: string; mode?: string };
}) {
  const address = searchParams?.address?.trim() || '';
  const mode = searchParams?.mode === 'compliance' ? 'compliance' : 'asset';

  if (!address) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-16 text-gray-900">
        <div className="mx-auto max-w-3xl rounded-3xl border border-gray-200 bg-white p-10 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Risk Memo</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">No asset address provided.</h1>
          <p className="mt-4 text-sm leading-6 text-gray-600">
            Open this route with an address query to generate a banker-ready Proceed / Caution / Escalate memo.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/audit"
              className="inline-flex items-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white"
            >
              Open Audit Scanner
            </Link>
            <Link
              href="/institutions"
              className="inline-flex items-center rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-800"
            >
              Open Institutional Flow
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const report = await performForensicScan(address, mode);

  return <DealRiskMemo report={report} />;
}
