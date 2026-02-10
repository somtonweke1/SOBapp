/**
 * PFAS Compliance Scanner Service
 * Main orchestrator for PFAS compliance intelligence
 *
 * This service mirrors the BIS entity-list-scanner-service architecture:
 * - Coordinates multiple engines (capacity, breakthrough, risk)
 * - Generates comprehensive compliance reports
 * - Provides confidence scoring and evidence trails
 * - Integrates with MIAR's shared infrastructure
 */

import type {
  PFASSystemData,
  PFASComplianceReport,
  PFASEconomicAnalysis,
  PFASValidationInput,
} from '../../types/pfas';
import { getPFASCapacityEngine, calculateCostPerMillionGallons, runMonteCarloSimulation } from './pfas-capacity-engine';
import { getPFASBreakthroughEngine } from './pfas-breakthrough-engine';
import { getPFASRiskEngine } from './pfas-risk-engine';
import { v4 as uuidv4 } from 'uuid';

/**
 * PFAS Compliance Scanner Service
 * Orchestrates PFAS compliance analysis workflow
 */
class PFASComplianceScannerService {
  private capacityEngine = getPFASCapacityEngine();
  private breakthroughEngine = getPFASBreakthroughEngine();
  private riskEngine = getPFASRiskEngine();

  /**
   * Main analysis function - orchestrates all PFAS compliance checks
   *
   * Workflow:
   * 1. Calculate GAC capacity (Freundlich)
   * 2. Predict breakthrough curves (Thomas)
   * 3. Assess regulatory compliance risk
   * 4. Perform economic analysis (Monte Carlo)
   * 5. Generate comprehensive report
   */
  async analyzePFASCompliance(
    systemData: PFASSystemData,
    options: {
      includeMultiCompound?: boolean;
      monteCarloIterations?: number;
      breakthroughDuration?: number; // days
      reportFormat?: 'json' | 'html' | 'pdf';
    } = {}
  ): Promise<PFASComplianceReport> {
    const scanId = uuidv4();
    const timestamp = new Date();

    // Set defaults
    const {
      includeMultiCompound = true,
      monteCarloIterations = 5000,
      breakthroughDuration = 365,
      reportFormat = 'json',
    } = options;

    // Step 1: Calculate GAC Capacity (Freundlich Isotherm)
    const capacityAnalysis = this.capacityEngine.analyzeCapacity(systemData);

    // Step 2: Calculate EBCT
    const ebctCalculated = this.capacityEngine.calculateEBCT(systemData);

    // Step 3: Calculate Removal Efficiency
    const { efficiency: removalEfficiency, confidence: efficiencyConfidence } =
      this.capacityEngine.calculateRemovalEfficiency(systemData);

    // Step 4: Predict Breakthrough Curve (Thomas Model)
    const breakthroughAnalysis = this.breakthroughEngine.calculateBreakthrough(
      systemData,
      capacityAnalysis.adjustedCapacity,
      breakthroughDuration
    );

    // Step 5: Multi-compound breakthrough (optional)
    let multiCompoundBreakthrough;
    if (includeMultiCompound) {
      multiCompoundBreakthrough = this.breakthroughEngine.calculateMultiCompoundBreakthrough(
        systemData,
        capacityAnalysis.adjustedCapacity,
        breakthroughDuration
      );
    }

    // Step 6: Economic Analysis with Monte Carlo
    const economicAnalysis = this.performEconomicAnalysis(
      systemData,
      capacityAnalysis.adjustedCapacity,
      ebctCalculated,
      removalEfficiency,
      monteCarloIterations
    );

    // Step 7: Risk Assessment
    const riskAssessment = this.riskEngine.assessRisk(
      systemData,
      economicAnalysis.projectedLifespanMonths,
      removalEfficiency
    );

    // Step 8: Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence(
      capacityAnalysis.confidence,
      breakthroughAnalysis.confidence,
      riskAssessment.confidence,
      efficiencyConfidence
    );

    // Step 9: Generate summary
    const summary = this.generateSummary(systemData, riskAssessment, economicAnalysis);

    const report: PFASComplianceReport = {
      scanId,
      timestamp,
      systemData,
      capacityAnalysis,
      breakthroughAnalysis,
      riskAssessment,
      economicAnalysis,
      multiCompoundBreakthrough,
      overallConfidence,
      summary,
      reportFormat,
    };

    return report;
  }

  /**
   * Perform economic analysis with Monte Carlo simulation
   */
  private performEconomicAnalysis(
    systemData: PFASSystemData,
    capacityEstimate: number,
    ebctCalculated: number,
    removalEfficiency: number,
    iterations: number
  ): PFASEconomicAnalysis {
    // Calculate base projected lifespan
    const gacMass = systemData.bedVolume * systemData.gacDensity; // kg
    const pfasLoadKg = (systemData.totalPFAS / 1000000) * systemData.flowRate * 24 * 30; // kg/month
    const baseLifespan = (capacityEstimate * gacMass) / (pfasLoadKg * systemData.safetyFactor); // months

    const projectedLifespanMonths = Math.max(1, baseLifespan);

    // Run Monte Carlo simulation for uncertainty analysis
    const monteCarloResults = runMonteCarloSimulation(projectedLifespanMonths, 0.18, iterations, false);

    // Calculate cost per million gallons
    const costPerMillionGallons = calculateCostPerMillionGallons(systemData, projectedLifespanMonths);

    // Calculate capital avoidance (savings from optimized replacement)
    const capitalAvoidance =
      (systemData.replacementCost + systemData.laborCost) * (projectedLifespanMonths / 12);

    // Generate key findings
    const keyFindings = this.riskEngine.generateFindings(
      projectedLifespanMonths,
      monteCarloResults.p95,
      removalEfficiency,
      costPerMillionGallons,
      capacityEstimate,
      ebctCalculated
    );

    return {
      projectedLifespanMonths,
      capitalAvoidance,
      costPerMillionGallons,
      p95SafeLifeMonths: monteCarloResults.p95,
      monteCarloResults,
      keyFindings,
    };
  }

  /**
   * Calculate overall confidence score
   * Weighted average of individual engine confidences
   */
  private calculateOverallConfidence(
    capacityConfidence: number,
    breakthroughConfidence: number,
    riskConfidence: number,
    efficiencyConfidence: number
  ): number {
    // Weighted average: capacity and breakthrough are most critical
    const weighted =
      capacityConfidence * 0.3 +
      breakthroughConfidence * 0.3 +
      riskConfidence * 0.25 +
      efficiencyConfidence * 0.15;

    return Math.min(1.0, Math.max(0.0, weighted));
  }

  /**
   * Generate executive summary
   */
  private generateSummary(
    systemData: PFASSystemData,
    riskAssessment: any,
    economicAnalysis: any
  ): PFASComplianceReport['summary'] {
    // Count detected PFAS compounds
    const totalPFASDetected = Object.values(systemData.pfasCompounds).filter((c) => c > 0).length;

    // Count compounds above EPA limits
    const compoundsAboveLimit = riskAssessment.regulatoryGaps.length;

    // Determine urgency level
    let urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskAssessment.riskLevel === 'critical') {
      urgencyLevel = 'critical';
    } else if (riskAssessment.riskLevel === 'high') {
      urgencyLevel = 'high';
    } else if (riskAssessment.riskLevel === 'medium' || compoundsAboveLimit > 0) {
      urgencyLevel = 'medium';
    } else {
      urgencyLevel = 'low';
    }

    return {
      totalPFASDetected,
      compoundsAboveLimit,
      predictedSystemLife: economicAnalysis.projectedLifespanMonths,
      complianceStatus: riskAssessment.complianceStatus,
      urgencyLevel,
    };
  }

  /**
   * Validate system with pilot study data
   * Returns comparison metrics
   */
  async validateWithPilotData(input: PFASValidationInput): Promise<{
    validationMetrics?: any;
    calibratedReport: PFASComplianceReport;
    recommendations: string[];
  }> {
    // Run standard analysis
    const report = await this.analyzePFASCompliance(input.systemData);

    const recommendations: string[] = [];

    // If pilot data available, validate predictions
    if (input.pilotStudyData?.observedBreakthrough) {
      try {
        const validationMetrics = this.breakthroughEngine.validatePrediction(
          report.breakthroughAnalysis.points,
          input.pilotStudyData.observedBreakthrough
        );

        // Adjust confidence based on validation
        if (validationMetrics.r2 > 0.9) {
          recommendations.push('Excellent model fit (R² > 0.9) - predictions highly reliable');
        } else if (validationMetrics.r2 > 0.7) {
          recommendations.push('Good model fit (R² > 0.7) - predictions reliable with some uncertainty');
        } else {
          recommendations.push('Model fit below target (R² < 0.7) - consider site-specific calibration');
        }

        return {
          validationMetrics,
          calibratedReport: report,
          recommendations,
        };
      } catch (error: any) {
        recommendations.push(`Validation error: ${error.message}`);
      }
    }

    recommendations.push('No pilot data available - using literature-based model parameters');

    return {
      calibratedReport: report,
      recommendations,
    };
  }

  /**
   * Quick analysis for dashboard/preview
   * Uses simplified Monte Carlo for speed
   */
  async quickAnalysis(systemData: PFASSystemData): Promise<{
    riskLevel: string;
    projectedLifeMonths: number;
    complianceStatus: string;
    urgentIssues: number;
  }> {
    const capacityAnalysis = this.capacityEngine.analyzeCapacity(systemData);
    const ebctCalculated = this.capacityEngine.calculateEBCT(systemData);
    const { efficiency: removalEfficiency } = this.capacityEngine.calculateRemovalEfficiency(systemData);

    // Quick lifespan estimate
    const gacMass = systemData.bedVolume * systemData.gacDensity;
    const pfasLoadKg = (systemData.totalPFAS / 1000000) * systemData.flowRate * 24 * 30;
    const projectedLifeMonths = Math.max(1, (capacityAnalysis.adjustedCapacity * gacMass) / (pfasLoadKg * systemData.safetyFactor));

    // Quick risk assessment
    const riskAssessment = this.riskEngine.assessRisk(systemData, projectedLifeMonths, removalEfficiency);

    return {
      riskLevel: riskAssessment.riskLevel,
      projectedLifeMonths,
      complianceStatus: riskAssessment.complianceStatus,
      urgentIssues: riskAssessment.regulatoryGaps.length,
    };
  }
}

/**
 * Singleton factory function (mirrors BIS scanner pattern)
 */
let scannerInstance: PFASComplianceScannerService | null = null;

export function getPFASComplianceScanner(): PFASComplianceScannerService {
  if (!scannerInstance) {
    scannerInstance = new PFASComplianceScannerService();
  }
  return scannerInstance;
}

/**
 * Export the service class for testing
 */
export { PFASComplianceScannerService };
