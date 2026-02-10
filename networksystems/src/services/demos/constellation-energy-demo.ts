/**
 * Constellation Energy Demo Scenario
 * "The Gulf Coast LNG Squeeze"
 *
 * Demonstrates constraint-based intelligence for energy supply chains
 */

import {
  ConstraintModel,
  ConstraintScenario,
  MitigationAction,
  DigitalTwinState,
} from '../constraint-engine/types';
import { constraintModeler } from '../constraint-engine/constraint-modeler';

export interface ConstellationEnergyDemo {
  scenario: ConstraintScenario;
  constraints: ConstraintModel[];
  digitalTwin: DigitalTwinState;
  mitigationOptions: MitigationAction[];
  financialImpact: {
    baseCase: number;
    withMitigation: number;
    savings: number;
    roi: number;
  };
}

/**
 * Create the Gulf Coast LNG Squeeze demo scenario
 */
export function createConstellationDemo(): ConstellationEnergyDemo {
  // 1. Define the primary constraint: Pipeline capacity shortage
  const pipelineConstraint: ConstraintModel = {
    id: 'constraint_pipeline_capacity_gulf',
    name: 'Gulf Coast Pipeline Capacity Shortage',
    description:
      'European cold snap drives 50% spike in LNG exports, constraining pipeline gas to mid-Atlantic plants',
    type: 'logistical',
    severity: 'critical',
    status: 'predicted',

    impactArea: ['fuel_supply', 'generation', 'trading'],
    affectedAssets: [
      'plant_mid_atlantic_1',
      'plant_mid_atlantic_2',
      'plant_mid_atlantic_3',
    ],

    impact: {
      financial: {
        min: 3500000,
        max: 12000000,
        expected: 7800000,
        currency: 'USD',
        npvImpact: -7800000,
      },
      operational: {
        delay: 240, // 10 days in hours
        throughputReduction: 35, // 35% reduction
        productionLoss: 1200, // MW capacity unavailable
      },
      risk: {
        probability: 0.72, // 72% probability
        consequence: 9.2,
        riskScore: 6.62,
      },
    },

    dependencies: [],
    downstreamImpacts: [
      'constraint_spot_market_premium',
      'constraint_trading_exposure',
    ],

    detectedAt: new Date(),
    expectedDuration: 240, // 10 days
    projectedResolution: new Date(Date.now() + 240 * 60 * 60 * 1000),

    mitigationOptions: [], // Will be added separately
    appliedMitigations: [],

    dataSource: 'ml-prediction',
    confidence: 0.87,

    tags: ['natural_gas', 'pipeline', 'lng_export', 'geopolitical'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // 2. Define downstream constraints
  const spotMarketConstraint: ConstraintModel = {
    id: 'constraint_spot_market_premium',
    name: 'Spot Market Price Premium',
    description:
      'Gas spot prices spike 45% due to pipeline constraints and LNG export demand',
    type: 'financial',
    severity: 'major',
    status: 'predicted',

    impactArea: ['fuel_procurement', 'trading', 'margins'],
    affectedAssets: ['trading_desk', 'procurement_team'],

    impact: {
      financial: {
        min: 1200000,
        max: 2500000,
        expected: 1850000,
        currency: 'USD',
        npvImpact: -1850000,
      },
      operational: {},
      risk: {
        probability: 0.85,
        consequence: 7.5,
        riskScore: 6.38,
      },
    },

    dependencies: ['constraint_pipeline_capacity_gulf'],
    downstreamImpacts: [],

    detectedAt: new Date(),
    expectedDuration: 168, // 7 days

    mitigationOptions: [],
    appliedMitigations: [],

    dataSource: 'market-intelligence',
    confidence: 0.82,

    tags: ['pricing', 'spot_market', 'volatility'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const tradingExposureConstraint: ConstraintModel = {
    id: 'constraint_trading_exposure',
    name: 'Unhedged Trading Exposure',
    description:
      'Physical supply constraints expose trading positions to market volatility',
    type: 'financial',
    severity: 'major',
    status: 'predicted',

    impactArea: ['trading', 'risk_management'],
    affectedAssets: ['trading_desk', 'risk_management'],

    impact: {
      financial: {
        min: 800000,
        max: 1500000,
        expected: 1100000,
        currency: 'USD',
        npvImpact: -1100000,
      },
      operational: {},
      risk: {
        probability: 0.68,
        consequence: 6.8,
        riskScore: 4.62,
      },
    },

    dependencies: ['constraint_pipeline_capacity_gulf'],
    downstreamImpacts: [],

    detectedAt: new Date(),

    mitigationOptions: [],
    appliedMitigations: [],

    dataSource: 'trading-system',
    confidence: 0.79,

    tags: ['trading', 'hedging', 'exposure'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // 3. Define mitigation options
  const mitigationOptions: MitigationAction[] = [
    {
      id: 'mitigation_spot_market',
      name: 'Spot Market Purchase',
      description: 'Purchase gas on spot market at premium price',
      type: 'corrective',
      cost: 1850000,
      timeToImplement: 0, // Immediate
      effectiveness: 0.95, // Fully solves supply issue
      npvImpact: 6000000, // Avoids $7.8M loss, costs $1.85M
      riskReduction: 0.92,
      dependencies: [],
      feasibility: 1.0,
    },
    {
      id: 'mitigation_alt_pipeline',
      name: 'Alternative Pipeline Route',
      description:
        'Reroute gas via alternative pipeline (Tennessee Gas Pipeline)',
      type: 'corrective',
      cost: 920000,
      timeToImplement: 72, // 72 hours to arrange
      effectiveness: 0.88,
      npvImpact: 6500000, // Better NPV than spot market
      riskReduction: 0.85,
      dependencies: [],
      prerequisites: ['Capacity verification', 'Contract negotiation'],
      feasibility: 0.85,
    },
    {
      id: 'mitigation_dual_fuel',
      name: 'Dual-Fuel Switching',
      description:
        'Switch to oil firing for dual-fuel capable units (Plants 1 & 2)',
      type: 'corrective',
      cost: 520000, // Oil premium + emissions credits
      timeToImplement: 24, // 24 hours
      effectiveness: 0.75, // Partial solution (2 of 3 plants)
      npvImpact: 7100000, // Best NPV
      riskReduction: 0.70,
      dependencies: [],
      prerequisites: ['Oil inventory check', 'Emissions permit verification'],
      feasibility: 0.92,
    },
    {
      id: 'mitigation_futures_hedge',
      name: 'Futures Hedging',
      description:
        'Purchase natural gas futures contracts to hedge physical exposure',
      type: 'preventive',
      cost: 180000,
      timeToImplement: 2, // 2 hours
      effectiveness: 0.65, // Hedges financial risk, not physical supply
      npvImpact: 750000, // Offsets trading losses
      riskReduction: 0.68,
      dependencies: [],
      feasibility: 0.98,
    },
    {
      id: 'mitigation_demand_response',
      name: 'Demand Response Activation',
      description: 'Activate demand response programs to reduce load',
      type: 'corrective',
      cost: 380000, // Customer incentives
      timeToImplement: 48,
      effectiveness: 0.45,
      npvImpact: 3100000,
      riskReduction: 0.42,
      dependencies: [],
      feasibility: 0.88,
    },
  ];

  // Add mitigations to constraints
  pipelineConstraint.mitigationOptions = mitigationOptions;

  // Add all constraints to modeler
  constraintModeler.addConstraint(pipelineConstraint);
  constraintModeler.addConstraint(spotMarketConstraint);
  constraintModeler.addConstraint(tradingExposureConstraint);

  // 4. Create scenario
  const scenario = constraintModeler.createScenario(
    'Gulf Coast LNG Squeeze',
    'European cold snap drives LNG export surge, constraining pipeline capacity to mid-Atlantic gas plants',
    [
      pipelineConstraint.id,
      spotMarketConstraint.id,
      tradingExposureConstraint.id,
    ],
    {
      trigger: 'European cold snap',
      lngExportIncrease: 0.5, // 50% increase
      pipelineCapacityImpact: -0.35, // 35% reduction
      duration: 10, // days
      affectedRegion: 'Mid-Atlantic',
      weatherPattern: 'arctic_outbreak_europe',
    }
  );

  // 5. Build digital twin state
  const digitalTwin: DigitalTwinState = {
    mining: {
      activePits: [],
      currentProduction: 0,
      oreGrade: {},
      equipmentStatus: {},
    },
    processing: {
      activePlants: [
        'plant_mid_atlantic_1',
        'plant_mid_atlantic_2',
        'plant_mid_atlantic_3',
      ],
      throughput: 0,
      recovery: {},
      inventoryLevels: {
        natural_gas_storage: 12.5, // Days of supply
        oil_storage: 8.2,
      },
    },
    logistics: {
      activeRoutes: [
        'gulf_coast_pipeline',
        'tennessee_gas_pipeline',
        'transco_pipeline',
      ],
      shipmentStatus: {
        gulf_coast_pipeline: 'constrained',
        tennessee_gas_pipeline: 'available',
        transco_pipeline: 'limited',
      },
      transportCapacity: 2400, // MMBtu/day
      bottlenecks: ['gulf_coast_lng_export'],
    },
    activeConstraints: [
      pipelineConstraint,
      spotMarketConstraint,
      tradingExposureConstraint,
    ],
    constraintGraph: constraintModeler.buildDependencyGraph([
      pipelineConstraint.id,
      spotMarketConstraint.id,
      tradingExposureConstraint.id,
    ]),
    currentScenario: scenario,
    alternativeScenarios: [],
    timestamp: new Date(),
    confidence: 0.85,
  };

  // 6. Calculate financial impact
  const baseImpact = scenario.aggregatedImpact.financial.expected;
  const mitigationCost = scenario.optimalMitigationPlan.totalCost;
  const mitigationBenefit = scenario.optimalMitigationPlan.expectedBenefit;

  const financialImpact = {
    baseCase: baseImpact,
    withMitigation: baseImpact - mitigationBenefit + mitigationCost,
    savings: mitigationBenefit - mitigationCost,
    roi: mitigationCost > 0 ? mitigationBenefit / mitigationCost : 0,
  };

  return {
    scenario,
    constraints: [
      pipelineConstraint,
      spotMarketConstraint,
      tradingExposureConstraint,
    ],
    digitalTwin,
    mitigationOptions,
    financialImpact,
  };
}

/**
 * Format demo for presentation/pitch
 */
export function formatDemoForPresentation(
  demo: ConstellationEnergyDemo
): string {
  const { scenario, financialImpact, mitigationOptions } = demo;

  return `
# CONSTELLATION ENERGY: Gulf Coast LNG Squeeze Scenario

## Situation Overview
${scenario.description}

**Probability:** ${(scenario.probability * 100).toFixed(0)}%
**Expected Duration:** ${scenario.constraints[0].expectedDuration! / 24} days
**Affected Assets:** ${scenario.constraints[0].affectedAssets?.join(', ') || 'N/A'}

---

## Financial Impact Analysis

### Base Case (No Action)
- **Expected Loss:** $${(financialImpact.baseCase / 1_000_000).toFixed(1)}M
- **Risk Range:** $${(scenario.aggregatedImpact.financial.min / 1_000_000).toFixed(1)}M - $${(scenario.aggregatedImpact.financial.max / 1_000_000).toFixed(1)}M
- **Risk Score:** ${scenario.aggregatedImpact.risk.riskScore.toFixed(2)}/10

### With Optimal Mitigation
- **Total Cost:** $${(financialImpact.withMitigation / 1_000_000).toFixed(1)}M
- **Net Savings:** $${(financialImpact.savings / 1_000_000).toFixed(1)}M
- **ROI:** ${financialImpact.roi.toFixed(1)}:1

---

## Mitigation Options (Ranked by ROI)

${mitigationOptions
  .sort((a, b) => b.npvImpact / b.cost - a.npvImpact / a.cost)
  .map(
    (m, i) => `
### ${i + 1}. ${m.description}
- **Cost:** $${(m.cost / 1_000_000).toFixed(2)}M
- **NPV Benefit:** $${(m.npvImpact / 1_000_000).toFixed(2)}M
- **ROI:** ${(m.npvImpact / m.cost).toFixed(1)}:1
- **Time to Implement:** ${m.timeToImplement}h
- **Effectiveness:** ${(m.effectiveness * 100).toFixed(0)}%
- **Risk Reduction:** ${(m.riskReduction * 100).toFixed(0)}%
${m.prerequisites ? `- **Prerequisites:** ${m.prerequisites.join(', ')}` : ''}
`
  )
  .join('\n')}

---

## Recommended Action Plan

**Optimal Strategy:** ${scenario.optimalMitigationPlan.actions.map(a => a.description).join(' + ')}

**Implementation Sequence:**
${scenario.optimalMitigationPlan.implementationSequence.map((id, i) => {
  const action = mitigationOptions.find(m => m.id === id);
  return `${i + 1}. ${action?.description} (T+${action?.timeToImplement}h)`;
}).join('\n')}

**Financial Outcome:**
- Total Investment: $${(scenario.optimalMitigationPlan.totalCost / 1_000_000).toFixed(2)}M
- Expected Benefit: $${(scenario.optimalMitigationPlan.expectedBenefit / 1_000_000).toFixed(2)}M
- Net Value: $${((scenario.optimalMitigationPlan.expectedBenefit - scenario.optimalMitigationPlan.totalCost) / 1_000_000).toFixed(2)}M
- **ROI: ${scenario.optimalMitigationPlan.roi.toFixed(1)}:1**

---

## Trading Desk Integration

**Automatic Alerts Sent:**
- ✅ Physical constraint identified: Gulf Coast pipeline capacity
- ✅ Price spike predicted: +45% on spot market
- ✅ Hedge recommendation: Purchase ${(1100000 / 3.5).toFixed(0)} MMBtu futures contracts
- ✅ Estimated hedge value: $400k-$600k

---

## Key Takeaways

1. **Predictive Intelligence:** Identified constraint 10 days before impact
2. **Financial Clarity:** Quantified risk: $${(financialImpact.baseCase / 1_000_000).toFixed(1)}M exposure
3. **Optimal Strategy:** Clear action plan with ${financialImpact.roi.toFixed(1)}:1 ROI
4. **Integrated Response:** Trading desk automatically alerted for hedging

**Bottom Line:** Transform supply constraints from surprises into strategic advantages.
  `.trim();
}

/**
 * Generate demo visualization data
 */
export function generateDemoVisualization(demo: ConstellationEnergyDemo) {
  return {
    timeline: {
      events: [
        {
          time: 0,
          event: 'European cold snap begins',
          impact: 'LNG export demand spikes',
        },
        {
          time: 24,
          event: 'Pipeline capacity constraint detected',
          impact: 'SOBapp alert triggered',
        },
        {
          time: 48,
          event: 'Mitigation plan generated',
          impact: 'Options presented to operations team',
        },
        {
          time: 72,
          event: 'Alternative pipeline secured',
          impact: 'Supply disruption avoided',
        },
        {
          time: 168,
          event: 'LNG export demand normalizes',
          impact: 'Constraint resolved',
        },
      ],
    },
    constraintMap: {
      nodes: demo.constraints.map(c => ({
        id: c.id,
        label: c.name,
        type: c.type,
        severity: c.severity,
        impact: c.impact.financial.expected,
      })),
      edges: demo.digitalTwin.constraintGraph.edges,
    },
    financialWaterfall: [
      {
        category: 'Base Impact',
        value: -demo.financialImpact.baseCase,
        cumulative: -demo.financialImpact.baseCase,
      },
      {
        category: 'Mitigation Benefit',
        value: demo.scenario.optimalMitigationPlan.expectedBenefit,
        cumulative:
          -demo.financialImpact.baseCase +
          demo.scenario.optimalMitigationPlan.expectedBenefit,
      },
      {
        category: 'Mitigation Cost',
        value: -demo.scenario.optimalMitigationPlan.totalCost,
        cumulative: -demo.financialImpact.withMitigation,
      },
      {
        category: 'Net Impact',
        value: 0,
        cumulative: -demo.financialImpact.withMitigation,
      },
    ],
  };
}
