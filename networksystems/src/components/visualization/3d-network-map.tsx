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

  // Mock data for African mining network
  const mockNodes: NetworkNode[] = [
    {
      id: 'witwatersrand-gold',
      type: 'mining_site',
      name: 'Witwatersrand Gold Complex',
      position: { lat: -26.2041, lng: 28.0473, elevation: 1753 },
      data: {
        production: 285000,
        efficiency: 87.3,
        status: 'operational',
        connections: ['johannesburg-proc', 'pretoria-lab']
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
        connections: ['lusaka-hub', 'ndola-proc']
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
        connections: ['lubumbashi-proc', 'kinshasa-hub']
      }
    },
    {
      id: 'johannesburg-proc',
      type: 'processing_facility',
      name: 'Johannesburg Processing Hub',
      position: { lat: -26.2044, lng: 28.0456, elevation: 1760 },
      data: {
        production: 180000,
        efficiency: 89.7,
        status: 'operational',
        connections: ['witwatersrand-gold', 'cape-town-port']
      }
    },
    {
      id: 'pretoria-lab',
      type: 'research_lab',
      name: 'SOBapp Research Center',
      position: { lat: -25.7479, lng: 28.2293, elevation: 1339 },
      data: {
        production: 0,
        efficiency: 95.2,
        status: 'operational',
        connections: ['witwatersrand-gold', 'johannesburg-proc']
      }
    }
  ];

  const mockEdges: NetworkEdge[] = [
    { source: 'witwatersrand-gold', target: 'johannesburg-proc', type: 'transport', strength: 0.9, distance: 15 },
    { source: 'witwatersrand-gold', target: 'pretoria-lab', type: 'data_flow', strength: 0.8, distance: 60 },
    { source: 'copperbelt-zambia', target: 'katanga-drc', type: 'supply_chain', strength: 0.7, distance: 180 },
    { source: 'johannesburg-proc', target: 'pretoria-lab', type: 'communication', strength: 0.85, distance: 55 }
  ];

  const activeNodes = nodes.length > 0 ? nodes : mockNodes;
  const activeEdges = edges.length > 0 ? edges : mockEdges;

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e1a);
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
        <div className="absolute inset-0 bg-zinc-900 bg-opacity-75 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <div className="mt-4 text-white">Loading 3D Network Map...</div>
          </div>
        </div>
      )}

      {selectedNodeData && (
        <div className="absolute top-4 right-4 bg-zinc-900 bg-opacity-90 text-white p-4 rounded-lg max-w-sm">
          <h3 className="text-lg font-bold mb-2">{selectedNodeData.name}</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Type:</span>
              <span className="capitalize">{selectedNodeData.type.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={`capitalize ${
                selectedNodeData.data.status === 'operational' ? 'text-green-400' : 'text-red-400'
              }`}>
                {selectedNodeData.data.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Efficiency:</span>
              <span className="text-blue-400">{selectedNodeData.data.efficiency.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Production:</span>
              <span className="text-yellow-400">{selectedNodeData.data.production.toLocaleString()} t</span>
            </div>
            <div className="flex justify-between">
              <span>Location:</span>
              <span className="text-zinc-300">
                {selectedNodeData.position.lat.toFixed(3)}, {selectedNodeData.position.lng.toFixed(3)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Elevation:</span>
              <span className="text-zinc-300">{selectedNodeData.position.elevation}m</span>
            </div>
            <div className="flex justify-between">
              <span>Connections:</span>
              <span className="text-emerald-400">{selectedNodeData.data.connections.length}</span>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-zinc-900 bg-opacity-90 text-white p-3 rounded-lg">
        <div className="text-sm space-y-2">
          <div className="font-semibold mb-2">Network Legend:</div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-xs">Mining Sites</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
            <span className="text-xs">Processing Facilities</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs">Research Labs</span>
          </div>
          <div className="border-t border-zinc-600 pt-2 mt-2">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-0.5 bg-orange-500"></div>
              <span className="text-xs">Transport</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-0.5 bg-cyan-400"></div>
              <span className="text-xs">Communication</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-0.5 bg-red-400"></div>
              <span className="text-xs">Supply Chain</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-0.5 bg-teal-400"></div>
              <span className="text-xs">Data Flow</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}