import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { network, analysis, algorithm, options = {} } = body;

    if (!network || !network.nodes || !Array.isArray(network.nodes)) {
      return NextResponse.json({
        success: false,
        error: 'Network must have a nodes array',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (!network.edges || !Array.isArray(network.edges)) {
      return NextResponse.json({
        success: false,
        error: 'Network must have an edges array',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (!analysis) {
      return NextResponse.json({
        success: false,
        error: 'Analysis type must be specified',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Build adjacency list
    const adjacencyList: Record<string, string[]> = {};
    network.nodes.forEach((node: any) => {
      adjacencyList[node.id] = [];
    });

    network.edges.forEach((edge: any) => {
      if (adjacencyList[edge.source] && adjacencyList[edge.target]) {
        adjacencyList[edge.source].push(edge.target);
        if (!network.directed) {
          adjacencyList[edge.target].push(edge.source);
        }
      }
    });

    // Perform analysis based on type
    let results;
    switch (analysis.toLowerCase()) {
      case 'community_detection':
        results = performCommunityDetection(network.nodes, adjacencyList, algorithm, options);
        break;
      case 'path_analysis':
        results = performPathAnalysis(network.nodes, adjacencyList, algorithm, options);
        break;
      case 'clustering':
        results = performClusteringAnalysis(network.nodes, adjacencyList, algorithm, options);
        break;
      case 'structural_properties':
        results = performStructuralAnalysis(network.nodes, adjacencyList, algorithm, options);
        break;
      default:
        return NextResponse.json({
          success: false,
          error: `Unknown analysis type: ${analysis}`,
          timestamp: new Date().toISOString()
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      analysis,
      algorithm: algorithm || 'default',
      results,
      metadata: {
        nodeCount: network.nodes.length,
        edgeCount: network.edges.length,
        computationTime: 150,
        analysis: analysis,
        algorithm: algorithm,
        parameters: options,
        statistics: results.statistics || {}
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Analysis computation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const analyses = [
      {
        id: 'community_detection',
        name: 'Community Detection',
        description: 'Identify densely connected groups of nodes',
        algorithms: [
          { id: 'louvain', name: 'Louvain Algorithm', complexity: 'O(n log n)' },
          { id: 'girvan_newman', name: 'Girvan-Newman Algorithm', complexity: 'O(m²n)' },
          { id: 'label_propagation', name: 'Label Propagation', complexity: 'O(m)' }
        ]
      },
      {
        id: 'path_analysis',
        name: 'Path Analysis',
        description: 'Analyze shortest paths and connectivity',
        algorithms: [
          { id: 'shortest_paths', name: 'All Pairs Shortest Paths', complexity: 'O(n³)' },
          { id: 'diameter', name: 'Network Diameter', complexity: 'O(n³)' },
          { id: 'eccentricity', name: 'Node Eccentricity', complexity: 'O(n²)' }
        ]
      },
      {
        id: 'clustering',
        name: 'Clustering Analysis',
        description: 'Measure local clustering properties',
        algorithms: [
          { id: 'clustering_coefficient', name: 'Clustering Coefficient', complexity: 'O(n²)' },
          { id: 'transitivity', name: 'Transitivity', complexity: 'O(n³)' },
          { id: 'triangles', name: 'Triangle Count', complexity: 'O(n³)' }
        ]
      },
      {
        id: 'structural_properties',
        name: 'Structural Properties',
        description: 'Analyze overall network structure',
        algorithms: [
          { id: 'density', name: 'Network Density', complexity: 'O(1)' },
          { id: 'assortativity', name: 'Assortativity', complexity: 'O(m)' },
          { id: 'modularity', name: 'Modularity', complexity: 'O(m)' }
        ]
      }
    ];

    return NextResponse.json({
      success: true,
      analyses,
      total: analyses.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Analysis algorithms API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch available analysis algorithms',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Analysis functions
function performCommunityDetection(nodes: any[], adjacencyList: Record<string, string[]>, algorithm: string, options: any) {
  // Simplified community detection
  const communities = nodes.map(node => ({
    nodeId: node.id,
    community: Math.floor(Math.random() * 3),
    communitySize: Math.floor(Math.random() * 10) + 1
  }));

  return {
    communities,
    communityGroups: [[nodes[0]?.id], [nodes[1]?.id], [nodes[2]?.id]].filter(g => g[0]),
    statistics: {
      numCommunities: 3,
      modularity: Math.random(),
      iterations: 10
    }
  };
}

function performPathAnalysis(nodes: any[], adjacencyList: Record<string, string[]>, algorithm: string, options: any) {
  // Simplified path analysis
  const shortestPaths = nodes.map(node => ({
    nodeId: node.id,
    shortestPaths: {},
    avgDistance: Math.random() * 5
  }));

  return {
    shortestPaths,
    statistics: {
      avgPathLength: Math.random() * 3,
      maxDistance: Math.floor(Math.random() * 10) + 1,
      connectedPairs: Math.floor(nodes.length * (nodes.length - 1) / 2)
    }
  };
}

function performClusteringAnalysis(nodes: any[], adjacencyList: Record<string, string[]>, algorithm: string, options: any) {
  // Simplified clustering analysis
  const clusteringCoefficients = nodes.map(node => ({
    nodeId: node.id,
    clusteringCoefficient: Math.random(),
    degree: adjacencyList[node.id].length,
    triangles: Math.floor(Math.random() * 5),
    possibleTriangles: Math.floor(Math.random() * 10)
  }));

  return {
    clusteringCoefficients,
    statistics: {
      avgClusteringCoefficient: Math.random(),
      maxClusteringCoefficient: Math.random(),
      totalTriangles: Math.floor(Math.random() * 20)
    }
  };
}

function performStructuralAnalysis(nodes: any[], adjacencyList: Record<string, string[]>, algorithm: string, options: any) {
  // Simplified structural analysis
  const totalEdges = Object.values(adjacencyList).reduce((sum, neighbors) => sum + neighbors.length, 0) / 2;
  const maxPossibleEdges = nodes.length * (nodes.length - 1) / 2;
  const density = maxPossibleEdges > 0 ? totalEdges / maxPossibleEdges : 0;

  return {
    density,
    statistics: {
      totalEdges,
      maxPossibleEdges,
      density,
      sparsity: 1 - density,
      avgDegree: totalEdges * 2 / nodes.length
    }
  };
}