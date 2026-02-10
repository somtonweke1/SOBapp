/**
 * API Caching & Invalidation Middleware
 * Integrates caching with API routes and automatic invalidation
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  CACHE_PREFIXES,
  CACHE_TTL,
} from './cache';
import logger, { logPerformanceMetric } from './logger';

/**
 * Cache configuration for API routes
 */
export interface ApiCacheConfig {
  // Cache key generator function
  keyGenerator: (req: NextRequest, context?: any) => string;

  // Time to live
  ttl?: number;

  // Cache conditions
  cacheIf?: (req: NextRequest, response: any) => boolean;

  // Invalidation patterns
  invalidateOn?: string[];

  // Tags for grouped invalidation
  tags?: string[];

  // Skip cache for certain conditions
  skipIf?: (req: NextRequest) => boolean;
}

/**
 * Cache wrapper for API route handlers
 */
export function withCache<T = any>(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse<T>>,
  config: ApiCacheConfig
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse<T>> => {
    const startTime = performance.now();

    // Check if we should skip cache
    if (config.skipIf && config.skipIf(req)) {
      logger.debug({ type: 'cache_skip', reason: 'skip_condition' }, 'Cache skipped by condition');
      return handler(req, context);
    }

    // Skip cache for non-GET requests
    if (req.method !== 'GET') {
      const response = await handler(req, context);

      // Invalidate cache if configured
      if (config.invalidateOn) {
        await Promise.all(
          config.invalidateOn.map(pattern => deleteCachePattern(pattern))
        );
        logger.info(
          { type: 'cache_invalidation', patterns: config.invalidateOn, method: req.method },
          'Cache invalidated'
        );
      }

      return response;
    }

    // Generate cache key
    const cacheKey = config.keyGenerator(req, context);

    // Try to get from cache
    const cached = await getCache<any>(cacheKey);

    if (cached !== null) {
      const duration = performance.now() - startTime;
      logPerformanceMetric({
        operation: 'api_cache_hit',
        duration,
        metadata: { cacheKey, path: req.nextUrl.pathname },
      });

      // Return cached response
      return NextResponse.json(cached, {
        headers: {
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey,
        },
      });
    }

    // Cache miss - call handler
    const response = await handler(req, context);

    // Check if we should cache the response
    const responseData = await response.clone().json();
    const shouldCache = config.cacheIf
      ? config.cacheIf(req, responseData)
      : response.status === 200;

    if (shouldCache && response.status === 200) {
      await setCache(cacheKey, responseData, config.ttl);

      // Add cache tags if configured
      if (config.tags) {
        await Promise.all(
          config.tags.map(tag =>
            setCache(`tag:${tag}:${cacheKey}`, true, config.ttl)
          )
        );
      }

      logger.debug(
        { type: 'cache_set', cacheKey, ttl: config.ttl, tags: config.tags },
        'Response cached'
      );
    }

    const duration = performance.now() - startTime;
    logPerformanceMetric({
      operation: 'api_cache_miss',
      duration,
      metadata: { cacheKey, path: req.nextUrl.pathname },
    });

    return NextResponse.json(responseData, {
      headers: {
        'X-Cache': 'MISS',
        'X-Cache-Key': cacheKey,
      },
    });
  };
}

/**
 * Cache key generators for common patterns
 */
export const CacheKeyGenerators = {
  // Generate key from URL path and query params
  fromUrl: (req: NextRequest) => {
    const url = new URL(req.url);
    return `${CACHE_PREFIXES.API_RESPONSE}${url.pathname}:${url.search}`;
  },

  // Generate key from URL and user ID
  fromUrlAndUser: (req: NextRequest, context?: { userId?: string }) => {
    const url = new URL(req.url);
    const userId = context?.userId || 'anonymous';
    return `${CACHE_PREFIXES.API_RESPONSE}${userId}:${url.pathname}:${url.search}`;
  },

  // Generate key from resource type and ID
  fromResource: (resourceType: string) => (req: NextRequest, context?: { id?: string }) => {
    const id = context?.id || req.url.split('/').pop();
    return `${CACHE_PREFIXES[resourceType as keyof typeof CACHE_PREFIXES] || CACHE_PREFIXES.API_RESPONSE}${id}`;
  },

  // Custom key generator
  custom: (keyFn: (req: NextRequest, context?: any) => string) => keyFn,
};

/**
 * Common cache configurations
 */
export const CacheConfigs = {
  // Short-lived cache for frequently changing data
  shortLived: {
    ttl: CACHE_TTL.SHORT,
    cacheIf: (req: NextRequest, response: any) => response && !response.error,
  },

  // Medium-lived cache for moderate frequency data
  mediumLived: {
    ttl: CACHE_TTL.MEDIUM,
    cacheIf: (req: NextRequest, response: any) => response && !response.error,
  },

  // Long-lived cache for infrequently changing data
  longLived: {
    ttl: CACHE_TTL.LONG,
    cacheIf: (req: NextRequest, response: any) => response && !response.error,
  },

  // User-specific cache
  userSpecific: {
    ttl: CACHE_TTL.MEDIUM,
    skipIf: (req: NextRequest) => !req.headers.get('authorization'),
  },

  // Public cache (same for all users)
  public: {
    ttl: CACHE_TTL.LONG,
    cacheIf: (req: NextRequest, response: any) => response && !response.error,
  },
};

/**
 * Invalidation helpers
 */
export const CacheInvalidation = {
  // Invalidate all caches for a specific user
  invalidateUser: async (userId: string) => {
    await deleteCachePattern(`${CACHE_PREFIXES.USER}${userId}`);
    logger.info({ type: 'cache_invalidation', userId }, 'User cache invalidated');
  },

  // Invalidate all caches for a specific scenario
  invalidateScenario: async (scenarioId: string) => {
    await deleteCachePattern(`${CACHE_PREFIXES.SCENARIO}${scenarioId}`);
    logger.info({ type: 'cache_invalidation', scenarioId }, 'Scenario cache invalidated');
  },

  // Invalidate all caches for a specific network
  invalidateNetwork: async (networkId: string) => {
    await deleteCachePattern(`${CACHE_PREFIXES.NETWORK}${networkId}`);
    logger.info({ type: 'cache_invalidation', networkId }, 'Network cache invalidated');
  },

  // Invalidate all analysis caches
  invalidateAnalyses: async () => {
    await deleteCachePattern(CACHE_PREFIXES.ANALYSIS);
    logger.info({ type: 'cache_invalidation' }, 'All analysis caches invalidated');
  },

  // Invalidate commodity price caches
  invalidateCommodities: async () => {
    await deleteCachePattern(CACHE_PREFIXES.COMMODITY);
    logger.info({ type: 'cache_invalidation' }, 'Commodity price caches invalidated');
  },

  // Invalidate by tag
  invalidateByTag: async (tag: string) => {
    await deleteCachePattern(`tag:${tag}:`);
    logger.info({ type: 'cache_invalidation', tag }, 'Tagged caches invalidated');
  },

  // Invalidate multiple patterns
  invalidateMultiple: async (patterns: string[]) => {
    await Promise.all(patterns.map(pattern => deleteCachePattern(pattern)));
    logger.info(
      { type: 'cache_invalidation', patterns },
      'Multiple cache patterns invalidated'
    );
  },
};

/**
 * Cache strategies for different resource types
 */
export const CacheStrategies = {
  // User data: cache per user, invalidate on update
  user: {
    keyGenerator: CacheKeyGenerators.fromResource('USER'),
    ttl: CACHE_TTL.MEDIUM,
    invalidateOn: [CACHE_PREFIXES.USER],
    tags: ['user'],
  },

  // Scenario data: cache per scenario, invalidate on update
  scenario: {
    keyGenerator: CacheKeyGenerators.fromResource('SCENARIO'),
    ttl: CACHE_TTL.MEDIUM,
    invalidateOn: [CACHE_PREFIXES.SCENARIO],
    tags: ['scenario'],
  },

  // Network data: cache per network, invalidate on update
  network: {
    keyGenerator: CacheKeyGenerators.fromResource('NETWORK'),
    ttl: CACHE_TTL.MEDIUM,
    invalidateOn: [CACHE_PREFIXES.NETWORK],
    tags: ['network'],
  },

  // Analysis results: cache per analysis, long TTL
  analysis: {
    keyGenerator: CacheKeyGenerators.fromResource('ANALYSIS'),
    ttl: CACHE_TTL.LONG,
    invalidateOn: [CACHE_PREFIXES.ANALYSIS],
    tags: ['analysis'],
  },

  // Commodity prices: cache globally, short TTL (1 min)
  commodity: {
    keyGenerator: CacheKeyGenerators.fromUrl,
    ttl: CACHE_TTL.SHORT,
    invalidateOn: [CACHE_PREFIXES.COMMODITY],
    tags: ['commodity', 'market-data'],
  },

  // News: cache globally, medium TTL (5 min)
  news: {
    keyGenerator: CacheKeyGenerators.fromUrl,
    ttl: CACHE_TTL.MEDIUM,
    invalidateOn: [CACHE_PREFIXES.NEWS],
    tags: ['news'],
  },

  // Lists: cache with query params, medium TTL
  list: {
    keyGenerator: CacheKeyGenerators.fromUrlAndUser,
    ttl: CACHE_TTL.MEDIUM,
    skipIf: (req: NextRequest) => {
      const url = new URL(req.url);
      // Skip cache if requesting fresh data
      return url.searchParams.has('fresh') || url.searchParams.has('nocache');
    },
  },
};

/**
 * Example usage in API route
 */
export const exampleApiRoute = withCache(
  async (req: NextRequest) => {
    // Your API logic here
    const data = { message: 'Hello World' };
    return NextResponse.json(data);
  },
  {
    keyGenerator: CacheKeyGenerators.fromUrl,
    ttl: CACHE_TTL.MEDIUM,
    tags: ['example'],
  }
);

export default withCache;
