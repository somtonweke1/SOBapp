'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon3D, ServerIcon3D } from '@/components/ui/icon-3d';
import RealTimeAlerts from '@/components/monitoring/real-time-alerts';
import { useAuth } from '@/components/auth/auth-provider';
import GeoNetworkMap from '@/components/visualization/geo-network-map';
import {
  BarChart3,
  Building2,
  Map,
  Bell,
  Shield,
  Brain,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  CheckCircle,
  Wrench,
  AlertTriangle,
  DollarSign,
  FileText,
  Activity,
  LogOut
} from 'lucide-react';

// Define interfaces for the enhanced dashboard
interface KPIMetric {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  format: 'currency' | 'percentage' | 'number' | 'duration';
}

interface PerformanceData {
  timestamp: string;
  efficiency: number;
  throughput: number;
  downtime: number;
  costs: number;
}

export default function EnhancedEnterpriseDashboard() {
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Real-time KPI metrics with icon configurations
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetric[]>([
    { label: 'Monthly Revenue', value: '$2.4M', change: 12.5, trend: 'up', format: 'currency' },
    { label: 'Operational Efficiency', value: '94.2%', change: 3.1, trend: 'up', format: 'percentage' },
    { label: 'Assets Monitored', value: '247', change: 5, trend: 'up', format: 'number' },
    { label: 'Average Uptime', value: '98.7%', change: 0.8, trend: 'up', format: 'percentage' },
    { label: 'Cost Savings (YTD)', value: '$1.8M', change: 24.3, trend: 'up', format: 'currency' },
    { label: 'Compliance Score', value: '96%', change: 2, trend: 'up', format: 'percentage' }
  ]);

  // Icon colors for each KPI metric
  const kpiIconColors: ('purple' | 'blue' | 'emerald' | 'cyan' | 'amber' | 'rose')[] = [
    'purple',   // Monthly Revenue - premium
    'blue',     // Operational Efficiency - operational
    'emerald',  // Assets Monitored - growth
    'cyan',     // Average Uptime - stability
    'amber',    // Cost Savings - value
    'emerald'   // Compliance Score - success
  ];

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setKpiMetrics(prev => prev.map(metric => ({
        ...metric,
        change: metric.change + (Math.random() - 0.5) * 2,
        trend: Math.random() > 0.7 ? (Math.random() > 0.5 ? 'up' : 'down') : metric.trend
      })));
    }, 10000); // Update every 10 seconds

    // Generate performance data
    const generatePerformanceData = () => {
      const data = [];
      const now = new Date();
      for (let i = 23; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 3600000).toISOString();
        data.push({
          timestamp,
          efficiency: 85 + Math.random() * 15,
          throughput: 400 + Math.random() * 100,
          downtime: Math.random() * 10,
          costs: 50000 + Math.random() * 20000
        });
      }
      setPerformanceData(data);
      setIsLoading(false);
    };

    generatePerformanceData();
    return () => clearInterval(interval);
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-rose-500" />;
      default: return <ArrowRight className="h-4 w-4 text-zinc-500" />;
    }
  };

  const formatMetricValue = (value: string, format: string) => {
    return value; // Already formatted in the data
  };

  const tabs = [
    { id: 'overview', label: 'Executive Overview', permission: 'view_operations' },
    { id: 'assets', label: 'Asset Performance', permission: 'view_operations' },
    { id: 'geospatial', label: 'Network Map', permission: 'view_operations' },
    { id: 'alerts', label: 'Real-Time Alerts', permission: 'view_operations' },
    { id: 'compliance', label: 'Compliance Dashboard', permission: 'view_operations' },
    { id: 'analytics', label: 'AI Analytics', permission: 'ai_insights' },
    { id: 'financial', label: 'Financial Impact', permission: 'export_data' },
    { id: 'reports', label: 'Executive Reports', permission: 'export_data' }
  ].filter(tab => hasPermission(tab.permission));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <div className="mt-4 text-zinc-600">Loading enterprise dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <Building2 className="h-6 w-6 text-zinc-900" />
                <h1 className="text-xl font-light tracking-wide text-zinc-900">MIAR Enterprise</h1>
              </div>
              <div className="hidden md:block text-sm text-zinc-500 font-light">
                {user?.company} • {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-zinc-600 font-light">Live Data</span>
              </div>
              <div className="hidden md:block text-sm text-zinc-500 font-light">
                {new Date().toLocaleTimeString()}
              </div>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center rounded-lg bg-zinc-50 px-3 py-2 text-sm font-light text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                <Activity className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-zinc-200">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map(tab => {
              const icons: Record<string, any> = {
                overview: BarChart3,
                assets: Building2,
                geospatial: Map,
                alerts: Bell,
                compliance: Shield,
                analytics: Brain,
                financial: DollarSign,
                reports: FileText
              };
              const IconComponent = icons[tab.id] || BarChart3;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 text-sm font-light transition-colors ${
                    activeTab === tab.id
                      ? 'border-gray-900 text-zinc-900'
                      : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
                  }`}
                >
                  <IconComponent className="mr-2 h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Grid with 3D Icons */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {kpiMetrics.map((metric, index) => (
                  <Card key={index} className="p-6 hover:shadow-xl transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <ServerIcon3D size="sm" color={kpiIconColors[index]} />
                      <div className="text-right">
                        <div className="text-lg">{getTrendIcon(metric.trend)}</div>
                        <div className={`text-sm font-medium ${
                          metric.change > 0 ? 'text-green-600' : metric.change < 0 ? 'text-rose-600' : 'text-zinc-600'
                        }`}>
                          {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-600 mb-2">{metric.label}</p>
                      <p className="text-3xl font-bold text-zinc-900">{metric.value}</p>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Executive Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Today's Highlights</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium">Production Target Achieved</div>
                        <div className="text-sm text-zinc-600">102.5% of daily target completed</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded">
                      <Wrench className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium">Predictive Maintenance Alert</div>
                        <div className="text-sm text-zinc-600">3 assets scheduled for maintenance</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <div>
                        <div className="font-medium">Weather Advisory</div>
                        <div className="text-sm text-zinc-600">Heavy rainfall expected tomorrow</div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Cost Optimization Impact</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-600">Prevented Equipment Failures</span>
                      <span className="font-semibold text-green-600">$485K saved</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-600">Energy Optimization</span>
                      <span className="font-semibold text-green-600">$127K saved</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-600">Process Efficiency Gains</span>
                      <span className="font-semibold text-green-600">$203K saved</span>
                    </div>
                    <div className="border-t pt-4 flex justify-between items-center">
                      <span className="font-semibold text-zinc-800">Total Monthly Impact</span>
                      <span className="font-bold text-green-600 text-lg">$815K</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'assets' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Asset Performance Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">189</div>
                    <div className="text-sm text-zinc-600">Operational</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">12</div>
                    <div className="text-sm text-zinc-600">Maintenance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-rose-600">3</div>
                    <div className="text-sm text-zinc-600">Critical</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-zinc-600">43</div>
                    <div className="text-sm text-zinc-600">Offline</div>
                  </div>
                </div>
              </Card>

              {/* Asset Health Indicators */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h4 className="font-semibold mb-4">Top Performing Assets</h4>
                  <div className="space-y-3">
                    {['CRUSHER-001', 'CONVEYOR-005', 'MILL-003', 'SEPARATOR-002'].map((asset, i) => (
                      <div key={asset} className="flex items-center justify-between p-3 bg-green-50 rounded">
                        <div className="font-medium">{asset}</div>
                        <div className="text-green-600 font-semibold">{(98 - i * 0.5).toFixed(1)}%</div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <h4 className="font-semibold mb-4">Assets Requiring Attention</h4>
                  <div className="space-y-3">
                    {[
                      { asset: 'TRUCK-047', status: 'Critical', color: 'red' },
                      { asset: 'CONVEYOR-003', status: 'Maintenance', color: 'yellow' },
                      { asset: 'PUMP-008', status: 'Warning', color: 'orange' }
                    ].map(item => (
                      <div key={item.asset} className={`flex items-center justify-between p-3 bg-${item.color}-50 rounded`}>
                        <div className="font-medium">{item.asset}</div>
                        <div className={`text-${item.color}-600 font-semibold`}>{item.status}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'geospatial' && (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">African Mining Network - Geospatial View</h3>
                  <div className="text-sm text-zinc-600">
                    Real-time network topology with geographic context
                  </div>
                </div>
                <div className="bg-zinc-100 rounded-lg" style={{ height: '500px' }}>
                  <GeoNetworkMap
                    nodes={[]}
                    onNodeSelect={(nodeId) => {
                      console.log('Selected enterprise node:', nodeId);
                    }}
                  />
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-4">
                  <h4 className="font-semibold mb-3 text-blue-600">Network Analysis</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Active Sites:</span>
                      <span className="font-semibold">8</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Network Diameter:</span>
                      <span className="font-semibold">2,847 km</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Distance:</span>
                      <span className="font-semibold">1,425 km</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Network Density:</span>
                      <span className="font-semibold">0.74</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-semibold mb-3 text-green-600">Geographic Distribution</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Countries:</span>
                      <span className="font-semibold">5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Latitude Range:</span>
                      <span className="font-semibold">39.2°</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Elevation Range:</span>
                      <span className="font-semibold">1,710m</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time Zones:</span>
                      <span className="font-semibold">3</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-semibold mb-3 text-emerald-600">Connectivity Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Connections:</span>
                      <span className="font-semibold">16</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transport Links:</span>
                      <span className="font-semibold">8</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Data Flows:</span>
                      <span className="font-semibold">5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Supply Chains:</span>
                      <span className="font-semibold">3</span>
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="p-6">
                <h4 className="font-semibold mb-4">Real-Time Network Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-sm font-medium text-zinc-700 mb-3">Production Sites Status</h5>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                        <span className="text-sm">Witwatersrand Complex</span>
                        <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">OPERATIONAL</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                        <span className="text-sm">Copperbelt Operations</span>
                        <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">OPERATIONAL</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                        <span className="text-sm">Katanga Mining</span>
                        <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">MAINTENANCE</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-zinc-700 mb-3">Network Performance</h5>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Data Latency:</span>
                        <span className="text-sm font-semibold text-green-600">45ms avg</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Transport Efficiency:</span>
                        <span className="text-sm font-semibold text-green-600">94.2%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Communication Uptime:</span>
                        <span className="text-sm font-semibold text-green-600">99.8%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'alerts' && (
            <RealTimeAlerts />
          )}

          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Compliance Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-green-50 rounded">
                    <div className="text-2xl font-bold text-green-600">96%</div>
                    <div className="text-sm text-zinc-600">Overall Score</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">24</div>
                    <div className="text-sm text-zinc-600">Checks Passed</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded">
                    <div className="text-2xl font-bold text-yellow-600">3</div>
                    <div className="text-sm text-zinc-600">Warnings</div>
                  </div>
                  <div className="text-center p-4 bg-rose-50 rounded">
                    <div className="text-2xl font-bold text-rose-600">1</div>
                    <div className="text-sm text-zinc-600">Critical</div>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h4 className="font-semibold mb-4">Recent Compliance Actions</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 border rounded">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium">Environmental Audit Passed</div>
                        <div className="text-sm text-zinc-600">2 hours ago</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 border rounded">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <div>
                        <div className="font-medium">Safety Training Due</div>
                        <div className="text-sm text-zinc-600">5 employees need certification</div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h4 className="font-semibold mb-4">Compliance Savings</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Avoided Fines (YTD)</span>
                      <span className="font-semibold text-green-600">$2.1M</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Process Optimizations</span>
                      <span className="font-semibold text-green-600">$450K</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between items-center">
                      <span className="font-semibold">Total Saved</span>
                      <span className="font-bold text-green-600">$2.55M</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && hasPermission('ai_insights') && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">AI-Powered Insights</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Predictive Maintenance Recommendations</h4>
                    <div className="bg-blue-50 p-4 rounded">
                      <div className="font-medium text-blue-800">CRUSHER-001</div>
                      <div className="text-sm text-blue-600">Bearing replacement recommended in 72 hours</div>
                      <div className="text-xs text-blue-500 mt-1">Confidence: 94% • Potential savings: $45K</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded">
                      <div className="font-medium text-green-800">Energy Optimization</div>
                      <div className="text-sm text-green-600">15% efficiency gain possible with schedule adjustment</div>
                      <div className="text-xs text-green-500 mt-1">Monthly savings: $23K</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Market Intelligence</h4>
                    <div className="bg-emerald-50 p-4 rounded">
                      <div className="font-medium text-emerald-800">Commodity Price Alert</div>
                      <div className="text-sm text-emerald-600">Gold prices up 3.2% - optimal selling window</div>
                      <div className="text-xs text-emerald-500 mt-1">Revenue impact: +$180K this month</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded">
                      <div className="font-medium text-orange-800">Supply Chain Optimization</div>
                      <div className="text-sm text-orange-600">Alternative supplier reduces costs by 8%</div>
                      <div className="text-xs text-orange-500 mt-1">Annual savings: $95K</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'financial' && hasPermission('export_data') && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Financial Impact Dashboard</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">$2.4M</div>
                    <div className="text-zinc-600">Monthly Revenue</div>
                    <div className="text-sm text-green-600 mt-1">↑ 12.5% from last month</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">$1.8M</div>
                    <div className="text-zinc-600">Cost Savings (YTD)</div>
                    <div className="text-sm text-blue-600 mt-1">↑ 24.3% from last year</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-600">425%</div>
                    <div className="text-zinc-600">ROI on MIAR Platform</div>
                    <div className="text-sm text-emerald-600 mt-1">Based on 12-month period</div>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h4 className="font-semibold mb-4">Cost Breakdown</h4>
                  <div className="space-y-3">
                    {[
                      { label: 'Equipment Maintenance', amount: '$450K', percentage: 35 },
                      { label: 'Energy Costs', amount: '$320K', percentage: 25 },
                      { label: 'Labor', amount: '$280K', percentage: 22 },
                      { label: 'Supplies', amount: '$230K', percentage: 18 }
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-blue-500 rounded"></div>
                          <span>{item.label}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{item.amount}</div>
                          <div className="text-sm text-zinc-500">{item.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <h4 className="font-semibold mb-4">Savings Opportunities</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 rounded">
                      <div className="font-medium text-green-800">Predictive Maintenance</div>
                      <div className="text-sm text-green-600">Potential annual savings: $650K</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded">
                      <div className="font-medium text-blue-800">Energy Optimization</div>
                      <div className="text-sm text-blue-600">Potential annual savings: $280K</div>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded">
                      <div className="font-medium text-emerald-800">Process Efficiency</div>
                      <div className="text-sm text-emerald-600">Potential annual savings: $420K</div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}