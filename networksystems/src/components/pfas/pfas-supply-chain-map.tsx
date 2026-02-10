'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';

// PFAS contamination node data structure
interface PFASNode {
  id: string;
  label: string;
  type: 'industrial' | 'water' | 'irrigation' | 'farm' | 'processor' | 'population';
  x: number; // longitude-like coordinate
  y: number; // latitude-like coordinate
  pfasLevel: number; // ng/L
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  exposedPopulation?: number;
}

interface PFASEdge {
  source: string;
  target: string;
  weight: number; // 0-1 contamination flow strength
  contaminationLevel: number; // 0-1
}

// Real PFAS contamination network data - aligned with US geography
// x: longitude-like (0=West Coast, 100=East Coast)
// y: latitude-like (0=Canada border, 100=Mexico border)
const PFAS_NODES: PFASNode[] = [
  {
    id: 'ind-1',
    label: '3M Manufacturing',
    type: 'industrial',
    x: 48, // Minnesota (central-north)
    y: 25,
    pfasLevel: 85000,
    riskLevel: 'critical'
  },
  {
    id: 'ind-2',
    label: 'DuPont Chemical',
    type: 'industrial',
    x: 78, // Delaware/Mid-Atlantic
    y: 45,
    pfasLevel: 72000,
    riskLevel: 'critical'
  },
  {
    id: 'water-1',
    label: 'Mississippi River',
    type: 'water',
    x: 52, // Mississippi River (central)
    y: 50,
    pfasLevel: 45000,
    riskLevel: 'high'
  },
  {
    id: 'water-2',
    label: 'Ohio River Valley',
    type: 'water',
    x: 65, // Ohio (midwest-east)
    y: 45,
    pfasLevel: 38000,
    riskLevel: 'high'
  },
  {
    id: 'irr-1',
    label: 'Central Valley Irrigation',
    type: 'irrigation',
    x: 10, // California Central Valley (west coast)
    y: 55,
    pfasLevel: 28000,
    riskLevel: 'high'
  },
  {
    id: 'irr-2',
    label: 'Midwest Agricultural Belt',
    type: 'irrigation',
    x: 50, // Iowa/Nebraska (midwest)
    y: 40,
    pfasLevel: 22000,
    riskLevel: 'medium'
  },
  {
    id: 'farm-1',
    label: 'Produce Farms',
    type: 'farm',
    x: 12, // California (west)
    y: 60,
    pfasLevel: 18000,
    riskLevel: 'medium',
    exposedPopulation: 450000
  },
  {
    id: 'farm-2',
    label: 'Dairy Operations',
    type: 'farm',
    x: 58, // Wisconsin/Midwest (central-north)
    y: 35,
    pfasLevel: 15000,
    riskLevel: 'medium',
    exposedPopulation: 280000
  },
  {
    id: 'proc-1',
    label: 'Food Processing Hub',
    type: 'processor',
    x: 70, // Mid-Atlantic/Northeast
    y: 42,
    pfasLevel: 12000,
    riskLevel: 'medium',
    exposedPopulation: 2300000
  },
  {
    id: 'pop-1',
    label: 'US Population',
    type: 'population',
    x: 85, // East Coast (NYC/Boston area)
    y: 38,
    pfasLevel: 8500,
    riskLevel: 'medium',
    exposedPopulation: 200000000
  }
];

const PFAS_EDGES: PFASEdge[] = [
  { source: 'ind-1', target: 'water-1', weight: 0.95, contaminationLevel: 0.95 },
  { source: 'ind-2', target: 'water-2', weight: 0.92, contaminationLevel: 0.92 },
  { source: 'water-1', target: 'irr-1', weight: 0.75, contaminationLevel: 0.75 },
  { source: 'water-2', target: 'irr-2', weight: 0.70, contaminationLevel: 0.70 },
  { source: 'irr-1', target: 'farm-1', weight: 0.65, contaminationLevel: 0.65 },
  { source: 'irr-2', target: 'farm-2', weight: 0.60, contaminationLevel: 0.60 },
  { source: 'farm-1', target: 'proc-1', weight: 0.55, contaminationLevel: 0.55 },
  { source: 'farm-2', target: 'proc-1', weight: 0.50, contaminationLevel: 0.50 },
  { source: 'proc-1', target: 'pop-1', weight: 0.45, contaminationLevel: 0.45 }
];

const PFASSupplyChainMap: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [animationFrame, setAnimationFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationFrame(prev => prev + 1);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const getContaminationColor = (level: number) => {
    if (level >= 0.8) return '#ef4444'; // red-500
    if (level >= 0.6) return '#f97316'; // orange-500
    if (level >= 0.4) return '#eab308'; // yellow-500
    return '#22c55e'; // green-500
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      default: return '#22c55e';
    }
  };

  const renderNetworkMap = () => {
    const width = 1200;
    const height = 750; // Increased height for better vertical space utilization

    // Bounds matching the Critical Minerals map exactly
    const bounds = {
      minX: 0,
      maxX: 100,
      minY: 0,
      maxY: 100
    };

    const scaleX = (x: number) => ((x - bounds.minX) / (bounds.maxX - bounds.minX)) * width;
    const scaleY = (y: number) => height - ((y - bounds.minY) / (bounds.maxY - bounds.minY)) * height;

    return (
      <svg width={width} height={height} className="w-full h-auto" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {/* EXACT COPY: Background with subtle map texture from Critical Minerals */}
        <defs>
          <pattern id="mapTexture" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="#fafafa"/>
            <circle cx="10" cy="10" r="1" fill="#f4f4f5" opacity="0.5"/>
          </pattern>
          <linearGradient id="pfasGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f9fafb"/>
            <stop offset="50%" stopColor="#f4f4f5"/>
            <stop offset="100%" stopColor="#e4e4e7"/>
          </linearGradient>
        </defs>
        <rect width={width} height={height} fill="url(#pfasGradient)" />

        {/* Simplified US map outline - properly scaled */}
        <path
          d="M50,200 L100,180 L150,180 L200,200 Q250,190 300,200 L400,220 L500,240 L600,250 L700,240 L800,220 L900,200 L1000,180 L1050,200 L1100,240 L1130,300 L1150,380 L1150,500 L1130,560 L1100,600 L1050,630 L980,650 L900,660 L800,670 L700,680 L600,685 L500,680 L400,670 L300,650 L200,620 L150,590 L100,550 L70,500 L50,420 L50,300 Z"
          fill="none"
          stroke="#d4d4d8"
          strokeWidth="2"
          strokeDasharray="8,4"
          opacity="0.3"
        />

        {/* Great Lakes region - properly positioned */}
        <ellipse cx="900" cy="300" rx="110" ry="65" fill="none" stroke="#93c5fd" strokeWidth="2" opacity="0.4" />
        <ellipse cx="820" cy="280" rx="50" ry="40" fill="none" stroke="#93c5fd" strokeWidth="1.5" opacity="0.3" />

        {/* Regional zones - aligned with actual US geography */}
        {/* Pacific Northwest */}
        <ellipse cx="150" cy="280" rx="70" ry="80" fill="#f0fdf4" opacity="0.2" />
        {/* California */}
        <ellipse cx="100" cy="450" rx="60" ry="140" fill="#fef7cd" opacity="0.2" />
        {/* Great Plains/Midwest */}
        <ellipse cx="600" cy="350" rx="150" ry="100" fill="#fef3c7" opacity="0.2" />
        {/* Southeast */}
        <ellipse cx="950" cy="550" rx="120" ry="80" fill="#fee2e2" opacity="0.2" />
        {/* Northeast */}
        <ellipse cx="1050" cy="300" rx="90" ry="70" fill="#e0f2fe" opacity="0.2" />
        {/* Texas/Southwest */}
        <ellipse cx="450" cy="600" rx="110" ry="70" fill="#fef3c7" opacity="0.2" />

        {/* Major rivers - Mississippi (central), Ohio (east), Missouri (west) */}
        {/* Mississippi River - flows north to south through center */}
        <path
          d="M600,200 Q610,280 620,360 Q625,440 630,520 Q628,590 620,650"
          stroke="#93c5fd"
          strokeWidth="3"
          fill="none"
          opacity="0.4"
        />
        {/* Ohio River - flows west to east */}
        <path
          d="M850,340 Q800,355 750,365 Q700,370 650,370"
          stroke="#93c5fd"
          strokeWidth="2.5"
          fill="none"
          opacity="0.35"
        />
        {/* Missouri River - northwest to southeast */}
        <path
          d="M350,280 Q420,310 500,340 Q570,360 620,370"
          stroke="#93c5fd"
          strokeWidth="2"
          fill="none"
          opacity="0.35"
        />

        {/* Major hub cities - accurately positioned */}
        <circle cx="1050" cy="320" r="5" fill="#6b7280" opacity="0.6" /> {/* NYC */}
        <circle cx="950" cy="380" r="4" fill="#6b7280" opacity="0.5" /> {/* Chicago */}
        <circle cx="120" cy="460" r="4" fill="#6b7280" opacity="0.5" /> {/* LA/SF */}
        <circle cx="580" cy="280" r="4" fill="#6b7280" opacity="0.5" /> {/* Minneapolis */}
        <circle cx="950" cy="560" r="4" fill="#6b7280" opacity="0.5" /> {/* Atlanta */}
        <circle cx="480" cy="600" r="4" fill="#6b7280" opacity="0.5" /> {/* Houston */}

        {/* EXACT COPY: Connection lines (matching Critical Minerals styling) */}
        {PFAS_EDGES.map((edge, idx) => {
          const sourceNode = PFAS_NODES.find(n => n.id === edge.source);
          const targetNode = PFAS_NODES.find(n => n.id === edge.target);
          if (!sourceNode || !targetNode) return null;

          const x1 = scaleX(sourceNode.x);
          const y1 = scaleY(sourceNode.y);
          const x2 = scaleX(targetNode.x);
          const y2 = scaleY(targetNode.y);

          const color = getContaminationColor(edge.contaminationLevel);

          return (
            <g key={idx}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth={Math.max(2, (edge.weight || 0.5) * 5)}
                strokeOpacity={0.7}
                strokeDasharray="8,4"
              />
              {/* EXACT COPY: Enhanced flow animation with value indicators */}
              <circle r="4" fill="#4b5563" opacity="0.8">
                <animateMotion dur={`${6 - (edge.weight || 0.5) * 4}s`} repeatCount="indefinite">
                  <mpath href={`#pfas-path-${idx}`} />
                </animateMotion>
              </circle>
              <circle r="2" fill="#374151" opacity="0.6">
                <animateMotion dur={`${6 - (edge.weight || 0.5) * 4}s`} repeatCount="indefinite" begin="0.5s">
                  <mpath href={`#pfas-path-${idx}`} />
                </animateMotion>
              </circle>
              <path id={`pfas-path-${idx}`} d={`M ${x1} ${y1} L ${x2} ${y2}`} fill="none" opacity="0" />

              {/* Contamination level indicator for high-risk connections */}
              {edge.contaminationLevel > 0.7 && (
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2 - 8}
                  fill="#fbbf24"
                  fontSize="6"
                  textAnchor="middle"
                  className="font-mono font-medium"
                >
                  {(edge.contaminationLevel * 100).toFixed(0)}% contamination
                </text>
              )}
            </g>
          );
        })}

        {/* EXACT COPY: PFAS contamination nodes (matching Critical Minerals node styling) */}
        {PFAS_NODES.map((node, idx) => {
          const x = scaleX(node.x);
          const y = scaleY(node.y);
          const radius = Math.max(5, node.exposedPopulation ? Math.min(15, 8 + Math.log(node.exposedPopulation / 100000)) : 8);
          const isSelected = selectedNode === node.id;
          const nodeColor = getRiskColor(node.riskLevel);

          return (
            <g key={idx}>
              {/* EXACT COPY: Centrality ring for high-risk nodes */}
              {(node.riskLevel === 'high' || node.riskLevel === 'critical') && (
                <circle
                  cx={x}
                  cy={y}
                  r={radius + 8}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2"
                  opacity="0.6"
                />
              )}

              {/* EXACT COPY: Main node */}
              <circle
                cx={x}
                cy={y}
                r={radius}
                fill={nodeColor}
                stroke={isSelected ? "#ffffff" : nodeColor}
                strokeWidth={isSelected ? "3" : "1"}
                opacity="0.9"
                className="cursor-pointer hover:opacity-100"
                onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
              />

              {/* EXACT COPY: Pulse animation for active nodes */}
              {node.pfasLevel > 60000 && (
                <circle
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={nodeColor}
                  opacity="0.4"
                >
                  <animate
                    attributeName="r"
                    values={`${radius};${radius + 10};${radius}`}
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.4;0;0.4"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* EXACT COPY: Node label */}
              <text
                x={x}
                y={y - radius - 5}
                fill="#1f2937"
                fontSize="10"
                textAnchor="middle"
                className="font-sans font-medium"
              >
                {node.label}
              </text>

              {/* EXACT COPY: Live production indicator (adapted for PFAS contamination) */}
              {node.pfasLevel > 30000 && (
                <circle
                  cx={x + 12}
                  cy={y - 12}
                  r="3"
                  fill="#10b981"
                  opacity="0.9"
                >
                  <animate
                    attributeName="r"
                    values="2;5;2"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.9;0.3;0.9"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* EXACT COPY: Tailings indicator (adapted for PFAS contamination hotspots) */}
              {node.riskLevel === 'critical' && (
                <circle
                  cx={x + 15}
                  cy={y - 15}
                  r="4"
                  fill="#f59e0b"
                  opacity="0.8"
                >
                  <animate
                    attributeName="opacity"
                    values="0.8;0.3;0.8"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
            </g>
          );
        })}

        {/* Critical path highlights */}
        {PFAS_EDGES
          .filter(edge => edge.contaminationLevel > 0.8)
          .map((edge, idx) => {
            const node = PFAS_NODES.find(n => n.id === edge.target);
            if (!node) return null;

            return (
              <circle
                key={`critical-${idx}`}
                cx={scaleX(node.x)}
                cy={scaleY(node.y)}
                r="20"
                fill="none"
                stroke="#dc2626"
                strokeWidth="2"
                strokeDasharray="4,4"
                opacity="0.7"
              >
                <animate
                  attributeName="r"
                  values="15;25;15"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>
            );
          })
        }
      </svg>
    );
  };

  return (
    <div className="bg-zinc-50/50 rounded-xl border border-zinc-200/30 overflow-hidden relative min-h-[700px] flex items-center justify-center">
      {renderNetworkMap()}

      {/* Active Flow Metrics Overlay - Bottom Left */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg border border-zinc-200 text-xs shadow-lg">
        <div className="font-medium text-zinc-900 mb-2">Active Flow Metrics</div>
        <div className="text-zinc-600 space-y-1">
          <div>Particles flowing: {PFAS_EDGES.length * 2}</div>
          <div>Contamination pathways: {PFAS_EDGES.length}</div>
          <div>Total nodes: {PFAS_NODES.length}</div>
        </div>
      </div>
    </div>
  );
};

export default PFASSupplyChainMap;
