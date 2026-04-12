import PortfolioIntakesTable from './PortfolioIntakesTable';
import { prisma } from '@/lib/prisma';
import type { PortfolioIntakeDetails } from '@/lib/portfolio-intake';
import InternalOpsNavigation from '@/components/internal-ops/Navigation';

export const dynamic = 'force-dynamic';

type AuditLogRecord = {
  id: string;
  timestamp: Date;
  details: string | null;
};

function parseDetails(value: string | null): Partial<PortfolioIntakeDetails> {
  if (!value) return {};

  try {
    return JSON.parse(value) as Partial<PortfolioIntakeDetails>;
  } catch {
    return {};
  }
}

function formatTimestamp(date: Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...options,
  }).format(date);
}

function normalizeRow(record: AuditLogRecord) {
  const details = parseDetails(record.details);

  return {
    id: record.id,
    referenceNumber: details.referenceNumber || `SB-PF-${record.id.slice(-6).toUpperCase()}`,
    institutionName: details.institutionName || 'Unknown institution',
    contactName: details.contactName || 'Unknown contact',
    email: details.email || '',
    propertyAddresses: Array.isArray(details.propertyAddresses) ? details.propertyAddresses : [],
    turnaround: details.turnaround || 'Unknown',
    notes: details.notes || '',
    status: details.status || 'new',
    confirmationEmailStatus: details.confirmationEmailStatus || 'not_configured',
    timestampLabel: formatTimestamp(record.timestamp),
    fullTimestampLabel: formatTimestamp(record.timestamp, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    }),
  } as const;
}

export default async function PortfolioDashboardPage() {
  const records = await prisma.auditLog.findMany({
    where: {
      resource: 'portfolio_intake',
    },
    orderBy: {
      timestamp: 'desc',
    },
    select: {
      id: true,
      timestamp: true,
      details: true,
    },
  });

  const rows = records.map(normalizeRow);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 text-zinc-600">
      <div className="mx-auto min-h-screen max-w-[1800px]">
        <InternalOpsNavigation />
        <main className="min-h-screen px-6 pb-12 pt-8 md:px-10">
          <PortfolioIntakesTable initialRows={rows} />
        </main>
      </div>
    </div>
  );
}
