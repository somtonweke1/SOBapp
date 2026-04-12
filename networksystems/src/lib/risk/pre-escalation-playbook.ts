import type { RiskFlag } from '@/lib/risk/engine';

export type PreEscalationItem = {
  question: string;
  solution: string;
  requiredEvidence: string;
  owner: string;
};

export function buildPreEscalationPlaybook(flags: RiskFlag[]): PreEscalationItem[] {
  const items: PreEscalationItem[] = [];

  if (flags.some((f) => f.citationKey === 'COMAR_21_05_06_02A')) {
    items.push({
      question: 'Which approvals support emergency terms beyond 365 days?',
      solution: 'Create an approval chain packet with extension memos and signature timeline; downgrade/hold claim if approvals are complete.',
      requiredEvidence: 'Extension approval memo(s), signed authorization dates, board action reference.',
      owner: 'Agency procurement/contracts officer',
    });
  }

  if (flags.some((f) => f.citationKey === 'COMAR_21_05_05')) {
    items.push({
      question: 'What proof shows only one source was reasonably available?',
      solution: 'Run sole-source justification review against market scan and document any alternative vendors found.',
      requiredEvidence: 'Market research memo, vendor outreach log, sole-source determination file.',
      owner: 'Procurement lead + compliance reviewer',
    });
  }

  if (flags.some((f) => f.citationKey === 'COMAR_21_05_07_05A')) {
    items.push({
      question: 'Do clustered small procurements indicate possible split-pattern risk?',
      solution: 'Generate 12-month rollup by resolved vendor entity and classify justified repeats vs threshold-avoidance pattern.',
      requiredEvidence: '12-month PO/award rollup, vendor-entity resolution sheet, threshold policy.',
      owner: 'Spend analytics + procurement operations',
    });
  }

  items.push({
    question: 'How do we prevent recurrence next cycle?',
    solution: 'Assign controls with owner/date, add automated monitoring rule, and schedule post-cycle audit checkpoint.',
    requiredEvidence: 'Control owner list, implementation date, monitoring rule ID, audit schedule.',
    owner: 'Compliance manager',
  });

  return items.slice(0, 5);
}
