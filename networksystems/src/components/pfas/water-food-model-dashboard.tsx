'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, CheckCircle, Droplet } from 'lucide-react';
import PathwayIndicator from '@/components/shared/pathway-indicator';

type PathwayStep = 'sources' | 'flow' | 'food-supply' | 'model' | 'remediation' | 'monitoring';

interface WaterFoodModelDashboardProps {
  onPathwayChange?: (step: PathwayStep) => void;
}

export default function WaterFoodModelDashboard({ onPathwayChange }: WaterFoodModelDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Pathway Position */}
      <PathwayIndicator currentStep="model" onStepChange={onPathwayChange} />

      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-emerald-50">
        <h2 className="text-2xl font-light text-zinc-900 mb-2">Water-to-Food PFAS Flow Model</h2>
        <p className="text-sm text-zinc-600 font-light">
          Strategic contamination pathway intelligence and intervention optimization
        </p>
      </Card>

      {/* Value Proposition */}
      <Card className="p-8">
        <h3 className="text-xl font-light text-zinc-900 mb-4">Value of Intervention Intelligence</h3>
        <p className="text-sm text-zinc-600 font-light leading-relaxed mb-6">
          Sensitivity analysis reveals which intervention points in the water-to-food pathway drive the most contamination reduction.
          Understanding parameter impacts enables optimal capital allocation and prevents over-investment in low-impact interventions.
        </p>

        <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-6">
          <h4 className="text-lg font-medium text-zinc-900 mb-3">PFAS Intervention Decision</h4>
          <p className="text-sm text-zinc-700 font-light mb-4">
            Where to deploy remediation: Water treatment plants, irrigation system controls, agricultural practices, or food processing facilities?
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-xs">
            <div>
              <div className="text-zinc-500 mb-1">Capital Budget</div>
              <div className="text-lg font-medium text-zinc-900">$450M</div>
            </div>
            <div>
              <div className="text-zinc-500 mb-1">Deployment Horizon</div>
              <div className="text-lg font-medium text-zinc-900">36 months</div>
            </div>
            <div>
              <div className="text-zinc-500 mb-1">Opportunity Cost</div>
              <div className="text-lg font-medium text-zinc-900">12% WACC</div>
            </div>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Without Analysis */}
          <div className="border-2 border-rose-200 rounded-lg p-6 bg-rose-50/50">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
              <h4 className="text-lg font-medium text-rose-900">Without Sensitivity Analysis</h4>
            </div>
            <div className="text-4xl font-light text-rose-600 mb-2">-$187M</div>
            <p className="text-sm text-rose-800 font-light mb-4">
              Expected loss from misallocated capital, over-investment in non-critical intervention points
            </p>
            <ul className="space-y-2 text-xs text-rose-700">
              <li className="flex items-start gap-2">
                <span className="text-rose-600">•</span>
                <span>Blind optimization: All pathways treated equally</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-600">•</span>
                <span>$280M invested in low-impact food processing controls</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-600">•</span>
                <span>True contamination sources remain unaddressed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-600">•</span>
                <span>18-month delay before realizing misallocation</span>
              </li>
            </ul>
          </div>

          {/* With Analysis */}
          <div className="border-2 border-emerald-200 rounded-lg p-6 bg-emerald-50/50">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <h4 className="text-lg font-medium text-emerald-900">With Parameter Sensitivity Intelligence</h4>
            </div>
            <div className="text-4xl font-light text-emerald-600 mb-2">+$156M</div>
            <p className="text-sm text-emerald-800 font-light mb-4">
              Expected value from targeted intervention, focused capital allocation at highest-impact points
            </p>
            <ul className="space-y-2 text-xs text-emerald-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600">•</span>
                <span>Identify critical points: Water treatment (92% shadow price impact)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600">•</span>
                <span>Deprioritize low-impact: Food processing controls (3% impact)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600">•</span>
                <span>Optimize $450M budget allocation across 7 intervention types</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600">•</span>
                <span>Reduce deployment timeline by 40% through targeted intervention</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ROI Metrics */}
        <div className="grid md:grid-cols-3 gap-4 p-6 bg-zinc-50 rounded-lg">
          <div>
            <div className="text-xs text-zinc-500 mb-1">EVPI (This Analysis)</div>
            <div className="text-3xl font-light text-blue-600 mb-1">$343M</div>
            <p className="text-xs text-zinc-600">
              Maximum value of pathway certainty<br/>
              = EMV(Perfect Sensitivity) - EMV(No Analysis)
            </p>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">Optimization Cost</div>
            <div className="text-3xl font-light text-zinc-900 mb-1">$285K</div>
            <p className="text-xs text-zinc-600">
              Water-to-Food modeling + sensitivity runs<br/>
              One-time analysis + quarterly updates
            </p>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">Net Benefit</div>
            <div className="text-3xl font-light text-emerald-600 mb-1">$342.7M</div>
            <p className="text-xs text-zinc-600">
              1,203x ROI on intelligence<br/>
              Per $1B intervention decision
            </p>
          </div>
        </div>
      </Card>

      {/* Sensitivity Insights */}
      <Card className="p-8">
        <h3 className="text-xl font-light text-zinc-900 mb-6">Key Sensitivity Insights from This Analysis</h3>

        <div className="space-y-6">
          {/* Highest Impact */}
          <div className="border-l-4 border-rose-500 pl-6 py-3 bg-rose-50/50">
            <div className="text-xs font-medium text-rose-600 mb-2">HIGHEST IMPACT PARAMETER</div>
            <h4 className="text-2xl font-light text-zinc-900 mb-3">Water Treatment at Source</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <span className="text-zinc-600">Shadow price:</span>
                <span className="text-rose-600 font-medium ml-2">$8.2M per unit capacity</span>
              </div>
              <div>
                <span className="text-zinc-600">Constraint value:</span>
                <span className="text-rose-600 font-medium ml-2">92% of total impact</span>
              </div>
            </div>
            <p className="text-xs text-zinc-600 font-light leading-relaxed">
              Treating PFAS at the water source (before irrigation) has 92% of total contamination reduction impact.
              Every additional unit of water treatment capacity delivers $8.2M in contamination prevention value.
              This is the critical intervention point - addressing source water prevents downstream accumulation.
            </p>
          </div>

          {/* Medium Impact */}
          <div className="border-l-4 border-amber-500 pl-6 py-3 bg-amber-50/50">
            <div className="text-xs font-medium text-amber-600 mb-2">MEDIUM IMPACT</div>
            <h4 className="text-2xl font-light text-zinc-900 mb-3">Irrigation System Upgrades</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <span className="text-zinc-600">Shadow price:</span>
                <span className="text-amber-600 font-medium ml-2">$1.4M per week reduction</span>
              </div>
              <div>
                <span className="text-zinc-600">Constraint value:</span>
                <span className="text-amber-600 font-medium ml-2">12% of total impact</span>
              </div>
            </div>
            <p className="text-xs text-zinc-600 font-light leading-relaxed">
              Upgrading irrigation systems to use treated water or alternative sources provides moderate contamination reduction.
              Each week of faster deployment delivers $1.4M in value, representing 12% of total pathway impact.
            </p>
          </div>

          {/* Low Impact */}
          <div className="border-l-4 border-zinc-300 pl-6 py-3 bg-zinc-50">
            <div className="text-xs font-medium text-zinc-500 mb-2">LOW IMPACT (DEPRIORITIZE)</div>
            <h4 className="text-2xl font-light text-zinc-900 mb-3">Food Processing Controls</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <span className="text-zinc-600">Shadow price:</span>
                <span className="text-zinc-600 font-medium ml-2">$0.3M per facility</span>
              </div>
              <div>
                <span className="text-zinc-600">Constraint value:</span>
                <span className="text-zinc-600 font-medium ml-2">3% of total impact</span>
              </div>
            </div>
            <p className="text-xs text-zinc-600 font-light leading-relaxed">
              Food processing controls have minimal impact because contamination is already concentrated in raw materials.
              Only 3% of pathway impact - capital should be allocated upstream at source water treatment instead.
            </p>
          </div>
        </div>
      </Card>

      {/* Modeling Quality */}
      <Card className="p-8 bg-gradient-to-br from-blue-50 to-white border-blue-200">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-light text-zinc-900 mb-2">Optimization Modeling Quality: Water-to-Food GEP</h3>
            <p className="text-sm text-zinc-600 font-light leading-relaxed">
              Our water-to-food contamination model uses <strong>General Equilibrium Programming (GEP)</strong> with dual-variable
              sensitivity analysis to compute exact shadow prices for all intervention points in the PFAS pathway. This reveals precise
              marginal values for remediation investments, enabling optimal capital allocation. Traditional analysis without sensitivity
              modeling leaves <strong>$150-400M in value on the table</strong> through misallocated infrastructure investments.
            </p>
          </div>
        </div>
      </Card>

      {/* Network Visualization */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 p-6">
          <h3 className="text-xl font-light text-zinc-900 mb-6">PFAS Contamination Network</h3>

          <div className="relative h-[400px] bg-gradient-to-br from-zinc-50 to-white rounded-xl border border-zinc-200 p-6">
            {/* Network visualization showing water → irrigation → farm → processing → consumer flow */}
            <div className="absolute top-[10%] left-[10%]">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-light shadow-lg mb-2">
                  <Droplet className="w-10 h-10" />
                </div>
                <div className="text-xs font-medium text-zinc-900">Water Source</div>
                <div className="text-[10px] text-rose-600 mt-1">92% impact</div>
              </div>
            </div>

            <div className="absolute top-[10%] left-[35%]">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-500 flex items-center justify-center text-white font-light shadow-lg mb-2">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <div className="text-xs font-medium text-zinc-900">Irrigation</div>
                <div className="text-[10px] text-amber-600 mt-1">12% impact</div>
              </div>
            </div>

            <div className="absolute top-[10%] right-[35%]">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center text-white font-light shadow-lg mb-2">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div className="text-xs font-medium text-zinc-900">Farm</div>
                <div className="text-[10px] text-zinc-500 mt-1">6% impact</div>
              </div>
            </div>

            <div className="absolute top-[10%] right-[10%]">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-400 flex items-center justify-center text-white font-light shadow-lg mb-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="text-xs font-medium text-zinc-900">Processing</div>
                <div className="text-[10px] text-zinc-500 mt-1">3% impact</div>
              </div>
            </div>

            <div className="absolute bottom-[20%] left-[50%] -translate-x-1/2">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center text-white font-light shadow-lg mb-2">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="text-xs font-medium text-zinc-900">Population</div>
                <div className="text-[10px] text-zinc-600 mt-1">Exposure endpoint</div>
              </div>
            </div>

            {/* Flow arrows */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
                </marker>
              </defs>
              <line x1="20%" y1="15%" x2="32%" y2="15%" stroke="#3b82f6" strokeWidth="3" markerEnd="url(#arrowhead)" />
              <line x1="44%" y1="15%" x2="56%" y2="15%" stroke="#3b82f6" strokeWidth="2.5" markerEnd="url(#arrowhead)" />
              <line x1="66%" y1="15%" x2="78%" y2="15%" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrowhead)" />
              <line x1="50%" y1="20%" x2="50%" y2="50%" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrowhead)" />
            </svg>

            <div className="absolute bottom-4 right-4 text-xs text-zinc-500 bg-white/80 px-3 py-2 rounded-lg">
              100% pathway coverage
            </div>
          </div>

          <div className="mt-4 text-xs text-zinc-500">
            Arrow thickness represents contamination concentration at each stage
          </div>
        </Card>

        {/* Bottleneck Analysis */}
        <Card className="p-6">
          <h3 className="text-lg font-light text-zinc-900 mb-4">Bottleneck Analysis</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-700">Water Treatment</span>
                <span className="text-xs font-medium text-rose-600">92.0%</span>
              </div>
              <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500" style={{ width: '92%' }}></div>
              </div>
              <div className="text-xs text-rose-600 mt-1">Critical constraint</div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-700">Irrigation Systems</span>
                <span className="text-xs font-medium text-amber-600">12.0%</span>
              </div>
              <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: '12%' }}></div>
              </div>
              <div className="text-xs text-zinc-500 mt-1">Minor constraint</div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-700">Agricultural Practices</span>
                <span className="text-xs font-medium text-zinc-500">6.0%</span>
              </div>
              <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
                <div className="h-full bg-zinc-400" style={{ width: '6%' }}></div>
              </div>
              <div className="text-xs text-zinc-500 mt-1">Low impact</div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-700">Food Processing</span>
                <span className="text-xs font-medium text-zinc-400">3.0%</span>
              </div>
              <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
                <div className="h-full bg-zinc-300" style={{ width: '3%' }}></div>
              </div>
              <div className="text-xs text-zinc-500 mt-1">Deprioritize</div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="text-xs font-medium text-blue-900 mb-2">Optimization Recommendation</div>
            <p className="text-xs text-blue-800 font-light leading-relaxed">
              Allocate 90%+ of capital to water treatment capacity. This addresses the binding constraint with 92% impact value.
            </p>
          </div>
        </Card>
      </div>

      {/* Status Indicator */}
      <Card className="p-6 bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
            <div>
              <div className="text-sm font-medium text-emerald-900">Model Status: Operational</div>
              <div className="text-xs text-emerald-700">Real-time sensitivity analysis active</div>
            </div>
          </div>
          <div className="text-xs text-emerald-700">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </Card>
    </div>
  );
}
