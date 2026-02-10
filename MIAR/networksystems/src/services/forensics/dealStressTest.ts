/**
 * DSCR (Debt Service Coverage Ratio) Stress Test
 * Analyzes real estate deals for fundability and lender requirements
 */

export interface DSCRInput {
  grossRent: number; // Monthly gross rental income
  expenses: number; // Monthly operating expenses (excluding debt service)
  debtService: number; // Monthly debt service (principal + interest)
  vacancyRate?: number; // Vacancy factor (default: 10%)
  operatingExpenseRatio?: number; // Operating expense ratio (default: 50%)
}

export interface DSCRResult {
  ratio: string; // DSCR ratio (formatted to 2 decimals)
  ratioValue: number; // DSCR ratio (raw number)
  status: 'FUNDABLE' | 'MARGINAL' | 'REJECTED'; // Lender status
  noi: number; // Net Operating Income
  maxLoanPossible: number; // Maximum loan amount possible (reverse calculation)
  monthlyPaymentCapacity: number; // Maximum monthly payment at 1.25 DSCR
  recommendation: string; // Action recommendation
  riskLevel: 'low' | 'medium' | 'high'; // Risk assessment
  metrics: {
    grossRent: number;
    vacancyLoss: number;
    effectiveGrossIncome: number;
    operatingExpenses: number;
    netOperatingIncome: number;
    debtService: number;
    dscr: number;
  };
}

/**
 * Calculate DSCR and determine deal fundability
 */
export const calculateDSCR = (input: DSCRInput): DSCRResult => {
  const {
    grossRent,
    expenses,
    debtService,
    vacancyRate = 0.10, // Default 10% vacancy
    operatingExpenseRatio = 0.50, // Default 50% operating expense ratio
  } = input;

  // Calculate Effective Gross Income (EGI)
  const vacancyLoss = grossRent * vacancyRate;
  const effectiveGrossIncome = grossRent - vacancyLoss;

  // Calculate Net Operating Income (NOI)
  // Use provided expenses or calculate from ratio
  const operatingExpenses = expenses > 0 ? expenses : effectiveGrossIncome * operatingExpenseRatio;
  const noi = effectiveGrossIncome - operatingExpenses;

  // Calculate DSCR
  const dscr = debtService > 0 ? noi / debtService : 0;
  const ratioValue = dscr;

  // Determine status
  let status: 'FUNDABLE' | 'MARGINAL' | 'REJECTED';
  if (dscr >= 1.25) {
    status = 'FUNDABLE';
  } else if (dscr >= 1.10) {
    status = 'MARGINAL';
  } else {
    status = 'REJECTED';
  }

  // Calculate maximum loan capacity (reverse DSCR calculation)
  // Target DSCR of 1.25 for lenders
  const targetDSCR = 1.25;
  const monthlyPaymentCapacity = noi / targetDSCR;
  
  // Estimate max loan (assuming 30-year amortization, 7% interest)
  // This is a simplified calculation - actual would require loan terms
  const estimatedMaxLoan = monthlyPaymentCapacity * 150; // Rough estimate

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high';
  if (dscr >= 1.5) {
    riskLevel = 'low';
  } else if (dscr >= 1.25) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }

  // Generate recommendation
  let recommendation = '';
  if (status === 'FUNDABLE') {
    recommendation = `✅ Deal is FUNDABLE. DSCR of ${dscr.toFixed(2)} meets lender requirements (≥1.25). Proceed with confidence.`;
  } else if (status === 'MARGINAL') {
    recommendation = `⚠️ Deal is MARGINAL. DSCR of ${dscr.toFixed(2)} is below preferred threshold (1.25). Consider: (1) Negotiate lower purchase price, (2) Increase rent, (3) Reduce expenses, or (4) Find alternative lenders with lower DSCR requirements.`;
  } else {
    recommendation = `❌ Deal is REJECTED. DSCR of ${dscr.toFixed(2)} is too low for most lenders. Required actions: (1) Reduce purchase price by ${((1.25 - dscr) * 100).toFixed(0)}%, (2) Increase rent, (3) Reduce operating expenses, or (4) Increase down payment to lower debt service.`;
  }

  return {
    ratio: dscr.toFixed(2),
    ratioValue,
    status,
    noi: parseFloat(noi.toFixed(2)),
    maxLoanPossible: parseFloat(estimatedMaxLoan.toFixed(2)),
    monthlyPaymentCapacity: parseFloat(monthlyPaymentCapacity.toFixed(2)),
    recommendation,
    riskLevel,
    metrics: {
      grossRent: parseFloat(grossRent.toFixed(2)),
      vacancyLoss: parseFloat(vacancyLoss.toFixed(2)),
      effectiveGrossIncome: parseFloat(effectiveGrossIncome.toFixed(2)),
      operatingExpenses: parseFloat(operatingExpenses.toFixed(2)),
      netOperatingIncome: parseFloat(noi.toFixed(2)),
      debtService: parseFloat(debtService.toFixed(2)),
      dscr: parseFloat(dscr.toFixed(2)),
    },
  };
};

/**
 * Stress test a deal with multiple scenarios
 */
export interface StressTestScenario {
  name: string;
  vacancyRate: number;
  operatingExpenseRatio: number;
  rentChange: number; // Percentage change in rent
  expenseChange: number; // Percentage change in expenses
}

export interface StressTestResult {
  baseCase: DSCRResult;
  scenarios: {
    scenario: StressTestScenario;
    result: DSCRResult;
  }[];
  worstCase: DSCRResult;
  bestCase: DSCRResult;
}

export const stressTestDeal = (
  baseInput: DSCRInput,
  scenarios: StressTestScenario[] = []
): StressTestResult => {
  // Calculate base case
  const baseCase = calculateDSCR(baseInput);

  // Default scenarios if none provided
  const defaultScenarios: StressTestScenario[] = [
    {
      name: 'Conservative (15% Vacancy)',
      vacancyRate: 0.15,
      operatingExpenseRatio: 0.55,
      rentChange: 0,
      expenseChange: 0,
    },
    {
      name: 'Rent Drop (-10%)',
      vacancyRate: 0.10,
      operatingExpenseRatio: 0.50,
      rentChange: -0.10,
      expenseChange: 0,
    },
    {
      name: 'Expense Increase (+15%)',
      vacancyRate: 0.10,
      operatingExpenseRatio: 0.50,
      rentChange: 0,
      expenseChange: 0.15,
    },
    {
      name: 'Worst Case',
      vacancyRate: 0.20,
      operatingExpenseRatio: 0.60,
      rentChange: -0.15,
      expenseChange: 0.20,
    },
  ];

  const testScenarios = scenarios.length > 0 ? scenarios : defaultScenarios;

  // Calculate scenarios
  const scenarioResults = testScenarios.map(scenario => {
    const adjustedRent = baseInput.grossRent * (1 + scenario.rentChange);
    const adjustedExpenses = baseInput.expenses > 0
      ? baseInput.expenses * (1 + scenario.expenseChange)
      : adjustedRent * scenario.operatingExpenseRatio;

    const scenarioInput: DSCRInput = {
      ...baseInput,
      grossRent: adjustedRent,
      expenses: adjustedExpenses,
      vacancyRate: scenario.vacancyRate,
      operatingExpenseRatio: scenario.operatingExpenseRatio,
    };

    return {
      scenario,
      result: calculateDSCR(scenarioInput),
    };
  });

  // Find worst and best cases
  const allResults = [baseCase, ...scenarioResults.map(s => s.result)];
  const worstCase = allResults.reduce((worst, current) =>
    current.ratioValue < worst.ratioValue ? current : worst
  );
  const bestCase = allResults.reduce((best, current) =>
    current.ratioValue > best.ratioValue ? current : best
  );

  return {
    baseCase,
    scenarios: scenarioResults,
    worstCase,
    bestCase,
  };
};

/**
 * Calculate maximum purchase price based on DSCR requirements
 */
export const calculateMaxPurchasePrice = (
  noi: number,
  targetDSCR: number = 1.25,
  interestRate: number = 0.07,
  loanTermYears: number = 30,
  downPaymentPercent: number = 0.25
): {
  maxLoanAmount: number;
  maxPurchasePrice: number;
  monthlyPayment: number;
  downPayment: number;
} => {
  // Calculate maximum monthly payment
  const maxMonthlyPayment = noi / targetDSCR;

  // Calculate loan amount using mortgage formula
  const monthlyRate = interestRate / 12;
  const numPayments = loanTermYears * 12;
  
  // PV = PMT * [(1 - (1 + r)^-n) / r]
  const maxLoanAmount = maxMonthlyPayment * ((1 - Math.pow(1 + monthlyRate, -numPayments)) / monthlyRate);

  // Calculate purchase price (loan amount / (1 - down payment %))
  const maxPurchasePrice = maxLoanAmount / (1 - downPaymentPercent);
  const downPayment = maxPurchasePrice * downPaymentPercent;

  return {
    maxLoanAmount: parseFloat(maxLoanAmount.toFixed(2)),
    maxPurchasePrice: parseFloat(maxPurchasePrice.toFixed(2)),
    monthlyPayment: parseFloat(maxMonthlyPayment.toFixed(2)),
    downPayment: parseFloat(downPayment.toFixed(2)),
  };
};

