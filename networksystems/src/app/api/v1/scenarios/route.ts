import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api-middleware';
import { prisma } from '@/lib/prisma';
import {
  scenarioCreateSchema,
  validateRequestBody,
  ValidationError,
} from '@/lib/validation';
import { getRateLimitHeaders } from '@/lib/rate-limit';

/**
 * GET /api/v1/scenarios
 * List all scenarios for the authenticated user
 */
export async function GET(request: NextRequest) {
  return withApiMiddleware(
    request,
    async (context) => {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
      const type = searchParams.get('type');

      const where: any = { userId: context.userId };
      if (type) {
        where.type = type;
      }

      const [scenarios, total] = await Promise.all([
        prisma.scenario.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            completedAt: true,
          },
        }),
        prisma.scenario.count({ where }),
      ]);

      return NextResponse.json({
        success: true,
        data: scenarios,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
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
 * POST /api/v1/scenarios
 * Create a new supply chain scenario
 */
export async function POST(request: NextRequest) {
  return withApiMiddleware(
    request,
    async (context) => {
      try {
        const body = await request.json();

        // Validate input
        const data = validateRequestBody(scenarioCreateSchema, body);

        // Create scenario
        const scenario = await prisma.scenario.create({
          data: {
            name: data.name,
            description: data.description,
            type: data.type,
            parameters: JSON.stringify(data.parameters),
            status: 'pending',
            userId: context.userId,
          },
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            status: true,
            createdAt: true,
          },
        });

        return NextResponse.json(
          {
            success: true,
            data: scenario,
            message: 'Scenario created successfully',
          },
          { status: 201 }
        );
      } catch (error) {
        if (error instanceof ValidationError) {
          return NextResponse.json(
            {
              success: false,
              error: 'Validation failed',
              details: error.errors,
            },
            { status: 400 }
          );
        }

        throw error;
      }
    },
    {
      rateLimit: 'api',
      minimumSubscription: 'starter', // Scenarios require at least starter plan
      logRequest: true,
      resource: 'scenarios',
    }
  );
}
