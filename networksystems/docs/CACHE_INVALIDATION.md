# Cache Invalidation Guide

## Overview

Cache invalidation ensures that users always see up-to-date data by removing stale cached content when the underlying data changes.

## Quick Start

### Basic API Route with Caching

```typescript
import { withCache, CacheKeyGenerators, CacheInvalidation } from '@/lib/api-cache';
import { CACHE_TTL } from '@/lib/cache';

// GET endpoint with caching
export const GET = withCache(
  async (req) => {
    const data = await fetchData();
    return NextResponse.json(data);
  },
  {
    keyGenerator: CacheKeyGenerators.fromUrl,
    ttl: CACHE_TTL.MEDIUM,
    tags: ['data'],
  }
);

// POST endpoint with invalidation
export async function POST(req: NextRequest) {
  const data = await createData(req.body);

  // Invalidate related caches
  await CacheInvalidation.invalidateByTag('data');

  return NextResponse.json(data, { status: 201 });
}
```

## Cache Invalidation Strategies

### 1. Time-Based Invalidation (TTL)

**When to use:**
- Data changes predictably
- Acceptable to show slightly stale data
- Simplest approach

**Example:**
```typescript
export const GET = withCache(
  async (req) => {
    const commodityPrices = await fetchCommodityPrices();
    return NextResponse.json(commodityPrices);
  },
  {
    keyGenerator: CacheKeyGenerators.fromUrl,
    ttl: CACHE_TTL.SHORT, // 1 minute - prices update frequently
  }
);
```

**Best for:**
- Commodity prices (1-5 minutes)
- News articles (5-15 minutes)
- Analytics data (30-60 minutes)
- Configuration data (1-24 hours)

### 2. Event-Based Invalidation

**When to use:**
- Data must be immediately fresh
- User actions trigger updates
- Most accurate approach

**Example:**
```typescript
export async function PUT(req: NextRequest) {
  const { id } = await req.json();

  // Update data
  const updated = await prisma.scenario.update({
    where: { id },
    data: { /* ... */ },
  });

  // Immediately invalidate cache
  await CacheInvalidation.invalidateScenario(id);
  await CacheInvalidation.invalidateByTag('scenarios');

  return NextResponse.json(updated);
}
```

**Best for:**
- User profile updates
- CRUD operations
- Settings changes
- Critical data

### 3. Tag-Based Invalidation

**When to use:**
- Multiple caches related to same entity
- Bulk invalidation needed
- Complex relationships

**Example:**
```typescript
// Cache with tags
export const GET = withCache(
  async (req) => {
    const networks = await fetchNetworks();
    return NextResponse.json(networks);
  },
  {
    keyGenerator: CacheKeyGenerators.fromUrl,
    ttl: CACHE_TTL.MEDIUM,
    tags: ['networks', 'user-data', 'dashboard'], // Multiple tags
  }
);

// Invalidate all caches with 'networks' tag
await CacheInvalidation.invalidateByTag('networks');
```

**Best for:**
- Related data across endpoints
- Dashboard data
- User-specific caches
- Feature-based grouping

### 4. Pattern-Based Invalidation

**When to use:**
- Invalidating by prefix/pattern
- All caches for a resource type
- Wildcard invalidation

**Example:**
```typescript
// Invalidate all user-related caches
await CacheInvalidation.invalidateUser(userId);

// Invalidate all scenario caches
await deleteCachePattern('scenario:');

// Invalidate all API response caches
await deleteCachePattern('api:');
```

**Best for:**
- User logout (invalidate all user data)
- Bulk data updates
- System-wide cache clearing

## Common Patterns

### Pattern 1: List + Detail Caching

```typescript
// List endpoint - cached
export const GET = withCache(
  async (req) => {
    const scenarios = await prisma.scenario.findMany();
    return NextResponse.json(scenarios);
  },
  {
    keyGenerator: CacheKeyGenerators.fromUrl,
    ttl: CACHE_TTL.MEDIUM,
    tags: ['scenarios', 'list'],
  }
);

// Create endpoint - invalidates list
export async function POST(req: NextRequest) {
  const scenario = await createScenario(req.body);

  // Invalidate list caches
  await CacheInvalidation.invalidateByTag('list');
  await CacheInvalidation.invalidateByTag('scenarios');

  return NextResponse.json(scenario, { status: 201 });
}

// Detail endpoint - cached separately
export const GET_DETAIL = withCache(
  async (req, { id }) => {
    const scenario = await prisma.scenario.findUnique({ where: { id } });
    return NextResponse.json(scenario);
  },
  {
    keyGenerator: CacheKeyGenerators.fromResource('SCENARIO'),
    ttl: CACHE_TTL.LONG,
    tags: ['scenarios', 'detail'],
  }
);

// Update endpoint - invalidates detail + list
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const scenario = await updateScenario(params.id, req.body);

  // Invalidate specific scenario
  await CacheInvalidation.invalidateScenario(params.id);

  // Invalidate list caches
  await CacheInvalidation.invalidateByTag('list');

  return NextResponse.json(scenario);
}
```

### Pattern 2: User-Specific Caching

```typescript
// Cache per user
export const GET = withCache(
  async (req, context) => {
    const userId = context.userId; // From auth middleware
    const data = await getUserData(userId);
    return NextResponse.json(data);
  },
  {
    keyGenerator: CacheKeyGenerators.fromUrlAndUser,
    ttl: CACHE_TTL.MEDIUM,
    tags: ['user-data'],
    skipIf: (req) => !req.headers.get('authorization'), // Skip if not authenticated
  }
);

// Invalidate on user update
export async function PUT(req: NextRequest) {
  const { userId } = await getAuth(req);
  await updateUser(userId, req.body);

  // Invalidate all caches for this user
  await CacheInvalidation.invalidateUser(userId);

  return NextResponse.json({ success: true });
}
```

### Pattern 3: Conditional Caching

```typescript
export const GET = withCache(
  async (req) => {
    const data = await fetchData();
    return NextResponse.json(data);
  },
  {
    keyGenerator: CacheKeyGenerators.fromUrl,
    ttl: CACHE_TTL.MEDIUM,

    // Only cache if response is successful and has data
    cacheIf: (req, response) => {
      return response && !response.error && response.data.length > 0;
    },

    // Skip cache if user wants fresh data
    skipIf: (req) => {
      const url = new URL(req.url);
      return (
        url.searchParams.has('fresh') ||
        url.searchParams.has('nocache') ||
        req.headers.get('cache-control') === 'no-cache'
      );
    },
  }
);
```

### Pattern 4: Cascading Invalidation

```typescript
// When a network is updated, invalidate:
// 1. The network itself
// 2. All analyses for that network
// 3. User's network list
// 4. Dashboard caches

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const networkId = params.id;
  const network = await updateNetwork(networkId, req.body);

  // Cascading invalidation
  await CacheInvalidation.invalidateMultiple([
    `network:${networkId}`,           // Specific network
    `analysis:network:${networkId}`,  // Related analyses
    `user:${network.userId}:networks`, // User's network list
    'tag:dashboard',                   // Dashboard caches
  ]);

  return NextResponse.json(network);
}
```

### Pattern 5: Stale-While-Revalidate

```typescript
export const GET = withCache(
  async (req) => {
    const data = await fetchExpensiveData();
    return NextResponse.json(data);
  },
  {
    keyGenerator: CacheKeyGenerators.fromUrl,
    ttl: CACHE_TTL.MEDIUM,
  }
);

// Background job to refresh cache before it expires
export async function refreshCache() {
  const data = await fetchExpensiveData();
  await setCache('expensive-data', data, CACHE_TTL.LONG);
}

// Run every 4 minutes (cache expires in 5)
setInterval(refreshCache, 4 * 60 * 1000);
```

## Cache Key Strategies

### URL-Based Keys

```typescript
// Generates: "api:/api/scenarios?status=active&page=1"
CacheKeyGenerators.fromUrl(req)
```

**Pros:** Simple, works for most GET endpoints
**Cons:** Different query param order creates different keys

### User + URL Keys

```typescript
// Generates: "api:user123:/api/scenarios?status=active"
CacheKeyGenerators.fromUrlAndUser(req, { userId: 'user123' })
```

**Pros:** User-specific caching
**Cons:** More cache entries

### Resource-Based Keys

```typescript
// Generates: "scenario:abc123"
CacheKeyGenerators.fromResource('SCENARIO')(req, { id: 'abc123' })
```

**Pros:** Clear invalidation, consistent keys
**Cons:** Requires context

### Custom Keys

```typescript
CacheKeyGenerators.custom((req, context) => {
  const { userId, filter, sort } = context;
  return `custom:${userId}:${filter}:${sort}`;
})
```

**Pros:** Full control, optimized for use case
**Cons:** More complex

## Invalidation Helpers

### Built-in Helpers

```typescript
// Invalidate by resource type
await CacheInvalidation.invalidateUser('user123');
await CacheInvalidation.invalidateScenario('scenario456');
await CacheInvalidation.invalidateNetwork('network789');
await CacheInvalidation.invalidateAnalyses();
await CacheInvalidation.invalidateCommodities();

// Invalidate by tag
await CacheInvalidation.invalidateByTag('dashboard');
await CacheInvalidation.invalidateByTag('user-data');

// Invalidate multiple patterns
await CacheInvalidation.invalidateMultiple([
  'scenario:',
  'network:',
  'tag:dashboard',
]);
```

### Custom Invalidation

```typescript
import { deleteCachePattern } from '@/lib/cache';

// Invalidate all caches containing 'search'
await deleteCachePattern('search');

// Invalidate all caches for a specific date
await deleteCachePattern(`date:2025-01-15`);

// Clear entire cache (use sparingly!)
import { clearCache } from '@/lib/cache';
await clearCache();
```

## Best Practices

### ✅ Do

1. **Invalidate Immediately After Updates**
   ```typescript
   const data = await update();
   await invalidateCache(); // Immediate
   return NextResponse.json(data);
   ```

2. **Use Tags for Related Caches**
   ```typescript
   tags: ['scenarios', 'user-data', 'dashboard']
   ```

3. **Set Appropriate TTLs**
   - Real-time data: 1-5 minutes
   - Frequently updated: 5-15 minutes
   - Stable data: 30-60 minutes
   - Static data: 1-24 hours

4. **Provide Cache Bypass Options**
   ```typescript
   skipIf: (req) => req.url.includes('?fresh=true')
   ```

5. **Add Cache Headers**
   ```typescript
   'X-Cache': 'HIT' | 'MISS',
   'X-Cache-Key': cacheKey,
   'Cache-Control': 'public, max-age=300'
   ```

### ❌ Don't

1. **Don't Cache Sensitive Data**
   ```typescript
   // ❌ Bad
   cacheUserCredentials();

   // ✅ Good
   skipIf: (req) => req.url.includes('/auth')
   ```

2. **Don't Cache Error Responses**
   ```typescript
   cacheIf: (req, response) => !response.error && response.status === 200
   ```

3. **Don't Forget to Invalidate**
   ```typescript
   // ❌ Bad
   export async function PUT(req) {
     await updateData();
     return NextResponse.json({ success: true });
     // No invalidation!
   }

   // ✅ Good
   export async function PUT(req) {
     await updateData();
     await invalidateCache();
     return NextResponse.json({ success: true });
   }
   ```

4. **Don't Over-Invalidate**
   ```typescript
   // ❌ Bad - invalidates too much
   await clearCache();

   // ✅ Good - targeted invalidation
   await CacheInvalidation.invalidateByTag('specific-feature');
   ```

5. **Don't Use Overly Long TTLs**
   ```typescript
   // ❌ Bad
   ttl: 24 * 60 * 60 * 1000 // 24 hours for frequently updated data

   // ✅ Good
   ttl: CACHE_TTL.MEDIUM // 5 minutes for frequently updated data
   ```

## Testing Cache Invalidation

### Manual Testing

```bash
# 1. Make GET request (should be MISS)
curl -i http://localhost:3000/api/scenarios
# X-Cache: MISS

# 2. Make same GET request (should be HIT)
curl -i http://localhost:3000/api/scenarios
# X-Cache: HIT

# 3. Update data
curl -X PUT http://localhost:3000/api/scenarios/123 -d '{...}'

# 4. Make GET request again (should be MISS after invalidation)
curl -i http://localhost:3000/api/scenarios
# X-Cache: MISS
```

### Automated Testing

```typescript
describe('Cache Invalidation', () => {
  it('should invalidate cache on update', async () => {
    // Get data (cache miss)
    const res1 = await fetch('/api/scenarios');
    expect(res1.headers.get('X-Cache')).toBe('MISS');

    // Get data again (cache hit)
    const res2 = await fetch('/api/scenarios');
    expect(res2.headers.get('X-Cache')).toBe('HIT');

    // Update data
    await fetch('/api/scenarios/123', { method: 'PUT', body: '{...}' });

    // Get data again (cache miss after invalidation)
    const res3 = await fetch('/api/scenarios');
    expect(res3.headers.get('X-Cache')).toBe('MISS');
  });
});
```

## Monitoring

### Cache Hit Rate

```typescript
import { getCacheStats } from '@/lib/cache';

const stats = getCacheStats();
console.log('Cache size:', stats.size);
console.log('Max size:', stats.maxSize);
console.log('Hit rate:', stats.hitRate);
```

### Performance Tracking

```typescript
import { logPerformanceMetric } from '@/lib/performance';

// Automatically logged by withCache
// Check logs for:
// - api_cache_hit (fast, from cache)
// - api_cache_miss (slower, from database)
```

## Summary

### Quick Reference

| Operation | Method | Example |
|-----------|--------|---------|
| Cache GET endpoint | `withCache(handler, config)` | `withCache(GET, {...})` |
| Invalidate by ID | `CacheInvalidation.invalidateScenario(id)` | `invalidateScenario('123')` |
| Invalidate by tag | `CacheInvalidation.invalidateByTag(tag)` | `invalidateByTag('dashboard')` |
| Invalidate pattern | `deleteCachePattern(pattern)` | `deleteCachePattern('user:')` |
| Skip cache | `skipIf: (req) => condition` | `skipIf: (req) => req.url.includes('fresh')` |

### TTL Guidelines

- Real-time: `CACHE_TTL.SHORT` (1 min)
- Frequent updates: `CACHE_TTL.MEDIUM` (5 min)
- Moderate updates: `CACHE_TTL.LONG` (30 min)
- Stable data: `CACHE_TTL.VERY_LONG` (1 hour)
- Static data: `CACHE_TTL.DAY` (24 hours)

### Invalidation Patterns

1. **Immediate**: Invalidate right after update
2. **Cascading**: Invalidate related caches
3. **Tag-based**: Invalidate by feature/resource
4. **Time-based**: Let TTL expire naturally

---

**See Also:**
- `src/lib/api-cache.ts` - Cache middleware implementation
- `src/lib/cache.ts` - Core caching layer
- `src/app/api/v1/cache-example/route.ts` - Example usage
