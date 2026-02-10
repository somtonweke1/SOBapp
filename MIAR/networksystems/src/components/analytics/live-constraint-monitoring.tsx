'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Zap,
  CheckCircle,
  RefreshCw,
  Database
} from 'lucide-react';

interface LiveData {
  gasPrice: {
    price: number;
    change: number;
    changePercent: number;
  };
  demand: Array<{ period: string; value: number; units: string }>;
  weather: {
    temperature: number;
    conditions: string;
    windSpeed: number;
  };
  constraints: Array<{
    id: string;
    type: string;
    severity: string;
    description: string;
    estimatedImpact: number;
    dataSource: string;
    confidence: number;
  }>;
  summary: {
    constraintsDetected: number;
    criticalAlerts: number;
    totalExposure: number;
  };
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

const LiveConstraintMonitoring: React.FC = () => {
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [backtestData, setBacktestData] = useState<BacktestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchAllData();

    if (autoRefresh) {
      const interval = setInterval(fetchAllData, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchAllData = async () => {
    try {
      const [liveResponse, backtestResponse] = await Promise.all([
        fetch('/api/v1/live-monitoring?type=all'),
        fetch('/api/v1/backtest')
      ]);

      const liveJson = await liveResponse.json();
      const backtestJson = await backtestResponse.json();

      if (liveJson.success) {
        setLiveData(liveJson.data);
      }

      if (backtestJson.success) {
        setBacktestData(backtestJson.data);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !liveData || !backtestData) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-sm text-zinc-500 font-light">Loading real-time data...</p>
        </div>
      </div>
    );
  }

  const currentDemand = liveData.demand[0]?.value || 0;
  const avgDemand = liveData.demand.reduce((sum, d) => sum + d.value, 0) / liveData.demand.length;

  return (
    <div className="space-y-6">
      {/* Auto-refresh indicator */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-zinc-500 font-light">
          Last updated: {lastUpdate.toLocaleTimeString()}
          {autoRefresh && ' • Auto-refresh every 30s'}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchAllData}
            variant="outline"
            size="sm"
            className="border-zinc-300 text-zinc-600 hover:text-zinc-900 hover:border-zinc-400"
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Refresh
          </Button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-full text-xs font-light flex items-center gap-1.5 transition-all ${
              autoRefresh
                ? 'bg-emerald-500 text-white'
                : 'bg-zinc-200 text-zinc-600'
            }`}
          >
            <Activity className={`h-3 w-3 ${autoRefresh ? 'animate-pulse' : ''}`} />
            {autoRefresh ? 'Live' : 'Paused'}
          </button>
        </div>
      </div>

      {/* Proven ROI Section */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
        <div className="border-b border-zinc-200/50 px-6 py-4 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <h3 className="text-lg font-extralight text-zinc-900">Proven ROI from Historical Analysis</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4 bg-white/60 backdrop-blur-sm border-zinc-200/50">
              <div className="text-xs text-zinc-500 mb-1 font-light">Historical Events</div>
              <div className="text-2xl font-extralight text-zinc-900">{backtestData.summary.totalEvents}</div>
              <div className="text-xs text-zinc-500 mt-1">Documented events</div>
            </Card>

            <Card className="p-4 bg-white/60 backdrop-blur-sm border-zinc-200/50">
              <div className="text-xs text-zinc-500 mb-1 font-light">Value Delivered</div>
              <div className="text-2xl font-extralight text-emerald-600">{backtestData.conclusions.totalValueDelivered}</div>
              <div className="text-xs text-zinc-500 mt-1">Projected savings</div>
            </Card>

            <Card className="p-4 bg-white/60 backdrop-blur-sm border-zinc-200/50">
              <div className="text-xs text-zinc-500 mb-1 font-light">Proven ROI</div>
              <div className="text-2xl font-extralight text-emerald-600">{backtestData.conclusions.provenROI}</div>
              <div className="text-xs text-zinc-500 mt-1">Return on investment</div>
            </Card>

            <Card className="p-4 bg-white/60 backdrop-blur-sm border-zinc-200/50">
              <div className="text-xs text-zinc-500 mb-1 font-light">Detection Speed</div>
              <div className="text-2xl font-extralight text-zinc-900">{backtestData.conclusions.averageDetectionSpeed}</div>
              <div className="text-xs text-zinc-500 mt-1">Faster response</div>
            </Card>
          </div>

          <div className="mt-4 p-3 bg-zinc-50/50 rounded-lg border border-zinc-200/50">
            <div className="flex items-center gap-2 text-xs text-zinc-600">
              <Database className="h-3 w-3" />
              <span className="font-light">
                Based on {backtestData.summary.totalEvents} documented historical events
                with {backtestData.conclusions.confidence} confidence level
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Market Conditions */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
        <div className="border-b border-zinc-200/50 px-6 py-4">
          <h3 className="text-lg font-extralight text-zinc-900">Real-Time Market Conditions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4">
            {/* Gas Prices */}
            <Card className="p-4 bg-white/60 backdrop-blur-sm border-zinc-200/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-zinc-600" />
                  <h4 className="text-sm font-light text-zinc-900">Natural Gas Price</h4>
                </div>
                <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded font-light">
                  EIA Henry Hub
                </span>
              </div>

              <div className="text-3xl font-extralight text-zinc-900 mb-1">
                ${liveData.gasPrice.price.toFixed(2)}
              </div>
              <div className="text-xs text-zinc-500 font-light">per MMBtu</div>

              <div className={`mt-3 flex items-center gap-1.5 text-xs font-light ${
                liveData.gasPrice.changePercent >= 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}>
                <TrendingUp className="h-3 w-3" />
                <span>
                  {liveData.gasPrice.changePercent >= 0 ? '+' : ''}
                  {liveData.gasPrice.changePercent.toFixed(1)}% vs yesterday
                </span>
              </div>
            </Card>

            {/* Electricity Demand */}
            <Card className="p-4 bg-white/60 backdrop-blur-sm border-zinc-200/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-zinc-600" />
                  <h4 className="text-sm font-light text-zinc-900">PJM Demand</h4>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-light">
                  Live
                </span>
              </div>

              <div className="text-3xl font-extralight text-zinc-900 mb-1">
                {currentDemand.toFixed(0)}
              </div>
              <div className="text-xs text-zinc-500 font-light">MW</div>

              <div className="mt-3 text-xs text-zinc-600 font-light">
                24hr avg: {avgDemand.toFixed(0)} MW
                ({(((currentDemand - avgDemand) / avgDemand) * 100).toFixed(1)}% variance)
              </div>
            </Card>

            {/* Weather */}
            <Card className="p-4 bg-white/60 backdrop-blur-sm border-zinc-200/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-zinc-600" />
                  <h4 className="text-sm font-light text-zinc-900">Weather</h4>
                </div>
                <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded font-light">
                  Mid-Atlantic
                </span>
              </div>

              <div className="text-3xl font-extralight text-zinc-900 mb-1">
                {liveData.weather.temperature.toFixed(0)}°F
              </div>
              <div className="text-xs text-zinc-500 font-light">{liveData.weather.conditions}</div>

              <div className="mt-3 text-xs text-zinc-600 font-light">
                Wind: {liveData.weather.windSpeed.toFixed(0)} mph
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Active Constraints */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
        <div className="border-b border-zinc-200/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              <h3 className="text-lg font-extralight text-zinc-900">Active Constraints Detected</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs font-light">
                <span className="font-semibold text-rose-700">
                  {liveData.summary.criticalAlerts}
                </span>{' '}
                Critical
              </div>
              <div className="text-xs font-light">
                <span className="font-semibold text-zinc-700">
                  {liveData.summary.constraintsDetected}
                </span>{' '}
                Total
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {liveData.constraints.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
              <p className="text-sm font-light text-zinc-900">No active constraints detected</p>
              <p className="text-xs text-zinc-500 mt-1 font-light">All systems operating normally</p>
            </div>
          ) : (
            <div className="space-y-3">
              {liveData.constraints.map((constraint) => (
                <div
                  key={constraint.id}
                  className={`border-l-4 p-4 rounded-r-lg ${
                    constraint.severity === 'critical'
                      ? 'border-rose-500 bg-rose-50/50'
                      : constraint.severity === 'high'
                      ? 'border-orange-500 bg-orange-50/50'
                      : 'border-amber-500 bg-amber-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            constraint.severity === 'critical'
                              ? 'bg-rose-200 text-rose-800'
                              : constraint.severity === 'high'
                              ? 'bg-orange-200 text-orange-800'
                              : 'bg-amber-200 text-amber-800'
                          }`}
                        >
                          {constraint.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-zinc-500 font-light">{constraint.type}</span>
                      </div>

                      <h4 className="text-sm font-light text-zinc-900 mb-2">
                        {constraint.description}
                      </h4>

                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <div className="text-zinc-600 font-light">Estimated Impact</div>
                          <div className="font-semibold text-rose-700">
                            ${(constraint.estimatedImpact / 1000000).toFixed(1)}M
                          </div>
                        </div>
                        <div>
                          <div className="text-zinc-600 font-light">Data Source</div>
                          <div className="font-light text-zinc-900">
                            {constraint.dataSource}
                          </div>
                        </div>
                        <div>
                          <div className="text-zinc-600 font-light">Confidence</div>
                          <div className="font-semibold text-blue-700">
                            {(constraint.confidence * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {liveData.summary.totalExposure > 0 && (
            <div className="mt-4 p-3 bg-rose-100/50 rounded-lg border border-rose-200/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-light text-rose-900">Total Financial Exposure:</span>
                <span className="text-xl font-extralight text-rose-700">
                  ${(liveData.summary.totalExposure / 1000000).toFixed(1)}M
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveConstraintMonitoring;
