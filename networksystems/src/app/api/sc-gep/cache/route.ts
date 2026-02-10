import { NextRequest, NextResponse } from 'next/server';
import { getSolutionCacheService } from '@/services/solution-cache-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'stats';
    const scenario = searchParams.get('scenario');
    const region = searchParams.get('region');

    const cacheService = getSolutionCacheService();

    switch (action) {
      case 'stats':
        const stats = cacheService.getStats();
        return NextResponse.json({
          success: true,
          data: {
            ...stats,
            hitRate: (stats.hitRate * 100).toFixed(2) + '%',
            avgComputeTime: stats.avgComputeTime.toFixed(2) + 's',
            cacheSize: (stats.cacheSize / 1024).toFixed(2) + ' KB'
          },
          timestamp: new Date().toISOString()
        });

      case 'list':
        let solutions = Array.from(cacheService['cache'].values());

        if (scenario) {
          solutions = cacheService.getByScenario(scenario as any);
        } else if (region) {
          solutions = cacheService.getByRegion(region);
        }

        return NextResponse.json({
          success: true,
          data: solutions.map(s => ({
            id: s.id,
            scenario: s.scenario,
            region: s.region,
            timestamp: s.timestamp,
            computeTime: s.computeTime,
            objectiveValue: s.solution.objectiveValue,
            feasibility: s.solution.feasibility,
            metadata: s.metadata
          })),
          timestamp: new Date().toISOString()
        });

      case 'export':
        const exportData = cacheService.export();
        return new NextResponse(exportData, {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="sc-gep-cache-${Date.now()}.json"`
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Cache API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to access cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    const cacheService = getSolutionCacheService();

    switch (action) {
      case 'cleanup':
        const removed = cacheService.cleanup();
        return NextResponse.json({
          success: true,
          message: `Removed ${removed} expired cache entries`,
          timestamp: new Date().toISOString()
        });

      case 'invalidate':
        const { scenario, region } = body;
        const invalidated = cacheService.invalidate(scenario, region);
        return NextResponse.json({
          success: true,
          message: `Invalidated ${invalidated} cache entries`,
          timestamp: new Date().toISOString()
        });

      case 'clear':
        const cleared = cacheService.invalidate();
        return NextResponse.json({
          success: true,
          message: `Cleared all ${cleared} cache entries`,
          timestamp: new Date().toISOString()
        });

      case 'import':
        const { data } = body;
        const imported = cacheService.import(data);
        return NextResponse.json({
          success: true,
          message: `Imported ${imported} cache entries`,
          timestamp: new Date().toISOString()
        });

      case 'compare':
        const { id1, id2 } = body;
        const comparison = cacheService.compareSolutions(id1, id2);

        if (!comparison) {
          return NextResponse.json({
            success: false,
            error: 'One or both solutions not found in cache'
          }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          data: comparison,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Cache API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
