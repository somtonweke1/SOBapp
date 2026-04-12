'use client';

import { Shield, ShieldCheck } from 'lucide-react';

export type ShieldMode = 'ASSET' | 'OPS';

type ShieldKey = 'asset' | 'compliance' | 'ops';

export default function Sidebar({
  activeShield,
  onSelectShield,
}: {
  activeShield: ShieldKey;
  onSelectShield: (shield: ShieldKey) => void;
}) {
  return (
    <aside className="hidden w-16 flex-col items-center gap-3 border-r border-zinc-200/60 bg-white/80 py-4 shadow-sm backdrop-blur-sm sm:flex">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-sm">
        <ShieldCheck className="h-5 w-5 text-emerald-600" />
      </div>

      <div className="mt-2 flex w-full flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => onSelectShield('asset')}
          className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xs shadow-sm transition-colors ${
            activeShield === 'asset'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-zinc-200 bg-white/80 text-zinc-500 hover:bg-white'
          }`}
          aria-label="Asset Shield"
        >
          <Shield className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => onSelectShield('ops')}
          className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xs shadow-sm transition-colors ${
            activeShield === 'ops'
              ? 'border-amber-300 bg-amber-50 text-amber-700'
              : 'border-zinc-200 bg-white/80 text-zinc-500 hover:bg-white'
          }`}
          aria-label="Ops Shield"
        >
          <span className="text-[11px] font-medium">OPS</span>
        </button>
      </div>

      <div className="mt-auto flex w-full flex-col items-center gap-2 pb-2">
        <button
          type="button"
          onClick={() => onSelectShield('compliance')}
          className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xs shadow-sm transition-colors ${
            activeShield === 'compliance'
              ? 'border-blue-300 bg-blue-50 text-blue-700'
              : 'border-zinc-200 bg-white/80 text-zinc-500 hover:bg-white'
          }`}
          aria-label="Compliance Shield"
        >
          <span className="text-[11px] font-medium">CMP</span>
        </button>
      </div>
    </aside>
  );
}

