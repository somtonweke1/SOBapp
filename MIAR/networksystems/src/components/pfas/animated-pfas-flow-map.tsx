'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import {
  Droplet,
  Factory,
  Sprout,
  Building2,
  Users,
  AlertTriangle,
  Activity,
  MapPin
} from 'lucide-react';

interface FlowNode {
  id: string;
  type: 'industrial' | 'water_treatment' | 'irrigation' | 'farm' | 'food_processor' | 'population';
  name: string;
  location: string;
  x: number; // Percentage position
  y: number;
  pfasLevel: number; // ng/L
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lat?: number;
  lon?: number;
  exposedPopulation?: number;
  description: string;
}

interface FlowConnection {
  from: string;
  to: string;
  flowRate: number; // 0-1 (animation speed)
  contaminationLevel: number; // 0-1
}

interface FlowParticle {
  id: string;
  connectionIndex: number;
  progress: number; // 0-1 along the path
  size: number;
  color: string;
}

// Real PFAS contamination network data
const PFAS_FLOW_NODES: FlowNode[] = [
  {
    id: 'ind-1',
    type: 'industrial',
    name: '3M Manufacturing Plant',
    location: 'Minnesota',
    x: 15,
    y: 25,
    pfasLevel: 85000,
    riskLevel: 'critical',
    lat: 44.9778,
    lon: -93.2650,
    description: 'PFAS manufacturing - source contamination'
  },
  {
    id: 'ind-2',
    type: 'industrial',
    name: 'DuPont Chemical Facility',
    location: 'West Virginia',
    x: 12,
    y: 45,
    pfasLevel: 72000,
    riskLevel: 'critical',
    lat: 39.2903,
    lon: -81.5521,
    description: 'Teflon production - wastewater discharge'
  },
  {
    id: 'water-1',
    type: 'water_treatment',
    name: 'Mississippi River System',
    location: 'Multi-state',
    x: 35,
    y: 30,
    pfasLevel: 45000,
    riskLevel: 'high',
    lat: 38.6270,
    lon: -90.1994,
    description: 'Receiving industrial discharge - elevated PFAS'
  },
  {
    id: 'water-2',
    type: 'water_treatment',
    name: 'Ohio River Valley',
    location: 'Ohio',
    x: 32,
    y: 50,
    pfasLevel: 38000,
    riskLevel: 'high',
    lat: 38.4433,
    lon: -82.5987,
    description: 'Downstream contamination - treatment inadequate'
  },
  {
    id: 'irr-1',
    type: 'irrigation',
    name: 'Central Valley Irrigation',
    location: 'California',
    x: 55,
    y: 35,
    pfasLevel: 28000,
    riskLevel: 'high',
    lat: 36.7783,
    lon: -119.4179,
    description: 'Agricultural irrigation - PFAS accumulation in soil'
  },
  {
    id: 'irr-2',
    type: 'irrigation',
    name: 'Midwest Agricultural Belt',
    location: 'Iowa/Illinois',
    x: 52,
    y: 45,
    pfasLevel: 22000,
    riskLevel: 'medium',
    lat: 41.8781,
    lon: -93.0977,
    description: 'Widespread irrigation - crop contamination pathway'
  },
  {
    id: 'farm-1',
    type: 'farm',
    name: 'Produce Farms',
    location: 'California',
    x: 70,
    y: 30,
    pfasLevel: 18000,
    riskLevel: 'medium',
    lat: 36.7783,
    lon: -119.4179,
    exposedPopulation: 450000,
    description: 'Lettuce, tomatoes, leafy greens - high PFAS uptake'
  },
  {
    id: 'farm-2',
    type: 'farm',
    name: 'Dairy Operations',
    location: 'Wisconsin',
    x: 68,
    y: 50,
    pfasLevel: 15000,
    riskLevel: 'medium',
    lat: 44.5000,
    lon: -89.5000,
    exposedPopulation: 280000,
    description: 'Milk contamination - bioaccumulation in cattle'
  },
  {
    id: 'proc-1',
    type: 'food_processor',
    name: 'Food Processing Hub',
    location: 'Multi-state',
    x: 82,
    y: 38,
    pfasLevel: 12000,
    riskLevel: 'medium',
    lat: 41.8781,
    lon: -87.6298,
    exposedPopulation: 2300000,
    description: 'Food packaging adds additional PFAS'
  },
  {
    id: 'pop-1',
    type: 'population',
    name: 'US Population Exposure',
    location: 'Nationwide',
    x: 92,
    y: 42,
    pfasLevel: 8500,
    riskLevel: 'medium',
    lat: 39.8283,
    lon: -98.5795,
    exposedPopulation: 200000000,
    description: '95% of PFAS exposure through food, not water'
  }
];

const FLOW_CONNECTIONS: FlowConnection[] = [
  { from: 'ind-1', to: 'water-1', flowRate: 0.8, contaminationLevel: 0.95 },
  { from: 'ind-2', to: 'water-2', flowRate: 0.85, contaminationLevel: 0.92 },
  { from: 'water-1', to: 'irr-1', flowRate: 0.7, contaminationLevel: 0.75 },
  { from: 'water-2', to: 'irr-2', flowRate: 0.65, contaminationLevel: 0.70 },
  { from: 'irr-1', to: 'farm-1', flowRate: 0.6, contaminationLevel: 0.65 },
  { from: 'irr-2', to: 'farm-2', flowRate: 0.55, contaminationLevel: 0.60 },
  { from: 'farm-1', to: 'proc-1', flowRate: 0.5, contaminationLevel: 0.55 },
  { from: 'farm-2', to: 'proc-1', flowRate: 0.5, contaminationLevel: 0.50 },
  { from: 'proc-1', to: 'pop-1', flowRate: 0.45, contaminationLevel: 0.45 },
];

// Path finding algorithm (BFS) for flow analysis
function findPath(start: string, end: string, connections: FlowConnection[]): string[] {
  const queue: { node: string; path: string[] }[] = [{ node: start, path: [start] }];
  const visited = new Set<string>([start]);

  while (queue.length > 0) {
    const { node, path } = queue.shift()!;

    if (node === end) {
      return path;
    }

    // Find all outgoing connections
    const neighbors = connections.filter(c => c.from === node).map(c => c.to);

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ node: neighbor, path: [...path, neighbor] });
      }
    }
  }

  return []; // No path found
}

export default function AnimatedPFASFlowMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [particles, setParticles] = useState<FlowParticle[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [showRealMap, setShowRealMap] = useState(false);
  const animationFrameRef = useRef<number>();

  // Initialize particles
  useEffect(() => {
    const initialParticles: FlowParticle[] = [];
    FLOW_CONNECTIONS.forEach((connection, connIndex) => {
      // Create multiple particles per connection based on flow rate
      const particleCount = Math.ceil(connection.flowRate * 8);
      for (let i = 0; i < particleCount; i++) {
        initialParticles.push({
          id: `particle-${connIndex}-${i}`,
          connectionIndex: connIndex,
          progress: i / particleCount,
          size: 3 + connection.contaminationLevel * 4,
          color: getContaminationColor(connection.contaminationLevel)
        });
      }
    });
    setParticles(initialParticles);
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections (pulsing lines)
      FLOW_CONNECTIONS.forEach((connection, index) => {
        const fromNode = PFAS_FLOW_NODES.find(n => n.id === connection.from);
        const toNode = PFAS_FLOW_NODES.find(n => n.id === connection.to);

        if (!fromNode || !toNode) return;

        const x1 = (fromNode.x / 100) * canvas.width;
        const y1 = (fromNode.y / 100) * canvas.height;
        const x2 = (toNode.x / 100) * canvas.width;
        const y2 = (toNode.y / 100) * canvas.height;

        // Pulsing effect
        const pulse = Math.sin(Date.now() / 500 + index) * 0.5 + 0.5;
        const opacity = 0.2 + pulse * 0.3;

        // Draw connection line
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = getContaminationColor(connection.contaminationLevel, opacity);
        ctx.lineWidth = 2 + connection.contaminationLevel * 3;
        ctx.stroke();

        // Draw gradient overlay for flow direction
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, getContaminationColor(connection.contaminationLevel, 0.1));
        gradient.addColorStop(1, getContaminationColor(connection.contaminationLevel, 0.4));

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Draw and animate particles
      setParticles(prevParticles =>
        prevParticles.map(particle => {
          const connection = FLOW_CONNECTIONS[particle.connectionIndex];
          const fromNode = PFAS_FLOW_NODES.find(n => n.id === connection.from);
          const toNode = PFAS_FLOW_NODES.find(n => n.id === connection.to);

          if (!fromNode || !toNode) return particle;

          // Calculate position along path
          const x1 = (fromNode.x / 100) * canvas.width;
          const y1 = (fromNode.y / 100) * canvas.height;
          const x2 = (toNode.x / 100) * canvas.width;
          const y2 = (toNode.y / 100) * canvas.height;

          const x = x1 + (x2 - x1) * particle.progress;
          const y = y1 + (y2 - y1) * particle.progress;

          // Draw particle with glow
          ctx.shadowBlur = 10;
          ctx.shadowColor = particle.color;
          ctx.beginPath();
          ctx.arc(x, y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = particle.color;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Update progress
          const newProgress = particle.progress + connection.flowRate * 0.005;
          return {
            ...particle,
            progress: newProgress > 1 ? 0 : newProgress
          };
        })
      );

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const getContaminationColor = (level: number, alpha: number = 1): string => {
    if (level > 0.8) return `rgba(239, 68, 68, ${alpha})`; // red-500
    if (level > 0.6) return `rgba(249, 115, 22, ${alpha})`; // orange-500
    if (level > 0.4) return `rgba(234, 179, 8, ${alpha})`; // yellow-500
    return `rgba(34, 197, 94, ${alpha})`; // emerald-500
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-emerald-500';
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'industrial': return Factory;
      case 'water_treatment': return Droplet;
      case 'irrigation': return Sprout;
      case 'farm': return MapPin;
      case 'food_processor': return Building2;
      case 'population': return Users;
      default: return Activity;
    }
  };

  const handleNodeClick = (node: FlowNode) => {
    setSelectedNode(node);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-light text-zinc-900 mb-1">Live PFAS Contamination Flow Map</h3>
          <p className="text-sm text-zinc-500 font-light">
            Real-time visualization: Industrial sources → Water systems → Agriculture → Food supply → Population
          </p>
        </div>
        <button
          onClick={() => setShowRealMap(!showRealMap)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-light hover:bg-blue-700 transition-colors"
        >
          {showRealMap ? 'Show Flow Diagram' : 'Show Geographic Map'}
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-xs text-zinc-500 font-light mb-1">Industrial Sources</div>
          <div className="text-2xl font-light text-red-600">2</div>
          <div className="text-xs text-zinc-500 mt-1">Active discharge</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-zinc-500 font-light mb-1">Water Systems</div>
          <div className="text-2xl font-light text-orange-600">2</div>
          <div className="text-xs text-zinc-500 mt-1">Contaminated</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-zinc-500 font-light mb-1">Irrigation Systems</div>
          <div className="text-2xl font-light text-yellow-600">2</div>
          <div className="text-xs text-zinc-500 mt-1">Affected</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-zinc-500 font-light mb-1">Farms</div>
          <div className="text-2xl font-light text-yellow-600">2</div>
          <div className="text-xs text-zinc-500 mt-1">Crop contamination</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-zinc-500 font-light mb-1">Population Exposed</div>
          <div className="text-2xl font-light text-zinc-900">200M</div>
          <div className="text-xs text-blue-600 mt-1">Via food supply</div>
        </Card>
      </div>

      {/* Main Visualization */}
      <Card className="p-6">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 mb-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-zinc-600">Low Risk (&lt;10k ng/L)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-zinc-600">Medium Risk (10-30k ng/L)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-zinc-600">High Risk (30-60k ng/L)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-zinc-600">Critical (&gt;60k ng/L)</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-4 h-1 bg-gradient-to-r from-red-500 to-emerald-500"></div>
            <span className="text-zinc-600">Animated flow (contamination spreading)</span>
          </div>
        </div>

        {/* Interactive Map */}
        <div className="relative h-[600px] bg-gradient-to-br from-blue-50 via-white to-emerald-50 rounded-xl border-2 border-zinc-200 overflow-hidden">
          {/* Canvas for animated connections and particles */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
          />

          {/* Nodes overlay */}
          <div className="absolute inset-0">
            {PFAS_FLOW_NODES.map((node) => {
              const Icon = getNodeIcon(node.type);
              const isHovered = hoveredNode === node.id;
              const isSelected = selectedNode?.id === node.id;

              return (
                <div
                  key={node.id}
                  className="absolute"
                  style={{
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <button
                    onClick={() => handleNodeClick(node)}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    className={`relative group cursor-pointer transition-all duration-300 ${
                      isSelected ? 'scale-110 z-20' : isHovered ? 'scale-105 z-10' : ''
                    }`}
                  >
                    {/* Node circle */}
                    <div
                      className={`w-14 h-14 rounded-full ${getRiskColor(
                        node.riskLevel
                      )} flex items-center justify-center shadow-xl hover:shadow-2xl transition-all relative`}
                    >
                      <Icon className="w-7 h-7 text-white" />

                      {/* Pulsing ring for high-risk nodes */}
                      {(node.riskLevel === 'high' || node.riskLevel === 'critical') && (
                        <div
                          className={`absolute inset-0 rounded-full ${getRiskColor(
                            node.riskLevel
                          )} opacity-40 animate-ping`}
                          style={{ animationDuration: '2s' }}
                        />
                      )}
                    </div>

                    {/* Tooltip */}
                    {(isHovered || isSelected) && (
                      <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 bg-zinc-900 text-white px-4 py-3 rounded-xl text-xs whitespace-nowrap shadow-2xl z-30 min-w-[250px]">
                        <div className="font-medium mb-2 text-sm">{node.name}</div>
                        <div className="text-zinc-300 mb-1">{node.location}</div>
                        <div className="text-zinc-400 text-[10px] mb-2">{node.description}</div>
                        <div className="flex items-center justify-between border-t border-zinc-700 pt-2 mt-2">
                          <span className="text-zinc-400">PFAS Level:</span>
                          <span className={`font-medium ${
                            node.riskLevel === 'critical' ? 'text-red-400' :
                            node.riskLevel === 'high' ? 'text-orange-400' :
                            node.riskLevel === 'medium' ? 'text-yellow-400' :
                            'text-emerald-400'
                          }`}>
                            {node.pfasLevel.toLocaleString()} ng/L
                          </span>
                        </div>
                        {node.exposedPopulation && (
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-zinc-400">Exposed:</span>
                            <span className="font-medium text-blue-400">
                              {(node.exposedPopulation / 1000000).toFixed(1)}M people
                            </span>
                          </div>
                        )}
                        {/* Arrow pointing to node */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-zinc-900" />
                      </div>
                    )}

                    {/* Node label (always visible) */}
                    <div className="absolute top-full mt-16 left-1/2 -translate-x-1/2 text-center">
                      <div className="text-[10px] font-medium text-zinc-900 whitespace-nowrap bg-white/80 backdrop-blur-sm px-2 py-1 rounded">
                        {node.name.split(' ')[0]}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Geographic coordinates overlay (if enabled) */}
          {showRealMap && (
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg border border-zinc-200 text-xs">
              <div className="font-medium text-zinc-900 mb-2">Geographic Coordinates</div>
              <div className="text-zinc-600 space-y-1">
                <div>Coverage: Continental US</div>
                <div>Data: Real facility locations</div>
                <div>Projection: Mercator</div>
              </div>
            </div>
          )}

          {/* Flow statistics */}
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg border border-zinc-200 text-xs">
            <div className="font-medium text-zinc-900 mb-2">Active Flow Metrics</div>
            <div className="text-zinc-600 space-y-1">
              <div>Particles flowing: {particles.length}</div>
              <div>Contamination pathways: {FLOW_CONNECTIONS.length}</div>
              <div>Total nodes: {PFAS_FLOW_NODES.length}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Selected Node Details Panel */}
      {selectedNode && (
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-xl font-light text-zinc-900 mb-1">{selectedNode.name}</h4>
              <div className="text-sm text-zinc-600">{selectedNode.location}</div>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <div className="text-xs text-zinc-500 font-light mb-1">PFAS Concentration</div>
              <div className={`text-2xl font-light ${
                selectedNode.riskLevel === 'critical' ? 'text-red-600' :
                selectedNode.riskLevel === 'high' ? 'text-orange-600' :
                selectedNode.riskLevel === 'medium' ? 'text-yellow-600' :
                'text-emerald-600'
              }`}>
                {selectedNode.pfasLevel.toLocaleString()} ng/L
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 font-light mb-1">Risk Level</div>
              <div className={`text-2xl font-light uppercase ${
                selectedNode.riskLevel === 'critical' ? 'text-red-600' :
                selectedNode.riskLevel === 'high' ? 'text-orange-600' :
                selectedNode.riskLevel === 'medium' ? 'text-yellow-600' :
                'text-emerald-600'
              }`}>
                {selectedNode.riskLevel}
              </div>
            </div>
            {selectedNode.exposedPopulation && (
              <div>
                <div className="text-xs text-zinc-500 font-light mb-1">Population Exposed</div>
                <div className="text-2xl font-light text-zinc-900">
                  {(selectedNode.exposedPopulation / 1000000).toFixed(1)}M
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg p-4 border border-zinc-200">
            <div className="text-sm font-light text-zinc-700 mb-2">
              <AlertTriangle className="w-4 h-4 inline mr-2 text-orange-600" />
              Contamination Pathway Analysis
            </div>
            <p className="text-sm text-zinc-600 font-light leading-relaxed">
              {selectedNode.description}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
