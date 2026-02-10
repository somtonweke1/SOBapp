/**
 * PFAS Compliance Scanner Tests
 * Comprehensive test suite for PFAS module
 *
 * Mirrors the BIS scanner test structure
 */

import { getPFASComplianceScanner } from '../services/pfas/pfas-compliance-scanner';
import { getPFASCapacityEngine } from '../services/pfas/pfas-capacity-engine';
import { getPFASBreakthroughEngine } from '../services/pfas/pfas-breakthrough-engine';
import { getPFASRiskEngine } from '../services/pfas/pfas-risk-engine';
import type { PFASSystemData } from '../types/pfas';

// ============================================
// TEST DATA
// ============================================

const createTestSystemData = (overrides?: Partial<PFASSystemData>): PFASSystemData => ({
  systemType: 'Fixed Bed',
  vesselDiameter: 2.5,
  vesselHeight: 3.0,
  flowRate: 100, // m³/h
  bedHeight: 2.0,
  bedVolume: 10, // m³
  ebct: 15, // minutes

  toc: 3.0, // mg/L
  sulfate: 50, // mg/L
  chloride: 30, // mg/L
  alkalinity: 100, // mg/L
  hardness: 150, // mg/L
  ph: 7.0,
  temperature: 20, // °C

  pfasCompounds: {
    PFOA: 25.0, // ng/L (exceeds EPA MCL of 4.0)
    PFOS: 15.0, // ng/L (exceeds EPA MCL of 4.0)
    PFNA: 5.0, // ng/L (below EPA guideline of 10.0)
    PFHxA: 8.0,
    PFHxS: 12.0,
    PFDA: 3.0,
    PFBS: 10.0,
    PFHpA: 4.0,
    PFUnDA: 2.0,
    PFDoA: 1.0,
  },
  totalPFAS: 85.0, // ng/L

  gacType: 'Coconut Shell',
  gacDensity: 450, // kg/m³
  gacParticleSize: 1.5, // mm
  gacIodineNumber: 1000, // mg/g
  gacSurfaceArea: 1200, // m²/g

  gacCostPerKg: 3.5, // USD
  replacementCost: 15000,
  laborCost: 5000,
  disposalCost: 3000,

  operatingDaysPerYear: 365,
  operatingHoursPerDay: 24,
  targetRemovalEfficiency: 95, // %
  safetyFactor: 1.5,

  ...overrides,
});

// ============================================
// CAPACITY ENGINE TESTS
// ============================================

describe('PFAS Capacity Engine', () => {
  const capacityEngine = getPFASCapacityEngine();

  test('should calculate EBCT correctly', () => {
    const systemData = createTestSystemData();
    const ebct = capacityEngine.calculateEBCT(systemData);

    expect(ebct).toBeGreaterThan(0);
    expect(ebct).toBeCloseTo(6, 0); // (10 m³ / 100 m³/h) * 60 = 6 minutes
  });

  test('should estimate capacity with Freundlich model', () => {
    const systemData = createTestSystemData();
    const capacityResult = capacityEngine.analyzeCapacity(systemData);

    expect(capacityResult).toBeDefined();
    expect(capacityResult.baseCapacity).toBeGreaterThan(0);
    expect(capacityResult.adjustedCapacity).toBeGreaterThan(0);
    expect(capacityResult.confidence).toBeGreaterThan(0);
    expect(capacityResult.confidence).toBeLessThanOrEqual(1);
    expect(capacityResult.evidence.length).toBeGreaterThan(0);
  });

  test('should apply TOC and sulfate adjustment factors', () => {
    const highTOCSystem = createTestSystemData({ toc: 15, sulfate: 150 });
    const lowTOCSystem = createTestSystemData({ toc: 1, sulfate: 10 });

    const highTOCResult = capacityEngine.analyzeCapacity(highTOCSystem);
    const lowTOCResult = capacityEngine.analyzeCapacity(lowTOCSystem);

    // Lower TOC/sulfate should result in higher adjusted capacity
    expect(lowTOCResult.adjustedCapacity).toBeGreaterThan(highTOCResult.adjustedCapacity);
  });

  test('should calculate removal efficiency', () => {
    const systemData = createTestSystemData();
    const efficiencyResult = capacityEngine.calculateRemovalEfficiency(systemData);

    expect(efficiencyResult.efficiency).toBeGreaterThan(0);
    expect(efficiencyResult.efficiency).toBeLessThanOrEqual(100);
    expect(efficiencyResult.confidence).toBeGreaterThan(0);
    expect(efficiencyResult.evidence.length).toBeGreaterThan(0);
  });
});

// ============================================
// BREAKTHROUGH ENGINE TESTS
// ============================================

describe('PFAS Breakthrough Engine', () => {
  const breakthroughEngine = getPFASBreakthroughEngine();

  test('should calculate breakthrough curve', () => {
    const systemData = createTestSystemData();
    const capacityEngine = getPFASCapacityEngine();
    const capacityResult = capacityEngine.analyzeCapacity(systemData);

    const breakthroughResult = breakthroughEngine.calculateBreakthrough(
      systemData,
      capacityResult.adjustedCapacity,
      365
    );

    expect(breakthroughResult).toBeDefined();
    expect(breakthroughResult.points.length).toBeGreaterThan(0);
    expect(breakthroughResult.breakthroughTime).toBeGreaterThan(0);
    expect(breakthroughResult.confidence).toBeGreaterThan(0);
  });

  test('should predict breakthrough points correctly', () => {
    const systemData = createTestSystemData();
    const capacityEngine = getPFASCapacityEngine();
    const capacityResult = capacityEngine.analyzeCapacity(systemData);

    const breakthroughResult = breakthroughEngine.calculateBreakthrough(
      systemData,
      capacityResult.adjustedCapacity,
      365
    );

    expect(breakthroughResult.breakthroughTime).toBeLessThan(breakthroughResult.fiftyPercentTime);
    expect(breakthroughResult.fiftyPercentTime).toBeLessThan(breakthroughResult.exhaustionTime);
  });

  test('should calculate multi-compound breakthrough', () => {
    const systemData = createTestSystemData();
    const capacityEngine = getPFASCapacityEngine();
    const capacityResult = capacityEngine.analyzeCapacity(systemData);

    const multiCompoundResult = breakthroughEngine.calculateMultiCompoundBreakthrough(
      systemData,
      capacityResult.adjustedCapacity,
      365
    );

    expect(Object.keys(multiCompoundResult).length).toBeGreaterThan(0);
    expect(multiCompoundResult['PFOA']).toBeDefined();
    expect(multiCompoundResult['PFOS']).toBeDefined();
  });
});

// ============================================
// RISK ENGINE TESTS
// ============================================

describe('PFAS Risk Engine', () => {
  const riskEngine = getPFASRiskEngine();

  test('should assess risk correctly for high PFAS levels', () => {
    const systemData = createTestSystemData({
      pfasCompounds: {
        PFOA: 100.0, // Severely exceeds EPA MCL
        PFOS: 80.0, // Severely exceeds EPA MCL
        PFNA: 50.0,
        PFHxA: 20.0,
        PFHxS: 30.0,
        PFDA: 10.0,
        PFBS: 15.0,
        PFHpA: 8.0,
        PFUnDA: 5.0,
        PFDoA: 3.0,
      },
      totalPFAS: 321.0,
    });

    const riskResult = riskEngine.assessRisk(systemData, 12, 85);

    expect(riskResult.overallRiskScore).toBeGreaterThan(5);
    expect(['high', 'critical']).toContain(riskResult.riskLevel);
    expect(riskResult.regulatoryGaps.length).toBeGreaterThan(0);
    expect(riskResult.recommendations.length).toBeGreaterThan(0);
  });

  test('should classify as clear for low PFAS levels', () => {
    const systemData = createTestSystemData({
      pfasCompounds: {
        PFOA: 2.0, // Below EPA MCL
        PFOS: 1.5, // Below EPA MCL
        PFNA: 3.0,
        PFHxA: 2.0,
        PFHxS: 4.0,
        PFDA: 1.0,
        PFBS: 2.0,
        PFHpA: 1.0,
        PFUnDA: 0.5,
        PFDoA: 0.3,
      },
      totalPFAS: 17.3,
    });

    const riskResult = riskEngine.assessRisk(systemData, 24, 95);

    expect(riskResult.overallRiskScore).toBeLessThan(4);
    expect(['clear', 'low']).toContain(riskResult.riskLevel);
  });

  test('should identify regulatory gaps', () => {
    const systemData = createTestSystemData();
    const riskResult = riskEngine.assessRisk(systemData, 18, 90);

    expect(riskResult.regulatoryGaps.length).toBeGreaterThan(0);

    // PFOA exceeds EPA MCL
    const pfoaGap = riskResult.regulatoryGaps.find((g) => g.compound === 'PFOA');
    expect(pfoaGap).toBeDefined();
    expect(pfoaGap!.currentLevel).toBe(25.0);
    expect(pfoaGap!.regulatoryLimit).toBe(4.0);
  });

  test('should estimate regulatory fines for violations', () => {
    const systemData = createTestSystemData();
    const riskResult = riskEngine.assessRisk(systemData, 12, 85);

    if (riskResult.regulatoryGaps.length > 0) {
      expect(riskResult.estimatedFinesExposure).toBeGreaterThan(0);
    }
  });
});

// ============================================
// FULL COMPLIANCE SCANNER TESTS
// ============================================

describe('PFAS Compliance Scanner Integration', () => {
  const scanner = getPFASComplianceScanner();

  test('should perform complete compliance analysis', async () => {
    const systemData = createTestSystemData();
    const report = await scanner.analyzePFASCompliance(systemData);

    expect(report).toBeDefined();
    expect(report.scanId).toBeDefined();
    expect(report.capacityAnalysis).toBeDefined();
    expect(report.breakthroughAnalysis).toBeDefined();
    expect(report.riskAssessment).toBeDefined();
    expect(report.economicAnalysis).toBeDefined();
    expect(report.summary).toBeDefined();
  });

  test('should calculate overall confidence correctly', async () => {
    const systemData = createTestSystemData();
    const report = await scanner.analyzePFASCompliance(systemData);

    expect(report.overallConfidence).toBeGreaterThan(0);
    expect(report.overallConfidence).toBeLessThanOrEqual(1);
  });

  test('should include multi-compound analysis when requested', async () => {
    const systemData = createTestSystemData();
    const report = await scanner.analyzePFASCompliance(systemData, {
      includeMultiCompound: true,
    });

    expect(report.multiCompoundBreakthrough).toBeDefined();
    expect(Object.keys(report.multiCompoundBreakthrough!).length).toBeGreaterThan(0);
  });

  test('should generate accurate summary', async () => {
    const systemData = createTestSystemData();
    const report = await scanner.analyzePFASCompliance(systemData);

    expect(report.summary.totalPFASDetected).toBeGreaterThan(0);
    expect(report.summary.compoundsAboveLimit).toBeGreaterThan(0); // PFOA and PFOS exceed limits
    expect(report.summary.predictedSystemLife).toBeGreaterThan(0);
    expect(['low', 'medium', 'high', 'critical']).toContain(report.summary.urgencyLevel);
  });

  test('should perform quick analysis', async () => {
    const systemData = createTestSystemData();
    const quickResult = await scanner.quickAnalysis(systemData);

    expect(quickResult).toBeDefined();
    expect(quickResult.riskLevel).toBeDefined();
    expect(quickResult.projectedLifeMonths).toBeGreaterThan(0);
    expect(quickResult.urgentIssues).toBeGreaterThan(0);
  });
});

// ============================================
// ECONOMIC ANALYSIS TESTS
// ============================================

describe('PFAS Economic Analysis', () => {
  const scanner = getPFASComplianceScanner();

  test('should calculate projected lifespan', async () => {
    const systemData = createTestSystemData();
    const report = await scanner.analyzePFASCompliance(systemData);

    expect(report.economicAnalysis.projectedLifespanMonths).toBeGreaterThan(0);
    expect(report.economicAnalysis.p95SafeLifeMonths).toBeGreaterThan(0);
  });

  test('should perform Monte Carlo simulation', async () => {
    const systemData = createTestSystemData();
    const report = await scanner.analyzePFASCompliance(systemData, {
      monteCarloIterations: 5000,
    });

    const mc = report.economicAnalysis.monteCarloResults;

    expect(mc.mean).toBeGreaterThan(0);
    expect(mc.p5).toBeLessThan(mc.p95);
    expect(mc.p10).toBeLessThan(mc.p90);
    expect(mc.stdDev).toBeGreaterThan(0);
  });

  test('should calculate cost per million gallons', async () => {
    const systemData = createTestSystemData();
    const report = await scanner.analyzePFASCompliance(systemData);

    expect(report.economicAnalysis.costPerMillionGallons).toBeGreaterThan(0);
  });

  test('should calculate capital avoidance', async () => {
    const systemData = createTestSystemData();
    const report = await scanner.analyzePFASCompliance(systemData);

    expect(report.economicAnalysis.capitalAvoidance).toBeGreaterThan(0);
  });
});

// ============================================
// EDGE CASES & VALIDATION
// ============================================

describe('PFAS Scanner Edge Cases', () => {
  const scanner = getPFASComplianceScanner();

  test('should handle very low PFAS concentrations', async () => {
    const systemData = createTestSystemData({
      pfasCompounds: {
        PFOA: 0.1,
        PFOS: 0.1,
        PFNA: 0.1,
        PFHxA: 0.1,
        PFHxS: 0.1,
        PFDA: 0.1,
        PFBS: 0.1,
        PFHpA: 0.1,
        PFUnDA: 0.1,
        PFDoA: 0.1,
      },
      totalPFAS: 1.0,
    });

    const report = await scanner.analyzePFASCompliance(systemData);

    expect(report).toBeDefined();
    expect(report.riskAssessment.riskLevel).toBe('clear');
  });

  test('should handle very high PFAS concentrations', async () => {
    const systemData = createTestSystemData({
      pfasCompounds: {
        PFOA: 1000.0,
        PFOS: 800.0,
        PFNA: 500.0,
        PFHxA: 300.0,
        PFHxS: 400.0,
        PFDA: 200.0,
        PFBS: 150.0,
        PFHpA: 100.0,
        PFUnDA: 80.0,
        PFDoA: 50.0,
      },
      totalPFAS: 3580.0,
    });

    const report = await scanner.analyzePFASCompliance(systemData);

    expect(report).toBeDefined();
    expect(['high', 'critical']).toContain(report.riskAssessment.riskLevel);
    expect(report.economicAnalysis.projectedLifespanMonths).toBeLessThan(24);
  });

  test('should handle single PFAS compound', async () => {
    const systemData = createTestSystemData({
      pfasCompounds: {
        PFOA: 50.0,
        PFOS: 0,
        PFNA: 0,
        PFHxA: 0,
        PFHxS: 0,
        PFDA: 0,
        PFBS: 0,
        PFHpA: 0,
        PFUnDA: 0,
        PFDoA: 0,
      },
      totalPFAS: 50.0,
    });

    const report = await scanner.analyzePFASCompliance(systemData);

    expect(report).toBeDefined();
    expect(report.summary.totalPFASDetected).toBe(1);
  });
});

console.log('✅ All PFAS compliance scanner tests defined');
