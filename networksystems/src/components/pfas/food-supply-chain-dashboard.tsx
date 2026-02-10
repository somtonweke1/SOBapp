'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, CheckCircle, Activity } from 'lucide-react';
import PathwayIndicator from '@/components/shared/pathway-indicator';

type PathwayStep = 'sources' | 'flow' | 'food-supply' | 'model' | 'remediation' | 'monitoring';

interface FoodSupplyChainDashboardProps {
  onPathwayChange?: (step: PathwayStep) => void;
}

export default function FoodSupplyChainDashboard({ onPathwayChange }: FoodSupplyChainDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Pathway Position */}
      <PathwayIndicator currentStep="food-supply" onStepChange={onPathwayChange} />

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="text-sm text-zinc-500 font-light mb-1">Food Volume Tracked</div>
          <div className="text-3xl font-extralight text-zinc-900">110,620M</div>
          <div className="text-xs text-blue-600 mt-2">Tonnes Monitored</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-zinc-500 font-light mb-1">Coverage</div>
          <div className="text-3xl font-extralight text-emerald-600 flex items-center gap-2">
            100%
            <Activity className="w-5 h-5" />
          </div>
          <div className="text-xs text-zinc-500 mt-2">Supply Chain Monitoring</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-zinc-500 font-light mb-1">Distribution Hubs</div>
          <div className="text-3xl font-extralight text-zinc-900">47</div>
          <div className="text-xs text-zinc-500 mt-2">Active Facilities</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-zinc-500 font-light mb-1">Critical Alerts</div>
          <div className="text-3xl font-extralight text-amber-600">3</div>
          <div className="text-xs text-zinc-500 mt-2">Updated 6:27:49 PM</div>
        </Card>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: Supply Chain Routes */}
        <Card className="md:col-span-2 p-6">
          <div className="mb-6">
            <h3 className="text-xl font-light text-zinc-900 mb-1">Food Supply Chain Routes</h3>
            <p className="text-sm text-zinc-500 font-light">
              Physical food distribution pathways and contamination intelligence
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {/* Route 1 */}
            <div className="border border-zinc-200 rounded-lg p-4 hover:border-amber-400 transition-colors bg-gradient-to-r from-amber-50/50 to-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                  <div>
                    <div className="font-medium text-zinc-900">Central Valley Farms → West Coast Processing</div>
                    <div className="text-xs text-zinc-500 mt-1">Leafy greens, vegetables, fruits</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded">ACTIVE</div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 text-xs">
                <div>
                  <div className="text-zinc-500 mb-1">PFAS Load</div>
                  <div className="text-zinc-900 font-medium">87%</div>
                  <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-amber-500" style={{ width: '87%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="text-zinc-500 mb-1">Transit Time</div>
                  <div className="text-zinc-900 font-medium">18 days</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Farm to retail</div>
                </div>
                <div>
                  <div className="text-zinc-500 mb-1">Risk Level</div>
                  <div className="text-amber-600 font-medium">MEDIUM</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Irrigation water</div>
                </div>
                <div>
                  <div className="text-zinc-500 mb-1">Volume</div>
                  <div className="text-zinc-900 font-medium">45K tons</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Weekly throughput</div>
                </div>
              </div>
            </div>

            {/* Route 2 */}
            <div className="border border-zinc-200 rounded-lg p-4 hover:border-emerald-400 transition-colors bg-gradient-to-r from-emerald-50/50 to-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <div>
                    <div className="font-medium text-zinc-900">Midwest Dairy → East Coast Distribution</div>
                    <div className="text-xs text-zinc-500 mt-1">Milk, cheese, dairy products</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded">ACTIVE</div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 text-xs">
                <div>
                  <div className="text-zinc-500 mb-1">PFAS Load</div>
                  <div className="text-zinc-900 font-medium">65%</div>
                  <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-emerald-500" style={{ width: '65%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="text-zinc-500 mb-1">Transit Time</div>
                  <div className="text-zinc-900 font-medium">22 days</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Farm to retail</div>
                </div>
                <div>
                  <div className="text-zinc-500 mb-1">Risk Level</div>
                  <div className="text-emerald-600 font-medium">LOW</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Treated water</div>
                </div>
                <div>
                  <div className="text-zinc-500 mb-1">Volume</div>
                  <div className="text-zinc-900 font-medium">28K tons</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Weekly throughput</div>
                </div>
              </div>
            </div>

            {/* Route 3 */}
            <div className="border border-zinc-200 rounded-lg p-4 hover:border-rose-400 transition-colors bg-gradient-to-r from-rose-50/50 to-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                  <div>
                    <div className="font-medium text-zinc-900">Southeast Poultry → National Distribution</div>
                    <div className="text-xs text-zinc-500 mt-1">Chicken, eggs, poultry products</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs font-medium text-rose-600 bg-rose-100 px-2 py-1 rounded">HIGH RISK</div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 text-xs">
                <div>
                  <div className="text-zinc-500 mb-1">PFAS Load</div>
                  <div className="text-zinc-900 font-medium">94%</div>
                  <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-rose-500" style={{ width: '94%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="text-zinc-500 mb-1">Transit Time</div>
                  <div className="text-zinc-900 font-medium">12 days</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Farm to retail</div>
                </div>
                <div>
                  <div className="text-zinc-500 mb-1">Risk Level</div>
                  <div className="text-rose-600 font-medium">HIGH</div>
                  <div className="text-[10px] text-zinc-500 mt-1">AFFF contamination</div>
                </div>
                <div>
                  <div className="text-zinc-500 mb-1">Volume</div>
                  <div className="text-zinc-900 font-medium">67K tons</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Weekly throughput</div>
                </div>
              </div>
            </div>
          </div>

          {/* Trade Flows / Food Commodity Flows */}
          <div>
            <h4 className="text-lg font-light text-zinc-900 mb-4">Food Commodity Flows</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4 bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-2xl font-light text-emerald-700 mb-1">Leafy Greens</div>
                    <div className="text-xs text-zinc-500">Central Valley Production</div>
                  </div>
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600">Market Value:</span>
                    <span className="text-zinc-900 font-medium">$8.2B</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600">Volume:</span>
                    <span className="text-zinc-900 font-medium">125.4M tons</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600">Primary Market:</span>
                    <span className="text-zinc-900 font-medium">West Coast</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600">PFAS Risk:</span>
                    <span className="text-amber-600 font-medium">Medium</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-blue-50 to-white border-blue-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-2xl font-light text-blue-700 mb-1">Dairy Products</div>
                    <div className="text-xs text-zinc-500">Midwest Production</div>
                  </div>
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600">Market Value:</span>
                    <span className="text-zinc-900 font-medium">$62.1B</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600">Volume:</span>
                    <span className="text-zinc-900 font-medium">85.8M tons</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600">Primary Market:</span>
                    <span className="text-zinc-900 font-medium">National</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600">PFAS Risk:</span>
                    <span className="text-emerald-600 font-medium">Low</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Card>

        {/* Right: Supply Chain Intelligence */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-light text-zinc-900 mb-1">Supply Chain Intelligence</h3>
              <p className="text-xs text-zinc-500 font-light">
                AI-powered contamination alerts and routing recommendations
              </p>
            </div>

            <div className="space-y-4">
              {/* Alert 1 - URGENT */}
              <div className="border-l-4 border-rose-500 pl-4 py-3 bg-rose-50/50 rounded-r">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-xs font-medium text-rose-600 bg-rose-100 px-2 py-1 rounded">URGENT</div>
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                </div>
                <h4 className="text-sm font-medium text-zinc-900 mb-2">
                  Irrigation Water Contamination
                </h4>
                <p className="text-xs text-zinc-600 font-light leading-relaxed mb-3">
                  8-day detection lag in Southeast region. PFAS levels exceeded FDA guidelines for 3 farms.
                </p>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Affected Farms:</span>
                    <span className="text-rose-600 font-medium">12 facilities</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Cost Impact:</span>
                    <span className="text-rose-600 font-medium">+$2.3M</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Exposure:</span>
                    <span className="text-zinc-900 font-medium">450K people</span>
                  </div>
                </div>
              </div>

              {/* Alert 2 - OPTIMIZE */}
              <div className="border-l-4 border-amber-500 pl-4 py-3 bg-amber-50/50 rounded-r">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded">OPTIMIZE</div>
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                </div>
                <h4 className="text-sm font-medium text-zinc-900 mb-2">
                  Processing Facility Alert
                </h4>
                <p className="text-xs text-zinc-600 font-light leading-relaxed mb-3">
                  Central Valley processing plant reaching 94% contamination threshold. Intervention recommended.
                </p>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Current PFAS:</span>
                    <span className="text-amber-600 font-medium">42 ng/L</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Action:</span>
                    <span className="text-zinc-900 font-medium">Source switch</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Time Saved:</span>
                    <span className="text-emerald-600 font-medium">3 days</span>
                  </div>
                </div>
              </div>

              {/* Alert 3 - OPPORTUNITY */}
              <div className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50/50 rounded-r">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">OPPORTUNITY</div>
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="text-sm font-medium text-zinc-900 mb-2">
                  Alternative Water Source Available
                </h4>
                <p className="text-xs text-zinc-600 font-light leading-relaxed mb-3">
                  New treatment facility in Oregon Valley coming online Q2 2025. Zero PFAS detection.
                </p>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">PFAS Reduction:</span>
                    <span className="text-emerald-600 font-medium">100%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Capacity:</span>
                    <span className="text-zinc-900 font-medium">25M gal/day</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Annual Savings:</span>
                    <span className="text-blue-600 font-medium">$45M</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Network Stats */}
          <Card className="p-6 bg-gradient-to-br from-zinc-50 to-white">
            <h4 className="text-base font-light text-zinc-900 mb-4">Network Summary</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600">Active Supply Routes</span>
                <span className="text-zinc-900 font-medium">47 pathways</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600">Distribution Hubs</span>
                <span className="text-zinc-900 font-medium">23 facilities</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600">Weekly Food Volume</span>
                <span className="text-zinc-900 font-medium">140K tons</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600">Coverage Rate</span>
                <span className="text-emerald-600 font-medium">100%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600">Avg PFAS Detected</span>
                <span className="text-amber-600 font-medium">38 ng/L</span>
              </div>
            </div>
          </Card>

          {/* System Status */}
          <Card className="p-6 bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
            <div className="flex items-start gap-3">
              <Activity className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1 animate-pulse" />
              <div>
                <div className="text-sm font-medium text-emerald-900 mb-1">Live Monitoring Active</div>
                <p className="text-xs text-emerald-800 font-light leading-relaxed">
                  Real-time PFAS tracking across all major food supply routes. Contamination alerts delivered within 15 minutes of detection.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
