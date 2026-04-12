'use client';

export default function PublicRiskDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-slate-950 p-8">
      <div className="mx-auto max-w-2xl rounded-sm border border-red-900/60 bg-slate-900 p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-red-400">Runtime Recovery</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Public Risk Dashboard hit a render exception</h1>
        <p className="mt-3 text-sm text-slate-300">
          StoneBridge caught the error and preserved the route. Retry to reload live loop data.
        </p>
        {error?.message && (
          <p className="mt-3 rounded border border-slate-800 bg-slate-950 p-3 text-xs text-slate-400">
            {error.message}
          </p>
        )}
        <button
          onClick={reset}
          className="mt-4 rounded-sm bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
        >
          Retry Dashboard
        </button>
      </div>
    </main>
  );
}

