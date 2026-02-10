import { NextRequest, NextResponse } from 'next/server';

// In-memory database simulation
let networks = new Map();
let analyses = new Map();

// Initialize with sample data
function initializeSampleData() {
  if (networks.size === 0) {
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    networks.set('network_1', sampleNetwork);
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');

    initializeSampleData();

    if (type === 'networks') {
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

      return NextResponse.json({
        success: true,
        networks: userNetworks,
        total: userNetworks.length,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid type parameter',
      timestamp: new Date().toISOString()
    }, { status: 400 });
  } catch (error) {
    console.error('Database GET API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch data from database',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    initializeSampleData();

    if (type === 'network') {
      const { name, description, nodes, edges, userId, metadata } = body;
      
      if (!name || !nodes || !Array.isArray(nodes)) {
        return NextResponse.json({
          success: false,
          error: 'Network name and nodes are required',
          timestamp: new Date().toISOString()
        }, { status: 400 });
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

      return NextResponse.json({
        success: true,
        network,
        message: 'Network created successfully',
        timestamp: new Date().toISOString()
      }, { status: 201 });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid type parameter',
      timestamp: new Date().toISOString()
    }, { status: 400 });
  } catch (error) {
    console.error('Database POST API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save data to database',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, id } = body;

    initializeSampleData();

    if (type === 'network') {
      if (!id) {
        return NextResponse.json({
          success: false,
          error: 'Network ID is required',
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }

      const existingNetwork = networks.get(id);
      if (!existingNetwork) {
        return NextResponse.json({
          success: false,
          error: 'Network not found',
          timestamp: new Date().toISOString()
        }, { status: 404 });
      }

      const updatedNetwork = {
        ...existingNetwork,
        ...body,
        id: existingNetwork.id,
        createdAt: existingNetwork.createdAt,
        updatedAt: new Date().toISOString()
      };

      networks.set(id, updatedNetwork);

      return NextResponse.json({
        success: true,
        network: updatedNetwork,
        message: 'Network updated successfully',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid type parameter',
      timestamp: new Date().toISOString()
    }, { status: 400 });
  } catch (error) {
    console.error('Database PUT API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update data in database',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    initializeSampleData();

    if (type === 'network') {
      if (!id) {
        return NextResponse.json({
          success: false,
          error: 'Network ID is required',
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }

      const network = networks.get(id);
      if (!network) {
        return NextResponse.json({
          success: false,
          error: 'Network not found',
          timestamp: new Date().toISOString()
        }, { status: 404 });
      }

      networks.delete(id);

      return NextResponse.json({
        success: true,
        message: 'Network deleted successfully',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid type parameter',
      timestamp: new Date().toISOString()
    }, { status: 400 });
  } catch (error) {
    console.error('Database DELETE API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete data from database',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}