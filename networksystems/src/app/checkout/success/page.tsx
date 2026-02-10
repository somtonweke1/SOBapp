'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(100);
    }, 200);

    const redirectTimer = setTimeout(() => {
      const target = sessionId
        ? `/dashboard?from=success&session_id=${encodeURIComponent(sessionId)}`
        : '/dashboard?from=success';
      router.replace(target);
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(redirectTimer);
    };
  }, [router, sessionId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-950 text-white flex items-center justify-center px-6">
      <div className="max-w-lg w-full rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-400/40 animate-pulse">
          <span className="text-2xl font-semibold text-emerald-300">S</span>
        </div>
        <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Verified</p>
        <h1 className="mt-4 text-2xl font-semibold">Securing Your Forensic Access...</h1>
        <p className="mt-3 text-sm text-zinc-300">
          We are activating your War Room privileges and syncing your membership status.
        </p>

        <div className="mt-8 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-[2600ms] ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-4 text-xs text-zinc-400">Redirecting you to the War Room...</p>
      </div>
    </div>
  );
}
