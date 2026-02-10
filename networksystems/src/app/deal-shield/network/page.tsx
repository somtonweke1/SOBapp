'use client';

import { useState, useEffect } from 'react';
import BaltimorePropertyNetwork3D from '@/components/deal-shield/BaltimorePropertyNetwork3D';
import { BaltimorePropertyNode, BillingTierEdge } from '@/services/forensics/baltimorePropertyNetwork';
import { Home, MapPin, DollarSign, AlertTriangle } from 'lucide-react';

export default function BaltimoreNetworkPage() {
  const [nodes, setNodes] = useState<BaltimorePropertyNode[]>([]);
  const [edges, setEdges] = useState<BillingTierEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<BaltimorePropertyNode | null>(null);

  // Example data - in production, this would come from API
  useEffect(() => {
    const loadNetwork = async () => {
      try {
        // Example properties for demo
        const exampleProperties = [
          {
            id: 'prop-1',
            address: '123 Main St',
            ward: 'Ward 1',
            section: 'Section A',
            lastSale: { date: '2023-01-15', amount: 85000 },
            liens: [
              {
                propertyId: 'prop-1',
                address: '123 Main St',
                zipCode: '21223',
                lienType: 'DPW_WATER' as const,
                lienAmount: 1200,
                lienDate: '2024-01-01',
                status: 'ACTIVE' as const,
                block: 'Block 1',
              },
            ],
            dpwBillData: {
              meterReadCurrent: 125.5,
              meterReadLast: 100.0,
              totalBill: 900.00,
            },
            position: { x: 0, y: 0, z: 0 },
          },
          {
            id: 'prop-2',
            address: '125 Main St',
            ward: 'Ward 1',
            section: 'Section A',
            lastSale: { date: '2022-06-20', amount: 92000 },
            liens: [
              {
                propertyId: 'prop-2',
                address: '125 Main St',
                zipCode: '21223',
                lienType: 'DPW_WATER' as const,
                lienAmount: 800,
                lienDate: '2024-01-01',
                status: 'ACTIVE' as const,
                block: 'Block 1',
              },
            ],
            position: { x: 5, y: 0, z: 0 },
          },
          {
            id: 'prop-3',
            address: '200 Oak Ave',
            ward: 'Ward 2',
            section: 'Section B',
            lastSale: { date: '2023-11-10', amount: 110000 },
            liens: [],
            position: { x: 10, y: 0, z: 5 },
          },
        ];

        const response = await fetch('/api/forensics/baltimore-network', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ properties: exampleProperties }),
        });

        const data = await response.json();
        if (data.success) {
          setNodes(data.network.nodes);
          setEdges(data.network.edges);
        }
      } catch (error) {
        console.error('Failed to load network:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNetwork();
  }, []);

  const handleNodeClick = (node: BaltimorePropertyNode) => {
    setSelectedNode(node);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-slate-900">Baltimore Property Network 3D</h1>
          <p className="text-sm text-slate-600 mt-1">
            Network visualization of properties, liens, and billing tiers
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Visualization */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="h-[600px] relative">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-slate-500">Loading 3D Network...</div>
                  </div>
                ) : (
                  <BaltimorePropertyNetwork3D
                    nodes={nodes}
                    edges={edges}
                    onNodeClick={handleNodeClick}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Node Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Property Details</h2>
              
              {selectedNode ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Home className="h-4 w-4 text-slate-500" />
                      <span className="font-medium text-slate-900">Address</span>
                    </div>
                    <p className="text-sm text-slate-700">{selectedNode.address}</p>
                  </div>

                  {selectedNode.ward && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        <span className="font-medium text-slate-900">Ward/Section</span>
                      </div>
                      <p className="text-sm text-slate-700">
                        {selectedNode.ward} / {selectedNode.section}
                      </p>
                    </div>
                  )}

                  {selectedNode.lastSale && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <DollarSign className="h-4 w-4 text-slate-500" />
                        <span className="font-medium text-slate-900">Last Sale</span>
                      </div>
                      <p className="text-sm text-slate-700">
                        ${selectedNode.lastSale.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">{selectedNode.lastSale.date}</p>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-slate-500" />
                      <span className="font-medium text-slate-900">Distress Score</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            selectedNode.distressScore > 70
                              ? 'bg-red-500'
                              : selectedNode.distressScore > 40
                              ? 'bg-orange-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${selectedNode.distressScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-700">
                        {selectedNode.distressScore.toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {selectedNode.dpwAuditResult && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle
                          className={`h-4 w-4 ${
                            selectedNode.dpwAuditResult.hasError ? 'text-red-500' : 'text-green-500'
                          }`}
                        />
                        <span className="font-medium text-slate-900">DPW Audit</span>
                      </div>
                      {selectedNode.dpwAuditResult.hasError ? (
                        <div className="bg-red-50 border border-red-200 rounded p-2">
                          <p className="text-xs text-red-800 font-medium">Error Detected</p>
                          <p className="text-xs text-red-700">
                            Discrepancy: ${selectedNode.dpwAuditResult.discrepancyAmount.toFixed(2)}
                          </p>
                          <p className="text-xs text-red-600 capitalize">
                            Severity: {selectedNode.dpwAuditResult.severity}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-green-50 border border-green-200 rounded p-2">
                          <p className="text-xs text-green-800">No errors detected</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <span className="text-xs font-medium text-slate-700">Liens</span>
                    <p className="text-sm text-slate-600">
                      {selectedNode.lienCount} active • ${selectedNode.totalLienAmount.toLocaleString()} total
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500">
                  Click on a property node to view details
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

