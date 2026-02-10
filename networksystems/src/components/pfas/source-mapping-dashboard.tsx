'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import PathwayIndicator from '@/components/shared/pathway-indicator';
import PFASSupplyChainMap from '@/components/pfas/pfas-supply-chain-map';

type PathwayStep = 'sources' | 'flow' | 'food-supply' | 'model' | 'remediation' | 'monitoring';

interface PFASSourceMappingDashboardProps {
  onPathwayChange?: (step: PathwayStep) => void;
}

export default function PFASSourceMappingDashboard({ onPathwayChange }: PFASSourceMappingDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Pathway Position */}
      <PathwayIndicator currentStep="sources" onStepChange={onPathwayChange} />

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="text-sm text-zinc-500 font-light mb-1">Industrial PFAS Sources</div>
          <div className="text-3xl font-extralight text-zinc-900">127</div>
          <div className="text-xs text-rose-600 mt-2">68% High-Risk Classification</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-zinc-500 font-light mb-1">Total Discharge Volume</div>
          <div className="text-3xl font-extralight text-zinc-900">$6.0B</div>
          <div className="text-xs text-zinc-500 mt-2">Annual Contamination Exposure</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-zinc-500 font-light mb-1">Remediation Liability</div>
          <div className="text-3xl font-extralight text-zinc-900">$16.6B</div>
          <div className="text-xs text-zinc-500 mt-2">Estimated Cleanup Costs</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-zinc-500 font-light mb-1">PFAS Concentration</div>
          <div className="text-3xl font-extralight text-zinc-900">110,902</div>
          <div className="text-xs text-zinc-500 mt-2">ng/L Avg Detected</div>
        </Card>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: PFAS Supply Chain Network Map - Cloned from Critical Minerals */}
        <div className="md:col-span-2">
          <PFASSupplyChainMap />
        </div>

        {/* Right: Intelligence Panels */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-4">
              <div className="text-xs text-blue-600 font-medium mb-2">LIVE ANALYSIS</div>
              <h3 className="text-lg font-light text-zinc-900 mb-1">Strategic Intelligence</h3>
              <p className="text-xs text-zinc-500 font-light">AI-powered contamination source analysis</p>
            </div>

            <div className="space-y-4">
              <div className="text-center py-3 bg-blue-50 rounded-lg">
                <div className="text-xs text-blue-600 font-medium mb-1">Overall Risk Level</div>
                <div className="text-2xl font-light text-blue-700">MEDIUM</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-4">
              <div className="text-xs text-rose-600 font-medium mb-2">PRIORITY OPPORTUNITY</div>
              <h4 className="text-base font-light text-zinc-900 mb-2">Tailings Dam Remediation</h4>
              <p className="text-xs text-zinc-600 font-light leading-relaxed">
                Analysis of East Rand, West Rand, and Klerksdorp tailings dams reveals 6.6M gallons of contaminated water requiring $16B+ remediation.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <div className="text-xs text-zinc-500 mb-1">Total Volume</div>
                <div className="text-lg font-light text-zinc-900">6.6M gal</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">Cleanup Cost</div>
                <div className="text-lg font-light text-zinc-900">$16.0B</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">Avg Treatment</div>
                <div className="text-lg font-light text-zinc-900">$850/gal</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">Exposed Pop</div>
                <div className="text-lg font-light text-zinc-900">2.4M</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="py-2 bg-emerald-50 rounded">
                <div className="text-emerald-600 font-medium">+2%</div>
                <div className="text-zinc-500">New Surveys</div>
              </div>
              <div className="py-2 bg-rose-50 rounded">
                <div className="text-rose-600 font-medium">+12%</div>
                <div className="text-zinc-500">Risk Increase</div>
              </div>
              <div className="py-2 bg-blue-50 rounded">
                <div className="text-blue-600 font-medium">-8%</div>
                <div className="text-zinc-500">Treatment Costs</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-4">
              <div className="text-xs text-emerald-600 font-medium mb-2">ADDITIONAL EXPOSURE</div>
              <h4 className="text-base font-light text-zinc-900 mb-2">Multi-Source Contamination</h4>
              <p className="text-xs text-zinc-600 font-light leading-relaxed">
                Industrial operations contain multiple PFAS sources including firefighting foam, processing chemicals, and equipment maintenance compounds.
              </p>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-500">AFFF Foam Sites</span>
                  <span className="text-zinc-900 font-medium">1,200 sites</span>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-500">Processing Chemicals</span>
                  <span className="text-zinc-900 font-medium">8,000 kg/yr</span>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: '60%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-500">Equipment Discharge</span>
                  <span className="text-zinc-900 font-medium">750 t/yr</span>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: '40%' }}></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="py-2 bg-zinc-50 rounded">
                <div className="text-zinc-900 font-medium">+147%</div>
                <div className="text-zinc-500 text-[10px]">From Current</div>
              </div>
              <div className="py-2 bg-zinc-50 rounded">
                <div className="text-zinc-900 font-medium">Fresh</div>
                <div className="text-zinc-500 text-[10px]">New Discovery</div>
              </div>
              <div className="py-2 bg-zinc-50 rounded">
                <div className="text-zinc-900 font-medium">Active</div>
                <div className="text-zinc-500 text-[10px]">Under Monitor</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
