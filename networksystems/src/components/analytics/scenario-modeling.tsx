'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Settings,
  Play,
  Pause,
  RotateCcw,
  Save,
  Download,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Zap,
  Clock,
  MapPin,
  Package,
  Activity,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus
} from 'lucide-react';

interface ScenarioParameter {
  id: string;
  name: string;
  category: 'material' | 'technology' | 'spatial' | 'temporal';
  currentValue: number;
  minValue: number;
  maxValue: number;
  unit: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
}

interface ScenarioResult {
  scenario: string;
  objectiveValue: number;
  feasibility: boolean;
  costImpact: number;
  deploymentDelay: number;
  bottleneckSeverity: number;
  convergence: string;
  solveTime: number;
}

interface SensitivityAnalysis {
  parameter: string;
  baselineValue: number;
  variations: Array<{
    value: number;
    objectiveChange: number;
    feasibility: boolean;
    bottleneckImpact: number;
  }>;
}

const ScenarioModeling: React.FC = () => {
  const [parameters, setParameters] = useState<ScenarioParameter[]>([]);
  const [scenarios, setScenarios] = useState<Record<string, ScenarioResult>>({});
  const [selectedScenario, setSelectedScenario] = useState<string>('baseline');
  const [isRunning, setIsRunning] = useState(false);
  const [sensitivityAnalysis, setSensitivityAnalysis] = useState<SensitivityAnalysis[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['material']));
  const [showSensitivity, setShowSensitivity] = useState(false);

  // Initialize parameters
  useEffect(() => {
    const initialParameters: ScenarioParameter[] = [
      // Material parameters
      {
        id: 'lithium_supply',
        name: 'Lithium Supply',
        category: 'material',
        currentValue: 86000,
        minValue: 50000,
        maxValue: 120000,
        unit: 'tonnes/year',
        description: 'Primary lithium supply availability',
        impact: 'high'
      },
      {
        id: 'cobalt_supply',
        name: 'Cobalt Supply',
        category: 'material',
        currentValue: 180000,
        minValue: 120000,
        maxValue: 250000,
        unit: 'tonnes/year',
        description: 'Primary cobalt supply availability',
        impact: 'high'
      },
      {
        id: 'material_recovery_rate',
        name: 'Material Recovery Rate',
        category: 'material',
        currentValue: 0.15,
        minValue: 0.05,
        maxValue: 0.35,
        unit: 'fraction',
        description: 'Rate of material recovery from retired units',
        impact: 'medium'
      },
      
      // Technology parameters
      {
        id: 'battery_lead_time',
        name: 'Battery Lead Time',
        category: 'technology',
        currentValue: 12,
        minValue: 6,
        maxValue: 24,
        unit: 'months',
        description: 'Lead time for battery storage deployment',
        impact: 'high'
      },
      {
        id: 'solar_lead_time',
        name: 'Solar Lead Time',
        category: 'technology',
        currentValue: 8,
        minValue: 4,
        maxValue: 18,
        unit: 'months',
        description: 'Lead time for solar PV deployment',
        impact: 'medium'
      },
      {
        id: 'wind_lead_time',
        name: 'Wind Lead Time',
        category: 'technology',
        currentValue: 36,
        minValue: 18,
        maxValue: 48,
        unit: 'months',
        description: 'Lead time for wind turbine deployment',
        impact: 'high'
      },
      
      // Spatial parameters
      {
        id: 'available_land',
        name: 'Available Land',
        category: 'spatial',
        currentValue: 10000,
        minValue: 5000,
        maxValue: 20000,
        unit: 'km²',
        description: 'Total available land for renewable deployment',
        impact: 'medium'
      },
      {
        id: 'land_efficiency',
        name: 'Land Efficiency',
        category: 'spatial',
        currentValue: 0.8,
        minValue: 0.6,
        maxValue: 1.0,
        unit: 'fraction',
        description: 'Efficiency of land utilization',
        impact: 'low'
      },
      
      // Temporal parameters
      {
        id: 'demand_growth',
        name: 'Demand Growth Rate',
        category: 'temporal',
        currentValue: 3.5,
        minValue: 1.0,
        maxValue: 8.0,
        unit: '%/year',
        description: 'Annual electricity demand growth rate',
        impact: 'high'
      },
      {
        id: 'planning_horizon',
        name: 'Planning Horizon',
        category: 'temporal',
        currentValue: 30,
        minValue: 15,
        maxValue: 50,
        unit: 'years',
        description: 'Planning horizon for optimization',
        impact: 'medium'
      }
    ];

    setParameters(initialParameters);
  }, []);

  const runScenario = useCallback(async (scenarioName: string, parameterValues: Record<string, number>) => {
    setIsRunning(true);
    try {
      const response = await fetch('/api/sc-gep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: scenarioName,
          region: 'africa',
          constraints: {
            materials: [
              { id: 'lithium', primarySupply: parameterValues.lithium_supply },
              { id: 'cobalt', primarySupply: parameterValues.cobalt_supply },
              { id: 'recovery_rate', rate: parameterValues.material_recovery_rate }
            ],
            technologies: [
              { id: 'battery_storage', leadTime: parameterValues.battery_lead_time / 12 },
              { id: 'solar_pv', leadTime: parameterValues.solar_lead_time / 12 },
              { id: 'wind_onshore', leadTime: parameterValues.wind_lead_time / 12 }
            ],
            zones: [
              { id: 'africa', availableLand: parameterValues.available_land }
            ],
            planningHorizon: parameterValues.planning_horizon
          },
          analysis_type: 'full',
          use_enhanced: true
        })
      });

      const data = await response.json();
      if (data.success) {
        const result: ScenarioResult = {
          scenario: scenarioName,
          objectiveValue: data.solution.objectiveValue,
          feasibility: data.solution.feasibility,
          costImpact: 0, // Calculate relative to baseline
          deploymentDelay: 0, // Calculate from analysis
          bottleneckSeverity: data.bottleneckAnalysis?.materialBottlenecks?.filter((b: any) => b.constraint).length || 0,
          convergence: data.solution.convergence,
          solveTime: data.solution.solveTime
        };

        setScenarios(prev => ({ ...prev, [scenarioName]: result }));
      }
    } catch (error) {
      console.error('Scenario execution failed:', error);
    } finally {
      setIsRunning(false);
    }
  }, []);

  const runSensitivityAnalysis = useCallback(async () => {
    setIsRunning(true);
    try {
      const baselineValues = parameters.reduce((acc, param) => {
        acc[param.id] = param.currentValue;
        return acc;
      }, {} as Record<string, number>);

      const sensitivityResults: SensitivityAnalysis[] = [];

      for (const param of parameters) {
        const variations = [-0.2, -0.1, 0.1, 0.2]; // ±20%, ±10%
        const paramVariations = [];

        for (const variation of variations) {
          const testValue = param.currentValue * (1 + variation);
          const testParams = { ...baselineValues, [param.id]: testValue };
          
          const response = await fetch('/api/sc-gep', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scenario: `sensitivity_${param.id}_${variation > 0 ? 'increase' : 'decrease'}_${Math.abs(variation * 100)}%`,
              region: 'africa',
              constraints: testParams,
              analysis_type: 'full',
              use_enhanced: true
            })
          });

          const data = await response.json();
          if (data.success) {
            paramVariations.push({
              value: testValue,
              objectiveChange: data.solution.objectiveValue - (scenarios.baseline?.objectiveValue || 0),
              feasibility: data.solution.feasibility,
              bottleneckImpact: data.bottleneckAnalysis?.materialBottlenecks?.filter((b: any) => b.constraint).length || 0
            });
          }
        }

        sensitivityResults.push({
          parameter: param.name,
          baselineValue: param.currentValue,
          variations: paramVariations
        });
      }

      setSensitivityAnalysis(sensitivityResults);
    } catch (error) {
      console.error('Sensitivity analysis failed:', error);
    } finally {
      setIsRunning(false);
    }
  }, [parameters, scenarios]);

  const updateParameter = (paramId: string, value: number) => {
    setParameters(prev => prev.map(param => 
      param.id === paramId ? { ...param, currentValue: Math.max(param.minValue, Math.min(param.maxValue, value)) } : param
    ));
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-rose-600 bg-rose-50 border-rose-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      default: return 'text-zinc-600 bg-zinc-50 border-zinc-200';
    }
  };

  const groupedParameters = parameters.reduce((acc, param) => {
    if (!acc[param.category]) acc[param.category] = [];
    acc[param.category].push(param);
    return acc;
  }, {} as Record<string, ScenarioParameter[]>);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
        <div className="border-b border-zinc-200/50 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-extralight text-zinc-900 tracking-tight">Scenario Modeling Interface</h2>
              <p className="text-sm text-zinc-500 mt-2 font-light">Interactive supply chain constraint modeling and sensitivity analysis</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => runScenario('baseline', parameters.reduce((acc, p) => ({ ...acc, [p.id]: p.currentValue }), {}))}
                disabled={isRunning}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {isRunning ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Run Baseline
              </Button>
              <Button
                onClick={() => runSensitivityAnalysis()}
                disabled={isRunning}
                variant="outline"
                className="border-zinc-300 text-zinc-600 hover:text-zinc-900"
              >
                Sensitivity Analysis
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Parameter Controls */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
          <div className="border-b border-zinc-200/50 px-6 py-4">
            <h3 className="text-lg font-light text-zinc-900">Model Parameters</h3>
          </div>
          <div className="p-6 max-h-96 overflow-y-auto">
            <div className="space-y-6">
              {Object.entries(groupedParameters).map(([category, params]) => (
                <div key={category}>
                  <button
                    onClick={() => toggleCategory(category)}
                    className="flex items-center justify-between w-full text-left mb-3"
                  >
                    <h4 className="text-sm font-medium text-zinc-700 capitalize">{category} Parameters</h4>
                    {expandedCategories.has(category) ? (
                      <ChevronDown className="h-4 w-4 text-zinc-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-zinc-500" />
                    )}
                  </button>
                  
                  {expandedCategories.has(category) && (
                    <div className="space-y-4 pl-4">
                      {params.map((param) => (
                        <div key={param.id} className="border border-zinc-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-zinc-900">{param.name}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-light ${getImpactColor(param.impact)}`}>
                              {param.impact.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-600 mb-3">{param.description}</p>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-zinc-600">Value:</span>
                              <span className="text-sm font-medium text-zinc-900">
                                {param.currentValue.toLocaleString()} {param.unit}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={() => updateParameter(param.id, param.currentValue - (param.maxValue - param.minValue) * 0.1)}
                                disabled={param.currentValue <= param.minValue}
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              
                              <div className="flex-1">
                                <input
                                  type="range"
                                  min={param.minValue}
                                  max={param.maxValue}
                                  value={param.currentValue}
                                  onChange={(e) => updateParameter(param.id, parseFloat(e.target.value))}
                                  className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
                                  step={(param.maxValue - param.minValue) / 100}
                                />
                              </div>
                              
                              <Button
                                onClick={() => updateParameter(param.id, param.currentValue + (param.maxValue - param.minValue) * 0.1)}
                                disabled={param.currentValue >= param.maxValue}
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <div className="flex justify-between text-xs text-zinc-500">
                              <span>{param.minValue.toLocaleString()}</span>
                              <span>{param.maxValue.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scenario Results */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
          <div className="border-b border-zinc-200/50 px-6 py-4">
            <h3 className="text-lg font-light text-zinc-900">Scenario Results</h3>
          </div>
          <div className="p-6">
            {Object.keys(scenarios).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(scenarios).map(([scenarioName, result]) => (
                  <div
                    key={scenarioName}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedScenario === scenarioName
                        ? 'border-blue-300 bg-blue-50/50'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                    onClick={() => setSelectedScenario(scenarioName)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-zinc-900 capitalize">
                        {scenarioName.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-light ${
                        result.feasibility 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                        {result.convergence.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-zinc-500">Cost:</span>
                        <span className="font-medium ml-1">${(result.objectiveValue / 1000000000).toFixed(1)}B</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Bottlenecks:</span>
                        <span className="font-medium ml-1">{result.bottleneckSeverity}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Solve Time:</span>
                        <span className="font-medium ml-1">{result.solveTime.toFixed(2)}s</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Feasible:</span>
                        <span className={`font-medium ml-1 ${result.feasibility ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {result.feasibility ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500">
                <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-light">Run scenarios to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sensitivity Analysis */}
      {sensitivityAnalysis.length > 0 && (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
          <div className="border-b border-zinc-200/50 px-8 py-6">
            <h3 className="text-xl font-extralight text-zinc-900 tracking-tight">Sensitivity Analysis</h3>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sensitivityAnalysis.slice(0, 6).map((analysis, idx) => (
                <div key={idx} className="border border-zinc-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-zinc-900 mb-3">{analysis.parameter}</h4>
                  <div className="space-y-2">
                    {analysis.variations.map((variation, varIdx) => (
                      <div key={varIdx} className="flex items-center justify-between text-sm">
                        <span className="text-zinc-600">
                          {variation.value.toLocaleString()} ({((variation.value - analysis.baselineValue) / analysis.baselineValue * 100).toFixed(0)}%)
                        </span>
                        <span className={`font-medium ${
                          variation.objectiveChange >= 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}>
                          {variation.objectiveChange >= 0 ? '+' : ''}
                          ${(variation.objectiveChange / 1000000).toFixed(1)}M
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScenarioModeling;
