import { ProcurementScanner } from '@/components/procurement/ProcurementScanner';

export const dynamic = 'force-dynamic';

export default function ProcurementScannerPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Protected Route</p>
          <p className="mt-1 text-sm text-emerald-100">
            This page is secured by the same internal access code as the Internal Ops dashboard.
          </p>
        </div>
        <ProcurementScanner />
      </div>
    </main>
  );
}
