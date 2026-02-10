/**
 * PFAS Module Types
 * Type definitions for PFAS compliance intelligence module
 */

export interface PFASCompound {
  name: string;
  concentration: number; // ng/L
  chainLength: number; // Carbon chain length (C4-C12)
  regulatoryLimit?: number; // EPA MCL in ng/L
  compoundType: 'acid' | 'sulfonate';
}

export interface PFASSystemData {
  // System Configuration
  systemType: 'Fixed Bed' | 'Moving Bed' | 'Fluidized Bed';
  vesselDiameter: number; // meters
  vesselHeight: number; // meters
  flowRate: number; // m³/h
  bedHeight: number; // meters
  bedVolume: number; // m³
  ebct: number; // minutes (Empty Bed Contact Time)

  // Water Quality Parameters
  toc: number; // Total Organic Carbon (mg/L)
  sulfate: number; // mg/L
  chloride: number; // mg/L
  alkalinity: number; // mg/L as CaCO3
  hardness: number; // mg/L as CaCO3
  ph: number;
  temperature: number; // °C

  // PFAS Concentrations (ng/L)
  pfasCompounds: {
    PFOA: number; // Perfluorooctanoic acid (C8)
    PFOS: number; // Perfluorooctane sulfonic acid (C8)
    PFNA: number; // Perfluorononanoic acid (C9)
    PFHxA: number; // Perfluorohexanoic acid (C6)
    PFHxS: number; // Perfluorohexane sulfonic acid (C6)
    PFDA: number; // Perfluorodecanoic acid (C10)
    PFBS: number; // Perfluorobutane sulfonic acid (C4)
    PFHpA: number; // Perfluoroheptanoic acid (C7)
    PFUnDA: number; // Perfluoroundecanoic acid (C11)
    PFDoA: number; // Perfluorododecanoic acid (C12)
  };
  totalPFAS: number; // ng/L

  // GAC Properties
  gacType: string;
  gacDensity: number; // kg/m³
  gacParticleSize: number; // mm
  gacIodineNumber: number; // mg/g
  gacSurfaceArea: number; // m²/g

  // Economic Parameters
  gacCostPerKg: number; // USD
  replacementCost: number; // USD
  laborCost: number; // USD
  disposalCost: number; // USD

  // Operational Parameters
  operatingDaysPerYear: number;
  operatingHoursPerDay: number;
  targetRemovalEfficiency: number; // percentage
  safetyFactor: number; // 1.0-5.0
}

export interface PFASCapacityResult {
  baseCapacity: number; // mg/g (Freundlich capacity)
  adjustedCapacity: number; // mg/g (after water quality adjustments)
  tocFactor: number; // TOC adjustment factor
  sulfateFactor: number; // Sulfate adjustment factor
  systemFactor: number; // System type adjustment factor
  freundlichParameters: {
    K: number; // Freundlich constant
    n: number; // Freundlich exponent
  };
  confidence: number; // 0-1 confidence score
  evidence: string[]; // Supporting evidence for capacity estimate
}

export interface BreakthroughPoint {
  time: number; // days
  concentration: number; // ng/L
  bedVolumes: number;
  percentBreakthrough: number; // 0-100%
}

export interface PFASBreakthroughResult {
  points: BreakthroughPoint[];
  breakthroughTime: number; // days (typically at 10% breakthrough)
  exhaustionTime: number; // days (typically at 95% breakthrough)
  fiftyPercentTime: number; // days (50% breakthrough)
  totalBedVolumes: number;
  thomasParameters: {
    kTh: number; // Thomas rate constant (L/mg·day)
    q0: number; // Maximum adsorption capacity (mg/g)
    r2: number; // Goodness of fit
  };
  confidence: number; // 0-1 confidence score
  evidence: string[];
}

export interface PFASRiskAssessment {
  overallRiskScore: number; // 0-10 (mirrors BIS scanner risk scoring)
  riskLevel: 'clear' | 'low' | 'medium' | 'high' | 'critical';
  complianceStatus: 'compliant' | 'approaching_limit' | 'exceeds_limit' | 'critical_exceedance';
  regulatoryGaps: Array<{
    compound: string;
    currentLevel: number; // ng/L
    regulatoryLimit: number; // ng/L
    exceedance: number; // percentage over limit
    citation: string; // EPA/State regulation citation
  }>;
  recommendations: string[];
  estimatedFinesExposure?: number; // USD
  confidence: number; // 0-1
  evidence: string[];
}

export interface PFASEconomicAnalysis {
  projectedLifespanMonths: number;
  capitalAvoidance: number; // USD
  costPerMillionGallons: number; // USD
  p95SafeLifeMonths: number; // 95th percentile safety margin
  monteCarloResults: {
    mean: number;
    p5: number;
    p10: number;
    p90: number;
    p95: number;
    stdDev: number;
  };
  keyFindings: string[];
}

export interface PFASComplianceReport {
  scanId: string;
  timestamp: Date;
  systemData: PFASSystemData;
  capacityAnalysis: PFASCapacityResult;
  breakthroughAnalysis: PFASBreakthroughResult;
  riskAssessment: PFASRiskAssessment;
  economicAnalysis: PFASEconomicAnalysis;
  multiCompoundBreakthrough?: { [compound: string]: PFASBreakthroughResult };
  overallConfidence: number; // 0-1
  summary: {
    totalPFASDetected: number;
    compoundsAboveLimit: number;
    predictedSystemLife: number; // months
    complianceStatus: string;
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  reportFormat: 'json' | 'html' | 'pdf';
}

export interface PFASValidationInput {
  systemData: PFASSystemData;
  pilotStudyData?: {
    observedBreakthrough: BreakthroughPoint[];
    actualCapacity?: number;
    actualLifespan?: number;
  };
}

// EPA Maximum Contaminant Levels (MCLs) - 2024 Final Rule
export const EPA_PFAS_LIMITS: { [compound: string]: number } = {
  PFOA: 4.0, // ng/L (ppt)
  PFOS: 4.0, // ng/L (ppt)
  PFNA: 10.0, // ng/L (ppt)
  PFHxS: 10.0, // ng/L (ppt)
  // Hazard Index approach for PFNA, PFHxS, PFBS, PFHpA (sum must be < 1.0)
};

// Chain length factors for adsorption strength
export const CHAIN_LENGTH_FACTORS: { [compound: string]: number } = {
  PFBA: 0.5, // C4 - Very short chain
  PFBS: 0.6, // C4
  PFPeA: 0.7, // C5
  PFHxA: 0.8, // C6
  PFHxS: 0.9, // C6
  PFHpA: 1.0, // C7
  PFOA: 1.2, // C8 - Well studied
  PFOS: 1.3, // C8 - Strong adsorption
  PFNA: 1.4, // C9
  PFDA: 1.5, // C10
  PFUnDA: 1.6, // C11
  PFDoA: 1.7, // C12 - Very long chain
};
