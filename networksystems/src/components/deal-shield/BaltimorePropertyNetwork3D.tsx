'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Eye, 
  EyeOff, 
  Layers, 
  AlertTriangle,
  Home,
  MapPin
} from 'lucide-react';
import { BaltimorePropertyNode, BillingTierEdge } from '@/services/forensics/baltimorePropertyNetwork';

interface BaltimorePropertyNetwork3DProps {
  nodes: BaltimorePropertyNode[];
  edges: BillingTierEdge[];
  onNodeClick?: (node: BaltimorePropertyNode) => void;
  onEdgeClick?: (edge: BillingTierEdge) => void;
}

const BaltimorePropertyNetwork3D: React.FC<BaltimorePropertyNetwork3DProps> = ({
  nodes,
  edges,
  onNodeClick,
  onEdgeClick
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const controlsRef = useRef<OrbitControls>();
  const animationIdRef = useRef<number>();
  const nodeMeshesRef = useRef<Map<string, THREE.Object3D>>(new Map());
  
  const [isLoading, setIsLoading] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showEdges, setShowEdges] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'distress' | 'audit' | 'billing'>('distress');

  useEffect(() => {
    if (!mountRef.current || nodes.length === 0) return;

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
    camera.position.set(0, 50, 100);
    camera.lookAt(0, 0, 0);

    // Initialize controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 500;
    controlsRef.current = controls;

    // Create network visualization
    createNetworkVisualization(scene, nodes, edges);

    setIsLoading(false);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [nodes, edges]);

  const createNetworkVisualization = (
    scene: THREE.Scene,
    nodes: BaltimorePropertyNode[],
    edges: BillingTierEdge[]
  ) => {
    // Clear existing objects
    const objectsToRemove: THREE.Object3D[] = [];
    scene.children.forEach(child => {
      if (child.userData.isNetworkObject) {
        objectsToRemove.push(child);
      }
    });
    objectsToRemove.forEach(obj => scene.remove(obj));
    nodeMeshesRef.current.clear();

    // Create property nodes
    nodes.forEach(node => {
      const mesh = createPropertyNodeMesh(node, viewMode);
      mesh.userData.isNetworkObject = true;
      mesh.userData.nodeId = node.id;
      mesh.userData.node = node;
      scene.add(mesh);
      nodeMeshesRef.current.set(node.id, mesh);
    });

    // Create edges (billing tiers and connections)
    if (showEdges) {
      edges.forEach(edge => {
        const sourceMesh = nodeMeshesRef.current.get(edge.source);
        const targetMesh = nodeMeshesRef.current.get(edge.target);
        
        if (sourceMesh && targetMesh) {
          const sourcePos = sourceMesh.position;
          const targetPos = targetMesh.position;
          
          const lineMesh = createEdgeMesh(edge, sourcePos, targetPos);
          lineMesh.userData.isNetworkObject = true;
          lineMesh.userData.edgeId = edge.id;
          lineMesh.userData.edge = edge;
          scene.add(lineMesh);
        }
      });
    }

    // Add click handler
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseClick = (event: MouseEvent) => {
      if (!mountRef.current) return;
      
      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, sceneRef.current!.children.find(c => c.type === 'PerspectiveCamera') as THREE.PerspectiveCamera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        const object = intersects[0].object;
        const nodeId = object.userData.nodeId;
        const edgeId = object.userData.edgeId;
        
        if (nodeId) {
          const node = nodes.find(n => n.id === nodeId);
          if (node && onNodeClick) {
            setSelectedNode(nodeId);
            onNodeClick(node);
          }
        } else if (edgeId) {
          const edge = edges.find(e => e.id === edgeId);
          if (edge && onEdgeClick) {
            onEdgeClick(edge);
          }
        }
      }
    };

    mountRef.current?.addEventListener('click', onMouseClick);

    return () => {
      mountRef.current?.removeEventListener('click', onMouseClick);
    };
  };

  const createPropertyNodeMesh = (
    node: BaltimorePropertyNode,
    mode: 'distress' | 'audit' | 'billing'
  ): THREE.Object3D => {
    const group = new THREE.Group();
    const { position } = node;

    // Determine color based on view mode
    let color: number;
    let size: number;

    if (mode === 'audit') {
      // RED if DPW Audit flags math error
      if (node.dpwAuditResult?.hasError) {
        color = 0xff0000; // RED
        size = 4 + (node.dpwAuditResult.severity === 'critical' ? 2 : 0);
      } else {
        color = 0x00ff00; // GREEN (no error)
        size = 3;
      }
    } else if (mode === 'distress') {
      // Color by distress score
      const distressRatio = node.distressScore / 100;
      if (distressRatio > 0.7) {
        color = 0xff0000; // RED (high distress)
      } else if (distressRatio > 0.4) {
        color = 0xff8800; // ORANGE (medium distress)
      } else {
        color = 0x00ff00; // GREEN (low distress)
      }
      size = 3 + (distressRatio * 3);
    } else {
      // Billing tier mode
      const billingTierEdge = edges.find(e => e.source === node.id && e.type === 'BILLING_TIER');
      if (billingTierEdge?.billingTier) {
        const tier = billingTierEdge.billingTier.tier;
        if (tier === 4) color = 0xff0000; // RED (highest tier)
        else if (tier === 3) color = 0xff8800; // ORANGE
        else if (tier === 2) color = 0xffff00; // YELLOW
        else color = 0x00ff00; // GREEN (lowest tier)
        size = 3 + tier;
      } else {
        color = 0x888888; // GRAY (no billing data)
        size = 3;
      }
    }

    // Create sphere geometry for property node
    const geometry = new THREE.SphereGeometry(size, 16, 16);
    const material = new THREE.MeshLambertMaterial({ 
      color,
      emissive: color,
      emissiveIntensity: 0.3
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Add halo ring for selected node
    if (selectedNode === node.id) {
      const ringGeometry = new THREE.RingGeometry(size * 1.5, size * 1.8, 16);
      const ringMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(position.x, position.y + 0.1, position.z);
      group.add(ring);
    }

    // Add label
    if (showLabels) {
      const label = createTextSprite(node.address, color);
      label.position.set(position.x, position.y + size + 2, position.z);
      group.add(label);
    }

    return group;
  };

  const createEdgeMesh = (
    edge: BillingTierEdge,
    sourcePos: THREE.Vector3,
    targetPos: THREE.Vector3
  ): THREE.Object3D => {
    const group = new THREE.Group();

    // Create line geometry
    const points = [
      new THREE.Vector3(sourcePos.x, sourcePos.y, sourcePos.z),
      new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z)
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    // Color based on edge type
    let color: number;
    if (edge.type === 'BILLING_TIER') {
      // Color by billing tier
      if (edge.billingTier) {
        const tier = edge.billingTier.tier;
        if (tier === 4) color = 0xff0000;
        else if (tier === 3) color = 0xff8800;
        else if (tier === 2) color = 0xffff00;
        else color = 0x00ff00;
      } else {
        color = 0x888888;
      }
    } else {
      color = 0x444444; // Gray for same-block connections
    }

    const material = new THREE.LineBasicMaterial({ 
      color,
      transparent: true,
      opacity: 0.4
    });
    const line = new THREE.Line(geometry, material);
    group.add(line);

    return group;
  };

  const createTextSprite = (text: string, color: number): THREE.Sprite => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return new THREE.Sprite();

    canvas.width = 256;
    canvas.height = 64;
    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    context.font = 'Bold 24px Arial';
    context.fillText(text.substring(0, 20), 10, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(10, 2.5, 1);

    return sprite;
  };

  // Update visualization when view mode changes
  useEffect(() => {
    if (sceneRef.current && nodes.length > 0) {
      createNetworkVisualization(sceneRef.current, nodes, edges);
    }
  }, [viewMode, showLabels, showEdges, selectedNode]);

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full min-h-[600px]" />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-white">Loading 3D Network...</div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 space-y-2">
        <div className="flex items-center space-x-2 mb-2">
          <Layers className="h-4 w-4" />
          <span className="text-sm font-semibold">View Mode</span>
        </div>
        <div className="flex flex-col space-y-1">
          <button
            onClick={() => setViewMode('distress')}
            className={`px-3 py-1 text-xs rounded ${
              viewMode === 'distress' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Distress Score
          </button>
          <button
            onClick={() => setViewMode('audit')}
            className={`px-3 py-1 text-xs rounded ${
              viewMode === 'audit' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            DPW Audit (RED = Error)
          </button>
          <button
            onClick={() => setViewMode('billing')}
            className={`px-3 py-1 text-xs rounded ${
              viewMode === 'billing' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Billing Tiers
          </button>
        </div>
        
        <div className="border-t pt-2 mt-2">
          <button
            onClick={() => setShowLabels(!showLabels)}
            className="w-full px-3 py-1 text-xs bg-gray-200 rounded flex items-center justify-center space-x-1"
          >
            {showLabels ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            <span>Labels</span>
          </button>
          <button
            onClick={() => setShowEdges(!showEdges)}
            className="w-full px-3 py-1 text-xs bg-gray-200 rounded mt-1 flex items-center justify-center space-x-1"
          >
            {showEdges ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            <span>Connections</span>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4">
        <div className="text-sm font-semibold mb-2">Legend</div>
        {viewMode === 'audit' && (
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span>DPW Audit Error</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span>No Error</span>
            </div>
          </div>
        )}
        {viewMode === 'distress' && (
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span>High Distress (70-100)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
              <span>Medium Distress (40-70)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span>Low Distress (0-40)</span>
            </div>
          </div>
        )}
        {viewMode === 'billing' && (
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span>Tier 4 (20,000+ gal)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
              <span>Tier 3 (10k-20k gal)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <span>Tier 2 (2k-10k gal)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span>Tier 1 (0-2k gal)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BaltimorePropertyNetwork3D;

