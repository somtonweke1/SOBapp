'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingDown, AlertTriangle, TrendingUp } from 'lucide-react';
import PathwayIndicator from '@/components/shared/pathway-indicator';

type PathwayStep = 'sources' | 'flow' | 'food-supply' | 'model' | 'remediation' | 'monitoring';

interface RemediationROIDashboardProps {
  onPathwayChange?: (step: PathwayStep) => void;
}

export default function RemediationROIDashboard({ onPathwayChange }: RemediationROIDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Pathway Position */}
      <PathwayIndicator currentStep="remediation" onStepChange={onPathwayChange} />

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="text-sm text-zinc-500 font-light mb-1">Remediation Portfolio</div>
          <div className="text-3xl font-extralight text-zinc-900">$2,476.3M</div>
          <div className="text-xs text-blue-600 mt-2">Active Treatment Systems</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-zinc-500 font-light mb-1">Daily Cost Change</div>
          <div className="text-3xl font-extralight text-rose-600 flex items-center gap-2">
            -$55.7M
            <TrendingDown className="w-5 h-5" />
          </div>
          <div className="text-xs text-zinc-500 mt-2">Treatment cost reductions</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-zinc-500 font-light mb-1">GAC Treatment Cost</div>
          <div className="text-3xl font-extralight text-zinc-900">$2,411.93</div>
          <div className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            <span>↘ 0.3% per ton</span>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-zinc-500 font-light mb-1">Contamination Risk</div>
          <div className="text-3xl font-extralight text-amber-600">60%</div>
          <div className="text-xs text-zinc-500 mt-2">Systemic exposure level</div>
        </Card>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: Risk Analysis */}
        <Card className="md:col-span-2 p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-light text-zinc-900 mb-1">Risk Analysis</h3>
                <p className="text-sm text-zinc-500 font-light">
                  Network-based contamination risk and investment intelligence
                </p>
              </div>
              <div className="text-xs text-zinc-500 font-light">
                Updated 6:18:06 PM
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-sm text-zinc-500 mb-2">Systemic Risk</div>
                <div className="text-5xl font-extralight text-zinc-900 mb-2">60%</div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: '60%' }}></div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-zinc-500 mb-2">Concentration Risk</div>
                <div className="text-5xl font-extralight text-zinc-900 mb-2">42%</div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500" style={{ width: '42%' }}></div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-zinc-500 mb-2">Overall Risk Score</div>
                <div className="text-5xl font-extralight text-emerald-600 mb-2">7.8</div>
                <div className="text-xs text-zinc-500">Moderate exposure</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-light text-zinc-900 mb-4">Active Treatment Systems</h4>
            <div className="space-y-4">
              {/* Treatment System 1 */}
              <div className="border border-zinc-200 rounded-lg p-4 hover:border-blue-400 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-medium text-zinc-900 mb-1">GAC Treatment - East Rand</div>
                    <div className="text-xs text-zinc-500">Granular Activated Carbon System</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-light text-zinc-900">$845M</div>
                    <div className="text-xs text-emerald-600">ROI: 3.2x</div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div>
                    <div className="text-zinc-500 mb-1">Capacity</div>
                    <div className="text-zinc-900 font-medium">15M gal/day</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-1">Removal</div>
                    <div className="text-zinc-900 font-medium">98.5%</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-1">Cost/gal</div>
                    <div className="text-zinc-900 font-medium">$0.56</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-1">Breakeven</div>
                    <div className="text-zinc-900 font-medium">18 mo</div>
                  </div>
                </div>
              </div>

              {/* Treatment System 2 */}
              <div className="border border-zinc-200 rounded-lg p-4 hover:border-blue-400 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-medium text-zinc-900 mb-1">Ion Exchange - Ashanti Region</div>
                    <div className="text-xs text-zinc-500">High-Capacity Resin System</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-light text-zinc-900">$620M</div>
                    <div className="text-xs text-blue-600">ROI: 2.8x</div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div>
                    <div className="text-zinc-500 mb-1">Capacity</div>
                    <div className="text-zinc-900 font-medium">8M gal/day</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-1">Removal</div>
                    <div className="text-zinc-900 font-medium">95.2%</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-1">Cost/gal</div>
                    <div className="text-zinc-900 font-medium">$0.78</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-1">Breakeven</div>
                    <div className="text-zinc-900 font-medium">24 mo</div>
                  </div>
                </div>
              </div>

              {/* Treatment System 3 */}
              <div className="border border-zinc-200 rounded-lg p-4 hover:border-blue-400 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-medium text-zinc-900 mb-1">Reverse Osmosis - Niger Delta</div>
                    <div className="text-xs text-zinc-500">Advanced Membrane Filtration</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-light text-zinc-900">$432M</div>
                    <div className="text-xs text-amber-600">ROI: 1.9x</div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div>
                    <div className="text-zinc-500 mb-1">Capacity</div>
                    <div className="text-zinc-900 font-medium">5M gal/day</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-1">Removal</div>
                    <div className="text-zinc-900 font-medium">99.8%</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-1">Cost/gal</div>
                    <div className="text-zinc-900 font-medium">$1.24</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-1">Breakeven</div>
                    <div className="text-zinc-900 font-medium">32 mo</div>
                  </div>
                </div>
              </div>

              {/* Treatment System 4 */}
              <div className="border border-zinc-200 rounded-lg p-4 hover:border-blue-400 transition-colors opacity-60">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-medium text-zinc-900 mb-1">Foam Fractionation - Katanga</div>
                    <div className="text-xs text-zinc-500">Emerging Technology Pilot</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-light text-zinc-900">$185M</div>
                    <div className="text-xs text-zinc-500">In Development</div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div>
                    <div className="text-zinc-500 mb-1">Capacity</div>
                    <div className="text-zinc-900 font-medium">2M gal/day</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-1">Removal</div>
                    <div className="text-zinc-900 font-medium">92.0%</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-1">Cost/gal</div>
                    <div className="text-zinc-900 font-medium">$0.42</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-1">Status</div>
                    <div className="text-zinc-900 font-medium">Pilot</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Right: Actionable Intelligence */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-light text-zinc-900 mb-1">Actionable Intelligence</h3>
              <p className="text-xs text-zinc-500 font-light">
                AI-powered recommendations from constraint engine analysis
              </p>
            </div>

            <div className="space-y-4">
              {/* Recommendation 1 */}
              <div className="border-l-4 border-rose-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded">HIGH PRIORITY</div>
                </div>
                <h4 className="text-sm font-medium text-zinc-900 mb-2 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                  Critical: GAC Supply Constraint
                </h4>
                <p className="text-xs text-zinc-600 font-light leading-relaxed mb-3">
                  Limited activated carbon supply from Southeast Asia. Estimated exposure: $950M with 64% risk score.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Recommended Action:</span>
                    <span className="text-zinc-900 font-medium">Local GAC Production</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Expected Benefit:</span>
                    <span className="text-emerald-600 font-medium">$500M</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">ROI:</span>
                    <span className="text-blue-600 font-medium">4.2x</span>
                  </div>
                </div>
              </div>

              {/* Recommendation 2 */}
              <div className="border-l-4 border-amber-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">HIGH</div>
                </div>
                <h4 className="text-sm font-medium text-zinc-900 mb-2 flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  Ion Exchange Resin Shortage
                </h4>
                <p className="text-xs text-zinc-600 font-light leading-relaxed mb-3">
                  Insufficient ion exchange resin production capacity. Estimated exposure: $650M with 45% risk score.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Recommended Action:</span>
                    <span className="text-zinc-900 font-medium">Resin Regeneration Program</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Expected Benefit:</span>
                    <span className="text-emerald-600 font-medium">$450M</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">ROI:</span>
                    <span className="text-blue-600 font-medium">2.3x</span>
                  </div>
                </div>
              </div>

              {/* Recommendation 3 */}
              <div className="border-l-4 border-orange-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">HIGH</div>
                </div>
                <h4 className="text-sm font-medium text-zinc-900 mb-2 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  Treatment System Deployment Delay
                </h4>
                <p className="text-xs text-zinc-600 font-light leading-relaxed mb-3">
                  Critical bottleneck in water treatment system installation. Estimated exposure: $450M with 48% risk score.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Recommended Action:</span>
                    <span className="text-zinc-900 font-medium">Modular System Approach</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Expected Benefit:</span>
                    <span className="text-emerald-600 font-medium">$220M</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">ROI:</span>
                    <span className="text-blue-600 font-medium">8.8x</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Portfolio Summary */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-white">
            <h4 className="text-base font-light text-zinc-900 mb-4">Portfolio Summary</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600">Total Remediation Investment</span>
                <span className="text-zinc-900 font-medium">$2,476M</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600">Annual Treatment Capacity</span>
                <span className="text-zinc-900 font-medium">30M gal/day</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600">Average PFAS Removal</span>
                <span className="text-emerald-600 font-medium">96.4%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600">Weighted Avg ROI</span>
                <span className="text-blue-600 font-medium">2.8x</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600">Population Protected</span>
                <span className="text-zinc-900 font-medium">4.2M people</span>
              </div>
            </div>
          </Card>

          {/* Risk Indicator */}
          <Card className="p-6 bg-gradient-to-br from-amber-50 to-white border-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <div className="text-sm font-medium text-amber-900 mb-1">Market Alert</div>
                <p className="text-xs text-amber-800 font-light leading-relaxed">
                  GAC prices increased 12% this quarter due to supply chain disruptions. Consider hedging strategies or alternative treatment technologies.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
