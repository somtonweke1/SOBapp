'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

export default function ProcessPanel({
  title = 'Value / Process',
  steps,
  bullets,
  ctas,
}: {
  title?: string;
  steps: string[];
  bullets?: string[];
  ctas?: Array<{ href: string; label: string; tone?: 'primary' | 'secondary' }>;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200/60 bg-white/70 p-6 shadow-xl backdrop-blur-sm">
      <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">
        {title}
      </p>

      <ol className="mt-4 space-y-3 text-sm font-light text-zinc-700">
        {steps.map((step, idx) => (
          <li key={step} className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 bg-white text-xs text-zinc-600">
              {idx + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      {bullets?.length ? (
        <div className="mt-6 rounded-xl border border-zinc-200/50 bg-white/80 p-4">
          <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">
            Outcome
          </p>
          <ul className="mt-3 space-y-2 text-sm font-light text-zinc-700">
            {bullets.map((b) => (
              <li key={b} className="flex gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-emerald-600" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {ctas?.length ? (
        <div className="mt-6 flex flex-col gap-2">
          {ctas.map((cta) => (
            <Link
              key={cta.href}
              href={cta.href}
              className={
                cta.tone === 'primary'
                  ? 'inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-xs font-light uppercase tracking-[0.3em] text-white shadow-sm transition-colors hover:bg-emerald-700'
                  : 'inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white/70 px-4 py-2 text-xs font-light uppercase tracking-[0.3em] text-zinc-700 shadow-sm transition-colors hover:bg-white'
              }
            >
              {cta.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

