import type { ReactNode } from 'react';
import InternalOpsNavigation from '@/components/internal-ops/Navigation';

export default function InternalOpsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 text-zinc-600">
      <div className="mx-auto min-h-screen max-w-[1800px]">
        <InternalOpsNavigation />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
