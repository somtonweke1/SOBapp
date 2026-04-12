'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

export default function ScanProgress({
  steps,
  onComplete,
}: {
  steps: string[];
  onComplete: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  const safeSteps = useMemo(() => (Array.isArray(steps) && steps.length ? steps : ['Initializing scan...']), [steps]);

  useEffect(() => {
    let cancelled = false;
    let t: ReturnType<typeof setTimeout> | null = null;

    const tick = () => {
      if (cancelled) return;
      t = setTimeout(() => {
        if (cancelled) return;
        setActiveIndex((prev) => {
          const next = prev + 1;
          if (next >= safeSteps.length) {
            // Give the user a beat to see "complete" before flipping state.
            setTimeout(() => {
              if (!cancelled) onComplete();
            }, 450);
            return safeSteps.length;
          }
          return next;
        });
        tick();
      }, 650);
    };

    tick();
    return () => {
      cancelled = true;
      if (t) clearTimeout(t);
    };
  }, [onComplete, safeSteps.length]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Live Scan</div>
      <h2 className="mt-2 text-xl font-semibold text-gray-900">Triangulating public records + documents</h2>
      <p className="mt-2 text-sm text-gray-600">
        We show our work. Each check below represents a distinct external or internal validation step.
      </p>

      <div className="mt-6 space-y-3">
        {safeSteps.map((label, idx) => {
          const done = idx < activeIndex;
          const active = idx === activeIndex;
          return (
            <motion.div
              key={`${label}-${idx}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(idx, 6) * 0.03 }}
              className="flex items-start gap-3"
            >
              <div className="mt-0.5">
                {done ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3}>
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                ) : active ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-white">
                    <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-gray-900" />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full border border-gray-300 bg-white" />
                )}
              </div>
              <div className="flex-1">
                <div className={`text-sm ${done ? 'text-gray-900' : active ? 'text-gray-900' : 'text-gray-600'}`}>
                  {label}
                </div>
                {active ? (
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full w-2/3 animate-pulse rounded-full bg-gray-900/25" />
                  </div>
                ) : null}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

