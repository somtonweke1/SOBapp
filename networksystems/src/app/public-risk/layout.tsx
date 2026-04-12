import type { ReactNode } from 'react';
import PublicRiskNavigation from '@/components/public-risk/Navigation';

export default function PublicRiskLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1800px]">
        <PublicRiskNavigation />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

