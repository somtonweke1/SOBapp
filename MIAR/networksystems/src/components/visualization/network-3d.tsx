'use client';

import React from 'react';
import { Node, Edge } from '@/stores/network-store';

interface Network3DProps {
  nodes: Node[];
  edges: Edge[];
  selectedNode?: string | null;
  onNodeClick?: (nodeId: string) => void;
  showLabels?: boolean;
  nodeColors?: Record<string, string>;
  width?: number;
  height?: number;
  colorScheme?: string;
}

const Network3D: React.FC<Network3DProps> = ({
  nodes,
  edges,
  selectedNode,
  onNodeClick,
  showLabels = true,
  nodeColors = {},
  width = 800,
  height = 600,
  colorScheme = 'default'
}) => {
  return (
    <div className="w-full h-full bg-zinc-50 rounded-lg border flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H5m14 14H5" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">Network Visualization</h3>
          <p className="text-sm text-zinc-600 mt-1">
            {nodes.length} nodes, {edges.length} connections
          </p>
          {selectedNode && (
            <p className="text-sm text-blue-600 mt-2">
              Selected: {nodes.find(n => n.id === selectedNode)?.label || selectedNode}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Nodes:</span> {nodes.length}
          </div>
          <div>
            <span className="font-medium">Edges:</span> {edges.length}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {nodes.slice(0, 5).map(node => (
            <button
              key={node.id}
              onClick={() => onNodeClick?.(node.id)}
              className={`px-3 py-1 text-xs rounded-full border ${
                selectedNode === node.id
                  ? 'bg-blue-100 border-blue-300 text-blue-800'
                  : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {node.label}
            </button>
          ))}
          {nodes.length > 5 && (
            <span className="px-3 py-1 text-xs text-zinc-500">
              +{nodes.length - 5} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Network3D;

// Export for backward compatibility
export { Network3D };

// Utility function to convert 2D network to 3D (simplified version)
export function convertTo3D(nodes: any[], edges: any[], centralityResults?: any[]) {
  return {
    nodes3D: nodes.map(node => ({ ...node, z: 0 })),
    edges3D: edges
  };
}