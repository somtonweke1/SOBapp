'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Users,
  GitBranch,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Network,
  Target,
  Layers
} from 'lucide-react';

interface CommunityProfile {
  community_id: number;
  size: number;
  members: Array<{ id: string; label: string }>;
  characteristics: {
    total_production: number;
    primary_commodities: Record<string, number>;
    avg_gdp_contribution: number;
    total_employment: number;
  };
}

interface MarketStructureResults {
  structure_type: 'highly_fragmented' | 'balanced' | 'consolidating' | 'monopolistic';
  modularity: number;
  community_count: number;
  herfindahl_index: number;
  strategic_insights: string[];
  dominant_players: Array<{
    nodeId: string;
    market_share: number;
    community: number;
  }>;
  community_profiles?: CommunityProfile[];
  modularity_score?: number;
  interpretation?: string;
  consolidation_risk?: {
    level: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    regulatory_concern: boolean;
  };
}

interface MarketStructureDashboardProps {
  network: {
    nodes: any[];
    edges: any[];
  };
}

export default function MarketStructureDashboard({ network }: MarketStructureDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MarketStructureResults | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<'market_structure' | 'communities' | 'consolidation'>('market_structure');
  const [selectedCommunity, setSelectedCommunity] = useState<number | null>(null);
  const [consolidationHistory, setConsolidationHistory] = useState<any[] | null>(null);

  const analyzeMarketStructure = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/mining/market-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          network,
          analysis_type: 'market_structure',
          options: {}
        })
      });

      const data = await response.json();
      if (data.success) {
        setResults(data.results);
      }
    } catch (error) {
      console.error('Market structure analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (network && network.nodes.length > 0) {
      analyzeMarketStructure();
    }
  }, [network]);

  const getStructureColor = (type: string) => {
    switch (type) {
      case 'monopolistic':
        return 'text-rose-600 bg-rose-100 border-rose-300';
      case 'consolidating':
        return 'text-amber-600 bg-amber-100 border-amber-300';
      case 'balanced':
        return 'text-green-600 bg-green-100 border-green-300';
      case 'highly_fragmented':
        return 'text-blue-600 bg-blue-100 border-blue-300';
      default:
        return 'text-zinc-600 bg-zinc-100 border-zinc-300';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'text-rose-700 bg-rose-50 border-rose-400';
      case 'high':
        return 'text-amber-700 bg-amber-50 border-amber-400';
      case 'medium':
        return 'text-amber-700 bg-amber-50 border-amber-400';
      case 'low':
        return 'text-green-700 bg-green-50 border-green-400';
      default:
        return 'text-zinc-700 bg-zinc-50 border-gray-400';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-lg">Analyzing market structure...</span>
        </div>
      </Card>
    );
  }

  if (!results) {
    return (
      <Card className="p-8">
        <p className="text-zinc-500 text-center">Load a network to analyze market structure</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Network className="w-6 h-6 text-blue-600" />
            Market Structure Analysis
          </h2>
          <p className="text-zinc-600 mt-1">
            Community detection, modularity analysis, and consolidation tracking
          </p>
        </div>
        <Button onClick={analyzeMarketStructure} disabled={loading}>
          Refresh Analysis
        </Button>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Structure Type */}
        <Card className={`p-4 border-2 ${getStructureColor(results.structure_type)}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">Market Structure</p>
              <p className="text-2xl font-bold mt-1 capitalize">
                {results.structure_type.replace('_', ' ')}
              </p>
            </div>
            <Layers className="w-8 h-8 opacity-70" />
          </div>
        </Card>

        {/* Modularity */}
        <Card className="p-4 border-2 border-emerald-300 bg-emerald-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700">Modularity Score</p>
              <p className="text-2xl font-bold mt-1 text-emerald-900">
                {results.modularity.toFixed(3)}
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                {results.interpretation || 'Moderate structure'}
              </p>
            </div>
            <GitBranch className="w-8 h-8 text-emerald-600" />
          </div>
        </Card>

        {/* HHI */}
        <Card className={`p-4 border-2 ${results.herfindahl_index > 2500 ? 'border-rose-300 bg-rose-50' : 'border-blue-300 bg-blue-50'}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-sm font-medium ${results.herfindahl_index > 2500 ? 'text-rose-700' : 'text-blue-700'}`}>
                Herfindahl Index
              </p>
              <p className={`text-2xl font-bold mt-1 ${results.herfindahl_index > 2500 ? 'text-rose-900' : 'text-blue-900'}`}>
                {results.herfindahl_index.toFixed(0)}
              </p>
              <p className={`text-xs mt-1 ${results.herfindahl_index > 2500 ? 'text-rose-600' : 'text-blue-600'}`}>
                {results.herfindahl_index > 2500 ? 'High concentration' : 'Competitive'}
              </p>
            </div>
            {results.herfindahl_index > 2500 ? (
              <AlertTriangle className="w-8 h-8 text-rose-600" />
            ) : (
              <CheckCircle className="w-8 h-8 text-blue-600" />
            )}
          </div>
        </Card>

        {/* Communities */}
        <Card className="p-4 border-2 border-indigo-300 bg-indigo-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-700">Communities Detected</p>
              <p className="text-2xl font-bold mt-1 text-indigo-900">
                {results.community_count}
              </p>
              <p className="text-xs text-indigo-600 mt-1">
                Distinct market segments
              </p>
            </div>
            <Users className="w-8 h-8 text-indigo-600" />
          </div>
        </Card>
      </div>

      {/* Consolidation Risk Alert */}
      {results.consolidation_risk && (
        <Card className={`p-6 border-2 ${getRiskColor(results.consolidation_risk.level)}`}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {results.consolidation_risk.level === 'critical' || results.consolidation_risk.level === 'high' ? (
                <AlertTriangle className="w-8 h-8" />
              ) : (
                <CheckCircle className="w-8 h-8" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold capitalize mb-1">
                {results.consolidation_risk.level} Consolidation Risk
              </h3>
              <p className="text-sm mb-3">{results.consolidation_risk.description}</p>
              {results.consolidation_risk.regulatory_concern && (
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Regulatory Scrutiny Likely</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Dominant Players */}
      {results.dominant_players && results.dominant_players.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Dominant Market Players
          </h3>
          <div className="space-y-3">
            {results.dominant_players.slice(0, 5).map((player, idx) => (
              <div key={player.nodeId} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{player.nodeId}</p>
                  <p className="text-sm text-zinc-600">Community {player.community}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-700">
                    {(player.market_share * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-zinc-500">Market share</p>
                </div>
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${player.market_share * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Community Profiles */}
      {results.community_profiles && results.community_profiles.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Community Profiles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.community_profiles.map((comm) => (
              <Card
                key={comm.community_id}
                className={`p-4 cursor-pointer transition-all border-2 ${selectedCommunity === comm.community_id ? 'border-emerald-500 bg-emerald-50' : 'border-zinc-200 hover:border-emerald-300'
                  }`}
                onClick={() => setSelectedCommunity(comm.community_id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-lg">Community {comm.community_id + 1}</h4>
                    <p className="text-sm text-zinc-600">{comm.size} operations</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-xl font-bold text-emerald-700">{comm.size}</span>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Production:</span>
                    <span className="font-semibold">
                      {formatNumber(comm.characteristics.total_production)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Employment:</span>
                    <span className="font-semibold">
                      {formatNumber(comm.characteristics.total_employment)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Avg GDP:</span>
                    <span className="font-semibold">
                      {comm.characteristics.avg_gdp_contribution.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {Object.keys(comm.characteristics.primary_commodities).length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs font-semibold text-zinc-700 mb-2">Primary Commodities:</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(comm.characteristics.primary_commodities).map(([commodity, count]) => (
                        <span
                          key={commodity}
                          className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full"
                        >
                          {commodity} ({count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCommunity === comm.community_id && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs font-semibold text-zinc-700 mb-2">Members:</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {comm.members.map((member) => (
                        <p key={member.id} className="text-xs text-zinc-600">
                          • {member.label}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Strategic Insights */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-900">
          <TrendingUp className="w-5 h-5" />
          Strategic Insights & Recommendations
        </h3>
        <div className="space-y-3">
          {results.strategic_insights.map((insight, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">{idx + 1}</span>
              </div>
              <p className="text-sm text-zinc-700 flex-1">{insight}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Modularity Interpretation */}
      <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200">
        <div className="flex items-start gap-4">
          <BarChart3 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-bold text-emerald-900 mb-2">
              Network Modularity Analysis
            </h3>
            <p className="text-sm text-zinc-700 leading-relaxed">
              {results.interpretation || `Modularity score of ${results.modularity.toFixed(3)} indicates ${results.modularity > 0.5 ? 'strong' : 'moderate'
                } community structure. `}
              {results.modularity > 0.6 && 'The network exhibits clear clustering with distinct regional or commodity-based communities.'}
              {results.modularity <= 0.6 && results.modularity > 0.3 && 'The market shows moderate segmentation with some interconnected communities.'}
              {results.modularity <= 0.3 && 'The network is highly integrated with weak community boundaries, suggesting a consolidated market.'}
            </p>
            <div className="mt-4 flex items-center gap-6">
              <div>
                <p className="text-xs text-zinc-600">Modularity Range</p>
                <div className="w-48 h-3 bg-gradient-to-r from-red-300 via-yellow-300 to-green-300 rounded-full mt-1 relative">
                  <div
                    className="absolute top-0 h-full w-1 bg-emerald-900 rounded-full"
                    style={{ left: `${Math.min(results.modularity * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-zinc-500 mt-1">
                  <span>0.0 (Weak)</span>
                  <span>1.0 (Strong)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
