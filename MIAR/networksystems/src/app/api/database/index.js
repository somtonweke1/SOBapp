/**
 * MIAR - Database API for Vercel (Node.js)
 * Implements persistent data storage and retrieval
 */

// In-memory database simulation (for Vercel serverless)
// In production, this would connect to PostgreSQL, MongoDB, or another database
let networks = new Map();
let analyses = new Map();
let users = new Map();

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const { type, id, userId } = req.query;
      
      switch (type) {
        case 'networks':
          return getNetworks(userId, res);
        case 'analyses':
          return getAnalyses(userId, res);
        case 'network':
          return getNetwork(id, res);
        case 'analysis':
          return getAnalysis(id, res);
        case 'user':
          return getUser(id, res);
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid type parameter',
            timestamp: new Date().toISOString()
          });
      }
    }

    if (req.method === 'POST') {
      const { type } = req.body;
      
      switch (type) {
        case 'network':
          return createNetwork(req.body, res);
        case 'analysis':
          return createAnalysis(req.body, res);
        case 'user':
          return createUser(req.body, res);
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid type parameter',
            timestamp: new Date().toISOString()
          });
      }
    }

    if (req.method === 'PUT') {
      const { type, id } = req.body;
      
      switch (type) {
        case 'network':
          return updateNetwork(id, req.body, res);
        case 'analysis':
          return updateAnalysis(id, req.body, res);
        case 'user':
          return updateUser(id, req.body, res);
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid type parameter',
            timestamp: new Date().toISOString()
          });
      }
    }

    if (req.method === 'DELETE') {
      const { type, id } = req.query;
      
      switch (type) {
        case 'network':
          return deleteNetwork(id, res);
        case 'analysis':
          return deleteAnalysis(id, res);
        case 'user':
          return deleteUser(id, res);
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid type parameter',
            timestamp: new Date().toISOString()
          });
      }
    }

    res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Network Operations

function getNetworks(userId, res) {
  try {
    const userNetworks = Array.from(networks.values())
      .filter(network => !userId || network.userId === userId)
      .map(network => ({
        id: network.id,
        name: network.name,
        description: network.description,
        nodeCount: network.nodes.length,
        edgeCount: network.edges.length,
        createdAt: network.createdAt,
        updatedAt: network.updatedAt,
        userId: network.userId
      }));

    res.status(200).json({
      success: true,
      networks: userNetworks,
      total: userNetworks.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch networks',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

function getNetwork(id, res) {
  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Network ID is required',
        timestamp: new Date().toISOString()
      });
    }

    const network = networks.get(id);
    if (!network) {
      return res.status(404).json({
        success: false,
        error: 'Network not found',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      network,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch network',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

function createNetwork(data, res) {
  try {
    const { name, description, nodes, edges, userId, metadata } = data;
    
    if (!name || !nodes || !Array.isArray(nodes)) {
      return res.status(400).json({
        success: false,
        error: 'Network name and nodes are required',
        timestamp: new Date().toISOString()
      });
    }

    const networkId = generateId();
    const network = {
      id: networkId,
      name,
      description: description || '',
      nodes: nodes || [],
      edges: edges || [],
      userId: userId || 'anonymous',
      metadata: metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    networks.set(networkId, network);

    res.status(201).json({
      success: true,
      network,
      message: 'Network created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create network',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

function updateNetwork(id, data, res) {
  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Network ID is required',
        timestamp: new Date().toISOString()
      });
    }

    const existingNetwork = networks.get(id);
    if (!existingNetwork) {
      return res.status(404).json({
        success: false,
        error: 'Network not found',
        timestamp: new Date().toISOString()
      });
    }

    const updatedNetwork = {
      ...existingNetwork,
      ...data,
      id: existingNetwork.id, // Preserve ID
      createdAt: existingNetwork.createdAt, // Preserve creation date
      updatedAt: new Date().toISOString()
    };

    networks.set(id, updatedNetwork);

    res.status(200).json({
      success: true,
      network: updatedNetwork,
      message: 'Network updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update network',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

function deleteNetwork(id, res) {
  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Network ID is required',
        timestamp: new Date().toISOString()
      });
    }

    const network = networks.get(id);
    if (!network) {
      return res.status(404).json({
        success: false,
        error: 'Network not found',
        timestamp: new Date().toISOString()
      });
    }

    networks.delete(id);

    // Also delete related analyses
    const relatedAnalyses = Array.from(analyses.values())
      .filter(analysis => analysis.networkId === id);
    relatedAnalyses.forEach(analysis => analyses.delete(analysis.id));

    res.status(200).json({
      success: true,
      message: 'Network deleted successfully',
      deletedAnalyses: relatedAnalyses.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete network',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Analysis Operations

function getAnalyses(userId, res) {
  try {
    const userAnalyses = Array.from(analyses.values())
      .filter(analysis => !userId || analysis.userId === userId)
      .map(analysis => ({
        id: analysis.id,
        networkId: analysis.networkId,
        type: analysis.type,
        algorithm: analysis.algorithm,
        status: analysis.status,
        createdAt: analysis.createdAt,
        updatedAt: analysis.updatedAt,
        userId: analysis.userId
      }));

    res.status(200).json({
      success: true,
      analyses: userAnalyses,
      total: userAnalyses.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analyses',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

function getAnalysis(id, res) {
  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Analysis ID is required',
        timestamp: new Date().toISOString()
      });
    }

    const analysis = analyses.get(id);
    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analysis',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

function createAnalysis(data, res) {
  try {
    const { networkId, type, algorithm, parameters, userId, results } = data;
    
    if (!networkId || !type) {
      return res.status(400).json({
        success: false,
        error: 'Network ID and analysis type are required',
        timestamp: new Date().toISOString()
      });
    }

    const network = networks.get(networkId);
    if (!network) {
      return res.status(404).json({
        success: false,
        error: 'Network not found',
        timestamp: new Date().toISOString()
      });
    }

    const analysisId = generateId();
    const analysis = {
      id: analysisId,
      networkId,
      type,
      algorithm: algorithm || 'default',
      parameters: parameters || {},
      results: results || null,
      status: 'completed',
      userId: userId || 'anonymous',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    analyses.set(analysisId, analysis);

    res.status(201).json({
      success: true,
      analysis,
      message: 'Analysis created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create analysis',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

function updateAnalysis(id, data, res) {
  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Analysis ID is required',
        timestamp: new Date().toISOString()
      });
    }

    const existingAnalysis = analyses.get(id);
    if (!existingAnalysis) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found',
        timestamp: new Date().toISOString()
      });
    }

    const updatedAnalysis = {
      ...existingAnalysis,
      ...data,
      id: existingAnalysis.id, // Preserve ID
      createdAt: existingAnalysis.createdAt, // Preserve creation date
      updatedAt: new Date().toISOString()
    };

    analyses.set(id, updatedAnalysis);

    res.status(200).json({
      success: true,
      analysis: updatedAnalysis,
      message: 'Analysis updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update analysis',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

function deleteAnalysis(id, res) {
  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Analysis ID is required',
        timestamp: new Date().toISOString()
      });
    }

    const analysis = analyses.get(id);
    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found',
        timestamp: new Date().toISOString()
      });
    }

    analyses.delete(id);

    res.status(200).json({
      success: true,
      message: 'Analysis deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete analysis',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// User Operations

function getUser(id, res) {
  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
        timestamp: new Date().toISOString()
      });
    }

    const user = users.get(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

function createUser(data, res) {
  try {
    const { name, email, preferences } = data;
    
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Name and email are required',
        timestamp: new Date().toISOString()
      });
    }

    const userId = generateId();
    const user = {
      id: userId,
      name,
      email,
      preferences: preferences || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.set(userId, user);

    res.status(201).json({
      success: true,
      user,
      message: 'User created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

function updateUser(id, data, res) {
  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
        timestamp: new Date().toISOString()
      });
    }

    const existingUser = users.get(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    const updatedUser = {
      ...existingUser,
      ...data,
      id: existingUser.id, // Preserve ID
      createdAt: existingUser.createdAt, // Preserve creation date
      updatedAt: new Date().toISOString()
    };

    users.set(id, updatedUser);

    res.status(200).json({
      success: true,
      user: updatedUser,
      message: 'User updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

function deleteUser(id, res) {
  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
        timestamp: new Date().toISOString()
      });
    }

    const user = users.get(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    users.delete(id);

    // Also delete user's networks and analyses
    const userNetworks = Array.from(networks.values())
      .filter(network => network.userId === id);
    userNetworks.forEach(network => networks.delete(network.id));

    const userAnalyses = Array.from(analyses.values())
      .filter(analysis => analysis.userId === id);
    userAnalyses.forEach(analysis => analyses.delete(analysis.id));

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      deletedNetworks: userNetworks.length,
      deletedAnalyses: userAnalyses.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Helper functions

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Initialize with sample data
function initializeSampleData() {
  // Sample user
  const sampleUser = {
    id: 'user_1',
    name: 'Network Analyst',
    email: 'analyst@networkoracle.com',
    preferences: {
      defaultAlgorithm: 'pagerank',
      visualizationTheme: 'dark'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  users.set('user_1', sampleUser);

  // Sample network
  const sampleNetwork = {
    id: 'network_1',
    name: 'Sample Social Network',
    description: 'A sample social network for demonstration',
    nodes: [
      { id: 'A', label: 'Alice', group: 'users' },
      { id: 'B', label: 'Bob', group: 'users' },
      { id: 'C', label: 'Charlie', group: 'users' },
      { id: 'D', label: 'Diana', group: 'users' },
      { id: 'E', label: 'Eve', group: 'users' }
    ],
    edges: [
      { source: 'A', target: 'B', weight: 1 },
      { source: 'B', target: 'C', weight: 1 },
      { source: 'C', target: 'D', weight: 1 },
      { source: 'D', target: 'E', weight: 1 },
      { source: 'E', target: 'A', weight: 1 },
      { source: 'A', target: 'C', weight: 1 },
      { source: 'B', target: 'D', weight: 1 }
    ],
    userId: 'user_1',
    metadata: {
      type: 'social',
      directed: false
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  networks.set('network_1', sampleNetwork);

  // Sample analysis
  const sampleAnalysis = {
    id: 'analysis_1',
    networkId: 'network_1',
    type: 'centrality',
    algorithm: 'pagerank',
    parameters: {
      damping: 0.85,
      iterations: 100
    },
    results: {
      centrality: [
        { nodeId: 'A', value: 0.25, normalizedValue: 1.0 },
        { nodeId: 'B', value: 0.20, normalizedValue: 0.8 },
        { nodeId: 'C', value: 0.20, normalizedValue: 0.8 },
        { nodeId: 'D', value: 0.20, normalizedValue: 0.8 },
        { nodeId: 'E', value: 0.15, normalizedValue: 0.6 }
      ],
      statistics: {
        computationTime: 45,
        algorithm: 'pagerank'
      }
    },
    status: 'completed',
    userId: 'user_1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  analyses.set('analysis_1', sampleAnalysis);
}

// Initialize sample data on first load
if (users.size === 0) {
  initializeSampleData();
}
