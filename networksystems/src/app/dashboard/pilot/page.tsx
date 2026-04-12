import InternalOpsNavigation from '@/components/internal-ops/Navigation';
import PilotDashboardClient from './PilotDashboardClient';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function dateLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export default async function PilotDashboardPage() {
  const [engagements, submissions] = await Promise.all([
    prisma.pilotEngagement.findMany({
      orderBy: { pilot_start_date: 'desc' },
    }),
    prisma.auditLog.findMany({
      where: { resource: 'pilot_submission' },
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        details: true,
        timestamp: true,
      },
    }),
  ]);

  const initialSubmissions = submissions.map((submission) => {
    const details = submission.details ? JSON.parse(submission.details) as Record<string, unknown> : {};

    return {
      id: submission.id,
      referenceNumber:
        typeof details.referenceNumber === 'string'
          ? details.referenceNumber
          : `SB-PL-${submission.id.slice(-6).toUpperCase()}`,
      institutionName: typeof details.institution_name === 'string' ? details.institution_name : 'Unknown institution',
      submitterName: typeof details.submitter_name === 'string' ? details.submitter_name : 'Unknown submitter',
      submitterEmail: typeof details.submitter_email === 'string' ? details.submitter_email : '',
      propertyAddress: typeof details.property_address === 'string' ? details.property_address : 'Unknown address',
      dealType: typeof details.deal_type === 'string' ? details.deal_type : 'Unknown',
      timeline: typeof details.timeline === 'string' ? details.timeline : 'Unknown',
      status: details.status === 'delivered' ? 'delivered' : 'new',
      createdAtLabel: dateLabel(submission.timestamp),
      engagementId: typeof details.pilotEngagementId === 'string' ? details.pilotEngagementId : '',
    } as const;
  });

  const initialEngagements = engagements.map((engagement) => ({
    id: engagement.id,
    institutionName: engagement.institution_name,
    contactName: engagement.contact_name,
    contactEmail: engagement.contact_email,
    pilotStatus: engagement.pilot_status,
    dealTarget: engagement.deal_target,
    dealsSubmitted: engagement.deals_submitted,
    dealsDelivered: engagement.deals_delivered,
    feedbackCollected: engagement.feedback_collected,
    notes: engagement.notes || '',
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 text-zinc-600">
      <div className="mx-auto min-h-screen max-w-[1800px]">
        <InternalOpsNavigation />
        <main className="min-h-screen px-6 pb-12 pt-8 md:px-10">
          <PilotDashboardClient initialEngagements={initialEngagements} initialSubmissions={initialSubmissions} />
        </main>
      </div>
    </div>
  );
}
