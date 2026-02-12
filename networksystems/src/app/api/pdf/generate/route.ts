import { NextRequest, NextResponse } from 'next/server';
import chromium from '@sparticuz/chromium-min';
import puppeteer from 'puppeteer-core';

export const runtime = 'nodejs';

const getBaseUrl = (request: NextRequest) => {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  return `${request.nextUrl.protocol}//${request.nextUrl.host}`;
};

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request);
  const draftId = `DRAFT-${Date.now()}`;
  const generatedAt = new Date().toISOString();
  const accessKey = process.env.OPS_ACCESS_KEY;
  const providedKey = request.nextUrl.searchParams.get('key') || request.headers.get('x-ops-key');
  if (accessKey && providedKey !== accessKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const targetParams = new URLSearchParams();
  targetParams.set('draftId', draftId);
  targetParams.set('generatedAt', generatedAt);
  if (accessKey) targetParams.set('key', accessKey);

  const passthrough = ['address', 'owner', 'caseId', 'lienTotal', 'lastSalePrice'];
  passthrough.forEach((key) => {
    const value = request.nextUrl.searchParams.get(key);
    if (value) targetParams.set(key, value);
  });

  const targetUrl = `${baseUrl}/ops/proposal?${targetParams.toString()}`;

  try {
    const executablePath = await chromium.executablePath();
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(targetUrl, { waitUntil: 'networkidle0' });
    await page.addStyleTag({
      content: `
        @page { size: A4; margin: 16mm; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `,
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: '<div style="font-size:8px;width:100%;text-align:center;color:#64748b;">RESTRICTED AUDIT • SOBAPP FORENSIC SHIELD</div>',
      margin: { top: '16mm', bottom: '16mm', left: '12mm', right: '12mm' },
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=ops-proposal-${draftId}.pdf`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
