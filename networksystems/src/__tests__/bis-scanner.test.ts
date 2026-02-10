/**
 * BIS Entity List Scanner Tests
 * Tests core functionality of the compliance scanner
 */

import { describe, test, expect, beforeAll } from '@jest/globals';

describe('BIS Entity List Scanner', () => {
  describe('Ownership Database', () => {
    test('should load ownership database with correct count', async () => {
      const { BIS_OWNERSHIP_DATABASE } = await import('@/data/bis-ownership-database');

      expect(BIS_OWNERSHIP_DATABASE).toBeDefined();
      expect(BIS_OWNERSHIP_DATABASE.metadata.totalRelationships).toBeGreaterThan(0);
      expect(BIS_OWNERSHIP_DATABASE.subsidiaries).toBeDefined();
      expect(BIS_OWNERSHIP_DATABASE.affiliates).toBeDefined();
    });

    test('should have Huawei subsidiaries', async () => {
      const { BIS_OWNERSHIP_DATABASE } = await import('@/data/bis-ownership-database');

      const huawei = BIS_OWNERSHIP_DATABASE.subsidiaries['Huawei Technologies Co., Ltd.'];
      expect(huawei).toBeDefined();
      expect(huawei.length).toBeGreaterThan(10);
      expect(huawei).toContain('Huawei Device Co., Ltd.');
    });

    test('should have ZTE subsidiaries', async () => {
      const { BIS_OWNERSHIP_DATABASE } = await import('@/data/bis-ownership-database');

      const zte = BIS_OWNERSHIP_DATABASE.subsidiaries['ZTE Corporation'];
      expect(zte).toBeDefined();
      expect(zte.length).toBeGreaterThan(10);
    });

    test('should have updated metadata', async () => {
      const { BIS_OWNERSHIP_DATABASE } = await import('@/data/bis-ownership-database');

      expect(BIS_OWNERSHIP_DATABASE.metadata.lastUpdated).toBe('2025-11-08');
      expect(BIS_OWNERSHIP_DATABASE.metadata.lastVerified).toBe('2025-11-08');
      expect(BIS_OWNERSHIP_DATABASE.metadata.sources.length).toBeGreaterThan(5);
    });
  });

  describe('BIS Scraper Service', () => {
    test('should load BIS scraper service', async () => {
      const { getBISScraper } = await import('@/services/bis-scraper-service');

      const scraper = getBISScraper();
      expect(scraper).toBeDefined();
    });

    test('should fetch entity list', async () => {
      const { getBISScraper } = await import('@/services/bis-scraper-service');

      const scraper = getBISScraper();
      const entities = await scraper.fetchFullEntityList();

      expect(entities).toBeDefined();
      expect(Array.isArray(entities)).toBe(true);
      expect(entities.length).toBeGreaterThan(1000);
    }, 30000); // 30 second timeout for network request
  });

  describe('Ownership Lookup Service', () => {
    test('should load ownership lookup service', async () => {
      const { getOwnershipLookupService } = await import('@/services/ownership-lookup-service');

      const service = getOwnershipLookupService();
      expect(service).toBeDefined();
    });

    test('should detect Huawei subsidiary', async () => {
      const { getOwnershipLookupService } = await import('@/services/ownership-lookup-service');

      const service = getOwnershipLookupService();
      const ownership = await service.lookupOwnership('Huawei Device Co., Ltd.');

      expect(ownership.parents.length).toBeGreaterThan(0);
      expect(ownership.parents[0].companyName).toContain('Huawei');
    }, 10000);

    test('should return empty for unknown company', async () => {
      const { getOwnershipLookupService } = await import('@/services/ownership-lookup-service');

      const service = getOwnershipLookupService();
      const ownership = await service.lookupOwnership('Totally Unknown Company XYZ123');

      expect(ownership.parents.length).toBe(0);
    }, 10000);
  });

  describe('Email Service', () => {
    test('should load email service', async () => {
      const { getEmailService } = await import('@/services/email-service');

      const emailService = getEmailService();
      expect(emailService).toBeDefined();
    });

    test('should report enabled/disabled status', async () => {
      const { getEmailService } = await import('@/services/email-service');

      const emailService = getEmailService();
      const enabled = emailService.isEnabled();

      // Will be false if SMTP credentials not configured
      expect(typeof enabled).toBe('boolean');
    });
  });

  describe('Error Monitoring Service', () => {
    test('should load error monitoring service', async () => {
      const { getErrorMonitoring } = await import('@/services/error-monitoring-service');

      const errorService = getErrorMonitoring();
      expect(errorService).toBeDefined();
    });

    test('should log errors', async () => {
      const { getErrorMonitoring, ErrorSeverity, ErrorCategory } = await import('@/services/error-monitoring-service');

      const errorService = getErrorMonitoring();
      errorService.clearErrors();

      const error = new Error('Test error');
      errorService.logError(error, ErrorSeverity.LOW, ErrorCategory.UNKNOWN_ERROR);

      const stats = errorService.getStatistics();
      expect(stats.total).toBeGreaterThan(0);
    });

    test('should categorize errors', async () => {
      const { getErrorMonitoring, ErrorSeverity, ErrorCategory } = await import('@/services/error-monitoring-service');

      const errorService = getErrorMonitoring();
      errorService.clearErrors();

      errorService.logAPIError(new Error('API test'), 'TestAPI');
      errorService.logDatabaseError(new Error('DB test'), 'query');

      const apiErrors = errorService.getErrorsByCategory(ErrorCategory.API_ERROR);
      const dbErrors = errorService.getErrorsByCategory(ErrorCategory.DATABASE_ERROR);

      expect(apiErrors.length).toBe(1);
      expect(dbErrors.length).toBe(1);
    });
  });

  describe('OpenCorporates API Service', () => {
    test('should load OpenCorporates service', async () => {
      const { getOpenCorporatesAPI } = await import('@/services/opencorporates-api-service');

      const service = getOpenCorporatesAPI();
      expect(service).toBeDefined();
    });

    // Skip live API tests unless explicitly enabled
    test.skip('should search for company', async () => {
      const { getOpenCorporatesAPI } = await import('@/services/opencorporates-api-service');

      const service = getOpenCorporatesAPI();
      const results = await service.searchCompanies('Apple Inc');

      expect(Array.isArray(results)).toBe(true);
    }, 10000);
  });
});

describe('Integration Tests', () => {
  test('should detect high-risk supplier (Huawei)', async () => {
    const { getAdvancedEntityResolution } = await import('@/services/advanced-entity-resolution');

    const resolver = getAdvancedEntityResolution();
    const result = await resolver.resolveEntity('Huawei Technologies Co., Ltd.');

    expect(result.overallRisk).toBe('critical');
    expect(result.riskScore).toBeGreaterThan(8);
    expect(result.resolvedEntities.length).toBeGreaterThan(0);
  }, 30000);

  test('should detect subsidiary (Huawei Device)', async () => {
    const { getAdvancedEntityResolution } = await import('@/services/advanced-entity-resolution');

    const resolver = getAdvancedEntityResolution();
    const result = await resolver.resolveEntity('Huawei Device Co., Ltd.');

    expect(result.overallRisk).toMatch(/high|critical/);
    expect(result.findings.length).toBeGreaterThan(0);
  }, 30000);

  test('should clear safe supplier', async () => {
    const { getAdvancedEntityResolution } = await import('@/services/advanced-entity-resolution');

    const resolver = getAdvancedEntityResolution();
    const result = await resolver.resolveEntity('Apple Inc.');

    expect(result.overallRisk).toMatch(/clear|low/);
    expect(result.riskScore).toBeLessThan(3);
  }, 30000);
});
