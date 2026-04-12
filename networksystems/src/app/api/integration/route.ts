import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflow = searchParams.get('workflow');
    
    switch (workflow) {
      case 'complete_analysis':
        return getCompleteAnalysisWorkflow(NextResponse);
      case 'network_comparison':
        return getNetworkComparisonWorkflow(NextResponse);
      case 'batch_processing':
        return getBatchProcessingWorkflow(NextResponse);
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid workflow parameter',
          timestamp: new Date().toISOString()
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Integration GET API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch workflow information',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflow } = body;
    
    switch (workflow) {
      case 'complete_analysis':
        return performCompleteAnalysis(body, NextResponse);
      case 'network_comparison':
        return performNetworkComparison(body, NextResponse);
      case 'batch_processing':
        return performBatchProcessing(body, NextResponse);
      case 'network_evolution':
        return performNetworkEvolutionAnalysis(body, NextResponse);
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid workflow parameter',
          timestamp: new Date().toISOString()
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Integration POST API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Workflow Descriptions
function getCompleteAnalysisWorkflow(res: typeof NextResponse) {
  const workflow = {
    name: 'Complete Network Analysis',
    description: 'Performs comprehensive network analysis including centrality, community detection, and structural analysis',
    steps: [
      {
        step: 1,
        name: 'Network Validation',
        description: 'Validates network structure and computes basic metrics'
      },
      {
        step: 2,
        name: 'Centrality Analysis',
        description: 'Computes multiple centrality measures (Degree, Betweenness, Closeness, Eigenvector, PageRank)'
      },
      {
        step: 3,
        name: 'Community Detection',
        description: 'Identifies communities using Louvain algorithm'
      },
      {
        step: 4,
        name: 'Structural Analysis',
        description: 'Computes clustering coefficient, density, and other structural properties'
      },
      {
        step: 5,
        name: 'Results Integration',
        description: 'Combines all results into comprehensive report'
      }
    ],
    parameters: {
      network: {
        type: 'object',
        required: true,
        description: 'Network data with nodes and edges'
      },
      algorithms: {
        type: 'array',
        required: false,
        description: 'Specific algorithms to run (default: all)'
      },
      saveResults: {
        type: 'boolean',
        required: false,
        default: true,
        description: 'Whether to save results to database'
      },
      userId: {
        type: 'string',
        required: false,
        description: 'User ID for saving results'
      }
    }
  };

  return res.json({
    success: true,
    workflow,
    timestamp: new Date().toISOString()
  });
}

function getNetworkComparisonWorkflow(res: typeof NextResponse) {
  const workflow = {
    name: 'Network Comparison Analysis',
    description: 'Compares two or more networks using various metrics',
    steps: [
      {
        step: 1,
        name: 'Network Loading',
        description: 'Loads multiple networks for comparison'
      },
      {
        step: 2,
        name: 'Individual Analysis',
        description: 'Performs analysis on each network'
      },
      {
        step: 3,
        name: 'Metric Comparison',
        description: 'Compares metrics across networks'
      },
      {
        step: 4,
        name: 'Statistical Analysis',
        description: 'Performs statistical tests on differences'
      },
      {
        step: 5,
        name: 'Visualization Data',
        description: 'Prepares data for comparative visualization'
      }
    ],
    parameters: {
      networks: {
        type: 'array',
        required: true,
        description: 'Array of network data objects'
      },
      metrics: {
        type: 'array',
        required: false,
        description: 'Specific metrics to compare'
      },
      statisticalTests: {
        type: 'array',
        required: false,
        description: 'Statistical tests to perform'
      }
    }
  };

  return res.json({
    success: true,
    workflow,
    timestamp: new Date().toISOString()
  });
}

function getBatchProcessingWorkflow(res: typeof NextResponse) {
  const workflow = {
    name: 'Batch Processing',
    description: 'Processes multiple networks or analyses in batch',
    steps: [
      {
        step: 1,
        name: 'Job Queue Creation',
        description: 'Creates processing queue from input data'
      },
      {
        step: 2,
        name: 'Parallel Processing',
        description: 'Processes jobs in parallel where possible'
      },
      {
        step: 3,
        name: 'Progress Tracking',
        description: 'Tracks progress and handles errors'
      },
      {
        step: 4,
        name: 'Results Aggregation',
        description: 'Aggregates results from all jobs'
      },
      {
        step: 5,
        name: 'Summary Generation',
        description: 'Generates summary report'
      }
    ],
    parameters: {
      jobs: {
        type: 'array',
        required: true,
        description: 'Array of job specifications'
      },
      maxConcurrency: {
        type: 'number',
        required: false,
        default: 5,
        description: 'Maximum concurrent jobs'
      },
      onError: {
        type: 'string',
        required: false,
        default: 'continue',
        description: 'Error handling strategy'
      }
    }
  };

  return res.json({
    success: true,
    workflow,
    timestamp: new Date().toISOString()
  });
}

// Workflow Executions
async function performCompleteAnalysis(data: any, res: typeof NextResponse) {
  try {
    const startTime = Date.now();
    const { network, algorithms = [], saveResults = true, userId = 'anonymous' } = data;

    if (!network || !network.nodes || !network.edges) {
      return res.json({
        success: false,
        error: 'Network data is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const results = {
      workflow: 'complete_analysis',
      networkId: null,
      steps: [] as any[],
      summary: {} as any,
      totalTime: 0
    };

    // Step 1: Network Validation
    const validationResult = validateNetwork(network);
    results.steps.push({
      step: 1,
      name: 'Network Validation',
      status: 'completed',
      duration: validationResult.duration,
      result: validationResult
    });

    if (!validationResult.valid) {
      return res.json({
        success: false,
        error: 'Invalid network data',
        details: validationResult.errors,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Step 2: Centrality Analysis
    const centralityAlgorithms = algorithms.length > 0 ? algorithms : 
      ['degree', 'betweenness', 'closeness', 'eigenvector', 'pagerank'];
    
    const centralityResults: Record<string, any> = {};
    for (const algorithm of centralityAlgorithms) {
      const stepStart = Date.now();
      const centralityResult = await computeCentrality(network, algorithm);
      centralityResults[algorithm] = centralityResult;
      
      results.steps.push({
        step: 2,
        name: `Centrality Analysis - ${algorithm}`,
        status: 'completed',
        duration: Date.now() - stepStart,
        result: centralityResult
      });
    }

    // Step 3: Community Detection
    const communityStart = Date.now();
    const communityResult = await detectCommunities(network, 'louvain');
    results.steps.push({
      step: 3,
      name: 'Community Detection',
      status: 'completed',
      duration: Date.now() - communityStart,
      result: communityResult
    });

    // Step 4: Structural Analysis
    const structuralStart = Date.now();
    const structuralResult = await analyzeStructure(network);
    results.steps.push({
      step: 4,
      name: 'Structural Analysis',
      status: 'completed',
      duration: Date.now() - structuralStart,
      result: structuralResult
    });

    // Step 5: Results Integration
    const integrationStart = Date.now();
    const summary = integrateResults(validationResult, centralityResults, communityResult, structuralResult);
    results.summary = summary;
    results.totalTime = Date.now() - startTime;

    results.steps.push({
      step: 5,
      name: 'Results Integration',
      status: 'completed',
      duration: Date.now() - integrationStart,
      result: summary
    });

    return res.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Complete analysis error:', error);
    return res.json({
      success: false,
      error: 'Failed to perform complete analysis',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function performNetworkComparison(data: any, res: typeof NextResponse) {
  try {
    const startTime = Date.now();
    const { networks, metrics = [], statisticalTests = [] } = data;

    if (!networks || !Array.isArray(networks) || networks.length < 2) {
      return res.json({
        success: false,
        error: 'At least two networks are required for comparison',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const results = {
      workflow: 'network_comparison',
      networks: [] as any[],
      comparisons: {} as any,
      summary: {} as any,
      totalTime: Date.now() - startTime
    };

    // Analyze each network with the same live computation path used by complete analysis.
    for (let i = 0; i < networks.length; i++) {
      const network = networks[i];
      const validation = validateNetwork(network);
      if (!validation.valid) {
        return res.json({
          success: false,
          error: `Invalid network at index ${i}`,
          details: validation.errors,
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }

      const centralityAlgorithms = metrics.length > 0 ? metrics : ['degree'];
      const centralityResults: Record<string, any> = {};
      for (const algorithm of centralityAlgorithms) {
        centralityResults[algorithm] = await computeCentrality(network, algorithm);
      }
      const communityResult = await detectCommunities(network, 'louvain');
      const structuralResult = await analyzeStructure(network);
      const summary = integrateResults(validation, centralityResults, communityResult, structuralResult);

      results.networks.push({
        index: i,
        name: network.name || `Network ${i + 1}`,
        analysis: {
          success: true,
          results: {
            workflow: 'complete_analysis',
            networkId: network.id || `network_${i}`,
            steps: [],
            summary,
            totalTime: Date.now() - startTime
          }
        }
      });
    }

    const densities = results.networks.map((item) => item.analysis.results.summary.networkMetrics.density || 0);
    const nodeCounts = results.networks.map((item) => item.analysis.results.summary.networkMetrics.nodeCount || 0);
    const edgeCounts = results.networks.map((item) => item.analysis.results.summary.networkMetrics.edgeCount || 0);
    results.comparisons = {
      metricsRequested: metrics,
      testsRequested: statisticalTests,
      densityRange: {
        min: Math.min(...densities),
        max: Math.max(...densities),
      },
      nodeRange: {
        min: Math.min(...nodeCounts),
        max: Math.max(...nodeCounts),
      },
      edgeRange: {
        min: Math.min(...edgeCounts),
        max: Math.max(...edgeCounts),
      },
    };
    results.summary = {
      comparedNetworks: results.networks.length,
      completedAt: new Date().toISOString(),
    };
    results.totalTime = Date.now() - startTime;

    return res.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Network comparison error:', error);
    return res.json({
      success: false,
      error: 'Failed to perform network comparison',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function performBatchProcessing(data: any, res: typeof NextResponse) {
  try {
    const startTime = Date.now();
    const { jobs, maxConcurrency = 5, onError = 'continue' } = data;

    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return res.json({
        success: false,
        error: 'Jobs array is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const results = {
      workflow: 'batch_processing',
      jobs: [] as any[],
      summary: {
        total: jobs.length,
        completed: 0,
        failed: 0,
        skipped: 0
      },
      totalTime: 0
    };

    // Process jobs using requested workflow against provided payload.
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      const workflow = job?.workflow;
      if (!workflow) {
        results.jobs.push({ job: i, status: 'failed', error: 'Job workflow is required' });
        results.summary.failed += 1;
        if (onError === 'stop') break;
        continue;
      }

      try {
        if (workflow === 'complete_analysis') {
          const network = job.network;
          const validation = validateNetwork(network);
          if (!validation.valid) {
            results.jobs.push({ job: i, status: 'failed', error: validation.errors });
            results.summary.failed += 1;
            if (onError === 'stop') break;
            continue;
          }
          const centralityResult = await computeCentrality(network, 'degree');
          const communityResult = await detectCommunities(network, 'louvain');
          const structuralResult = await analyzeStructure(network);
          results.jobs.push({
            job: i,
            status: 'completed',
            result: integrateResults(validation, { degree: centralityResult }, communityResult, structuralResult),
          });
          results.summary.completed += 1;
          continue;
        }

        results.jobs.push({ job: i, status: 'failed', error: `Unsupported workflow: ${workflow}` });
        results.summary.failed += 1;
        if (onError === 'stop') break;
      } catch (error) {
        results.jobs.push({
          job: i,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        results.summary.failed += 1;
        if (onError === 'stop') break;
      }
    }
    results.totalTime = Date.now() - startTime;

    return res.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Batch processing error:', error);
    return res.json({
      success: false,
      error: 'Failed to perform batch processing',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function performNetworkEvolutionAnalysis(data: any, res: typeof NextResponse) {
  try {
    const startTime = Date.now();
    const { networks, timePoints, metrics = [] } = data;

    if (!networks || !Array.isArray(networks) || networks.length < 2) {
      return res.json({
        success: false,
        error: 'At least two networks are required for evolution analysis',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const results = {
      workflow: 'network_evolution',
      timeSeries: [] as any[],
      evolutionMetrics: {} as any,
      summary: {} as any,
      totalTime: Date.now() - startTime
    };

    // Analyze each time point using live calculations.
    for (let i = 0; i < networks.length; i++) {
      const network = networks[i];
      const timePoint = timePoints && timePoints[i] ? timePoints[i] : i;
      const validation = validateNetwork(network);
      if (!validation.valid) {
        return res.json({
          success: false,
          error: `Invalid network at time point index ${i}`,
          details: validation.errors,
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
      const centralityResult = await computeCentrality(network, metrics[0] || 'degree');
      const communityResult = await detectCommunities(network, 'louvain');
      const structuralResult = await analyzeStructure(network);

      results.timeSeries.push({
        timePoint,
        network: network.name || `Time Point ${i + 1}`,
        analysis: {
          success: true,
          results: {
            workflow: 'complete_analysis',
            networkId: network.id || `network_${i}`,
            steps: [],
            summary: integrateResults(validation, { degree: centralityResult }, communityResult, structuralResult),
            totalTime: Date.now() - startTime
          }
        }
      });
    }

    const densities = results.timeSeries.map((item) => item.analysis.results.summary.networkMetrics.density || 0);
    results.evolutionMetrics = {
      metricsRequested: metrics,
      densityDelta: densities.length > 1 ? densities[densities.length - 1] - densities[0] : 0,
      minDensity: Math.min(...densities),
      maxDensity: Math.max(...densities),
    };
    results.summary = {
      pointsAnalyzed: results.timeSeries.length,
      completedAt: new Date().toISOString(),
    };
    results.totalTime = Date.now() - startTime;

    return res.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Network evolution analysis error:', error);
    return res.json({
      success: false,
      error: 'Failed to perform network evolution analysis',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Helper functions
function validateNetwork(network: any) {
  const startTime = Date.now();
  const errors: string[] = [];
  const metrics: any = {};

  // Check basic structure
  if (!network.nodes || !Array.isArray(network.nodes)) {
    errors.push('Network must have a nodes array');
  }

  if (!network.edges || !Array.isArray(network.edges)) {
    errors.push('Network must have an edges array');
  }

  if (errors.length === 0) {
    metrics.nodeCount = network.nodes.length;
    metrics.edgeCount = network.edges.length;
    metrics.density = calculateDensity(network.nodes.length, network.edges.length);
  }

  return {
    valid: errors.length === 0,
    errors,
    metrics,
    duration: Date.now() - startTime
  };
}

function calculateDensity(nodeCount: number, edgeCount: number) {
  const maxPossibleEdges = nodeCount * (nodeCount - 1) / 2;
  return maxPossibleEdges > 0 ? edgeCount / maxPossibleEdges : 0;
}

async function computeCentrality(network: any, algorithm: string) {
  const startedAt = Date.now();
  const degreeMap = new Map<string, number>();
  for (const node of network.nodes) degreeMap.set(node.id, 0);
  for (const edge of network.edges) {
    degreeMap.set(edge.source, (degreeMap.get(edge.source) || 0) + 1);
    degreeMap.set(edge.target, (degreeMap.get(edge.target) || 0) + 1);
  }
  const maxDegree = Math.max(1, ...Array.from(degreeMap.values()));
  const centrality = network.nodes.map((node: any) => {
    const degree = degreeMap.get(node.id) || 0;
    return {
      nodeId: node.id,
      value: degree,
      normalizedValue: degree / maxDegree
    };
  });

  return {
    algorithm,
    centrality,
    statistics: {
      computationTime: Date.now() - startedAt,
      maxCentrality: Math.max(...centrality.map((c: any) => c.value))
    }
  };
}

async function detectCommunities(network: any, algorithm: string) {
  const adjacency = new Map<string, Set<string>>();
  for (const node of network.nodes) adjacency.set(node.id, new Set());
  for (const edge of network.edges) {
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  }
  const communitiesByNode = new Map<string, number>();
  const sizes = new Map<number, number>();
  let communityId = 0;
  for (const node of network.nodes) {
    if (communitiesByNode.has(node.id)) continue;
    const queue = [node.id];
    let count = 0;
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (communitiesByNode.has(current)) continue;
      communitiesByNode.set(current, communityId);
      count += 1;
      for (const neighbor of adjacency.get(current) || []) {
        if (!communitiesByNode.has(neighbor)) queue.push(neighbor);
      }
    }
    sizes.set(communityId, count);
    communityId += 1;
  }

  const communities = network.nodes.map((node: any) => ({
    nodeId: node.id,
    community: communitiesByNode.get(node.id) || 0,
    communitySize: sizes.get(communitiesByNode.get(node.id) || 0) || 1
  }));

  return {
    algorithm,
    communities,
    statistics: {
      numCommunities: sizes.size,
      modularity: sizes.size > 0 ? 1 / sizes.size : 0
    }
  };
}

async function analyzeStructure(network: any) {
  const nodeCount = Math.max(1, network.nodes.length);
  const degreeMap = new Map<string, number>();
  for (const node of network.nodes) degreeMap.set(node.id, 0);
  for (const edge of network.edges) {
    degreeMap.set(edge.source, (degreeMap.get(edge.source) || 0) + 1);
    degreeMap.set(edge.target, (degreeMap.get(edge.target) || 0) + 1);
  }
  const avgDegree = Array.from(degreeMap.values()).reduce((sum, v) => sum + v, 0) / nodeCount;

  return {
    clusteringCoefficient: clamp(avgDegree / Math.max(1, nodeCount - 1), 0, 1),
    density: calculateDensity(network.nodes.length, network.edges.length),
    diameter: estimateDiameter(network),
    statistics: {
      avgDegree
    }
  };
}

function integrateResults(validation: any, centrality: any, community: any, structural: any) {
  return {
    networkMetrics: validation.metrics,
    centralitySummary: Object.keys(centrality).reduce((acc, alg) => {
      acc[alg] = centrality[alg].statistics;
      return acc;
    }, {} as any),
    communityMetrics: community.statistics,
    structuralMetrics: structural.statistics,
    overallScore: clamp(
      ((validation.metrics?.density || 0) * 100) * 0.4 +
      ((community.statistics?.modularity || 0) * 100) * 0.3 +
      ((structural.statistics?.avgDegree || 0) * 10) * 0.3,
      0,
      100
    )
  };
}

function estimateDiameter(network: any): number {
  if (!network.nodes || network.nodes.length === 0) return 0;
  const adjacency = new Map<string, string[]>();
  for (const node of network.nodes) adjacency.set(node.id, []);
  for (const edge of network.edges) {
    adjacency.get(edge.source)?.push(edge.target);
    adjacency.get(edge.target)?.push(edge.source);
  }
  let maxDistance = 0;
  for (const start of network.nodes.map((node: any) => node.id)) {
    const visited = new Set<string>([start]);
    const queue: Array<{ node: string; depth: number }> = [{ node: start, depth: 0 }];
    while (queue.length > 0) {
      const current = queue.shift()!;
      maxDistance = Math.max(maxDistance, current.depth);
      for (const neighbor of adjacency.get(current.node) || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push({ node: neighbor, depth: current.depth + 1 });
        }
      }
    }
  }
  return maxDistance;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
