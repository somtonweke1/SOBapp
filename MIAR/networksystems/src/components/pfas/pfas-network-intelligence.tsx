'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import {
  Droplet,
  Factory,
  Sprout,
  Building2,
  Users,
  AlertTriangle,
  MapPin,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { PlantIcon3D, Icon3D } from '@/components/ui/icon-3d';
import { CommunityDetection, type NetworkData, type NetworkNode, type NetworkEdge } from '@/lib/network-science-algorithms';
import AnimatedPFASFlowMap from '@/components/pfas/animated-pfas-flow-map';

// PFAS Contamination Site Data
interface PFASContaminationSite {
  id: string;
  type: 'industrial' | 'water_system' | 'irrigation' | 'farm' | 'food_processor' | 'population';
  name: string;
  location: string;
  state: string;
  region: 'northeast' | 'southeast' | 'midwest' | 'southwest' | 'west';
  pfasLevel: number; // ng/L
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  exposedPopulation: number;
  annualContaminationVolume: number; // gallons
  cleanupCostEstimate: number; // USD
  lat: number;
  lon: number;
  description: string;
}

const PFAS_CONTAMINATION_SITES: PFASContaminationSite[] = [
  {
    id: 'ind-1',
    type: 'industrial',
    name: '3M Manufacturing Plant',
    location: 'Minnesota',
    state: 'MN',
    region: 'midwest',
    pfasLevel: 85000,
    riskLevel: 'critical',
    exposedPopulation: 8000000,
    annualContaminationVolume: 15000000,
    cleanupCostEstimate: 850000000,
    lat: 44.9778,
    lon: -93.2650,
    description: 'Primary PFAS manufacturing - source contamination affecting Mississippi River watershed'
  },
  {
    id: 'ind-2',
    type: 'industrial',
    name: 'DuPont Chemical Facility',
    location: 'West Virginia',
    state: 'WV',
    region: 'southeast',
    pfasLevel: 73000,
    riskLevel: 'critical',
    exposedPopulation: 6500000,
    annualContaminationVolume: 12000000,
    cleanupCostEstimate: 670000000,
    lat: 39.3200,
    lon: -81.5521,
    description: 'C8 (PFOA) production facility - contaminated Ohio River Valley'
  },
  {
    id: 'water-1',
    type: 'water_system',
    name: 'Mississippi River System',
    location: 'Multi-state',
    state: 'MS',
    region: 'midwest',
    pfasLevel: 48000,
    riskLevel: 'high',
    exposedPopulation: 18000000,
    annualContaminationVolume: 8500000,
    cleanupCostEstimate: 320000000,
    lat: 38.6270,
    lon: -90.1994,
    description: 'Major water intake for agricultural irrigation downstream'
  },
  {
    id: 'water-2',
    type: 'water_system',
    name: 'Ohio River Intake',
    location: 'Ohio',
    state: 'OH',
    region: 'midwest',
    pfasLevel: 41000,
    riskLevel: 'high',
    exposedPopulation: 5000000,
    annualContaminationVolume: 6800000,
    cleanupCostEstimate: 280000000,
    lat: 38.7409,
    lon: -82.6371,
    description: 'Drinking water and agricultural supply'
  },
  {
    id: 'irr-1',
    type: 'irrigation',
    name: 'Central Valley Irrigation District',
    location: 'California',
    state: 'CA',
    region: 'west',
    pfasLevel: 28000,
    riskLevel: 'medium',
    exposedPopulation: 12000000,
    annualContaminationVolume: 4200000,
    cleanupCostEstimate: 180000000,
    lat: 36.7783,
    lon: -119.4179,
    description: 'Primary irrigation for US produce supply'
  },
  {
    id: 'farm-1',
    type: 'farm',
    name: 'Central Valley Agricultural Region',
    location: 'California',
    state: 'CA',
    region: 'west',
    pfasLevel: 22000,
    riskLevel: 'medium',
    exposedPopulation: 450000,
    annualContaminationVolume: 2100000,
    cleanupCostEstimate: 95000000,
    lat: 36.7783,
    lon: -119.4179,
    description: 'Lettuce, tomatoes, leafy greens - high PFAS bioaccumulation'
  },
  {
    id: 'proc-1',
    type: 'food_processor',
    name: 'Food Processing Hub',
    location: 'Multi-state',
    state: 'IL',
    region: 'midwest',
    pfasLevel: 12000,
    riskLevel: 'medium',
    exposedPopulation: 2300000,
    annualContaminationVolume: 850000,
    cleanupCostEstimate: 42000000,
    lat: 41.8781,
    lon: -87.6298,
    description: 'Food packaging adds additional PFAS from materials'
  },
  {
    id: 'pop-1',
    type: 'population',
    name: 'US Population Exposure',
    location: 'Nationwide',
    state: 'US',
    region: 'midwest',
    pfasLevel: 8500,
    riskLevel: 'medium',
    exposedPopulation: 200000000,
    annualContaminationVolume: 0,
    cleanupCostEstimate: 0,
    lat: 39.8283,
    lon: -98.5795,
    description: '95% of PFAS exposure through food pathway, not drinking water'
  }
];

interface PFASFlowConnection {
  source_id: string;
  target_id: string;
  connection_type: 'direct_discharge' | 'water_flow' | 'irrigation_supply' | 'food_supply' | 'distribution';
  strength: number; // 0-1
  description: string;
  volume_gallons_annually?: number;
}

const PFAS_FLOW_CONNECTIONS: PFASFlowConnection[] = [
  {
    source_id: 'ind-1',
    target_id: 'water-1',
    connection_type: 'direct_discharge',
    strength: 0.95,
    volume_gallons_annually: 15000000,
    description: '3M plant discharge directly into Mississippi River system'
  },
  {
    source_id: 'ind-2',
    target_id: 'water-2',
    connection_type: 'direct_discharge',
    strength: 0.92,
    volume_gallons_annually: 12000000,
    description: 'DuPont C8 contamination of Ohio River watershed'
  },
  {
    source_id: 'water-1',
    target_id: 'irr-1',
    connection_type: 'water_flow',
    strength: 0.75,
    volume_gallons_annually: 8500000,
    description: 'Mississippi water diverted to California Central Valley irrigation'
  },
  {
    source_id: 'irr-1',
    target_id: 'farm-1',
    connection_type: 'irrigation_supply',
    strength: 0.65,
    volume_gallons_annually: 4200000,
    description: 'Contaminated irrigation water uptake by crops'
  },
  {
    source_id: 'farm-1',
    target_id: 'proc-1',
    connection_type: 'food_supply',
    strength: 0.55,
    volume_gallons_annually: 2100000,
    description: 'Produce transported to processing facilities'
  },
  {
    source_id: 'proc-1',
    target_id: 'pop-1',
    connection_type: 'distribution',
    strength: 0.45,
    volume_gallons_annually: 850000,
    description: 'Processed food distributed to consumers nationwide'
  }
];

const PFASNetworkIntelligence: React.FC = () => {
  const [selectedSite, setSelectedSite] = useState<PFASContaminationSite>(PFAS_CONTAMINATION_SITES[0]);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'overview' | 'flow_map' | 'connections' | 'interventions'>('overview');

  // Convert to network format for analysis
  const networkData: NetworkData = useMemo(() => {
    const nodes: NetworkNode[] = PFAS_CONTAMINATION_SITES.map(site => ({
      id: site.id,
      label: site.name,
      type: site.type,
      pfasLevel: site.pfasLevel,
      riskLevel: site.riskLevel
    }));

    const edges: NetworkEdge[] = PFAS_FLOW_CONNECTIONS.map(conn => ({
      source: conn.source_id,
      target: conn.target_id,
      weight: conn.strength * 100
    }));

    return { nodes, edges, directed: true };
  }, []);

  // Community detection
  const communityStructure = useMemo(() => {
    try {
      return CommunityDetection.louvain(networkData, { resolution: 1.0 });
    } catch (error) {
      console.error('Community detection failed:', error);
      return null;
    }
  }, [networkData]);

  // Calculate total impact
  const totalImpact = useMemo(() => {
    const totalExposure = PFAS_CONTAMINATION_SITES.reduce((sum, site) => sum + site.exposedPopulation, 0);
    const totalCleanupCost = PFAS_CONTAMINATION_SITES.reduce((sum, site) => sum + site.cleanupCostEstimate, 0);
    const criticalSites = PFAS_CONTAMINATION_SITES.filter(s => s.riskLevel === 'critical').length;

    return {
      totalExposure,
      totalCleanupCost,
      criticalSites,
      foodSupplyImpact: 95 // 95% exposure through food
    };
  }, []);

  const filteredSites = selectedRegion === 'all'
    ? PFAS_CONTAMINATION_SITES
    : PFAS_CONTAMINATION_SITES.filter(site => site.region === selectedRegion);

  const getRegionColor = (region: string) => {
    const colors = {
      'northeast': 'bg-blue-100 text-blue-800 border-blue-200',
      'southeast': 'bg-green-100 text-green-800 border-green-200',
      'midwest': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'southwest': 'bg-orange-100 text-orange-800 border-orange-200',
      'west': 'bg-rose-100 text-rose-800 border-rose-200'
    };
    return colors[region as keyof typeof colors] || 'bg-zinc-100 text-zinc-800';
  };

  const getConnectionStrengthColor = (strength: number) => {
    if (strength >= 0.8) return 'border-rose-500 bg-rose-50';
    if (strength >= 0.6) return 'border-orange-500 bg-orange-50';
    return 'border-yellow-500 bg-yellow-50';
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header - Matching Mining Dashboard Style */}
      <div className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-light mb-2">
                PFAS Contamination Network Intelligence
              </h1>
              <p className="text-blue-100">
                Full-pathway analysis: Industrial sources → Water systems → Agriculture → Food supply → Population exposure
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-light">
                {totalImpact.foodSupplyImpact}%
              </div>
              <div className="text-sm text-blue-100">Human Exposure via Food</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Global Value Proposition */}
        <Card className="p-6 bg-gradient-to-r from-indigo-50 to-emerald-50 border-indigo-200">
          <div className="text-center mb-6">
            <h2 className="text-xl font-medium text-zinc-900 mb-2">PFAS: The Invisible Contamination Crisis</h2>
            <p className="text-zinc-700 max-w-4xl mx-auto">
              Network analysis reveals the hidden pathways connecting industrial discharge to nationwide food contamination.
              Understanding these flows is essential for regulators, water utilities, food companies, and public health officials.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-8 bg-white border-rose-200/50 hover:shadow-2xl transition-all group">
              <PlantIcon3D color="rose" className="mb-6" />
              <div className="text-3xl font-extralight text-indigo-900 mb-3">200M</div>
              <h3 className="text-xl font-light text-indigo-700 mb-3">Americans Exposed</h3>
              <p className="text-sm text-indigo-600 font-light leading-relaxed">Through contaminated food supply - not drinking water</p>
            </Card>
            <Card className="p-8 bg-white border-amber-200/50 hover:shadow-2xl transition-all group">
              <PlantIcon3D color="amber" className="mb-6" />
              <div className="text-3xl font-extralight text-indigo-900 mb-3">$2.4B</div>
              <h3 className="text-xl font-light text-indigo-700 mb-3">Estimated Cleanup Costs</h3>
              <p className="text-sm text-indigo-600 font-light leading-relaxed">Across critical contamination sites</p>
            </Card>
            <Card className="p-8 bg-white border-blue-200/50 hover:shadow-2xl transition-all group">
              <Icon3D variant="custom" color="blue" className="mb-6">
                <Droplet className="h-6 w-6 text-white" />
              </Icon3D>
              <div className="text-3xl font-extralight text-indigo-900 mb-3">85k</div>
              <h3 className="text-xl font-light text-indigo-700 mb-3">Peak PFAS Levels (ng/L)</h3>
              <p className="text-sm text-indigo-600 font-light leading-relaxed">21,000x higher than EPA safety limit</p>
            </Card>
          </div>

          <div className="mt-6 p-4 bg-white rounded-lg border border-indigo-100">
            <div className="flex items-center justify-center space-x-8 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                <span className="text-zinc-700">Critical Source</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-zinc-700">High Flow Rate</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-zinc-700">Treatment Opportunity</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Network Intelligence KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="p-8 border-rose-200/50 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all group">
            <PlantIcon3D color="rose" className="mb-6" />
            <div className="text-3xl font-extralight text-zinc-900 mb-3">
              {totalImpact.criticalSites}
            </div>
            <h3 className="text-xl font-light text-zinc-700 mb-2">Critical Sources</h3>
            <p className="text-sm text-rose-600 font-light">Industrial discharge sites</p>
          </Card>

          <Card className="p-8 border-blue-200/50 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all group">
            <Icon3D variant="custom" color="blue" className="mb-6">
              <Users className="h-6 w-6 text-white" />
            </Icon3D>
            <div className="text-3xl font-extralight text-zinc-900 mb-3">
              {(totalImpact.totalExposure / 1000000).toFixed(0)}M
            </div>
            <h3 className="text-xl font-light text-zinc-700 mb-2">Exposed Population</h3>
            <p className="text-sm text-blue-600 font-light">Across contamination pathways</p>
          </Card>

          <Card className="p-8 border-emerald-200/50 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all group">
            <PlantIcon3D color="emerald" className="mb-6" />
            <div className="text-3xl font-extralight text-zinc-900 mb-3">
              {PFAS_FLOW_CONNECTIONS.length}
            </div>
            <h3 className="text-xl font-light text-zinc-700 mb-2">Flow Connections</h3>
            <p className="text-sm text-emerald-600 font-light">Source to sink pathways</p>
          </Card>

          <Card className="p-8 border-amber-200/50 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all group">
            <Icon3D variant="custom" color="amber" className="mb-6">
              <Building2 className="h-6 w-6 text-white" />
            </Icon3D>
            <div className="text-3xl font-extralight text-zinc-900 mb-3">
              {communityStructure?.communityCount || 0}
            </div>
            <h3 className="text-xl font-light text-zinc-700 mb-2">Contamination Clusters</h3>
            <p className="text-sm text-amber-600 font-light">Via Louvain algorithm</p>
          </Card>
        </div>

        {/* View Mode Selector */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-zinc-200">
          {['overview', 'flow_map', 'connections', 'interventions'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              {mode.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        {viewMode === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Regional Selection */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-zinc-900 mb-4">Select Region/Site</h3>

              <div className="space-y-2 mb-6">
                <button
                  onClick={() => setSelectedRegion('all')}
                  className={`w-full p-3 text-left rounded-lg border transition-all ${
                    selectedRegion === 'all' ? 'border-blue-500 bg-blue-50' : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="font-medium text-zinc-900">All United States</div>
                  <div className="text-sm text-zinc-600">{PFAS_CONTAMINATION_SITES.length} contamination sites</div>
                </button>

                {['northeast', 'southeast', 'midwest', 'southwest', 'west'].map((region) => {
                  const regionSites = PFAS_CONTAMINATION_SITES.filter(site => site.region === region);
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
                          <div className="text-sm text-zinc-600">{regionSites.length} sites</div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full border ${getRegionColor(region)}`}>
                          {(regionSites.reduce((sum, s) => sum + s.exposedPopulation, 0) / 1000000).toFixed(1)}M exposed
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <h4 className="font-medium text-zinc-900 mb-3">Contamination Sites</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredSites.map((site) => (
                  <button
                    key={site.id}
                    onClick={() => setSelectedSite(site)}
                    className={`w-full p-3 text-left text-sm border rounded-lg transition-all ${
                      selectedSite?.id === site.id
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="font-medium text-zinc-900">{site.name}</div>
                    <div className="text-xs text-zinc-600">{site.location} • {site.type.replace('_', ' ')}</div>
                    <div className="flex items-center mt-1">
                      <span className={`px-1.5 py-0.5 text-xs rounded-full ${getRegionColor(site.region)}`}>
                        {site.region}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Selected Site Details */}
            <Card className="lg:col-span-2 p-6">
              {selectedSite && (
                <div>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-medium text-zinc-900">{selectedSite.name}</h3>
                      <p className="text-zinc-600">{selectedSite.location} • {selectedSite.state}</p>
                      <span className={`inline-block mt-2 px-3 py-1 text-sm rounded-full ${getRegionColor(selectedSite.region)}`}>
                        {selectedSite.region.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-light text-zinc-900">
                        {(selectedSite.pfasLevel / 1000).toFixed(0)}k
                      </div>
                      <div className="text-sm text-zinc-600">ng/L PFAS</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-medium text-zinc-900 mb-4">Contamination Data</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-zinc-600">Site Type</span>
                          <span className="font-medium capitalize">{selectedSite.type.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-zinc-600">PFAS Level</span>
                          <span className="font-medium">{selectedSite.pfasLevel.toLocaleString()} ng/L</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-zinc-600">Risk Level</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            selectedSite.riskLevel === 'critical' ? 'bg-rose-100 text-rose-800' :
                            selectedSite.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedSite.riskLevel.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-sm text-zinc-600">EPA MCL Exceedance</span>
                          <span className="font-medium text-rose-600">{(selectedSite.pfasLevel / 4).toFixed(0)}x</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-zinc-900 mb-4">Public Health Impact</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-zinc-600">Exposed Population</span>
                          <span className="font-medium">{(selectedSite.exposedPopulation / 1000000).toFixed(1)}M</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-zinc-600">Annual Volume</span>
                          <span className="font-medium">{(selectedSite.annualContaminationVolume / 1000000).toFixed(1)}M gal</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-zinc-600">Cleanup Cost</span>
                          <span className="font-medium">${(selectedSite.cleanupCostEstimate / 1000000).toFixed(0)}M</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-sm text-zinc-600">Location</span>
                          <span className="font-medium text-xs">{selectedSite.lat.toFixed(4)}, {selectedSite.lon.toFixed(4)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-zinc-700">{selectedSite.description}</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Flow Map View */}
        {viewMode === 'flow_map' && (
          <Card className="p-6">
            <AnimatedPFASFlowMap />
          </Card>
        )}

        {/* Connections View */}
        {viewMode === 'connections' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium text-zinc-900 mb-4">PFAS Contamination Flow Connections</h3>
              <p className="text-sm text-zinc-600 mb-6">
                These connections represent real contamination pathways from industrial discharge through water systems, irrigation, agriculture, and food processing to population exposure.
              </p>

              <div className="space-y-4">
                {PFAS_FLOW_CONNECTIONS.map((connection, idx) => {
                  const sourcesite = PFAS_CONTAMINATION_SITES.find(site => site.id === connection.source_id);
                  const targetSite = PFAS_CONTAMINATION_SITES.find(site => site.id === connection.target_id);

                  return (
                    <div key={idx} className={`p-4 border rounded-lg ${getConnectionStrengthColor(connection.strength)}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-4">
                          <div className="text-sm font-medium text-zinc-900">
                            {sourcesite?.location} → {targetSite?.location}
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            connection.connection_type === 'direct_discharge' ? 'bg-rose-100 text-rose-800' :
                            connection.connection_type === 'water_flow' ? 'bg-blue-100 text-blue-800' :
                            connection.connection_type === 'irrigation_supply' ? 'bg-green-100 text-green-800' :
                            connection.connection_type === 'food_supply' ? 'bg-orange-100 text-orange-800' :
                            'bg-zinc-100 text-zinc-800'
                          }`}>
                            {connection.connection_type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-zinc-900">
                            {connection.volume_gallons_annually ? `${(connection.volume_gallons_annually / 1000000).toFixed(1)}M gal/yr` : 'N/A'}
                          </div>
                          <div className="text-xs text-zinc-600">Flow: {(connection.strength * 100).toFixed(0)}%</div>
                        </div>
                      </div>

                      <p className="text-sm text-zinc-700">{connection.description}</p>

                      <div className="mt-3 flex items-center text-xs text-zinc-600">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{sourcesite?.name} → {targetSite?.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* Interventions View */}
        {viewMode === 'interventions' && (
          <div className="space-y-6">
            <Card className="p-6 border-l-4 border-l-emerald-500">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-zinc-900 flex items-center">
                    <TrendingDown className="h-5 w-5 text-emerald-500 mr-2" />
                    Primary Intervention: Source Control at Industrial Sites
                  </h3>
                  <span className="inline-block mt-2 px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-800">
                    HIGH IMPACT
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-zinc-900 mb-3">Impact Assessment</h4>
                  <p className="text-sm text-zinc-700 mb-4">
                    Stopping PFAS discharge at 3M and DuPont facilities would prevent 27M gallons of annual contamination,
                    protecting 14.5M people downstream. ROI: $1.5B cleanup cost avoided vs $85M treatment investment.
                  </p>

                  <h4 className="font-medium text-zinc-900 mb-3">Affected Sites</h4>
                  <div className="space-y-2">
                    {PFAS_CONTAMINATION_SITES.filter(s => s.type === 'industrial').map((site) => (
                      <div key={site.id} className="flex items-center text-sm">
                        <MapPin className="h-3 w-3 text-gray-400 mr-2" />
                        <span>{site.name} ({site.location})</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-zinc-900 mb-3">Implementation Strategy</h4>
                  <div className="space-y-2">
                    {[
                      'Install GAC filtration at discharge points',
                      'Transition to fluorine-free alternatives',
                      'Implement closed-loop water systems',
                      'Establish real-time effluent monitoring',
                      'Create financial liability reserves'
                    ].map((strategy, i) => (
                      <div key={i} className="flex items-start text-sm">
                        <ArrowRight className="h-3 w-3 text-emerald-500 mt-1 mr-2 flex-shrink-0" />
                        <span className="text-zinc-700">{strategy}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-blue-500">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-zinc-900 flex items-center">
                    <AlertTriangle className="h-5 w-5 text-blue-500 mr-2" />
                    Secondary Intervention: Water Treatment Upgrades
                  </h3>
                  <span className="inline-block mt-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    MEDIUM IMPACT
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-zinc-900 mb-3">Impact Assessment</h4>
                  <p className="text-sm text-zinc-700 mb-4">
                    Installing advanced treatment at Mississippi and Ohio River intakes would reduce contamination by 65%,
                    protecting 23M people. Cost: $600M infrastructure + $45M/yr operating costs.
                  </p>

                  <h4 className="font-medium text-zinc-900 mb-3">Affected Sites</h4>
                  <div className="space-y-2">
                    {PFAS_CONTAMINATION_SITES.filter(s => s.type === 'water_system').map((site) => (
                      <div key={site.id} className="flex items-center text-sm">
                        <MapPin className="h-3 w-3 text-gray-400 mr-2" />
                        <span>{site.name} ({site.location})</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-zinc-900 mb-3">Implementation Strategy</h4>
                  <div className="space-y-2">
                    {[
                      'Deploy granular activated carbon (GAC) systems',
                      'Install ion exchange resin technology',
                      'Implement reverse osmosis for high-contamination',
                      'Establish PFAS monitoring networks',
                      'Create emergency response protocols'
                    ].map((strategy, i) => (
                      <div key={i} className="flex items-start text-sm">
                        <ArrowRight className="h-3 w-3 text-blue-500 mt-1 mr-2 flex-shrink-0" />
                        <span className="text-zinc-700">{strategy}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PFASNetworkIntelligence;
