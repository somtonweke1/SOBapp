import { NextRequest, NextResponse } from 'next/server';
import { auditWaterBill, batchAuditWaterBills, detectBillSpike, invertDPWBill } from '@/services/forensics/dpwAuditor';
import type { WaterBillAuditInput, DPWInversionInput } from '@/services/forensics/dpwAuditor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bills, spikeDetection } = body;

    // Single bill audit
    if (body.meterReadCurrent !== undefined) {
      const input: WaterBillAuditInput = {
        meterReadCurrent: body.meterReadCurrent,
        meterReadLast: body.meterReadLast,
        totalBill: body.totalBill,
        serviceCharge: body.serviceCharge,
        sewerCharge: body.sewerCharge,
      };

      const result = auditWaterBill(input);
      return NextResponse.json({
        success: true,
        result,
        timestamp: new Date().toISOString(),
      });
    }

    // Batch audit
    if (Array.isArray(bills)) {
      const results = batchAuditWaterBills(bills as WaterBillAuditInput[]);
      const errorCount = results.filter(r => r.isError).length;
      const totalDiscrepancy = results.reduce((sum, r) => sum + parseFloat(r.discrepancyAmount), 0);

      return NextResponse.json({
        success: true,
        results,
        summary: {
          totalBills: bills.length,
          errorCount,
          totalDiscrepancy: totalDiscrepancy.toFixed(2),
          errorRate: ((errorCount / bills.length) * 100).toFixed(2) + '%',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Spike detection
    if (spikeDetection) {
      const { currentBill, previousBill } = spikeDetection;
      const spikeResult = detectBillSpike(currentBill, previousBill);
      return NextResponse.json({
        success: true,
        spikeDetection: spikeResult,
        timestamp: new Date().toISOString(),
      });
    }

    // Inversion analysis
    if (body.inversion) {
      const inversionInput: DPWInversionInput = {
        totalBill: body.inversion.totalBill,
        serviceCharge: body.inversion.serviceCharge,
        sewerCharge: body.inversion.sewerCharge,
      };
      const inversionResult = invertDPWBill(inversionInput);
      return NextResponse.json({
        success: true,
        inversion: inversionResult,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid request. Provide either single bill data, bills array, spikeDetection object, or inversion object.',
      timestamp: new Date().toISOString(),
    }, { status: 400 });
  } catch (error) {
    console.error('DPW Audit API error:', error);
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
    description: 'DPW Water Bill Auditor API',
    endpoints: {
      single: {
        method: 'POST',
        body: {
          meterReadCurrent: 'number (CCF)',
          meterReadLast: 'number (CCF)',
          totalBill: 'number (dollars)',
          serviceCharge: 'number (optional, dollars)',
          sewerCharge: 'number (optional, 0-1, default: 1.0)',
        },
      },
      batch: {
        method: 'POST',
        body: {
          bills: 'array of WaterBillAuditInput objects',
        },
      },
      spikeDetection: {
        method: 'POST',
        body: {
          spikeDetection: {
            currentBill: 'number',
            previousBill: 'number',
          },
        },
      },
    },
    timestamp: new Date().toISOString(),
  });
}

