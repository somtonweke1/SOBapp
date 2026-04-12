import { Suspense } from 'react';
import AuditClient from './AuditClient';

export const dynamic = 'force-dynamic';

export default function AuditPage({
  searchParams,
}: {
  searchParams?: { mode?: string };
}) {
  const mode = searchParams?.mode === 'compliance' ? 'compliance' : 'asset';

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <AuditClient initialMode={mode} />
    </Suspense>
  );
}
