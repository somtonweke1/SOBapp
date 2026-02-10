/**
 * Energy Intelligence Service
 *
 * TerraNexus Energy Intelligence - Energy sector-specific supply chain analysis
 * Adapts mining supply chain concepts to energy sector applications
 */

// =============================================================================
// Types & Interfaces
// =============================================================================

export interface EnergyMaterial {
  id: string;
  name: string;
  category: 'nuclear' | 'gas' | 'mro' | 'emissions';
  unit: string;
  criticalityScore: number; // 0-100
  currentPrice: number;
  priceChange: number; // percentage
  currency: string;
}

export interface EnergyConstraint {
  id: string;
  type: 'regulatory' | 'infrastructure' | 'geopolitical' | 'supplier' | 'natural';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  affectedMaterials: string[];
  mitigationStrategies: string[];
  financialImpact?: number; // in USD
}

export interface PowerPlantFacility {
  id: string;
  name: string;
  type: 'nuclear' | 'gas' | 'coal' | 'renewable';
  capacity: number; // MW
  location: {
    state: string;
    coordinates: { lat: number; lng: number };
  };
  operationalStatus: 'online' | 'offline' | 'maintenance' | 'refueling';
  criticalMaterials: string[];
  outageCostPerDay: number; // USD
}

export interface FuelSupplyChain {
  material: string;
  supplier: string;
  leadTime: number; // days
  minimumOrderQuantity: number;
  contractType: 'spot' | 'term' | 'strategic';
  contractExpiry?: string;
  reliability: number; // 0-100
  geopoliticalRisk: 'low' | 'medium' | 'high';
}

export interface EnergyScenario {
  id: string;
  title: string;
  description: string;
  type: 'nuclear_fuel' | 'gas_procurement' | 'mro_parts' | 'emissions' | 'geopolitical';
  materials: string[];
  constraints: EnergyConstraint[];
  valueProposition: string;
  quantifiedBenefits: {
    costReduction: number; // percentage
    riskReduction: number; // percentage
    availabilityImprovement: number; // percentage
    annualSavings: number; // USD
  };
  implementationTimeline: string;
}

// =============================================================================
// Demo Data for Constellation Energy
// =============================================================================

export const CONSTELLATION_DEMO_MATERIALS: EnergyMaterial[] = [
  // Nuclear Materials
  {
    id: 'uranium_u3o8',
    name: 'Uranium U3O8 (Yellowcake)',
    category: 'nuclear',
    unit: 'lb',
    criticalityScore: 95,
    currentPrice: 64.50,
    priceChange: 2.3,
    currency: 'USD',
  },
  {
    id: 'enriched_uranium',
    name: 'Enriched Uranium (LEU)',
    category: 'nuclear',
    unit: 'kg',
    criticalityScore: 98,
    currentPrice: 125000,
    priceChange: 5.8,
    currency: 'USD',
  },
  {
    id: 'fuel_assemblies',
    name: 'Nuclear Fuel Assemblies',
    category: 'nuclear',
    unit: 'assembly',
    criticalityScore: 100,
    currentPrice: 1500000,
    priceChange: 1.2,
    currency: 'USD',
  },
  {
    id: 'zirconium_tubing',
    name: 'Zirconium Alloy Tubing',
    category: 'nuclear',
    unit: 'tonne',
    criticalityScore: 85,
    currentPrice: 45000,
    priceChange: -0.5,
    currency: 'USD',
  },

  // Natural Gas
  {
    id: 'lng',
    name: 'Liquefied Natural Gas (LNG)',
    category: 'gas',
    unit: 'MMBtu',
    criticalityScore: 90,
    currentPrice: 2.85,
    priceChange: -4.2,
    currency: 'USD',
  },
  {
    id: 'pipeline_gas',
    name: 'Pipeline Natural Gas',
    category: 'gas',
    unit: 'MMBtu',
    criticalityScore: 92,
    currentPrice: 2.75,
    priceChange: -3.8,
    currency: 'USD',
  },

  // MRO Critical Parts
  {
    id: 'turbine_blades',
    name: 'Gas Turbine Blades',
    category: 'mro',
    unit: 'unit',
    criticalityScore: 88,
    currentPrice: 125000,
    priceChange: 0.0,
    currency: 'USD',
  },
  {
    id: 'transformer_components',
    name: 'Large Power Transformers',
    category: 'mro',
    unit: 'unit',
    criticalityScore: 90,
    currentPrice: 2500000,
    priceChange: 1.5,
    currency: 'USD',
  },
  {
    id: 'control_systems',
    name: 'Digital Control Systems',
    category: 'mro',
    unit: 'system',
    criticalityScore: 85,
    currentPrice: 750000,
    priceChange: 0.8,
    currency: 'USD',
  },
];

export const CONSTELLATION_DEMO_CONSTRAINTS: EnergyConstraint[] = [
  // Nuclear Constraints
  {
    id: 'russian_import_ban',
    type: 'geopolitical',
    severity: 'critical',
    description: 'Russian Uranium Import Restrictions',
    impact: '15% reduction in global enriched uranium supply',
    affectedMaterials: ['uranium_u3o8', 'enriched_uranium'],
    mitigationStrategies: [
      'Diversify to Kazakhstan and Canadian suppliers',
      'Increase strategic inventory from 6 to 18 months',
      'Accelerate US domestic enrichment capacity expansion',
      'Lock in long-term contracts with Orano and Urenco',
    ],
    financialImpact: 12000000, // $12M additional annual cost
  },
  {
    id: 'enrichment_capacity',
    type: 'infrastructure',
    severity: 'high',
    description: 'Global Enrichment Capacity Constraints',
    impact: '92% utilization rate creating delivery delays',
    affectedMaterials: ['enriched_uranium', 'fuel_assemblies'],
    mitigationStrategies: [
      'Book enrichment capacity 24-36 months in advance',
      'Participate in Centrus HALEU production consortium',
      'Consider toll enrichment agreements',
    ],
    financialImpact: 8000000,
  },
  {
    id: 'nrc_licensing',
    type: 'regulatory',
    severity: 'medium',
    description: 'NRC License Renewal Timelines',
    impact: 'Average 18-24 month approval process for new fuel suppliers',
    affectedMaterials: ['fuel_assemblies', 'zirconium_tubing'],
    mitigationStrategies: [
      'Maintain pre-qualified alternate suppliers',
      'Early engagement with NRC on supplier qualification',
      'Joint qualification with other utilities',
    ],
    financialImpact: 2000000,
  },

  // Gas Constraints
  {
    id: 'pipeline_capacity',
    type: 'infrastructure',
    severity: 'high',
    description: 'Pipeline Capacity Constraints',
    impact: '0.8 Bcf/d reduction during maintenance season',
    affectedMaterials: ['pipeline_gas', 'lng'],
    mitigationStrategies: [
      'Diversify supply basins (Marcellus, Permian, Haynesville)',
      'Increase on-site storage capacity by 50%',
      'Establish backup LNG supply agreements',
      'Use seasonal demand hedging',
    ],
    financialImpact: 5000000,
  },
  {
    id: 'lng_export_competition',
    type: 'geopolitical',
    severity: 'medium',
    description: 'LNG Export Demand Competition',
    impact: '+12% YoY increase in LNG exports tightening domestic supply',
    affectedMaterials: ['lng', 'pipeline_gas'],
    mitigationStrategies: [
      'Lock in long-term supply contracts (3-5 years)',
      'Participate in baseload supply agreements',
      'Geographic diversification of supply points',
    ],
    financialImpact: 6000000,
  },

  // MRO Constraints
  {
    id: 'turbine_lead_times',
    type: 'supplier',
    severity: 'critical',
    description: 'Extended Lead Times for Critical Turbine Parts',
    impact: '18-24 month lead times with single-source suppliers',
    affectedMaterials: ['turbine_blades', 'transformer_components'],
    mitigationStrategies: [
      'Build strategic inventory of critical long-lead parts',
      'Develop alternate suppliers (GE, Siemens, Mitsubishi)',
      'Invest in predictive maintenance to extend part life',
      'Participate in utility consortium for bulk purchasing',
    ],
    financialImpact: 15000000, // Cost of unplanned outage
  },
  {
    id: 'transformer_shortage',
    type: 'supplier',
    severity: 'high',
    description: 'Global Power Transformer Shortage',
    impact: '24-36 month delivery times for large power transformers',
    affectedMaterials: ['transformer_components'],
    mitigationStrategies: [
      'Maintain spare transformer inventory',
      'Implement advanced condition monitoring',
      'Book transformer capacity 3+ years in advance',
      'Consider mobile/temporary transformer solutions',
    ],
    financialImpact: 10000000,
  },
];

export const CONSTELLATION_FACILITIES: PowerPlantFacility[] = [
  {
    id: 'calvert_cliffs',
    name: 'Calvert Cliffs Nuclear Power Plant',
    type: 'nuclear',
    capacity: 1829, // MW
    location: {
      state: 'Maryland',
      coordinates: { lat: 38.4347, lng: -76.4419 },
    },
    operationalStatus: 'online',
    criticalMaterials: ['fuel_assemblies', 'zirconium_tubing', 'control_systems'],
    outageCostPerDay: 2500000, // $2.5M/day
  },
  {
    id: 'nine_mile_point',
    name: 'Nine Mile Point Nuclear Station',
    type: 'nuclear',
    capacity: 1850,
    location: {
      state: 'New York',
      coordinates: { lat: 43.5225, lng: -76.4114 },
    },
    operationalStatus: 'online',
    criticalMaterials: ['fuel_assemblies', 'turbine_blades', 'transformer_components'],
    outageCostPerDay: 3000000,
  },
  {
    id: 'peach_bottom',
    name: 'Peach Bottom Atomic Power Station',
    type: 'nuclear',
    capacity: 2322,
    location: {
      state: 'Pennsylvania',
      coordinates: { lat: 39.7589, lng: -76.2692 },
    },
    operationalStatus: 'refueling',
    criticalMaterials: ['fuel_assemblies', 'enriched_uranium', 'control_systems'],
    outageCostPerDay: 3500000,
  },
  {
    id: 'ginna',
    name: 'R.E. Ginna Nuclear Power Plant',
    type: 'nuclear',
    capacity: 582,
    location: {
      state: 'New York',
      coordinates: { lat: 43.2778, lng: -77.3086 },
    },
    operationalStatus: 'online',
    criticalMaterials: ['fuel_assemblies', 'transformer_components'],
    outageCostPerDay: 1800000,
  },
];

export const CONSTELLATION_DEMO_SCENARIOS: EnergyScenario[] = [
  {
    id: 'nuclear_fuel_security',
    title: 'Uranium Supply Chain Resilience',
    description:
      'Ensure 24/7 reactor fuel availability despite Russian import restrictions and enrichment capacity constraints',
    type: 'nuclear_fuel',
    materials: ['uranium_u3o8', 'enriched_uranium', 'fuel_assemblies', 'zirconium_tubing'],
    constraints: [
      CONSTELLATION_DEMO_CONSTRAINTS[0], // Russian import ban
      CONSTELLATION_DEMO_CONSTRAINTS[1], // Enrichment capacity
      CONSTELLATION_DEMO_CONSTRAINTS[2], // NRC licensing
    ],
    valueProposition:
      'Prevent $50M+ in emergency spot market purchases and avoid reactor shutdowns worth $200M+ in lost generation',
    quantifiedBenefits: {
      costReduction: 3.5, // 3.5% reduction in fuel costs
      riskReduction: 65, // 65% reduction in supply disruption risk
      availabilityImprovement: 2.1, // 2.1% improvement in fleet availability
      annualSavings: 45000000, // $45M annual savings
    },
    implementationTimeline: '12 weeks to full deployment',
  },
  {
    id: 'gas_procurement_optimization',
    title: 'Natural Gas Cost Volatility Management',
    description:
      'Optimize natural gas procurement and logistics to reduce fuel costs amid price volatility and pipeline constraints',
    type: 'gas_procurement',
    materials: ['lng', 'pipeline_gas'],
    constraints: [
      CONSTELLATION_DEMO_CONSTRAINTS[3], // Pipeline capacity
      CONSTELLATION_DEMO_CONSTRAINTS[4], // LNG export competition
    ],
    valueProposition:
      'Reduce fuel costs by 3-5% through optimized procurement timing, basin diversification, and storage strategy',
    quantifiedBenefits: {
      costReduction: 4.2, // 4.2% reduction in gas procurement costs
      riskReduction: 40, // 40% reduction in price spike exposure
      availabilityImprovement: 1.5, // 1.5% improvement in supply reliability
      annualSavings: 28000000, // $28M annual savings (based on ~$670M gas spend)
    },
    implementationTimeline: '8 weeks to initial value',
  },
  {
    id: 'critical_parts_availability',
    title: 'Power Plant MRO Supply Chain Optimization',
    description:
      'Prevent costly unplanned outages through predictive parts management and strategic inventory optimization',
    type: 'mro_parts',
    materials: ['turbine_blades', 'transformer_components', 'control_systems'],
    constraints: [
      CONSTELLATION_DEMO_CONSTRAINTS[5], // Turbine lead times
      CONSTELLATION_DEMO_CONSTRAINTS[6], // Transformer shortage
    ],
    valueProposition:
      'Prevent $2-5M/day outage costs and optimize $50M+ MRO inventory investment',
    quantifiedBenefits: {
      costReduction: 25, // 25% reduction in emergency procurement
      riskReduction: 70, // 70% reduction in parts-related outage risk
      availabilityImprovement: 1.8, // 1.8% improvement in forced outage rate
      annualSavings: 22000000, // $22M (prevented outages + inventory optimization)
    },
    implementationTimeline: '6 weeks to critical parts tracking',
  },
  {
    id: 'integrated_fuel_management',
    title: 'Integrated Nuclear & Gas Fuel Management',
    description:
      'End-to-end visibility and optimization across nuclear and gas fuel supply chains with unified constraint analysis',
    type: 'geopolitical',
    materials: [
      'uranium_u3o8',
      'enriched_uranium',
      'fuel_assemblies',
      'lng',
      'pipeline_gas',
    ],
    constraints: [
      ...CONSTELLATION_DEMO_CONSTRAINTS.filter((c) =>
        ['russian_import_ban', 'enrichment_capacity', 'pipeline_capacity', 'lng_export_competition'].includes(c.id)
      ),
    ],
    valueProposition:
      'Holistic fuel strategy optimization delivering 3-7% NPV improvement on $10B+ generation portfolio',
    quantifiedBenefits: {
      costReduction: 5.8, // 5.8% total fuel cost reduction
      riskReduction: 60, // 60% reduction in critical supply disruptions
      availabilityImprovement: 3.2, // 3.2% improvement in fleet-wide availability
      annualSavings: 95000000, // $95M combined savings
    },
    implementationTimeline: '16 weeks for enterprise deployment',
  },
];

// =============================================================================
// Supply Chain Analysis Functions
// =============================================================================

export class EnergyIntelligenceService {
  /**
   * Calculate supply-demand balance for energy materials
   */
  static calculateSupplyDemandBalance(material: EnergyMaterial): {
    status: 'surplus' | 'balanced' | 'deficit' | 'critical';
    score: number; // -100 to +100
    trend: 'improving' | 'stable' | 'deteriorating';
    forecast: string;
  } {
    // Simplified calculation - in production, this would use real market data
    const criticalityFactor = material.criticalityScore / 100;
    const priceChangeFactor = material.priceChange / 10;

    // Higher criticality + rising prices = potential deficit
    const score = 50 - criticalityFactor * 40 - priceChangeFactor * 20;

    let status: 'surplus' | 'balanced' | 'deficit' | 'critical';
    if (score > 30) status = 'surplus';
    else if (score > 0) status = 'balanced';
    else if (score > -30) status = 'deficit';
    else status = 'critical';

    const trend = material.priceChange > 2 ? 'deteriorating' : material.priceChange < -2 ? 'improving' : 'stable';

    // Generate forecast based on material type
    let forecast = '';
    if (material.category === 'nuclear') {
      if (material.id === 'uranium_u3o8') {
        forecast = '1,200 tonnes global deficit expected through 2026';
      } else if (material.id === 'enriched_uranium') {
        forecast = 'Enrichment capacity at 92% utilization, delays likely';
      } else {
        forecast = 'Stable supply with qualified suppliers';
      }
    } else if (material.category === 'gas') {
      forecast = score < 0 ? '4.2 Bcf/d surplus, but weather-dependent' : 'Tightening due to LNG exports';
    } else {
      forecast = 'Extended lead times persist, strategic inventory recommended';
    }

    return { status, score, trend, forecast };
  }

  /**
   * Calculate plant availability impact score
   */
  static calculatePlantAvailabilityImpact(
    facility: PowerPlantFacility,
    affectedMaterials: string[]
  ): {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    impactScore: number; // 0-100
    potentialOutageCost: number;
    mitigationUrgency: string;
  } {
    const criticalMaterialsAffected = facility.criticalMaterials.filter((m) =>
      affectedMaterials.includes(m)
    ).length;

    const impactScore = (criticalMaterialsAffected / facility.criticalMaterials.length) * 100;

    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (impactScore > 75) riskLevel = 'critical';
    else if (impactScore > 50) riskLevel = 'high';
    else if (impactScore > 25) riskLevel = 'medium';
    else riskLevel = 'low';

    // Assume 7-day outage for critical materials shortage
    const potentialOutageCost = facility.outageCostPerDay * 7 * (impactScore / 100);

    const mitigationUrgency =
      riskLevel === 'critical'
        ? 'Immediate action required (<2 weeks)'
        : riskLevel === 'high'
          ? 'Urgent (2-4 weeks)'
          : riskLevel === 'medium'
            ? 'Plan mitigation (1-2 months)'
            : 'Monitor situation';

    return {
      riskLevel,
      impactScore,
      potentialOutageCost,
      mitigationUrgency,
    };
  }

  /**
   * Generate regulatory compliance status
   */
  static generateRegulatoryStatus(material: string): {
    status: 'compliant' | 'warning' | 'action_required';
    details: string[];
    nextDeadline?: string;
  } {
    // Simplified - in production, integrate with actual regulatory databases
    const nuclearMaterials = ['uranium_u3o8', 'enriched_uranium', 'fuel_assemblies', 'zirconium_tubing'];

    if (nuclearMaterials.includes(material)) {
      return {
        status: 'compliant',
        details: [
          'NRC 10 CFR 50 Appendix B QA program current',
          'Supplier certifications valid through 2026',
          'All material control & accounting reports up to date',
        ],
        nextDeadline: 'Quarterly SQAR due: Dec 31, 2025',
      };
    }

    return {
      status: 'compliant',
      details: ['Standard procurement compliance maintained'],
    };
  }

  /**
   * Calculate total portfolio risk exposure
   */
  static calculatePortfolioRisk(
    facilities: PowerPlantFacility[],
    constraints: EnergyConstraint[]
  ): {
    overallRiskScore: number; // 0-100
    riskBreakdown: {
      nuclear: number;
      gas: number;
      mro: number;
    };
    topRisks: Array<{
      constraint: string;
      affectedCapacity: number; // MW
      financialExposure: number;
    }>;
    diversificationScore: number;
  } {
    // Calculate overall risk
    const criticalConstraints = constraints.filter((c) => c.severity === 'critical').length;
    const highConstraints = constraints.filter((c) => c.severity === 'high').length;

    const overallRiskScore = Math.min(100, criticalConstraints * 25 + highConstraints * 15);

    // Risk by category
    const nuclearRisk =
      constraints
        .filter((c) => c.affectedMaterials.some((m) => m.includes('uranium') || m.includes('fuel')))
        .reduce((sum, c) => sum + (c.severity === 'critical' ? 25 : c.severity === 'high' ? 15 : 10), 0);

    const gasRisk =
      constraints
        .filter((c) => c.affectedMaterials.some((m) => m.includes('gas') || m.includes('lng')))
        .reduce((sum, c) => sum + (c.severity === 'critical' ? 25 : c.severity === 'high' ? 15 : 10), 0);

    const mroRisk =
      constraints
        .filter((c) => c.affectedMaterials.some((m) => m.includes('turbine') || m.includes('transformer')))
        .reduce((sum, c) => sum + (c.severity === 'critical' ? 25 : c.severity === 'high' ? 15 : 10), 0);

    // Top risks
    const topRisks = constraints
      .filter((c) => c.severity === 'critical' || c.severity === 'high')
      .map((c) => {
        const affectedFacilities = facilities.filter((f) =>
          f.criticalMaterials.some((m) => c.affectedMaterials.includes(m))
        );
        const affectedCapacity = affectedFacilities.reduce((sum, f) => sum + f.capacity, 0);

        return {
          constraint: c.description,
          affectedCapacity,
          financialExposure: c.financialImpact || 0,
        };
      })
      .sort((a, b) => b.financialExposure - a.financialExposure)
      .slice(0, 5);

    // Diversification score (higher is better)
    const uniqueSupplierCount = new Set(
      constraints.flatMap((c) => c.mitigationStrategies.filter((s) => s.includes('Diversify') || s.includes('alternate')))
    ).size;
    const diversificationScore = Math.min(100, uniqueSupplierCount * 15 + 40);

    return {
      overallRiskScore,
      riskBreakdown: {
        nuclear: Math.min(100, nuclearRisk),
        gas: Math.min(100, gasRisk),
        mro: Math.min(100, mroRisk),
      },
      topRisks,
      diversificationScore,
    };
  }

  /**
   * Generate executive summary for Constellation Energy
   */
  static generateExecutiveSummary(
    facilities: PowerPlantFacility[],
    materials: EnergyMaterial[],
    constraints: EnergyConstraint[],
    scenarios: EnergyScenario[]
  ): {
    keyFindings: string[];
    criticalActions: Array<{
      priority: 'immediate' | 'urgent' | 'important';
      action: string;
      benefit: string;
      timeline: string;
    }>;
    potentialSavings: {
      annual: number;
      threeYear: number;
      roi: number;
    };
    riskMitigation: {
      currentExposure: number;
      mitigatedExposure: number;
      improvement: number; // percentage
    };
  } {
    const portfolioRisk = this.calculatePortfolioRisk(facilities, constraints);

    const keyFindings = [
      `${constraints.filter((c) => c.severity === 'critical').length} critical supply chain constraints identified affecting ${facilities.length} facilities`,
      `$${(portfolioRisk.topRisks.reduce((sum, r) => sum + r.financialExposure, 0) / 1000000).toFixed(0)}M total financial exposure across nuclear, gas, and MRO supply chains`,
      `Current supplier diversification score: ${portfolioRisk.diversificationScore}/100 (industry benchmark: 75)`,
      `${materials.filter((m) => this.calculateSupplyDemandBalance(m).status === 'deficit').length} materials in supply deficit requiring strategic action`,
    ];

    const criticalActions = [
      {
        priority: 'immediate' as const,
        action: 'Build 18-month strategic uranium inventory',
        benefit: 'Eliminate $12M annual risk from Russian import restrictions',
        timeline: '6 weeks',
      },
      {
        priority: 'immediate' as const,
        action: 'Diversify gas supply basins (add Haynesville)',
        benefit: 'Reduce pipeline constraint risk by 40%',
        timeline: '4 weeks',
      },
      {
        priority: 'urgent' as const,
        action: 'Stock critical turbine parts (18-24 month lead times)',
        benefit: 'Prevent $15M potential unplanned outage',
        timeline: '8 weeks',
      },
      {
        priority: 'important' as const,
        action: 'Lock in enrichment capacity through 2028',
        benefit: 'Avoid 92% utilization bottleneck',
        timeline: '12 weeks',
      },
    ];

    // Calculate potential savings from scenarios
    const annualSavings = scenarios.reduce((sum, s) => sum + s.quantifiedBenefits.annualSavings, 0);
    const threeYearSavings = annualSavings * 2.8; // NPV factor
    const implementationCost = 1500000; // Assumed TerraNexus Enterprise cost
    const roi = threeYearSavings / implementationCost;

    const riskMitigation = {
      currentExposure: portfolioRisk.topRisks.reduce((sum, r) => sum + r.financialExposure, 0),
      mitigatedExposure:
        portfolioRisk.topRisks.reduce((sum, r) => sum + r.financialExposure, 0) * 0.3, // 70% reduction
      improvement: 70,
    };

    return {
      keyFindings,
      criticalActions,
      potentialSavings: {
        annual: annualSavings,
        threeYear: threeYearSavings,
        roi,
      },
      riskMitigation,
    };
  }
}

// =============================================================================
// Export Demo Data for Easy Access
// =============================================================================

export const ConstellationEnergyDemo = {
  materials: CONSTELLATION_DEMO_MATERIALS,
  constraints: CONSTELLATION_DEMO_CONSTRAINTS,
  facilities: CONSTELLATION_FACILITIES,
  scenarios: CONSTELLATION_DEMO_SCENARIOS,

  // Quick access to key metrics
  getQuickStats: () => {
    const totalCapacity = CONSTELLATION_FACILITIES.reduce((sum, f) => sum + f.capacity, 0);
    const totalOutageCost = CONSTELLATION_FACILITIES.reduce((sum, f) => sum + f.outageCostPerDay, 0);
    const criticalConstraints = CONSTELLATION_DEMO_CONSTRAINTS.filter((c) => c.severity === 'critical').length;
    const totalPotentialSavings = CONSTELLATION_DEMO_SCENARIOS.reduce(
      (sum, s) => sum + s.quantifiedBenefits.annualSavings,
      0
    );

    return {
      totalCapacity,
      totalOutageCost,
      criticalConstraints,
      totalPotentialSavings,
    };
  },
};
