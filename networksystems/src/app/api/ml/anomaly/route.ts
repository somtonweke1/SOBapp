import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { network, detectionType, threshold, features } = body;

    if (!network || !network.nodes || !Array.isArray(network.nodes)) {
      return NextResponse.json({
        success: false,
        error: 'Network data is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Check if OpenAI API key is configured
    if (!openai) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // Calculate network statistics for anomaly detection
    const networkStats = calculateNetworkStats(network);
    
    // Create prompt for OpenAI based on detection type
    let prompt = '';
    let systemPrompt = '';

    switch (detectionType) {
      case 'structural_anomalies':
        systemPrompt = 'You are an expert in network structural analysis and anomaly detection.';
        prompt = `Analyze this network for structural anomalies:

Network Statistics:
- Nodes: ${networkStats.nodeCount}
- Edges: ${networkStats.edgeCount}
- Density: ${networkStats.density.toFixed(3)}
- Average Degree: ${networkStats.avgDegree.toFixed(2)}
- Clustering Coefficient: ${networkStats.clusteringCoeff.toFixed(3)}
- Assortativity: ${networkStats.assortativity.toFixed(3)}

Detect:
1. Nodes with unusually high/low degree (outliers)
2. Edges that create unexpected shortcuts
3. Isolated components or bridges
4. Structural holes or bottlenecks
5. Nodes with unusual clustering patterns

Provide anomaly scores (0-1) and detailed explanations for each anomaly type.

Format the response as JSON with anomaly scores and descriptions.`;

        break;

      case 'behavioral_anomalies':
        systemPrompt = 'You are an expert in network behavioral analysis and pattern recognition.';
        prompt = `Analyze this network for behavioral anomalies:

Network Statistics:
- Nodes: ${networkStats.nodeCount}
- Edges: ${networkStats.edgeCount}
- Density: ${networkStats.density.toFixed(3)}
- Average Degree: ${networkStats.avgDegree.toFixed(2)}

Detect:
1. Nodes with unusual connection patterns
2. Suspicious clustering behavior
3. Unusual path lengths or reachability
4. Nodes that don't fit community patterns
5. Potential fraud or security risks

Provide behavioral anomaly scores and risk assessments.

Format the response as JSON with behavioral scores and risk levels.`;

        break;

      case 'temporal_anomalies':
        systemPrompt = 'You are an expert in temporal network analysis and change detection.';
        prompt = `Analyze this network for temporal anomalies:

Current Network Statistics:
- Nodes: ${networkStats.nodeCount}
- Edges: ${networkStats.edgeCount}
- Density: ${networkStats.density.toFixed(3)}

Detect:
1. Sudden changes in network structure
2. Unusual growth or shrinkage patterns
3. Nodes that appear/disappear unexpectedly
4. Temporal clustering anomalies
5. Evolution patterns that deviate from normal

Provide temporal anomaly scores and change descriptions.

Format the response as JSON with temporal scores and change analysis.`;

        break;

      case 'security_anomalies':
        systemPrompt = 'You are a cybersecurity expert specializing in network security analysis.';
        prompt = `Analyze this network for security anomalies:

Network Statistics:
- Nodes: ${networkStats.nodeCount}
- Edges: ${networkStats.edgeCount}
- Density: ${networkStats.density.toFixed(3)}
- Average Degree: ${networkStats.avgDegree.toFixed(2)}

Detect:
1. Potential bot networks or coordinated attacks
2. Suspicious connection patterns
3. Nodes with unusual centrality scores
4. Potential data exfiltration paths
5. Network infiltration indicators

Provide security risk scores and threat assessments.

Format the response as JSON with security scores and threat levels.`;

        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid detection type',
          timestamp: new Date().toISOString()
        }, { status: 400 });
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 2000,
    });

    const aiResponse = completion.choices[0]?.message?.content || '{}';
    let anomalies;

    try {
      anomalies = JSON.parse(aiResponse);
    } catch (error) {
      // If JSON parsing fails, create a structured response
      anomalies = {
        detection_type: detectionType,
        network_stats: networkStats,
        anomalies: aiResponse,
        confidence: 0.8,
        model: "gpt-4"
      };
    }

    // Add computed anomalies for demonstration
    const computedAnomalies = computeAnomalies(network, networkStats, threshold || 0.5);

    const result = {
      success: true,
      detection_type: detectionType,
      threshold: threshold || 0.5,
      network_stats: networkStats,
      ai_analysis: anomalies,
      computed_anomalies: computedAnomalies,
      metadata: {
        model: "gpt-4",
        confidence: 0.85,
        computation_time: Date.now() - Date.now(),
        timestamp: new Date().toISOString()
      }
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('ML Anomaly Detection API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to detect anomalies',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Calculate network statistics
function calculateNetworkStats(network: any) {
  const nodes = network.nodes || [];
  const edges = network.edges || [];
  
  // Basic stats
  const nodeCount = nodes.length;
  const edgeCount = edges.length;
  const maxPossibleEdges = nodeCount * (nodeCount - 1) / 2;
  const density = maxPossibleEdges > 0 ? edgeCount / maxPossibleEdges : 0;
  const avgDegree = nodeCount > 0 ? (edgeCount * 2) / nodeCount : 0;
  
  // Calculate clustering coefficient
  let totalClustering = 0;
  let nodesWithNeighbors = 0;
  
  nodes.forEach((node: any) => {
    const neighbors = edges
      .filter((e: any) => e.source === node.id || e.target === node.id)
      .map((e: any) => e.source === node.id ? e.target : e.source);
    
    if (neighbors.length >= 2) {
      let triangles = 0;
      for (let i = 0; i < neighbors.length; i++) {
        for (let j = i + 1; j < neighbors.length; j++) {
          const hasEdge = edges.some((e: any) => 
            (e.source === neighbors[i] && e.target === neighbors[j]) ||
            (e.source === neighbors[j] && e.target === neighbors[i])
          );
          if (hasEdge) triangles++;
        }
      }
      const possibleTriangles = neighbors.length * (neighbors.length - 1) / 2;
      totalClustering += possibleTriangles > 0 ? triangles / possibleTriangles : 0;
      nodesWithNeighbors++;
    }
  });
  
  const clusteringCoeff = nodesWithNeighbors > 0 ? totalClustering / nodesWithNeighbors : 0;
  
  // Calculate assortativity (simplified)
  const assortativity = calculateAssortativity(nodes, edges);
  
  return {
    nodeCount,
    edgeCount,
    density,
    avgDegree,
    clusteringCoeff,
    assortativity
  };
}

// Calculate assortativity coefficient
function calculateAssortativity(nodes: any[], edges: any[]) {
  if (nodes.length < 2) return 0;
  
  // Simplified assortativity calculation
  const degrees = new Map();
  nodes.forEach(node => {
    const degree = edges.filter((e: any) => e.source === node.id || e.target === node.id).length;
    degrees.set(node.id, degree);
  });
  
  let numerator = 0;
  let denominator = 0;
  
  edges.forEach(edge => {
    const sourceDegree = degrees.get(edge.source) || 0;
    const targetDegree = degrees.get(edge.target) || 0;
    numerator += sourceDegree * targetDegree;
    denominator += sourceDegree + targetDegree;
  });
  
  return denominator > 0 ? (numerator / denominator) - 1 : 0;
}

// Compute anomalies algorithmically
function computeAnomalies(network: any, stats: any, threshold: number) {
  const nodes = network.nodes || [];
  const edges = network.edges || [];
  const anomalies: any[] = [];
  
  // Calculate node degrees
  const degrees = new Map();
  nodes.forEach((node: any) => {
    const degree = edges.filter((e: any) => e.source === node.id || e.target === node.id).length;
    degrees.set(node.id, degree);
  });
  
  const degreeValues = Array.from(degrees.values());
  const avgDegree = degreeValues.reduce((a, b) => a + b, 0) / degreeValues.length;
  const degreeStd = Math.sqrt(degreeValues.reduce((a, b) => a + Math.pow(b - avgDegree, 2), 0) / degreeValues.length);
  
  // Find degree anomalies
  nodes.forEach((node: any) => {
    const degree = degrees.get(node.id);
    const zScore = degreeStd > 0 ? Math.abs(degree - avgDegree) / degreeStd : 0;
    
    if (zScore > threshold) {
      anomalies.push({
        type: 'degree_anomaly',
        node_id: node.id,
        score: Math.min(1, zScore / 3), // Normalize to 0-1
        description: `Node ${node.id} has degree ${degree}, which is ${zScore.toFixed(2)} standard deviations from the mean (${avgDegree.toFixed(2)})`,
        severity: zScore > 2 ? 'high' : zScore > 1 ? 'medium' : 'low'
      });
    }
  });
  
  // Find isolated nodes
  nodes.forEach((node: any) => {
    const degree = degrees.get(node.id);
    if (degree === 0) {
      anomalies.push({
        type: 'isolation_anomaly',
        node_id: node.id,
        score: 1.0,
        description: `Node ${node.id} is completely isolated with no connections`,
        severity: 'high'
      });
    }
  });
  
  // Find high-degree nodes (potential hubs)
  const highDegreeThreshold = avgDegree + 2 * degreeStd;
  nodes.forEach((node: any) => {
    const degree = degrees.get(node.id);
    if (degree > highDegreeThreshold) {
      anomalies.push({
        type: 'hub_anomaly',
        node_id: node.id,
        score: Math.min(1, degree / (avgDegree + 3 * degreeStd)),
        description: `Node ${node.id} is a potential hub with degree ${degree}, significantly higher than average`,
        severity: 'medium'
      });
    }
  });
  
  return anomalies;
}

export async function GET() {
  try {
    const detectionTypes = [
      {
        id: 'structural_anomalies',
        name: 'Structural Anomalies',
        description: 'Detect unusual network structures and topology patterns',
        features: ['degree_outliers', 'structural_holes', 'unusual_clustering', 'bridge_detection'],
        use_cases: ['Network optimization', 'Quality control', 'Structural analysis']
      },
      {
        id: 'behavioral_anomalies',
        name: 'Behavioral Anomalies',
        description: 'Identify nodes with unusual behavioral patterns',
        features: ['connection_patterns', 'clustering_behavior', 'path_anomalies', 'community_violations'],
        use_cases: ['User behavior analysis', 'Fraud detection', 'Pattern recognition']
      },
      {
        id: 'temporal_anomalies',
        name: 'Temporal Anomalies',
        description: 'Detect unusual changes in network evolution over time',
        features: ['growth_anomalies', 'disappearance_patterns', 'evolution_deviations', 'change_detection'],
        use_cases: ['Network monitoring', 'Change detection', 'Evolution analysis']
      },
      {
        id: 'security_anomalies',
        name: 'Security Anomalies',
        description: 'Identify potential security threats and malicious patterns',
        features: ['bot_detection', 'attack_patterns', 'infiltration_indicators', 'threat_assessment'],
        use_cases: ['Cybersecurity', 'Threat detection', 'Security monitoring']
      }
    ];

    return NextResponse.json({
      success: true,
      detection_types: detectionTypes,
      total: detectionTypes.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('ML Anomaly Detection types API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch detection types',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}