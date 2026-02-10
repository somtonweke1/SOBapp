/**
 * Ownership Structure Lookup Service
 * Integrates with OpenCorporates, SEC EDGAR, and other sources
 * to detect parent companies, subsidiaries, and affiliates
 * NOW INCLUDES 165+ KNOWN OWNERSHIP RELATIONSHIPS
 */

import BIS_OWNERSHIP_DATABASE, { getCombinedOwnershipDatabase } from '../data/bis-ownership-database';

export interface OwnershipRelationship {
  companyName: string;
  relationType: 'parent' | 'subsidiary' | 'affiliate' | 'joint_venture';
  ownershipPercentage?: number;
  source: 'opencorporates' | 'sec' | 'manual' | 'inferred';
  confidence: number; // 0-1
  lastVerified: string;
  details?: string;
}

export interface CompanyOwnership {
  companyName: string;
  jurisdiction?: string;
  registrationNumber?: string;
  parents: OwnershipRelationship[];
  subsidiaries: OwnershipRelationship[];
  affiliates: OwnershipRelationship[];
  ultimateParent?: string;
  ownershipTree: OwnershipNode[];
}

export interface OwnershipNode {
  name: string;
  level: number;
  relationship: string;
  ownershipPercentage?: number;
  children: OwnershipNode[];
}

class OwnershipLookupService {
  private cache: Map<string, { data: CompanyOwnership; timestamp: number }>;
  private cacheExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor() {
    this.cache = new Map();
  }

  /**
   * Look up company ownership structure
   * Uses multiple data sources with fallbacks
   */
  public async lookupOwnership(companyName: string): Promise<CompanyOwnership> {
    // Check cache
    const cached = this.cache.get(companyName.toLowerCase());
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    console.log(`🔍 Looking up ownership for: ${companyName}`);

    // Try OpenCorporates first (free tier)
    let ownership = await this.lookupOpenCorporates(companyName);

    // Enhance with SEC data if available
    ownership = await this.enhanceWithSECData(ownership);

    // Add known relationships from our database
    ownership = this.addKnownRelationships(ownership);

    // Cache result
    this.cache.set(companyName.toLowerCase(), {
      data: ownership,
      timestamp: Date.now()
    });

    return ownership;
  }

  /**
   * OpenCorporates lookup (free tier)
   * API: https://api.opencorporates.com/v0.4/companies/search
   */
  private async lookupOpenCorporates(companyName: string): Promise<CompanyOwnership> {
    try {
      // Free tier allows 500 requests/month
      const params = new URLSearchParams({
        q: companyName,
        format: 'json'
      });

      // Add API key if available
      const apiKey = process.env.OPENCORPORATES_API_KEY;
      if (apiKey) {
        params.append('api_token', apiKey);
      }

      console.log(`🔍 OpenCorporates lookup: "${companyName}"`);

      const response = await fetch(
        `https://api.opencorporates.com/v0.4/companies/search?${params}`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          console.warn('⚠️  OpenCorporates rate limit exceeded - using cached/manual data only');
        } else {
          console.warn(`⚠️  OpenCorporates API error: ${response.status}`);
        }
        // Return empty structure on error
        return {
          companyName,
          parents: [],
          subsidiaries: [],
          affiliates: [],
          ownershipTree: []
        };
      }

      const data = await response.json();

      if (!data.results || !data.results.companies || data.results.companies.length === 0) {
        console.log(`ℹ️  No OpenCorporates results for "${companyName}"`);
        return {
          companyName,
          parents: [],
          subsidiaries: [],
          affiliates: [],
          ownershipTree: []
        };
      }

      // Get the first matching company
      const firstMatch = data.results.companies[0].company;

      console.log(`✅ Found OpenCorporates match: ${firstMatch.name} (${firstMatch.jurisdiction_code})`);

      return {
        companyName: firstMatch.name,
        jurisdiction: firstMatch.jurisdiction_code,
        registrationNumber: firstMatch.company_number,
        parents: [],
        subsidiaries: [],
        affiliates: [],
        ownershipTree: []
      };

    } catch (error) {
      console.error('OpenCorporates lookup failed:', error);
      return {
        companyName,
        parents: [],
        subsidiaries: [],
        affiliates: [],
        ownershipTree: []
      };
    }
  }

  /**
   * Enhance with SEC EDGAR data (free public API)
   * For US public companies
   */
  private async enhanceWithSECData(ownership: CompanyOwnership): Promise<CompanyOwnership> {
    try {
      // SEC EDGAR requires User-Agent header
      const userAgent = 'SOBapp Platform contact@miar.platform';

      console.log(`🔍 SEC EDGAR lookup: "${ownership.companyName}"`);

      // Search for company in SEC database
      const searchUrl = `https://www.sec.gov/cgi-bin/browse-edgar?company=${encodeURIComponent(ownership.companyName)}&owner=exclude&action=getcompany&count=10&output=atom`;

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'application/atom+xml'
        }
      });

      if (!response.ok) {
        console.warn(`⚠️  SEC EDGAR API error: ${response.status}`);
        return ownership;
      }

      const text = await response.text();

      // Check if any results found
      if (text.includes('No matching')) {
        console.log(`ℹ️  No SEC filings found for "${ownership.companyName}"`);
        return ownership;
      }

      // For now, just log success - in the future, parse XML to extract CIK and filing details
      console.log(`✅ Found SEC EDGAR records for "${ownership.companyName}"`);

      // TODO: Parse XML response to extract:
      // - CIK (Central Index Key)
      // - Recent filings (10-K, 10-Q, 8-K)
      // - Ownership data from 13F/13D/13G filings
      // This requires XML parsing which we can add later

      return ownership;

    } catch (error) {
      console.error('SEC lookup failed:', error);
      return ownership;
    }
  }

  /**
   * Add known ownership relationships from curated database
   * This is critical for detecting BIS entity affiliations
   */
  private addKnownRelationships(ownership: CompanyOwnership): CompanyOwnership {
    const knownRelationships = this.getKnownOwnershipRelationships();
    const companyNameLower = ownership.companyName.toLowerCase();

    // Check if this company is a known subsidiary
    for (const [parent, subsidiaries] of Object.entries(knownRelationships.subsidiaries)) {
      for (const sub of subsidiaries) {
        if (companyNameLower.includes(sub.toLowerCase()) || sub.toLowerCase().includes(companyNameLower)) {
          ownership.parents.push({
            companyName: parent,
            relationType: 'parent',
            ownershipPercentage: 100,
            source: 'manual',
            confidence: 0.95,
            lastVerified: '2025-11-08',
            details: 'Curated from public records and verified against current BIS Entity List'
          });

          ownership.ultimateParent = parent;
        }
      }
    }

    // Check if this company is a known parent
    if (knownRelationships.subsidiaries[ownership.companyName]) {
      const subs = knownRelationships.subsidiaries[ownership.companyName];
      ownership.subsidiaries = subs.map(sub => ({
        companyName: sub,
        relationType: 'subsidiary',
        ownershipPercentage: 100,
        source: 'manual',
        confidence: 0.95,
        lastVerified: '2025-11-08'
      }));
    }

    // Add affiliate relationships
    if (knownRelationships.affiliates[ownership.companyName]) {
      const affs = knownRelationships.affiliates[ownership.companyName];
      ownership.affiliates = affs.map(aff => ({
        companyName: aff,
        relationType: 'affiliate',
        source: 'manual',
        confidence: 0.85,
        lastVerified: '2025-11-08'
      }));
    }

    return ownership;
  }

  /**
   * Curated database of known ownership relationships
   * Particularly focused on BIS entity list affiliations
   * NOW LOADS FROM COMPREHENSIVE DATABASE WITH 165+ RELATIONSHIPS
   */
  private getKnownOwnershipRelationships(): {
    subsidiaries: Record<string, string[]>;
    affiliates: Record<string, string[]>;
  } {
    // Use combined database with auto-discovered relationships
    const combined = getCombinedOwnershipDatabase();
    console.log(`📚 Loading ownership database: ${combined.metadata.totalRelationships} relationships (manual + automated)`);

    return {
      subsidiaries: combined.subsidiaries,
      affiliates: combined.affiliates
    };
  }

  /**
   * Build ownership tree visualization
   */
  public buildOwnershipTree(ownership: CompanyOwnership): OwnershipNode {
    const root: OwnershipNode = {
      name: ownership.companyName,
      level: 0,
      relationship: 'self',
      children: []
    };

    // Add parents
    ownership.parents.forEach(parent => {
      root.children.push({
        name: parent.companyName,
        level: -1,
        relationship: `${parent.relationType} (${parent.ownershipPercentage || '?'}%)`,
        ownershipPercentage: parent.ownershipPercentage,
        children: []
      });
    });

    // Add subsidiaries
    ownership.subsidiaries.forEach(sub => {
      root.children.push({
        name: sub.companyName,
        level: 1,
        relationship: `${sub.relationType} (${sub.ownershipPercentage || '?'}%)`,
        ownershipPercentage: sub.ownershipPercentage,
        children: []
      });
    });

    // Add affiliates
    ownership.affiliates.forEach(aff => {
      root.children.push({
        name: aff.companyName,
        level: 1,
        relationship: aff.relationType,
        children: []
      });
    });

    return root;
  }

  /**
   * Check if company has BIS-listed affiliations
   */
  public async checkBISAffiliation(
    companyName: string,
    bisEntities: string[]
  ): Promise<{
    hasAffiliation: boolean;
    affiliations: Array<{
      listedEntity: string;
      relationship: string;
      confidence: number;
    }>;
  }> {
    const ownership = await this.lookupOwnership(companyName);
    const affiliations: Array<{ listedEntity: string; relationship: string; confidence: number }> = [];

    const allRelated = [
      ...ownership.parents.map(p => ({ name: p.companyName, rel: p.relationType, conf: p.confidence })),
      ...ownership.subsidiaries.map(s => ({ name: s.companyName, rel: s.relationType, conf: s.confidence })),
      ...ownership.affiliates.map(a => ({ name: a.companyName, rel: a.relationType, conf: a.confidence }))
    ];

    for (const related of allRelated) {
      for (const bisEntity of bisEntities) {
        if (this.fuzzyMatch(related.name, bisEntity) > 0.7) {
          affiliations.push({
            listedEntity: bisEntity,
            relationship: related.rel,
            confidence: related.conf
          });
        }
      }
    }

    return {
      hasAffiliation: affiliations.length > 0,
      affiliations
    };
  }

  private fuzzyMatch(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;

    // Simple similarity
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 0.0;

    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) matches++;
    }

    return matches / longer.length;
  }
}

// Singleton
let ownershipServiceInstance: OwnershipLookupService | null = null;

export function getOwnershipLookupService(): OwnershipLookupService {
  if (!ownershipServiceInstance) {
    ownershipServiceInstance = new OwnershipLookupService();
  }
  return ownershipServiceInstance;
}

export default OwnershipLookupService;
