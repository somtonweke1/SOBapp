'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Eye, 
  EyeOff, 
  Layers, 
  Globe, 
  Package,
  AlertTriangle,
  TrendingUp,
  Activity
} from 'lucide-react';

interface SupplyChainNode {
  id: string;
  name: string;
  type: 'mine' | 'processing' | 'transport' | 'storage' | 'manufacturing' | 'market';
  position: { x: number; y: number; z: number };
  size: number;
  status: 'operational' | 'constrained' | 'bottleneck' | 'offline';
  capacity: number;
  utilization: number;
  region: string;
  materials: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface SupplyChainFlow {
  id: string;
  from: string;
  to: string;
  material: string;
  volume: number;
  status: 'active' | 'delayed' | 'blocked' | 'planned';
  delayDays?: number;
  cost: number;
}

interface ThreeDSupplyChainProps {
  nodes: SupplyChainNode[];
  flows: SupplyChainFlow[];
  onNodeClick?: (node: SupplyChainNode) => void;
  onFlowClick?: (flow: SupplyChainFlow) => void;
}

const ThreeDSupplyChainNetwork: React.FC<ThreeDSupplyChainProps> = ({
  nodes,
  flows,
  onNodeClick,
  onFlowClick
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const controlsRef = useRef<OrbitControls>();
  const animationIdRef = useRef<number>();
  
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'network' | 'material' | 'risk' | 'capacity'>('network');
  const [showFlows, setShowFlows] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  useEffect(() => {
    if (!mountRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    // Add ambient and directional lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(50, 50, 50);

    // Initialize controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 10;
    controls.maxDistance = 200;
    controlsRef.current = controls;

    // Add grid
    const gridHelper = new THREE.GridHelper(200, 50, 0x333333, 0x222222);
    scene.add(gridHelper);

    // Add coordinate axes
    const axesHelper = new THREE.AxesHelper(20);
    scene.add(axesHelper);

    // Create node and flow visualizations
    createNetworkVisualization(scene, nodes, flows);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    setIsLoading(false);

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (sceneRef.current) {
      // Clear existing network objects
      const objectsToRemove: THREE.Object3D[] = [];
      sceneRef.current.traverse((child) => {
        if (child.userData.isNetworkElement) {
          objectsToRemove.push(child);
        }
      });
      objectsToRemove.forEach(obj => sceneRef.current?.remove(obj));

      // Recreate network with updated data
      createNetworkVisualization(sceneRef.current, nodes, flows);
    }
  }, [nodes, flows, viewMode, selectedMaterial, selectedRegion]);

  const createNetworkVisualization = (scene: THREE.Scene, nodes: SupplyChainNode[], flows: SupplyChainFlow[]) => {
    const nodeGroup = new THREE.Group();
    const flowGroup = new THREE.Group();
    
    nodeGroup.userData.isNetworkElement = true;
    flowGroup.userData.isNetworkElement = true;

    // Filter nodes and flows based on selection
    const filteredNodes = nodes.filter(node => {
      if (selectedRegion !== 'all' && node.region !== selectedRegion) return false;
      if (selectedMaterial !== 'all' && !node.materials.includes(selectedMaterial)) return false;
      return true;
    });

    const filteredFlows = flows.filter(flow => {
      if (selectedMaterial !== 'all' && flow.material !== selectedMaterial) return false;
      return true;
    });

    // Create nodes
    filteredNodes.forEach(node => {
      const nodeMesh = createNodeMesh(node, viewMode);
      nodeGroup.add(nodeMesh);
    });

    // Create flows
    if (showFlows) {
      filteredFlows.forEach(flow => {
        const flowMesh = createFlowMesh(flow, filteredNodes, viewMode);
        if (flowMesh) flowGroup.add(flowMesh);
      });
    }

    scene.add(nodeGroup);
    scene.add(flowGroup);
  };

  const createNodeMesh = (node: SupplyChainNode, viewMode: string): THREE.Object3D => {
    const group = new THREE.Group();

    // Determine node color based on view mode
    let color: number;
    let opacity = 1;
    
    switch (viewMode) {
      case 'network':
        color = getStatusColor(node.status);
        break;
      case 'material':
        color = getMaterialColor(node.materials[0] || 'default');
        break;
      case 'risk':
        color = getRiskColor(node.riskLevel);
        break;
      case 'capacity':
        color = getCapacityColor(node.utilization);
        break;
      default:
        color = 0x666666;
    }

    // Create main node sphere
    const geometry = new THREE.SphereGeometry(node.size, 32, 32);
    const material = new THREE.MeshLambertMaterial({ 
      color, 
      transparent: true, 
      opacity 
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.position.set(node.position.x, node.position.y, node.position.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Add click handler
    mesh.userData.nodeData = node;
    mesh.userData.isNode = true;
    
    group.add(mesh);

    // Add status indicator ring
    const ringGeometry = new THREE.RingGeometry(node.size * 1.2, node.size * 1.4, 16);
    const ringMaterial = new THREE.MeshBasicMaterial({ 
      color: getStatusColor(node.status), 
      transparent: true, 
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(node.position.x, node.position.y + 0.1, node.position.z);
    ring.rotation.x = -Math.PI / 2;
    group.add(ring);

    // Add label if enabled
    if (showLabels) {
      const label = createTextSprite(node.name, 0xffffff);
      label.position.set(node.position.x, node.position.y + node.size + 2, node.position.z);
      group.add(label);
    }

    return group;
  };

  const createFlowMesh = (flow: SupplyChainFlow, nodes: SupplyChainNode[], viewMode: string): THREE.Object3D | null => {
    const fromNode = nodes.find(n => n.id === flow.from);
    const toNode = nodes.find(n => n.id === flow.to);
    
    if (!fromNode || !toNode) return null;

    const group = new THREE.Group();

    // Calculate flow direction and distance
    const direction = new THREE.Vector3(
      toNode.position.x - fromNode.position.x,
      toNode.position.y - fromNode.position.y,
      toNode.position.z - fromNode.position.z
    );
    const distance = direction.length();
    direction.normalize();

    // Create flow line
    const lineGeometry = new THREE.BufferGeometry();
    const points = [
      new THREE.Vector3(fromNode.position.x, fromNode.position.y, fromNode.position.z),
      new THREE.Vector3(toNode.position.x, toNode.position.y, toNode.position.z)
    ];
    lineGeometry.setFromPoints(points);

    const lineColor = getFlowStatusColor(flow.status);
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: lineColor,
      transparent: true,
      opacity: 0.8
    });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    group.add(line);

    // Add arrow head
    const arrowGeometry = new THREE.ConeGeometry(0.5, 2, 8);
    const arrowMaterial = new THREE.MeshLambertMaterial({ color: lineColor });
    const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
    
    // Position arrow at 80% of the line
    const arrowPosition = new THREE.Vector3().lerpVectors(
      new THREE.Vector3(fromNode.position.x, fromNode.position.y, fromNode.position.z),
      new THREE.Vector3(toNode.position.x, toNode.position.y, toNode.position.z),
      0.8
    );
    arrow.position.copy(arrowPosition);
    
    // Orient arrow towards destination
    arrow.lookAt(toNode.position.x, toNode.position.y, toNode.position.z);
    arrow.rotateX(Math.PI / 2);
    
    group.add(arrow);

    // Add flow label
    if (showLabels && flow.volume > 100) {
      const label = createTextSprite(
        `${flow.material}: ${flow.volume.toLocaleString()}t`,
        0xcccccc
      );
      label.position.copy(arrowPosition);
      label.position.y += 1;
      group.add(label);
    }

    return group;
  };

  const createTextSprite = (text: string, color: number): THREE.Sprite => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return new THREE.Sprite();

    canvas.width = 256;
    canvas.height = 64;
    
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    context.font = '16px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(4, 1, 1);

    return sprite;
  };

  // Color helper functions
  const getStatusColor = (status: string): number => {
    switch (status) {
      case 'operational': return 0x00ff00;
      case 'constrained': return 0xffaa00;
      case 'bottleneck': return 0xff0000;
      case 'offline': return 0x666666;
      default: return 0x666666;
    }
  };

  const getMaterialColor = (material: string): number => {
    const colors: Record<string, number> = {
      'lithium': 0x00ffff,
      'cobalt': 0x0080ff,
      'nickel': 0x808080,
      'copper': 0xff8000,
      'platinum': 0xe5e5e5,
      'manganese': 0x800080,
      'default': 0x666666
    };
    return colors[material] || colors.default;
  };

  const getRiskColor = (riskLevel: string): number => {
    switch (riskLevel) {
      case 'low': return 0x00ff00;
      case 'medium': return 0xffaa00;
      case 'high': return 0xff4400;
      case 'critical': return 0xff0000;
      default: return 0x666666;
    }
  };

  const getCapacityColor = (utilization: number): number => {
    if (utilization > 0.9) return 0xff0000;
    if (utilization > 0.7) return 0xffaa00;
    if (utilization > 0.5) return 0xffff00;
    return 0x00ff00;
  };

  const getFlowStatusColor = (status: string): number => {
    switch (status) {
      case 'active': return 0x00ff00;
      case 'delayed': return 0xffaa00;
      case 'blocked': return 0xff0000;
      case 'planned': return 0x6666ff;
      default: return 0x666666;
    }
  };

  const handleResize = () => {
    if (!mountRef.current || !rendererRef.current || !controlsRef.current) return;
    
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    
    rendererRef.current.setSize(width, height);
    controlsRef.current.update();
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const resetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const zoomIn = () => {
    if (controlsRef.current && sceneRef.current) {
      const camera = controlsRef.current.object;
      camera.position.multiplyScalar(0.9);
      controlsRef.current.update();
    }
  };

  const zoomOut = () => {
    if (controlsRef.current && sceneRef.current) {
      const camera = controlsRef.current.object;
      camera.position.multiplyScalar(1.1);
      controlsRef.current.update();
    }
  };

  return (
    <div className="relative w-full h-full">
      <Card className="p-6 h-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-light text-zinc-900">3D Supply Chain Network</h3>
            <p className="text-sm text-zinc-500 mt-1">Interactive visualization of African mining supply chains</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'network' ? 'material' : 'network')}
              className="h-8 px-3 text-xs"
            >
              <Layers className="h-3 w-3 mr-1" />
              {viewMode === 'network' ? 'Material View' : 'Network View'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFlows(!showFlows)}
              className="h-8 px-3 text-xs"
            >
              {showFlows ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLabels(!showLabels)}
              className="h-8 px-3 text-xs"
            >
              <Activity className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <select
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
              className="px-3 py-1 border border-zinc-200 rounded text-sm"
            >
              <option value="all">All Materials</option>
              <option value="lithium">Lithium</option>
              <option value="cobalt">Cobalt</option>
              <option value="nickel">Nickel</option>
              <option value="copper">Copper</option>
              <option value="platinum">Platinum</option>
              <option value="manganese">Manganese</option>
            </select>
            
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-3 py-1 border border-zinc-200 rounded text-sm"
            >
              <option value="all">All Regions</option>
              <option value="south_africa">South Africa</option>
              <option value="drc">DRC</option>
              <option value="zambia">Zambia</option>
              <option value="ghana">Ghana</option>
              <option value="nigeria">Nigeria</option>
              <option value="kenya">Kenya</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={resetView} className="h-8 px-3 text-xs">
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
            <Button variant="outline" size="sm" onClick={zoomIn} className="h-8 px-3 text-xs">
              <ZoomIn className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" onClick={zoomOut} className="h-8 px-3 text-xs">
              <ZoomOut className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* 3D Viewport */}
        <div className="relative h-96 bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-lg overflow-hidden">
          <div ref={mountRef} className="w-full h-full" />
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p className="text-sm">Loading 3D visualization...</p>
              </div>
            </div>
          )}
          
          {/* Legend */}
          <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white text-xs">
            <div className="font-medium mb-2">Legend</div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Operational</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span>Constrained</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                <span>Bottleneck</span>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 text-xs text-zinc-500">
          <p>• Drag to rotate • Scroll to zoom • Right-click to pan • Click nodes for details</p>
        </div>
      </Card>
    </div>
  );
};

export default ThreeDSupplyChainNetwork;
