'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Zap,
  CheckCircle,
  RefreshCw,
  ArrowLeft,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

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

export default function LiveMonitoringPage() {
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
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-lg font-light text-zinc-600">Loading real-time data...</p>
        </div>
      </div>
    );
  }

  const currentDemand = liveData.demand[0]?.value || 0;
  const avgDemand = liveData.demand.reduce((sum, d) => sum + d.value, 0) / liveData.demand.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100">
      {/* Header */}
      <section className="bg-white/95 backdrop-blur-md border-b border-zinc-200/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-4">
            <Link
              href="/?access=platform"
              className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors text-sm font-light"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-50 rounded-xl">
                  <Activity className="w-8 h-8 text-emerald-600" />
                </div>
                <h1 className="text-4xl font-extralight tracking-tight text-zinc-900">Live Constraint Monitoring</h1>
              </div>
              <p className="text-xl font-light text-zinc-600">
                Real-time monitoring with ACTUAL data from EIA, Weather APIs, and Commodity Markets
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Button
                onClick={fetchAllData}
                variant="outline"
                className="border-zinc-300 text-zinc-600 hover:bg-zinc-50 font-light rounded-xl"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>

              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-xl flex items-center gap-2 font-light transition-all ${
                  autoRefresh ? 'bg-emerald-600 text-white shadow-md' : 'bg-zinc-100 text-zinc-600'
                }`}
              >
                <Activity className={`w-4 h-4 ${autoRefresh ? 'animate-pulse' : ''}`} />
                {autoRefresh ? 'Live' : 'Paused'}
              </button>
            </div>
          </div>

          <div className="mt-4 text-sm font-light text-zinc-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
            {autoRefresh && ' • Auto-refresh every 30s'}
          </div>
        </div>
      </section>

      {/* Proven ROI Section - THE PROOF */}
      <section className="py-12 bg-emerald-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
            <h2 className="text-3xl font-extralight tracking-tight text-zinc-900">Proven ROI from Historical Analysis</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <Card className="p-6 bg-white/80 backdrop-blur-sm border border-zinc-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-xs font-light text-zinc-600 uppercase tracking-wide mb-2">Historical Events Analyzed</div>
              <div className="text-4xl font-extralight text-zinc-900">{backtestData.summary.totalEvents}</div>
              <div className="text-xs font-light text-zinc-500 mt-2">Documented constraint events</div>
            </Card>

            <Card className="p-6 bg-white/80 backdrop-blur-sm border border-zinc-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-xs font-light text-zinc-600 uppercase tracking-wide mb-2">Total Value Delivered</div>
              <div className="text-4xl font-extralight text-emerald-600">{backtestData.conclusions.totalValueDelivered}</div>
              <div className="text-xs font-light text-zinc-500 mt-2">In projected savings</div>
            </Card>

            <Card className="p-6 bg-white/80 backdrop-blur-sm border border-zinc-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-xs font-light text-zinc-600 uppercase tracking-wide mb-2">Proven ROI</div>
              <div className="text-4xl font-extralight text-emerald-600">{backtestData.conclusions.provenROI}</div>
              <div className="text-xs font-light text-zinc-500 mt-2">Return on investment</div>
            </Card>

            <Card className="p-6 bg-white/80 backdrop-blur-sm border border-zinc-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-xs font-light text-zinc-600 uppercase tracking-wide mb-2">Detection Speed Advantage</div>
              <div className="text-4xl font-extralight text-blue-600">{backtestData.conclusions.averageDetectionSpeed}</div>
              <div className="text-xs font-light text-zinc-500 mt-2">Faster than manual analysis</div>
            </Card>
          </div>

          <div className="mt-6 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50">
            <div className="flex items-center gap-2 text-sm font-light text-zinc-600">
              <Database className="w-4 h-4" />
              <span>
                Based on {backtestData.summary.totalEvents} documented historical events
                with {backtestData.conclusions.confidence} confidence level
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Real-Time Market Data */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-extralight tracking-tight text-zinc-900 mb-6">Real-Time Market Conditions</h2>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Gas Prices */}
            <Card className="p-6 bg-white/80 backdrop-blur-sm border border-zinc-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                  <h3 className="font-light text-zinc-900">Natural Gas Price</h3>
                </div>
                <span className="text-xs font-light bg-blue-50 text-blue-700 px-3 py-1 rounded-lg">
                  EIA Henry Hub
                </span>
              </div>

              <div className="text-4xl font-extralight text-zinc-900 mb-2">
                ${liveData.gasPrice.price.toFixed(2)}
              </div>
              <div className="text-sm font-light text-zinc-600">per MMBtu</div>

              <div className={`mt-4 flex items-center gap-2 font-light ${
                liveData.gasPrice.changePercent >= 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}>
                <TrendingUp className="w-4 h-4" />
                <span>
                  {liveData.gasPrice.changePercent >= 0 ? '+' : ''}
                  {liveData.gasPrice.changePercent.toFixed(1)}% vs yesterday
                </span>
              </div>
            </Card>

            {/* Electricity Demand */}
            <Card className="p-6 bg-white/80 backdrop-blur-sm border border-zinc-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-6 h-6 text-emerald-600" />
                  <h3 className="font-light text-zinc-900">PJM Demand</h3>
                </div>
                <span className="text-xs font-light bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg">
                  Live
                </span>
              </div>

              <div className="text-4xl font-extralight text-zinc-900 mb-2">
                {currentDemand.toFixed(0)}
              </div>
              <div className="text-sm font-light text-zinc-600">MW</div>

              <div className="mt-4 text-sm font-light text-zinc-600">
                24hr avg: {avgDemand.toFixed(0)} MW
                ({(((currentDemand - avgDemand) / avgDemand) * 100).toFixed(1)}% variance)
              </div>
            </Card>

            {/* Weather */}
            <Card className="p-6 bg-white/80 backdrop-blur-sm border border-zinc-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-6 h-6 text-amber-600" />
                  <h3 className="font-light text-zinc-900">Weather Conditions</h3>
                </div>
                <span className="text-xs font-light bg-amber-50 text-amber-700 px-3 py-1 rounded-lg">
                  Mid-Atlantic
                </span>
              </div>

              <div className="text-4xl font-extralight text-zinc-900 mb-2">
                {liveData.weather.temperature.toFixed(0)}°F
              </div>
              <div className="text-sm font-light text-zinc-600">{liveData.weather.conditions}</div>

              <div className="mt-4 text-sm font-light text-zinc-600">
                Wind: {liveData.weather.windSpeed.toFixed(0)} mph
              </div>
            </Card>
          </div>

          {/* Active Constraints */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-zinc-200/50 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
                <h3 className="text-xl font-extralight tracking-tight text-zinc-900">Active Constraints Detected</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm font-light">
                  <span className="font-medium text-rose-700">
                    {liveData.summary.criticalAlerts}
                  </span>{' '}
                  Critical
                </div>
                <div className="text-sm font-light">
                  <span className="font-medium text-zinc-700">
                    {liveData.summary.constraintsDetected}
                  </span>{' '}
                  Total
                </div>
              </div>
            </div>

            {liveData.constraints.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-emerald-600" />
                <p className="text-lg font-light text-zinc-900">No active constraints detected</p>
                <p className="text-sm font-light text-zinc-500 mt-2">All systems operating normally</p>
              </div>
            ) : (
              <div className="space-y-4">
                {liveData.constraints.map((constraint) => (
                  <div
                    key={constraint.id}
                    className={`border-l-4 p-4 rounded-r-2xl bg-white/60 backdrop-blur-sm ${
                      constraint.severity === 'critical'
                        ? 'border-rose-500'
                        : constraint.severity === 'high'
                        ? 'border-orange-500'
                        : 'border-amber-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-medium uppercase tracking-wide ${
                              constraint.severity === 'critical'
                                ? 'bg-rose-100 text-rose-700'
                                : constraint.severity === 'high'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {constraint.severity}
                          </span>
                          <span className="text-xs font-light text-zinc-500">{constraint.type}</span>
                        </div>

                        <h4 className="font-light text-zinc-900 mb-2">
                          {constraint.description}
                        </h4>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="font-light text-zinc-600">Estimated Impact</div>
                            <div className="font-extralight text-xl text-rose-600">
                              ${(constraint.estimatedImpact / 1000000).toFixed(1)}M
                            </div>
                          </div>
                          <div>
                            <div className="font-light text-zinc-600">Data Source</div>
                            <div className="font-light text-zinc-900">
                              {constraint.dataSource}
                            </div>
                          </div>
                          <div>
                            <div className="font-light text-zinc-600">Confidence</div>
                            <div className="font-extralight text-xl text-blue-600">
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
              <div className="mt-6 p-4 bg-rose-50 rounded-2xl border border-rose-200">
                <div className="flex items-center justify-between">
                  <span className="font-light text-rose-900">Total Financial Exposure:</span>
                  <span className="text-2xl font-extralight text-rose-600">
                    ${(liveData.summary.totalExposure / 1000000).toFixed(1)}M
                  </span>
                </div>
              </div>
            )}
          </Card>
        </div>
      </section>
    </div>
  );
}
