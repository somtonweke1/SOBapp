import { prisma } from '@/lib/prisma';
import { fetchLiveProcurementRecords } from '@/lib/api/procurement-live';
import { analyzePortfolioRisk } from '@/lib/risk/engine';
import { materializeOntologyFromRecords, readProcurementFromOntology } from '@/lib/risk/ontology-store';

type ScannerTrigger = 'cron' | 'manual' | 'warmup';

export type ScannerRunResult = {
  trigger: ScannerTrigger;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  records: number;
  liveRecords: number;
  flags: number;
  strict: number;
  heuristics: number;
};

async function setConfig(key: string, value: string): Promise<void> {
  const db = prisma as any;
  await db.systemConfig.upsert({
    where: { key },
    update: { value, category: 'scanner', dataType: 'string' },
    create: { key, value, category: 'scanner', dataType: 'string' },
  });
}

async function getConfig(key: string): Promise<string | null> {
  const db = prisma as any;
  const row = await db.systemConfig.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function runAutoScanner(trigger: ScannerTrigger): Promise<ScannerRunResult> {
  const started = Date.now();
  const startedAt = new Date(started).toISOString();

  // Keep ontology tables current from latest ingestable dataset.
  const liveRecords = await fetchLiveProcurementRecords();
  if (liveRecords.length > 0) {
    await materializeOntologyFromRecords(liveRecords);
  }

  const records = await readProcurementFromOntology();
  const materializedRecords = records;
  const flags = analyzePortfolioRisk(materializedRecords);

  const result: ScannerRunResult = {
    trigger,
    startedAt,
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    records: materializedRecords.length,
    liveRecords: liveRecords.length,
    flags: flags.length,
    strict: flags.filter((flag) => flag.basis === 'STRICT_LAW').length,
    heuristics: flags.filter((flag) => flag.basis === 'RISK_HEURISTIC').length,
  };

  const totalRunsRaw = await getConfig('scanner_total_runs');
  const totalRuns = Number(totalRunsRaw || '0') + 1;

  await Promise.all([
    setConfig('scanner_last_run_at', result.finishedAt),
    setConfig('scanner_last_status', 'ok'),
    setConfig('scanner_last_summary', JSON.stringify(result)),
    setConfig('scanner_total_runs', String(totalRuns)),
  ]);

  return result;
}

export async function runAutoScannerIfStale(maxAgeMinutes = 60): Promise<boolean> {
  const lastRunAt = await getConfig('scanner_last_run_at');
  if (!lastRunAt) {
    await runAutoScanner('warmup');
    return true;
  }

  const lastRunMs = new Date(lastRunAt).getTime();
  if (Number.isNaN(lastRunMs)) {
    await runAutoScanner('warmup');
    return true;
  }

  const ageMs = Date.now() - lastRunMs;
  if (ageMs > maxAgeMinutes * 60 * 1000) {
    await runAutoScanner('warmup');
    return true;
  }
  return false;
}

export async function getScannerStatus(): Promise<Record<string, string | null>> {
  const [lastRunAt, lastStatus, lastSummary, totalRuns] = await Promise.all([
    getConfig('scanner_last_run_at'),
    getConfig('scanner_last_status'),
    getConfig('scanner_last_summary'),
    getConfig('scanner_total_runs'),
  ]);

  return {
    lastRunAt,
    lastStatus,
    lastSummary,
    totalRuns,
  };
}
