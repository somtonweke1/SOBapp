/**
 * Example API Route with Caching
 * Demonstrates how to use API caching and invalidation
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  withCache,
  CacheKeyGenerators,
  CacheStrategies,
  CacheInvalidation,
} from '@/lib/api-cache';
import { CACHE_TTL } from '@/lib/cache';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/cache-example/scenarios
 * Cached list of scenarios with automatic invalidation
 */
export const GET = withCache(
  async (req: NextRequest) => {
    // Simulate expensive database query
    const scenarios = await prisma.scenario.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      scenarios,
      timestamp: new Date().toISOString(),
      cached: false, // Will be true on cache hit
    });
  },
  {
    // Cache configuration
    keyGenerator: CacheKeyGenerators.fromUrl,
    ttl: CACHE_TTL.MEDIUM,
    tags: ['scenarios', 'list'],

    // Skip cache if user wants fresh data
    skipIf: (req) => {
      const url = new URL(req.url);
      return url.searchParams.has('fresh');
    },

    // Only cache successful responses
    cacheIf: (req, response) => {
      return response && response.scenarios && response.scenarios.length > 0;
    },
  }
);

/**
 * POST /api/v1/cache-example/scenarios
 * Create scenario and invalidate related caches
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Create scenario
    const scenario = await prisma.scenario.create({
      data: {
        name: body.name,
        description: body.description,
        type: body.type || 'baseline',
        parameters: JSON.stringify(body.parameters || {}),
        userId: body.userId, // In real app, get from auth
        status: 'pending',
      },
    });

    // Invalidate related caches
    await CacheInvalidation.invalidateMultiple([
      'api:/api/v1/cache-example/scenarios', // List endpoint
      `scenario:${scenario.id}`, // Specific scenario
    ]);

    // Also invalidate by tag
    await CacheInvalidation.invalidateByTag('scenarios');

    return NextResponse.json(
      {
        scenario,
        message: 'Scenario created and caches invalidated',
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create scenario' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/cache-example/scenarios/:id
 * Update scenario and invalidate caches
 */
export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const scenarioId = url.pathname.split('/').pop();

    if (!scenarioId) {
      return NextResponse.json({ error: 'Scenario ID required' }, { status: 400 });
    }

    const body = await req.json();

    // Update scenario
    const scenario = await prisma.scenario.update({
      where: { id: scenarioId },
      data: {
        name: body.name,
        description: body.description,
        parameters: JSON.stringify(body.parameters),
        updatedAt: new Date(),
      },
    });

    // Invalidate specific scenario cache
    await CacheInvalidation.invalidateScenario(scenarioId);

    // Invalidate list caches
    await CacheInvalidation.invalidateByTag('scenarios');

    return NextResponse.json({
      scenario,
      message: 'Scenario updated and caches invalidated',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update scenario' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/cache-example/scenarios/:id
 * Delete scenario and invalidate caches
 */
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const scenarioId = url.pathname.split('/').pop();

    if (!scenarioId) {
      return NextResponse.json({ error: 'Scenario ID required' }, { status: 400 });
    }

    // Delete scenario
    await prisma.scenario.delete({
      where: { id: scenarioId },
    });

    // Invalidate all related caches
    await CacheInvalidation.invalidateMultiple([
      `scenario:${scenarioId}`,
      'api:/api/v1/cache-example/scenarios',
    ]);

    await CacheInvalidation.invalidateByTag('scenarios');

    return NextResponse.json({
      message: 'Scenario deleted and caches invalidated',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete scenario' },
      { status: 500 }
    );
  }
}
