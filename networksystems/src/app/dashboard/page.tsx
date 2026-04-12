import { Suspense } from 'react';
import StoneBridgeShell from '@/components/stonebridge/shell/StoneBridgeShell';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default function DashboardPage({
  searchParams,
}: {
  searchParams?: { shield?: string; mode?: string };
}) {
  const raw = searchParams?.shield ?? searchParams?.mode;
  const mode = raw === 'compliance' ? 'compliance' : 'asset';
  return (
    <StoneBridgeShell
      activeMode={mode}
      title="StoneBridge AI: The Forensic Shield"
      subtitle="Baltimore deal diagnostics plus Maryland procurement and vendor-risk signal fusion for pre-signature decisions."
      primaryAction={null}
      secondaryAction={null}
    >
      <Suspense fallback={<div className="min-h-[60vh]" />}>
        <DashboardClient initialMode={mode} />
      </Suspense>
    </StoneBridgeShell>
  );
}
