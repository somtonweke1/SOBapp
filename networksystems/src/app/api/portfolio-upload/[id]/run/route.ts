import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { performForensicScan } from '@/lib/api/forensic-scan';
import { statusFromEnum, type PortfolioUploadStoredResults } from '@/lib/portfolio-upload';

export const runtime = 'nodejs';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const upload = await prisma.portfolioUpload.findUnique({
      where: { id: params.id },
    });

    if (!upload) {
      return NextResponse.json({ ok: false, error: 'Portfolio upload not found' }, { status: 404 });
    }

    await prisma.portfolioUpload.update({
      where: { id: upload.id },
      data: {
        status: 'PROCESSING',
      },
    });

    const results = [];
    for (const address of upload.addresses) {
      const report = await performForensicScan(address, 'asset');
      results.push({
        address,
        report,
      });
    }

    const storedResults: PortfolioUploadStoredResults = {
      generatedAt: new Date().toISOString(),
      results,
    };

    await prisma.portfolioUpload.update({
      where: { id: upload.id },
      data: {
        status: 'DELIVERED',
        generated_at: new Date(storedResults.generatedAt),
        results_json: JSON.stringify(storedResults),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'portfolio_upload_bulk_scan_completed',
        resource: 'portfolio_upload',
        resourceId: upload.id,
        details: JSON.stringify({
          referenceNumber: upload.reference_number,
          scanned: results.length,
          finalStatus: statusFromEnum('DELIVERED'),
        }),
      },
    });

    return NextResponse.json({
      ok: true,
      reportUrl: `/portfolio-report/${upload.reference_number}`,
      scanned: results.length,
    });
  } catch (error) {
    console.error('Portfolio upload bulk scan error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to run bulk scan' }, { status: 500 });
  }
}
