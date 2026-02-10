/**
 * DPW (Department of Public Works) Water Bill Auditor
 * Detects Baltimore City water billing discrepancies and overcharges
 */

// Baltimore City Water Rate Tiers (as of 2024)
// Based on actual Baltimore City DPW billing structure
const BALTIMORE_WATER_RATES = {
  // Tier 1: First 2,000 gallons (base rate)
  tier1: {
    gallons: 2000,
    ratePerGallon: 0.012, // $0.012 per gallon
    baseCharge: 0, // No base charge for tier 1
  },
  // Tier 2: 2,001 - 10,000 gallons
  tier2: {
    gallons: 10000,
    ratePerGallon: 0.014, // $0.014 per gallon
    baseCharge: 2000 * 0.012, // Tier 1 cost
  },
  // Tier 3: 10,001 - 20,000 gallons
  tier3: {
    gallons: 20000,
    ratePerGallon: 0.016, // $0.016 per gallon
    baseCharge: (2000 * 0.012) + (8000 * 0.014), // Tier 1 + Tier 2 cost
  },
  // Tier 4: Over 20,000 gallons
  tier4: {
    ratePerGallon: 0.018, // $0.018 per gallon
    baseCharge: (2000 * 0.012) + (8000 * 0.014) + (10000 * 0.016), // Tier 1-3 cost
  },
};

// 1 CCF = 748 Gallons (standard conversion)
const CCF_TO_GALLONS = 748;

export interface WaterBillAuditInput {
  meterReadCurrent: number; // Current meter reading in CCF
  meterReadLast: number; // Previous meter reading in CCF
  totalBill: number; // Total bill amount in dollars
  serviceCharge?: number; // Optional service charge (default: $0)
  sewerCharge?: number; // Optional sewer charge (default: 0% of water)
}

export interface WaterBillAuditResult {
  isError: boolean; // True if discrepancy > 10% of total bill
  discrepancyAmount: string; // Dollar amount of discrepancy
  actualGallons: number; // Actual water usage in gallons
  actualCCF: number; // Actual water usage in CCF
  expectedBill: number; // Expected bill based on tiered pricing
  actualBill: number; // Actual bill received
  tierBreakdown: {
    tier: string;
    gallons: number;
    cost: number;
  }[];
  errorPercentage: number; // Percentage error
  recommendation: string; // Action recommendation
  severity: 'low' | 'medium' | 'high' | 'critical'; // Severity level
}

/**
 * Calculate expected water bill based on Baltimore City tiered pricing
 */
function calculateExpectedBill(gallons: number, serviceCharge: number = 0, sewerCharge: number = 0): {
  total: number;
  breakdown: { tier: string; gallons: number; cost: number }[];
} {
  const breakdown: { tier: string; gallons: number; cost: number }[] = [];
  let remainingGallons = gallons;
  let totalCost = 0;

  // Tier 1: First 2,000 gallons
  if (remainingGallons > 0) {
    const tier1Gallons = Math.min(remainingGallons, BALTIMORE_WATER_RATES.tier1.gallons);
    const tier1Cost = tier1Gallons * BALTIMORE_WATER_RATES.tier1.ratePerGallon;
    totalCost += tier1Cost;
    breakdown.push({
      tier: 'Tier 1 (0-2,000 gal)',
      gallons: tier1Gallons,
      cost: parseFloat(tier1Cost.toFixed(2)),
    });
    remainingGallons -= tier1Gallons;
  }

  // Tier 2: 2,001 - 10,000 gallons
  if (remainingGallons > 0) {
    const tier2Max = BALTIMORE_WATER_RATES.tier2.gallons - BALTIMORE_WATER_RATES.tier1.gallons;
    const tier2Gallons = Math.min(remainingGallons, tier2Max);
    const tier2Cost = tier2Gallons * BALTIMORE_WATER_RATES.tier2.ratePerGallon;
    totalCost += tier2Cost;
    breakdown.push({
      tier: 'Tier 2 (2,001-10,000 gal)',
      gallons: tier2Gallons,
      cost: parseFloat(tier2Cost.toFixed(2)),
    });
    remainingGallons -= tier2Gallons;
  }

  // Tier 3: 10,001 - 20,000 gallons
  if (remainingGallons > 0) {
    const tier3Max = BALTIMORE_WATER_RATES.tier3.gallons - BALTIMORE_WATER_RATES.tier2.gallons;
    const tier3Gallons = Math.min(remainingGallons, tier3Max);
    const tier3Cost = tier3Gallons * BALTIMORE_WATER_RATES.tier3.ratePerGallon;
    totalCost += tier3Cost;
    breakdown.push({
      tier: 'Tier 3 (10,001-20,000 gal)',
      gallons: tier3Gallons,
      cost: parseFloat(tier3Cost.toFixed(2)),
    });
    remainingGallons -= tier3Gallons;
  }

  // Tier 4: Over 20,000 gallons
  if (remainingGallons > 0) {
    const tier4Cost = remainingGallons * BALTIMORE_WATER_RATES.tier4.ratePerGallon;
    totalCost += tier4Cost;
    breakdown.push({
      tier: 'Tier 4 (20,000+ gal)',
      gallons: remainingGallons,
      cost: parseFloat(tier4Cost.toFixed(2)),
    });
  }

  // Add service charge
  totalCost += serviceCharge;

  // Add sewer charge (typically 100% of water cost in Baltimore)
  const sewerAmount = sewerCharge > 0 ? totalCost * sewerCharge : totalCost * 1.0; // Default 100%
  totalCost += sewerAmount;

  return {
    total: parseFloat(totalCost.toFixed(2)),
    breakdown,
  };
}

/**
 * Audit a water bill for discrepancies
 */
export const auditWaterBill = (input: WaterBillAuditInput): WaterBillAuditResult => {
  const {
    meterReadCurrent,
    meterReadLast,
    totalBill,
    serviceCharge = 0,
    sewerCharge = 1.0, // Default 100% sewer charge (Baltimore standard)
  } = input;

  // Calculate actual usage
  const actualCCF = meterReadCurrent - meterReadLast;
  const actualGallons = actualCCF * CCF_TO_GALLONS;

  // Calculate expected bill
  const { total: expectedBill, breakdown: tierBreakdown } = calculateExpectedBill(
    actualGallons,
    serviceCharge,
    sewerCharge
  );

  // Calculate discrepancy
  const discrepancy = totalBill - expectedBill;
  const errorPercentage = expectedBill > 0 ? (discrepancy / expectedBill) * 100 : 0;
  const isError = Math.abs(discrepancy) > totalBill * 0.10; // Flag if > 10% error

  // Determine severity
  let severity: 'low' | 'medium' | 'high' | 'critical';
  const absErrorPercent = Math.abs(errorPercentage);
  if (absErrorPercent < 5) {
    severity = 'low';
  } else if (absErrorPercent < 10) {
    severity = 'medium';
  } else if (absErrorPercent < 20) {
    severity = 'high';
  } else {
    severity = 'critical';
  }

  // Generate recommendation
  let recommendation = '';
  if (discrepancy > 0) {
    recommendation = `Potential overcharge detected. Contact DPW at (410) 396-5398 to dispute. Document meter readings: ${meterReadLast} CCF → ${meterReadCurrent} CCF.`;
  } else if (discrepancy < 0) {
    recommendation = `Bill appears lower than expected. Verify meter readings are correct.`;
  } else {
    recommendation = `Bill matches expected calculation. No action needed.`;
  }

  return {
    isError,
    discrepancyAmount: discrepancy.toFixed(2),
    actualGallons: Math.round(actualGallons),
    actualCCF: parseFloat(actualCCF.toFixed(2)),
    expectedBill,
    actualBill: totalBill,
    tierBreakdown,
    errorPercentage: parseFloat(errorPercentage.toFixed(2)),
    recommendation,
    severity,
  };
};

/**
 * Batch audit multiple water bills
 */
export const batchAuditWaterBills = (
  bills: WaterBillAuditInput[]
): WaterBillAuditResult[] => {
  return bills.map(bill => auditWaterBill(bill));
};

/**
 * Detect water bill spikes (>20% increase)
 */
export const detectBillSpike = (
  currentBill: number,
  previousBill: number
): {
  isSpike: boolean;
  increasePercentage: number;
  increaseAmount: number;
  alert: string;
} => {
  const increaseAmount = currentBill - previousBill;
  const increasePercentage = previousBill > 0 ? (increaseAmount / previousBill) * 100 : 0;
  const isSpike = increasePercentage > 20;

  let alert = '';
  if (isSpike) {
    alert = `⚠️ WATER BILL SPIKE DETECTED: ${increasePercentage.toFixed(1)}% increase. Possible leak or billing error. Check meter and contact DPW immediately.`;
  } else {
    alert = `Bill increase within normal range: ${increasePercentage.toFixed(1)}%`;
  }

  return {
    isSpike,
    increasePercentage: parseFloat(increasePercentage.toFixed(2)),
    increaseAmount: parseFloat(increaseAmount.toFixed(2)),
    alert,
  };
};

/**
 * DPW INVERSION ANALYSIS
 * Reverse-engineers what usage would justify a given bill amount
 * This exposes absurd billing by showing: "To justify $900, you'd need 50,000 gallons"
 */
export interface DPWInversionInput {
  totalBill: number; // Bill amount received
  serviceCharge?: number; // Service charge (if known)
  sewerCharge?: number; // Sewer charge multiplier (default: 1.0)
}

export interface DPWInversionResult {
  inferredUsageGallons: number; // What usage would justify this bill
  inferredUsageCCF: number; // Usage in CCF
  isAbsurd: boolean; // True if usage is unrealistic for property type
  absurdityReason: string; // Explanation of why it's absurd
  tierBreakdown: {
    tier: string;
    gallons: number;
    cost: number;
  }[];
  comparison: {
    typical2Bedroom: number; // Typical usage for 2-bedroom rowhome (gallons)
    typical3Bedroom: number; // Typical usage for 3-bedroom rowhome (gallons)
    inferredVsTypical: number; // Ratio of inferred to typical
  };
  recommendation: string;
}

/**
 * Invert DPW bill to calculate what usage would justify it
 * This is the "Billing Inversion" pattern applied to water audits
 */
export const invertDPWBill = (input: DPWInversionInput): DPWInversionResult => {
  const {
    totalBill,
    serviceCharge = 0,
    sewerCharge = 1.0,
  } = input;

  // Remove service charge from bill
  const billAfterService = totalBill - serviceCharge;

  // Account for sewer charge (typically 100% of water cost)
  // If sewerCharge = 1.0, then: totalBill = waterCost + sewerCost = waterCost + (waterCost * 1.0) = 2 * waterCost
  // So: waterCost = billAfterService / (1 + sewerCharge)
  const waterCost = billAfterService / (1 + sewerCharge);

  // Now reverse-calculate gallons from water cost using tiered pricing
  let remainingCost = waterCost;
  let totalGallons = 0;
  const tierBreakdown: Array<{ tier: string; gallons: number; cost: number }> = [];

  // Tier 1: First 2,000 gallons @ $0.012/gallon
  const tier1MaxCost = BALTIMORE_WATER_RATES.tier1.gallons * BALTIMORE_WATER_RATES.tier1.ratePerGallon;
  if (remainingCost >= tier1MaxCost) {
    const tier1Gallons = BALTIMORE_WATER_RATES.tier1.gallons;
    totalGallons += tier1Gallons;
    remainingCost -= tier1MaxCost;
    tierBreakdown.push({
      tier: 'Tier 1 (0-2,000 gal)',
      gallons: tier1Gallons,
      cost: parseFloat(tier1MaxCost.toFixed(2)),
    });
  } else {
    const tier1Gallons = remainingCost / BALTIMORE_WATER_RATES.tier1.ratePerGallon;
    totalGallons += tier1Gallons;
    tierBreakdown.push({
      tier: 'Tier 1 (0-2,000 gal)',
      gallons: parseFloat(tier1Gallons.toFixed(0)),
      cost: parseFloat(remainingCost.toFixed(2)),
    });
    remainingCost = 0;
  }

  // Tier 2: 2,001-10,000 gallons @ $0.014/gallon
  if (remainingCost > 0) {
    const tier2MaxGallons = BALTIMORE_WATER_RATES.tier2.gallons - BALTIMORE_WATER_RATES.tier1.gallons;
    const tier2MaxCost = tier2MaxGallons * BALTIMORE_WATER_RATES.tier2.ratePerGallon;
    if (remainingCost >= tier2MaxCost) {
      totalGallons += tier2MaxGallons;
      remainingCost -= tier2MaxCost;
      tierBreakdown.push({
        tier: 'Tier 2 (2,001-10,000 gal)',
        gallons: tier2MaxGallons,
        cost: parseFloat(tier2MaxCost.toFixed(2)),
      });
    } else {
      const tier2Gallons = remainingCost / BALTIMORE_WATER_RATES.tier2.ratePerGallon;
      totalGallons += tier2Gallons;
      tierBreakdown.push({
        tier: 'Tier 2 (2,001-10,000 gal)',
        gallons: parseFloat(tier2Gallons.toFixed(0)),
        cost: parseFloat(remainingCost.toFixed(2)),
      });
      remainingCost = 0;
    }
  }

  // Tier 3: 10,001-20,000 gallons @ $0.016/gallon
  if (remainingCost > 0) {
    const tier3MaxGallons = BALTIMORE_WATER_RATES.tier3.gallons - BALTIMORE_WATER_RATES.tier2.gallons;
    const tier3MaxCost = tier3MaxGallons * BALTIMORE_WATER_RATES.tier3.ratePerGallon;
    if (remainingCost >= tier3MaxCost) {
      totalGallons += tier3MaxGallons;
      remainingCost -= tier3MaxCost;
      tierBreakdown.push({
        tier: 'Tier 3 (10,001-20,000 gal)',
        gallons: tier3MaxGallons,
        cost: parseFloat(tier3MaxCost.toFixed(2)),
      });
    } else {
      const tier3Gallons = remainingCost / BALTIMORE_WATER_RATES.tier3.ratePerGallon;
      totalGallons += tier3Gallons;
      tierBreakdown.push({
        tier: 'Tier 3 (10,001-20,000 gal)',
        gallons: parseFloat(tier3Gallons.toFixed(0)),
        cost: parseFloat(remainingCost.toFixed(2)),
      });
      remainingCost = 0;
    }
  }

  // Tier 4: 20,000+ gallons @ $0.018/gallon
  if (remainingCost > 0) {
    const tier4Gallons = remainingCost / BALTIMORE_WATER_RATES.tier4.ratePerGallon;
    totalGallons += tier4Gallons;
    tierBreakdown.push({
      tier: 'Tier 4 (20,000+ gal)',
      gallons: parseFloat(tier4Gallons.toFixed(0)),
      cost: parseFloat(remainingCost.toFixed(2)),
    });
  }

  const inferredGallons = Math.round(totalGallons);
  const inferredCCF = parseFloat((inferredGallons / CCF_TO_GALLONS).toFixed(2));

  // Typical usage benchmarks (Baltimore rowhomes)
  const typical2Bedroom = 3000; // ~3,000 gallons/month for 2-bedroom
  const typical3Bedroom = 4500; // ~4,500 gallons/month for 3-bedroom
  const inferredVsTypical = inferredGallons / typical2Bedroom;

  // Determine if usage is absurd
  const isAbsurd = inferredGallons > typical3Bedroom * 3; // More than 3x typical 3-bedroom
  let absurdityReason = '';
  if (isAbsurd) {
    if (inferredGallons > 50000) {
      absurdityReason = `To justify $${totalBill.toFixed(2)}, you'd need ${inferredGallons.toLocaleString()} gallons (${inferredCCF} CCF). This is ${inferredVsTypical.toFixed(1)}x typical usage for a 2-bedroom rowhome. This is physically impossible without a major leak or billing error.`;
    } else if (inferredGallons > 20000) {
      absurdityReason = `To justify $${totalBill.toFixed(2)}, you'd need ${inferredGallons.toLocaleString()} gallons (${inferredCCF} CCF). This is ${inferredVsTypical.toFixed(1)}x typical usage - highly suspicious for a residential property.`;
    } else {
      absurdityReason = `To justify $${totalBill.toFixed(2)}, you'd need ${inferredGallons.toLocaleString()} gallons (${inferredCCF} CCF). This exceeds typical residential usage by ${inferredVsTypical.toFixed(1)}x.`;
    }
  } else {
    absurdityReason = `Inferred usage of ${inferredGallons.toLocaleString()} gallons (${inferredCCF} CCF) is within reasonable range for this bill amount.`;
  }

  let recommendation = '';
  if (isAbsurd) {
    recommendation = `🚨 BILLING ERROR LIKELY: The inferred usage (${inferredGallons.toLocaleString()} gallons) is ${inferredVsTypical.toFixed(1)}x typical for a residential property. This suggests either: (1) Meter reading error, (2) Billing system error, or (3) Undetected leak. Contact DPW at (410) 396-5398 immediately with this analysis. Document your actual meter reading and request a recalculation.`;
  } else {
    recommendation = `Inferred usage appears reasonable. Verify against your actual meter reading to confirm accuracy.`;
  }

  return {
    inferredUsageGallons: inferredGallons,
    inferredUsageCCF: inferredCCF,
    isAbsurd,
    absurdityReason,
    tierBreakdown,
    comparison: {
      typical2Bedroom,
      typical3Bedroom,
      inferredVsTypical: parseFloat(inferredVsTypical.toFixed(2)),
    },
    recommendation,
  };
};
