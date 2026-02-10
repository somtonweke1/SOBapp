import { NextRequest, NextResponse } from 'next/server';
import { runHealthCheck, getSystemStats, getAlerts } from '@/lib/monitoring';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Health Check Endpoint
 * Returns comprehensive health status of the application and its dependencies
 *
 * Query Parameters:
 * - detailed: Include detailed system information (default: false)
 *
 * Response Status Codes:
 * - 200: Healthy or degraded
 * - 503: Unhealthy
 */

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';

    // Run comprehensive health checks
    const health = await runHealthCheck();

    // Basic health response
    const response: any = {
      status: health.status,
      timestamp: health.timestamp,
      uptime: health.uptime,
      version: health.version,
      environment: process.env.NODE_ENV || 'development',
    };

    // Add detailed information if requested
    if (detailed) {
      response.checks = health.checks;
      response.system = getSystemStats();
      response.alerts = getAlerts(undefined, true); // Only unresolved alerts
    }

    // Set appropriate HTTP status code
    const statusCode =
      health.status === 'healthy'
        ? 200
        : health.status === 'degraded'
          ? 200
          : 503;

    return NextResponse.json(response, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
        'X-Response-Time': `${Date.now() - startTime}ms`,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Health check endpoint failed');

    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Response-Time': `${Date.now() - startTime}ms`,
        },
      }
    );
  }
}

/**
 * HEAD /api/health
 *
 * Lightweight health check (no response body)
 * Useful for simple uptime monitoring
 */
export async function HEAD() {
  try {
    const health = await runHealthCheck();

    const statusCode =
      health.status === 'healthy'
        ? 200
        : health.status === 'degraded'
          ? 200
          : 503;

    return new NextResponse(null, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': health.status,
      },
    });
  } catch (error) {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': 'unhealthy',
      },
    });
  }
}
