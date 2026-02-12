'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import * as d3 from 'd3';
import { fetchRealPropertyByAddress, RealPropertyRecord } from '@/lib/data-sources';
import Link from 'next/link';

interface NetworkNode {
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
      distressType?: 'DISTRESS_RED' | 'ENVIRONMENTAL_RISK' | 'STANDARD';
      evidence?: {
        serviceRequestId?: string;
        foreclosureId?: string;
        foreclosureStatus?: string;
        filingDate?: string;
        openedDate?: string;
      };
      permits?: Array<{
        type: 'dental' | 'medical' | 'environmental' | 'other';
        isHistorical: boolean;
      }>;
    };
}

interface NetworkEdge {
  source: string;
  target: string;
  type: 'transport' | 'communication' | 'supply_chain' | 'data_flow';
  strength: number;
  distance: number;
}

interface ThreeDNetworkMapProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  selectedNode?: string;
  onNodeSelect?: (nodeId: string) => void;
}

export default function ThreeDNetworkMap({
  nodes = [],
  edges = [],
  selectedNode,
  onNodeSelect
}: ThreeDNetworkMapProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNodeData, setSelectedNodeData] = useState<NetworkNode | null>(null);
  const [propertyRecord, setPropertyRecord] = useState<RealPropertyRecord | null>(null);
  const [propertyLoading, setPropertyLoading] = useState(false);

  const nodeTypeLabels: Record<NetworkNode['type'], string> = {
    mining_site: 'Rowhouse Cluster',
    processing_facility: 'Infrastructure Hub',
    research_lab: 'DPW Audit Lab',
    logistics_hub: 'Lien Logistics'
  };

  // Mock data for Baltimore infrastructure network
  const mockNodes: NetworkNode[] = [
    {
      id: 'north-avenue-cluster',
      type: 'mining_site',
      name: 'North Ave Rowhouse Cluster',
      address: '1900 N Avenue, Baltimore, MD',
      position: { lat: 39.3114, lng: -76.6166, elevation: 12 },
      data: {
        production: 124,
        efficiency: 87.3,
        status: 'operational',
        connections: ['dpw-hub', 'lien-lab'],
        lienTotal: 0,
        riskProfile: 'Standard',
        permits: [{ type: 'dental', isHistorical: true }]
      }
    },
    {
      id: 'west-baltimore-core',
      type: 'mining_site',
      name: 'West Baltimore Core',
      address: '1200 W Baltimore St, Baltimore, MD',
      position: { lat: 39.2905, lng: -76.6349, elevation: 20 },
      data: {
        production: 182,
        efficiency: 82.1,
        status: 'operational',
        connections: ['harbor-logistics', 'dpw-hub'],
        lienTotal: 1450,
        riskProfile: 'Lien Distress',
        permits: [{ type: 'medical', isHistorical: true }]
      }
    },
    {
      id: 'harbor-logistics',
      type: 'mining_site',
      name: 'Inner Harbor Logistics',
      address: '1910 Russell St, Baltimore, MD',
      position: { lat: 39.2847, lng: -76.6082, elevation: 6 },
      data: {
        production: 96,
        efficiency: 74.5,
        status: 'maintenance',
        lienTotal: 920,
        riskProfile: 'Operational Deadlock',
        connections: ['west-baltimore-core']
      }
    },
    {
      id: 'dpw-hub',
      type: 'processing_facility',
      name: 'DPW Billing Hub',
      address: '100 N Holliday St, Baltimore, MD',
      position: { lat: 39.3007, lng: -76.6152, elevation: 18 },
      data: {
        production: 210,
        efficiency: 91.4,
        status: 'operational',
        connections: ['north-avenue-cluster', 'west-baltimore-core'],
        lienTotal: 0,
        riskProfile: 'Standard',
        permits: [{ type: 'environmental', isHistorical: false }]
      }
    },
    {
      id: 'lien-lab',
      type: 'research_lab',
      name: 'Lien Filing Intelligence',
      address: '1600 E Madison St, Baltimore, MD',
      position: { lat: 39.2989, lng: -76.5941, elevation: 10 },
      data: {
        production: 0,
        efficiency: 88.7,
        status: 'operational',
        lienTotal: 2200,
        riskProfile: 'CERCLA High Priority',
        connections: ['north-avenue-cluster']
      }
    }
  ];

  const mockEdges: NetworkEdge[] = [
    { source: 'north-avenue-cluster', target: 'dpw-hub', type: 'data_flow', strength: 0.82, distance: 2 },
    { source: 'north-avenue-cluster', target: 'lien-lab', type: 'communication', strength: 0.74, distance: 3 },
    { source: 'west-baltimore-core', target: 'harbor-logistics', type: 'transport', strength: 0.61, distance: 4 },
    { source: 'west-baltimore-core', target: 'north-avenue-cluster', type: 'supply_chain', strength: 0.68, distance: 2 }
  ];

  const activeNodes = nodes.length > 0 ? nodes : mockNodes;
  const activeEdges = edges.length > 0 ? edges : mockEdges;

  const isInstitutionalOwner = (name?: string) => {
    if (!name) return false;
    const upper = name.toUpperCase();
    return ['LLC', 'INC', 'CORP', 'COMPANY', 'CO.', 'LTD', 'LP', 'TRUST'].some((tag) => upper.includes(tag));
  };

  useEffect(() => {
    if (!selectedNodeData?.address) {
      setPropertyRecord(null);
      return;
    }
    let isActive = true;
    setPropertyLoading(true);
    fetchRealPropertyByAddress(selectedNodeData.address)
      .then((record) => {
        if (!isActive) return;
        setPropertyRecord(record);
      })
      .catch(() => {
        if (!isActive) return;
        setPropertyRecord(null);
      })
      .finally(() => {
        if (!isActive) return;
        setPropertyLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [selectedNodeData?.address]);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    sceneRef.current = scene;

    // Create geographic coordinate system
    const earthRadius = 100;
    const scaleX = 2; // Longitude scaling
    const scaleZ = 2; // Latitude scaling

    // Convert lat/lng to 3D coordinates
    const latLngTo3D = (lat: number, lng: number, elevation: number = 0) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);

      const radius = earthRadius + (elevation / 100);

      return {
        x: radius * Math.sin(phi) * Math.cos(theta) * scaleX,
        y: radius * Math.cos(phi) + (elevation / 50),
        z: radius * Math.sin(phi) * Math.sin(theta) * scaleZ
      };
    };

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      10000
    );
    const focusLat = 39.2783; // Russell St / Biopark midpoint
    const focusLng = -76.6255;
    const focus = latLngTo3D(focusLat, focusLng, 12);
    camera.position.set(focus.x + 120, focus.y + 140, focus.z + 200);
    camera.lookAt(new THREE.Vector3(focus.x, focus.y, focus.z));
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.1);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create nodes
    const nodeObjects: { [key: string]: THREE.Mesh } = {};
    const permitHalos: Array<{ mesh: THREE.Mesh; material: THREE.MeshBasicMaterial }> = [];

    activeNodes.forEach(node => {
      const pos = latLngTo3D(node.position.lat, node.position.lng, node.position.elevation);

      let geometry: THREE.BufferGeometry;
      let material: THREE.Material;

      const hasHistoricalPermit = node.data.permits?.some(
        (permit) => permit.isHistorical && (permit.type === 'dental' || permit.type === 'medical')
      );
      const hasLienDistress = (node.data.lienTotal ?? 0) > 750;

      // Different shapes for different node types
      switch (node.type) {
        case 'mining_site':
          geometry = new THREE.ConeGeometry(3, 8, 8);
          material = new THREE.MeshLambertMaterial({
            color: hasLienDistress ? 0xdc2626 : (hasHistoricalPermit ? 0xffbf00 : 0x00ff41)
          });
          break;
        case 'processing_facility':
          geometry = new THREE.BoxGeometry(5, 5, 5);
          material = new THREE.MeshLambertMaterial({
            color: hasLienDistress ? 0xdc2626 : (hasHistoricalPermit ? 0xffbf00 : 0x00ff41)
          });
          break;
        case 'research_lab':
          geometry = new THREE.SphereGeometry(3, 16, 16);
          material = new THREE.MeshLambertMaterial({
            color: hasLienDistress ? 0xdc2626 : (hasHistoricalPermit ? 0xffbf00 : 0x00ff41)
          });
          break;
        default:
          geometry = new THREE.OctahedronGeometry(3);
          material = new THREE.MeshLambertMaterial({ color: hasLienDistress ? 0xdc2626 : 0x00ff41 });
      }

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { nodeId: node.id, nodeData: node };

      // Add efficiency indicator
      if (node.data.efficiency > 90) {
        const haloGeometry = new THREE.RingGeometry(4, 6, 16);
        const haloMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ff41,
          transparent: true,
          opacity: 0.3
        });
        const halo = new THREE.Mesh(haloGeometry, haloMaterial);
        halo.position.copy(mesh.position);
        halo.lookAt(camera.position);
        scene.add(halo);
      }

      if (hasHistoricalPermit) {
        const permitHaloGeometry = new THREE.RingGeometry(6, 8, 20);
        const permitHaloMaterial = new THREE.MeshBasicMaterial({
          color: 0xffbf00,
          transparent: true,
          opacity: 0.35
        });
        const permitHalo = new THREE.Mesh(permitHaloGeometry, permitHaloMaterial);
        permitHalo.position.copy(mesh.position);
        permitHalo.lookAt(camera.position);
        scene.add(permitHalo);
        permitHalos.push({ mesh: permitHalo, material: permitHaloMaterial });
      }

      scene.add(mesh);
      nodeObjects[node.id] = mesh;
    });

    // Create edges/connections
    activeEdges.forEach(edge => {
      const sourceNode = activeNodes.find(n => n.id === edge.source);
      const targetNode = activeNodes.find(n => n.id === edge.target);

      if (sourceNode && targetNode) {
        const sourcePos = latLngTo3D(sourceNode.position.lat, sourceNode.position.lng, sourceNode.position.elevation);
        const targetPos = latLngTo3D(targetNode.position.lat, targetNode.position.lng, targetNode.position.elevation);

        const points = [
          new THREE.Vector3(sourcePos.x, sourcePos.y, sourcePos.z),
          new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z)
        ];

        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        let color: number;
        switch (edge.type) {
          case 'transport': color = 0xffa500; break;
          case 'communication': color = 0x00ffff; break;
          case 'supply_chain': color = 0xff6b6b; break;
          case 'data_flow': color = 0x4ecdc4; break;
          default: color = 0xffffff;
        }

        const material = new THREE.LineBasicMaterial({
          color,
          linewidth: edge.strength * 3,
          transparent: true,
          opacity: 0.7
        });

        const line = new THREE.Line(geometry, material);
        scene.add(line);
      }
    });

    // Add African continent outline (simplified)
    const continentPoints = [
      // Simplified Africa outline points
      new THREE.Vector3(-20, -5, -40),
      new THREE.Vector3(40, -5, -40),
      new THREE.Vector3(35, -5, 30),
      new THREE.Vector3(-15, -5, 35),
      new THREE.Vector3(-20, -5, -40)
    ];

    const continentGeometry = new THREE.BufferGeometry().setFromPoints(continentPoints);
    const continentMaterial = new THREE.LineBasicMaterial({
      color: 0x444444,
      transparent: true,
      opacity: 0.3
    });
    const continentOutline = new THREE.Line(continentGeometry, continentMaterial);
    scene.add(continentOutline);

    // Mouse interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (event: MouseEvent) => {
      if (!mountRef.current || !camera || !renderer) return;

      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(Object.values(nodeObjects));

      if (intersects.length > 0) {
        const nodeData = intersects[0].object.userData.nodeData;
        setSelectedNodeData(nodeData);
        onNodeSelect?.(nodeData.id);
      }
    };

    renderer.domElement.addEventListener('click', handleClick);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Rotate the entire network slowly
      scene.rotation.y += 0.001;

      // Pulse selected node
      if (selectedNode && nodeObjects[selectedNode]) {
        const time = Date.now() * 0.005;
        const scale = 1 + Math.sin(time) * 0.2;
        nodeObjects[selectedNode].scale.setScalar(scale);
      }

      // Pulse environmental permit halos
      permitHalos.forEach((halo, index) => {
        const time = Date.now() * 0.004 + index;
        const pulse = (Math.sin(time) + 1) / 2;
        halo.mesh.scale.setScalar(1 + pulse * 0.35);
        halo.material.opacity = 0.25 + pulse * 0.35;
      });

      renderer.render(scene, camera);
    };

    animate();
    setIsLoading(false);

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;

      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleClick);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [activeNodes, activeEdges, selectedNode, onNodeSelect]);

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" />

      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <div className="mt-4 text-zinc-600 font-light">Loading 3D Network Map...</div>
          </div>
        </div>
      )}

      {selectedNodeData && (
        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-emerald-100 p-4 rounded-lg max-w-sm border border-emerald-400/20 shadow-lg">
          <h3 className="text-lg font-semibold mb-2">{selectedNodeData.name}</h3>
          <div className="space-y-2 text-sm text-emerald-100">
            {selectedNodeData.address && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-400">Forensic Snapshot</p>
                <p className="mt-1 text-xs">Address: {selectedNodeData.address}</p>
                <p className="text-xs">Lien Total: ${selectedNodeData.data.lienTotal?.toLocaleString() || '0'}</p>
                <p className="text-xs">Risk Profile: {selectedNodeData.data.riskProfile || 'Standard'}</p>
                {propertyLoading ? (
                  <p className="text-xs text-emerald-300 mt-2">Target Entity: Loading...</p>
                ) : propertyRecord ? (
                  <div className="mt-2 text-xs">
                    <p className={isInstitutionalOwner(propertyRecord.ownerName) ? 'text-emerald-300' : ''}>
                      Target Entity: {propertyRecord.ownerName || 'Unknown'}
                    </p>
                    <p>Last Sale Price: ${propertyRecord.lastSalePrice?.toLocaleString() || '0'}</p>
                  </div>
                ) : (
                  <p className="text-xs text-emerald-300 mt-2">Target Entity: Not found</p>
                )}
                {selectedNodeData.data.distressType === 'DISTRESS_RED' && (
                  <div className="mt-3 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">
                    <p className="uppercase tracking-[0.3em] text-rose-300">Evidence Report</p>
                    <p className="mt-2">
                      Infrastructure Breach: Case #{selectedNodeData.data.evidence?.serviceRequestId || 'Unknown'} - Opened{' '}
                      {selectedNodeData.data.evidence?.openedDate || 'Unknown'}
                    </p>
                    <p>
                      Financial Deadlock: Foreclosure Filed {selectedNodeData.data.evidence?.filingDate || 'On File'}
                    </p>
                    <div className="mt-3">
                      <Link
                        href={`/api/pdf/abatement?caseId=${encodeURIComponent(selectedNodeData.data.evidence?.serviceRequestId || 'SR-UNKNOWN')}&accountNumber=UNKNOWN&address=${encodeURIComponent(selectedNodeData.address || 'UNKNOWN ADDRESS')}&owner=${encodeURIComponent(propertyRecord?.ownerName || 'OWNER OF RECORD')}`}
                        className="inline-flex items-center rounded-full border border-rose-400/40 bg-rose-500/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-rose-100 transition hover:bg-rose-500/30"
                      >
                        Generate Abatement Letter
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-between">
              <span>Type:</span>
              <span>{nodeTypeLabels[selectedNodeData.type]}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={`capitalize ${
                selectedNodeData.data.status === 'operational' ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {selectedNodeData.data.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Efficiency:</span>
              <span className="text-emerald-300">{selectedNodeData.data.efficiency.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Audit Volume:</span>
              <span className="text-amber-300">{selectedNodeData.data.production.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Location:</span>
              <span className="text-emerald-200/70">
                {selectedNodeData.position.lat.toFixed(3)}, {selectedNodeData.position.lng.toFixed(3)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Elevation:</span>
              <span className="text-emerald-200/70">{selectedNodeData.position.elevation}m</span>
            </div>
            <div className="flex justify-between">
              <span>Connections:</span>
              <span className="text-emerald-300">{selectedNodeData.data.connections.length}</span>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm text-emerald-100 p-3 rounded-lg border border-emerald-400/20 shadow-lg">
        <div className="text-sm space-y-2">
          <div className="font-semibold mb-2 text-emerald-100">Network Legend:</div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-emerald-400 rounded"></div>
            <span className="text-xs">Operational Nodes</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
            <span className="text-xs">Distress Red (Lien > $750)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
            <span className="text-xs">Historical Medical Permits</span>
          </div>
          <div className="border-t border-emerald-400/20 pt-2 mt-2">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-0.5 bg-emerald-400"></div>
              <span className="text-xs">Ownership Links</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-0.5 bg-amber-400"></div>
              <span className="text-xs">Billing Ties</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-0.5 bg-red-400"></div>
              <span className="text-xs">Lien Links</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-0.5 bg-teal-400"></div>
              <span className="text-xs">Audit Feeds</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
