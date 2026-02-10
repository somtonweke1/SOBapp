/**
 * Automated Ownership Discovery Pipeline
 * Integrates all ownership data sources:
 * - Manual research (165 relationships)
 * - OpenCorporates API (automatic discovery)
 * - SEC EDGAR (US subsidiaries)
 * - Entity enrichment (better matching)
 * - Multi-level graph analysis
 */

import { getBISScraper, BISEntityFull } from './bis-scraper-service';
import { BIS_OWNERSHIP_DATABASE } from '../data/bis-ownership-database';
import { getOpenCorporatesAPI } from './opencorporates-api-service';
import { getSECEdgar } from './sec-edgar-service';
import { getEntityEnrichment, EnrichedEntity } from './entity-enrichment-service';
import { getOwnershipGraph, OwnershipEdge, OwnershipPath } from './ownership-graph-service';
import * as fs from 'fs';
import * as path from 'path';

export interface OwnershipDiscoveryResult {
  totalRelationships: number;
  sourceBreakdown: {
    manual: number;
    openCorporates: number;
    secEdgar: number;
    inferred: number;
  };
  coverageStats: {
    entitiesWithOwnership: number;
    totalEntities: number;
    coveragePercent: number;
  };
  enrichedEntities: EnrichedEntity[];
  relationshipGraph: OwnershipEdge[];
  lastUpdated: string;
}

export class AutomatedOwnershipPipeline {
  private cacheDir: string;
  private relationshipsCacheFile: string;
  private enrichedEntitiesCacheFile: string;

  constructor() {
    this.cacheDir = path.join(process.cwd(), 'data', 'ownership-cache');
    this.relationshipsCacheFile = path.join(this.cacheDir, 'relationships.json');
    this.enrichedEntitiesCacheFile = path.join(this.cacheDir, 'enriched-entities.json');
    this.ensureCacheDir();
  }

  private ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Run full ownership discovery pipeline
   */
  public async runFullDiscovery(options?: {
    includeOpenCorporates?: boolean;
    includeSECEdgar?: boolean;
    maxEntitiesOpenCorporates?: number;
    maxEntitiesSEC?: number;
  }): Promise<OwnershipDiscoveryResult> {
    console.log('🚀 AUTOMATED OWNERSHIP DISCOVERY PIPELINE\n');
    console.log('='.repeat(70));

    const opts = {
      includeOpenCorporates: options?.includeOpenCorporates ?? false, // Disabled by default (rate limits)
      includeSECEdgar: options?.includeSECEdgar ?? true,
      maxEntitiesOpenCorporates: options?.maxEntitiesOpenCorporates ?? 50,
      maxEntitiesSEC: options?.maxEntitiesSEC ?? 100
    };

    // Step 1: Get all BIS entities
    console.log('\n📊 Step 1: Loading BIS entities...');
    const bisScraper = getBISScraper();
    const bisEntities = await bisScraper.fetchFullEntityList();
    console.log(`✅ Loaded ${bisEntities.length} BIS entities`);

    // Step 2: Enrich all entities
    console.log('\n📊 Step 2: Enriching entities with alternate names...');
    const enrichmentService = getEntityEnrichment();
    const enrichedEntities = enrichmentService.batchEnrich(bisEntities);
    console.log(`✅ Enriched ${enrichedEntities.length} entities`);

    // Save enriched entities to cache
    this.saveEnrichedEntities(enrichedEntities);

    // Step 3: Load manual relationships
    console.log('\n📊 Step 3: Loading manual research relationships...');
    const manualRelationships = this.loadManualRelationships();
    console.log(`✅ Loaded ${manualRelationships.length} manually researched relationships`);

    // Step 4: Discover via OpenCorporates (if enabled)
    let openCorporatesRelationships: OwnershipEdge[] = [];
    if (opts.includeOpenCorporates) {
      console.log('\n📊 Step 4: Discovering ownership via OpenCorporates...');
      openCorporatesRelationships = await this.discoverViaOpenCorporates(
        bisEntities.slice(0, opts.maxEntitiesOpenCorporates)
      );
      console.log(`✅ Discovered ${openCorporatesRelationships.length} relationships via OpenCorporates`);
    } else {
      console.log('\n⏭️  Step 4: Skipping OpenCorporates (disabled to avoid rate limits)');
    }

    // Step 5: Discover via SEC EDGAR (if enabled)
    let secRelationships: OwnershipEdge[] = [];
    if (opts.includeSECEdgar) {
      console.log('\n📊 Step 5: Discovering US subsidiaries via SEC EDGAR...');
      secRelationships = await this.discoverViaSECEdgar(
        bisEntities.slice(0, opts.maxEntitiesSEC)
      );
      console.log(`✅ Discovered ${secRelationships.length} US subsidiaries via SEC EDGAR`);
    } else {
      console.log('\n⏭️  Step 5: Skipping SEC EDGAR (disabled)');
    }

    // Step 6: Combine all relationships
    console.log('\n📊 Step 6: Combining all ownership data...');
    const allRelationships = [
      ...manualRelationships,
      ...openCorporatesRelationships,
      ...secRelationships
    ];

    // Deduplicate
    const deduplicated = this.deduplicateRelationships(allRelationships);
    console.log(`✅ Total relationships: ${deduplicated.length} (after deduplication)`);

    // Save to cache
    this.saveRelationships(deduplicated);

    // Step 7: Build ownership graph
    console.log('\n📊 Step 7: Building multi-level ownership graph...');
    const ownershipGraph = getOwnershipGraph();
    ownershipGraph.buildGraph(deduplicated, bisEntities);
    const graphStats = ownershipGraph.getGraphStats();
    console.log(`✅ Graph built: ${graphStats.totalNodes} nodes, ${graphStats.totalEdges} edges`);

    // Step 8: Calculate coverage statistics
    console.log('\n📊 Step 8: Calculating coverage statistics...');
    const coverageStats = this.calculateCoverage(deduplicated, bisEntities);

    // Prepare result
    const result: OwnershipDiscoveryResult = {
      totalRelationships: deduplicated.length,
      sourceBreakdown: {
        manual: manualRelationships.length,
        openCorporates: openCorporatesRelationships.length,
        secEdgar: secRelationships.length,
        inferred: 0 // Future: machine learning inferences
      },
      coverageStats,
      enrichedEntities,
      relationshipGraph: deduplicated,
      lastUpdated: new Date().toISOString()
    };

    // Print summary
    this.printSummary(result);

    return result;
  }

  /**
   * Load manual relationships from database
   */
  private loadManualRelationships(): OwnershipEdge[] {
    const relationships: OwnershipEdge[] = [];

    // Load subsidiaries
    for (const [parent, subs] of Object.entries(BIS_OWNERSHIP_DATABASE.subsidiaries)) {
      for (const subsidiary of subs) {
        relationships.push({
          from: subsidiary,
          to: parent,
          relationshipType: 'parent',
          confidence: 0.95, // High confidence - manually researched
          source: 'Manual Research',
          evidence: ['Manually researched and verified', 'BIS Ownership Database']
        });
      }
    }

    // Load affiliates
    for (const [entity, affiliates] of Object.entries(BIS_OWNERSHIP_DATABASE.affiliates)) {
      for (const affiliate of affiliates) {
        relationships.push({
          from: affiliate,
          to: entity,
          relationshipType: 'affiliate',
          confidence: 0.9, // High confidence - manually researched
          source: 'Manual Research',
          evidence: ['Manually researched affiliate relationship', 'BIS Ownership Database']
        });
      }
    }

    return relationships;
  }

  /**
   * Discover ownership via OpenCorporates
   */
  private async discoverViaOpenCorporates(entities: BISEntityFull[]): Promise<OwnershipEdge[]> {
    const openCorporatesAPI = getOpenCorporatesAPI();
    const relationships: OwnershipEdge[] = [];

    console.log(`   Querying OpenCorporates for ${entities.length} entities...`);

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];

      try {
        const discovered = await openCorporatesAPI.discoverOwnership(entity.name);

        // Convert OwnershipRelationship to OwnershipEdge
        const edges: OwnershipEdge[] = discovered.map(rel => ({
          from: rel.relationship === 'parent' ? rel.parent : rel.subsidiary,
          to: rel.relationship === 'parent' ? rel.subsidiary : rel.parent,
          relationshipType: rel.relationship,
          confidence: rel.confidence,
          source: rel.source,
          evidence: rel.evidence
        }));

        relationships.push(...edges);

        if ((i + 1) % 10 === 0) {
          console.log(`   Progress: ${i + 1}/${entities.length}`);
        }
      } catch (error) {
        console.error(`   ❌ Error discovering ${entity.name}:`, error);
      }
    }

    return relationships;
  }

  /**
   * Discover US subsidiaries via SEC EDGAR
   */
  private async discoverViaSECEdgar(entities: BISEntityFull[]): Promise<OwnershipEdge[]> {
    const secEdgar = getSECEdgar();
    const relationships: OwnershipEdge[] = [];

    // Focus on entities from countries with US subsidiaries
    const targetEntities = entities.filter(e =>
      ['China', 'Russia', 'Iran', 'North Korea'].includes(e.country)
    );

    console.log(`   Searching SEC EDGAR for ${targetEntities.length} foreign entities...`);

    for (let i = 0; i < targetEntities.length; i++) {
      const entity = targetEntities[i];

      try {
        const discovered = await secEdgar.findUSSubsidiaries(entity.name);
        relationships.push(...discovered);

        if ((i + 1) % 20 === 0) {
          console.log(`   Progress: ${i + 1}/${targetEntities.length}`);
        }
      } catch (error) {
        console.error(`   ❌ Error searching ${entity.name}:`, error);
      }
    }

    return relationships;
  }

  /**
   * Deduplicate relationships
   */
  private deduplicateRelationships(relationships: OwnershipEdge[]): OwnershipEdge[] {
    const seen = new Map<string, OwnershipEdge>();

    for (const rel of relationships) {
      const key = `${rel.from.toLowerCase()}-${rel.to.toLowerCase()}`;

      const existing = seen.get(key);
      if (!existing || rel.confidence > existing.confidence) {
        // Keep higher confidence version
        seen.set(key, rel);
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Calculate coverage statistics
   */
  private calculateCoverage(
    relationships: OwnershipEdge[],
    bisEntities: BISEntityFull[]
  ): OwnershipDiscoveryResult['coverageStats'] {
    const entitiesWithOwnership = new Set<string>();

    for (const rel of relationships) {
      entitiesWithOwnership.add(rel.from.toLowerCase());
      entitiesWithOwnership.add(rel.to.toLowerCase());
    }

    // Count how many BIS entities have ownership data
    let coveredEntities = 0;
    for (const entity of bisEntities) {
      if (entitiesWithOwnership.has(entity.name.toLowerCase())) {
        coveredEntities++;
      }
    }

    return {
      entitiesWithOwnership: coveredEntities,
      totalEntities: bisEntities.length,
      coveragePercent: (coveredEntities / bisEntities.length) * 100
    };
  }

  /**
   * Print summary
   */
  private printSummary(result: OwnershipDiscoveryResult) {
    console.log('\n' + '='.repeat(70));
    console.log('\n🎉 OWNERSHIP DISCOVERY COMPLETE\n');

    console.log('📊 Relationship Summary:');
    console.log(`   Total relationships: ${result.totalRelationships}`);
    console.log(`   - Manual research: ${result.sourceBreakdown.manual}`);
    console.log(`   - OpenCorporates: ${result.sourceBreakdown.openCorporates}`);
    console.log(`   - SEC EDGAR: ${result.sourceBreakdown.secEdgar}`);

    console.log('\n📈 Coverage Statistics:');
    console.log(`   Entities with ownership data: ${result.coverageStats.entitiesWithOwnership}`);
    console.log(`   Total BIS entities: ${result.coverageStats.totalEntities}`);
    console.log(`   Coverage: ${result.coverageStats.coveragePercent.toFixed(2)}%`);

    console.log('\n✨ Entity Enrichment:');
    console.log(`   Enriched entities: ${result.enrichedEntities.length}`);
    const totalNames = result.enrichedEntities.reduce((sum, e) => sum + e.enrichedNames.length, 0);
    console.log(`   Total name variations: ${totalNames}`);
    console.log(`   Average per entity: ${(totalNames / result.enrichedEntities.length).toFixed(1)}`);

    console.log('\n💾 Cache:');
    console.log(`   Relationships: ${this.relationshipsCacheFile}`);
    console.log(`   Enriched entities: ${this.enrichedEntitiesCacheFile}`);

    console.log('\n' + '='.repeat(70) + '\n');
  }

  /**
   * Save relationships to cache
   */
  private saveRelationships(relationships: OwnershipEdge[]) {
    fs.writeFileSync(
      this.relationshipsCacheFile,
      JSON.stringify({
        relationships,
        count: relationships.length,
        lastUpdated: new Date().toISOString()
      }, null, 2)
    );
  }

  /**
   * Save enriched entities to cache
   */
  private saveEnrichedEntities(entities: EnrichedEntity[]) {
    fs.writeFileSync(
      this.enrichedEntitiesCacheFile,
      JSON.stringify({
        entities,
        count: entities.length,
        lastUpdated: new Date().toISOString()
      }, null, 2)
    );
  }

  /**
   * Load cached relationships
   */
  public loadCachedRelationships(): OwnershipEdge[] {
    try {
      if (fs.existsSync(this.relationshipsCacheFile)) {
        const data = JSON.parse(fs.readFileSync(this.relationshipsCacheFile, 'utf-8'));
        return data.relationships || [];
      }
    } catch (error) {
      console.error('Error loading cached relationships:', error);
    }
    return [];
  }

  /**
   * Load cached enriched entities
   */
  public loadCachedEnrichedEntities(): EnrichedEntity[] {
    try {
      if (fs.existsSync(this.enrichedEntitiesCacheFile)) {
        const data = JSON.parse(fs.readFileSync(this.enrichedEntitiesCacheFile, 'utf-8'));
        return data.entities || [];
      }
    } catch (error) {
      console.error('Error loading cached enriched entities:', error);
    }
    return [];
  }
}

// Singleton
let pipelineInstance: AutomatedOwnershipPipeline | null = null;

export function getOwnershipPipeline(): AutomatedOwnershipPipeline {
  if (!pipelineInstance) {
    pipelineInstance = new AutomatedOwnershipPipeline();
  }
  return pipelineInstance;
}

export default AutomatedOwnershipPipeline;
