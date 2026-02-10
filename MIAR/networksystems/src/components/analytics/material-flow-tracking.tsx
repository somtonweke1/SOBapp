'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
  Activity,
  Clock,
  MapPin,
  BarChart3,
  RefreshCw,
  Filter,
  Download,
  Eye,
  Zap
} from 'lucide-react';

interface MaterialData {
  name: string;
  type: 'critical' | 'standard';
  currentPrice: number;
  priceChange: number;
  supply: {
    global: number;
    africa: number;
    constraints: string[];
  };
  demand: {
    global: number;
    africa: number;
    growth_rate: number;
  };
  bottlenecks: Array<{
    location: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    impact: string;
    duration: string;
  }>;
  stockLevels: {
    global: number;
    africa: number;
    days_remaining: number;
  };
  source?: string;
  timestamp?: Date | string;
  dataQuality?: 'verified' | 'estimated';
}

interface MaterialForecast {
  month: number;
  value: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
}

const MaterialFlowTracking: React.FC = () => {
  const [materials, setMaterials] = useState<Record<string, MaterialData>>({});
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [forecastData, setForecastData] = useState<Record<string, MaterialForecast[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [aggregateMetrics, setAggregateMetrics] = useState<any>(null);
  const [filterType, setFilterType] = useState<'all' | 'critical' | 'standard'>('all');

  const fetchMaterialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sc-gep/materials?type=${filterType}&region=africa`);
      const data = await response.json();
      
      if (data.success) {
        setMaterials(data.materials);
        setAggregateMetrics(data.aggregateMetrics);
        
        // Select first material by default
        const firstMaterial = Object.keys(data.materials)[0];
        if (firstMaterial) {
          setSelectedMaterial(firstMaterial);
        }
      }
    } catch (error) {
      console.error('Failed to fetch material data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filterType]);

  const fetchForecast = useCallback(async (materialId: string) => {
    try {
      const response = await fetch('/api/sc-gep/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_id: materialId,
          scenario_type: 'forecast',
          time_horizon: 12
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setForecastData(prev => ({
          ...prev,
          [materialId]: data.forecast.forecasts.supply
        }));
      }
    } catch (error) {
      console.error('Failed to fetch forecast:', error);
    }
  }, []);

  useEffect(() => {
    fetchMaterialData();
  }, [fetchMaterialData]);

  useEffect(() => {
    if (selectedMaterial) {
      fetchForecast(selectedMaterial);
    }
  }, [selectedMaterial, fetchForecast]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'high': return 'text-rose-600 bg-rose-50 border-rose-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      default: return 'text-zinc-600 bg-zinc-50 border-zinc-200';
    }
  };

  const getPriceChangeColor = (change: number) => {
    return change >= 0 ? 'text-emerald-600' : 'text-rose-600';
  };

  // Memoize filtered materials to avoid recalculating on every render
  const filteredMaterials = useMemo(() => {
    if (filterType === 'all') return Object.entries(materials);
    return Object.entries(materials).filter(([_, material]) => 
      filterType === 'critical' ? material.type === 'critical' : material.type === 'standard'
    );
  }, [materials, filterType]);

  // Memoize selected material data
  const selectedMaterialData = useMemo(() => {
    return selectedMaterial ? materials[selectedMaterial] : null;
  }, [materials, selectedMaterial]);

  // Memoize current forecast data
  const currentForecast = useMemo(() => {
    return selectedMaterial ? forecastData[selectedMaterial] : null;
  }, [forecastData, selectedMaterial]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
        <div className="border-b border-zinc-200/50 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-extralight text-zinc-900 tracking-tight">Material Flow Tracking</h2>
              <p className="text-sm text-zinc-500 mt-2 font-light">Real-time monitoring of critical materials in supply chains</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'critical' | 'standard')}
                className="px-4 py-2 border border-zinc-200 rounded-lg bg-white/60 backdrop-blur-sm text-sm font-light"
              >
                <option value="all">All Materials</option>
                <option value="critical">Critical Materials</option>
                <option value="standard">Standard Materials</option>
              </select>
              <Button
                onClick={fetchMaterialData}
                disabled={isLoading}
                variant="outline"
                className="h-10 w-10 p-0 border-zinc-300 text-zinc-500 hover:text-zinc-900 hover:border-zinc-400 bg-white/60 backdrop-blur-sm"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Aggregate Metrics */}
        {aggregateMetrics && (
          <div className="px-8 py-4 bg-zinc-50/50">
            <div className="grid grid-cols-4 gap-6 mb-4">
              <div className="text-center">
                <div className="text-2xl font-light text-zinc-900">
                  {(aggregateMetrics.totalSupply / 1000).toFixed(0)}K
                </div>
                <div className="text-xs text-zinc-400 uppercase tracking-wider font-light">Total Supply (tonnes)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-light text-blue-600">
                  {(aggregateMetrics.totalDemand / 1000).toFixed(0)}K
                </div>
                <div className="text-xs text-zinc-400 uppercase tracking-wider font-light">Total Demand (tonnes)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-light text-amber-600">
                  {(aggregateMetrics.totalStock / 1000).toFixed(0)}K
                </div>
                <div className="text-xs text-zinc-400 uppercase tracking-wider font-light">Stock Levels (tonnes)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-light text-rose-600">
                  {aggregateMetrics.criticalBottlenecks}
                </div>
                <div className="text-xs text-zinc-400 uppercase tracking-wider font-light">Critical Bottlenecks</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Material Overview */}
        <div className="lg:col-span-2 bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
          <div className="border-b border-zinc-200/50 px-6 py-4">
            <h3 className="text-lg font-light text-zinc-900">Material Overview</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {filteredMaterials.map(([materialId, material]) => (
                <div
                  key={materialId}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedMaterial === materialId
                      ? 'border-blue-300 bg-blue-50/50'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                  onClick={() => setSelectedMaterial(materialId)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Package className="h-5 w-5 text-zinc-600" />
                      <span className="text-lg font-medium text-zinc-900">{material.name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-light ${
                        material.type === 'critical' 
                          ? 'bg-rose-100 text-rose-700' 
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {material.type.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-lg font-medium text-zinc-900">
                          ${material.currentPrice.toLocaleString()}
                        </div>
                        <div className={`text-sm flex items-center ${
                          material.priceChange >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {material.priceChange >= 0 ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {Math.abs(material.priceChange).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-zinc-500">Supply:</span>
                      <span className="font-medium ml-1">{(material.supply.africa / 1000).toFixed(0)}K t</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Demand:</span>
                      <span className="font-medium ml-1">{(material.demand.africa / 1000).toFixed(0)}K t</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Stock:</span>
                      <span className="font-medium ml-1">{material.stockLevels.days_remaining} days</span>
                    </div>
                  </div>

                  {/* Bottlenecks */}
                  {material.bottlenecks.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-zinc-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium text-zinc-700">Active Bottlenecks</span>
                      </div>
                      <div className="space-y-1">
                        {material.bottlenecks.slice(0, 2).map((bottleneck, idx) => (
                          <div
                            key={idx}
                            className={`px-2 py-1 rounded text-xs ${getSeverityColor(bottleneck.severity)}`}
                          >
                            <span className="font-medium">{bottleneck.location}:</span> {bottleneck.impact}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Data Source Attribution */}
                  {material.source && (
                    <div className="mt-3 pt-3 border-t border-zinc-200">
                      <div className="text-xs text-emerald-600 font-medium flex items-center">
                        <span className="mr-1">✓</span>
                        {material.source === 'LME' || material.source === 'COMEX' ? (
                          <span>Source: {material.source} (Live)</span>
                        ) : (
                          <span>Source: Market Estimates</span>
                        )}
                      </div>
                      {material.dataQuality === 'verified' && (
                        <div className="text-xs text-zinc-500 mt-1">
                          Real-time verified data
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Material Details */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
          <div className="border-b border-zinc-200/50 px-6 py-4">
            <h3 className="text-lg font-light text-zinc-900">Material Details</h3>
          </div>
          <div className="p-6">
            {selectedMaterialData ? (
              <div className="space-y-6">
                <div className="text-center">
                  <h4 className="text-xl font-light text-zinc-900 mb-2">
                    {selectedMaterialData.name}
                  </h4>
                  <div className="text-3xl font-light text-zinc-900 mb-1">
                    ${selectedMaterialData.currentPrice.toLocaleString()}
                  </div>
                  <div className={`text-sm flex items-center justify-center ${
                    getPriceChangeColor(selectedMaterialData.priceChange)
                  }`}>
                    {selectedMaterialData.priceChange >= 0 ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    {Math.abs(selectedMaterialData.priceChange).toFixed(1)}% this month
                  </div>
                </div>

                {/* Supply/Demand Balance */}
                <div className="bg-zinc-50 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-zinc-700 mb-3">Supply/Demand Balance</h5>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-zinc-600">Supply</span>
                        <span className="font-medium">{(selectedMaterialData.supply.africa / 1000).toFixed(0)}K tonnes</span>
                      </div>
                      <div className="w-full bg-zinc-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-zinc-600">Demand</span>
                        <span className="font-medium">{(selectedMaterialData.demand.africa / 1000).toFixed(0)}K tonnes</span>
                      </div>
                      <div className="w-full bg-zinc-200 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stock Levels */}
                <div className="bg-zinc-50 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-zinc-700 mb-3">Stock Levels</h5>
                  <div className="text-center">
                    <div className="text-2xl font-light text-zinc-900">
                      {selectedMaterialData.stockLevels.days_remaining}
                    </div>
                    <div className="text-sm text-zinc-600">days remaining</div>
                    <div className="text-xs text-zinc-500 mt-1">
                      {(selectedMaterialData.stockLevels.africa / 1000).toFixed(0)}K tonnes in stock
                    </div>
                  </div>
                </div>

                {/* Constraints */}
                <div className="bg-zinc-50 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-zinc-700 mb-3">Key Constraints</h5>
                  <div className="space-y-2">
                    {selectedMaterialData.supply.constraints.map((constraint, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-sm">
                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                        <span className="text-zinc-600 capitalize">{constraint.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-light">Select a material to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Forecast Chart */}
      {currentForecast && selectedMaterialData && (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
          <div className="border-b border-zinc-200/50 px-8 py-6">
            <h3 className="text-xl font-extralight text-zinc-900 tracking-tight">
              {selectedMaterialData.name} - 12-Month Supply Forecast
            </h3>
          </div>
          <div className="p-8">
            <div className="h-64 bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-lg p-4">
              {/* Simple chart visualization */}
              <div className="relative h-full">
                <svg className="w-full h-full">
                  {currentForecast.map((point, idx) => {
                    const maxValue = Math.max(...currentForecast.map(p => p.value));
                    const x = (idx / (currentForecast.length - 1)) * 100;
                    const y = 100 - (point.value / maxValue) * 80;
                    
                    return (
                      <g key={idx}>
                        {/* Confidence interval */}
                        <rect
                          x={`${x - 0.5}%`}
                          y={`${100 - (point.confidence_interval.upper / maxValue) * 80}%`}
                          width="1%"
                          height={`${((point.confidence_interval.upper - point.confidence_interval.lower) / maxValue) * 80}%`}
                          fill="#3b82f6"
                          opacity="0.2"
                        />
                        {/* Data point */}
                        <circle
                          cx={`${x}%`}
                          cy={`${y}%`}
                          r="3"
                          fill="#3b82f6"
                          className="hover:r-5 transition-all"
                        />
                        {/* Month labels */}
                        {idx % 3 === 0 && (
                          <text
                            x={`${x}%`}
                            y="95%"
                            textAnchor="middle"
                            className="text-xs fill-zinc-600"
                          >
                            M{point.month}
                          </text>
                        )}
                      </g>
                    );
                  })}
                  
                  {/* Trend line */}
                  <polyline
                    points={currentForecast.map((point, idx) => {
                      const maxValue = Math.max(...currentForecast.map(p => p.value));
                      const x = (idx / (currentForecast.length - 1)) * 100;
                      const y = 100 - (point.value / maxValue) * 80;
                      return `${x}%,${y}%`;
                    }).join(' ')}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialFlowTracking;

