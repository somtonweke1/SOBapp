/**
 * Constraint Engine Types
 * Core type definitions for the constraint-based intelligence system
 */

export type ConstraintType =
  | 'geological'
  | 'metallurgical'
  | 'logistical'
  | 'logistics'
  | 'regulatory'
  | 'financial'
  | 'equipment'
  | 'labor'
  | 'environmental'
  | 'resource'
  | 'capacity'
  | 'demand'
  | 'systemic'
  | 'opportunity';

export type ConstraintSeverity = 'critical' | 'major' | 'moderate' | 'minor';

export type ConstraintStatus = 'active' | 'predicted' | 'mitigated' | 'resolved';

export interface QuantifiedImpact {
  financial: {
    min: number;
    max: number;
    expected: number;
    currency: string;
    npvImpact?: number;
  };
  operational: {
    delay?: number; // hours
    throughputReduction?: number; // percentage
    productionLoss?: number; // tonnes/day
    qualityImpact?: number; // percentage
  };
  risk: {
    probability: number; // 0-1
    consequence: number; // 0-10 scale
    riskScore: number; // probability * consequence
  };
}

export interface MitigationAction {
  id: string;
  name: string;
  description: string;
  type: 'preventive' | 'corrective' | 'contingency';
  cost: number;
  timeToImplement: number; // hours
  implementationTime?: number; // days (alias for timeToImplement in different unit)
  effectiveness: number; // 0-1 (percentage reduction in impact)
  npvImpact: number;
  riskReduction: number; // 0-1
  dependencies: string[];
  prerequisites?: string[];
  feasibility: number; // 0-1
}

export interface ConstraintModel {
  id: string;
  name: string;
  description: string;
  type: ConstraintType;
  severity: ConstraintSeverity;
  status: ConstraintStatus;

  // Impact areas
  impactArea: string[]; // e.g., ['mining', 'processing', 'logistics']
  affectedAssets?: string[]; // e.g., ['crusher-1', 'mill-2', 'conveyor-A']

  // Quantified impact
  impact: QuantifiedImpact;

  // Relationships
  dependencies: string[]; // IDs of constraints this depends on
  downstreamImpacts: string[]; // IDs of constraints this triggers

  // Timing
  detectedAt?: Date;
  expectedDuration?: number; // hours
  projectedResolution?: Date;
  timeframe?: {
    start: Date;
    end: Date;
  };

  // Mitigation
  mitigationOptions: MitigationAction[];
  appliedMitigations?: string[]; // IDs of applied mitigations

  // Data sources
  dataSource?: string; // e.g., 'iot-sensor', 'manual-input', 'ml-prediction'
  confidence?: number; // 0-1

  // Metadata
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  metadata?: Record<string, any>;
}

export interface ConstraintDependencyGraph {
  nodes: Array<{
    id: string;
    constraint: ConstraintModel;
    level: number; // depth in dependency tree
  }>;
  edges: Array<{
    from: string;
    to: string;
    type: 'triggers' | 'blocks' | 'amplifies';
    strength: number; // 0-1
  }>;
}

export interface ConstraintScenario {
  id: string;
  name: string;
  description: string;

  // Constraints in this scenario
  constraints: ConstraintModel[];

  // Scenario parameters
  assumptions: Record<string, any>;
  probability: number; // 0-1

  // Impact analysis
  aggregatedImpact: QuantifiedImpact;
  criticalPath: string[]; // Ordered constraint IDs

  // Recommendations
  optimalMitigationPlan: {
    actions: MitigationAction[];
    totalCost: number;
    expectedBenefit: number;
    roi: number;
    implementationSequence: string[];
  };

  // Metadata
  createdAt: Date;
  simulationParameters?: Record<string, any>;
}

export interface ConstraintIntelligence {
  // Historical patterns
  historicalOccurrences: number;
  averageDuration: number;
  averageImpact: QuantifiedImpact;

  // Predictive insights
  predictedOccurrenceDate?: Date;
  predictionConfidence?: number;

  // Benchmarking (network effects)
  industryBenchmark?: {
    averageFrequency: number;
    peerComparison: 'better' | 'average' | 'worse';
    bestPractices: string[];
  };

  // Learning
  successfulMitigations: string[];
  failedMitigations: string[];
  lessonsLearned: string[];
}

export interface ConstraintAlert {
  id: string;
  constraintId: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  actions: {
    label: string;
    action: string;
    params?: Record<string, any>;
  }[];
}

export interface DigitalTwinState {
  // Real-time operational state
  mining: {
    activePits: string[];
    currentProduction: number; // tonnes/day
    oreGrade: Record<string, number>; // element -> grade %
    equipmentStatus: Record<string, 'operational' | 'maintenance' | 'down'>;
  };

  processing: {
    activePlants: string[];
    throughput: number; // tonnes/hour
    recovery: Record<string, number>; // element -> recovery %
    inventoryLevels: Record<string, number>; // stockpile -> tonnes
  };

  logistics: {
    activeRoutes: string[];
    shipmentStatus: Record<string, any>;
    transportCapacity: number;
    bottlenecks: string[];
  };

  // Active constraints
  activeConstraints: ConstraintModel[];
  constraintGraph: ConstraintDependencyGraph;

  // Current scenario
  currentScenario?: ConstraintScenario;
  alternativeScenarios: ConstraintScenario[];

  // Timestamp
  timestamp: Date;
  confidence: number;
}

export interface OptimizationResult {
  scenarioId: string;
  objectiveValue: number;
  feasibility: boolean;
  convergence: 'optimal' | 'feasible' | 'infeasible' | 'timeout';

  // Solution
  solution: {
    mineSequence: any[];
    blendStrategy: any[];
    inventoryPlan: any[];
    mitigationActions: MitigationAction[];
  };

  // Performance metrics
  metrics: {
    npv: number;
    totalCost: number;
    totalRevenue: number;
    productionVolume: number;
    averageGrade: number;
    constraintsSatisfied: number;
    constraintsViolated: number;
  };

  // Sensitivity analysis
  sensitivity: {
    parameter: string;
    impact: number;
    elasticity: number;
  }[];

  computeTime: number;
  iterations?: number;
}

export interface NetworkIntelligence {
  // Aggregate metrics from all customers
  totalConstraintsTracked: number;
  uniqueConstraintPatterns: number;

  // Benchmarking data
  benchmarks: {
    constraintType: ConstraintType;
    averageFrequency: number;
    averageImpact: number;
    bestPerformers: string[]; // anonymized
    improvementOpportunity: number;
  }[];

  // Predictive insights
  emergingConstraints: {
    type: ConstraintType;
    description: string;
    affectedRegions: string[];
    probability: number;
    firstSeenAt: Date;
  }[];

  // Best practices
  mitigationSuccessRates: {
    constraintType: ConstraintType;
    mitigationType: string;
    successRate: number;
    averageCost: number;
    averageBenefit: number;
    sampleSize: number;
  }[];
}
