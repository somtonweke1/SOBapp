'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CleanStoryLanding from '@/components/landing/clean-story-landing';
import { AuthProvider, useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { LogOut, Droplet } from 'lucide-react';
import LiveMarketFeed from '@/components/dashboard/live-market-feed';
import PFASSourceMappingDashboard from '@/components/pfas/source-mapping-dashboard';
import RemediationROIDashboard from '@/components/pfas/remediation-roi-dashboard';
import FoodSupplyChainDashboard from '@/components/pfas/food-supply-chain-dashboard';
import WaterFoodModelDashboard from '@/components/pfas/water-food-model-dashboard';
import PFASFlowDashboard from '@/components/pfas/pfas-flow-dashboard';

type PFASTabType = 'source-mapping' | 'pfas-flow' | 'food-supply' | 'water-food-model' | 'remediation-roi' | 'live-monitoring';
type PathwayStep = 'sources' | 'flow' | 'food-supply' | 'model' | 'remediation' | 'monitoring';

// Mapping between pathway steps and tab types
const pathwayToTab: Record<PathwayStep, PFASTabType> = {
  'sources': 'source-mapping',
  'flow': 'pfas-flow',
  'food-supply': 'food-supply',
  'model': 'water-food-model',
  'remediation': 'remediation-roi',
  'monitoring': 'live-monitoring'
};

const tabToPathway: Record<PFASTabType, PathwayStep> = {
  'source-mapping': 'sources',
  'pfas-flow': 'flow',
  'food-supply': 'food-supply',
  'water-food-model': 'model',
  'remediation-roi': 'remediation',
  'live-monitoring': 'monitoring'
};

function HomeContent() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showLanding, setShowLanding] = useState(true);
  const [pfasTab, setPfasTab] = useState<PFASTabType>('source-mapping');

  // Handler for pathway navigation
  const handlePathwayChange = (step: PathwayStep) => {
    setPfasTab(pathwayToTab[step]);
  };

  // Check if user just logged in and should go to platform
  useEffect(() => {
    if (isLoading) return;

    const accessParam = searchParams.get('access');
    if (user && accessParam === 'platform') {
      setShowLanding(false);
      router.replace('/');
    }
  }, [user, isLoading, searchParams, router]);

  // Show landing page for public access (no user) or when explicitly requested
  if (!user || showLanding) {
    return <CleanStoryLanding />;
  }

  const renderActiveContent = () => {
    switch (pfasTab) {
      case 'source-mapping':
        return <PFASSourceMappingDashboard onPathwayChange={handlePathwayChange} />;
      case 'pfas-flow':
        return <PFASFlowDashboard onPathwayChange={handlePathwayChange} />;
      case 'food-supply':
        return <FoodSupplyChainDashboard onPathwayChange={handlePathwayChange} />;
      case 'water-food-model':
        return <WaterFoodModelDashboard onPathwayChange={handlePathwayChange} />;
      case 'remediation-roi':
        return <RemediationROIDashboard onPathwayChange={handlePathwayChange} />;
      case 'live-monitoring':
        return <LiveMarketFeed onPathwayChange={handlePathwayChange} />;
      default:
        return <PFASSourceMappingDashboard onPathwayChange={handlePathwayChange} />;
    }
  };

  // If user is authenticated, show the full Intelligence Platform
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100">
      {/* Platform Header */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-zinc-200/50 sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-600">
                  <Droplet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-light text-zinc-900">MIAR</div>
                  <div className="text-xs text-zinc-500 font-light">PFAS Intelligence Platform</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:block text-sm text-zinc-600 font-light">
                {user?.name}
              </div>
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="text-zinc-600 hover:text-zinc-900"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-[1800px] mx-auto">
          {renderActiveContent()}
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <HomeContent />
    </AuthProvider>
  );
}
