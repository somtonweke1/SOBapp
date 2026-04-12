import type { DealDecision, DealPropertyType, DealRecord } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { dealRecordToCsvRow } from '@/lib/deal-records';

type CountByKey = Record<string, number>;

function percentage(part: number, total: number) {
  if (total === 0) return 0;
  return Number(((part / total) * 100).toFixed(1));
}

function increment(map: CountByKey, key: string) {
  map[key] = (map[key] || 0) + 1;
}

function bucketAssessment(value: number | null): string {
  if (value === null || value === undefined) return 'Unknown';
  if (value < 50000) return '< $50k';
  if (value < 150000) return '$50k - $149k';
  if (value < 300000) return '$150k - $299k';
  if (value < 1000000) return '$300k - $999k';
  return '$1M+';
}

function summarizeBy<T extends string>(counts: CountByKey, total: number) {
  return Object.entries(counts)
    .map(([key, count]) => ({
      key: key as T,
      count,
      percent: percentage(count, total),
    }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

export async function getPatternLibraryData() {
  const records = await prisma.dealRecord.findMany({
    orderBy: {
      scan_timestamp: 'desc',
    },
  });

  const total = records.length;
  const decisionCounts: CountByKey = {};
  const propertyTypeCounts: CountByKey = {};
  const zipCounts: CountByKey = {};
  const neighborhoodCounts: CountByKey = {};
  const zipEscalateStats = new Map<string, { total: number; escalates: number }>();
  const propertyViolationStats = new Map<string, { total: number; withViolations: number }>();
  const assessmentEscalateStats = new Map<string, { total: number; escalates: number }>();
  const noPermitByZone = new Map<string, string[]>();

  for (const record of records) {
    increment(decisionCounts, record.decision);
    increment(propertyTypeCounts, record.property_type || 'UNKNOWN');
    increment(zipCounts, record.zip_code || 'UNKNOWN');
    if (record.neighborhood) increment(neighborhoodCounts, record.neighborhood);

    const zipKey = record.zip_code || 'UNKNOWN';
    const zipStats = zipEscalateStats.get(zipKey) || { total: 0, escalates: 0 };
    zipStats.total += 1;
    if (record.decision === 'ESCALATE') zipStats.escalates += 1;
    zipEscalateStats.set(zipKey, zipStats);

    const propertyKey = record.property_type || 'UNKNOWN';
    const propertyStats = propertyViolationStats.get(propertyKey) || { total: 0, withViolations: 0 };
    propertyStats.total += 1;
    if (record.active_violations > 0) propertyStats.withViolations += 1;
    propertyViolationStats.set(propertyKey, propertyStats);

    const assessmentKey = bucketAssessment(record.assessment_value);
    const assessmentStats = assessmentEscalateStats.get(assessmentKey) || { total: 0, escalates: 0 };
    assessmentStats.total += 1;
    if (record.decision === 'ESCALATE') assessmentStats.escalates += 1;
    assessmentEscalateStats.set(assessmentKey, assessmentStats);

    if (record.permit_count === 0 && record.zoning_code) {
      const list = noPermitByZone.get(record.zoning_code) || [];
      list.push(record.address);
      noPermitByZone.set(record.zoning_code, list);
    }
  }

  return {
    totalDeals: total,
    recentDeals: records.slice(0, 20),
    decisionDistribution: summarizeBy<DealDecision>(decisionCounts, total),
    byPropertyType: summarizeBy<DealPropertyType | 'UNKNOWN'>(propertyTypeCounts, total),
    byZipCode: summarizeBy<string>(zipCounts, total),
    byNeighborhood: summarizeBy<string>(neighborhoodCounts, total),
    anomalies: {
      zipCodesByEscalateRate: Array.from(zipEscalateStats.entries())
        .map(([zipCode, stats]) => ({
          zipCode,
          total: stats.total,
          escalates: stats.escalates,
          escalateRate: percentage(stats.escalates, stats.total),
        }))
        .filter((entry) => entry.total > 0)
        .sort((a, b) => b.escalateRate - a.escalateRate || b.total - a.total)
        .slice(0, 5),
      propertyTypesByViolationRate: Array.from(propertyViolationStats.entries())
        .map(([propertyType, stats]) => ({
          propertyType,
          total: stats.total,
          withViolations: stats.withViolations,
          violationRate: percentage(stats.withViolations, stats.total),
        }))
        .filter((entry) => entry.total > 0)
        .sort((a, b) => b.violationRate - a.violationRate || b.total - a.total),
      assessmentRangesByEscalateRate: Array.from(assessmentEscalateStats.entries())
        .map(([range, stats]) => ({
          range,
          total: stats.total,
          escalates: stats.escalates,
          escalateRate: percentage(stats.escalates, stats.total),
        }))
        .sort((a, b) => b.escalateRate - a.escalateRate || b.total - a.total),
      addressesWithoutPermitsByZone: Array.from(noPermitByZone.entries())
        .map(([zoningCode, addresses]) => ({
          zoningCode,
          count: addresses.length,
          addresses: addresses.slice(0, 10),
        }))
        .sort((a, b) => b.count - a.count || a.zoningCode.localeCompare(b.zoningCode)),
    },
  };
}

export async function exportDealRecordsCsv() {
  const records = await prisma.dealRecord.findMany({
    orderBy: {
      scan_timestamp: 'desc',
    },
  });

  const header = [
    'id',
    'address',
    'zip_code',
    'neighborhood',
    'property_type',
    'zoning_code',
    'land_use',
    'assessment_value',
    'owner_name',
    'permit_count',
    'permit_types',
    'active_violations',
    'violation_types',
    'vacant_notice',
    'decision',
    'decision_drivers',
    'submitted_by',
    'institution_name',
    'scan_timestamp',
    'outcome_reported',
    'outcome',
    'outcome_reported_at',
    'notes',
  ].join(',');

  return [header, ...records.map(dealRecordToCsvRow)].join('\n');
}
