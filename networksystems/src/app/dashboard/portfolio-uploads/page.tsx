import InternalOpsNavigation from '@/components/internal-ops/Navigation';
import PortfolioUploadsTable from './PortfolioUploadsTable';
import { prisma } from '@/lib/prisma';
import { contextFromEnum, statusFromEnum } from '@/lib/portfolio-upload';

export const dynamic = 'force-dynamic';

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

export default async function PortfolioUploadsDashboardPage() {
  const uploads = await prisma.portfolioUpload.findMany({
    orderBy: {
      submitted_at: 'desc',
    },
  });

  const rows = uploads.map((upload) => ({
    id: upload.id,
    referenceNumber: upload.reference_number,
    institutionName: upload.institution_name,
    contactName: upload.contact_name,
    contactEmail: upload.contact_email,
    addresses: upload.addresses,
    addressCount: upload.address_count,
    dealContext: contextFromEnum(upload.deal_context),
    status: statusFromEnum(upload.status),
    submittedLabel: formatTimestamp(upload.submitted_at),
    fullSubmittedLabel: formatTimestamp(upload.submitted_at, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    }),
    reportUrl: `/portfolio-report/${upload.reference_number}`,
    hasReport: Boolean(upload.results_json),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 text-zinc-600">
      <div className="mx-auto min-h-screen max-w-[1800px]">
        <InternalOpsNavigation />
        <main className="min-h-screen px-6 pb-12 pt-8 md:px-10">
          <PortfolioUploadsTable initialRows={rows} />
        </main>
      </div>
    </div>
  );
}
