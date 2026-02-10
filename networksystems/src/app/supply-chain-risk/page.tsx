'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// DEPRECATED: Legacy supply chain module
// All traffic redirects to SOBapp Deal Shield

export default function SupplyChainRiskRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/deal-shield');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100">
      <div className="text-center">
        <p className="text-zinc-600 font-light">Redirecting to SOBapp Deal Shield...</p>
      </div>
    </div>
  );
}
