'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [isDelayed, setIsDelayed] = useState(false);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let delayTimer: NodeJS.Timeout | null = null;
    let progressTimer: NodeJS.Timeout | null = null;

    const startPolling = () => {
      setProgress(15);
      progressTimer = setInterval(() => {
        setProgress((value) => (value < 90 ? value + 5 : value));
      }, 900);

      interval = setInterval(async () => {
        if (!sessionId) return;
        try {
          const response = await fetch(`/api/auth/check-subscription?session_id=${encodeURIComponent(sessionId)}`);
          if (!response.ok) return;
          const data = await response.json();
          if (data.subscribed) {
            setIsVerified(true);
            setProgress(100);
            if (interval) clearInterval(interval);
            if (progressTimer) clearInterval(progressTimer);
            setTimeout(() => {
              router.replace(`/dashboard?from=success&session_id=${encodeURIComponent(sessionId)}`);
            }, 900);
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 1500);

      delayTimer = setTimeout(() => {
        setIsDelayed(true);
      }, 15000);
    };

    startPolling();

    return () => {
      if (interval) clearInterval(interval);
      if (progressTimer) clearInterval(progressTimer);
      if (delayTimer) clearTimeout(delayTimer);
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
            className="h-full rounded-full bg-emerald-500 transition-all duration-[1200ms] ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-4 text-xs text-zinc-400">
          {isVerified ? 'Access granted. Launching the War Room…' : 'Verifying your membership status…'}
        </div>

        {isDelayed && !isVerified && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-zinc-300">
            <p>Taking longer than expected.</p>
            <button
              onClick={() => router.replace('/dashboard?from=success')}
              className="mt-3 w-full rounded-lg border border-emerald-400/70 bg-emerald-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-emerald-600"
            >
              Go to Dashboard Anyway
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
