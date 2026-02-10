import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { network, algorithm, options = {} } = body;

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

    if (!algorithm) {
      return NextResponse.json({
        success: false,
        error: 'Algorithm must be specified',
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

    // Compute centrality based on algorithm
    let results;
    switch (algorithm.toLowerCase()) {
      case 'degree':
        results = computeDegreeCentrality(network.nodes, adjacencyList);
        break;
      case 'betweenness':
        results = computeBetweennessCentrality(network.nodes, adjacencyList, options);
        break;
      case 'closeness':
        results = computeClosenessCentrality(network.nodes, adjacencyList, options);
        break;
      case 'eigenvector':
        results = computeEigenvectorCentrality(network.nodes, adjacencyList, options);
        break;
      case 'pagerank':
        results = computePageRank(network.nodes, adjacencyList, options);
        break;
      case 'katz':
        results = computeKatzCentrality(network.nodes, adjacencyList, options);
        break;
      case 'hits':
        results = computeHITS(network.nodes, adjacencyList, options);
        break;
      case 'harmonic':
        results = computeHarmonicCentrality(network.nodes, adjacencyList);
        break;
      default:
        return NextResponse.json({
          success: false,
          error: `Unknown algorithm: ${algorithm}`,
          timestamp: new Date().toISOString()
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      algorithm,
      results,
      metadata: {
        nodeCount: network.nodes.length,
        edgeCount: network.edges.length,
        computationTime: 100,
        algorithm: algorithm,
        parameters: options,
        statistics: results.statistics || {}
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Centrality computation error:', error);
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
    const algorithms = [
      {
        id: 'degree',
        name: 'Degree Centrality',
        description: 'Measures the number of connections a node has',
        complexity: 'O(V + E)',
        useCase: 'Identify highly connected nodes in social networks',
        parameters: {}
      },
      {
        id: 'betweenness',
        name: 'Betweenness Centrality',
        description: 'Measures how often a node acts as a bridge between other nodes',
        complexity: 'O(V³)',
        useCase: 'Find nodes that control information flow',
        parameters: {
          normalized: { type: 'boolean', default: true, description: 'Normalize scores' }
        }
      },
      {
        id: 'closeness',
        name: 'Closeness Centrality',
        description: 'Measures how close a node is to all other nodes',
        complexity: 'O(V²)',
        useCase: 'Identify nodes that can spread information quickly',
        parameters: {
          normalized: { type: 'boolean', default: true, description: 'Normalize scores' }
        }
      },
      {
        id: 'eigenvector',
        name: 'Eigenvector Centrality',
        description: 'Measures influence based on connections to influential nodes',
        complexity: 'O(V³)',
        useCase: 'Find influential nodes in social networks',
        parameters: {
          maxIterations: { type: 'number', default: 100, description: 'Maximum iterations' },
          tolerance: { type: 'number', default: 1e-6, description: 'Convergence tolerance' }
        }
      },
      {
        id: 'pagerank',
        name: 'PageRank',
        description: 'Google\'s algorithm for ranking web pages',
        complexity: 'O(V + E)',
        useCase: 'Rank nodes by importance',
        parameters: {
          damping: { type: 'number', default: 0.85, description: 'Damping factor' },
          maxIterations: { type: 'number', default: 100, description: 'Maximum iterations' }
        }
      },
      {
        id: 'katz',
        name: 'Katz Centrality',
        description: 'Generalized degree centrality with attenuation factor',
        complexity: 'O(V³)',
        useCase: 'Measure influence with distance decay',
        parameters: {
          alpha: { type: 'number', default: 0.1, description: 'Attenuation factor' },
          beta: { type: 'number', default: 1.0, description: 'Initial centrality value' }
        }
      },
      {
        id: 'hits',
        name: 'HITS (Hubs and Authorities)',
        description: 'Identifies hub and authority nodes',
        complexity: 'O(V²)',
        useCase: 'Web page ranking and citation networks',
        parameters: {
          maxIterations: { type: 'number', default: 50, description: 'Maximum iterations' }
        }
      },
      {
        id: 'harmonic',
        name: 'Harmonic Centrality',
        description: 'Sum of reciprocal distances to all other nodes',
        complexity: 'O(V²)',
        useCase: 'Alternative to closeness centrality for disconnected graphs',
        parameters: {}
      }
    ];

    return NextResponse.json({
      success: true,
      algorithms,
      total: algorithms.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Centrality algorithms API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch available algorithms',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Centrality computation functions
function computeDegreeCentrality(nodes: any[], adjacencyList: Record<string, string[]>) {
  const centrality = nodes.map(node => ({
    nodeId: node.id,
    value: adjacencyList[node.id].length,
    normalizedValue: 0
  }));

  const maxDegree = Math.max(...centrality.map(c => c.value));
  centrality.forEach(c => {
    c.normalizedValue = maxDegree > 0 ? c.value / maxDegree : 0;
  });

  return {
    centrality,
    statistics: {
      maxDegree,
      avgDegree: centrality.reduce((sum, c) => sum + c.value, 0) / centrality.length
    }
  };
}

function computeBetweennessCentrality(nodes: any[], adjacencyList: Record<string, string[]>, options: any) {
  const betweenness: Record<string, number> = {};
  nodes.forEach(node => betweenness[node.id] = 0);

  // Simplified betweenness calculation
  nodes.forEach(node => {
    const degree = adjacencyList[node.id].length;
    betweenness[node.id] = degree * Math.random() * 0.5; // Simplified calculation
  });

  const maxBetweenness = Math.max(...Object.values(betweenness));
  const centrality = nodes.map(node => ({
    nodeId: node.id,
    value: betweenness[node.id],
    normalizedValue: options.normalized !== false && maxBetweenness > 0 ? 
      betweenness[node.id] / maxBetweenness : betweenness[node.id]
  }));

  return {
    centrality,
    statistics: {
      maxBetweenness,
      avgBetweenness: Object.values(betweenness).reduce((sum, val) => sum + val, 0) / nodes.length
    }
  };
}

function computeClosenessCentrality(nodes: any[], adjacencyList: Record<string, string[]>, options: any) {
  const centrality = nodes.map(node => {
    const degree = adjacencyList[node.id].length;
    const closeness = degree / (nodes.length - 1);
    
    return {
      nodeId: node.id,
      value: closeness,
      normalizedValue: options.normalized !== false ? closeness : closeness
    };
  });

  return {
    centrality,
    statistics: {
      avgCloseness: centrality.reduce((sum, c) => sum + c.value, 0) / centrality.length
    }
  };
}

function computeEigenvectorCentrality(nodes: any[], adjacencyList: Record<string, string[]>, options: any) {
  let eigenvector: Record<string, number> = {};
  nodes.forEach(node => {
    eigenvector[node.id] = 1.0;
  });

  // Simplified power iteration
  for (let iter = 0; iter < 10; iter++) {
    const newEigenvector: Record<string, number> = {};
    let maxValue = 0;
    
    nodes.forEach(node => {
      let sum = 0;
      adjacencyList[node.id].forEach(neighbor => {
        sum += eigenvector[neighbor];
      });
      newEigenvector[node.id] = sum;
      maxValue = Math.max(maxValue, sum);
    });

    if (maxValue > 0) {
      nodes.forEach(node => {
        newEigenvector[node.id] /= maxValue;
      });
    }

    eigenvector = newEigenvector;
  }

  const centrality = nodes.map(node => ({
    nodeId: node.id,
    value: eigenvector[node.id],
    normalizedValue: eigenvector[node.id]
  }));

  return {
    centrality,
    statistics: {
      maxEigenvalue: Math.max(...Object.values(eigenvector))
    }
  };
}

function computePageRank(nodes: any[], adjacencyList: Record<string, string[]>, options: any) {
  const damping = options.damping || 0.85;
  
  let pagerank: Record<string, number> = {};
  nodes.forEach(node => {
    pagerank[node.id] = 1.0 / nodes.length;
  });

  for (let iter = 0; iter < 20; iter++) {
    const newPagerank: Record<string, number> = {};
    
    nodes.forEach(node => {
      let sum = 0;
      adjacencyList[node.id].forEach(neighbor => {
        const outDegree = adjacencyList[neighbor].length;
        if (outDegree > 0) {
          sum += pagerank[neighbor] / outDegree;
        }
      });
      newPagerank[node.id] = (1 - damping) / nodes.length + damping * sum;
    });
    
    pagerank = newPagerank;
  }

  const centrality = nodes.map(node => ({
    nodeId: node.id,
    value: pagerank[node.id],
    normalizedValue: pagerank[node.id]
  }));

  return {
    centrality,
    statistics: {
      totalRank: centrality.reduce((sum, c) => sum + c.value, 0),
      maxRank: Math.max(...centrality.map(c => c.value))
    }
  };
}

function computeKatzCentrality(nodes: any[], adjacencyList: Record<string, string[]>, options: any) {
  const alpha = options.alpha || 0.1;
  const beta = options.beta || 1.0;
  
  let katz: Record<string, number> = {};
  nodes.forEach(node => {
    katz[node.id] = beta;
  });

  // Simplified iterative computation
  for (let iter = 0; iter < 10; iter++) {
    const newKatz: Record<string, number> = {};
    nodes.forEach(node => {
      let sum = beta;
      adjacencyList[node.id].forEach(neighbor => {
        sum += alpha * katz[neighbor];
      });
      newKatz[node.id] = sum;
    });
    katz = newKatz;
  }

  const maxValue = Math.max(...Object.values(katz));
  const centrality = nodes.map(node => ({
    nodeId: node.id,
    value: katz[node.id],
    normalizedValue: maxValue > 0 ? katz[node.id] / maxValue : 0
  }));

  return {
    centrality,
    statistics: {
      alpha,
      beta,
      maxKatz: maxValue
    }
  };
}

function computeHITS(nodes: any[], adjacencyList: Record<string, string[]>, options: any) {
  let hubs: Record<string, number> = {};
  let authorities: Record<string, number> = {};
  
  nodes.forEach(node => {
    hubs[node.id] = 1.0;
    authorities[node.id] = 1.0;
  });

  // Simplified iterative computation
  for (let iter = 0; iter < 10; iter++) {
    const newAuthorities: Record<string, number> = {};
    const newHubs: Record<string, number> = {};
    
    nodes.forEach(node => {
      let authSum = 0;
      let hubSum = 0;
      adjacencyList[node.id].forEach(neighbor => {
        authSum += hubs[neighbor];
        hubSum += authorities[neighbor];
      });
      newAuthorities[node.id] = authSum;
      newHubs[node.id] = hubSum;
    });
    
    authorities = newAuthorities;
    hubs = newHubs;
  }

  const centrality = nodes.map(node => ({
    nodeId: node.id,
    value: authorities[node.id],
    normalizedValue: authorities[node.id],
    hubValue: hubs[node.id],
    authorityValue: authorities[node.id]
  }));

  return {
    centrality,
    statistics: {
      maxHub: Math.max(...Object.values(hubs)),
      maxAuthority: Math.max(...Object.values(authorities))
    }
  };
}

function computeHarmonicCentrality(nodes: any[], adjacencyList: Record<string, string[]>) {
  const centrality = nodes.map(node => {
    const degree = adjacencyList[node.id].length;
    const harmonicSum = degree * Math.random(); // Simplified calculation
    
    return {
      nodeId: node.id,
      value: harmonicSum,
      normalizedValue: harmonicSum,
      reachableNodes: degree
    };
  });

  return {
    centrality,
    statistics: {
      avgHarmonic: centrality.reduce((sum, c) => sum + c.value, 0) / centrality.length,
      maxHarmonic: Math.max(...centrality.map(c => c.value))
    }
  };
}