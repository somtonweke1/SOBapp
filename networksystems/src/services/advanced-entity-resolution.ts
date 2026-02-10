/**
 * Advanced Entity Resolution Service
 * Combines BIS matching, ownership lookup, and multi-source verification
 * This is the "brain" that determines actual compliance risk
 */

import { getBISScraper, BISEntityFull } from './bis-scraper-service';
import { getOwnershipLookupService, CompanyOwnership } from './ownership-lookup-service';

export interface EntityResolutionResult {
  supplierName: string;
  resolvedEntities: ResolvedEntity[];
  overallRisk: 'clear' | 'low' | 'medium' | 'high' | 'critical';
  overallConfidence: number; // 0-1
  riskScore: number; // 0-10
  findings: Finding[];
  ownershipAnalysis?: CompanyOwnership;
  recommendedActions: string[];
  legalDisclaimer: string;
}

export interface ResolvedEntity {
  matchedName: string;
  matchType: 'direct' | 'parent' | 'subsidiary' | 'affiliate' | 'inferred';
  bisEntity: BISEntityFull;
  confidence: number;
  evidencePoints: string[];
  relationshipPath?: string[]; // e.g., ["Supplier X", "Parent Y", "BIS Entity Z"]
}

export interface Finding {
  severity: 'info' | 'warning' | 'critical';
  category: 'direct_match' | 'ownership' | 'geographic' | 'naming' | 'regulatory';
  description: string;
  evidence: string[];
  confidence: number;
  source: string;
}

class AdvancedEntityResolution {
  private bisScraper = getBISScraper();
  private ownershipService = getOwnershipLookupService();
  private bisEntities: BISEntityFull[] = [];

  constructor() {
    this.loadBISEntities();
  }

  private async loadBISEntities() {
    this.bisEntities = this.bisScraper.getCurrentList();
    if (this.bisEntities.length === 0) {
      this.bisEntities = await this.bisScraper.fetchFullEntityList();
    }
  }

  /**
   * Comprehensive entity resolution
   * This is the main entry point that does EVERYTHING
   */
  public async resolveEntity(supplierName: string): Promise<EntityResolutionResult> {
    console.log(`🔬 Advanced resolution for: ${supplierName}`);

    if (this.bisEntities.length === 0) {
      await this.loadBISEntities();
    }

    const findings: Finding[] = [];
    const resolvedEntities: ResolvedEntity[] = [];

    // Step 1: Direct BIS matching
    const directMatches = await this.findDirectMatches(supplierName);
    resolvedEntities.push(...directMatches.entities);
    findings.push(...directMatches.findings);

    // Step 2: Ownership structure analysis
    let ownershipAnalysis: CompanyOwnership | undefined;
    try {
      ownershipAnalysis = await this.ownershipService.lookupOwnership(supplierName);
      const ownershipMatches = await this.findOwnershipMatches(ownershipAnalysis);
      resolvedEntities.push(...ownershipMatches.entities);
      findings.push(...ownershipMatches.findings);
    } catch (error) {
      console.error('Ownership analysis failed:', error);
      findings.push({
        severity: 'warning',
        category: 'ownership',
        description: 'Unable to complete ownership structure analysis',
        evidence: ['Ownership lookup service temporarily unavailable'],
        confidence: 0.5,
        source: 'system'
      });
    }

    // Step 3: Geographic risk analysis
    const geoFindings = this.analyzeGeographicRisk(supplierName, resolvedEntities);
    findings.push(...geoFindings);

    // Step 4: Name similarity analysis (catches variations)
    const nameFindings = this.analyzeNameSimilarity(supplierName);
    findings.push(...nameFindings);

    // Step 5: Calculate overall risk
    const riskAssessment = this.calculateRisk(resolvedEntities, findings);

    // Step 6: Generate recommendations
    const recommendations = this.generateRecommendations(riskAssessment, resolvedEntities, findings);

    return {
      supplierName,
      resolvedEntities,
      overallRisk: riskAssessment.level,
      overallConfidence: riskAssessment.confidence,
      riskScore: riskAssessment.score,
      findings,
      ownershipAnalysis,
      recommendedActions: recommendations,
      legalDisclaimer: this.getLegalDisclaimer()
    };
  }

  /**
   * Find direct BIS matches
   */
  private async findDirectMatches(supplierName: string): Promise<{
    entities: ResolvedEntity[];
    findings: Finding[];
  }> {
    const entities: ResolvedEntity[] = [];
    const findings: Finding[] = [];

    // Ensure entities are loaded
    if (!this.bisEntities || this.bisEntities.length === 0) {
      return { entities, findings };
    }

    for (const bisEntity of this.bisEntities) {
      const match = this.calculateMatchScore(supplierName, bisEntity);

      if (match.score > 0.7) {
        entities.push({
          matchedName: bisEntity.name,
          matchType: 'direct',
          bisEntity,
          confidence: match.score,
          evidencePoints: match.evidence
        });

        findings.push({
          severity: match.score > 0.9 ? 'critical' : match.score > 0.8 ? 'warning' : 'info',
          category: 'direct_match',
          description: `Direct name match with BIS entity: ${bisEntity.name}`,
          evidence: match.evidence,
          confidence: match.score,
          source: 'BIS Entity List'
        });
      }
    }

    return { entities, findings };
  }

  /**
   * Find matches through ownership structure
   */
  private async findOwnershipMatches(ownership: CompanyOwnership): Promise<{
    entities: ResolvedEntity[];
    findings: Finding[];
  }> {
    const entities: ResolvedEntity[] = [];
    const findings: Finding[] = [];

    // Check parents
    for (const parent of ownership.parents) {
      for (const bisEntity of this.bisEntities) {
        if (this.normalizeCompanyName(parent.companyName) === this.normalizeCompanyName(bisEntity.name)) {
          entities.push({
            matchedName: bisEntity.name,
            matchType: 'parent',
            bisEntity,
            confidence: 0.95,
            evidencePoints: [
              `Parent company ${parent.companyName} is on BIS entity list`,
              `Ownership: ${parent.ownershipPercentage || '?'}%`,
              `Source: ${parent.source}`
            ],
            relationshipPath: [ownership.companyName, parent.companyName, bisEntity.name]
          });

          findings.push({
            severity: 'critical',
            category: 'ownership',
            description: `Parent company is on BIS entity list`,
            evidence: [
              `${parent.companyName} owns ${parent.ownershipPercentage || '?'}% of ${ownership.companyName}`,
              `Listed on BIS: ${bisEntity.effectiveDate}`,
              `FR Citation: ${bisEntity.federalRegisterCitation}`
            ],
            confidence: 0.95,
            source: parent.source
          });
        }
      }
    }

    // Check subsidiaries (supplier is parent of BIS entity)
    for (const subsidiary of ownership.subsidiaries) {
      for (const bisEntity of this.bisEntities) {
        if (this.normalizeCompanyName(subsidiary.companyName) === this.normalizeCompanyName(bisEntity.name)) {
          entities.push({
            matchedName: bisEntity.name,
            matchType: 'subsidiary',
            bisEntity,
            confidence: 0.85,
            evidencePoints: [
              `Subsidiary ${subsidiary.companyName} is on BIS entity list`,
              `${ownership.companyName} owns ${subsidiary.ownershipPercentage || '?'}%`
            ],
            relationshipPath: [ownership.companyName, subsidiary.companyName, bisEntity.name]
          });

          findings.push({
            severity: 'warning',
            category: 'ownership',
            description: `Subsidiary is on BIS entity list`,
            evidence: [
              `${ownership.companyName} controls subsidiary ${subsidiary.companyName}`,
              `Subsidiary listed on BIS: ${bisEntity.effectiveDate}`
            ],
            confidence: 0.85,
            source: subsidiary.source
          });
        }
      }
    }

    // Check affiliates
    for (const affiliate of ownership.affiliates) {
      for (const bisEntity of this.bisEntities) {
        if (this.normalizeCompanyName(affiliate.companyName) === this.normalizeCompanyName(bisEntity.name)) {
          entities.push({
            matchedName: bisEntity.name,
            matchType: 'affiliate',
            bisEntity,
            confidence: 0.75,
            evidencePoints: [
              `Affiliated company ${affiliate.companyName} is on BIS entity list`,
              `Relationship type: ${affiliate.relationType}`
            ],
            relationshipPath: [ownership.companyName, affiliate.companyName, bisEntity.name]
          });

          findings.push({
            severity: 'warning',
            category: 'ownership',
            description: `Affiliated entity is on BIS entity list`,
            evidence: [
              `${affiliate.companyName} has ${affiliate.relationType} relationship`,
              `Listed on BIS: ${bisEntity.effectiveDate}`
            ],
            confidence: 0.75,
            source: affiliate.source
          });
        }
      }
    }

    return { entities, findings };
  }

  /**
   * Analyze geographic risk
   */
  private analyzeGeographicRisk(supplierName: string, resolvedEntities: ResolvedEntity[]): Finding[] {
    const findings: Finding[] = [];

    // Check for high-risk geographic indicators in supplier name
    const highRiskLocations = [
      'shenzhen', 'beijing', 'shanghai', 'guangzhou', 'wuhan', 'chengdu',
      'moscow', 'tehran', 'pyongyang'
    ];

    const supplierLower = supplierName.toLowerCase();

    for (const location of highRiskLocations) {
      if (supplierLower.includes(location)) {
        findings.push({
          severity: 'info',
          category: 'geographic',
          description: `Supplier located in high-risk jurisdiction`,
          evidence: [
            `Company name contains "${location}"`,
            'Location associated with BIS-listed entities',
            'Recommend additional due diligence'
          ],
          confidence: 0.6,
          source: 'geographic_analysis'
        });
      }
    }

    // Check if supplier is in same location as BIS entities
    for (const resolved of resolvedEntities) {
      if (resolved.bisEntity.city && supplierLower.includes(resolved.bisEntity.city.toLowerCase())) {
        findings.push({
          severity: 'warning',
          category: 'geographic',
          description: `Geographic overlap with BIS entity ${resolved.bisEntity.name}`,
          evidence: [
            `Both located in ${resolved.bisEntity.city}`,
            'Possible operational relationship',
            'Supply chain overlap risk'
          ],
          confidence: 0.5,
          source: 'geographic_analysis'
        });
      }
    }

    return findings;
  }

  /**
   * Analyze name similarity with BIS entities
   */
  private analyzeNameSimilarity(supplierName: string): Finding[] {
    const findings: Finding[] = [];

    for (const bisEntity of this.bisEntities) {
      const similarity = this.calculateNameSimilarity(supplierName, bisEntity.name);

      if (similarity > 0.5 && similarity < 0.7) {
        findings.push({
          severity: 'info',
          category: 'naming',
          description: `Partial name similarity with BIS entity ${bisEntity.name}`,
          evidence: [
            `Similarity score: ${(similarity * 100).toFixed(0)}%`,
            'May indicate related entity or naming variation',
            'Recommend manual verification'
          ],
          confidence: similarity,
          source: 'name_analysis'
        });
      }
    }

    return findings;
  }

  /**
   * Calculate overall risk
   */
  private calculateRisk(
    entities: ResolvedEntity[],
    findings: Finding[]
  ): { level: EntityResolutionResult['overallRisk']; score: number; confidence: number } {
    let score = 0;
    let confidenceSum = 0;
    let confidenceCount = 0;

    // Direct matches = highest risk
    const directMatches = entities.filter(e => e.matchType === 'direct');
    if (directMatches.length > 0) {
      const avgConfidence = directMatches.reduce((sum, e) => sum + e.confidence, 0) / directMatches.length;
      score += 9.0 * avgConfidence;
      confidenceSum += avgConfidence;
      confidenceCount++;
    }

    // Parent company matches = critical risk
    const parentMatches = entities.filter(e => e.matchType === 'parent');
    if (parentMatches.length > 0) {
      score += 8.5;
      confidenceSum += 0.95;
      confidenceCount++;
    }

    // Subsidiary matches = high risk
    const subsidiaryMatches = entities.filter(e => e.matchType === 'subsidiary');
    if (subsidiaryMatches.length > 0) {
      score += 7.0;
      confidenceSum += 0.85;
      confidenceCount++;
    }

    // Affiliate matches = medium risk
    const affiliateMatches = entities.filter(e => e.matchType === 'affiliate');
    if (affiliateMatches.length > 0) {
      score += 5.5;
      confidenceSum += 0.75;
      confidenceCount++;
    }

    // Geographic warnings
    const geoWarnings = findings.filter(f => f.category === 'geographic' && f.severity === 'warning');
    score += geoWarnings.length * 0.5;

    // Cap at 10
    score = Math.min(10, score);

    const confidence = confidenceCount > 0 ? confidenceSum / confidenceCount : 0.5;

    let level: EntityResolutionResult['overallRisk'];
    if (score >= 8.5) level = 'critical';
    else if (score >= 7.0) level = 'high';
    else if (score >= 5.0) level = 'medium';
    else if (score >= 2.0) level = 'low';
    else level = 'clear';

    return { level, score, confidence };
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    risk: { level: string; score: number },
    entities: ResolvedEntity[],
    findings: Finding[]
  ): string[] {
    const recommendations: string[] = [];

    if (risk.level === 'critical') {
      recommendations.push('IMMEDIATE ACTION REQUIRED: Cease all shipments to this supplier immediately');
      recommendations.push('Engage export compliance legal counsel within 24 hours');
      recommendations.push('Do NOT rely solely on automated analysis - verify with legal team');

      if (entities.some(e => e.matchType === 'parent')) {
        recommendations.push('Parent company ownership relationship triggers BIS affiliate coverage - license required');
      }

      recommendations.push('Identify alternative compliant suppliers immediately (see alternatives section)');
      recommendations.push('Document all compliance review steps for audit trail');
    } else if (risk.level === 'high') {
      recommendations.push('URGENT: Suspend new orders pending compliance review');
      recommendations.push('Conduct thorough ownership structure verification within 72 hours');
      recommendations.push('Consult export compliance specialist for license determination');
      recommendations.push('Prepare contingency sourcing plan');
      recommendations.push('Review existing inventory and shipment status');
    } else if (risk.level === 'medium') {
      recommendations.push('Conduct enhanced due diligence on ownership structure');
      recommendations.push('Verify supplier independence from BIS-listed entities');
      recommendations.push('Establish backup supplier relationships');
      recommendations.push('Monitor BIS entity list updates monthly');
      recommendations.push('Document compliance review findings');
    } else if (risk.level === 'low') {
      recommendations.push('Maintain standard monitoring protocols');
      recommendations.push('Review supplier status quarterly');
      recommendations.push('Keep documentation of clearance determination');
    }

    // Add finding-specific recommendations
    const ownershipFindings = findings.filter(f => f.category === 'ownership');
    if (ownershipFindings.length > 0) {
      recommendations.push('Request certified ownership documentation from supplier');
      recommendations.push('Verify ownership claims through independent third-party sources');
    }

    const geoFindings = findings.filter(f => f.category === 'geographic' && f.severity !== 'info');
    if (geoFindings.length > 0) {
      recommendations.push('Investigate local business relationships and operational ties');
    }

    return recommendations;
  }

  /**
   * Calculate match score between supplier name and BIS entity
   */
  private calculateMatchScore(supplierName: string, bisEntity: BISEntityFull): {
    score: number;
    evidence: string[];
  } {
    const evidence: string[] = [];
    let score = 0;

    const normalizedSupplier = this.normalizeCompanyName(supplierName);
    const normalizedEntity = this.normalizeCompanyName(bisEntity.name);

    // Exact match
    if (normalizedSupplier === normalizedEntity) {
      score = 1.0;
      evidence.push('Exact name match');
      return { score, evidence };
    }

    // Check alternate names
    for (const altName of bisEntity.alternateNames) {
      const normalizedAlt = this.normalizeCompanyName(altName);
      if (normalizedSupplier === normalizedAlt) {
        score = 0.95;
        evidence.push(`Matches alternate name: ${altName}`);
        return { score, evidence };
      }
    }

    // Fuzzy matching
    const similarity = this.calculateNameSimilarity(normalizedSupplier, normalizedEntity);
    if (similarity > 0.7) {
      score = similarity;
      evidence.push(`High name similarity: ${(similarity * 100).toFixed(0)}%`);
    }

    // Check containment
    if (normalizedSupplier.includes(normalizedEntity) || normalizedEntity.includes(normalizedSupplier)) {
      const containmentScore = Math.min(normalizedEntity.length / normalizedSupplier.length, 1) * 0.85;
      if (containmentScore > score) {
        score = containmentScore;
        evidence.push('Name containment match');
      }
    }

    return { score, evidence };
  }

  private normalizeCompanyName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[,\.]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/\b(inc|ltd|llc|corp|corporation|co|company|limited|technologies|technology|tech)\b/g, '')
      .trim();
  }

  private calculateNameSimilarity(name1: string, name2: string): number {
    const s1 = this.normalizeCompanyName(name1);
    const s2 = this.normalizeCompanyName(name2);

    if (s1 === s2) return 1.0;

    // Levenshtein distance
    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);

    return 1 - (distance / maxLength);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,
            dp[i][j - 1] + 1,
            dp[i - 1][j - 1] + 1
          );
        }
      }
    }

    return dp[m][n];
  }

  private getLegalDisclaimer(): string {
    return `LEGAL DISCLAIMER: This analysis is provided for informational purposes only and does not constitute legal advice. Export control compliance is complex and highly fact-specific. This automated analysis should be verified by qualified export compliance counsel before making any business decisions. The analysis is based on publicly available information and may not reflect the most current regulatory updates or all relevant facts. Users are solely responsible for ensuring compliance with all applicable export control regulations. By using this tool, you acknowledge that you will seek independent legal verification of these findings.`;
  }
}

// Singleton
let advancedResolutionInstance: AdvancedEntityResolution | null = null;

export function getAdvancedEntityResolution(): AdvancedEntityResolution {
  if (!advancedResolutionInstance) {
    advancedResolutionInstance = new AdvancedEntityResolution();
  }
  return advancedResolutionInstance;
}

export default AdvancedEntityResolution;
