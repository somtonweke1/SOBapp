/**
 * PFAS Capacity Engine
 * Estimates GAC adsorption capacity using Freundlich Isotherm model
 *
 * This engine mirrors MIAR's entity resolution approach but for PFAS compounds
 */

import type { PFASSystemData, PFASCapacityResult } from '../../types/pfas';

/**
 * Calculate Empty Bed Contact Time (EBCT) in minutes
 */
export function calculateEBCT(bedVolume: number, flowRate: number): number {
  return (bedVolume / flowRate) * 60; // Convert hours to minutes
}

/**
 * Estimate GAC capacity using Freundlich Isotherm model
 *
 * Freundlich Equation: q = K·C^(1/n)
 * Where: q = adsorption capacity (mg/g), C = concentration (µg/L)
 *
 * References:
 * - Appleman, T.D., et al. (2014). "Treatment of poly- and perfluoroalkyl substances
 *   in U.S. full-scale water treatment systems." Water Research, 51, 246-255.
 * - Kothawala, D.N., et al. (2017). "Influence of dissolved organic matter concentration
 *   and composition on the removal efficiency of perfluoroalkyl substances."
 *   Environmental Science & Technology, 51(13), 7488-7497.
 * - Typical PFAS GAC parameters: K = 0.05-0.30, n = 0.5-0.9 (EPA, 2021)
 */
export function estimateCapacityWithFreundlich(
  pfasConcentration: number,
  toc: number,
  sulfate: number,
  systemType: string
): PFASCapacityResult {
  // Freundlich isotherm parameters for PFAS on GAC
  // K = 0.15 represents mid-range adsorption capacity for mixed PFAS
  // n = 0.7 represents typical non-linearity for PFAS adsorption
  const K = 0.15; // Freundlich constant (mg/g)/(µg/L)^(1/n)
  const n = 0.7; // Freundlich exponent (dimensionless), typically 0.5-0.9 for PFAS

  const evidence: string[] = [];

  // Base capacity calculation using Freundlich equation
  const baseCapacity = K * Math.pow(pfasConcentration, 1 / n);
  evidence.push(`Base Freundlich capacity: ${baseCapacity.toFixed(3)} mg/g (K=${K}, n=${n})`);

  // Adjust for water quality factors
  const tocFactor = Math.max(0.5, 1 - toc / 10); // TOC reduces capacity
  if (toc > 5) {
    evidence.push(`High TOC (${toc} mg/L) reduces capacity by ${((1 - tocFactor) * 100).toFixed(1)}%`);
  }

  const sulfateFactor = Math.max(0.7, 1 - sulfate / 200); // Sulfate competes for sites
  if (sulfate > 100) {
    evidence.push(`Elevated sulfate (${sulfate} mg/L) reduces capacity by ${((1 - sulfateFactor) * 100).toFixed(1)}%`);
  }

  const systemFactor = systemType === 'Fluidized Bed' ? 1.1 : 1.0; // Fluidized beds slightly more efficient
  if (systemType === 'Fluidized Bed') {
    evidence.push('Fluidized bed system provides 10% efficiency boost');
  }

  const adjustedCapacity = Math.max(0.1, baseCapacity * tocFactor * sulfateFactor * systemFactor);
  evidence.push(`Adjusted capacity: ${adjustedCapacity.toFixed(3)} mg/g`);

  // Calculate confidence score based on data quality
  let confidence = 0.8; // Base confidence for Freundlich model

  // Adjust confidence based on concentration range
  if (pfasConcentration < 10 || pfasConcentration > 5000) {
    confidence *= 0.9; // Lower confidence outside typical range
    evidence.push('PFAS concentration outside typical range (10-5000 ng/L) - reduced confidence');
  }

  // Adjust confidence based on water quality interference
  if (toc > 10 || sulfate > 200) {
    confidence *= 0.85;
    evidence.push('High interference from TOC/sulfate - reduced prediction confidence');
  }

  return {
    baseCapacity,
    adjustedCapacity,
    tocFactor,
    sulfateFactor,
    systemFactor,
    freundlichParameters: { K, n },
    confidence,
    evidence,
  };
}

/**
 * Calculate removal efficiency based on system parameters
 * Mirrors the multi-factor analysis approach from BIS scanner
 */
export function calculateRemovalEfficiency(systemData: PFASSystemData): {
  efficiency: number;
  confidence: number;
  evidence: string[];
} {
  const { ebct, gacIodineNumber, ph, temperature } = systemData;
  const evidence: string[] = [];

  // Base efficiency from EBCT (longer contact time = higher efficiency)
  const ebctFactor = Math.min(0.99, 0.7 + (ebct / 30) * 0.25);
  evidence.push(`EBCT factor: ${(ebctFactor * 100).toFixed(1)}% (${ebct.toFixed(1)} minutes)`);

  // GAC quality factor (higher iodine number = better efficiency)
  const gacFactor = Math.min(1.0, 0.5 + (gacIodineNumber / 2000) * 0.4);
  evidence.push(`GAC quality factor: ${(gacFactor * 100).toFixed(1)}% (Iodine: ${gacIodineNumber} mg/g)`);

  // pH factor (optimal around 6-8 for PFAS)
  const phFactor = ph >= 6 && ph <= 8 ? 1.0 : 0.8;
  if (ph < 6 || ph > 8) {
    evidence.push(`Sub-optimal pH (${ph}) reduces efficiency by 20%`);
  }

  // Temperature factor (higher temp = better efficiency up to 25°C)
  const tempFactor = Math.min(1.0, 0.7 + (temperature / 25) * 0.3);
  evidence.push(`Temperature factor: ${(tempFactor * 100).toFixed(1)}% (${temperature}°C)`);

  const efficiency = Math.min(0.99, Math.max(0.5, ebctFactor * gacFactor * phFactor * tempFactor)) * 100;

  // Confidence scoring
  let confidence = 0.85;
  if (ebct < 10) {
    confidence *= 0.9;
    evidence.push('Short EBCT (<10 min) reduces prediction confidence');
  }
  if (gacIodineNumber < 800) {
    confidence *= 0.9;
    evidence.push('Low iodine number (<800) reduces prediction confidence');
  }

  return { efficiency, confidence, evidence };
}

/**
 * Generate normally distributed random numbers using Box-Muller transform
 * Used for Monte Carlo uncertainty analysis
 *
 * Reference: Box, G. E. P. and Muller, M. E. (1958).
 * "A Note on the Generation of Random Normal Deviates".
 */
function boxMullerRandom(mean: number = 0, stdDev: number = 1): number {
  const u1 = Math.max(Math.random(), Number.EPSILON);
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0 * stdDev + mean;
}

/**
 * Run Monte Carlo simulation for uncertainty analysis
 * Provides confidence intervals for capacity estimates
 */
export function runMonteCarloSimulation(
  projectedLife: number,
  uncertainty: number = 0.18,
  iterations: number = 5000,
  useSimplified: boolean = false
): { mean: number; p95: number; p5: number; p10: number; p90: number; stdDev: number } {
  // Simplified mode for production speed
  if (useSimplified) {
    return {
      mean: projectedLife,
      p95: projectedLife * (1 + uncertainty),
      p5: projectedLife * (1 - uncertainty),
      p10: projectedLife * (1 - uncertainty * 0.75),
      p90: projectedLife * (1 + uncertainty * 0.75),
      stdDev: (projectedLife * uncertainty) / 2,
    };
  }

  // Full Monte Carlo simulation with Box-Muller normal distribution
  const results: number[] = [];
  const stdDev = (projectedLife * uncertainty) / 2;

  for (let i = 0; i < iterations; i++) {
    const randomValue = boxMullerRandom(projectedLife, stdDev);
    results.push(Math.max(0, randomValue)); // Ensure non-negative
  }

  // Sort results for percentile calculation
  results.sort((a, b) => a - b);

  // Calculate statistics
  const mean = results.reduce((sum, val) => sum + val, 0) / results.length;
  const variance = results.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / results.length;
  const calculatedStdDev = Math.sqrt(variance);

  // Calculate percentiles
  const p5Index = Math.floor(results.length * 0.05);
  const p10Index = Math.floor(results.length * 0.1);
  const p90Index = Math.floor(results.length * 0.9);
  const p95Index = Math.floor(results.length * 0.95);

  return {
    mean,
    p95: results[p95Index],
    p5: results[p5Index],
    p10: results[p10Index],
    p90: results[p90Index],
    stdDev: calculatedStdDev,
  };
}

/**
 * Calculate cost per million gallons treated
 */
export function calculateCostPerMillionGallons(systemData: PFASSystemData, lifespanMonths: number): number {
  const {
    gacCostPerKg,
    gacDensity,
    bedVolume,
    flowRate,
    operatingDaysPerYear,
    operatingHoursPerDay,
    replacementCost,
    laborCost,
    disposalCost,
  } = systemData;

  // Calculate total GAC mass
  const gacMass = bedVolume * gacDensity; // kg

  // Calculate annual flow
  const annualFlow = flowRate * operatingHoursPerDay * operatingDaysPerYear; // m³/year
  const annualFlowMG = annualFlow * 0.000264172; // Convert m³ to million gallons

  // Calculate costs over lifespan
  const gacCost = gacMass * gacCostPerKg;
  const totalReplacementCost = replacementCost + laborCost + disposalCost;

  // Annualize costs
  const annualGACCost = gacCost / (lifespanMonths / 12);
  const annualReplacementCost = totalReplacementCost / (lifespanMonths / 12);

  const totalAnnualCost = annualGACCost + annualReplacementCost;

  return totalAnnualCost / annualFlowMG;
}

/**
 * Singleton instance
 */
class PFASCapacityEngine {
  /**
   * Main analysis function for GAC capacity estimation
   */
  analyzeCapacity(systemData: PFASSystemData): PFASCapacityResult {
    return estimateCapacityWithFreundlich(
      systemData.totalPFAS,
      systemData.toc,
      systemData.sulfate,
      systemData.systemType
    );
  }

  /**
   * Calculate EBCT for system
   */
  calculateEBCT(systemData: PFASSystemData): number {
    return calculateEBCT(systemData.bedVolume, systemData.flowRate);
  }

  /**
   * Calculate removal efficiency
   */
  calculateRemovalEfficiency(systemData: PFASSystemData): {
    efficiency: number;
    confidence: number;
    evidence: string[];
  } {
    return calculateRemovalEfficiency(systemData);
  }
}

let capacityEngineInstance: PFASCapacityEngine | null = null;

export function getPFASCapacityEngine(): PFASCapacityEngine {
  if (!capacityEngineInstance) {
    capacityEngineInstance = new PFASCapacityEngine();
  }
  return capacityEngineInstance;
}
