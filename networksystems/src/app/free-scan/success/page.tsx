import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function FreeScanSuccessPage({
  searchParams,
}: {
  searchParams?: { session_id?: string; intake?: string };
}) {
  const sessionId = searchParams?.session_id;
  const intakeId = searchParams?.intake;

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 px-6 py-16 text-zinc-700">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-zinc-200/70 bg-white/95 p-10 shadow-xl shadow-zinc-900/5">
        <p className="text-xs uppercase tracking-[0.24em] text-emerald-700">Payment Received</p>
        <h1 className="mt-3 text-4xl font-extralight tracking-tight text-zinc-950">
          Your deal memo request is in motion.
        </h1>
        <p className="mt-4 text-base leading-7 text-zinc-600">
          StoneBridge captured the intake and payment. The next step is operator review, evidence collection, and memo
          delivery against the asset and timeline you submitted.
        </p>

        <div className="mt-8 grid gap-4 rounded-3xl border border-zinc-200 bg-zinc-50 p-6 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">What Happens Next</p>
            <p className="mt-2 text-sm leading-6 text-zinc-700">
              Intake is routed into the internal ops workflow. Expect a scoped follow-up if supporting documents or
              clarification are needed before the memo is delivered.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Reference</p>
            <p className="mt-2 text-sm leading-6 text-zinc-700">Checkout session: {sessionId || 'Unavailable'}</p>
            <p className="text-sm leading-6 text-zinc-700">Intake ID: {intakeId || 'Unavailable'}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white"
          >
            Return Home
          </Link>
          <Link
            href="/truth/maryland-procurement"
            className="inline-flex items-center rounded-xl border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-800"
          >
            Review Evidence Standard
          </Link>
        </div>
      </div>
    </main>
  );
}
