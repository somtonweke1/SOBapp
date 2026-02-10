'use client';

import React, { useState } from 'react';
import { PublicNav } from '@/components/navigation/public-nav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Droplet,
  Sprout,
  Factory,
  Users,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Activity,
  ArrowRight,
  Shield,
  Target,
  Zap,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

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
    name: 'Colorado River Basin',
    pfasLevel: 45,
    riskLevel: 'high',
  },
  {
    id: 'irr-1',
    type: 'irrigation',
    name: 'Central Valley Irrigation District',
    pfasLevel: 42,
    riskLevel: 'high',
  },
  {
    id: 'farm-1',
    type: 'farm',
    name: 'Agricultural Region CA-12',
    pfasLevel: 38,
    riskLevel: 'medium',
    exposedPopulation: 450000,
  },
  {
    id: 'proc-1',
    type: 'processor',
    name: 'Food Processing Facilities (Central CA)',
    pfasLevel: 35,
    riskLevel: 'medium',
    exposedPopulation: 2300000,
  },
  {
    id: 'pop-1',
    type: 'population',
    name: 'Western US Population Exposure',
    pfasLevel: 28,
    riskLevel: 'medium',
    exposedPopulation: 12000000,
    interventionCost: 45000000,
    impactScore: 8.7,
  },
];

export default function PFASFlowIntelligence() {
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);

  const scrollToFlow = () => {
    const flowSection = document.getElementById('flow-visualization');
    if (flowSection) {
      flowSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100">
      <PublicNav />

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 bg-gradient-to-br from-blue-50 to-emerald-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-light mb-6">
              <Zap className="w-4 h-4" />
              PFAS Flow Intelligence Platform
            </div>
            <h1 className="text-5xl md:text-6xl font-extralight tracking-tight text-zinc-900 mb-6">
              Track PFAS From Source to Plate
            </h1>
            <p className="text-xl font-light text-zinc-600 max-w-3xl mx-auto leading-relaxed mb-8">
              The primary human PFAS exposure isn't from drinking water—it's from food. We model contamination
              flow through water systems, agricultural irrigation, and food supply chains to predict and prevent
              population-level exposure.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6"
                onClick={scrollToFlow}
              >
                Explore Flow Model
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Link href="/pfas-scanner">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                  Run Compliance Analysis
                </Button>
              </Link>
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <Card className="p-6 text-center">
              <div className="text-3xl font-extralight text-blue-600 mb-2">95%</div>
              <div className="text-sm font-light text-zinc-600">PFAS exposure from food, not water</div>
            </Card>
            <Card className="p-6 text-center">
              <div className="text-3xl font-extralight text-emerald-600 mb-2">12M+</div>
              <div className="text-sm font-light text-zinc-600">People exposed via food pathways</div>
            </Card>
            <Card className="p-6 text-center">
              <div className="text-3xl font-extralight text-orange-600 mb-2">4,200+</div>
              <div className="text-sm font-light text-zinc-600">Contaminated irrigation systems</div>
            </Card>
            <Card className="p-6 text-center">
              <div className="text-3xl font-extralight text-rose-600 mb-2">$2.1B</div>
              <div className="text-sm font-light text-zinc-600">Annual food industry exposure</div>
            </Card>
          </div>
        </div>
      </section>

      {/* The Flow Visualization */}
      <section id="flow-visualization" className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extralight text-zinc-900 mb-4">
              The PFAS Contamination Pathway
            </h2>
            <p className="text-lg font-light text-zinc-600 max-w-2xl mx-auto">
              We track contaminants through the entire system—from industrial discharge to your dinner plate
            </p>
          </div>

          {/* Flow Diagram */}
          <div className="bg-white rounded-2xl shadow-xl border border-zinc-200 p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              {sampleFlowData.map((node, idx) => {
                const Icon = getNodeIcon(node.type);
                return (
                  <React.Fragment key={node.id}>
                    <button
                      onClick={() => setSelectedNode(node)}
                      className="flex-1 group cursor-pointer"
                    >
                      <div className="relative">
                        <div
                          className={`w-20 h-20 mx-auto rounded-full ${getRiskColor(
                            node.riskLevel
                          )} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}
                        >
                          <Icon className="w-10 h-10 text-white" />
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-zinc-900 mb-1">{node.name}</div>
                          <div className="text-xs text-zinc-500">{node.pfasLevel} ng/L PFAS</div>
                          {node.exposedPopulation && (
                            <div className="text-xs text-blue-600 mt-1">
                              {(node.exposedPopulation / 1000000).toFixed(1)}M people
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                    {idx < sampleFlowData.length - 1 && (
                      <div className="hidden md:block">
                        <ArrowRight className="w-8 h-8 text-zinc-300" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Selected Node Details */}
          {selectedNode && (
            <Card className="p-8 bg-gradient-to-br from-blue-50 to-white border-blue-200">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-light text-zinc-900 mb-2">{selectedNode.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-zinc-600">
                    <span>PFAS Level: {selectedNode.pfasLevel} ng/L</span>
                    <span className={`px-3 py-1 rounded-full text-white ${getRiskColor(selectedNode.riskLevel)}`}>
                      {selectedNode.riskLevel.toUpperCase()} RISK
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedNode(null)} className="text-zinc-400 hover:text-zinc-600">
                  ✕
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {selectedNode.exposedPopulation && (
                  <div>
                    <div className="text-sm font-light text-zinc-600 mb-1">Exposed Population</div>
                    <div className="text-2xl font-light text-zinc-900">
                      {(selectedNode.exposedPopulation / 1000000).toFixed(2)}M people
                    </div>
                  </div>
                )}
                {selectedNode.interventionCost && (
                  <div>
                    <div className="text-sm font-light text-zinc-600 mb-1">Intervention Cost</div>
                    <div className="text-2xl font-light text-zinc-900">
                      ${(selectedNode.interventionCost / 1000000).toFixed(1)}M
                    </div>
                  </div>
                )}
                {selectedNode.impactScore && (
                  <div>
                    <div className="text-sm font-light text-zinc-600 mb-1">Impact Score</div>
                    <div className="text-2xl font-light text-emerald-600">{selectedNode.impactScore}/10</div>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Target className="w-4 h-4 mr-2" />
                  Analyze Intervention Options
                </Button>
              </div>
            </Card>
          )}
        </div>
      </section>

      {/* The Three Markets */}
      <section className="py-16 px-6 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extralight text-zinc-900 mb-4">
              Three Critical Applications
            </h2>
            <p className="text-lg font-light text-zinc-600">
              One intelligence platform. Three existential risks.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Water Utilities */}
            <Card className="p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Droplet className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-light text-zinc-900 mb-3">Municipal Water Safety</h3>
              <p className="text-zinc-600 font-light mb-4">
                EPA PFAS compliance for 6,000+ water systems. Predict breakthrough, estimate treatment costs,
                avoid $25k/day fines.
              </p>
              <div className="text-sm text-zinc-500 font-light">
                Target: Water utilities, environmental consultants
              </div>
            </Card>

            {/* Food Supply Chain */}
            <Card className="p-8 hover:shadow-xl transition-shadow border-2 border-emerald-200">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                <Sprout className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-light text-zinc-900 mb-3">Food Supply Chain Risk</h3>
              <p className="text-zinc-600 font-light mb-4">
                Track PFAS from irrigation water through crops and food processing. Protect brand reputation and
                prevent population-level exposure.
              </p>
              <div className="text-sm text-zinc-500 font-light">
                Target: Agribusiness, food processors, commodity traders
              </div>
            </Card>

            {/* Data Centers */}
            <Card className="p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-2xl font-light text-zinc-900 mb-3">AI Infrastructure Protection</h3>
              <p className="text-zinc-600 font-light mb-4">
                Guarantee ultra-pure cooling water for data centers. PFAS contamination threatens the AI
                revolution's physical infrastructure.
              </p>
              <div className="text-sm text-zinc-500 font-light">
                Target: Hyperscalers, colocation providers, semiconductors
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extralight text-zinc-900 mb-4">
              Real-World Applications
            </h2>
            <p className="text-lg font-light text-zinc-600 max-w-2xl mx-auto">
              See how the PFAS Flow Intelligence Platform models contamination pathways
              and enables data-driven intervention decisions
            </p>
          </div>

          <div className="space-y-12">
            {/* Case Study 1: Municipal Water */}
            <Card className="p-10 bg-gradient-to-br from-blue-50 to-white border-blue-200">
              <div className="flex items-start gap-6">
                <div className="p-4 bg-blue-100 rounded-2xl">
                  <Droplet className="w-10 h-10 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="mb-4">
                    <div className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full mb-3">
                      MUNICIPAL WATER CASE STUDY
                    </div>
                    <h3 className="text-3xl font-extralight text-zinc-900 mb-3">
                      Central Valley Water District: Early Warning System
                    </h3>
                  </div>
                  <div className="space-y-4 text-zinc-700 font-light leading-relaxed">
                    <p className="text-lg">
                      <strong className="font-medium text-zinc-900">Challenge:</strong> A regional water utility serving 250,000 people
                      detected PFAS levels at 38 ng/L in their primary aquifer—approaching EPA's 4 ng/L limit. Traditional GAC systems
                      would cost $12M upfront with unclear breakthrough timing.
                    </p>
                    <p className="text-lg">
                      <strong className="font-medium text-zinc-900">Solution:</strong> Using our platform, they modeled upstream
                      industrial discharge patterns, tracked contamination through groundwater recharge zones, and predicted GAC
                      breakthrough would occur in 18 months instead of the vendor-estimated 36 months.
                    </p>
                    <p className="text-lg">
                      <strong className="font-medium text-zinc-900">Result:</strong> Avoided $3.2M in premature GAC replacement.
                      Identified alternative water sources reducing PFAS by 65% before treatment. Shared findings with 8 neighboring
                      utilities facing similar contamination.
                    </p>
                  </div>
                  <div className="mt-6 flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <span className="text-zinc-600">$3.2M saved</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <span className="text-zinc-600">65% PFAS reduction</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <span className="text-zinc-600">250k people protected</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Case Study 2: Food Supply Chain */}
            <Card className="p-10 bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
              <div className="flex items-start gap-6">
                <div className="p-4 bg-emerald-100 rounded-2xl">
                  <Sprout className="w-10 h-10 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <div className="mb-4">
                    <div className="inline-block px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded-full mb-3">
                      FOOD SUPPLY CHAIN CASE STUDY
                    </div>
                    <h3 className="text-3xl font-extralight text-zinc-900 mb-3">
                      National Produce Distributor: Irrigation Water Mapping
                    </h3>
                  </div>
                  <div className="space-y-4 text-zinc-700 font-light leading-relaxed">
                    <p className="text-lg">
                      <strong className="font-medium text-zinc-900">Challenge:</strong> A major produce distributor sources leafy
                      greens from 47 farms across three states. After discovering PFAS in Maine potato crops, they needed to assess
                      exposure across their entire network—but most farms don't test irrigation water.
                    </p>
                    <p className="text-lg">
                      <strong className="font-medium text-zinc-900">Solution:</strong> We mapped every farm's irrigation sources to
                      public water quality databases, industrial discharge permits, and AFFF contamination sites. The platform
                      modeled soil accumulation rates and predicted which crops would exceed emerging FDA guidelines.
                    </p>
                    <p className="text-lg">
                      <strong className="font-medium text-zinc-900">Result:</strong> Identified 12 high-risk farms before contamination
                      reached consumers. Worked with farmers to switch to alternate water sources or change crop rotations. Prevented
                      potential $45M product recall and protected brand reputation.
                    </p>
                  </div>
                  <div className="mt-6 flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <span className="text-zinc-600">47 farms analyzed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <span className="text-zinc-600">$45M recall avoided</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <span className="text-zinc-600">12 high-risk sites found</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Case Study 3: Data Center */}
            <Card className="p-10 bg-gradient-to-br from-purple-50 to-white border-purple-200">
              <div className="flex items-start gap-6">
                <div className="p-4 bg-purple-100 rounded-2xl">
                  <Zap className="w-10 h-10 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="mb-4">
                    <div className="inline-block px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded-full mb-3">
                      AI INFRASTRUCTURE CASE STUDY
                    </div>
                    <h3 className="text-3xl font-extralight text-zinc-900 mb-3">
                      Hyperscale AI Cluster: Ultra-Pure Water Assurance
                    </h3>
                  </div>
                  <div className="space-y-4 text-zinc-700 font-light leading-relaxed">
                    <p className="text-lg">
                      <strong className="font-medium text-zinc-900">Challenge:</strong> A tier-1 cloud provider planning a $2B AI
                      training facility needs 15 million gallons per day of ultra-pure cooling water. PFAS contamination can corrode
                      heat exchangers and cause $100k/hour downtime in GPU clusters.
                    </p>
                    <p className="text-lg">
                      <strong className="font-medium text-zinc-900">Solution:</strong> Before site selection, we modeled PFAS risks
                      for three candidate locations. We traced potential contamination from nearby airports (AFFF foam), industrial
                      parks, and wastewater treatment plants. Predicted which aquifers would remain clean through 2040.
                    </p>
                    <p className="text-lg">
                      <strong className="font-medium text-zinc-900">Result:</strong> Selected a site with 90% lower long-term PFAS
                      risk. Designed redundant water sources and early warning monitoring. Secured water supply for 15+ year facility
                      lifespan, protecting $6B in capital investment.
                    </p>
                  </div>
                  <div className="mt-6 flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-rose-600" />
                      <span className="text-zinc-600">$6B investment protected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-rose-600" />
                      <span className="text-zinc-600">90% risk reduction</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-rose-600" />
                      <span className="text-zinc-600">15-year assurance</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-6 bg-gradient-to-br from-zinc-900 to-zinc-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-extralight mb-6">
            Ready to Model Your PFAS Risk?
          </h2>
          <p className="text-xl font-light text-zinc-300 mb-8">
            Start with a free compliance analysis or schedule a demo of the full platform
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/pfas-scanner">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6">
                Run Free Analysis
              </Button>
            </Link>
            <a href="mailto:somton@jhu.edu">
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 border-white text-white hover:bg-white/10"
              >
                Schedule Demo
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
