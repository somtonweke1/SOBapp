'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Save,
  Upload,
  Play,
  Copy,
  Trash2,
  Plus,
  Settings,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface MaterialConstraint {
  id: string;
  name: string;
  primarySupply: number;
  secondarySupply?: number;
  recyclingRate?: number;
  unit: string;
  enabled: boolean;
}

interface TechnologyConstraint {
  id: string;
  name: string;
  leadTime: number;
  capacity?: number;
  cost?: number;
  unit: string;
  enabled: boolean;
}

interface SpatialConstraint {
  id: string;
  zone: string;
  availableLand?: number;
  powerCapacity?: number;
  restrictions?: string;
  enabled: boolean;
}

interface CustomScenario {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  materials: MaterialConstraint[];
  technologies: TechnologyConstraint[];
  spatial: SpatialConstraint[];
  temporal: {
    planningHorizon: number;
    demandGrowthRate: number;
  };
}

interface ScenarioResult {
  scenarioId: string;
  objectiveValue: number;
  feasibility: boolean;
  solveTime: number;
  convergence: string;
  bottlenecks?: any[];
}

const CustomScenarioBuilder: React.FC = () => {
  const [scenarios, setScenarios] = useState<CustomScenario[]>([]);
  const [currentScenario, setCurrentScenario] = useState<CustomScenario | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['materials']));
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Record<string, ScenarioResult>>({});
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);

  // Load saved scenarios from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('miar_custom_scenarios');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const scenariosWithDates = parsed.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt)
        }));
        setScenarios(scenariosWithDates);
      } catch (error) {
        console.error('Failed to load scenarios:', error);
      }
    }
  }, []);

  // Save scenarios to localStorage
  useEffect(() => {
    if (scenarios.length > 0) {
      localStorage.setItem('miar_custom_scenarios', JSON.stringify(scenarios));
    }
  }, [scenarios]);

  const createNewScenario = () => {
    const newScenario: CustomScenario = {
      id: `scenario_${Date.now()}`,
      name: `Scenario ${scenarios.length + 1}`,
      description: 'Custom supply chain scenario',
      createdAt: new Date(),
      updatedAt: new Date(),
      materials: [
        {
          id: 'lithium',
          name: 'Lithium',
          primarySupply: 86000,
          secondarySupply: 5000,
          recyclingRate: 0.15,
          unit: 'tonnes/year',
          enabled: true
        },
        {
          id: 'cobalt',
          name: 'Cobalt',
          primarySupply: 180000,
          secondarySupply: 12000,
          recyclingRate: 0.20,
          unit: 'tonnes/year',
          enabled: true
        },
        {
          id: 'nickel',
          name: 'Nickel',
          primarySupply: 3000000,
          secondarySupply: 150000,
          recyclingRate: 0.35,
          unit: 'tonnes/year',
          enabled: true
        }
      ],
      technologies: [
        {
          id: 'battery_storage',
          name: 'Battery Storage',
          leadTime: 1.0,
          capacity: 2000,
          cost: 350000,
          unit: 'MW',
          enabled: true
        },
        {
          id: 'solar_pv',
          name: 'Solar PV',
          leadTime: 0.67,
          capacity: 5000,
          cost: 1200000,
          unit: 'MW',
          enabled: true
        },
        {
          id: 'wind_onshore',
          name: 'Onshore Wind',
          leadTime: 3.0,
          capacity: 1500,
          cost: 1500000,
          unit: 'MW',
          enabled: true
        }
      ],
      spatial: [
        {
          id: 'africa',
          zone: 'Africa',
          availableLand: 10000,
          powerCapacity: 8000,
          enabled: true
        },
        {
          id: 'maryland_pjm',
          zone: 'Maryland/PJM',
          availableLand: 5000,
          powerCapacity: 12000,
          enabled: true
        }
      ],
      temporal: {
        planningHorizon: 30,
        demandGrowthRate: 3.5
      }
    };

    setCurrentScenario(newScenario);
    setScenarios([...scenarios, newScenario]);
  };

  const saveScenario = () => {
    if (!currentScenario) return;

    const updatedScenario = {
      ...currentScenario,
      updatedAt: new Date()
    };

    setScenarios(scenarios.map(s =>
      s.id === updatedScenario.id ? updatedScenario : s
    ));
    setCurrentScenario(updatedScenario);
  };

  const deleteScenario = (scenarioId: string) => {
    setScenarios(scenarios.filter(s => s.id !== scenarioId));
    if (currentScenario?.id === scenarioId) {
      setCurrentScenario(null);
    }
  };

  const duplicateScenario = (scenario: CustomScenario) => {
    const duplicate: CustomScenario = {
      ...scenario,
      id: `scenario_${Date.now()}`,
      name: `${scenario.name} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setScenarios([...scenarios, duplicate]);
    setCurrentScenario(duplicate);
  };

  const runScenario = async (scenario: CustomScenario) => {
    setIsRunning(true);
    try {
      const response = await fetch('/api/sc-gep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: scenario.name,
          region: 'custom',
          constraints: {
            materials: scenario.materials.filter(m => m.enabled).map(m => ({
              id: m.id,
              primarySupply: m.primarySupply,
              secondarySupply: m.secondarySupply,
              recyclingRate: m.recyclingRate
            })),
            technologies: scenario.technologies.filter(t => t.enabled).map(t => ({
              id: t.id,
              leadTime: t.leadTime,
              capacity: t.capacity,
              cost: t.cost
            })),
            zones: scenario.spatial.filter(z => z.enabled).map(z => ({
              id: z.id,
              availableLand: z.availableLand,
              powerCapacity: z.powerCapacity
            })),
            planningHorizon: scenario.temporal.planningHorizon,
            demandGrowthRate: scenario.temporal.demandGrowthRate
          },
          analysis_type: 'full',
          use_enhanced: true
        })
      });

      const data = await response.json();
      if (data.success) {
        const result: ScenarioResult = {
          scenarioId: scenario.id,
          objectiveValue: data.solution.objectiveValue,
          feasibility: data.solution.feasibility,
          solveTime: data.solution.solveTime,
          convergence: data.solution.convergence,
          bottlenecks: data.bottleneckAnalysis?.materialBottlenecks
        };

        setResults(prev => ({
          ...prev,
          [scenario.id]: result
        }));
      }
    } catch (error) {
      console.error('Failed to run scenario:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const toggleComparison = (scenarioId: string) => {
    if (selectedForComparison.includes(scenarioId)) {
      setSelectedForComparison(selectedForComparison.filter(id => id !== scenarioId));
    } else if (selectedForComparison.length < 3) {
      setSelectedForComparison([...selectedForComparison, scenarioId]);
    }
  };

  const updateMaterial = (materialId: string, field: keyof MaterialConstraint, value: any) => {
    if (!currentScenario) return;

    setCurrentScenario({
      ...currentScenario,
      materials: currentScenario.materials.map(m =>
        m.id === materialId ? { ...m, [field]: value } : m
      )
    });
  };

  const updateTechnology = (techId: string, field: keyof TechnologyConstraint, value: any) => {
    if (!currentScenario) return;

    setCurrentScenario({
      ...currentScenario,
      technologies: currentScenario.technologies.map(t =>
        t.id === techId ? { ...t, [field]: value } : t
      )
    });
  };

  const updateSpatial = (zoneId: string, field: keyof SpatialConstraint, value: any) => {
    if (!currentScenario) return;

    setCurrentScenario({
      ...currentScenario,
      spatial: currentScenario.spatial.map(z =>
        z.id === zoneId ? { ...z, [field]: value } : z
      )
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
        <div className="border-b border-zinc-200/50 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-extralight text-zinc-900 tracking-tight">Custom Scenario Builder</h2>
              <p className="text-sm text-zinc-500 mt-2 font-light">Create and test custom supply chain constraints</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={createNewScenario}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Scenario
              </Button>
              {currentScenario && (
                <Button
                  onClick={saveScenario}
                  variant="outline"
                  className="border-zinc-300 text-zinc-600 hover:text-zinc-900"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Saved Scenarios List */}
        <div className="lg:col-span-1">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
            <div className="border-b border-zinc-200/50 px-6 py-4">
              <h3 className="text-lg font-light text-zinc-900">Saved Scenarios</h3>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {scenarios.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-light">No scenarios yet</p>
                  <p className="text-xs mt-1">Create your first custom scenario</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {scenarios.map(scenario => {
                    const result = results[scenario.id];
                    const isSelected = currentScenario?.id === scenario.id;
                    const isComparing = selectedForComparison.includes(scenario.id);

                    return (
                      <div
                        key={scenario.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-emerald-300 bg-emerald-50/50'
                            : 'border-zinc-200 hover:border-zinc-300'
                        }`}
                        onClick={() => setCurrentScenario(scenario)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-zinc-900">{scenario.name}</span>
                          <div className="flex items-center space-x-1">
                            <input
                              type="checkbox"
                              checked={isComparing}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleComparison(scenario.id);
                              }}
                              className="rounded border-zinc-300"
                              title="Select for comparison"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-zinc-600 mb-2">{scenario.description}</p>
                        {result && (
                          <div className="flex items-center space-x-2 mt-2">
                            {result.feasibility ? (
                              <CheckCircle className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-rose-600" />
                            )}
                            <span className="text-xs text-zinc-600">
                              ${(result.objectiveValue / 1000000000).toFixed(1)}B
                            </span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 mt-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              runScenario(scenario);
                            }}
                            disabled={isRunning}
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Run
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateScenario(scenario);
                            }}
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteScenario(scenario.id);
                            }}
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs text-rose-600 hover:text-rose-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scenario Editor */}
        <div className="lg:col-span-2">
          {currentScenario ? (
            <div className="space-y-4">
              {/* Scenario Details */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20 p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Scenario Name</label>
                    <input
                      type="text"
                      value={currentScenario.name}
                      onChange={(e) => setCurrentScenario({ ...currentScenario, name: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Description</label>
                    <input
                      type="text"
                      value={currentScenario.description}
                      onChange={(e) => setCurrentScenario({ ...currentScenario, description: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Material Constraints */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
                <div
                  className="border-b border-zinc-200/50 px-6 py-4 cursor-pointer flex items-center justify-between"
                  onClick={() => toggleSection('materials')}
                >
                  <h3 className="text-lg font-light text-zinc-900">Material Constraints</h3>
                  {expandedSections.has('materials') ? (
                    <ChevronDown className="h-5 w-5 text-zinc-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-zinc-500" />
                  )}
                </div>
                {expandedSections.has('materials') && (
                  <div className="p-6 space-y-4">
                    {currentScenario.materials.map(material => (
                      <div key={material.id} className="border border-zinc-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-zinc-900">{material.name}</span>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={material.enabled}
                              onChange={(e) => updateMaterial(material.id, 'enabled', e.target.checked)}
                              className="rounded border-zinc-300"
                            />
                            <span className="text-xs text-zinc-600">Enabled</span>
                          </label>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-zinc-600 mb-1">Primary Supply ({material.unit})</label>
                            <input
                              type="number"
                              value={material.primarySupply}
                              onChange={(e) => updateMaterial(material.id, 'primarySupply', Number(e.target.value))}
                              className="w-full px-2 py-1 border border-zinc-300 rounded text-sm"
                              disabled={!material.enabled}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-600 mb-1">Secondary Supply</label>
                            <input
                              type="number"
                              value={material.secondarySupply || 0}
                              onChange={(e) => updateMaterial(material.id, 'secondarySupply', Number(e.target.value))}
                              className="w-full px-2 py-1 border border-zinc-300 rounded text-sm"
                              disabled={!material.enabled}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-600 mb-1">Recycling Rate (%)</label>
                            <input
                              type="number"
                              value={(material.recyclingRate || 0) * 100}
                              onChange={(e) => updateMaterial(material.id, 'recyclingRate', Number(e.target.value) / 100)}
                              step="0.1"
                              className="w-full px-2 py-1 border border-zinc-300 rounded text-sm"
                              disabled={!material.enabled}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Technology Constraints */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
                <div
                  className="border-b border-zinc-200/50 px-6 py-4 cursor-pointer flex items-center justify-between"
                  onClick={() => toggleSection('technologies')}
                >
                  <h3 className="text-lg font-light text-zinc-900">Technology Constraints</h3>
                  {expandedSections.has('technologies') ? (
                    <ChevronDown className="h-5 w-5 text-zinc-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-zinc-500" />
                  )}
                </div>
                {expandedSections.has('technologies') && (
                  <div className="p-6 space-y-4">
                    {currentScenario.technologies.map(tech => (
                      <div key={tech.id} className="border border-zinc-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-zinc-900">{tech.name}</span>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={tech.enabled}
                              onChange={(e) => updateTechnology(tech.id, 'enabled', e.target.checked)}
                              className="rounded border-zinc-300"
                            />
                            <span className="text-xs text-zinc-600">Enabled</span>
                          </label>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-zinc-600 mb-1">Lead Time (years)</label>
                            <input
                              type="number"
                              value={tech.leadTime}
                              onChange={(e) => updateTechnology(tech.id, 'leadTime', Number(e.target.value))}
                              step="0.1"
                              className="w-full px-2 py-1 border border-zinc-300 rounded text-sm"
                              disabled={!tech.enabled}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-600 mb-1">Capacity ({tech.unit})</label>
                            <input
                              type="number"
                              value={tech.capacity || 0}
                              onChange={(e) => updateTechnology(tech.id, 'capacity', Number(e.target.value))}
                              className="w-full px-2 py-1 border border-zinc-300 rounded text-sm"
                              disabled={!tech.enabled}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-600 mb-1">Cost ($)</label>
                            <input
                              type="number"
                              value={tech.cost || 0}
                              onChange={(e) => updateTechnology(tech.id, 'cost', Number(e.target.value))}
                              className="w-full px-2 py-1 border border-zinc-300 rounded text-sm"
                              disabled={!tech.enabled}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Temporal Parameters */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
                <div className="border-b border-zinc-200/50 px-6 py-4">
                  <h3 className="text-lg font-light text-zinc-900">Temporal Parameters</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-2">Planning Horizon (years)</label>
                      <input
                        type="number"
                        value={currentScenario.temporal.planningHorizon}
                        onChange={(e) => setCurrentScenario({
                          ...currentScenario,
                          temporal: { ...currentScenario.temporal, planningHorizon: Number(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-2">Demand Growth Rate (%/year)</label>
                      <input
                        type="number"
                        value={currentScenario.temporal.demandGrowthRate}
                        onChange={(e) => setCurrentScenario({
                          ...currentScenario,
                          temporal: { ...currentScenario.temporal, demandGrowthRate: Number(e.target.value) }
                        })}
                        step="0.1"
                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Run Scenario */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-zinc-600">
                  Last updated: {currentScenario.updatedAt.toLocaleString()}
                </div>
                <Button
                  onClick={() => runScenario(currentScenario)}
                  disabled={isRunning}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {isRunning ? (
                    <>
                      <Settings className="h-4 w-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Scenario
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20 p-12 text-center">
              <Settings className="h-12 w-12 mx-auto mb-4 text-zinc-400" />
              <h3 className="text-lg font-light text-zinc-900 mb-2">No Scenario Selected</h3>
              <p className="text-sm text-zinc-600 mb-6">Create a new scenario or select an existing one to start</p>
              <Button
                onClick={createNewScenario}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Scenario
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Comparison View */}
      {selectedForComparison.length > 0 && (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
          <div className="border-b border-zinc-200/50 px-8 py-4">
            <h3 className="text-xl font-extralight text-zinc-900 tracking-tight">
              Scenario Comparison ({selectedForComparison.length} scenarios)
            </h3>
          </div>
          <div className="p-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-700">Metric</th>
                    {selectedForComparison.map(id => {
                      const scenario = scenarios.find(s => s.id === id);
                      return (
                        <th key={id} className="text-left py-3 px-4 text-sm font-medium text-zinc-700">
                          {scenario?.name}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-100">
                    <td className="py-3 px-4 text-sm text-zinc-600">Total Cost</td>
                    {selectedForComparison.map(id => {
                      const result = results[id];
                      return (
                        <td key={id} className="py-3 px-4 text-sm font-medium text-zinc-900">
                          {result ? `$${(result.objectiveValue / 1000000000).toFixed(2)}B` : 'Not run'}
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="border-b border-zinc-100">
                    <td className="py-3 px-4 text-sm text-zinc-600">Feasibility</td>
                    {selectedForComparison.map(id => {
                      const result = results[id];
                      return (
                        <td key={id} className="py-3 px-4 text-sm">
                          {result ? (
                            <span className={result.feasibility ? 'text-emerald-600' : 'text-rose-600'}>
                              {result.feasibility ? '✓ Feasible' : '✗ Infeasible'}
                            </span>
                          ) : 'N/A'}
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="border-b border-zinc-100">
                    <td className="py-3 px-4 text-sm text-zinc-600">Solve Time</td>
                    {selectedForComparison.map(id => {
                      const result = results[id];
                      return (
                        <td key={id} className="py-3 px-4 text-sm text-zinc-900">
                          {result ? `${result.solveTime.toFixed(2)}s` : 'N/A'}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-sm text-zinc-600">Convergence</td>
                    {selectedForComparison.map(id => {
                      const result = results[id];
                      return (
                        <td key={id} className="py-3 px-4 text-sm text-zinc-900 capitalize">
                          {result ? result.convergence : 'N/A'}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomScenarioBuilder;
