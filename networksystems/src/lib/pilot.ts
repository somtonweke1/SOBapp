import { z } from 'zod';

export const pilotDealTypes = ['Acquisition', 'Refinance', 'Rehab', 'Portfolio Review'] as const;
export const pilotTimelines = ['Under contract', 'Active diligence', 'Early review'] as const;

export const pilotTokenSchema = z.object({
  institution_name: z.string().trim().min(2).max(160),
  contact_email: z.string().trim().email(),
});

export const pilotSubmissionSchema = z.object({
  token: z.string().trim().min(4).max(32).optional().or(z.literal('')),
  institution_name: z.string().trim().min(2).max(160),
  submitter_name: z.string().trim().min(2).max(120),
  submitter_email: z.string().trim().email(),
  property_address: z.string().trim().min(5).max(200),
  deal_type: z.enum(pilotDealTypes),
  timeline: z.enum(pilotTimelines),
  determination_goal: z.string().trim().min(10).max(2000),
  output_use: z.string().trim().min(10).max(2000),
});

export type PilotTokenPayload = z.infer<typeof pilotTokenSchema>;
export type PilotSubmissionPayload = z.infer<typeof pilotSubmissionSchema>;

export type PilotSubmissionDetails = PilotSubmissionPayload & {
  type: 'pilot_submission';
  referenceNumber: string;
  createdAt: string;
  status: 'new' | 'delivered';
  expectedDelivery: string;
  confirmationEmailStatus: 'sent' | 'not_configured';
  pilotEngagementId: string;
  dealRecordId: string;
};

export function buildPilotReferenceNumber(input: { createdAt: Date; id: string }) {
  const date = input.createdAt.toISOString().slice(0, 10).replace(/-/g, '');
  return `SB-PL-${date}-${input.id.slice(-6).toUpperCase()}`;
}

export function createPilotToken() {
  const raw = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  return raw.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
}
