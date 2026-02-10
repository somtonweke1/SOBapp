'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// DEPRECATED: Critical Minerals Supply Chain Risk
// This product has been sunset. Focus is now 100% on PFAS Intelligence Platform.
// All traffic redirects to /pfas-flow-intelligence

export default function SupplyChainRiskRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/pfas-flow-intelligence');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="text-center">
        <p className="text-zinc-600">Redirecting to PFAS Intelligence Platform...</p>
      </div>
    </div>
  );
}
