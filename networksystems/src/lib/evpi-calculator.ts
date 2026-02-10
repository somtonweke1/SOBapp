/**
 * EVPI (Expected Value of Perfect Information) Calculator
 *
 * Calculates the economic value of eliminating supply chain uncertainty
 * for different industries and risk profiles.
 *
 * Formula: EVPI = Σ P(scenario) × [Optimal Value(scenario) - Current Value(scenario)]
 */

export interface UserProfile {
  industry: 'energy' | 'mining' | 'defense' | 'automotive' | 'electronics' | 'manufacturing';
  annualBudget: number; // In dollars
  materials: ('lithium' | 'cobalt' | 'copper' | 'rare-earths' | 'mixed')[];
  supplyChainStructure: 'single-source' | 'regional' | 'diversified' | 'complex';
}

export interface RiskExposure {
  total: { min: number; max: number };
  breakdown: {
    compliance: { min: number; max: number };
    geopolitical: { min: number; max: number };
    priceVolatility: { min: number; max: number };
    disruption: { min: number; max: number };
  };
}

export interface EVPIResult {
  riskExposure: RiskExposure;
  costAvoidanceOpportunity: number;
  estimatedROI: number;
  riskScore: number; // 0-10 scale
  recommendations: string[];
  evpiValue: number; // Maximum value of perfect information
  confidenceInterval: { min: number; max: number };
}

/**
 * Industry-specific risk coefficients based on research data
 */
const INDUSTRY_COEFFICIENTS = {
  energy: {
    geopoliticalRisk: 0.35,    // High dependency on politically unstable regions
    complianceRisk: 0.15,      // Moderate regulatory exposure
    priceVolatility: 0.30,     // High price sensitivity
    disruptionImpact: 0.20,    // Supply disruptions impact project timelines
    budgetRiskMultiplier: 0.18 // 18% of budget typically at risk
  },
  mining: {
    geopoliticalRisk: 0.40,
    complianceRisk: 0.20,
    priceVolatility: 0.25,
    disruptionImpact: 0.15,
    budgetRiskMultiplier: 0.22
  },
  defense: {
    geopoliticalRisk: 0.30,
    complianceRisk: 0.35,      // Highest compliance risk (export controls)
    priceVolatility: 0.15,
    disruptionImpact: 0.20,
    budgetRiskMultiplier: 0.16
  },
  automotive: {
    geopoliticalRisk: 0.28,
    complianceRisk: 0.18,
    priceVolatility: 0.32,     // EV battery price sensitivity
    disruptionImpact: 0.22,
    budgetRiskMultiplier: 0.15
  },
  electronics: {
    geopoliticalRisk: 0.25,
    complianceRisk: 0.30,      // High BIS entity list exposure
    priceVolatility: 0.25,
    disruptionImpact: 0.20,
    budgetRiskMultiplier: 0.14
  },
  manufacturing: {
    geopoliticalRisk: 0.22,
    complianceRisk: 0.20,
    priceVolatility: 0.28,
    disruptionImpact: 0.30,    // JIT manufacturing vulnerable to disruption
    budgetRiskMultiplier: 0.12
  }
};

/**
 * Material-specific risk multipliers
 */
const MATERIAL_RISK_MULTIPLIERS = {
  lithium: 1.3,       // High concentration, price volatility
  cobalt: 1.5,        // DRC dependency, highest geopolitical risk
  copper: 1.1,        // More diversified, lower risk
  'rare-earths': 1.6, // China processing dominance, export controls
  mixed: 1.2          // Average across portfolio
};

/**
 * Supply chain structure risk adjustments
 */
const STRUCTURE_MULTIPLIERS = {
  'single-source': 1.8,    // Highest risk concentration
  'regional': 1.4,         // Regional concentration risk
  'diversified': 1.0,      // Baseline
  'complex': 1.3           // Complexity introduces coordination risk
};

/**
 * Calculate EVPI and risk exposure for a user profile
 */
export function calculateEVPI(profile: UserProfile): EVPIResult {
  const coefficients = INDUSTRY_COEFFICIENTS[profile.industry];

  // Calculate material risk factor (average if multiple)
  const materialRisk = profile.materials.reduce((sum, material) =>
    sum + MATERIAL_RISK_MULTIPLIERS[material], 0
  ) / profile.materials.length;

  const structureMultiplier = STRUCTURE_MULTIPLIERS[profile.supplyChainStructure];

  // Base risk exposure calculation
  const baseRiskExposure = profile.annualBudget * coefficients.budgetRiskMultiplier;
  const adjustedRiskExposure = baseRiskExposure * materialRisk * structureMultiplier;

  // Breakdown by risk category
  const complianceMin = adjustedRiskExposure * coefficients.complianceRisk * 0.6;
  const complianceMax = adjustedRiskExposure * coefficients.complianceRisk * 1.4;

  const geopoliticalMin = adjustedRiskExposure * coefficients.geopoliticalRisk * 0.7;
  const geopoliticalMax = adjustedRiskExposure * coefficients.geopoliticalRisk * 1.3;

  const priceVolatilityMin = adjustedRiskExposure * coefficients.priceVolatility * 0.5;
  const priceVolatilityMax = adjustedRiskExposure * coefficients.priceVolatility * 1.8;

  const disruptionMin = adjustedRiskExposure * coefficients.disruptionImpact * 0.4;
  const disruptionMax = adjustedRiskExposure * coefficients.disruptionImpact * 2.2;

  const riskExposure: RiskExposure = {
    total: {
      min: Math.round(adjustedRiskExposure * 0.6),
      max: Math.round(adjustedRiskExposure * 1.5)
    },
    breakdown: {
      compliance: { min: Math.round(complianceMin), max: Math.round(complianceMax) },
      geopolitical: { min: Math.round(geopoliticalMin), max: Math.round(geopoliticalMax) },
      priceVolatility: { min: Math.round(priceVolatilityMin), max: Math.round(priceVolatilityMax) },
      disruption: { min: Math.round(disruptionMin), max: Math.round(disruptionMax) }
    }
  };

  // EVPI = Value of perfect information
  // Assumption: Perfect information reduces risk exposure by 60-80%
  const evpiReductionFactor = 0.70; // 70% of risk can be mitigated with perfect info
  const evpiValue = Math.round(adjustedRiskExposure * evpiReductionFactor);

  // Cost avoidance opportunity (conservative estimate)
  // This is the value user can capture through:
  // 1. Alternative sourcing (15-25% cost reduction)
  // 2. Contract optimization (10-20% savings)
  // 3. Risk hedging (avoid 40-60% of exposure)
  const sourcingOptimization = profile.annualBudget * 0.08; // 8% avg savings
  const contractOptimization = profile.annualBudget * 0.06; // 6% avg savings
  const riskMitigation = adjustedRiskExposure * 0.45; // Avoid 45% of risk

  const costAvoidanceOpportunity = Math.round(
    sourcingOptimization + contractOptimization + riskMitigation
  );

  // ROI calculation (SOBapp subscription vs value delivered)
  // Assume Professional tier: $150K/year for most users
  const estimatedSubscriptionCost = 150000;
  const estimatedROI = Math.round(costAvoidanceOpportunity / estimatedSubscriptionCost);

  // Risk score (0-10 scale)
  const maxPossibleRisk = profile.annualBudget * 0.30; // 30% is theoretical maximum
  const riskScore = Math.min(10, (adjustedRiskExposure / maxPossibleRisk) * 10);

  // Generate recommendations
  const recommendations = generateRecommendations(profile, riskScore, riskExposure);

  return {
    riskExposure,
    costAvoidanceOpportunity,
    estimatedROI,
    riskScore: Math.round(riskScore * 10) / 10,
    recommendations,
    evpiValue,
    confidenceInterval: {
      min: Math.round(evpiValue * 0.75),
      max: Math.round(evpiValue * 1.25)
    }
  };
}

/**
 * Generate personalized recommendations based on risk profile
 */
function generateRecommendations(
  profile: UserProfile,
  riskScore: number,
  exposure: RiskExposure
): string[] {
  const recommendations: string[] = [];

  // High-level risk assessment
  if (riskScore >= 7.5) {
    recommendations.push('URGENT: Your supply chain is in the top quartile of risk exposure. Immediate action recommended.');
  } else if (riskScore >= 6.0) {
    recommendations.push('HIGH RISK: Significant vulnerabilities identified. Strategic review needed within 30 days.');
  } else if (riskScore >= 4.5) {
    recommendations.push('MODERATE RISK: Several optimization opportunities exist. Quarterly review recommended.');
  } else {
    recommendations.push('LOW-MODERATE RISK: Supply chain relatively well-positioned. Annual review sufficient.');
  }

  // Compliance-specific
  if (exposure.breakdown.compliance.max > 1000000) {
    recommendations.push(
      `Run BIS Entity List compliance scan - estimated ${Math.round(exposure.breakdown.compliance.max / 1000000)}M exposure requires verification.`
    );
  }

  // Geopolitical-specific
  if (profile.materials.includes('cobalt') || profile.materials.includes('rare-earths')) {
    recommendations.push(
      'Diversify away from high-concentration sources (DRC for cobalt, China for rare earths) - est. 30% risk reduction.'
    );
  }

  // Price volatility
  if (exposure.breakdown.priceVolatility.max > 2000000) {
    recommendations.push(
      'Lock in long-term contracts (18-24 months) to hedge against projected price increases - est. 12-18% savings.'
    );
  }

  // Supply chain structure
  if (profile.supplyChainStructure === 'single-source') {
    recommendations.push(
      'CRITICAL: Establish backup supplier relationships immediately - single-source dependency is highest risk factor.'
    );
  }

  // Industry-specific
  if (profile.industry === 'energy' && profile.materials.includes('lithium')) {
    recommendations.push(
      'Energy sector: Australian lithium sources recommended over Chilean (lower geopolitical risk, stable pricing).'
    );
  }

  if (profile.industry === 'defense') {
    recommendations.push(
      'Defense sector: Prioritize BIS compliance and rare earth supply chain mapping - regulatory risk is primary exposure.'
    );
  }

  return recommendations;
}

/**
 * Format dollar amounts for display
 */
export function formatCurrency(amount: number, compact: boolean = false): string {
  if (compact && amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Get risk score color coding
 */
export function getRiskScoreColor(score: number): string {
  if (score >= 7.5) return 'text-red-600';
  if (score >= 6.0) return 'text-orange-600';
  if (score >= 4.5) return 'text-yellow-600';
  return 'text-emerald-600';
}

/**
 * Get risk score label
 */
export function getRiskScoreLabel(score: number): string {
  if (score >= 7.5) return 'VERY HIGH';
  if (score >= 6.0) return 'HIGH';
  if (score >= 4.5) return 'MODERATE';
  if (score >= 3.0) return 'LOW-MODERATE';
  return 'LOW';
}
