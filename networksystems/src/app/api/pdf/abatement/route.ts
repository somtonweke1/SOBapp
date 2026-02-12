import { NextRequest, NextResponse } from 'next/server';
import chromium from '@sparticuz/chromium-min';
import puppeteer from 'puppeteer-core';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const templatePath = path.join(process.cwd(), 'src', 'templates', 'abatement-letter.html');

const renderTemplate = (template: string, replacements: Record<string, string>) => {
  return Object.entries(replacements).reduce((html, [key, value]) => {
    return html.replaceAll(`{{${key}}}`, value);
  }, template);
};

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const caseId = url.searchParams.get('caseId') || 'SR-UNKNOWN';
  const accountNumber = url.searchParams.get('accountNumber') || 'UNKNOWN';
  const propertyAddress = url.searchParams.get('address') || 'UNKNOWN ADDRESS';
  const ownerName = url.searchParams.get('owner') || 'OWNER OF RECORD';
  const date = new Date().toLocaleDateString('en-US');

  try {
    const template = await fs.readFile(templatePath, 'utf-8');
    const html = renderTemplate(template, {
      date,
      caseId,
      accountNumber,
      propertyAddress,
      ownerName,
    });

    const executablePath = await chromium.executablePath();
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.addStyleTag({
      content: `
        @page { size: letter; margin: 18mm; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `,
    });
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      displayHeaderFooter: false,
      margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
    });
    await browser.close();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=abatement-letter-${caseId}.pdf`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Abatement PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate abatement letter' }, { status: 500 });
  }
}
