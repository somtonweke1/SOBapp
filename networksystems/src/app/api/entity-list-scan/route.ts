import { NextRequest, NextResponse } from 'next/server';
import { getEntityListScanner } from '@/services/entity-list-scanner-service';
import { getReportGenerator } from '@/services/compliance-report-generator';
import { getEmailService } from '@/services/email-service';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma client
const prisma = new PrismaClient();

// Initialize email service
const emailService = getEmailService();

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/entity-list-scan
 * Upload supplier list and initiate compliance scan
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const file = formData.get('file') as File | null;
    const companyName = formData.get('companyName') as string | null;
    const email = formData.get('email') as string | null;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file uploaded'
      }, { status: 400 });
    }

    if (!companyName || !email) {
      return NextResponse.json({
        success: false,
        error: 'Company name and email are required'
      }, { status: 400 });
    }

    // Read file content
    const fileContent = await file.text();
    const fileName = file.name;

    // Validate file type
    const fileExt = fileName.split('.').pop()?.toLowerCase();
    if (!['csv', 'txt', 'xlsx', 'xls'].includes(fileExt || '')) {
      return NextResponse.json({
        success: false,
        error: 'Unsupported file type. Please upload CSV, TXT, or Excel files.'
      }, { status: 400 });
    }

    // Perform scan
    const scanner = getEntityListScanner();
    const scanReport = await scanner.scanFile(fileContent, fileName, companyName);

    // Generate report
    const reportGenerator = getReportGenerator();
    const htmlReport = reportGenerator.generateReport(scanReport, {
      format: 'html',
      includeFullDetails: true
    });

    const textSummary = reportGenerator.generateTextSummary(scanReport);

    // Store results in database
    const scanResult = await prisma.scanResult.create({
      data: {
        scanId: scanReport.scanId,
        companyName,
        email,
        fileType: scanReport.metadata.fileType,
        fileName: fileName,
        totalRows: scanReport.metadata.totalRowsParsed,
        skippedRows: scanReport.metadata.skippedRows,
        totalSuppliers: scanReport.summary.totalSuppliers,
        clearSuppliers: scanReport.summary.clearSuppliers,
        lowRiskSuppliers: scanReport.summary.lowRiskSuppliers,
        mediumRiskSuppliers: scanReport.summary.mediumRiskSuppliers,
        highRiskSuppliers: scanReport.summary.highRiskSuppliers,
        criticalSuppliers: scanReport.summary.criticalSuppliers,
        overallRiskLevel: scanReport.summary.overallRiskLevel,
        overallRiskScore: scanReport.summary.overallRiskScore,
        estimatedExposure: scanReport.summary.estimatedExposure || 'N/A',
        fullReport: JSON.stringify(scanReport),
        htmlReport,
        textSummary,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });

    // Send email report if email service is enabled
    let emailSent = false;
    let emailError: string | undefined;

    if (emailService.isEnabled()) {
      try {
        emailSent = await emailService.sendComplianceReport(email, htmlReport, scanReport, textSummary);

        if (emailSent) {
          // Update database with email sent status
          await prisma.scanResult.update({
            where: { id: scanResult.id },
            data: {
              emailSent: true,
              emailSentAt: new Date()
            }
          });
        }
      } catch (error) {
        console.error('Email send error:', error);
        emailError = error instanceof Error ? error.message : 'Unknown error';

        // Update database with email error
        await prisma.scanResult.update({
          where: { id: scanResult.id },
          data: {
            emailSent: false,
            emailError
          }
        });
      }
    } else {
      console.log('📧 Email service not configured - skipping email delivery');
    }

    return NextResponse.json({
      success: true,
      scanId: scanReport.scanId,
      summary: {
        totalSuppliers: scanReport.summary.totalSuppliers,
        criticalSuppliers: scanReport.summary.criticalSuppliers,
        highRiskSuppliers: scanReport.summary.highRiskSuppliers,
        overallRiskLevel: scanReport.summary.overallRiskLevel,
        overallRiskScore: scanReport.summary.overallRiskScore,
        estimatedExposure: scanReport.summary.estimatedExposure
      },
      emailSent,
      message: emailSent
        ? `Compliance scan completed successfully. Report sent to ${email}`
        : 'Compliance scan completed successfully. Download report below (email delivery not configured).'
    });

  } catch (error) {
    console.error('Entity list scan error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Scan failed'
    }, { status: 500 });
  }
}

/**
 * GET /api/entity-list-scan?scanId=xxx
 * Retrieve scan report from database
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scanId = searchParams.get('scanId');
    const format = searchParams.get('format') || 'json';

    if (!scanId) {
      return NextResponse.json({
        success: false,
        error: 'Scan ID is required'
      }, { status: 400 });
    }

    // Retrieve from database
    const result = await prisma.scanResult.findUnique({
      where: { scanId }
    });

    if (!result) {
      return NextResponse.json({
        success: false,
        error: 'Scan not found'
      }, { status: 404 });
    }

    if (format === 'html') {
      return new NextResponse(result.htmlReport, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `inline; filename="compliance-report-${scanId}.html"`
        }
      });
    }

    if (format === 'text') {
      return new NextResponse(result.textSummary || 'No text summary available', {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `inline; filename="compliance-report-${scanId}.txt"`
        }
      });
    }

    // Parse the JSON report
    const report = JSON.parse(result.fullReport);

    return NextResponse.json({
      success: true,
      report,
      emailSent: result.emailSent,
      emailSentAt: result.emailSentAt
    });

  } catch (error) {
    console.error('Scan retrieval error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Retrieval failed'
    }, { status: 500 });
  }
}
