'use client';

import { useEffect, useState } from 'react';
import ThreeDNetworkMap from '@/components/visualization/3d-network-map';

type DistressNode = {
  id: string;
  type: 'mining_site' | 'processing_facility' | 'research_lab' | 'logistics_hub';
  name: string;
  address?: string;
  position: {
    lat: number;
    lng: number;
    elevation: number;
  };
  data: {
    production: number;
    efficiency: number;
    status: 'operational' | 'maintenance' | 'offline';
    connections: string[];
    lienTotal?: number;
    riskProfile?: string;
    permits?: Array<{
      type: 'dental' | 'medical' | 'environmental' | 'other';
      isHistorical: boolean;
    }>;
  };
};

type DistressEdge = {
  source: string;
  target: string;
  type: 'transport' | 'communication' | 'supply_chain' | 'data_flow';
  strength: number;
  distance: number;
};

const distressEdges: DistressEdge[] = [
  { source: 'north-avenue-cluster', target: 'dpw-hub', type: 'data_flow', strength: 0.82, distance: 2 },
  { source: 'north-avenue-cluster', target: 'lien-lab', type: 'communication', strength: 0.74, distance: 3 },
  { source: 'west-baltimore-core', target: 'harbor-logistics', type: 'transport', strength: 0.61, distance: 4 },
  { source: 'west-baltimore-core', target: 'north-avenue-cluster', type: 'supply_chain', strength: 0.68, distance: 2 }
];

export default function WarRoomMap() {
  const [nodes, setNodes] = useState<DistressNode[]>([]);

  useEffect(() => {
    let isActive = true;
    fetch('/api/nodes/scan?zipCode=21201,21202')
      .then((response) => response.json())
      .then((data) => {
        if (!isActive) return;
        setNodes(data.nodes || []);
      })
      .catch(() => {
        if (!isActive) return;
        setNodes([]);
      });
    return () => {
      isActive = false;
    };
  }, []);

  return <ThreeDNetworkMap nodes={nodes} edges={distressEdges} />;
}
