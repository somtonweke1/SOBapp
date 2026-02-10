import { NextRequest, NextResponse } from 'next/server';
import {
  calculateDSCR,
  stressTestDeal,
  calculateMaxPurchasePrice,
} from '@/services/forensics/dealStressTest';
import type { DSCRInput, StressTestScenario } from '@/services/forensics/dealStressTest';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, deal, scenarios, maxPriceCalc } = body;

    // Standard DSCR calculation
    if (deal) {
      const input: DSCRInput = {
        grossRent: deal.grossRent,
        expenses: deal.expenses || 0,
        debtService: deal.debtService,
        vacancyRate: deal.vacancyRate,
        operatingExpenseRatio: deal.operatingExpenseRatio,
      };

      const result = calculateDSCR(input);
      return NextResponse.json({
        success: true,
        result,
        timestamp: new Date().toISOString(),
      });
    }

    // Stress test
    if (action === 'stress-test' && deal) {
      const input: DSCRInput = {
        grossRent: deal.grossRent,
        expenses: deal.expenses || 0,
        debtService: deal.debtService,
        vacancyRate: deal.vacancyRate,
        operatingExpenseRatio: deal.operatingExpenseRatio,
      };

      const testScenarios: StressTestScenario[] = scenarios || [];
      const stressResult = stressTestDeal(input, testScenarios);

      return NextResponse.json({
        success: true,
        stressTest: stressResult,
        timestamp: new Date().toISOString(),
      });
    }

    // Max purchase price calculation
    if (action === 'max-price' && maxPriceCalc) {
      const { noi, targetDSCR, interestRate, loanTermYears, downPaymentPercent } = maxPriceCalc;
      const maxPriceResult = calculateMaxPurchasePrice(
        noi,
        targetDSCR || 1.25,
        interestRate || 0.07,
        loanTermYears || 30,
        downPaymentPercent || 0.25
      );

      return NextResponse.json({
        success: true,
        maxPrice: maxPriceResult,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid request. Provide deal object or specify action (stress-test, max-price).',
      timestamp: new Date().toISOString(),
    }, { status: 400 });
  } catch (error) {
    console.error('DSCR Test API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    description: 'DSCR Stress Test API',
    endpoints: {
      standard: {
        method: 'POST',
        body: {
          deal: {
            grossRent: 'number (monthly)',
            expenses: 'number (monthly, optional)',
            debtService: 'number (monthly)',
            vacancyRate: 'number (0-1, optional, default: 0.10)',
            operatingExpenseRatio: 'number (0-1, optional, default: 0.50)',
          },
        },
      },
      stressTest: {
        method: 'POST',
        body: {
          action: 'stress-test',
          deal: 'DSCRInput object',
          scenarios: 'array of StressTestScenario (optional)',
        },
      },
      maxPrice: {
        method: 'POST',
        body: {
          action: 'max-price',
          maxPriceCalc: {
            noi: 'number (annual NOI)',
            targetDSCR: 'number (optional, default: 1.25)',
            interestRate: 'number (optional, default: 0.07)',
            loanTermYears: 'number (optional, default: 30)',
            downPaymentPercent: 'number (optional, default: 0.25)',
          },
        },
      },
    },
    timestamp: new Date().toISOString(),
  });
}

