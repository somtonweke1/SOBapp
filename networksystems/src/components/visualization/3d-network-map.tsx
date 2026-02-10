'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import * as d3 from 'd3';

interface NetworkNode {
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
      position: { lat: 39.3114, lng: -76.6166, elevation: 12 },
      data: {
        production: 124,
        efficiency: 87.3,
        status: 'operational',
        connections: ['dpw-hub', 'lien-lab']
      }
    },
    {
      id: 'west-baltimore-core',
      type: 'mining_site',
      name: 'West Baltimore Core',
      position: { lat: 39.2905, lng: -76.6349, elevation: 20 },
      data: {
        production: 182,
        efficiency: 82.1,
        status: 'operational',
        connections: ['harbor-logistics', 'dpw-hub']
      }
    },
    {
      id: 'harbor-logistics',
      type: 'mining_site',
      name: 'Inner Harbor Logistics',
      position: { lat: 39.2847, lng: -76.6082, elevation: 6 },
      data: {
        production: 96,
        efficiency: 74.5,
        status: 'maintenance',
        connections: ['west-baltimore-core']
      }
    },
    {
      id: 'dpw-hub',
      type: 'processing_facility',
      name: 'DPW Billing Hub',
      position: { lat: 39.3007, lng: -76.6152, elevation: 18 },
      data: {
        production: 210,
        efficiency: 91.4,
        status: 'operational',
        connections: ['north-avenue-cluster', 'west-baltimore-core']
      }
    },
    {
      id: 'lien-lab',
      type: 'research_lab',
      name: 'Lien Filing Intelligence',
      position: { lat: 39.2989, lng: -76.5941, elevation: 10 },
      data: {
        production: 0,
        efficiency: 88.7,
        status: 'operational',
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

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4f4f5);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      10000
    );
    camera.position.set(0, 200, 400);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

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

    // Create nodes
    const nodeObjects: { [key: string]: THREE.Mesh } = {};

    activeNodes.forEach(node => {
      const pos = latLngTo3D(node.position.lat, node.position.lng, node.position.elevation);

      let geometry: THREE.BufferGeometry;
      let material: THREE.Material;

      // Different shapes for different node types
      switch (node.type) {
        case 'mining_site':
          geometry = new THREE.ConeGeometry(3, 8, 8);
          material = new THREE.MeshLambertMaterial({
            color: node.data.status === 'operational' ? 0xffd700 : 0xff4444
          });
          break;
        case 'processing_facility':
          geometry = new THREE.BoxGeometry(5, 5, 5);
          material = new THREE.MeshLambertMaterial({
            color: node.data.status === 'operational' ? 0x4a90e2 : 0xff4444
          });
          break;
        case 'research_lab':
          geometry = new THREE.SphereGeometry(3, 16, 16);
          material = new THREE.MeshLambertMaterial({
            color: node.data.status === 'operational' ? 0x7ed321 : 0xff4444
          });
          break;
        default:
          geometry = new THREE.OctahedronGeometry(3);
          material = new THREE.MeshLambertMaterial({ color: 0x9013fe });
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
          color: 0x00ff00,
          transparent: true,
          opacity: 0.3
        });
        const halo = new THREE.Mesh(haloGeometry, haloMaterial);
        halo.position.copy(mesh.position);
        halo.lookAt(camera.position);
        scene.add(halo);
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
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm text-zinc-900 p-4 rounded-lg max-w-sm border border-zinc-200/50 shadow-lg">
          <h3 className="text-lg font-semibold mb-2">{selectedNodeData.name}</h3>
          <div className="space-y-1 text-sm text-zinc-700">
            <div className="flex justify-between">
              <span>Type:</span>
              <span>{nodeTypeLabels[selectedNodeData.type]}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={`capitalize ${
                selectedNodeData.data.status === 'operational' ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {selectedNodeData.data.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Efficiency:</span>
              <span className="text-blue-600">{selectedNodeData.data.efficiency.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Audit Volume:</span>
              <span className="text-amber-600">{selectedNodeData.data.production.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Location:</span>
              <span className="text-zinc-500">
                {selectedNodeData.position.lat.toFixed(3)}, {selectedNodeData.position.lng.toFixed(3)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Elevation:</span>
              <span className="text-zinc-500">{selectedNodeData.position.elevation}m</span>
            </div>
            <div className="flex justify-between">
              <span>Connections:</span>
              <span className="text-emerald-600">{selectedNodeData.data.connections.length}</span>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm text-zinc-700 p-3 rounded-lg border border-zinc-200/50 shadow-lg">
        <div className="text-sm space-y-2">
          <div className="font-semibold mb-2 text-zinc-900">Network Legend:</div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-xs">Rowhouse Clusters</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
            <span className="text-xs">Infrastructure Hubs</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs">DPW Audit Labs</span>
          </div>
          <div className="border-t border-zinc-200 pt-2 mt-2">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-0.5 bg-orange-500"></div>
              <span className="text-xs">Ownership Links</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-0.5 bg-cyan-400"></div>
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
