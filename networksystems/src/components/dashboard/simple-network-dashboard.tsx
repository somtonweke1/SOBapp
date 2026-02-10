'use client';

import React, { useState, useEffect } from 'react';
import GeoNetworkMap from '@/components/visualization/geo-network-map';
import {
  Network,
  Activity,
  BarChart3,
  Users,
  Zap,
  Globe,
  AlertCircle
} from 'lucide-react';

const SimpleNetworkDashboard: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [networkStats, setNetworkStats] = useState({
    totalNodes: 8,
    activeConnections: 16,
    networkHealth: 96.3,
    dataFlowRate: '2.4 GB/s'
  });

  // Sample network data for African mining operations
  const networkNodes = [
    {
      id: 'witwatersrand-gold',
      type: 'mining_site',
      name: 'Witwatersrand Gold Complex',
      position: { lat: -26.2041, lng: 28.0473, elevation: 1753 },
      data: {
        status: 'operational',
        efficiency: 87.3,
        production: 285000,
        minerals: ['Gold', 'Uranium'],
        employees: 15000
      }
    },
    {
      id: 'copperbelt-zambia',
      type: 'mining_site',
      name: 'Copperbelt Mining Complex',
      position: { lat: -12.5, lng: 28.3, elevation: 1200 },
      data: {
        status: 'operational',
        efficiency: 92.1,
        production: 450000,
        minerals: ['Copper', 'Cobalt'],
        employees: 25000
      }
    },
    {
      id: 'katanga-drc',
      type: 'mining_site',
      name: 'Katanga Cobalt Operations',
      position: { lat: -10.7, lng: 26.2, elevation: 1100 },
      data: {
        status: 'maintenance',
        efficiency: 78.9,
        production: 125000,
        minerals: ['Cobalt', 'Copper'],
        employees: 12000
      }
    },
    {
      id: 'pretoria-lab',
      type: 'research_lab',
      name: 'SOBapp Research Center',
      position: { lat: -25.7479, lng: 28.2293, elevation: 1339 },
      data: {
        status: 'operational',
        efficiency: 95.2,
        production: 0,
        focus: ['AI Analytics', 'Materials Discovery'],
        employees: 150
      }
    }
  ];

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNode(nodeId);
    console.log('Selected network node:', nodeId);
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light tracking-tight text-zinc-900">
                Network Analysis
              </h1>
              <p className="mt-2 text-sm text-zinc-600 font-light">
                African mining network topology and performance monitoring
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-sm text-zinc-600 font-light">Live Network</span>
            </div>
          </div>
        </div>

        {/* Network Statistics */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">

          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow-sm ring-1 ring-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Network className="h-5 w-5 text-zinc-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-light text-zinc-500">Total Nodes</dt>
                  <dd className="text-lg font-medium text-zinc-900">{networkStats.totalNodes}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow-sm ring-1 ring-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-5 w-5 text-zinc-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-light text-zinc-500">Active Connections</dt>
                  <dd className="text-lg font-medium text-zinc-900">{networkStats.activeConnections}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow-sm ring-1 ring-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-5 w-5 text-zinc-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-light text-zinc-500">Network Health</dt>
                  <dd className="text-lg font-medium text-zinc-900">{networkStats.networkHealth}%</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow-sm ring-1 ring-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Zap className="h-5 w-5 text-zinc-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-light text-zinc-500">Data Flow</dt>
                  <dd className="text-lg font-medium text-zinc-900">{networkStats.dataFlowRate}</dd>
                </dl>
              </div>
            </div>
          </div>

        </div>

        {/* Main Network Visualization */}
        <div className="mb-8">
          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
            <div className="border-b border-zinc-200 bg-white px-6 py-4">
              <h2 className="text-lg font-medium text-zinc-900">
                Interactive Network Map
              </h2>
              <p className="mt-1 text-sm text-zinc-600 font-light">
                Click on nodes to view detailed information and network relationships
              </p>
            </div>

            <div style={{ height: '500px' }}>
              <GeoNetworkMap
                nodes={networkNodes}
                onNodeSelect={handleNodeSelect}
              />
            </div>
          </div>
        </div>

        {/* Network Analysis Summary */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
            <div className="border-b border-zinc-200 bg-white px-6 py-4">
              <h3 className="text-base font-medium text-zinc-900">Network Performance</h3>
            </div>
            <div className="px-6 py-4">
              <dl className="space-y-4">
                <div className="flex justify-between">
                  <dt className="text-sm font-light text-zinc-500">Average Efficiency</dt>
                  <dd className="text-sm font-medium text-zinc-900">88.4%</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-light text-zinc-500">Total Production</dt>
                  <dd className="text-sm font-medium text-zinc-900">860,000 tonnes</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-light text-zinc-500">Network Latency</dt>
                  <dd className="text-sm font-medium text-zinc-900">45ms</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-light text-zinc-500">Uptime</dt>
                  <dd className="text-sm font-medium text-zinc-900">99.7%</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
            <div className="border-b border-zinc-200 bg-white px-6 py-4">
              <h3 className="text-base font-medium text-zinc-900">Connected Locations</h3>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-3">
                {networkNodes.map((node) => (
                  <div key={node.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`h-2 w-2 rounded-full ${
                        node.data.status === 'operational' ? 'bg-green-500' :
                        node.data.status === 'maintenance' ? 'bg-yellow-500' : 'bg-rose-500'
                      }`} />
                      <span className="text-sm font-light text-zinc-900">{node.name}</span>
                    </div>
                    <span className="text-xs font-light text-zinc-500">
                      {node.data.efficiency.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {selectedNode && (
          <div className="mt-6 rounded-lg bg-blue-50 p-4 ring-1 ring-blue-200">
            <div className="flex items-center">
              <Globe className="h-5 w-5 text-blue-500" />
              <span className="ml-2 text-sm font-medium text-blue-900">
                Selected Node: {networkNodes.find(n => n.id === selectedNode)?.name}
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SimpleNetworkDashboard;