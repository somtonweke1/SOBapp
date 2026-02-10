'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useEnterpriseStore } from '@/stores/enterprise-store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ServerIcon3D, PlantIcon3D, Icon3D } from '@/components/ui/icon-3d';
import { BarChart3, Building2, CheckCircle, Pickaxe, TrendingUp, DollarSign, Wrench, Clipboard } from 'lucide-react';

const EnterpriseDashboard: React.FC = () => {
  const {
    currentClient,
    assets,
    assetAlerts,
    compliance,
    complianceScore,
    tailingsSites,
    clientMetrics,
    loading,
    error,
    loadAssets,
    loadCompliance,
    calculateClientValue,
    analyzeTailings,
    optimizeProduction,
    acknowledgeAlert
  } = useEnterpriseStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'compliance' | 'tailings' | 'analytics'>('overview');

  // Memoize client ID to avoid unnecessary effect triggers
  const clientId = useMemo(() => currentClient?.id, [currentClient?.id]);

  // Memoize expensive asset calculations to avoid recalculating on every render
  const assetMetrics = useMemo(() => {
    const operational = assets.filter(a => a.status === 'operational').length;
    const maintenance = assets.filter(a => a.status === 'maintenance').length;
    const faults = assets.filter(a => a.status === 'fault').length;
    const avgEfficiency = assets.length > 0 
      ? (assets.reduce((sum, a) => sum + a.efficiency, 0) / assets.length).toFixed(1)
      : '0';
    const totalUptime = assets.reduce((sum, a) => sum + a.uptime, 0).toFixed(1);
    const highRiskAssets = assets.filter(a => a.faultPrediction.probability > 0.7).length;
    const potentialSavings = assets.reduce((sum, a) => sum + (a.faultPrediction.probability * a.faultPrediction.potentialCost), 0);
    
    return {
      operational,
      maintenance,
      faults,
      avgEfficiency,
      totalUptime,
      highRiskAssets,
      potentialSavings
    };
  }, [assets]);

  // Load data on mount - memoized dependencies
  useEffect(() => {
    if (clientId) {
      loadAssets(clientId);
      loadCompliance(clientId);
      calculateClientValue(clientId);
    }
  }, [clientId, loadAssets, loadCompliance, calculateClientValue]);

  const handleRunTailingsAnalysis = async () => {
    const sampleSite = {
      id: 'tailings-001',
      name: 'Witwatersrand Tailings Complex',
      location: { lat: -26.2041, lng: 28.0473 },
      volume: 2500000,
      minerals: {
        'gold': 1.8,
        'silver': 12.3,
        'uranium': 0.15,
        'copper': 0.6
      }
    };
    
    await analyzeTailings(sampleSite);
  };

  const handleRunProductionOptimization = async () => {
    if (currentClient) {
      await optimizeProduction(currentClient.id);
    }
  };

  if (!currentClient) {
    return (
      <div className="p-6">
        <div className="text-center text-zinc-500">
          No client selected. Please select a client to view dashboard.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-zinc-900">MIAR Enterprise</h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-zinc-500">Client:</span>
                <span className="font-semibold text-zinc-900">{currentClient.name}</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  currentClient.tier === 'enterprise' ? 'bg-emerald-100 text-emerald-800' :
                  currentClient.tier === 'professional' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {currentClient.tier.charAt(0).toUpperCase() + currentClient.tier.slice(1)}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-zinc-500">Contract Value:</span>
              <span className="text-lg font-bold text-green-600">
                ${currentClient.contractValue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
              { id: 'assets', name: 'Asset Monitoring', icon: <Building2 className="h-4 w-4" /> },
              { id: 'compliance', name: 'Compliance', icon: <CheckCircle className="h-4 w-4" /> },
              { id: 'tailings', name: 'Tailings Analysis', icon: <Pickaxe className="h-4 w-4" /> },
              { id: 'analytics', name: 'Analytics & ROI', icon: <TrendingUp className="h-4 w-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
                }`}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded mb-6">
            {error}
            <Button onClick={() => useEnterpriseStore.getState().setError(null)} className="ml-2 text-sm" variant="outline">
              Dismiss
            </Button>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics with 3D Icons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 group hover:shadow-xl transition-all">
                <div className="flex items-center">
                  <ServerIcon3D size="sm" color="emerald" />
                  <div className="ml-4">
                    <p className="text-sm text-zinc-500">Monthly Savings</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${clientMetrics.costSavings.toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 group hover:shadow-xl transition-all">
                <div className="flex items-center">
                  <ServerIcon3D size="sm" color="blue" />
                  <div className="ml-4">
                    <p className="text-sm text-zinc-500">Efficiency Gains</p>
                    <p className="text-2xl font-bold text-blue-600">
                      +{clientMetrics.efficiencyGains.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 group hover:shadow-xl transition-all">
                <div className="flex items-center">
                  <ServerIcon3D size="sm" color="cyan" />
                  <div className="ml-4">
                    <p className="text-sm text-zinc-500">Compliance Score</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {complianceScore}%
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 group hover:shadow-xl transition-all">
                <div className="flex items-center">
                  <Icon3D variant="custom" size="sm" color="rose">
                    <div className="text-xl">!</div>
                  </Icon3D>
                  <div className="ml-4">
                    <p className="text-sm text-zinc-500">Active Alerts</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {assetAlerts.filter(alert => !alert.acknowledged).length}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Actions with 3D Icons */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button
                  onClick={handleRunTailingsAnalysis}
                  className="h-24 flex flex-col items-center justify-center space-y-3 group"
                  variant="outline"
                >
                  <PlantIcon3D size="sm" color="amber" />
                  <span>Analyze Tailings Site</span>
                </Button>
                <Button
                  onClick={handleRunProductionOptimization}
                  className="h-24 flex flex-col items-center justify-center space-y-3 group"
                  variant="outline"
                >
                  <ServerIcon3D size="sm" color="blue" />
                  <span>Optimize Production</span>
                </Button>
                <Button
                  onClick={() => setActiveTab('compliance')}
                  className="h-24 flex flex-col items-center justify-center space-y-3 group"
                  variant="outline"
                >
                  <ServerIcon3D size="sm" color="cyan" />
                  <span>Compliance Check</span>
                </Button>
              </div>
            </Card>

            {/* Critical Alerts */}
            {assetAlerts.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Critical Alerts</h3>
                <div className="space-y-3">
                  {assetAlerts.slice(0, 3).map((alert, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-lg border-l-4 ${
                        alert.severity === 'critical' ? 'border-rose-500 bg-rose-50' :
                        alert.severity === 'warning' ? 'border-orange-500 bg-orange-50' :
                        'border-blue-500 bg-blue-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{alert.assetId}</h4>
                          <p className="text-sm text-zinc-600 mt-1">{alert.message}</p>
                          <p className="text-xs text-zinc-500 mt-2">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {!alert.acknowledged && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => acknowledgeAlert(alert.assetId)}
                          >
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Asset Monitoring</h2>
              <Button onClick={() => loadAssets(currentClient.id)} disabled={loading.assets}>
                {loading.assets ? 'Refreshing...' : 'Refresh Data'}
              </Button>
            </div>

            {/* Asset Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Asset Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Operational:</span>
                    <span className="font-bold text-green-600">
                      {assetMetrics.operational}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Maintenance:</span>
                    <span className="font-bold text-orange-600">
                      {assetMetrics.maintenance}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Faults:</span>
                    <span className="font-bold text-rose-600">
                      {assetMetrics.faults}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Performance</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Avg Efficiency:</span>
                    <span className="font-bold text-blue-600">
                      {assetMetrics.avgEfficiency}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Uptime:</span>
                    <span className="font-bold text-green-600">
                      {assetMetrics.totalUptime}h
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Predictions</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>High Risk Assets:</span>
                    <span className="font-bold text-rose-600">
                      {assetMetrics.highRiskAssets}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Potential Savings:</span>
                    <span className="font-bold text-green-600">
                      ${assetMetrics.potentialSavings.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Asset Details */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Asset Details</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Asset ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Efficiency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Risk Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assets.map((asset) => (
                      <tr key={asset.assetId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                          {asset.assetId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                          {asset.assetType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            asset.status === 'operational' ? 'bg-green-100 text-green-800' :
                            asset.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                            asset.status === 'fault' ? 'bg-rose-100 text-rose-800' :
                            'bg-zinc-100 text-zinc-800'
                          }`}>
                            {asset.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                          {asset.efficiency.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`font-semibold ${
                            asset.faultPrediction.probability > 0.7 ? 'text-rose-600' :
                            asset.faultPrediction.probability > 0.3 ? 'text-orange-600' :
                            'text-green-600'
                          }`}>
                            {asset.faultPrediction.probability > 0.7 ? 'High' :
                             asset.faultPrediction.probability > 0.3 ? 'Medium' : 'Low'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Compliance Monitoring</h2>
              <div className="flex space-x-2">
                <Button onClick={() => loadCompliance(currentClient.id)} disabled={loading.compliance}>
                  {loading.compliance ? 'Refreshing...' : 'Refresh Data'}
                </Button>
                <Button variant="outline">
                  Generate Report
                </Button>
              </div>
            </div>

            {/* Compliance Score */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-2">Overall Score</h3>
                <div className="text-3xl font-bold text-center">
                  <span className={`${
                    complianceScore >= 90 ? 'text-green-600' :
                    complianceScore >= 70 ? 'text-orange-600' :
                    'text-rose-600'
                  }`}>
                    {complianceScore}%
                  </span>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-2">Compliant</h3>
                <div className="text-2xl font-bold text-green-600">
                  {compliance.filter(c => c.status === 'compliant').length}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-2">Warnings</h3>
                <div className="text-2xl font-bold text-orange-600">
                  {compliance.filter(c => c.status === 'warning').length}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-2">Violations</h3>
                <div className="text-2xl font-bold text-rose-600">
                  {compliance.filter(c => c.status === 'violation').length}
                </div>
              </Card>
            </div>

            {/* Compliance Details */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Compliance Status</h3>
              <div className="space-y-4">
                {compliance.map((check, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      check.status === 'compliant' ? 'border-green-500 bg-green-50' :
                      check.status === 'warning' ? 'border-orange-500 bg-orange-50' :
                      check.status === 'violation' ? 'border-rose-500 bg-rose-50' :
                      'border-gray-500 bg-zinc-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold">{check.requirement}</h4>
                        <p className="text-sm text-zinc-600 mt-1">
                          {check.jurisdiction} - {check.regulationType}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm">
                          <span className="text-zinc-500">
                            Last Check: {new Date(check.lastCheck).toLocaleDateString()}
                          </span>
                          <span className={`font-semibold ${
                            check.riskLevel === 'critical' ? 'text-rose-600' :
                            check.riskLevel === 'high' ? 'text-orange-600' :
                            check.riskLevel === 'medium' ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            Risk: {check.riskLevel}
                          </span>
                          {check.potentialFine > 0 && (
                            <span className="text-rose-600 font-semibold">
                              Potential Fine: ${check.potentialFine.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          check.status === 'compliant' ? 'bg-green-100 text-green-800' :
                          check.status === 'warning' ? 'bg-orange-100 text-orange-800' :
                          check.status === 'violation' ? 'bg-rose-100 text-rose-800' :
                          'bg-zinc-100 text-zinc-800'
                        }`}>
                          {check.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'tailings' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Tailings Analysis</h2>
              <Button onClick={handleRunTailingsAnalysis}>
                Analyze New Site
              </Button>
            </div>

            {tailingsSites.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="mb-4">
                  <Pickaxe className="h-16 w-16 text-amber-600 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Tailings Analysis Available</h3>
                <p className="text-zinc-600 mb-4">
                  Run your first tailings analysis to discover the economic potential of your abandoned mine lands.
                </p>
                <Button onClick={handleRunTailingsAnalysis}>
                  Run Sample Analysis
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tailingsSites.map((site) => (
                  <Card key={site.siteId} className="p-6">
                    <h3 className="font-semibold mb-4">{site.siteName}</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Volume:</span>
                        <span className="font-semibold">
                          {site.volumeEstimate.toLocaleString()} m³
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Total Value:</span>
                        <span className="font-bold text-green-600">
                          ${site.economicAssessment.totalValue.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Net Profit:</span>
                        <span className="font-bold text-blue-600">
                          ${site.economicAssessment.netProfit.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Feasibility:</span>
                        <div className="flex items-center">
                          <span className={`font-bold ${
                            site.feasibilityScore >= 80 ? 'text-green-600' :
                            site.feasibilityScore >= 60 ? 'text-orange-600' :
                            'text-rose-600'
                          }`}>
                            {site.feasibilityScore}/100
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-zinc-600">IRR:</span>
                        <span className="font-bold text-emerald-600">
                          {site.economicAssessment.irr.toFixed(1)}%
                        </span>
                      </div>
                      
                      <div className="pt-3 border-t">
                        <h4 className="text-sm font-semibold mb-2">Top Minerals:</h4>
                        <div className="space-y-1">
                          {Object.entries(site.mineralContent)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 3)
                            .map(([mineral, percentage]) => (
                            <div key={mineral} className="flex justify-between text-sm">
                              <span className="capitalize">{mineral}:</span>
                              <span className="font-semibold">{percentage.toFixed(2)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <Button size="sm" className="w-full" variant="outline">
                        View Full Report
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Analytics & ROI</h2>
            
            {/* ROI Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <h3 className="text-sm text-zinc-500 mb-2">Total Value Generated</h3>
                <div className="text-2xl font-bold text-green-600">
                  ${(clientMetrics.predictedSavings).toLocaleString()}
                </div>
                <p className="text-sm text-zinc-500 mt-1">Next 12 months</p>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-sm text-zinc-500 mb-2">Monthly ROI</h3>
                <div className="text-2xl font-bold text-blue-600">
                  {((clientMetrics.costSavings * 12) / currentClient.contractValue * 100).toFixed(1)}%
                </div>
                <p className="text-sm text-zinc-500 mt-1">Return on investment</p>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-sm text-zinc-500 mb-2">Payback Period</h3>
                <div className="text-2xl font-bold text-emerald-600">
                  {(currentClient.contractValue / (clientMetrics.costSavings * 12)).toFixed(1)} years
                </div>
                <p className="text-sm text-zinc-500 mt-1">Time to break even</p>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-sm text-zinc-500 mb-2">Risk Reduction</h3>
                <div className="text-2xl font-bold text-orange-600">
                  ${clientMetrics.complianceImprovements * 50000}
                </div>
                <p className="text-sm text-zinc-500 mt-1">Compliance cost avoidance</p>
              </Card>
            </div>
            
            {/* Value Breakdown */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Value Breakdown</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b">
                  <span>Asset Optimization Savings</span>
                  <span className="font-bold text-green-600">
                    ${(clientMetrics.costSavings * 0.6).toLocaleString()}/month
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span>Predictive Maintenance Savings</span>
                  <span className="font-bold text-green-600">
                    ${(clientMetrics.costSavings * 0.25).toLocaleString()}/month
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span>Compliance Cost Avoidance</span>
                  <span className="font-bold text-green-600">
                    ${(clientMetrics.costSavings * 0.15).toLocaleString()}/month
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 font-bold text-lg">
                  <span>Total Monthly Value</span>
                  <span className="text-green-600">
                    ${clientMetrics.costSavings.toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnterpriseDashboard;
