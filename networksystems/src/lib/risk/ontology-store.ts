import { prisma } from '@/lib/prisma';
import type { ProcurementRecord } from '@/lib/api/procurement-ingest';
import { resolveProcurementVendors, normalizeVendorName } from '@/lib/risk/vendor-resolution';
import { analyzePortfolioRisk } from '@/lib/risk/engine';

function toMethod(method: string): string {
  const key = method.toUpperCase().replace(/\s+/g, '_');
  if (
    key === 'EMERGENCY' ||
    key === 'SOLE_SOURCE' ||
    key === 'COMPETITIVE' ||
    key === 'EXPEDITED' ||
    key === 'SMALL_PROCUREMENT'
  ) {
    return key;
  }
  return 'UNKNOWN';
}

async function upsertStatutes(): Promise<void> {
  const db = prisma as any;
  const statutes = [
    {
      code: 'COMAR_21_05_06_02A',
      title: 'COMAR 21.05.06.02(A)',
      bodyText: 'Emergency procurement terms are restricted and should not replace normal competition planning.',
      sourceUrl: 'https://regs.maryland.gov/COMAR/TitleSearch.aspx?search=21.05.06',
    },
    {
      code: 'COMAR_21_05_05',
      title: 'COMAR 21.05.05',
      bodyText: 'Sole source procurement is limited to circumstances with one reasonably available source.',
      sourceUrl: 'https://regs.maryland.gov/COMAR/TitleSearch.aspx?search=21.05.05',
    },
    {
      code: 'COMAR_21_05_07_05A',
      title: 'COMAR 21.05.07.05(A)',
      bodyText: 'Procurements may not be artificially divided to bypass requirements.',
      sourceUrl: 'https://regs.maryland.gov/COMAR/TitleSearch.aspx?search=21.05.07',
    },
    {
      code: 'BALT_CHARTER_ART_VI_11',
      title: 'Baltimore City Charter Art. VI, §11',
      bodyText: 'City contracts generally require competitive procedures with limited emergency exceptions.',
      sourceUrl: 'https://codes.baltimorecity.gov/us/md/cities/baltimore/charter/VI/11',
    },
  ];

  for (const statute of statutes) {
    await db.statute.upsert({
      where: { code: statute.code },
      update: statute,
      create: statute,
    });
  }
}

export async function materializeOntologyFromRecords(records: ProcurementRecord[]): Promise<void> {
  const db = prisma as any;

  await upsertStatutes();

  const { records: resolvedRecords } = resolveProcurementVendors(records);
  const externalIds = resolvedRecords.map((record) => record.id);

  // Keep ontology aligned to the latest real ingest. This clears stale synthetic rows.
  await db.procurementAction.deleteMany({
    where: {
      ...(externalIds.length > 0 ? { externalId: { notIn: externalIds } } : {}),
    },
  });
  await db.riskDossier.deleteMany({
    where: {
      snapshotId: { startsWith: 'SB-LIVE-' },
    },
  });

  for (const record of resolvedRecords) {
    const jurisdiction = record.jurisdiction;

    const agency = await db.governmentAgency.upsert({
      where: { name: record.agency },
      update: { jurisdiction },
      create: { name: record.agency, jurisdiction },
    });

    const master = await db.masterEntity.upsert({
      where: { name: record.canonicalVendorName || record.vendor },
      update: {},
      create: { name: record.canonicalVendorName || record.vendor },
    });

    let alias = await db.entityAlias.findFirst({
      where: {
        masterEntityId: master.id,
        normalizedAlias: normalizeVendorName(record.vendor),
      },
    });

    if (!alias) {
      alias = await db.entityAlias.create({
        data: {
          alias: record.vendor,
          normalizedAlias: normalizeVendorName(record.vendor),
          masterEntityId: master.id,
        },
      });
    }

    const existingAction = await db.procurementAction.findUnique({ where: { externalId: record.id } });
    const data = {
      externalId: record.id,
      agencyId: agency.id,
      aliasId: alias.id,
      amount: record.amount,
      method: toMethod(record.method),
      category: record.category || null,
      startDate: record.startDate ? new Date(record.startDate) : null,
      endDate: record.currentEndDate ? new Date(record.currentEndDate) : null,
      waiverGranted: !!record.waiverGranted,
      sourceUrl: record.sourceUrl,
      boardActionDate: record.boardActionDate ? new Date(record.boardActionDate) : null,
      vendorAddress: record.vendorAddress || null,
      vendorPhone: record.vendorPhone || null,
    };

    if (!existingAction) {
      await db.procurementAction.create({ data });
    } else {
      await db.procurementAction.update({ where: { id: existingAction.id }, data });
    }
  }

  const flags = analyzePortfolioRisk(records);
  for (const flag of flags) {
    const entity = await db.masterEntity.findFirst({ where: { name: flag.vendor } });
    const statute = await db.statute.findUnique({ where: { code: flag.citationKey } });
    const stableSeed = flag.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24).toUpperCase();
    const snapshotId = `SB-LIVE-${stableSeed}`;

    await db.riskDossier.upsert({
      where: { snapshotId },
      update: {
        agencyName: flag.agency,
        basis: flag.basis,
        indicator: flag.indicator,
        exposure: flag.exposure,
        confidence: flag.confidence,
        defensibilityScore: flag.challengeScore || 0,
        sourceUrl: flag.sourceUrl,
        masterEntityId: entity?.id || null,
        statuteId: statute?.id || null,
        generatedAt: new Date(),
      },
      create: {
        snapshotId,
        agencyName: flag.agency,
        basis: flag.basis,
        indicator: flag.indicator,
        exposure: flag.exposure,
        confidence: flag.confidence,
        defensibilityScore: flag.challengeScore || 0,
        sourceUrl: flag.sourceUrl,
        masterEntityId: entity?.id || null,
        statuteId: statute?.id || null,
      },
    });
  }
}

// Backward-compatible alias while callers are migrated.
export const materializeOntologyFromAirlocked = materializeOntologyFromRecords;

export async function readProcurementFromOntology(): Promise<ProcurementRecord[]> {
  const db = prisma as any;
  const actions = await db.procurementAction.findMany({
    include: {
      agency: true,
      alias: {
        include: {
          masterEntity: true,
        },
      },
    },
    orderBy: { boardActionDate: 'desc' },
  });

  return actions.map((action: any) => ({
    id: action.externalId || action.id,
    agency: action.agency.name,
    vendor: action.alias.alias,
    amount: action.amount,
    method: action.method
      .split('_')
      .map((chunk: string) => chunk[0] + chunk.slice(1).toLowerCase())
      .join(' ') as ProcurementRecord['method'],
    category: action.category || undefined,
    startDate: action.startDate ? new Date(action.startDate).toISOString().slice(0, 10) : '1970-01-01',
    currentEndDate: action.endDate ? new Date(action.endDate).toISOString().slice(0, 10) : '1970-01-01',
    jurisdiction: action.agency.jurisdiction,
    sourceUrl: action.sourceUrl,
    boardActionDate: action.boardActionDate ? new Date(action.boardActionDate).toISOString().slice(0, 10) : undefined,
    vendorAddress: action.vendorAddress || undefined,
    vendorPhone: action.vendorPhone || undefined,
    waiverGranted: !!action.waiverGranted,
    vendorEntityId: action.alias.masterEntityId,
    canonicalVendorName: action.alias.masterEntity?.name || action.alias.alias,
  }));
}
