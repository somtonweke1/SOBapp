import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api-middleware';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/scenarios/:id
 * Get a specific scenario by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiMiddleware(
    request,
    async (context) => {
      const scenario = await prisma.scenario.findUnique({
        where: { id: params.id },
      });

      if (!scenario) {
        return NextResponse.json(
          { success: false, error: 'Scenario not found' },
          { status: 404 }
        );
      }

      // Check ownership
      if (scenario.userId !== context.userId && context.userRole !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          ...scenario,
          parameters: JSON.parse(scenario.parameters),
          results: scenario.results ? JSON.parse(scenario.results) : null,
        },
      });
    },
    {
      rateLimit: 'api',
      logRequest: true,
      resource: 'scenarios',
    }
  );
}

/**
 * DELETE /api/v1/scenarios/:id
 * Delete a scenario
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiMiddleware(
    request,
    async (context) => {
      const scenario = await prisma.scenario.findUnique({
        where: { id: params.id },
      });

      if (!scenario) {
        return NextResponse.json(
          { success: false, error: 'Scenario not found' },
          { status: 404 }
        );
      }

      // Check ownership
      if (scenario.userId !== context.userId && context.userRole !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        );
      }

      await prisma.scenario.delete({
        where: { id: params.id },
      });

      return NextResponse.json({
        success: true,
        message: 'Scenario deleted successfully',
      });
    },
    {
      rateLimit: 'api',
      logRequest: true,
      resource: 'scenarios',
    }
  );
}
