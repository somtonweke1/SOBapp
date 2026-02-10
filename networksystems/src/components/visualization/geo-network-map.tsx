'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Map, { Marker, Source, Layer, Popup, ViewStateChangeEvent } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import * as d3 from 'd3';

interface GeoNetworkMapProps {
  nodes: Array<{
    id: string;
    type: string;
    name: string;
    position: { lat: number; lng: number; elevation: number };
    data: any;
  }>;
  onNodeSelect?: (nodeId: string) => void;
}

export default function GeoNetworkMap({ nodes = [], onNodeSelect }: GeoNetworkMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [viewState, setViewState] = useState({
    longitude: 25.0,
    latitude: -15.0,
    zoom: 4,
    pitch: 45,
    bearing: 0
  });

  // Mock African mining network data
  const mockNodes = [
    {
      id: 'witwatersrand-gold',
      type: 'mining_site',
      name: 'Witwatersrand Gold Complex',
      position: { lat: -26.2041, lng: 28.0473, elevation: 1753 },
      data: {
        production: 285000,
        efficiency: 87.3,
        status: 'operational',
        minerals: ['Gold', 'Uranium', 'Silver'],
        employees: 15000,
        yearlyRevenue: 2400000000
      }
    },
    {
      id: 'copperbelt-zambia',
      type: 'mining_site',
      name: 'Copperbelt Mining Complex',
      position: { lat: -12.5, lng: 28.3, elevation: 1200 },
      data: {
        production: 450000,
        efficiency: 92.1,
        status: 'operational',
        minerals: ['Copper', 'Cobalt', 'Lead'],
        employees: 25000,
        yearlyRevenue: 3200000000
      }
    },
    {
      id: 'katanga-drc',
      type: 'mining_site',
      name: 'Katanga Cobalt Operations',
      position: { lat: -10.7, lng: 26.2, elevation: 1100 },
      data: {
        production: 125000,
        efficiency: 78.9,
        status: 'operational',
        minerals: ['Cobalt', 'Copper', 'Tantalum'],
        employees: 12000,
        yearlyRevenue: 1800000000
      }
    },
    {
      id: 'kalahari-botswana',
      type: 'mining_site',
      name: 'Kalahari Diamond Mine',
      position: { lat: -21.5, lng: 23.8, elevation: 900 },
      data: {
        production: 8500,
        efficiency: 94.2,
        status: 'operational',
        minerals: ['Diamond', 'Kimberlite'],
        employees: 3500,
        yearlyRevenue: 4500000000
      }
    },
    {
      id: 'tarkwa-ghana',
      type: 'mining_site',
      name: 'Tarkwa Gold Mine',
      position: { lat: 5.3, lng: -1.9, elevation: 200 },
      data: {
        production: 195000,
        efficiency: 85.7,
        status: 'operational',
        minerals: ['Gold', 'Silver'],
        employees: 8000,
        yearlyRevenue: 1600000000
      }
    },
    {
      id: 'johannesburg-proc',
      type: 'processing_facility',
      name: 'Johannesburg Processing Hub',
      position: { lat: -26.2044, lng: 28.0456, elevation: 1760 },
      data: {
        capacity: 500000,
        efficiency: 89.7,
        status: 'operational',
        processes: ['Refining', 'Smelting', 'Purification'],
        employees: 2500,
        yearlyRevenue: 800000000
      }
    },
    {
      id: 'cape-town-port',
      type: 'logistics_hub',
      name: 'Cape Town Export Terminal',
      position: { lat: -33.9249, lng: 18.4241, elevation: 50 },
      data: {
        throughput: 2500000,
        efficiency: 91.3,
        status: 'operational',
        services: ['Export', 'Storage', 'Quality Control'],
        employees: 1200,
        yearlyRevenue: 450000000
      }
    },
    {
      id: 'pretoria-lab',
      type: 'research_lab',
      name: 'MIAR Research Center',
      position: { lat: -25.7479, lng: 28.2293, elevation: 1339 },
      data: {
        projects: 45,
        efficiency: 95.2,
        status: 'operational',
        focus: ['Materials Discovery', 'Process Optimization', 'AI Analytics'],
        employees: 150,
        yearlyBudget: 75000000
      }
    }
  ];

  const activeNodes = nodes.length > 0 ? nodes : mockNodes;

  // Create comprehensive network connections data for visualization
  const networkConnections = {
    type: 'FeatureCollection' as const,
    features: [
      // Primary transport routes
      {
        type: 'Feature' as const,
        properties: { type: 'transport', strength: 0.9, label: 'Material Transport', volume: '285k tonnes/year' },
        geometry: {
          type: 'LineString' as const,
          coordinates: [[28.0473, -26.2041], [28.0456, -26.2044]] // Witwatersrand to Johannesburg
        }
      },
      // Supply chain connections
      {
        type: 'Feature' as const,
        properties: { type: 'supply_chain', strength: 0.8, label: 'Export Route', volume: '2.5M tonnes/year' },
        geometry: {
          type: 'LineString' as const,
          coordinates: [[28.0456, -26.2044], [18.4241, -33.9249]] // Johannesburg to Cape Town
        }
      },
      // Research and data connections
      {
        type: 'Feature' as const,
        properties: { type: 'data_flow', strength: 0.95, label: 'AI Analytics Network', volume: '2.4GB/s' },
        geometry: {
          type: 'LineString' as const,
          coordinates: [[28.0473, -26.2041], [28.2293, -25.7479]] // Witwatersrand to Research Lab
        }
      },
      // Regional mining cooperation
      {
        type: 'Feature' as const,
        properties: { type: 'communication', strength: 0.75, label: 'Regional Mining Network', volume: 'Real-time data' },
        geometry: {
          type: 'LineString' as const,
          coordinates: [[28.3, -12.5], [26.2, -10.7]] // Copperbelt to Katanga
        }
      },
      // Additional connections for comprehensive network
      {
        type: 'Feature' as const,
        properties: { type: 'transport', strength: 0.7, label: 'Northern Copper Route', volume: '450k tonnes/year' },
        geometry: {
          type: 'LineString' as const,
          coordinates: [[28.3, -12.5], [28.0456, -26.2044]] // Copperbelt to Johannesburg
        }
      },
      {
        type: 'Feature' as const,
        properties: { type: 'data_flow', strength: 0.8, label: 'Research Collaboration', volume: 'Scientific data' },
        geometry: {
          type: 'LineString' as const,
          coordinates: [[26.2, -10.7], [28.2293, -25.7479]] // Katanga to Research Lab
        }
      },
      {
        type: 'Feature' as const,
        properties: { type: 'supply_chain', strength: 0.6, label: 'West Africa Route', volume: '195k tonnes/year' },
        geometry: {
          type: 'LineString' as const,
          coordinates: [[-1.9, 5.3], [18.4241, -33.9249]] // Ghana to Cape Town
        }
      },
      {
        type: 'Feature' as const,
        properties: { type: 'communication', strength: 0.9, label: 'Central Command Network', volume: 'Control systems' },
        geometry: {
          type: 'LineString' as const,
          coordinates: [[28.2293, -25.7479], [18.4241, -33.9249]] // Research Lab to Cape Town
        }
      }
    ]
  };

  const getNodeColor = (node: any) => {
    switch (node.type) {
      case 'mining_site': return '#FFD700'; // Gold
      case 'processing_facility': return '#4A90E2'; // Blue
      case 'research_lab': return '#7ED321'; // Green
      case 'logistics_hub': return '#BD10E0'; // Purple
      default: return '#F5A623'; // Orange
    }
  };

  const getNodeSize = (node: any) => {
    if (node.type === 'mining_site') {
      return Math.max(20, (node.data.production / 10000));
    }
    return 25;
  };

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNode(nodeId);
    onNodeSelect?.(nodeId);

    const node = activeNodes.find(n => n.id === nodeId);
    if (node && mapRef.current) {
      mapRef.current.flyTo({
        center: [node.position.lng, node.position.lat],
        zoom: 8,
        duration: 2000
      });
    }
  }, [activeNodes, onNodeSelect]);

  const selectedNodeData = activeNodes.find(n => n.id === selectedNode);

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        style={{ width: '100%', height: '100%' }}
        maxZoom={12}
        minZoom={2}
      >
        {/* Network connections */}
        <Source id="network-connections" type="geojson" data={networkConnections}>
          <Layer
            id="connections-transport"
            type="line"
            filter={['==', ['get', 'type'], 'transport']}
            paint={{
              'line-color': '#FFA500',
              'line-width': ['*', ['get', 'strength'], 6], // Dynamic width based on strength
              'line-opacity': 0.85,
              'line-blur': 1
            }}
          />
          <Layer
            id="connections-supply"
            type="line"
            filter={['==', ['get', 'type'], 'supply_chain']}
            paint={{
              'line-color': '#FF6B6B',
              'line-width': ['*', ['get', 'strength'], 5],
              'line-opacity': 0.8,
              'line-blur': 0.5
            }}
          />
          <Layer
            id="connections-data"
            type="line"
            filter={['==', ['get', 'type'], 'data_flow']}
            paint={{
              'line-color': '#4ECDC4',
              'line-width': ['*', ['get', 'strength'], 4],
              'line-opacity': 0.9,
              'line-dasharray': [3, 2],
              'line-blur': 0.5
            }}
          />
          <Layer
            id="connections-comm"
            type="line"
            filter={['==', ['get', 'type'], 'communication']}
            paint={{
              'line-color': '#00FFFF',
              'line-width': ['*', ['get', 'strength'], 3],
              'line-opacity': 0.7,
              'line-dasharray': [4, 2],
              'line-blur': 1
            }}
          />
        </Source>

        {/* Node markers */}
        {activeNodes.map((node) => (
          <Marker
            key={node.id}
            longitude={node.position.lng}
            latitude={node.position.lat}
            anchor="center"
          >
            <div
              className={`cursor-pointer transition-all duration-200 hover:scale-110 ${
                selectedNode === node.id ? 'animate-pulse' : ''
              }`}
              style={{
                width: getNodeSize(node),
                height: getNodeSize(node),
                backgroundColor: getNodeColor(node),
                border: '2px solid rgba(255,255,255,0.8)',
                borderRadius: node.type === 'mining_site' ? '0' : '50%',
                transform: node.type === 'mining_site' ? 'rotate(45deg)' : 'none',
                boxShadow: `0 0 15px ${getNodeColor(node)}80`
              }}
              onClick={() => handleNodeClick(node.id)}
            />
          </Marker>
        ))}

        {/* Popup for selected node */}
        {selectedNodeData && (
          <Popup
            longitude={selectedNodeData.position.lng}
            latitude={selectedNodeData.position.lat}
            anchor="top"
            onClose={() => setSelectedNode(null)}
            className="min-w-80"
          >
            <div className="bg-zinc-900 text-white p-4 rounded-lg">
              <h3 className="text-lg font-bold mb-3">{selectedNodeData.name}</h3>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-zinc-400">Type:</span>
                  <div className="font-semibold capitalize">
                    {selectedNodeData.type.replace('_', ' ')}
                  </div>
                </div>

                <div>
                  <span className="text-zinc-400">Status:</span>
                  <div className={`font-semibold capitalize ${
                    selectedNodeData.data.status === 'operational' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {selectedNodeData.data.status}
                  </div>
                </div>

                <div>
                  <span className="text-zinc-400">Efficiency:</span>
                  <div className="font-semibold text-blue-400">
                    {selectedNodeData.data.efficiency?.toFixed(1)}%
                  </div>
                </div>

                <div>
                  <span className="text-zinc-400">Employees:</span>
                  <div className="font-semibold text-emerald-400">
                    {selectedNodeData.data.employees?.toLocaleString()}
                  </div>
                </div>
              </div>

              {selectedNodeData.data.production && (
                <div className="mt-3">
                  <span className="text-zinc-400">Production:</span>
                  <div className="font-semibold text-yellow-400">
                    {selectedNodeData.data.production.toLocaleString()} tonnes/year
                  </div>
                </div>
              )}

              {selectedNodeData.data.minerals && (
                <div className="mt-3">
                  <span className="text-zinc-400">Minerals:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedNodeData.data.minerals.map((mineral: string) => (
                      <span key={mineral} className="px-2 py-1 bg-zinc-700 text-xs rounded">
                        {mineral}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedNodeData.data.yearlyRevenue && (
                <div className="mt-3">
                  <span className="text-zinc-400">Annual Revenue:</span>
                  <div className="font-semibold text-green-400">
                    ${(selectedNodeData.data.yearlyRevenue / 1000000000).toFixed(1)}B
                  </div>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-zinc-700">
                <div className="text-xs text-zinc-400">
                  Coordinates: {selectedNodeData.position.lat.toFixed(4)}, {selectedNodeData.position.lng.toFixed(4)}
                </div>
                <div className="text-xs text-zinc-400">
                  Elevation: {selectedNodeData.position.elevation}m
                </div>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-zinc-900 bg-opacity-95 text-white p-4 rounded-lg">
        <h4 className="font-semibold mb-3">Network Legend</h4>

        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 transform rotate-45"></div>
            <span>Mining Sites</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span>Processing Facilities</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span>Research Labs</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
            <span>Logistics Hubs</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-600">
          <h5 className="font-semibold mb-2 text-xs">Connections</h5>
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-0.5 bg-orange-500"></div>
              <span>Transport</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-0.5 bg-red-400"></div>
              <span>Supply Chain</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-0.5 bg-teal-400" style={{ borderStyle: 'dashed' }}></div>
              <span>Data Flow</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-0.5 bg-cyan-400" style={{ borderStyle: 'dashed' }}></div>
              <span>Communication</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 bg-zinc-900 bg-opacity-95 text-white p-3 rounded-lg">
        <div className="flex flex-col space-y-2">
          <button
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
            onClick={() => {
              setViewState({
                longitude: 25.0,
                latitude: -15.0,
                zoom: 4,
                pitch: 45,
                bearing: 0
              });
            }}
          >
            Reset View
          </button>

          <button
            className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors"
            onClick={() => {
              const totalNodes = activeNodes.length;
              const avgLat = activeNodes.reduce((sum, node) => sum + node.position.lat, 0) / totalNodes;
              const avgLng = activeNodes.reduce((sum, node) => sum + node.position.lng, 0) / totalNodes;

              setViewState({
                ...viewState,
                longitude: avgLng,
                latitude: avgLat,
                zoom: 5
              });
            }}
          >
            Center Network
          </button>
        </div>
      </div>
    </div>
  );
}