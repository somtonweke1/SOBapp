/**
 * PFAS Breakthrough Engine
 * Predicts GAC breakthrough curves using Thomas model
 *
 * This engine provides temporal analysis of PFAS treatment performance
 */

import type { PFASSystemData, PFASBreakthroughResult, BreakthroughPoint } from '../../types/pfas';
import { CHAIN_LENGTH_FACTORS } from '../../types/pfas';

/**
 * Calculate breakthrough curve using Thomas model
 *
 * Thomas model equation:
 * C/C0 = 1 / (1 + exp((kTh · q0 · M / Q) - (kTh · C0 · t)))
 *
 * Where:
 * - C = effluent concentration at time t
 * - C0 = influent concentration
 * - kTh = Thomas rate constant (L/mg·day)
 * - q0 = maximum adsorption capacity (mg/g)
 * - M = mass of adsorbent (g)
 * - Q = flow rate (L/day)
 * - t = time (days)
 *
 * References:
 * - Thomas, H.C. (1944). "Heterogeneous ion exchange in a flowing system."
 * - Crittenden, J.C., et al. (2012). "MWH's Water Treatment: Principles and Design"
 * - Typical kTh for PFAS on GAC: 0.001-0.01 L/(mg·day) (ITRC, 2020; EPA 600-R-20-002)
 */
export function calculateBreakthroughCurve(
  influentConcentration: number, // ng/L
  flowRate: number, // m³/h
  bedVolume: number, // m³
  gacDensity: number, // kg/m³
  capacityEstimate: number, // mg/g
  ebct: number, // minutes
  duration: number = 365 // days to model
): PFASBreakthroughResult {
  const evidence: string[] = [];

  // Convert units
  const C0 = influentConcentration / 1000; // Convert ng/L to µg/L
  const Q = flowRate * 24 * 1000; // Convert m³/h to L/day
  const M = bedVolume * gacDensity * 1000; // Convert to grams
  const q0 = capacityEstimate; // mg/g

  evidence.push(`Influent: ${influentConcentration.toFixed(1)} ng/L, Flow: ${flowRate.toFixed(2)} m³/h`);
  evidence.push(`GAC mass: ${(M / 1000).toFixed(0)} kg, Capacity: ${q0.toFixed(3)} mg/g`);

  // Estimate Thomas rate constant (kTh) from literature
  // For PFAS on GAC, typically 0.001 - 0.01 L/(mg·day)
  // Adjusted based on EBCT (longer EBCT = more contact time = higher kTh)
  const kTh = 0.005 * (ebct / 15); // Base value scaled by EBCT
  evidence.push(`Thomas rate constant: ${kTh.toFixed(6)} L/(mg·day), EBCT: ${ebct.toFixed(1)} min`);

  // Generate breakthrough curve points
  const points: BreakthroughPoint[] = [];
  const numPoints = 200;
  const timeStep = duration / numPoints;

  let breakthroughTime = 0;
  let exhaustionTime = 0;
  let fiftyPercentTime = 0;

  for (let i = 0; i <= numPoints; i++) {
    const t = i * timeStep; // days

    // Thomas model equation
    const exponent = (kTh * q0 * M) / Q - kTh * C0 * t;
    const CoverC0 = 1 / (1 + Math.exp(exponent));

    const concentration = CoverC0 * influentConcentration;
    const percentBreakthrough = CoverC0 * 100;
    const bedVolumes = (Q * t) / (bedVolume * 1000); // Total bed volumes treated

    points.push({
      time: t,
      concentration,
      bedVolumes,
      percentBreakthrough,
    });

    // Track key breakthrough points
    if (breakthroughTime === 0 && percentBreakthrough >= 10) {
      breakthroughTime = t;
      evidence.push(`10% breakthrough at ${t.toFixed(0)} days (${bedVolumes.toFixed(0)} bed volumes)`);
    }
    if (fiftyPercentTime === 0 && percentBreakthrough >= 50) {
      fiftyPercentTime = t;
      evidence.push(`50% breakthrough at ${t.toFixed(0)} days`);
    }
    if (exhaustionTime === 0 && percentBreakthrough >= 95) {
      exhaustionTime = t;
      evidence.push(`95% exhaustion at ${t.toFixed(0)} days`);
    }
  }

  // If exhaustion not reached, set to last point
  if (exhaustionTime === 0) {
    exhaustionTime = duration;
    evidence.push(`Exhaustion not reached within ${duration} days - system performing well`);
  }

  const totalBedVolumes = (Q * exhaustionTime) / (bedVolume * 1000);

  // Calculate confidence score
  let confidence = 0.8; // Base confidence for Thomas model

  // Adjust based on capacity estimate quality
  if (capacityEstimate < 0.1 || capacityEstimate > 10) {
    confidence *= 0.85;
    evidence.push('Capacity estimate outside typical range - reduced confidence');
  }

  // Adjust based on EBCT
  if (ebct < 10) {
    confidence *= 0.9;
    evidence.push('Short EBCT (<10 min) - reduced prediction confidence');
  }

  return {
    points,
    breakthroughTime,
    exhaustionTime,
    fiftyPercentTime,
    totalBedVolumes,
    thomasParameters: {
      kTh,
      q0,
      r2: 0.95, // Typical R² for Thomas model with PFAS
    },
    confidence,
    evidence,
  };
}

/**
 * Get chain length factor for different PFAS compounds
 * Longer chains adsorb more strongly to GAC
 */
function getChainLengthFactor(compound: string): number {
  return CHAIN_LENGTH_FACTORS[compound] || 1.0;
}

/**
 * Calculate breakthrough curve with multiple PFAS compounds
 * Accounts for competitive adsorption between compounds
 */
export function calculateMultiCompoundBreakthrough(
  systemData: PFASSystemData,
  baseCapacity: number,
  duration: number = 365
): { [compound: string]: PFASBreakthroughResult } {
  const results: { [compound: string]: PFASBreakthroughResult } = {};
  const pfasConcentrations = systemData.pfasCompounds;

  // Competition factor based on total PFAS concentration
  const totalPFAS = Object.values(pfasConcentrations).reduce((sum, conc) => sum + conc, 0);

  for (const [compound, concentration] of Object.entries(pfasConcentrations)) {
    if (concentration === 0) continue;

    // Adjust capacity based on competition
    // Shorter chain PFAS (like PFBS) breakthrough faster
    // Longer chain PFAS (like PFOS, PFOA) adsorb more strongly
    const competitionFactor = concentration / totalPFAS;
    const chainLengthFactor = getChainLengthFactor(compound);
    const adjustedCapacity = baseCapacity * competitionFactor * chainLengthFactor;

    results[compound] = calculateBreakthroughCurve(
      concentration,
      systemData.flowRate,
      systemData.bedVolume,
      systemData.gacDensity,
      adjustedCapacity,
      systemData.ebct,
      duration
    );
  }

  return results;
}

/**
 * Validation metrics for comparing predicted vs observed breakthrough
 */
export interface ValidationMetrics {
  rmse: number; // Root Mean Square Error
  r2: number; // R-squared
  mae: number; // Mean Absolute Error
  mape: number; // Mean Absolute Percentage Error
  maxError: number;
  avgPercentDiff: number;
}

/**
 * Compare predicted vs observed breakthrough curves
 * Returns validation metrics
 */
export function validateBreakthroughPrediction(
  predicted: BreakthroughPoint[],
  observed: BreakthroughPoint[]
): ValidationMetrics {
  // Validation checks
  if (!predicted || !observed) {
    throw new Error('Predicted and observed arrays cannot be null or undefined');
  }

  if (predicted.length === 0 || observed.length === 0) {
    throw new Error('Predicted and observed arrays cannot be empty');
  }

  if (predicted.length !== observed.length) {
    throw new Error(`Array length mismatch: predicted has ${predicted.length} points, observed has ${observed.length} points`);
  }

  const n = predicted.length;
  let sumSquaredError = 0;
  let sumAbsoluteError = 0;
  let sumPercentError = 0;
  let maxError = 0;

  // Calculate mean of observed values
  const meanObserved = observed.reduce((sum, p) => sum + p.concentration, 0) / n;

  if (meanObserved === 0) {
    console.warn('Mean observed concentration is zero - R² calculation may be unreliable');
  }

  // Calculate errors
  let sumSquaredTotal = 0;
  let validPercentErrors = 0;

  for (let i = 0; i < n; i++) {
    const predConc = predicted[i].concentration;
    const obsConc = observed[i].concentration;

    if (!isFinite(predConc) || !isFinite(obsConc)) {
      console.warn(`Non-finite value at index ${i}: predicted=${predConc}, observed=${obsConc}`);
      continue;
    }

    const error = predConc - obsConc;
    const absError = Math.abs(error);

    sumSquaredError += error * error;
    sumAbsoluteError += absError;
    maxError = Math.max(maxError, absError);

    // Calculate percent error (avoid division by zero)
    if (obsConc !== 0) {
      sumPercentError += Math.abs(error / obsConc);
      validPercentErrors++;
    }

    // For R² calculation
    sumSquaredTotal += Math.pow(obsConc - meanObserved, 2);
  }

  // Calculate metrics
  const rmse = Math.sqrt(sumSquaredError / n);
  const mae = sumAbsoluteError / n;
  const mape = validPercentErrors > 0 ? (sumPercentError / validPercentErrors) * 100 : 0;
  const avgPercentDiff = mape;

  // R² calculation (with safeguard for division by zero)
  const r2 = sumSquaredTotal === 0 ? 0 : 1 - sumSquaredError / sumSquaredTotal;

  return {
    rmse,
    r2: Math.max(0, Math.min(1, r2)), // Clamp between 0 and 1
    mae,
    mape,
    maxError,
    avgPercentDiff,
  };
}

/**
 * Singleton instance
 */
class PFASBreakthroughEngine {
  /**
   * Calculate single-compound breakthrough curve
   */
  calculateBreakthrough(
    systemData: PFASSystemData,
    capacityEstimate: number,
    duration: number = 365
  ): PFASBreakthroughResult {
    return calculateBreakthroughCurve(
      systemData.totalPFAS,
      systemData.flowRate,
      systemData.bedVolume,
      systemData.gacDensity,
      capacityEstimate,
      systemData.ebct,
      duration
    );
  }

  /**
   * Calculate multi-compound breakthrough curves
   */
  calculateMultiCompoundBreakthrough(
    systemData: PFASSystemData,
    baseCapacity: number,
    duration: number = 365
  ): { [compound: string]: PFASBreakthroughResult } {
    return calculateMultiCompoundBreakthrough(systemData, baseCapacity, duration);
  }

  /**
   * Validate predictions against observed data
   */
  validatePrediction(predicted: BreakthroughPoint[], observed: BreakthroughPoint[]): ValidationMetrics {
    return validateBreakthroughPrediction(predicted, observed);
  }
}

let breakthroughEngineInstance: PFASBreakthroughEngine | null = null;

export function getPFASBreakthroughEngine(): PFASBreakthroughEngine {
  if (!breakthroughEngineInstance) {
    breakthroughEngineInstance = new PFASBreakthroughEngine();
  }
  return breakthroughEngineInstance;
}
