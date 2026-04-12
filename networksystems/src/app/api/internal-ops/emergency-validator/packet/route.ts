import { NextRequest, NextResponse } from 'next/server';
import { ingestProcurementData } from '@/lib/api/procurement-ingest';
import { buildEmergencyValidation } from '@/lib/risk/emergency-validator';
import { runAutoScannerIfStale } from '@/lib/risk/auto-scanner';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isAuthorized(request: NextRequest): boolean {
  const secrets = [
    process.env.SCANNER_CRON_SECRET,
    process.env.CRON_SECRET,
    process.env.OPS_ACCESS_KEY,
    process.env.STONEBRIDGE_ACCESS_CODE,
  ].filter((value): value is string => !!value && value.trim().length > 0);

  if (secrets.length === 0) return true;

  const authHeader = request.headers.get('authorization') || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const querySecret = request.nextUrl.searchParams.get('secret') || '';
  return secrets.includes(bearer) || secrets.includes(querySecret);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await runAutoScannerIfStale(24 * 60);
    const recordId = request.nextUrl.searchParams.get('recordId');
    if (!recordId) {
      return NextResponse.json({ ok: false, error: 'recordId is required' }, { status: 400 });
    }

    const records = await ingestProcurementData();
    const result = buildEmergencyValidation(records).find((item) => item.recordId === recordId);
    if (!result) {
      return NextResponse.json({ ok: false, error: 'Emergency record not found' }, { status: 404 });
    }

    const packet = {
      generatedAt: new Date().toISOString(),
      recordId: result.recordId,
      jurisdiction: result.jurisdiction,
      agency: result.agency,
      vendor: result.vendor,
      amount: result.amount,
      status: result.status,
      score: result.score,
      checks: result.checks,
      matchedContracts: result.matchedContracts,
      requiredEvidence: result.requiredEvidence,
      sourceUrl: result.sourceUrl,
    };

    return NextResponse.json({ ok: true, packet });
  } catch (error) {
    console.error('Emergency validator packet error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to generate exception packet' }, { status: 500 });
  }
}
