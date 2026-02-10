import { NextRequest, NextResponse } from 'next/server';
import { constraintModeler } from '@/services/constraint-engine/constraint-modeler';
import {
  ConstraintModel,
  MitigationAction,
} from '@/services/constraint-engine/types';

/**
 * GET /api/v1/portfolio/recommendations
 * Generate AI-powered portfolio recommendations using constraint engine
 */
export async function GET(request: NextRequest) {
  try {
    // Initialize constraints if needed
    initializePortfolioConstraints();

    // Get all active constraints
    const activeConstraints = constraintModeler.getActiveConstraints();

    // Generate recommendations based on constraint analysis
    const recommendations = generatePortfolioRecommendations(activeConstraints);

    return NextResponse.json({
      success: true,
      data: recommendations,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to generate portfolio recommendations:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate recommendations',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Initialize portfolio-specific constraints
 */
function initializePortfolioConstraints() {
  const activeConstraints = constraintModeler.getActiveConstraints();
  if (activeConstraints.length > 0) {
    return; // Already initialized
  }

  // Portfolio Risk Constraint: DRC Cobalt Concentration
  const drcConcentrationConstraint: ConstraintModel = {
    id: 'portfolio_drc_concentration',
    type: 'resource',
    name: 'DRC Cobalt Concentration Risk',
    description: 'Excessive portfolio exposure to DRC cobalt supply disruptions',
    status: 'active',
    severity: 'critical',
    impactArea: ['portfolio', 'risk', 'supply_chain'],
    dependencies: [],
    downstreamImpacts: ['portfolio_correlation', 'portfolio_liquidity'],
    impact: {
      financial: {
        min: 350000000,
        max: 850000000,
        expected: 550000000,
        currency: 'USD',
      },
      operational: {
        delay: 90,
        throughputReduction: 0.35,
      },
      risk: {
        probability: 0.73,
        consequence: 0.85,
        riskScore: 0.6205,
      },
    },
    mitigationOptions: [
      {
        id: 'rebalance_west_africa',
        name: 'Rebalance to West African Gold',
        description: 'Shift 15% allocation from DRC cobalt to Ghanaian and Burkina Faso gold assets',
        type: 'preventive' as const,
        cost: 12000000,
        timeToImplement: 60 * 24,
        implementationTime: 60,
        effectiveness: 0.65,
        npvImpact: 145000000,
        riskReduction: 0.55,
        feasibility: 0.92,
        dependencies: [],
      },
      {
        id: 'diversify_cobalt_sources',
        name: 'Diversify Cobalt Sources',
        description: 'Add Australian and Indonesian cobalt exposure to reduce concentration',
        type: 'preventive' as const,
        cost: 25000000,
        timeToImplement: 120 * 24,
        implementationTime: 120,
        effectiveness: 0.7,
        npvImpact: 220000000,
        riskReduction: 0.6,
        feasibility: 0.85,
        dependencies: [],
      },
    ],
    timeframe: {
      start: new Date(),
      end: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days
    },
    metadata: {
      currentExposure: 0.73,
      recommendedExposure: 0.45,
      affectedHoldings: 5,
    },
  };

  // Correlation Risk Constraint
  const correlationConstraint: ConstraintModel = {
    id: 'portfolio_correlation_risk',
    type: 'systemic',
    name: 'High Portfolio Correlation Risk',
    description: 'DRC disruption would simultaneously impact 5 of 8 portfolio holdings',
    status: 'active',
    severity: 'major',
    impactArea: ['portfolio', 'correlation', 'risk'],
    dependencies: ['portfolio_drc_concentration'],
    downstreamImpacts: [],
    impact: {
      financial: {
        min: 200000000,
        max: 450000000,
        expected: 325000000,
        currency: 'USD',
      },
      operational: {},
      risk: {
        probability: 0.68,
        consequence: 0.75,
        riskScore: 0.51,
      },
    },
    mitigationOptions: [
      {
        id: 'add_uncorrelated_assets',
        name: 'Add Uncorrelated Assets',
        description: 'Introduce rare earth elements and phosphate holdings to reduce correlation',
        type: 'preventive' as const,
        cost: 35000000,
        timeToImplement: 90 * 24,
        implementationTime: 90,
        effectiveness: 0.6,
        npvImpact: 180000000,
        riskReduction: 0.5,
        feasibility: 0.88,
        dependencies: [],
      },
      {
        id: 'hedging_strategy',
        name: 'Implement Correlation Hedging',
        description: 'Use derivatives to hedge against correlated downside risk',
        type: 'corrective' as const,
        cost: 15000000,
        timeToImplement: 30 * 24,
        implementationTime: 30,
        effectiveness: 0.5,
        npvImpact: 95000000,
        riskReduction: 0.4,
        feasibility: 0.9,
        dependencies: [],
      },
    ],
    timeframe: {
      start: new Date(),
      end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    },
    metadata: {
      correlationCoefficient: 0.68,
      affectedHoldings: 5,
      totalHoldings: 8,
    },
  };

  // Geographic Diversification Opportunity
  const geoDiversificationConstraint: ConstraintModel = {
    id: 'portfolio_geo_diversification',
    type: 'opportunity',
    name: 'Geographic Diversification Opportunity',
    description: 'Network analysis suggests Morocco phosphate presents low-correlation opportunity',
    status: 'active',
    severity: 'moderate',
    impactArea: ['portfolio', 'diversification', 'optimization'],
    dependencies: [],
    downstreamImpacts: [],
    impact: {
      financial: {
        min: -50000000, // Negative = opportunity/benefit
        max: -180000000,
        expected: -120000000,
        currency: 'USD',
      },
      operational: {},
      risk: {
        probability: 0.85,
        consequence: -0.12, // Risk reduction
        riskScore: -0.102,
      },
    },
    mitigationOptions: [
      {
        id: 'morocco_phosphate_allocation',
        name: 'Morocco Phosphate Allocation',
        description: 'Allocate 8-12% to Moroccan phosphate assets for diversification',
        type: 'preventive' as const,
        cost: 20000000,
        timeToImplement: 60 * 24,
        implementationTime: 60,
        effectiveness: 0.6,
        npvImpact: 120000000,
        riskReduction: 0.45,
        feasibility: 0.87,
        dependencies: [],
      },
      {
        id: 'north_africa_expansion',
        name: 'North Africa Mining Expansion',
        description: 'Broader North African mining exposure including Tunisia and Algeria',
        type: 'preventive' as const,
        cost: 45000000,
        timeToImplement: 120 * 24,
        implementationTime: 120,
        effectiveness: 0.7,
        npvImpact: 200000000,
        riskReduction: 0.55,
        feasibility: 0.75,
        dependencies: [],
      },
    ],
    timeframe: {
      start: new Date(),
      end: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days
    },
    metadata: {
      expectedRiskReduction: 0.12,
      correlationWithPortfolio: 0.15,
      stabilityScore: 0.82,
    },
  };

  // Add constraints to modeler
  constraintModeler.addConstraint(drcConcentrationConstraint);
  constraintModeler.addConstraint(correlationConstraint);
  constraintModeler.addConstraint(geoDiversificationConstraint);
}

/**
 * Generate portfolio recommendations from constraint analysis
 */
function generatePortfolioRecommendations(constraints: ConstraintModel[]) {
  const recommendations = [];

  // For each constraint, generate a recommendation
  for (const constraint of constraints) {
    // Quantify total impact including downstream effects
    const totalImpact = constraintModeler.quantifyTotalImpact(constraint.id);

    // Find optimal mitigation
    const optimalMitigations = constraintModeler.findOptimalMitigation(
      constraint.id
    );

    if (optimalMitigations.length === 0) continue;

    // Select top mitigation
    const topMitigation = optimalMitigations[0];

    // Calculate impact metrics
    const impactValue = Math.abs(totalImpact.financial.expected);
    const riskReduction = Math.abs(totalImpact.risk.riskScore) * 100;

    // Determine priority based on severity and impact
    const priority = getPriority(constraint.severity, totalImpact.risk.riskScore);

    // Create recommendation
    const recommendation = {
      id: `rec_${constraint.id}`,
      type: getRecommendationType(constraint),
      priority,
      title: formatRecommendationTitle(constraint, topMitigation),
      description: formatRecommendationDescription(constraint, totalImpact),
      action: {
        title: topMitigation.name,
        description: topMitigation.description,
        cost: topMitigation.cost,
        benefit: topMitigation.npvImpact,
        roi: topMitigation.npvImpact / topMitigation.cost,
        implementationTime: topMitigation.implementationTime,
        feasibility: topMitigation.feasibility,
      },
      impact: {
        financial: impactValue,
        riskReduction,
        affectedAssets: constraint.metadata?.affectedHoldings || 0,
      },
      metadata: {
        constraintId: constraint.id,
        severity: constraint.severity,
        impactArea: constraint.impactArea,
        confidence: topMitigation.feasibility,
      },
    };

    recommendations.push(recommendation);
  }

  // Sort by priority (critical > major > moderate)
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  recommendations.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return recommendations;
}

/**
 * Get priority level for recommendation
 */
function getPriority(
  severity: string,
  riskScore: number
): 'critical' | 'high' | 'medium' | 'low' {
  if (severity === 'critical' || Math.abs(riskScore) > 0.6) return 'critical';
  if (severity === 'major' || Math.abs(riskScore) > 0.4) return 'high';
  if (severity === 'moderate' || Math.abs(riskScore) > 0.2) return 'medium';
  return 'low';
}

/**
 * Get recommendation type
 */
function getRecommendationType(constraint: ConstraintModel): string {
  if (constraint.type === 'opportunity') return 'opportunity';
  if (constraint.severity === 'critical') return 'risk_reduction';
  if (constraint.impactArea.includes('correlation')) return 'correlation_alert';
  return 'rebalance';
}

/**
 * Format recommendation title
 */
function formatRecommendationTitle(
  constraint: ConstraintModel,
  mitigation: MitigationAction
): string {
  if (constraint.type === 'opportunity') {
    return 'Optimization Opportunity Detected';
  }
  if (constraint.severity === 'critical') {
    return `Critical: ${constraint.name}`;
  }
  return constraint.name;
}

/**
 * Format recommendation description
 */
function formatRecommendationDescription(
  constraint: ConstraintModel,
  impact: any
): string {
  const impactValue = Math.abs(impact.financial.expected / 1000000).toFixed(0);
  const riskScore = (Math.abs(impact.risk.riskScore) * 100).toFixed(0);

  if (constraint.type === 'opportunity') {
    return `${constraint.description}. Potential value: $${impactValue}M with ${riskScore}% risk reduction.`;
  }

  return `${constraint.description}. Estimated exposure: $${impactValue}M with ${riskScore}% risk score.`;
}
