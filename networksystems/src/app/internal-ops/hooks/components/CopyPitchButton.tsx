'use client';

import { useState } from 'react';

export default function CopyPitchButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-light text-zinc-700 hover:bg-zinc-50"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
    >
      {copied ? 'Copied' : 'Copy Pitch'}
    </button>
  );
}
