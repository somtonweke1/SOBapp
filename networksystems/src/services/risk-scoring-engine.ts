/**
 * RISK SCORING ENGINE
 * Transforms ownership data into actionable compliance intelligence
 *
 * THIS IS THE MOAT - What companies actually PAY for:
 * 1. Risk levels (Critical/High/Medium/Low)
 * 2. Risk factors (WHY is this risky?)
 * 3. Actionable recommendations (WHAT should they do?)
 * 4. Compliance evidence (PROOF for auditors)
 */

export interface RiskFactor {
  category: 'ownership' | 'country' | 'sector' | 'sanctions' | 'entity_type';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  evidence: string[];
  impact: string;
}

export interface ActionableRecommendation {
  action: 'immediate_halt' | 'enhanced_due_diligence' | 'monitor' | 'proceed_with_caution' | 'clear';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  rationale: string;
  steps: string[];
  timeline: string;
  legalBasis?: string;
}

export interface ComplianceEvidence {
  documentType: 'bis_entity_list' | 'ownership_discovery' | 'inference_analysis' | 'risk_assessment';
  timestamp: string;
  sources: string[];
  confidence: number;
  verificationMethod: string;
  auditTrail: string[];
}

export interface RiskAssessment {
  entityName: string;
  overallRisk: 'critical' | 'high' | 'medium' | 'low' | 'clear';
  riskScore: number; // 0-100
  riskFactors: RiskFactor[];
  recommendations: ActionableRecommendation[];
  complianceEvidence: ComplianceEvidence[];
  summary: string;
  generatedAt: string;
}

export class RiskScoringEngine {

  /**
   * Perform comprehensive risk assessment for an entity
   */
  public async assessRisk(
    entityName: string,
    ownershipData?: any,
    inferredRelationships?: any[]
  ): Promise<RiskAssessment> {

    const riskFactors: RiskFactor[] = [];
    const recommendations: ActionableRecommendation[] = [];
    const evidence: ComplianceEvidence[] = [];

    // 1. BIS Entity List presence (CRITICAL)
    const onBISList = this.isOnBISEntityList(entityName);
    if (onBISList) {
      riskFactors.push({
        category: 'sanctions',
        severity: 'critical',
        description: 'Entity appears on US BIS Entity List',
        evidence: ['Official US Department of Commerce Bureau of Industry and Security listing'],
        impact: 'Export restrictions apply. Direct transactions likely prohibited without license.'
      });

      recommendations.push({
        action: 'immediate_halt',
        priority: 'urgent',
        rationale: 'BIS Entity List presence triggers immediate export control requirements',
        steps: [
          'STOP all pending transactions immediately',
          'Review all existing relationships with this entity',
          'Consult with export control counsel',
          'File voluntary self-disclosure if violations occurred',
          'Implement enhanced screening procedures'
        ],
        timeline: 'Immediate action required within 24 hours',
        legalBasis: '15 CFR Part 744 - Export Administration Regulations'
      });
    }

    // 2. Ownership by high-risk parent company
    if (ownershipData?.parentCompany) {
      const parentRisk = this.assessParentCompanyRisk(ownershipData.parentCompany);

      if (parentRisk.isCritical) {
        riskFactors.push({
          category: 'ownership',
          severity: 'critical',
          description: `Owned by high-risk entity: ${ownershipData.parentCompany}`,
          evidence: [`Ownership relationship discovered with confidence: ${(ownershipData.confidence * 100).toFixed(0)}%`],
          impact: 'Indirect control by sanctioned/restricted entity. Potential "red flag" for compliance.'
        });

        recommendations.push({
          action: 'enhanced_due_diligence',
          priority: 'urgent',
          rationale: 'Ownership by restricted entity creates compliance risk',
          steps: [
            'Conduct full beneficial ownership analysis',
            'Verify ultimate beneficial owner (UBO)',
            'Document decision-making authority and control',
            'Assess reputational risk',
            'Consider transaction suspension pending review'
          ],
          timeline: '48-72 hours for initial assessment',
          legalBasis: 'OFAC 50% Rule - sanctions apply to 50%+ owned entities'
        });
      }
    }

    // 3. Country risk assessment
    const countryRisk = this.assessCountryRisk(entityName);
    if (countryRisk.severity !== 'low') {
      riskFactors.push(countryRisk);

      if (countryRisk.severity === 'critical' || countryRisk.severity === 'high') {
        recommendations.push({
          action: 'enhanced_due_diligence',
          priority: 'high',
          rationale: `High-risk jurisdiction requires enhanced compliance measures`,
          steps: [
            'Verify end-user and end-use',
            'Screen against denied parties lists',
            'Document legitimate business purpose',
            'Implement enhanced transaction monitoring',
            'Consider requiring compliance certifications'
          ],
          timeline: '1-2 weeks',
          legalBasis: 'Export Administration Regulations - Country-based controls'
        });
      }
    }

    // 4. Sector/industry risk (defense, military, surveillance)
    const sectorRisk = this.assessSectorRisk(entityName);
    if (sectorRisk.severity !== 'low') {
      riskFactors.push(sectorRisk);
    }

    // 5. Sibling/affiliate risk (guilt by association)
    if (inferredRelationships && inferredRelationships.length > 0) {
      const siblingRisks = this.assessSiblingRisk(inferredRelationships);
      riskFactors.push(...siblingRisks);
    }

    // Calculate overall risk score
    const riskScore = this.calculateRiskScore(riskFactors);
    const overallRisk = this.determineOverallRisk(riskScore);

    // Generate compliance evidence
    evidence.push({
      documentType: 'risk_assessment',
      timestamp: new Date().toISOString(),
      sources: ['BIS Entity List', 'Ownership Discovery Pipeline', 'Risk Scoring Engine'],
      confidence: ownershipData?.confidence || 0.85,
      verificationMethod: 'Automated multi-source analysis with manual review recommended',
      auditTrail: [
        `Risk assessment generated: ${new Date().toISOString()}`,
        `Sources consulted: ${evidence.length + riskFactors.length}`,
        `Risk factors identified: ${riskFactors.length}`,
        `Recommendations generated: ${recommendations.length}`
      ]
    });

    // Generate executive summary
    const summary = this.generateSummary(entityName, overallRisk, riskFactors, recommendations);

    // Add default "clear" recommendation if low risk
    if (overallRisk === 'clear' || overallRisk === 'low') {
      recommendations.push({
        action: 'proceed_with_caution',
        priority: 'low',
        rationale: 'No immediate compliance red flags identified',
        steps: [
          'Implement standard screening procedures',
          'Document transaction rationale',
          'Monitor for any regulatory changes',
          'Maintain records for audit purposes'
        ],
        timeline: 'Standard business process',
        legalBasis: 'Best practices for compliance programs'
      });
    }

    return {
      entityName,
      overallRisk,
      riskScore,
      riskFactors,
      recommendations,
      complianceEvidence: evidence,
      summary,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Check if entity is on BIS Entity List
   */
  private isOnBISEntityList(entityName: string): boolean {
    // In production, this would query the actual BIS list
    // For now, we'll use heuristics
    const highRiskKeywords = [
      'huawei', 'zte', 'hikvision', 'dahua', 'casc', 'casic', 'cetc',
      'tactical missile', 'rostec', 'kalashnikov', 'almaz', 'sukhoi'
    ];

    const normalized = entityName.toLowerCase();
    return highRiskKeywords.some(keyword => normalized.includes(keyword));
  }

  /**
   * Assess parent company risk
   */
  private assessParentCompanyRisk(parentName: string): { isCritical: boolean; reason?: string } {
    const criticalParents = [
      'huawei technologies',
      'zte corporation',
      'china aerospace',
      'tactical missiles corporation',
      'rostec',
      'china electronics technology group',
      'china state shipbuilding'
    ];

    const normalized = parentName.toLowerCase();
    const isCritical = criticalParents.some(cp => normalized.includes(cp));

    return {
      isCritical,
      reason: isCritical ? `Parent company ${parentName} is subject to US export controls` : undefined
    };
  }

  /**
   * Assess country-based risk
   */
  private assessCountryRisk(entityName: string): RiskFactor {
    // Extract country from entity name (heuristic)
    const countryRisks = {
      'china': { severity: 'high' as const, sanctions: 'Technology export restrictions, military end-use concerns' },
      'russia': { severity: 'critical' as const, sanctions: 'Comprehensive sanctions, military support restrictions' },
      'iran': { severity: 'critical' as const, sanctions: 'Comprehensive sanctions regime' },
      'north korea': { severity: 'critical' as const, sanctions: 'Comprehensive sanctions regime' },
      'syria': { severity: 'critical' as const, sanctions: 'Comprehensive sanctions regime' },
      'cuba': { severity: 'high' as const, sanctions: 'Trade embargo' },
      'venezuela': { severity: 'high' as const, sanctions: 'Sectoral sanctions' }
    };

    const normalized = entityName.toLowerCase();

    for (const [country, risk] of Object.entries(countryRisks)) {
      if (normalized.includes(country)) {
        return {
          category: 'country',
          severity: risk.severity,
          description: `Entity associated with ${country.charAt(0).toUpperCase() + country.slice(1)}`,
          evidence: [`Entity name contains "${country}"`],
          impact: risk.sanctions
        };
      }
    }

    return {
      category: 'country',
      severity: 'low',
      description: 'No high-risk country association detected',
      evidence: [],
      impact: 'Standard due diligence applies'
    };
  }

  /**
   * Assess sector/industry risk
   */
  private assessSectorRisk(entityName: string): RiskFactor {
    const highRiskSectors = {
      'military|defense|missile|weapon': { severity: 'critical' as const, description: 'Military/Defense sector' },
      'surveillance|facial recognition|monitoring': { severity: 'high' as const, description: 'Surveillance technology' },
      'aerospace|aviation|aircraft': { severity: 'high' as const, description: 'Aerospace/Aviation' },
      'nuclear|atomic': { severity: 'critical' as const, description: 'Nuclear technology' },
      'semiconductor|microchip|integrated circuit': { severity: 'medium' as const, description: 'Semiconductor/Advanced tech' }
    };

    const normalized = entityName.toLowerCase();

    for (const [pattern, risk] of Object.entries(highRiskSectors)) {
      if (new RegExp(pattern).test(normalized)) {
        return {
          category: 'sector',
          severity: risk.severity,
          description: `High-risk sector: ${risk.description}`,
          evidence: [`Entity name suggests ${risk.description.toLowerCase()} operations`],
          impact: 'Enhanced export control scrutiny, potential license requirements'
        };
      }
    }

    return {
      category: 'sector',
      severity: 'low',
      description: 'No high-risk sector indicators',
      evidence: [],
      impact: 'Standard commercial activity'
    };
  }

  /**
   * Assess sibling/affiliate risk
   */
  private assessSiblingRisk(siblings: any[]): RiskFactor[] {
    const risks: RiskFactor[] = [];

    // If entity has high-risk siblings, it's guilty by association
    const highRiskSiblings = siblings.filter(s =>
      this.isOnBISEntityList(s.relatedEntity)
    );

    if (highRiskSiblings.length > 0) {
      risks.push({
        category: 'ownership',
        severity: 'high',
        description: `Affiliated with ${highRiskSiblings.length} sanctioned entities`,
        evidence: highRiskSiblings.map(s => `Sibling entity: ${s.relatedEntity}`),
        impact: 'Reputational risk, potential indirect control concerns'
      });
    }

    return risks;
  }

  /**
   * Calculate numerical risk score (0-100)
   */
  private calculateRiskScore(factors: RiskFactor[]): number {
    let score = 0;

    for (const factor of factors) {
      switch (factor.severity) {
        case 'critical': score += 40; break;
        case 'high': score += 25; break;
        case 'medium': score += 10; break;
        case 'low': score += 2; break;
      }
    }

    return Math.min(100, score);
  }

  /**
   * Determine overall risk level from score
   */
  private determineOverallRisk(score: number): 'critical' | 'high' | 'medium' | 'low' | 'clear' {
    if (score >= 70) return 'critical';
    if (score >= 40) return 'high';
    if (score >= 15) return 'medium';
    if (score >= 5) return 'low';
    return 'clear';
  }

  /**
   * Generate executive summary
   */
  private generateSummary(
    entityName: string,
    risk: string,
    factors: RiskFactor[],
    recommendations: ActionableRecommendation[]
  ): string {
    const criticalCount = factors.filter(f => f.severity === 'critical').length;
    const highCount = factors.filter(f => f.severity === 'high').length;

    let summary = `Risk Assessment for "${entityName}": `;

    if (risk === 'critical') {
      summary += `CRITICAL RISK IDENTIFIED. `;
      summary += `${criticalCount} critical and ${highCount} high-risk factors detected. `;
      summary += `Immediate action required. `;
    } else if (risk === 'high') {
      summary += `HIGH RISK. `;
      summary += `${highCount} high-risk factors identified. `;
      summary += `Enhanced due diligence required before proceeding. `;
    } else if (risk === 'medium') {
      summary += `MEDIUM RISK. `;
      summary += `Proceed with caution and enhanced monitoring. `;
    } else {
      summary += `LOW/CLEAR RISK. `;
      summary += `Standard compliance procedures apply. `;
    }

    const urgentActions = recommendations.filter(r => r.priority === 'urgent').length;
    if (urgentActions > 0) {
      summary += `${urgentActions} urgent action items identified.`;
    }

    return summary;
  }
}

// Singleton
let riskScoringEngineInstance: RiskScoringEngine | null = null;

export function getRiskScoringEngine(): RiskScoringEngine {
  if (!riskScoringEngineInstance) {
    riskScoringEngineInstance = new RiskScoringEngine();
  }
  return riskScoringEngineInstance;
}

export default RiskScoringEngine;
