'use client';

import ThreeDNetworkMap from '@/components/visualization/3d-network-map';

type DistressNode = {
  id: string;
  type: 'mining_site' | 'processing_facility' | 'research_lab' | 'logistics_hub';
  name: string;
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
  };
};

type DistressEdge = {
  source: string;
  target: string;
  type: 'transport' | 'communication' | 'supply_chain' | 'data_flow';
  strength: number;
  distance: number;
};

const distressNodes: DistressNode[] = [
  {
    id: 'north-avenue-cluster',
    type: 'mining_site',
    name: 'North Ave Rowhouse Cluster',
    position: { lat: 39.3114, lng: -76.6166, elevation: 12 },
    data: { production: 24, efficiency: 78.2, status: 'operational', connections: ['dpw-hub', 'lien-lab'] }
  },
  {
    id: 'west-baltimore-core',
    type: 'processing_facility',
    name: 'West Baltimore Core',
    position: { lat: 39.2905, lng: -76.6349, elevation: 20 },
    data: { production: 41, efficiency: 82.1, status: 'operational', connections: ['north-avenue-cluster', 'harbor-logistics'] }
  },
  {
    id: 'dpw-hub',
    type: 'research_lab',
    name: 'DPW Billing Hub',
    position: { lat: 39.3007, lng: -76.6152, elevation: 18 },
    data: { production: 0, efficiency: 91.4, status: 'operational', connections: ['north-avenue-cluster', 'harbor-logistics'] }
  },
  {
    id: 'harbor-logistics',
    type: 'logistics_hub',
    name: 'Inner Harbor Logistics',
    position: { lat: 39.2847, lng: -76.6082, elevation: 6 },
    data: { production: 16, efficiency: 74.5, status: 'maintenance', connections: ['west-baltimore-core'] }
  },
  {
    id: 'lien-lab',
    type: 'research_lab',
    name: 'Lien Filing Intelligence',
    position: { lat: 39.2989, lng: -76.5941, elevation: 10 },
    data: { production: 0, efficiency: 88.7, status: 'operational', connections: ['north-avenue-cluster'] }
  }
];

const distressEdges: DistressEdge[] = [
  { source: 'north-avenue-cluster', target: 'dpw-hub', type: 'data_flow', strength: 0.82, distance: 2 },
  { source: 'north-avenue-cluster', target: 'lien-lab', type: 'communication', strength: 0.74, distance: 3 },
  { source: 'west-baltimore-core', target: 'harbor-logistics', type: 'transport', strength: 0.61, distance: 4 },
  { source: 'west-baltimore-core', target: 'north-avenue-cluster', type: 'supply_chain', strength: 0.68, distance: 2 }
];

export default function WarRoomMap() {
  return <ThreeDNetworkMap nodes={distressNodes} edges={distressEdges} />;
}
