import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for demo purposes
// In production, this would use a real database
let miningNetworks: any[] = [];
let labResults: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...data } = body;

    if (type === 'mining_network') {
      const network = {
        ...data,
        id: data.id || `network_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Check if network already exists
      const existingIndex = miningNetworks.findIndex(n => n.id === network.id);
      if (existingIndex >= 0) {
        miningNetworks[existingIndex] = network;
      } else {
        miningNetworks.push(network);
      }

      return NextResponse.json({
        success: true,
        message: 'Mining network saved successfully',
        network,
        timestamp: new Date().toISOString()
      });
    }

    if (type === 'lab_results') {
      const results = {
        ...data,
        id: `results_${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      
      labResults.push(results);

      return NextResponse.json({
        success: true,
        message: 'Lab results saved successfully',
        results,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid data type specified',
      timestamp: new Date().toISOString()
    }, { status: 400 });

  } catch (error) {
    console.error('Mining database POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save data',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const region = searchParams.get('region');
    const networkId = searchParams.get('networkId');

    if (type === 'networks') {
      let filteredNetworks = miningNetworks;
      
      if (region) {
        filteredNetworks = miningNetworks.filter(network => 
          network.region === region
        );
      }

      return NextResponse.json({
        success: true,
        networks: filteredNetworks,
        total: filteredNetworks.length,
        timestamp: new Date().toISOString()
      });
    }

    if (type === 'lab_results') {
      let filteredResults = labResults;
      
      if (networkId) {
        filteredResults = labResults.filter(result => 
          result.networkId === networkId
        );
      }

      return NextResponse.json({
        success: true,
        results: filteredResults,
        total: filteredResults.length,
        timestamp: new Date().toISOString()
      });
    }

    if (type === 'summary') {
      const summary = {
        totalNetworks: miningNetworks.length,
        networksByRegion: miningNetworks.reduce((acc: any, network) => {
          acc[network.region] = (acc[network.region] || 0) + 1;
          return acc;
        }, {}),
        totalSites: miningNetworks.reduce((sum, network) => sum + (network.sites?.length || 0), 0),
        operationalSites: miningNetworks.reduce((sum, network) => {
          return sum + (network.sites?.filter((s: any) => s.status === 'operational').length || 0);
        }, 0),
        totalLabResults: labResults.length,
        avgNetworkEfficiency: miningNetworks.length > 0 
          ? miningNetworks.reduce((sum, n) => sum + (n.metadata?.averageEfficiency || 0), 0) / miningNetworks.length
          : 0
      };

      return NextResponse.json({
        success: true,
        summary,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid request type',
      timestamp: new Date().toISOString()
    }, { status: 400 });

  } catch (error) {
    console.error('Mining database GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve data',
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

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID parameter is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (type === 'network') {
      const initialLength = miningNetworks.length;
      miningNetworks = miningNetworks.filter(network => network.id !== id);
      
      if (miningNetworks.length === initialLength) {
        return NextResponse.json({
          success: false,
          error: 'Network not found',
          timestamp: new Date().toISOString()
        }, { status: 404 });
      }

      // Also remove related lab results
      labResults = labResults.filter(result => result.networkId !== id);

      return NextResponse.json({
        success: true,
        message: 'Network and related results deleted successfully',
        timestamp: new Date().toISOString()
      });
    }

    if (type === 'lab_result') {
      const initialLength = labResults.length;
      labResults = labResults.filter(result => result.id !== id);
      
      if (labResults.length === initialLength) {
        return NextResponse.json({
          success: false,
          error: 'Lab result not found',
          timestamp: new Date().toISOString()
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: 'Lab result deleted successfully',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid delete type',
      timestamp: new Date().toISOString()
    }, { status: 400 });

  } catch (error) {
    console.error('Mining database DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete data',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
