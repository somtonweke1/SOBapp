'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

type ConsoleMode = 'asset' | 'compliance';

type Line = {
  level: 'CONNECTING' | 'QUERYING' | 'ANALYZING' | 'CROSS-REF' | 'COMPLETE';
  message: string;
};

function nowStamp() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export default function ForensicConsole({
  mode,
  address,
  onComplete,
}: {
  mode: ConsoleMode;
  address: string;
  onComplete: () => void;
}) {
  const script = useMemo<Line[]>(() => {
    const account = `DPW-${String(77000 + Math.floor(Math.random() * 2000))}`;
    return [
      { level: 'CONNECTING', message: 'Maryland SDAT Real Property Search...' },
      { level: 'QUERYING', message: `Baltimore City Lien Database (Account ${account})...` },
      {
        level: 'ANALYZING',
        message:
          mode === 'asset'
            ? 'Meter Size (2") vs. Property Class (Residential)...'
            : 'Waste Profile vs. Practice Activity (Dental)...',
      },
      { level: 'CROSS-REF', message: 'EPA Enforcement History (RCRA)...' },
      { level: 'COMPLETE', message: 'Discrepancy Detected.' },
    ];
  }, [mode]);

  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const t = setInterval(() => {
      if (cancelled) return;
      setVisibleCount((prev) => prev + 1);
    }, 650);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    if (visibleCount >= script.length) {
      const t = setTimeout(() => onComplete(), 450);
      return () => clearTimeout(t);
    }
    return;
  }, [onComplete, script.length, visibleCount]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Live Investigation</div>
          <h2 className="mt-2 text-xl font-semibold text-gray-900">Public record sweep in progress</h2>
          <p className="mt-2 text-sm text-gray-600">
            Target: <span className="font-medium text-gray-900">{address}</span>
          </p>
        </div>
        <div className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-700">
          {mode === 'asset' ? 'ASSET AUDIT' : 'COMPLIANCE AUDIT'}
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-gray-900 p-4 shadow-inner">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-300">Forensic Console</div>
          <div className="text-[11px] font-medium text-gray-400">StoneBridge Investigation Bus</div>
        </div>

        <div className="mt-3 space-y-2 font-forensic text-[12px] leading-5 text-gray-100">
          {script.slice(0, Math.min(visibleCount, script.length)).map((line, idx) => (
            <motion.div
              key={`${line.level}-${idx}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className="flex items-start gap-3"
            >
              <span className="text-gray-400">[{nowStamp()}]</span>
              <span
                className={
                  line.level === 'COMPLETE'
                    ? 'text-emerald-300'
                    : line.level === 'CROSS-REF'
                      ? 'text-indigo-200'
                      : 'text-gray-100'
                }
              >
                [{line.level}]
              </span>
              <span className="text-gray-100">{line.message}</span>
            </motion.div>
          ))}

          {visibleCount < script.length ? (
            <div className="flex items-center gap-2 text-gray-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-gray-500" />
              <span>Working…</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

