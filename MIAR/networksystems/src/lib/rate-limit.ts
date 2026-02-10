import { RateLimiterMemory } from 'rate-limiter-flexible';

/**
 * Rate Limiting Configuration
 * Uses in-memory store for development
 * For production, use Redis/Upstash for distributed rate limiting
 */

// Rate limiter instances
const rateLimiters = {
  // API requests per user
  api: new RateLimiterMemory({
    points: 100, // Number of requests
    duration: 60, // Per 60 seconds (1 minute)
    blockDuration: 60, // Block for 60 seconds if exceeded
  }),

  // Authentication attempts
  auth: new RateLimiterMemory({
    points: 5, // Max 5 attempts
    duration: 300, // Per 5 minutes
    blockDuration: 900, // Block for 15 minutes if exceeded
  }),

  // Data export operations (more expensive)
  export: new RateLimiterMemory({
    points: 10, // Max 10 exports
    duration: 3600, // Per hour
    blockDuration: 3600, // Block for 1 hour if exceeded
  }),

  // AI/ML operations (very expensive)
  ml: new RateLimiterMemory({
    points: 20, // Max 20 requests
    duration: 3600, // Per hour
    blockDuration: 3600, // Block for 1 hour if exceeded
  }),

  // External API calls (respect third-party limits)
  external: new RateLimiterMemory({
    points: 50, // Max 50 requests
    duration: 3600, // Per hour
    blockDuration: 1800, // Block for 30 minutes if exceeded
  }),
};

/**
 * Rate limit types mapped to subscription tiers
 */
const subscriptionLimits = {
  free: {
    api: { points: 50, duration: 60 },
    export: { points: 2, duration: 3600 },
    ml: { points: 5, duration: 3600 },
    external: { points: 10, duration: 3600 },
  },
  starter: {
    api: { points: 100, duration: 60 },
    export: { points: 10, duration: 3600 },
    ml: { points: 20, duration: 3600 },
    external: { points: 50, duration: 3600 },
  },
  professional: {
    api: { points: 200, duration: 60 },
    export: { points: 50, duration: 3600 },
    ml: { points: 100, duration: 3600 },
    external: { points: 200, duration: 3600 },
  },
  enterprise: {
    api: { points: 1000, duration: 60 },
    export: { points: 1000, duration: 3600 },
    ml: { points: 1000, duration: 3600 },
    external: { points: 1000, duration: 3600 },
  },
};

/**
 * Check rate limit for a given identifier and type
 * @param identifier - Usually user ID or IP address
 * @param type - Type of rate limit (api, auth, export, ml, external)
 * @param subscription - User subscription tier (optional, defaults to 'free')
 * @returns Object with success status and remaining points
 */
export async function checkRateLimit(
  identifier: string,
  type: keyof typeof rateLimiters,
  subscription: string = 'free'
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  blocked: boolean;
}> {
  try {
    const limiter = rateLimiters[type];
    const result = await limiter.consume(identifier, 1);

    // Get subscription-specific limits
    const subLimits = subscriptionLimits[subscription as keyof typeof subscriptionLimits] || subscriptionLimits.free;
    const typeLimit = subLimits[type as keyof typeof subLimits];

    return {
      success: true,
      limit: typeLimit?.points || limiter.points,
      remaining: result.remainingPoints,
      reset: new Date(Date.now() + result.msBeforeNext),
      blocked: false,
    };
  } catch (error: any) {
    // Rate limit exceeded
    return {
      success: false,
      limit: error.consumedPoints || 0,
      remaining: 0,
      reset: new Date(Date.now() + error.msBeforeNext),
      blocked: true,
    };
  }
}

/**
 * Reset rate limit for a specific identifier
 * Useful for administrative actions
 */
export async function resetRateLimit(
  identifier: string,
  type: keyof typeof rateLimiters
): Promise<void> {
  const limiter = rateLimiters[type];
  await limiter.delete(identifier);
}

/**
 * Get remaining points for a user without consuming
 */
export async function getRemainingPoints(
  identifier: string,
  type: keyof typeof rateLimiters
): Promise<number> {
  const limiter = rateLimiters[type];
  const result = await limiter.get(identifier);
  return result?.remainingPoints || limiter.points;
}

/**
 * Middleware helper to add rate limit headers
 */
export function getRateLimitHeaders(result: {
  limit: number;
  remaining: number;
  reset: Date;
}): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toISOString(),
    'Retry-After': Math.ceil((result.reset.getTime() - Date.now()) / 1000).toString(),
  };
}

/**
 * Check if IP address should be rate limited more strictly
 * Used for authentication to prevent brute force
 */
export async function checkIPRateLimit(
  ipAddress: string,
  type: 'auth' | 'api' = 'auth'
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const result = await checkRateLimit(ipAddress, type);

  if (!result.success) {
    return {
      allowed: false,
      retryAfter: Math.ceil((result.reset.getTime() - Date.now()) / 1000),
    };
  }

  return { allowed: true };
}
