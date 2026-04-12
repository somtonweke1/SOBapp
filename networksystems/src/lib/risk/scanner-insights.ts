import { prisma } from '@/lib/prisma';

type ParsedScannerSummary = {
  trigger?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  records?: number;
  liveRecords?: number;
  flags?: number;
  strict?: number;
  heuristics?: number;
};

export type ScannerFinding = {
  snapshotId: string;
  agencyName: string;
  vendorName: string;
  basis: 'STRICT_LAW' | 'RISK_HEURISTIC';
  indicator: string;
  exposure: number;
  confidence: number;
  defensibilityScore: number;
  sourceUrl: string;
  generatedAt: string;
};

export type ScannerInsights = {
  status: {
    lastRunAt: string | null;
    lastStatus: string | null;
    totalRuns: number;
    lastSummary: ParsedScannerSummary | null;
  };
  freshness: {
    hoursSinceLastRun: number | null;
    isStale: boolean;
    latestFindingAt: string | null;
  };
  today: {
    findings: number;
    strict: number;
    heuristics: number;
    exposure: number;
  };
  recentFindings: ScannerFinding[];
  dailyTrend: Array<{ day: string; findings: number; exposure: number }>;
};

function parseSummary(raw: string | null): ParsedScannerSummary | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ParsedScannerSummary;
  } catch {
    return null;
  }
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getScannerInsights(days = 7): Promise<ScannerInsights> {
  const db = prisma as any;

  const [configRows, recentRows, latestFinding] = await Promise.all([
    db.systemConfig.findMany({
      where: { key: { in: ['scanner_last_run_at', 'scanner_last_status', 'scanner_last_summary', 'scanner_total_runs'] } },
    }),
    db.riskDossier.findMany({
      where: {
        generatedAt: {
          gte: new Date(Date.now() - Math.max(days, 1) * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        masterEntity: true,
      },
      orderBy: { generatedAt: 'desc' },
      take: 500,
    }),
    db.riskDossier.findFirst({
      orderBy: { generatedAt: 'desc' },
      select: { generatedAt: true },
    }),
  ]);

  const configMap = new Map<string, string>();
  for (const row of configRows) configMap.set(row.key, row.value);

  const lastRunAt = configMap.get('scanner_last_run_at') || null;
  const lastStatus = configMap.get('scanner_last_status') || null;
  const totalRuns = Number(configMap.get('scanner_total_runs') || '0') || 0;
  const lastSummary = parseSummary(configMap.get('scanner_last_summary') || null);

  const now = Date.now();
  const hoursSinceLastRun = lastRunAt ? Math.max(0, Math.round(((now - new Date(lastRunAt).getTime()) / 3600000) * 10) / 10) : null;
  const isStale = hoursSinceLastRun === null ? true : hoursSinceLastRun > 30;

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  let todayFindings = 0;
  let todayStrict = 0;
  let todayHeuristics = 0;
  let todayExposure = 0;

  const daily = new Map<string, { findings: number; exposure: number }>();
  for (let i = 0; i < Math.max(days, 1); i++) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    daily.set(dayKey(d), { findings: 0, exposure: 0 });
  }

  for (const row of recentRows) {
    const generatedAt = new Date(row.generatedAt);
    const key = dayKey(generatedAt);
    const bucket = daily.get(key);
    if (bucket) {
      bucket.findings += 1;
      bucket.exposure += row.exposure;
    }

    if (generatedAt >= todayStart) {
      todayFindings += 1;
      todayExposure += row.exposure;
      if (row.basis === 'STRICT_LAW') todayStrict += 1;
      if (row.basis === 'RISK_HEURISTIC') todayHeuristics += 1;
    }
  }

  const recentFindings: ScannerFinding[] = recentRows.slice(0, 12).map((row: any) => ({
    snapshotId: row.snapshotId,
    agencyName: row.agencyName,
    vendorName: row.masterEntity?.name || 'Unknown Vendor',
    basis: row.basis,
    indicator: row.indicator,
    exposure: row.exposure,
    confidence: row.confidence,
    defensibilityScore: row.defensibilityScore,
    sourceUrl: row.sourceUrl,
    generatedAt: row.generatedAt.toISOString(),
  }));

  const dailyTrend = [...daily.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, value]) => ({ day, findings: value.findings, exposure: value.exposure }));

  return {
    status: {
      lastRunAt,
      lastStatus,
      totalRuns,
      lastSummary,
    },
    freshness: {
      hoursSinceLastRun,
      isStale,
      latestFindingAt: latestFinding?.generatedAt ? new Date(latestFinding.generatedAt).toISOString() : null,
    },
    today: {
      findings: todayFindings,
      strict: todayStrict,
      heuristics: todayHeuristics,
      exposure: todayExposure,
    },
    recentFindings,
    dailyTrend,
  };
}
