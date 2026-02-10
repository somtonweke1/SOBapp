/**
 * Constellation Energy Demo API
 * GET /api/demos/constellation
 */

import { NextResponse } from 'next/server';
import {
  createConstellationDemo,
  formatDemoForPresentation,
  generateDemoVisualization,
} from '@/services/demos/constellation-energy-demo';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    const demo = createConstellationDemo();

    if (format === 'markdown') {
      return new Response(formatDemoForPresentation(demo), {
        headers: {
          'Content-Type': 'text/markdown',
        },
      });
    }

    if (format === 'visualization') {
      return NextResponse.json(generateDemoVisualization(demo));
    }

    return NextResponse.json({
      scenario: demo.scenario,
      constraints: demo.constraints,
      digitalTwin: {
        processing: demo.digitalTwin.processing,
        logistics: demo.digitalTwin.logistics,
        activeConstraints: demo.digitalTwin.activeConstraints.length,
      },
      mitigationOptions: demo.mitigationOptions,
      financialImpact: demo.financialImpact,
      recommendations: {
        optimal: demo.scenario.optimalMitigationPlan.actions.map(a => ({
          description: a.description,
          cost: a.cost,
          npvImpact: a.npvImpact,
          roi: a.npvImpact / a.cost,
          timeToImplement: a.timeToImplement,
        })),
        summary: {
          totalCost: demo.scenario.optimalMitigationPlan.totalCost,
          expectedBenefit: demo.scenario.optimalMitigationPlan.expectedBenefit,
          netValue:
            demo.scenario.optimalMitigationPlan.expectedBenefit -
            demo.scenario.optimalMitigationPlan.totalCost,
          roi: demo.scenario.optimalMitigationPlan.roi,
        },
      },
      visualization: generateDemoVisualization(demo),
    });
  } catch (error) {
    console.error('Constellation demo error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate demo',
      },
      { status: 500 }
    );
  }
}
