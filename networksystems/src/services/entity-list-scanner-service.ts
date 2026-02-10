/**
 * Entity List Scanner Service
 * Main service that coordinates file parsing, BIS matching, and report generation
 * NOW USES ADVANCED ENTITY RESOLUTION FOR WORLD-CLASS COMPLIANCE SCANNING
 * ENHANCED WITH RISK SCORING ENGINE - THE MOAT
 */

import { getAdvancedEntityResolution, EntityResolutionResult } from './advanced-entity-resolution';
import { getSupplierFileParser, ParsedSupplier } from './supplier-file-parser';
import { getRiskScoringEngine, RiskAssessment } from './risk-scoring-engine';
import { getInferenceEngine } from './ownership-inference-engine';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SupplierScanResult {
  supplier: ParsedSupplier;
  riskLevel: 'clear' | 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-10
  confidence: number; // 0-1 (NEW: from advanced resolution)
  matches: Array<{ // Updated to match advanced resolution format
    matchedName: string;
    matchType: 'direct' | 'parent' | 'subsidiary' | 'affiliate' | 'inferred';
    confidence: number;
    evidence: string[];
    relationshipPath?: string[];
  }>;
  flags: string[];
  recommendations: string[];
  ownershipAnalysis?: any; // NEW: ownership structure data
  legalDisclaimer?: string; // NEW: professional legal disclaimer
  riskAssessment?: RiskAssessment; // THE MOAT: Full risk assessment with legal citations
}

export interface ComplianceScanReport {
  scanId: string;
  companyName: string;
  scanDate: string;
  summary: {
    totalSuppliers: number;
    clearSuppliers: number;
    lowRiskSuppliers: number;
    mediumRiskSuppliers: number;
    highRiskSuppliers: number;
    criticalSuppliers: number;
    overallRiskScore: number; // 0-10
    overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
    estimatedExposure: string;
  };
  results: SupplierScanResult[];
  alternatives: AlternativeSupplier[];
  recommendations: string[];
  metadata: {
    fileType: string;
    totalRowsParsed: number;
    skippedRows: number;
    parseErrors: string[];
  };
}

export interface AlternativeSupplier {
  flaggedSupplier: string;
  alternatives: {
    name: string;
    location: string;
    costDelta: string;
    leadTime: string;
    certifications: string;
  }[];
}

class EntityListScannerService {
  private advancedResolution = getAdvancedEntityResolution();
  private fileParser = getSupplierFileParser();

  /**
   * Perform full compliance scan from uploaded file
   */
  public async scanFile(
    fileContent: string,
    fileName: string,
    companyName: string
  ): Promise<ComplianceScanReport> {
    // Step 1: Parse file
    const parseResult = await this.fileParser.parseFile(fileContent, fileName);

    if (parseResult.suppliers.length === 0) {
      throw new Error('No suppliers found in file. Please check file format.');
    }

    // Step 2: Scan each supplier against BIS entity list
    const scanResults: SupplierScanResult[] = [];

    for (const supplier of parseResult.suppliers) {
      const result = await this.scanSupplier(supplier);
      scanResults.push(result);
    }

    // Step 3: Calculate summary statistics
    const summary = this.calculateSummary(scanResults);

    // Step 4: Generate alternatives for flagged suppliers
    const alternatives = this.generateAlternatives(scanResults);

    // Step 5: Generate strategic recommendations
    const recommendations = this.generateRecommendations(scanResults, summary);

    // Step 6: Compile final report
    const report: ComplianceScanReport = {
      scanId: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      companyName,
      scanDate: new Date().toISOString(),
      summary,
      results: scanResults,
      alternatives,
      recommendations,
      metadata: {
        fileType: parseResult.fileType,
        totalRowsParsed: parseResult.totalRows,
        skippedRows: parseResult.skippedRows,
        parseErrors: parseResult.errors
      }
    };

    return report;
  }

  /**
   * Scan individual supplier using ADVANCED ENTITY RESOLUTION
   * This now includes ownership structure detection, multi-factor analysis,
   * and confidence scoring with evidence trails
   * ENHANCED WITH RISK SCORING ENGINE - THE MOAT
   */
  private async scanSupplier(supplier: ParsedSupplier): Promise<SupplierScanResult> {
    // Use the advanced entity resolution service
    const resolution: EntityResolutionResult = await this.advancedResolution.resolveEntity(supplier.originalName);

    // Convert findings to flags (for backward compatibility)
    const flags: string[] = resolution.findings.map(finding => {
      let prefix = '';
      if (finding.severity === 'critical') prefix = '🚨 CRITICAL: ';
      else if (finding.severity === 'warning') prefix = '⚠️ WARNING: ';
      else prefix = 'ℹ️ INFO: ';

      return `${prefix}${finding.description} (${Math.round(finding.confidence * 100)}% confidence)`;
    });

    // Add evidence details to flags
    for (const entity of resolution.resolvedEntities) {
      if (entity.matchType === 'parent') {
        flags.push(`📊 Ownership: Parent company "${entity.matchedName}" is on BIS entity list`);
      } else if (entity.matchType === 'subsidiary') {
        flags.push(`📊 Ownership: Subsidiary "${entity.matchedName}" is on BIS entity list`);
      } else if (entity.matchType === 'affiliate') {
        flags.push(`📊 Ownership: Affiliate "${entity.matchedName}" is on BIS entity list`);
      } else if (entity.matchType === 'direct') {
        flags.push(`🎯 Direct Match: "${entity.matchedName}" - Effective ${entity.bisEntity.effectiveDate}`);
        flags.push(`📋 Federal Register: ${entity.bisEntity.federalRegisterCitation}`);
        flags.push(`⚖️ License Policy: ${entity.bisEntity.licenseReviewPolicy}`);
      }

      // Add relationship path if available
      if (entity.relationshipPath && entity.relationshipPath.length > 0) {
        flags.push(`🔗 Relationship Path: ${entity.relationshipPath.join(' → ')}`);
      }
    }

    // Convert advanced resolution matches to scanner format
    const matches = resolution.resolvedEntities.map(entity => ({
      matchedName: entity.matchedName,
      matchType: entity.matchType,
      confidence: entity.confidence,
      evidence: entity.evidencePoints,
      relationshipPath: entity.relationshipPath
    }));

    // THE MOAT: Run comprehensive risk assessment with legal citations
    let riskAssessment: RiskAssessment | undefined;
    try {
      // Get ownership data from database
      const ownershipData = await prisma.discoveredOwnership.findUnique({
        where: { entityName: supplier.originalName }
      });

      // Get inferred relationships from inference engine
      const inferenceEngine = getInferenceEngine();
      await inferenceEngine.buildGraph();
      const enriched = inferenceEngine.getEnrichedOwnership(supplier.originalName);

      // Run risk scoring engine
      const riskEngine = getRiskScoringEngine();
      riskAssessment = await riskEngine.assessRisk(
        supplier.originalName,
        ownershipData,
        enriched?.siblings.map(s => ({ relatedEntity: s }))
      );
    } catch (error) {
      console.error(`Risk assessment error for ${supplier.originalName}:`, error);
      // Continue without risk assessment if it fails
    }

    return {
      supplier,
      riskLevel: resolution.overallRisk,
      riskScore: resolution.riskScore,
      confidence: resolution.overallConfidence,
      matches,
      flags,
      recommendations: resolution.recommendedActions,
      ownershipAnalysis: resolution.ownershipAnalysis,
      legalDisclaimer: resolution.legalDisclaimer,
      riskAssessment // THE MOAT: Full risk assessment with actionable recommendations
    };
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(results: SupplierScanResult[]) {
    const total = results.length;
    const clear = results.filter(r => r.riskLevel === 'clear').length;
    const low = results.filter(r => r.riskLevel === 'low').length;
    const medium = results.filter(r => r.riskLevel === 'medium').length;
    const high = results.filter(r => r.riskLevel === 'high').length;
    const critical = results.filter(r => r.riskLevel === 'critical').length;

    const avgRiskScore = results.reduce((sum, r) => sum + r.riskScore, 0) / total;

    let overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (critical > 0 || high > total * 0.15) {
      overallRiskLevel = 'critical';
    } else if (high > 0 || medium > total * 0.25) {
      overallRiskLevel = 'high';
    } else if (medium > 0 || low > total * 0.3) {
      overallRiskLevel = 'medium';
    } else {
      overallRiskLevel = 'low';
    }

    // Estimate financial exposure (simplified)
    const estimatedExposure = this.estimateFinancialExposure(critical, high, medium);

    return {
      totalSuppliers: total,
      clearSuppliers: clear,
      lowRiskSuppliers: low,
      mediumRiskSuppliers: medium,
      highRiskSuppliers: high,
      criticalSuppliers: critical,
      overallRiskScore: Math.round(avgRiskScore * 10) / 10,
      overallRiskLevel,
      estimatedExposure
    };
  }

  /**
   * Estimate financial exposure
   */
  private estimateFinancialExposure(critical: number, high: number, medium: number): string {
    // Rough estimates based on typical supplier spend
    const criticalExposure = critical * 2500000; // $2.5M per critical supplier
    const highExposure = high * 800000; // $800K per high-risk supplier
    const mediumExposure = medium * 200000; // $200K per medium-risk supplier

    const total = criticalExposure + highExposure + mediumExposure;

    if (total >= 1000000) {
      return `$${(total / 1000000).toFixed(1)}M`;
    } else if (total >= 1000) {
      return `$${(total / 1000).toFixed(0)}K`;
    } else {
      return `$${total.toFixed(0)}`;
    }
  }

  /**
   * Generate alternative suppliers for flagged entries
   */
  private generateAlternatives(results: SupplierScanResult[]): AlternativeSupplier[] {
    const alternatives: AlternativeSupplier[] = [];

    // Get high and critical risk suppliers
    const flaggedSuppliers = results.filter(r => r.riskLevel === 'critical' || r.riskLevel === 'high');

    for (const result of flaggedSuppliers) {
      // Generate alternatives based on supplier category/type
      alternatives.push({
        flaggedSupplier: result.supplier.originalName,
        alternatives: this.suggestAlternatives(result)
      });
    }

    return alternatives;
  }

  /**
   * Suggest alternative suppliers
   */
  private suggestAlternatives(result: SupplierScanResult) {
    // This is simplified - in production, you'd have a database of alternatives
    const alternatives = [];

    // Suggest Taiwan alternatives for China-based suppliers
    if (result.supplier.location?.toLowerCase().includes('china')) {
      alternatives.push({
        name: 'Taiwan Semiconductor Components',
        location: 'Taiwan',
        costDelta: '+8-12%',
        leadTime: '4-6 weeks',
        certifications: 'ISO 9001, ITAR'
      });

      alternatives.push({
        name: 'Korea Electronics Co.',
        location: 'South Korea',
        costDelta: '+10-15%',
        leadTime: '5-7 weeks',
        certifications: 'ISO 9001'
      });
    }

    // Suggest US alternatives
    alternatives.push({
      name: 'US-Based Alternative',
      location: 'USA',
      costDelta: '+20-25%',
      leadTime: '6-8 weeks',
      certifications: 'ISO 9001, ITAR, CMMC'
    });

    return alternatives.slice(0, 3); // Return top 3
  }

  /**
   * Generate strategic recommendations
   */
  private generateRecommendations(results: SupplierScanResult[], summary: any): string[] {
    const recommendations: string[] = [];

    if (summary.criticalSuppliers > 0) {
      recommendations.push(
        `URGENT: Replace ${summary.criticalSuppliers} critical-risk supplier${summary.criticalSuppliers > 1 ? 's' : ''} within 30-60 days`
      );
    }

    if (summary.highRiskSuppliers > 0) {
      recommendations.push(
        `Establish backup suppliers for ${summary.highRiskSuppliers} high-risk supplier${summary.highRiskSuppliers > 1 ? 's' : ''} within 90 days`
      );
    }

    if (summary.mediumRiskSuppliers > 0) {
      recommendations.push(
        `Conduct ownership structure review for ${summary.mediumRiskSuppliers} medium-risk supplier${summary.mediumRiskSuppliers > 1 ? 's' : ''}`
      );
    }

    if (summary.criticalSuppliers > 0 || summary.highRiskSuppliers > 0) {
      recommendations.push('Implement continuous entity list monitoring with automated alerts');
    }

    if (summary.overallRiskLevel === 'critical' || summary.overallRiskLevel === 'high') {
      recommendations.push('Consider geographic diversification strategy to reduce concentration risk');
      recommendations.push('Engage legal counsel specializing in export controls');
    }

    recommendations.push('Schedule quarterly compliance reviews for all suppliers');
    recommendations.push('Establish entity list screening process for all new suppliers');

    return recommendations;
  }
}

// Singleton instance
let scannerInstance: EntityListScannerService | null = null;

export function getEntityListScanner(): EntityListScannerService {
  if (!scannerInstance) {
    scannerInstance = new EntityListScannerService();
  }
  return scannerInstance;
}

export default EntityListScannerService;
