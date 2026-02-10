import {
  checkRateLimit,
  resetRateLimit,
  getRemainingPoints,
  getRateLimitHeaders,
  checkIPRateLimit,
} from '../rate-limit';

describe('Rate Limiting', () => {
  beforeEach(async () => {
    // Reset rate limits before each test
    await resetRateLimit('test-user', 'api');
    await resetRateLimit('test-user', 'auth');
    await resetRateLimit('test-user', 'export');
    await resetRateLimit('test-user', 'ml');
    await resetRateLimit('test-ip', 'api');
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', async () => {
      const result = await checkRateLimit('test-user-allow', 'api', 'free');

      expect(result.success).toBe(true);
      expect(result.blocked).toBe(false);
      expect(result.remaining).toBeLessThanOrEqual(result.limit);
    });

    it('should block requests exceeding limit', async () => {
      // Make requests up to the limit (100 for api, but using free tier which is 50)
      for (let i = 0; i < 55; i++) {
        await checkRateLimit('test-user-limit', 'api', 'free');
      }

      // This should be blocked
      const result = await checkRateLimit('test-user-limit', 'api', 'free');

      expect(result.success).toBe(false);
      expect(result.blocked).toBe(true);
    });

    it('should apply different limits based on subscription', async () => {
      const freeResult = await checkRateLimit('free-user', 'api', 'free');
      const enterpriseResult = await checkRateLimit('enterprise-user', 'api', 'enterprise');

      expect(freeResult.limit).toBe(50); // Free tier
      expect(enterpriseResult.limit).toBe(1000); // Enterprise tier
    });

    it('should provide reset timestamp', async () => {
      const result = await checkRateLimit('test-user', 'api', 'free');

      expect(result.reset).toBeInstanceOf(Date);
      expect(result.reset.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('resetRateLimit', () => {
    it('should reset rate limit for a user', async () => {
      // Consume some requests
      await checkRateLimit('reset-user', 'api', 'free');
      await checkRateLimit('reset-user', 'api', 'free');
      await checkRateLimit('reset-user', 'api', 'free');

      // Reset
      await resetRateLimit('reset-user', 'api');

      // Check remaining points are restored
      const remaining = await getRemainingPoints('reset-user', 'api');
      expect(remaining).toBeGreaterThan(45); // Should be back to near limit
    });
  });

  describe('getRemainingPoints', () => {
    it('should return correct remaining points', async () => {
      await checkRateLimit('points-user', 'api', 'free');
      const remaining = await getRemainingPoints('points-user', 'api');

      expect(remaining).toBeLessThan(100);
      expect(remaining).toBeGreaterThan(0);
    });

    it('should return full limit for new user', async () => {
      const remaining = await getRemainingPoints('new-user', 'api');
      expect(remaining).toBeGreaterThan(50);
    });
  });

  describe('getRateLimitHeaders', () => {
    it('should return correct headers', () => {
      const result = {
        limit: 100,
        remaining: 50,
        reset: new Date(Date.now() + 60000), // 1 minute from now
      };

      const headers = getRateLimitHeaders(result);

      expect(headers['X-RateLimit-Limit']).toBe('100');
      expect(headers['X-RateLimit-Remaining']).toBe('50');
      expect(headers['X-RateLimit-Reset']).toBeTruthy();
      expect(headers['Retry-After']).toBeTruthy();
    });

    it('should calculate correct retry-after', () => {
      const resetTime = new Date(Date.now() + 120000); // 2 minutes from now
      const result = {
        limit: 100,
        remaining: 0,
        reset: resetTime,
      };

      const headers = getRateLimitHeaders(result);
      const retryAfter = parseInt(headers['Retry-After']);

      expect(retryAfter).toBeGreaterThan(110);
      expect(retryAfter).toBeLessThan(130);
    });
  });

  describe('checkIPRateLimit', () => {
    it('should allow requests within IP limit', async () => {
      const result = await checkIPRateLimit('192.168.1.1', 'api');

      expect(result.allowed).toBe(true);
      expect(result.retryAfter).toBeUndefined();
    });

    it('should block excessive requests from same IP', async () => {
      const ip = '192.168.1.2';

      // Make requests up to auth limit (5 attempts)
      for (let i = 0; i < 5; i++) {
        await checkIPRateLimit(ip, 'auth');
      }

      // This should be blocked
      const result = await checkIPRateLimit(ip, 'auth');

      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should have stricter limits for auth than api', async () => {
      // Auth should have lower limit
      const ip1 = '192.168.1.3';
      for (let i = 0; i < 5; i++) {
        await checkIPRateLimit(ip1, 'auth');
      }
      const authResult = await checkIPRateLimit(ip1, 'auth');

      // API should have higher limit
      const ip2 = '192.168.1.4';
      for (let i = 0; i < 5; i++) {
        await checkIPRateLimit(ip2, 'api');
      }
      const apiResult = await checkIPRateLimit(ip2, 'api');

      expect(authResult.allowed).toBe(false); // Auth blocked at 5
      expect(apiResult.allowed).toBe(true);   // API still allowed at 5
    });
  });

  describe('Different rate limit types', () => {
    it('should have separate counters for different types', async () => {
      const user = 'multi-type-user';

      // Use API limit
      await checkRateLimit(user, 'api', 'free');
      await checkRateLimit(user, 'api', 'free');

      // Use export limit
      await checkRateLimit(user, 'export', 'free');

      // Check they're independent
      const apiRemaining = await getRemainingPoints(user, 'api');
      const exportRemaining = await getRemainingPoints(user, 'export');

      expect(apiRemaining).toBeLessThan(100); // Used 2
      expect(exportRemaining).toBeLessThan(20); // Used 1, but different limit
    });

    it('should have appropriate limits for expensive operations', async () => {
      const mlResult = await checkRateLimit('ml-user', 'ml', 'free');
      const exportResult = await checkRateLimit('export-user', 'export', 'free');
      const apiResult = await checkRateLimit('api-user', 'api', 'free');

      // ML and export should have lower limits than regular API
      expect(mlResult.limit).toBeLessThan(apiResult.limit);
      expect(exportResult.limit).toBeLessThan(apiResult.limit);
    });
  });
});
