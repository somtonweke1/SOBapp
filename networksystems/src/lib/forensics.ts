export const SOB_FORENSICS = {
  // Baltimore DPW Audit Math
  auditWaterBill: (gallons: number, totalBill: number) => {
    const CCF = gallons / 748;
    const expectedMax = (CCF * 17.64) + 41.43;
    return {
      isValid: totalBill <= expectedMax * 1.05,
      discrepancy: Math.max(0, totalBill - expectedMax),
    };
  },

  // Real Estate Lender Stress-Test
  stressTestDSCR: (rent: number, piti: number) => {
    const noi = rent * 0.9;
    const dscr = noi / piti;
    return {
      ratio: dscr.toFixed(2),
      isFundable: dscr >= 1.25,
    };
  },
};
