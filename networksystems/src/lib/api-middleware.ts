import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';

/**
 * API Middleware for rate limiting, authentication, and logging
 */

export interface ApiContext {
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  subscription: string;
  permissions: string[];
  ipAddress: string;
}

/**
 * Get client IP address from request
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || '127.0.0.1';
  return ip;
}

/**
 * Validate and authenticate API request
 * Returns user context or throws error
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<ApiContext> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const permissions = JSON.parse(session.user.permissions || '[]');

  return {
    userId: session.user.id,
    userEmail: session.user.email || '',
    userName: session.user.name || '',
    userRole: session.user.role || 'user',
    subscription: session.user.subscription || 'free',
    permissions,
    ipAddress: getClientIp(request),
  };
}

/**
 * Apply rate limiting to API request
 */
export async function applyRateLimit(
  context: ApiContext,
  type: 'api' | 'export' | 'ml' | 'external' = 'api'
): Promise<NextResponse | null> {
  const result = await checkRateLimit(context.userId, type, context.subscription);

  if (!result.success) {
    const headers = getRateLimitHeaders(result);

    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again in ${Math.ceil(
          (result.reset.getTime() - Date.now()) / 1000
        )} seconds.`,
        limit: result.limit,
        reset: result.reset.toISOString(),
      },
      {
        status: 429,
        headers,
      }
    );
  }

  return null; // No rate limit hit
}

/**
 * Log API request for audit trail
 */
export async function logApiRequest(
  context: ApiContext,
  resource: string,
  action: string,
  details?: any
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: context.userId,
        action,
        resource,
        details: details ? JSON.stringify(details) : null,
        ipAddress: context.ipAddress,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to log API request:', error);
    // Don't throw - logging failure shouldn't break the API
  }
}

/**
 * Check if user has required permission
 */
export function checkPermission(
  context: ApiContext,
  requiredPermission: string
): boolean {
  // Admin wildcard
  if (context.permissions.includes('*')) {
    return true;
  }

  return context.permissions.includes(requiredPermission);
}

/**
 * Check if user has required role
 */
export function checkRole(
  context: ApiContext,
  requiredRole: 'user' | 'manager' | 'admin'
): boolean {
  const roleHierarchy: Record<string, number> = {
    user: 1,
    manager: 2,
    admin: 3,
  };

  return (
    (roleHierarchy[context.userRole] || 0) >= (roleHierarchy[requiredRole] || 0)
  );
}

/**
 * Check subscription level
 */
export function checkSubscription(
  context: ApiContext,
  minimumTier: 'free' | 'starter' | 'professional' | 'enterprise'
): boolean {
  const tierHierarchy: Record<string, number> = {
    free: 1,
    starter: 2,
    professional: 3,
    enterprise: 4,
  };

  return (
    (tierHierarchy[context.subscription] || 0) >= (tierHierarchy[minimumTier] || 0)
  );
}

/**
 * Complete API middleware wrapper
 * Handles auth, rate limiting, logging, and error handling
 */
export async function withApiMiddleware(
  request: NextRequest,
  handler: (context: ApiContext) => Promise<NextResponse>,
  options: {
    rateLimit?: 'api' | 'export' | 'ml' | 'external';
    requiredRole?: 'user' | 'manager' | 'admin';
    requiredPermission?: string;
    minimumSubscription?: 'free' | 'starter' | 'professional' | 'enterprise';
    logRequest?: boolean;
    resource?: string;
  } = {}
): Promise<NextResponse> {
  try {
    // 1. Authenticate
    const context = await authenticateRequest(request);

    // 2. Check role if required
    if (options.requiredRole && !checkRole(context, options.requiredRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions', required: options.requiredRole },
        { status: 403 }
      );
    }

    // 3. Check permission if required
    if (options.requiredPermission && !checkPermission(context, options.requiredPermission)) {
      return NextResponse.json(
        { error: 'Insufficient permissions', required: options.requiredPermission },
        { status: 403 }
      );
    }

    // 4. Check subscription if required
    if (options.minimumSubscription && !checkSubscription(context, options.minimumSubscription)) {
      return NextResponse.json(
        {
          error: 'Upgrade required',
          message: `This feature requires ${options.minimumSubscription} subscription or higher`,
          current: context.subscription,
          required: options.minimumSubscription,
        },
        { status: 402 }
      );
    }

    // 5. Apply rate limiting
    if (options.rateLimit) {
      const rateLimitResponse = await applyRateLimit(context, options.rateLimit);
      if (rateLimitResponse) {
        return rateLimitResponse;
      }
    }

    // 6. Log request if enabled
    if (options.logRequest && options.resource) {
      await logApiRequest(context, options.resource, request.method);
    }

    // 7. Execute handler
    return await handler(context);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('API middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
