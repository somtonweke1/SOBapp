'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Globe,
  Shield,
  Activity,
  MapPin,
  Clock
} from 'lucide-react';

interface GeopoliticalRisk {
  country: string;
  materials: string[];
  riskScore: number;
  factors: {
    political_stability: number;
    trade_restrictions: number;
    infrastructure: number;
    environmental_regulations: number;
    labor_relations: number;
  };
  trend: 'improving' | 'stable' | 'deteriorating';
  lastUpdated: string;
  dataSources?: string[]; // REAL DATA SOURCES
  esgData?: any; // Full ESG data from verified sources
}

interface SupplyChainEvent {
  id: string;
  type: 'disruption' | 'policy_change' | 'new_source' | 'capacity_expansion' | 'mine_closure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedMaterials: string[];
  country: string;
  description: string;
  impact: string;
  startDate: string;
  endDate?: string;
  probabilityEstimate?: number;
  source?: string; // NEWS SOURCE
  sourceUrl?: string; // LINK TO ARTICLE
  verified?: boolean; // IS THIS REAL NEWS?
}

interface GeopoliticalRiskDashboardProps {
  region?: 'africa' | 'global';
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function GeopoliticalRiskDashboard({
  region = 'global',
  autoRefresh = false,
  refreshInterval = 300
}: GeopoliticalRiskDashboardProps) {
  const [risks, setRisks] = useState<Record<string, GeopoliticalRisk>>({});
  const [events, setEvents] = useState<SupplyChainEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [view, setView] = useState<'overview' | 'country_detail' | 'events' | 'heatmap'>('overview');

  useEffect(() => {
    loadRiskData();

    if (autoRefresh) {
      const interval = setInterval(loadRiskData, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [region, autoRefresh, refreshInterval]);

  const loadRiskData = async () => {
    try {
      setLoading(true);

      const [riskResponse, eventResponse] = await Promise.all([
        fetch('/api/sc-gep/market-intelligence?type=risks'),
        fetch('/api/sc-gep/market-intelligence?type=events')
      ]);

      if (riskResponse.ok) {
        const riskData = await riskResponse.json();
        setRisks(riskData.data);
      }

      if (eventResponse.ok) {
        const eventData = await eventResponse.json();
        setEvents(eventData.data);
      }
    } catch (error) {
      console.error('Failed to load risk data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number): string => {
    if (score >= 70) return 'text-rose-600 bg-rose-50 border-rose-200';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    if (score >= 30) return 'text-amber-500 bg-amber-50 border-amber-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'high':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-300';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingDown className="w-4 h-4 text-emerald-600" />;
    if (trend === 'deteriorating') return <TrendingUp className="w-4 h-4 text-rose-600" />;
    return <Activity className="w-4 h-4 text-zinc-600" />;
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'disruption':
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      case 'policy_change':
        return <Shield className="w-5 h-5 text-amber-600" />;
      case 'new_source':
        return <Globe className="w-5 h-5 text-emerald-600" />;
      case 'capacity_expansion':
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
      case 'mine_closure':
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      default:
        return <Activity className="w-5 h-5 text-zinc-600" />;
    }
  };

  const criticalEvents = events.filter(e => e.severity === 'critical');
  const avgRiskScore = Object.values(risks).reduce((sum, r) => sum + r.riskScore, 0) / Object.keys(risks).length || 0;
  const deterioratingCountries = Object.values(risks).filter(r => r.trend === 'deteriorating').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-zinc-600">Loading geopolitical risk data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extralight text-zinc-900 mb-2 tracking-tight">
              Geopolitical Risk Analysis
            </h1>
            <p className="text-zinc-600 font-light">
              Strategic mining supply chain risk monitoring and intelligence
            </p>
          </div>
          <button
            onClick={loadRiskData}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-light"
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Refresh Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/60 backdrop-blur-sm border border-zinc-200/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
          </div>
          <div className="text-3xl font-extralight text-zinc-900 mb-1">
            {criticalEvents.length}
          </div>
          <div className="text-sm text-zinc-600 font-light">Critical Alerts</div>
        </div>

        <div className="bg-white/60 backdrop-blur-sm border border-zinc-200/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <Globe className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="text-3xl font-extralight text-zinc-900 mb-1">
            {Object.keys(risks).length}
          </div>
          <div className="text-sm text-zinc-600 font-light">Countries Monitored</div>
        </div>

        <div className="bg-white/60 backdrop-blur-sm border border-zinc-200/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-extralight text-zinc-900 mb-1">
            {avgRiskScore.toFixed(0)}
          </div>
          <div className="text-sm text-zinc-600 font-light">Average Risk Score</div>
        </div>

        <div className="bg-white/60 backdrop-blur-sm border border-zinc-200/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
              <TrendingUp className="w-6 h-6 text-rose-600" />
            </div>
          </div>
          <div className="text-3xl font-extralight text-zinc-900 mb-1">
            {deterioratingCountries}
          </div>
          <div className="text-sm text-zinc-600 font-light">Deteriorating Trends</div>
        </div>
      </div>

      <div className="flex space-x-2 bg-white/60 backdrop-blur-sm rounded-full p-1 border border-zinc-200/50 inline-flex">
        {(['overview', 'country_detail', 'events', 'heatmap'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded-full text-sm font-light transition-all ${
              view === v
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/50'
            }`}
          >
            {v.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </button>
        ))}
      </div>

      {view === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/60 backdrop-blur-sm border border-zinc-200/50 rounded-2xl p-6">
            <h2 className="text-xl font-light text-zinc-900 mb-6">Country Risk Rankings</h2>
            <div className="space-y-4">
              {Object.entries(risks)
                .sort((a, b) => b[1].riskScore - a[1].riskScore)
                .map(([country, risk]) => (
                  <div
                    key={country}
                    className="p-4 border border-zinc-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedCountry(country);
                      setView('country_detail');
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-zinc-400" />
                        <div>
                          <div className="font-medium text-zinc-900">{country}</div>
                          <div className="text-sm text-zinc-500">
                            {risk.materials.length} critical materials
                          </div>
                        </div>
                      </div>
                      {getTrendIcon(risk.trend)}
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-zinc-600">Risk Score</div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(risk.riskScore)}`}>
                        {risk.riskScore}
                      </div>
                    </div>
                    {risk.dataSources && risk.dataSources.length > 0 && (
                      <div className="text-xs text-emerald-600 mt-2">
                        ✓ Verified: {risk.dataSources[0].split(' ')[0]}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-zinc-200/50 rounded-2xl p-6">
            <h2 className="text-xl font-light text-zinc-900 mb-6">Recent Supply Chain Events</h2>
            <div className="space-y-4">
              {events.slice(0, 5).map((event) => (
                <div
                  key={event.id}
                  className={`p-4 border rounded-lg ${getSeverityColor(event.severity)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getEventTypeIcon(event.type)}
                      <div className="font-medium">{event.country}</div>
                    </div>
                    <div className="text-xs px-2 py-1 bg-white/50 rounded">
                      {event.severity.toUpperCase()}
                    </div>
                  </div>
                  <div className="text-sm mb-2">{event.description}</div>
                  <div className="text-xs text-zinc-600 mb-2">
                    <strong>Impact:</strong> {event.impact}
                  </div>
                  {event.source && (
                    <div className="text-xs text-emerald-600 mb-2 font-medium">
                      ✓ Source: {event.source} {event.verified && '(Verified)'}
                      {event.sourceUrl && (
                        <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="ml-2 underline hover:text-emerald-700">
                          View Article →
                        </a>
                      )}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {event.affectedMaterials.map((material) => (
                      <span
                        key={material}
                        className="text-xs px-2 py-1 bg-white/70 rounded"
                      >
                        {material}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'events' && (
        <div className="bg-white/60 backdrop-blur-sm border border-zinc-200/50 rounded-2xl p-6">
          <h2 className="text-xl font-light text-zinc-900 mb-6">All Supply Chain Events</h2>
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className={`p-6 border rounded-lg ${getSeverityColor(event.severity)}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getEventTypeIcon(event.type)}
                    <div>
                      <div className="font-medium text-lg">{event.country}</div>
                      <div className="text-sm text-zinc-600 capitalize">
                        {event.type.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs px-3 py-1 rounded-full font-medium ${getSeverityColor(event.severity)}`}>
                      {event.severity.toUpperCase()}
                    </div>
                    {event.probabilityEstimate && (
                      <div className="text-xs text-zinc-600 mt-2">
                        Probability: {(event.probabilityEstimate * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                </div>
                <div className="mb-3">{event.description}</div>
                <div className="text-sm text-zinc-600 mb-4">
                  <strong>Impact:</strong> {event.impact}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {event.affectedMaterials.map((material) => (
                      <span
                        key={material}
                        className="text-xs px-3 py-1 bg-white/70 border border-zinc-300 rounded-full"
                      >
                        {material}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-zinc-600">
                    {new Date(event.startDate).toLocaleDateString()}
                    {event.endDate && ` - ${new Date(event.endDate).toLocaleDateString()}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
