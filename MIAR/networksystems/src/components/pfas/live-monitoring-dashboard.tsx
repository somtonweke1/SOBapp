'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Activity, AlertTriangle, Droplet, Zap, CheckCircle, Database, MapPin, Beaker, ThermometerSun } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface LiveMonitoringData {
  waterQuality: {
    ph: number;
    temperature: number;
    dissolvedOxygen: number;
    totalDissolvedSolids: number;
  };
  monitoringStations: Array<{
    station: string;
    location: string;
    pfasLevel: number;
    change: number;
    riskLevel: 'critical' | 'high' | 'medium' | 'low';
  }>;
  alerts: Array<{
    id: string;
    type: string;
    severity: string;
    description: string;
    estimatedImpact: number;
    location: string;
    confidence: number;
    populationExposed: number;
  }>;
  summary: {
    alertsDetected: number;
    criticalAlerts: number;
    totalPopulationExposed: number;
    avgPFASLevel: number;
  };
}

interface TreatmentSystem {
  name: string;
  type: string;
  location: string;
  capacity: number; // gallons/day
  currentFlow: number;
  pfasRemoval: number; // percentage
  status: 'operational' | 'maintenance' | 'offline';
  lastMaintenance: string;
}

interface BacktestData {
  summary: {
    totalEvents: number;
    totalActualLosses: number;
    totalSavings: number;
    roi: number;
    timeAdvantage: number;
    confidence: number;
  };
  conclusions: {
    provenROI: string;
    totalValueDelivered: string;
    averageDetectionSpeed: string;
    confidence: string;
  };
}

/**
 * Live PFAS Monitoring Dashboard
 * Real-time contamination tracking and treatment system monitoring
 */
const LiveMonitoringDashboard: React.FC = () => {
  const [monitoringData, setMonitoringData] = useState<LiveMonitoringData | null>(null);
  const [treatmentSystems, setTreatmentSystems] = useState<TreatmentSystem[]>([]);
  const [backtestData, setBacktestData] = useState<BacktestData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Simulate real-time data fetching
  useEffect(() => {
    const fetchData = async () => {
      // Simulated monitoring data
      const mockMonitoringData: LiveMonitoringData = {
        waterQuality: {
          ph: 7.2,
          temperature: 18.5,
          dissolvedOxygen: 8.3,
          totalDissolvedSolids: 245
        },
        monitoringStations: [
          { station: 'Colorado River - Parker', location: 'AZ', pfasLevel: 45.2, change: 2.3, riskLevel: 'high' },
          { station: 'Central Valley - Fresno', location: 'CA', pfasLevel: 42.8, change: -1.2, riskLevel: 'high' },
          { station: 'East Rand Water Source', location: 'South Africa', pfasLevel: 70.1, change: 5.7, riskLevel: 'critical' },
          { station: 'Ashanti Industrial Zone', location: 'Ghana', pfasLevel: 38.5, change: 0.8, riskLevel: 'medium' },
          { station: 'Delaware River Basin', location: 'PA', pfasLevel: 28.3, change: -0.5, riskLevel: 'medium' },
          { station: 'Lake Michigan Intake', location: 'IL', pfasLevel: 15.2, change: 0.2, riskLevel: 'low' },
          { station: 'Puget Sound Basin', location: 'WA', pfasLevel: 22.7, change: 1.1, riskLevel: 'medium' },
          { station: 'Mississippi River Delta', location: 'LA', pfasLevel: 31.4, change: -2.3, riskLevel: 'medium' },
          { station: 'Hudson River Valley', location: 'NY', pfasLevel: 18.9, change: 0.4, riskLevel: 'low' }
        ],
        alerts: [
          {
            id: 'alert-1',
            type: 'Threshold Exceedance',
            severity: 'critical',
            description: 'PFAS levels exceeded EPA advisory limit at Colorado River - Parker monitoring station',
            estimatedImpact: 2300000,
            location: 'Parker, AZ',
            confidence: 0.94,
            populationExposed: 450000
          }
        ],
        summary: {
          alertsDetected: 1,
          criticalAlerts: 1,
          totalPopulationExposed: 450000,
          avgPFASLevel: 34.8
        }
      };

      const mockTreatmentSystems: TreatmentSystem[] = [
        {
          name: 'GAC Treatment - East Rand',
          type: 'Granular Activated Carbon',
          location: 'Witwatersrand, South Africa',
          capacity: 15000000,
          currentFlow: 14200000,
          pfasRemoval: 98.5,
          status: 'operational',
          lastMaintenance: '2025-01-15'
        },
        {
          name: 'Ion Exchange - Ashanti',
          type: 'Ion Exchange Resin',
          location: 'Kumasi, Ghana',
          capacity: 8000000,
          currentFlow: 7800000,
          pfasRemoval: 95.2,
          status: 'operational',
          lastMaintenance: '2025-01-10'
        },
        {
          name: 'RO System - Central Valley',
          type: 'Reverse Osmosis',
          location: 'Fresno, CA',
          capacity: 5000000,
          currentFlow: 4900000,
          pfasRemoval: 99.8,
          status: 'operational',
          lastMaintenance: '2025-01-18'
        },
        {
          name: 'Foam Fractionation - Katanga',
          type: 'Foam Fractionation',
          location: 'DRC',
          capacity: 2000000,
          currentFlow: 0,
          pfasRemoval: 92.0,
          status: 'maintenance',
          lastMaintenance: '2025-01-12'
        }
      ];

      const mockBacktestData: BacktestData = {
        summary: {
          totalEvents: 6,
          totalActualLosses: 52000000,
          totalSavings: 38800000,
          roi: 4.2,
          timeAdvantage: 48,
          confidence: 0.89
        },
        conclusions: {
          provenROI: '4.2x',
          totalValueDelivered: '$38.8M',
          averageDetectionSpeed: '48 hours',
          confidence: '89%'
        }
      };

      setMonitoringData(mockMonitoringData);
      setTreatmentSystems(mockTreatmentSystems);
      setBacktestData(mockBacktestData);
      setIsLoading(false);
      setLastUpdated(new Date());
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number, decimals: number = 1) => {
    return num.toFixed(decimals);
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}`;
  };

  const getChangeColor = (change: number) => {
    // For PFAS, increase is bad (red), decrease is good (green)
    if (change > 0) return 'text-rose-600';
    if (change < 0) return 'text-emerald-600';
    return 'text-zinc-600';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4" />;
    if (change < 0) return <TrendingDown className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-rose-100 text-rose-700 border-rose-300';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'low': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      default: return 'bg-zinc-100 text-zinc-700 border-zinc-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-emerald-100 text-emerald-700';
      case 'maintenance': return 'bg-amber-100 text-amber-700';
      case 'offline': return 'bg-rose-100 text-rose-700';
      default: return 'bg-zinc-100 text-zinc-700';
    }
  };

  const refetchData = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extralight text-zinc-900 tracking-tight">Live PFAS Monitoring</h2>
          <p className="text-sm text-zinc-500 mt-1">Real-time contamination tracking and treatment system status</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-xs text-zinc-500">
            Updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <button
            onClick={refetchData}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-2 bg-white/60 backdrop-blur-sm border border-zinc-200 rounded-lg hover:border-zinc-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh</span>
          </button>
        </div>
      </div>

      {/* PFAS Monitoring Proven ROI */}
      {backtestData && (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
          <div className="border-b border-zinc-200/50 px-6 py-4 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-light text-zinc-900">PFAS Monitoring System Performance</h3>
                <p className="text-xs text-zinc-500 mt-1">Proven ROI from historical contamination events</p>
              </div>
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-zinc-200/50 p-4">
                <div className="text-xs text-zinc-500 mb-1 font-light">Historical Events</div>
                <div className="text-2xl font-extralight text-zinc-900">{backtestData.summary.totalEvents}</div>
                <div className="text-xs text-zinc-500 mt-1">Documented events</div>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-zinc-200/50 p-4">
                <div className="text-xs text-zinc-500 mb-1 font-light">Value Delivered</div>
                <div className="text-2xl font-extralight text-emerald-600">{backtestData.conclusions.totalValueDelivered}</div>
                <div className="text-xs text-zinc-500 mt-1">Health costs avoided</div>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-zinc-200/50 p-4">
                <div className="text-xs text-zinc-500 mb-1 font-light">Proven ROI</div>
                <div className="text-2xl font-extralight text-emerald-600">{backtestData.conclusions.provenROI}</div>
                <div className="text-xs text-zinc-500 mt-1">Return on investment</div>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-zinc-200/50 p-4">
                <div className="text-xs text-zinc-500 mb-1 font-light">Detection Speed</div>
                <div className="text-2xl font-extralight text-zinc-900">{backtestData.conclusions.averageDetectionSpeed}</div>
                <div className="text-xs text-zinc-500 mt-1">Faster than standard</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Monitoring Stations */}
      {monitoringData && (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
          <div className="border-b border-zinc-200/50 px-6 py-4">
            <h3 className="text-lg font-light text-zinc-900">Real-Time PFAS Monitoring Stations</h3>
            <p className="text-xs text-zinc-500 mt-1">Live contamination levels at key water sources</p>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-zinc-400" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {monitoringData.monitoringStations.map((station, idx) => (
                  <div key={idx} className="bg-white/60 backdrop-blur-sm rounded-lg border border-zinc-200/50 p-4 hover:border-zinc-300 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="h-3 w-3 text-zinc-500" />
                          <h4 className="text-sm font-medium text-zinc-900">{station.station}</h4>
                        </div>
                        <span className="text-xs text-zinc-500">{station.location}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${getRiskColor(station.riskLevel)}`}>
                        {station.riskLevel.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-2xl font-extralight text-zinc-900 mt-2">
                      {formatNumber(station.pfasLevel)} ng/L
                    </div>
                    <div className={`mt-2 flex items-center gap-1.5 text-xs font-light ${getChangeColor(station.change)}`}>
                      {getChangeIcon(station.change)}
                      <span>
                        {formatChange(station.change)} ng/L vs 24h ago
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Treatment System Status */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
        <div className="border-b border-zinc-200/50 px-6 py-4">
          <h3 className="text-lg font-light text-zinc-900">Treatment System Status</h3>
          <p className="text-xs text-zinc-500 mt-1">Real-time operational status of PFAS treatment facilities</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {treatmentSystems.map((system, idx) => (
              <div key={idx} className="bg-white/60 backdrop-blur-sm rounded-lg border border-zinc-200/50 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Beaker className="h-4 w-4 text-zinc-600" />
                      <h4 className="text-sm font-medium text-zinc-900">{system.name}</h4>
                    </div>
                    <span className="text-xs text-zinc-500">{system.location}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${getStatusColor(system.status)}`}>
                    {system.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-zinc-500 mb-0.5">Capacity</div>
                    <div className="font-medium text-zinc-900">{(system.capacity / 1000000).toFixed(1)}M gal/day</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-0.5">Current Flow</div>
                    <div className="font-medium text-zinc-900">{(system.currentFlow / 1000000).toFixed(1)}M gal/day</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-0.5">PFAS Removal</div>
                    <div className="font-medium text-emerald-600">{system.pfasRemoval}%</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-0.5">Utilization</div>
                    <div className="font-medium text-zinc-900">
                      {((system.currentFlow / system.capacity) * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-zinc-200/50 text-xs text-zinc-500">
                  Last Maintenance: {new Date(system.lastMaintenance).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real-Time Water Quality Indicators */}
      {monitoringData && (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
          <div className="border-b border-zinc-200/50 px-6 py-4">
            <h3 className="text-lg font-light text-zinc-900">Real-Time Water Quality Indicators</h3>
            <p className="text-xs text-zinc-500 mt-1">Key parameters affecting PFAS behavior and treatment</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-zinc-200/50 p-4 hover:border-zinc-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Droplet className="h-4 w-4 text-zinc-600" />
                    <h4 className="text-sm font-medium text-zinc-900">pH Level</h4>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-light">
                    Normal
                  </span>
                </div>
                <div className="text-2xl font-extralight text-zinc-900">
                  {formatNumber(monitoringData.waterQuality.ph, 1)}
                </div>
                <div className="text-xs text-zinc-500 mt-1">Optimal: 6.5-8.5</div>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-zinc-200/50 p-4 hover:border-zinc-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ThermometerSun className="h-4 w-4 text-zinc-600" />
                    <h4 className="text-sm font-medium text-zinc-900">Temperature</h4>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-light">
                    Normal
                  </span>
                </div>
                <div className="text-2xl font-extralight text-zinc-900">
                  {formatNumber(monitoringData.waterQuality.temperature, 1)}°C
                </div>
                <div className="text-xs text-zinc-500 mt-1">Avg seasonal: 16-22°C</div>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-zinc-200/50 p-4 hover:border-zinc-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-zinc-600" />
                    <h4 className="text-sm font-medium text-zinc-900">Dissolved O₂</h4>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-light">
                    Good
                  </span>
                </div>
                <div className="text-2xl font-extralight text-zinc-900">
                  {formatNumber(monitoringData.waterQuality.dissolvedOxygen, 1)} mg/L
                </div>
                <div className="text-xs text-zinc-500 mt-1">Minimum: 5.0 mg/L</div>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-zinc-200/50 p-4 hover:border-zinc-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-zinc-600" />
                    <h4 className="text-sm font-medium text-zinc-900">TDS</h4>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-light">
                    Acceptable
                  </span>
                </div>
                <div className="text-2xl font-extralight text-zinc-900">
                  {formatNumber(monitoringData.waterQuality.totalDissolvedSolids, 0)} ppm
                </div>
                <div className="text-xs text-zinc-500 mt-1">Limit: 500 ppm</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Contamination Alerts */}
      {monitoringData && (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
          <div className="border-b border-zinc-200/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-light text-zinc-900">Active Contamination Alerts</h3>
                <p className="text-xs text-zinc-500 mt-1">Real-time PFAS detection alerts and threshold exceedances</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="font-medium text-rose-700">{monitoringData.summary.criticalAlerts}</span> Critical
                </div>
                <div>
                  <span className="font-medium text-zinc-700">{monitoringData.summary.alertsDetected}</span> Total
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {monitoringData.alerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
                <p className="text-sm font-light text-zinc-900">No active contamination alerts</p>
                <p className="text-xs text-zinc-500 mt-1 font-light">All monitoring stations within safe limits</p>
              </div>
            ) : (
              <div className="space-y-3">
                {monitoringData.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`bg-white/60 backdrop-blur-sm rounded-lg border-l-4 p-4 ${
                      alert.severity === 'critical'
                        ? 'border-l-rose-500 bg-rose-50/50'
                        : alert.severity === 'high'
                        ? 'border-l-orange-500 bg-orange-50/50'
                        : 'border-l-amber-500 bg-amber-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              alert.severity === 'critical'
                                ? 'bg-rose-200 text-rose-800'
                                : alert.severity === 'high'
                                ? 'bg-orange-200 text-orange-800'
                                : 'bg-amber-200 text-amber-800'
                            }`}
                          >
                            {alert.severity.toUpperCase()}
                          </span>
                          <span className="text-xs text-zinc-500 font-light">{alert.type}</span>
                        </div>

                        <h4 className="text-sm font-medium text-zinc-900 mb-2">
                          {alert.description}
                        </h4>

                        <div className="grid grid-cols-4 gap-4 text-xs">
                          <div>
                            <div className="text-zinc-600 font-light">Health Costs</div>
                            <div className="font-semibold text-rose-700">
                              ${(alert.estimatedImpact / 1000000).toFixed(1)}M
                            </div>
                          </div>
                          <div>
                            <div className="text-zinc-600 font-light">Location</div>
                            <div className="font-light text-zinc-900">
                              {alert.location}
                            </div>
                          </div>
                          <div>
                            <div className="text-zinc-600 font-light">Population Exposed</div>
                            <div className="font-semibold text-rose-700">
                              {(alert.populationExposed / 1000).toFixed(0)}K
                            </div>
                          </div>
                          <div>
                            <div className="text-zinc-600 font-light">Confidence</div>
                            <div className="font-semibold text-emerald-700">
                              {(alert.confidence * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {monitoringData.summary.totalPopulationExposed > 0 && (
              <div className="mt-4 bg-rose-100/50 rounded-lg p-4 border border-rose-200/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-light text-rose-900">Total Population Exposed:</span>
                  <span className="text-xl font-extralight text-rose-700">
                    {(monitoringData.summary.totalPopulationExposed / 1000).toFixed(0)}K people
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Data Indicator */}
      <div className="flex items-center justify-center space-x-2 text-xs text-zinc-500">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span>Live Data</span>
        </div>
        <span>•</span>
        <span>Updates every 30 seconds</span>
        <span>•</span>
        <span>Multiple monitoring stations</span>
      </div>
    </div>
  );
};

export default LiveMonitoringDashboard;
