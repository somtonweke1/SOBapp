import { LRUCache } from 'lru-cache';
import logger from './logger';

/**
 * Caching Layer
 * Multi-tier caching with in-memory LRU and optional Redis
 */

// In-memory LRU cache for fast access
const memoryCache = new LRUCache<string, any>({
  max: 500, // Maximum number of items
  ttl: 1000 * 60 * 5, // 5 minutes default TTL
  updateAgeOnGet: true,
  updateAgeOnHas: true,
});

/**
 * Cache key prefixes for different data types
 */
export const CACHE_PREFIXES = {
  USER: 'user:',
  SCENARIO: 'scenario:',
  NETWORK: 'network:',
  ANALYSIS: 'analysis:',
  COMMODITY: 'commodity:',
  NEWS: 'news:',
  API_RESPONSE: 'api:',
} as const;

/**
 * Cache TTL (Time To Live) in milliseconds
 */
export const CACHE_TTL = {
  SHORT: 1000 * 60, // 1 minute
  MEDIUM: 1000 * 60 * 5, // 5 minutes
  LONG: 1000 * 60 * 30, // 30 minutes
  VERY_LONG: 1000 * 60 * 60, // 1 hour
  DAY: 1000 * 60 * 60 * 24, // 24 hours
} as const;

/**
 * Get value from cache
 */
export async function getCache<T = any>(key: string): Promise<T | null> {
  try {
    // Try memory cache first
    const memoryCached = memoryCache.get(key);
    if (memoryCached !== undefined) {
      logger.debug({ type: 'cache_hit', key, source: 'memory' }, 'Cache hit (memory)');
      return memoryCached as T;
    }

    logger.debug({ type: 'cache_miss', key }, 'Cache miss');
    return null;
  } catch (error) {
    logger.error({ type: 'cache_error', operation: 'get', key, error }, 'Cache get error');
    return null;
  }
}

/**
 * Set value in cache
 */
export async function setCache(
  key: string,
  value: any,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<void> {
  try {
    // Store in memory cache
    memoryCache.set(key, value, { ttl });

    logger.debug(
      { type: 'cache_set', key, ttl },
      'Cache set'
    );
  } catch (error) {
    logger.error({ type: 'cache_error', operation: 'set', key, error }, 'Cache set error');
  }
}

/**
 * Delete value from cache
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    memoryCache.delete(key);
    logger.debug({ type: 'cache_delete', key }, 'Cache deleted');
  } catch (error) {
    logger.error({ type: 'cache_error', operation: 'delete', key, error }, 'Cache delete error');
  }
}

/**
 * Delete all cache entries matching a pattern
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    const keys = Array.from(memoryCache.keys());
    const matchingKeys = keys.filter((key) => key.includes(pattern));

    for (const key of matchingKeys) {
      memoryCache.delete(key);
    }

    logger.debug(
      { type: 'cache_delete_pattern', pattern, count: matchingKeys.length },
      'Cache pattern deleted'
    );
  } catch (error) {
    logger.error(
      { type: 'cache_error', operation: 'deletePattern', pattern, error },
      'Cache delete pattern error'
    );
  }
}

/**
 * Clear all cache
 */
export async function clearCache(): Promise<void> {
  try {
    memoryCache.clear();
    logger.info({ type: 'cache_clear' }, 'Cache cleared');
  } catch (error) {
    logger.error({ type: 'cache_error', operation: 'clear', error }, 'Cache clear error');
  }
}

/**
 * Get or set cache (cache-aside pattern)
 */
export async function getCacheOrSet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<T> {
  // Try to get from cache
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  // If not in cache, fetch and store
  const value = await fetchFn();
  await setCache(key, value, ttl);

  return value;
}

/**
 * Invalidate cache for a specific entity
 */
export async function invalidateEntity(
  prefix: string,
  id: string
): Promise<void> {
  const pattern = `${prefix}${id}`;
  await deleteCachePattern(pattern);
}

/**
 * Invalidate all cache for a specific type
 */
export async function invalidateType(prefix: string): Promise<void> {
  await deleteCachePattern(prefix);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: memoryCache.size,
    maxSize: memoryCache.max,
    hitRate: memoryCache.size > 0 ? 'N/A' : '0%', // Would need tracking for real hit rate
  };
}

/**
 * Warm up cache with frequently accessed data
 */
export async function warmUpCache(
  warmUpFn: () => Promise<Array<{ key: string; value: any; ttl?: number }>>
): Promise<void> {
  try {
    const items = await warmUpFn();

    for (const item of items) {
      await setCache(item.key, item.value, item.ttl);
    }

    logger.info(
      { type: 'cache_warmup', count: items.length },
      'Cache warmed up'
    );
  } catch (error) {
    logger.error({ type: 'cache_error', operation: 'warmup', error }, 'Cache warmup error');
  }
}

/**
 * Cache middleware for API routes
 */
export function withCache<T>(
  keyGenerator: (...args: any[]) => string,
  ttl: number = CACHE_TTL.MEDIUM
) {
  return (fn: (...args: any[]) => Promise<T>) => {
    return async (...args: any[]): Promise<T> => {
      const key = keyGenerator(...args);
      return getCacheOrSet(key, () => fn(...args), ttl);
    };
  };
}

/**
 * Create a cached function
 */
export function cached<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    keyGenerator: (...args: Parameters<T>) => string;
    ttl?: number;
  }
): T {
  return (async (...args: Parameters<T>) => {
    const key = options.keyGenerator(...args);
    return getCacheOrSet(key, () => fn(...args), options.ttl);
  }) as T;
}
