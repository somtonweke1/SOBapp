'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

export type ShieldMode = 'asset' | 'compliance';

export default function ForensicSearch({
  mode,
  state,
  initialQuery,
  onModeChange,
  onSubmit,
}: {
  mode: ShieldMode;
  state: 'idle' | 'results';
  initialQuery?: string;
  onModeChange: (mode: ShieldMode) => void;
  onSubmit: (query: string) => void;
}) {
  const [query, setQuery] = useState<string>(initialQuery ?? '');

  const placeholder = useMemo(() => {
    return mode === 'asset'
      ? 'Enter property address to scan for found money...'
      : 'Enter practice address to check route eligibility...';
  }, [mode]);

  return (
    <motion.div
      layout
      transition={{ duration: 0.22 }}
      className={state === 'idle' ? 'w-full max-w-2xl' : 'w-full max-w-2xl'}
    >
      <div className={state === 'idle' ? 'mb-4 flex justify-center' : 'mb-3'}>
        <div className="inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => onModeChange('asset')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'asset' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Asset Shield (Landlord)
          </button>
          <button
            type="button"
            onClick={() => onModeChange('compliance')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'compliance' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Compliance Shield (Tenant)
          </button>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = query.trim();
          if (!trimmed) return;
          onSubmit(trimmed);
        }}
        className="w-full"
      >
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-full border border-gray-200 bg-white px-6 py-4 text-lg text-gray-900 shadow-lg outline-none focus:ring-4 focus:ring-emerald-100"
          />
          <button
            type="submit"
            className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors ${
              mode === 'asset' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            Scan
          </button>
        </div>
      </form>

      {state === 'idle' ? (
        <div className="mt-4 text-center text-sm text-gray-500">
          Input address, compute value, execute.
        </div>
      ) : null}
    </motion.div>
  );
}

