'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Zap,
  Clock,
  Target,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Network,
  BarChart3,
  Flame,
  Wind,
  Activity,
  Sliders,
  Download,
  Mail,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

interface MitigationAction {
  id: string;
  name: string;
  description: string;
  type: string;
  cost: number;
  timeToImplement: number;
  effectiveness: number;
  npvImpact: number;
  riskReduction: number;
  feasibility: number;
  prerequisites?: string[];
}

interface Constraint {
  id: string;
  name: string;
  description: string;
  type: string;
  severity: string;
  impact: {
    financial: {
      expected: number;
      min: number;
      max: number;
    };
    operational: {
      delay?: number;
      throughputReduction?: number;
      productionLoss?: number;
    };
    risk: {
      probability: number;
      consequence: number;
      riskScore: number;
    };
  };
  dependencies: string[];
  downstreamImpacts: string[];
}

interface DemoData {
  scenario: {
    id: string;
    name: string;
    description: string;
    probability: number;
    aggregatedImpact: {
      financial: { expected: number; min: number; max: number };
      risk: { riskScore: number };
    };
    optimalMitigationPlan: {
      actions: MitigationAction[];
      totalCost: number;
      expectedBenefit: number;
      roi: number;
      implementationSequence: string[];
    };
  };
  constraints: Constraint[];
  mitigationOptions: MitigationAction[];
  financialImpact: {
    baseCase: number;
    withMitigation: number;
    savings: number;
    roi: number;
  };
}

export default function ConstellationDemoLivePage() {
  const [demoData, setDemoData] = useState<DemoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMitigations, setSelectedMitigations] = useState<string[]>([]);
  const [calculatedImpact, setCalculatedImpact] = useState<{
    totalCost: number;
    totalBenefit: number;
    netSavings: number;
    roi: number;
  } | null>(null);

  // Scenario parameters (adjustable by user)
  const [lngExportIncrease, setLngExportIncrease] = useState(50); // 30-70%
  const [pipelineImpact, setPipelineImpact] = useState(35); // 20-50%
  const [duration, setDuration] = useState(10); // 5-15 days
  const [adjustedFinancialImpact, setAdjustedFinancialImpact] = useState<number | null>(null);

  useEffect(() => {
    fetchDemoData();
  }, []);

  useEffect(() => {
    if (demoData && selectedMitigations.length > 0) {
      calculateCustomImpact();
    } else if (demoData) {
      setCalculatedImpact({
        totalCost: demoData.financialImpact.withMitigation,
        totalBenefit: demoData.financialImpact.savings,
        netSavings: demoData.financialImpact.savings,
        roi: demoData.financialImpact.roi
      });
    }
  }, [selectedMitigations, demoData]);

  // Recalculate financial impact when parameters change
  useEffect(() => {
    if (demoData) {
      recalculateScenario();
    }
  }, [lngExportIncrease, pipelineImpact, duration, demoData]);

  const fetchDemoData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/demos/constellation');
      const data = await response.json();
      setDemoData(data);

      // Pre-select optimal mitigations
      if (data.scenario.optimalMitigationPlan) {
        setSelectedMitigations(data.scenario.optimalMitigationPlan.implementationSequence);
      }
    } catch (error) {
      console.error('Failed to load demo data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCustomImpact = () => {
    if (!demoData) return;

    const selectedActions = demoData.mitigationOptions.filter(m =>
      selectedMitigations.includes(m.id)
    );

    const totalCost = selectedActions.reduce((sum, action) => sum + action.cost, 0);
    const totalBenefit = selectedActions.reduce((sum, action) => sum + action.npvImpact, 0);
    const netSavings = totalBenefit - totalCost;
    const roi = totalCost > 0 ? totalBenefit / totalCost : 0;

    setCalculatedImpact({
      totalCost,
      totalBenefit,
      netSavings,
      roi
    });
  };

  const recalculateScenario = () => {
    if (!demoData) return;

    // Base values from original scenario (50% LNG increase, 35% pipeline impact, 10 days)
    const baseExpected = 10750000; // $10.75M

    // Calculate multipliers based on parameter changes
    const lngMultiplier = lngExportIncrease / 50; // Relative to base 50%
    const pipelineMultiplier = pipelineImpact / 35; // Relative to base 35%
    const durationMultiplier = duration / 10; // Relative to base 10 days

    // Combined impact: more LNG export + more pipeline constraint + longer duration = higher impact
    const totalMultiplier = (lngMultiplier * 0.4 + pipelineMultiplier * 0.4 + durationMultiplier * 0.2);
    const newImpact = baseExpected * totalMultiplier;

    setAdjustedFinancialImpact(newImpact);
  };

  const toggleMitigation = (id: string) => {
    setSelectedMitigations(prev =>
      prev.includes(id)
        ? prev.filter(m => m !== id)
        : [...prev, id]
    );
  };

  if (isLoading || !demoData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-zinc-600">Loading constraint engine demo...</p>
        </div>
      </div>
    );
  }

  const primaryConstraint = demoData.constraints[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-blue-100 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full mb-3 text-sm">
                <Zap className="w-4 h-4" />
                <span>Live Constraint Intelligence Demo</span>
              </div>
              <h1 className="text-4xl font-bold mb-2">{demoData.scenario.name}</h1>
              <p className="text-xl text-blue-100 max-w-2xl">{demoData.scenario.description}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-center">
                <div className="text-3xl font-bold">{(demoData.scenario.probability * 100).toFixed(0)}%</div>
                <div className="text-sm text-blue-200 mt-1">Probability</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Risk Overview */}
      <section className="py-8 bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="p-6 bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-8 h-8 text-rose-700" />
                <span className="text-xs font-bold text-rose-700 bg-rose-200 px-2 py-1 rounded">
                  {primaryConstraint.severity.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-rose-700 font-medium mb-1">Expected Loss (No Action)</p>
              <p className="text-3xl font-bold text-rose-900">
                ${(demoData.scenario.aggregatedImpact.financial.expected / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-rose-600 mt-2">
                Risk Range: ${(demoData.scenario.aggregatedImpact.financial.min / 1000000).toFixed(1)}M - ${(demoData.scenario.aggregatedImpact.financial.max / 1000000).toFixed(1)}M
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-emerald-700" />
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-sm text-emerald-700 font-medium mb-1">Net Savings (Optimal Plan)</p>
              <p className="text-3xl font-bold text-emerald-900">
                ${(calculatedImpact?.netSavings || 0 / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-emerald-600 mt-2">
                After mitigation costs
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-8 h-8 text-blue-700" />
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm text-blue-700 font-medium mb-1">ROI on Mitigation</p>
              <p className="text-3xl font-bold text-blue-900">
                {(calculatedImpact?.roi || 0).toFixed(1)}:1
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Investment to benefit ratio
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 text-blue-700" />
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm text-blue-700 font-medium mb-1">Time to Implement</p>
              <p className="text-3xl font-bold text-zinc-900">
                {Math.max(...demoData.mitigationOptions.filter(m => selectedMitigations.includes(m.id)).map(m => m.timeToImplement))}h
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Critical path timeline
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Interactive Scenario Parameters */}
      <section className="py-12 bg-gradient-to-br from-emerald-50 to-emerald-100 border-y border-emerald-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <Sliders className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-zinc-900">Interactive "What-If" Scenario Modeling</h2>
              <p className="text-sm text-zinc-600 mt-1">Adjust parameters to see real-time impact on constraint severity and financial exposure</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-blue-200 shadow-xl p-8">
            <div className="grid md:grid-cols-3 gap-8">
              {/* LNG Export Increase Slider */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-zinc-900">LNG Export Surge</label>
                  <span className="text-2xl font-bold text-blue-600">{lngExportIncrease}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="70"
                  value={lngExportIncrease}
                  onChange={(e) => setLngExportIncrease(Number(e.target.value))}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-zinc-500 mt-2">
                  <span>30% (Mild)</span>
                  <span>70% (Severe)</span>
                </div>
                <p className="text-xs text-zinc-600 mt-3">
                  European demand spike drives LNG export increase from Gulf Coast terminals
                </p>
              </div>

              {/* Pipeline Capacity Impact Slider */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-zinc-900">Pipeline Capacity Reduction</label>
                  <span className="text-2xl font-bold text-blue-600">{pipelineImpact}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="50"
                  value={pipelineImpact}
                  onChange={(e) => setPipelineImpact(Number(e.target.value))}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-zinc-500 mt-2">
                  <span>20% (Moderate)</span>
                  <span>50% (Critical)</span>
                </div>
                <p className="text-xs text-zinc-600 mt-3">
                  Available pipeline capacity to mid-Atlantic gas plants after LNG diversion
                </p>
              </div>

              {/* Duration Slider */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-zinc-900">Constraint Duration</label>
                  <span className="text-2xl font-bold text-blue-600">{duration} days</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="15"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-zinc-500 mt-2">
                  <span>5 days</span>
                  <span>15 days</span>
                </div>
                <p className="text-xs text-zinc-600 mt-3">
                  Expected duration of pipeline capacity shortage based on weather forecasts
                </p>
              </div>
            </div>

            {/* Real-time Impact Display */}
            <div className="mt-8 pt-8 border-t border-blue-200">
              <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-6 border border-rose-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-rose-900 mb-1">Recalculated Financial Impact</div>
                    <p className="text-xs text-rose-700">
                      Based on your parameter adjustments ({lngExportIncrease !== 50 || pipelineImpact !== 35 || duration !== 10 ? 'Modified from base scenario' : 'Base scenario'})
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-rose-700">
                      ${((adjustedFinancialImpact || demoData?.scenario.aggregatedImpact.financial.expected || 0) / 1000000).toFixed(2)}M
                    </div>
                    {(lngExportIncrease !== 50 || pipelineImpact !== 35 || duration !== 10) && (
                      <div className="text-sm text-rose-600 mt-1">
                        {((adjustedFinancialImpact || 0) > (demoData?.scenario.aggregatedImpact.financial.expected || 0)) ? '↑' : '↓'}
                        {(Math.abs(((adjustedFinancialImpact || 0) - (demoData?.scenario.aggregatedImpact.financial.expected || 0)) / (demoData?.scenario.aggregatedImpact.financial.expected || 1) * 100)).toFixed(1)}% vs base
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm text-zinc-600">
                <Activity className="w-4 h-4 text-blue-600" />
                <span>Impact recalculates in real-time as you adjust parameters • This demonstrates MIAR's constraint modeling engine</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Constraint Cascade Visualization */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <Network className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-zinc-900">Constraint Cascade Analysis</h2>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl p-8">
          <div className="space-y-6">
            {demoData.constraints.map((constraint, index) => (
              <div key={constraint.id} className="relative">
                {index > 0 && (
                  <div className="absolute left-8 -top-3 w-0.5 h-6 bg-rose-300" />
                )}

                <div className={`border-l-4 p-6 rounded-lg ${
                  constraint.severity === 'critical' ? 'border-rose-500 bg-rose-50' :
                  constraint.severity === 'major' ? 'border-amber-500 bg-amber-50' :
                  'border-blue-500 bg-blue-50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          constraint.severity === 'critical' ? 'bg-rose-200 text-rose-800' :
                          constraint.severity === 'major' ? 'bg-amber-200 text-amber-800' :
                          'bg-blue-200 text-blue-800'
                        }`}>
                          {constraint.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-zinc-500">{constraint.type}</span>
                      </div>
                      <h3 className="text-lg font-bold text-zinc-900 mb-2">{constraint.name}</h3>
                      <p className="text-sm text-zinc-700 mb-3">{constraint.description}</p>

                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="bg-white/60 rounded p-3">
                          <div className="text-xs text-zinc-600 mb-1">Financial Impact</div>
                          <div className="text-lg font-bold text-rose-700">
                            ${(constraint.impact.financial.expected / 1000000).toFixed(1)}M
                          </div>
                        </div>
                        <div className="bg-white/60 rounded p-3">
                          <div className="text-xs text-zinc-600 mb-1">Probability</div>
                          <div className="text-lg font-bold text-amber-700">
                            {(constraint.impact.risk.probability * 100).toFixed(0)}%
                          </div>
                        </div>
                        <div className="bg-white/60 rounded p-3">
                          <div className="text-xs text-zinc-600 mb-1">Risk Score</div>
                          <div className="text-lg font-bold text-blue-700">
                            {constraint.impact.risk.riskScore.toFixed(1)}/10
                          </div>
                        </div>
                      </div>

                      {constraint.impact.operational.throughputReduction && (
                        <div className="mt-3 text-sm text-zinc-600">
                          <strong>Operational Impact:</strong> {constraint.impact.operational.throughputReduction}% throughput reduction,
                          {constraint.impact.operational.delay && ` ${constraint.impact.operational.delay}h delay`}
                          {constraint.impact.operational.productionLoss && `, ${constraint.impact.operational.productionLoss} MW unavailable`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Mitigation Options */}
      <section className="py-12 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-zinc-900">Mitigation Strategy Builder</h2>
            </div>
            <Button onClick={fetchDemoData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset to Optimal
            </Button>
          </div>

          <p className="text-sm text-zinc-600 mb-6">
            Select mitigation actions to build your custom strategy. The system will calculate total cost, benefit, and ROI in real-time.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {demoData.mitigationOptions
              .sort((a, b) => (b.npvImpact / b.cost) - (a.npvImpact / a.cost))
              .map((mitigation) => {
                const isSelected = selectedMitigations.includes(mitigation.id);
                const isOptimal = demoData.scenario.optimalMitigationPlan.implementationSequence.includes(mitigation.id);

                return (
                  <Card
                    key={mitigation.id}
                    className={`p-6 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-2 border-blue-500 bg-blue-50/50 shadow-lg'
                        : 'border border-zinc-200 hover:border-zinc-300 hover:shadow-md'
                    }`}
                    onClick={() => toggleMitigation(mitigation.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {isSelected ? (
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-zinc-300" />
                          )}
                          <h3 className="font-bold text-zinc-900">{mitigation.name}</h3>
                          {isOptimal && (
                            <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded">
                              OPTIMAL
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-700 ml-7">{mitigation.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 ml-7">
                      <div>
                        <div className="text-xs text-zinc-600 mb-1">Cost</div>
                        <div className="text-lg font-bold text-rose-600">
                          ${(mitigation.cost / 1000000).toFixed(2)}M
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-600 mb-1">NPV Benefit</div>
                        <div className="text-lg font-bold text-emerald-600">
                          ${(mitigation.npvImpact / 1000000).toFixed(2)}M
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-600 mb-1">ROI</div>
                        <div className="text-lg font-bold text-blue-600">
                          {(mitigation.npvImpact / mitigation.cost).toFixed(1)}:1
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-600 mb-1">Implementation</div>
                        <div className="text-lg font-bold text-blue-600">
                          {mitigation.timeToImplement}h
                        </div>
                      </div>
                    </div>

                    <div className="ml-7 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-600">Effectiveness:</span>
                        <span className="font-medium text-zinc-900">{(mitigation.effectiveness * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-600">Risk Reduction:</span>
                        <span className="font-medium text-zinc-900">{(mitigation.riskReduction * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-600">Feasibility:</span>
                        <span className="font-medium text-zinc-900">{(mitigation.feasibility * 100).toFixed(0)}%</span>
                      </div>
                    </div>

                    {mitigation.prerequisites && mitigation.prerequisites.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-zinc-200 ml-7">
                        <div className="text-xs text-zinc-600 mb-2">Prerequisites:</div>
                        <ul className="space-y-1">
                          {mitigation.prerequisites.map((prereq, idx) => (
                            <li key={idx} className="text-xs text-zinc-700 flex items-start gap-1">
                              <span className="text-blue-600 mt-0.5">•</span>
                              <span>{prereq}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                );
              })}
          </div>

          {/* Real-time Impact Calculator */}
          <div className="mt-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-6">Your Custom Strategy Impact</h3>
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <div className="text-sm text-blue-200 mb-2">Total Investment</div>
                <div className="text-3xl font-bold">
                  ${((calculatedImpact?.totalCost || 0) / 1000000).toFixed(2)}M
                </div>
              </div>
              <div>
                <div className="text-sm text-blue-200 mb-2">Expected Benefit</div>
                <div className="text-3xl font-bold">
                  ${((calculatedImpact?.totalBenefit || 0) / 1000000).toFixed(2)}M
                </div>
              </div>
              <div>
                <div className="text-sm text-blue-200 mb-2">Net Savings</div>
                <div className="text-3xl font-bold">
                  ${((calculatedImpact?.netSavings || 0) / 1000000).toFixed(2)}M
                </div>
              </div>
              <div>
                <div className="text-sm text-blue-200 mb-2">Return on Investment</div>
                <div className="text-3xl font-bold">
                  {(calculatedImpact?.roi || 0).toFixed(1)}:1
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-blue-400/30">
              <p className="text-sm text-blue-100">
                Selected {selectedMitigations.length} of {demoData.mitigationOptions.length} mitigation actions.
                {selectedMitigations.length === demoData.scenario.optimalMitigationPlan.implementationSequence.length &&
                 selectedMitigations.every(id => demoData.scenario.optimalMitigationPlan.implementationSequence.includes(id)) && (
                  <span className="ml-2 font-semibold">✓ This matches the AI-recommended optimal strategy!</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Zap className="w-16 h-16 mx-auto mb-4 text-emerald-200" />
          <h2 className="text-3xl font-bold mb-4">
            This is How MIAR Constraint Intelligence Works
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Real-time constraint detection • Multi-dimensional impact analysis • AI-optimized mitigation strategies •
            Quantified ROI on every action • {(demoData.scenario.probability * 100).toFixed(0)}% probability prediction accuracy
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold"
            >
              Schedule Live Demo
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white/30 text-white hover:bg-white/10 font-semibold"
            >
              View Full Platform
            </Button>
          </div>
          <p className="text-sm text-emerald-200 mt-6">
            Typical value delivered: $5M-$50M per scenario • 10-25:1 ROI in Year 1 • 90-day time to first value
          </p>
        </div>
      </section>
    </div>
  );
}
