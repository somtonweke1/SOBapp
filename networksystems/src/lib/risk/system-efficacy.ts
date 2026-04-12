import { prisma } from '@/lib/prisma';

export type SystemEfficacyMetrics = {
  bridgedLoops: number;
  totalLoops: number;
  loopBreakRate: number;
  avgTimeToBridgeHours: number;
};

export const DEFAULT_EFFICACY_METRICS: SystemEfficacyMetrics = {
  bridgedLoops: 0,
  totalLoops: 0,
  loopBreakRate: 0,
  avgTimeToBridgeHours: 0,
};

export async function getSystemEfficacyMetrics(): Promise<SystemEfficacyMetrics> {
  try {
    const db = prisma as any;
    const [loopRows, interventionRows] = await Promise.all([
      db.constraintLoop.findMany({
        select: { status: true },
      }),
      db.bridgeIntervention.findMany({
        where: { status: 'COMPLETED' },
        select: { timeToBridgeHours: true },
      }),
    ]);

    const totalLoops = loopRows.length;
    const bridgedLoops = loopRows.filter((row: { status: string }) => row.status === 'BRIDGED').length;
    const loopBreakRate = totalLoops === 0 ? 0 : Math.round((bridgedLoops / totalLoops) * 100);

    const timeRows = interventionRows
      .map((row: { timeToBridgeHours: number | null }) => row.timeToBridgeHours)
      .filter((value: number | null): value is number => typeof value === 'number' && Number.isFinite(value));
    const avgTimeToBridgeHours = timeRows.length === 0
      ? 0
      : Number((timeRows.reduce((sum: number, value: number) => sum + value, 0) / timeRows.length).toFixed(1));

    return {
      bridgedLoops,
      totalLoops,
      loopBreakRate,
      avgTimeToBridgeHours,
    };
  } catch (error) {
    console.error('Failed to load system efficacy metrics:', error);
    return DEFAULT_EFFICACY_METRICS;
  }
}

