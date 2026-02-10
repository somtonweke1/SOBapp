/**
 * Entity Enrichment Service
 * Enhances BIS entities with additional data for better matching
 * - Alternate names and spellings
 * - Historical names
 * - Transliterations (Chinese, Russian, etc.)
 * - Common abbreviations
 * - Doing-business-as (DBA) names
 */

import type { BISEntityFull } from './bis-scraper-service';

export interface EnrichedEntity extends BISEntityFull {
  enrichedNames: string[]; // All name variations
  transliterations: string[]; // Chinese/Russian to English
  historicalNames: string[]; // Previous company names
  dbaNames: string[]; // Doing business as
  abbreviations: string[]; // Common abbreviations
  enrichmentSources: string[];
  enrichmentDate: string;
  matchingPatterns: string[]; // Regex patterns for matching
}

export class EntityEnrichmentService {
  /**
   * Enrich a BIS entity with additional name variations
   */
  public enrichEntity(entity: BISEntityFull): EnrichedEntity {
    const enrichedNames = new Set<string>();
    const transliterations = new Set<string>();
    const abbreviations = new Set<string>();
    const matchingPatterns = new Set<string>();
    const sources = new Set<string>();

    // Add original name
    enrichedNames.add(entity.name);

    // Add alternate names from BIS data
    if (entity.alternateNames) {
      entity.alternateNames.forEach(name => enrichedNames.add(name));
      sources.add('BIS Alternate Names');
    }

    // Generate name variations
    const nameVariations = this.generateNameVariations(entity.name);
    nameVariations.forEach(v => enrichedNames.add(v));
    sources.add('Name Variations');

    // Generate abbreviations
    const abbrevs = this.generateAbbreviations(entity.name);
    abbrevs.forEach(a => {
      abbreviations.add(a);
      enrichedNames.add(a);
    });
    if (abbrevs.length > 0) sources.add('Abbreviations');

    // Generate transliterations for non-Latin names
    if (this.hasNonLatinCharacters(entity.name)) {
      const translit = this.generateTransliterations(entity.name);
      translit.forEach(t => {
        transliterations.add(t);
        enrichedNames.add(t);
      });
      if (translit.length > 0) sources.add('Transliteration');
    }

    // Generate matching patterns
    const patterns = this.generateMatchingPatterns(entity.name);
    patterns.forEach(p => matchingPatterns.add(p));

    // Extract historical names from listing reason
    const historical = this.extractHistoricalNames(entity.listingReason || '');
    historical.forEach(h => enrichedNames.add(h));
    if (historical.length > 0) sources.add('Historical Names');

    return {
      ...entity,
      enrichedNames: Array.from(enrichedNames),
      transliterations: Array.from(transliterations),
      historicalNames: historical,
      dbaNames: [], // Would extract from additional sources
      abbreviations: Array.from(abbreviations),
      enrichmentSources: Array.from(sources),
      enrichmentDate: new Date().toISOString().split('T')[0],
      matchingPatterns: Array.from(matchingPatterns)
    };
  }

  /**
   * Generate name variations
   */
  private generateNameVariations(name: string): string[] {
    const variations: string[] = [];

    // Remove legal suffixes
    const withoutSuffix = name.replace(/\b(Ltd\.?|Limited|Inc\.?|Incorporated|Corp\.?|Corporation|LLC|L\.L\.C\.|Co\.?|Company)\b/gi, '').trim();
    if (withoutSuffix !== name) {
      variations.push(withoutSuffix);
    }

    // Add common suffix variations
    const baseName = withoutSuffix;
    variations.push(`${baseName} Ltd`);
    variations.push(`${baseName} Limited`);
    variations.push(`${baseName} Inc`);
    variations.push(`${baseName} Corporation`);
    variations.push(`${baseName} Co., Ltd.`);

    // Comma variations
    if (name.includes(',')) {
      variations.push(name.replace(/,/g, ''));
    } else {
      // Try adding comma before suffix
      const withComma = name.replace(/\s+(Ltd|Limited|Inc|Corp|Corporation|LLC|Co)\.?$/i, ', $1');
      if (withComma !== name) {
        variations.push(withComma);
      }
    }

    // Ampersand variations
    if (name.includes('&')) {
      variations.push(name.replace(/&/g, 'and'));
    }
    if (name.includes(' and ')) {
      variations.push(name.replace(/ and /g, ' & '));
    }

    // Period variations
    variations.push(name.replace(/\./g, ''));

    return variations.filter(v => v.length > 0 && v !== name);
  }

  /**
   * Generate abbreviations
   */
  private generateAbbreviations(name: string): string[] {
    const abbreviations: string[] = [];

    // Split into words
    const words = name.split(/\s+/).filter(w =>
      w.length > 0 &&
      !['the', 'of', 'and', 'for', 'ltd', 'inc', 'corp', 'llc', 'co'].includes(w.toLowerCase())
    );

    // Generate initialism (first letters)
    if (words.length >= 2) {
      const initialism = words.map(w => w[0]).join('').toUpperCase();
      abbreviations.push(initialism);

      // Add with periods
      const withPeriods = words.map(w => w[0].toUpperCase()).join('.');
      abbreviations.push(withPeriods);
    }

    // Common abbreviations
    const abbrevMap: { [key: string]: string } = {
      'Technologies': 'Tech',
      'Technology': 'Tech',
      'Corporation': 'Corp',
      'Incorporated': 'Inc',
      'Limited': 'Ltd',
      'Company': 'Co',
      'International': 'Intl',
      'Manufacturing': 'Mfg',
      'Industrial': 'Ind',
      'Systems': 'Sys',
      'Communications': 'Comm',
      'Electronic': 'Elec',
      'Semiconductor': 'Semi'
    };

    let abbrevName = name;
    for (const [full, abbrev] of Object.entries(abbrevMap)) {
      if (name.includes(full)) {
        abbrevName = abbrevName.replace(new RegExp(full, 'gi'), abbrev);
      }
    }

    if (abbrevName !== name) {
      abbreviations.push(abbrevName);
    }

    return abbreviations.filter(a => a.length > 1);
  }

  /**
   * Check if name contains non-Latin characters
   */
  private hasNonLatinCharacters(name: string): boolean {
    // Check for Chinese, Russian, Arabic, etc.
    return /[^\x00-\x7F]/.test(name);
  }

  /**
   * Generate transliterations
   */
  private generateTransliterations(name: string): string[] {
    // This is a placeholder - in production would use proper transliteration libraries
    // For Chinese: pinyin conversion
    // For Russian: Cyrillic to Latin
    // For Arabic: various romanization systems

    // Common Chinese company transliterations
    const chineseMap: { [key: string]: string[] } = {
      '华为': ['Huawei', 'Hua Wei'],
      '中兴': ['ZTE', 'Zhongxing', 'Zhong Xing'],
      '海康威视': ['Hikvision', 'Hikivision'],
      '大疆': ['DJI', 'Da Jiang']
    };

    // Common Russian transliterations
    const russianMap: { [key: string]: string[] } = {
      'Ростех': ['Rostec', 'Rostech', 'Rostekh']
    };

    const transliterations: string[] = [];

    // Check for known mappings
    for (const [original, variants] of Object.entries({ ...chineseMap, ...russianMap })) {
      if (name.includes(original)) {
        transliterations.push(...variants);
      }
    }

    return transliterations;
  }

  /**
   * Generate regex patterns for flexible matching
   */
  private generateMatchingPatterns(name: string): string[] {
    const patterns: string[] = [];

    // Escape special regex characters
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Flexible spacing
    const flexibleSpacing = escaped.replace(/\s+/g, '\\s*');
    patterns.push(flexibleSpacing);

    // Optional suffixes
    const baseName = name.replace(/\b(Ltd\.?|Limited|Inc\.?|Incorporated|Corp\.?|Corporation|LLC|Co\.?)\b.*$/i, '').trim();
    if (baseName !== name) {
      const escapedBase = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      patterns.push(`${escapedBase}\\s*(Ltd\\.?|Limited|Inc\\.?|Incorporated|Corp\\.?|Corporation|LLC|Co\\.?)?`);
    }

    return patterns;
  }

  /**
   * Extract historical names from listing reason
   */
  private extractHistoricalNames(listingReason: string): string[] {
    const historical: string[] = [];

    // Look for "formerly known as" patterns
    const formerlyRegex = /formerly known as\s+([^,\.;]+)/gi;
    let match;

    while ((match = formerlyRegex.exec(listingReason)) !== null) {
      const formerName = match[1].trim();
      if (formerName.length > 3) {
        historical.push(formerName);
      }
    }

    // Look for "a.k.a." patterns
    const akaRegex = /a\.k\.a\.?\s+([^,\.;]+)/gi;

    while ((match = akaRegex.exec(listingReason)) !== null) {
      const akaName = match[1].trim();
      if (akaName.length > 3) {
        historical.push(akaName);
      }
    }

    return historical;
  }

  /**
   * Batch enrich multiple entities
   */
  public batchEnrich(entities: BISEntityFull[]): EnrichedEntity[] {
    console.log(`🔬 Enriching ${entities.length} entities...`);

    const enriched = entities.map(entity => this.enrichEntity(entity));

    const totalNames = enriched.reduce((sum, e) => sum + e.enrichedNames.length, 0);
    const avgNames = (totalNames / enriched.length).toFixed(1);

    console.log(`✅ Enrichment complete:`);
    console.log(`   Total names: ${totalNames}`);
    console.log(`   Average per entity: ${avgNames}`);
    console.log(`   Transliterations: ${enriched.filter(e => e.transliterations.length > 0).length}`);

    return enriched;
  }

  /**
   * Match supplier name against enriched entity
   * Returns confidence score 0-1
   */
  public matchAgainstEnriched(
    supplierName: string,
    enrichedEntity: EnrichedEntity
  ): { matches: boolean; confidence: number; matchedName: string } {
    const normalizedSupplier = this.normalizeName(supplierName);

    // Check exact match
    if (this.normalizeName(enrichedEntity.name) === normalizedSupplier) {
      return { matches: true, confidence: 1.0, matchedName: enrichedEntity.name };
    }

    // Check enriched names
    for (const name of enrichedEntity.enrichedNames) {
      if (this.normalizeName(name) === normalizedSupplier) {
        return { matches: true, confidence: 0.95, matchedName: name };
      }
    }

    // Check partial matches
    for (const name of enrichedEntity.enrichedNames) {
      const normalized = this.normalizeName(name);
      if (normalizedSupplier.includes(normalized) || normalized.includes(normalizedSupplier)) {
        return { matches: true, confidence: 0.85, matchedName: name };
      }
    }

    // Check with regex patterns
    for (const pattern of enrichedEntity.matchingPatterns) {
      try {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(supplierName)) {
          return { matches: true, confidence: 0.75, matchedName: enrichedEntity.name };
        }
      } catch {
        // Invalid regex, skip
      }
    }

    return { matches: false, confidence: 0, matchedName: '' };
  }

  /**
   * Normalize name for matching
   */
  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[.,\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\b(ltd|limited|inc|incorporated|corp|corporation|llc|co|company)\b/gi, '')
      .trim();
  }
}

// Singleton
let enrichmentInstance: EntityEnrichmentService | null = null;

export function getEntityEnrichment(): EntityEnrichmentService {
  if (!enrichmentInstance) {
    enrichmentInstance = new EntityEnrichmentService();
  }
  return enrichmentInstance;
}

export default EntityEnrichmentService;
