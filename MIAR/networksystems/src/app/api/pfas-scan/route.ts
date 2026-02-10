import { NextRequest, NextResponse } from 'next/server';
import { getPFASComplianceScanner } from '@/services/pfas/pfas-compliance-scanner';
import { PrismaClient } from '@prisma/client';
import type { PFASSystemData } from '@/types/pfas';

// Initialize Prisma client
const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/pfas-scan
 * Submit PFAS system data and initiate compliance analysis
 *
 * Request body: PFASSystemData (JSON)
 * Response: PFASComplianceReport with scanId
 */
export async function POST(request: NextRequest) {
  try {
    const systemData = (await request.json()) as PFASSystemData & {
      facilityName: string;
      email: string;
      options?: {
        includeMultiCompound?: boolean;
        monteCarloIterations?: number;
        breakthroughDuration?: number;
        reportFormat?: 'json' | 'html' | 'pdf';
      };
    };

    // Validate required fields
    if (!systemData.facilityName || !systemData.email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Facility name and email are required',
        },
        { status: 400 }
      );
    }

    if (!systemData.totalPFAS || systemData.totalPFAS <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Total PFAS concentration must be greater than 0',
        },
        { status: 400 }
      );
    }

    // Perform PFAS compliance analysis
    const scanner = getPFASComplianceScanner();
    const complianceReport = await scanner.analyzePFASCompliance(systemData, systemData.options);

    // Generate HTML report (simple version for now)
    const htmlReport = generateSimpleHTMLReport(complianceReport);
    const textSummary = generateTextSummary(complianceReport);

    // Store results in database
    const scanResult = await prisma.pFASScanResult.create({
      data: {
        scanId: complianceReport.scanId,
        facilityName: systemData.facilityName,
        email: systemData.email,
        systemType: systemData.systemType,
        totalPFAS: systemData.totalPFAS,
        pfoaLevel: systemData.pfasCompounds.PFOA || 0,
        pfosLevel: systemData.pfasCompounds.PFOS || 0,
        pfnaLevel: systemData.pfasCompounds.PFNA || 0,
        pfhxsLevel: systemData.pfasCompounds.PFHxS || 0,
        compoundsDetected: complianceReport.summary.totalPFASDetected,
        compoundsAboveLimit: complianceReport.summary.compoundsAboveLimit,
        overallRiskLevel: complianceReport.riskAssessment.riskLevel,
        overallRiskScore: complianceReport.riskAssessment.overallRiskScore,
        complianceStatus: complianceReport.riskAssessment.complianceStatus,
        urgencyLevel: complianceReport.summary.urgencyLevel,
        projectedLifeMonths: complianceReport.economicAnalysis.projectedLifespanMonths,
        removalEfficiency: complianceReport.capacityAnalysis.adjustedCapacity,
        costPerMG: complianceReport.economicAnalysis.costPerMillionGallons,
        estimatedFines: complianceReport.riskAssessment.estimatedFinesExposure
          ? `$${(complianceReport.riskAssessment.estimatedFinesExposure / 1000000).toFixed(2)}M`
          : null,
        fullReport: JSON.stringify(complianceReport),
        htmlReport,
        textSummary,
        overallConfidence: complianceReport.overallConfidence,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // TODO: Email service integration (mirror BIS scanner pattern)
    // For now, skip email delivery

    return NextResponse.json({
      success: true,
      scanId: complianceReport.scanId,
      summary: {
        totalPFASDetected: complianceReport.summary.totalPFASDetected,
        compoundsAboveLimit: complianceReport.summary.compoundsAboveLimit,
        predictedSystemLife: complianceReport.summary.predictedSystemLife,
        complianceStatus: complianceReport.summary.complianceStatus,
        urgencyLevel: complianceReport.summary.urgencyLevel,
        overallRiskLevel: complianceReport.riskAssessment.riskLevel,
        overallRiskScore: complianceReport.riskAssessment.overallRiskScore,
        estimatedFines: complianceReport.riskAssessment.estimatedFinesExposure,
      },
      message: `PFAS compliance analysis completed. Scan ID: ${complianceReport.scanId}`,
    });
  } catch (error) {
    console.error('PFAS scan error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'PFAS scan failed',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pfas-scan?scanId=xxx
 * Retrieve PFAS scan results by scanId
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scanId = searchParams.get('scanId');

    if (!scanId) {
      return NextResponse.json(
        {
          success: false,
          error: 'scanId parameter is required',
        },
        { status: 400 }
      );
    }

    const scanResult = await prisma.pFASScanResult.findUnique({
      where: { scanId },
    });

    if (!scanResult) {
      return NextResponse.json(
        {
          success: false,
          error: 'Scan result not found',
        },
        { status: 404 }
      );
    }

    // Check if expired
    if (scanResult.expiresAt && scanResult.expiresAt < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Scan result has expired',
        },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      scanResult: {
        ...scanResult,
        fullReport: JSON.parse(scanResult.fullReport),
      },
    });
  } catch (error) {
    console.error('PFAS scan retrieval error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve scan results',
      },
      { status: 500 }
    );
  }
}

/**
 * Generate simple HTML report
 */
function generateSimpleHTMLReport(report: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>PFAS Compliance Report - ${report.scanId}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #2563eb; }
    h2 { color: #1e40af; margin-top: 30px; }
    .summary { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .risk-critical { color: #dc2626; font-weight: bold; }
    .risk-high { color: #ea580c; font-weight: bold; }
    .risk-medium { color: #d97706; }
    .risk-low { color: #65a30d; }
    .risk-clear { color: #16a34a; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #2563eb; color: white; }
    .recommendation { background: #fef3c7; padding: 10px; margin: 10px 0; border-left: 4px solid #f59e0b; }
  </style>
</head>
<body>
  <h1>PFAS Compliance Analysis Report</h1>
  <div class="summary">
    <h2>Executive Summary</h2>
    <p><strong>Scan ID:</strong> ${report.scanId}</p>
    <p><strong>Date:</strong> ${new Date(report.timestamp).toLocaleDateString()}</p>
    <p><strong>Risk Level:</strong> <span class="risk-${report.riskAssessment.riskLevel}">${report.riskAssessment.riskLevel.toUpperCase()}</span></p>
    <p><strong>Compliance Status:</strong> ${report.riskAssessment.complianceStatus}</p>
    <p><strong>Overall Risk Score:</strong> ${report.riskAssessment.overallRiskScore.toFixed(1)}/10</p>
    <p><strong>Projected System Life:</strong> ${report.economicAnalysis.projectedLifespanMonths.toFixed(1)} months</p>
  </div>

  <h2>PFAS Concentrations</h2>
  <table>
    <tr><th>Compound</th><th>Concentration (ng/L)</th><th>EPA Limit (ng/L)</th><th>Status</th></tr>
    <tr><td>PFOA</td><td>${report.systemData.pfasCompounds.PFOA}</td><td>4.0</td><td>${report.systemData.pfasCompounds.PFOA > 4 ? '⚠️ EXCEEDS' : '✓ OK'}</td></tr>
    <tr><td>PFOS</td><td>${report.systemData.pfasCompounds.PFOS}</td><td>4.0</td><td>${report.systemData.pfasCompounds.PFOS > 4 ? '⚠️ EXCEEDS' : '✓ OK'}</td></tr>
    <tr><td>PFNA</td><td>${report.systemData.pfasCompounds.PFNA}</td><td>10.0</td><td>${report.systemData.pfasCompounds.PFNA > 10 ? '⚠️ EXCEEDS' : '✓ OK'}</td></tr>
    <tr><td>Total PFAS</td><td>${report.systemData.totalPFAS}</td><td>-</td><td>-</td></tr>
  </table>

  <h2>Recommendations</h2>
  ${report.riskAssessment.recommendations.map((rec: string) => `<div class="recommendation">${rec}</div>`).join('')}

  <h2>Economic Analysis</h2>
  <p><strong>Projected GAC Lifespan:</strong> ${report.economicAnalysis.projectedLifespanMonths.toFixed(1)} months</p>
  <p><strong>Cost per Million Gallons:</strong> $${report.economicAnalysis.costPerMillionGallons.toFixed(2)}</p>
  <p><strong>Capital Avoidance:</strong> $${report.economicAnalysis.capitalAvoidance.toFixed(0)}</p>
  ${report.riskAssessment.estimatedFinesExposure ? `<p><strong>Potential Regulatory Fines:</strong> $${(report.riskAssessment.estimatedFinesExposure / 1000000).toFixed(2)}M</p>` : ''}

  <p style="margin-top: 40px; color: #6b7280; font-size: 12px;">
    Generated by MIAR PFAS Compliance Intelligence Module<br>
    Confidence Score: ${(report.overallConfidence * 100).toFixed(0)}%
  </p>
</body>
</html>
  `;
}

/**
 * Generate text summary
 */
function generateTextSummary(report: any): string {
  return `
PFAS COMPLIANCE ANALYSIS REPORT
================================

Scan ID: ${report.scanId}
Date: ${new Date(report.timestamp).toLocaleDateString()}

EXECUTIVE SUMMARY
-----------------
Risk Level: ${report.riskAssessment.riskLevel.toUpperCase()}
Compliance Status: ${report.riskAssessment.complianceStatus}
Overall Risk Score: ${report.riskAssessment.overallRiskScore.toFixed(1)}/10
Projected System Life: ${report.economicAnalysis.projectedLifespanMonths.toFixed(1)} months

PFAS DETECTED
-------------
Total PFAS: ${report.systemData.totalPFAS} ng/L
PFOA: ${report.systemData.pfasCompounds.PFOA} ng/L (EPA Limit: 4.0 ng/L)
PFOS: ${report.systemData.pfasCompounds.PFOS} ng/L (EPA Limit: 4.0 ng/L)
PFNA: ${report.systemData.pfasCompounds.PFNA} ng/L (EPA Limit: 10.0 ng/L)

RECOMMENDATIONS
---------------
${report.riskAssessment.recommendations.map((rec: string, i: number) => `${i + 1}. ${rec}`).join('\n')}

ECONOMIC ANALYSIS
-----------------
Projected GAC Lifespan: ${report.economicAnalysis.projectedLifespanMonths.toFixed(1)} months
Cost per Million Gallons: $${report.economicAnalysis.costPerMillionGallons.toFixed(2)}
Capital Avoidance: $${report.economicAnalysis.capitalAvoidance.toFixed(0)}
${report.riskAssessment.estimatedFinesExposure ? `Potential Regulatory Fines: $${(report.riskAssessment.estimatedFinesExposure / 1000000).toFixed(2)}M` : ''}

Generated by MIAR PFAS Compliance Intelligence Module
Confidence Score: ${(report.overallConfidence * 100).toFixed(0)}%
  `;
}
