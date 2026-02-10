'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PathwayIndicator from '@/components/shared/pathway-indicator';
import AnimatedPFASFlowMap from '@/components/pfas/animated-pfas-flow-map';
import {
  Droplet,
  Sprout,
  Factory,
  Users,
  MapPin,
  Activity,
  ArrowRight,
  Target,
  Map,
  BarChart3
} from 'lucide-react';

type PathwayStep = 'sources' | 'flow' | 'food-supply' | 'model' | 'remediation' | 'monitoring';

interface PFASFlowDashboardProps {
  onPathwayChange?: (step: PathwayStep) => void;
}

// PFAS Flow Node Types
interface FlowNode {
  id: string;
  type: 'water_source' | 'irrigation' | 'farm' | 'processor' | 'population';
  name: string;
  pfasLevel: number; // ng/L
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  exposedPopulation?: number;
  interventionCost?: number;
  impactScore?: number;
}

// Sample flow data (would come from backend)
const sampleFlowData: FlowNode[] = [
  {
    id: 'ws-1',
    type: 'water_source',
    name: 'Colorado River',
    pfasLevel: 45,
    riskLevel: 'high',
  },
  {
    id: 'irr-1',
    type: 'irrigation',
    name: 'Central Valley Irrigation',
    pfasLevel: 42,
    riskLevel: 'high',
  },
  {
    id: 'farm-1',
    type: 'farm',
    name: 'Agricultural Region',
    pfasLevel: 38,
    riskLevel: 'medium',
    exposedPopulation: 450000,
  },
  {
    id: 'proc-1',
    type: 'processor',
    name: 'Food Processing',
    pfasLevel: 35,
    riskLevel: 'medium',
    exposedPopulation: 2300000,
  },
  {
    id: 'pop-1',
    type: 'population',
    name: 'Population Exposure',
    pfasLevel: 28,
    riskLevel: 'medium',
    exposedPopulation: 12000000,
    interventionCost: 45000000,
    impactScore: 8.7,
  },
];

export default function PFASFlowDashboard({ onPathwayChange }: PFASFlowDashboardProps) {
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [viewMode, setViewMode] = useState<'diagram' | 'animated'>('diagram');

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-emerald-500';
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'water_source':
        return Droplet;
      case 'irrigation':
        return Sprout;
      case 'farm':
        return MapPin;
      case 'processor':
        return Factory;
      case 'population':
        return Users;
      default:
        return Activity;
    }
  };

  return (
    <div className="space-y-6">
      {/* Pathway Position */}
      <PathwayIndicator currentStep="flow" onStepChange={onPathwayChange} />

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="text-sm text-zinc-500 font-light mb-1">Food Exposure Rate</div>
          <div className="text-3xl font-extralight text-zinc-900">95%</div>
          <div className="text-xs text-blue-600 mt-2">PFAS exposure from food, not water</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-zinc-500 font-light mb-1">Exposed Population</div>
          <div className="text-3xl font-extralight text-zinc-900">12M+</div>
          <div className="text-xs text-zinc-500 mt-2">People exposed via food pathways</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-zinc-500 font-light mb-1">Contaminated Systems</div>
          <div className="text-3xl font-extralight text-amber-600">4,200+</div>
          <div className="text-xs text-zinc-500 mt-2">Irrigation systems affected</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-zinc-500 font-light mb-1">Industry Exposure</div>
          <div className="text-3xl font-extralight text-zinc-900">$2.1B</div>
          <div className="text-xs text-zinc-500 mt-2">Annual food industry exposure</div>
        </Card>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: Flow Pathway Visualization */}
        <Card className="md:col-span-2 p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-light text-zinc-900 mb-1">PFAS Contamination Pathway</h3>
              <p className="text-sm text-zinc-500 font-light">
              Track contaminants from industrial discharge to food supply—95% of human PFAS exposure comes from food, not drinking water
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'diagram' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('diagram')}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Diagram
              </Button>
              <Button
                variant={viewMode === 'animated' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('animated')}
              >
                <Map className="w-4 h-4 mr-2" />
                Animated Map
              </Button>
            </div>
          </div>
        </div>

        {viewMode === 'animated' ? (
          <AnimatedPFASFlowMap />
        ) : (
          <>

        {/* Flow Diagram */}
        <div className="bg-gradient-to-br from-zinc-50 to-white rounded-xl border border-zinc-200 p-4 md:p-6 mb-6 overflow-x-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">
            {sampleFlowData.map((node, idx) => {
              const Icon = getNodeIcon(node.type);
              return (
                <React.Fragment key={node.id}>
                  <button
                    onClick={() => setSelectedNode(node)}
                    className="group cursor-pointer w-full md:flex-1"
                  >
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`w-14 h-14 md:w-16 md:h-16 rounded-full ${getRiskColor(
                          node.riskLevel
                        )} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-lg`}
                      >
                        <Icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                      </div>
                      <div className="text-center w-[110px] md:w-[120px]">
                        <div className="text-[10px] md:text-xs font-medium text-zinc-900 mb-1 break-words leading-tight min-h-[2rem] md:min-h-[2.5rem] flex items-center justify-center px-1">{node.name}</div>
                        <div className="text-[10px] md:text-xs text-zinc-500 whitespace-nowrap">{node.pfasLevel} ng/L</div>
                        {node.exposedPopulation && (
                          <div className="text-[10px] md:text-xs text-blue-600 mt-0.5 whitespace-nowrap">
                            {(node.exposedPopulation / 1000000).toFixed(1)}M people
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                  {idx < sampleFlowData.length - 1 && (
                    <div className="hidden md:block">
                      <ArrowRight className="w-6 h-6 text-zinc-300" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Selected Node Details */}
        {selectedNode && (
          <div className="p-6 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-light text-zinc-900 mb-1">{selectedNode.name}</h4>
                <div className="flex items-center gap-3 text-sm text-zinc-600">
                  <span>PFAS: {selectedNode.pfasLevel} ng/L</span>
                  <span className={`px-2 py-1 rounded-full text-xs text-white ${getRiskColor(selectedNode.riskLevel)}`}>
                    {selectedNode.riskLevel.toUpperCase()}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-zinc-400 hover:text-zinc-600 text-xl">
                ✕
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {selectedNode.exposedPopulation && (
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Exposed Population</div>
                  <div className="text-xl font-light text-zinc-900">
                    {(selectedNode.exposedPopulation / 1000000).toFixed(2)}M
                  </div>
                </div>
              )}
              {selectedNode.interventionCost && (
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Intervention Cost</div>
                  <div className="text-xl font-light text-zinc-900">
                    ${(selectedNode.interventionCost / 1000000).toFixed(1)}M
                  </div>
                </div>
              )}
              {selectedNode.impactScore && (
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Impact Score</div>
                  <div className="text-xl font-light text-emerald-600">{selectedNode.impactScore}/10</div>
                </div>
              )}
            </div>

            <div className="mt-4">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Target className="w-4 h-4 mr-2" />
                Analyze Intervention Options
              </Button>
            </div>
          </div>
        )}

          <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
            <div>5 Contamination Pathway Stages Identified</div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span>Live Monitoring Active</span>
            </div>
          </div>
          </>
        )}
        </Card>

        {/* Right: Intelligence Panels */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-4">
              <div className="text-xs text-blue-600 font-medium mb-2">LIVE ANALYSIS</div>
              <h3 className="text-lg font-light text-zinc-900 mb-1">Pathway Intelligence</h3>
              <p className="text-xs text-zinc-500 font-light">AI-powered contamination flow analysis</p>
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
              <div className="text-xs text-rose-600 font-medium mb-2">CRITICAL PATHWAY</div>
              <h4 className="text-base font-light text-zinc-900 mb-2">Water Source to Population</h4>
              <p className="text-xs text-zinc-600 font-light leading-relaxed">
                Analysis reveals 95% of PFAS exposure occurs through food pathways, not direct water consumption. Irrigation systems are the primary contamination vector.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <div className="text-xs text-zinc-500 mb-1">Pathway Stages</div>
                <div className="text-lg font-light text-zinc-900">5</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">Avg PFAS Level</div>
                <div className="text-lg font-light text-zinc-900">37 ng/L</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">Exposed People</div>
                <div className="text-lg font-light text-zinc-900">12M+</div>
              </div>
          <div>
                <div className="text-xs text-zinc-500 mb-1">Intervention Cost</div>
                <div className="text-lg font-light text-zinc-900">$45M</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="py-2 bg-emerald-50 rounded">
                <div className="text-emerald-600 font-medium">+5%</div>
                <div className="text-zinc-500">Detection Rate</div>
              </div>
              <div className="py-2 bg-rose-50 rounded">
                <div className="text-rose-600 font-medium">+18%</div>
                <div className="text-zinc-500">Exposure Increase</div>
              </div>
              <div className="py-2 bg-blue-50 rounded">
                <div className="text-blue-600 font-medium">-12%</div>
                <div className="text-zinc-500">Treatment Costs</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-4">
              <div className="text-xs text-emerald-600 font-medium mb-2">PATHWAY BREAKDOWN</div>
              <h4 className="text-base font-light text-zinc-900 mb-2">Contamination Flow Stages</h4>
              <p className="text-xs text-zinc-600 font-light leading-relaxed">
                PFAS flows from industrial sources through water systems, irrigation, farms, processing, and finally to population exposure.
              </p>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-500">Water Sources</span>
                  <span className="text-zinc-900 font-medium">45 ng/L avg</span>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500" style={{ width: '90%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-500">Irrigation Systems</span>
                  <span className="text-zinc-900 font-medium">42 ng/L avg</span>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500" style={{ width: '84%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-500">Agricultural Farms</span>
                  <span className="text-zinc-900 font-medium">38 ng/L avg</span>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: '76%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-500">Food Processing</span>
                  <span className="text-zinc-900 font-medium">35 ng/L avg</span>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: '70%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-500">Population Exposure</span>
                  <span className="text-zinc-900 font-medium">28 ng/L avg</span>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: '56%' }}></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="py-2 bg-zinc-50 rounded">
                <div className="text-zinc-900 font-medium">5 Stages</div>
                <div className="text-zinc-500 text-[10px]">Pathway Flow</div>
              </div>
              <div className="py-2 bg-zinc-50 rounded">
                <div className="text-zinc-900 font-medium">Active</div>
                <div className="text-zinc-500 text-[10px]">Real-time Tracking</div>
              </div>
              <div className="py-2 bg-zinc-50 rounded">
                <div className="text-zinc-900 font-medium">95%</div>
                <div className="text-zinc-500 text-[10px]">Food Exposure</div>
          </div>
        </div>
      </Card>
        </div>
      </div>
    </div>
  );
}
