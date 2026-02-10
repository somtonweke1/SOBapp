'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { AFRICAN_MINING_OPERATIONS, NETWORK_CONNECTIONS } from '@/services/african-mining-network';
import { REAL_JOHANNESBURG_MINES } from '@/services/real-mining-data';
import { Network } from '@/stores/network-store';
import { usePortfolioData, useCommodityPrices, useMarketIntelligence } from '@/hooks/use-live-data';
import {
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Target,
  BarChart3,
  Shield,
  Activity,
  Zap
} from 'lucide-react';

interface PortfolioAsset {
  id: string;
  name: string;
  allocation: number;
  value: number;
  networkNode: string;
  risk: 'low' | 'medium' | 'high';
  correlation: number[];
}

interface RiskMetrics {
  systemicRisk: number;
  concentrationRisk: number;
  correlationRisk: number;
  liquidityRisk: number;
  overallScore: number;
}

interface Recommendation {
  id: string;
  type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: {
    title: string;
    description: string;
    cost: number;
    benefit: number;
    roi: number;
  };
  impact: {
    financial: number;
    riskReduction: number;
  };
}

const InvestmentPortfolioOptimization: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PortfolioAsset[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics>({
    systemicRisk: 0,
    concentrationRisk: 0,
    correlationRisk: 0,
    liquidityRisk: 0,
    overallScore: 0
  });
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  // Live data hooks
  const { data: portfolioLiveData, lastUpdated: portfolioUpdated } = usePortfolioData();
  const { data: commodityData, lastUpdated: commodityUpdated } = useCommodityPrices();
  const { data: marketIntel, lastUpdated: intelUpdated } = useMarketIntelligence();

  useEffect(() => {
    // Fetch real portfolio recommendations from constraint engine
    fetchRecommendations();
  }, []);

  // Update portfolio from real live data when available
  useEffect(() => {
    if (portfolioLiveData && portfolioLiveData.holdings) {
      const realPortfolio: PortfolioAsset[] = portfolioLiveData.holdings.map((holding: any) => ({
        id: holding.id || `holding_${holding.name.toLowerCase().replace(/\s+/g, '_')}`,
        name: holding.name,
        allocation: holding.allocation || 0,
        value: holding.value || 0,
        networkNode: holding.networkNode || holding.id,
        risk: holding.risk || 'medium',
        correlation: holding.correlation || [0.5, 0.5, 0.5, 0.5, 0.5]
      }));

      setPortfolio(realPortfolio);
      calculateRiskMetrics(realPortfolio);
    }
  }, [portfolioLiveData]);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/v1/portfolio/recommendations');

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setRecommendations(result.data);
      }
    } catch (error) {
      console.error('Error fetching portfolio recommendations:', error);
      // Keep empty recommendations on error
    }
  };

  const calculateRiskMetrics = (portfolioData: PortfolioAsset[]) => {
    const systemicRisk = portfolioData.reduce((acc, asset) => {
      const centralityWeight = asset.risk === 'high' ? 0.8 : asset.risk === 'medium' ? 0.5 : 0.2;
      return acc + (asset.allocation / 100) * centralityWeight;
    }, 0) * 100;

    const concentrationRisk = Math.max(...portfolioData.map(a => a.allocation));

    const avgCorrelation = portfolioData.reduce((acc, asset) => {
      const avgAssetCorr = asset.correlation.reduce((sum, corr) => sum + corr, 0) / asset.correlation.length;
      return acc + avgAssetCorr * (asset.allocation / 100);
    }, 0) * 100;

    const liquidityRisk = portfolioData.reduce((acc, asset) => {
      const liquidityScore = asset.risk === 'high' ? 0.7 : asset.risk === 'medium' ? 0.4 : 0.1;
      return acc + (asset.allocation / 100) * liquidityScore;
    }, 0) * 100;

    const overallScore = (systemicRisk + concentrationRisk + avgCorrelation + liquidityRisk) / 4;

    setRiskMetrics({
      systemicRisk,
      concentrationRisk,
      correlationRisk: avgCorrelation,
      liquidityRisk,
      overallScore
    });
  };

  return (
    <div className="space-y-8">
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
        <div className="border-b border-zinc-200/50 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-extralight text-zinc-900 tracking-tight">Investment Portfolio Optimization</h2>
              <p className="text-sm text-zinc-500 mt-2 font-light">Network-based risk analysis and portfolio intelligence</p>
            </div>
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <div className="text-xl font-light text-zinc-900">
                  ${portfolioLiveData ? portfolioLiveData.total_value.toFixed(1) : '2450.0'}M
                </div>
                <div className="text-xs text-zinc-400 uppercase tracking-wider font-light">Portfolio Value</div>
                {portfolioUpdated && (
                  <div className="flex items-center justify-center space-x-1 mt-1">
                    <Activity className="h-3 w-3 text-emerald-500" />
                    <span className="text-xs text-emerald-500">Live</span>
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className={`text-xl font-light ${
                  portfolioLiveData ?
                    (portfolioLiveData.daily_pnl >= 0 ? 'text-emerald-600' : 'text-rose-600') :
                    'text-emerald-600'
                }`}>
                  {portfolioLiveData ?
                    `${portfolioLiveData.daily_pnl >= 0 ? '+' : ''}${portfolioLiveData.daily_pnl.toFixed(1)}M` :
                    '+45.2M'
                  }
                </div>
                <div className="text-xs text-zinc-400 uppercase tracking-wider font-light">Daily P&L</div>
                {commodityData && commodityData.gold && (
                  <div className="text-xs text-zinc-500 mt-1">
                    Gold: ${commodityData.gold.current}/oz {commodityData.gold.daily_change >= 0 ? '↗' : '↘'} {Math.abs(commodityData.gold.daily_change).toFixed(1)}%
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="text-xl font-light text-amber-500">
                  {portfolioLiveData ? portfolioLiveData.risk_score.toFixed(0) : '73'}%
                </div>
                <div className="text-xs text-zinc-400 uppercase tracking-wider font-light">Systemic Risk</div>
                {portfolioUpdated && (
                  <div className="text-xs text-zinc-500 mt-1">
                    Updated {portfolioUpdated.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
          <div className="border-b border-zinc-200/50 px-6 py-4">
            <h3 className="text-lg font-light text-zinc-900">Risk Analysis</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Shield className="h-4 w-4 text-rose-500" />
                  <span className="text-sm font-light text-zinc-700">Systemic Risk</span>
                </div>
                <span className="text-sm font-medium text-rose-600">{riskMetrics.systemicRisk.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-zinc-200 rounded-full h-2">
                <div
                  className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${riskMetrics.systemicRisk}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Target className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-light text-zinc-700">Concentration Risk</span>
                </div>
                <span className="text-sm font-medium text-amber-600">{riskMetrics.concentrationRisk.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-zinc-200 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${riskMetrics.concentrationRisk}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-zinc-50 rounded-lg p-4 mt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-700">Overall Risk Score</span>
                <span className={`text-lg font-semibold ${riskMetrics.overallScore > 60 ? 'text-rose-600' : riskMetrics.overallScore > 40 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {riskMetrics.overallScore.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
          <div className="border-b border-zinc-200/50 px-6 py-4">
            <h3 className="text-lg font-light text-zinc-900">Portfolio Holdings</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {portfolio.length > 0 ? (
                portfolio.map((asset, idx) => (
                  <div
                    key={asset.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedAsset === asset.id
                        ? 'border-blue-300 bg-blue-50/50'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                    onClick={() => setSelectedAsset(selectedAsset === asset.id ? null : asset.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-zinc-900">{asset.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${
                          asset.risk === 'high' ? 'bg-rose-500' :
                          asset.risk === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}></span>
                        <span className="text-xs text-zinc-500">{asset.risk}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-600">{asset.allocation}% allocation</span>
                      <span className="text-sm font-medium text-emerald-600">${asset.value}M</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-zinc-500">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-zinc-300 animate-pulse" />
                  <p>Loading portfolio holdings...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
        <div className="border-b border-zinc-200/50 px-8 py-6">
          <h3 className="text-xl font-extralight text-zinc-900 tracking-tight">Actionable Intelligence</h3>
          <p className="text-sm text-zinc-500 mt-1">AI-powered recommendations from constraint engine analysis</p>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {recommendations.length > 0 ? (
              recommendations.slice(0, 3).map((rec) => {
                const isRiskReduction = rec.type === 'risk_reduction' || rec.priority === 'critical';
                const isOpportunity = rec.type === 'opportunity';
                const theme = isRiskReduction ? 'rose' : isOpportunity ? 'emerald' : 'amber';

                const Icon = isRiskReduction ? AlertTriangle : isOpportunity ? TrendingUp : DollarSign;

                const badgeText = isRiskReduction ? 'HIGH PRIORITY' : isOpportunity ? 'OPPORTUNITY' : rec.priority.toUpperCase();

                return (
                  <div
                    key={rec.id}
                    className={`bg-gradient-to-br from-${theme}-50/50 to-${theme}-100/30 rounded-xl p-6 border border-${theme}-200/30`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Icon className={`h-5 w-5 text-${theme}-500`} />
                      <span className={`bg-${theme}-500 text-white px-3 py-1 rounded-full text-xs font-light`}>
                        {badgeText}
                      </span>
                    </div>
                    <h4 className="font-light text-zinc-900 mb-2">{rec.title}</h4>
                    <p className="text-sm text-zinc-600 mb-4 font-light">{rec.description}</p>
                    <div className="text-sm">
                      <span className="text-zinc-500">Recommended Action:</span>
                      <span className="font-light text-zinc-900 ml-2">{rec.action.title}</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-zinc-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500">Expected Benefit:</span>
                        <span className={`font-medium text-${theme}-600`}>
                          ${(rec.action.benefit / 1000000).toFixed(0)}M
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-zinc-500">ROI:</span>
                        <span className={`font-medium text-${theme}-600`}>
                          {rec.action.roi.toFixed(1)}x
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-3 text-center py-8 text-zinc-500">
                <Zap className="h-8 w-8 mx-auto mb-2 text-zinc-300" />
                <p>Loading AI-powered recommendations...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentPortfolioOptimization;