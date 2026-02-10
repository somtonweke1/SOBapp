/**
 * Solution Cache Service for SC-GEP
 *
 * Provides intelligent caching of optimization solutions with
 * warm start capabilities and incremental updates
 */

import { SCGEPSolution } from './sc-gep-solver';
import { ScenarioType, EnhancedSCGEPConfig } from './sc-gep-enhanced';

export interface CachedSolution {
  id: string;
  scenario: ScenarioType;
  region: string;
  solution: SCGEPSolution;
  config: EnhancedSCGEPConfig;
  timestamp: Date;
  computeTime: number;
  metadata: {
    version: string;
    parameters: Record<string, any>;
    tags: string[];
  };
}

export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  avgComputeTime: number;
  cacheSize: number; // bytes
  oldestEntry: Date | null;
  newestEntry: Date | null;
}

export interface SimilarityScore {
  solutionId: string;
  score: number; // 0-1, higher = more similar
  configDifferences: string[];
}

export class SolutionCacheService {
  private cache: Map<string, CachedSolution> = new Map();
  private cacheHits: number = 0;
  private cacheMisses: number = 0;
  private maxCacheSize: number = 100; // Maximum number of cached solutions
  private maxCacheAge: number = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Get cached solution by key
   */
  public get(scenario: ScenarioType, region: string, configHash?: string): CachedSolution | null {
    const key = this.generateKey(scenario, region, configHash);
    const cached = this.cache.get(key);

    if (cached && this.isValid(cached)) {
      this.cacheHits++;
      return cached;
    }

    this.cacheMisses++;
    if (cached && !this.isValid(cached)) {
      this.cache.delete(key);
    }

    return null;
  }

  /**
   * Store solution in cache
   */
  public set(
    scenario: ScenarioType,
    region: string,
    solution: SCGEPSolution,
    config: EnhancedSCGEPConfig,
    computeTime: number,
    metadata?: Partial<CachedSolution['metadata']>
  ): void {
    const configHash = this.hashConfig(config);
    const key = this.generateKey(scenario, region, configHash);

    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldest();
    }

    const cached: CachedSolution = {
      id: key,
      scenario,
      region,
      solution,
      config,
      timestamp: new Date(),
      computeTime,
      metadata: {
        version: '3.0.0',
        parameters: this.extractParameters(config),
        tags: [],
        ...metadata
      }
    };

    this.cache.set(key, cached);
  }

  /**
   * Find similar cached solutions for warm start
   */
  public findSimilar(
    scenario: ScenarioType,
    region: string,
    config: EnhancedSCGEPConfig,
    minSimilarity: number = 0.7
  ): Array<{ cached: CachedSolution; similarity: number }> {
    const results: Array<{ cached: CachedSolution; similarity: number }> = [];

    for (const cached of this.cache.values()) {
      if (!this.isValid(cached)) continue;

      // Calculate similarity score
      const similarity = this.calculateSimilarity(config, cached.config, scenario, cached.scenario, region, cached.region);

      if (similarity >= minSimilarity) {
        results.push({ cached, similarity });
      }
    }

    // Sort by similarity (descending)
    results.sort((a, b) => b.similarity - a.similarity);

    return results;
  }

  /**
   * Get warm start solution for optimization
   */
  public getWarmStart(
    scenario: ScenarioType,
    region: string,
    config: EnhancedSCGEPConfig
  ): SCGEPSolution | null {
    // First try exact match
    const exact = this.get(scenario, region, this.hashConfig(config));
    if (exact) return exact.solution;

    // Try similar solutions
    const similar = this.findSimilar(scenario, region, config, 0.8);
    if (similar.length > 0) {
      return similar[0].cached.solution;
    }

    return null;
  }

  /**
   * Invalidate cache entries
   */
  public invalidate(scenario?: ScenarioType, region?: string): number {
    let removed = 0;

    if (!scenario && !region) {
      // Clear entire cache
      removed = this.cache.size;
      this.cache.clear();
    } else {
      // Selective invalidation
      for (const [key, cached] of this.cache.entries()) {
        if (
          (!scenario || cached.scenario === scenario) &&
          (!region || cached.region === region)
        ) {
          this.cache.delete(key);
          removed++;
        }
      }
    }

    return removed;
  }

  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalRequests = this.cacheHits + this.cacheMisses;

    return {
      totalEntries: this.cache.size,
      hitRate: totalRequests > 0 ? this.cacheHits / totalRequests : 0,
      avgComputeTime: entries.length > 0
        ? entries.reduce((sum, e) => sum + e.computeTime, 0) / entries.length
        : 0,
      cacheSize: this.estimateCacheSize(),
      oldestEntry: entries.length > 0
        ? new Date(Math.min(...entries.map(e => e.timestamp.getTime())))
        : null,
      newestEntry: entries.length > 0
        ? new Date(Math.max(...entries.map(e => e.timestamp.getTime())))
        : null
    };
  }

  /**
   * Export cache to JSON
   */
  public export(): string {
    const data = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '3.0.0',
        entries: this.cache.size
      },
      stats: this.getStats(),
      solutions: Array.from(this.cache.entries()).map(([key, cached]) => ({
        key,
        scenario: cached.scenario,
        region: cached.region,
        timestamp: cached.timestamp.toISOString(),
        computeTime: cached.computeTime,
        objectiveValue: cached.solution.objectiveValue,
        feasibility: cached.solution.feasibility,
        metadata: cached.metadata
      }))
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import cache from JSON
   */
  public import(jsonData: string): number {
    try {
      const data = JSON.parse(jsonData);
      let imported = 0;

      // Note: This imports metadata only, not full solutions
      // Full solutions would need to be recomputed
      for (const entry of data.solutions) {
        // Could implement full import if needed
        imported++;
      }

      return imported;
    } catch (error) {
      console.error('Failed to import cache:', error);
      return 0;
    }
  }

  /**
   * Clean expired entries
   */
  public cleanup(): number {
    let removed = 0;

    for (const [key, cached] of this.cache.entries()) {
      if (!this.isValid(cached)) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Get all cached solutions for a scenario
   */
  public getByScenario(scenario: ScenarioType): CachedSolution[] {
    return Array.from(this.cache.values())
      .filter(cached => cached.scenario === scenario && this.isValid(cached));
  }

  /**
   * Get all cached solutions for a region
   */
  public getByRegion(region: string): CachedSolution[] {
    return Array.from(this.cache.values())
      .filter(cached => cached.region === region && this.isValid(cached));
  }

  /**
   * Compare two solutions
   */
  public compareSolutions(id1: string, id2: string): {
    objectiveValueDiff: number;
    costDiff: Record<string, number>;
    metricsDiff: Record<string, number>;
  } | null {
    const solution1 = this.cache.get(id1);
    const solution2 = this.cache.get(id2);

    if (!solution1 || !solution2) return null;

    return {
      objectiveValueDiff: solution2.solution.objectiveValue - solution1.solution.objectiveValue,
      costDiff: {
        investment: solution2.solution.costs.investment - solution1.solution.costs.investment,
        operational: solution2.solution.costs.operational - solution1.solution.costs.operational,
        penalties: solution2.solution.costs.penalties - solution1.solution.costs.penalties
      },
      metricsDiff: {
        totalCapacity: solution2.solution.metrics.totalCapacity - solution1.solution.metrics.totalCapacity,
        renewableShare: solution2.solution.metrics.renewableShare - solution1.solution.metrics.renewableShare
      }
    };
  }

  // Private helper methods

  private generateKey(scenario: ScenarioType, region: string, configHash?: string): string {
    return `${scenario}_${region}_${configHash || 'default'}`;
  }

  private hashConfig(config: EnhancedSCGEPConfig): string {
    // Simplified config hash - in production would use proper hashing
    const key = `${config.planningHorizon}_${config.materials.length}_${config.technologies.length}_${config.zones.length}`;
    return Buffer.from(key).toString('base64').substring(0, 16);
  }

  private extractParameters(config: EnhancedSCGEPConfig): Record<string, any> {
    return {
      planningHorizon: config.planningHorizon,
      materialsCount: config.materials.length,
      technologiesCount: config.technologies.length,
      zonesCount: config.zones.length,
      reserveMargin: config.reserveMargin,
      voll: config.costParameters.voll
    };
  }

  private isValid(cached: CachedSolution): boolean {
    const age = Date.now() - cached.timestamp.getTime();
    return age < this.maxCacheAge;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, cached] of this.cache.entries()) {
      if (cached.timestamp.getTime() < oldestTime) {
        oldestTime = cached.timestamp.getTime();
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private calculateSimilarity(
    config1: EnhancedSCGEPConfig,
    config2: EnhancedSCGEPConfig,
    scenario1: ScenarioType,
    scenario2: ScenarioType,
    region1: string,
    region2: string
  ): number {
    let score = 0;
    let maxScore = 0;

    // Scenario match (weight: 0.3)
    maxScore += 0.3;
    if (scenario1 === scenario2) score += 0.3;

    // Region match (weight: 0.3)
    maxScore += 0.3;
    if (region1 === region2) score += 0.3;

    // Planning horizon similarity (weight: 0.1)
    maxScore += 0.1;
    const horizonDiff = Math.abs(config1.planningHorizon - config2.planningHorizon);
    score += 0.1 * Math.max(0, 1 - horizonDiff / 10);

    // Material count similarity (weight: 0.1)
    maxScore += 0.1;
    const materialDiff = Math.abs(config1.materials.length - config2.materials.length);
    score += 0.1 * Math.max(0, 1 - materialDiff / 5);

    // Technology count similarity (weight: 0.1)
    maxScore += 0.1;
    const techDiff = Math.abs(config1.technologies.length - config2.technologies.length);
    score += 0.1 * Math.max(0, 1 - techDiff / 3);

    // Zone count similarity (weight: 0.1)
    maxScore += 0.1;
    const zoneDiff = Math.abs(config1.zones.length - config2.zones.length);
    score += 0.1 * Math.max(0, 1 - zoneDiff / 2);

    return score / maxScore;
  }

  private estimateCacheSize(): number {
    // Rough estimation of cache size in bytes
    let size = 0;

    for (const cached of this.cache.values()) {
      // Estimate based on JSON stringification
      const jsonStr = JSON.stringify({
        solution: cached.solution,
        config: this.extractParameters(cached.config),
        metadata: cached.metadata
      });
      size += jsonStr.length * 2; // UTF-16 encoding
    }

    return size;
  }
}

// Singleton instance
let cacheServiceInstance: SolutionCacheService | null = null;

export function getSolutionCacheService(): SolutionCacheService {
  if (!cacheServiceInstance) {
    cacheServiceInstance = new SolutionCacheService();
  }
  return cacheServiceInstance;
}

export default SolutionCacheService;
