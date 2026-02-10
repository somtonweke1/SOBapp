/**
 * PFAS Risk Engine
 * Assesses regulatory compliance risk and generates recommendations
 *
 * This engine mirrors the BIS scanner's risk scoring approach (0-10 scale)
 * but for PFAS environmental compliance
 */

import type { PFASSystemData, PFASRiskAssessment } from '../../types/pfas';
import { EPA_PFAS_LIMITS } from '../../types/pfas';

/**
 * Assess PFAS compliance risk
 * Returns risk score (0-10) and detailed compliance analysis
 *
 * Risk Levels (mirrors BIS scanner):
 * - 0-2: Clear (no compliance concerns)
 * - 2-4: Low (monitoring recommended)
 * - 4-6: Medium (action planning needed)
 * - 6-8: High (immediate action required)
 * - 8-10: Critical (severe non-compliance)
 */
export function assessPFASRisk(
  systemData: PFASSystemData,
  projectedLifespanMonths: number,
  removalEfficiency: number
): PFASRiskAssessment {
  const evidence: string[] = [];
  const regulatoryGaps: Array<{
    compound: string;
    currentLevel: number;
    regulatoryLimit: number;
    exceedance: number;
    citation: string;
  }> = [];

  let riskScore = 0;
  const recommendations: string[] = [];

  // Check each PFAS compound against EPA MCLs
  const pfasData = systemData.pfasCompounds;

  // PFOA Assessment
  if (pfasData.PFOA > 0) {
    const limit = EPA_PFAS_LIMITS.PFOA || 4.0;
    const exceedance = ((pfasData.PFOA - limit) / limit) * 100;

    if (pfasData.PFOA > limit) {
      regulatoryGaps.push({
        compound: 'PFOA',
        currentLevel: pfasData.PFOA,
        regulatoryLimit: limit,
        exceedance,
        citation: '89 FR 32520 (April 26, 2024) - EPA Final Rule',
      });

      // Severe exceedance = higher risk
      if (pfasData.PFOA > limit * 5) {
        riskScore += 3;
        evidence.push(`PFOA severely exceeds EPA MCL (${pfasData.PFOA.toFixed(1)} ng/L vs ${limit} ng/L limit)`);
      } else if (pfasData.PFOA > limit * 2) {
        riskScore += 2;
        evidence.push(`PFOA significantly exceeds EPA MCL (${pfasData.PFOA.toFixed(1)} ng/L vs ${limit} ng/L limit)`);
      } else {
        riskScore += 1;
        evidence.push(`PFOA exceeds EPA MCL (${pfasData.PFOA.toFixed(1)} ng/L vs ${limit} ng/L limit)`);
      }

      recommendations.push(`Immediate PFOA treatment required - current level ${pfasData.PFOA.toFixed(1)} ng/L exceeds ${limit} ng/L MCL`);
    }
  }

  // PFOS Assessment
  if (pfasData.PFOS > 0) {
    const limit = EPA_PFAS_LIMITS.PFOS || 4.0;
    const exceedance = ((pfasData.PFOS - limit) / limit) * 100;

    if (pfasData.PFOS > limit) {
      regulatoryGaps.push({
        compound: 'PFOS',
        currentLevel: pfasData.PFOS,
        regulatoryLimit: limit,
        exceedance,
        citation: '89 FR 32520 (April 26, 2024) - EPA Final Rule',
      });

      if (pfasData.PFOS > limit * 5) {
        riskScore += 3;
        evidence.push(`PFOS severely exceeds EPA MCL (${pfasData.PFOS.toFixed(1)} ng/L vs ${limit} ng/L limit)`);
      } else if (pfasData.PFOS > limit * 2) {
        riskScore += 2;
        evidence.push(`PFOS significantly exceeds EPA MCL (${pfasData.PFOS.toFixed(1)} ng/L vs ${limit} ng/L limit)`);
      } else {
        riskScore += 1;
        evidence.push(`PFOS exceeds EPA MCL (${pfasData.PFOS.toFixed(1)} ng/L vs ${limit} ng/L limit)`);
      }

      recommendations.push(`Immediate PFOS treatment required - current level ${pfasData.PFOS.toFixed(1)} ng/L exceeds ${limit} ng/L MCL`);
    }
  }

  // PFNA Assessment
  if (pfasData.PFNA > 0) {
    const limit = EPA_PFAS_LIMITS.PFNA || 10.0;
    if (pfasData.PFNA > limit) {
      const exceedance = ((pfasData.PFNA - limit) / limit) * 100;
      regulatoryGaps.push({
        compound: 'PFNA',
        currentLevel: pfasData.PFNA,
        regulatoryLimit: limit,
        exceedance,
        citation: '89 FR 32520 (April 26, 2024) - EPA Final Rule (Hazard Index)',
      });

      riskScore += 1;
      evidence.push(`PFNA exceeds EPA guideline (${pfasData.PFNA.toFixed(1)} ng/L vs ${limit} ng/L)`);
      recommendations.push(`PFNA treatment recommended - level ${pfasData.PFNA.toFixed(1)} ng/L`);
    }
  }

  // PFHxS Assessment
  if (pfasData.PFHxS > 0) {
    const limit = EPA_PFAS_LIMITS.PFHxS || 10.0;
    if (pfasData.PFHxS > limit) {
      const exceedance = ((pfasData.PFHxS - limit) / limit) * 100;
      regulatoryGaps.push({
        compound: 'PFHxS',
        currentLevel: pfasData.PFHxS,
        regulatoryLimit: limit,
        exceedance,
        citation: '89 FR 32520 (April 26, 2024) - EPA Final Rule (Hazard Index)',
      });

      riskScore += 1;
      evidence.push(`PFHxS exceeds EPA guideline (${pfasData.PFHxS.toFixed(1)} ng/L vs ${limit} ng/L)`);
      recommendations.push(`PFHxS treatment recommended - level ${pfasData.PFHxS.toFixed(1)} ng/L`);
    }
  }

  // System performance risk factors
  if (projectedLifespanMonths < 12) {
    riskScore += 2;
    evidence.push(`Short GAC lifespan (${projectedLifespanMonths.toFixed(1)} months) indicates high PFAS loading`);
    recommendations.push('Consider increasing GAC bed volume or reducing flow rate to extend system life');
  } else if (projectedLifespanMonths < 18) {
    riskScore += 1;
    evidence.push(`Moderate GAC lifespan (${projectedLifespanMonths.toFixed(1)} months)`);
  }

  if (removalEfficiency < 90) {
    riskScore += 1;
    evidence.push(`Sub-optimal removal efficiency (${removalEfficiency.toFixed(1)}%)`);
    recommendations.push('Optimize EBCT or upgrade GAC quality to improve removal efficiency');
  }

  // Total PFAS concentration risk
  if (systemData.totalPFAS > 1000) {
    riskScore += 2;
    evidence.push(`Very high total PFAS concentration (${systemData.totalPFAS.toFixed(0)} ng/L)`);
    recommendations.push('Consider pre-treatment or advanced oxidation processes due to high PFAS loading');
  } else if (systemData.totalPFAS > 500) {
    riskScore += 1;
    evidence.push(`Elevated total PFAS concentration (${systemData.totalPFAS.toFixed(0)} ng/L)`);
  }

  // Determine risk level and compliance status
  let riskLevel: 'clear' | 'low' | 'medium' | 'high' | 'critical';
  let complianceStatus: 'compliant' | 'approaching_limit' | 'exceeds_limit' | 'critical_exceedance';

  if (riskScore <= 2) {
    riskLevel = 'clear';
    complianceStatus = regulatoryGaps.length === 0 ? 'compliant' : 'approaching_limit';
  } else if (riskScore <= 4) {
    riskLevel = 'low';
    complianceStatus = 'approaching_limit';
  } else if (riskScore <= 6) {
    riskLevel = 'medium';
    complianceStatus = 'exceeds_limit';
  } else if (riskScore <= 8) {
    riskLevel = 'high';
    complianceStatus = 'exceeds_limit';
  } else {
    riskLevel = 'critical';
    complianceStatus = 'critical_exceedance';
  }

  // Estimate potential fines/exposure
  let estimatedFinesExposure = 0;
  if (regulatoryGaps.length > 0) {
    // EPA can fine up to $25,000 per day per violation (Clean Water Act)
    // Conservative estimate: $10,000/day for moderate violations
    const daysInNonCompliance = projectedLifespanMonths < 12 ? 365 : 180;
    const violationSeverityFactor = riskScore / 10;
    estimatedFinesExposure = Math.min(25000, 10000 * violationSeverityFactor) * daysInNonCompliance;

    evidence.push(
      `Potential regulatory exposure: $${(estimatedFinesExposure / 1000000).toFixed(2)}M based on ${regulatoryGaps.length} violation(s)`
    );
  }

  // Generate actionable recommendations
  if (regulatoryGaps.length > 0) {
    recommendations.push(`Address ${regulatoryGaps.length} regulatory compliance gap(s) immediately`);
    recommendations.push('Implement enhanced monitoring program per EPA guidelines');
    recommendations.push('Consider public notification requirements under Safe Drinking Water Act');
  }

  if (projectedLifespanMonths < 18) {
    recommendations.push('Develop accelerated GAC replacement schedule');
    recommendations.push('Explore alternative treatment technologies (IX, RO, advanced oxidation)');
  }

  if (riskScore > 6) {
    recommendations.push('URGENT: Engage environmental compliance counsel');
    recommendations.push('Notify state regulatory authority within required timeframe');
    recommendations.push('Prepare corrective action plan with timeline');
  }

  // Add general best practices
  if (recommendations.length === 0) {
    recommendations.push('System performing within compliance parameters');
    recommendations.push('Continue routine monitoring per regulatory requirements');
    recommendations.push('Plan for preventive GAC replacement before breakthrough');
  }

  // Calculate confidence score
  let confidence = 0.85; // Base confidence for risk assessment

  // Adjust based on data completeness
  const totalCompounds = Object.values(systemData.pfasCompounds).filter((c) => c > 0).length;
  if (totalCompounds < 2) {
    confidence *= 0.9;
    evidence.push('Limited PFAS compound data - risk assessment confidence reduced');
  }

  // Ensure minimum recommendations
  if (recommendations.length === 0) {
    recommendations.push('No specific recommendations - system meets compliance requirements');
  }

  return {
    overallRiskScore: Math.min(10, Math.max(0, riskScore)),
    riskLevel,
    complianceStatus,
    regulatoryGaps,
    recommendations,
    estimatedFinesExposure: regulatoryGaps.length > 0 ? estimatedFinesExposure : undefined,
    confidence,
    evidence,
  };
}

/**
 * Generate key findings based on analysis results
 */
export function generateKeyFindings(
  projectedLifespanMonths: number,
  p95SafeLifeMonths: number,
  removalEfficiency: number,
  costPerMillionGallons: number,
  capacityEstimate: number,
  ebctCalculated: number
): string[] {
  const findings: string[] = [];

  // Lifespan findings
  if (projectedLifespanMonths > 24) {
    findings.push(`Excellent projected lifespan of ${projectedLifespanMonths.toFixed(1)} months`);
  } else if (projectedLifespanMonths > 12) {
    findings.push(`Good projected lifespan of ${projectedLifespanMonths.toFixed(1)} months`);
  } else {
    findings.push(`Short projected lifespan of ${projectedLifespanMonths.toFixed(1)} months - consider optimization`);
  }

  // Efficiency findings
  if (removalEfficiency > 95) {
    findings.push(`High removal efficiency of ${removalEfficiency.toFixed(1)}%`);
  } else if (removalEfficiency > 90) {
    findings.push(`Good removal efficiency of ${removalEfficiency.toFixed(1)}%`);
  } else {
    findings.push(`Moderate removal efficiency of ${removalEfficiency.toFixed(1)}% - consider system optimization`);
  }

  // Cost findings
  if (costPerMillionGallons < 100) {
    findings.push(`Low treatment cost of $${costPerMillionGallons.toFixed(2)} per million gallons`);
  } else if (costPerMillionGallons < 200) {
    findings.push(`Moderate treatment cost of $${costPerMillionGallons.toFixed(2)} per million gallons`);
  } else {
    findings.push(`High treatment cost of $${costPerMillionGallons.toFixed(2)} per million gallons - optimization recommended`);
  }

  // EBCT findings
  if (ebctCalculated > 15) {
    findings.push(`Adequate contact time of ${ebctCalculated.toFixed(1)} minutes`);
  } else {
    findings.push(`Short contact time of ${ebctCalculated.toFixed(1)} minutes - consider increasing bed volume`);
  }

  // P95 safety findings
  if (p95SafeLifeMonths > 18) {
    findings.push('High confidence in system performance with 95% safety margin');
  } else {
    findings.push('Consider additional safety measures for reliable operation');
  }

  return findings;
}

/**
 * Singleton instance
 */
class PFASRiskEngine {
  /**
   * Assess compliance risk for PFAS system
   */
  assessRisk(
    systemData: PFASSystemData,
    projectedLifespanMonths: number,
    removalEfficiency: number
  ): PFASRiskAssessment {
    return assessPFASRisk(systemData, projectedLifespanMonths, removalEfficiency);
  }

  /**
   * Generate key findings summary
   */
  generateFindings(
    projectedLifespanMonths: number,
    p95SafeLifeMonths: number,
    removalEfficiency: number,
    costPerMillionGallons: number,
    capacityEstimate: number,
    ebctCalculated: number
  ): string[] {
    return generateKeyFindings(
      projectedLifespanMonths,
      p95SafeLifeMonths,
      removalEfficiency,
      costPerMillionGallons,
      capacityEstimate,
      ebctCalculated
    );
  }
}

let riskEngineInstance: PFASRiskEngine | null = null;

export function getPFASRiskEngine(): PFASRiskEngine {
  if (!riskEngineInstance) {
    riskEngineInstance = new PFASRiskEngine();
  }
  return riskEngineInstance;
}
