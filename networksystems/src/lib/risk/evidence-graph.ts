import type { ProcurementRecord } from '@/lib/api/procurement-ingest';
import type { RiskFlag } from '@/lib/risk/engine';

export type EvidenceNodeType = 'AGENCY' | 'VENDOR' | 'CONTRACT' | 'FLAG' | 'STATUTE' | 'SOURCE';

export type EvidenceNode = {
  id: string;
  type: EvidenceNodeType;
  label: string;
  meta?: Record<string, string | number>;
};

export type EvidenceEdge = {
  from: string;
  to: string;
  relation: string;
};

export type EvidenceGraph = {
  nodes: EvidenceNode[];
  edges: EvidenceEdge[];
  summary: {
    nodeCount: number;
    edgeCount: number;
    highRiskFlags: number;
    strictLawFlags: number;
  };
};

function upsertNode(map: Map<string, EvidenceNode>, node: EvidenceNode): void {
  if (!map.has(node.id)) map.set(node.id, node);
}

function pushEdge(edges: EvidenceEdge[], from: string, to: string, relation: string): void {
  edges.push({ from, to, relation });
}

export function buildEvidenceGraph(records: ProcurementRecord[], flags: RiskFlag[]): EvidenceGraph {
  const nodes = new Map<string, EvidenceNode>();
  const edges: EvidenceEdge[] = [];

  for (const record of records) {
    const contractId = `CONTRACT:${record.id}`;
    const agencyId = `AGENCY:${record.agency}`;
    const vendorEntity = record.vendorEntityId || `VENDOR:${record.vendor}`;
    const vendorId = vendorEntity.startsWith('VENDOR:') ? vendorEntity : `VENDOR:${vendorEntity}`;
    const sourceId = `SOURCE:${record.id}`;

    upsertNode(nodes, { id: contractId, type: 'CONTRACT', label: record.id, meta: { amount: record.amount, method: record.method } });
    upsertNode(nodes, { id: agencyId, type: 'AGENCY', label: record.agency });
    upsertNode(nodes, { id: vendorId, type: 'VENDOR', label: record.canonicalVendorName || record.vendor });
    upsertNode(nodes, { id: sourceId, type: 'SOURCE', label: record.sourceUrl });

    pushEdge(edges, agencyId, contractId, 'AUTHORIZES');
    pushEdge(edges, vendorId, contractId, 'AWARDED_TO');
    pushEdge(edges, contractId, sourceId, 'EVIDENCED_BY');
  }

  for (const flag of flags) {
    const flagId = `FLAG:${flag.id}`;
    const statuteId = `STATUTE:${flag.citationKey}`;
    const contractId = flag.recordId ? `CONTRACT:${flag.recordId}` : undefined;

    upsertNode(nodes, {
      id: flagId,
      type: 'FLAG',
      label: flag.indicator,
      meta: {
        severity: flag.severity,
        basis: flag.basis,
        exposure: flag.exposure,
      },
    });

    upsertNode(nodes, {
      id: statuteId,
      type: 'STATUTE',
      label: flag.citation,
    });

    if (contractId) pushEdge(edges, contractId, flagId, 'TRIGGERS');
    pushEdge(edges, flagId, statuteId, 'TESTED_AGAINST');
  }

  const allFlags = flags.length;
  const highRiskFlags = flags.filter((flag) => flag.severity === 'HIGH').length;
  const strictLawFlags = flags.filter((flag) => flag.basis === 'STRICT_LAW').length;

  return {
    nodes: [...nodes.values()],
    edges,
    summary: {
      nodeCount: nodes.size,
      edgeCount: edges.length,
      highRiskFlags,
      strictLawFlags,
    },
  };
}
