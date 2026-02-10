'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AFRICAN_MINING_OPERATIONS,
  NETWORK_CONNECTIONS,
  GLOBAL_TRADE_ROUTES,
  AfricanMiningNetwork,
  AfricanMiningOperation
} from '@/services/african-mining-network';
import {
  Globe,
  MapPin,
  TrendingUp,
  AlertTriangle,
  Zap,
  ArrowRight,
  Network,
  DollarSign,
  Truck,
  Factory,
  Users,
  BarChart3,
  Target,
  Link
} from 'lucide-react';

const NetworkAnalysisDashboard: React.FC = () => {
  const [selectedOperation, setSelectedOperation] = useState<AfricanMiningOperation>(AFRICAN_MINING_OPERATIONS[0]);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'overview' | 'connections' | 'trade_routes' | 'vulnerabilities'>('overview');

  const continentalImpact = AfricanMiningNetwork.calculateContinentalImpact();
  const vulnerabilities = AfricanMiningNetwork.identifySupplyChainVulnerabilities();

  const filteredOperations = selectedRegion === 'all'
    ? AFRICAN_MINING_OPERATIONS
    : AFRICAN_MINING_OPERATIONS.filter(op => op.region === selectedRegion);

  const getRegionColor = (region: string) => {
    const colors = {
      'west_africa': 'bg-green-100 text-green-800 border-green-200',
      'east_africa': 'bg-blue-100 text-blue-800 border-blue-200',
      'southern_africa': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'central_africa': 'bg-orange-100 text-orange-800 border-orange-200',
      'north_africa': 'bg-rose-100 text-rose-800 border-rose-200'
    };
    return colors[region as keyof typeof colors] || 'bg-zinc-100 text-zinc-800';
  };

  const getConnectionStrengthColor = (strength: number) => {
    if (strength >= 0.8) return 'border-green-500 bg-green-50';
    if (strength >= 0.6) return 'border-yellow-500 bg-yellow-50';
    return 'border-rose-500 bg-rose-50';
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-light mb-2">
                African Mining Network Intelligence
              </h1>
              <p className="text-blue-100">
                Continental-scale analysis of mining operations, trade flows, and strategic connections
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-light">
                {continentalImpact.strategic_minerals_control}%
              </div>
              <div className="text-sm text-blue-100">Global Critical Minerals Control</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Global Value Proposition */}
        <Card className="p-6 bg-gradient-to-r from-indigo-50 to-emerald-50 border-indigo-200">
          <div className="text-center mb-6">
            <h2 className="text-xl font-medium text-zinc-900 mb-2">Africa Controls the World's Critical Mineral Supply Chains</h2>
            <p className="text-zinc-700 max-w-4xl mx-auto">
              MIAR's network analysis reveals the invisible connections that make Africa the linchpin of global supply chains.
              Understanding these networks is essential for mining companies, governments, and investors worldwide.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-white rounded-lg border border-indigo-100">
              <div className="text-2xl font-light text-indigo-900 mb-2">70%</div>
              <div className="text-sm font-medium text-indigo-700 mb-1">Global Cobalt Supply</div>
              <div className="text-xs text-indigo-600">Essential for EV batteries - all flows through DRC-Zambia corridor</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-indigo-100">
              <div className="text-2xl font-light text-indigo-900 mb-2">75%</div>
              <div className="text-sm font-medium text-indigo-700 mb-1">Global Phosphate Supply</div>
              <div className="text-xs text-indigo-600">Morocco feeds global food security through fertilizers</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-indigo-100">
              <div className="text-2xl font-light text-indigo-900 mb-2">$95B</div>
              <div className="text-sm font-medium text-indigo-700 mb-1">Annual China Trade</div>
              <div className="text-xs text-indigo-600">95M tonnes of African minerals flow to China annually</div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white rounded-lg border border-indigo-100">
            <div className="flex items-center justify-center space-x-8 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                <span className="text-zinc-700">Single Point of Failure Risk</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-zinc-700">Logistics Bottleneck</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-zinc-700">Optimization Opportunity</span>
              </div>
            </div>
          </div>
        </Card>
        {/* Network Intelligence KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 text-center">
            <div className="text-3xl font-light text-zinc-900 mb-2">
              {AFRICAN_MINING_OPERATIONS.length}
            </div>
            <div className="text-sm font-medium text-zinc-700 mb-1">Major Operations</div>
            <div className="text-xs text-green-600">8 countries, 5 regions</div>
          </Card>

          <Card className="p-6 text-center">
            <div className="text-3xl font-light text-zinc-900 mb-2">
              {(continentalImpact.total_employment / 1000).toFixed(0)}k
            </div>
            <div className="text-sm font-medium text-zinc-700 mb-1">Direct Jobs</div>
            <div className="text-xs text-blue-600">Continental employment</div>
          </Card>

          <Card className="p-6 text-center">
            <div className="text-3xl font-light text-zinc-900 mb-2">
              ${(continentalImpact.total_government_revenue / 1000).toFixed(1)}B
            </div>
            <div className="text-sm font-medium text-zinc-700 mb-1">Govt Revenue</div>
            <div className="text-xs text-emerald-600">Annual tax contribution</div>
          </Card>

          <Card className="p-6 text-center">
            <div className="text-3xl font-light text-zinc-900 mb-2">
              {NETWORK_CONNECTIONS.length}
            </div>
            <div className="text-sm font-medium text-zinc-700 mb-1">Network Links</div>
            <div className="text-xs text-orange-600">Cross-border connections</div>
          </Card>
        </div>

        {/* View Mode Selection */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'overview', label: 'Continental Overview', icon: Globe },
            { id: 'connections', label: 'Network Connections', icon: Network },
            { id: 'trade_routes', label: 'Global Trade Routes', icon: Truck },
            { id: 'vulnerabilities', label: 'Supply Chain Risks', icon: AlertTriangle }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id as any)}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                viewMode === mode.id
                  ? 'bg-blue-100 text-blue-800 shadow-sm'
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              <mode.icon className="mr-2 h-4 w-4" />
              {mode.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        {viewMode === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Regional Selection */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-zinc-900 mb-4">Select Region/Operation</h3>

              <div className="space-y-2 mb-6">
                <button
                  onClick={() => setSelectedRegion('all')}
                  className={`w-full p-3 text-left rounded-lg border transition-all ${
                    selectedRegion === 'all' ? 'border-blue-500 bg-blue-50' : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="font-medium text-zinc-900">All Africa</div>
                  <div className="text-sm text-zinc-600">{AFRICAN_MINING_OPERATIONS.length} operations</div>
                </button>

                {['west_africa', 'east_africa', 'southern_africa', 'central_africa', 'north_africa'].map((region) => {
                  const regionOps = AFRICAN_MINING_OPERATIONS.filter(op => op.region === region);
                  const regionName = region.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

                  return (
                    <button
                      key={region}
                      onClick={() => setSelectedRegion(region)}
                      className={`w-full p-3 text-left rounded-lg border transition-all ${
                        selectedRegion === region ? 'border-blue-500 bg-blue-50' : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-zinc-900">{regionName}</div>
                          <div className="text-sm text-zinc-600">{regionOps.length} operations</div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full border ${getRegionColor(region)}`}>
                          {regionOps.reduce((sum, op) => sum + op.economic_impact.employment, 0).toLocaleString()} jobs
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <h4 className="font-medium text-zinc-900 mb-3">Operations</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredOperations.map((operation) => (
                  <button
                    key={operation.id}
                    onClick={() => setSelectedOperation(operation)}
                    className={`w-full p-3 text-left text-sm border rounded-lg transition-all ${
                      selectedOperation?.id === operation.id
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="font-medium text-zinc-900">{operation.name}</div>
                    <div className="text-xs text-zinc-600">{operation.country} • {operation.production.primary_commodity}</div>
                    <div className="flex items-center mt-1">
                      <span className={`px-1.5 py-0.5 text-xs rounded-full ${getRegionColor(operation.region)}`}>
                        {operation.region.replace('_', ' ')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Selected Operation Details */}
            <Card className="lg:col-span-2 p-6">
              {selectedOperation && (
                <div>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-medium text-zinc-900">{selectedOperation.name}</h3>
                      <p className="text-zinc-600">{selectedOperation.operator} • {selectedOperation.country}</p>
                      <span className={`inline-block mt-2 px-3 py-1 text-sm rounded-full ${getRegionColor(selectedOperation.region)}`}>
                        {selectedOperation.region.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-light text-zinc-900">
                        {selectedOperation.economic_impact.gdp_contribution_percent.toFixed(1)}%
                      </div>
                      <div className="text-sm text-zinc-600">GDP Contribution</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-medium text-zinc-900 mb-4">Production & Resources</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-zinc-600">Primary Commodity</span>
                          <span className="font-medium capitalize">{selectedOperation.production.primary_commodity}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-zinc-600">Annual Production</span>
                          <span className="font-medium">{selectedOperation.production.annual_production.toLocaleString()} {selectedOperation.production.unit}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-zinc-600">Status</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            selectedOperation.status === 'operational' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedOperation.status}
                          </span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-sm text-zinc-600">Commodities</span>
                          <div className="text-right">
                            {selectedOperation.commodities.map((commodity, idx) => (
                              <span key={idx} className="inline-block ml-1 px-2 py-0.5 text-xs bg-zinc-100 rounded">
                                {commodity}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-zinc-900 mb-4">Economic Impact</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-zinc-600">Employment</span>
                          <span className="font-medium">{selectedOperation.economic_impact.employment.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-zinc-600">Govt Revenue</span>
                          <span className="font-medium">${selectedOperation.economic_impact.government_revenue_usd_m}M/yr</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-zinc-600">Logistics Cost</span>
                          <span className="font-medium">${selectedOperation.trade_routes.logistics_cost_per_ton}/tonne</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-sm text-zinc-600">Export Markets</span>
                          <div className="text-right">
                            {selectedOperation.trade_routes.export_destinations.slice(0, 3).map((dest, idx) => (
                              <span key={idx} className="inline-block ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                                {dest}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Network Centrality Analysis */}
                  {(() => {
                    const centrality = AfricanMiningNetwork.calculateNetworkCentrality(selectedOperation.id);
                    return (
                      <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                        <h4 className="font-medium text-emerald-900 mb-3">Network Analysis</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-xl font-light text-emerald-900">{centrality.degree}</div>
                            <div className="text-xs text-emerald-700">Network Connections</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-light text-emerald-900">{centrality.importance_score.toFixed(1)}</div>
                            <div className="text-xs text-emerald-700">Importance Score</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-light text-emerald-900">{(centrality.closeness * 100).toFixed(0)}%</div>
                            <div className="text-xs text-emerald-700">Avg Connection Strength</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-light text-emerald-900">{(centrality.betweenness * 100).toFixed(0)}%</div>
                            <div className="text-xs text-emerald-700">Network Centrality</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Network Connections View */}
        {viewMode === 'connections' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium text-zinc-900 mb-4">Cross-Border Mining Network Connections</h3>
              <p className="text-sm text-zinc-600 mb-6">
                These connections represent real supply chains, knowledge transfers, financial flows, and logistics partnerships between African mining operations.
              </p>

              <div className="space-y-4">
                {NETWORK_CONNECTIONS.map((connection, idx) => {
                  const sourceOp = AFRICAN_MINING_OPERATIONS.find(op => op.id === connection.source_id);
                  const targetOp = AFRICAN_MINING_OPERATIONS.find(op => op.id === connection.target_id);

                  return (
                    <div key={idx} className={`p-4 border rounded-lg ${getConnectionStrengthColor(connection.strength)}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-4">
                          <div className="text-sm font-medium text-zinc-900">
                            {sourceOp?.country} ↔ {targetOp?.country}
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            connection.connection_type === 'supply_chain' ? 'bg-blue-100 text-blue-800' :
                            connection.connection_type === 'knowledge_transfer' ? 'bg-green-100 text-green-800' :
                            connection.connection_type === 'financial' ? 'bg-emerald-100 text-emerald-800' :
                            connection.connection_type === 'logistics' ? 'bg-orange-100 text-orange-800' :
                            'bg-zinc-100 text-zinc-800'
                          }`}>
                            {connection.connection_type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-zinc-900">
                            ${(connection.value_usd_annually! / 1000000).toFixed(0)}M/yr
                          </div>
                          <div className="text-xs text-zinc-600">Strength: {(connection.strength * 100).toFixed(0)}%</div>
                        </div>
                      </div>

                      <p className="text-sm text-zinc-700">{connection.description}</p>

                      <div className="mt-3 flex items-center text-xs text-zinc-600">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{sourceOp?.name} → {targetOp?.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* Global Trade Routes */}
        {viewMode === 'trade_routes' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-zinc-900">Global Trade Routes from Africa</h3>
                  <p className="text-sm text-zinc-600">Major mineral export corridors connecting Africa to global markets</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-light text-zinc-900">95M</div>
                  <div className="text-sm text-zinc-600">tonnes/year to China alone</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {GLOBAL_TRADE_ROUTES.map((route, idx) => (
                  <div key={idx} className={`p-6 rounded-lg border-2 ${
                    route.strategic_importance === 'critical' ? 'border-rose-200 bg-rose-50' : 'border-blue-200 bg-blue-50'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-zinc-900">{route.commodity}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        route.strategic_importance === 'critical' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {route.strategic_importance}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-600">Volume</span>
                        <span className="font-medium">{route.annual_volume_tons.toLocaleString()} tonnes/yr</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-600">Route</span>
                        <span className="font-medium">{route.route_type}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-zinc-600">Key Infrastructure:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {route.key_infrastructure.slice(0, 3).map((infra, i) => (
                            <span key={i} className="inline-block px-2 py-0.5 text-xs bg-white rounded border">
                              {infra}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Global Market Share */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-zinc-900 mb-4">Africa's Global Market Control</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                {Object.entries(continentalImpact.global_market_share).map(([commodity, share]) => (
                  <div key={commodity} className="text-center">
                    <div className="text-3xl font-light text-zinc-900 mb-2">{share}%</div>
                    <div className="text-sm font-medium text-zinc-700 capitalize">{commodity}</div>
                    <div className="text-xs text-zinc-500">Global market share</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Supply Chain Vulnerabilities */}
        {viewMode === 'vulnerabilities' && (
          <div className="space-y-6">
            {vulnerabilities.map((vuln, idx) => (
              <Card key={idx} className="p-6 border-l-4 border-l-red-500">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-zinc-900 flex items-center">
                      <AlertTriangle className="h-5 w-5 text-rose-500 mr-2" />
                      {vuln.vulnerability}
                    </h3>
                    <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                      vuln.risk_level === 'high' ? 'bg-rose-100 text-rose-800' :
                      vuln.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {vuln.risk_level} risk
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-zinc-900 mb-3">Global Impact</h4>
                    <p className="text-sm text-zinc-700 mb-4">{vuln.global_impact}</p>

                    <h4 className="font-medium text-zinc-900 mb-3">Affected Operations</h4>
                    <div className="space-y-2">
                      {vuln.affected_operations.map((opId, i) => {
                        const operation = AFRICAN_MINING_OPERATIONS.find(op => op.id === opId);
                        return operation && (
                          <div key={i} className="flex items-center text-sm">
                            <MapPin className="h-3 w-3 text-gray-400 mr-2" />
                            <span>{operation.name} ({operation.country})</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-zinc-900 mb-3">Mitigation Strategies</h4>
                    <div className="space-y-2">
                      {vuln.mitigation_strategies.map((strategy, i) => (
                        <div key={i} className="flex items-start text-sm">
                          <ArrowRight className="h-3 w-3 text-blue-500 mt-1 mr-2 flex-shrink-0" />
                          <span className="text-zinc-700">{strategy}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkAnalysisDashboard;